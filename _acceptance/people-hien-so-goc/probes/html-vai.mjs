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

const SO_LAN_TAI = 4
// Mốc dương theo trang: có ở thẻ tin hay hàng người, không có trong khung trang lỗi.
const MOC_NGUOI = /pty_/
const MOC_DEAL = /thước/

const DANG = /(?<![\da-zA-Z])(?:\+?84[35789]\d{8}|0[35789]\d{8}|0[35789]\d{2}[ .-]?\d{3}[ .-]?\d{3})(?![\da-zA-Z])/g

/** Đếm chỗ khớp khuôn SĐT trong một chuỗi. */
export function demSdt(s) {
  return s.match(DANG)?.length ?? 0
}

/** Next tự chép URL vào payload RSC. Chỉ bỏ đúng chuỗi người gõ ngay sau `?q=`; số ở chỗ khác vẫn bị đếm. */
export function boPhanChieuUrl(s, q) {
  return q ? s.split(`?q=${encodeURIComponent(q)}`).join("?q=") : s
}

/** Lý do trang CHƯA vẽ đúng (null là đã vẽ): HTTP lỗi, bị chuyển đi, thiếu mốc dương của trang, hay không phải phiên của vai này. */
export function lyDoChuaVe({ ok, status, url }, duong, noiDung, moc, email) {
  if (!ok) return `HTTP ${status}`
  if (new URL(url).pathname !== duong) return "bị chuyển trang"
  if (!moc.test(noiDung)) return "thiếu mốc"
  if (!noiDung.includes(email)) return "sai phiên"
  return null
}

/** Tải một trang; chỉ thử lại khi trang CHƯA vẽ (lỗi nhất thời của DB dùng chung), không thử lại khi trang vẽ rồi mà đếm sai. */
async function tai(url, headers, moc, email) {
  const duong = new URL(BASE + url).pathname
  for (let lan = 1; ; lan++) {
    const r = await fetch(BASE + url, { headers })
    const noiDung = await r.text()
    const loi = lyDoChuaVe(r, duong, noiDung, moc, email)
    if (!loi || lan === SO_LAN_TAI) return { noiDung, loi, lan }
    await new Promise((x) => setTimeout(x, 3000))
  }
}

// Đối chứng đỏ của lyDoChuaVe: ba dạng trang chưa vẽ phải bị bắt, trang đủ mốc thì không.
function tuKiem() {
  const OK = { ok: true, status: 200, url: `${BASE}/ops/deals` }
  const ca = [
    [{ ...OK, ok: false, status: 500 }, "<p>thước a@b</p>", "HTTP 500"],
    [{ ...OK, url: `${BASE}/login` }, "<p>thước a@b</p>", "bị chuyển trang"],
    [OK, "<p>Không tải được a@b</p>", "thiếu mốc"],
    [OK, "<p>thước</p>", "sai phiên"],
    [OK, "<p>thước a@b</p>", null],
  ]
  for (const [r, noiDung, cho] of ca) {
    const ra = lyDoChuaVe(r, "/ops/deals", noiDung, /thước/, "a@b")
    if (ra !== cho) throw new Error(`tự kiểm lyDoChuaVe: chờ ${cho}, ra ${ra}`)
  }
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
  tuKiem()
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
    const email = JSON.parse(readFileSync(join(ROOT, tep), "utf8")).email
    for (const [ten, url, q] of trang) {
      const moc = url.startsWith("/ops/deals") ? MOC_DEAL : MOC_NGUOI
      const h = await tai(url, { cookie }, moc, email)
      const r = await tai(url, { cookie, RSC: "1" }, moc, email)
      const n = { html: demSdt(boPhanChieuUrl(h.noiDung, q)), rsc: demSdt(boPhanChieuUrl(r.noiDung, q)) }
      const thuLai = h.lan + r.lan - 2
      const loi = [h.loi && `html ${h.loi}`, r.loi && `rsc ${r.loi}`].filter(Boolean).join(", ")
      console.log(`${vai} · ${ten} · html ${n.html} · rsc ${n.rsc}${thuLai ? ` · thử lại ${thuLai}` : ""}${loi ? ` · chưa vẽ: ${loi}` : ""}`)
      if (loi) hong++
      else if (vai === "viewer" && n.html + n.rsc > 0) hong++
      else if (vai !== "viewer" && ten !== "danh sách trang 2" && (n.html === 0 || n.rsc === 0)) hong++
    }
  }
  console.log(hong === 0 ? "SHS-AC-10 đạt" : `SHS-AC-10 hỏng ${hong} chỗ`)
  process.exit(hong === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(`SHS-AC-10 không chạy được: ${e.message}`)
  process.exit(2)
})
