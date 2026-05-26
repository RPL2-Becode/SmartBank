/**
 * Gateway controller — minimum viable payment gateway foundation (P0).
 *
 * Endpoints (mounted under /smartbank/gateway):
 *   POST  /payment-requests
 *   GET   /payment-requests
 *   GET   /payment-requests/:requestId
 *   POST  /payment-requests/:requestId/process
 *
 * Status lifecycle:
 *   PENDING -> VALIDATING -> PROCESSING -> SUCCESS
 *                                       \-> FAILED
 *                                       \-> REJECTED
 *   PENDING -> EXPIRED                  (handled by future scheduler)
 *
 * Idempotency:
 *   If `idempotencyKey` is provided on create, a duplicate create call
 *   returns the existing request (HTTP 200) without inserting a second
 *   row. A duplicate process call on a SUCCESS/FAILED/REJECTED request
 *   also short-circuits and never debits the payer twice.
 */

const db = require('../config/db');

// ---------- helpers ------------------------------------------------------

const TERMINAL_STATUSES = new Set(['SUCCESS', 'FAILED', 'REJECTED', 'EXPIRED']);

const generateRequestId = () =>
    'PR-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);

const generateTxId = () =>
    'TX-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);

const isFiniteNumber = (value) =>
    typeof value === 'number' && Number.isFinite(value);

/**
 * Best-effort gateway log writer. Failures are swallowed so that audit
 * logging never breaks the actual flow.
 */
async function logGatewayCall(connOrPool, entry) {
    try {
        await connOrPool.query(
            `INSERT INTO gateway_logs
                (requestId, sourceApp, method, endpoint, requestBody, responseBody, statusCode, latencyMs)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                entry.requestId || null,
                entry.sourceApp || null,
                entry.method,
                entry.endpoint,
                entry.requestBody ? JSON.stringify(entry.requestBody) : null,
                entry.responseBody ? JSON.stringify(entry.responseBody) : null,
                Number.isInteger(entry.statusCode) ? entry.statusCode : null,
                Number.isInteger(entry.latencyMs) ? entry.latencyMs : null,
            ],
        );
    } catch (err) {
        // Audit failure should never break the response — surface only
        // in server logs.
        // eslint-disable-next-line no-console
        console.error('[gateway_logs] write failed:', err.message);
    }
}

function publicRow(row) {
    if (!row) return null;
    let metadata = row.metadata;
    if (typeof metadata === 'string') {
        try {
            metadata = JSON.parse(metadata);
        } catch {
            // leave as-is
        }
    }
    return {
        id: row.id,
        requestId: row.requestId,
        sourceApp: row.sourceApp,
        fromUserId: row.fromUserId,
        toUserId: row.toUserId,
        amount: Number(row.amount),
        type: row.type,
        status: row.status,
        failureReason: row.failureReason,
        idempotencyKey: row.idempotencyKey,
        metadata: metadata || null,
        createdAt: row.created_at,
        processedAt: row.processed_at,
    };
}

// ---------- POST /payment-requests --------------------------------------

exports.createPaymentRequest = async (req, res) => {
    const startedAt = Date.now();
    // The validation middleware places the parsed payload on req.validatedData
    const body = req.validatedData || req.body || {};
    const {
        fromUserId,
        toUserId = null,
        amount,
        type,
        sourceApp,
        idempotencyKey = null,
        metadata = null,
    } = body;

    try {
        // Idempotency short-circuit — if the same key was already used,
        // return the existing request rather than creating a new one.
        if (idempotencyKey) {
            const [existing] = await db.query(
                'SELECT * FROM payment_requests WHERE idempotencyKey = ? LIMIT 1',
                [idempotencyKey],
            );
            if (existing.length > 0) {
                const responseBody = {
                    status: 'success',
                    message: 'Idempotent replay — existing request returned',
                    data: publicRow(existing[0]),
                };
                await logGatewayCall(db, {
                    requestId: existing[0].requestId,
                    sourceApp,
                    method: 'POST',
                    endpoint: '/smartbank/gateway/payment-requests',
                    requestBody: body,
                    responseBody,
                    statusCode: 200,
                    latencyMs: Date.now() - startedAt,
                });
                return res.status(200).json(responseBody);
            }
        }

        const requestId = generateRequestId();
        await db.query(
            `INSERT INTO payment_requests
                (requestId, sourceApp, fromUserId, toUserId, amount, type, status, idempotencyKey, metadata)
             VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
            [
                requestId,
                sourceApp,
                fromUserId,
                toUserId,
                amount,
                type,
                idempotencyKey,
                metadata ? JSON.stringify(metadata) : null,
            ],
        );

        const [rows] = await db.query(
            'SELECT * FROM payment_requests WHERE requestId = ?',
            [requestId],
        );
        const responseBody = {
            status: 'success',
            message: 'Payment request created',
            data: publicRow(rows[0]),
        };

        await logGatewayCall(db, {
            requestId,
            sourceApp,
            method: 'POST',
            endpoint: '/smartbank/gateway/payment-requests',
            requestBody: body,
            responseBody,
            statusCode: 201,
            latencyMs: Date.now() - startedAt,
        });

        return res.status(201).json(responseBody);
    } catch (err) {
        // Race: if two concurrent calls used the same idempotencyKey, the
        // unique index will trip on the loser. Read the existing row and
        // return it instead of a 500.
        if (err && err.code === 'ER_DUP_ENTRY' && idempotencyKey) {
            const [existing] = await db.query(
                'SELECT * FROM payment_requests WHERE idempotencyKey = ? LIMIT 1',
                [idempotencyKey],
            );
            if (existing.length > 0) {
                return res.status(200).json({
                    status: 'success',
                    message: 'Idempotent replay — existing request returned',
                    data: publicRow(existing[0]),
                });
            }
        }
        return res.status(500).json({
            status: 'error',
            message: 'Failed to create payment request',
            error: err.message,
        });
    }
};

// ---------- GET /payment-requests ---------------------------------------

exports.listPaymentRequests = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
        const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : null;

        let sql = 'SELECT * FROM payment_requests';
        const params = [];
        if (status) {
            sql += ' WHERE status = ?';
            params.push(status);
        }
        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await db.query(sql, params);
        return res.status(200).json({
            status: 'success',
            data: rows.map(publicRow),
            pagination: { limit, offset, returned: rows.length },
        });
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            message: 'Failed to list payment requests',
            error: err.message,
        });
    }
};

// ---------- GET /payment-requests/:requestId ----------------------------

exports.getPaymentRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const [rows] = await db.query(
            'SELECT * FROM payment_requests WHERE requestId = ? LIMIT 1',
            [requestId],
        );
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Payment request not found' });
        }
        return res.status(200).json({ status: 'success', data: publicRow(rows[0]) });
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch payment request',
            error: err.message,
        });
    }
};

// ---------- POST /payment-requests/:requestId/process -------------------
//
// Validates the request, debits the payer, credits the receiver (when a
// receiver exists), records a transactions row, and updates the
// payment_requests row to SUCCESS / FAILED / REJECTED accordingly.
// Idempotency: if the request is already terminal, return its current
// state without mutating anything.

exports.processPaymentRequest = async (req, res) => {
    const startedAt = Date.now();
    const { requestId } = req.params;
    const connection = await db.getConnection();
    let logSourceApp = null;

    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            'SELECT * FROM payment_requests WHERE requestId = ? FOR UPDATE',
            [requestId],
        );

        if (rows.length === 0) {
            await connection.rollback();
            const body = { status: 'error', message: 'Payment request not found' };
            await logGatewayCall(db, {
                requestId,
                method: 'POST',
                endpoint: `/smartbank/gateway/payment-requests/${requestId}/process`,
                requestBody: req.body || null,
                responseBody: body,
                statusCode: 404,
                latencyMs: Date.now() - startedAt,
            });
            return res.status(404).json(body);
        }

        const request = rows[0];
        logSourceApp = request.sourceApp;

        // Idempotency on process: never mutate balance for a terminal request.
        if (TERMINAL_STATUSES.has(request.status)) {
            await connection.commit();
            return res.status(200).json({
                status: 'success',
                message: `Payment request already ${request.status}`,
                data: publicRow(request),
            });
        }

        // Mark the row as VALIDATING/PROCESSING for visibility. We bundle
        // both into PROCESSING here for simplicity.
        await connection.query(
            'UPDATE payment_requests SET status = ? WHERE id = ?',
            ['PROCESSING', request.id],
        );

        const amount = Number(request.amount);
        if (!isFiniteNumber(amount) || amount <= 0) {
            await connection.query(
                'UPDATE payment_requests SET status = ?, failureReason = ?, processed_at = NOW() WHERE id = ?',
                ['REJECTED', 'Invalid amount', request.id],
            );
            await connection.commit();
            return res.status(400).json({
                status: 'error',
                message: 'Invalid amount',
                data: publicRow({ ...request, status: 'REJECTED', failureReason: 'Invalid amount' }),
            });
        }

        // Lock payer first
        const [payers] = await connection.query(
            'SELECT userId, balance FROM users WHERE userId = ? FOR UPDATE',
            [request.fromUserId],
        );
        if (payers.length === 0) {
            await connection.query(
                'UPDATE payment_requests SET status = ?, failureReason = ?, processed_at = NOW() WHERE id = ?',
                ['REJECTED', 'Payer not found', request.id],
            );
            await connection.commit();
            return res.status(404).json({
                status: 'error',
                message: 'Payer not found',
                data: publicRow({ ...request, status: 'REJECTED', failureReason: 'Payer not found' }),
            });
        }
        const payer = payers[0];

        // Lock receiver when set
        let receiver = null;
        if (request.toUserId) {
            const [receivers] = await connection.query(
                'SELECT userId, balance FROM users WHERE userId = ? FOR UPDATE',
                [request.toUserId],
            );
            if (receivers.length === 0) {
                await connection.query(
                    'UPDATE payment_requests SET status = ?, failureReason = ?, processed_at = NOW() WHERE id = ?',
                    ['REJECTED', 'Receiver not found', request.id],
                );
                await connection.commit();
                return res.status(404).json({
                    status: 'error',
                    message: 'Receiver not found',
                    data: publicRow({ ...request, status: 'REJECTED', failureReason: 'Receiver not found' }),
                });
            }
            receiver = receivers[0];
        }

        if (Number(payer.balance) < amount) {
            await connection.query(
                'UPDATE payment_requests SET status = ?, failureReason = ?, processed_at = NOW() WHERE id = ?',
                ['FAILED', 'Insufficient balance', request.id],
            );
            await connection.commit();
            return res.status(400).json({
                status: 'error',
                message: 'Insufficient balance',
                data: publicRow({ ...request, status: 'FAILED', failureReason: 'Insufficient balance' }),
            });
        }

        // Mutate balances
        await connection.query(
            'UPDATE users SET balance = balance - ? WHERE userId = ?',
            [amount, request.fromUserId],
        );
        if (receiver) {
            await connection.query(
                'UPDATE users SET balance = balance + ? WHERE userId = ?',
                [amount, request.toUserId],
            );
        }

        // Record on the canonical transactions ledger so the existing
        // ledger UI keeps a single source of truth.
        const txId = generateTxId();
        await connection.query(
            `INSERT INTO transactions
                (refId, type, fromUserId, toUserId, baseAmount, tax, fee, description)
             VALUES (?, ?, ?, ?, ?, 0, 0, ?)`,
            [
                txId,
                request.type || 'PAYMENT',
                request.fromUserId,
                request.toUserId || null,
                amount,
                `Gateway request ${request.requestId}`,
            ],
        );

        await connection.query(
            'UPDATE payment_requests SET status = ?, failureReason = NULL, processed_at = NOW() WHERE id = ?',
            ['SUCCESS', request.id],
        );

        await connection.commit();

        const [refreshed] = await db.query(
            'SELECT * FROM payment_requests WHERE id = ?',
            [request.id],
        );
        const responseBody = {
            status: 'success',
            message: 'Payment request processed',
            data: publicRow(refreshed[0]),
        };

        await logGatewayCall(db, {
            requestId,
            sourceApp: logSourceApp,
            method: 'POST',
            endpoint: `/smartbank/gateway/payment-requests/${requestId}/process`,
            requestBody: req.body || null,
            responseBody,
            statusCode: 200,
            latencyMs: Date.now() - startedAt,
        });

        return res.status(200).json(responseBody);
    } catch (err) {
        await connection.rollback();
        try {
            await db.query(
                'UPDATE payment_requests SET status = ?, failureReason = ?, processed_at = NOW() WHERE requestId = ? AND status NOT IN (?, ?, ?, ?)',
                ['FAILED', err.message.slice(0, 200), requestId, 'SUCCESS', 'FAILED', 'REJECTED', 'EXPIRED'],
            );
        } catch (_) { /* best-effort */ }
        return res.status(500).json({
            status: 'error',
            message: 'Failed to process payment request',
            error: err.message,
        });
    } finally {
        connection.release();
    }
};
