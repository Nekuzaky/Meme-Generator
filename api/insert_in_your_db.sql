CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_tokens_user_id (user_id),
  INDEX idx_auth_tokens_expires_at (expires_at),
  CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS memes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NULL,
  source_image_url TEXT NULL,
  generated_image_url TEXT NULL,
  payload_json LONGTEXT NULL,
  tags_json TEXT NULL,
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  moderation_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  moderation_reason VARCHAR(255) NULL,
  moderated_by_user_id INT UNSIGNED NULL,
  moderated_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_memes_user_id (user_id),
  INDEX idx_memes_public_moderation_created (is_public, moderation_status, created_at),
  CONSTRAINT fk_memes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_memes_moderated_by FOREIGN KEY (moderated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meme_versions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  meme_id BIGINT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  version_label VARCHAR(120) NULL,
  snapshot_payload_json LONGTEXT NULL,
  snapshot_title VARCHAR(120) NOT NULL,
  snapshot_description TEXT NULL,
  snapshot_source_image_url TEXT NULL,
  snapshot_generated_image_url TEXT NULL,
  snapshot_tags_json TEXT NULL,
  snapshot_is_public TINYINT(1) NOT NULL DEFAULT 0,
  change_source ENUM('create', 'update', 'autosave', 'manual', 'restore') NOT NULL DEFAULT 'manual',
  created_by_user_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_meme_versions_meme_created (meme_id, created_at),
  INDEX idx_meme_versions_user_created (user_id, created_at),
  CONSTRAINT fk_meme_versions_meme FOREIGN KEY (meme_id) REFERENCES memes(id) ON DELETE CASCADE,
  CONSTRAINT fk_meme_versions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_meme_versions_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meme_favorites (
  user_id INT UNSIGNED NOT NULL,
  meme_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, meme_id),
  INDEX idx_meme_favorites_meme_id (meme_id),
  CONSTRAINT fk_meme_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_meme_favorites_meme FOREIGN KEY (meme_id) REFERENCES memes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meme_reports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  meme_id BIGINT UNSIGNED NOT NULL,
  reporter_user_id INT UNSIGNED NULL,
  reason VARCHAR(120) NOT NULL,
  details TEXT NULL,
  status ENUM('open', 'reviewed', 'dismissed') NOT NULL DEFAULT 'open',
  reviewed_by_user_id INT UNSIGNED NULL,
  resolution_note VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  INDEX idx_meme_reports_meme_created (meme_id, created_at),
  INDEX idx_meme_reports_status_created (status, created_at),
  CONSTRAINT fk_meme_reports_meme FOREIGN KEY (meme_id) REFERENCES memes(id) ON DELETE CASCADE,
  CONSTRAINT fk_meme_reports_reporter FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_meme_reports_reviewer FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS moderation_blacklist (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  term VARCHAR(120) NOT NULL UNIQUE,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by_user_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_moderation_blacklist_active (is_active),
  CONSTRAINT fk_moderation_blacklist_user FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_rate_limits (
  rate_key CHAR(64) PRIMARY KEY,
  hits INT UNSIGNED NOT NULL DEFAULT 0,
  window_start DATETIME NOT NULL,
  blocked_until DATETIME NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_api_rate_limits_blocked_until (blocked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consented_visits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  visitor_id VARCHAR(80) NOT NULL,
  consent_version VARCHAR(24) NOT NULL DEFAULT 'v1',
  page_path VARCHAR(255) NULL,
  referrer VARCHAR(1024) NULL,
  timezone VARCHAR(64) NULL,
  screen VARCHAR(32) NULL,
  language VARCHAR(32) NULL,
  platform VARCHAR(64) NULL,
  user_agent VARCHAR(400) NULL,
  ip_hash CHAR(64) NOT NULL,
  dnt TINYINT(1) NOT NULL DEFAULT 0,
  utm_source VARCHAR(80) NULL,
  utm_medium VARCHAR(80) NULL,
  utm_campaign VARCHAR(80) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_consented_visits_visitor_created (visitor_id, created_at),
  INDEX idx_consented_visits_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
