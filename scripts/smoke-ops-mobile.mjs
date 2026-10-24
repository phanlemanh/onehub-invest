#!/usr/bin/env node
// Smoke bố cục thật của 6 bảng Ops trên điện thoại 390×844 và desktop 1280×800 (ON13 `ops-mobile-cot-trang-thai`
// AC-3, AC-4; design doc §3.2). Ngưỡng của hàng: «Ở 390px, cột Trạng thái của 6 bảng nằm trong khung nhìn khi chưa
// cuộn ngang».
//
// App: BASE_URL nếu có; không thì tự bật `next dev` từ app/ của chính worktree (scripts/lib/ops-app.mjs). Phiên: user
// admin tạm + phiên tạm trên DB localhost, xoá trong finally. Trình duyệt: playwright-core (app → collector của cây →
// collector của checkout chính), Chromium mặc định của playwright, vắng thì bản headless mới nhất trong ms-playwright.
// Ảnh chụp: .acceptance-runs/ops-mobile-cot-trang-thai/. Chạy: node scripts/smoke-ops-mobile.mjs
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync } from "node:fs"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { batApp, dbUrl, phienAdminTam } from "./lib/ops-app.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg")
const ANH = path.join(ROOT, ".acceptance-runs/ops-mobile-cot-trang-thai")

/** 6 bảng: nhận diện bằng một cột chỉ bảng đó có; tập cột gốc ghim từ main 4af4dd8 (design doc §3). */
const BANG = [
  { trang: "/ops/collections", ten: "Sức khoẻ nguồn", dau: "offers", tenCot: "code", trangThai: "state", goc: ["code", "state", "last", "fresh", "n24", "stg", "offers"] },
  { trang: "/ops/collections", ten: "Khoá an toàn & hạ tầng thu", dau: "layer", tenCot: "layer", trangThai: "state", goc: ["layer", "desc", "state"] },
  { trang: "/ops/collections", ten: "Nhóm S03", dau: "real7", tenCot: "name", trangThai: "status", goc: ["name", "status", "seen", "passed", "accepted", "owner", "real7", "mock7"], tenKhongCat: true },
  { trang: "/ops/collections", ten: "Máy móc", dau: "schedule", tenCot: "label", trangThai: "alive", goc: ["label", "schedule", "alive", "last", "line"] },
  { trang: "/ops/quality", ten: "Kiểm chất lượng", dau: "check", tenCot: "check", trangThai: "status", goc: ["check", "entity", "status", "detail", "at"] },
  { trang: "/ops/quality", ten: "Độ phủ trung thực", dau: "universe", tenCot: "name", trangThai: "ratio", goc: ["name", "our", "airdna", "universe", "ratio", "history", "captured"] },
]
const TRANG = [...new Set(BANG.map((b) => b.trang))]
const DUNG_SAI = 0.5

const fails = []
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`)
  if (!ok) fails.push(msg)
}

// ---------- tìm playwright-core + trình duyệt ----------

function timPlaywright() {
  const ung = [path.join(ROOT, "app/package.json"), path.join(ROOT, "collector/package.json")]
  try {
    const chung = execFileSync("git", ["-C", ROOT, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" }).trim()
    ung.push(path.join(path.dirname(chung), "collector/package.json"))
  } catch {
    /* không phải kho git */
  }
  for (const p of ung) {
    if (!existsSync(p)) continue
    try {
      return { pw: createRequire(p)("playwright-core"), tu: path.dirname(p) }
    } catch {
      /* không có ở đây */
    }
  }
  return null
}

function chromiumMoiNhat() {
  const goc = process.env.PLAYWRIGHT_BROWSERS_PATH || (process.platform === "darwin" ? path.join(os.homedir(), "Library/Caches/ms-playwright") : path.join(os.homedir(), ".cache/ms-playwright"))
  if (!existsSync(goc)) return null
  const thu = readdirSync(goc)
    .map((d) => ({ d, so: Number(d.match(/^chromium_headless_shell-(\d+)$/)?.[1] ?? NaN) }))
    .filter((x) => Number.isFinite(x.so))
    .sort((a, b) => b.so - a.so)
  for (const { d } of thu) {
    for (const con of readdirSync(path.join(goc, d))) {
      const exe = path.join(goc, d, con, "chrome-headless-shell")
      if (existsSync(exe)) return exe
    }
  }
  return null
}

async function batTrinhDuyet(chromium) {
  try {
    return await chromium.launch()
  } catch (e) {
    const exe = chromiumMoiNhat()
    if (!exe) throw new Error(`không có Chromium cho playwright-core (${String(e.message).split("\n")[0]}) và không thấy bản headless nào trong ms-playwright`)
    console.log(`trình duyệt: ${exe}`)
    return chromium.launch({ executablePath: exe })
  }
}

// ---------- đo trong trang ----------

/** Chạy trong trình duyệt: mọi bảng data-grid → cột, khung cuộn, ô trạng thái/tên từng hàng; cộng bề rộng tài liệu. */
function doTrang(spec) {
  const tron = (o) => {
    const r = o.getBoundingClientRect()
    const loi = []
    if (o.scrollWidth > o.clientWidth + 1) loi.push(`tràn ${o.scrollWidth}>${o.clientWidth}`)
    for (const c of o.querySelectorAll("*")) {
      const cr = c.getBoundingClientRect()
      if (cr.width === 0) continue
      if (cr.right > r.right + 0.5 || cr.left < r.left - 0.5) loi.push(`«${(c.textContent ?? "").trim().slice(0, 30)}» ${Math.round(cr.left)}–${Math.round(cr.right)} ngoài ô ${Math.round(r.left)}–${Math.round(r.right)}`)
      if (c.clientWidth > 0 && c.scrollWidth > c.clientWidth + 1) loi.push(`«${(c.textContent ?? "").trim().slice(0, 30)}» bị cắt ${c.scrollWidth}>${c.clientWidth}`)
    }
    return loi
  }
  const bang = []
  for (const t of document.querySelectorAll('table[data-slot="data-grid-table"]')) {
    const ids = [...t.querySelectorAll("thead th")].map((th) => th.getAttribute("data-col-id") ?? "")
    const s = spec.find((b) => ids.includes(b.dau))
    if (!s) continue
    let sc = t.parentElement
    while (sc && !/(auto|scroll|hidden)/.test(getComputedStyle(sc).overflowX)) sc = sc.parentElement
    const box = (sc ?? document.documentElement).getBoundingClientRect()
    const iTen = ids.indexOf(s.tenCot)
    const iTt = ids.indexOf(s.trangThai)
    const thTt = iTt >= 0 ? t.querySelectorAll("thead th")[iTt].getBoundingClientRect() : null
    const hang = [...t.querySelectorAll("tbody tr")]
      .map((tr) => [...tr.children].filter((c) => c.tagName === "TD"))
      .filter((tds) => tds.length === ids.length)
      .map((tds) => {
        const tt = tds[iTt]
        const r = tt?.getBoundingClientRect()
        return {
          nhan: (tt?.textContent ?? "").trim().slice(0, 40),
          phai: r ? r.right : NaN,
          nhanRong: tt ? Math.max(0, ...[...tt.querySelectorAll("*")].map((c) => c.getBoundingClientRect().width)) : 0,
          loiTt: tt ? tron(tt) : ["không có ô trạng thái"],
          loiTen: s.tenKhongCat && tds[iTen] ? tron(tds[iTen]) : [],
        }
      })
    bang.push({ ten: s.ten, ids, scrollLeft: sc ? sc.scrollLeft : 0, khungPhai: box.right, thTtTrai: thTt ? thTt.left : NaN, thTtPhai: thTt ? thTt.right : NaN, hang })
  }
  // Phần tử vượt mép phải màn hình mà không nằm trong một khung cuộn ngang nằm gọn trong màn hình: trang tràn ngang
  // (vùng nội dung có overflow-x cắt thì tài liệu không cuộn, nhưng phần tràn bị cắt mất — cùng là lỗi).
  const tran = []
  for (const el of document.body.querySelectorAll("*")) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0 || r.right <= innerWidth + 0.5) continue
    let a = el.parentElement
    let trongKhung = false
    while (a && a !== document.body) {
      if (/(auto|scroll)/.test(getComputedStyle(a).overflowX) && a.getBoundingClientRect().right <= innerWidth + 0.5) {
        trongKhung = true
        break
      }
      a = a.parentElement
    }
    if (!trongKhung) tran.push(`<${el.tagName.toLowerCase()}> ${Math.round(r.left)}–${Math.round(r.right)}`)
  }
  return { iw: innerWidth, docRong: document.documentElement.scrollWidth, tran: tran.slice(0, 3), soTran: tran.length, bang }
}

const specTrang = (trang) => BANG.filter((b) => b.trang === trang).map(({ ten, dau, tenCot, trangThai, tenKhongCat }) => ({ ten, dau, tenCot, trangThai, tenKhongCat }))

/** Lỗi ở 390px theo AC-3: mỗi lỗi mở đầu bằng tên bảng, hoặc «trang <đường>» cho lỗi cấp trang. */
function loi390(trang, m) {
  const loi = []
  if (m.docRong > 390) loi.push(`trang ${trang}: cuộn ngang — scrollWidth ${m.docRong} > 390`)
  if (m.soTran > 0) loi.push(`trang ${trang}: ${m.soTran} phần tử tràn mép phải 390 ngoài khung cuộn — ${m.tran.join(", ")}`)
  for (const b of BANG.filter((x) => x.trang === trang)) {
    const cac = m.bang.filter((x) => x.ten === b.ten)
    if (cac.length !== 1) {
      loi.push(`${b.ten}: ${cac.length === 0 ? "không thấy bảng" : `thấy ${cac.length} bảng`}`)
      continue
    }
    const t = cac[0]
    if (t.hang.length === 0) {
      loi.push(`không có hàng để đo — ${b.ten}`)
      continue
    }
    const iTen = t.ids.indexOf(b.tenCot)
    const iTt = t.ids.indexOf(b.trangThai)
    if (iTen !== 0 || iTt !== 1) loi.push(`${b.ten}: cột trạng thái «${b.trangThai}» ở vị trí ${iTt}, tên ở ${iTen} — phải là 1 ngay sau 0`)
    if (t.scrollLeft !== 0) loi.push(`${b.ten}: khung đã cuộn ngang ${t.scrollLeft}px`)
    const bien = Math.min(t.khungPhai, m.iw) + DUNG_SAI
    if (!(t.thTtPhai <= bien)) loi.push(`${b.ten}: tiêu đề cột trạng thái mép phải ${Math.round(t.thTtPhai)} > khung ${Math.round(Math.min(t.khungPhai, m.iw))}`)
    t.hang.forEach((h, i) => {
      if (!(h.phai <= bien)) loi.push(`${b.ten}: hàng ${i + 1} ô trạng thái mép phải ${Math.round(h.phai)} > khung ${Math.round(Math.min(t.khungPhai, m.iw))}`)
      for (const l of h.loiTt) loi.push(`${b.ten}: hàng ${i + 1} nhãn trạng thái không trọn trong ô — ${l}`)
      for (const l of h.loiTen) loi.push(`${b.ten}: hàng ${i + 1} tên bị cắt — ${l}`)
    })
  }
  return loi
}

/** Lỗi ở 1280px theo AC-4: tập cột = tập gốc (không thiếu, không trùng), trạng thái ngay sau tên. */
function loi1280(trang, m) {
  const loi = []
  for (const b of BANG.filter((x) => x.trang === trang)) {
    const t = m.bang.find((x) => x.ten === b.ten)
    if (!t) {
      loi.push(`${b.ten}: không thấy bảng`)
      continue
    }
    const thieu = b.goc.filter((id) => !t.ids.includes(id))
    const thua = t.ids.filter((id) => !b.goc.includes(id))
    const trung = t.ids.filter((id, i) => t.ids.indexOf(id) !== i)
    if (thieu.length) loi.push(`${b.ten}: thiếu cột ${thieu.join(", ")}`)
    if (thua.length) loi.push(`${b.ten}: cột lạ ${thua.join(", ")}`)
    if (trung.length) loi.push(`${b.ten}: trùng cột ${trung.join(", ")}`)
    if (t.ids.indexOf(b.trangThai) !== t.ids.indexOf(b.tenCot) + 1) loi.push(`${b.ten}: cột trạng thái không ngay sau cột tên`)
  }
  return loi
}

/** Chiều đỏ: sau khi sửa trang, phải có lỗi mở đầu bằng `tien_to`. */
function chieuDo(nhan, loi, tienTo) {
  const trung = loi.filter((l) => l.startsWith(tienTo))
  check(trung.length > 0, `chiều đỏ ${nhan} → ${trung.length > 0 ? `báo «${trung[0]}»` : `KHÔNG báo «${tienTo}…» (báo: ${loi.join(" | ") || "không gì"})`}`)
}

// ---------- chạy ----------

const tim = timPlaywright()
if (!tim) {
  console.log("FAIL không tìm thấy playwright-core (app/, collector/ của cây, collector/ của checkout chính)")
  process.exit(1)
}
console.log(`playwright-core: ${tim.tu}`)

mkdirSync(ANH, { recursive: true })
const db = new pg.Client({ connectionString: dbUrl() })
await db.connect()
const phien = await phienAdminTam(db, "mob")
const app = await batApp(ROOT)
let browser
try {
  browser = await batTrinhDuyet(tim.pw.chromium)

  // ---- 390×844 (AC-3) ----
  const dt = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await dt.addCookies([{ name: "oi_session", value: phien.token, url: app.base }])
  const p = await dt.newPage()
  const mo = async (trang) => {
    await p.goto(app.base + trang, { waitUntil: "networkidle", timeout: 180_000 })
    return p.evaluate(doTrang, specTrang(trang))
  }
  for (const trang of TRANG) {
    const m = await mo(trang)
    const loi = loi390(trang, m)
    const r = Math.round
    for (const b of BANG.filter((x) => x.trang === trang)) {
      const cua = loi.filter((l) => l.startsWith(`${b.ten}: `) || l.endsWith(`— ${b.ten}`))
      const loiBang = cua.filter((l) => !l.includes("tên bị cắt"))
      const t = m.bang.find((x) => x.ten === b.ten)
      check(
        loiBang.length === 0,
        loiBang.length === 0
          ? `390px ${b.ten}: ${t.hang.length} hàng · th trạng thái ${r(t.thTtTrai)}-${r(t.thTtPhai)} · td xa nhất ${r(Math.max(...t.hang.map((h) => h.phai)))} ≤ khung ${r(t.khungPhai)} ≤ ${m.iw} · nhãn trọn trong ô · ngay sau tên · scrollLeft 0`
          : `390px ${b.ten}: ${loiBang.join(" | ")}`,
      )
      if (b.tenKhongCat && t) {
        const cat = cua.filter((l) => l.includes("tên bị cắt"))
        check(cat.length === 0, cat.length === 0 ? `tên ${b.ten} không bị cắt (${t.hang.length} hàng, tên xuống dòng)` : cat.join(" | "))
      }
      if (t) {
        const anhBang = path.join(ANH, `390-${b.dau}.png`)
        await p.locator(`[data-slot="frame"]:has(table thead th[data-col-id="${b.dau}"])`).last().screenshot({ path: anhBang })
      }
    }
    const loiTrang = loi.filter((l) => l.startsWith(`trang ${trang}: `))
    check(loiTrang.length === 0, loiTrang.length === 0 ? `trang không cuộn ngang — ${trang} (scrollWidth ${m.docRong} ≤ 390, 0 phần tử tràn)` : loiTrang.join(" | "))
    const anh = path.join(ANH, `390${trang.replaceAll("/", "_")}.png`)
    await p.screenshot({ path: anh, fullPage: true })
    const anhBang = BANG.filter((b) => b.trang === trang).map((b) => path.join(ANH, `390-${b.dau}.png`))
    const du = [anh, ...anhBang].every((a) => existsSync(a))
    check(du, `ảnh chụp đã lưu — ${path.relative(ROOT, anh)} + ${anhBang.length} khung bảng (${anhBang.map((a) => path.basename(a)).join(", ")})`)
  }

  // ---- chiều đỏ 390 ----
  {
    // (a) cột đầu của một bảng rộng 400px
    const b = BANG.find((x) => x.ten === "Khoá an toàn & hạ tầng thu")
    await mo(b.trang)
    await p.evaluate(({ dau, px, viTri }) => {
      const t = [...document.querySelectorAll('table[data-slot="data-grid-table"]')].find((x) => x.querySelector(`thead th[data-col-id="${dau}"]`))
      const cols = [...t.querySelectorAll("colgroup col")]
      cols[viTri].style.width = `${px}px`
      t.style.width = `${cols.reduce((s, c) => s + parseFloat(c.style.width || "0"), 0)}px`
    }, { dau: b.dau, px: 400, viTri: 0 })
    chieuDo("(a) cột đầu 400px", loi390(b.trang, await p.evaluate(doTrang, specTrang(b.trang))), `${b.ten}: `)
  }
  {
    // (b) ô trạng thái của bảng có nhãn trạng thái rộng nhất còn 60px
    let chon = null
    for (const trang of TRANG) {
      const m = await mo(trang)
      for (const t of m.bang) {
        const rong = Math.max(0, ...t.hang.map((h) => h.nhanRong))
        if (!chon || rong > chon.rong) chon = { b: BANG.find((x) => x.ten === t.ten), rong }
      }
    }
    const { b, rong } = chon
    if (rong <= 60) check(false, `chiều đỏ (b) không dựng được: nhãn trạng thái rộng nhất ${Math.round(rong)}px ≤ 60px`)
    else {
      await mo(b.trang)
      await p.evaluate(({ dau, px, viTri }) => {
        const t = [...document.querySelectorAll('table[data-slot="data-grid-table"]')].find((x) => x.querySelector(`thead th[data-col-id="${dau}"]`))
        const cols = [...t.querySelectorAll("colgroup col")]
        cols[viTri].style.width = `${px}px`
        t.style.width = `${cols.reduce((s, c) => s + parseFloat(c.style.width || "0"), 0)}px`
      }, { dau: b.dau, px: 60, viTri: 1 })
      chieuDo(`(b) ô trạng thái 60px (${b.ten}, nhãn rộng nhất ${Math.round(rong)}px)`, loi390(b.trang, await p.evaluate(doTrang, specTrang(b.trang))), `${b.ten}: `)
    }
  }
  {
    // (c) một phần tử rộng 500px trong trang
    const trang = "/ops/quality"
    await mo(trang)
    await p.evaluate(() => {
      const d = document.createElement("div")
      d.style.width = "500px"
      d.style.height = "4px"
      ;(document.querySelector("main") ?? document.body).appendChild(d)
    })
    chieuDo("(c) phần tử 500px", loi390(trang, await p.evaluate(doTrang, specTrang(trang))), `trang ${trang}: `)
  }
  await dt.close()

  // ---- 1280×800 (AC-4) ----
  const dk = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await dk.addCookies([{ name: "oi_session", value: phien.token, url: app.base }])
  const q = await dk.newPage()
  const mo1280 = async (trang) => {
    await q.goto(app.base + trang, { waitUntil: "networkidle", timeout: 180_000 })
    return q.evaluate(doTrang, specTrang(trang))
  }
  for (const trang of TRANG) {
    const m = await mo1280(trang)
    const loi = loi1280(trang, m)
    for (const b of BANG.filter((x) => x.trang === trang)) {
      const cua = loi.filter((l) => l.startsWith(`${b.ten}: `))
      check(cua.length === 0, cua.length === 0 ? `1280px ${b.ten}: tập cột = tập gốc (${b.goc.length} cột), trạng thái ngay sau tên` : `1280px ${cua.join(" | ")}`)
    }
    await q.screenshot({ path: path.join(ANH, `1280${trang.replaceAll("/", "_")}.png`), fullPage: true })
  }
  {
    // gỡ một ô tiêu đề (biên: thiếu đúng một cột)
    const b = BANG.find((x) => x.ten === "Máy móc")
    await mo1280(b.trang)
    await q.evaluate(({ dau, id }) => {
      const t = [...document.querySelectorAll('table[data-slot="data-grid-table"]')].find((x) => x.querySelector(`thead th[data-col-id="${dau}"]`))
      t.querySelector(`thead th[data-col-id="${id}"]`).remove()
    }, { dau: b.dau, id: "line" })
    chieuDo("1280px: gỡ một ô tiêu đề", loi1280(b.trang, await q.evaluate(doTrang, specTrang(b.trang))), `${b.ten}: thiếu cột line`)
  }
  {
    // nhân đôi một ô tiêu đề rồi gỡ ô khác — số cột không đổi
    const b = BANG.find((x) => x.ten === "Kiểm chất lượng")
    await mo1280(b.trang)
    await q.evaluate(({ dau, nhan, go }) => {
      const t = [...document.querySelectorAll('table[data-slot="data-grid-table"]')].find((x) => x.querySelector(`thead th[data-col-id="${dau}"]`))
      const th = t.querySelector(`thead th[data-col-id="${nhan}"]`)
      th.after(th.cloneNode(true))
      t.querySelector(`thead th[data-col-id="${go}"]`).remove()
    }, { dau: b.dau, nhan: "entity", go: "detail" })
    const loi = loi1280(b.trang, await q.evaluate(doTrang, specTrang(b.trang)))
    chieuDo("1280px: nhân đôi một cột, gỡ cột khác (thiếu)", loi, `${b.ten}: thiếu cột detail`)
    chieuDo("1280px: nhân đôi một cột, gỡ cột khác (trùng)", loi, `${b.ten}: trùng cột entity`)
  }
  await dk.close()
} catch (e) {
  check(false, `smoke dừng giữa chừng: ${e.message}`)
} finally {
  await browser?.close()
  await app.tat()
  const con = await phien.xoa()
  await db.end()
  console.log(`dọn: ${con} phiên tạm còn lại`)
}

console.log(fails.length === 0 ? "\nsmoke-ops-mobile: PASS" : `\nsmoke-ops-mobile: FAIL (${fails.length})`)
process.exit(fails.length === 0 ? 0 : 1)
