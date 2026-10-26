#!/usr/bin/env node
// Smoke trình duyệt thật cho trang Duyệt listing sau UI6 (listings-filters-store-locator): thanh chip @reui/filters
// (màn rộng), ngăn filter-sidebar-5 (màn hẹp), bản đồ @mapcn/map (cụm, nhãn giá, popup), lọc theo khung nhìn chỉ khi
// người dùng di chuyển, thẻ có ảnh tự thu. Cần app chạy TỪ worktree đang kiểm ở chế độ dev (BASE_URL, mặc định :3460
// của dãy U1 — móc `window.__listingsMap` chỉ có ở dev) + DB local :5433. Chỉ GET; ảnh chết dựng bằng chặn mạng.
// Số kỳ vọng tính từ DB bằng cùng truy vấn với getMarketListings (300 listing doanh thu cao nhất của vn-hanoi).
// Dùng: BASE_URL=http://localhost:3460 node scripts/smoke-listings-browse.mjs [--chup <thư mục ảnh>]
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
const MARKET = "vn-hanoi"
const URL_PAGE = `${BASE}/vn/hanoi/listings`
const LIMIT = 300
const chupIdx = process.argv.indexOf("--chup")
const CHUP = chupIdx > 0 ? path.resolve(process.argv[chupIdx + 1] ?? "") : null

const fails = []
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`)
  if (!ok) fails.push(msg)
}

// ---------- playwright-core + Chromium (khuôn của smoke-listing-detail.mjs) ----------

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
  const args = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
  try {
    return await chromium.launch({ args })
  } catch (e) {
    const exe = chromiumMoiNhat()
    if (!exe) throw new Error(`không có Chromium cho playwright-core (${String(e.message).split("\n")[0]})`)
    return chromium.launch({ executablePath: exe, args })
  }
}

// ---------- dữ liệu kỳ vọng từ DB (cùng truy vấn với getMarketListings) ----------

async function taiListing() {
  const require = createRequire(path.join(ROOT, "app/package.json"))
  const pool = new (require("pg").Pool)({ connectionString: DB })
  try {
    const { rows } = await pool.query(
      `SELECT l.id, l.room_type, l.bedrooms, l.price_listed, l.latitude, l.longitude,
              CASE WHEN jsonb_typeof(l.photo_urls) = 'array' THEN l.photo_urls ELSE '[]'::jsonb END AS photos
       FROM listings l JOIN areas a ON a.id = l.area_id
       LEFT JOIN listing_stats st ON st.listing_id = l.id
       WHERE (a.id = $1 OR a.parent_id = $1) AND l.latitude IS NOT NULL
       ORDER BY COALESCE(st.revenue, 0) DESC, COALESCE(st.booked, 0) DESC, l.id
       LIMIT $2`,
      [MARKET, LIMIT]
    )
    return rows.map((r) => ({
      id: r.id,
      roomType: r.room_type,
      bedrooms: r.bedrooms,
      price: r.price_listed === null ? null : Number(r.price_listed),
      lat: Number(r.latitude),
      lng: Number(r.longitude),
      photos: r.photos,
    }))
  } finally {
    await pool.end()
  }
}

const norm = (u) => String(u).replace(/^https?:\/\//, "").split("?")[0]

// ---------- thao tác trang ----------

async function cho(page, fn, arg, timeout = 30000) {
  await page.waitForFunction(fn, arg, { timeout })
}

/** Chờ bản đồ mapcn load + lớp listing có mặt. */
async function choBanDo(page) {
  await cho(page, () => {
    const m = window.__listingsMap
    return Boolean(m && m.loaded() && m.getLayer("listings-pills") && m.getSource("listings"))
  }, undefined, 60000)
  await page.waitForTimeout(800)
}

async function mo(ctx, { chan = null } = {}) {
  const page = await ctx.newPage()
  const yeuCau = []
  page.on("request", (r) => yeuCau.push(r.url()))
  if (chan) await page.route(/muscache\.com/, (route) => (chan(norm(route.request().url())) ? route.fulfill({ status: 404, body: "" }) : route.continue()))
  await page.goto(URL_PAGE, { waitUntil: "domcontentloaded" })
  await page.waitForSelector("[data-listing-id]", { timeout: 60000 })
  return { page, yeuCau }
}

const demThe = (page) => page.evaluate(() => document.querySelectorAll("[data-listing-id]").length)
const dongTong = (page) => page.evaluate(() => [...document.querySelectorAll('p[aria-live="polite"]')].map((p) => p.textContent).join(" | "))
const soTrongDong = (s) => Number(String(s).match(/^([\d.]+) listing/)?.[1]?.replace(/\./g, "") ?? NaN)
const coBadgeVung = (page) => page.evaluate(() => document.body.innerText.includes("Đang lọc theo vùng bản đồ"))
const tamBanDo = (page) => page.evaluate(() => {
  const c = window.__listingsMap.getCenter()
  return [c.lng, c.lat, window.__listingsMap.getZoom()]
})

/** Listing (id) đang trong khung nhìn bản đồ. */
const trongKhung = (page, list) =>
  page.evaluate((pts) => {
    const b = window.__listingsMap.getBounds()
    return pts.filter((p) => b.contains([p.lng, p.lat])).map((p) => p.id)
  }, list.map(({ id, lng, lat }) => ({ id, lng, lat })))

async function themChip(page, truong, dieuKien, giaTri) {
  await page.getByRole("button", { name: "Thêm bộ lọc" }).click()
  await page.getByRole("option", { name: new RegExp(`^${truong}`) }).first().click()
  await page.getByRole("option", { name: new RegExp(`^${dieuKien}$`) }).first().click()
  if (typeof giaTri === "string") {
    await page.getByRole("option", { name: new RegExp(`^${giaTri}`) }).first().click()
    await page.keyboard.press("Escape")
  } else {
    const input = page.locator('input[type="number"]').first()
    await input.fill(String(giaTri))
    await input.press("Enter")
  }
  await page.waitForTimeout(600)
}

async function chup(page, ten) {
  if (!CHUP) return
  mkdirSync(CHUP, { recursive: true })
  await page.screenshot({ path: path.join(CHUP, `${ten}.png`), fullPage: false })
  console.log(`info chụp ${path.join(CHUP, `${ten}.png`)}`)
}

// ---------- chạy ----------

const pw = timPlaywright()
if (!pw) {
  console.log("FAIL không tìm thấy playwright-core (app/ hay collector/)")
  process.exit(1)
}
const ALL = await taiListing()
check(ALL.length > 0, `DB có ${ALL.length} listing ở ${MARKET} (≤ ${LIMIT})`)
const ENTIRE = ALL.filter((l) => l.roomType === "Entire home/apt")
const GIA_TU = 1_000_000
const ENTIRE_GIA = ENTIRE.filter((l) => l.price !== null && l.price >= GIA_TU)

const browser = await batTrinhDuyet(pw.chromium)
try {
  // ===== 1280 sáng: thanh chip, bản đồ, lọc vùng, đồng bộ, ảnh =====
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: "light" })
    const { page, yeuCau } = await mo(ctx)
    await choBanDo(page)
    const tag = "[desktop-1280]"
    check(soTrongDong(await dongTong(page)) === ALL.length, `${tag} tải: ${await dongTong(page)} (DB: ${ALL.length})`)
    check(!(await coBadgeVung(page)), `tải trang → không badge lọc vùng`)
    const yc = yeuCau.filter((u) => /tiles\.openfreemap\.org/.test(u)).length
    const carto = yeuCau.filter((u) => /basemaps\.cartocdn\.com/.test(u)).length
    check(yc > 0 && carto === 0, `${tag} nền OpenFreeMap: ${yc} yêu cầu tiles.openfreemap.org, ${carto} yêu cầu basemaps.cartocdn.com`)
    const banDo = await page.evaluate(() => {
      const m = window.__listingsMap
      const wrap = m.getContainer().closest("[data-mapcn]")
      const attr = [...wrap.querySelectorAll(".maplibregl-ctrl-attrib")]
      return {
        canvas: Boolean(wrap.querySelector("canvas")),
        font: m.getLayoutProperty("listings-cluster-count", "text-font"),
        cum: m.queryRenderedFeatures({ layers: ["listings-clusters"] }).length,
        attr: attr.length,
        thuGon: attr.every((a) => !a.classList.contains("maplibregl-compact-show")),
        diem: m.getSource("listings")._data?.features?.length ?? m.getSource("listings").serialize().data.features.length,
      }
    })
    check(banDo.canvas, `${tag} bản đồ mapcn đã load (canvas trong [data-mapcn])`)
    check(banDo.cum >= 1 && JSON.stringify(banDo.font) === JSON.stringify(["Noto Sans Bold"]), `${tag} lớp cụm có ${banDo.cum} cụm, chữ cụm dùng font ${banDo.font}`)
    check(banDo.attr === 1 && banDo.thuGon, `${tag} ${banDo.attr} nút ghi nguồn, thu gọn (${banDo.thuGon})`)
    check(banDo.diem === ALL.length, `nguồn bản đồ có ${banDo.diem} điểm = ${ALL.length} listing khớp bộ lọc (không lọc)`)
    await chup(page, "mac-dinh--desktop-1280")

    // Thẻ có ảnh: src thuộc photo_urls của đúng listing; khung 3:2.
    const anh = await page.evaluate(() =>
      [...document.querySelectorAll("[data-listing-id]")].slice(0, 12).flatMap((card) =>
        [...card.querySelectorAll("img")].map((img) => ({ id: card.getAttribute("data-listing-id"), src: img.getAttribute("src"), ratio: img.parentElement.parentElement.getBoundingClientRect().width / img.parentElement.parentElement.getBoundingClientRect().height }))
      )
    )
    const byId = new Map(ALL.map((l) => [l.id, new Set(l.photos.map(norm))]))
    check(anh.length > 0 && anh.every((a) => byId.get(a.id)?.has(norm(a.src))), `${tag} ${anh.length} ảnh thẻ, tất cả thuộc photo_urls tự thu của đúng listing`)
    check(anh.length > 0 && anh.every((a) => Math.abs(a.ratio - 1.5) <= 0.02), `${tag} khung ảnh thẻ 1,5 ± 0,02 (${anh.map((a) => a.ratio.toFixed(3)).slice(0, 3).join(", ")}…)`)

    // Đồng bộ thẻ ↔ nhãn.
    const the0 = page.locator("[data-listing-id]").first()
    const id0 = await the0.getAttribute("data-listing-id")
    await the0.hover()
    await page.waitForTimeout(300)
    const loc = await page.evaluate(() => JSON.stringify(window.__listingsMap.getFilter("listings-pill-active")))
    check(loc.includes(`"${id0}"`), `rê thẻ ${id0} → listings-pill-active lọc đúng id ${id0}`)
    await page.mouse.move(5, 5)

    // Bấm cụm → zoom tăng + lọc vùng.
    const cum = await page.evaluate(() => {
      const m = window.__listingsMap
      const f = m.queryRenderedFeatures({ layers: ["listings-clusters"] })[0]
      const r = m.getContainer().getBoundingClientRect()
      const p = m.project(f.geometry.coordinates)
      return { x: r.left + p.x, y: r.top + p.y, z: m.getZoom() }
    })
    await page.mouse.click(cum.x, cum.y)
    await page.waitForTimeout(1500)
    const [, , z1] = await tamBanDo(page)
    check(z1 > cum.z, `bấm cụm → zoom ${cum.z.toFixed(2)} → ${z1.toFixed(2)}`)
    check(await coBadgeVung(page), `bấm cụm → lọc vùng`)
    const inView1 = await trongKhung(page, ALL)
    check(soTrongDong(await dongTong(page)) === inView1.length, `kéo/bấm cụm → lọc vùng: ${await dongTong(page)} = ${inView1.length} listing khớp nằm trong khung`)

    // Bấm nhãn giá → popup; URL không đổi.
    const nhan = await page.evaluate(() => {
      const m = window.__listingsMap
      const f = m.queryRenderedFeatures({ layers: ["listings-pills"] })[0]
      if (!f) return null
      const r = m.getContainer().getBoundingClientRect()
      const p = m.project(f.geometry.coordinates)
      // Listing thật sự nằm trên cùng tại điểm đó (nhãn/chấm của listing khác có thể chồng lên).
      const top = m.queryRenderedFeatures([p.x, p.y], { layers: ["listings-pill-active", "listings-pills", "listings-dots"] })[0]
      return { x: r.left + p.x, y: r.top + p.y, id: top?.properties.id ?? f.properties.id }
    })
    if (nhan) {
      await page.mouse.move(nhan.x, nhan.y)
      await page.waitForTimeout(300)
      const ring = await page.evaluate((id) => document.querySelector(`[data-listing-id="${id}"]`)?.hasAttribute("data-active") ?? null, nhan.id)
      check(ring !== false, `rê nhãn ${nhan.id} trên bản đồ → thẻ ${nhan.id} có ring (${ring === null ? "thẻ ngoài trang hiện" : String(ring)})`)
      const url0 = page.url()
      await page.mouse.click(nhan.x, nhan.y)
      await page.waitForTimeout(600)
      const pop = await page.evaluate(() => {
        const el = document.querySelector("[data-mapcn] .maplibregl-popup")
        return el ? { text: el.innerText, href: el.querySelector("a")?.getAttribute("href") } : null
      })
      check(Boolean(pop && /Giá\/đêm/.test(pop.text) && /Công suất/.test(pop.text) && pop.href === `/listing/${nhan.id}` && page.url() === url0), `bấm nhãn giá ${nhan.id} → popup «${pop?.text.split("\n")[0]}» có Giá/đêm, Công suất, link ${pop?.href}; URL trang không đổi`)
      await chup(page, "popup--desktop-1280")
    } else check(false, "không tìm thấy nhãn giá nào sau khi bấm cụm")

    // Đóng popup (nằm giữa bản đồ, chặn cú kéo sau) rồi bỏ lọc vùng.
    await page.locator("[data-mapcn] .maplibregl-popup button").first().click().catch(() => {})
    await page.getByRole("button", { name: "Bỏ lọc theo vùng bản đồ" }).click()
    await page.waitForTimeout(1200)
    check(!(await coBadgeVung(page)) && soTrongDong(await dongTong(page)) === ALL.length, `Bỏ lọc vùng → ${ALL.length} listing, không badge`)

    // Kéo bản đồ → lọc vùng.
    const box = await page.locator("[data-mapcn]").boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 - 60, box.y + box.height / 2 - 40, { steps: 8 })
    await page.mouse.up()
    await page.waitForTimeout(1200)
    const inView2 = await trongKhung(page, ALL)
    check((await coBadgeVung(page)) && soTrongDong(await dongTong(page)) === inView2.length, `kéo bản đồ → lọc vùng: ${await dongTong(page)} = ${inView2.length} listing khớp nằm trong khung`)
    await chup(page, "loc-vung--desktop-1280")

    // Đang lọc vùng + thêm chip → khung giữ.
    const truocChip = await tamBanDo(page)
    await themChip(page, "Loại phòng", "là", "Nguyên căn")
    const sauChip = await tamBanDo(page)
    check(Math.abs(truocChip[0] - sauChip[0]) < 1e-6 && Math.abs(truocChip[1] - sauChip[1]) < 1e-6, `đang lọc vùng + thêm chip → khung giữ nguyên`)
    await page.getByRole("button", { name: "Bỏ lọc theo vùng bản đồ" }).click()
    await page.waitForTimeout(1200)
    const n1 = soTrongDong(await dongTong(page))
    check(n1 === ENTIRE.length, `${tag} chip Loại phòng là Nguyên căn: ${n1} listing khớp bộ lọc (DB: ${ENTIRE.length})`)
    const diem1 = await page.evaluate(() => window.__listingsMap.getSource("listings").serialize().data.features.length)
    check(diem1 === ENTIRE.length, `nguồn bản đồ có ${diem1} điểm = ${ENTIRE.length} listing khớp bộ lọc (sau chip Nguyên căn)`)
    await chup(page, "loc-chip--desktop-1280")

    // Chip giá (không lọc vùng) → canh khung, không badge.
    await themChip(page, "Giá/đêm", "từ", GIA_TU)
    const n2 = soTrongDong(await dongTong(page))
    const chipGia = await page.evaluate(() => document.body.innerText.match(/1 tr ₫/) !== null)
    check(n2 === ENTIRE_GIA.length && chipGia, `${tag} thêm chip Giá/đêm từ ${GIA_TU}: ${n2} listing (DB: ${ENTIRE_GIA.length}), chip đọc «1 tr ₫» (${chipGia})`)
    check(!(await coBadgeVung(page)), `thêm chip lọc (không lọc vùng) → bản đồ canh khung, không badge`)
    const vi = (await page.getByRole("button", { name: "Thêm bộ lọc" }).count()) > 0 && (await page.getByRole("button", { name: /^Xoá$/ }).count()) > 0 && (await page.getByText("Add filter").count()) === 0
    check(vi, `${tag} thanh lọc tiếng Việt (Thêm bộ lọc, Xoá; không còn «Add filter»)`)
    await page.getByRole("button", { name: /^Xoá$/ }).first().click()
    await page.waitForTimeout(800)
    check(soTrongDong(await dongTong(page)) === ALL.length, `${tag} Xoá → ${ALL.length} listing`)

    // Nút phóng to → lọc vùng.
    await page.getByRole("button", { name: /zoom in|phóng to/i }).first().click()
    await page.waitForTimeout(1200)
    check(await coBadgeVung(page), `bấm nút phóng to → lọc vùng`)
    await page.getByRole("button", { name: "Bỏ lọc theo vùng bản đồ" }).click()
    await page.waitForTimeout(1200)

    // Lăn thường (không phím vượt) trên bản đồ: trang cuộn, bản đồ không zoom, không lọc vùng (cooperativeGestures).
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    const [, , zTruoc] = await tamBanDo(page)
    const yTruoc = await page.evaluate(() => window.scrollY)
    await page.mouse.wheel(0, 300)
    await page.waitForTimeout(1200)
    const [, , zSau] = await tamBanDo(page)
    const ySau = await page.evaluate(() => window.scrollY)
    check(Math.abs(zSau - zTruoc) < 1e-6 && !(await coBadgeVung(page)) && ySau > yTruoc, `lăn thường (không Ctrl/⌘) trên bản đồ → zoom không đổi, không badge, trang cuộn (scrollY ${yTruoc} → ${ySau})`)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(400)

    // Ctrl/⌘ + lăn → lọc vùng (đối chứng dương, cùng vị trí chuột).
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    // Phím vượt cử chỉ hợp tác của MapLibre: ⌘ khi UA có «Mac», còn lại Ctrl.
    const phim = (await page.evaluate(() => navigator.userAgent.includes("Mac"))) ? "Meta" : "Control"
    await page.keyboard.down(phim)
    await page.mouse.wheel(0, -400)
    await page.keyboard.up(phim)
    await page.waitForTimeout(1500)
    check(await coBadgeVung(page), `${phim}+lăn → lọc vùng`)
    // Kéo tới vùng trống → Empty vùng.
    await page.evaluate(() => window.__listingsMap.jumpTo({ center: [106.2, 21.6], zoom: 13 }))
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 - 20, box.y + box.height / 2 - 10, { steps: 4 })
    await page.mouse.up()
    await page.waitForTimeout(1200)
    const empty = await page.evaluate(() => {
      const t = [...document.querySelectorAll('[data-slot="empty"]')].find((e) => e.innerText.includes("Không có listing trong vùng này"))
      return t ? [...t.querySelectorAll("button, a")].map((b) => b.textContent.trim()) : null
    })
    check(Boolean(empty && empty.length === 1 && empty[0] === "Bỏ lọc vùng"), `kéo tới vùng trống → Empty «Không có listing trong vùng này», ${empty?.length ?? 0} hành động «${empty?.[0] ?? ""}»`)
    await chup(page, "vung-trong--desktop-1280")
    await page.getByRole("button", { name: "Bỏ lọc vùng" }).click()
    await page.waitForTimeout(1200)
    check(!(await coBadgeVung(page)) && soTrongDong(await dongTong(page)) === ALL.length, `Bỏ lọc vùng → ${ALL.length} listing, không badge`)

    // Resize → không lọc.
    await page.setViewportSize({ width: 1100, height: 900 })
    await page.waitForTimeout(1000)
    check(!(await coBadgeVung(page)), `resize 1280 → 1100 → không badge`)
    await ctx.close()
  }

  // ===== 1280 tối + đổi sáng/tối giữ khung =====
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: "dark" })
    const { page, yeuCau } = await mo(ctx)
    await choBanDo(page)
    const tag = "[desktop-1280--dark]"
    const banDo = await page.evaluate(() => {
      const m = window.__listingsMap
      const wrap = m.getContainer().closest("[data-mapcn]")
      return { canvas: Boolean(wrap.querySelector("canvas")), cum: m.queryRenderedFeatures({ layers: ["listings-clusters"] }).length, font: m.getLayoutProperty("listings-cluster-count", "text-font"), attr: wrap.querySelectorAll(".maplibregl-ctrl-attrib").length }
    })
    check(banDo.canvas, `${tag} bản đồ mapcn đã load (canvas trong [data-mapcn])`)
    check(yeuCau.some((u) => /tiles\.openfreemap\.org/.test(u)) && !yeuCau.some((u) => /basemaps\.cartocdn\.com/.test(u)), `${tag} nền OpenFreeMap, 0 yêu cầu basemaps.cartocdn.com`)
    check(banDo.cum >= 1 && JSON.stringify(banDo.font) === JSON.stringify(["Noto Sans Bold"]), `${tag} lớp cụm có ${banDo.cum} cụm, chữ cụm dùng font ${banDo.font}`)
    check(banDo.attr === 1, `${tag} 1 nút ghi nguồn`)
    await chup(page, "mac-dinh--desktop-1280--dark")
    await themChip(page, "Loại phòng", "là", "Nguyên căn")
    await chup(page, "loc-chip--desktop-1280--dark")
    const t0 = await tamBanDo(page)
    await page.evaluate(() => {
      localStorage.setItem("theme", "light")
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
      document.documentElement.style.colorScheme = "light"
    })
    await ctx.emulateMedia?.({ colorScheme: "light" })
    await page.emulateMedia({ colorScheme: "light" })
    await page.waitForTimeout(500)
    await cho(page, () => Boolean(window.__listingsMap?.isStyleLoaded() && window.__listingsMap.getLayer("listings-pills")), undefined, 60000)
    const t1 = await tamBanDo(page)
    check(Math.abs(t0[0] - t1[0]) < 1e-6 && Math.abs(t0[1] - t1[1]) < 1e-6, `đổi sáng → tối: tâm bản đồ lệch < 1e-6, lớp listings-pills còn`)
    check(!(await coBadgeVung(page)), `đổi sáng/tối → không badge`)
    await ctx.close()
  }

  // ===== ảnh chết =====
  {
    // Mẫu lùi ảnh: ảnh 2 phải còn sống trên CDN thật (đo bằng fetch cùng cỡ thẻ) — ảnh tự thu chết ~19%.
    const song = async (u) => {
      try {
        const base = u.startsWith("http") ? u : `https://${u}`
        const r = await fetch(`${base}${base.includes("?") ? "&" : "?"}im_w=480`, { method: "GET" })
        return r.ok
      } catch {
        return false
      }
    }
    let mau = null
    for (const l of ALL.slice(0, 24)) if (l.photos.length >= 2 && (await song(l.photos[1]))) { mau = l; break }
    const het = ALL.slice(0, 24).find((l) => l.photos.length >= 1 && l.id !== mau?.id)
    if (mau && het) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
      const chet = new Set([norm(mau.photos[0]), ...het.photos.map(norm)])
      const { page } = await mo(ctx, { chan: (u) => chet.has(u) })
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1500)
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(800)
      const r = await page.evaluate(([a, b]) => ({
        a: [...(document.querySelector(`[data-listing-id="${a}"]`)?.querySelectorAll("img") ?? [])].map((i) => i.getAttribute("src")),
        b: document.querySelector(`[data-listing-id="${b}"]`)?.querySelectorAll("img, .aspect-\\[3\\/2\\]").length ?? -1,
      }), [mau.id, het.id])
      check(r.a.length === 1 && norm(r.a[0]) === norm(mau.photos[1]), `ảnh đầu chết (chặn 404) → thẻ ${mau.id} lùi ảnh 2 (${r.a.map(norm).join(", ") || "0 ảnh"} — ảnh 2: ${norm(mau.photos[1])})`)
      check(r.b === 0, `mọi ảnh chết → thẻ ${het.id} không panel ảnh (${r.b})`)
      await ctx.close()
    } else check(false, "không đủ mẫu listing có ảnh trong 24 thẻ đầu")
  }

  // ===== 390 px: ngăn Bộ lọc =====
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "light", isMobile: true, hasTouch: true })
    const { page } = await mo(ctx)
    const tag = "[mobile-390]"
    await chup(page, "mac-dinh--mobile-390")
    await page.getByRole("button", { name: /^Bộ lọc/ }).click()
    await page.waitForTimeout(500)
    const ngan = page.getByRole("dialog")
    await ngan.getByText("Nguyên căn", { exact: true }).click()
    await ngan.getByText("Từ 2 phòng ngủ", { exact: true }).click()
    // Thanh giá: đầu trái sang phải 3 bước (ArrowRight trên thumb đầu).
    const thumb = page.getByRole("dialog").getByRole("slider").first()
    await thumb.focus()
    for (let i = 0; i < 3; i++) await thumb.press("ArrowRight")
    await page.waitForTimeout(300)
    const xem = await page.getByRole("button", { name: /^Xem [\d.]+ listing$/ }).textContent()
    const lo = Number((await thumb.getAttribute("aria-valuenow")) ?? (await thumb.inputValue()))
    const ky = ALL.filter((l) => l.roomType === "Entire home/apt" && l.bedrooms !== null && l.bedrooms >= 2 && l.price !== null && l.price >= lo).length
    check(soTrongDong(xem.replace(/^Xem /, "")) === ky, `${tag} ngăn Bộ lọc: Nguyên căn + Từ 2 phòng ngủ + giá từ ${lo} → ${xem} (DB: ${ky})`)
    await chup(page, "ngan-loc--mobile-390")
    await page.getByRole("button", { name: /^Xem [\d.]+ listing$/ }).click()
    await page.waitForTimeout(600)
    const so = soTrongDong(await dongTong(page))
    const badge = await page.getByRole("button", { name: /^Bộ lọc/ }).textContent()
    check(so === ky && /3$/.test(badge.trim()), `${tag} sau khi áp: ${so} listing, nút Bộ lọc mang số 3 («${badge.trim()}»)`)
    await page.getByRole("button", { name: /^Bộ lọc/ }).click()
    await page.waitForTimeout(400)
    const giu = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"]')
      const chon = (text) => {
        const lab = [...dlg.querySelectorAll("label")].find((l) => l.textContent.trim().startsWith(text))
        const ctl = lab && document.getElementById(lab.htmlFor)
        return ctl?.getAttribute("aria-checked") === "true" || ctl?.hasAttribute("data-checked") || ctl?.checked === true
      }
      return chon("Nguyên căn") && chon("Từ 2 phòng ngủ")
    })
    check(giu, `${tag} mở lại: nháp giữ 3 lựa chọn`)
    await page.keyboard.press("Escape")
    const dim = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
    check(dim.sw === dim.cw, `${tag} không cuộn ngang (scrollWidth ${dim.sw} = clientWidth ${dim.cw})`)
    await page.getByRole("radio", { name: "Bản đồ" }).or(page.getByRole("button", { name: "Bản đồ" })).first().click()
    await choBanDo(page)
    await chup(page, "che-do-ban-do--mobile-390")
    // Đổi khổ 390 → 1280: thanh chip có 3 điều kiện.
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.waitForTimeout(800)
    const chips = await page.evaluate(() => document.querySelectorAll('[data-slot="filter-chip"], [role="group"][aria-label*="Loại phòng"], [role="group"][aria-label*="Phòng ngủ"], [role="group"][aria-label*="Giá/đêm"]').length)
    check(chips >= 3, `${tag.replace("]", " → desktop-1280]")} thanh chip có 3 điều kiện (${chips})`)
    await ctx.close()
  }
} catch (e) {
  check(false, `lỗi chạy smoke: ${String(e.message).split("\n").slice(0, 3).join(" · ")}`)
} finally {
  await browser.close()
}

console.log(fails.length === 0 ? "listings-browse-smoke: ĐẠT" : `listings-browse-smoke: TRƯỢT (${fails.length})`)
process.exit(fails.length === 0 ? 0 : 1)
