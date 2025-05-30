"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { Mail, Loader2, AlertCircle, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [fieldError, setFieldError] = useState<string | null>(null)
  const { sendPasswordReset } = useAuth()

  const validateEmail = () => {
    if (!email.trim()) {
      setFieldError("メールアドレスを入力してください")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError("有効なメールアドレスを入力してください")
      return false
    }
    setFieldError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    if (!validateEmail()) {
      return
    }

    setLoading(true)
    try {
      await sendPasswordReset(email)
      setSuccessMessage("パスワードリセット用のメールを送信しました。メールボックスをご確認ください。")
      setEmail("") // 送信成功後、メールアドレスフィールドをクリア
    } catch (err: any) {
      setError(err.message || "パスワードリセットメールの送信に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">パスワードをお忘れですか？</CardTitle>
          <CardDescription>
            登録済みのメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert variant="default" className="mb-4 bg-green-50 border-green-300 text-green-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          {!successMessage && ( // 成功メッセージが表示されている間はフォームを非表示
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setFieldError(null) // 入力時にエラーをクリア
                    setError("") // 全体エラーもクリア
                  }}
                  className={fieldError ? "border-red-500" : ""}
                  disabled={loading}
                  required
                />
                {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  "パスワードリセットメールを送信"
                )}
              </Button>
            </form>
          )}
          <div className="mt-6 text-center">
            <Link href="/student/login" className="text-sm text-blue-600 hover:underline">
              学生ログインへ戻る
            </Link>
          </div>
          <div className="mt-2 text-center">
            <Link href="/teacher/login" className="text-sm text-green-600 hover:underline">
              先生ログインへ戻る
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
