const db = require('../config/db');
const { validateMoneyAmount } = require('../middlewares/validationMiddleware');

const PAYMENT_STATUSES = ['PENDING', 'VALIDATING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REJECTED', 'EXPIRED'];

const generateTxId = () => `GW-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

function serializeJson(value) {
    return JSON.stringify(value ?? {});
}

function parseJson(value) {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch {
        return {};
    }
}

function normalizeRequest(row) {
    if (!row) return null;
    return {
        ...row,
        amount: Number(row.amount),
        metadata: parseJson(row.metadata)
    };
}

async function writeGatewayLog({ requestId, sourceApp, method, endpoint, requestBody, responseBody, statusCode, latencyMs }) {
    await db.query(
        `INSERT INTO gateway_logs
            (requestId, sourceApp, method, endpoint, requestBody, responseBody, statusCode, latencyMs)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            requestId || null,
            sourceApp || null,
            method,
            endpoint,
            serializeJson(requestBody),
            serializeJson(responseBody),
            statusCode,
            latencyMs
        ]
    );
}

async function respondWithLog(req, res, statusCode, body, logContext = {}) {
    const latencyMs = Date.now() - (req.gatewayStartedAt || Date.now());
    try {
        await writeGatewayLog({
            requestId: logContext.requestId || req.params.requestId || req.body.requestId,
            sourceApp: logContext.sourceApp || req.body.sourceApp,
            method: req.method,
            endpoint: req.originalUrl,
            requestBody: req.body,
            responseBody: body,
            statusCode,
            latencyMs
        });
    } catch (error) {
        console.error('Gagal menulis gateway log:', error.message);
    }

    return res.status(statusCode).json(body);
}

exports.createPaymentRequest = async (req, res) => {
    req.gatewayStartedAt = Date.now();
    const data = req.validatedData || req.body;

    try {
        if (data.idempotencyKey) {
            const [existingByIdempotency] = await db.query(
                'SELECT * FROM payment_requests WHERE idempotencyKey = ? LIMIT 1',
                [data.idempotencyKey]
            );

            if (existingByIdempotency.length > 0) {
                const existing = normalizeRequest(existingByIdempotency[0]);
                return respondWithLog(
                    req,
                    res,
                    200,
                    { status: 'success', message: 'Idempotency key sudah pernah dipakai', data: existing },
                    existing
                );
            }
        }

        const [existingByRequestId] = await db.query('SELECT * FROM payment_requests WHERE requestId = ? LIMIT 1', [data.requestId]);
        if (existingByRequestId.length > 0) {
            const existing = normalizeRequest(existingByRequestId[0]);
            return respondWithLog(req, res, 200, { status: 'success', message: 'Request sudah ada', data: existing }, existing);
        }

        await db.query(
            `INSERT INTO payment_requests
                (requestId, sourceApp, fromUserId, toUserId, amount, type, status, idempotencyKey, metadata)
             VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
            [
                data.requestId,
                data.sourceApp,
                data.fromUserId,
                data.toUserId,
                data.amount,
                data.type,
                data.idempotencyKey,
                serializeJson(data.metadata)
            ]
        );

        const [rows] = await db.query('SELECT * FROM payment_requests WHERE requestId = ? LIMIT 1', [data.requestId]);
        const created = normalizeRequest(rows[0]);
        return respondWithLog(req, res, 201, { status: 'success', data: created }, created);
    } catch (error) {
        const statusCode = error.code === 'ER_DUP_ENTRY' ? 409 : 500;
        return respondWithLog(req, res, statusCode, { status: 'error', message: error.message }, data);
    }
};

exports.listPaymentRequests = async (req, res) => {
    req.gatewayStartedAt = Date.now();
    try {
        const [rows] = await db.query('SELECT * FROM payment_requests ORDER BY created_at DESC LIMIT 100');
        return respondWithLog(req, res, 200, { status: 'success', data: rows.map(normalizeRequest) });
    } catch (error) {
        return respondWithLog(req, res, 500, { status: 'error', message: error.message });
    }
};

exports.getPaymentRequest = async (req, res) => {
    req.gatewayStartedAt = Date.now();
    try {
        const [rows] = await db.query('SELECT * FROM payment_requests WHERE requestId = ? LIMIT 1', [req.params.requestId]);
        if (rows.length === 0) {
            return respondWithLog(req, res, 404, { status: 'error', message: 'Payment request tidak ditemukan' });
        }
        const paymentRequest = normalizeRequest(rows[0]);
        return respondWithLog(req, res, 200, { status: 'success', data: paymentRequest }, paymentRequest);
    } catch (error) {
        return respondWithLog(req, res, 500, { status: 'error', message: error.message });
    }
};

exports.processPaymentRequest = async (req, res) => {
    req.gatewayStartedAt = Date.now();
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [requests] = await connection.query('SELECT * FROM payment_requests WHERE requestId = ? FOR UPDATE', [req.params.requestId]);
        if (requests.length === 0) {
            await connection.rollback();
            return respondWithLog(req, res, 404, { status: 'error', message: 'Payment request tidak ditemukan' });
        }

        const paymentRequest = normalizeRequest(requests[0]);
        if (paymentRequest.status === 'SUCCESS') {
            await connection.rollback();
            return respondWithLog(req, res, 200, { status: 'success', message: 'Payment request sudah berhasil', data: paymentRequest }, paymentRequest);
        }

        if (!['PENDING', 'VALIDATING'].includes(paymentRequest.status)) {
            await connection.rollback();
            return respondWithLog(
                req,
                res,
                200,
                { status: 'success', message: 'Payment request tidak diproses ulang', data: paymentRequest },
                paymentRequest
            );
        }

        await connection.query("UPDATE payment_requests SET status = 'VALIDATING' WHERE requestId = ?", [paymentRequest.requestId]);

        const amountError = validateMoneyAmount(paymentRequest.amount);
        if (amountError) {
            await connection.query("UPDATE payment_requests SET status = 'REJECTED', failureReason = ?, processed_at = CURRENT_TIMESTAMP WHERE requestId = ?", [
                amountError,
                paymentRequest.requestId
            ]);
            await connection.commit();
            return respondWithLog(req, res, 400, { status: 'error', message: amountError, data: { ...paymentRequest, status: 'REJECTED' } }, paymentRequest);
        }

        await connection.query("UPDATE payment_requests SET status = 'PROCESSING' WHERE requestId = ?", [paymentRequest.requestId]);

        const [senders] = await connection.query('SELECT balance FROM users WHERE userId = ? FOR UPDATE', [paymentRequest.fromUserId]);
        const [receivers] = await connection.query('SELECT balance FROM users WHERE userId = ? FOR UPDATE', [paymentRequest.toUserId]);

        if (senders.length === 0 || receivers.length === 0) {
            const failureReason = 'User pengirim atau penerima tidak ditemukan';
            await connection.query("UPDATE payment_requests SET status = 'FAILED', failureReason = ?, processed_at = CURRENT_TIMESTAMP WHERE requestId = ?", [
                failureReason,
                paymentRequest.requestId
            ]);
            await connection.commit();
            return respondWithLog(req, res, 404, { status: 'error', message: failureReason, data: { ...paymentRequest, status: 'FAILED', failureReason } }, paymentRequest);
        }

        if (Number(senders[0].balance) < paymentRequest.amount) {
            const failureReason = 'Saldo tidak mencukupi';
            await connection.query("UPDATE payment_requests SET status = 'FAILED', failureReason = ?, processed_at = CURRENT_TIMESTAMP WHERE requestId = ?", [
                failureReason,
                paymentRequest.requestId
            ]);
            await connection.commit();
            return respondWithLog(req, res, 400, { status: 'error', message: failureReason, data: { ...paymentRequest, status: 'FAILED', failureReason } }, paymentRequest);
        }

        await connection.query('UPDATE users SET balance = balance - ? WHERE userId = ?', [paymentRequest.amount, paymentRequest.fromUserId]);
        await connection.query('UPDATE users SET balance = balance + ? WHERE userId = ?', [paymentRequest.amount, paymentRequest.toUserId]);

        const txId = generateTxId();
        await connection.query(
            'INSERT INTO transactions (refId, type, fromUserId, toUserId, baseAmount, tax, fee, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                txId,
                paymentRequest.type || 'GATEWAY_PAYMENT',
                paymentRequest.fromUserId,
                paymentRequest.toUserId,
                paymentRequest.amount,
                0,
                0,
                `Gateway payment request ${paymentRequest.requestId}`
            ]
        );

        await connection.query("UPDATE payment_requests SET status = 'SUCCESS', failureReason = NULL, processed_at = CURRENT_TIMESTAMP WHERE requestId = ?", [
            paymentRequest.requestId
        ]);

        await connection.commit();

        const processed = { ...paymentRequest, status: 'SUCCESS', processedRefId: txId };
        return respondWithLog(req, res, 200, { status: 'success', message: 'Payment request berhasil diproses', data: processed }, processed);
    } catch (error) {
        await connection.rollback();
        return respondWithLog(req, res, 500, { status: 'error', message: error.message });
    } finally {
        connection.release();
    }
};

exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
