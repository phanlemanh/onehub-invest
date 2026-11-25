#!/usr/bin/env node
// kiem-sau.mjs — ZC15: đo ảnh S03 trên DB máy thu, chỉ đọc. Không in URL hay tên host (họ host lạ in bằng băm md5 10 ký tự).
//
//   node kiem-sau.mjs --ty-le [--ngay 8]          bảng tỉ lệ bài có ảnh mà mất hết ảnh theo ngày đăng VN
//   node kiem-sau.mjs --sau <ISO mốc>             chấm bài đăng từ mốc (sau khi khởi động lại collector API)
//   node kiem-sau.mjs --tu-tep <rows.json>        chấm bộ dòng mẫu [{post_id, media_files}] (kiem.sh)
//
// Chấm (--sau, --tu-tep): ĐẠT khi có bài mới có ảnh, 0 entry r2.dev lỗi host-not-allowed, 0 entry redirect-host,
// và ≥1 ảnh r2.dev có file. Thoát 0 = ĐẠT, 1 = KHÔNG ĐẠT, 2 = gọi sai / không đọc được DB.
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const md5 = (s) => createHash("md5").update(s).digest("hex").slice(0, 10);
const hoHost = (url) => {
  let h;
  try { h = new URL(url).hostname.toLowerCase(); } catch { return "url-hong"; }
  const ho = h.split(".").slice(-2).join(".");
  return ho === "zdn.vn" || ho === "r2.dev" ? ho : `md5:${md5(ho)}`;
};

/** Lõi chấm — rows: [{post_id, media_files}] (mỗi bài một dòng, bản mới nhất). */
export function cham(rows) {
  let bai = 0, matHet = 0, matChiDoHost = 0, r2Ok = 0, r2Chan = 0, redirect = 0, jxl = 0;
  for (const r of rows) {
    const mf = Array.isArray(r.media_files) ? r.media_files : [];
    if (mf.length === 0) continue;
    bai++;
    if (!mf.some((e) => e && e.file)) {
      matHet++;
      // bài chỉ hỏng vì hai lỗi ZC15 sửa được — tỉ lệ đích của ngày = bỏ các bài này
      if (mf.some((e) => e && (e.error === "redirect-host" || (e.error === "host-not-allowed" && hoHost(e.url) === "r2.dev")))) matChiDoHost++;
    }
    for (const e of mf) {
      if (!e) continue;
      const ho = hoHost(e.url);
      if (ho === "r2.dev" && e.file) r2Ok++;
      if (ho === "r2.dev" && e.error === "host-not-allowed") r2Chan++;
      if (e.error === "redirect-host") redirect++;
      if (typeof e.file === "string" && e.file.endsWith(".jxl")) jxl++;
    }
  }
  const lyDo = [];
  if (bai === 0) lyDo.push("chưa có bài mới có ảnh — đợi nhịp poll rồi đo lại");
  if (r2Chan > 0) lyDo.push(`còn ${r2Chan} ảnh r2.dev lỗi host-not-allowed`);
  if (redirect > 0) lyDo.push(`còn ${redirect} ảnh lỗi redirect-host`);
  if (bai > 0 && r2Ok === 0) lyDo.push("chưa có ảnh r2.dev nào tải được");
  const so = `${bai} bài có ảnh · ${matHet} mất hết ảnh · r2.dev có file ${r2Ok} · r2.dev bị chặn ${r2Chan} · redirect-host ${redirect} · .jxl ${jxl}`;
  return { dat: lyDo.length === 0, so, lyDo, bai, matHet, matChiDoHost };
}

function inKetQua(k) {
  if (k.dat) console.log(`ĐẠT — ${k.so}`);
  else console.log(`KHÔNG ĐẠT — ${k.lyDo.join("; ")} (${k.so})`);
  return k.dat ? 0 : 1;
}

function pgClient() {
  const here = dirname(fileURLToPath(import.meta.url));
  const goc = resolve(here, "../../..");
  const cho = [join(goc, "app/node_modules/pg"), join(goc.replace(/\/\.claude\/worktrees\/[^/]+$/, ""), "app/node_modules/pg")];
  const p = cho.find((c) => existsSync(c));
  if (!p) throw new Error("không thấy pg trong app/node_modules");
  const { Client } = createRequire(import.meta.url)(p);
  return new Client({ connectionString: process.env.DATABASE_URL || "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
}

const BAI = `
  SELECT DISTINCT ON (post_id) post_id, posted_at, media_files FROM stg_zalo_posts
  WHERE (CASE WHEN jsonb_typeof(media)='array' THEN jsonb_array_length(media) ELSE 0 END) > 0
    AND (CASE WHEN jsonb_typeof(media_files)='array' THEN true ELSE false END)
    AND posted_at >= $1
  ORDER BY post_id, snapshot_id DESC`;

async function main(argv) {
  const i = (k) => argv.indexOf(k);
  if (i("--tu-tep") >= 0) return inKetQua(cham(JSON.parse(readFileSync(argv[i("--tu-tep") + 1], "utf8"))));
  const c = pgClient();
  await c.connect();
  try {
    if (i("--sau") >= 0) {
      const moc = new Date(argv[i("--sau") + 1]);
      if (Number.isNaN(moc.getTime())) { console.error("kiem-sau: --sau cần mốc ISO"); return 2; }
      const { rows } = await c.query(BAI, [moc]);
      return inKetQua(cham(rows));
    }
    if (i("--ty-le") >= 0) {
      const ngay = Number(i("--ngay") >= 0 ? argv[i("--ngay") + 1] : 8);
      const { rows } = await c.query(BAI, [new Date(Date.now() - ngay * 86400e3)]);
      const theoNgay = new Map();
      for (const r of rows) {
        const d = new Date(new Date(r.posted_at).getTime() + 7 * 3600e3).toISOString().slice(0, 10);
        if (!theoNgay.has(d)) theoNgay.set(d, []);
        theoNgay.get(d).push(r);
      }
      for (const [d, rs] of [...theoNgay].sort()) {
        const k = cham(rs);
        const pct = (n) => (100 * n / Math.max(k.bai, 1)).toFixed(1);
        console.log(`${d}  ${k.so}  → mất hết ${pct(k.matHet)}% · đích ZC15 (bỏ bài chỉ hỏng vì r2.dev/redirect-host) ${pct(k.matHet - k.matChiDoHost)}%`);
      }
      return 0;
    }
    console.error("kiem-sau: dùng --ty-le | --sau <ISO> | --tu-tep <rows.json>");
    return 2;
  } finally {
    await c.end();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.error(`kiem-sau: ${e.message}`); process.exit(2); });
}
