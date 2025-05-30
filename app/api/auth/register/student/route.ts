import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { uid, email, name, major } = await request.json()

    if (!uid || !email || !name || !major) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const connection = await pool.getConnection()

    try {
      // ユーザーをデータベースに保存
      await connection.execute("INSERT INTO users (id, role, name, major, email) VALUES (?, ?, ?, ?, ?)", [
        uid,
        "student",
        name,
        major,
        email,
      ])

      // 初期スタンプカードを3枚作成
      for (let i = 0; i < 3; i++) {
        await connection.execute("INSERT INTO stamp_cards (student_id) VALUES (?)", [uid])
      }

      return NextResponse.json({ success: true })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
