"use client"

// Lưới «Sức khoẻ nguồn» + vùng «Lệnh gần đây» (TV4b): một chỗ giữ danh sách lệnh để cột Thao tác biết nguồn nào đang có
// lệnh chờ hay vừa áp, và để gửi xong thì vùng lệnh tải lại ngay. Dùng chung cho đường máy thu và đường cloud.
import { useCallback, useState } from "react"

import type { Vai } from "@/lib/auth"
import type { LenhHien } from "@/lib/lenh-hien"
import type { SourceFeedHealth } from "@/lib/ops-queries"

import { FeedsGrid } from "./feeds-grid"
import { LenhGanDay } from "./lenh-gan-day"

export function NguonVaLenh({
  feeds,
  stale = false,
  vai,
  actor,
  factsPushedAt,
}: {
  feeds: SourceFeedHealth[]
  stale?: boolean
  vai: Vai
  actor: string
  factsPushedAt: string | null
}) {
  const [lenh, setLenh] = useState<LenhHien[]>([])
  const [taiLai, setTaiLai] = useState(0)
  const onTai = useCallback((l: LenhHien[]) => setLenh(l), [])
  const onDaGui = useCallback(() => setTaiLai((n) => n + 1), [])
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div id="suc-khoe-nguon" className="min-w-0">
        <FeedsGrid feeds={feeds} stale={stale} thaoTac={{ vai, lenh, factsPushedAt, onDaGui }} />
      </div>
      <LenhGanDay vai={vai} actor={actor} taiLai={taiLai} onTai={onTai} />
    </div>
  )
}
