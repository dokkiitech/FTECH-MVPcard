import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"

const TEACHER_REGISTRATION_PASSWORD = process.env.TEACHER_REGISTRATION_PASSWORD || "teacher123"

export async function POST(request: NextRequest) {
  try {
    const { uid, email, name, registrationPassword } = await request.json()

    if (!uid || !email || !name || !registrationPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 先生用登録パスワードの確認
    if (registrationPassword !== TEACHER_REGISTRATION_PASSWORD) {
      return NextResponse.json({ error: "Invalid registration password" }, { status: 403 })
    }

    const connection = await pool.getConnection()

    try {
      await connection.execute("INSERT INTO users (id, role, name, email) VALUES (?, ?, ?, ?)", [
        uid,
        "teacher",
        name,
        email,
      ])

      return NextResponse.json({ success: true })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Teacher registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
