import type { NextRequest } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"

// Firebase Admin初期化
if (!getApps().length) {
  try {
    console.log("Initializing Firebase Admin...")
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    })
    console.log("Firebase Admin initialized successfully")
  } catch (error) {
    console.error("Firebase Admin initialization error:", error)
  }
}

export async function verifyAuthToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No valid authorization header")
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    return decodedToken
  } catch (error) {
    console.error("Token verification error:", error)
    throw new Error("Invalid authentication token")
  }
}

export function generateCode(type: "stamp" | "gift"): string {
  // 5桁の数字コードを生成（10000-99999）
  const randomNumber = Math.floor(Math.random() * 90000) + 10000
  return randomNumber.toString()
}
