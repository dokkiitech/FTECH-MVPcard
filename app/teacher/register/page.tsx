"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { BookOpen } from "lucide-react"

export default function TeacherRegister() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    registrationPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signUp(formData.email, formData.password, {
        name: formData.name,
        major: "", // 先生は専攻不要
        role: "teacher",
        registrationPassword: formData.registrationPassword,
      })
      router.push("/teacher/dashboard")
    } catch (error) {
      console.error("Registration error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">先生登録</CardTitle>
          <CardDescription>新しい先生アカウントを作成</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationPassword">登録用パスワード</Label>
              <Input
                id="registrationPassword"
                name="registrationPassword"
                type="password"
                value={formData.registrationPassword}
                onChange={handleChange}
                placeholder="先生用の登録パスワード"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? "登録中..." : "アカウント作成"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/teacher/login" className="text-sm text-green-600 hover:underline">
              既にアカウントをお持ちの方はこちら
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
