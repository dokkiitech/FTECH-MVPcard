import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/api-utils"
import pool from "@/lib/database"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decodedToken = await verifyAuthToken(request)
    const stampId = Number.parseInt(params.id)
    const { isActive } = await request.json()

    if (isActive === undefined) {
      return NextResponse.json({ error: "isActive field is required" }, { status: 400 })
    }

    const connection = await pool.getConnection()

    try {
      // スタンプ画像の状態を更新
      await connection.execute(
        `
        UPDATE stamp_images
        SET is_active = ?
        WHERE id = ?
      `,
        [isActive, stampId],
      )

      return NextResponse.json({
        success: true,
        message: `Stamp image ${isActive ? "activated" : "deactivated"} successfully`,
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error updating stamp image:", error)
    return NextResponse.json({ error: "Failed to update stamp image" }, { status: 500 })
  }
}
