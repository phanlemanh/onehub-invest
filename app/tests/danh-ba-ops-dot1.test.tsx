// danh-ba-ops-dot1.test.tsx — hồ sơ _acceptance/danh-ba-ops-gop-cau-s16-va-nhan (DA67), ca DBO-AC-1, AC-5…AC-10. Render tĩnh
// component thật; ca cần DB chạy trên DB thử oneinvest_dbv_dbo_<pid> dựng từ db/migrations (pipeline/scripts/db-thu-dbv.mjs),
// xoá khi xong. Chiều đỏ: bản sao có một chỗ phá, nạp từ thư mục tạm (không ghi vào cây kho).
// Chạy: bash _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh man
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"
import type { ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { taoDbThu, xoaDbThu } from "../../pipeline/scripts/db-thu-dbv.mjs"
import type { DuAnProps } from "../src/components/ops/registry/du-an-view"
import type { HangCay } from "../src/lib/ops/registry/cay"
import type * as Lop from "../src/lib/ops/thuoc-tinh-can"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
/** Bản sao ở thư mục tạm không thấy node_modules của app — import gói trần giải từ app/. */
const yeuCau = createRequire(join(APP, "package.json"))
const TEN = `oneinvest_dbv_dbo_${process.pid}`
const B1 = `bld_${"7".padStart(26, "0")}`
const can = (n: number) => `unt_${String(700 + n).padStart(26, "0")}`
let db: pg.Client
let duAn: number
let phanKhu: number

before(async () => {
  const url = await taoDbThu(TEN)
  process.env.DATABASE_URL = url // pool của app đọc lúc nạp: đặt trước mọi import động
  db = new pg.Client({ connectionString: url })
  await db.connect()
  duAn = (await db.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
    VALUES ('project', 'DBO DA', 'dbo-da', '{}', '{}', 'SubdivisionName', '{}') RETURNING id::int AS id`)).rows[0].id
  phanKhu = (await db.query(`INSERT INTO asset_nodes (node_type, name, slug, parent_id, aliases, area_ids, dd_field, meta)
    VALUES ('subzone', 'DBO PK', 'dbo-pk', $1, '{}', '{}', 'SubdivisionName', '{}') RETURNING id::int AS id`, [duAn])).rows[0].id
  await db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
    VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [B1, duAn])
  // Bí danh S16 cho toà → ô phủ ra «co» dù không căn nào có thuộc tính (so_du_an = 1).
  await db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', 'dbo-da/T1', 'S16')`, [B1])
  for (const n of [1, 2]) {
    await db.query(`INSERT INTO units (unit_key, building_key, floor, sub_id, catalog_tier) VALUES ($1, $2, '5', $1, 'xac_minh')`, [can(n), B1])
  }
})
after(async () => {
  await db?.end().catch(() => {})
  await (await import("../src/lib/db")).pool.end().catch(() => {})
  await xoaDbThu(TEN)
})

/** Bản sao một tệp nguồn có chỗ phá, nạp từ thư mục tạm; import tương đối đổi sang đường tuyệt đối của tệp gốc. */
async function banPha<T>(tep: string, tu: string, sang: string): Promise<T> {
  const goc = join(APP, tep)
  const src = readFileSync(goc, "utf8")
  assert.ok(src.split(tu).length === 2, `DBO chỗ phá không còn đúng một lần trong ${tep}: ${tu}`)
  const dir = mkdtempSync(join(tmpdir(), "dbo-pha-"))
  const ra = join(dir, tep.split("/").pop()!)
  const tuyetDoi = src.replace(tu, sang).replace(/from "(\.{1,2}\/[^"]+)"/g, (_, r: string) => {
    const dich = resolve(dirname(goc), r)
    const coDuoi = /\.(tsx?|mjs)$/.test(dich) ? dich : [".ts", ".tsx"].map((e) => dich + e).find((f) => { try { readFileSync(f); return true } catch { return false } }) ?? dich
    return `from ${JSON.stringify(pathToFileURL(coDuoi).href)}`
  }).replace(/from "([^".@/][^"]*|@(?!\/)[^"]+)"/g, (_, g: string) => `from ${JSON.stringify(pathToFileURL(yeuCau.resolve(g)).href)}`)
  // Thư mục tạm không có tsconfig của app (JSX cổ điển): nạp sẵn React cho bản .tsx.
  writeFileSync(ra, ra.endsWith(".tsx") ? `import React from ${JSON.stringify(pathToFileURL(yeuCau.resolve("react")).href)}\n${tuyetDoi}` : tuyetDoi)
  try { return await import(pathToFileURL(ra).href) } finally { rmSync(dir, { recursive: true, force: true }) }
}
/** q bọc: đếm câu chạm view thuộc tính (không tính câu kiểm to_regclass) và giữ kết quả của câu ấy. */
function boc(q: pg.Client) {
  const o = {
    soV: 0, ketQua: null as pg.QueryResult | null,
    async query(text: string, params?: unknown[]) {
      const r = await q.query(text, params)
      if (text.includes("v_unit_thuoc_tinh") && !text.includes("to_regclass")) { o.soV++; o.ketQua = r }
      return r
    },
  }
  return o
}

// ---------- AC-1 ----------
test("DBO-AC-1 trang dự án chạy MỘT câu S16; ô phủ lấy đúng cột gộp của SQL; chiều đỏ: bỏ cột, hay gọi lại hai hàm cũ", async () => {
  const { pool } = await import("../src/lib/db")
  const goc = pool.query.bind(pool)
  let soV = 0
  const dem = ((text: unknown, ...rest: unknown[]) => {
    const t = typeof text === "string" ? text : (text as { text?: string })?.text ?? ""
    if (t.includes("v_unit_thuoc_tinh") && !t.includes("to_regclass")) soV++
    return (goc as (...a: unknown[]) => unknown)(text, ...rest)
  }) as typeof pool.query
  const chay = async (mod: { DuAnContent: (p: { id: number }) => Promise<unknown> }) => {
    soV = 0
    pool.query = dem
    try { await mod.DuAnContent({ id: duAn }) } finally { pool.query = goc }
    return soV
  }
  assert.equal(await chay(await import("../src/components/ops/registry/du-an-content")), 1, "AC-1 trang chạy hai câu S16")
  // Đối chứng đỏ cùng fixture: bản trang gọi lại hai hàm cũ song song (đổi dòng import thành lớp ghép hai hàm).
  const haiDu = await banPha<{ DuAnContent: (p: { id: number }) => Promise<unknown> }>("src/components/ops/registry/du-an-content.tsx",
    'import { docThuocTinhDuAn } from "@/lib/ops/thuoc-tinh-can"\n',
    'import { docPhuThuocTinh, docThuocTinhCan } from "@/lib/ops/thuoc-tinh-can"\nconst docThuocTinhDuAn = async (k: string[]) => { const [thuocTinh, phu] = await Promise.all([docThuocTinhCan(k), docPhuThuocTinh(k)]); return { thuocTinh, phu } }\n')
  assert.equal(await chay(haiDu), 2, "AC-1 đối chứng: bản gọi hai hàm cũ mà bộ đếm vẫn ra 1 — không phân biệt")

  // Ô phủ bằng đúng các cột gộp mà câu SQL trả về (không đếm ở TypeScript).
  const lop: typeof Lop = await import("../src/lib/ops/thuoc-tinh-can")
  const q = boc(db)
  const kq = await lop.docThuocTinhDuAn([B1], q as unknown as pg.Client)
  const h = q.ketQua?.rows[0]
  assert.ok(h && ["trong_danh_ba", "co_thuoc_tinh", "co_gia", "phu_lan_thu"].every((k) => k in h), "AC-1 câu S16 không mang cột gộp của ô phủ")
  assert.ok(kq.phu.ok && kq.phu.data.trangThai === "co", "AC-1 ô phủ không ra trạng thái có")
  assert.deepEqual([kq.phu.data.trongDanhBa, kq.phu.data.coThuocTinh, kq.phu.data.coGia], [h.trong_danh_ba, h.co_thuoc_tinh, h.co_gia], "AC-1 ô phủ không lấy từ SQL")
  const dem2 = (await db.query(`SELECT count(*)::int n FROM units WHERE building_key = $1 AND status = 'active'`, [B1])).rows[0].n
  assert.equal(kq.phu.data.trongDanhBa, dem2, "AC-1 ô phủ lệch đếm độc lập")
  const pha = await banPha<typeof Lop>("src/lib/ops/thuoc-tinh-can.ts", "count(*)::int AS trong_danh_ba,", "count(*)::int AS trong_danh_ba_x,")
  const p = await pha.docThuocTinhDuAn([B1], db)
  assert.ok(!p.phu.ok || p.phu.data.trangThai !== "co" || p.phu.data.trongDanhBa !== dem2, "AC-1 ô phủ không lấy từ SQL — bỏ cột mà ô phủ vẫn đúng")
})

// ---------- AC-5 ----------
test("DBO-AC-5 dự án 0 toà không chạy câu nào; lỗi thử → cả hai phần lỗi và trang hiện Alert «Thử lại» cùng lưới toà", async () => {
  const lop: typeof Lop = await import("../src/lib/ops/thuoc-tinh-can")
  const q = boc(db)
  let tong = 0
  const demTat = { query: async (t: string, p?: unknown[]) => { tong++; return q.query(t, p) } }
  const r = await lop.docThuocTinhDuAn([], demTat as unknown as pg.Client)
  assert.equal(tong, 0, "AC-5 dự án 0 toà vẫn chạy câu")
  assert.ok(r.phu.ok && r.phu.data.trangThai === "khong-nguon" && r.thuocTinh.ok && r.thuocTinh.data.size === 0, "AC-5 dự án 0 toà phải ra không nguồn, lưới rỗng")
  const pha = await banPha<typeof Lop>("src/lib/ops/thuoc-tinh-can.ts", "if (!toaKeys.length || !(await q.query", "if (!(await q.query")
  tong = 0
  await pha.docThuocTinhDuAn([], demTat as unknown as pg.Client)
  assert.ok(tong > 0, "AC-5 đối chứng: bỏ nhánh toà rỗng mà vẫn 0 câu — phép đếm không phân biệt")
  process.env.ONEHUB_TTC_LOI_THU = "1"
  try {
    const l = await lop.docThuocTinhDuAn([B1], db)
    assert.ok(!l.phu.ok && !l.thuocTinh.ok, "AC-5 lỗi thử không bọc thành lỗi cho cả hai phần")
    const { DuAnContent } = await import("../src/components/ops/registry/du-an-content")
    const { DuAnView } = await import("../src/components/ops/registry/du-an-view")
    const el = (await DuAnContent({ id: duAn })) as ReactElement<DuAnProps>
    const html = renderToStaticMarkup(<DuAnView {...el.props} />)
    for (const chu of ["Không tải được thuộc tính căn", "Thử lại", "Toà và căn"]) assert.ok(html.includes(chu), `AC-5 lỗi đọc: thiếu «${chu}»`)
  } finally { delete process.env.ONEHUB_TTC_LOI_THU }
})

// ---------- AC-6, AC-9, AC-10: lưới danh sách ----------
const hangCay = (o: Partial<HangCay> = {}): HangCay => ({
  id: 1, loai: "project", ten: "Vinhomes Grand Park", biDanh: ["vinhomes grand park", "VGP"], bac: "xac_minh", tinh: "Hà Nội", nguon: ["S16"],
  soPhanKhu: 1, soToa: 3, toaChuaCan: 0, soCan: 120, tin: { S03: 5 }, thieu: [], timKiem: "vinhomes grand park vinhomes grand park vgp",
  subRows: [{ id: 2, loai: "subzone", ten: "Phân khu A", biDanh: [], bac: "xac_minh", tinh: "Hà Nội", nguon: ["S16"], soPhanKhu: 0, soToa: 3,
    toaChuaCan: 0, soCan: 120, tin: {}, thieu: [], timKiem: "phan khu a" }],
  ...o,
})
const veLuoi = async (rows: HangCay[]) => {
  const { RegistryGrid } = await import("../src/components/ops/registry/registry-grid")
  return renderToStaticMarkup(<RegistryGrid rows={rows} />)
}

test("DBO-AC-6 nút mở hàng tiếng Việt; chiều đỏ: thiếu nhãn thì lộ «Expand row»", async () => {
  const { DATA_GRID_VI } = await import("../src/components/insight/insight-grid")
  assert.deepEqual([DATA_GRID_VI.labels?.expandRow, DATA_GRID_VI.labels?.collapseRow], ["Mở hàng", "Thu gọn hàng"], "AC-6 DATA_GRID_VI thiếu nhãn")
  const html = await veLuoi([hangCay()])
  assert.ok(html.includes('aria-label="Mở hàng"'), "AC-6 nút mở hàng không đọc «Mở hàng»")
  assert.ok(!/Expand row|Collapse row/.test(html), "AC-6 nhãn tiếng Anh")
  const giu = { ...DATA_GRID_VI.labels }
  delete (DATA_GRID_VI.labels as Record<string, unknown>).expandRow
  try {
    assert.ok((await veLuoi([hangCay()])).includes("Expand row"), "AC-6 đối chứng: bỏ nhãn mà HTML không lộ «Expand row» — phép đo không phân biệt")
  } finally { Object.assign(DATA_GRID_VI.labels!, giu) }
})

test("DBO-AC-9 dòng phụ bỏ bí danh trùng tên sau gấp dấu, giữ bí danh khác; ô tìm không đổi; chiều đỏ: so không gấp dấu", async () => {
  const { biDanhKhacTen } = await import("../src/lib/ops/registry/cay")
  const BANG: [string, string[], string[]][] = [
    ["Vinhomes Grand Park", ["vinhomes grand park", "VGP"], ["VGP"]],
    ["Celadon City", ["celadon city"], []],
    ["Đông Anh Town", ["dong anh town", "đông anh"], ["đông anh"]],
    ["Thủ Đức", ["THU DUC"], []],
    ["Vinhomes Ocean Park", ["Vinhomes Ocean Park 2"], ["Vinhomes Ocean Park 2"]],
    ["X", ["a", "b", "c", "d"], ["a", "b", "c"]],
  ]
  let soAssert = 0
  for (const [ten, bd, mong] of BANG) { assert.deepEqual(biDanhKhacTen(ten, bd), mong, `AC-9 bí danh trùng tên còn hiện: ${ten}`); soAssert++ }
  assert.equal(soAssert, BANG.length)
  const html = await veLuoi([hangCay()])
  assert.ok(html.includes("VGP") && !html.includes("vinhomes grand park"), "AC-9 bí danh trùng tên còn hiện ở dòng phụ")
  // Ô tìm đo trên hàng do dungCay THẬT dựng (không đọc fixture): bí danh thứ tư bị cắt khỏi dòng phụ vẫn tìm được.
  const { dungCay, khopTim } = await import("../src/lib/ops/registry/cay")
  type Nut = import("../src/lib/ops/registry/doc").NutDanhBa
  const nut: Nut = { id: 9, loai: "project", parentId: null, ten: "Đông Park", biDanh: ["dong park", "a1", "a2", "a3", "zz-bi-danh-4"], bac: "xac_minh",
    tinhId: null, nguon: [], soPhanKhu: 0, soToa: 0, toaChuaCan: 0, soCan: 0, tin: {} }
  // Bộ che cần ít nhất một tên nguồn (danh sách rỗng → che mọi chữ thành «—», đúng chiều an toàn của trang).
  const NGUON = [{ code: "S99", realName: "NguonGiaDbo" }]
  const [h] = dungCay([nut], {}, NGUON)
  assert.deepEqual(biDanhKhacTen(h.ten, h.biDanh), ["a1", "a2", "a3"], "AC-9 tiền đề: dòng phụ không cắt bí danh thứ tư")
  for (const chu of ["zz-bi-danh-4", "dong park", "Đông Park"]) assert.ok(khopTim(h, chu), `AC-9 ô tìm mất bí danh: «${chu}»`)
  // Chiều đỏ cùng fixture: bản dungCay dựng ô tìm từ bí danh đã lọc cho dòng phụ → bí danh thứ tư không tìm được.
  const phaCay = await banPha<{ dungCay: typeof dungCay; khopTim: typeof khopTim }>("src/lib/ops/registry/cay.ts",
    "timKiem: fold([ten, ...biDanh].join(\" \")),", "timKiem: fold([ten, ...biDanhKhacTen(ten, biDanh)].join(\" \")),")
  assert.ok(!phaCay.khopTim(phaCay.dungCay([nut], {}, NGUON)[0], "zz-bi-danh-4"), "AC-9 đối chứng: ô tìm dựng từ bí danh đã lọc mà vẫn tìm được — phép đo không phân biệt")
  const pha = await banPha<{ biDanhKhacTen: (t: string, b: string[]) => string[] }>("src/lib/ops/registry/cay.ts",
    "return biDanh.filter((b) => fold(b) !== t).slice(0, toiDa)", "return biDanh.filter((b) => b !== ten).slice(0, toiDa)")
  assert.deepEqual(pha.biDanhKhacTen("Vinhomes Grand Park", ["vinhomes grand park"]), ["vinhomes grand park"], "AC-9 đối chứng: so không gấp dấu mà vẫn bỏ được — bảng không phân biệt")
})

/** Khung bảng đo được ở 375 px trên M5 27/11 (clientWidth của vùng cuộn) — tổng bề rộng cột hiện phải không vượt nó. */
const KHUNG_375 = 333
const tieuDe = (html: string) => [...html.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").trim()).filter(Boolean)
const tongCot = (html: string) => [...html.matchAll(/<col\b[^>]*style="width:\s*(\d+)px/g)].reduce((t, m) => t + Number(m[1]), 0)
const veKho = async (kho: "sm" | "md" | "xl") => {
  const { RegistryGrid } = await import("../src/components/ops/registry/registry-grid")
  return renderToStaticMarkup(<RegistryGrid rows={[hangCay()]} khoMan={kho} />)
}

test("DBO-AC-10 khổ 375 px: Bậc rời bảng, Toà Căn Tin còn, tổng bề rộng cột vừa khung; từ 768 px có Bậc; chiều đỏ: khổ xl tràn khung", async () => {
  const sm = await veKho("sm")
  const dsSm = tieuDe(sm)
  assert.ok(!dsSm.includes("Bậc"), `AC-10 Bậc không ẩn ở 375 px: ${dsSm.join(" | ")}`)
  for (const n of ["Toà", "Căn", "Tin đang rao"]) assert.ok(dsSm.includes(n), `AC-10 cột ${n} không có ở 375 px`)
  const rong = tongCot(sm)
  assert.ok(rong > 0 && rong <= KHUNG_375, `AC-10 tổng bề rộng cột ở 375 px là ${rong} px > ${KHUNG_375} — bảng phải cuộn ngang`)
  assert.ok(tieuDe(await veKho("md")).includes("Bậc"), "AC-10 Bậc mất ở 768 px")
  // Chiều đỏ cùng fixture: khổ xl (mọi cột, bề rộng gốc) vượt khung — phép đo bề rộng phân biệt được.
  assert.ok(tongCot(await veKho("xl")) > KHUNG_375, "AC-10 đối chứng: khổ xl không vượt khung — phép đo không phân biệt")
  // Lượt vẽ máy chủ (không ép khổ) vẫn giữ lớp ẩn theo breakpoint cho khung đầu trước khi trình duyệt đọc khổ màn.
  const html = await veLuoi([hangCay()])
  const lop = [...html.matchAll(/<th\b[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/th>/g)].find((m) => m[2].includes(">Bậc<") || m[2].endsWith("Bậc"))?.[1] ?? ""
  assert.match(lop, /\bhidden md:table-cell\b/, "AC-10 lượt vẽ máy chủ mất lớp ẩn Bậc")
})

// ---------- AC-7 ----------
test("DBO-AC-7 chân ô Toà: 0 toà «Chưa có toà», còn toà chưa căn «N toà chưa có căn», đủ căn «Mọi toà đã có căn»", async () => {
  const { DuAnView } = await import("../src/components/ops/registry/du-an-view")
  const goc: DuAnProps = { ten: "Q", biDanh: [], bac: "xac_minh", tinh: null, nguon: [], maNoi: [], soPhanKhu: 0, soToa: 0, toaChuaCan: 0, soTruc: 0,
    soCan: 0, tin: {}, rows: [], phuThuocTinh: { trangThai: "khong-nguon" }, loiThuocTinh: false }
  const oToa = (p: Partial<DuAnProps>) => {
    const h = renderToStaticMarkup(<DuAnView {...goc} {...p} />)
    const i = h.indexOf(">Toà<"), j = h.indexOf(">Căn<", i)
    assert.ok(i >= 0 && j > i, "AC-7 không thấy ô Toà")
    return h.slice(i, j)
  }
  assert.ok(oToa({}).includes("Chưa có toà") && !oToa({}).includes("Mọi toà đã có căn"), "AC-7 dự án 0 toà")
  assert.ok(oToa({ soToa: 3, toaChuaCan: 2 }).includes("2 toà chưa có căn"), "AC-7 toà chưa có căn")
  assert.ok(oToa({ soToa: 3 }).includes("Mọi toà đã có căn"), "AC-7 mọi toà có căn")
  const pha = await banPha<{ DuAnView: (p: DuAnProps) => ReactElement }>("src/components/ops/registry/du-an-view.tsx", 'p.soToa === 0 ? "Chưa có toà" : ', "")
  const h = renderToStaticMarkup(<pha.DuAnView {...goc} />)
  assert.ok(h.slice(h.indexOf(">Toà<"), h.indexOf(">Căn<", h.indexOf(">Toà<"))).includes("Mọi toà đã có căn"), "AC-7 đối chứng: bỏ nhánh 0 toà mà vẫn «Chưa có toà»")
})

// ---------- AC-8 ----------
test("DBO-AC-8 mã sai ra trang Ops «Về danh bạ»; DuAnContent ném notFound cho nút không có và nút không phải dự án gốc", async () => {
  const NotFound = (await import("../src/app/ops/registry/[nodeId]/not-found")).default
  const html = renderToStaticMarkup(<NotFound />)
  assert.ok(html.includes("Không có dự án này trong danh bạ"), "AC-8 thiếu tiêu đề")
  assert.match(html, /href="\/ops\/registry"[^>]*>[\s\S]*?Về danh bạ|Về danh bạ/, "AC-8 thiếu nút")
  assert.ok(/<a\b[^>]*href="\/ops\/registry"/.test(html), "AC-8 nút không về danh bạ")
  assert.ok(!html.includes("Xem thị trường Việt Nam"), "AC-8 còn nút sang cổng Invest")
  const { parseNodeId } = await import("../src/lib/ops/registry/du-an")
  assert.equal(parseNodeId("abc"), null, "AC-8 mã sai khuôn không bị chặn")
  const { DuAnContent } = await import("../src/components/ops/registry/du-an-content")
  const la404 = (e: unknown) => String((e as { digest?: string })?.digest ?? "").includes("404")
  for (const [ten, id] of [["nút không có", 999_999_999], ["phân khu", phanKhu]] as const) {
    await assert.rejects(DuAnContent({ id }), la404, `AC-8 ${ten} không ra 404`)
  }
  await assert.doesNotReject(DuAnContent({ id: duAn }), "AC-8 đối chứng: dự án gốc lại ra 404")
  const pha = await banPha<{ default: () => ReactElement }>("src/app/ops/registry/[nodeId]/not-found.tsx", 'href="/ops/registry"', 'href="/vn"')
  assert.ok(!/<a\b[^>]*href="\/ops\/registry"/.test(renderToStaticMarkup(<pha.default />)), "AC-8 đối chứng: nút trỏ /vn mà phép đo vẫn thấy «về danh bạ»")
})
