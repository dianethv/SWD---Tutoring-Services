CREATE DATABASE IF NOT EXISTS tutorcoogs
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tutorcoogs;

SET NAMES utf8mb4;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE services (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    expected_duration INT UNSIGNED NOT NULL,
    priority_level ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    is_open TINYINT(1) NOT NULL DEFAULT 1,
    icon VARCHAR(50) NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_services_duration CHECK (expected_duration BETWEEN 1 AND 120)
) ENGINE=InnoDB;

-- ── Queue: represents an active queue for a service ──
CREATE TABLE queues (
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

CREATE INDEX idx_queues_service ON queues(service_id);

CREATE TABLE queue_entries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id VARCHAR(32) NOT NULL UNIQUE,
    user_id BIGINT UNSIGNED NOT NULL,
    service_id BIGINT UNSIGNED NOT NULL,
    queue_id BIGINT UNSIGNED NULL,
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('waiting', 'served', 'left', 'no_show') NOT NULL DEFAULT 'waiting',
    priority ENUM('normal', 'high') NOT NULL DEFAULT 'normal',
    position INT UNSIGNED NULL,
    notes VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_queue_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_queue_service
        FOREIGN KEY (service_id) REFERENCES services(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_queue_entry_queue
        FOREIGN KEY (queue_id) REFERENCES queues(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_queue_position CHECK (position IS NULL OR position >= 1)
) ENGINE=InnoDB;

CREATE INDEX idx_queue_service_status_position
    ON queue_entries(service_id, status, position);

CREATE INDEX idx_queue_user_status
    ON queue_entries(user_id, status);

CREATE TABLE history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id VARCHAR(32) NOT NULL UNIQUE,
    queue_entry_id BIGINT UNSIGNED NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    service_id BIGINT UNSIGNED NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    session_date DATE NOT NULL,
    joined_time TIME NOT NULL,
    served_time TIME NULL,
    wait_time INT UNSIGNED NULL,
    outcome ENUM('served', 'cancelled', 'no_show') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_queue_entry
        FOREIGN KEY (queue_entry_id) REFERENCES queue_entries(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_history_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_history_service
        FOREIGN KEY (service_id) REFERENCES services(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_history_user_date
    ON history(user_id, session_date DESC);

CREATE INDEX idx_history_service_date
    ON history(service_id, session_date DESC);

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id VARCHAR(40) NOT NULL UNIQUE,
    user_id BIGINT UNSIGNED NOT NULL,
    type ENUM('queue_update', 'status_change', 'reminder', 'info') NOT NULL DEFAULT 'info',
    title VARCHAR(150) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME NULL,
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notifications_user_read
    ON notifications(user_id, is_read, created_at DESC);
