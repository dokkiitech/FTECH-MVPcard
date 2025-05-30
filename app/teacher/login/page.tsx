"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

const TeacherLoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [error, setError] = useState("")

  const signIn = async (email: string, password: string) => {
    // Placeholder for actual sign-in logic (e.g., calling an API)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("") // エラーをクリア

    try {
      await signIn(email, password)
      router.push("/teacher/dashboard")
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "ログインに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-semibold mb-4">Teacher Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
        {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
      </div>
    </div>
  )
}

export default TeacherLoginPage
