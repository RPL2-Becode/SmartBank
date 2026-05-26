const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to SmartBank Core API v1.0' });
});

app.use('/smartbank/auth', require('./routes/authRoutes'));
app.use('/smartbank/gateway', require('./routes/gatewayRoutes'));
app.use('/smartbank', require('./routes/bankRoutes'));

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`SmartBank Server berjalan di http://localhost:${PORT}`);
    });
}

module.exports = app;
