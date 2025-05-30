import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/api-utils"
import pool from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request)
    const studentId = decodedToken.uid
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 })
    }

    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // コードの確認
      const [codeResult] = await connection.execute(
        `
        SELECT id, stamp_image_id, used_by, expires_at
        FROM one_time_codes 
        WHERE code = ? AND type = 'stamp'
      `,
        [code],
      )

      const codeData = (codeResult as any[])[0]

      if (!codeData) {
        await connection.rollback()
        return NextResponse.json({ error: "Invalid code" }, { status: 400 })
      }

      if (codeData.used_by) {
        await connection.rollback()
        return NextResponse.json({ error: "Code already used" }, { status: 400 })
      }

      if (new Date() > new Date(codeData.expires_at)) {
        await connection.rollback()
        return NextResponse.json({ error: "Code expired" }, { status: 400 })
      }

      // 未完成のスタンプカードを探す
      const [incompleteCards] = await connection.execute(
        `
        SELECT sc.id, COUNT(s.id) as stamp_count
        FROM stamp_cards sc
        LEFT JOIN stamps s ON sc.id = s.card_id
        WHERE sc.student_id = ? AND sc.is_completed = FALSE
        GROUP BY sc.id
        HAVING stamp_count < 3
        ORDER BY sc.created_at
        LIMIT 1
      `,
        [studentId],
      )

      const targetCard = (incompleteCards as any[])[0]

      if (!targetCard) {
        await connection.rollback()
        return NextResponse.json({ error: "No available card slots" }, { status: 400 })
      }

      const nextPosition = targetCard.stamp_count + 1

      // スタンプを追加
      await connection.execute(
        `
        INSERT INTO stamps (card_id, stamp_image_id, position, issued_by)
        VALUES (?, ?, ?, ?)
      `,
        [targetCard.id, codeData.stamp_image_id, nextPosition, decodedToken.uid],
      )

      // カードが完成した場合の処理
      if (nextPosition === 3) {
        await connection.execute(
          `
          UPDATE stamp_cards 
          SET is_completed = TRUE, completed_at = NOW()
          WHERE id = ?
        `,
          [targetCard.id],
        )
      }

      // コードを使用済みにマーク
      await connection.execute(
        `
        UPDATE one_time_codes 
        SET used_by = ?, used_at = NOW()
        WHERE id = ?
      `,
        [studentId, codeData.id],
      )

      await connection.commit()

      return NextResponse.json({
        success: true,
        message: "Stamp added successfully",
        cardCompleted: nextPosition === 3,
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error using stamp code:", error)
    return NextResponse.json({ error: "Failed to use stamp code" }, { status: 500 })
  }
}
