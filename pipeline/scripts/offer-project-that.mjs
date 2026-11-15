// offer-project-that.mjs — hồ sơ du-an-cua-tin-len-dinh-vi (DV7) E6, E7, E9: đo migration 105 trên DB MÁY THU mà không ghi.
//   --doc        E6 · AC-6: giao dịch READ ONLY, câu đọc của view rút từ tệp 105 (không CREATE) so với phép đếm độc lập.
//   --hieu-nang  E7 · AC-7: một giao dịch lùi — nền (600 của main, data_level_units hiện tại) rồi áp 105 + đo lại.
//   --chay-thu   E9 · AC-9: một giao dịch lùi — số nền, áp 105, chạy 600 của nhánh, đọc ô Định vị; --ghi <tệp> ghi bảng số.
// Thân 600 chạy qua than600 (bỏ đúng một BEGIN;/COMMIT; của tệp, còn câu chốt thì dừng trước khi gửi câu nào) — không vậy
// thì COMMIT của 600 chốt luôn 105 lên DB máy thu. Sau mỗi giao dịch lùi kiểm DB không đổi. Tải 1 phút ≥ 14 → thoát 3.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { loadavg } from "node:os";
import { join } from "node:path";

import pg from "pg";

import { than600 } from "../lib/than-600.mjs";

const GOC = join(import.meta.dirname, "..", "..");
const URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const MIG = readFileSync(join(GOC, "db/migrations/105_offer_project.sql"), "utf8");
const SQL600 = readFileSync(join(GOC, "pipeline/sql/600_data_flow.sql"), "utf8");
const VIEW_SQL = MIG.match(/CREATE OR REPLACE VIEW offer_project AS\n([\s\S]*?);\n/)[1];
const che = process.argv.includes("--doc") ? "doc" : process.argv.includes("--hieu-nang") ? "hieu-nang"
  : process.argv.includes("--chay-thu") ? "chay-thu" : null;
const ghi = (() => { const i = process.argv.indexOf("--ghi"); return i > 0 ? process.argv[i + 1] : null; })();
if (!che) { console.error("dùng: offer-project-that.mjs --doc | --hieu-nang | --chay-thu [--ghi <tệp>]"); process.exit(2); }

// Phép đếm độc lập (không dùng câu của view): quy nút lên dự án gốc bằng mảng đường đi, đếm dự án gốc khác nhau mỗi tin S03.
const DEM_DOC_LAP = `
  WITH RECURSIVE len(node_id, cur, loai, cha, duong) AS (
    SELECT id, id, node_type, parent_id, ARRAY[id] FROM asset_nodes
    UNION ALL
    SELECT l.node_id, a.id, a.node_type, a.parent_id, l.duong || a.id
      FROM len l JOIN asset_nodes a ON a.id = l.cha
     WHERE l.loai <> 'project' AND NOT a.id = ANY (l.duong)
  ), goc AS (SELECT node_id, cur AS goc FROM len WHERE loai = 'project'),
  tin_goc AS (
    SELECT o.offer_id, o.first_seen, array_agg(DISTINCT g.goc) AS gocs
      FROM sale_offers o, unnest(o.post_ids) b(pid)
      JOIN field_assertions f ON f.subject_key = 'S03:' || b.pid AND f.field = 'project_node_id' AND f.retracted_at IS NULL
      JOIN goc g ON g.node_id::text = f.value
     WHERE o.source = 'S03'
     GROUP BY o.offer_id, o.first_seen)`;
const ngayVN = `(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`;

const c = new pg.Client({ connectionString: URL });
await c.connect();
const so = async (sql, p = []) => (await c.query(sql, p)).rows;
const tai = loadavg()[0];
console.log(`[dv7] chế độ ${che} · DB ${URL.replace(/:[^:@/]+@/, ":***@")} · tải 1 phút ${tai.toFixed(1)} · ${new Date().toISOString()}`);

async function trangThaiDB() {
  const [r] = await so(`SELECT to_regclass('offer_project') IS NOT NULL AS co_view,
    pg_get_functiondef('offer_located(text)'::regprocedure) AS f1, pg_get_functiondef('data_level_units()'::regprocedure) AS f2,
    (SELECT max(computed_at) FROM data_flow_snapshot)::text AS computed_at`);
  return r;
}
async function soOVi(snap) {
  const m = {};
  for (const r of await so(`SELECT time_window, s->>'source' src, (s->>'located')::int loc, (s->>'locatedPending')::int pend
    FROM data_flow_snapshot, jsonb_array_elements(facts->'sources') s`)) m[`${r.time_window}|${r.src}`] = { loc: r.loc, pend: r.pend };
  return snap ? m : m;
}
async function chay600(sql) {
  await c.query("CREATE TEMP TABLE IF NOT EXISTS flow_s03_branch (post_id text PRIMARY KEY, branch text NOT NULL)");
  const t0 = performance.now();
  await c.query(than600(sql).replace(/^CREATE TEMP TABLE IF NOT EXISTS flow_s03_branch.*$/m, ""));
  return performance.now() - t0;
}
const sql600Main = () => execFileSync("git", ["-C", GOC, "show", "origin/main:pipeline/sql/600_data_flow.sql"], { encoding: "utf8" });

let exit = 0;
try {
  if (che === "doc") {
    await c.query("BEGIN READ ONLY");
    try {
      const view = await so(`SELECT source, status, count(*)::int n, count(DISTINCT offer_id)::int nd FROM (${VIEW_SQL}) v GROUP BY 1, 2 ORDER BY 1, 2`);
      console.log("[dv7] view theo nguồn × trạng thái:", JSON.stringify(view));
      const mot = view.find((r) => r.source === "S03" && r.status === "mot_du_an")?.n ?? 0;
      const [dl] = await so(`${DEM_DOC_LAP} SELECT count(*) FILTER (WHERE cardinality(gocs) = 1)::int mot,
        count(*) FILTER (WHERE cardinality(gocs) > 1)::int xd FROM tin_goc`);
      console.log(`[dv7] S03 mot_du_an: view ${mot} · đếm độc lập ${dl.mot}; xung_dot đếm độc lập ${dl.xd}`);
      const xd = await so(`SELECT offer_id FROM (${VIEW_SQL}) v WHERE status = 'xung_dot' ORDER BY 1`);
      console.log(`[dv7] xung_dot (${xd.length}): ${xd.map((r) => r.offer_id).join(", ") || "—"}`);
      const [k] = await so(`SELECT count(*)::int n, count(DISTINCT offer_id)::int nd,
        count(*) FILTER (WHERE offer_id NOT IN (SELECT offer_id FROM sale_offers))::int ngoai FROM (${VIEW_SQL}) v`);
      if (mot !== dl.mot) { console.error("[dv7] LỆCH: view khác đếm độc lập"); exit = 1; }
      if (mot <= 4000) { console.error("[dv7] LỆCH: S03 mot_du_an ≤ 4000"); exit = 1; }
      if (k.n !== k.nd) { console.error("[dv7] LỆCH: có tin hai dòng"); exit = 1; }
      if (k.ngoai !== 0) { console.error("[dv7] LỆCH: offer_id ngoài sale_offers"); exit = 1; }
      if (view.some((r) => r.n !== r.nd)) exit = 1;
    } finally { await c.query("ROLLBACK"); }
  } else {
    if (tai >= 14) { console.error(`[dv7] tai-may: tải ${tai.toFixed(1)} ≥ 14 — không chạy`); process.exit(3); }
    than600(SQL600); than600(sql600Main()); // dừng trước khi gửi câu nào nếu thân còn câu chốt
    const truoc = await trangThaiDB();
    if (truoc.co_view) { console.error("[dv7] DB máy thu đã có offer_project — lượt này chỉ dành cho trước khi áp"); process.exit(2); }
    const kq = {};
    await c.query("BEGIN");
    try {
      if (che === "hieu-nang") {
        kq.nen600 = await chay600(sql600Main());
        let t0 = performance.now(); await c.query("SELECT count(*) FROM data_level_units()"); kq.nenDlu = performance.now() - t0;
        await c.query(MIG);
        kq.sau600 = await chay600(SQL600);
        t0 = performance.now(); await c.query("SELECT count(*) FROM data_level_units()"); kq.sauDlu = performance.now() - t0;
      } else {
        await chay600(sql600Main());
        kq.nen = await soOVi();
        await c.query(MIG);
        kq.sau600 = await chay600(SQL600);
        kq.sau = await soOVi();
        const dl = (cua) => `${DEM_DOC_LAP} SELECT count(*)::int n FROM tin_goc WHERE cardinality(gocs) = 1
          ${cua ? `AND (first_seen AT TIME ZONE 'Asia/Ho_Chi_Minh')::date >= ${ngayVN} - ${cua - 1}` : ""}`;
        kq.dlAll = (await so(dl(null)))[0].n;
        kq.dl7 = (await so(dl(7)))[0].n;
        kq.s06 = (await so(`SELECT count(*)::int n FROM s06_offer_project`))[0].n;
        kq.b2KyVong = (await so(`SELECT count(*)::int n FROM sale_offers o JOIN offer_project p USING (offer_id)
          WHERE p.status = 'mot_du_an' AND offer_core_complete(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id)
            AND NOT EXISTS (SELECT 1 FROM units un WHERE un.unit_key = offer_unit_key(o.offer_id) AND un.status = 'active')`))[0].n;
      }
    } finally { await c.query("ROLLBACK"); }
    const sau = await trangThaiDB();
    const sach = !sau.co_view && sau.f1 === truoc.f1 && sau.f2 === truoc.f2 && sau.computed_at === truoc.computed_at
      && (await so(`SELECT offer_located('x') v`))[0].v === false;
    console.log(`[dv7] DB máy thu sau ROLLBACK không đổi: ${sach}`);
    if (!sach) exit = 1;
    if (che === "hieu-nang") {
      const r = { "600 nền ms": Math.round(kq.nen600), "600 sau ms": Math.round(kq.sau600), "tỉ lệ": +(kq.sau600 / kq.nen600).toFixed(2),
        "data_level_units nền ms": Math.round(kq.nenDlu), "data_level_units sau ms": Math.round(kq.sauDlu) };
      console.log("[dv7] hiệu năng:", JSON.stringify(r));
      if (kq.sau600 > 2 * kq.nen600 || kq.sau600 > 15000) { console.error("[dv7] LỆCH: 600 quá trần"); exit = 1; }
      if (kq.sauDlu > 2000) { console.error("[dv7] LỆCH: data_level_units quá 2 s"); exit = 1; }
    } else {
      const g = (w, s) => kq.sau[`${w}|${s}`];
      const n = (w, s) => kq.nen[`${w}|${s}`];
      const dong = [];
      for (const w of ["all", "30d", "7d"]) for (const s of ["S03", "S05", "S06"]) {
        dong.push(`| ${w} | ${s} | ${n(w, s).loc} | ${g(w, s).loc} | ${n(w, s).pend} | ${g(w, s).pend} |`);
      }
      const bang = [`# Số chạy thử — áp 105 + 600 trong một giao dịch lùi trên DB máy thu`, ``,
        `Đo lúc ${new Date().toISOString()} · tải 1 phút ${tai.toFixed(1)} · 600 của nhánh ${Math.round(kq.sau600)} ms · lệnh`,
        "`node pipeline/scripts/offer-project-that.mjs --chay-thu` (E9). Sau ROLLBACK DB máy thu không đổi: " + sach + ".", ``,
        `| Cửa sổ | Nguồn | Định vị nền | Định vị sau | Chờ khớp nền | Chờ khớp sau |`, `|---|---|---|---|---|---|`, ...dong, ``,
        `Đếm độc lập S03 \`mot_du_an\`: all ${kq.dlAll}, 7d ${kq.dl7}. \`s06_offer_project\`: ${kq.s06} dòng.`,
        `Tin S03 có dự án và đủ năm trường lõi (B2 dự kiến, \`b2_ky_vong\`, số dòng «len» lượt đầu): ${kq.b2KyVong}.`, ``];
      console.log(bang.join("\n"));
      if (ghi) writeFileSync(join(process.cwd(), ghi), bang.join("\n"));
      if (g("all", "S03").loc !== kq.dlAll) { console.error("[dv7] LỆCH: S03 all ≠ đếm độc lập"); exit = 1; }
      if (g("7d", "S03").loc !== kq.dl7) { console.error("[dv7] LỆCH: S03 7d ≠ đếm độc lập"); exit = 1; }
      if (kq.s06 === 0 && (g("all", "S06").loc !== 0 || g("all", "S05").loc !== 0)) { console.error("[dv7] LỆCH: S05/S06 khác 0"); exit = 1; }
      for (const w of ["all", "7d"]) if (g(w, "S03").pend !== n(w, "S03").pend) { console.error(`[dv7] LỆCH: chờ khớp ${w} đổi`); exit = 1; }
    }
  }
} finally {
  await c.end();
}
process.exit(exit);
