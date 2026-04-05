-- ============================================================
--  Finance Dashboard Backend — Complete Database Schema
--  Run this file once to initialize the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS finance_dashboard
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE finance_dashboard;

-- ─── ROLES ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          TINYINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name        ENUM('viewer','analyst','admin') NOT NULL UNIQUE,
  description VARCHAR(255)      NOT NULL DEFAULT '',
  PRIMARY KEY (id)
);

INSERT IGNORE INTO roles (name, description) VALUES
  ('viewer',  'Can only view dashboard data'),
  ('analyst', 'Can view records and access insights/summaries'),
  ('admin',   'Full management access: records, users, and configuration');

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name            VARCHAR(100)    NOT NULL,
  email           VARCHAR(150)    NOT NULL UNIQUE,
  password_hash   VARCHAR(255)    NOT NULL,
  role_id         TINYINT UNSIGNED NOT NULL DEFAULT 1,   -- default: viewer
  status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
  refresh_token   VARCHAR(512)    NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON UPDATE CASCADE
);

-- Seed admin user (password: Admin@1234 — bcrypt hash below)
INSERT IGNORE INTO users (name, email, password_hash, role_id, status) VALUES (
  'System Admin',
  'admin@finance.dev',
  '$2b$10$YJK3g2E0PiRx1.fq3oDCz.Wg0GTPYt7FoNk.LzMQVh8iL0dT9qzPy',  -- Admin@1234
  3,
  'active'
);

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id    SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name  VARCHAR(80)       NOT NULL UNIQUE,
  PRIMARY KEY (id)
);

INSERT IGNORE INTO categories (name) VALUES
  ('Salary'), ('Freelance'), ('Investment'), ('Business'),
  ('Food'), ('Rent'), ('Utilities'), ('Transport'),
  ('Healthcare'), ('Education'), ('Entertainment'), ('Shopping'), ('Other');

-- ─── FINANCIAL RECORDS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_records (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED      NOT NULL,                -- creator
  amount        DECIMAL(15, 2)    NOT NULL CHECK (amount > 0),
  type          ENUM('income','expense') NOT NULL,
  category_id   SMALLINT UNSIGNED NOT NULL,
  record_date   DATE              NOT NULL,
  notes         TEXT              NULL,
  deleted_at    DATETIME          NULL DEFAULT NULL,       -- soft delete
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_records_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE RESTRICT,
  CONSTRAINT fk_records_category FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE,
  INDEX idx_type        (type),
  INDEX idx_category    (category_id),
  INDEX idx_record_date (record_date),
  INDEX idx_deleted_at  (deleted_at)
);

-- ─── AUDIT LOG (optional enhancement) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED      NULL,
  action      VARCHAR(100)      NOT NULL,
  entity      VARCHAR(80)       NOT NULL,
  entity_id   INT UNSIGNED      NULL,
  meta        JSON              NULL,
  ip_address  VARCHAR(45)       NULL,
  created_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_audit_user   (user_id),
  INDEX idx_audit_entity (entity, entity_id)
);
