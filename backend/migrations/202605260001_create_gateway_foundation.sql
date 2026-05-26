-- ============================================================
-- SmartBank Migration: Payment Gateway Foundation (P0)
-- Date: 2026-05-26
--
-- Adds the two foundation tables required for the payment gateway:
--   * payment_requests — tracks every external payment intent and its
--     lifecycle (PENDING -> VALIDATING -> PROCESSING ->
--     SUCCESS|FAILED|REJECTED|EXPIRED).
--   * gateway_logs     — audit log of every gateway HTTP exchange.
--
-- This migration is additive. It does NOT modify or drop any existing
-- table such as `gateway_payments` from the older simulator.
-- ============================================================

USE SmartBank;

-- ------------------------------------------------------------
-- 1. payment_requests
-- ------------------------------------------------------------
-- requestId   : public-facing identifier returned to source apps
-- sourceApp   : marketplace | pos | supplierhub | logistikita | ...
-- fromUserId  : payer (must always be a real user)
-- toUserId    : receiver (nullable when paying a service rather than a user)
-- amount      : DECIMAL(15,2) consistent with users.balance / transactions
-- type        : matches transactions.type vocabulary
-- status      : finite-state machine (PENDING -> SUCCESS / FAILED / ...)
-- failureReason : populated when status in (FAILED, REJECTED)
-- idempotencyKey: when set, prevents the same logical request from being
--                 processed twice (unique when not null).
-- metadata    : free-form JSON describing the request (cart id, signature, …)

CREATE TABLE IF NOT EXISTS payment_requests (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    requestId     VARCHAR(64) NOT NULL,
    sourceApp     VARCHAR(50) NOT NULL,
    fromUserId    VARCHAR(50) NOT NULL,
    toUserId      VARCHAR(50) NULL,
    amount        DECIMAL(15, 2) NOT NULL,
    type          VARCHAR(50) NOT NULL,
    status        ENUM(
                      'PENDING',
                      'VALIDATING',
                      'PROCESSING',
                      'SUCCESS',
                      'FAILED',
                      'REJECTED',
                      'EXPIRED'
                  ) NOT NULL DEFAULT 'PENDING',
    failureReason VARCHAR(255) NULL,
    idempotencyKey VARCHAR(120) NULL,
    metadata      JSON NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at  TIMESTAMP NULL,

    UNIQUE KEY uq_payment_requests_requestId (requestId),
    -- Unique only when idempotencyKey IS NOT NULL — MySQL allows
    -- multiple NULLs in a UNIQUE index, which gives us the desired
    -- "unique when present" semantics.
    UNIQUE KEY uq_payment_requests_idempotency (idempotencyKey),

    INDEX idx_pr_status (status),
    INDEX idx_pr_from_user (fromUserId),
    INDEX idx_pr_source_app (sourceApp),
    INDEX idx_pr_created_at (created_at),

    CONSTRAINT fk_pr_from_user FOREIGN KEY (fromUserId)
        REFERENCES users(userId) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_pr_to_user FOREIGN KEY (toUserId)
        REFERENCES users(userId) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 2. gateway_logs
-- ------------------------------------------------------------
-- Generic gateway audit log. Attached to a payment_requests row when
-- relevant via requestId.

CREATE TABLE IF NOT EXISTS gateway_logs (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    requestId     VARCHAR(64) NULL,
    sourceApp     VARCHAR(50) NULL,
    method        VARCHAR(10) NOT NULL,
    endpoint      VARCHAR(255) NOT NULL,
    requestBody   JSON NULL,
    responseBody  JSON NULL,
    statusCode    INT NULL,
    latencyMs     INT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_gl_request_id (requestId),
    INDEX idx_gl_source_app (sourceApp),
    INDEX idx_gl_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT '[OK] Migration 202605260001_create_gateway_foundation applied.' AS status;
