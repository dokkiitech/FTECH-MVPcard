"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"
import { auth } from "../firebase"

interface UserData {
  firstName: string
  lastName: string
  role: "student" | "teacher"
  grade?: number
  subject?: string
}

interface AuthContextProps {
  user: any
  signUp: (email: string, password: string, userData: UserData) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  signUp: async () => {},
  signIn: async () => {},
  signOutUser: async () => {},
  loading: true,
})

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // データベースにユーザー情報を保存
      const endpoint = userData.role === "student" ? "/api/auth/register/student" : "/api/auth/register/teacher"

      const token = await userCredential.user.getIdToken()

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          ...userData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        // Firebase Authからユーザーを削除（ロールバック）
        await userCredential.user.delete()
        throw new Error(errorData.error || "Failed to save user data")
      }
    } catch (error: any) {
      // Firebaseエラーを日本語メッセージに変換
      if (error.code === "auth/email-already-in-use") {
        throw new Error("このメールアドレスは既に使用されています")
      } else if (error.code === "auth/weak-password") {
        throw new Error("パスワードが弱すぎます。6文字以上で設定してください")
      } else if (error.code === "auth/invalid-email") {
        throw new Error("無効なメールアドレスです")
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

  const signOutUser = async () => {
    try {
      await signOut(auth)
    } catch (error: any) {
      console.error("Sign out error:", error)
    }
  }

  const value = {
    user,
    signUp,
    signIn,
    signOutUser,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}
