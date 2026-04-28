const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['USER', 'ADMIN', 'MERCHANT'], default: 'USER' },
    balance: { type: Number, default: 0 },
    loan: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);