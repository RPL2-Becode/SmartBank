-- ============================================================
-- SmartBank Database Migration: Consolidation & Schema Updates
-- Tanggal: 24 Mei 2026
-- ============================================================

-- 1. Create system_rates with updated precision if not exists
CREATE TABLE IF NOT EXISTS system_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rate_name VARCHAR(50) NOT NULL UNIQUE,
    rate_value DECIMAL(10, 5) NOT NULL DEFAULT 0,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rate_name (rate_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sync system_rates defaults
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

-- 2. Ensure transactions table allows NULL for fromUserId/toUserId for system-generated txs
ALTER TABLE transactions 
    MODIFY fromUserId VARCHAR(50) NULL,
    MODIFY toUserId VARCHAR(50) NULL;

-- 3. Update loan_installments ENUM to match bankController.js logic (OVERDUE instead of LATE)
ALTER TABLE loan_installments 
    MODIFY COLUMN status ENUM('PENDING', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING';

-- 4. Add missing Foreign Key Constraints for data integrity
-- Note: IGNORE error if constraints already exist

SET @db_name = DATABASE();

-- FK for transactions -> users (from)
SET @s = IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE constraint_schema = @db_name AND table_name = 'transactions' AND constraint_name = 'fk_tx_from_user') = 0,
    'ALTER TABLE transactions ADD CONSTRAINT fk_tx_from_user FOREIGN KEY (fromUserId) REFERENCES users(userId) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT "FK fk_tx_from_user already exists"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- FK for transactions -> users (to)
SET @s = IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE constraint_schema = @db_name AND table_name = 'transactions' AND constraint_name = 'fk_tx_to_user') = 0,
    'ALTER TABLE transactions ADD CONSTRAINT fk_tx_to_user FOREIGN KEY (toUserId) REFERENCES users(userId) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT "FK fk_tx_to_user already exists"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- FK for loans -> users
SET @s = IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE constraint_schema = @db_name AND table_name = 'loans' AND constraint_name = 'fk_loans_user_id') = 0,
    'ALTER TABLE loans ADD CONSTRAINT fk_loans_user_id FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT "FK fk_loans_user_id already exists"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. Add Check Constraints (MySQL 8.0+)
-- Prevention of negative balance/loan
ALTER TABLE users
    ADD CONSTRAINT chk_balance_non_negative CHECK (balance >= 0),
    ADD CONSTRAINT chk_loan_non_negative CHECK (loan >= 0);

-- Validation for positive transaction amount
ALTER TABLE transactions
    ADD CONSTRAINT chk_tx_amount_positive CHECK (baseAmount > 0);

SELECT '✅ Migration update completed!' as status;
