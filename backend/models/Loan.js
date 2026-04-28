const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    interestRate: { type: Number, default: 0.10 },
    totalDue: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'PAID', 'REJECTED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('Loan', loanSchema);
