// do-lam-giau.test.tsx — hồ sơ _acceptance/do-lam-giau (DO3), ca «DO3-AC-7». Dòng do3-* không dựng tay: ghi bằng doLamGiau của
// pipeline/do-lam-giau.mjs (qua dungThu của pipeline/scripts/do3-dung-thu.mjs — tin, Người, phát biểu bịa ghi bằng bên ghi thật) trên
// DB thử, giao dịch ROLLBACK; đọc lại bằng loadLamGiau của app, vẽ khối thật trong jsdom. Ca «chênh có ý nghĩa» và «ít mẫu» lấy bộ số
// từ tongKiem của pipeline. Chiều đỏ trên cùng dữ liệu, thông điệp ghim theo evals.yaml E7.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { JSDOM } from "jsdom"
import pg from "pg"
import type { ReactNode } from "react"
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"

import { dqLatestSql } from "../src/lib/dq-checks"
import { dqCheckName } from "../src/lib/dq-labels"
import type { LatDo } from "../src/lib/do-hang-ngay"
import { fmtInt, fmtPct } from "../src/lib/format"
import { gomLamGiau, type LamGiau, lamGiauSql, loadLamGiau, mauKiem, tong7 } from "../src/lib/ops/quality-lam-giau"

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const DB = process.env.DATABASE_URL
const coDb = { skip: DB ? false : "thiếu DATABASE_URL — chạy qua npm test (DB thử của lượt)" }
const ROUTER = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }

// ---- jsdom (bảng data-grid đọc kích thước cột, thanh cuộn gọi getAnimations) ----
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3463/ops/quality", pretendToBeVisual: true })
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  IS_REACT_ACT_ENVIRONMENT: true,
})
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })
Object.assign(dom.window.Element.prototype, { getAnimations: () => [] })
for (const k of ["ResizeObserver", "matchMedia"] as const) {
  if (!(k in globalThis)) {
    Object.assign(globalThis, {
      [k]: k === "matchMedia"
        ? () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
        : class { observe() {} unobserve() {} disconnect() {} },
    })
    Object.assign(dom.window, { [k]: (globalThis as Record<string, unknown>)[k] })
  }
}

/** Vẽ một cây vào jsdom, trả gốc đã tách (để truy vấn) và HTML. */
async function veCay(node: ReactNode): Promise<{ html: string; q: (s: string) => Element[] }> {
  const React = await import("react")
  const { createRoot } = await import("react-dom/client")
  const el = dom.window.document.getElementById("root")!
  const root = createRoot(el, { onCaughtError() {}, onUncaughtError() {} })
  await React.act(async () => root.render(<AppRouterContext.Provider value={ROUTER as never}>{node}</AppRouterContext.Provider>))
  const html = el.innerHTML
  await React.act(async () => root.unmount())
  const frag = JSDOM.fragment(html)
  return { html, q: (s) => [...frag.querySelectorAll(s)] }
}
async function ve(data: LamGiau | null, lat: LatDo = "tong", dotBien?: "chua-chay-hien-0" | "khong-loi-hien-0", areaNames: Record<string, string> = {}) {
  const { LamGiau: Khoi } = await import("../src/components/ops/quality/lam-giau")
  return veCay(<Khoi data={data} lat={lat} areaNames={areaNames} dotBien={dotBien} />)
}

/** Hàng của một đường trong một bảng (theo data-bang). */
const hang = (v: { q: (s: string) => Element[] }, bang: string, duong: string) =>
  v.q(`[data-bang="${bang}"] tr`).find((tr) => tr.querySelector(`[data-duong="${duong}"]`))
const oSo = (tr: Element) => [...tr.querySelectorAll("td")].flatMap((td) => [...td.querySelectorAll("span")].filter((s) => !s.children.length).map((s) => s.textContent?.trim()))

/** Đường chưa chạy: «Chưa chạy», không ô nào là 0. */
function kiemChuaChay(v: { q: (s: string) => Element[] }) {
  for (const d of ["dien-tich-suy-ra", "danh-muc-cdt"]) {
    const tr = hang(v, "lam-giau-ngay", d)
    assert.ok(tr, `có hàng ${d}`)
    assert.ok(tr.textContent?.includes("Chưa chạy"), `${d} hiện «Chưa chạy»`)
    if (oSo(tr).includes("0")) throw new Error(`CHUA CHAY HIEN 0: ${d}`)
  }
}
/** Đường không có lối người rút: ô người rút là chữ, không là số 0. */
function kiemKhongLoi(v: { q: (s: string) => Element[] }) {
  // Hai đường đang chạy đều không có lối người rút (Mạnh chốt 09/11: quy ước nhóm sửa bằng ghi đè, không rút).
  for (const duong of ["so-qua-nguoi-dang", "quy-uoc-nhom"]) {
    const cuoi = [...hang(v, "lam-giau-ngay", duong)!.querySelectorAll("td")].at(-1)!
    if (!cuoi.textContent?.includes("không có đường người rút")) throw new Error(`KHONG LOI HIEN 0: ${duong} ${cuoi.textContent}`)
  }
}
/** Bảng «Kiểm chất lượng» chung không lặp dòng do3-*. */
async function kiemChung(c: pg.Client, sql: string) {
  const { rows } = await c.query(sql)
  if (rows.some((r: { check_name: string }) => r.check_name.startsWith("do3-"))) throw new Error("LAP DONG DO3 trong bảng chung")
}
/** Hai check_name mới có nhãn tiếng Việt. */
function kiemNhan(ten: (c: string) => { text: string; known: boolean }) {
  const mong = { "do3-thay-doi": "Làm giàu: thay đổi theo ngày", "do3-kiem-nguoc": "Làm giàu: kiểm ngược tuần" }
  for (const [k, v] of Object.entries(mong)) {
    const t = ten(k)
    if (!t.known || t.text !== v) throw new Error(`THIEU NHAN DQ: ${k}`)
  }
}

async function moGiaoDich(c: pg.Client) {
  const { rows: [{ db }] } = await c.query("SELECT current_database() AS db")
  if (db === "oneinvest") throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung — dùng DB thử")
  await c.query("BEGIN")
  await c.query("SELECT pg_advisory_xact_lock(33033)")
  const { napLamGiau } = await import("../../pipeline/lib/do-lam-giau-db.mjs")
  await napLamGiau(c)
  await c.query("DELETE FROM dq_check_results WHERE check_name LIKE 'do3-%'; DELETE FROM enrichment_value_state; DELETE FROM enrichment_value_change")
}

test("DO3-AC-7 khối Làm giàu: mỗi đường một hàng, chưa chạy, không có đường người rút, lập mốc, kiểm ngược, lát, bảng chung, nhãn", coDb, async () => {
  const c = new pg.Client({ connectionString: DB })
  await c.connect()
  try {
    await moGiaoDich(c)
    const { doLamGiau } = await import("../../pipeline/do-lam-giau.mjs")
    const { dungThu } = await import("../../pipeline/scripts/do3-dung-thu.mjs")

    // Lập mốc: lượt đầu của đường chỉ ghi ảnh chụp → «đã lập mốc».
    await c.query("SAVEPOINT moc")
    await doLamGiau(c, { ngay: "2026-11-01", write: true, kiemNguoc: false })
    const moc = await ve(await loadLamGiau(c))
    assert.ok(moc.html.includes("đã lập mốc"), "lập mốc → «đã lập mốc»")
    assert.ok(hang(moc, "lam-giau-ngay", "quy-uoc-nhom")?.querySelector('[data-ghi-duong="lap-moc"]'))
    await c.query("ROLLBACK TO SAVEPOINT moc")

    // Ba lượt thật: D−7 (lập mốc + kiểm ngược tuần trước), D−1, D — tin, Người, phát biểu bịa ghi bằng bên ghi thật.
    const kq = await dungThu(c, { log: () => {} })
    const { rows: ten } = await c.query("SELECT id, name FROM areas WHERE id = ANY ($1::text[])", [kq.areas])
    const areaNames = Object.fromEntries(ten.map((r: { id: string; name: string }) => [r.id, r.name]))
    const data = await loadLamGiau(c)
    assert.ok(data, "có dòng do3-*")
    assert.equal(data.ngay, kq.D)
    const v = await ve(data, "tong", undefined, areaNames)

    // Mỗi đường một hàng, đúng bốn đường của sổ.
    const duong = v.q('[data-bang="lam-giau-ngay"] tbody [data-duong]').map((e) => e.getAttribute("data-duong"))
    assert.deepEqual(duong, ["so-qua-nguoi-dang", "quy-uoc-nhom", "dien-tich-suy-ra", "danh-muc-cdt"])
    // Số qua người đăng: thêm/đổi/máy rút hôm nay + 7 ngày; ô người rút là chữ.
    const so = data.duong.find((d) => d.duong === "so-qua-nguoi-dang")!
    assert.equal(so.homNay?.duong_nguoi_rut, false, "tiền đề: bộ ghi ghi duong_nguoi_rut: false")
    assert.ok((so.homNay?.them ?? 0) + (so.homNay?.doi ?? 0) + (so.homNay?.may_rut ?? 0) > 0, "tiền đề: có thay đổi hôm nay")
    const trSo = hang(v, "lam-giau-ngay", "so-qua-nguoi-dang")!
    const tds = [...trSo.querySelectorAll("td")].map((td) => td.textContent ?? "")
    for (const [i, o] of (["them", "doi", "may_rut"] as const).entries()) {
      assert.ok(tds[3 + i].startsWith(fmtInt(so.homNay![o] ?? 0)), `${o} hôm nay: ${tds[3 + i]}`)
      assert.ok(tds[3 + i].includes(`7 ngày: ${fmtInt(tong7(so.bayNgay, o))}`), `${o} 7 ngày: ${tds[3 + i]}`)
    }
    kiemKhongLoi(v)
    await assert.rejects(async () => kiemKhongLoi(await ve(data, "tong", "khong-loi-hien-0")), /KHONG LOI HIEN 0/)
    // Quy ước nhóm: người ghi đè vào ô «Người sửa» (số của bộ ghi, gồm phần ghi đè).
    const nh = data.duong.find((d) => d.duong === "quy-uoc-nhom")!
    assert.equal(nh.homNay?.duong_nguoi_rut, false, "tiền đề: quy ước nhóm không có lối người rút")
    assert.ok((nh.homNay?.nguoi_sua_de ?? 0) >= 1, "tiền đề: dựng thử có một lần người ghi đè")
    const tdNh = [...hang(v, "lam-giau-ngay", "quy-uoc-nhom")!.querySelectorAll("td")].map((td) => td.textContent ?? "")
    assert.ok(tdNh.at(-2)!.startsWith(fmtInt(nh.homNay!.nguoi_sua!)), `người sửa: ${tdNh.at(-2)}`)
    // Đường chưa chạy.
    kiemChuaChay(v)
    await assert.rejects(async () => kiemChuaChay(await ve(data, "tong", "chua-chay-hien-0")), /CHUA CHAY HIEN 0/)

    // Kiểm ngược tuần này / tuần trước: tỉ lệ đúng, cận dưới Wilson, n.
    for (const d of [so, nh]) {
      assert.ok(d.kiemNay && d.kiemTruoc, `${d.duong} có kiểm ngược hai tuần`)
      const tr = hang(v, "lam-giau-kiem", d.duong)!
      const t = [...tr.querySelectorAll("td")].map((td) => td.textContent ?? "")
      assert.ok(t[1].includes(fmtPct(d.kiemNay.ty_le_dung ?? null)) && t[1].includes(`n=${fmtInt(mauKiem(d.kiemNay))}`), t[1])
      assert.equal(t[2], fmtPct(d.kiemNay.wilson!.thap))
      assert.ok(t[3].includes(fmtPct(d.kiemTruoc.ty_le_dung ?? null)), t[3])
      assert.equal(t[4], fmtPct(d.kiemTruoc.wilson!.thap))
    }
    assert.ok(hang(v, "lam-giau-kiem", "dien-tich-suy-ra")!.textContent?.includes("Chưa chạy"))

    // «Chênh có ý nghĩa» và «ít mẫu»: bộ số của tongKiem (pipeline) trên ca đặt trước.
    const { tongKiem } = await import("../../pipeline/lib/do-lam-giau.mjs")
    const { rows: raw } = await c.query(lamGiauSql())
    const dongKiem = (tuan: string, k: { n: number; dung: number; sai: number; khong_ra: number }, truoc: { dung: number; sai: number } | null) =>
      ({ check_name: "do3-kiem-nguoc", entity: "quy-uoc-nhom", status: "pass", checked_at: "2026-11-08",
        detail: JSON.stringify({ tuan, tap_do: "bai-co-chu-loai", ...k, ...tongKiem(k, truoc) }) })
    const giu = raw.filter((r: { check_name: string; entity: string }) => !(r.check_name === "do3-kiem-nguoc" && r.entity === "quy-uoc-nhom"))
    const tTruoc = nh.kiemTruoc!.tuan, tNay = data.tuanNay!
    const yNghia = await ve(gomLamGiau([...giu, dongKiem(tTruoc, { n: 100, dung: 50, sai: 50, khong_ra: 0 }, null),
      dongKiem(tNay, { n: 100, dung: 90, sai: 10, khong_ra: 0 }, { dung: 50, sai: 50 })]))
    assert.ok(hang(yNghia, "lam-giau-kiem", "quy-uoc-nhom")!.querySelector("[data-co-y-nghia]")?.textContent?.includes("chênh có ý nghĩa"))
    assert.ok(!hang(v, "lam-giau-kiem", "quy-uoc-nhom")!.querySelector("[data-co-y-nghia]"), "cùng dữ liệu hai tuần → không có dấu")
    const itMau = await ve(gomLamGiau([...giu, dongKiem(tNay, { n: 4, dung: 2, sai: 1, khong_ra: 1 }, null)]))
    const trIt = hang(itMau, "lam-giau-kiem", "quy-uoc-nhom")!
    assert.ok(trIt.textContent?.includes("ít mẫu"), "n < 5 → «ít mẫu»")
    assert.ok(!trIt.textContent?.includes("%"), "ít mẫu không in phần trăm")
    // Đường đang chạy chưa có kiểm ngược tuần này.
    const chuaKiem = await ve(gomLamGiau(giu))
    assert.ok(hang(chuaKiem, "lam-giau-kiem", "quy-uoc-nhom")!.textContent?.includes(`Chưa có kiểm ngược tuần ${tNay}`))

    // ?lat-do=phuong: bảng đổi sang phân rã phường (hai ô chưa gắn luôn hiện), không còn bảng tổng.
    const p = await ve(data, "phuong", undefined, areaNames)
    assert.ok(p.q('[data-bang="lam-giau-lat-ngay"]').length && p.q('[data-bang="lam-giau-lat-kiem"]').length, "có hai bảng lát")
    assert.ok(!p.q('[data-bang="lam-giau-ngay"]').length, "lát phường không còn bảng tổng")
    const oPhuong = p.q('[data-bang="lam-giau-lat-ngay"] [data-o-lat]').map((e) => e.getAttribute("data-o-lat"))
    assert.ok(oPhuong.includes("khong-tin-hieu"), "ô chưa gắn luôn hiện")
    assert.ok(oPhuong.some((o) => kq.areas.includes(o!)), "có ô phường của tin bịa")
    assert.ok(p.html.includes(areaNames[kq.areas[0]] ?? "\u0000") || p.html.includes(areaNames[kq.areas[1]] ?? "\u0000"), "ô phường hiện tên")
    assert.notEqual(p.html, v.html)

    // Bảng «Kiểm chất lượng» chung không lặp do3-*.
    await kiemChung(c, dqLatestSql())
    await assert.rejects(kiemChung(c, dqLatestSql().replace(" AND check_name NOT LIKE 'do3-%'", "")), /LAP DONG DO3/)
    // Nhãn dq cho hai check_name.
    kiemNhan(dqCheckName)
    assert.throws(() => kiemNhan((k) => (k.startsWith("do3-") ? dqCheckName("chua-co-nhan") : dqCheckName(k))), /THIEU NHAN DQ/)
  } finally {
    await c.query("ROLLBACK").catch(() => {})
    await c.end()
  }
})

test("DO3-AC-7 trống, lỗi tại chỗ có Thử lại, phần khác vẫn đứng", async () => {
  const trong = await ve(gomLamGiau([]))
  assert.ok(trong.html.includes("Chưa có số đo làm giàu") && trong.html.includes("node pipeline/do-lam-giau.mjs --write"))
  await assert.rejects(loadLamGiau({ query: async () => { throw new Error("db hỏng") } }), /db hỏng/)
  const trang = readFileSync(join(GOC, "app/src/app/ops/quality/page.tsx"), "utf8")
  assert.match(trang, /<RegionError what="số đo làm giàu">\s*<Suspense fallback=\{<LamGiauSkeleton \/>\}>\s*<LamGiauKhoi /)
  assert.ok(trang.indexOf('what="số đo hằng ngày"') < trang.indexOf('what="số đo làm giàu"'), "khối Làm giàu đứng dưới Đo hằng ngày")
  const { RegionError } = await import("../src/components/states/region-error")
  function Hong(): never { throw new Error("db hỏng") }
  const loi = await veCay(<>
    <RegionError what="số đo làm giàu"><Hong /></RegionError>
    <p data-phan-khac="">Kiểm chất lượng (7 ngày)</p>
  </>)
  assert.ok(loi.html.includes("Không tải được số đo làm giàu") && loi.html.includes("Thử lại"), loi.html.slice(0, 400))
  assert.ok(loi.q("[data-phan-khac]").length === 1, "phần khác của trang vẫn render")
  const { LamGiauSkeleton } = await import("../src/components/ops/quality/lam-giau")
  assert.ok((await veCay(<LamGiauSkeleton />)).html.includes("data-do3-loading"))
})
