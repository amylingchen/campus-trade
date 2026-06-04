USE campus_trade;

INSERT INTO schools (id, name, short_name, email_domain, city, state, logo_url, is_active, created_at)
VALUES
  ('school_uta', 'University of Texas at Arlington', 'UTA', 'mavs.uta.edu', 'Arlington', 'TX', NULL, TRUE, NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), email_domain = VALUES(email_domain), is_active = VALUES(is_active);

INSERT INTO courses (id, school_id, course_code, normalized_course_code, course_name, department, created_at)
VALUES
  ('course_cse3442', 'school_uta', 'CSE 3442', 'CSE3442', 'Embedded Systems', 'CSE', NOW()),
  ('course_cse1320', 'school_uta', 'CSE 1320', 'CSE1320', 'Intermediate Programming', 'CSE', NOW()),
  ('course_phys1444', 'school_uta', 'PHYS 1444', 'PHYS1444', 'General Technical Physics II', 'PHYS', NOW())
ON DUPLICATE KEY UPDATE course_name = VALUES(course_name), department = VALUES(department);

-- Demo password for both users is: password123
INSERT INTO users (id, school_id, name, email, password_hash, major, verified_student, verification_status, created_at, updated_at)
VALUES
  ('user_1', 'school_uta', 'Alex Chen', 'alex@mavs.uta.edu', '$2a$10$ngTNL97WJax1VK34eyQJe.HWuvMD1cD0B0gAubBCFa6MWIBunlyge', 'Computer Science', TRUE, 'verified', NOW(), NOW()),
  ('user_2', 'school_uta', 'Maya Patel', 'maya@mavs.uta.edu', '$2a$10$ngTNL97WJax1VK34eyQJe.HWuvMD1cD0B0gAubBCFa6MWIBunlyge', 'Computer Science', TRUE, 'verified', NOW(), NOW())
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), verified_student = VALUES(verified_student), verification_status = VALUES(verification_status);

INSERT INTO products (id, school_id, seller_id, title, description, price, category, usage_type, condition_value, status, location, negotiable, is_course_related, created_at, updated_at)
VALUES
  ('listing_1', 'school_uta', 'user_1', 'Raspberry Pi 4 Kit', 'Includes Pi 4, case, charger, SD card, GPIO ribbon, and sensors.', 45.00, 'course_materials', 'course_required', 'good', 'available', 'Central Library', TRUE, TRUE, NOW(), NOW()),
  ('listing_2', 'school_uta', 'user_2', 'Desk Chair', 'Adjustable chair with armrests. Solid for apartment or dorm study setup.', 25.00, 'furniture', 'personal_sale', 'good', 'available', 'The Heights on Pecan', TRUE, FALSE, NOW(), NOW())
ON DUPLICATE KEY UPDATE title = VALUES(title), price = VALUES(price), status = VALUES(status);

INSERT INTO product_images (id, product_id, image_url, sort_order, created_at)
VALUES
  ('image_1', 'listing_1', 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80', 1, NOW()),
  ('image_2', 'listing_2', 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=800&q=80', 1, NOW())
ON DUPLICATE KEY UPDATE image_url = VALUES(image_url);

INSERT IGNORE INTO product_courses (product_id, course_id)
VALUES
  ('listing_1', 'course_cse3442');
