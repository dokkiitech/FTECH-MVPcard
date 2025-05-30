"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { GraduationCap, Loader2, AlertCircle } from "lucide-react"

export default function StudentRegister() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    major: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})
  const { signUp } = useAuth()
  const router = useRouter()

  const validateForm = () => {
    const errors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      errors.name = "名前を入力してください"
    }

    if (!formData.major.trim()) {
      errors.major = "専攻を入力してください"
    }

    if (!formData.email.trim()) {
      errors.email = "メールアドレスを入力してください"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "有効なメールアドレスを入力してください"
    }

    if (!formData.password.trim()) {
      errors.password = "パスワードを入力してください"
    } else if (formData.password.length < 6) {
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
      await signUp(formData.email, formData.password, {
        name: formData.name,
        major: formData.major,
        role: "student",
      })
      router.push("/student/dashboard")
    } catch (error: any) {
      console.error("Registration error:", error)

      let errorMessage = "登録に失敗しました"

      // エラーメッセージを日本語に変換
      if (error.message.includes("このメールアドレスは既に使用されています")) {
        errorMessage = "このメールアドレスは既に使用されています"
      } else if (error.message.includes("パスワードが弱すぎます")) {
        errorMessage = "パスワードが弱すぎます。6文字以上で設定してください"
      } else if (error.message.includes("無効なメールアドレスです")) {
        errorMessage = "無効なメールアドレスです"
      } else if (error.message.includes("このユーザーまたはメールアドレスは既に登録されています")) {
        errorMessage = "このメールアドレスは既に登録されています"
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // フィールドエラーをクリア
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }

    // 全体エラーもクリア
    setError("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">学スタ登録</CardTitle>
          <CardDescription>新しいアカウントを作成してスタンプカードを始めよう！</CardDescription>
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
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={fieldErrors.name ? "border-red-500" : ""}
                disabled={loading}
                required
              />
              {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">専攻</Label>
              <Input
                id="major"
                name="major"
                value={formData.major}
                onChange={handleChange}
                className={fieldErrors.major ? "border-red-500" : ""}
                disabled={loading}
                required
              />
              {fieldErrors.major && <p className="text-sm text-red-500">{fieldErrors.major}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
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
                  登録中...
                </>
              ) : (
                "アカウント作成"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/student/login" className="text-sm text-blue-600 hover:underline">
              既にアカウントをお持ちの方はこちら
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
