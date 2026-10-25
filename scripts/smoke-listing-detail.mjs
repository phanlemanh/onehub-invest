#!/usr/bin/env node
// Smoke trình duyệt thật cho /listing/[id] sau UI5 (listing-detail-product-detail-5): đầu trang product-detail-5
// (gallery ảnh tự thu + hộp Đặc điểm), ảnh chết rời gallery, lịch trống có Empty, không cuộn ngang ở 375 px.
// Cần app chạy TỪ worktree đang kiểm (BASE_URL, mặc định :3460 của dãy U1) + DB local :5433.
// Chromium qua playwright-core (cùng cách tìm với smoke-ops-mobile.mjs). Ảnh chết dựng bằng chặn mạng:
// CDN trả 404 cho đúng ảnh chọn — không sửa DB.
// Dùng: BASE_URL=http://localhost:3460 node scripts/smoke-listing-detail.mjs [--chup <thư mục ảnh>]
//   --chup: chụp ma trận trạng thái × khổ × giao diện (design-pass / bằng chứng ui-check).
// Exit 0 = đạt; mỗi kiểm in một dòng «ok …» / «FAIL …».
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync } from "node:fs"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const BASE = (process.env.BASE_URL ?? "http://localhost:3460").replace(/\/$/, "")
const DB = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const chupIdx = process.argv.indexOf("--chup")
const CHUP = chupIdx > 0 ? path.resolve(process.argv[chupIdx + 1] ?? "") : null

const fails = []
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`)
  if (!ok) fails.push(msg)
}

// ---------- playwright-core + Chromium (khuôn của smoke-ops-mobile.mjs) ----------

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
      return createRequire(p)("playwright-core")
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
    if (!exe) throw new Error(`không có Chromium cho playwright-core (${String(e.message).split("\n")[0]})`)
    return chromium.launch({ executablePath: exe })
  }
}

// ---------- mẫu từ DB ----------

// COALESCE: photo_urls NULL thì NOT(...) vẫn là true (không thì NULL nuốt mất ca không ảnh).
const coAnh = "COALESCE(jsonb_typeof(l.photo_urls) = 'array' AND jsonb_array_length(l.photo_urls) > 0, false)"
const coLich = "EXISTS (SELECT 1 FROM nights n WHERE n.listing_id = l.id)"

async function chonMau() {
  const require = createRequire(path.join(ROOT, "app/package.json"))
  const pool = new (require("pg").Pool)({ connectionString: DB })
  try {
    const one = async (sql) => (await pool.query(sql)).rows[0] ?? null
    return {
      // Nhiều ảnh nhất, có lịch — ca gallery đầy đủ.
      coAnh: await one(`SELECT l.id, l.photo_urls AS photos FROM listings l WHERE ${coAnh} AND ${coLich}
                         ORDER BY jsonb_array_length(l.photo_urls) DESC, l.id LIMIT 1`),
      khongAnh: await one(`SELECT l.id FROM listings l WHERE NOT (${coAnh}) AND ${coLich} ORDER BY l.id LIMIT 1`),
      khongLich: await one(`SELECT l.id FROM listings l WHERE NOT ${coLich} ORDER BY l.id LIMIT 1`),
    }
  } finally {
    await pool.end()
  }
}

// ---------- đo trong trang ----------

/** Trạng thái đầu trang: gallery, ảnh chính, thumbnail, cột lưới, link Airbnb, bề rộng tài liệu. */
function doDauTrang() {
  const hero = document.querySelector('section[aria-label="Thông tin listing"]')
  const imgs = hero ? [...hero.querySelectorAll("img")] : []
  const radios = hero ? [...hero.querySelectorAll('[role="radio"]')] : []
  const main = imgs.find((i) => i.getAttribute("alt"))
  return {
    hero: Boolean(hero),
    cot: hero ? getComputedStyle(hero).gridTemplateColumns.split(" ").filter(Boolean).length : 0,
    soAnh: imgs.length,
    srcs: imgs.map((i) => i.getAttribute("src")),
    mainAlt: main?.getAttribute("alt") ?? null,
    radios: radios.length,
    // Dải thumbnail: số hàng (theo top), số ô nằm trọn trong khung cuộn.
    hang: new Set(radios.map((r) => Math.round(r.getBoundingClientRect().top))).size,
    trongKhung: (() => {
      const vp = radios[0]?.closest('[data-slot="scroll-area-viewport"]')
      if (!vp) return 0
      const b = vp.getBoundingClientRect()
      return radios.filter((r) => {
        const a = r.getBoundingClientRect()
        return a.left >= b.left - 1 && a.right <= b.right + 1
      }).length
    })(),
    checked: radios.findIndex((r) => r.getAttribute("aria-checked") === "true"),
    facts: hero ? [...hero.querySelectorAll("dt")].map((d) => d.textContent) : [],
    airbnb: hero ? [...hero.querySelectorAll("a")].some((a) => /airbnb\.com\/rooms\//.test(a.href) && /Mở trên Airbnb/.test(a.textContent)) : false,
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }
}

const norm = (u) => String(u).replace(/^https?:\/\//, "").split("?")[0]

async function mo(ctx, id, { chan = [] } = {}) {
  const page = await ctx.newPage()
  if (chan.length) {
    const bo = new Set(chan.map(norm))
    await page.route(/muscache\.com/, (route) => (bo.has(norm(route.request().url())) ? route.fulfill({ status: 404, body: "" }) : route.continue()))
  }
  const res = await page.goto(`${BASE}/listing/${encodeURIComponent(id)}`, { waitUntil: "networkidle" })
  // Thumbnail tải lười: cuộn xuống rồi lên để mọi ảnh bắt đầu tải (ảnh chết mới báo lỗi).
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(400)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(300)
  return { page, status: res?.status() ?? 0 }
}

async function chup(page, ten) {
  if (!CHUP) return
  mkdirSync(CHUP, { recursive: true })
  await page.screenshot({ path: path.join(CHUP, `${ten}.png`), fullPage: true })
  console.log(`info chụp ${path.join(CHUP, `${ten}.png`)}`)
}

const KHO = { "desktop-1280": { width: 1280, height: 900 }, "mobile-375": { width: 375, height: 812 } }

const pw = timPlaywright()
if (!pw) {
  console.log("FAIL không tìm thấy playwright-core (app/ hay collector/)")
  process.exit(1)
}
const mau = await chonMau()
check(Boolean(mau.coAnh && mau.coAnh.photos.length >= 3), `DB có listing ≥3 ảnh tự thu có lịch (${mau.coAnh?.id ?? "không"})`)
check(Boolean(mau.khongAnh), `DB có listing không ảnh tự thu có lịch (${mau.khongAnh?.id ?? "không"})`)
check(Boolean(mau.khongLich), `DB có listing chưa có lịch (${mau.khongLich?.id ?? "không"})`)

const browser = await batTrinhDuyet(pw.chromium)
try {
  for (const [kho, viewport] of Object.entries(KHO)) {
    for (const theme of kho === "desktop-1280" ? ["light", "dark"] : ["light"]) {
      const ctx = await browser.newContext({ viewport, colorScheme: theme })
      const tag = `${kho}${theme === "dark" ? "--dark" : ""}`

      if (mau.coAnh) {
        const { id, photos } = mau.coAnh
        const n = Math.min(photos.length, 10)
        const { page, status } = await mo(ctx, id)
        const d = await page.evaluate(doDauTrang)
        check(status === 200, `[${tag}] co-anh ${id}: 200 (${status})`)
        check(d.hero && d.radios === n && d.checked === 0, `[${tag}] co-anh: ${d.radios}/${n} thumbnail, đang chọn ảnh 1 (${d.checked + 1})`)
        check(d.mainAlt?.startsWith(`Ảnh 1/${n} — `), `[${tag}] co-anh: ảnh chính alt «${d.mainAlt}»`)
        const tuThu = new Set(photos.map(norm))
        check(d.srcs.length > 0 && d.srcs.every((s) => tuThu.has(norm(s))), `[${tag}] co-anh: ${d.srcs.length} ảnh, tất cả thuộc photo_urls tự thu`)
        check(d.hang === 1 && d.trongKhung === Math.min(n, 5), `[${tag}] co-anh: dải thumbnail ${d.hang} hàng, ${d.trongKhung}/${n} ô trong khung (5 ô vừa khung, còn lại trượt)`)
        check(d.airbnb, `[${tag}] co-anh: nút «Mở trên Airbnb» trong hộp Đặc điểm`)
        check(d.facts.includes("Loại phòng"), `[${tag}] co-anh: hộp Đặc điểm có dòng Loại phòng (${d.facts.join(", ")})`)
        check(d.cot === (kho === "desktop-1280" ? 2 : 1), `[${tag}] co-anh: ${d.cot} cột (gallery + Đặc điểm cạnh nhau ở desktop, xếp dọc ở mobile)`)
        check(d.sw === d.cw, `[${tag}] co-anh: không cuộn ngang (scrollWidth ${d.sw} = clientWidth ${d.cw})`)
        await chup(page, `co-anh--${tag}`)
        if (kho === "desktop-1280" && theme === "light") {
          // Bấm thumbnail 3 rồi phím → : ảnh chính theo lựa chọn (Radio của Base UI, phím mũi tên thật).
          await page.locator('[role="radio"]').nth(2).click()
          const sau = await page.evaluate(doDauTrang)
          check(sau.mainAlt?.startsWith(`Ảnh 3/${n} — `) && sau.checked === 2, `bấm thumbnail 3 → ảnh chính «${sau.mainAlt}»`)
          await page.keyboard.press("ArrowRight")
          const phim = await page.evaluate(doDauTrang)
          check(phim.mainAlt?.startsWith(`Ảnh 4/${n} — `) && phim.checked === 3, `phím → → ảnh chính «${phim.mainAlt}»`)
          // Dải trượt theo ảnh đang chọn: chọn ô 5, → ba lần sang ô 8 — ô 8 trọn trong khung, trang không cuộn dọc.
          if (n >= 8) {
            await page.locator('[role="radio"]').nth(4).click()
            const y0 = await page.evaluate(() => window.scrollY)
            for (let k = 0; k < 3; k++) await page.keyboard.press("ArrowRight")
            await page.waitForTimeout(700)
            const theo = await page.evaluate(() => {
              const a = document.querySelector('[role="radio"][aria-checked="true"]')
              const vp = a?.closest('[data-slot="scroll-area-viewport"]')
              if (!a || !vp) return null
              const r = a.getBoundingClientRect()
              const b = vp.getBoundingClientRect()
              return { nhan: a.getAttribute("aria-label"), trong: r.left >= b.left - 1 && r.right <= b.right + 1, y: window.scrollY, x: vp.scrollLeft }
            })
            check(
              theo?.nhan === `Xem ảnh 8/${n}` && theo.trong && theo.x > 0 && theo.y === y0,
              `dải trượt theo phím: ${theo?.nhan} trong khung (${theo?.trong}), cuộn ngang ${theo?.x}px, trang dọc ${y0}→${theo?.y}`,
            )
          }
          // Quy định khung ảnh: khung ảnh chính 3:2; mỗi ảnh (bấm lần lượt) phủ kín khi rộng/cao ≥ 1,2, hiện trọn khi < 1,2.
          const khung = []
          for (let k = 0; k < n; k++) {
            await page.locator('[role="radio"]').nth(k).click()
            await page.waitForFunction(() => {
              const m = document.querySelector('section[aria-label="Thông tin listing"] img[data-fit]')
              return m && m.complete && m.naturalWidth > 0
            }, null, { timeout: 8000 }).catch(() => {})
            khung.push(await page.evaluate(() => {
              const m = document.querySelector('section[aria-label="Thông tin listing"] img[data-fit]')
              const f = m.parentElement.getBoundingClientRect()
              const r = m.naturalWidth / m.naturalHeight
              return { r, fit: m.dataset.fit, frame: f.width / f.height, muon: r < 1.2 ? "contain" : "cover", nap: m.naturalWidth > 0 }
            }))
          }
          const sai = khung.filter((x) => x.nap && x.fit !== x.muon)
          const doc = khung.filter((x) => x.nap && x.muon === "contain").length
          check(
            khung.every((x) => Math.abs(x.frame - 1.5) < 0.02) && sai.length === 0 && khung.filter((x) => x.nap).length === n,
            `khung ảnh 3:2, ${n}/${n} ảnh đúng luật phủ kín/hiện trọn (${doc} ảnh dọc/vuông hiện trọn, ${sai.length} sai)`,
          )
          await page.locator('[role="radio"]').nth(0).click()
          const kpi = await page.locator("h3", { hasText: /^(Giá niêm yết|Công suất|Đêm đã đặt|Doanh thu ước tính)$/ }).count()
          check(kpi === 4, `bốn ô KPI sau khi vùng tải xong (${kpi})`)
          // Vùng comps phân giải ra bảng thật (không Alert, không Empty) trên listing có comps.
          const comps = await page.evaluate(() => {
            const title = [...document.querySelectorAll("[role=heading]")].find((h) => h.textContent === "Listing tương tự")
            const frame = title?.closest('[data-slot="frame"]')
            return {
              rows: frame ? frame.querySelectorAll('tbody tr a[href^="/listing/"]').length : 0,
              alert: document.body.textContent.includes("Không tải được listing tương tự"),
            }
          })
          check(comps.rows >= 1 && !comps.alert, `comps: ${comps.rows} hàng trong bảng Listing tương tự, không lỗi`)
          // Tooltip tóm tắt lịch mở bằng bàn phím: Shift+Tab rồi Tab về nút tóm tắt đầu (focus do bàn phím).
          const sum = page.locator('button[aria-label^="Công suất "]')
          await sum.focus()
          await page.keyboard.press("Shift+Tab")
          await page.keyboard.press("Tab")
          const tip = await page
            .locator('[data-slot="tooltip-content"]')
            .filter({ hasText: /^Công suất / })
            .waitFor({ state: "visible", timeout: 3000 })
            .then(() => true, () => false)
          check(tip, "tooltip «Công suất …» của lịch mở khi nút tóm tắt nhận focus bằng Tab")
          // Tab thật từ nút tóm tắt cuối vào lưới đêm: tối đa 3 lần Tab phải tới một nút đêm «<Thứ>, <ngày>: <trạng thái>».
          await page.locator('button[aria-label^="Lần gần nhất collector"]').focus()
          let toiDem = null
          for (let k = 1; k <= 3 && !toiDem; k++) {
            await page.keyboard.press("Tab")
            const nhan = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "")
            if (/^(Thứ [2-7]|Chủ nhật), \d{1,2}\/\d{1,2}\/\d{4}: (Đã có khách đặt|Còn trống|Chưa rõ)$/.test(nhan)) toiDem = { k, nhan }
          }
          check(Boolean(toiDem), `Tab từ tóm tắt lịch vào ô đêm sau ${toiDem?.k ?? "—"} lần: «${toiDem?.nhan ?? "không tới"}»`)
        }
        await page.close()

        if (kho === "desktop-1280" && theme === "light") {
          // Một ảnh chết (ảnh đầu): rời gallery, còn n-1.
          const mot = await mo(ctx, id, { chan: [photos[0]] })
          const m = await mot.page.evaluate(doDauTrang)
          check(m.radios === n - 1 && m.mainAlt?.startsWith(`Ảnh 1/${n - 1} — `), `anh-chet-mot: còn ${m.radios}/${n - 1} thumbnail, ảnh chính «${m.mainAlt}»`)
          check(!m.srcs.some((s) => norm(s) === norm(photos[0])), "anh-chet-mot: ảnh chết không còn trong gallery")
          await chup(mot.page, `anh-chet-mot--${tag}`)
          await mot.page.close()
          // Mọi ảnh chết: không gallery, hộp Đặc điểm một cột trải ngang.
          const het = await mo(ctx, id, { chan: photos })
          const h = await het.page.evaluate(doDauTrang)
          check(h.hero && h.soAnh === 0 && h.cot === 1, `anh-chet-het: 0 ảnh, ${h.cot} cột`)
          check(h.airbnb && h.facts.length > 0, "anh-chet-het: hộp Đặc điểm + nút Airbnb vẫn đứng")
          await chup(het.page, `anh-chet-het--${tag}`)
          await het.page.close()
        }
      }

      if (mau.khongAnh) {
        const { page, status } = await mo(ctx, mau.khongAnh.id)
        const d = await page.evaluate(doDauTrang)
        check(status === 200 && d.hero && d.soAnh === 0 && d.radios === 0, `[${tag}] khong-anh ${mau.khongAnh.id}: 200, không gallery, không ảnh giả`)
        check(d.cot === 1 && d.facts.length > 0 && d.airbnb, `[${tag}] khong-anh: hộp Đặc điểm trải ngang (${d.facts.length} dòng) + nút Airbnb`)
        check(d.sw === d.cw, `[${tag}] khong-anh: không cuộn ngang (${d.sw} = ${d.cw})`)
        await chup(page, `khong-anh--${tag}`)
        await page.close()
      }

      if (mau.khongLich) {
        const { page, status } = await mo(ctx, mau.khongLich.id)
        const e = await page.evaluate(() => {
          const t = [...document.querySelectorAll('[data-slot="empty-title"]')].find((x) => x.textContent === "Chưa có lịch cho listing này")
          const box = t?.closest('[data-slot="empty"]')
          return { co: Boolean(t), hanhDong: box ? box.querySelectorAll("a, button").length : 0, cu: document.body.textContent.includes("Chưa có lịch cho listing này.") }
        })
        check(status === 200 && e.co && e.hanhDong === 1, `[${tag}] khong-lich ${mau.khongLich.id}: Empty «Chưa có lịch cho listing này» với đúng 1 hành động (${e.hanhDong})`)
        await chup(page, `khong-lich--${tag}`)
        await page.close()
      }
      await ctx.close()
    }
  }
} finally {
  await browser.close()
}

console.log(fails.length === 0 ? "\nlisting-detail-smoke: ĐẠT" : `\nlisting-detail-smoke: ${fails.length} vi phạm`)
process.exit(fails.length === 0 ? 0 : 1)
