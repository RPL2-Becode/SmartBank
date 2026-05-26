CREATE TABLE IF NOT EXISTS payment_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requestId VARCHAR(100) NOT NULL,
    sourceApp VARCHAR(100) NOT NULL,
    fromUserId VARCHAR(50) NOT NULL,
    toUserId VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status ENUM('PENDING', 'VALIDATING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    failureReason VARCHAR(255) NULL,
    idempotencyKey VARCHAR(150) NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    UNIQUE KEY uq_payment_requests_requestId (requestId),
    UNIQUE KEY uq_payment_requests_idempotencyKey (idempotencyKey),
    INDEX idx_payment_requests_status (status),
    INDEX idx_payment_requests_users (fromUserId, toUserId)
);

CREATE TABLE IF NOT EXISTS gateway_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requestId VARCHAR(100) NULL,
    sourceApp VARCHAR(100) NULL,
    method VARCHAR(10) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    requestBody JSON NULL,
    responseBody JSON NULL,
    statusCode INT NOT NULL,
    latencyMs INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_gateway_logs_requestId (requestId),
    INDEX idx_gateway_logs_created_at (created_at)
);
