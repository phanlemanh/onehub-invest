#!/usr/bin/env node
// danh-ba-s09-that.mjs — hồ sơ toa-s09-hai-khu-vao-danh-ba (DA31) E6 (AC-6), E7 (AC-7): phép đo trên dữ liệu thật.
// Chép DB máy thu sang DB thử riêng của lượt (db/db-thu.sh, xoá khi xong), áp 097, nạp bản thu S09 khuôn API qua dongItemS09,
// dựng hai khu bằng lệnh dựng thật, in bảng trước/sau. Đối chứng: số đếm trực tiếp trên hai bản Mạnh mở tay (khuôn trang),
// đọc bằng mã riêng của script (không import hàm của hàng). Thước AC-7 viết riêng ở đây (không import hàm dựng): tên chuẩn hoá
// của phát biểu block_raw/unit_number trên bài S03 căn hộ, nhóm một khu, so với bí danh `ten` của toà khu đó.
// Chỉ đọc DB máy thu (đếm «trước» làm đối chứng thước). Không gọi nguồn. Chỉ in số — không in mã, tên nguồn hay payload.
//   node pipeline/scripts/danh-ba-s09-that.mjs   (thoát 1 khi một ô lệch kỳ vọng, nêu ô)
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import pg from "pg";
import { dung } from "../danh-ba-vat-the.mjs";
import { CAU_CHEN_S09_ITEM, NOI_KHU_S09, dongItemS09 } from "../lib/s09-du-an.mjs";
import { khoaNhomThat } from "../lib/eval-labels.mjs";

const GOC = join(import.meta.dirname, "../..");
const MAY = "postgres://oneinvest:oneinvest@localhost:5433";
const TEN = `oneinvest_suite_s09that_${process.pid}`;
const chinh = () => {
  const r = spawnSync("git", ["-C", GOC, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" });
  return join(r.stdout.trim(), "..");
};
const SNAP_GOC = process.env.S09_SNAPSHOT_GOC ?? join(chinh(), "collector/snapshots");
const SNAP_API = "vn/vn__s09-du-an__2026-11-13T120908161";
const SNAP_TAY = { "vinhomes-ocean-park-1": "hanoi/hanoi__s09-du-an__2026-11-13T092747119", "vinhomes-grand-park": "hcmc/hcmc__s09-du-an__2026-11-13T092747129" };
const KY_VONG = {
  "vinhomes-ocean-park-1": { ban_ghi_toa: 115, ngay_ban_giao: 91, phan_khu: 13, toa_noi_s09: 115, nut_phan_khu: 13, toa_s08_bi_danh: 12 },
  "vinhomes-grand-park": { ban_ghi_toa: 61, ngay_ban_giao: 59, phan_khu: 7, toa_noi_s09: 60, nut_phan_khu: 7, toa_s08_bi_danh: 34 },
};

const docItems = (dir) => readdirSync(dir).filter((f) => /^items-\d+\.json\.gz$/.test(f)).sort()
  .flatMap((f) => { const d = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString("utf8")); return Array.isArray(d) ? d : d.items; });

/** Đối chứng: đếm thẳng trên bản tay (khuôn trang), mã riêng. */
function demBanTay(slug) {
  const p = docItems(join(SNAP_GOC, SNAP_TAY[slug]))[0]?.payload?.nextData?.props?.pageProps?.project ?? {};
  const toa = Array.isArray(p.insight_by_block) ? p.insight_by_block : [];
  return {
    ban_ghi_toa: toa.length,
    ngay_ban_giao: toa.filter((b) => String(b.handover_date_from ?? "").trim()).length,
    phan_khu: Array.isArray(p.insight_by_sector) ? p.insight_by_sector.length : 0,
  };
}

// ---- Thước AC-7, viết riêng ----
const chuan = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "D")
  .replace(/(\d)\s+(?=\d)/g, "$1.").replace(/[\s\-_]+/g, "").toUpperCase();
/** Tên toà nêu trong phát biểu: block_raw nguyên; unit_number lấy phần trước dấu ngăn cuối («S1.01-1205» → «S1.01»). */
const tenNeu = (field, v) => {
  if (field === "block_raw") return chuan(v);
  const m = String(v ?? "").trim().match(/^(.+?)[\s\-_/]+[0-9]{2,5}[A-Za-z]?$/);
  return m ? chuan(m[1]) : null;
};

async function thuoc(c, khuSlugs) {
  const { rows: khu } = await c.query("SELECT id::int AS id, slug FROM asset_nodes WHERE node_type = 'project' AND slug = ANY($1)", [khuSlugs]);
  const idKhu = new Map(khu.map((k) => [k.id, k.slug]));
  const { rows: nhom } = await c.query(
    "SELECT group_key, project_node_ids FROM collection_units WHERE source_code = 'S03' AND cardinality(project_node_ids) = 1");
  const khuNhom = new Map();
  for (const n of nhom) {
    const s = idKhu.get(Number(n.project_node_ids[0]));
    if (!s) continue;
    khuNhom.set(n.group_key, s);
    khuNhom.set(khoaNhomThat(n.group_key), s);
  }
  // Tên toà của khu (bí danh ten), tên nút vùng dưới khu (phân khu, cụm; hai bậc).
  const coBang = (await c.query("SELECT to_regclass('public.buildings') AS t")).rows[0].t;
  const tenToa = new Map(khuSlugs.map((s) => [s, new Set()]));
  if (coBang) {
    const { rows } = await c.query(`
      SELECT k.slug, a.value FROM buildings b
        JOIN asset_nodes n ON n.id = b.region_node_id
        LEFT JOIN asset_nodes p ON p.id = n.parent_id
        LEFT JOIN asset_nodes g ON g.id = p.parent_id
        JOIN asset_nodes k ON k.node_type = 'project' AND k.slug = ANY($1) AND k.id IN (n.id, p.id, g.id)
        JOIN registry_aliases a ON a.object_key = b.building_key AND a.kind = 'ten' AND a.retired_at IS NULL
       WHERE b.status = 'active'`, [khuSlugs]);
    for (const r of rows) tenToa.get(r.slug).add(chuan(r.value));
  }
  const { rows: nut } = await c.query(`
    SELECT k.slug, n.id::int AS id, n.name, n.aliases FROM asset_nodes k
      JOIN asset_nodes p ON p.parent_id = k.id
      JOIN asset_nodes n ON n.id = p.id OR n.parent_id = p.id
     WHERE k.slug = ANY($1)`, [khuSlugs]);
  const tenNut = new Map(khuSlugs.map((s) => [s, new Map()]));
  for (const r of nut) for (const t of [r.name, ...(r.aliases ?? [])]) {
    const m = tenNut.get(r.slug);
    const k = chuan(t);
    m.set(k, new Set([...(m.get(k) ?? []), r.id]));
  }
  const { rows: pb } = await c.query(`
    SELECT fa.subject_key, fa.field, fa.value, p.conversation_id
      FROM field_assertions fa
      JOIN stg_zalo_posts p ON fa.subject_key = 'S03:' || p.post_id
     WHERE fa.resource_name = 'Property' AND fa.field IN ('block_raw', 'unit_number') AND fa.retracted_at IS NULL
       AND EXISTS (SELECT 1 FROM field_assertions t WHERE t.subject_key = fa.subject_key AND t.field = 'property_type'
                     AND t.value = 'apartment' AND t.retracted_at IS NULL)`);
  const ra = Object.fromEntries(khuSlugs.map((s) => [s, { bai_co_ten: new Set(), gan_toa: new Set(), chi_vung: new Set() }]));
  const neu = new Map(); // bài → {slug, ten:Set}
  for (const r of pb) {
    const s = khuNhom.get(r.conversation_id) ?? khuNhom.get(khoaNhomThat(r.conversation_id ?? ""));
    if (!s) continue;
    const t = tenNeu(r.field, r.value);
    if (!t) continue;
    const x = neu.get(r.subject_key) ?? { s, ten: new Set() };
    x.ten.add(t);
    neu.set(r.subject_key, x);
  }
  for (const [bai, { s, ten }] of neu) {
    ra[s].bai_co_ten.add(bai);
    if ([...ten].some((t) => tenToa.get(s).has(t))) ra[s].gan_toa.add(bai);
    else if ([...ten].some((t) => tenNut.get(s).get(t)?.size === 1)) ra[s].chi_vung.add(bai);
  }
  return Object.fromEntries(Object.entries(ra).map(([s, v]) => [s, { bai_co_ten: v.bai_co_ten.size, gan_toa: v.gan_toa.size, chi_vung: v.chi_vung.size }]));
}

async function danhBa(c) {
  const { rows } = await c.query(`
    WITH k AS (SELECT id, slug FROM asset_nodes WHERE slug = ANY($1)),
    s09 AS (SELECT a.object_key, split_part(a.value, '/', 1) AS pid FROM registry_aliases a
             WHERE a.kind = 'ma_nguon' AND a.source = 'S09' AND a.retired_at IS NULL)
    SELECT k.slug,
      (SELECT count(DISTINCT s.object_key)::int FROM s09 s WHERE s.pid = ANY($2::text[]) AND s.pid = (SELECT x FROM unnest($2::text[], $3::text[]) u(x, y) WHERE y = k.slug)) AS toa_noi_s09,
      (SELECT count(DISTINCT s.object_key)::int FROM s09 s JOIN buildings b ON b.building_key = s.object_key AND b.catalog_tier <> 'mot_loi_khai'
         WHERE s.pid = (SELECT x FROM unnest($2::text[], $3::text[]) u(x, y) WHERE y = k.slug)) AS toa_s08_bi_danh,
      (SELECT count(*)::int FROM asset_nodes n, jsonb_array_elements_text(COALESCE(n.meta -> 's09_sector_ids', '[]')) e WHERE n.parent_id = k.id) AS nut_phan_khu,
      (SELECT count(*)::int FROM asset_nodes n JOIN asset_nodes p ON p.id = n.parent_id WHERE p.parent_id = k.id AND n.meta ? 's09_cum') AS nut_cum
      FROM k ORDER BY 1`, [Object.values(NOI_KHU_S09), Object.keys(NOI_KHU_S09), Object.values(NOI_KHU_S09)]);
  const { rows: [x] } = await c.query(`SELECT
      (SELECT count(*) FROM (SELECT building_key FROM buildings GROUP BY 1 HAVING count(DISTINCT upi) > 1) a)::int AS toa_hai_upi,
      (SELECT count(*) FROM (SELECT upi FROM buildings GROUP BY 1 HAVING count(*) > 1) a)::int AS upi_trung,
      (SELECT count(*)::int FROM buildings) AS toa`);
  return { khu: Object.fromEntries(rows.map((r) => [r.slug, r])), ...x };
}

async function main() {
  const khuSlugs = Object.values(NOI_KHU_S09);
  const may = new pg.Client({ connectionString: `${MAY}/oneinvest` });
  await may.connect();
  await may.query("SET default_transaction_read_only = on");
  const thuocMay = await thuoc(may, khuSlugs);
  await may.end();

  execFileSync("bash", [join(GOC, "db/db-thu.sh"), TEN], { stdio: ["ignore", "ignore", "inherit"] });
  const c = new pg.Client({ connectionString: `${MAY}/${TEN}` });
  const loi = [];
  try {
    execFileSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db", "psql", "-U", "oneinvest", "-h", "localhost",
      "-d", TEN, "-v", "ON_ERROR_STOP=1", "-q"], { input: readFileSync(join(GOC, "db/migrations/097_stg_s09_item.sql")), stdio: ["pipe", "ignore", "inherit"] });
    await c.connect();
    const thuocTruoc = await thuoc(c, khuSlugs);
    const dbTruoc = await danhBa(c);

    const snapId = SNAP_API.split("/")[1];
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 's09-du-an', '{}'::jsonb)
                   ON CONFLICT (snapshot_id) DO NOTHING`, [snapId]);
    const { dong, bo } = dongItemS09(docItems(join(SNAP_GOC, SNAP_API)), snapId);
    let nap = 0;
    for (const d of dong) nap += (await c.query(CAU_CHEN_S09_ITEM, [d.snapshot_id, d.source_id, d.kind, d.payload, d.fetched_at])).rowCount;
    console.log(`nap ${JSON.stringify({ dong: dong.length, ghi: nap, bo })}`);

    const { rows: v } = await c.query(`
      SELECT t.project_id, count(*)::int AS ban_ghi_toa, count(t.handover_date_from)::int AS ngay_ban_giao,
             (SELECT count(*)::int FROM v_s09_phan_khu p WHERE p.project_id = t.project_id) AS phan_khu
        FROM v_s09_toa t WHERE t.project_id = ANY($1) GROUP BY 1`, [Object.keys(NOI_KHU_S09)]);
    const tk = await dung(c, { khuSlugs, runId: `da31-that-${Date.now()}`, log: (s) => console.log(s) });
    console.log(`s09 ${JSON.stringify(tk.s09)}`);
    const dbSau = await danhBa(c);
    const thuocSau = await thuoc(c, khuSlugs);

    console.log("\n| khu | ô | kỳ vọng | đối chứng bản tay | view/danh bạ trước | sau |");
    console.log("|---|---|---|---|---|---|");
    for (const [pid, slug] of Object.entries(NOI_KHU_S09)) {
      const kv = KY_VONG[slug];
      const tay = demBanTay(slug);
      const vw = v.find((r) => r.project_id === pid) ?? {};
      for (const o of ["ban_ghi_toa", "ngay_ban_giao", "phan_khu"]) {
        console.log(`| ${slug} | ${o} | ${kv[o]} | ${tay[o]} | — | ${vw[o]} |`);
        if (vw[o] !== kv[o] || tay[o] !== kv[o]) loi.push(`${slug} ${o}: kỳ vọng ${kv[o]}, bản tay ${tay[o]}, view ${vw[o]}`);
      }
      for (const o of ["toa_noi_s09", "nut_phan_khu", "toa_s08_bi_danh"]) {
        const a = dbTruoc.khu[slug]?.[o], b = dbSau.khu[slug]?.[o];
        console.log(`| ${slug} | ${o} | ${kv[o]} | — | ${a} | ${b} |`);
        if (b !== kv[o]) loi.push(`${slug} ${o}: kỳ vọng ${kv[o]}, sau ${b}`);
      }
      console.log(`| ${slug} | nut_cum | — | — | ${dbTruoc.khu[slug]?.nut_cum} | ${dbSau.khu[slug]?.nut_cum} |`);
      // AC-7
      const m = thuocMay[slug], t0 = thuocTruoc[slug], t1 = thuocSau[slug];
      console.log(`| ${slug} | AC-7 bai_co_ten | — | máy thu ${m.bai_co_ten} | ${t0.bai_co_ten} | ${t1.bai_co_ten} |`);
      console.log(`| ${slug} | AC-7 gan_toa | — | máy thu ${m.gan_toa} | ${t0.gan_toa} | ${t1.gan_toa} |`);
      console.log(`| ${slug} | AC-7 chi_vung | — | máy thu ${m.chi_vung} | ${t0.chi_vung} | ${t1.chi_vung} |`);
      if (t0.gan_toa !== m.gan_toa || t0.chi_vung !== m.chi_vung) loi.push(`${slug} AC-7 thước trước lệch máy thu`);
      if (!(t1.gan_toa > t0.gan_toa)) loi.push(`${slug} AC-7 gắn toà không tăng (${t0.gan_toa} → ${t1.gan_toa})`);
      if (!(t1.chi_vung > t0.chi_vung)) loi.push(`${slug} AC-7 bài chỉ nêu vùng không tăng (${t0.chi_vung} → ${t1.chi_vung})`);
    }
    console.log(`| tất cả | toa | — | — | ${dbTruoc.toa} | ${dbSau.toa} |`);
    console.log(`| tất cả | toa_hai_upi / upi_trung | 0 / 0 | — | ${dbTruoc.toa_hai_upi} / ${dbTruoc.upi_trung} | ${dbSau.toa_hai_upi} / ${dbSau.upi_trung} |`);
    if (dbSau.toa_hai_upi || dbSau.upi_trung) loi.push("toà hai UPI / UPI trùng");
  } finally {
    await c.end().catch(() => {});
    execFileSync("bash", [join(GOC, "db/db-thu.sh"), TEN, "--xoa"], { stdio: ["ignore", "ignore", "inherit"] });
  }
  if (loi.length) {
    for (const l of loi) console.error(`LỆCH ${l}`);
    process.exit(1);
  }
  console.log("\nE6/E7: mọi ô đạt kỳ vọng");
}

main().catch((e) => {
  console.error(`danh-ba-s09-that: ${e.message}`);
  process.exit(2);
});
