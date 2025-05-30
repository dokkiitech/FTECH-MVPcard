import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/api-utils"
import pool from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request)

    const connection = await pool.getConnection()

    try {
      // スタンプ画像一覧を取得
      const [stampImages] = await connection.execute(`
        SELECT id, name, image_url, is_active
        FROM stamp_images
        ORDER BY created_at DESC
      `)

      return NextResponse.json({ stampImages })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error fetching stamp images:", error)
    return NextResponse.json({ error: "Failed to fetch stamp images" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request)
    const teacherId = decodedToken.uid
    const { name, imageUrl } = await request.json()

    if (!name || !imageUrl) {
      return NextResponse.json({ error: "Name and image URL are required" }, { status: 400 })
    }

    const connection = await pool.getConnection()

    try {
      // スタンプ画像を保存
      const [result] = await connection.execute(
        `
        INSERT INTO stamp_images (name, image_url, created_by)
        VALUES (?, ?, ?)
      `,
        [name, imageUrl, teacherId],
      )

      return NextResponse.json({
        success: true,
        stampImageId: (result as any).insertId,
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error creating stamp image:", error)
    return NextResponse.json({ error: "Failed to create stamp image" }, { status: 500 })
  }
}
