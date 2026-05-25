-- ============================================================
-- SmartBank Database Schema
-- Final Version: 24 Mei 2026
-- ============================================================

CREATE DATABASE IF NOT EXISTS SmartBank;
USE SmartBank;

-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('NASABAH', 'ADMIN', 'TELLER', 'MANAGER') NOT NULL DEFAULT 'NASABAH',
    tier ENUM('REGULER', 'GOLD', 'PRIORITAS') NOT NULL DEFAULT 'REGULER',
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    loan DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    refId VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    fromUserId VARCHAR(50) NULL,
    toUserId VARCHAR(50) NULL,
    baseAmount DECIMAL(15, 2) NOT NULL,
    tax DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    fee DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fromUser (fromUserId),
    INDEX idx_toUser (toUserId),
    INDEX idx_type (type),
    CONSTRAINT fk_tx_from_user FOREIGN KEY (fromUserId) REFERENCES users(userId) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tx_to_user FOREIGN KEY (toUserId) REFERENCES users(userId) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Loans
CREATE TABLE IF NOT EXISTS loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    interestRate DECIMAL(5, 4) DEFAULT 0.1000,
    totalDue DECIMAL(15, 2) NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'PAID', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_loans_user_id FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel System Rates
CREATE TABLE IF NOT EXISTS system_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rate_name VARCHAR(50) NOT NULL UNIQUE,
    rate_value DECIMAL(10, 5) NOT NULL DEFAULT 0,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default Rates
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

-- 5. Tabel Tax & Fee Collections (Audit)
CREATE TABLE IF NOT EXISTS tax_collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    tax_amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tax_tx FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fee_collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    fee_type ENUM('BANK', 'GATEWAY', 'MARKETPLACE', 'POS', 'SUPPLIER', 'LOGISTIC', 'INSIGHT') NOT NULL,
    fee_amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fee_tx FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabel Loan Installments
CREATE TABLE IF NOT EXISTS loan_installments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    amount_due DECIMAL(15, 2) NOT NULL,
    penalty_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status ENUM('PENDING', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_installment_loan_id FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabel Escrows
CREATE TABLE IF NOT EXISTS escrows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status ENUM('HELD', 'RELEASED', 'REFUNDED') DEFAULT 'HELD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_escrow_tx FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
