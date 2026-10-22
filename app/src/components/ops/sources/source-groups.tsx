"use client"

// chuyển thể từ @reui/solution-dev-ops-6 (data-grid-view.tsx, columns.tsx, connection-group.tsx):
// lưới "All connections" nhóm theo nguồn — mỗi nhóm thu là một kết nối có công tắc thu,
// xoá qua AlertDialog, thêm qua sheet. Mọi thao tác qua /api/v1/ops/source-groups (audit
// ops:write); bật/tắt lạc quan, lỗi thì hoàn giá trị cũ + báo lỗi.
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import type { InsightColumn } from "@/components/insight/insight-grid"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { fmtInt } from "@/lib/format"

import { StatusGrid, type StatusTab } from "../collections/status-grid"
import { ConfirmDelete } from "./confirm-delete"
import { NewGroupSheet, type GroupDraft } from "./new-group-sheet"

export type GroupRow = {
  id: number
  source_code: string
  group_key: string
  name: string
  enabled: boolean
  note: string | null
  fb_posts: number
}

const TITLE: Record<string, string> = { S05: "Nhóm Facebook (Apify)", S06: "Tỉnh/TP Chợ Tốt" }
const TABS: StatusTab<GroupRow>[] = [
  { value: "on", label: "Đang thu", tone: "bg-success", match: (g) => g.enabled },
  { value: "off", label: "Tắt", tone: "bg-muted-foreground/40", match: (g) => !g.enabled },
]
const EMPTY_DRAFT: GroupDraft = { sourceCode: "S05", groupKey: "", name: "" }

export function SourceGroups({ initial }: { initial: GroupRow[] }) {
  const router = useRouter()
  const [groups, setGroups] = useState(initial)
  const [pending, start] = useTransition()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<GroupDraft>({ sourceCode: "S05", groupKey: "", name: "" })
  const [deleting, setDeleting] = useState<GroupRow | null>(null)

  const call = (body: Record<string, unknown>) =>
    fetch("/api/v1/ops/source-groups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }))

  const toggle = (g: GroupRow) => {
    setGroups((gs) => gs.map((x) => (x.id === g.id ? { ...x, enabled: !g.enabled } : x)))
    call({ action: "toggle", sourceCode: g.source_code, groupKey: g.group_key, enabled: !g.enabled })
      .then(({ ok, data }) => {
        if (ok) return toast.success(!g.enabled ? "Đã bật thu nhóm" : "Đã tắt thu nhóm")
        setGroups((gs) => gs.map((x) => (x.id === g.id ? { ...x, enabled: g.enabled } : x)))
        toast.error("Không đổi được trạng thái nhóm", { description: data.error ?? "Lỗi máy chủ" })
      })
      .catch(() => {
        setGroups((gs) => gs.map((x) => (x.id === g.id ? { ...x, enabled: g.enabled } : x)))
        toast.error("Không đổi được trạng thái nhóm", { description: "Lỗi mạng" })
      })
  }

  const remove = (g: GroupRow) => {
    start(async () => {
      const { ok, data } = await call({ action: "delete", sourceCode: g.source_code, groupKey: g.group_key, purge: g.fb_posts > 0 })
      if (!ok) {
        toast.error("Không xoá được nhóm", { description: data.error ?? "Lỗi máy chủ" })
        return
      }
      toast.success("Đã xoá nhóm", { description: data.purged ? `Kèm ${fmtInt(data.purged)} bài` : undefined })
      setGroups((gs) => gs.filter((x) => x.id !== g.id))
      setDeleting(null)
    })
  }

  const add = () => {
    if (!form.groupKey.trim() || !form.name.trim()) return toast.error("Thiếu thông tin", { description: "Cần đủ URL/mã và tên hiển thị" })
    start(async () => {
      const { ok, data } = await call({ action: "add", ...form })
      if (!ok) {
        toast.error("Không thêm được nhóm", { description: data.error ?? "Lỗi máy chủ" })
        return
      }
      toast.success("Đã thêm nhóm", { description: "Hiệu lực từ chu kỳ thu kế tiếp" })
      setAdding(false)
      setForm(EMPTY_DRAFT)
      router.refresh()
    })
  }

  // Dựng lại mỗi render: toggle đọc state qua setter dạng hàm, cột rẻ.
  const columns: InsightColumn<GroupRow>[] = [
      {
        id: "name",
        accessorKey: "name",
        header: "Nhóm",
        cell: ({ row }) => (
          <span data-tier-a className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{row.original.name}</span>
            <span className="text-muted-foreground truncate text-xs">{row.original.group_key}</span>
          </span>
        ),
        size: 360,
      },
      { id: "posts", accessorKey: "fb_posts", header: "Bài", cell: ({ row }) => (row.original.fb_posts ? fmtInt(row.original.fb_posts) : "—"), size: 80, meta: { headerClassName: "text-end", cellClassName: "text-end tabular-nums" } },
      { id: "state", accessorKey: "enabled", header: "Trạng thái", cell: ({ row }) => <Badge variant={row.original.enabled ? "success-light" : "outline"}>{row.original.enabled ? "Đang thu" : "Tắt"}</Badge>, size: 110 },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <span className="flex items-center justify-end gap-2">
            <Switch size="sm" checked={row.original.enabled} onCheckedChange={() => toggle(row.original)} aria-label={`Bật/tắt thu nhóm ${row.original.name}`} />
            <Button size="icon-sm" variant="ghost" aria-label={`Xoá nhóm ${row.original.name}`} onClick={() => setDeleting(row.original)}>
              <Trash2Icon aria-hidden="true" />
            </Button>
          </span>
        ),
        size: 110,
      },
  ]

  const bySource = groups.reduce<Record<string, GroupRow[]>>((acc, g) => {
    ;(acc[g.source_code] ??= []).push(g)
    return acc
  }, {})
  const addButton = (
    <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
      <PlusIcon data-icon="inline-start" aria-hidden="true" />
      Thêm nhóm
    </Button>
  )
  const codes = Object.keys(bySource).length ? Object.keys(bySource) : ["S05"]

  return (
    <div className="flex flex-col gap-4">
      {codes.map((code, i) => {
        const list = bySource[code] ?? []
        return (
          <StatusGrid
            key={code}
            id={`nhom-${code.toLowerCase()}`}
            title={TITLE[code] ?? code}
            description={`${fmtInt(list.filter((g) => g.enabled).length)}/${fmtInt(list.length)} nhóm đang thu`}
            data={list}
            columns={columns}
            tabs={TABS}
            getRowId={(g) => String(g.id)}
            actions={i === 0 ? addButton : undefined}
          />
        )
      })}
      <NewGroupSheet open={adding} onOpenChange={setAdding} draft={form} onDraftChange={setForm} pending={pending} onSubmit={add} />
      <ConfirmDelete
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Xoá nhóm thu?"
        description={
          deleting
            ? deleting.fb_posts > 0
              ? `Xoá "${deleting.name}" và ${fmtInt(deleting.fb_posts)} bài dữ liệu của nó. Nhóm khác không bị đụng.`
              : `Xoá "${deleting.name}" khỏi danh sách thu.`
            : ""
        }
        confirmLabel="Xoá nhóm"
        pending={pending}
        onConfirm={() => deleting && remove(deleting)}
      />
    </div>
  )
}
