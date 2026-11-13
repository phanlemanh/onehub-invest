// s08-du-an.itest.mjs — hồ sơ _acceptance/stg-du-an-s08 (DA30): migration 094, nạp mồi hai snapshot S08 bằng chính hàm dựng dòng
// và câu chèn của lời GIAO, cột sinh, payload lạ. Chỉ chạy trên DB của riêng lượt (db/db-thu.sh oneinvest_suite_s08da --chay).
// Snapshot đọc lúc chạy ở máy thu; không chép mã hay tên dự án S08 vào kho, không in payload (có tên nguồn thật — tầng A).
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import { test } from "node:test";

import pg from "pg";

import { CAU_CHEN_S08_PROJECT, bocDiem, dongDuAnS08 } from "../lib/s08-du-an.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("s08-du-an.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*, không chạy trên oneinvest");
}
const GOC = join(import.meta.dirname, "../..");
const MIG = readFileSync(join(GOC, "db/migrations/094_stg_s08_du_an.sql"), "utf8");
const chinh = () => {
  const r = spawnSync("git", ["-C", GOC, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" });
  return join(r.stdout.trim(), "..");
};
const THU_MUC_SNAP = process.env.S08_SNAPSHOT_GOC ?? join(chinh(), "collector/snapshots/vn");
const SNAP = ["vn__s08-danh-muc__2026-11-01T002648230", "vn__s08-danh-muc__2026-11-07T233004210"];
const SNAP_0711 = SNAP[1];

const COT_THO = ["snapshot_id", "project_id", "catalog_payload", "detail_payload", "fetched_at"];
const COT_SINH = ["project_code", "project_name", "project_address", "investor", "project_type", "ownership_type_raw",
  "total_area_raw", "progress_raw", "point_lng", "point_lat"];

function itemsCua(ten) {
  const dir = join(THU_MUC_SNAP, ten);
  assert.ok(existsSync(dir), `S08DA-AC-2: không thấy snapshot ${dir}`);
  return readdirSync(dir).filter((f) => /^items-\d+\.json\.gz$/.test(f)).sort()
    .flatMap((f) => { const d = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString("utf8")); return Array.isArray(d) ? d : d.items; });
}
const ketNoi = async () => { const c = new pg.Client({ connectionString: DB_URL }); await c.connect(); return c; };
const bamLuocDo = async (c, bang, schema = "public") => (await c.query(
  `SELECT md5(coalesce(string_agg(x, E'\\n' ORDER BY x), '')) h FROM (
     SELECT column_name || ':' || data_type || ':' || is_nullable || ':' || is_generated || ':' || coalesce(generation_expression, '') x
       FROM information_schema.columns WHERE table_schema = $2 AND table_name = $1
     UNION ALL SELECT conname || ':' || pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = to_regclass($2 || '.' || $1)) s`,
  [bang, schema])).rows[0].h;
const chen = (c, d, cau = CAU_CHEN_S08_PROJECT) =>
  c.query(cau, [d.snapshot_id, d.project_id, d.catalog_payload, d.detail_payload, d.fetched_at]);
const ganSnap = (c, id) => c.query(
  `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 's08-danh-muc', '{}'::jsonb)
   ON CONFLICT (snapshot_id) DO NOTHING`, [id]);

test("S08DA-AC-1 094 đúng khuôn, áp lại không đổi lược đồ, không chạm stg_s08_inventory", async () => {
  const c = await ketNoi();
  try {
    const hInv = await bamLuocDo(c, "stg_s08_inventory");
    await c.query(MIG);
    const h1 = await bamLuocDo(c, "stg_s08_project");
    await c.query(MIG);
    assert.equal(await bamLuocDo(c, "stg_s08_project"), h1, "S08DA-AC-1: áp 094 lần hai đổi lược đồ");
    assert.equal(await bamLuocDo(c, "stg_s08_inventory"), hInv, "S08DA-AC-1: 094 đổi lược đồ stg_s08_inventory");
    const cot = (await c.query(
      "SELECT column_name, is_generated FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stg_s08_project'")).rows;
    assert.deepEqual(cot.filter((r) => r.is_generated !== "ALWAYS").map((r) => r.column_name).sort(), [...COT_THO].sort(),
      "S08DA-AC-1: tập cột thô sai");
    assert.deepEqual(cot.filter((r) => r.is_generated === "ALWAYS").map((r) => r.column_name).sort(), [...COT_SINH].sort(),
      "S08DA-AC-1: tập cột sinh sai");
    const rb = (await c.query(
      "SELECT contype, pg_get_constraintdef(oid) d FROM pg_constraint WHERE conrelid = 'stg_s08_project'::regclass")).rows;
    assert.ok(rb.some((r) => r.contype === "p" && /PRIMARY KEY \(snapshot_id, project_id\)/.test(r.d)), "S08DA-AC-1: thiếu khoá chính");
    assert.ok(rb.some((r) => r.contype === "f" && /REFERENCES airbnb_snapshots\(snapshot_id\)/.test(r.d)), "S08DA-AC-1: thiếu FK");
    // Chiều đỏ: bản sao 094 bỏ cột sinh point_lat áp vào schema tạm → phép so tập gọi tên point_lat.
    await c.query("BEGIN");
    await c.query("CREATE SCHEMA s08da_do; SET LOCAL search_path = s08da_do, public");
    const boLat = MIG.replace(/,\s*point_lat\s+numeric GENERATED[\s\S]*?STORED/, "").replace(/stg_s08_project_pid_idx/, "s08da_do_pid_idx");
    assert.notEqual(boLat, MIG, "S08DA-AC-1: không dựng được bản sao bỏ point_lat");
    await c.query(boLat);
    const sinhDo = (await c.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 's08da_do' AND table_name = 'stg_s08_project' AND is_generated = 'ALWAYS'"))
      .rows.map((r) => r.column_name);
    assert.deepEqual(COT_SINH.filter((x) => !sinhDo.includes(x)), ["point_lat"], "S08DA-AC-1: phép so không gọi tên point_lat");
    await c.query("ROLLBACK");
  } finally { await c.end(); }
});

const ca = { kyVong: new Map() }; // snapshot → { nCat, nDet }

test("S08DA-AC-2 nạp hai snapshot bằng hàm dựng dòng + câu chèn của lời GIAO, nạp lại 0 dòng", async () => {
  const c = await ketNoi();
  try {
    for (const s of SNAP) {
      const items = itemsCua(s);
      // Đếm độc lập từ tệp: project_id khác nhau của item project_catalog; dự án có item detail.
      const idCat = new Set(items.filter((i) => i.kind === "project_catalog").map((i) => String(i.meta?.projectId)));
      const idDet = new Set(items.filter((i) => i.kind === "inventory_unit" && i.meta?.state === "detail").map((i) => String(i.meta?.projectId)));
      const nDet = [...idCat].filter((x) => idDet.has(x)).length;
      ca.kyVong.set(s, { nCat: idCat.size, nDet });
      await ganSnap(c, s);
      const dong = dongDuAnS08(items, s);
      let ghi1 = 0;
      for (const d of dong) ghi1 += (await chen(c, d)).rowCount;
      const r = (await c.query(
        "SELECT count(*)::int n, count(detail_payload)::int nd FROM stg_s08_project WHERE snapshot_id = $1", [s])).rows[0];
      assert.equal(r.n, idCat.size, `S08DA-AC-2: ${s} có ${r.n} dòng, nguồn có ${idCat.size} dự án`);
      assert.equal(ghi1, idCat.size, "S08DA-AC-2: rowCount lần một khác số dự án");
      assert.equal(r.nd, nDet, `S08DA-AC-2: ${s} có ${r.nd} dòng detail, nguồn có ${nDet}`);
      let ghi2 = 0;
      for (const d of dong) ghi2 += (await chen(c, d)).rowCount;
      assert.equal(ghi2, 0, "S08DA-AC-2: nạp lại cùng snapshot ghi thêm dòng");
      assert.equal((await c.query("SELECT count(*)::int n FROM stg_s08_project WHERE snapshot_id = $1", [s])).rows[0].n, idCat.size,
        "S08DA-AC-2: nạp lại đổi tổng số dòng");
      // Chiều đỏ: câu chèn bỏ ON CONFLICT → lần hai ném 23505.
      await c.query("BEGIN");
      await assert.rejects(chen(c, dong[0], CAU_CHEN_S08_PROJECT.replace(/\s*ON CONFLICT[\s\S]*$/, "")), (e) => e.code === "23505",
        "S08DA-AC-2: câu chèn không ON CONFLICT mà nạp lại không ném 23505");
      await c.query("ROLLBACK");
    }
    assert.equal(ca.kyVong.get(SNAP_0711).nCat, 177, "S08DA-AC-2: snapshot 07/11 không có 177 dự án");
  } finally { await c.end(); }
});

test("S08DA-AC-3 cột sinh bằng payload, điểm bằng bocDiem; số 07/11 đúng đo raw", async () => {
  const c = await ketNoi();
  try {
    const CAT = ["project_code", "project_name", "project_address", "investor", "project_type"];
    const DET = { ownership_type_raw: "ownership_type", total_area_raw: "total_area", progress_raw: "progress" };
    const soSanh = (rows) => {
      const sai = [];
      for (const r of rows) {
        for (const k of CAT) {
          const v = r.catalog_payload?.[k];
          const kv = v === undefined || v === null ? null : String(v);
          if (r[k] === null && kv === null) sai.push(`${r.project_id}:${k} rỗng hai vế`);
          else if (r[k] !== kv) sai.push(`${r.project_id}:${k}`);
        }
        for (const [cot, k] of Object.entries(DET)) {
          const v = r.detail_payload?.project_info?.[k];
          if (r[cot] !== (v === undefined || v === null ? null : String(v))) sai.push(`${r.project_id}:${cot}`);
        }
        const p = bocDiem(r.detail_payload?.project_info?.iframe_location);
        const lng = r.point_lng === null ? null : Number(r.point_lng), lat = r.point_lat === null ? null : Number(r.point_lat);
        if (p === null ? (lng !== null || lat !== null) : (lng === null || Math.abs(lng - p.lng) > 1e-9 || Math.abs(lat - p.lat) > 1e-9)) {
          sai.push(`${r.project_id}:diem`);
        }
      }
      return sai;
    };
    const doc = async () => (await c.query(
      `SELECT project_id, catalog_payload, detail_payload, ${COT_SINH.join(", ")} FROM stg_s08_project WHERE snapshot_id = ANY($1)`, [SNAP])).rows;
    const rows = await doc();
    assert.ok(rows.length > 0, "S08DA-AC-3: chưa có dòng (AC-2 chưa chạy)");
    assert.deepEqual(soSanh(rows), [], "S08DA-AC-3: cột sinh lệch payload");
    const t = (await c.query(
      `SELECT count(project_address)::int dc, count(investor)::int cdt,
              count(*) FILTER (WHERE project_type = 'low_rise')::int thap, count(*) FILTER (WHERE project_type = 'high_rise')::int cao,
              count(ownership_type_raw)::int so_huu, count(point_lat)::int diem,
              count(*) FILTER (WHERE point_lat BETWEEN 8 AND 24 AND point_lng BETWEEN 102 AND 110)::int trong_vn,
              count(*) FILTER (WHERE point_lat IS NULL)::int rong
         FROM stg_s08_project WHERE snapshot_id = $1`, [SNAP_0711])).rows[0];
    assert.deepEqual(t, { dc: 177, cdt: 177, thap: 76, cao: 101, so_huu: 149, diem: 174, trong_vn: 174, rong: 3 },
      "S08DA-AC-3: số 07/11 lệch đo raw");
    // Chiều đỏ: sửa iframe của một dòng sau khi đã đọc kỳ vọng → so lệch gọi tên project_id.
    await c.query("BEGIN");
    const mot = rows.find((r) => r.point_lat !== null);
    await c.query(
      `UPDATE stg_s08_project SET detail_payload = jsonb_set(detail_payload, '{project_info,iframe_location}', to_jsonb('!2d105.5!3d20.5'::text))
        WHERE snapshot_id = ANY($1) AND project_id = $2`, [SNAP, mot.project_id]);
    const moi = (await c.query(
      `SELECT project_id, point_lng, point_lat FROM stg_s08_project WHERE snapshot_id = ANY($1) AND project_id = $2`, [SNAP, mot.project_id])).rows;
    const lech = soSanh(moi.map((m) => ({ ...rows.find((r) => r.project_id === m.project_id), point_lng: m.point_lng, point_lat: m.point_lat })));
    assert.ok(lech.includes(`${mot.project_id}:diem`), "S08DA-AC-3: phép so không bắt dòng sửa iframe");
    await c.query("ROLLBACK");
  } finally { await c.end(); }
});

test("S08DA-AC-4 payload lạ chèn được, cột sinh liên quan NULL", async () => {
  const c = await ketNoi();
  try {
    const SID = "vn__s08-mau-thu__2000-01-01T000000000";
    await ganSnap(c, SID);
    const cat = (id, them = {}) => ({ project_id: Number(id), project_code: `MA-${id}`, project_name: `Ten ${id}`,
      project_address: `Dia chi ${id}`, investor: `CDT ${id}`, project_type: "high_rise", ...them });
    const det = (iframe) => ({ project_info: { ownership_type: "x", total_area: "1 ha", progress: "y", iframe_location: iframe } });
    const mau = [
      { id: "m1", catalog: cat(901), detail: null, ky: { point_lat: null, ownership_type_raw: null, investor: "CDT 901" } },
      { id: "m2", catalog: cat(902), detail: det(""), ky: { point_lat: null, ownership_type_raw: "x" } },
      { id: "m3", catalog: cat(903), detail: det("<iframe src=\"https://x/maps/d/embed?mid=abc\"></iframe>"), ky: { point_lat: null } },
      { id: "m4", catalog: cat(904), detail: det("!2d1.2.3!3d21.0"), ky: { point_lat: null, point_lng: null } },
      { id: "m5", catalog: cat(905), detail: det("!2dabc!3d21.0"), ky: { point_lat: null, point_lng: null } },
      { id: "m6", catalog: (({ investor, ...r }) => r)(cat(906)), detail: det("!2d105.8!3d21.0"), ky: { investor: null, point_lat: "21.0", point_lng: "105.8" } },
    ];
    for (const m of mau) {
      await chen(c, { snapshot_id: SID, project_id: m.id, catalog_payload: m.catalog, detail_payload: m.detail, fetched_at: null });
    }
    const rows = (await c.query(`SELECT project_id, ${COT_SINH.join(", ")} FROM stg_s08_project WHERE snapshot_id = $1`, [SID])).rows;
    assert.equal(rows.length, 6, "S08DA-AC-4: không chèn đủ sáu dòng mồi");
    for (const m of mau) {
      const r = rows.find((x) => x.project_id === m.id);
      for (const [k, v] of Object.entries(m.ky)) assert.equal(r[k], v, `S08DA-AC-4: ${m.id}.${k}`);
      assert.equal(r.project_code, m.catalog.project_code, `S08DA-AC-4: ${m.id}.project_code`);
    }
    // Chiều đỏ: mẫu số lỏng [-0-9.]+ → chèn !2d1.2.3 ném lỗi ép kiểu.
    await c.query("BEGIN");
    await c.query("CREATE SCHEMA s08da_long; SET LOCAL search_path = s08da_long, public");
    const long = MIG.replaceAll("(-?[0-9]{1,3}\\.[0-9]+)", "([-0-9.]+)").replaceAll("(-?[0-9]{1,2}\\.[0-9]+)", "([-0-9.]+)")
      .replace(/stg_s08_project_pid_idx/, "s08da_long_pid_idx");
    assert.notEqual(long, MIG, "S08DA-AC-4: không dựng được bản sao mẫu lỏng");
    await c.query(long);
    await c.query("SAVEPOINT a");
    await assert.rejects(chen(c, { snapshot_id: SID, project_id: "m4", catalog_payload: mau[3].catalog, detail_payload: mau[3].detail, fetched_at: null }),
      (e) => e.code === "22P02", "S08DA-AC-4: mẫu lỏng không ném lỗi ép kiểu");
    await c.query("ROLLBACK");
  } finally { await c.end(); }
});
