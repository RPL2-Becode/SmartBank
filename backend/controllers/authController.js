const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { toFrontendRole } = require('../utils/roles');

function signUserToken(user) {
    return jwt.sign(
        { id: user.id, userId: user.userId, role: user.role, tier: user.tier },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
}

// 1. REGISTRASI USER
exports.register = async (req, res) => {
    try {
        const { userId, name, password, role, tier } = req.validatedData || req.body;

        // Cek apakah user ID sudah dipakai
        const [existingUser] = await db.query('SELECT * FROM users WHERE userId = ?', [userId]);
        if (existingUser.length > 0) {
            return res.status(400).json({ status: 'error', message: 'User ID sudah terdaftar!' });
        }

        // Aturan 1: Total Money Supply maksimal 1.000.000.000
        const [supplyResult] = await db.query('SELECT SUM(balance) as totalMoney FROM users');
        const currentSupply = supplyResult[0].totalMoney || 0;
        
        // Aturan: Saldo awal setiap user tetap 50.000 tanpa memandang Role/Tier
        const initialBalance = 50000;

        if (Number(currentSupply) + initialBalance > 1000000000) {
            return res.status(400).json({ status: 'error', message: 'Bank Reserve Limit tercapai! Tidak dapat membuat uang baru (Inflasi dicegah).' });
        }

        // Enkripsi Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const finalRole = role || 'NASABAH';
        const finalTier = finalRole === 'NASABAH' ? (tier || 'REGULER') : 'REGULER';

        // Simpan ke Database MySQL
        const [insertResult] = await db.query(
            'INSERT INTO users (userId, name, password, role, tier, balance) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, name, hashedPassword, finalRole, finalTier, initialBalance]
        );

        const token = signUserToken({ id: insertResult.insertId, userId, role: finalRole, tier: finalTier });

        res.status(201).json({
            status: 'success',
            message: 'Registrasi berhasil!',
            token,
            data: {
                userId,
                name,
                role: toFrontendRole(finalRole),
                tier: finalTier,
                balance: initialBalance
            }
        });

    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server', error: error.message });
    }
};

// 2. LOGIN USER & GENERATE JWT TOKEN
exports.login = async (req, res) => {
    try {
        const { userId, password } = req.validatedData || req.body;

        // Cari user di Database MySQL
        const [users] = await db.query('SELECT * FROM users WHERE userId = ?', [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User tidak ditemukan!' });
        }

        const user = users[0];

        // Cek kecocokan password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: 'error', message: 'Password salah!' });
        }

        // Generate Token JWT
        const token = signUserToken(user);

        res.status(200).json({
            status: 'success',
            message: 'Login berhasil!',
            token: token,
            data: {
                userId: user.userId,
                name: user.name,
                role: toFrontendRole(user.role),
                tier: user.tier,
                balance: user.balance
            }
        });

    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server', error: error.message });
    }
};
