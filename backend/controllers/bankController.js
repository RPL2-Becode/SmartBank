const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');

const generateTxId = () => 'TX-' + Date.now();

exports.getBalance = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });

        const history = await Transaction.find({
            $or: [{ fromUserId: userId }, { toUserId: userId }]
        }).sort({ createdAt: -1 }).limit(10);

        res.status(200).json({
            status: 'success',
            data: {
                balance: user.balance,
                loan: user.loan,
                history
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.transfer = async (req, res) => {
    try {
        const fromUserId = req.user.userId;
        const { toUserId, amount } = req.body;

        if (amount <= 0) return res.status(400).json({ status: 'error', message: 'Jumlah tidak valid' });

        const sender = await User.findOne({ userId: fromUserId });
        const receiver = await User.findOne({ userId: toUserId });

        if (!sender || !receiver) return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
        
        const bankFee = amount * 0.01;
        const tax = amount * 0.02;
        const totalDeducted = amount + bankFee + tax;

        if (sender.balance < totalDeducted) {
            return res.status(400).json({ status: 'error', message: 'Saldo tidak mencukupi (termasuk biaya admin & pajak)' });
        }

        sender.balance -= totalDeducted;
        receiver.balance += amount;

        await sender.save();
        await receiver.save();

        const tx = new Transaction({
            refId: generateTxId(),
            type: 'TRANSFER',
            fromUserId,
            toUserId,
            baseAmount: amount,
            tax,
            fee: bankFee,
            description: 'Transfer antar user'
        });
        await tx.save();

        res.status(200).json({ status: 'success', message: 'Transfer berhasil', data: tx });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.payment = async (req, res) => {
    try {
        const fromUserId = req.body.fromUserId || req.user.userId; 
        const { toUserId, amount, type, description } = req.body;

        if (amount <= 0) return res.status(400).json({ status: 'error', message: 'Jumlah tidak valid' });

        const sender = await User.findOne({ userId: fromUserId });
        const receiver = await User.findOne({ userId: toUserId });

        if (!sender || !receiver) return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });

        let appFee = 0;
        if (type === 'PAYMENT_MARKETPLACE') appFee = amount * 0.02;
        else if (type === 'PAYMENT_POS') appFee = amount * 0.01;
        else if (type === 'PAYMENT_SUPPLIER') appFee = amount * 0.03;

        const bankFee = amount * 0.01;
        const gatewayFee = amount * 0.005;
        const tax = amount * 0.02;

        const totalFee = appFee + bankFee + gatewayFee + tax;
        const totalDeducted = amount + totalFee;

        if (sender.balance < totalDeducted) {
            return res.status(400).json({ status: 'error', message: 'Saldo tidak mencukupi (termasuk fee & pajak)' });
        }

        sender.balance -= totalDeducted;
        receiver.balance += amount;

        await sender.save();
        await receiver.save();

        const tx = new Transaction({
            refId: generateTxId(),
            type: type || 'PAYMENT',
            fromUserId,
            toUserId,
            baseAmount: amount,
            tax,
            fee: totalFee,
            description: description || 'Pembayaran layanan'
        });
        await tx.save();

        res.status(200).json({ status: 'success', message: 'Pembayaran berhasil', data: tx });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.requestLoan = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { amount } = req.body;

        if (amount <= 0 || amount > 100000) {
            return res.status(400).json({ status: 'error', message: 'Jumlah pinjaman maksimal 100.000' });
        }

        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });

        const interestRate = 0.10;
        const totalDue = amount + (amount * interestRate);

        const newLoan = new Loan({
            userId,
            amount,
            interestRate,
            totalDue,
            status: 'APPROVED'
        });
        await newLoan.save();

        user.balance += amount;
        user.loan += totalDue;
        await user.save();

        const tx = new Transaction({
            refId: generateTxId(),
            type: 'LOAN_DISBURSEMENT',
            fromUserId: 'SYSTEM_BANK',
            toUserId: userId,
            baseAmount: amount,
            fee: 0,
            tax: 0,
            description: 'Pencairan pinjaman'
        });
        await tx.save();

        res.status(200).json({ status: 'success', message: 'Pinjaman disetujui', data: newLoan });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getLedger = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(100);
        res.status(200).json({ status: 'success', data: transactions });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
