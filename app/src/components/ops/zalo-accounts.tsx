"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"

type Account = {
  accountId: string
  name: string | null
  profile: string
  explicitGroups: boolean
  enabledGroups: string[]
}
type GroupRow = { groupId: string; name: string; enabled: boolean; ownedBy: string | null }
type GroupsResult = { groups: GroupRow[] | null; error: string | null }

async function fetchAccounts(): Promise<Account[] | null> {
  const r = await fetch("/api/v1/ops/zalo/accounts")
  return r.ok ? (await r.json()).accounts : null
}

async function fetchGroups(accountId: string, refresh = false): Promise<GroupsResult> {
  try {
    const r = await fetch(
      `/api/v1/ops/zalo/groups?account=${encodeURIComponent(accountId)}${refresh ? "&refresh=1" : ""}`,
    )
    const b = await r.json()
    if (!r.ok) throw new Error(b.error ?? `HTTP ${r.status}`)
    return { groups: b.groups, error: null }
  } catch (e) {
    return { groups: null, error: e instanceof Error ? e.message : "lỗi tải nhóm" }
  }
}

/** Quản trị tài khoản zalouser: thêm (QR) + gán nhóm (bất biến 1 nhóm – 1 tài khoản).
 * Trên cloud (Vercel): read-only — danh sách từ ops-heartbeat, không nút quản trị. */
export function ZaloAccountsPanel({ isCloud = false }: { isCloud?: boolean }) {
  const [cloudAccounts, setCloudAccounts] = useState<{ accountId: string; name: string | null; profile: string; enabledGroups: string[] }[] | null>(null);
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [picked, setSelected] = useState<string>("default")
  const [groups, setGroups] = useState<GroupRow[] | null>(null)
  const [groupsFor, setGroupsFor] = useState<string | null>(null)
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [groupsError, setGroupsError] = useState<string | null>(null)
  const [filter, setFilter] = useState("")
  const [newId, setNewId] = useState("")
  const [msg, setMsg] = useState<string | null>(null)
  const [qr, setQr] = useState<{ accountId: string; base64: string | null } | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Tài khoản đang chọn bị gỡ (hoặc chưa từng có) → rơi về tài khoản đầu tiên.
  // Suy ra lúc render thay vì effect ghi lại state.
  const selected =
    accounts && !accounts.some((a) => a.accountId === picked)
      ? (accounts[0]?.accountId ?? "default")
      : picked
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
  const loadGroups = useCallback(async (accountId: string, refresh = false) => {
    setGroupsLoading(true)
    applyGroups(accountId, await fetchGroups(accountId, refresh))
    setGroupsLoading(false)
  }, [applyGroups])

  useEffect(() => {
    if (isCloud) {
      // Cloud: đọc từ ops-heartbeat qua API collections
      fetch("/api/v1/ops/collections?days=1")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setCloudAccounts(d?.zaloAccounts ?? []))
        .catch(() => setCloudAccounts([]));
    } else {
      fetchAccounts().then((list) => {
        if (list) setAccounts(list)
      })
    }
  }, [isCloud]) // isCloud là prop — ổn định
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

  // Chọn/refresh lại → nếu có process login đang chạy cho account này (bắt
  // đầu từ CLI/API ngoài UI), hiện luôn hộp QR thay vì im lặng.
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
        setMsg(`Tài khoản "${qr.accountId}" đã kết nối ✅`)
      }
    }, 3000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [qr])

  /** Bắt đầu (hoặc tái bắt đầu) QR login cho một tài khoản — dùng cho cả
   * tạo mới lẫn tài khoản sẵn có (acc tạo ngoài UI vẫn login được từ đây). */
  const startQr = useCallback(async (accountId: string) => {
    setMsg(null)
    const lr = await fetch("/api/v1/ops/zalo/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountId }),
    })
    const lb = await lr.json()
    if (!lr.ok) return setMsg(`Lỗi QR: ${lb.error}`)
    setQr({ accountId, base64: lb.qrBase64 })
    setConnected(null)
    setMsg(`Quét QR bằng app Zalo (số điện thoại của tài khoản "${accountId}"):`)
  }, [])

  const createAccount = async () => {
    setMsg(null)
    const r = await fetch("/api/v1/ops/zalo/accounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: newId.trim() }),
    })
    const b = await r.json()
    if (!r.ok) return setMsg(`Lỗi: ${b.error}`)
    setNewId("")
    await loadAccounts()
    setSelected(b.account.accountId)
    await startQr(b.account.accountId)
    setMsg(`Tài khoản "${b.account.accountId}" đã tạo — quét QR bằng Zalo (số điện thoại mới):`)
  }

  const toggleGroup = async (row: GroupRow) => {
    setMsg(null)
    const r = await fetch("/api/v1/ops/zalo/groups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountId: selected, groupId: row.groupId, enabled: !row.enabled }),
    })
    if (r.status === 409) {
      const b = await r.json()
      setMsg(`⚠ ${b.error}`)
      return
    }
    if (!r.ok) return setMsg("Lỗi ghi config")
    await Promise.all([loadAccounts(), loadGroups(selected)])
  }

  const cancelLogin = async () => {
    if (!qr) return
    await fetch(`/api/v1/ops/zalo/login?account=${encodeURIComponent(qr.accountId)}`, { method: "DELETE" })
    setQr(null)
    setConnected(null)
    setMsg("Đã huỷ lệnh login — bấm tài khoản và thử lại khi sẵn sàng số điện thoại.")
  }

  const removeAccount = async (accountId: string) => {
    if (!confirm(`Gỡ tài khoản "${accountId}"?\nSession Zalo bị đăng xuất và cấu hình bị xoá (file .bak vẫn giữ để hoàn nguyên).`)) return
    const r = await fetch("/api/v1/ops/zalo/accounts", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: accountId }),
    })
    const b = await r.json()
    setMsg(r.ok ? `Đã gỡ "${accountId}" (session đã logout)` : `Lỗi: ${b.error}`)
    await loadAccounts()
  }

  const retryLogin = async (accountId: string) => {
    const lr = await fetch("/api/v1/ops/zalo/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountId }),
    })
    const lb = await lr.json()
    setQr({ accountId, base64: lb.qrBase64 })
    setConnected(null)
  }

  if (isCloud) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground text-xs">
          Danh sách tài khoản từ máy thu (cập nhật mỗi 15 phút). Quản lý (thêm/QR/bật-tắt nhóm) chỉ thực hiện được trên máy thu.
        </p>
        {cloudAccounts === null ? (
          <p className="text-muted-foreground text-sm">Đang tải…</p>
        ) : cloudAccounts.length === 0 ? (
          <p className="text-muted-foreground text-sm">Chưa có dữ liệu tài khoản.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cloudAccounts.map((a) => (
              <span key={a.accountId} className="rounded-md border px-3 py-1.5 text-sm">
                {a.accountId}
                <span className="text-muted-foreground ml-2 text-xs">{a.enabledGroups.length} nhóm</span>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
  if (accounts === null) return <p className="text-muted-foreground text-sm">Đang tải…</p>

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {accounts.map((a) => (
          <span
            key={a.accountId}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm ${a.accountId === selected ? "border-primary bg-primary/10" : ""}`}
          >
            <button onClick={() => setSelected(a.accountId)}>{a.accountId}</button>
            <span className="text-muted-foreground text-xs">
              {a.enabledGroups.length} nhóm
            </span>
            {a.accountId !== "default" && (
              <button
                onClick={() => removeAccount(a.accountId)}
                title={`Gỡ tài khoản ${a.accountId}`}
                className="text-muted-foreground hover:text-destructive ml-1 px-1 text-sm leading-none"
              >
                ×
              </button>
            )}
          </span>
        ))}
        <span className="ml-2 flex items-center gap-1">
          <input
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="id mới (vd: acc2)"
            className="border-input bg-background h-8 w-40 rounded-md border px-2 text-sm"
          />
          <Button size="sm" variant="outline" onClick={createAccount} disabled={!newId.trim()}>
            + Thêm tài khoản
          </Button>
          <Button size="sm" variant="outline" onClick={() => startQr(selected)}>
            Đăng nhập QR &quot;{selected}&quot;
          </Button>
        </span>
      </div>

      {qr && (
        <div className="flex items-start gap-4 rounded-lg border p-3">
          {qr.base64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`data:image/png;base64,${qr.base64}`} alt="QR login Zalo" className="h-48 w-48" />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded border text-xs text-muted-foreground">
              đang sinh QR…
            </div>
          )}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Đăng nhập &quot;{qr.accountId}&quot;</p>
            <p className="text-muted-foreground text-xs">
              Mở app Zalo trên điện thoại của số MỚI → Quét QR. QR hết hạn ~2 phút — huỷ rồi
              thử lại nếu cần.
            </p>
            {connected === true ? (
              <Badge variant="success-light">Đã kết nối</Badge>
            ) : connected === false ? (
              <Badge variant="outline">Đang chờ quét…</Badge>
            ) : null}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => retryLogin(qr.accountId)}>
                QR mới
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelLogin}>
                Huỷ
              </Button>
            </div>
          </div>
        </div>
      )}

      {msg && <p className="text-sm">{msg}</p>}

      <div className="flex items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Lọc nhóm theo tên…"
          className="border-input bg-background h-8 w-56 rounded-md border px-2 text-sm"
        />
        <span className="text-muted-foreground text-xs">
          {groups ? `${groups.length} nhóm của "${selected}"` : ""}
        </span>
        <Button size="sm" variant="ghost" onClick={() => loadGroups(selected, true)} disabled={groupsBusy}>
          ↻ Tải lại
        </Button>
      </div>
      {groupsBusy && (
        <p className="text-muted-foreground text-sm">Đang tải nhóm từ Zalo (lần đầu ~8 giây)…</p>
      )}
      {groupsError && !groupsBusy && (
        <p className="text-destructive text-sm">
          Lỗi tải nhóm: {groupsError}{" "}
          <Button size="sm" variant="outline" onClick={() => loadGroups(selected, true)}>
            Thử lại
          </Button>
        </p>
      )}
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs">
            <tr>
              <th className="px-3 py-2">Nhóm (membership của &quot;{selected}&quot;)</th>
              <th className="px-3 py-2 text-right">Đang bật</th>
              <th className="px-3 py-2">Sở hữu</th>
            </tr>
          </thead>
          <tbody>
            {(groups ?? [])
              .filter((g) => !filter || g.name.toLowerCase().includes(filter.toLowerCase()))
              .sort((a, b) => Number(b.enabled) - Number(a.enabled) || a.name.localeCompare(b.name))
              .slice(0, 50)
              .map((g) => {
              const conflict = !g.enabled && g.ownedBy && g.ownedBy !== selected
              return (
                <tr key={g.groupId} className="border-t">
                  <td className="px-3 py-2">{g.name}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant={g.enabled ? "default" : conflict ? "ghost" : "outline"}
                      disabled={Boolean(conflict)}
                      title={conflict ? `Đã bật ở "${g.ownedBy}" — nguyên tắc 1 nhóm – 1 tài khoản` : undefined}
                      onClick={() => toggleGroup(g)}
                    >
                      {g.enabled ? "Bật" : conflict ? `ở ${g.ownedBy}` : "Tắt"}
                    </Button>
                  </td>
                  <td className="text-muted-foreground px-3 py-2 text-xs">{g.ownedBy ?? "—"}</td>
                </tr>
              )
            })}
            {groups !== null && groups.length === 0 && !groupsError && (
              <tr className="border-t">
                <td className="text-muted-foreground px-3 py-3 text-xs" colSpan={3}>
                  Chưa thấy nhóm nào (tài khoản chưa login?) — quét QR trước rồi tải lại.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground text-xs">
        Bất biến: 1 nhóm – 1 tài khoản (API chặn 409 + nút disable). Config ghi tại
        ~/.openclaw/openclaw.json (có .bak); nếu thay đổi không có hiệu lực trong ~1 phút, chạy
        lại gateway OpenClaw.
      </p>
    </div>
  )
}
