const db = require('../config/db');

const generateTxId = () => 'TX-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);

const isValidAmount = (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && isFinite(num);
};

const getSystemRates = async (connection) => {
    const [rows] = await connection.query('SELECT rate_name, rate_value FROM system_rates');
    const rates = {};
    rows.forEach(r => rates[r.rate_name] = parseFloat(r.rate_value));
    return rates;
};

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

        if (!isValidAmount(amount)) return res.status(400).json({ status: 'error', message: 'Jumlah tidak valid' });
        if (!toUserId || typeof toUserId !== 'string' || toUserId.trim().length === 0) {
            return res.status(400).json({ status: 'error', message: 'User ID penerima wajib diisi' });
        }
        if (fromUserId === toUserId.trim()) {
            return res.status(400).json({ status: 'error', message: 'Tidak bisa transfer ke diri sendiri' });
        }

        // --- Aturan Anti Spam & Max Limit (Rule 15 & 16) ---
        const [todayTx] = await connection.query('SELECT COUNT(*) as total FROM transactions WHERE fromUserId = ? AND DATE(created_at) = CURDATE()', [fromUserId]);
        if (todayTx[0].total >= 10) {
            return res.status(400).json({ status: 'error', message: 'Limit 10 transaksi per hari telah tercapai.' });
        }

        const [lastTx] = await connection.query('SELECT created_at FROM transactions WHERE fromUserId = ? ORDER BY created_at DESC LIMIT 1', [fromUserId]);
        if (lastTx.length > 0) {
            const lastTime = new Date(lastTx[0].created_at).getTime();
            const now = new Date().getTime();
            if (now - lastTime < 10000) { // 10 detik
                return res.status(400).json({ status: 'error', message: 'Harap tunggu 10 detik antar transaksi (Cooldown).' });
            }
        }
        // ---------------------------------------------------

        // Verify both users exist before acquiring locks
        const [senderCheck] = await connection.query('SELECT userId FROM users WHERE userId = ?', [fromUserId]);
        const [receiverCheck] = await connection.query('SELECT userId FROM users WHERE userId = ?', [toUserId.trim()]);
        if (senderCheck.length === 0 || receiverCheck.length === 0) {
            connection.release();
            return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
        }

        await connection.beginTransaction();

        const rates = await getSystemRates(connection);

        const [senders] = await connection.query('SELECT balance FROM users WHERE userId = ? FOR UPDATE', [fromUserId]);
        const [receivers] = await connection.query('SELECT balance FROM users WHERE userId = ? FOR UPDATE', [toUserId.trim()]);

        if (senders.length === 0 || receivers.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
        }

        const sender = senders[0];
        const bankFee = amount * (rates.FEE_BANK || 0.01);
        const tax = amount * (rates.TAX_RATE || 0.02);
        const totalDeducted = amount + bankFee + tax;

        if (sender.balance < totalDeducted) {
            await connection.rollback();
            return res.status(400).json({ status: 'error', message: 'Saldo tidak mencukupi (termasuk biaya admin & pajak)' });
        }

        // Proses mutasi
        await connection.query('UPDATE users SET balance = balance - ? WHERE userId = ?', [totalDeducted, fromUserId]);
        await connection.query('UPDATE users SET balance = balance + ? WHERE userId = ?', [amount, toUserId.trim()]);

        const txId = generateTxId();
        const [txResult] = await connection.query(
            'INSERT INTO transactions (refId, type, fromUserId, toUserId, baseAmount, tax, fee, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [txId, 'TRANSFER', fromUserId, toUserId.trim(), amount, tax, bankFee, 'Transfer antar user']
        );

        if (tax > 0) {
            await connection.query('INSERT INTO tax_collections (transaction_id, tax_amount) VALUES (?, ?)', [txResult.insertId, tax]);
        }
        if (bankFee > 0) {
            await connection.query('INSERT INTO fee_collections (transaction_id, fee_type, fee_amount) VALUES (?, ?, ?)', [txResult.insertId, 'BANK', bankFee]);
        }

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

        if (!isValidAmount(amount)) return res.status(400).json({ status: 'error', message: 'Jumlah tidak valid' });
        if (!toUserId || typeof toUserId !== 'string' || toUserId.trim().length === 0) {
            return res.status(400).json({ status: 'error', message: 'User ID penerima wajib diisi' });
        }
        if (fromUserId === toUserId.trim()) {
            return res.status(400).json({ status: 'error', message: 'Tidak bisa membayar ke diri sendiri' });
        }

        const validTypes = ['PAYMENT_MARKETPLACE', 'PAYMENT_POS', 'PAYMENT_SUPPLIER', 'PAYMENT_LOGISTIC', 'PAYMENT_INSIGHT', 'PAYMENT'];
        if (type && !validTypes.includes(type)) {
            return res.status(400).json({ status: 'error', message: `Tipe pembayaran tidak valid. Gunakan: ${validTypes.join(', ')}` });
        }

        // --- Aturan Anti Spam & Max Limit (Rule 15 & 16) ---
        const [todayTx] = await connection.query('SELECT COUNT(*) as total FROM transactions WHERE fromUserId = ? AND DATE(created_at) = CURDATE()', [fromUserId]);
        if (todayTx[0].total >= 10) {
            return res.status(400).json({ status: 'error', message: 'Limit 10 transaksi per hari telah tercapai.' });
        }

        const [lastTx] = await connection.query('SELECT created_at FROM transactions WHERE fromUserId = ? ORDER BY created_at DESC LIMIT 1', [fromUserId]);
        if (lastTx.length > 0) {
            const lastTime = new Date(lastTx[0].created_at).getTime();
            const now = new Date().getTime();
            if (now - lastTime < 10000) { // 10 detik
                return res.status(400).json({ status: 'error', message: 'Harap tunggu 10 detik antar transaksi (Cooldown).' });
            }
        }
        // ---------------------------------------------------

        await connection.beginTransaction();

        const rates = await getSystemRates(connection);

        const [senders] = await connection.query('SELECT balance FROM users WHERE userId = ? FOR UPDATE', [fromUserId]);
        const [receivers] = await connection.query('SELECT balance FROM users WHERE userId = ? FOR UPDATE', [toUserId]);

        if (senders.length === 0 || receivers.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
        }

        let appFee = 0;
        let feeType = 'BANK';
        if (type === 'PAYMENT_MARKETPLACE') { appFee = amount * (rates.FEE_MARKETPLACE || 0.02); feeType = 'MARKETPLACE'; }
        else if (type === 'PAYMENT_POS') { appFee = amount * (rates.FEE_POS || 0.01); feeType = 'POS'; }
        else if (type === 'PAYMENT_SUPPLIER') { appFee = amount * (rates.FEE_SUPPLIER || 0.03); feeType = 'SUPPLIER'; }
        else if (type === 'PAYMENT_LOGISTIC') { appFee = amount * (rates.FEE_LOGISTIC || 0.05); feeType = 'LOGISTIC'; }
        else if (type === 'PAYMENT_INSIGHT') { appFee = rates.FEE_INSIGHT || 10000; feeType = 'INSIGHT'; }

        const bankFee = amount * (rates.FEE_BANK || 0.01);
        const gatewayFee = amount * (rates.FEE_GATEWAY || 0.005);
        const tax = amount * (rates.TAX_RATE || 0.02);

        const totalFee = appFee + bankFee + gatewayFee + tax;
        const totalDeducted = amount + totalFee;

        if (senders[0].balance < totalDeducted) {
            await connection.rollback();
            return res.status(400).json({ status: 'error', message: 'Saldo tidak mencukupi (termasuk fee & pajak)' });
        }

        await connection.query('UPDATE users SET balance = balance - ? WHERE userId = ?', [totalDeducted, fromUserId]);
        await connection.query('UPDATE users SET balance = balance + ? WHERE userId = ?', [amount, toUserId]);

        const txId = generateTxId();
        const [txResult] = await connection.query(
            'INSERT INTO transactions (refId, type, fromUserId, toUserId, baseAmount, tax, fee, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [txId, type || 'PAYMENT', fromUserId, toUserId, amount, tax, totalFee, description || 'Pembayaran layanan']
        );

        if (tax > 0) {
            await connection.query('INSERT INTO tax_collections (transaction_id, tax_amount) VALUES (?, ?)', [txResult.insertId, tax]);
        }
        if (appFee > 0 && feeType !== 'BANK') {
            await connection.query('INSERT INTO fee_collections (transaction_id, fee_type, fee_amount) VALUES (?, ?, ?)', [txResult.insertId, feeType, appFee]);
        }
        if (bankFee > 0) {
            await connection.query('INSERT INTO fee_collections (transaction_id, fee_type, fee_amount) VALUES (?, ?, ?)', [txResult.insertId, 'BANK', bankFee]);
        }
        if (gatewayFee > 0) {
            await connection.query('INSERT INTO fee_collections (transaction_id, fee_type, fee_amount) VALUES (?, ?, ?)', [txResult.insertId, 'GATEWAY', gatewayFee]);
        }

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

        if (!isValidAmount(amount) || amount > 100000) {
            return res.status(400).json({ status: 'error', message: 'Jumlah pinjaman tidak valid atau maksimal 100.000' });
        }

        await connection.beginTransaction();

        // --- Aturan: Total Money Supply maksimal 1.000.000.000 ---
        const [supplyResult] = await connection.query('SELECT SUM(balance) as totalMoney FROM users');
        const currentSupply = parseFloat(supplyResult[0].totalMoney) || 0;
        
        if (currentSupply + parseFloat(amount) > 1000000000) {
            await connection.rollback();
            return res.status(400).json({ status: 'error', message: 'Bank Reserve Limit tercapai! Pinjaman ditolak untuk mencegah inflasi berlebih.' });
        }
        // ---------------------------------------------------------

        const rates = await getSystemRates(connection);

        const [users] = await connection.query('SELECT balance, loan FROM users WHERE userId = ? FOR UPDATE', [userId]);
        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
        }

        const interestRate = rates.LOAN_INTEREST || 0.10;
        const totalDue = amount + (amount * interestRate);

        const [loanResult] = await connection.query(
            'INSERT INTO loans (userId, amount, interestRate, totalDue, status) VALUES (?, ?, ?, ?, ?)',
            [userId, amount, interestRate, totalDue, 'APPROVED']
        );
        const loanId = loanResult.insertId;

        // Buat tagihan angsuran 30 hari jatuh tempo
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        await connection.query(
            'INSERT INTO loan_installments (loan_id, amount_due, due_date) VALUES (?, ?, ?)',
            [loanId, totalDue, dueDate]
        );

        await connection.query('UPDATE users SET balance = balance + ?, loan = loan + ? WHERE userId = ?', [amount, totalDue, userId]);

        const txId = generateTxId();
        await connection.query(
            'INSERT INTO transactions (refId, type, fromUserId, toUserId, baseAmount, tax, fee, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [txId, 'LOAN_DISBURSEMENT', null, userId, amount, 0, 0, 'Pencairan pinjaman']
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

// 6. Pay Loan (Pembayaran Angsuran)
exports.payLoan = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const userId = req.user.userId;
        const { installmentId } = req.body; 

        if (!installmentId) return res.status(400).json({ status: 'error', message: 'installmentId dibutuhkan' });

        await connection.beginTransaction();

        const rates = await getSystemRates(connection);

        const [users] = await connection.query('SELECT balance, loan FROM users WHERE userId = ? FOR UPDATE', [userId]);
        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
        }

        // Cari angsuran yang statusnya PENDING
        const [installments] = await connection.query(
            'SELECT * FROM loan_installments WHERE id = ? AND status != "PAID" FOR UPDATE',
            [installmentId]
        );

        if (installments.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'error', message: 'Tagihan tidak ditemukan atau sudah lunas' });
        }

        const installment = installments[0];
        let amountToPay = parseFloat(installment.amount_due);
        let penalty = 0;
        let isLate = false;

        // Cek jatuh tempo
        const now = new Date();
        const dueDate = new Date(installment.due_date);
        
        if (now > dueDate) {
            isLate = true;
            penalty = parseFloat(rates.LATE_PENALTY || 2000);
            amountToPay += penalty;
        }

        if (users[0].balance < amountToPay) {
            await connection.rollback();
            return res.status(400).json({ status: 'error', message: `Saldo tidak cukup untuk melunasi tagihan (Total Tagihan + Denda: ${amountToPay})` });
        }

        // Bayar
        await connection.query('UPDATE users SET balance = balance - ?, loan = loan - ? WHERE userId = ?', [amountToPay, installment.amount_due, userId]);
        
        // Update installment
        await connection.query(
            'UPDATE loan_installments SET status = ?, penalty_amount = ? WHERE id = ?',
            ['PAID', penalty, installment.id]
        );

        // Update loan status to PAID
        await connection.query('UPDATE loans SET status = "PAID" WHERE id = ?', [installment.loan_id]);

        const txId = generateTxId();
        const [txResult] = await connection.query(
            'INSERT INTO transactions (refId, type, fromUserId, toUserId, baseAmount, tax, fee, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [txId, 'LOAN_REPAYMENT', userId, null, amountToPay, 0, penalty, isLate ? 'Pelunasan utang (Terlambat)' : 'Pelunasan utang']
        );
        
        if (penalty > 0) {
             await connection.query('INSERT INTO fee_collections (transaction_id, fee_type, fee_amount) VALUES (?, ?, ?)', [txResult.insertId, 'BANK', penalty]);
        }

        await connection.commit();
        res.status(200).json({ status: 'success', message: 'Pinjaman berhasil dilunasi', data: { amountPaid: amountToPay, penalty } });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ status: 'error', message: error.message });
    } finally {
        connection.release();
    }
};

// 7. Get Transaction History for user with pagination
exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Query total count
        const [countResult] = await db.query(
            'SELECT COUNT(*) as total FROM transactions WHERE fromUserId = ? OR toUserId = ?',
            [userId, userId]
        );
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Query transactions
        const [transactions] = await db.query(
            'SELECT * FROM transactions WHERE fromUserId = ? OR toUserId = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [userId, userId, limit, offset]
        );

        res.status(200).json({
            status: 'success',
            data: {
                transactions,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// 8. Get Loans list (Admin/Developer sees all, standard User sees their own)
exports.getLoans = async (req, res) => {
    try {
        const { userId, role } = req.user;
        let queryStr = '';
        let params = [];

        if (role === 'ADMIN' || role === 'DEVELOPER') {
            queryStr = 'SELECT * FROM loans ORDER BY created_at DESC';
        } else {
            queryStr = 'SELECT * FROM loans WHERE userId = ? ORDER BY created_at DESC';
            params = [userId];
        }

        const [loans] = await db.query(queryStr, params);

        res.status(200).json({
            status: 'success',
            data: loans
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
