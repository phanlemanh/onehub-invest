#!/usr/bin/env node
// danh-ba-s16-that.mjs — hồ sơ nap-s16-vao-danh-ba (DA33) E2, E10: nạp ba bản thu S16 thật vào DB thử chép từ máy thu, đối chứng
// với một bộ đếm độc lập đọc thẳng snapshot (KHÔNG import pipeline/lib/s16*), dựng danh bạ năm khu đã nối, in bảng số.
// DB thử oneinvest_dbv_s16that_<pid> dựng từ db/migrations (taoDbThu), xoá khi xong; DB máy thu chỉ đọc (phiên read only).
// Chỉ in số đếm và nhãn che — không mã căn, không id khu/toà, không tên nguồn hay tên thư mục bản thu. Lệch một ô → thoát 1.
// Chạy ở máy thu: node pipeline/scripts/danh-ba-s16-that.mjs   (ngoài CI: cần :5433 và snapshot local)
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import { homedir } from "node:os";
import { createHash } from "node:crypto";
import pg from "pg";
import { taoDbThu, xoaDbThu, MAY_CHU, GOC } from "./db-thu-dbv.mjs";
import { dung } from "../danh-ba-vat-the.mjs";
import { FILL } from "../sync-cloud.mjs";

const NGUON_DB = process.env.DATABASE_URL ?? `${MAY_CHU}/oneinvest`;
const TEN = `oneinvest_dbv_s16that_${process.pid}`;
const KHU = ["vinhomes-ocean-park-1", "vinhomes-ocean-park-2", "vinhomes-ocean-park-3", "vinhomes-smart-city", "vinhomes-grand-park"];
const SO_TEP_KE = 147268; // tệp kê làn thu ghi (14/11)
const SAN_S08 = { "vinhomes-grand-park": 1283, "vinhomes-ocean-park-1": 153 }; // mã S08 có trong S16, đo 14/11 khi thiết kế
const loi = [];
const kiem = (ok, o) => { if (!ok) loi.push(o); };

// ---------- Bộ đếm độc lập (đọc thẳng snapshot, luật viết lại ở đây) ----------
function thuMucBanThu() {
  for (const d of [join(GOC, "collector/snapshots/vn"), join(homedir(), "dev/onehub-invest/collector/snapshots/vn")]) {
    if (!existsSync(d)) continue;
    const ds = readdirSync(d).filter((f) => /^vn__s16-/.test(f)).sort();
    if (ds.length) return ds.map((f) => join(d, f));
  }
  throw new Error("không thấy bản thu S16 ở collector/snapshots/vn");
}
const docItems = (dir) => {
  const raw = JSON.parse(gunzipSync(readFileSync(join(dir, "items-0001.json.gz"))).toString("utf8"));
  return Array.isArray(raw) ? raw : raw.items;
};
function demDocLap(items) {
  const duAn = new Set(), khu = new Set(), toa = new Set(), can = new Map(); // can: `${da}|${MA}` → Set(tên toà)
  const ganCan = (da, ma, t) => {
    const k = `${da}|${String(ma).trim().toUpperCase()}`;
    if (!can.has(k)) can.set(k, new Set());
    if (t && String(t).trim()) can.get(k).add(String(t).trim());
    duAn.add(da);
  };
  const csv = (s) => {
    const l = String(s).replace(/^﻿/, "").split(/\r?\n/).filter((x) => x.trim());
    const h = l[0].split(",").map((x) => x.trim());
    return l.slice(1).map((x) => x.split(",")).filter((c) => c.length === h.length).map((c) => Object.fromEntries(h.map((k, i) => [k, c[i].trim()])));
  };
  const jsonl = (s) => String(s ?? "").split(/\r?\n/).flatMap((x) => { try { return x.trim() ? [JSON.parse(x)] : []; } catch { return []; } });
  for (const it of items) {
    const p = it.payload ?? {};
    if (it.kind === "mngt-khu") for (const r of csv(p.csv)) khu.add(`${r.du_an_alias}|${r.khu_id}`);
    if (it.kind === "mngt-toa") for (const r of csv(p.csv)) toa.add(`${r.du_an_alias}|${r.toa_id}`);
    if (it.kind === "mngt-can") for (const r of csv(p.csv)) ganCan(r.du_an_alias, r.ma_can, r.toa_ten);
    if (it.kind === "mngt-toa-khong-alias") for (const [k, v] of Object.entries(p.toaKhongAlias ?? {})) {
      const [da, kid] = k.split("|");
      khu.add(`${da}|${kid}`);
      for (const t of v.toa ?? []) toa.add(`${da}|${t.value}`);
    }
    const theoToa = (o) => {
      const [da, , tid] = String(o.toa ?? o.key ?? "").split("|");
      if (!da || !tid) return;
      toa.add(`${da}|${tid}`);
      for (const c of o.can ?? []) if (c?.ma_can) ganCan(da, c.ma_can, c.toa ?? o.toaTen);
    };
    if (it.kind === "mngt-can-moi") for (const k of ["theoTang", "khongTang"]) jsonl(p[k]).forEach(theoToa);
    if (it.kind === "mngt-can-pha3") jsonl(p.jsonl).forEach(theoToa);
  }
  const chuan = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "D").replace(/[\s\-_]+/g, "").toUpperCase();
  let moHo = 0;
  for (const [k, ten] of can) {
    if (ten.size <= 1) { if (ten.size === 0) moHo++; continue; }
    const ma = chuan(k.slice(k.indexOf("|") + 1));
    if ([...ten].filter((t) => chuan(t) && ma.startsWith(chuan(t))).length !== 1) moHo++;
  }
  return { du_an: duAn.size, khu: khu.size, toa: toa.size, cap: can.size, mo_ho: moHo };
}

// ---------- Chép chỉ đọc từ máy thu ----------
async function chep(src, dst, bang, where = "true", p = []) {
  const { rows } = await src.query(`SELECT coalesce(json_agg(t), '[]'::json) AS j FROM (SELECT * FROM ${bang} WHERE ${where}) t`, p);
  if (!rows[0].j.length) return 0;
  const r = await dst.query(`INSERT INTO ${bang} SELECT * FROM json_populate_recordset(null::${bang}, $1::json) ON CONFLICT DO NOTHING`,
    [JSON.stringify(rows[0].j)]);
  return r.rowCount;
}

async function main() {
  const dirs = thuMucBanThu();
  const banThu = dirs.map(docItems);
  const dem = demDocLap(banThu.flat());
  const src = new pg.Client({ connectionString: NGUON_DB });
  await src.connect();
  await src.query("SET default_transaction_read_only = on");
  const url = await taoDbThu(TEN);
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    // Trạng thái danh bạ máy thu (chỉ bảng cần).
    await chep(src, c, "asset_nodes");
    const sn = (await src.query(`SELECT DISTINCT i.snapshot_id FROM stg_s08_inventory i JOIN s08_project_links l ON l.project_id = i.project_id AND l.status = 'noi'`)).rows.map((r) => r.snapshot_id);
    await chep(src, c, "airbnb_snapshots", "snapshot_id = ANY($1)", [sn]);
    await chep(src, c, "s08_project_links");
    await chep(src, c, "stg_s08_inventory", "project_id IN (SELECT project_id FROM s08_project_links WHERE status = 'noi')");
    await chep(src, c, "buildings", "merged_into IS NULL");
    await chep(src, c, "stacks", "merged_into IS NULL");
    await chep(src, c, "units", "merged_into IS NULL");
    await chep(src, c, "registry_aliases", "kind IN ('ma_nguon', 'ten')");
    await src.end();
    // Cột id tự tăng đã chép theo dòng: đẩy bộ đếm lên để dòng mới không trùng khoá.
    await c.query("SELECT setval(pg_get_serial_sequence('registry_aliases', 'id'), (SELECT coalesce(max(id), 1) FROM registry_aliases))");
    await c.query("SELECT setval(pg_get_serial_sequence('asset_nodes', 'id'), (SELECT coalesce(max(id), 1) FROM asset_nodes))");

    // Nạp ba bản thu qua hàm dùng chung (import động: bộ đếm trên không dùng nó).
    const { dongS16, napS16 } = await import("../lib/s16-danh-muc.mjs");
    for (const [i, items] of banThu.entries()) {
      const id = `s16-pha${i + 1}`;
      await c.query("INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S16', '{}')", [id]);
      await c.query("BEGIN");
      await napS16(c, dongS16(items, id));
      await c.query("COMMIT");
    }
    const mot = async (s, p = []) => (await c.query(s, p)).rows[0];
    const stg = {
      du_an: (await mot("SELECT count(DISTINCT du_an)::int AS n FROM stg_s16_can")).n,
      khu: (await mot("SELECT count(*)::int AS n FROM (SELECT DISTINCT du_an, khu_id FROM stg_s16_khu) x")).n,
      toa: (await mot("SELECT count(*)::int AS n FROM v_s16_toa")).n,
      cap: (await mot("SELECT count(*)::int AS n FROM v_s16_can")).n,
      mo_ho: (await mot("SELECT count(*)::int AS n FROM v_s16_can WHERE mo_ho")).n,
    };
    console.log("E2 · stg / đếm thẳng snapshot");
    for (const k of Object.keys(stg)) {
      console.log(`  ${k.padEnd(6)} ${String(stg[k]).padStart(8)} ${String(dem[k]).padStart(8)}${stg[k] === dem[k] ? "" : "  LỆCH"}`);
      kiem(stg[k] === dem[k], `E2 ô ${k}`);
    }
    console.log(`  tệp kê ghi ${SO_TEP_KE} cặp; đếm thẳng ${dem.cap} — tệp kê đếm trước khi khử trùng hoa thường và khoảng trắng`);

    // Dựng danh bạ năm khu.
    const iso = (k) => ({ hanoi: "VN-HN", hcmc: "VN-SG" })[k.city] ?? null;
    const truoc = await mot("SELECT (SELECT count(*) FROM buildings)::int AS b, (SELECT count(*) FROM units)::int AS u");
    const kq = await dung(c, { khuSlugs: KHU, isoTheo: iso, noiS09: {}, log: () => {}, runId: "da33-that" });
    const s16 = kq.s16;
    console.log("E10 · theo khu: toà nối · toà mới · toà 0 căn · toà thẻ · căn mới · căn S08 nhận S16 · lệch toà · mơ hồ · căn chưa có toà · thẻ");
    for (const [slug, t] of Object.entries(s16.khu ?? {})) {
      console.log(`  ${slug.padEnd(24)} ${[t.toa_noi, t.toa_moi, t.toa_0_can, t.toa_the, t.can_moi, t.can_s08_bi_danh, t.can_lech_toa, t.mo_ho, t.can_khong_toa, t.the_moi].join(" · ")}`);
    }
    console.log(`  dự án S16 chưa nối: ${Object.keys(s16.bo_du_an ?? {}).length} (${Object.values(s16.bo_du_an ?? {}).reduce((a, b) => a + b, 0)} căn)`);
    const it = s16.toa_moi_so_can ?? [];
    console.log(`E10 · toà mới: ${it.length}; dưới 10 căn: ${it.filter((x) => x.so_can < 10).length}`);
    for (const [i, x] of it.entries()) console.log(`  toa#${i + 1} ${x.khu} ${x.so_can}`);

    // Ba phần của mã S08 có trong S16 (GP, OP1).
    for (const slug of Object.keys(SAN_S08)) {
      const id = (await mot("SELECT id FROM asset_nodes WHERE slug = $1", [slug])).id;
      const r = await mot(`
        WITH s08 AS (SELECT DISTINCT upper(btrim(i.product_code)) AS ma FROM stg_s08_inventory i
                       JOIN s08_project_links l ON l.project_id = i.project_id AND l.status = 'noi' AND l.asset_node_id = $1
                      WHERE i.project_type = 'high_rise'),
             s16 AS (SELECT v.* FROM v_s16_can v WHERE v.du_an = ANY($2)),
             chung AS (SELECT s08.ma, s16.du_an, s16.mo_ho FROM s08 JOIN s16 ON s16.ma_can = s08.ma)
        SELECT (SELECT count(*) FROM chung)::int AS tong,
               (SELECT count(*) FROM chung ch WHERE EXISTS (SELECT 1 FROM registry_aliases a JOIN registry_aliases b ON b.object_key = a.object_key
                   AND b.source = 'S08' AND b.kind = 'ma_nguon' AND upper(split_part(b.value, '/', 2)) = ch.ma
                 WHERE a.source = 'S16' AND a.kind = 'ma_nguon' AND a.value = ch.du_an || '/' || ch.ma AND a.object_key LIKE 'unt_%'))::int AS bi_danh,
               (SELECT count(*) FROM chung ch WHERE ch.mo_ho)::int AS mo_ho`,
        [id, Object.keys(await duAnCua(c, slug))]);
      const lech = (await mot(`SELECT count(*)::int AS n FROM review_queue WHERE evidence->>'loai' = 'can-lech-toa' AND item_id = ANY($1)`,
        [await refCua(c, slug)])).n;
      const khongToa = r.tong - r.bi_danh - lech - r.mo_ho;
      console.log(`E10 · ${slug}: mã S08 có trong S16 ${r.tong} = bí danh ${r.bi_danh} + lệch toà ${lech} + mơ hồ ${r.mo_ho}${khongToa ? ` + toà chưa nối ${khongToa}` : ""} (đo 14/11: ${SAN_S08[slug]})`);
      kiem(r.bi_danh + lech + r.mo_ho === r.tong, `E10 ba phần ${slug}`);
    }

    // Không hai khoá.
    const trung = await mot(`SELECT
      (SELECT count(*) FROM (SELECT value FROM registry_aliases WHERE kind = 'ma_nguon' AND retired_at IS NULL GROUP BY source, value HAVING count(DISTINCT object_key) > 1) x)::int AS ma_hai,
      (SELECT count(*) FROM (SELECT upi FROM buildings GROUP BY upi HAVING count(*) > 1) x)::int AS upi_hai`);
    console.log(`E10 · mã hai đối tượng ${trung.ma_hai} · UPI hai toà ${trung.upi_hai}`);
    kiem(trung.ma_hai === 0 && trung.upi_hai === 0, "E10 trùng khoá");

    // Thẻ và dữ liệu sắp gửi không mang token S16.
    const { soatDuLieu, soatS16, tokenS16 } = await import("../lib/s16-soat.mjs");
    const tk = await tokenS16(c);
    const the = (await c.query("SELECT item_id, title, evidence FROM review_queue WHERE item_id LIKE 's16:%'")).rows;
    const theLo = the.filter((x) => soatS16(x, tk)).length;
    console.log(`E10 · thẻ S16 ${the.length}, mang token S16 ${theLo}`);
    kiem(theLo === 0, "E10 thẻ mang token");
    const data = new Map();
    for (const t of FILL) {
      if (!(await mot("SELECT to_regclass($1) AS r", [`public.${t}`])).r) continue;
      data.set(t, (await c.query(`SELECT row_to_json(x)::text AS j FROM ${t} x`)).rows.map((r) => r.j));
    }
    const hit = soatDuLieu(data, tk);
    console.log(`E10 · sync chạy thử (không gửi): ${hit ? `TRÚNG ở ${hit.bang}.${hit.cot}` : "0 token S16"}`);
    kiem(!hit, "E10 sync chạy thử");

    // Dựng lần hai.
    const bam = async () => createHash("sha256").update(JSON.stringify((await c.query(
      "SELECT unit_key, building_key, stack_key, floor FROM units ORDER BY 1")).rows)).digest("hex");
    const b1 = await bam();
    const kq2 = await dung(c, { khuSlugs: KHU, isoTheo: iso, noiS09: {}, log: () => {}, runId: "da33-that-2" });
    const moi2 = Object.values(kq2.s16.khu).reduce((a, t) => a + t.toa_moi + t.can_moi + t.the_moi, 0) + kq2.khoa_moi;
    console.log(`E10 · dựng lần hai: khoá/thẻ mới ${moi2}, băm căn ${b1 === (await bam()) ? "bằng" : "KHÁC"}`);
    kiem(moi2 === 0 && b1 === (await bam()), "E10 dựng lại");
    const sau = await mot("SELECT (SELECT count(*) FROM buildings)::int AS b, (SELECT count(*) FROM units)::int AS u");
    console.log(`E10 · toà ${truoc.b} → ${sau.b} · căn ${truoc.u} → ${sau.u}`);
  } finally {
    await c.end().catch(() => {});
    await xoaDbThu(TEN);
  }
  if (loi.length) { console.error(`LỆCH: ${loi.join(" · ")}`); process.exit(1); }
  console.log("OK");
}

async function duAnCua(c, slug) {
  const { NOI_DU_AN_S16, duoiDuAn } = await import("../lib/s16-danh-muc.mjs");
  const ra = {};
  for (const { du_an } of (await c.query("SELECT DISTINCT du_an FROM stg_s16_can")).rows) if (NOI_DU_AN_S16[duoiDuAn(du_an)] === slug) ra[du_an] = 1;
  return ra;
}
async function refCua(c, slug) {
  const { s16Ref } = await import("../lib/s16-danh-muc.mjs");
  const ds = Object.keys(await duAnCua(c, slug));
  const { rows } = await c.query("SELECT du_an, ma_can FROM v_s16_can WHERE du_an = ANY($1)", [ds]);
  return rows.map((r) => `s16:${s16Ref(r.du_an, r.ma_can)}`);
}

main().catch((e) => { console.error(`danh-ba-s16-that: ${e.message}`); process.exit(2); });
