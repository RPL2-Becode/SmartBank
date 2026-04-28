const db = require('../config/db');

const generateTxId = () => 'TX-' + Date.now();

// 1. Get Balance & Transaction History
exports.getBalance = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const [users] = await db.query('SELECT balance, loan FROM users WHERE userId = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
        
        const [history] = await db.query(
            'SELECT * FROM transactions WHERE fromUserId = ? OR toUserId = ? ORDER BY created_at DESC LIMIT 10', 
            [userId, userId]
        );

        res.status(200).json({
            status: 'success',
            data: {
                balance: users[0].balance,
                loan: users[0].loan,
                history
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// 2. Transfer Saldo Antar User
exports.transfer = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const fromUserId = req.user.userId;
        const { toUserId, amount } = req.body;

        if (amount <= 0) return res.status(400).json({ status: 'error', message: 'Jumlah tidak valid' });

        await connection.beginTransaction();

        const [senders] = await connection.query('SELECT balance FROM users WHERE userId = ? FOR UPDATE', [fromUserId]);
        const [receivers] = await connection.query('SELECT balance FROM users WHERE userId = ? FOR UPDATE', [toUserId]);

        if (senders.length === 0 || receivers.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
        }

        const sender = senders[0];
        const bankFee = amount * 0.01;
        const tax = amount * 0.02;
        const totalDeducted = amount + bankFee + tax;

        if (sender.balance < totalDeducted) {
            await connection.rollback();
            return res.status(400).json({ status: 'error', message: 'Saldo tidak mencukupi (termasuk biaya admin & pajak)' });
        }

        // Proses mutasi
        await connection.query('UPDATE users SET balance = balance - ? WHERE userId = ?', [totalDeducted, fromUserId]);
        await connection.query('UPDATE users SET balance = balance + ? WHERE userId = ?', [amount, toUserId]);

        const txId = generateTxId();
        await connection.query(
            'INSERT INTO transactions (refId, type, fromUserId, toUserId, baseAmount, tax, fee, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [txId, 'TRANSFER', fromUserId, toUserId, amount, tax, bankFee, 'Transfer antar user']
        );

        await connection.commit();
        res.status(200).json({ status: 'success', message: 'Transfer berhasil', data: { refId: txId, amount } });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ status: 'error', message: error.message });
    } finally {
        connection.release();
    }
};

// 3. Pembayaran dari Aplikasi (Marketplace, POS, dll)
exports.payment = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const fromUserId = req.body.fromUserId || req.user.userId; 
        const { toUserId, amount, type, description } = req.body;

        if (amount <= 0) return res.status(400).json({ status: 'error', message: 'Jumlah tidak valid' });

        await connection.beginTransaction();

        const [senders] = await connection.query('SELECT balance FROM users WHERE userId = ? FOR UPDATE', [fromUserId]);
        const [receivers] = await connection.query('SELECT balance FROM users WHERE userId = ? FOR UPDATE', [toUserId]);

        if (senders.length === 0 || receivers.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
        }

        let appFee = 0;
        if (type === 'PAYMENT_MARKETPLACE') appFee = amount * 0.02;
        else if (type === 'PAYMENT_POS') appFee = amount * 0.01;
        else if (type === 'PAYMENT_SUPPLIER') appFee = amount * 0.03;

        const bankFee = amount * 0.01;
        const gatewayFee = amount * 0.005;
        const tax = amount * 0.02;

        const totalFee = appFee + bankFee + gatewayFee + tax;
        const totalDeducted = amount + totalFee;

        if (senders[0].balance < totalDeducted) {
            await connection.rollback();
            return res.status(400).json({ status: 'error', message: 'Saldo tidak mencukupi (termasuk fee & pajak)' });
        }

        await connection.query('UPDATE users SET balance = balance - ? WHERE userId = ?', [totalDeducted, fromUserId]);
        await connection.query('UPDATE users SET balance = balance + ? WHERE userId = ?', [amount, toUserId]);

        const txId = generateTxId();
        await connection.query(
            'INSERT INTO transactions (refId, type, fromUserId, toUserId, baseAmount, tax, fee, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [txId, type || 'PAYMENT', fromUserId, toUserId, amount, tax, totalFee, description || 'Pembayaran layanan']
        );

        await connection.commit();
        res.status(200).json({ status: 'success', message: 'Pembayaran berhasil', data: { refId: txId, amount } });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ status: 'error', message: error.message });
    } finally {
        connection.release();
    }
};

// 4. Request Loan (Pinjaman)
exports.requestLoan = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const userId = req.user.userId;
        const { amount } = req.body;

        if (amount <= 0 || amount > 100000) {
            return res.status(400).json({ status: 'error', message: 'Jumlah pinjaman maksimal 100.000' });
        }

        await connection.beginTransaction();

        const [users] = await connection.query('SELECT balance, loan FROM users WHERE userId = ? FOR UPDATE', [userId]);
        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
        }

        const interestRate = 0.10;
        const totalDue = amount + (amount * interestRate);

        await connection.query(
            'INSERT INTO loans (userId, amount, interestRate, totalDue, status) VALUES (?, ?, ?, ?, ?)',
            [userId, amount, interestRate, totalDue, 'APPROVED']
        );

        await connection.query('UPDATE users SET balance = balance + ?, loan = loan + ? WHERE userId = ?', [amount, totalDue, userId]);

        const txId = generateTxId();
        await connection.query(
            'INSERT INTO transactions (refId, type, fromUserId, toUserId, baseAmount, tax, fee, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [txId, 'LOAN_DISBURSEMENT', 'SYSTEM_BANK', userId, amount, 0, 0, 'Pencairan pinjaman']
        );

        await connection.commit();
        res.status(200).json({ status: 'success', message: 'Pinjaman disetujui', data: { amount, totalDue } });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ status: 'error', message: error.message });
    } finally {
        connection.release();
    }
};

// 5. Get Ledger (Admin/Insight Analytics)
exports.getLedger = async (req, res) => {
    try {
        const [transactions] = await db.query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 100');
        res.status(200).json({ status: 'success', data: transactions });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
