// lat-that.mjs — lay-mau-khu-trung-theo-tin E7 (AC-6): label-ghep --lam-lai thật trên bản chép lát s03-theo-nhom.
// Bản chép: db/db-thu.sh dựng oneinvest_gn2 bằng pg_dump (chỉ khoá đọc trên DB máy thu, không ghi gì ở đó). Mọi lệnh ghi chạy trên
// DB thử. Chỉ in mã thẻ, khoá đã băm và số — không in chữ bài.
// Chạy: node _acceptance/lay-mau-khu-trung-theo-tin/probes/lat-that.mjs
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PIPE = path.join(ROOT, "pipeline");
const pg = createRequire(path.join(PIPE, "package.json"))("pg");
const DB = "oneinvest_gn2_lat"; // tên riêng: lượt chấm chạy E2 và E7 song song
const URL_DB = `postgres://oneinvest:oneinvest@localhost:5433/${DB}`;
const LAT = "s03-theo-nhom";
const SO = path.join(ROOT, "_acceptance/lay-mau-khu-trung-theo-tin/decisions.jsonl");

/** Số thẻ ẩn Mạnh nhận ở Hỏi-1 (dòng gate1 mới nhất), không gõ trong probe. */
function soAnHoi1() {
  const dong = readFileSync(SO, "utf8").trim().split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter((d) => d?.stage === "gate1" && /^Hỏi-1:/.test(d.decision ?? ""));
  const m = dong.at(-1)?.decision.replace(/^Hỏi-\d+:/, "").match(/(\d+)/);
  if (!m) throw new Error("sổ chưa có câu Hỏi-1 mang số");
  return Number(m[1]);
}

let thoat = 0;
const loi = (s) => { console.log(s); thoat = 1; };
const doc = async (c) => new Map((await c.query(`SELECT item_id, ghep FROM eval_label_items WHERE lat = $1`, [LAT])).rows.map((r) => [String(r.item_id), r.ghep]));
const an = (m) => [...m].filter(([, g]) => g?.trung_voi != null);
const lenh = () => execFileSync("node", [path.join(PIPE, "label-ghep.mjs"), "--lat", LAT, "--lam-lai"], { cwd: ROOT, env: { ...process.env, DATABASE_URL: URL_DB }, encoding: "utf8" });

const N = soAnHoi1();
execFileSync("bash", [path.join(ROOT, "db/db-thu.sh"), DB], { stdio: ["ignore", "ignore", "inherit"] });
const c = new pg.Client({ connectionString: URL_DB });
await c.connect();
try {
  const truoc = await doc(c);
  const anCu = an(truoc);
  const anTay = anCu.filter(([, g]) => typeof g.an_tay === "string");
  console.log(`lat ${LAT}: ${truoc.size} the · an cu ${anCu.length} · an tay ${anTay.length}`);

  const out1 = lenh();
  const sau = await doc(c);
  const mat = anCu.filter(([id, g]) => sau.get(id)?.trung_voi !== g.trung_voi);
  if (mat.length === 0) console.log(`ok ${anCu.length} the an cu van an`); else loi(`AN CU DOI: ${mat.map(([id]) => id).join(",")}`);
  const tayMat = anTay.filter(([id, g]) => JSON.stringify(sau.get(id)) !== JSON.stringify(g));
  if (tayMat.length) loi(`AN TAY MAT: ${tayMat.length}`);
  const anSau = an(sau);
  if (anSau.length === N) console.log(`ok so the an = ${N}`); else loi(`SO THE AN LECH: ${anSau.length} (Hỏi-1: ${N})`);
  for (const l of out1.split("\n").filter((x) => x.startsWith("an them "))) console.log(l);

  const out2 = lenh();
  const sau2 = await doc(c);
  const doi = [...sau2].filter(([id, g]) => JSON.stringify(g) !== JSON.stringify(sau.get(id)));
  if (doi.length === 0 && /ghi 0\b/.test(out2)) console.log("ok lan hai khong doi"); else loi(`LAN HAI DOI: ${doi.length}`);

  // Tin canonical sẽ nghỉ vì dấu noi-dung: bài mang dấu mới thuộc tin S03 còn sống.
  const tp = await import(pathToFileURL(path.join(PIPE, "lib/test-posts.mjs")).href);
  const { rows: bai } = await c.query(`SELECT DISTINCT ON (post_id) post_id, snapshot_id, agent_id, group_name, text FROM stg_zalo_posts ORDER BY post_id, captured_at DESC`);
  const dau = new Set(bai.filter((r) => tp.testMarker(r) === "noi-dung").map((r) => r.post_id));
  const { rows: tin } = await c.query(`SELECT offer_id, post_ids FROM sale_offers WHERE source = 'S03'`);
  console.log(`tin canonical se nghi vi dau moi = ${tin.filter((t) => (t.post_ids ?? []).some((p) => dau.has(p))).length}`);

  // Chiều đỏ trên cùng bản chép: bản --lam-lai dựng lại từ đầu (không giữ dòng ẩn tay), chạy trong giao dịch rồi hoàn tác.
  const goc = path.join(PIPE, "label-ghep.mjs");
  const src = readFileSync(goc, "utf8");
  const a = "  for (const it of anTay) out.set(String(it.item_id), it.ghep_cu);\n";
  if (!src.includes(a)) throw new Error("chỗ đột biến không còn");
  const d = mkdtempSync(path.join(PIPE, ".gn2-lat-"));
  try {
    writeFileSync(path.join(d, "label-ghep.mjs"), src.replace(a, "").replace(/from "\.\/lib\/([^"]+)"/g, (_m, rel) => `from ${JSON.stringify(pathToFileURL(path.join(PIPE, "lib", rel)).href)}`)
      .replace('from "pg"', `from ${JSON.stringify(pathToFileURL(createRequire(path.join(PIPE, "package.json")).resolve("pg")).href)}`));
    const m = await import(pathToFileURL(path.join(d, "label-ghep.mjs")).href);
    await c.query("BEGIN");
    await m.ghepLat(c, { lat: LAT, lamLai: true });
    const dot = await doc(c);
    await c.query("ROLLBACK");
    const matDot = anTay.filter(([id, g]) => JSON.stringify(dot.get(id)) !== JSON.stringify(g)).length;
    if (matDot > 0) console.log(`ok doi chung do: AN TAY MAT: ${matDot}`); else loi("DOI CHUNG KHONG DO");
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
} finally {
  await c.end();
  execFileSync("bash", [path.join(ROOT, "db/db-thu.sh"), DB, "--xoa"], { stdio: ["ignore", "ignore", "inherit"] });
}
console.log(thoat === 0 ? "LAT-THAT OK" : "LAT-THAT LOI");
process.exit(thoat);
