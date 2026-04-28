const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { userId, name, password, role } = req.body;

        const existingUser = await User.findOne({ userId });
        if (existingUser) {
            return res.status(400).json({ status: 'error', message: 'User ID sudah terdaftar!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const initialBalance = (role === 'MERCHANT' || role === 'ADMIN') ? 0 : 50000;

        const newUser = new User({
            userId,
            name,
            password: hashedPassword,
            role: role || 'USER',
            balance: initialBalance
        });

        await newUser.save();

        res.status(201).json({
            status: 'success',
            message: 'Registrasi berhasil!',
            data: {
                userId: newUser.userId,
                name: newUser.name,
                role: newUser.role,
                balance: newUser.balance
            }
        });

    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { userId, password } = req.body;

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User tidak ditemukan!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: 'error', message: 'Password salah!' });
        }

        const token = jwt.sign(
            { id: user._id, userId: user.userId, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            status: 'success',
            message: 'Login berhasil!',
            token: token,
            data: {
                userId: user.userId,
                name: user.name,
                balance: user.balance
            }
        });

    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server', error: error.message });
    }
};