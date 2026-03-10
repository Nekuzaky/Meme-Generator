SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(32) NOT NULL UNIQUE,
  public_slug VARCHAR(80) NULL UNIQUE,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified_at DATETIME NULL,
  avatar_url TEXT NULL,
  cover_url TEXT NULL,
  bio VARCHAR(280) NULL,
  website_url VARCHAR(255) NULL,
  locale VARCHAR(12) NOT NULL DEFAULT 'fr',
  timezone VARCHAR(64) NULL,
  role ENUM('user', 'moderator', 'admin') NOT NULL DEFAULT 'user',
  plan ENUM('free', 'premium', 'pro', 'team', 'enterprise') NOT NULL DEFAULT 'free',
  plan_status ENUM('inactive', 'trialing', 'active', 'past_due', 'cancelled') NOT NULL DEFAULT 'inactive',
  is_public_profile TINYINT(1) NOT NULL DEFAULT 1,
  allow_public_favorites TINYINT(1) NOT NULL DEFAULT 0,
  allow_public_drafts TINYINT(1) NOT NULL DEFAULT 0,
  onboarding_completed TINYINT(1) NOT NULL DEFAULT 0,
  marketing_opt_in TINYINT(1) NOT NULL DEFAULT 0,
  last_login_at DATETIME NULL,
  last_seen_at DATETIME NULL,
  banned_at DATETIME NULL,
  ban_reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role_plan (role, plan, created_at),
  INDEX idx_users_public_profile (is_public_profile, created_at),
  INDEX idx_users_email_verified (email_verified_at)
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

CREATE TABLE IF NOT EXISTS auth_email_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  purpose ENUM('email_verify', 'password_reset', 'email_change') NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_email_tokens_user_purpose (user_id, purpose, created_at),
  INDEX idx_auth_email_tokens_expires_at (expires_at),
  CONSTRAINT fk_auth_email_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS templates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  source_type ENUM('imgflip', 'internal', 'premium', 'sponsored', 'user') NOT NULL DEFAULT 'internal',
  source_ref VARCHAR(190) NULL,
  preview_image_url TEXT NULL,
  base_image_url TEXT NULL,
  thumbnail_url TEXT NULL,
  default_top_text VARCHAR(160) NULL,
  default_bottom_text VARCHAR(160) NULL,
  category VARCHAR(64) NULL,
  locale VARCHAR(12) NOT NULL DEFAULT 'fr',
  tags_json JSON NULL,
  box_count TINYINT UNSIGNED NOT NULL DEFAULT 2,
  aspect_ratio VARCHAR(16) NULL,
  usage_count INT UNSIGNED NOT NULL DEFAULT 0,
  remix_count INT UNSIGNED NOT NULL DEFAULT 0,
  favorite_count INT UNSIGNED NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_premium TINYINT(1) NOT NULL DEFAULT 0,
  is_public TINYINT(1) NOT NULL DEFAULT 1,
  moderation_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  published_at DATETIME NULL,
  created_by_user_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_templates_featured_usage (is_featured, usage_count, created_at),
  INDEX idx_templates_public_moderation (is_public, moderation_status, published_at),
  INDEX idx_templates_premium (is_premium, is_public, created_at),
  INDEX idx_templates_category (category, published_at),
  CONSTRAINT fk_templates_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS template_examples (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  template_id BIGINT UNSIGNED NOT NULL,
  meme_id BIGINT UNSIGNED NULL,
  image_url TEXT NOT NULL,
  title VARCHAR(160) NULL,
  caption VARCHAR(255) NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_template_examples_template (template_id, sort_order, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS premium_packs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  cover_image_url TEXT NULL,
  price_cents INT UNSIGNED NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_premium_packs_active (is_active, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS premium_pack_templates (
  pack_id BIGINT UNSIGNED NOT NULL,
  template_id BIGINT UNSIGNED NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (pack_id, template_id),
  INDEX idx_premium_pack_templates_template (template_id),
  CONSTRAINT fk_premium_pack_templates_pack FOREIGN KEY (pack_id) REFERENCES premium_packs(id) ON DELETE CASCADE,
  CONSTRAINT fk_premium_pack_templates_template FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS memes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  template_id BIGINT UNSIGNED NULL,
  parent_meme_id BIGINT UNSIGNED NULL,
  title VARCHAR(120) NOT NULL,
  slug VARCHAR(160) NULL UNIQUE,
  description TEXT NULL,
  source_image_url TEXT NULL,
  generated_image_url TEXT NULL,
  payload_json LONGTEXT NULL,
  editor_state_json LONGTEXT NULL,
  tags_json JSON NULL,
  visibility ENUM('private', 'unlisted', 'public') NOT NULL DEFAULT 'private',
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  is_draft TINYINT(1) NOT NULL DEFAULT 0,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  watermark_enabled TINYINT(1) NOT NULL DEFAULT 0,
  render_engine VARCHAR(64) NULL,
  content_rating ENUM('safe', 'questionable', 'mature') NOT NULL DEFAULT 'safe',
  moderation_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  moderation_reason VARCHAR(255) NULL,
  moderated_by_user_id INT UNSIGNED NULL,
  moderated_at DATETIME NULL,
  published_at DATETIME NULL,
  featured_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  hot_score DECIMAL(12,4) NOT NULL DEFAULT 0,
  views_count INT UNSIGNED NOT NULL DEFAULT 0,
  favorites_count INT UNSIGNED NOT NULL DEFAULT 0,
  likes_count INT UNSIGNED NOT NULL DEFAULT 0,
  remix_count INT UNSIGNED NOT NULL DEFAULT 0,
  comments_count INT UNSIGNED NOT NULL DEFAULT 0,
  shares_count INT UNSIGNED NOT NULL DEFAULT 0,
  downloads_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_memes_user_id (user_id),
  INDEX idx_memes_public_moderation_created (is_public, moderation_status, created_at),
  INDEX idx_memes_visibility_hot (visibility, moderation_status, hot_score, created_at),
  INDEX idx_memes_template_created (template_id, created_at),
  INDEX idx_memes_parent_created (parent_meme_id, created_at),
  INDEX idx_memes_featured (featured_score, created_at),
  CONSTRAINT fk_memes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_memes_template FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL,
  CONSTRAINT fk_memes_parent FOREIGN KEY (parent_meme_id) REFERENCES memes(id) ON DELETE SET NULL,
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
  snapshot_tags_json JSON NULL,
  snapshot_is_public TINYINT(1) NOT NULL DEFAULT 0,
  change_source ENUM('create', 'update', 'autosave', 'manual', 'restore', 'remix') NOT NULL DEFAULT 'manual',
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

CREATE TABLE IF NOT EXISTS meme_likes (
  user_id INT UNSIGNED NOT NULL,
  meme_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, meme_id),
  INDEX idx_meme_likes_meme_created (meme_id, created_at),
  CONSTRAINT fk_meme_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_meme_likes_meme FOREIGN KEY (meme_id) REFERENCES memes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meme_comments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  meme_id BIGINT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  parent_comment_id BIGINT UNSIGNED NULL,
  body TEXT NOT NULL,
  likes_count INT UNSIGNED NOT NULL DEFAULT 0,
  moderation_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_meme_comments_meme_created (meme_id, created_at),
  INDEX idx_meme_comments_parent_created (parent_comment_id, created_at),
  CONSTRAINT fk_meme_comments_meme FOREIGN KEY (meme_id) REFERENCES memes(id) ON DELETE CASCADE,
  CONSTRAINT fk_meme_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_meme_comments_parent FOREIGN KEY (parent_comment_id) REFERENCES meme_comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meme_tags (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  label VARCHAR(64) NOT NULL,
  usage_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_meme_tags_usage (usage_count, slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meme_tag_map (
  meme_id BIGINT UNSIGNED NOT NULL,
  tag_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (meme_id, tag_id),
  INDEX idx_meme_tag_map_tag (tag_id, meme_id),
  CONSTRAINT fk_meme_tag_map_meme FOREIGN KEY (meme_id) REFERENCES memes(id) ON DELETE CASCADE,
  CONSTRAINT fk_meme_tag_map_tag FOREIGN KEY (tag_id) REFERENCES meme_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS collections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  slug VARCHAR(120) NULL UNIQUE,
  title VARCHAR(120) NOT NULL,
  description TEXT NULL,
  cover_image_url TEXT NULL,
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  followers_count INT UNSIGNED NOT NULL DEFAULT 0,
  memes_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_collections_user_created (user_id, created_at),
  INDEX idx_collections_public_created (is_public, created_at),
  CONSTRAINT fk_collections_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS collection_items (
  collection_id BIGINT UNSIGNED NOT NULL,
  meme_id BIGINT UNSIGNED NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, meme_id),
  INDEX idx_collection_items_meme (meme_id),
  CONSTRAINT fk_collection_items_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  CONSTRAINT fk_collection_items_meme FOREIGN KEY (meme_id) REFERENCES memes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS follows (
  follower_user_id INT UNSIGNED NOT NULL,
  followed_user_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_user_id, followed_user_id),
  INDEX idx_follows_followed_created (followed_user_id, created_at),
  CONSTRAINT fk_follows_follower FOREIGN KEY (follower_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_follows_followed FOREIGN KEY (followed_user_id) REFERENCES users(id) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS moderation_queue (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('meme', 'comment', 'template', 'user_profile') NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  priority TINYINT UNSIGNED NOT NULL DEFAULT 5,
  status ENUM('pending', 'reviewing', 'resolved') NOT NULL DEFAULT 'pending',
  assigned_to_user_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moderation_queue_status_priority (status, priority, created_at),
  CONSTRAINT fk_moderation_queue_user FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(160) NOT NULL,
  body VARCHAR(255) NULL,
  link_url VARCHAR(255) NULL,
  meta_json JSON NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_created (user_id, created_at),
  INDEX idx_notifications_user_read (user_id, read_at, created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
  INDEX idx_consented_visits_created_at (created_at),
  INDEX idx_consented_visits_campaign_created (utm_source, utm_medium, utm_campaign, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conversion_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  visitor_id VARCHAR(80) NULL,
  user_id INT UNSIGNED NULL,
  event_type ENUM('visit', 'signup', 'verify_email', 'start_creator', 'save_draft', 'publish_meme', 'share_meme', 'export_png', 'export_hd', 'upgrade', 'invite_team') NOT NULL,
  page_path VARCHAR(255) NULL,
  source VARCHAR(80) NULL,
  medium VARCHAR(80) NULL,
  campaign VARCHAR(80) NULL,
  meta_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conversion_events_type_created (event_type, created_at),
  INDEX idx_conversion_events_user_created (user_id, created_at),
  CONSTRAINT fk_conversion_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS creator_offer_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  visitor_id VARCHAR(80) NULL,
  user_id INT UNSIGNED NULL,
  event_type ENUM('ad_impression', 'ad_click', 'affiliate_click', 'subscription_view', 'subscription_start', 'pack_view', 'pack_purchase') NOT NULL,
  placement VARCHAR(80) NOT NULL,
  meta_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_creator_offer_events_type_created (event_type, created_at),
  INDEX idx_creator_offer_events_user_created (user_id, created_at),
  CONSTRAINT fk_creator_offer_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS team_workspaces (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_user_id INT UNSIGNED NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  plan ENUM('team', 'business', 'enterprise') NOT NULL DEFAULT 'team',
  seats_count INT UNSIGNED NOT NULL DEFAULT 1,
  storage_limit_mb INT UNSIGNED NOT NULL DEFAULT 10240,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_team_workspaces_owner_created (owner_user_id, created_at),
  CONSTRAINT fk_team_workspaces_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS team_members (
  workspace_id BIGINT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  role ENUM('owner', 'admin', 'editor', 'viewer') NOT NULL DEFAULT 'editor',
  invited_by_user_id INT UNSIGNED NULL,
  joined_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (workspace_id, user_id),
  INDEX idx_team_members_user_role (user_id, role),
  CONSTRAINT fk_team_members_workspace FOREIGN KEY (workspace_id) REFERENCES team_workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_team_members_invited_by FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS brand_kits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workspace_id BIGINT UNSIGNED NULL,
  user_id INT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  logo_url TEXT NULL,
  primary_color VARCHAR(16) NULL,
  secondary_color VARCHAR(16) NULL,
  accent_color VARCHAR(16) NULL,
  fonts_json JSON NULL,
  watermark_text VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_brand_kits_workspace_created (workspace_id, created_at),
  INDEX idx_brand_kits_user_created (user_id, created_at),
  CONSTRAINT fk_brand_kits_workspace FOREIGN KEY (workspace_id) REFERENCES team_workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_brand_kits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sponsored_challenges (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  sponsor_name VARCHAR(120) NULL,
  sponsor_logo_url TEXT NULL,
  description TEXT NULL,
  prize_text VARCHAR(255) NULL,
  rules_url VARCHAR(255) NULL,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sponsored_challenges_active_dates (is_active, starts_at, ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS challenge_entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  challenge_id BIGINT UNSIGNED NOT NULL,
  meme_id BIGINT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  status ENUM('submitted', 'approved', 'rejected', 'winner') NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_challenge_entries_challenge_status (challenge_id, status, created_at),
  INDEX idx_challenge_entries_user_created (user_id, created_at),
  UNIQUE KEY uniq_challenge_entries_meme (challenge_id, meme_id),
  CONSTRAINT fk_challenge_entries_challenge FOREIGN KEY (challenge_id) REFERENCES sponsored_challenges(id) ON DELETE CASCADE,
  CONSTRAINT fk_challenge_entries_meme FOREIGN KEY (meme_id) REFERENCES memes(id) ON DELETE CASCADE,
  CONSTRAINT fk_challenge_entries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_customers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  provider VARCHAR(64) NOT NULL,
  provider_customer_id VARCHAR(190) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_billing_customers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  workspace_id BIGINT UNSIGNED NULL,
  provider VARCHAR(64) NOT NULL,
  provider_subscription_id VARCHAR(190) NOT NULL UNIQUE,
  plan_code VARCHAR(80) NOT NULL,
  status VARCHAR(32) NOT NULL,
  current_period_start DATETIME NULL,
  current_period_end DATETIME NULL,
  cancel_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subscriptions_user_status (user_id, status, current_period_end),
  INDEX idx_subscriptions_workspace_status (workspace_id, status, current_period_end),
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscriptions_workspace FOREIGN KEY (workspace_id) REFERENCES team_workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  template_key VARCHAR(80) NOT NULL,
  recipient_email VARCHAR(190) NOT NULL,
  status ENUM('queued', 'sent', 'failed', 'opened', 'clicked') NOT NULL DEFAULT 'queued',
  provider_message_id VARCHAR(190) NULL,
  meta_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email_events_user_status (user_id, status, created_at),
  INDEX idx_email_events_template_status (template_key, status, created_at),
  CONSTRAINT fk_email_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feature_flags (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  flag_key VARCHAR(120) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 0,
  rollout_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS job_queue (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_type VARCHAR(80) NOT NULL,
  payload_json JSON NOT NULL,
  status ENUM('pending', 'processing', 'done', 'failed') NOT NULL DEFAULT 'pending',
  available_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_job_queue_status_available (status, available_at, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_rate_limits (
  rate_key CHAR(64) PRIMARY KEY,
  hits INT UNSIGNED NOT NULL DEFAULT 0,
  window_start DATETIME NOT NULL,
  blocked_until DATETIME NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_api_rate_limits_blocked_until (blocked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
