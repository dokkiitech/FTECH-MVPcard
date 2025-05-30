"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { GraduationCap, Loader2 } from "lucide-react"

export default function StudentLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { signIn, user, userRole, loading: authLoading } = useAuth()
  const router = useRouter()

  // 認証状態の変化を監視してリダイレクト
  useEffect(() => {
    if (!authLoading && user && userRole === "student") {
      console.log("Student authenticated, redirecting to dashboard...")
      router.push("/student/dashboard")
    }
  }, [user, userRole, authLoading, router])

  // 既にログイン済みの場合は早期リターン
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (user && userRole === "student") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await signIn(email, password)
      // リダイレクトはuseEffectで処理される
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "ログインに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">学スタログイン</CardTitle>
          <CardDescription>スタンプカードでモチベーションアップ！</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ログイン中...
                </>
              ) : (
                "ログイン"
              )}
            </Button>
          </form>
          {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
          <div className="mt-4 text-center space-y-2">
            <Link href="/student/register" className="text-sm text-blue-600 hover:underline">
              アカウントを作成
            </Link>
            <div className="text-sm text-gray-500">
              先生の方は{" "}
              <Link href="/teacher/login" className="text-blue-600 hover:underline">
                こちら
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
