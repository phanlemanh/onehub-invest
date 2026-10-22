"use client"

// chuyển thể từ @reui/solution-ai-ops-2 (provider-settings.tsx): trang cài đặt kết nối —
// dải đầu có thao tác, danh sách hàng kết nối trong một Frame xếp chồng, hộp Connect.
// Ở đây: tài khoản zalouser (thêm bằng QR) + nhóm của tài khoản đang chọn.
// Trên cloud (Vercel): chỉ đọc — danh sách từ ops-heartbeat, không nút quản trị.
// Mọi lời gọi API giữ nguyên như bản cũ (đo bằng b1-ops.mjs api-contract).
import { useCallback, useEffect, useRef, useState } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/reui/badge"
import { Frame, FrameDescription, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { fmtInt } from "@/lib/format"

import { ConfirmDelete } from "./confirm-delete"
import { ZaloAccountRow, type ZaloAccount } from "./zalo-account-row"
import { ZaloGroupsGrid, type ZaloGroup } from "./zalo-groups-grid"
import { ZaloQrDialog } from "./zalo-qr-dialog"

type GroupsResult = { groups: ZaloGroup[] | null; error: string | null }
type CloudAccount = { accountId: string; name: string | null; profile: string; enabledGroups: string[] }

async function fetchAccounts(): Promise<ZaloAccount[] | null> {
  const r = await fetch("/api/v1/ops/zalo/accounts")
  return r.ok ? (await r.json()).accounts : null
}

async function fetchGroups(accountId: string, refresh = false): Promise<GroupsResult> {
  try {
    const r = await fetch(`/api/v1/ops/zalo/groups?account=${encodeURIComponent(accountId)}${refresh ? "&refresh=1" : ""}`)
    const b = await r.json()
    if (!r.ok) throw new Error(b.error ?? `HTTP ${r.status}`)
    return { groups: b.groups, error: null }
  } catch (e) {
    return { groups: null, error: e instanceof Error ? e.message : "lỗi tải nhóm" }
  }
}

function Header({ children }: { children?: React.ReactNode }) {
  return (
    <Frame className="w-full">
      <FramePanel className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-px">
          <FrameTitle role="heading" aria-level={3}>
            Tài khoản Zalo
          </FrameTitle>
          <FrameDescription>Thêm tài khoản bằng QR · gán nhóm thu · 1 nhóm – 1 tài khoản</FrameDescription>
        </div>
        {children}
      </FramePanel>
    </Frame>
  )
}

function CloudAccounts() {
  const [accounts, setAccounts] = useState<CloudAccount[] | null>(null)
  useEffect(() => {
    // Cloud: đọc từ ops-heartbeat qua API collections
    fetch("/api/v1/ops/collections?days=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAccounts(d?.zaloAccounts ?? []))
      .catch(() => setAccounts([]))
  }, [])
  return (
    <div className="flex flex-col gap-3">
      <Header />
      <Frame stacked className="w-full">
        {accounts === null ? (
          <FramePanel>
            <Skeleton className="h-10 w-full" />
          </FramePanel>
        ) : accounts.length === 0 ? (
          <FramePanel className="text-muted-foreground text-sm">Chưa có dữ liệu tài khoản từ máy thu.</FramePanel>
        ) : (
          accounts.map((a) => (
            <FramePanel key={a.accountId} className="flex items-center gap-2">
              <span className="font-mono text-sm">{a.accountId}</span>
              <Badge variant="outline">{fmtInt(a.enabledGroups.length)} nhóm bật</Badge>
            </FramePanel>
          ))
        )}
      </Frame>
      <p className="text-muted-foreground text-xs">Danh sách từ máy thu (cập nhật mỗi 15 phút). Thêm tài khoản, QR, bật/tắt nhóm chỉ làm được trên máy thu.</p>
    </div>
  )
}

export function ZaloAccounts({ isCloud = false }: { isCloud?: boolean }) {
  if (isCloud) return <CloudAccounts />
  return <LocalAccounts />
}

function LocalAccounts() {
  const [accounts, setAccounts] = useState<ZaloAccount[] | null>(null)
  const [picked, setSelected] = useState<string>("default")
  const [groups, setGroups] = useState<ZaloGroup[] | null>(null)
  const [groupsFor, setGroupsFor] = useState<string | null>(null)
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [groupsError, setGroupsError] = useState<string | null>(null)
  const [newId, setNewId] = useState("")
  const [qr, setQr] = useState<{ accountId: string; base64: string | null } | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Tài khoản đang chọn bị gỡ (hoặc chưa từng có) → rơi về tài khoản đầu tiên; suy lúc render.
  const selected = accounts && !accounts.some((a) => a.accountId === picked) ? (accounts[0]?.accountId ?? "default") : picked
  // Nhóm đang hiển thị thuộc tài khoản khác tài khoản đang chọn → coi là đang tải.
  const groupsBusy = groupsLoading || groupsFor !== selected

  const loadAccounts = useCallback(async () => {
    const list = await fetchAccounts()
    if (list) setAccounts(list)
  }, [])
  const applyGroups = useCallback((accountId: string, res: GroupsResult) => {
    setGroups(res.groups)
    setGroupsError(res.error)
    setGroupsFor(accountId)
  }, [])
  const loadGroups = useCallback(
    async (accountId: string, refresh = false) => {
      setGroupsLoading(true)
      applyGroups(accountId, await fetchGroups(accountId, refresh))
      setGroupsLoading(false)
    },
    [applyGroups]
  )

  useEffect(() => {
    fetchAccounts().then((list) => {
      if (list) setAccounts(list)
    })
  }, [])
  useEffect(() => {
    if (!selected) return
    // Đổi tài khoản nhanh → bỏ kết quả của lần tải cũ về muộn.
    let stale = false
    fetchGroups(selected).then((res) => {
      if (!stale) applyGroups(selected, res)
    })
    return () => {
      stale = true
    }
  }, [selected, applyGroups])

  // Chọn/refresh lại → nếu có process login đang chạy cho account này (bắt đầu từ CLI/API
  // ngoài UI), hiện luôn hộp QR thay vì im lặng.
  useEffect(() => {
    if (!selected) return
    ;(async () => {
      const r = await fetch(`/api/v1/ops/zalo/login?account=${encodeURIComponent(selected)}`)
      if (!r.ok) return
      const s = await r.json()
      if (s.processAlive && s.qrBase64) {
        setQr({ accountId: selected, base64: s.qrBase64 })
        setConnected(s.connected)
      }
    })()
  }, [selected])

  // Poll trạng thái login khi có QR đang chờ quét
  useEffect(() => {
    if (!qr) return
    pollRef.current = setInterval(async () => {
      const r = await fetch(`/api/v1/ops/zalo/login?account=${encodeURIComponent(qr.accountId)}`)
      if (!r.ok) return
      const s = await r.json()
      setConnected(s.connected)
      if (s.qrBase64 && !qr.base64) setQr({ ...qr, base64: s.qrBase64 })
      if (s.connected === true) {
        if (pollRef.current) clearInterval(pollRef.current)
        toast.success("Đã kết nối", { description: `Tài khoản ${qr.accountId}` })
      }
    }, 3000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [qr])

  /** Bắt đầu (hoặc tái bắt đầu) QR login cho một tài khoản — tạo mới lẫn tài khoản sẵn có. */
  const startQr = useCallback(async (accountId: string) => {
    const lr = await fetch("/api/v1/ops/zalo/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountId }),
    })
    const lb = await lr.json()
    if (!lr.ok) {
      toast.error("Không tạo được mã QR", { description: lb.error })
      return
    }
    setQr({ accountId, base64: lb.qrBase64 })
    setConnected(null)
    toast("Quét mã QR bằng Zalo", { description: `Số điện thoại của tài khoản ${accountId}` })
  }, [])

  const createAccount = async () => {
    const r = await fetch("/api/v1/ops/zalo/accounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: newId.trim() }),
    })
    const b = await r.json()
    if (!r.ok) {
      toast.error("Không tạo được tài khoản", { description: b.error })
      return
    }
    setNewId("")
    toast.success("Đã tạo tài khoản", { description: b.account.accountId })
    await loadAccounts()
    setSelected(b.account.accountId)
    await startQr(b.account.accountId)
  }

  const toggleGroup = async (row: ZaloGroup) => {
    // Lạc quan: đổi ngay, lỗi thì hoàn giá trị cũ.
    setGroups((gs) => gs?.map((g) => (g.groupId === row.groupId ? { ...g, enabled: !row.enabled } : g)) ?? gs)
    const r = await fetch("/api/v1/ops/zalo/groups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountId: selected, groupId: row.groupId, enabled: !row.enabled }),
    })
    if (!r.ok) {
      setGroups((gs) => gs?.map((g) => (g.groupId === row.groupId ? { ...g, enabled: row.enabled } : g)) ?? gs)
      const b = r.status === 409 ? await r.json().catch(() => ({})) : {}
      toast.error(r.status === 409 ? "Nhóm thuộc tài khoản khác" : "Không ghi được cấu hình", { description: b.error })
      return
    }
    toast.success(!row.enabled ? "Đã bật nhóm" : "Đã tắt nhóm")
    await Promise.all([loadAccounts(), loadGroups(selected)])
  }

  const cancelLogin = async () => {
    if (!qr) return
    const r = await fetch(`/api/v1/ops/zalo/login?account=${encodeURIComponent(qr.accountId)}`, { method: "DELETE" })
    setQr(null)
    setConnected(null)
    if (!r.ok) toast.error("Không huỷ được lệnh đăng nhập")
    else toast("Đã huỷ lệnh đăng nhập", { description: "Bấm Đăng nhập QR khi sẵn sàng số điện thoại." })
  }

  const removeAccount = async (accountId: string) => {
    const r = await fetch("/api/v1/ops/zalo/accounts", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: accountId }),
    })
    const b = await r.json()
    setRemoving(null)
    if (!r.ok) toast.error("Không gỡ được tài khoản", { description: b.error })
    else toast.success("Đã gỡ tài khoản", { description: `${accountId} — session đã đăng xuất` })
    await loadAccounts()
  }

  const retryLogin = async (accountId: string) => {
    const lr = await fetch("/api/v1/ops/zalo/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountId }),
    })
    const lb = await lr.json()
    if (!lr.ok) {
      toast.error("Không tạo được mã QR mới", { description: lb.error })
      return
    }
    setQr({ accountId, base64: lb.qrBase64 })
    setConnected(null)
    toast("Đã tạo mã QR mới")
  }

  return (
    <div className="flex flex-col gap-3">
      <Header>
        <form
          className="flex w-full items-center sm:w-auto"
          onSubmit={(e) => {
            e.preventDefault()
            if (newId.trim()) void createAccount()
          }}
        >
          <ButtonGroup className="w-full sm:w-auto">
            <Input value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="id mới, vd acc2" aria-label="Id tài khoản mới" className="sm:w-40" />
            <Button type="submit" size="sm" variant="outline" disabled={!newId.trim()}>
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              Thêm
            </Button>
          </ButtonGroup>
        </form>
      </Header>

      <Frame stacked className="w-full">
        {accounts === null ? (
          <FramePanel>
            <Skeleton className="h-10 w-full" />
          </FramePanel>
        ) : (
          accounts.map((a) => (
            <FramePanel key={a.accountId} className="p-0!">
              <ZaloAccountRow
                account={a}
                selected={a.accountId === selected}
                onSelect={() => setSelected(a.accountId)}
                onLogin={() => startQr(a.accountId)}
                onRemove={a.accountId !== "default" ? () => setRemoving(a.accountId) : undefined}
              />
            </FramePanel>
          ))
        )}
      </Frame>

      <ZaloGroupsGrid account={selected} groups={groups} busy={groupsBusy} error={groupsError} onReload={() => loadGroups(selected, true)} onToggle={toggleGroup} />

      <ZaloQrDialog
        qr={qr}
        connected={connected}
        onOpenChange={(open) => {
          if (!open) setQr(null)
        }}
        onRetry={() => qr && retryLogin(qr.accountId)}
        onCancelLogin={cancelLogin}
      />
      <ConfirmDelete
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Gỡ tài khoản Zalo?"
        description={`Gỡ "${removing ?? ""}": session Zalo bị đăng xuất và cấu hình bị xoá (tệp .bak vẫn giữ để hoàn nguyên).`}
        confirmLabel="Gỡ tài khoản"
        onConfirm={() => removing && removeAccount(removing)}
      />
    </div>
  )
}
