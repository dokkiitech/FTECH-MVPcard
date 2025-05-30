import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/api-utils"
import pool from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    console.log("Student registration API called")

    // リクエストボディを取得
    const body = await request.json()
    console.log("Request body:", body)

    const { uid, email, name, major } = body

    if (!uid || !email || !name || !major) {
      console.error("Missing required fields:", { uid: !!uid, email: !!email, name: !!name, major: !!major })
      return NextResponse.json({ error: "必須フィールドが不足しています" }, { status: 400 })
    }

    // 認証トークンの検証
    try {
      const decodedToken = await verifyAuthToken(request)
      console.log("Token verified for user:", decodedToken.uid)

      if (decodedToken.uid !== uid) {
        console.error("Token UID mismatch:", { tokenUid: decodedToken.uid, bodyUid: uid })
        return NextResponse.json({ error: "認証トークンが一致しません" }, { status: 403 })
      }
    } catch (authError) {
      console.error("Auth token verification failed:", authError)
      return NextResponse.json({ error: "認証トークンが無効です" }, { status: 401 })
    }

    // データベース接続を取得
    let connection
    try {
      console.log("Getting database connection...")
      connection = await pool.getConnection()
      console.log("Database connection established")
    } catch (dbConnError) {
      console.error("Database connection failed:", dbConnError)
      return NextResponse.json(
        {
          error: "データベース接続に失敗しました",
          details: dbConnError.message,
        },
        { status: 500 },
      )
    }

    try {
      // ユーザーが既に存在するかチェック
      console.log("Checking if user already exists...")
      try {
        const [existingUsers] = await connection.execute("SELECT id FROM users WHERE id = ? OR email = ?", [uid, email])
        if ((existingUsers as any[]).length > 0) {
          console.log("User already exists")
          return NextResponse.json({ error: "このユーザーまたはメールアドレスは既に登録されています" }, { status: 409 })
        }
      } catch (checkError) {
        console.error("Error checking existing user:", checkError)
        // テーブルが存在しない場合は続行（初期化処理で作成される）
      }

      // トランザクション開始
      await connection.beginTransaction()

      try {
        // ユーザーをデータベースに保存
        console.log("Inserting user into database...")
        await connection.execute("INSERT INTO users (id, role, name, major, email) VALUES (?, ?, ?, ?, ?)", [
          uid,
          "student",
          name,
          major,
          email,
        ])
        console.log("User inserted successfully")

        // 初期スタンプカードを3枚作成
        console.log("Creating initial stamp cards...")
        for (let i = 0; i < 3; i++) {
          await connection.execute("INSERT INTO stamp_cards (student_id) VALUES (?)", [uid])
        }
        console.log("Initial stamp cards created")

        // トランザクションをコミット
        await connection.commit()
        console.log("Transaction committed successfully")

        return NextResponse.json({ success: true, message: "学生登録が完了しました" })
      } catch (transactionError) {
        // トランザクションをロールバック
        await connection.rollback()
        console.error("Transaction error:", transactionError)
        throw transactionError
      }
    } catch (dbError: any) {
      console.error("Database operation error:", dbError)

      // 重複エラーの場合
      if (dbError.code === "ER_DUP_ENTRY") {
        return NextResponse.json({ error: "このユーザーまたはメールアドレスは既に登録されています" }, { status: 409 })
      }

      return NextResponse.json(
        {
          error: "データベース操作に失敗しました",
          details: dbError.message,
        },
        { status: 500 },
      )
    } finally {
      if (connection) {
        connection.release()
        console.log("Database connection released")
      }
    }
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        error: "登録に失敗しました",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
