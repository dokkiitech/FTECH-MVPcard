import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/api-utils"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request)

    const connection = await pool.getConnection()

    try {
      // 総学生数
      const [totalStudentsResult] = await connection.execute(`
        SELECT COUNT(*) as count FROM users WHERE role = 'student'
      `)
      const totalStudents = (totalStudentsResult as any[])[0].count

      // アクティブカード数（未完成）
      const [activeCardsResult] = await connection.execute(`
        SELECT COUNT(*) as count FROM stamp_cards WHERE is_completed = FALSE
      `)
      const activeCards = (activeCardsResult as any[])[0].count

      // 完成カード数
      const [completedCardsResult] = await connection.execute(`
        SELECT COUNT(*) as count FROM stamp_cards WHERE is_completed = TRUE
      `)
      const completedCards = (completedCardsResult as any[])[0].count

      // 発行スタンプ数
      const [stampsIssuedResult] = await connection.execute(`
        SELECT COUNT(*) as count FROM stamps
      `)
      const stampsIssued = (stampsIssuedResult as any[])[0].count

      // 学生一覧（進捗付き）
      const [studentsResult] = await connection.execute(`
        SELECT 
          u.id,
          u.name,
          u.major,
          COUNT(DISTINCT s.id) as total_stamps,
          COUNT(DISTINCT CASE WHEN sc.is_completed = TRUE THEN sc.id END) as completed_cards
        FROM users u
        LEFT JOIN stamp_cards sc ON u.id = sc.student_id
        LEFT JOIN stamps s ON sc.id = s.card_id
        WHERE u.role = 'student'
        GROUP BY u.id, u.name, u.major
        ORDER BY total_stamps DESC
      `)

      return NextResponse.json({
        stats: {
          totalStudents,
          activeCards,
          completedCards,
          stampsIssued,
        },
        students: studentsResult,
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
