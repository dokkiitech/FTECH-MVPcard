"use client"

import { auth } from "./firebase"

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User not authenticated")
  }

  const token = await user.getIdToken()

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(error.error || `API error: ${response.status}`)
  }

  return response.json()
}
