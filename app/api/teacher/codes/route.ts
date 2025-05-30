import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/api-utils"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request)

    const connection = await pool.getConnection()

    try {
      // コード一覧を取得
      const [codes] = await connection.execute(`
        SELECT 
          id,
          code,
          type,
          used_by IS NOT NULL as used,
          used_by,
          used_at,
          created_at
        FROM one_time_codes
        ORDER BY created_at DESC
      `)

      return NextResponse.json({ codes })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error fetching codes:", error)
    return NextResponse.json({ error: "Failed to fetch codes" }, { status: 500 })
  }
}
