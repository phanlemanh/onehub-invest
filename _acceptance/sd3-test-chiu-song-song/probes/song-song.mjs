// song-song.mjs — hồ sơ sd3-test-chiu-song-song. Postgres local :5433, mọi ghi trong giao dịch ROLLBACK, không Supabase.
//   chan (AC-1): một phiên giữ khoá tư vấn 33033 + khoá dòng sale_offer_records (giao dịch mở, như ca dài của bộ app) →
//        bait-gap-sellers.test.mjs xanh 7/7 trong trần 30 s; bản của merge-base dưới cùng phiên chặn → vượt trần.
//   khoa (AC-2): sau lược đồ riêng + 060 + refresh-bait-gap, phiên không giữ khoá tư vấn, không khoá nào mạnh hơn
//        ACCESS SHARE trên public.
//   assert (AC-3): thông điệp assert của tệp ở merge-base và ở HEAD bằng nhau; chỉ hai câu đọc schema đổi.
import { spawnSync, execFileSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PIPE = path.join(ROOT, "pipeline");
const TEP = "pipeline/scripts/bait-gap-sellers.test.mjs";
const pg = createRequire(path.join(PIPE, "package.json"))("pg");
const DB_URL = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const MODE = process.argv[2];

const base = execFileSync("git", ["merge-base", "origin/main", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
const moi = readFileSync(path.join(ROOT, TEP), "utf8");
const cu = execFileSync("git", ["show", `${base}:${TEP}`], { cwd: ROOT, encoding: "utf8" });
assert.notEqual(cu, moi, "tệp test chưa đổi so merge-base");

/** Chạy một tệp test bằng node --test với trần mỗi ca, cả tiến trình bị giết sau `tranTienTrinhMs`;
 * trả { code, giay, out, biGiet }. Tiến trình treo (kết nối DB còn chờ khoá) không in gì trước khi bị giết. */
function chay(tep, tranMs, tranTienTrinhMs) {
  const t0 = Date.now();
  const r = spawnSync("node", ["--test", `--test-timeout=${tranMs}`, tep], { cwd: PIPE, encoding: "utf8", timeout: tranTienTrinhMs });
  return { code: r.status, giay: (Date.now() - t0) / 1000, out: `${r.stdout ?? ""}${r.stderr ?? ""}`, biGiet: r.signal != null || r.error?.code === "ETIMEDOUT" };
}

if (MODE === "chan") {
  const chan = new pg.Client({ connectionString: DB_URL });
  await chan.connect();
  const tamCu = path.join(PIPE, `scripts/bait-gap-sellers.cu-${process.pid}.test.mjs`);
  try {
    await chan.query("BEGIN");
    await chan.query("SELECT pg_advisory_xact_lock(33033)");
    const { rowCount } = await chan.query(
      "UPDATE sale_offer_records SET last_seen = last_seen WHERE offer_id IN (SELECT offer_id FROM sale_offer_records LIMIT 200)");
    console.log(`# phiên chặn: giữ 33033 + ${rowCount} khoá dòng sale_offer_records`);
    const m = chay("scripts/bait-gap-sellers.test.mjs", 30_000, 120_000);
    console.log(`# bản HEAD: thoát ${m.code}, ${m.giay.toFixed(1)} s`);
    assert.equal(m.code, 0, `bản HEAD đỏ dưới phiên chặn:\n${m.out.slice(-1500)}`);
    assert.match(m.out, /ℹ pass 7\b/, "bản HEAD không đủ 7 ca xanh");
    assert.match(m.out, /✔ SD-AC-1 đỏ/, "ca đối chứng đỏ SD-AC-1 không chạy");
    assert.ok(m.giay < 30, `bản HEAD chạy ${m.giay} s ≥ 30 s`);
    // Đối chứng: bản merge-base dưới cùng phiên chặn phải vượt trần (treo chờ 33033).
    writeFileSync(tamCu, cu);
    const c = chay(path.relative(PIPE, tamCu), 10_000, 40_000);
    console.log(`# bản merge-base: thoát ${c.code}, ${c.giay.toFixed(1)} s, bị giết ở trần tiến trình: ${c.biGiet}`);
    assert.notEqual(c.code, 0, "DOI CHUNG KHONG BAT: bản cũ vẫn xanh dưới phiên chặn");
    assert.ok(c.biGiet || /timed out|cancelled/i.test(c.out), `bản cũ đỏ mà không vì treo:\n${c.out.slice(-800)}`);
    console.log("CHAN OK");
  } finally {
    try { unlinkSync(tamCu); } catch {}
    await chan.query("ROLLBACK").catch(() => {});
    await chan.end();
  }
} else if (MODE === "khoa") {
  // Rút đúng phongRieng của tệp test (không nạp tệp test — node:test sẽ chạy ca).
  const body = moi.slice(moi.indexOf("const BANG"), moi.indexOf("async function withTx"));
  assert.ok(body.includes("async function phongRieng"), "tệp test không còn phongRieng");
  const { dirname, join } = path;
  const phongRieng = new Function("readFileSync", "dirname", "join", "fileURLToPath", "importMeta",
    `${body.replace("import.meta.url", "importMeta")}; return phongRieng;`)(
    readFileSync, dirname, join, fileURLToPath, pathToFileURL(path.join(PIPE, "scripts/x.mjs")).href);
  const { MIG_060 } = await import(pathToFileURL(path.join(PIPE, "lib/nap-060.mjs")).href);
  const { refreshBaitGap } = await import(pathToFileURL(path.join(PIPE, "refresh-bait-gap.mjs")).href);
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await phongRieng(c);
    await c.query(MIG_060);
    await refreshBaitGap(c);
    const manh = (await c.query(`SELECT c.relname, l.mode FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE l.pid = pg_backend_pid() AND n.nspname = 'public' AND l.mode <> 'AccessShareLock' ORDER BY 1`)).rows;
    const tv = (await c.query(`SELECT count(*)::int AS n FROM pg_locks WHERE pid = pg_backend_pid() AND locktype = 'advisory'`)).rows[0].n;
    console.log(`# khoá mạnh hơn ACCESS SHARE trên public: ${JSON.stringify(manh)} · khoá tư vấn: ${tv}`);
    assert.deepEqual(manh, [], "KHOA MANH TREN PUBLIC");
    assert.equal(tv, 0, "CON KHOA TU VAN");
    // Đối chứng: cùng phiên lấy 33033 thì phép đếm thấy — phép đo không mù.
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    const tv2 = (await c.query(`SELECT count(*)::int AS n FROM pg_locks WHERE pid = pg_backend_pid() AND locktype = 'advisory'`)).rows[0].n;
    assert.equal(tv2, 1, "DOI CHUNG KHONG BAT: phép đếm khoá tư vấn mù");
    console.log("KHOA OK");
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
} else if (MODE === "assert") {
  /** Thông điệp assert: chuỗi nháy kép/backtick mở đầu bằng mã ca, và regex trong assert.rejects. */
  const thongDiep = (s) => [...s.matchAll(/["`]((?:SD-AC|SD3|AC-7)[^"`]*)["`]|rejects\([^)]*?\/([^/]+)\//g)]
    .map((m) => m[1] ?? m[2]).sort();
  const a = thongDiep(cu), b = thongDiep(moi);
  console.log(`# thông điệp assert: merge-base ${a.length} · HEAD ${b.length}`);
  assert.ok(a.length >= 10, "đọc được quá ít thông điệp — bộ rút hỏng");
  assert.deepEqual(b, a, "THONG DIEP ASSERT DOI");
  // Câu đọc schema: merge-base đọc 'public', HEAD đọc lược đồ riêng — đúng hai chỗ, không chỗ nào khác.
  const docPublic = (s) => (s.match(/'public'(::regnamespace)?/g) ?? []).length;
  assert.equal(docPublic(cu) - docPublic(moi), 2, `số câu đọc schema public đổi ${docPublic(cu)} → ${docPublic(moi)}`);
  // Đối chứng đỏ: bản HEAD xoá một thông điệp → bộ so bắt.
  assert.throws(() => assert.deepEqual(thongDiep(moi.replace("SD-AC-7 có người mà vẫn báo thiếu", "x")), a, "THONG DIEP ASSERT DOI"),
    /THONG DIEP ASSERT DOI/);
  console.log("ASSERT OK");
} else {
  console.error("dùng: song-song.mjs chan|khoa|assert");
  process.exit(2);
}
