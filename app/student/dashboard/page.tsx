"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { fetchWithAuth } from "@/lib/api-client"
import { Gift, Star, Trophy, Plus, Loader2 } from "lucide-react"

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
}

interface GiftItem {
  id: number
  gift_name: string
  exchanged_at: string
  image_url?: string
}

export default function StudentDashboard() {
  const [stampCode, setStampCode] = useState("")
  const [giftCode, setGiftCode] = useState("")
  const [cards, setCards] = useState<StampCard[]>([])
  const [collection, setCollection] = useState<GiftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
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
      console.log("Fetching student data...")

      // スタンプカードを取得
      const cardsResponse = await fetchWithAuth("/api/student/cards")
      setCards(cardsResponse.cards || [])

      // ギフトコレクションを取得
      const collectionResponse = await fetchWithAuth("/api/student/collection")
      setCollection(collectionResponse.gifts || [])

      console.log("Data fetched successfully")
    } catch (error: any) {
      console.error("Error fetching data:", error)
      toast({
        title: "エラー",
        description: error.message || "データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStampSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stampCode.trim()) return

    try {
      setSubmitting(true)
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
      toast({
        title: "エラー",
        description: error.message || "スタンプコードの使用に失敗しました",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleGiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!giftCode.trim()) return

    try {
      setSubmitting(true)
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
      toast({
        title: "エラー",
        description: error.message || "ギフト交換に失敗しました",
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
        title: "エラー",
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* スタンプカード */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  スタンプカード
                </CardTitle>
                <CardDescription>3個のスタンプでギフトカードと交換できます</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cards.map((card) => (
                    <div key={card.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium">カード {card.id}</span>
                        {card.is_completed && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            完成
                          </Badge>
                        )}
                        {card.is_exchanged && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            交換済
                          </Badge>
                        )}
                      </div>
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
              </CardContent>
            </Card>

            {/* コレクション */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  ギフトコレクション
                </CardTitle>
                <CardDescription>交換済みのギフトカード一覧</CardDescription>
              </CardHeader>
              <CardContent>
                {collection.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">まだギフトカードを交換していません</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {collection.map((gift) => (
                      <div key={gift.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center gap-3">
                          <img
                            src={gift.image_url || "/placeholder.svg?height=100&width=100"}
                            alt={gift.gift_name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <h3 className="font-medium">{gift.gift_name}</h3>
                            <p className="text-sm text-gray-600">{new Date(gift.exchanged_at).toLocaleDateString()}</p>
                          </div>
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
                <CardDescription>先生からもらったコードを入力してスタンプをゲット！</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStampSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stampCode">スタンプコード</Label>
                    <Input
                      id="stampCode"
                      value={stampCode}
                      onChange={(e) => setStampCode(e.target.value)}
                      placeholder="コードを入力"
                      disabled={submitting}
                    />
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
                    <Label htmlFor="giftCode">ギフト交換コード</Label>
                    <Input
                      id="giftCode"
                      value={giftCode}
                      onChange={(e) => setGiftCode(e.target.value)}
                      placeholder="交換コードを入力"
                      disabled={submitting}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        処理中...
                      </>
                    ) : (
                      "ギフトと交換"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
