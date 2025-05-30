"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { GraduationCap, Loader2, AlertCircle } from "lucide-react"

export default function StudentLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const { signIn, user, userRole, loading: authLoading } = useAuth()
  const router = useRouter()

  // 認証状態の変化を監視してリダイレクト
  useEffect(() => {
    console.log("Auth state check:", { user: !!user, userRole, authLoading })

    if (!authLoading && user) {
      if (userRole === "student") {
        console.log("Student authenticated, redirecting to dashboard...")
        router.push("/student/dashboard")
      } else if (userRole === "teacher") {
        console.log("Teacher user on student login, redirecting to teacher login...")
        router.push("/teacher/login")
      }
      // userRoleがnullの場合は待機（まだ取得中）
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

  // ユーザーがログイン済みで役割が確定している場合
  if (user && userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {}

    if (!email.trim()) {
      errors.email = "メールアドレスを入力してください"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "有効なメールアドレスを入力してください"
    }

    if (!password.trim()) {
      errors.password = "パスワードを入力してください"
    } else if (password.length < 6) {
      errors.password = "パスワードは6文字以上で入力してください"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError("")

    try {
      await signIn(email, password)
      // リダイレクトはuseEffectで処理される
    } catch (error: any) {
      console.error("Login error:", error)

      let errorMessage = "ログインに失敗しました"

      // エラーメッセージを日本語に変換
      if (error.message.includes("このメールアドレスは登録されていません")) {
        errorMessage = "このメールアドレスは登録されていません"
      } else if (error.message.includes("パスワードが間違っています")) {
        errorMessage = "パスワードが間違っています"
      } else if (error.message.includes("無効なメールアドレスです")) {
        errorMessage = "無効なメールアドレスです"
      } else if (error.message.includes("ログイン試行回数が多すぎます")) {
        errorMessage = "ログイン試行回数が多すぎます。しばらく待ってから再試行してください"
      } else if (error.message.includes("ネットワーク")) {
        errorMessage = "ネットワークエラーが発生しました。インターネット接続を確認してください"
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field as keyof typeof newErrors]
      return newErrors
    })
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
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearFieldError("email")
                  setError("") // 全体エラーもクリア
                }}
                className={fieldErrors.email ? "border-red-500" : ""}
                disabled={loading}
                required
              />
              {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearFieldError("password")
                  setError("") // 全体エラーもクリア
                }}
                className={fieldErrors.password ? "border-red-500" : ""}
                disabled={loading}
                required
              />
              {fieldErrors.password && <p className="text-sm text-red-500">{fieldErrors.password}</p>}
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
