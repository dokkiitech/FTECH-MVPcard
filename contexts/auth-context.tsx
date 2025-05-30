"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail, // 追加
} from "firebase/auth"
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
  userRole: "student" | "teacher" | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: UserData) => Promise<void>
  logout: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void> // 追加
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState<"student" | "teacher" | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser?.uid)
      setUser(currentUser)

      if (currentUser) {
        try {
          const token = await currentUser.getIdToken()
          const response = await fetch("/api/auth/user-role", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            console.log("User role:", data.role)
            setUserRole(data.role)
          } else {
            console.error("Failed to get user role:", response.status)
            setUserRole(null)
          }
        } catch (error) {
          console.error("Error getting user role:", error)
          setUserRole(null)
        }
      } else {
        setUserRole(null)
      }

      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, userData: UserData) => {
    try {
      console.log("Starting Firebase user creation...")
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log("Firebase user created successfully:", userCredential.user.uid)

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
      setUserRole(userData.role)
    } catch (error: any) {
      console.error("SignUp error details:", error)
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
      console.log("Signing in user...")
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("User signed in successfully:", userCredential.user.uid)
      try {
        const token = await userCredential.user.getIdToken()
        const response = await fetch("/api/auth/user-role", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log("User role on login:", data.role)
          setUserRole(data.role)
        }
      } catch (roleError) {
        console.error("Error getting user role on login:", roleError)
      }
    } catch (error: any) {
      console.error("SignIn error:", error)
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
    try {
      console.log("Logging out user...")
      await signOut(auth)
      setUserRole(null)
      console.log("User logged out successfully")
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  // パスワードリセットメール送信関数
  const sendPasswordReset = async (email: string) => {
    try {
      console.log("Sending password reset email to:", email)
      await sendPasswordResetEmail(auth, email)
      console.log("Password reset email sent successfully")
    } catch (error: any) {
      console.error("Password reset error:", error)
      if (error.code === "auth/invalid-email") {
        throw new Error("無効なメールアドレスです。")
      } else if (error.code === "auth/user-not-found") {
        throw new Error("このメールアドレスは登録されていません。")
      } else {
        throw new Error(error.message || "パスワードリセットメールの送信に失敗しました。")
      }
    }
  }

  const value = {
    user,
    loading,
    userRole,
    signIn,
    signUp,
    logout,
    sendPasswordReset, // 追加
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
