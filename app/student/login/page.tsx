"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // 1. エラー状態を管理するstateを追加:
  const [error, setError] = useState("")

  // signIn関数を削除し、useAuthから取得
  const { signIn } = useAuth()

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
        {/* フォームのタイトルと表示を日本語に変更 */}
        <h2 className="text-2xl font-bold mb-6 text-center">学生ログイン</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            {/* ラベルを日本語に変更 */}
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              メールアドレス
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              {/* プレースホルダーを日本語に変更 */}
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-6">
            {/* ラベルを日本語に変更 */}\
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              パスワード
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              {/* プレースホルダーを日本語に変更 */}
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            {/* ボタンテキストを日本語に変更 */}
            <button
              className=\"bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
              disabled={loading}
            >
              {loading ? "ログイン中..." : "ログイン"}
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
