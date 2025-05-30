"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // 1. エラー状態を管理するstateを追加:
  const [error, setError] = useState("")

  const signIn = async (email: string, password: string) => {
    // Placeholder for actual sign-in logic.  Replace with your authentication method.
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === "test@example.com" && password === "password") {
          resolve(true)
        } else {
          reject(new Error("Invalid credentials"))
        }
      }, 1000)
    })
  }

  // 2. handleSubmit関数でエラーハンドリングを改善:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("") // エラーをクリア

    try {
      await signIn(email, password)
      router.push("/student/dashboard")
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "ログインに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Student Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
              disabled={loading}
            >
              {loading ? "Loading..." : "Sign In"}
            </button>
          </div>
        </form>
        {/* 3. エラーメッセージを表示するUIを追加（フォームの後に）: */}
        {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
      </div>
    </div>
  )
}

export default LoginPage
