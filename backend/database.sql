CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('NASABAH', 'ADMIN', 'TELLER', 'MANAGER') DEFAULT 'NASABAH',
    tier ENUM('REGULER', 'GOLD', 'PRIORITAS') DEFAULT 'REGULER',
    balance DECIMAL(15, 2) DEFAULT 0.00,
    loan DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    refId VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    fromUserId VARCHAR(50) NOT NULL,
    toUserId VARCHAR(50) NOT NULL,
    baseAmount DECIMAL(15, 2) NOT NULL,
    tax DECIMAL(15, 2) DEFAULT 0.00,
    fee DECIMAL(15, 2) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    interestRate DECIMAL(5, 4) DEFAULT 0.1000,
    totalDue DECIMAL(15, 2) NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'PAID', 'REJECTED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rate_name VARCHAR(50) NOT NULL UNIQUE,
    rate_value DECIMAL(10, 4) NOT NULL,
    description TEXT
);

INSERT IGNORE INTO system_rates (rate_name, rate_value, description) VALUES
('TAX_RATE', 0.0200, 'Pajak sistem untuk money sink (2%)'),
('FEE_MARKETPLACE', 0.0200, 'Fee pembayaran via Marketplace (2%)'),
('FEE_POS', 0.0100, 'Fee pembayaran via POS (1%)'),
('FEE_SUPPLIER', 0.0300, 'Fee pembayaran via SupplierHub (3%)'),
('FEE_LOGISTIC', 0.0500, 'Fee pembayaran via LogistiKita (5%)'),
('FEE_BANK', 0.0100, 'Fee transaksi internal bank (1%)'),
('FEE_GATEWAY', 0.0050, 'Fee infrastruktur API Gateway (0.5%)'),
('FEE_INSIGHT', 10000.0000, 'Biaya flat langganan UMKM Insight'),
('LOAN_INTEREST', 0.1000, 'Bunga pinjaman default (10%)'),
('LATE_PENALTY', 2000.0000, 'Denda flat keterlambatan bayar pinjaman');

CREATE TABLE IF NOT EXISTS tax_collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    tax_amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

CREATE TABLE IF NOT EXISTS fee_collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    fee_type ENUM('BANK', 'GATEWAY', 'MARKETPLACE', 'POS', 'SUPPLIER', 'LOGISTIC', 'INSIGHT') NOT NULL,
    fee_amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

CREATE TABLE IF NOT EXISTS loan_installments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    amount_due DECIMAL(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('PENDING', 'PAID', 'LATE') DEFAULT 'PENDING',
    penalty_amount DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id)
);

CREATE TABLE IF NOT EXISTS escrows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status ENUM('HELD', 'RELEASED', 'REFUNDED') DEFAULT 'HELD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);
