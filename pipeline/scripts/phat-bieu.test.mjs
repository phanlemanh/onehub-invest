// phat-bieu.test.mjs — PL15 phần không cần DB (PB-AC-n ↔ _acceptance/phat-bieu-va-phan-xu/evals.yaml E9, E19, E22):
// bộ quét ghi thẳng năm cột trên cây thật + ma trận đối chứng, ma trận chỗ gọi enrich (vai người/máy), rào cloud.
// TT-AC-n ↔ _acceptance/pb-ac-5-khong-quet-tep-tam: lời gọi quét cây thật chịu bản đột biến ẩn của test khác biến mất giữa chừng.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { filesOfTree, scanCanonicalWrite } from "../lib/scan-canonical-write.mjs";
import { CALL_SITES, findCallSites, kiemVai, readActorPrefix } from "../lib/enrich-call-sites.mjs";
import { CLOUD_ALLOW, FILL } from "../sync-cloud.mjs";
import { VOCAB } from "../lib/vocab.generated.mjs";
import { soMoc } from "../phat-bieu-cat-chuyen.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const NAM_COT = VOCAB.enrich_field;

// Test đột biến chạy song song (gia-ty-sau-khoang-trang, gia-ty-chan-dong, cam-mau-s03, gop-anh) ghi bản sao ẩn .xx-mut-*.mjs
// trong pipeline/ rồi xoá; bộ quét đọc tên trước rồi mới stat/đọc nên gặp ENOENT. Chỉ quét lại khi tệp mất là tệp ẩn —
// ENOENT tệp thường và lỗi khác ném ngay, nên lượt quét thành công vẫn đọc trọn cây thật.
export function quetChiuTepTam(fn, lan = 100) {
  for (let i = 1; ; i++) {
    try {
      return fn();
    } catch (e) {
      if (i >= lan || e?.code !== "ENOENT" || !basename(e?.path ?? "").startsWith(".")) throw e;
    }
  }
}

test("PB-AC-5 quét cây thật: không câu nào ghi thẳng năm cột vào bảng tin ngoài bộ phân xử", () => {
  const files = quetChiuTepTam(() => filesOfTree(ROOT));
  assert.ok(files.some((f) => f.path === "db/migrations/045_phat_bieu_va_phan_xu.sql"), "bộ quét không thấy 045 — phạm vi quét hỏng");
  assert.ok(files.some((f) => f.path.startsWith("app/src/")) && files.some((f) => f.path.startsWith("agent/")),
    "bộ quét thiếu app/ hoặc agent/");
  assert.deepEqual(scanCanonicalWrite(files, NAM_COT), []);
});

test("PB-AC-5 ma trận đối chứng: sáu dạng ghi thẳng viết trước đều đỏ, nêu tệp:dòng", () => {
  const MA_TRAN = [
    ["gia/a.mjs", "await c.query(`UPDATE sale_offers SET street_raw = $1 WHERE offer_id = $2`, [s, id]);", "gia/a.mjs:1 (street_raw)"],
    ["gia/b.ts", "await c.query(`INSERT INTO sale_offer_records (offer_id, bathrooms) VALUES ($1, $2)`);", "gia/b.ts:1 (bathrooms)"],
    ["gia/c.sql", "UPDATE sale_offer_records\n   SET retired_at = NULL,\n       bedrooms = 2\n WHERE offer_id = 'x';", "gia/c.sql:1 (bedrooms)"],
    ["gia/d.sh", "psql -c \"UPDATE sale_offers SET block_raw = 'A1' WHERE offer_id = 'x'\"", "gia/d.sh:1 (block_raw)"],
    ["gia/e.sql", "UPDATE sale_offer_records r SET r.property_type = 'house' FROM t WHERE r.offer_id = t.id;", "gia/e.sql:1 (property_type)"],
    ["gia/f.mjs", "q(`INSERT INTO sale_offer_records (offer_id) VALUES ($1)\n  ON CONFLICT (offer_id) DO UPDATE SET street_raw = EXCLUDED.street_raw`)", "gia/f.mjs:1 (street_raw)"],
  ];
  const hits = scanCanonicalWrite(MA_TRAN.map(([path, text]) => ({ path, text })), NAM_COT);
  assert.equal(hits.length, MA_TRAN.length, `đối chứng: ${hits.length}/${MA_TRAN.length} dạng bị bắt — ${hits.join(" · ")}`);
  for (const [, , muon] of MA_TRAN) assert.ok(hits.includes(muon), `đối chứng thiếu: ${muon}`);
  // dương: câu ghi cột khác, hay chỉ ĐỌC năm cột ở WHERE, không đỏ
  assert.deepEqual(scanCanonicalWrite([{ path: "gia/g.mjs",
    text: "q(`UPDATE sale_offer_records SET retired_at = now() WHERE bedrooms = 2`)" }], NAM_COT), []);
});

test("PB-AC-5 ENRICH_COLS: write-offers.mjs không còn xuất danh sách cột đóng băng", async () => {
  const m = await import("../lib/write-offers.mjs");
  assert.equal(m.ENRICH_COLS, undefined);
});

test("PB-AC-6 chỗ gọi: tập chỗ gọi đúng ma trận viết trước; người truyền actor 'hitl:', máy không", () => {
  const thay = quetChiuTepTam(() => findCallSites(ROOT));
  const khoa = (x) => `${x.file}|${x.fn}`;
  assert.deepEqual([...new Set(thay.map(khoa))].sort(), [...new Set(CALL_SITES.map(khoa))].sort(),
    `chỗ gọi lệch ma trận — tìm thấy: ${thay.map((x) => `${x.file}:${x.line} ${x.fn}`).join(" · ")}`);
  for (const s of thay) assert.ok(readActorPrefix(readFileSync(join(ROOT, s.file), "utf8"), s.line), `không đọc được actor — ${s.file}:${s.line}`);
  assert.deepEqual(quetChiuTepTam(() => kiemVai(ROOT)), [], "ma trận thật phải đạt");
  assert.ok(thay.length >= CALL_SITES.length);
});

test("PB-AC-6 đối chứng: ma trận đổi vai route decide sang máy thì bộ kiểm vai đỏ, nêu tệp route", () => {
  const sai = CALL_SITES.map((x) => (x.file.includes("decide/route.ts") ? { ...x, vai: "may" } : x));
  const loi = quetChiuTepTam(() => kiemVai(ROOT, sai));
  assert.ok(loi.length > 0, "đối chứng: đổi vai route sang máy mà bộ kiểm không đỏ");
  for (const l of loi) assert.match(l, /decide\/route\.ts:\d+ chỗ của máy không được truyền 'hitl:'/);
  // đối chứng thứ hai: chỗ của máy (run.ts) bị khai là người → đỏ nêu run.ts
  const sai2 = CALL_SITES.map((x) => (x.file === "agent/src/enrich/run.ts" ? { ...x, vai: "nguoi" } : x));
  assert.deepEqual(quetChiuTepTam(() => kiemVai(ROOT, sai2)).map((l) => l.split(":")[0]), ["agent/src/enrich/run.ts"]);
});

/** Vi phạm rào cloud của PL15: cột / bảng phát biểu lọt vào tập đồng bộ. */
export function cloudLeaks(allow, fill) {
  const out = [];
  if ((allow.sale_offers ?? []).includes("field_provenance")) out.push("CLOUD_ALLOW.sale_offers: field_provenance");
  if (fill.some((t) => (typeof t === "string" ? t : t?.table ?? t?.name) === "field_assertions")) out.push("FILL: field_assertions");
  return out;
}

test("PB-AC-10 cloud: nguồn gốc và bảng phát biểu không vào tập đồng bộ", () => {
  assert.deepEqual(cloudLeaks(CLOUD_ALLOW, FILL), []);
  const sai = { ...CLOUD_ALLOW, sale_offers: [...CLOUD_ALLOW.sale_offers, "field_provenance"] };
  assert.deepEqual(cloudLeaks(sai, FILL), ["CLOUD_ALLOW.sale_offers: field_provenance"]);
  assert.deepEqual(cloudLeaks(CLOUD_ALLOW, [...FILL, "field_assertions"]), ["FILL: field_assertions"]);
});

test("PB-AC-8 bộ so mốc: chỉ miễn đúng mục khai trước; mỗi biến thể đổi MỘT chiều (nguồn · trường · trước · sau) đều là lệch", () => {
  // Ma trận viết trước: hàng 0 = đúng mục KHAI_TRUOC (S05 · property_type · NULL → unknown); hàng 1–4 đổi đúng một chiều.
  const MA_TRAN = [
    ["dung-khai-truoc", "S05", "property_type", null, "unknown", "mien"],
    ["doi-nguon", "S03", "property_type", null, "unknown", "lech"],
    ["doi-truong", "S05", "street_raw", null, "unknown", "lech"],
    ["doi-truoc", "S05", "property_type", "house", "unknown", "lech"],
    ["doi-sau", "S05", "property_type", null, "house", "lech"],
  ];
  const nguon = new Map(MA_TRAN.map(([ten, n]) => [ten, n]));
  const truoc = { nguon, moc: new Map(MA_TRAN.map(([ten, , f, va]) => [`${ten}|${f}`, va])) };
  const sau = { nguon, moc: new Map(MA_TRAN.map(([ten, , f, , vb]) => [`${ten}|${f}`, vb])) };
  const r = soMoc(truoc, sau);
  let n = 0;
  for (const [ten, , f, , , ky] of MA_TRAN) {
    const lech = r.lech.some((x) => x.offer_id === ten && x.field === f);
    const mien = r.nullUnknown.includes(ten);
    assert.deepEqual([lech, mien], ky === "lech" ? [true, false] : [false, true], `ca ${ten}: phải ${ky}`);
    n++;
  }
  assert.equal(n, MA_TRAN.length);
});

// ---- TT-AC-n: lớp bọc quét cây chịu tệp ẩn biến mất (hồ sơ pb-ac-5-khong-quet-tep-tam) ----

// Tiến trình con sinh-xoá tệp ẩn trong <dir> tới khi tệp dừng xuất hiện; in số tệp đã sinh-xoá.
const SINH_XOA = `const fs = require("fs"); const [dir, dung] = process.argv.slice(1); let n = 0;
while (!fs.existsSync(dung)) { const p = dir + "/.gs-mut-" + process.pid + "-" + (n % 20) + ".mjs"; fs.writeFileSync(p, "export const x = 1\\n"); fs.rmSync(p, { force: true }); n++; }
process.stdout.write(String(n));`;

/** Gọi thẳng bộ quét tới lần ENOENT đầu tiên; trần lượt hoặc thời gian. */
function gapEnoent(fn, lan = 400, ms = 20_000) {
  const het = Date.now() + ms;
  for (let i = 0; i < lan && Date.now() < het; i++) {
    try { fn(); } catch (e) { if (e?.code === "ENOENT") return true; throw e; }
  }
  return false;
}

test("TT-AC-1 dưới tải sinh-xoá tệp ẩn: hai bộ quét qua lớp bọc không ném, đủ tệp thường; gọi thẳng thì gặp ENOENT", async () => {
  const r = mkdtempSync(join(tmpdir(), "tt-ac-1-"));
  for (const d of ["pipeline", "agent", "app/src", "scripts", "db/migrations"]) mkdirSync(join(r, d), { recursive: true });
  const THUONG = Array.from({ length: 200 }, (_, i) => `pipeline/f${i}.mjs`);
  for (const f of THUONG) writeFileSync(join(r, f), "export const x = 1;\n".repeat(20));
  const dung = join(r, "dung");
  const con = spawn(process.execPath, ["-e", SINH_XOA, join(r, "pipeline"), dung], { stdio: ["ignore", "pipe", "inherit"] });
  let dem = "";
  con.stdout.on("data", (d) => (dem += d));
  const xong = new Promise((ok) => con.on("exit", ok));
  try {
    for (let i = 0; i < 30; i++) {
      let tep;
      try {
        tep = quetChiuTepTam(() => filesOfTree(r));
        quetChiuTepTam(() => findCallSites(r));
      } catch (e) {
        assert.fail(`TT-AC-1: lớp bọc vẫn ném dưới tải sinh-xoá (${e.code} ${e.path})`);
      }
      const co = new Set(tep.map((f) => f.path));
      assert.deepEqual(THUONG.filter((f) => !co.has(f)), [], "TT-AC-1: lượt quét qua lớp bọc thiếu tệp thường");
    }
    if (!gapEnoent(() => filesOfTree(r))) assert.fail("TT-AC-1: quét trực tiếp không tái hiện ENOENT trong trần (filesOfTree)");
    if (!gapEnoent(() => findCallSites(r))) assert.fail("TT-AC-1: quét trực tiếp không tái hiện ENOENT trong trần (findCallSites)");
  } finally {
    writeFileSync(dung, "");
    await xong;
    rmSync(r, { recursive: true, force: true });
  }
  assert.ok(Number(dem) >= 200, `TT-AC-1: tải sinh-xoá không chạy (chỉ ${dem || 0} tệp)`);
  assert.equal(existsSync(r), false);
});

/** Ma trận viết trước của lớp bọc: [tên, lỗi các lần gọi (null = thành công), mong đợi]. */
function kiemLopBoc(boc) {
  const loi = (code, path) => Object.assign(new Error(`${code}: ${path}`), { code, path });
  const MA_TRAN = [
    ["ENOENT tệp thường", () => loi("ENOENT", "/x/pipeline/that.mjs"), { nem: "ENOENT", goi: 1 }],
    ["EACCES", () => loi("EACCES", "/x/pipeline/.gs-mut-1.mjs"), { nem: "EACCES", goi: 1 }],
    ["ENOENT tệp ẩn mãi", () => loi("ENOENT", "/x/pipeline/.gs-mut-1.mjs"), { nem: "ENOENT", goi: 5 }],
    ["ENOENT tệp ẩn một lần", (i) => (i === 1 ? loi("ENOENT", "/x/pipeline/.gs-mut-2.mjs") : null), { tra: "ok", goi: 2 }],
  ];
  for (const [ten, loiLan, muon] of MA_TRAN) {
    let goi = 0;
    let kq;
    let nem;
    try {
      kq = boc(() => {
        const e = loiLan(++goi);
        if (e) throw e;
        return "ok";
      }, 5);
    } catch (e) {
      nem = e.code;
    }
    if (ten === "ENOENT tệp thường" && goi !== 1) assert.fail(`TT-AC-2: ENOENT trên tệp thường bị nuốt (chạy lại ${goi} lần)`);
    assert.deepEqual(muon.tra ? { tra: kq, goi } : { nem, goi }, muon, `TT-AC-2: ca «${ten}» sai`);
  }
}

test("TT-AC-2 lớp bọc không nuốt lỗi thật: ENOENT tệp thường và lỗi khác ném ngay, tệp ẩn ném sau đúng trần; bản lỏng đỏ", () => {
  kiemLopBoc(quetChiuTepTam);
  // Chiều đỏ: bản lỏng chạy lại với mọi ENOENT.
  const long = (fn, lan = 100) => {
    for (let i = 1; ; i++) {
      try { return fn(); } catch (e) { if (i >= lan || e?.code !== "ENOENT") throw e; }
    }
  };
  assert.throws(() => kiemLopBoc(long), /TT-AC-2: ENOENT trên tệp thường bị nuốt/);
});

/** Chỗ gọi quét cây thật không nằm trong lớp bọc: [số dòng]. */
export function loiGoiKhongBoc(src) {
  const hits = [];
  let tong = 0;
  for (const m of src.matchAll(/(filesOfTree|findCallSites|kiemVai)\(ROOT/g)) {
    tong++;
    if (!src.slice(Math.max(0, m.index - 24), m.index).endsWith("quetChiuTepTam(() => ")) hits.push(src.slice(0, m.index).split("\n").length);
  }
  return { tong, hits };
}

test("TT-AC-3 mọi lời gọi quét cây thật trong tệp này đi qua lớp bọc; bỏ bọc một chỗ thì bộ soát nêu dòng", () => {
  const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const { tong, hits } = loiGoiKhongBoc(src);
  assert.ok(tong >= 4, `TT-AC-3: chỉ thấy ${tong} chỗ gọi quét cây thật — bộ soát hỏng`);
  if (hits.length) assert.fail(`TT-AC-3: lời gọi quét cây thật không qua lớp bọc — dòng ${hits.join(", ")}`);
  // Chiều đỏ: bỏ lớp bọc ở chỗ gọi quét cây của PB-AC-5.
  // Ghép chuỗi để chính dòng đột biến không khớp mẫu của bộ soát.
  const tho = "filesOf" + "Tree(ROOT)";
  const cu = `quetChiuTepTam(() => ${tho})`;
  assert.ok(src.includes(cu), "TT-AC-3: đột biến không áp được");
  const dong = src.slice(0, src.indexOf(cu)).split("\n").length;
  assert.deepEqual(loiGoiKhongBoc(src.replace(cu, tho)).hits, [dong]);
});
