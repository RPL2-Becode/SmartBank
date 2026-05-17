-- ============================================================
-- SmartBank Database Migration: Fixes from Testing Results
-- Tanggal: 17 Mei 2026
-- ============================================================

-- ========================================
-- 1. BUAT MISSING TABLES
-- ========================================

-- 1a. system_rates (untuk rate dinamis)
CREATE TABLE IF NOT EXISTS system_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rate_name VARCHAR(50) NOT NULL UNIQUE,
    rate_value DECIMAL(10, 5) NOT NULL DEFAULT 0,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rate_name (rate_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert default rates
INSERT IGNORE INTO system_rates (rate_name, rate_value, description) VALUES
('FEE_BANK', 0.01, 'Biaya admin bank (1%)'),
('FEE_MARKETPLACE', 0.02, 'Biaya marketplace (2%)'),
('FEE_POS', 0.01, 'Biaya POS (1%)'),
('FEE_SUPPLIER', 0.03, 'Biaya supplier (3%)'),
('FEE_LOGISTIC', 0.05, 'Biaya logistik (5%)'),
('FEE_GATEWAY', 0.005, 'Biaya gateway (0.5%)'),
('FEE_INSIGHT', 10000, 'Biaya insight (flat Rp10.000)'),
('TAX_RATE', 0.02, 'Pajak transaksi (2%)'),
('LOAN_INTEREST', 0.10, 'Bunga pinjaman (10%)'),
('LATE_PENALTY', 2000, 'Denda keterlambatan (flat Rp2.000)');

-- 1b. tax_collections (audit trail pajak)
CREATE TABLE IF NOT EXISTS tax_collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 1c. fee_collections (audit trail biaya)
CREATE TABLE IF NOT EXISTS fee_collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    fee_type ENUM('BANK', 'MARKETPLACE', 'POS', 'SUPPLIER', 'LOGISTIC', 'INSIGHT', 'GATEWAY') NOT NULL DEFAULT 'BANK',
    fee_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_fee_type (fee_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 1d. loan_installments (tracking cicilan pinjaman)
CREATE TABLE IF NOT EXISTS loan_installments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    amount_due DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    penalty_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status ENUM('PENDING', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_loan_id (loan_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ========================================
-- 2. TAMBAH FOREIGN KEY CONSTRAINTS
-- ========================================

-- 2a. transactions → users (fromUserId)
ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_from_user
    FOREIGN KEY (fromUserId) REFERENCES users(userId)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2b. transactions → users (toUserId)
ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_to_user
    FOREIGN KEY (toUserId) REFERENCES users(userId)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2c. loans → users
ALTER TABLE loans
    ADD CONSTRAINT fk_loans_user
    FOREIGN KEY (userId) REFERENCES users(userId)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2d. tax_collections → transactions
ALTER TABLE tax_collections
    ADD CONSTRAINT fk_tax_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 2e. fee_collections → transactions
ALTER TABLE fee_collections
    ADD CONSTRAINT fk_fee_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 2f. loan_installments → loans
ALTER TABLE loan_installments
    ADD CONSTRAINT fk_installment_loan
    FOREIGN KEY (loan_id) REFERENCES loans(id)
    ON DELETE CASCADE ON UPDATE CASCADE;


-- ========================================
-- 3. HAPUS REDUNDANT INDEXES
-- ========================================

-- 3a. idx_userId (users) — redundant karena UNIQUE(userId) sudah mencakup
DROP INDEX idx_userId ON users;

-- 3b. idx_refId (transactions) — redundant karena UNIQUE(refId) sudah mencakup
DROP INDEX idx_refId ON transactions;


-- ========================================
-- 4. TAMBAH MISSING INDEXES
-- ========================================

-- 4a. transactions.type — sering dipakai untuk filter tipe transaksi
CREATE INDEX idx_transactions_type ON transactions(type);

-- 4b. loans.status — sering dipakai untuk filter status pinjaman
CREATE INDEX idx_loans_status ON loans(status);


-- ========================================
-- 5. TAMBAH CHECK CONSTRAINTS (MySQL 8.0+)
-- ========================================

-- 5a. Cegah balance negatif
ALTER TABLE users
    ADD CONSTRAINT chk_balance_non_negative
    CHECK (balance >= 0);

-- 5b. Cegah loan negatif
ALTER TABLE users
    ADD CONSTRAINT chk_loan_non_negative
    CHECK (loan >= 0);

-- 5c. Validasi amount transaksi
ALTER TABLE transactions
    ADD CONSTRAINT chk_transaction_amount_positive
    CHECK (baseAmount > 0);


-- ========================================
-- 6. VERIFIKASI
-- ========================================

SELECT '✅ Migration selesai!' as status;
SELECT 'Tabel:' as info, COUNT(*) as total FROM information_schema.tables WHERE table_schema = DATABASE();
SELECT 'FK:' as info, COUNT(*) as total FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = DATABASE();
SELECT 'CHECK:' as info, COUNT(*) as total FROM information_schema.table_constraints WHERE constraint_type = 'CHECK' AND table_schema = DATABASE();
SELECT 'Index users:' as info, COUNT(*) as total FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users';
SELECT 'Index transactions:' as info, COUNT(*) as total FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'transactions';
