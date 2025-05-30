import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/api-utils"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    // 認証トークンの検証
    const decodedToken = await verifyAuthToken(request)
    console.log("Token verified for file upload:", decodedToken.uid)

    // FormDataを取得
    const formData = await request.formData()
    const file = formData.get("file") as File
    const fileName = formData.get("fileName") as string

    if (!file || !fileName) {
      return NextResponse.json({ error: "File and fileName are required" }, { status: 400 })
    }

    // ファイルの検証
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    // ファイルサイズの制限（5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // ファイル名を安全にする
    const timestamp = Date.now()
    const fileExtension = path.extname(file.name)
    const safeFileName = `${timestamp}_${fileName.replace(/[^a-zA-Z0-9]/g, "_")}${fileExtension}`

    // アップロードディレクトリのパス
    const uploadDir = path.join(process.cwd(), "public", "stamps")

    // ディレクトリが存在しない場合は作成
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      console.error("Error creating upload directory:", error)
    }

    // ファイルパス
    const filePath = path.join(uploadDir, safeFileName)

    // ファイルを保存
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 公開URLパス
    const publicPath = `/stamps/${safeFileName}`

    console.log("File uploaded successfully:", publicPath)

    return NextResponse.json({
      success: true,
      imagePath: publicPath,
      fileName: safeFileName,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
