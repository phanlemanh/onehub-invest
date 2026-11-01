// song-song.mjs — hồ sơ sd3-test-chiu-song-song. Postgres local :5433, mọi ghi trong giao dịch ROLLBACK, không Supabase.
//   chan (AC-1): phiên chặn A giữ khoá tư vấn 33033 + khoá dòng sale_offer_records (như ca dài của bộ app) →
//        bait-gap-sellers.test.mjs xanh 7/7 dưới 30 s; phiên chặn B giữ ACCESS EXCLUSIVE trên hai bảng nguồn 3 s rồi nhả →
//        xanh, ≥ 2,5 s (đã chờ đúng lúc DDL); bản merge-base dưới A2 → treo tới khi bị giết. Mỗi phiên chặn mở-đo-đóng, không
//        chồng nhau, lock_timeout 3 s (DB dùng chung).
//   khoa (AC-2): sau lược đồ riêng + 060 + refresh-bait-gap, phiên không giữ khoá tư vấn, không khoá nào mạnh hơn
//        ACCESS SHARE trên public, không khoá nào trên view public; mặc định nextval của bản rỗng trỏ dãy riêng.
//   assert (AC-3): thông điệp assert của tệp ở merge-base và ở HEAD bằng nhau; chỉ hai câu đọc schema trong thân ca đổi.
import { spawn, spawnSync, execFileSync } from "node:child_process";
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

// An toàn trên DB dùng chung (sự cố 01/11: một lượt `chan` bị bỏ lại giữ 33033 + khoá dòng 1 giờ, chặn sync đêm). Mọi phiên
// probe đặt hạn PHÍA MÁY CHỦ — Postgres tự huỷ giao dịch dù tiến trình này chết, bị giết hay treo — và cả tiến trình có trần.
const HAN_PHIEN = ["SET idle_in_transaction_session_timeout = '30s'", "SET statement_timeout = '60s'", "SET lock_timeout = '3s'"];
const MO = []; // mọi phiên đang mở — đóng hết ở nhánh nào cũng vậy
const moPhien = async () => {
  const k = new pg.Client({ connectionString: DB_URL });
  MO.push(k);
  await k.connect();
  for (const q of HAN_PHIEN) await k.query(q);
  return k;
};
const TRAN_PROBE_MS = 180_000;
setTimeout(() => { console.error(`PROBE VUOT TRAN ${TRAN_PROBE_MS / 1000} s — thoát, máy chủ tự huỷ giao dịch`); process.exit(3); }, TRAN_PROBE_MS).unref();

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

/** Như chay nhưng không chặn vòng sự kiện (để phiên chặn B tự nhả khoá giữa chừng). */
function chayNen(tep, tranMs) {
  const t0 = Date.now();
  return new Promise((res) => {
    const ch = spawn("node", ["--test", `--test-timeout=${tranMs}`, tep], { cwd: PIPE });
    let out = "";
    ch.stdout.on("data", (d) => (out += d));
    ch.stderr.on("data", (d) => (out += d));
    ch.on("close", (code) => res({ code, out, giay: (Date.now() - t0) / 1000 }));
  });
}

if (MODE === "chan") {
  // DB :5433 dùng chung với phiên khác — mỗi phiên chặn mở, đo, đóng ngay; không bao giờ mở hai phiên chặn chồng nhau
  // (B xin ACCESS EXCLUSIVE sẽ xếp hàng sau khoá dòng của A và chặn luôn việc của phiên khác).
  const moChan = async () => {
    const k = await moPhien();
    await k.query("BEGIN");
    await k.query("SELECT pg_advisory_xact_lock(33033)");
    await k.query(
      "UPDATE sale_offer_records SET last_seen = last_seen WHERE offer_id IN (SELECT offer_id FROM sale_offer_records LIMIT 200)");
    return k;
  };
  const dong = async (k) => { await k.query("ROLLBACK").catch(() => {}); await k.end().catch(() => {}); };
  const tamCu = path.join(PIPE, `scripts/bait-gap-sellers.cu-${process.pid}.test.mjs`);
  try {
    // Phiên chặn A: như ca dài của bộ app — giữ 33033 + khoá dòng 200 tin.
    let a = await moChan();
    console.log("# phiên chặn A: 33033 + khoá dòng 200 tin (như ca dài của bộ app)");
    const m = chay("scripts/bait-gap-sellers.test.mjs", 30_000, 60_000);
    await dong(a);
    console.log(`# bản HEAD dưới A: thoát ${m.code}, ${m.giay.toFixed(1)} s`);
    assert.equal(m.code, 0, `bản HEAD đỏ dưới phiên chặn A:\n${m.out.slice(-1500)}`);
    assert.match(m.out, /ℹ pass 7\b/, "bản HEAD không đủ 7 ca xanh");
    assert.match(m.out, /✔ SD-AC-1 đỏ/, "ca đối chứng đỏ SD-AC-1 không chạy");
    assert.ok(m.giay < 30, `bản HEAD chạy ${m.giay} s ≥ 30 s`);

    // Phiên chặn B (sau khi A đóng): ca DDL ngắn giữ ACCESS EXCLUSIVE trên hai bảng nguồn 3 s rồi nhả — bản HEAD chờ đúng lúc
    // đó (thử lại NOWAIT) rồi xanh; ≥ 2,5 s chứng nó thật sự chờ. Không lấy được khoá trong 3 s (DB bận) → dừng, không xếp hàng.
    const b = await moPhien();
    await b.query("BEGIN");
    await b.query("LOCK TABLE public.sale_offer_records, public.registry_aliases IN ACCESS EXCLUSIVE MODE")
      .catch(async (e) => { await dong(b); throw new Error(`PHIEN CHAN B KHONG LAY DUOC KHOA (DB bận): ${e.message}`); });
    const nha = setTimeout(() => dong(b), 3000);
    const kq = await chayNen("scripts/bait-gap-sellers.test.mjs", 30_000);
    clearTimeout(nha);
    await dong(b);
    console.log(`# bản HEAD dưới B (DDL 3 s): thoát ${kq.code}, ${kq.giay.toFixed(1)} s`);
    assert.equal(kq.code, 0, `bản HEAD đỏ dưới phiên chặn B:\n${kq.out.slice(-1500)}`);
    assert.ok(kq.giay >= 2.5 && kq.giay < 30, `thời gian dưới B ${kq.giay} s — không chờ hết DDL hoặc vượt trần`);

    // Đối chứng: bản merge-base dưới phiên chặn A2 phải treo (chờ 33033) tới trần — giữ 33033 ngắn nhất có thể.
    writeFileSync(tamCu, cu);
    a = await moChan();
    const c = chay(path.relative(PIPE, tamCu), 5_000, 15_000);
    await dong(a);
    console.log(`# bản merge-base dưới A2: thoát ${c.code}, ${c.giay.toFixed(1)} s, bị giết ở trần tiến trình: ${c.biGiet}`);
    assert.notEqual(c.code, 0, "DOI CHUNG KHONG BAT: bản cũ vẫn xanh dưới phiên chặn");
    assert.ok(c.biGiet || /timed out|cancelled/i.test(c.out), `bản cũ đỏ mà không vì treo:\n${c.out.slice(-800)}`);
    console.log("CHAN OK");
  } finally {
    try { unlinkSync(tamCu); } catch {}
    for (const k of MO) await dong(k);
  }
} else if (MODE === "khoa") {
  // Rút đúng khối lược đồ riêng của tệp test (không nạp tệp test — node:test sẽ chạy ca).
  const body = moi.slice(moi.indexOf("const BANG"), moi.indexOf("async function withTx"));
  assert.ok(body.includes("async function phongRieng"), "tệp test không còn phongRieng");
  const { dirname, join } = path;
  const phongRieng = new Function("readFileSync", "dirname", "join", "fileURLToPath", "importMeta", "assert",
    `${body.replace("import.meta.url", "importMeta")}; return phongRieng;`)(
    readFileSync, dirname, join, fileURLToPath, pathToFileURL(path.join(PIPE, "scripts/x.mjs")).href, assert);
  const { MIG_060 } = await import(pathToFileURL(path.join(PIPE, "lib/nap-060.mjs")).href);
  const { refreshBaitGap } = await import(pathToFileURL(path.join(PIPE, "refresh-bait-gap.mjs")).href);
  const c = await moPhien();
  try {
    await c.query("BEGIN");
    await phongRieng(c);
    await c.query(MIG_060);
    await refreshBaitGap(c);
    const manh = (await c.query(`SELECT c.relname, l.mode FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE l.pid = pg_backend_pid() AND n.nspname = 'public' AND l.mode <> 'AccessShareLock' ORDER BY 1`)).rows;
    const khoaView = (await c.query(`SELECT c.relname FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
      WHERE l.pid = pg_backend_pid() AND c.relnamespace = 'public'::regnamespace AND c.relkind = 'v'`)).rows.map((r) => r.relname);
    const tv = (await c.query(`SELECT count(*)::int AS n FROM pg_locks WHERE pid = pg_backend_pid() AND locktype = 'advisory'`)).rows[0].n;
    console.log(`# khoá mạnh hơn ACCESS SHARE trên public: ${JSON.stringify(manh)} · khoá trên view public: ${JSON.stringify(khoaView)} · khoá tư vấn: ${tv}`);
    assert.deepEqual(manh, [], "KHOA MANH TREN PUBLIC");
    assert.deepEqual(khoaView, [], "KHOA VIEW PUBLIC");
    assert.equal(tv, 0, "CON KHOA TU VAN");
    // Mặc định nextval của bản rỗng trỏ dãy trong lược đồ riêng (nextval không lùi khi ROLLBACK — dãy dùng chung sẽ nhích).
    const sc = (await c.query("SELECT current_schema() AS s")).rows[0].s;
    // Dịch biểu thức với search_path chỉ public: dãy riêng in kèm «<sc>.», dãy dùng chung in trần.
    await c.query("SET LOCAL search_path = public");
    // Lọc bảng của lược đồ riêng TRƯỚC khi deparse (OFFSET 0 chặn planner đẩy pg_get_expr lên mọi dòng pg_attrdef).
    const dayNgoai = (await c.query(
      `SELECT t, cot, md FROM (SELECT t, cot, pg_get_expr(adbin, 0) AS md FROM (
         SELECT c.relname AS t, a.attname AS cot, d.adbin FROM pg_attrdef d JOIN pg_class c ON c.oid = d.adrelid
         JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
         WHERE c.relnamespace = $1::regnamespace AND c.relkind = 'r' OFFSET 0) x) y
       WHERE md LIKE 'nextval(%' AND md NOT LIKE $2`, [sc, `nextval('${sc}.%`])).rows;
    const dayRieng = (await c.query(`SELECT count(*)::int AS n FROM pg_class WHERE relkind = 'S' AND relnamespace = $1::regnamespace`, [sc])).rows[0].n;
    console.log(`# lược đồ ${sc}: dãy riêng ${dayRieng} · mặc định trỏ dãy ngoài: ${JSON.stringify(dayNgoai)}`);
    assert.ok(dayRieng >= 2, "không thấy dãy riêng — phép đo dãy mù");
    assert.deepEqual(dayNgoai, [], "DAY DUNG CHUNG");
    const kind = (await c.query("SELECT relkind FROM pg_class WHERE oid = to_regclass('public.sellers')")).rows[0]?.relkind;
    console.log(`# public.sellers relkind lúc đo: ${kind}`);
    // Đối chứng: cùng phiên lấy một khoá tư vấn (khoá riêng, không tranh 33033 của phiên khác) thì phép đếm thấy — không mù.
    await c.query("SELECT pg_advisory_xact_lock($1)", [990_000 + (process.pid % 1000)]);
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
  // Câu đọc schema trong thân ca: merge-base đọc 'public', HEAD đọc lược đồ riêng — đúng hai chỗ (khối lược đồ riêng đọc
  // catalog public để chép, không tính).
  const thanCa = (s) => s.slice(s.indexOf("const bam = "));
  const docPublic = (s) => (thanCa(s).match(/'public'(::regnamespace)?/g) ?? []).length;
  assert.equal(docPublic(cu) - docPublic(moi), 2, `số câu đọc schema public trong thân ca đổi ${docPublic(cu)} → ${docPublic(moi)}`);
  // Đối chứng đỏ: bản HEAD xoá một thông điệp → bộ so bắt.
  assert.throws(() => assert.deepEqual(thongDiep(moi.replace("SD-AC-7 có người mà vẫn báo thiếu", "x")), a, "THONG DIEP ASSERT DOI"),
    /THONG DIEP ASSERT DOI/);
  console.log("ASSERT OK");
} else {
  console.error("dùng: song-song.mjs chan|khoa|assert");
  process.exit(2);
}
