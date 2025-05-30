import mysql from "mysql2/promise"

// データベース設定のログ出力（デバッグ用）
console.log("Database configuration:", {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  database: process.env.DB_NAME || "gakusta_mvp",
  hasPassword: !!process.env.DB_PASSWORD,
})

// DB_HOSTからプロトコルとパスを除去してホスト名のみを抽出
function extractHostname(dbHost: string): string {
  if (!dbHost) return "localhost"

  // URLの場合はホスト名のみを抽出
  try {
    const url = new URL(dbHost.startsWith("http") ? dbHost : `https://${dbHost}`)
    return url.hostname
  } catch {
    // URLとして解析できない場合はそのまま返す
    return dbHost.replace(/^https?:\/\//, "").split("/")[0]
  }
}

const dbHost = extractHostname(process.env.DB_HOST || "localhost")

console.log("Extracted database host:", dbHost)

const pool = mysql.createPool({
  host: dbHost,
  port: 3306, // MariaDBの標準ポート
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gakusta_mvp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// データベーススキーマの初期化
async function initializeDatabase() {
  let connection
  try {
    console.log("Initializing database schema...")
    connection = await pool.getConnection()

    // データベースが存在するか確認
    const [databases] = await connection.execute(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [process.env.DB_NAME || "gakusta_mvp"],
    )

    if ((databases as any[]).length === 0) {
      console.log(`Database ${process.env.DB_NAME || "gakusta_mvp"} does not exist, creating...`)
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "gakusta_mvp"}\``)
      await connection.execute(`USE \`${process.env.DB_NAME || "gakusta_mvp"}\``)
    }

    // 必要なテーブルのリスト
    const requiredTables = ["users", "stamp_images", "stamp_cards", "stamps", "one_time_codes", "gift_exchanges"]

    // 各テーブルの存在確認と作成
    for (const tableName of requiredTables) {
      const [tableExists] = await connection.execute(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [process.env.DB_NAME || "gakusta_mvp", tableName],
      )

      if ((tableExists as any[]).length === 0) {
        console.log(`Table ${tableName} does not exist, creating...`)

        switch (tableName) {
          case "users":
            await connection.execute(`
              CREATE TABLE users (
                id VARCHAR(128) PRIMARY KEY,
                role ENUM('student', 'teacher') NOT NULL,
                name VARCHAR(100) NOT NULL,
                major VARCHAR(100),
                email VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_users_role (role),
                UNIQUE KEY unique_email (email)
              )
            `)
            break

          case "stamp_images":
            await connection.execute(`
              CREATE TABLE stamp_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                image_url VARCHAR(500) NOT NULL,
                created_by VARCHAR(128) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
              )
            `)
            break

          case "stamp_cards":
            await connection.execute(`
              CREATE TABLE stamp_cards (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(128) NOT NULL,
                is_completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP NULL,
                is_exchanged BOOLEAN DEFAULT FALSE,
                exchanged_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_stamp_cards_student (student_id)
              )
            `)
            break

          case "stamps":
            await connection.execute(`
              CREATE TABLE stamps (
                id INT AUTO_INCREMENT PRIMARY KEY,
                card_id INT NOT NULL,
                stamp_image_id INT NOT NULL,
                position INT NOT NULL,
                issued_by VARCHAR(128) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (card_id) REFERENCES stamp_cards(id) ON DELETE CASCADE,
                FOREIGN KEY (stamp_image_id) REFERENCES stamp_images(id) ON DELETE CASCADE,
                FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_card_position (card_id, position),
                INDEX idx_stamps_card (card_id)
              )
            `)
            break

          case "one_time_codes":
            await connection.execute(`
              CREATE TABLE one_time_codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(20) UNIQUE NOT NULL,
                type ENUM('stamp', 'gift') NOT NULL,
                stamp_image_id INT NULL,
                created_by VARCHAR(128) NOT NULL,
                used_by VARCHAR(128) NULL,
                used_at TIMESTAMP NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (stamp_image_id) REFERENCES stamp_images(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_codes_type (type),
                INDEX idx_codes_used (used_by)
              )
            `)
            break

          case "gift_exchanges":
            await connection.execute(`
              CREATE TABLE gift_exchanges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(128) NOT NULL,
                card_id INT NOT NULL,
                gift_name VARCHAR(100) NOT NULL,
                exchange_code VARCHAR(20) NOT NULL,
                exchanged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (card_id) REFERENCES stamp_cards(id) ON DELETE CASCADE
              )
            `)
            break
        }

        console.log(`Table ${tableName} created successfully`)
      } else {
        console.log(`Table ${tableName} already exists`)
      }
    }

    console.log("Database initialization completed successfully")
  } catch (error) {
    console.error("Database initialization failed:", error)
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

// 接続テストと初期化
pool
  .getConnection()
  .then(async (connection) => {
    console.log("Database connection test successful")
    connection.release()
    // データベース初期化を実行
    await initializeDatabase()
  })
  .catch((error) => {
    console.error("Database connection test failed:", error)
  })

export default pool
