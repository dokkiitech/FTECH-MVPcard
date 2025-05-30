"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { fetchWithAuth } from "@/lib/api-client"
import { Loader2, Star, CheckCircle, Trophy, Gift, User, AlertCircle, RefreshCw } from "lucide-react"

interface Stamp {
  position: number
  stamp_name: string
  image_url: string
  stamp_created_at: string
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
  created_at: string
}

interface GiftItem {
  id: number
  gift_name: string
  exchanged_at: string
  exchange_code: string
  card_id: number
}

interface StudentDetail {
  id: string
  name: string
  major: string
  email: string
  created_at: string
  stats: {
    totalStamps: number
    completedCards: number
    activeCards: number
    exchangedCards: number
  }
}

interface StudentDetailModalProps {
  studentId: string | null
  isOpen: boolean
  onClose: () => void
}

export function StudentDetailModal({ studentId, isOpen, onClose }: StudentDetailModalProps) {
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [cards, setCards] = useState<StampCard[]>([])
  const [gifts, setGifts] = useState<GiftItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentDetail()
    }
  }, [isOpen, studentId])

  const fetchStudentDetail = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      setError(null)
      console.log("Fetching student detail for ID:", studentId)

      const response = await fetchWithAuth(`/api/teacher/students/${studentId}`)
      console.log("Student detail response:", response)

      setStudent(response.student)
      setCards(response.cards || [])
      setGifts(response.gifts || [])
    } catch (error: any) {
      console.error("Error fetching student detail:", error)
      let errorMessage = "学生詳細の取得に失敗しました"

      if (error.message.includes("Student not found")) {
        errorMessage = "指定された学生が見つかりません"
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "ネットワークエラーが発生しました。インターネット接続を確認してください"
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStudent(null)
    setCards([])
    setGifts([])
    setError(null)
    onClose()
  }

  const handleRetry = () => {
    fetchStudentDetail()
  }

  // カードを分類
  const activeCards = cards.filter((card) => !card.is_completed && !card.is_exchanged)
  const completedCards = cards.filter((card) => card.is_completed && !card.is_exchanged)
  const exchangedCards = cards.filter((card) => card.is_exchanged)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            学生詳細
          </DialogTitle>
          <DialogDescription>学生の進捗状況と詳細情報</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            <span className="ml-2 text-gray-600">データを読み込み中...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                再試行
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {student && !loading && !error && (
          <div className="space-y-6">
            {/* 学生基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  基本情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">名前</p>
                    <p className="font-medium">{student.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">専攻</p>
                    <p className="font-medium">{student.major}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">メールアドレス</p>
                    <p className="font-medium">{student.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">登録日</p>
                    <p className="font-medium">{new Date(student.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 統計情報 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{student.stats.totalStamps}</div>
                  <div className="text-sm text-gray-600">総スタンプ数</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{student.stats.activeCards}</div>
                  <div className="text-sm text-gray-600">アクティブカード</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{student.stats.completedCards}</div>
                  <div className="text-sm text-gray-600">完成カード</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{student.stats.exchangedCards}</div>
                  <div className="text-sm text-gray-600">交換済みカード</div>
                </CardContent>
              </Card>
            </div>

            {/* タブ表示 */}
            <Tabs defaultValue="cards" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cards">スタンプカード</TabsTrigger>
                <TabsTrigger value="gifts">ギフト履歴</TabsTrigger>
              </TabsList>

              <TabsContent value="cards" className="space-y-4">
                {/* アクティブカード */}
                {activeCards.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Star className="w-5 h-5 text-yellow-500" />
                        アクティブカード ({activeCards.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeCards.map((card) => (
                          <div key={card.id} className="border rounded-lg p-4 bg-yellow-50">
                            <div className="flex gap-2 mb-3">
                              {Array.from({ length: card.maxStamps }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                    i < card.stamp_count
                                      ? "bg-yellow-400 border-yellow-500"
                                      : "bg-gray-100 border-gray-300"
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
                            <div className="text-xs text-gray-500 mt-1">
                              作成日: {new Date(card.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 完成カード */}
                {completedCards.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        完成カード ({completedCards.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                  </Card>
                )}

                {/* 交換済みカード */}
                {exchangedCards.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Trophy className="w-5 h-5 text-blue-500" />
                        交換済みカード ({exchangedCards.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                  </Card>
                )}

                {cards.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">まだスタンプカードがありません</div>
                )}
              </TabsContent>

              <TabsContent value="gifts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      ギフト交換履歴
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {gifts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">まだギフト交換をしていません</div>
                    ) : (
                      <div className="space-y-4">
                        {gifts.map((gift) => (
                          <div key={gift.id} className="border rounded-lg p-4 bg-white">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium">{gift.gift_name}</h3>
                                <p className="text-sm text-gray-600">
                                  交換日: {new Date(gift.exchanged_at).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-gray-500">コード: {gift.exchange_code}</p>
                              </div>
                              <Badge variant="outline">交換済み</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
