#!/usr/bin/env node
// tap-nhan-hai-khu-do.mjs — hồ sơ tap-nhan-ghep-tin-hai-khu (PL35) E9 (AC-9): chọn mẫu lát `hai-khu-ghep` trên bản chép DB máy thu,
// không gọi model, không ghi nhãn. DB thử riêng của lượt (db/db-thu.sh), xoá khi xong. Danh bạ bản chép chưa có toà S09 của hai
// khu thì nạp bản thu S09 13/11 (khuôn API) và dựng bước S09 của DA31 trên bản chép — đường của DA31 E6; không dựng được thì
// thoát 2 «chưa có toà S09». In bảng nhóm → khu so với bảng viết trước tap-nhan-hai-khu-nhom.json, số có/chọn mỗi tầng.
// Thoát 1 khi: nhóm lạ hay thiếu, tầng bắt buộc dưới 75, tổng ngoài 300–450, eval_labels đổi.
//   node pipeline/scripts/tap-nhan-hai-khu-do.mjs
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import pg from "pg";

import { layMau } from "../label-sample.mjs";
import { dung } from "../danh-ba-vat-the.mjs";
import { CAU_CHEN_S09_ITEM, NOI_KHU_S09, dongItemS09 } from "../lib/s09-du-an.mjs";
import { khuCuaNhom } from "../lib/eval-labels.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { KHU_SLUG, LAT_HAI_KHU } from "../lib/mau-hai-khu.mjs";
import { CO_TANG, TANG_BAT_BUOC } from "../lib/tang-ghep.mjs";

const GOC = join(import.meta.dirname, "../..");
const MAY = "postgres://oneinvest:oneinvest@localhost:5433";
const TEN = `oneinvest_suite_pl35do_${process.pid}`;
const SEED = "pl35-2026-11-14";
const TONG = [300, 450];
const chinh = () => join(spawnSync("git", ["-C", GOC, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" }).stdout.trim(), "..");
const SNAP_GOC = process.env.S09_SNAPSHOT_GOC ?? join(chinh(), "collector/snapshots");
const SNAP_API = "vn/vn__s09-du-an__2026-11-13T120908161";
const docItems = (dir) => readdirSync(dir).filter((f) => /^items-\d+\.json\.gz$/.test(f)).sort()
  .flatMap((f) => { const d = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString("utf8")); return Array.isArray(d) ? d : d.items; });

/** Số toà nối S09 của từng khu trong danh bạ (bí danh ma_nguon nguồn S09 trên toà của khu). */
async function toaS09(c) {
  const { rows } = await c.query(`
    SELECT k.slug, count(DISTINCT b.building_key)::int AS so FROM buildings b
      JOIN asset_nodes n ON n.id = b.region_node_id
      LEFT JOIN asset_nodes p ON p.id = n.parent_id
      LEFT JOIN asset_nodes g ON g.id = p.parent_id
      JOIN asset_nodes k ON k.node_type = 'project' AND k.slug = ANY($1) AND k.id IN (n.id, p.id, g.id)
      JOIN registry_aliases a ON a.object_key = b.building_key AND a.kind = 'ma_nguon' AND a.source = 'S09' AND a.retired_at IS NULL
     WHERE b.status = 'active' GROUP BY 1`, [Object.values(KHU_SLUG)]);
  return Object.fromEntries(Object.values(KHU_SLUG).map((s) => [s, rows.find((r) => r.slug === s)?.so ?? 0]));
}

async function main() {
  execFileSync("bash", [join(GOC, "db/db-thu.sh"), TEN], { stdio: ["ignore", "ignore", "inherit"] });
  const c = new pg.Client({ connectionString: `${MAY}/${TEN}` });
  const loi = [];
  try {
    await c.connect();
    let s09 = await toaS09(c);
    console.log(`toa_s09_truoc ${JSON.stringify(s09)}`);
    if (Object.values(s09).some((x) => x === 0)) {
      if (!(await c.query("SELECT to_regclass('public.stg_s09_item') AS t")).rows[0].t) {
        execFileSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db", "psql", "-U", "oneinvest", "-h", "localhost",
          "-d", TEN, "-v", "ON_ERROR_STOP=1", "-q"], { input: readFileSync(join(GOC, "db/migrations/097_stg_s09_item.sql")), stdio: ["pipe", "ignore", "inherit"] });
      }
      const { rows: [{ so }] } = await c.query("SELECT count(*)::int AS so FROM stg_s09_item");
      if (so === 0) {
        const snapId = SNAP_API.split("/")[1];
        await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 's09-du-an', '{}'::jsonb)
                       ON CONFLICT (snapshot_id) DO NOTHING`, [snapId]);
        const { dong } = dongItemS09(docItems(join(SNAP_GOC, SNAP_API)), snapId);
        for (const d of dong) await c.query(CAU_CHEN_S09_ITEM, [d.snapshot_id, d.source_id, d.kind, d.payload, d.fetched_at]);
        console.log(`nap_s09 ${dong.length}`);
      }
      const tk = await dung(c, { khuSlugs: Object.values(NOI_KHU_S09), runId: `pl35-do-${Date.now()}`, log: () => {} });
      console.log(`dung_s09 ${JSON.stringify(tk.s09)}`);
      s09 = await toaS09(c);
      console.log(`toa_s09_sau ${JSON.stringify(s09)}`);
      if (Object.values(s09).some((x) => x === 0)) { console.error("chưa có toà S09"); process.exitCode = 2; return; }
    }

    // Bảng nhóm → khu so với bảng viết trước.
    const ky = JSON.parse(readFileSync(join(import.meta.dirname, "tap-nhan-hai-khu-nhom.json"), "utf8"));
    const { posts } = await loadStgPosts(c, "zalo");
    const theoNhom = new Map();
    for (const p of posts) {
      const khu = khuCuaNhom(p.group_name);
      if (!khu && !ky.ngoai.includes(p.group_name)) continue;
      const x = theoNhom.get(p.group_name) ?? { khu, so: 0 };
      x.so++;
      theoNhom.set(p.group_name, x);
    }
    console.log("\n| nhóm | khu máy | khu kỳ vọng | số bài |\n|---|---|---|---|");
    const kyKhu = new Map([...ky.op1.map((n) => [n, "op1"]), ...ky.gp.map((n) => [n, "gp"]), ...ky.ngoai.map((n) => [n, null])]);
    for (const [n, x] of [...theoNhom].sort((a, b) => b[1].so - a[1].so)) {
      const mong = kyKhu.has(n) ? kyKhu.get(n) : "(lạ)";
      console.log(`| ${n} | ${x.khu ?? "—"} | ${mong ?? "—"} | ${x.so} |`);
      if (mong === "(lạ)") loi.push(`nhóm lạ «${n}» (máy xếp ${x.khu})`);
      else if (mong !== x.khu) loi.push(`nhóm «${n}»: máy xếp ${x.khu ?? "ngoài"}, kỳ vọng ${mong ?? "ngoài"}`);
    }
    for (const n of kyKhu.keys()) if (!theoNhom.has(n)) loi.push(`nhóm thiếu «${n}» (có trong bảng kỳ vọng, không có bài)`);

    const { rows: [{ so: nhanTruoc }] } = await c.query("SELECT count(*)::int AS so FROM eval_labels");
    const kq = await layMau(c, { lat: LAT_HAI_KHU, seed: SEED, thu: true, haiKhu: { co: CO_TANG } });
    const { rows: [{ so: nhanSau }] } = await c.query("SELECT count(*)::int AS so FROM eval_labels");
    console.log(`\ndanh_ba ${JSON.stringify(kq.danh_ba)} · tin_cua_lat ${kq.tin_cua_lat} · khac_nhau ${kq.khac_nhau} · bo_su_kien ${kq.bo_su_kien} · bo_vi_trung ${kq.bo_vi_trung}`);
    console.log("| tầng | có | chọn | ghi chú |\n|---|---|---|---|");
    for (const [t, x] of Object.entries(kq.moiTangHaiKhu)) {
      console.log(`| ${t} | ${x.co} | ${x.chon} | ${x.thieu ? `thiếu ${x.thieu}, Wilson tối đa ${x.wilson_toi_da}, ${x.nhan}` : ""} |`);
      if (TANG_BAT_BUOC.includes(t) && x.chon < CO_TANG) loi.push(`tầng ${t} chỉ chọn được ${x.chon} < ${CO_TANG}`);
    }
    console.log(`tong_chon ${kq.chon} · seed ${SEED} · eval_labels ${nhanTruoc} → ${nhanSau}`);
    if (kq.chon < TONG[0] || kq.chon > TONG[1]) loi.push(`tổng ${kq.chon} ngoài ${TONG[0]}–${TONG[1]}`);
    if (nhanSau !== nhanTruoc) loi.push(`eval_labels đổi ${nhanTruoc} → ${nhanSau}`);
  } finally {
    await c.end().catch(() => {});
    spawnSync("bash", [join(GOC, "db/db-thu.sh"), TEN, "--xoa"], { stdio: "ignore" });
  }
  if (process.exitCode === 2) return;
  for (const l of loi) console.error(`LỆCH: ${l}`);
  console.log(loi.length ? `PL35-AC-9 đỏ: ${loi.length} ô lệch` : "PL35-AC-9 xanh");
  process.exitCode = loi.length ? 1 : 0;
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
