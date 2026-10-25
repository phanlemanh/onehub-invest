// soat-tang-a.test.tsx — NT2 `soat-tang-a-moi-duong-len-cloud` AC-9: tên tài khoản thu là tầng A (Hỏi-1 = A), bản tin
// ops-facts gửi `zaloAccounts[i].name = null`. Ô tài khoản của /ops/sources ở chế độ cloud render trong jsdom với facts ấy:
// hiện mã tài khoản, không lỗi, không chữ «null». Chiều đỏ: bản sao component hiện name thô → ca bắt. Tên ca mở đầu bằng mã AC.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { JSDOM } from "jsdom"

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3456/ops/sources" })
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
})
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })

// đúng dạng push-ops-facts gửi sau NT2 (pipeline/push-ops-facts.mjs): name null, mã tài khoản là accountId
const FACTS = {
  zaloAccounts: [
    { accountId: "default", name: null, profile: "default", enabledGroups: ["g1", "g2"] },
    { accountId: "phu", name: null, profile: "phu", enabledGroups: [] },
  ],
}
const DIR = join(import.meta.dirname, "../src/components/ops/sources")

async function renderCloud(file: string) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { act } = React
  const { createRoot } = await import("react-dom/client")
  const { ZaloAccounts } = await import(join(DIR, file))
  const urls: string[] = []
  globalThis.fetch = (async (url: string) => {
    urls.push(url)
    return { ok: true, json: async () => FACTS }
  }) as unknown as typeof fetch
  document.body.innerHTML = "<div id=root></div>"
  const root = createRoot(document.getElementById("root")!)
  await act(async () => {
    root.render(<ZaloAccounts isCloud />)
    await new Promise((r) => setTimeout(r, 0))
  })
  const text = document.body.textContent ?? ""
  await act(async () => root.unmount())
  return { text, urls }
}

function assertCodesShown({ text, urls }: { text: string; urls: string[] }) {
  assert.ok(urls.some((u) => u.startsWith("/api/v1/ops/collections")), "ô tài khoản cloud phải đọc facts từ /api/v1/ops/collections")
  assert.ok(!text.includes("Chưa có dữ liệu tài khoản"), "facts có hai tài khoản mà ô hiện trạng thái trống")
  for (const a of FACTS.zaloAccounts) assert.ok(text.includes(a.accountId), `không thấy mã tài khoản «${a.accountId}»`)
  assert.ok(!/\bnull\b/.test(text), "ô tài khoản hiện chữ «null»")
}

test("NT2-AC-9 /ops/sources cloud với zaloAccounts[i].name null → hiện mã tài khoản, không lỗi, không chữ null", async () => {
  assertCodesShown(await renderCloud("zalo-accounts.tsx"))
})

test("NT2-AC-9 bản sao hiện name thô → ca bắt", async () => {
  // bản sao đặt cạnh bản thật để import "@/…" và "./…" giải như cũ; xoá ngay sau khi render
  const src = readFileSync(join(DIR, "zalo-accounts.tsx"), "utf8")
  const anchor = `<span className="font-mono text-sm" translate="no">{a.accountId}</span>` // ON12: mã tài khoản là dữ liệu (translate="no")
  assert.ok(src.includes(anchor), "khuôn đột biến không khớp mã nguồn zalo-accounts.tsx")
  const file = `.nt2-mut-${process.pid}.tsx`
  writeFileSync(join(DIR, file), src.replace(anchor, `<span className="font-mono text-sm" translate="no">{String(a.name)}</span>`))
  try {
    const r = await renderCloud(file)
    assert.throws(() => assertCodesShown(r), /mã tài khoản|null/, "thước không bắt bản sao hiện name thô")
  } finally {
    rmSync(join(DIR, file), { force: true })
  }
})
