// finder-ranh-gioi.test.tsx — AU9 `ranh-gioi-khu-vuc-dung` AC-8: bản đồ Finder Hà Nội (getFinderAreas — đúng hàm
// trang /vn dùng) chỉ còn khu vực nằm trong polygon Hà Nội. Áp thử runReassign + 300_metrics trong MỘT transaction
// trên Postgres local rồi ROLLBACK (Hỏi-4: áp thật chỉ sau chữ ký Cổng Bằng chứng). Đối chứng: một khu vực lạc mồi
// chèn trong transaction làm trạng thái trước có khu vực vượt bbox — không dựa vào việc DB thật còn hỏng. DB không có dữ liệu Hà Nội (CI dựng từ migration) → bỏ qua có lý do.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import pg from "pg"

import { runReassign } from "../../pipeline/reassign-areas.mjs"
import { getFinderAreas } from "../src/lib/queries"

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const ROOT = join(import.meta.dirname, "../..")
const DUNG_SAI = 0.01

type Box = { x0: number; y0: number; x1: number; y1: number }

/** Mọi đỉnh của hình GeoJSON (Polygon/MultiPolygon). */
function dinh(g: unknown): [number, number][] {
  const out: [number, number][] = []
  const walk = (v: unknown) => {
    if (Array.isArray(v) && typeof v[0] === "number") out.push([v[0] as number, v[1] as number])
    else if (Array.isArray(v)) v.forEach(walk)
  }
  walk((g as { coordinates?: unknown } | null)?.coordinates)
  return out
}

const vuot = (box: Box, rows: { id: string; geometry: unknown }[]) =>
  rows
    .filter((r) =>
      dinh(r.geometry).some(
        ([x, y]) => x < box.x0 - DUNG_SAI || x > box.x1 + DUNG_SAI || y < box.y0 - DUNG_SAI || y > box.y1 + DUNG_SAI,
      ),
    )
    .map((r) => r.id)

test("AU9-AC-8 Finder Hà Nội: trước khi áp có khu vực vượt bbox, sau khi áp mọi khu vực trong bbox vn-hanoi", async (t) => {
  const c = new pg.Client({ connectionString: DB_URL })
  await c.connect()
  try {
    await c.query("BEGIN")
    const { rows } = await c.query(
      `SELECT ST_XMin(geom) x0, ST_YMin(geom) y0, ST_XMax(geom) x1, ST_YMax(geom) y1 FROM areas WHERE id = 'vn-hanoi' AND geom IS NOT NULL`,
    )
    if (rows.length === 0) {
      if (process.env.CI) return t.skip("cần polygon vn-hanoi + dữ liệu Hà Nội thật (DB local)")
      throw new Error("DB local không có polygon vn-hanoi")
    }
    const box: Box = { x0: Number(rows[0].x0), y0: Number(rows[0].y0), x1: Number(rows[0].x1), y1: Number(rows[0].y1) }

    // Đối chứng dương không dựa vào việc DB thật còn hỏng: khu vực lạc mồi ngoài Hà Nội, có metrics nên Finder trả nó
    await c.query(
      `INSERT INTO areas (id, parent_id, region_type, name, country_code, geom, meta)
       VALUES ('vn-hanoi-tinh-moi-au9', 'vn-hanoi', 'submarket', 'Tỉnh Mồi AU9', 'vn',
               ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint(106.05, 20.65), 4326), 0.05)),
               '{"source":"osm-phuong","osm_id":"au9-moi-lac"}'::jsonb)`,
    )
    await c.query(`INSERT INTO market_metrics (area_id, month, revenue) VALUES ('vn-hanoi-tinh-moi-au9', '2026-01-01', 0)`)
    const truoc = await getFinderAreas({ marketId: "vn-hanoi" }, { db: c })
    await t.test("AU9-AC-8 Finder Hà Nội trước khi áp có khu vực vượt bbox", () => {
      assert.ok(vuot(box, truoc).length > 0, "đối chứng: khu vực lạc mồi phải làm Finder vượt bbox Hà Nội")
    })

    await runReassign(c, ["hanoi", "hcmc"], { log: { log() {}, warn() {} }, xoaKhuVucLac: true })
    await c.query(readFileSync(join(ROOT, "pipeline/sql/300_metrics.sql"), "utf8"))
    const sau = await getFinderAreas({ marketId: "vn-hanoi" }, { db: c })
    await t.test("AU9-AC-8 Finder Hà Nội sau khi áp: mọi khu vực trong bbox vn-hanoi", () => {
      assert.ok(sau.length > 0, "phải còn ít nhất một khu vực")
      assert.deepEqual(vuot(box, sau), [], "khu vực vượt bbox Hà Nội")
    })
  } finally {
    await c.query("ROLLBACK").catch(() => {})
    await c.end()
  }
})
