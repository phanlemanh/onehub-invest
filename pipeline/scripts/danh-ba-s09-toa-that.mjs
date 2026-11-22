#!/usr/bin/env node
// danh-ba-s09-toa-that.mjs — DA42 nap-s09-toa-tang-vao-danh-ba E2, E10, E12 (T5): trên bản chép DB máy thu áp 115 + 125, nạp ba bản
// thu gói 1 hợp lệ bằng bộ nạp, đếm độc lập, dựng danh bạ (dung()), so phép cộng từng phần và bốn ngưỡng của AC-10, đo khớp trọn
// (AC-11). DB máy thu chỉ bị đọc. Chỉ in số — không tên nguồn, không tên dự án. Lệch một ô → thoát 1 nêu ô.
//   node pipeline/scripts/danh-ba-s09-toa-that.mjs --tran-phut 40
//   Chiều đỏ (mỗi cờ phải làm lượt thoát 1 nêu đúng tên):
//     --bot-tang      bớt một tầng của một toà trong stg bản chép → E2 nêu toà đó
//     --bo-phan <p>   bỏ một phần khỏi phép cộng toà (bi_danh|tao_moi|cho_the|chua_noi|khong_iso) → E10 nêu phần thiếu
//     --noi-sai-toa   trỏ mã mới của hai toà mã cũ sang toà khác → E10 nêu «nối mã cũ»
// Bản chép: script tự chạy lại mình qua `db/db-thu.sh oneinvest_suite_s09that --chay` — DB của lượt sinh bằng `createdb -T` từ bản
// mẫu oneinvest_suite_mau (cùng khuôn danh-ba-s16-cau-truc-that.mjs của DA37), xoá khi lệnh dừng.
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import pg from "pg";
import { GOC, MAY_CHU, apTep } from "./db-thu-dbv.mjs";
import { napDanhBaThuMuc } from "../import-s09-danh-ba.mjs";
import { dung, KHU_MAC_DINH } from "../danh-ba-vat-the.mjs";
import { timNutTrungNoi } from "../lib/khop-tron.mjs";
import { SQL_CHUONG_TEN_LECH } from "../lib/s09-dung.mjs";

const arg = (t, m = null) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : m; };
const co = (t) => process.argv.includes(t);
const TRAN_PHUT = Number(arg("--tran-phut", "40"));
const TRONG = process.env.S09_THAT_TRONG === "1";
const SNAP = process.env.S09_SNAP ?? "/Users/manhphan/dev/onehub-invest/collector/snapshots/vn";
// Ba bản thu hợp lệ (bản 2026-11-19T211829028 là lượt hỏng ZCode khai «không nạp» — kế hoạch T8).
const BAN_THU = ["2026-11-19T004959637", "2026-11-20T015947402", "2026-11-20T052953464"].map((s) => `vn__s09-danh-ba__${s}`);
const BAN_HONG = "vn__s09-danh-ba__2026-11-19T211829028";
// Đích viết trước (AC-10, đo 21/11 trên bản thu 19/11) và ngưỡng khai trước khi thấy số.
const DICH = { du_an_co_toa: 198, toa: 928, tang: 23708, ma_cu_mau_so: 110, ma_cu_gom: 65 };
const NGUONG = { ti_le_vao: 0.95, cho_the_toi_da: 0.10, ma_hong_toi_da: 0.01, ma_cu_dung: 0.99 };

const loi = [];
const o = (ten, thuc, ok, ghi = "") => { console.log(`${ok ? "  " : "✗ "}${ten}: ${thuc}${ghi ? ` (${ghi})` : ""}`); if (!ok) loi.push(ten); };

if (!TRONG) {
  const r = spawnSync("bash", [join(GOC, "db/db-thu.sh"), "oneinvest_suite_s09that", "--chay", process.execPath, ...process.argv.slice(1)],
    { cwd: GOC, stdio: "inherit", env: { ...process.env, S09_THAT_TRONG: "1" }, timeout: TRAN_PHUT * 60_000, killSignal: "SIGTERM" });
  if (r.error?.code === "ETIMEDOUT" || r.signal === "SIGTERM") { console.error(`danh-ba-s09-toa-that: vượt trần ${TRAN_PHUT} phút`); process.exit(4); }
  process.exit(r.status ?? 1);
}

const TEN = new URL(process.env.DATABASE_URL ?? "postgres://x/").pathname.slice(1);
if (!/^oneinvest_suite_s09that_[0-9]+$/.test(TEN)) { console.error(`từ chối: DB «${TEN}» không phải DB của lượt db-thu --chay`); process.exit(2); }
const URL_THU = `${MAY_CHU}/${TEN}`;
const c = new pg.Client({ connectionString: URL_THU });
await c.connect();
const q = async (sql, a = []) => (await c.query(sql, a)).rows;
const mot = async (sql, a = []) => Object.values((await q(sql, a))[0] ?? {})[0];

try {
  // ---- 1. Áp 115 + 125 (hai lần), nạp ba bản thu ----
  for (const f of ["115_stg_s09_danh_ba.sql", "125_v_s09_db_du_an_ma_tinh.sql"]) {
    apTep(TEN, join(GOC, "db/migrations", f)); apTep(TEN, join(GOC, "db/migrations", f));
  }
  for (const b of BAN_THU) await napDanhBaThuMuc(join(SNAP, b), URL_THU);
  o("dong_ban_hong", await mot("SELECT count(*)::int FROM stg_s09_danh_ba WHERE snapshot_id = $1", [BAN_HONG]), true);
  if (co("--bot-tang")) {
    await c.query(`UPDATE stg_s09_danh_ba SET payload = jsonb_set(payload, '{data}', (payload -> 'data') - (jsonb_array_length(payload -> 'data') - 1))
                    WHERE (snapshot_id, dong) = (SELECT snapshot_id, dong FROM stg_s09_danh_ba WHERE kind = 'tang' AND jsonb_array_length(payload -> 'data') > 1
                                                  ORDER BY snapshot_id, dong LIMIT 1)`);
  }

  // ---- 2. E2: bộ đếm độc lập (không import pipeline/lib/s09*), ba cột: stg đếm thẳng · đọc thẳng bản thu · số nguồn khai trong meta ----
  const docBan = (b) => readdirSync(join(SNAP, b)).filter((f) => /^items-\d+\.json\.gz$/.test(f)).sort()
    .flatMap((f) => { const d = JSON.parse(gunzipSync(readFileSync(join(SNAP, b, f))).toString("utf8")); return Array.isArray(d) ? d : d.items; });
  const dem = { du_an: new Set(), toa: new Map(), tang: new Map() }; // toa: du_an → Set(toa) · tang: toa → Set(tầng)
  const khai = { du_an: null, toa: new Map(), tang: new Map() };
  for (const b of BAN_THU) {
    for (const it of docBan(b)) {
      if (!it || typeof it !== "object" || String(it.payload?.code) !== "200" || !Array.isArray(it.payload?.data)) continue;
      const ids = it.payload.data.map((x) => x?.id).filter(Boolean);
      if (it.kind === "danh-muc" && it.sourceId === "danh-muc") { ids.forEach((x) => dem.du_an.add(x)); khai.du_an = Number(it.meta?.soDuAn ?? NaN); }
      if (it.kind === "toa") { dem.toa.set(it.sourceId, new Set(ids)); khai.toa.set(it.sourceId, Number(it.meta?.soToa ?? NaN)); }
      if (it.kind === "tang") { dem.tang.set(it.sourceId, new Set(ids)); khai.tang.set(it.sourceId, Number(it.meta?.soTang ?? NaN)); }
    }
  }
  const stgTang = new Map((await q(`SELECT DISTINCT ON (source_id) source_id, jsonb_array_length(payload -> 'data')::int AS n FROM stg_s09_danh_ba
                                     WHERE kind = 'tang' AND payload ->> 'code' = '200' ORDER BY source_id, fetched_at DESC, snapshot_id DESC, dong DESC`))
    .map((r) => [r.source_id, r.n]));
  const stgToa = new Map((await q(`SELECT DISTINCT ON (source_id) source_id, jsonb_array_length(payload -> 'data')::int AS n FROM stg_s09_danh_ba
                                    WHERE kind = 'toa' AND payload ->> 'code' = '200' ORDER BY source_id, fetched_at DESC, snapshot_id DESC, dong DESC`))
    .map((r) => [r.source_id, r.n]));
  const stgDuAn = await mot(`SELECT jsonb_array_length(payload -> 'data')::int FROM stg_s09_danh_ba WHERE kind = 'danh-muc' AND source_id = 'danh-muc'
                              ORDER BY fetched_at DESC, snapshot_id DESC LIMIT 1`);
  console.log("E2 · bảng ba cột (stg · đọc thẳng · nguồn khai):");
  o("E2 dự án", `${stgDuAn} · ${dem.du_an.size} · ${khai.du_an}`, stgDuAn === dem.du_an.size && dem.du_an.size === khai.du_an);
  const tongToa = [...dem.toa.values()].reduce((a, s) => a + s.size, 0);
  const tongTang = [...dem.tang.values()].reduce((a, s) => a + s.size, 0);
  o("E2 toà", `${[...stgToa.values()].reduce((a, n) => a + n, 0)} · ${tongToa} · ${[...khai.toa.values()].reduce((a, n) => a + n, 0)}`, true);
  o("E2 tầng", `${[...stgTang.values()].reduce((a, n) => a + n, 0)} · ${tongTang} · ${[...khai.tang.values()].reduce((a, n) => a + n, 0)}`, true);
  let lechO = 0;
  for (const [toa, s] of dem.tang) {
    const k = khai.tang.get(toa);
    if (stgTang.get(toa) !== s.size || (Number.isFinite(k) && k !== s.size)) { if (lechO++ < 5) o(`E2 tầng toà ${toa.slice(0, 8)}`, `${stgTang.get(toa)} · ${s.size} · ${k}`, false); }
  }
  for (const [duAn, s] of dem.toa) {
    const k = khai.toa.get(duAn);
    if (stgToa.get(duAn) !== s.size || (Number.isFinite(k) && k !== s.size)) { if (lechO++ < 10) o(`E2 toà dự án ${duAn.slice(0, 8)}`, `${stgToa.get(duAn)} · ${s.size} · ${k}`, false); }
  }
  o("E2 ô lệch", lechO, lechO === 0);

  // ---- 3. Dựng danh bạ (hai lần: lần hai phải ra cùng số) ----
  const BEFORE = new Set((await q("SELECT building_key FROM buildings")).map((r) => r.building_key));
  const toaTheoNutTruoc = new Map((await q(`
    WITH RECURSIVE g AS (SELECT b.building_key, n.id AS cur, n.node_type, n.parent_id FROM buildings b JOIN asset_nodes n ON n.id = b.region_node_id
                         UNION ALL SELECT g.building_key, n.id, n.node_type, n.parent_id FROM g JOIN asset_nodes n ON n.id = g.parent_id WHERE g.node_type <> 'project')
    SELECT cur AS nut, count(*)::int AS n FROM g WHERE node_type = 'project' GROUP BY 1`)).map((r) => [r.nut, r.n]));
  const kq1 = await dung(c, { khuSlugs: [...KHU_MAC_DINH], log: () => {} });

  async function doPhan() {
    const p = {};
    const DM = `(SELECT du_an_id, ma_tinh FROM v_s09_db_du_an)`;
    const LINK = `(SELECT source_project_id AS du_an_id, status, can_cu, ly_do FROM project_links WHERE source = 'S09')`;
    p.du_an_tong = await mot(`SELECT count(*)::int FROM ${DM} d`);
    for (const [k, w] of [["noi_tay", "l.status = 'noi' AND l.can_cu = 'noi-tay'"], ["the_luat_noi", "l.status = 'noi' AND l.can_cu = 'the-luat'"],
      ["the_cap_noi", "l.status = 'noi' AND l.can_cu = 'the-cap'"], ["ung_vien", "l.status = 'noi' AND l.can_cu = 'ung-vien'"],
      ["cho_the_luat", "l.status = 'chua_noi' AND l.ly_do = 'cho-the-luat'"], ["cho_the_cap", "l.status = 'chua_noi' AND l.ly_do IN ('cho-the-cap', 'the-tu-choi')"]]) {
      p[`du_an_${k}`] = await mot(`SELECT count(*)::int FROM ${DM} d JOIN ${LINK} l USING (du_an_id) WHERE ${w}`);
    }
    p.du_an_13_11_khong_co = await mot(`SELECT count(DISTINCT project_id)::int FROM v_s09_du_an_moi WHERE project_id NOT IN (SELECT du_an_id FROM v_s09_db_du_an)`)
      .catch(() => null);
    const TOA = `(SELECT t.toa_id, t.du_an_id, d.ma_tinh FROM v_s09_db_toa t JOIN ${DM} d USING (du_an_id))`;
    const BD = `(SELECT substring(value FROM 13) AS toa_id, object_key FROM registry_aliases WHERE source = 'S09' AND kind = 'ma_nguon'
                  AND retired_at IS NULL AND value LIKE 'danh-ba-toa/%')`;
    p.toa_tong = await mot(`SELECT count(*)::int FROM ${TOA} t`);
    const truoc = [...BEFORE];
    p.toa_bi_danh = await mot(`SELECT count(*)::int FROM ${TOA} t JOIN ${BD} a USING (toa_id) WHERE a.object_key = ANY($1)`, [truoc]);
    p.toa_tao_moi = await mot(`SELECT count(*)::int FROM ${TOA} t JOIN ${BD} a USING (toa_id) WHERE NOT (a.object_key = ANY($1))`, [truoc]);
    p.toa_cho_the = await mot(`SELECT count(DISTINCT x)::int FROM review_queue q, jsonb_array_elements_text(COALESCE(q.evidence -> 'toa_ids', '[]')) x
                                WHERE q.item_type = 'entity_match' AND q.item_id LIKE 's09-toa-db:%' AND x IN (SELECT toa_id FROM ${TOA} t)
                                  AND x NOT IN (SELECT toa_id FROM ${BD} b)`);
    p.toa_chua_noi = await mot(`SELECT count(*)::int FROM ${TOA} t JOIN ${LINK} l USING (du_an_id) WHERE l.status = 'chua_noi'`);
    p.toa_khong_iso = await mot(`SELECT count(*)::int FROM ${TOA} t JOIN ${LINK} l USING (du_an_id)
                                  WHERE l.status = 'noi' AND NOT EXISTS (SELECT 1 FROM iso_regions i WHERE i.admin_code = t.ma_tinh)`);
    p.toa_cua_du_an_noi = await mot(`SELECT count(*)::int FROM ${TOA} t JOIN ${LINK} l USING (du_an_id) WHERE l.status = 'noi'`);
    p.du_an_co_toa = await mot(`SELECT count(DISTINCT du_an_id)::int FROM ${TOA} t`);
    p.tang = await mot(`SELECT count(*)::int FROM v_s09_db_tang f WHERE f.toa_id IN (SELECT toa_id FROM ${TOA} t)`);
    const tongItem = await mot(`SELECT count(*)::int FROM (SELECT DISTINCT ON (kind, source_id) payload FROM stg_s09_danh_ba WHERE kind IN ('toa', 'tang')
                                  ORDER BY kind, source_id, fetched_at DESC, snapshot_id DESC, dong DESC) x`);
    const hong = await mot(`SELECT count(*)::int FROM (SELECT DISTINCT ON (kind, source_id) payload FROM stg_s09_danh_ba WHERE kind IN ('toa', 'tang')
                              ORDER BY kind, source_id, fetched_at DESC, snapshot_id DESC, dong DESC) x
                             WHERE COALESCE(payload ->> 'code', '') <> '200' OR jsonb_typeof(payload -> 'data') <> 'array'`);
    p.ma_hong_ti_le = tongItem ? hong / tongItem : 0;
    // Mã cũ DA31: toà có sẵn mang bí danh S09 `<pid>/<block_id>` và có căn hoặc có S16 — mẫu số 110; không căn, không S16 — 65 toà gom.
    const MA_CU = `(SELECT DISTINCT object_key FROM registry_aliases WHERE source = 'S09' AND kind = 'ma_nguon' AND retired_at IS NULL
                     AND value NOT LIKE 'danh-ba-toa/%' AND object_key = ANY($1))`;
    const coCan = `(EXISTS (SELECT 1 FROM units u WHERE u.building_key = m.object_key) OR EXISTS (SELECT 1 FROM registry_aliases s
                     WHERE s.object_key = m.object_key AND s.source = 'S16' AND s.kind = 'ma_nguon' AND s.retired_at IS NULL))`;
    p.ma_cu_mau_so = await mot(`SELECT count(*)::int FROM ${MA_CU} m WHERE ${coCan}`, [truoc]);
    p.ma_cu_dung = await mot(`SELECT count(*)::int FROM ${MA_CU} m WHERE ${coCan} AND EXISTS (SELECT 1 FROM ${BD} b WHERE b.object_key = m.object_key)`, [truoc]);
    p.ma_cu_gom = await mot(`SELECT count(*)::int FROM ${MA_CU} m WHERE NOT ${coCan}`, [truoc]);
    p.hai_upi = await mot("SELECT count(*)::int FROM (SELECT upi FROM buildings GROUP BY upi HAVING count(*) > 1) x");
    p.can_s09 = await mot("SELECT count(*)::int FROM units u JOIN registry_aliases a ON a.object_key = u.unit_key WHERE a.source = 'S09'");
    // 0 cặp bí danh lệch tầng theo luật AC-5, tính lại độc lập (không dùng lechTangS16): S16 nhiều hơn S09 quá 2 tầng có căn, hoặc S16
    // có căn ở tầng S09 không kê, sau chuẩn tên (bỏ khoảng trắng, viết hoa, bỏ số 0 đầu), không so tầng 1.
    const cap = await q(`SELECT b.object_key, b.toa_id,
                           (SELECT array_agg(f.tang_ten) FROM v_s09_db_tang f WHERE f.toa_id = b.toa_id) AS t09,
                           (SELECT array_agg(DISTINCT v.tang::text) FROM registry_aliases s JOIN v_s16_can v ON v.du_an = split_part(s.value, '/', 1)
                              AND v.toa_id = split_part(s.value, '/', 2) WHERE s.object_key = b.object_key AND s.source = 'S16' AND s.kind = 'ma_nguon'
                              AND s.retired_at IS NULL AND NOT COALESCE(v.mo_ho, false) AND v.tang IS NOT NULL) AS t16
                          FROM ${BD} b`);
    const chuan = (x) => { const s = String(x ?? "").replace(/\s+/g, "").toUpperCase(); return s === "" ? null : s.replace(/^0+(?=[0-9A-Z])/, ""); };
    p.bi_danh_lech_tang = cap.filter((r) => {
      if (!r.t09?.length || !r.t16?.length) return false;
      const a = new Set(r.t09.map(chuan).filter(Boolean)), b = new Set(r.t16.map(chuan).filter(Boolean));
      return b.size - a.size > 2 || [...b].some((f) => f !== "1" && !a.has(f));
    }).length;
    return p;
  }

  if (co("--noi-sai-toa")) {
    // Hai toà mã cũ (một toà chỉ hạ tỉ lệ xuống 109/110 = 99,09%, vẫn trên ngưỡng 99%): mã mới trỏ sang toà khác.
    await c.query(`UPDATE registry_aliases x SET object_key = (SELECT building_key FROM buildings WHERE building_key <> x.object_key ORDER BY building_key LIMIT 1)
                    WHERE x.ctid IN (SELECT y.ctid FROM registry_aliases y WHERE y.source = 'S09' AND y.kind = 'ma_nguon' AND y.value LIKE 'danh-ba-toa/%'
                                       AND EXISTS (SELECT 1 FROM registry_aliases m WHERE m.object_key = y.object_key AND m.source = 'S09'
                                                     AND m.kind = 'ma_nguon' AND m.value NOT LIKE 'danh-ba-toa/%')
                                     ORDER BY y.value LIMIT 2)`);
  }
  const p = await doPhan();
  console.log("E10 · dự án:");
  const tongDuAnPhan = p.du_an_noi_tay + p.du_an_the_luat_noi + p.du_an_the_cap_noi + p.du_an_ung_vien + p.du_an_cho_the_luat + p.du_an_cho_the_cap;
  for (const k of ["noi_tay", "the_luat_noi", "the_cap_noi", "ung_vien", "cho_the_luat", "cho_the_cap"]) o(`  dự án ${k}`, p[`du_an_${k}`], true);
  o("E10 tổng dự án = tổng các phần", `${p.du_an_tong} = ${tongDuAnPhan}`, p.du_an_tong === tongDuAnPhan);
  o("  dự án bản 13/11 không có trong gói 1 (đếm riêng)", p.du_an_13_11_khong_co, true);
  console.log("E10 · toà:");
  const phanToa = ["bi_danh", "tao_moi", "cho_the", "chua_noi", "khong_iso"].filter((k) => k !== arg("--bo-phan"));
  for (const k of ["bi_danh", "tao_moi", "cho_the", "chua_noi", "khong_iso"]) o(`  toà ${k}`, p[`toa_${k}`], true);
  const tongToaPhan = phanToa.reduce((a, k) => a + p[`toa_${k}`], 0);
  const thieu = ["bi_danh", "tao_moi", "cho_the", "chua_noi", "khong_iso"].filter((k) => !phanToa.includes(k));
  o("E10 tổng toà = tổng các phần", `${p.toa_tong} = ${tongToaPhan}`, p.toa_tong === tongToaPhan, thieu.length ? `phần thiếu: ${thieu.join(", ")}` : "");
  console.log("E10 · ngưỡng:");
  const vao = (p.toa_bi_danh + p.toa_tao_moi) / Math.max(1, p.toa_tong - p.toa_chua_noi - p.toa_cho_the);
  o("ti_le_vao_danh_ba", vao.toFixed(4), vao >= NGUONG.ti_le_vao, `ngưỡng ≥ ${NGUONG.ti_le_vao}`);
  const choThe = p.toa_cho_the / Math.max(1, p.toa_cua_du_an_noi);
  o("cho_the_tren_toa_du_an_noi", choThe.toFixed(4), choThe <= NGUONG.cho_the_toi_da, `ngưỡng ≤ ${NGUONG.cho_the_toi_da}`);
  o("ma_hong", p.ma_hong_ti_le.toFixed(4), p.ma_hong_ti_le <= NGUONG.ma_hong_toi_da, `ngưỡng ≤ ${NGUONG.ma_hong_toi_da}`);
  o("ma_cu_mau_so", p.ma_cu_mau_so, p.ma_cu_mau_so === DICH.ma_cu_mau_so, `viết trước ${DICH.ma_cu_mau_so}`);
  const dung99 = p.ma_cu_dung / Math.max(1, p.ma_cu_mau_so);
  o("nối mã cũ", `${p.ma_cu_dung}/${p.ma_cu_mau_so} = ${dung99.toFixed(4)}`, dung99 >= NGUONG.ma_cu_dung, `ngưỡng ≥ ${NGUONG.ma_cu_dung}`);
  o("ma_cu_gom (đếm riêng, chuyển DA50)", p.ma_cu_gom, p.ma_cu_gom === DICH.ma_cu_gom, `viết trước ${DICH.ma_cu_gom}`);
  o("bi_danh_lech_tang", p.bi_danh_lech_tang, p.bi_danh_lech_tang === 0, "phải 0");
  console.log("E10 · đích dữ liệu thật:");
  o("du_an_co_toa", p.du_an_co_toa, p.du_an_co_toa === DICH.du_an_co_toa, `đích ${DICH.du_an_co_toa}`);
  o("toa", p.toa_tong, p.toa_tong === DICH.toa, `đích ${DICH.toa}`);
  o("tang", p.tang, p.tang === DICH.tang, `đích ${DICH.tang}`);
  o("hai_upi", p.hai_upi, p.hai_upi === 0, "phải 0");
  o("can_s09_tao", p.can_s09, p.can_s09 === 0, "bước S09 tạo 0 căn");
  o("buoc_s09_bo_qua", kq1?.s09_goi1?.bo_qua ?? "không", !kq1?.s09_goi1?.bo_qua);

  // ---- 4. E12 (AC-11): khớp trọn, không nút trùng nơi; nút đã có không mất toà ----
  const banGhi = await q(`
    WITH RECURSIVE g AS (SELECT b.building_key, n.id AS cur, n.node_type, n.parent_id FROM buildings b JOIN asset_nodes n ON n.id = b.region_node_id
                         UNION ALL SELECT g.building_key, n.id, n.node_type, n.parent_id FROM g JOIN asset_nodes n ON n.id = g.parent_id WHERE g.node_type <> 'project'),
    goc AS (SELECT building_key, cur AS nut FROM g WHERE node_type = 'project'),
    toa AS (SELECT t.du_an_id, t.toa_id, a.object_key FROM v_s09_db_toa t
              LEFT JOIN registry_aliases a ON a.source = 'S09' AND a.kind = 'ma_nguon' AND a.retired_at IS NULL AND a.value = 'danh-ba-toa/' || t.toa_id)
    SELECT l.asset_node_id::int AS node_id, count(*)::int AS tong,
           count(*) FILTER (WHERE toa.object_key = ANY($1))::int AS co_bang_chung,
           array_remove(COALESCE(array_agg(goc.nut) FILTER (WHERE toa.object_key = ANY($1)), '{}'), NULL) AS nut
      FROM project_links l JOIN toa ON toa.du_an_id = l.source_project_id LEFT JOIN goc ON goc.building_key = toa.object_key
     WHERE l.source = 'S09' AND l.status = 'noi' AND l.source_project_id IN (SELECT du_an_id FROM v_s09_db_du_an)
     GROUP BY l.asset_node_id, l.source_project_id`, [[...BEFORE]]);
  const trung = timNutTrungNoi(banGhi.map((r) => ({ ...r, nut: r.nut.map(Number) })));
  o("E12 nút trùng nơi", trung.length, trung.length === 0);
  const toaTheoNutSau = new Map((await q(`
    WITH RECURSIVE g AS (SELECT b.building_key, n.id AS cur, n.node_type, n.parent_id FROM buildings b JOIN asset_nodes n ON n.id = b.region_node_id
                         UNION ALL SELECT g.building_key, n.id, n.node_type, n.parent_id FROM g JOIN asset_nodes n ON n.id = g.parent_id WHERE g.node_type <> 'project')
    SELECT cur AS nut, count(*)::int AS n FROM g WHERE node_type = 'project' GROUP BY 1`)).map((r) => [r.nut, r.n]));
  const giam = [...toaTheoNutTruoc].filter(([n, so]) => (toaTheoNutSau.get(n) ?? 0) < so).length;
  o("E12 nút đã có bị giảm toà", giam, giam === 0);
  // Đối chứng dương trên cùng bản chép: cấy một bản ghi nằm ở nút 0 mà ba toà trỏ về một nút có thật → đúng một dòng nêu nút 0.
  const nutThat = [...toaTheoNutTruoc.keys()][0];
  const cay = timNutTrungNoi([...banGhi.map((r) => ({ ...r, nut: r.nut.map(Number) })), { node_id: 0, tong: 3, co_bang_chung: 3, nut: [nutThat, nutThat, nutThat] }]);
  o("E12 đối chứng cấy bản ghi sai nút", cay.length, cay.length === 1 && cay[0].node_id === 0, "phải đúng 1 dòng nêu nút cấy");

  // ---- 5. Chuông DA57 (số chạy thử cho T8) và chạy lại cùng số ----
  o("chuong_ten_lech (T8, mong đợi 0)", await mot(SQL_CHUONG_TEN_LECH), true);
  await dung(c, { khuSlugs: [...KHU_MAC_DINH], log: () => {} });
  const p2 = await doPhan();
  const khac = Object.keys(p).filter((k) => JSON.stringify(p[k]) !== JSON.stringify(p2[k]));
  o("E10 chạy lại cùng số", khac.length ? `khác: ${khac.join(", ")}` : "giống", khac.length === 0);
} finally {
  await c.end();
}
console.log(loi.length ? `danh-ba-s09-toa-that: LỆCH ${loi.length} ô — ${loi.join(", ")}` : "danh-ba-s09-toa-that: ĐẠT");
process.exit(loi.length ? 1 : 0);
