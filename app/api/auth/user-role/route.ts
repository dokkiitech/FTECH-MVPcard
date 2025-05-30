import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/api-utils"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("User role API called")

    // 認証トークンの検証
    const decodedToken = await verifyAuthToken(request)
    console.log("Token verified for user:", decodedToken.uid)

    // データベース接続を取得
    const connection = await pool.getConnection()

    try {
      // ユーザーの役割を取得
      const [users] = await connection.query("SELECT role FROM users WHERE id = ?", [decodedToken.uid])

      if ((users as any[]).length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const userRole = (users as any[])[0].role
      console.log("User role found:", userRole)

      return NextResponse.json({ role: userRole })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error getting user role:", error)
    return NextResponse.json({ error: "Failed to get user role" }, { status: 500 })
  }
}
