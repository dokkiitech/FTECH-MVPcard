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
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
})

// 接続テスト
pool
  .getConnection()
  .then((connection) => {
    console.log("Database connection test successful")
    connection.release()
  })
  .catch((error) => {
    console.error("Database connection test failed:", error)
  })

export default pool
