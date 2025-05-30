"use client"

import { auth } from "./firebase"

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  try {
    const user = auth.currentUser
    if (!user) {
      console.error("fetchWithAuth: ユーザーが認証されていません")
      throw new Error("ユーザーが認証されていません")
    }

    console.log(`fetchWithAuth: ${options.method || "GET"} ${url} を実行中...`)
    const token = await user.getIdToken()
    console.log("fetchWithAuth: IDトークン取得成功")

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    console.log(`fetchWithAuth: リクエスト送信 - ${url}`)
    const response = await fetch(url, {
      ...options,
      headers,
    })

    console.log(`fetchWithAuth: レスポンス受信 - ${url} - ステータス: ${response.status}`)

    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`
      try {
        const errorData = await response.json()
        console.error(`fetchWithAuth: APIエラーレスポンス - ${url}:`, errorData)
        errorMessage = errorData.error || errorMessage
      } catch (parseError) {
        console.error(`fetchWithAuth: エラーレスポンスのパース失敗 - ${url}:`, parseError)
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log(`fetchWithAuth: 成功レスポンス - ${url}:`, data)
    return data
  } catch (error) {
    console.error(`fetchWithAuth: エラー発生 - ${url}:`, error)
    throw error
  }
}
