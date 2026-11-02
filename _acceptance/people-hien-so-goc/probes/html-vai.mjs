#!/usr/bin/env node
// people-hien-so-goc E12 (AC-10): đăng nhập thật ba vai trên bản đang chạy, tải HTML và payload RSC của ba trang, đếm chuỗi SĐT.
// Đầu ra chỉ có số đếm, không có số điện thoại. Cần: BASE_URL (mặc định :3460), DB máy thu, tài khoản thử của scripts/dev-ops-account.mjs.
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..")
const pg = createRequire(join(ROOT, "app/package.json"))("pg")
const BASE = process.env.BASE_URL ?? "http://localhost:3460"
const DB = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const VAI = { viewer: ".claude/viewer-test-account.json", ops: ".claude/ops-role-test-account.json", admin: ".claude/ops-test-account.json" }

const DANG = /(?<![\da-zA-Z])(?:\+?84[35789]\d{8}|0[35789]\d{8}|0[35789]\d{2}[ .-]?\d{3}[ .-]?\d{3})(?![\da-zA-Z])/g

/** Đếm chỗ khớp khuôn SĐT trong một chuỗi. */
export function demSdt(s) {
  return s.match(DANG)?.length ?? 0
}

/** Next tự chép URL vào payload RSC. Chỉ bỏ đúng chuỗi người gõ ngay sau `?q=`; số ở chỗ khác vẫn bị đếm. */
export function boPhanChieuUrl(s, q) {
  return q ? s.split(`?q=${encodeURIComponent(q)}`).join("?q=") : s
}

async function dangNhap(tep) {
  const { email, password } = JSON.parse(readFileSync(join(ROOT, tep), "utf8"))
  const trang = await (await fetch(`${BASE}/login`)).text()
  const id = /name="(\$ACTION_ID_[0-9a-f]+)"/.exec(trang)?.[1]
  if (!id) throw new Error("không thấy form /login — bản đang chạy chưa sẵn sàng")
  const form = new FormData()
  form.set(id, "")
  form.set("email", email)
  form.set("password", password)
  form.set("next", "/ops")
  const r = await fetch(`${BASE}/login`, { method: "POST", body: form, redirect: "manual" })
  const m = /oi_session=[^;]+/.exec(r.headers.get("set-cookie") ?? "")
  if (!m) throw new Error(`đăng nhập ${tep} không ra phiên (HTTP ${r.status})`)
  return m[0]
}

async function main() {
  const c = new pg.Client({ connectionString: DB })
  await c.connect()
  const { rows } = await c.query(
    `SELECT a.object_key, a.value FROM registry_aliases a JOIN parties p ON p.party_key = a.object_key
     WHERE a.kind = 'sdt' AND a.retired_at IS NULL AND p.status = 'active' ORDER BY a.object_key LIMIT 1`,
  )
  await c.end()
  if (!rows[0]) throw new Error("DB máy thu không có người mang bí danh sdt")
  const { object_key: khoa, value: so } = rows[0]
  const d = so.slice(3)
  const dang = [so, `0${d}`, `84${d}`, `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`, `0${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`, `(+84) ${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`]
  const trang = [
    ...dang.map((g, i) => [`tìm dạng ${i + 1}`, `/ops/people?q=${encodeURIComponent(g)}`, g]),
    ["danh sách nguồn S05", "/ops/people?source=S05"],
    ["danh sách trang 2", "/ops/people?page=2"],
    ["một người", `/ops/people/${khoa}`],
    ["căn giá tốt", "/ops/deals"],
  ]
  let hong = 0
  for (const [vai, tep] of Object.entries(VAI)) {
    const cookie = await dangNhap(tep)
    for (const [ten, url, q] of trang) {
      const html = await (await fetch(BASE + url, { headers: { cookie } })).text()
      const rsc = await (await fetch(BASE + url, { headers: { cookie, RSC: "1" } })).text()
      const n = { html: demSdt(boPhanChieuUrl(html, q)), rsc: demSdt(boPhanChieuUrl(rsc, q)) }
      console.log(`${vai} · ${ten} · html ${n.html} · rsc ${n.rsc}`)
      if (vai === "viewer" && n.html + n.rsc > 0) hong++
      if (vai !== "viewer" && ten !== "danh sách trang 2" && n.html === 0) hong++
    }
  }
  console.log(hong === 0 ? "SHS-AC-10 đạt" : `SHS-AC-10 hỏng ${hong} chỗ`)
  process.exit(hong === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(`SHS-AC-10 không chạy được: ${e.message}`)
  process.exit(2)
})
