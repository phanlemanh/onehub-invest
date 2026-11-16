// do-lech-s03-s06-do.mjs — hồ sơ do-lech-s03-s06-canh-hang (CG15), AC-7: đo bảng mặt bằng S03 so S06 trên DB thử chép từ DB máy
// thu (do-lech-s03-s06-db.sh do). Áp 104, view offer_project (nếu DB chưa có), 106, 107; chấm hai lần; rồi đếm ĐỘC LẬP bằng JS (không
// dùng câu 423): đọc tin vào mẫu từ offer_price_rank + sale_offers + property_offers, dựng phiếu × nguồn, trung vị từng bên, trạng
// thái, độ lệch, và so từng khoá nhóm với project_source_baseline:
//   · lech = số khoá nhóm mà n, trung vị, độ lệch hay trạng thái khác dòng bảng (hay có ở một bên mà không ở bên kia);
//   · lan_hai_khac = bảng lần hai khác lần một (trừ run_id, computed_at);
//   · tin_s03_co_mat_bang = tin S03 cấp dự án ở nhóm «du» — ngưỡng ≥ 1.500.
// In bảng đếm kind × thước × trạng thái và mẫu số; ghi .acceptance-runs/do-lech-s03-s06-canh-hang/do-may-thu.md; thoát 1 nêu điều
// kiện hỏng. DB phải là DB thử oneinvest_<…> (thoát 2). Đối chứng (thoát 0 khi đỏ đúng): --doi-chung-tin «đếm theo tin thay phiếu»
// → lech > 0; --doi-chung-nguon «S05 lẫn vào bên S03» → lech > 0.
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { SQL_423, xepHangGia } from "../xep-hang-gia.mjs";
import { sqlView105 } from "./gia-tot-du-an-fixture.itest.mjs";

const MIG = (n) => new URL(`../../db/migrations/${n}`, import.meta.url);
const RA = fileURLToPath(new URL("../../.acceptance-runs/do-lech-s03-s06-canh-hang/", import.meta.url));
const DOT = {
  "--doi-chung-tin": [["coalesce((SELECT 'p:' || min(po.property_id) FROM property_offers po WHERE po.offer_id = o.offer_id),\n                  'o:' || o.offer_id) AS phieu", "'o:' || o.offer_id AS phieu"]],
  "--doi-chung-nguon": [["AND o.source IN ('S03', 'S06')", "AND o.source IN ('S03', 'S05', 'S06')"],
    ["FILTER (WHERE source = 'S03')", "FILTER (WHERE source <> 'S06')"]],
};

/** Tin vào mẫu, đọc thẳng các bảng nguồn (không qua 423). */
const SQL_MAU = `
SELECT h.nut, h.kind, h.property_type, h.thuoc, h.pn_nhom, o.source, h.gia_tri::float8 AS v, o.last_seen, o.offer_id,
       (SELECT min(po.property_id)::text FROM property_offers po WHERE po.offer_id = o.offer_id) AS can
  FROM offer_price_rank h JOIN sale_offers o ON o.offer_id = h.offer_id
 WHERE h.cap = 'du_an' AND h.gia_tri IS NOT NULL AND o.source IN ('S03', 'S05', 'S06')
   AND (h.ly_do IS NULL OR h.ly_do IN ('nhom-5-9', 'pn-duoi-10'))
UNION ALL
-- nhóm giá tháng gom như nhóm dth của 422: tin thuê có m² cùng dự án, cùng loại, PN = pn_nhom, theo giá tháng
SELECT k.nut, k.kind, k.property_type, k.thuoc, k.pn_nhom, o.source, o.price_vnd::float8, o.last_seen, o.offer_id,
       (SELECT min(po.property_id)::text FROM property_offers po WHERE po.offer_id = o.offer_id)
  FROM (SELECT DISTINCT nut, kind, property_type, thuoc, pn_nhom FROM offer_price_rank WHERE cap = 'du_an' AND thuoc = 'gia-thang-pn') k
  JOIN offer_price_rank h ON h.cap = 'du_an' AND h.nut = k.nut AND h.kind = 'rent_lt' AND h.property_type = k.property_type AND h.thuoc = 'gia-m2'
  JOIN sale_offers o ON o.offer_id = h.offer_id
 WHERE o.bedrooms = k.pn_nhom AND o.price_vnd BETWEEN 1000000 AND 500000000 AND o.source IN ('S03', 'S05', 'S06')
   AND (h.ly_do IS NULL OR h.ly_do IN ('nhom-5-9', 'pn-duoi-10'))`;
const ANH = `SELECT md5(coalesce(string_agg(row(nut, kind, property_type, thuoc, pn_nhom, n_s03, trung_vi_s03, n_s06, trung_vi_s06,
  lech_pct, trang_thai)::text, '|' ORDER BY nut, kind, property_type, thuoc, pn_nhom), '')) AS h FROM project_source_baseline`;

const khoa = (r) => `${r.nut}|${r.kind}|${r.property_type}|${r.thuoc}|${r.pn_nhom ?? "-"}`;
function trungVi(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), pos = (s.length - 1) / 2, lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

/** Dựng kỳ vọng từng khoá: phiếu × nguồn lấy tin thấy sau cùng; S05 không vào bên nào. */
function kyVong(rows) {
  const chon = new Map();
  for (const r of rows) {
    if (r.source === "S05") continue;
    const k = `${khoa(r)}#${r.source}#${r.can ? `p:${r.can}` : `o:${r.offer_id}`}`;
    const cu = chon.get(k);
    const sau = !cu || r.last_seen > cu.last_seen || (+r.last_seen === +cu.last_seen && r.offer_id < cu.offer_id);
    if (sau) chon.set(k, r);
  }
  const nhom = new Map();
  for (const r of chon.values()) {
    const k = khoa(r);
    if (!nhom.has(k)) nhom.set(k, { S03: [], S06: [] });
    nhom.get(k)[r.source].push(r.v);
  }
  const ky = new Map();
  for (const [k, g] of nhom) {
    const n3 = g.S03.length, n6 = g.S06.length, tv3 = trungVi(g.S03), tv6 = trungVi(g.S06);
    const du3 = n3 >= 5, du6 = n6 >= 5;
    ky.set(k, { n3, n6, tv3, tv6, lech: du3 && du6 && tv6 ? Math.round((tv3 / tv6 - 1) * 1000) / 10 : null,
      tt: du3 && du6 ? "du" : du6 ? "thieu-s03" : du3 ? "thieu-s06" : "thieu-hai" });
  }
  return ky;
}
const gan = (a, b) => (a == null && b == null) || (a != null && b != null && Math.abs(Number(a) - b) <= 0.5 + 1e-9 * Math.abs(b));

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  const ten = url.split("?")[0].split("/").pop();
  if (!/^oneinvest_[a-z0-9_]+$/.test(ten ?? "")) {
    console.error(`do-lech-s03-s06-do: chỉ chạy trên DB thử oneinvest_<…>, không phải «${ten}»`);
    return 2;
  }
  const co = Object.keys(DOT).find((x) => process.argv.includes(x));
  let sql423 = SQL_423;
  for (const [cu, moi] of co ? DOT[co] : []) {
    if (!sql423.includes(cu)) throw new Error(`đột biến rỗng — không thấy «${cu.slice(0, 60)}» trong 423`);
    sql423 = sql423.split(cu).join(moi);
  }
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    await c.query(readFileSync(MIG("104_offer_price_rank.sql"), "utf8"));
    if (!(await c.query(`SELECT to_regclass('offer_project') AS t`)).rows[0].t) await c.query(sqlView105());
    await c.query(readFileSync(MIG("106_project_area_band.sql"), "utf8"));
    await c.query(readFileSync(MIG("107_project_source_baseline.sql"), "utf8"));
    const t0 = Date.now();
    await xepHangGia(c, { sql423, log: () => {} });
    const giay = (Date.now() - t0) / 1000;
    const anh1 = (await c.query(ANH)).rows[0].h;
    await xepHangGia(c, { sql423, log: () => {} });
    const anh2 = (await c.query(ANH)).rows[0].h;
    const bang = new Map((await c.query(`SELECT * FROM project_source_baseline`)).rows.map((r) => [khoa(r), r]));
    const mau = (await c.query(SQL_MAU)).rows;
    const ky = kyVong(mau);
    const lechDs = [];
    for (const k of new Set([...bang.keys(), ...ky.keys()])) {
      const b = bang.get(k), e = ky.get(k);
      if (!b || !e || Number(b.n_s03) !== e.n3 || Number(b.n_s06) !== e.n6 || !gan(b.trung_vi_s03, e.tv3) || !gan(b.trung_vi_s06, e.tv6)
        || !gan(b.lech_pct, e.lech) || b.trang_thai !== e.tt) lechDs.push(k);
    }
    const s03Du = mau.filter((r) => r.source === "S03" && ky.get(khoa(r))?.tt === "du").length;
    const dem = new Map();
    for (const [k, e] of ky) {
      const [, kind, , thuoc] = k.split("|");
      const kk = `${kind} · ${thuoc} · ${e.tt}`;
      const x = dem.get(kk) ?? { nhom: 0, tinS03: 0 };
      x.nhom++;
      dem.set(kk, x);
    }
    for (const r of mau) if (r.source === "S03") { const e = ky.get(khoa(r)); const kk = `${r.kind} · ${r.thuoc} · ${e.tt}`; dem.get(kk).tinS03++; }
    const lechPhanBo = [...ky.values()].filter((e) => e.lech !== null).map((e) => e.lech);
    const mauSo = (await c.query(`SELECT source, kind, count(*)::int AS n FROM sale_offers WHERE source IN ('S03', 'S06') GROUP BY 1, 2 ORDER BY 1, 2`)).rows;
    const dong = [
      `mẫu số (tin đang rao): ${mauSo.map((r) => `${r.source} ${r.kind}=${r.n}`).join(" · ")}`,
      `bước chấm (cả 422 và 423): ${giay.toFixed(1)} giây/lượt`,
      "bảng đếm (kind · thước · trạng thái · số nhóm · tin S03):",
      ...[...dem.entries()].sort().map(([k, v]) => `  ${k} · ${v.nhom} · ${v.tinS03}`),
      `độ lệch S03 so S06 ở nhóm đủ hai bên: ${lechPhanBo.length} nhóm, trung vị ${trungVi(lechPhanBo)?.toFixed(1) ?? "—"}%`,
      `tin_s03_co_mat_bang=${s03Du}`,
    ];
    const dk = { lech: lechDs.length, lan_hai_khac: anh1 === anh2 ? 0 : 1, s03_duoi_1500: s03Du >= 1500 ? 0 : 1 };
    for (const [k, v] of Object.entries(dk)) dong.push(`${k}=${v}`);
    if (lechDs.length) dong.push(`khoá lệch (tối đa 5): ${lechDs.slice(0, 5).join(", ")}`);
    for (const l of dong) console.log(l);
    const sai = Object.entries(dk).filter(([, v]) => v !== 0).map(([k]) => k);
    if (co) {
      console.log(sai.includes("lech") ? `đối chứng ${co}: đỏ đúng (lech > 0)` : `đối chứng ${co}: KHÔNG đỏ`);
      return sai.includes("lech") ? 0 : 1;
    }
    console.log(sai.length ? `KẾT: hỏng — ${sai.join(", ")}` : "KẾT: đạt");
    mkdirSync(RA, { recursive: true });
    writeFileSync(`${RA}do-may-thu.md`, `# Đo CG15 trên bản chép DB máy thu (AC-7)\n\n${new Date().toISOString()} · DB thử ${ten}\n\n\`\`\`\n${dong.join("\n")}\n\`\`\`\n\nKẾT: ${sai.length ? `hỏng — ${sai.join(", ")}` : "đạt"}\n`);
    return sai.length ? 1 : 0;
  } finally {
    await c.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((m) => process.exit(m), (e) => { console.error(e); process.exit(2); });
}
