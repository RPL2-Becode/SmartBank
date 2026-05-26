const db = require('../config/db');

const generateOrderId = () => 'GW-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);

/**
 * Simulated Payment Gateway Controller
 * 
 * Mensimulasikan alur payment gateway eksternal:
 * 1. User membuat payment intent (status PENDING)
 * 2. Gateway memproses (simulasi callback approve/reject)
 * 3. Jika approved, saldo user di-credit (topup) atau di-debit (withdrawal/external)
 * 4. Semua aktivitas tercatat di gateway_payments untuk audit
 */

// 1. Create Payment Intent
exports.createPayment = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { amount, type, sourceApp } = req.validatedData;

        // Verify user exists
        const [users] = await db.query('SELECT userId, balance FROM users WHERE userId = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
        }

        // For WITHDRAWAL and EXTERNAL_PAYMENT, check balance
        if (type === 'WITHDRAWAL' || type === 'EXTERNAL_PAYMENT') {
            if (parseFloat(users[0].balance) < amount) {
                return res.status(400).json({ status: 'error', message: 'Saldo tidak mencukupi untuk transaksi ini' });
            }
        }

        const orderId = generateOrderId();

        await db.query(
            `INSERT INTO gateway_payments (orderId, userId, amount, type, status, sourceApp) VALUES (?, ?, ?, ?, 'PENDING', ?)`,
            [orderId, userId, amount, type, sourceApp || null]
        );

        res.status(201).json({
            status: 'success',
            message: 'Payment intent berhasil dibuat',
            data: {
                orderId,
                amount,
                type,
                status: 'PENDING',
                expiresIn: '15 menit',
                callbackUrl: '/smartbank/gateway/callback',
                instructions: type === 'TOPUP'
                    ? 'Simulasi: Panggil POST /gateway/callback dengan action "approve" untuk menyelesaikan top-up.'
                    : 'Simulasi: Panggil POST /gateway/callback dengan action "approve" untuk memproses transaksi.'
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// 2. Process Gateway Callback (Simulasi webhook dari payment provider)
exports.processCallback = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { orderId, action, signature } = req.validatedData;

        await connection.beginTransaction();

        // Find the payment intent
        const [payments] = await connection.query(
            'SELECT * FROM gateway_payments WHERE orderId = ? FOR UPDATE',
            [orderId]
        );

        if (payments.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'error', message: 'Payment intent tidak ditemukan' });
        }

        const payment = payments[0];

        if (payment.status !== 'PENDING') {
            await connection.rollback();
            return res.status(400).json({
                status: 'error',
                message: `Payment sudah diproses sebelumnya (status: ${payment.status})`
            });
        }

        // Simulasi signature verification (dalam production, ini akan verify HMAC dari provider)
        const expectedSignature = `SB-SIG-${orderId}`;
        if (signature && signature !== expectedSignature) {
            await connection.rollback();
            return res.status(401).json({ status: 'error', message: 'Signature tidak valid' });
        }

        const callbackPayload = JSON.stringify({ orderId, action, timestamp: new Date().toISOString() });

        if (action === 'approve') {
            // Update payment status
            await connection.query(
                `UPDATE gateway_payments SET status = 'SETTLED', callbackPayload = ?, settled_at = NOW() WHERE orderId = ?`,
                [callbackPayload, orderId]
            );

            const amount = parseFloat(payment.amount);
            const userId = payment.userId;

            if (payment.type === 'TOPUP') {
                // Credit user balance
                await connection.query('UPDATE users SET balance = balance + ? WHERE userId = ?', [amount, userId]);

                // Record transaction
                const txId = 'TX-GW-' + Date.now();
                await connection.query(
                    'INSERT INTO transactions (refId, type, fromUserId, toUserId, baseAmount, tax, fee, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [txId, 'GATEWAY_TOPUP', null, userId, amount, 0, 0, `Top-up via gateway (${orderId})`]
                );
            } else if (payment.type === 'WITHDRAWAL') {
                // Debit user balance
                const [users] = await connection.query('SELECT balance FROM users WHERE userId = ? FOR UPDATE', [userId]);
                if (users.length === 0 || parseFloat(users[0].balance) < amount) {
                    await connection.query(`UPDATE gateway_payments SET status = 'FAILED', callbackPayload = ? WHERE orderId = ?`, [callbackPayload, orderId]);
                    await connection.commit();
                    return res.status(400).json({ status: 'error', message: 'Saldo tidak mencukupi saat settlement' });
                }

                await connection.query('UPDATE users SET balance = balance - ? WHERE userId = ?', [amount, userId]);

                const txId = 'TX-GW-' + Date.now();
                await connection.query(
                    'INSERT INTO transactions (refId, type, fromUserId, toUserId, baseAmount, tax, fee, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [txId, 'GATEWAY_WITHDRAWAL', userId, null, amount, 0, 0, `Withdrawal via gateway (${orderId})`]
                );
            } else if (payment.type === 'EXTERNAL_PAYMENT') {
                // Debit user balance (payment to external merchant)
                const [users] = await connection.query('SELECT balance FROM users WHERE userId = ? FOR UPDATE', [userId]);
                if (users.length === 0 || parseFloat(users[0].balance) < amount) {
                    await connection.query(`UPDATE gateway_payments SET status = 'FAILED', callbackPayload = ? WHERE orderId = ?`, [callbackPayload, orderId]);
                    await connection.commit();
                    return res.status(400).json({ status: 'error', message: 'Saldo tidak mencukupi saat settlement' });
                }

                await connection.query('UPDATE users SET balance = balance - ? WHERE userId = ?', [amount, userId]);

                const txId = 'TX-GW-' + Date.now();
                await connection.query(
                    'INSERT INTO transactions (refId, type, fromUserId, toUserId, baseAmount, tax, fee, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [txId, 'GATEWAY_EXTERNAL', userId, null, amount, 0, 0, `External payment via gateway (${orderId}) - ${payment.sourceApp || 'unknown'}`]
                );
            }

            await connection.commit();
            res.status(200).json({
                status: 'success',
                message: 'Payment berhasil disetujui dan diproses',
                data: { orderId, status: 'SETTLED', amount: parseFloat(payment.amount), type: payment.type }
            });

        } else if (action === 'reject') {
            await connection.query(
                `UPDATE gateway_payments SET status = 'FAILED', callbackPayload = ? WHERE orderId = ?`,
                [callbackPayload, orderId]
            );

            await connection.commit();
            res.status(200).json({
                status: 'success',
                message: 'Payment ditolak',
                data: { orderId, status: 'FAILED', reason: 'Ditolak oleh gateway' }
            });
        }

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ status: 'error', message: error.message });
    } finally {
        connection.release();
    }
};

// 3. Get Payment Status
exports.getStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.userId;
        const role = req.user.role;

        let query = 'SELECT * FROM gateway_payments WHERE orderId = ?';
        let params = [orderId];

        // Non-admin can only see their own payments
        if (role !== 'ADMIN' && role !== 'TELLER' && role !== 'MANAGER') {
            query += ' AND userId = ?';
            params.push(userId);
        }

        const [payments] = await db.query(query, params);

        if (payments.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Payment tidak ditemukan' });
        }

        const payment = payments[0];
        const isExpired = payment.status === 'PENDING' && 
            (new Date() - new Date(payment.created_at)) > 15 * 60 * 1000; // 15 menit

        res.status(200).json({
            status: 'success',
            data: {
                orderId: payment.orderId,
                userId: payment.userId,
                amount: payment.amount,
                type: payment.type,
                status: isExpired ? 'EXPIRED' : payment.status,
                sourceApp: payment.sourceApp,
                createdAt: payment.created_at,
                settledAt: payment.settled_at
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// 4. Get Gateway Logs (Admin only)
exports.getLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [countResult] = await db.query('SELECT COUNT(*) as total FROM gateway_payments');
        const totalItems = countResult[0].total;

        const [payments] = await db.query(
            'SELECT * FROM gateway_payments ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        res.status(200).json({
            status: 'success',
            data: {
                payments,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
