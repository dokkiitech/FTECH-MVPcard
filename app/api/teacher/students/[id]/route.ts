import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/api-utils"
import pool from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Student detail API called for ID:", params.id)

    // 認証トークンの検証
    const decodedToken = await verifyAuthToken(request)
    console.log("Token verified for teacher:", decodedToken.uid)

    const studentId = params.id

    const connection = await pool.getConnection()

    try {
      // 学生の基本情報を取得
      const [studentResult] = await connection.execute(
        `
        SELECT id, name, major, email, created_at
        FROM users 
        WHERE id = ? AND role = 'student'
      `,
        [studentId],
      )

      const student = (studentResult as any[])[0]

      if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 })
      }

      // 学生のスタンプカード詳細を取得
      const [cardsResult] = await connection.execute(
        `
        SELECT 
          sc.id,
          sc.is_completed,
          sc.is_exchanged,
          sc.completed_at,
          sc.exchanged_at,
          sc.created_at,
          COUNT(s.id) as stamp_count
        FROM stamp_cards sc
        LEFT JOIN stamps s ON sc.id = s.card_id
        WHERE sc.student_id = ?
        GROUP BY sc.id
        ORDER BY sc.created_at DESC
      `,
        [studentId],
      )

      // 各カードのスタンプ詳細を取得
      const cardsWithStamps = await Promise.all(
        (cardsResult as any[]).map(async (card) => {
          const [stamps] = await connection.execute(
            `
            SELECT 
              s.position,
              s.created_at as stamp_created_at,
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

      // ギフト交換履歴を取得
      const [giftsResult] = await connection.execute(
        `
        SELECT 
          ge.id,
          ge.gift_name,
          ge.exchanged_at,
          ge.exchange_code,
          ge.card_id
        FROM gift_exchanges ge
        WHERE ge.student_id = ?
        ORDER BY ge.exchanged_at DESC
      `,
        [studentId],
      )

      // 統計情報を計算
      const totalStamps = cardsWithStamps.reduce((sum, card) => sum + card.stamp_count, 0)
      const completedCards = cardsWithStamps.filter((card) => card.is_completed && !card.is_exchanged).length
      const activeCards = cardsWithStamps.filter((card) => !card.is_completed && !card.is_exchanged).length
      const exchangedCards = cardsWithStamps.filter((card) => card.is_exchanged).length

      const response = {
        student: {
          ...student,
          stats: {
            totalStamps,
            completedCards,
            activeCards,
            exchangedCards,
          },
        },
        cards: cardsWithStamps,
        gifts: giftsResult,
      }

      return NextResponse.json(response)
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error fetching student details:", error)
    return NextResponse.json({ error: "Failed to fetch student details" }, { status: 500 })
  }
}
