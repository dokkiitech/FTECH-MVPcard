import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/api-utils"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("Teacher stats API called")

    // 認証トークンの検証
    const decodedToken = await verifyAuthToken(request)
    console.log("Token verified for teacher stats API:", decodedToken.uid)

    let connection
    try {
      console.log("Getting database connection for stats...")
      connection = await pool.getConnection()
      console.log("Database connection established for stats")
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        {
          error: "データベース接続に失敗しました",
          details: dbError.message,
        },
        { status: 500 },
      )
    }

    try {
      console.log("Executing stats queries...")

      // 総学生数
      console.log("Querying total students...")
      const [totalStudentsResult] = await connection.query(`
        SELECT COUNT(*) as count FROM users WHERE role = 'student'
      `)
      console.log("Total students result:", totalStudentsResult)
      const totalStudents = (totalStudentsResult as any[])[0].count

      // アクティブカード数（未完成）
      console.log("Querying active cards...")
      const [activeCardsResult] = await connection.query(`
        SELECT COUNT(*) as count FROM stamp_cards WHERE is_completed = FALSE
      `)
      console.log("Active cards result:", activeCardsResult)
      const activeCards = (activeCardsResult as any[])[0].count

      // 完成カード数
      console.log("Querying completed cards...")
      const [completedCardsResult] = await connection.query(`
        SELECT COUNT(*) as count FROM stamp_cards WHERE is_completed = TRUE
      `)
      console.log("Completed cards result:", completedCardsResult)
      const completedCards = (completedCardsResult as any[])[0].count

      // 発行スタンプ数
      console.log("Querying stamps issued...")
      const [stampsIssuedResult] = await connection.query(`
        SELECT COUNT(*) as count FROM stamps
      `)
      console.log("Stamps issued result:", stampsIssuedResult)
      const stampsIssued = (stampsIssuedResult as any[])[0].count

      // 学生一覧（進捗付き）
      console.log("Querying students with progress...")
      const [studentsResult] = await connection.query(`
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
      console.log("Students query completed, found:", (studentsResult as any[]).length)

      const response = {
        stats: {
          totalStudents,
          activeCards,
          completedCards,
          stampsIssued,
        },
        students: studentsResult,
      }

      console.log("Stats API response prepared")
      return NextResponse.json(response)
    } catch (queryError) {
      console.error("Stats query error:", queryError)
      return NextResponse.json(
        {
          error: "統計情報の取得に失敗しました",
          details: queryError.message,
        },
        { status: 500 },
      )
    } finally {
      if (connection) {
        connection.release()
        console.log("Database connection released for stats")
      }
    }
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      {
        error: "統計情報の取得に失敗しました",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
