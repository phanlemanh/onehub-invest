// registry-s08-luat.test.tsx — hồ sơ _acceptance/soat-noi-s08-danh-ba, ca «RS8» (E6, AC-6): màn /ops/registry đếm dự án S08 nối ở
// bảng tay DN1 hay ở bảng luật DA55, tách số nối vào nút ứng viên. Chạy trên DB của riêng lượt (db/db-thu.sh --chay), trong một giao
// dịch ROLLBACK: dọn phần S08 của bản chép, dựng năm dự án, dòng nối dựng bằng chính apTheLuat của pipeline (không chèn tay khuôn
// bên đọc). Chiều đỏ: bản chép doc.ts mang câu đếm S08 cũ (chỉ bảng tay) thì số đã nối lệch.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"

import { apTheLuat, dungTheLuat } from "../../pipeline/noi-du-an-s08-luat.mjs"
import { oSo } from "../src/components/ops/registry/registry-view"
import type { DanhBa } from "../src/lib/ops/registry/doc"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const CU = join(APP, "tests", `.rs8-cu-${process.pid}`)
const URL_DB = process.env.DATABASE_URL ?? ""
const c = new pg.Client({ connectionString: URL_DB })
const MA = { tay: "RS8PRJ01", coSan: "RS8PRJ02", duc: "RS8PRJ03", kTinh: "RS8PRJ04", moi: "RS8PRJ05" }
const vuong = (x: number, y: number, d: number) => `MULTIPOLYGON(((${x - d} ${y - d},${x + d} ${y - d},${x + d} ${y + d},${x - d} ${y + d},${x - d} ${y - d})))`
const iframe = (lng: number, lat: number) => ({ project_info: { iframe_location: `<iframe src="https://maps.example/e?pb=!2d${lng}!3d${lat}!2m3"></iframe>` } })

before(async () => {
  // CI không cấp DB của riêng lượt (không DATABASE_URL): ca RS8 bỏ qua có tên qua scripts/ci-bo-qua.json; hook không dựng URL dự phòng.
  if (!URL_DB) return
  assert.match(new URL(URL_DB).pathname, /^\/oneinvest_suite_rs8/, "RS8 chỉ chạy trên DB của riêng lượt (db/db-thu.sh oneinvest_suite_rs8 --chay)")
  await c.connect()
  await c.query("BEGIN")
  await c.query("DELETE FROM project_links WHERE source = 'S08'")
  await c.query("DELETE FROM s08_project_links")
  await c.query("DELETE FROM stg_s08_project")
  await c.query("INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('rs8__s08', 'vn', 'S08', '{}') ON CONFLICT DO NOTHING")
  await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code, geom) VALUES ('rs8-tinh', NULL, 'market', 'Tỉnh thử RS8', 'VN', ST_GeomFromText($1, 4326))`,
    [vuong(150, -30, 0.5)])
})
after(async () => {
  if (!URL_DB) return
  await c.query("ROLLBACK").catch(() => {})
  await c.end().catch(() => {})
  rmSync(CU, { recursive: true, force: true })
})

const duAn = (ma: string, ten: string, diem: [number, number] | null) => c.query(
  "INSERT INTO stg_s08_project (snapshot_id, project_id, catalog_payload, detail_payload, fetched_at) VALUES ('rs8__s08', $1, $2, $3, now())",
  [ma, { project_name: ten, project_code: "RS8" }, diem ? iframe(diem[0], diem[1]) : null])

let soBan = 0
/** Bản chép doc.ts đổi đúng một chỗ, import tương đối trỏ về tệp gốc. */
async function banChep(doi: [string, string]): Promise<typeof import("../src/lib/ops/registry/doc")> {
  const rel = "src/lib/ops/registry/doc.ts"
  let src = readFileSync(join(APP, rel), "utf8")
  assert.ok(src.includes(doi[0]), `bản chép không áp được: ${doi[0].slice(0, 60)}`)
  src = src.replace(doi[0], doi[1]).replace(/from "(\.{1,2}\/[^"]+)"/g, (_m, spec: string) => {
    const g = join(APP, dirname(rel), spec)
    const f = [".ts", ".tsx", "/index.ts"].map((e) => g + e).find((p) => existsSync(p)) ?? g
    return `from "${pathToFileURL(f).href}"`
  })
  mkdirSync(CU, { recursive: true })
  const f = join(CU, `ban-${++soBan}.ts`)
  writeFileSync(f, src)
  return import(pathToFileURL(f).href)
}

test("RS8: S08 đã nối đếm hai bảng một lần, tách số nối vào nút ứng viên; chưa nối mang lý do bảng luật; chiều đỏ câu cũ", { skip: URL_DB ? false : "RS8 cần DATABASE_URL của DB riêng lượt (db/db-thu.sh oneinvest_suite_rs8 --chay)" }, async () => {
  const { rows: [nut] } = await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, catalog_tier, meta)
    VALUES ('project', 'Rs Thu Co San', 'rs8-thu-co-san', '{"rs thu co san"}', '{rs8-tinh}', 'xac_minh', '{}') RETURNING id::int AS id`)
  await duAn(MA.tay, "RS THU TAY", [150.1, -30.1])
  await duAn(MA.coSan, "RS THU CO SAN", [150.2, -30.2])
  await duAn(MA.duc, "RS THU DUC MOI", [150.3, -30.3])
  await duAn(MA.kTinh, "RS THU KHONG TINH", null)
  await c.query("INSERT INTO s08_project_links (project_id, asset_node_id, status) VALUES ($1, $2, 'noi')", [MA.tay, nut.id])
  const the = await dungTheLuat(c)
  await apTheLuat(c, { bam: the.bam, nguoi: "rs8", giaoDich: "ngoai" })
  // Sau áp: một dự án mới chưa có dòng nào; dự án nối luật cũng có dòng nối tay (đếm một lần).
  await duAn(MA.moi, "RS THU MOI NAP", [150.4, -30.4])
  await c.query("INSERT INTO s08_project_links (project_id, asset_node_id, status) VALUES ($1, $2, 'noi')", [MA.coSan, nut.id])

  const { docDanhBa } = await import("../src/lib/ops/registry/doc")
  const d: DanhBa = await docDanhBa(c as never)
  const s08 = d.tong.danhMuc.find((x) => x.source === "S08")
  assert.deepEqual(s08, { source: "S08", daNap: 5, daNoi: 3, chuaNoi: 2, noiUngVien: 1 })
  const chan = oSo(d.tong).find((o) => o.title === "Mã nguồn chưa nối")?.footer ?? ""
  assert.match(chan, /S08 2\/5 \(1 vào nút ứng viên\)/, `chân ô thiếu số tách: ${chan}`)
  const chua = d.chuaNoi.filter((r) => r.source === "S08").map((r) => [r.ma, r.lyDo ?? null])
  assert.deepEqual(chua, [[MA.kTinh, "khong-tinh"], [MA.moi, null]], "danh sách chưa nối S08")

  const cu = await banChep([
    `SELECT 'S08', count(*)::int, (count(*) FILTER (WHERE x.nut IS NOT NULL))::int,`,
    `SELECT 'S08', count(*)::int, (count(*) FILTER (WHERE x.nut IS NOT NULL AND x.project_id IN (SELECT project_id FROM s08_project_links WHERE status = 'noi')))::int,`,
  ])
  const s08cu = (await cu.docDanhBa(c as never)).tong.danhMuc.find((x) => x.source === "S08")
  assert.notEqual(s08cu?.daNoi, 3, "chiều đỏ: câu chỉ đếm bảng tay phải lệch số đã nối")
  assert.equal(s08cu?.daNoi, 2, "chiều đỏ: câu chỉ đếm bảng tay cho 2 (tay + dự án nối cả hai bảng)")
})
