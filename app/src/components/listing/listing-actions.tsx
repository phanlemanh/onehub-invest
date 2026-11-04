"use client"

import { ExternalLinkIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Khe `actions` của PageHeader trên trang listing. */
export function ListingActions({ originalUrl }: { originalUrl: string | null }) {
  if (!originalUrl) return null
  return (
    <Button
      variant="outline"
      size="sm"
      className="text-xs shadow-xs"
      nativeButton={false}
      render={<a href={originalUrl} target="_blank" rel="noopener noreferrer" />}
    >
      <ExternalLinkIcon data-icon="inline-start" aria-hidden="true" />
      Mở trang gốc
    </Button>
  )
}
