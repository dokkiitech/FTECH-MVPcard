-- ユーザーテーブル（Firebase UIDのみ保存）
CREATE TABLE users (
  id VARCHAR(128) PRIMARY KEY, -- Firebase UID
  role ENUM('student', 'teacher') NOT NULL,
  name VARCHAR(100) NOT NULL,
  major VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- スタンプ画像テーブル
CREATE TABLE stamp_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  created_by VARCHAR(128) NOT NULL, -- teacher's Firebase UID
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- スタンプカードテーブル
CREATE TABLE stamp_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(128) NOT NULL, -- Firebase UID
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  is_exchanged BOOLEAN DEFAULT FALSE,
  exchanged_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- スタンプテーブル
CREATE TABLE stamps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id INT NOT NULL,
  stamp_image_id INT NOT NULL,
  position INT NOT NULL, -- 1, 2, 3 (カード内の位置)
  issued_by VARCHAR(128) NOT NULL, -- teacher's Firebase UID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES stamp_cards(id),
  FOREIGN KEY (stamp_image_id) REFERENCES stamp_images(id),
  FOREIGN KEY (issued_by) REFERENCES users(id),
  UNIQUE KEY unique_card_position (card_id, position)
);

-- ワンタイムコードテーブル
CREATE TABLE one_time_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  type ENUM('stamp', 'gift') NOT NULL,
  stamp_image_id INT NULL, -- スタンプコードの場合のみ
  created_by VARCHAR(128) NOT NULL, -- teacher's Firebase UID
  used_by VARCHAR(128) NULL, -- student's Firebase UID
  used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stamp_image_id) REFERENCES stamp_images(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (used_by) REFERENCES users(id)
);

-- ギフト交換履歴テーブル
CREATE TABLE gift_exchanges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(128) NOT NULL,
  card_id INT NOT NULL,
  gift_name VARCHAR(100) NOT NULL,
  exchange_code VARCHAR(20) NOT NULL,
  exchanged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (card_id) REFERENCES stamp_cards(id)
);

-- インデックス
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_stamp_cards_student ON stamp_cards(student_id);
CREATE INDEX idx_stamps_card ON stamps(card_id);
CREATE INDEX idx_codes_type ON one_time_codes(type);
CREATE INDEX idx_codes_used ON one_time_codes(used_by);
