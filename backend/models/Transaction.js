const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    refId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    fromUserId: { type: String, required: true },
    toUserId: { type: String, required: true },
    baseAmount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    fee: { type: Number, default: 0 },
    description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);