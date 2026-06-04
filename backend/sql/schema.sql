CREATE DATABASE IF NOT EXISTS campus_trade;
USE campus_trade;

CREATE TABLE IF NOT EXISTS schools (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  short_name VARCHAR(32) NOT NULL UNIQUE,
  email_domain VARCHAR(120) NOT NULL,
  city VARCHAR(80) NOT NULL,
  state VARCHAR(40) NOT NULL,
  logo_url VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_schools_email_domain (email_domain)
);

CREATE TABLE IF NOT EXISTS users (
  id CHAR(64) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  major VARCHAR(120) NULL,
  bio TEXT NULL,
  verified_student BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES schools(id),
  INDEX idx_users_school_id (school_id),
  INDEX idx_users_verified_student (verified_student)
);

CREATE TABLE IF NOT EXISTS email_verifications (
  id CHAR(64) PRIMARY KEY,
  user_id CHAR(64) NOT NULL,
  email VARCHAR(180) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_verifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email_verifications_user_id (user_id),
  INDEX idx_email_verifications_email (email),
  INDEX idx_email_verifications_expires_at (expires_at)
);

CREATE TABLE IF NOT EXISTS products (
  id CHAR(64) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  seller_id CHAR(64) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category ENUM('course_materials','electronics','books','furniture','dorm_home','clothing','transportation','sports_outdoor','tickets_events','free_stuff','other') NOT NULL,
  usage_type ENUM('course_required','course_recommended','personal_sale','moving_sale','free') NOT NULL DEFAULT 'personal_sale',
  condition_value ENUM('new','like_new','good','fair','poor') NOT NULL,
  status ENUM('available','pending','sold','removed') NOT NULL DEFAULT 'available',
  location VARCHAR(160) NOT NULL,
  negotiable BOOLEAN NOT NULL DEFAULT FALSE,
  is_course_related BOOLEAN NOT NULL DEFAULT FALSE,
  view_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES users(id),
  INDEX idx_products_school_id (school_id),
  INDEX idx_products_seller_id (seller_id),
  INDEX idx_products_category (category),
  INDEX idx_products_status (status),
  INDEX idx_products_created_at (created_at),
  FULLTEXT INDEX ft_products_title_description (title, description)
);

CREATE TABLE IF NOT EXISTS product_images (
  id CHAR(64) PRIMARY KEY,
  product_id CHAR(64) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_images_product_id (product_id),
  INDEX idx_product_images_sort (product_id, sort_order)
);

CREATE TABLE IF NOT EXISTS courses (
  id CHAR(80) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  course_code VARCHAR(40) NOT NULL,
  normalized_course_code VARCHAR(40) NOT NULL,
  course_name VARCHAR(160) NULL,
  department VARCHAR(40) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_courses_school FOREIGN KEY (school_id) REFERENCES schools(id),
  UNIQUE KEY uq_courses_school_normalized (school_id, normalized_course_code),
  INDEX idx_courses_department (department)
);

CREATE TABLE IF NOT EXISTS product_courses (
  product_id CHAR(64) NOT NULL,
  course_id CHAR(80) NOT NULL,
  PRIMARY KEY (product_id, course_id),
  CONSTRAINT fk_product_courses_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_courses_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_product_courses_course_id (course_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id CHAR(64) NOT NULL,
  product_id CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_favorites_product_id (product_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id CHAR(64) PRIMARY KEY,
  product_id CHAR(64) NOT NULL,
  buyer_id CHAR(64) NOT NULL,
  seller_id CHAR(64) NOT NULL,
  last_message_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_conversations_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_conversations_buyer FOREIGN KEY (buyer_id) REFERENCES users(id),
  CONSTRAINT fk_conversations_seller FOREIGN KEY (seller_id) REFERENCES users(id),
  UNIQUE KEY uq_conversations_product_buyer_seller (product_id, buyer_id, seller_id),
  INDEX idx_conversations_buyer_id (buyer_id),
  INDEX idx_conversations_seller_id (seller_id),
  INDEX idx_conversations_last_message_at (last_message_at)
);

CREATE TABLE IF NOT EXISTS messages (
  id CHAR(64) PRIMARY KEY,
  conversation_id CHAR(64) NOT NULL,
  sender_id CHAR(64) NOT NULL,
  content TEXT NOT NULL,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id),
  INDEX idx_messages_conversation_created (conversation_id, created_at),
  INDEX idx_messages_sender_id (sender_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id CHAR(64) PRIMARY KEY,
  reporter_id CHAR(64) NOT NULL,
  product_id CHAR(64) NULL,
  reported_user_id CHAR(64) NULL,
  reason VARCHAR(80) NOT NULL,
  detail TEXT NULL,
  status ENUM('open','reviewing','resolved','dismissed') NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id),
  CONSTRAINT fk_reports_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_reports_reported_user FOREIGN KEY (reported_user_id) REFERENCES users(id),
  INDEX idx_reports_reporter_id (reporter_id),
  INDEX idx_reports_product_id (product_id),
  INDEX idx_reports_reported_user_id (reported_user_id),
  INDEX idx_reports_status (status)
);
