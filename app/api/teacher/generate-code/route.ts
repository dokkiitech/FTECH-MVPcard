import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken, generateCode } from "@/lib/api-utils"
import pool from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request)
    const teacherId = decodedToken.uid
    const { type, stampImageId } = await request.json()

    if (!type || (type !== "stamp" && type !== "gift")) {
      return NextResponse.json({ error: "Invalid code type" }, { status: 400 })
    }

    if (type === "stamp" && !stampImageId) {
      return NextResponse.json({ error: "Stamp image ID required for stamp codes" }, { status: 400 })
    }

    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // 現在のコード数をチェック
      const [codeCountResult] = await connection.execute(`
        SELECT COUNT(*) as count FROM one_time_codes
      `)
      const currentCount = (codeCountResult as any[])[0].count

      // 1000件を超える場合、最も古いコードを削除
      if (currentCount >= 1000) {
        await connection.execute(
          `
          DELETE FROM one_time_codes 
          WHERE id IN (
            SELECT id FROM (
              SELECT id FROM one_time_codes 
              ORDER BY created_at ASC 
              LIMIT ?
            ) as oldest
          )
        `,
          [currentCount - 999],
        )
        console.log("Deleted old codes to maintain 1000 limit")
      }

      // 新しいコードを生成（重複チェック）
      let code: string
      let isUnique = false
      let attempts = 0

      while (!isUnique && attempts < 100) {
        code = generateCode(type)
        attempts++

        // 重複チェック
        const [existingCodes] = await connection.execute(`SELECT id FROM one_time_codes WHERE code = ?`, [code])

        isUnique = (existingCodes as any[]).length === 0
      }

      if (!isUnique) {
        throw new Error("Failed to generate unique code after 100 attempts")
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7日後に期限切れ

      await connection.execute(
        `
        INSERT INTO one_time_codes (code, type, stamp_image_id, created_by, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `,
        [code, type, stampImageId || null, teacherId, expiresAt],
      )

      await connection.commit()

      return NextResponse.json({
        success: true,
        code,
        expiresAt: expiresAt.toISOString(),
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error generating code:", error)
    return NextResponse.json({ error: "Failed to generate code" }, { status: 500 })
  }
}
