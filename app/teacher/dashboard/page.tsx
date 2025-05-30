"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { fetchWithAuth } from "@/lib/api-client"
import { StudentDetailModal } from "@/components/student-detail-modal"
import { BarChart3, Users, Gift, Star, Plus, Copy, Loader2, Upload, Trash2, RefreshCw, Trophy } from "lucide-react"
import { auth } from "@/lib/firebase"

interface StatsData {
  totalStudents: number
  activeCards: number
  completedCards: number
  exchangedCards: number
  stampsIssued: number
}

interface StudentData {
  id: string
  name: string
  major: string
  total_stamps: number
  completed_cards: number
  active_cards: number
  exchanged_cards: number
}

interface CodeData {
  id: number
  code: string
  type: "stamp" | "gift"
  used: boolean
  used_by: string | null
  created_at: string
  used_at: string | null
  expires_at: string
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
  const [error, setError] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false)
  const { user, userRole, logout, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  // 認証状態をチェックしてリダイレクト
  useEffect(() => {
    console.log("Teacher dashboard auth check:", { user: !!user, userRole, authLoading })

    if (!authLoading) {
      if (!user) {
        console.log("No user found, redirecting to login...")
        router.push("/teacher/login")
        return
      }

      if (userRole && userRole !== "teacher") {
        console.log("User is not a teacher, redirecting...")
        router.push("/")
        return
      }

      if (user && userRole === "teacher") {
        console.log("Teacher authenticated, fetching data...")
        fetchData()
      }
    }
  }, [user, userRole, authLoading, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Fetching teacher data...")

      // 統計情報を取得
      console.log("Fetching stats...")
      try {
        const statsResponse = await fetchWithAuth("/api/teacher/stats")
        console.log("Stats response:", statsResponse)
        setStats(statsResponse.stats)
        setStudents(statsResponse.students || [])
      } catch (statsError: any) {
        console.error("Stats fetch error:", statsError)
        setError(`統計情報の取得に失敗しました: ${statsError.message}`)
        // 統計情報の取得に失敗してもコードとスタンプ画像は取得を試行
      }

      // コード一覧を取得
      console.log("Fetching codes...")
      try {
        const codesResponse = await fetchWithAuth("/api/teacher/codes")
        console.log("Codes response:", codesResponse)
        setCodes(codesResponse.codes || [])
      } catch (codesError: any) {
        console.error("Codes fetch error:", codesError)
        if (!error) setError(`コード一覧の取得に失敗しました: ${codesError.message}`)
      }

      // スタンプ画像一覧を取得
      console.log("Fetching stamp images...")
      try {
        const stampImagesResponse = await fetchWithAuth("/api/teacher/stamp-images")
        console.log("Stamp images response:", stampImagesResponse)
        setStampImages(stampImagesResponse.stampImages || [])
      } catch (stampError: any) {
        console.error("Stamp images fetch error:", stampError)
        if (!error) setError(`スタンプ画像の取得に失敗しました: ${stampError.message}`)
      }

      console.log("Teacher data fetch completed")
    } catch (error: any) {
      console.error("Error fetching data:", error)
      setError(`データの取得に失敗しました: ${error.message}`)
      toast({
        title: "エラー",
        description: error.message || "データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      console.log("Loading state set to false")
    }
  }

  // コード管理タブでのリアルタイム更新
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (activeTab === "codes" && user && userRole === "teacher") {
      console.log("Starting real-time polling for codes...")
      setIsPolling(true)

      const pollCodes = async () => {
        try {
          console.log("Polling codes...")
          const codesResponse = await fetchWithAuth("/api/teacher/codes")
          setCodes(codesResponse.codes || [])
          setLastUpdated(new Date())
        } catch (error: any) {
          console.error("Error polling codes:", error)
          // ポーリング中のエラーは静かに処理（ユーザーに通知しない）
        }
      }

      // 初回実行
      pollCodes()

      // 1秒間隔でポーリング
      intervalId = setInterval(pollCodes, 1000)
    } else {
      setIsPolling(false)
    }

    // クリーンアップ
    return () => {
      if (intervalId) {
        console.log("Stopping real-time polling for codes...")
        clearInterval(intervalId)
        setIsPolling(false)
      }
    }
  }, [activeTab, user, userRole])

  const handleLogout = async () => {
    try {
      console.log("Teacher logging out...")
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

      // コード一覧のみを再取得
      const codesResponse = await fetchWithAuth("/api/teacher/codes")
      setCodes(codesResponse.codes || [])
    } catch (error: any) {
      console.error("Error generating code:", error)
      toast({
        title: "エラー",
        description: error.message || "コードの生成に失敗しました",
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

      // FormDataを作成してローカルアップロードAPIに送信
      const formData = new FormData()
      formData.append("file", newStampImage)
      formData.append("fileName", newStampName)

      console.log("Uploading stamp image to local storage...")

      const user = auth.currentUser
      if (!user) {
        throw new Error("ユーザーが認証されていません")
      }

      const token = await user.getIdToken()

      const uploadResponse = await fetch("/api/upload/stamp-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "ファイルアップロードに失敗しました")
      }

      const uploadData = await uploadResponse.json()
      setUploadProgress(100)

      console.log("File uploaded successfully:", uploadData.imagePath)

      // APIにスタンプ画像情報を保存
      await fetchWithAuth("/api/teacher/stamp-images", {
        method: "POST",
        body: JSON.stringify({
          name: newStampName,
          imageUrl: uploadData.imagePath, // ローカルパスを保存
        }),
      })

      toast({
        title: "スタンプ追加成功",
        description: "新しいスタンプ画像を追加しました",
        variant: "default",
      })

      setNewStampName("")
      setNewStampImage(null)
      setUploadProgress(0)

      // スタンプ画像一覧のみを再取得
      const stampImagesResponse = await fetchWithAuth("/api/teacher/stamp-images")
      setStampImages(stampImagesResponse.stampImages || [])
    } catch (error: any) {
      console.error("Error uploading stamp image:", error)
      toast({
        title: "エラー",
        description: error.message || "スタンプ画像のアップロードに失敗しました",
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

      // スタンプ画像一覧のみを再取得
      const stampImagesResponse = await fetchWithAuth("/api/teacher/stamp-images")
      setStampImages(stampImagesResponse.stampImages || [])
    } catch (error: any) {
      console.error("Error toggling stamp active state:", error)
      toast({
        title: "エラー",
        description: error.message || "スタンプ状態の変更に失敗しました",
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

  const handleStudentDetailClick = (studentId: string) => {
    console.log("Opening student detail for ID:", studentId)
    setSelectedStudentId(studentId)
    setIsStudentDetailOpen(true)
  }

  const handleStudentDetailClose = () => {
    setIsStudentDetailOpen(false)
    setSelectedStudentId(null)
  }

  // 認証チェック中の表示
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  // ユーザーが認証されていない、または先生でない場合
  if (!user || (userRole && userRole !== "teacher")) {
    return null // useEffectでリダイレクトされる
  }

  // データ取得エラー時の表示
  if (!loading && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold text-gray-900">先生ダッシュボード</h1>
              <Button variant="outline" onClick={handleLogout}>
                ログアウト
              </Button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => fetchData()} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                再試行
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // データ取得中の表示
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold text-gray-900">先生ダッシュボード</h1>
              <Button variant="outline" onClick={handleLogout}>
                ログアウト
              </Button>
            </div>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  // データが空の場合でも表示する（初期状態）
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">先生ダッシュボード</h1>
            <Button variant="outline" onClick={handleLogout}>
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                  <CardTitle className="text-sm font-medium">交換済みカード</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.exchangedCards || 0}</div>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>発行済みコード</CardTitle>
                      <CardDescription>最近発行されたコード一覧</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {isPolling && (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>リアルタイム更新中</span>
                        </>
                      )}
                      {lastUpdated && <span className="text-xs">最終更新: {lastUpdated.toLocaleTimeString()}</span>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {codes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">まだコードが発行されていません</div>
                  ) : (
                    <div className="space-y-3">
                      {codes.slice(0, 10).map((code) => {
                        const isExpired = new Date() > new Date(code.expires_at)
                        const isUsable = !code.used && !isExpired

                        return (
                          <div
                            key={code.id}
                            className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                              code.used
                                ? "bg-gray-50 border-gray-200"
                                : isExpired
                                  ? "bg-red-50 border-red-200"
                                  : "bg-white border-green-200"
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <code
                                  className={`text-sm font-mono px-2 py-1 rounded ${
                                    code.used
                                      ? "bg-gray-200 text-gray-600"
                                      : isExpired
                                        ? "bg-red-100 text-red-800"
                                        : "bg-green-100 text-green-800"
                                  }}`}
                                >
                                  {code.code}
                                </code>
                                <Badge variant={code.type === "stamp" ? "default" : "secondary"}>
                                  {code.type === "stamp" ? "スタンプ" : "ギフト"}
                                </Badge>
                                <Badge
                                  variant={code.used ? "destructive" : isExpired ? "destructive" : "outline"}
                                  className={isUsable ? "border-green-500 text-green-700" : ""}
                                >
                                  {code.used ? "使用済み" : isExpired ? "期限切れ" : "未使用"}
                                </Badge>
                                {isUsable && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-green-600">利用可能</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                発行: {new Date(code.created_at).toLocaleString()}
                                {code.used && code.used_at && (
                                  <span className="ml-2">使用: {new Date(code.used_at).toLocaleString()}</span>
                                )}
                                <span className="ml-2">期限: {new Date(code.expires_at).toLocaleString()}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(code.code)}
                              disabled={!isUsable}
                              className={!isUsable ? "opacity-50" : ""}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        )
                      })}
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
                            <div className="text-sm text-gray-600">
                              完成: {student.completed_cards} | アクティブ: {student.active_cards} | 交換済み:{" "}
                              {student.exchanged_cards}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleStudentDetailClick(student.id)}>
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

        {/* 学生詳細モーダル */}
        <StudentDetailModal
          studentId={selectedStudentId}
          isOpen={isStudentDetailOpen}
          onClose={handleStudentDetailClose}
        />
      </main>
    </div>
  )
}
