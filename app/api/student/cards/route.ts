import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/api-utils"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request)
    const studentId = decodedToken.uid

    const connection = await pool.getConnection()

    try {
      // スタンプカード一覧を取得
      const [cards] = await connection.execute(
        `
        SELECT 
          sc.id,
          sc.is_completed,
          sc.is_exchanged,
          sc.completed_at,
          sc.exchanged_at,
          COUNT(s.id) as stamp_count
        FROM stamp_cards sc
        LEFT JOIN stamps s ON sc.id = s.card_id
        WHERE sc.student_id = ?
        GROUP BY sc.id
        ORDER BY sc.created_at
      `,
        [studentId],
      )

      // 各カードのスタンプ詳細を取得
      const cardsWithStamps = await Promise.all(
        (cards as any[]).map(async (card) => {
          const [stamps] = await connection.execute(
            `
            SELECT 
              s.position,
              si.name as stamp_name,
              si.image_url
            FROM stamps s
            JOIN stamp_images si ON s.stamp_image_id = si.id
            WHERE s.card_id = ?
            ORDER BY s.position
          `,
            [card.id],
          )

          return {
            ...card,
            stamps: stamps,
            maxStamps: 3,
          }
        }),
      )

      return NextResponse.json({ cards: cardsWithStamps })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error fetching cards:", error)
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 })
  }
}
