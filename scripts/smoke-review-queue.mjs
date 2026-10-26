#!/usr/bin/env node
// Smoke trình duyệt thật cho /ops/review sau UI1 (ops-review-khung-hang-cho): bảng hàng chờ, sheet chi tiết, ảnh tin
// trong sheet, không độ tự tin (Q9), màn 390, nút quyết định. Cần app DEV chạy TỪ worktree đang kiểm (BASE_URL, mặc định
// ui1.localhost:3460 của dãy U1 — 127.0.0.1 không hydrate trên dev Next 16; *.localhost tách cookie khỏi localhost) +
// DB local :5433. Chạy từ app/ qua tsx để dùng ĐÚNG loadReviewMedia của trang làm số ảnh kỳ vọng:
//   cd app && BASE_URL=http://ui1.localhost:3460 node --import tsx ../scripts/smoke-review-queue.mjs
// An toàn DB dùng chung: nút quyết định CHỈ bấm sau khi route /api/v1/ops/review/*/decide đã bị chặn bằng page.route
// (phản hồi giả) — đếm review_queue + sale_offers trước/sau phải bằng nhau. Phiên đăng nhập: hai tài khoản thử (admin,
// ops) tạo thẳng trong DB với tiền tố riêng mỗi lần chạy, xoá cuối lượt. Thẻ chờ của DB thật đổi theo job đêm (S4-r1: job
// transform đóng hết thẻ Bổ sung tin) → mỗi lượt thêm MỘT thẻ Bổ sung tin thử (tiêu đề mang tiền tố, evidence có
// fields[].confidence như agent ghi) để luôn có cả hai loại thẻ, xoá cuối lượt. Mỗi kiểm in «ok …»/«FAIL …»; exit 0 = đạt.
import { randomBytes } from "node:crypto"
import { execFileSync } from "node:child_process"
import { existsSync, readdirSync } from "node:fs"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { assertLocalDatabaseUrl, DEFAULT_DATABASE_URL } from "./dev-ops-account.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const BASE = (process.env.BASE_URL ?? "http://ui1.localhost:3460").replace(/\/$/, "")
const URL_PAGE = `${BASE}/ops/review`
const DECIDE = "**/api/v1/ops/review/*/decide"
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg")
const pool = new pg.Pool({ connectionString: String(assertLocalDatabaseUrl(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL)) })
const nonce = `rqsmoke${randomBytes(4).toString("hex")}`

const fails = []
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`)
  if (!ok) fails.push(msg)
}

// ---------- playwright-core + Chromium (khuôn của smoke-listings-browse.mjs) ----------

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

// ---------- dữ liệu kỳ vọng từ DB ----------

const dem = async () => {
  const { rows } = await pool.query(`SELECT (SELECT count(*) FROM review_queue)::int AS q, (SELECT count(*) FROM sale_offers)::int AS o,
    (SELECT count(*) FROM review_queue WHERE status <> 'pending')::int AS quyet`)
  return rows[0]
}

/** Thẻ chờ theo thứ tự trang (created_at giảm dần, id giảm dần) + số ảnh loader trả cho admin (cùng hàm với trang). */
async function theCho() {
  const { rows } = await pool.query(
    `SELECT id, item_type, title, evidence, created_at FROM review_queue WHERE status = 'pending' ORDER BY date_trunc('milliseconds', created_at) DESC, id DESC`,
    // Trình duyệt giữ created_at tới mili-giây (ISO của Date) — thứ tự kỳ vọng hoà theo id ở cùng độ chính xác.
  )
  const { loadReviewMedia } = await import(pathToFileURL(path.join(ROOT, "app/src/lib/ops/review-media.ts")).href)
  const media = await loadReviewMedia(rows, { id: "0", email: "smoke@local", plan: "pro", role: "admin" }, (t, v) => pool.query(t, v))
  return rows.map((r) => {
    const m = media[r.id] ?? {}
    const sides = Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.length]))
    // review_queue.id là bigint — pg trả chuỗi; bảng trên trang đọc «#id» ra số.
    return { ...r, id: Number(r.id), sides, anh: Object.values(sides).reduce((a, b) => a + b, 0) }
  })
}

async function taoPhien() {
  const tokens = {}
  for (const role of ["admin", "ops"]) {
    tokens[role] = randomBytes(32).toString("hex")
    await pool.query(`INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, 'x', $3)`, [`${nonce}-${role}`, `${nonce}-${role}@local.test`, role])
    await pool.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '20 minutes')`, [tokens[role], `${nonce}-${role}`])
  }
  return tokens
}

/** Thẻ Bổ sung tin thử: evidence cùng dạng agent/src/enrich/run.ts ghi (fields[].confidence, ai_confidence = max). */
async function taoTheThu() {
  const evidence = {
    offer_id: `offer_${nonce}`,
    text: `Tin thử smoke UI1 ${nonce}`,
    fields: [
      { proposal_id: -1, field: "bedrooms", value: "2", confidence: 0.77, source: "e2_llm", basis: null, conflict: false },
      { proposal_id: -2, field: "bathrooms", value: "1", confidence: 0.61, source: "e2_llm", basis: null, conflict: false },
    ],
  }
  const { rows } = await pool.query(
    `INSERT INTO review_queue (item_type, item_id, title, evidence, ai_suggestion, ai_confidence, status)
     VALUES ('agent_output', $1, $2, $3, 'apply', 0.77, 'pending') RETURNING id`,
    [`enrich:offer_${nonce}`, `Bổ sung dữ liệu: ${nonce} (thẻ thử smoke)`, JSON.stringify(evidence)],
  )
  return Number(rows[0].id)
}

async function xoaTheThu() {
  const { rowCount } = await pool.query(`DELETE FROM review_queue WHERE item_id = $1`, [`enrich:offer_${nonce}`])
  check(rowCount === 1, `dọn thẻ thử: xoá ${rowCount} thẻ (kỳ vọng 1)`)
}

async function donPhien() {
  await pool.query(`DELETE FROM sessions WHERE user_id LIKE $1`, [`${nonce}-%`])
  await pool.query(`DELETE FROM users WHERE id LIKE $1`, [`${nonce}-%`])
  const { rows } = await pool.query(`SELECT count(*)::int AS n FROM users WHERE id LIKE $1`, [`${nonce}-%`])
  check(rows[0].n === 0, `dọn tài khoản thử: còn ${rows[0].n}`)
}

// ---------- trình duyệt ----------

async function moTrang(browser, token, viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 })
  await ctx.addCookies([{ name: "oi_session", value: token, url: BASE }])
  const page = await ctx.newPage()
  return { ctx, page }
}

async function vaoTrang(page) {
  const resp = await page.goto(URL_PAGE, { waitUntil: "load" })
  await page.getByRole("heading", { name: "Danh sách thẻ" }).waitFor({ timeout: 90_000 })
  // Chờ hydrate: nút tên thẻ có fiber React thì bấm hàng mới mở sheet.
  await page.waitForFunction(() => [...document.querySelectorAll("tbody button")].some((b) => Object.keys(b).some((k) => k.startsWith("__react"))), undefined, { timeout: 60_000 })
  return resp
}

// Khớp ĐÚNG mã «#id» (không khớp «#160» khi tìm «#16»).
const dongCua = (page, id) => page.locator("tbody tr").filter({ has: page.locator("span", { hasText: new RegExp(`^#${id}$`) }) })

async function moSheet(page, id) {
  await dongCua(page, id).click()
  const d = page.locator("[data-slot=sheet-content]")
  await d.waitFor({ state: "visible", timeout: 20_000 })
  await page.waitForTimeout(400)
  return d
}

async function dongSheet(page) {
  await page.keyboard.press("Escape")
  await page.locator("[data-slot=sheet-content]").waitFor({ state: "detached", timeout: 10_000 }).catch(() => {})
}

/** Chữ của sheet sau khi gỡ các đoạn trích nguyên văn [data-review-quote] (lý do máy, đoạn tin, căn cứ). */
const chuNgoaiTrich = (d) =>
  d.evaluate((el) => {
    const c = el.cloneNode(true)
    c.querySelectorAll("[data-review-quote]").forEach((n) => n.remove())
    return c.textContent ?? ""
  })

/** Số ô ảnh trong sheet (ảnh tải được + ô «Ảnh hỏng» — URL nguồn có hạn vẫn là một ảnh loader trả). */
const oAnh = (d) => d.locator("[role=group][aria-label^='Ảnh '] [data-slot=attachment]").count()

async function main() {
  const playwright = timPlaywright()
  if (!playwright) throw new Error("không tìm thấy playwright-core (app/ hoặc collector/)")
  const theThu = await taoTheThu()
  console.log(`thẻ Bổ sung tin thử #${theThu}`)
  const truoc = await dem()
  const cho = await theCho()
  const { rows: conf } = await pool.query(`SELECT count(*)::int AS m FROM review_queue WHERE ai_confidence IS NOT NULL`)
  check(cho.length > 0, `DB local có ${cho.length} thẻ chờ để đo`)
  const tokens = await taoPhien()
  let browser = null
  try {
    browser = await batTrinhDuyet(playwright.chromium)
    // ----- desktop-1280, admin -----
    {
      const { ctx, page } = await moTrang(browser, tokens.admin, { width: 1280, height: 860 })
      const resp = await vaoTrang(page)
      const ids = await page.locator("tbody tr").evaluateAll((trs) => trs.map((tr) => Number(tr.textContent?.match(/#(\d+)/)?.[1])).filter(Boolean))
      check(ids.length === cho.length && ids.every((id, i) => id === cho[i].id), `[desktop-1280] bảng hàng duyệt: ${ids.length} dòng chờ (DB: ${cho.length}), cùng thứ tự mới nhất trước`)
      const soDau = await page.locator("[data-queue-count]").getAttribute("data-queue-count")
      check(soDau === String(cho.length), `[desktop-1280] đầu Frame «${soDau} thẻ»`)
      const cot = await page.locator("thead th").allTextContents()
      check(JSON.stringify(cot.map((c) => c.trim())) === JSON.stringify(["Thẻ", "Loại", "Trạng thái", "Tạo lúc"]), `[desktop-1280] cột ${cot.join(" · ")}`)
      check((await page.locator("tbody img").count()) === 0, "[desktop-1280] bảng: 0 <img>")
      const html = (await resp.text()) + (await page.content())
      // Quan hệ cần đo (S4-r1): không khoá độ tự tin NÀO (ai_confidence, fields[].confidence) trong dữ liệu trang —
      // RSC nhúng trong HTML dạng chuỗi thoát nên khớp cả "confidence": lẫn \"confidence\":.
      const khoa = html.match(/\\?"(?:ai_)?confidence\\?"\s*:/g) ?? []
      check(conf[0].m >= 1 && khoa.length === 0, `[desktop-1280] HTML + RSC của /ops/review không chứa khoá ai_confidence hay fields[].confidence (DB có ${conf[0].m} thẻ mang ai_confidence; thấy ${khoa.length} khoá)`)

      let sach = 0
      for (const t of cho) {
        const d = await moSheet(page, t.id)
        const n = await oAnh(d)
        if (t.anh > 0) check(n === t.anh, `[desktop-1280] sheet thẻ ${t.id}: dải ảnh ${n} ảnh = loadReviewMedia (${t.anh})`)
        else check(n === 0, `[desktop-1280] sheet thẻ ${t.id}: ${(await d.textContent())?.includes("không có ảnh") ? "«không có ảnh»" : "0 ảnh"} khớp loader rỗng`)
        const chu = await chuNgoaiTrich(d)
        if (!/\d+\s*%/.test(chu) && !chu.includes("tự tin")) sach++
        else console.log(`     thẻ ${t.id}: ${chu.match(/.{0,30}(\d+\s*%|tự tin).{0,30}/)?.[0]}`)
        await dongSheet(page)
      }
      check(sach === cho.length, `[desktop-1280] ${cho.length} sheet đã mở: ngoài [data-review-quote] 0 chuỗi khớp /\\d+\\s*%/ hay «tự tin» (sạch ${sach})`)
      await ctx.close()
    }

    // ----- quyết định với route decide BỊ CHẶN -----
    {
      const { ctx, page } = await moTrang(browser, tokens.admin, { width: 1280, height: 860 })
      const bat = []
      let reply = { status: 200, body: { ok: true } }
      await page.route(DECIDE, async (route) => {
        const req = route.request()
        bat.push({ url: new URL(req.url()).pathname, body: req.postData() })
        await route.fulfill({ status: reply.status, contentType: "application/json", body: JSON.stringify(reply.body) })
      })
      await vaoTrang(page)
      // Rào an toàn: không có route chặn thì không bấm gì. Lượt thử dùng id «rao-chan» — lọt tới server thật thì route
      // trả 400 «id không hợp lệ» TRƯỚC mọi lượt ghi, nên chính lượt thử cũng vô hại.
      const chan = await page.evaluate(async () => (await fetch("/api/v1/ops/review/rao-chan/decide", { method: "POST", body: "{}" })).json()).catch(() => null)
      if (!chan || chan.ok !== true || bat.length !== 1) throw new Error("route decide CHƯA bị chặn — dừng trước khi bấm nút quyết định")
      bat.length = 0

      const em = cho.find((t) => t.item_type === "entity_match")
      const ao = cho.find((t) => t.id === theThu) ?? cho.find((t) => t.item_type === "agent_output")
      const maTran = [
        ...(em ? [[em, "Cùng căn", "approved"], [em, "Khác căn", "rejected"], [em, "Không chắc", "deferred"]] : []),
        ...(ao ? [[ao, "Áp dụng", "approved"], [ao, "Bỏ", "rejected"], [ao, "Để sau", "deferred"]] : []),
      ]
      check(em && ao, `[desktop-1280] có thẻ chờ cả hai loại để bấm (ghép căn ${em?.id ?? "—"}, bổ sung tin ${ao?.id ?? "—"})`)
      for (const [t, nut, status] of maTran) {
        await vaoTrang(page)
        const d = await moSheet(page, t.id)
        const b = d.getByRole("button", { name: nut, exact: true })
        if (await b.isDisabled()) {
          // Thẻ xung đột: «Áp dụng» khoá tới khi chọn — chọn «Chọn AI» trước (body mang choices).
          await d.getByRole("button", { name: "Chọn AI" }).first().click()
        }
        const n0 = bat.length
        await b.click()
        for (let i = 0; i < 50 && bat.length === n0; i++) await page.waitForTimeout(100)
        const last = bat.at(-1)
        const body = last ? JSON.parse(last.body ?? "null") : null
        check(bat.length === n0 + 1 && last.url === `/api/v1/ops/review/${t.id}/decide` && body?.status === status && (status !== "approved" || t.item_type !== "agent_output" || !("choices" in body) || typeof body.choices === "object"), `[desktop-1280] ${nut} → POST /api/v1/ops/review/${t.id}/decide ${last?.body ?? "(không bắt được)"}`)
      }
      // Lỗi route → dòng lỗi trong sheet, nút còn bấm được.
      if (em) {
        reply = { status: 409, body: { error: "đã quyết" } }
        await vaoTrang(page)
        const d = await moSheet(page, em.id)
        await d.getByRole("button", { name: "Khác căn", exact: true }).click()
        await d.getByText("Lỗi: đã quyết").waitFor({ timeout: 10_000 }).catch(() => {})
        const coLoi = (await d.textContent())?.includes("Lỗi: đã quyết")
        const bat2 = await d.getByRole("button", { name: "Khác căn", exact: true }).isEnabled()
        check(coLoi && bat2, `[desktop-1280] lỗi route: dòng «Lỗi: đã quyết» trong sheet, nút còn bấm được`)
      }
      await ctx.close()
    }

    // ----- người vận hành không phải admin: không dải ảnh -----
    {
      const { ctx, page } = await moTrang(browser, tokens.ops, { width: 1280, height: 860 })
      await vaoTrang(page)
      const t = cho.find((x) => x.anh > 0) ?? cho[0]
      const d = await moSheet(page, t.id)
      check((await d.locator("[role=group][aria-label^='Ảnh ']").count()) === 0 && (await d.locator("img").count()) === 0, `[ops] sheet thẻ ${t.id}: 0 dải ảnh`)
      await ctx.close()
    }

    // ----- mobile-390 -----
    {
      const { ctx, page } = await moTrang(browser, tokens.admin, { width: 390, height: 844 })
      await vaoTrang(page)
      const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
      check(sw === cw, `[mobile-390] trang không cuộn ngang (scrollWidth ${sw} = clientWidth ${cw})`)
      const luoi = await page.evaluate(() => {
        const t = document.querySelector("table")
        let el = t?.parentElement
        while (el && getComputedStyle(el).overflowX !== "auto" && getComputedStyle(el).overflowX !== "scroll") el = el.parentElement
        return el ? [el.scrollWidth, el.clientWidth] : null
      })
      check(luoi !== null && luoi[0] >= luoi[1], `[mobile-390] bảng cuộn trong Frame (vùng lưới scrollWidth ${luoi?.[0]} ≥ clientWidth ${luoi?.[1]})`)
      const em = cho.find((x) => x.item_type === "entity_match" && x.anh > 0) ?? cho.find((x) => x.item_type === "entity_match")
      if (em) {
        const d = await moSheet(page, em.id)
        const w = (await d.boundingBox())?.width ?? 0
        check(Math.abs(w - 390) <= 1, `[mobile-390] sheet rộng ${Math.round(w)} = viewport 390 ± 1`)
        const ab = await d.evaluate((el) => {
          const box = (txt) => [...el.querySelectorAll("[data-slot=item]")].find((n) => n.querySelector("[data-slot=badge]")?.textContent === txt)?.getBoundingClientRect()
          const a = box("Tin A")
          const b = box("Tin B")
          return a && b ? [a.top, a.height, b.top] : null
        })
        check(ab !== null && ab[0] + ab[1] <= ab[2], `[mobile-390] Tin A nằm trên Tin B (${ab ? `${Math.round(ab[0] + ab[1])} ≤ ${Math.round(ab[2])}` : "không thấy"})`)
        const [dsw, dcw] = await d.evaluate((el) => [el.scrollWidth, el.clientWidth])
        check(dsw === dcw, `[mobile-390] sheet không cuộn ngang (${dsw} = ${dcw})`)
        await dongSheet(page)
      }
      const coAnh = cho.find((x) => x.anh > 0)
      if (!coAnh) {
        check(false, "[mobile-390] không có thẻ chờ nào có ảnh để đo vế ảnh AC-7")
      } else {
        const d = await moSheet(page, coAnh.id)
        const nhan = Object.keys(coAnh.sides).find((k) => coAnh.sides[k] > 0)
        const label = { offer_a: "Tin A", offer_b: "Tin B", offer: "Tin" }[nhan]
        const trig = d.locator(`[aria-label='Phóng to ${label} ảnh 1']`)
        await trig.scrollIntoViewIfNeeded()
        await page.waitForTimeout(300)
        const o = await trig.boundingBox()
        const chan = await d.locator("[data-slot=sheet-footer]").boundingBox()
        const trongKhung = o && o.y >= 0 && o.y + o.height <= 844 && (!chan || o.y + o.height <= chan.y)
        await trig.click()
        const mo = await page.getByText(new RegExp(`${label} · ảnh 1/`)).first().isVisible().catch(() => false)
        check(trongKhung && mo, `[mobile-390] sheet thẻ ${coAnh.id}: ảnh 1 của ${label} trong khung nhìn sau khi cuộn tới, đáy ảnh ≤ đỉnh chân sheet, bấm → hộp phóng to mở`)
      }
      await ctx.close()
    }
  } finally {
    await browser?.close()
    const sau = await dem()
    check(sau.q === truoc.q && sau.o === truoc.o && sau.quyet === truoc.quyet, `DB không đổi: review_queue ${truoc.q}=${sau.q} (đã quyết ${truoc.quyet}=${sau.quyet}), sale_offers ${truoc.o}=${sau.o}`)
    await xoaTheThu()
    await donPhien()
    await pool.end()
  }
  if (fails.length) {
    console.log(`\nreview-queue smoke: ${fails.length} vi phạm`)
    process.exit(1)
  }
  console.log(`\nSMOKE PASS (${nonce})`)
}

main().catch(async (err) => {
  console.error(err)
  // Hỏng trước khối finally (vd đọc DB lỗi): vẫn dọn thẻ thử + tài khoản thử của lượt này.
  await pool.query(`DELETE FROM review_queue WHERE item_id = $1`, [`enrich:offer_${nonce}`]).catch(() => {})
  await pool.query(`DELETE FROM sessions WHERE user_id LIKE $1`, [`${nonce}-%`]).catch(() => {})
  await pool.query(`DELETE FROM users WHERE id LIKE $1`, [`${nonce}-%`]).catch(() => {})
  await pool.end().catch(() => {})
  process.exit(1)
})
