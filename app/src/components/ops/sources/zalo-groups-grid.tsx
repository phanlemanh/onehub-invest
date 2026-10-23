"use client"

// Nhóm (membership) của tài khoản đang chọn — lưới trong cùng khuôn Frame + DataGrid của
// solution-dev-ops-6; dải đầu giữ ô lọc + Tải lại như toolbar của khuôn đó.
// Bất biến 1 nhóm – 1 tài khoản: nhóm đã bật ở tài khoản khác thì công tắc bị khoá.
import { useMemo, useState } from "react"
import { useTable, type PaginationState } from "@tanstack/react-table"
import { CircleAlertIcon, RefreshCwIcon, RotateCwIcon, SearchIcon } from "lucide-react"

import { DATA_GRID_VI, type InsightColumn } from "@/components/insight/insight-grid"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { DataGrid, dataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Frame, FrameFooter, FramePanel } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { fmtInt } from "@/lib/format"

import { SectionHeader } from "../collections/section"

export type ZaloGroup = { groupId: string; name: string; enabled: boolean; ownedBy: string | null }

export function ZaloGroupsGrid({
  account,
  groups,
  busy,
  error,
  onReload,
  onToggle,
}: {
  account: string
  groups: ZaloGroup[] | null
  busy: boolean
  error: string | null
  onReload: () => void
  onToggle: (g: ZaloGroup) => void
}) {
  const [filter, setFilter] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })
  const needle = filter.trim().toLowerCase()
  const rows = useMemo(
    () =>
      (groups ?? [])
        .filter((g) => !needle || g.name.toLowerCase().includes(needle))
        .sort((a, b) => Number(b.enabled) - Number(a.enabled) || a.name.localeCompare(b.name)),
    [groups, needle]
  )
  const conflictOf = (g: ZaloGroup) => !g.enabled && g.ownedBy !== null && g.ownedBy !== account

  const columns: InsightColumn<ZaloGroup>[] = [
    { id: "name", accessorKey: "name", header: "Nhóm", cell: ({ row }) => <span id={`zalo-nhom-${row.original.groupId}`} data-tier-a className="block truncate">{row.original.name}</span>, size: 360 },
    {
      id: "on",
      header: "Đang bật",
      cell: ({ row }) => {
        const g = row.original
        const conflict = conflictOf(g)
        return (
          <span className="flex items-center gap-2">
            <Switch
              size="sm"
              checked={g.enabled}
              disabled={conflict}
              onCheckedChange={() => onToggle(g)}
              aria-label={conflict ? `Nhóm đã bật ở tài khoản ${g.ownedBy}` : "Bật/tắt nhóm"}
              aria-describedby={`zalo-nhom-${g.groupId}`}
            />
            {conflict ? <Badge variant="outline">ở {g.ownedBy}</Badge> : null}
          </span>
        )
      },
      size: 160,
    },
    { id: "owner", accessorFn: (g) => g.ownedBy ?? "", header: "Sở hữu", cell: ({ row }) => <span className="text-muted-foreground">{row.original.ownedBy ?? "—"}</span>, size: 120 },
  ]

  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns,
    getRowId: (g) => g.groupId,
    state: { pagination },
    onPaginationChange: setPagination,
  })

  return (
    <DataGrid table={table} recordCount={rows.length} i18n={DATA_GRID_VI} emptyMessage="Chưa thấy nhóm nào — đăng nhập QR cho tài khoản này rồi tải lại.">
      <Frame spacing="default" className="w-full min-w-0">
        <SectionHeader title={`Nhóm của ${account}`} description={groups ? `${fmtInt(groups.length)} nhóm membership · ${fmtInt(groups.filter((g) => g.enabled).length)} đang bật` : "Đang tải nhóm từ Zalo"}>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <InputGroup className="w-full sm:w-56">
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Lọc theo tên nhóm" aria-label="Lọc nhóm theo tên" />
            </InputGroup>
            <Button size="sm" variant="outline" onClick={onReload} disabled={busy}>
              <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
              Tải lại
            </Button>
          </div>
        </SectionHeader>
        <FramePanel className={busy || error ? "flex flex-col gap-2" : "p-0"}>
          {error && !busy ? (
            <Alert variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertTitle>Không tải được nhóm</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              <AlertAction>
                <Button size="sm" variant="outline" onClick={onReload}>
                  <RotateCwIcon data-icon="inline-start" aria-hidden="true" />
                  Thử lại
                </Button>
              </AlertAction>
            </Alert>
          ) : busy ? (
            <div aria-label="Đang tải nhóm từ Zalo (lần đầu khoảng 8 giây)" className="flex flex-col gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <DataGridScrollArea>
              <DataGridTable />
            </DataGridScrollArea>
          )}
        </FramePanel>
        <FrameFooter className="flex flex-col items-stretch gap-2">
          {rows.length > pagination.pageSize ? <DataGridPagination sizes={[25, 50, 100]} /> : null}
          <p className="text-muted-foreground text-xs">
            Bất biến 1 nhóm – 1 tài khoản (API chặn 409, công tắc khoá). Cấu hình ghi tại ~/.openclaw/openclaw.json (có .bak); thay đổi không có hiệu lực sau khoảng 1 phút thì chạy lại gateway OpenClaw.
          </p>
        </FrameFooter>
      </Frame>
    </DataGrid>
  )
}
