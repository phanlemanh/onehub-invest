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
  const lap = chay("--lap", "--ra", tam);
  dat("lập danh sách", lap.status === 0, lap.stderr);
  const tep = path.join(tam, readdirSync(tam).find((f) => f.startsWith("pl20-doc-bu-")));
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
