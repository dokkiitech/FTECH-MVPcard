import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/api-utils"
import pool from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Stamp code usage request started ===")

    const decodedToken = await verifyAuthToken(request)
    const studentId = decodedToken.uid
    console.log("Student ID:", studentId)

    const { code } = await request.json()
    console.log("Received code:", code)

    if (!code) {
      console.log("Error: No code provided")
      return NextResponse.json({ error: "Code is required" }, { status: 400 })
    }

    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()
      console.log("Transaction started")

      // コードの確認
      console.log("Checking code in database...")
      const [codeResult] = await connection.execute(
        `
        SELECT id, stamp_image_id, used_by, expires_at, created_at
        FROM one_time_codes 
        WHERE code = ? AND type = 'stamp'
      `,
        [code],
      )

      console.log("Code query result:", codeResult)
      const codeData = (codeResult as any[])[0]

      if (!codeData) {
        console.log("Error: Code not found in database")
        await connection.rollback()
        return NextResponse.json({ error: "Invalid code" }, { status: 400 })
      }

      console.log("Code data:", codeData)

      if (codeData.used_by) {
        console.log("Error: Code already used by:", codeData.used_by)
        await connection.rollback()
        return NextResponse.json({ error: "Code already used" }, { status: 400 })
      }

      const currentTime = new Date()
      const expiresAt = new Date(codeData.expires_at)
      console.log("Current time:", currentTime)
      console.log("Expires at:", expiresAt)

      if (currentTime > expiresAt) {
        console.log("Error: Code expired")
        await connection.rollback()
        return NextResponse.json({ error: "Code expired" }, { status: 400 })
      }

      // 未完成のスタンプカードを探す
      console.log("Looking for incomplete cards...")
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

      console.log("Incomplete cards query result:", incompleteCards)
      const targetCard = (incompleteCards as any[])[0]

      if (!targetCard) {
        console.log("Error: No available card slots")
        await connection.rollback()
        return NextResponse.json({ error: "No available card slots" }, { status: 400 })
      }

      console.log("Target card:", targetCard)
      const nextPosition = targetCard.stamp_count + 1
      console.log("Next position:", nextPosition)

      // スタンプを追加
      console.log("Adding stamp...")
      await connection.execute(
        `
        INSERT INTO stamps (card_id, stamp_image_id, position, issued_by)
        VALUES (?, ?, ?, ?)
      `,
        [targetCard.id, codeData.stamp_image_id, nextPosition, studentId], // issued_byをstudentIdに修正
      )

      console.log("Stamp added successfully")

      // カードが完成した場合の処理
      if (nextPosition === 3) {
        console.log("Card completed, updating card status...")
        // 現在のカードを完成済みにマーク
        await connection.execute(
          `
          UPDATE stamp_cards 
          SET is_completed = TRUE, completed_at = NOW()
          WHERE id = ?
        `,
          [targetCard.id],
        )

        // 新しいアクティブカードを作成
        await connection.execute(
          `
          INSERT INTO stamp_cards (student_id)
          VALUES (?)
        `,
          [studentId],
        )

        console.log("Card completed and new card created for student:", studentId)
      }

      // コードを使用済みにマーク
      console.log("Marking code as used...")
      await connection.execute(
        `
        UPDATE one_time_codes 
        SET used_by = ?, used_at = NOW()
        WHERE id = ?
      `,
        [studentId, codeData.id],
      )

      await connection.commit()
      console.log("Transaction committed successfully")

      return NextResponse.json({
        success: true,
        message: "Stamp added successfully",
        cardCompleted: nextPosition === 3,
        newCardCreated: nextPosition === 3,
      })
    } catch (error) {
      console.error("Error in transaction:", error)
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
