"use client"

import { useEffect, useState } from "react"

import { ApprovalInbox } from "./components/approval-inbox"

export function Page() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => setIsReady(true), [])

  return isReady ? (
    <ApprovalInbox />
  ) : (
    <div className="bg-background min-h-svh w-full" aria-hidden="true" />
  )
}