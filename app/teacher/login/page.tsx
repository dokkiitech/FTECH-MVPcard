"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label" // Labelをインポート
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" // Cardコンポーネントをインポート
import { Alert, AlertDescription } from "@/components/ui/alert" // Alertコンポーネントをインポート
import { useAuth } from "@/contexts/auth-context" // useAuthをインポート
import { Icons } from "@/components/icons" // Lucide Reactアイコンをインポート
// import { useSession } from "next-auth/react" // useSessionをインポート

export default function TeacherLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  // const { status } = useSession()
  const { signIn, user, userRole, loading: authLoading } = useAuth() // AuthContextからsignInなどを取得
  const [error, setError] = useState("") // エラーメッセージ用のstate
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({}) // フィールドエラー用のstate

  // 認証状態の変化を監視してリダイレクト
  useEffect(() => {
    if (!authLoading && user) {
      if (userRole === "teacher") {
        router.push("/teacher/dashboard")
      } else if (userRole === "student") {
        router.push("/student/login") // 先生ログインページで学生アカウントなら学生ログインへ
      }
    }
  }, [user, userRole, authLoading, router])

  const validateForm = () => {
    const newFieldErrors: { email?: string; password?: string } = {}
    if (!email.trim()) newFieldErrors.email = "メールアドレスを入力してください"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newFieldErrors.email = "有効なメールアドレスを入力してください"
    if (!password.trim()) newFieldErrors.password = "パスワードを入力してください"
    else if (password.length < 6) newFieldErrors.password = "パスワードは6文字以上で入力してください"
    setFieldErrors(newFieldErrors)
    return Object.keys(newFieldErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError("")
    try {
      await signIn(email, password) // AuthContextのsignInを使用
      // リダイレクトはuseEffectで処理
    } catch (err: any) {
      setError(err.message || "ログインに失敗しました。")
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

  if (authLoading || (user && userRole)) {
    // 認証情報取得中または既にログイン済みで役割確定ならローダー表示
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Icons.spinner className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
            <Icons.bookOpen className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">先生ログイン</CardTitle>
          <CardDescription>学生のモチベーション管理システム</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <Icons.alertCircle className="h-4 w-4" />
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
                  setError("")
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
                  setError("")
                }}
                className={fieldErrors.password ? "border-red-500" : ""}
                disabled={loading}
                required
              />
              {fieldErrors.password && <p className="text-sm text-red-500">{fieldErrors.password}</p>}
            </div>
            <div className="text-right">
              <Link href="/forgot-password" prefetch={false} className="text-sm text-green-600 hover:underline">
                パスワードをお忘れですか？
              </Link>
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  ログイン中...
                </>
              ) : (
                "ログイン"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <Link href="/teacher/register" className="text-sm text-green-600 hover:underline">
              アカウントを作成
            </Link>
            <div className="text-sm text-gray-500">
              学生の方は{" "}
              <Link href="/student/login" className="text-green-600 hover:underline">
                こちら
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
