"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import Link from "next/link"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function TeacherLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { status } = useSession()

  if (status === "authenticated") {
    router.push("/teacher")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      }).then((callback) => {
        if (callback?.error) {
          alert("認証に失敗しました")
        }
        if (callback?.ok) {
          router.push("/teacher")
        }
      })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-md p-6 bg-white rounded-md shadow-md">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">先生ログイン</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              パスワード
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="text-right">
            <Link href="/forgot-password" prefetch={false} className="text-sm text-green-600 hover:underline">
              パスワードをお忘れですか？
            </Link>
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "ログイン中..." : "ログイン"}
          </Button>
        </form>
      </div>
    </div>
  )
}
