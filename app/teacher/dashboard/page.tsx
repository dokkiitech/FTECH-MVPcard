"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { fetchWithAuth } from "@/lib/api-client"
import { BarChart3, Users, Gift, Star, Plus, Copy, Loader2, Upload, Trash2 } from "lucide-react"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

interface StatsData {
  totalStudents: number
  activeCards: number
  completedCards: number
  stampsIssued: number
}

interface StudentData {
  id: string
  name: string
  major: string
  total_stamps: number
  completed_cards: number
}

interface CodeData {
  id: number
  code: string
  type: "stamp" | "gift"
  used: boolean
  used_by: string | null
  created_at: string
}

interface StampImage {
  id: number
  name: string
  image_url: string
  is_active: boolean
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [students, setStudents] = useState<StudentData[]>([])
  const [codes, setCodes] = useState<CodeData[]>([])
  const [stampImages, setStampImages] = useState<StampImage[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedStampId, setSelectedStampId] = useState<number | null>(null)
  const [newStampName, setNewStampName] = useState("")
  const [newStampImage, setNewStampImage] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { user, logout } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)

      // 統計情報を取得
      const statsResponse = await fetchWithAuth("/api/teacher/stats")
      setStats(statsResponse.stats)
      setStudents(statsResponse.students || [])

      // コード一覧を取得
      const codesResponse = await fetchWithAuth("/api/teacher/codes")
      setCodes(codesResponse.codes || [])

      // スタンプ画像一覧を取得
      const stampImagesResponse = await fetchWithAuth("/api/teacher/stamp-images")
      setStampImages(stampImagesResponse.stampImages || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "エラー",
        description: "データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateCode = async (type: "stamp" | "gift") => {
    try {
      setSubmitting(true)

      if (type === "stamp" && !selectedStampId) {
        toast({
          title: "エラー",
          description: "スタンプ画像を選択してください",
          variant: "destructive",
        })
        return
      }

      const response = await fetchWithAuth("/api/teacher/generate-code", {
        method: "POST",
        body: JSON.stringify({
          type,
          stampImageId: type === "stamp" ? selectedStampId : null,
        }),
      })

      toast({
        title: "コード生成成功",
        description: `${type === "stamp" ? "スタンプ" : "ギフト"}コード: ${response.code}`,
        variant: "default",
      })

      fetchData() // データを再取得
    } catch (error) {
      console.error("Error generating code:", error)
      toast({
        title: "エラー",
        description: "コードの生成に失敗しました",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const uploadStampImage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStampImage || !newStampName.trim()) return

    try {
      setSubmitting(true)
      setUploadProgress(0)

      // Firebase Storageにアップロード
      const storageRef = ref(storage, `stamps/${Date.now()}_${newStampImage.name}`)
      await uploadBytes(storageRef, newStampImage)
      const imageUrl = await getDownloadURL(storageRef)

      setUploadProgress(100)

      // APIにスタンプ画像情報を保存
      await fetchWithAuth("/api/teacher/stamp-images", {
        method: "POST",
        body: JSON.stringify({
          name: newStampName,
          imageUrl,
        }),
      })

      toast({
        title: "スタンプ追加成功",
        description: "新しいスタンプ画像を追加しました",
        variant: "default",
      })

      setNewStampName("")
      setNewStampImage(null)
      fetchData() // データを再取得
    } catch (error) {
      console.error("Error uploading stamp image:", error)
      toast({
        title: "エラー",
        description: "スタンプ画像のアップロードに失敗しました",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleStampActive = async (stampId: number, isActive: boolean) => {
    try {
      await fetchWithAuth(`/api/teacher/stamp-images/${stampId}`, {
        method: "PATCH",
        body: JSON.stringify({
          isActive: !isActive,
        }),
      })

      toast({
        title: "スタンプ状態変更",
        description: `スタンプを${!isActive ? "有効" : "無効"}にしました`,
        variant: "default",
      })

      fetchData() // データを再取得
    } catch (error) {
      console.error("Error toggling stamp active state:", error)
      toast({
        title: "エラー",
        description: "スタンプ状態の変更に失敗しました",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "コピー完了",
      description: "クリップボードにコピーしました",
      variant: "default",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">先生ダッシュボード</h1>
            <Button variant="outline" onClick={logout}>
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">概要</TabsTrigger>
              <TabsTrigger value="codes">コード管理</TabsTrigger>
              <TabsTrigger value="stamps">スタンプ管理</TabsTrigger>
              <TabsTrigger value="students">学生管理</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* 統計カード */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">総学生数</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">アクティブカード</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.activeCards || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">完成カード</CardTitle>
                    <Gift className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.completedCards || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">発行スタンプ</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.stampsIssued || 0}</div>
                  </CardContent>
                </Card>
              </div>

              {/* 最近の活動 */}
              <Card>
                <CardHeader>
                  <CardTitle>学生活動状況</CardTitle>
                  <CardDescription>学生のスタンプ取得状況</CardDescription>
                </CardHeader>
                <CardContent>
                  {students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">まだ学生が登録されていません</div>
                  ) : (
                    <div className="space-y-4">
                      {students.slice(0, 5).map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">{student.name}</h3>
                            <p className="text-sm text-gray-600">{student.major}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{student.total_stamps} スタンプ</div>
                            <div className="text-sm text-gray-600">{student.completed_cards} 完成カード</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="codes" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* コード生成 */}
                <Card>
                  <CardHeader>
                    <CardTitle>コード生成</CardTitle>
                    <CardDescription>スタンプ付与・ギフト交換用のワンタイムコードを生成</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* スタンプコード生成 */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>スタンプ画像選択</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {stampImages
                            .filter((img) => img.is_active)
                            .map((img) => (
                              <div
                                key={img.id}
                                className={`border rounded-lg p-2 cursor-pointer ${
                                  selectedStampId === img.id ? "border-green-500 bg-green-50" : ""
                                }`}
                                onClick={() => setSelectedStampId(img.id)}
                              >
                                <img
                                  src={img.image_url || "/placeholder.svg"}
                                  alt={img.name}
                                  className="w-full h-16 object-contain mx-auto"
                                />
                                <p className="text-xs text-center mt-1 truncate">{img.name}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                      <Button
                        onClick={() => generateCode("stamp")}
                        className="w-full"
                        disabled={submitting || !selectedStampId}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            スタンプコード生成
                          </>
                        )}
                      </Button>
                    </div>

                    {/* ギフトコード生成 */}
                    <Button
                      onClick={() => generateCode("gift")}
                      variant="outline"
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Gift className="w-4 h-4 mr-2" />
                          ギフトコード生成
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* 発行済みコード */}
                <Card>
                  <CardHeader>
                    <CardTitle>発行済みコード</CardTitle>
                    <CardDescription>最近発行されたコード一覧</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {codes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">まだコードが発行されていません</div>
                    ) : (
                      <div className="space-y-3">
                        {codes.slice(0, 10).map((code) => (
                          <div key={code.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{code.code}</code>
                                <Badge variant={code.type === "stamp" ? "default" : "secondary"}>
                                  {code.type === "stamp" ? "スタンプ" : "ギフト"}
                                </Badge>
                                <Badge variant={code.used ? "destructive" : "outline"}>
                                  {code.used ? "使用済み" : "未使用"}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(code.created_at).toLocaleString()}
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(code.code)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="stamps" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>スタンプ画像管理</CardTitle>
                  <CardDescription>学生が取得するスタンプ画像をアップロード・管理</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 新規スタンプ追加 */}
                  <form onSubmit={uploadStampImage} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="stampName">スタンプ名</Label>
                      <Input
                        id="stampName"
                        value={newStampName}
                        onChange={(e) => setNewStampName(e.target.value)}
                        placeholder="スタンプの名前"
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stampImage">スタンプ画像</Label>
                      <Input
                        id="stampImage"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewStampImage(e.target.files?.[0] || null)}
                        disabled={submitting}
                      />
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    )}
                    <Button type="submit" disabled={submitting || !newStampImage || !newStampName}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          アップロード中...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          スタンプを追加
                        </>
                      )}
                    </Button>
                  </form>

                  {/* スタンプ一覧 */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">登録済みスタンプ</h3>
                    {stampImages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">まだスタンプ画像が登録されていません</div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stampImages.map((stamp) => (
                          <div key={stamp.id} className="border rounded-lg p-4 bg-white">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant={stamp.is_active ? "default" : "destructive"}>
                                {stamp.is_active ? "有効" : "無効"}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleStampActive(stamp.id, stamp.is_active)}
                              >
                                {stamp.is_active ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                              </Button>
                            </div>
                            <div className="flex flex-col items-center">
                              <img
                                src={stamp.image_url || "/placeholder.svg"}
                                alt={stamp.name}
                                className="w-20 h-20 object-contain mb-2"
                              />
                              <p className="text-sm font-medium text-center">{stamp.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>学生一覧</CardTitle>
                  <CardDescription>登録済み学生とその進捗状況</CardDescription>
                </CardHeader>
                <CardContent>
                  {students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">まだ学生が登録されていません</div>
                  ) : (
                    <div className="space-y-4">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">{student.name}</h3>
                            <p className="text-sm text-gray-600">{student.major}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-medium">{student.total_stamps} スタンプ</div>
                              <div className="text-sm text-gray-600">{student.completed_cards} 完成カード</div>
                            </div>
                            <Button size="sm" variant="outline">
                              詳細
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
