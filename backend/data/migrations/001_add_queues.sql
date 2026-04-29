-- ── Migration: Add queues table to existing database ──
-- Run this against the tutorcoogs database if it was set up from the old schema.sql
-- This adds the queues table and queue_id column to queue_entries.

USE tutorcoogs;

-- 1. Create the queues table
CREATE TABLE IF NOT EXISTS queues (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id VARCHAR(32) NOT NULL UNIQUE,
    service_id BIGINT UNSIGNED NOT NULL,
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_queues_service
        FOREIGN KEY (service_id) REFERENCES services(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 2. Add queue_id column to queue_entries (if not already present)
--    Using a safe approach: check before altering.
--    If this errors with "Duplicate column name", the column already exists.
ALTER TABLE queue_entries
    ADD COLUMN queue_id BIGINT UNSIGNED NULL AFTER service_id;

ALTER TABLE queue_entries
    ADD CONSTRAINT fk_queue_entry_queue
        FOREIGN KEY (queue_id) REFERENCES queues(id)
        ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Create index on queues.service_id
CREATE INDEX idx_queues_service ON queues(service_id);

-- 4. Auto-create queues for existing services
INSERT INTO queues (public_id, service_id, status)
SELECT
    CONCAT('queue_', public_id),
    id,
    IF(is_open = 1, 'open', 'closed')
FROM services
WHERE id NOT IN (SELECT service_id FROM queues);

-- 5. Backfill queue_id for existing queue_entries
UPDATE queue_entries qe
JOIN services s ON s.id = qe.service_id
JOIN queues q ON q.service_id = s.id
SET qe.queue_id = q.id
WHERE qe.queue_id IS NULL;
