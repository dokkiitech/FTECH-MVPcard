import mysql from "mysql2/promise"

console.log("Database configuration:", {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  database: process.env.DB_NAME || "gakusta_mvp",
  hasPassword: !!process.env.DB_PASSWORD,
})

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gakusta_mvp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export default pool
