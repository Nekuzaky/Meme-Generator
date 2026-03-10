ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at DATETIME NULL AFTER password_hash,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL AFTER email_verified_at;

CREATE TABLE IF NOT EXISTS auth_email_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  purpose ENUM('email_verify', 'password_reset') NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_email_tokens_user_purpose (user_id, purpose, created_at),
  INDEX idx_auth_email_tokens_expires_at (expires_at),
  CONSTRAINT fk_auth_email_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
