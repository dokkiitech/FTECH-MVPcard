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
      const code = generateCode(type)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7日後に期限切れ

      await connection.execute(
        `
        INSERT INTO one_time_codes (code, type, stamp_image_id, created_by, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `,
        [code, type, stampImageId || null, teacherId, expiresAt],
      )

      return NextResponse.json({
        success: true,
        code,
        expiresAt: expiresAt.toISOString(),
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error generating code:", error)
    return NextResponse.json({ error: "Failed to generate code" }, { status: 500 })
  }
}
