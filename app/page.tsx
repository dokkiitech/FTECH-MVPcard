import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, BookOpen, Star, Gift } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">学スタMVP</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            スタンプを集めてギフトカードと交換！
            <br />
            学生のモチベーションアップアプリ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/student/login">
              <Button size="lg" className="w-full sm:w-auto">
                <GraduationCap className="w-5 h-5 mr-2" />
                学生としてログイン
              </Button>
            </Link>
            <Link href="/teacher/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <BookOpen className="w-5 h-5 mr-2" />
                先生としてログイン
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <CardTitle>スタンプ収集</CardTitle>
              <CardDescription>先生からもらったコードでスタンプをゲット</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                3個のスタンプでカード完成！モチベーションを維持しながら学習を進めよう。
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Gift className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <CardTitle>ギフト交換</CardTitle>
              <CardDescription>完成したカードをギフトカードと交換</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">スターバックス、Amazon、その他様々なギフトカードと交換可能。</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BookOpen className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <CardTitle>進捗管理</CardTitle>
              <CardDescription>先生は学生の進捗をリアルタイムで確認</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                インサイト機能で学生のモチベーション状況を把握し、適切なサポートを提供。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
