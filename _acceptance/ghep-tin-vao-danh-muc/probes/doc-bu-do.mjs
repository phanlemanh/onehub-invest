// doc-bu-do.mjs — E11 (AC-10), chạy dưới db/db-thu.sh trên bản chép: danh sách đúng thì xanh; cấy sai thì lệnh kiểm phải đỏ và ghim đúng mã bài.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = createRequire(`${ROOT}/pipeline/package.json`)("pg");
const { docDauVao, tinhGan } = await import(`${ROOT}/pipeline/lib/ghep-tin-danh-muc-doc.mjs`);
const { dongBangDanhSach } = await import(`${ROOT}/pipeline/scripts/ghep-tin-danh-muc-doc-bu.mjs`);
const URL_DB = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(URL_DB)) { console.error("doc-bu-do: chỉ chạy trên DB oneinvest_suite_*"); process.exit(2); }

const LENH = `${ROOT}/pipeline/scripts/ghep-tin-danh-muc-doc-bu.mjs`;
const chay = (...a) => spawnSync(process.execPath, [LENH, ...a], { encoding: "utf8", env: process.env });
const dat = (ten, dk, them = "") => { if (!dk) { console.error(`ĐỎ: ${ten} ${them}`); process.exit(1); } console.log(`đạt: ${ten}`); };
const tam = mkdtempSync(path.join(tmpdir(), "pl20-doc-bu-"));
const c = new pg.Client({ connectionString: URL_DB });
await c.connect();
try {
  // Lượt 2 đo trên bản chép đã gỡ bản đọc của chính lượt đó, để danh sách không rỗng.
  await c.query(`DELETE FROM silver_labels WHERE run_id = 'pl20-doc-bu-2'`);
  const tam2 = path.join(tam, "v2"); 
  const lap2 = chay("--lap", "--vong", "2", "--ra", tam2);
  dat("lượt 2: lập danh sách", lap2.status === 0, lap2.stderr);
  const tep2 = path.join(tam2, readdirSync(tam2).find((f) => f.startsWith("pl20-doc-bu-v2-")));
  const goc2 = JSON.parse(readFileSync(tep2, "utf8"));
  dat("lượt 2: danh sách có bài", goc2.so_bai > 0);
  const kiem2 = chay("--kiem", tep2, "--vong", "2");
  dat("lượt 2: danh sách đúng thì xanh", kiem2.status === 0, kiem2.stderr);
  const v2 = await docDauVao(c), k2 = tinhGan(v2);
  const gan2 = v2.tin.find((t) => k2.theoTin.get(t.offer_id)?.status === "gan" && (t.post_ids ?? []).some((p) => v2.bai.has(p)));
  const bai2 = gan2.post_ids.find((p) => v2.bai.has(p));
  const f2 = path.join(tam2, "cay.json"); writeFileSync(f2, JSON.stringify(dongBangDanhSach([...goc2.post_ids, bai2])));
  const r2c = chay("--kiem", f2, "--vong", "2");
  dat("lượt 2: cấy tin đã gắn thì đỏ, ghim mã bài", r2c.status === 1 && r2c.stderr.includes(`tin-da-gan ${bai2}`), r2c.stderr.slice(0, 300));

  // Lượt 1 đo trên bản chép đã gỡ bản đọc của cả hai lượt.
  await c.query(`DELETE FROM silver_labels WHERE run_id LIKE 'pl20-doc-bu%'`);
  const lap = chay("--lap", "--ra", tam);
  dat("lập danh sách", lap.status === 0, lap.stderr);
  const tep = path.join(tam, readdirSync(tam).find((f) => /^pl20-doc-bu-[0-9a-f]/.test(f)));
  const goc = JSON.parse(readFileSync(tep, "utf8"));
  dat("danh sách có bài", goc.so_bai > 0);
  const kiem = chay("--kiem", tep);
  dat("danh sách đúng thì xanh", kiem.status === 0, kiem.stderr);

  const vao = await docDauVao(c);
  const { theoTin } = tinhGan(vao);
  const tinGan = vao.tin.filter((t) => theoTin.get(t.offer_id)?.status === "gan" && (t.post_ids ?? []).some((p) => vao.bai.has(p)));
  const baiGan = tinGan[0].post_ids.find((p) => vao.bai.has(p));
  const cay = (ten, ids) => { const f = path.join(tam, `${ten}.json`); writeFileSync(f, JSON.stringify(dongBangDanhSach(ids))); return chay("--kiem", f); };

  const r1 = cay("cay-tin-da-gan", [...goc.post_ids, baiGan]);
  dat("cấy tin đã gắn thì đỏ, ghim mã bài", r1.status === 1 && r1.stderr.includes(`tin-da-gan ${baiGan}`), r1.stderr.slice(0, 300));

  const baiThu = tinGan[1].post_ids.find((p) => vao.bai.has(p));
  await c.query(`UPDATE stg_zalo_posts SET text = coalesce(text, '') || ' trycloudflare.com' WHERE post_id = $1`, [baiThu]);
  const r2 = cay("cay-bai-thu", [...goc.post_ids, baiThu]);
  dat("cấy bài thử thì đỏ, ghim mã bài", r2.status === 1 && r2.stderr.includes(`bai-thu ${baiThu}`), r2.stderr.slice(0, 300));

  const r3 = cay("cay-hai-bai-cung-tin", [...goc.post_ids.slice(1), goc.post_ids[0], ...vao.tin.find((t) => t.post_ids?.includes(goc.post_ids[0])).post_ids.filter((p) => p !== goc.post_ids[0]).slice(0, 1)]);
  const coHai = vao.tin.find((t) => t.post_ids?.includes(goc.post_ids[0])).post_ids.length > 1;
  if (coHai) dat("hai bài cùng tin thì đỏ", r3.status === 1 && r3.stderr.includes("hai-bai-cung-tin"), r3.stderr.slice(0, 300));

  const ghiDoc = (post, usd, run) => c.query(
    `INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, probabilities, json_ok, cost_usd, run_id)
     VALUES ('S03', $1, md5($1 || $3), 'pl20-thu', 'pl20-thu', 'unknown', '{}'::jsonb, true, $2, $3)`, [post, usd, run]);
  await ghiDoc(goc.post_ids[0], 0.01, "pl20-thu-xanh");
  const x1 = chay("--sau-doc", tep, "--run-id", "pl20-thu-xanh", "--tran-usd", "5");
  dat("sau đọc đúng thì xanh", x1.status === 0, x1.stderr);
  await ghiDoc(goc.post_ids[0], 9, "pl20-thu-tran");
  const x2 = chay("--sau-doc", tep, "--run-id", "pl20-thu-tran", "--tran-usd", "5");
  dat("vượt trần thì đỏ", x2.status === 1 && x2.stderr.includes("vuot-tran"), x2.stderr);
  await ghiDoc(baiGan, 0.01, "pl20-thu-ngoai");
  const x3 = chay("--sau-doc", tep, "--run-id", "pl20-thu-ngoai", "--tran-usd", "5");
  dat("dòng ngoài danh sách thì đỏ, ghim mã bài", x3.status === 1 && x3.stderr.includes(`ngoai-danh-sach ${baiGan}`), x3.stderr);
  console.log("XANH: danh sách đọc bù và các chiều đỏ");
} finally {
  await c.end();
  rmSync(tam, { recursive: true, force: true });
}
