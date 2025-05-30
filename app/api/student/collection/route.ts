import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/api-utils"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request)
    const studentId = decodedToken.uid

    const connection = await pool.getConnection()

    try {
      // ギフト交換履歴を取得
      const [gifts] = await connection.execute(
        `
        SELECT 
          ge.id,
          ge.gift_name,
          ge.exchanged_at,
          ge.card_id
        FROM gift_exchanges ge
        WHERE ge.student_id = ?
        ORDER BY ge.exchanged_at DESC
      `,
        [studentId],
      )

      return NextResponse.json({ gifts })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error fetching collection:", error)
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 })
  }
}
