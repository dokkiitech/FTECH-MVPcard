"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface UserData {
  name: string
  major: string
  role: "student" | "teacher"
  registrationPassword?: string
}

interface AuthContextType {
  user: any
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: UserData) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, userData: UserData) => {
    try {
      console.log("Starting Firebase user creation...")
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log("Firebase user created successfully:", userCredential.user.uid)

      // データベースにユーザー情報を保存
      const endpoint = userData.role === "student" ? "/api/auth/register/student" : "/api/auth/register/teacher"
      console.log("Calling endpoint:", endpoint)

      const token = await userCredential.user.getIdToken()
      console.log("Got ID token")

      const requestBody = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        ...userData,
      }
      console.log("Request body:", requestBody)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      console.log("API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("API error response:", errorData)

        // Firebase Authからユーザーを削除（ロールバック）
        try {
          await userCredential.user.delete()
          console.log("Firebase user deleted due to API error")
        } catch (deleteError) {
          console.error("Failed to delete Firebase user:", deleteError)
        }

        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const responseData = await response.json()
      console.log("API success response:", responseData)
    } catch (error: any) {
      console.error("SignUp error details:", error)

      // Firebaseエラーを日本語メッセージに変換
      if (error.code === "auth/email-already-in-use") {
        throw new Error("このメールアドレスは既に使用されています")
      } else if (error.code === "auth/weak-password") {
        throw new Error("パスワードが弱すぎます。6文字以上で設定してください")
      } else if (error.code === "auth/invalid-email") {
        throw new Error("無効なメールアドレスです")
      } else if (error.message.includes("API error")) {
        throw new Error(`データベース保存エラー: ${error.message}`)
      } else {
        throw new Error(error.message || "登録に失敗しました")
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      // Firebaseエラーを日本語メッセージに変換
      if (error.code === "auth/user-not-found") {
        throw new Error("このメールアドレスは登録されていません")
      } else if (error.code === "auth/wrong-password") {
        throw new Error("パスワードが間違っています")
      } else if (error.code === "auth/invalid-email") {
        throw new Error("無効なメールアドレスです")
      } else if (error.code === "auth/too-many-requests") {
        throw new Error("ログイン試行回数が多すぎます。しばらく待ってから再試行してください")
      } else {
        throw new Error(error.message || "ログインに失敗しました")
      }
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
