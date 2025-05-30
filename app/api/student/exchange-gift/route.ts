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
        SELECT id, used_by, expires_at
        FROM one_time_codes 
        WHERE code = ? AND type = 'gift'
      `,
        [code],
      )

      const codeData = (codeResult as any[])[0]

      if (!codeData) {
        await connection.rollback()
        return NextResponse.json({ error: "Invalid gift code" }, { status: 400 })
      }

      if (codeData.used_by) {
        await connection.rollback()
        return NextResponse.json({ error: "Gift code already used" }, { status: 400 })
      }

      if (new Date() > new Date(codeData.expires_at)) {
        await connection.rollback()
        return NextResponse.json({ error: "Gift code expired" }, { status: 400 })
      }

      // 完成済み・未交換のカードを探す
      const [completedCards] = await connection.execute(
        `
        SELECT id
        FROM stamp_cards
        WHERE student_id = ? AND is_completed = TRUE AND is_exchanged = FALSE
        LIMIT 1
      `,
        [studentId],
      )

      if ((completedCards as any[]).length === 0) {
        await connection.rollback()
        return NextResponse.json({ error: "No completed cards available for exchange" }, { status: 400 })
      }

      const cardId = (completedCards as any[])[0].id

      // ギフト名（仮）
      const giftName = code.startsWith("GIFT") ? "ギフトカード" : "Unknown Gift"

      // ギフト交換を記録
      await connection.execute(
        `
        INSERT INTO gift_exchanges (student_id, card_id, gift_name, exchange_code)
        VALUES (?, ?, ?, ?)
      `,
        [studentId, cardId, giftName, code],
      )

      // カードを交換済みにマーク
      await connection.execute(
        `
        UPDATE stamp_cards
        SET is_exchanged = TRUE, exchanged_at = NOW()
        WHERE id = ?
      `,
        [cardId],
      )

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
        message: "Gift exchanged successfully",
        giftName,
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error exchanging gift:", error)
    return NextResponse.json({ error: "Failed to exchange gift" }, { status: 500 })
  }
}
