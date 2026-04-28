const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Berhasil Terkoneksi (SmartBank DB)');
    } catch (error) {
        console.error('❌ Koneksi MongoDB Gagal:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
