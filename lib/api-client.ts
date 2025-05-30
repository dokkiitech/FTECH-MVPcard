"use client"

import { auth } from "./firebase"

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error("ユーザーが認証されていません")
    }

    console.log("Making authenticated request to:", url)
    const token = await user.getIdToken()
    console.log("Got ID token for API request")

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    console.log("API response status:", response.status)

    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`
      try {
        const errorData = await response.json()
        console.error("API error response:", errorData)
        errorMessage = errorData.error || errorMessage
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError)
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log("API success response:", data)
    return data
  } catch (error) {
    console.error("fetchWithAuth error:", error)
    throw error
  }
}
