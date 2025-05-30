"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { fetchWithAuth } from "@/lib/api-client"
import { Star, Trophy, Plus, Loader2, CheckCircle, Gift, AlertCircle } from "lucide-react"

interface Stamp {
  position: number
  stamp_name: string
  image_url: string
}

interface StampCard {
  id: number
  is_completed: boolean
  is_exchanged: boolean
  stamp_count: number
  maxStamps: number
  stamps: Stamp[]
  completed_at?: string
  exchanged_at?: string
}

export default function StudentDashboard() {
  const [stampCode, setStampCode] = useState("")
  const [giftCode, setGiftCode] = useState("")
  const [cards, setCards] = useState<StampCard[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const [stampError, setStampError] = useState<string | null>(null)
  const [giftError, setGiftError] = useState<string | null>(null)
  const { user, userRole, logout, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // 認証状態をチェックしてリダイレクト
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log("No user found, redirecting to login...")
        router.push("/student/login")
        return
      }

      if (userRole && userRole !== "student") {
        console.log("User is not a student, redirecting...")
        router.push("/")
        return
      }

      if (user && userRole === "student") {
        console.log("Student authenticated, fetching data...")
        fetchData()
      }
    }
  }, [user, userRole, authLoading, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      setDataError(null)
      console.log("Fetching student data...")

      // スタンプカードを取得
      const cardsResponse = await fetchWithAuth("/api/student/cards")
      setCards(cardsResponse.cards || [])

      console.log("Data fetched successfully")
    } catch (error: any) {
      console.error("Error fetching data:", error)
      const errorMessage = error.message || "データの取得に失敗しました"
      setDataError(errorMessage)
      toast({
        title: "データ取得エラー",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStampSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stampCode.trim()) {
      setStampError("スタンプコードを入力してください")
      return
    }

    // 5桁の数字チェック
    if (!/^\d{5}$/.test(stampCode)) {
      setStampError("スタンプコードは5桁の数字で入力してください")
      return
    }

    try {
      setSubmitting(true)
      setStampError(null)
      console.log("Submitting stamp code:", stampCode)

      const response = await fetchWithAuth("/api/student/use-stamp-code", {
        method: "POST",
        body: JSON.stringify({ code: stampCode }),
      })

      toast({
        title: "スタンプ追加成功",
        description: response.cardCompleted ? "スタンプカードが完成しました！" : "スタンプを追加しました",
        variant: "default",
      })

      setStampCode("")
      fetchData() // データを再取得
    } catch (error: any) {
      console.error("Error using stamp code:", error)
      let errorMessage = "スタンプコードの使用に失敗しました"

      // APIからのエラーメッセージを日本語に変換
      if (error.message.includes("Invalid code")) {
        errorMessage = "無効なスタンプコードです"
      } else if (error.message.includes("Code already used")) {
        errorMessage = "このコードは既に使用済みです"
      } else if (error.message.includes("Code expired")) {
        errorMessage = "このコードは期限切れです"
      } else if (error.message.includes("No available card slots")) {
        errorMessage = "利用可能なカードスロットがありません"
      } else if (error.message) {
        errorMessage = error.message
      }

      setStampError(errorMessage)
      toast({
        title: "スタンプ取得エラー",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleGiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!giftCode.trim()) {
      setGiftError("ギフトコードを入力してください")
      return
    }

    // 5桁の数字チェック
    if (!/^\d{5}$/.test(giftCode)) {
      setGiftError("ギフトコードは5桁の数字で入力してください")
      return
    }

    try {
      setSubmitting(true)
      setGiftError(null)
      console.log("Submitting gift code:", giftCode)

      const response = await fetchWithAuth("/api/student/exchange-gift", {
        method: "POST",
        body: JSON.stringify({ code: giftCode }),
      })

      toast({
        title: "ギフト交換成功",
        description: `${response.giftName}と交換しました！`,
        variant: "default",
      })

      setGiftCode("")
      fetchData() // データを再取得
    } catch (error: any) {
      console.error("Error exchanging gift:", error)
      let errorMessage = "ギフト交換に失敗しました"

      // APIからのエラーメッセージを日本語に変換
      if (error.message.includes("Invalid gift code")) {
        errorMessage = "無効なギフトコードです"
      } else if (error.message.includes("Gift code already used")) {
        errorMessage = "このギフトコードは既に使用済みです"
      } else if (error.message.includes("Gift code expired")) {
        errorMessage = "このギフトコードは期限切れです"
      } else if (error.message.includes("No completed cards available")) {
        errorMessage = "交換可能な完成カードがありません"
      } else if (error.message) {
        errorMessage = error.message
      }

      setGiftError(errorMessage)
      toast({
        title: "ギフト交換エラー",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      console.log("Logging out...")
      await logout()
      router.push("/")
    } catch (error: any) {
      console.error("Logout error:", error)
      toast({
        title: "ログアウトエラー",
        description: "ログアウトに失敗しました",
        variant: "destructive",
      })
    }
  }

  // 認証チェック中の表示
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // ユーザーが認証されていない、または学生でない場合
  if (!user || (userRole && userRole !== "student")) {
    return null // useEffectでリダイレクトされる
  }

  // データ取得中の表示
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold text-gray-900">学スタダッシュボード</h1>
              <Button variant="outline" onClick={handleLogout}>
                ログアウト
              </Button>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  // カードを分類
  const activeCards = cards.filter((card) => !card.is_completed && !card.is_exchanged)
  const completedCards = cards.filter((card) => card.is_completed && !card.is_exchanged)
  const exchangedCards = cards.filter((card) => card.is_exchanged)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">学スタダッシュボード</h1>
            <Button variant="outline" onClick={handleLogout}>
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* データ取得エラー表示 */}
        {dataError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {dataError}
              <Button variant="outline" size="sm" className="ml-4" onClick={fetchData}>
                再試行
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* スタンプカード */}
          <div className="lg:col-span-2 space-y-6">
            {/* アクティブカード */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  アクティブカード
                </CardTitle>
                <CardDescription>3個のスタンプでギフトカードと交換できます</CardDescription>
              </CardHeader>
              <CardContent>
                {activeCards.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">アクティブなカードがありません</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeCards.map((card) => (
                      <div key={card.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex gap-2 mb-3">
                          {Array.from({ length: card.maxStamps }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                i < card.stamp_count ? "bg-yellow-400 border-yellow-500" : "bg-gray-100 border-gray-300"
                              }`}
                            >
                              {i < card.stamp_count && card.stamps[i] && (
                                <img
                                  src={card.stamps[i].image_url || "/placeholder.svg?height=20&width=20"}
                                  alt={card.stamps[i].stamp_name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="text-sm text-gray-600">
                          {card.stamp_count}/{card.maxStamps} スタンプ
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 完成カード */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  完成カード
                </CardTitle>
                <CardDescription>ギフトコードで交換可能なカード</CardDescription>
              </CardHeader>
              <CardContent>
                {completedCards.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">完成したカードがありません</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedCards.map((card) => (
                      <div key={card.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                        <div className="flex justify-between items-center mb-3">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            完成
                          </Badge>
                        </div>
                        <div className="flex gap-2 mb-3">
                          {Array.from({ length: card.maxStamps }).map((_, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-full border-2 bg-yellow-400 border-yellow-500 flex items-center justify-center"
                            >
                              {card.stamps[i] && (
                                <img
                                  src={card.stamps[i].image_url || "/placeholder.svg?height=20&width=20"}
                                  alt={card.stamps[i].stamp_name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="text-sm text-gray-600">
                          完成日: {card.completed_at ? new Date(card.completed_at).toLocaleDateString() : "不明"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 交換済みカード */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-blue-500" />
                  交換済みカード
                </CardTitle>
                <CardDescription>ギフトと交換済みのカード</CardDescription>
              </CardHeader>
              <CardContent>
                {exchangedCards.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">まだカードを交換していません</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exchangedCards.map((card) => (
                      <div key={card.id} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                        <div className="flex justify-between items-center mb-3">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            交換済み
                          </Badge>
                        </div>
                        <div className="flex gap-2 mb-3">
                          {Array.from({ length: card.maxStamps }).map((_, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-full border-2 bg-gray-300 border-gray-400 flex items-center justify-center"
                            >
                              {card.stamps[i] && (
                                <img
                                  src={card.stamps[i].image_url || "/placeholder.svg?height=20&width=20"}
                                  alt={card.stamps[i].stamp_name}
                                  className="w-6 h-6 rounded-full object-cover opacity-60"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="text-sm text-gray-600">
                          交換日: {card.exchanged_at ? new Date(card.exchanged_at).toLocaleDateString() : "不明"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* コード入力 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  スタンプ取得
                </CardTitle>
                <CardDescription>先生からもらった5桁のコードを入力してスタンプをゲット！</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStampSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stampCode">スタンプコード（5桁）</Label>
                    <Input
                      id="stampCode"
                      value={stampCode}
                      onChange={(e) => {
                        setStampCode(e.target.value)
                        setStampError(null) // 入力時にエラーをクリア
                      }}
                      placeholder="12345"
                      maxLength={5}
                      pattern="[0-9]{5}"
                      disabled={submitting}
                      className={stampError ? "border-red-500" : ""}
                    />
                    {stampError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{stampError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        処理中...
                      </>
                    ) : (
                      "スタンプを取得"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  ギフト交換
                </CardTitle>
                <CardDescription>完成したスタンプカードをギフトカードと交換</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGiftSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="giftCode">ギフト交換コード（5桁）</Label>
                    <Input
                      id="giftCode"
                      value={giftCode}
                      onChange={(e) => {
                        setGiftCode(e.target.value)
                        setGiftError(null) // 入力時にエラーをクリア
                      }}
                      placeholder="54321"
                      maxLength={5}
                      pattern="[0-9]{5}"
                      disabled={submitting}
                      className={giftError ? "border-red-500" : ""}
                    />
                    {giftError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{giftError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting || completedCards.length === 0}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        処理中...
                      </>
                    ) : (
                      "ギフトと交換"
                    )}
                  </Button>
                  {completedCards.length === 0 && (
                    <p className="text-sm text-gray-500 text-center">完成したカードがありません</p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
