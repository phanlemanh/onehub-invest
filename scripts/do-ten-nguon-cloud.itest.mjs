// do-ten-nguon-cloud.itest.mjs — HT26 E6 (AC-6) vòng 2: câu SQL lệnh đo gửi cloud CHẠY THẬT trên Postgres của lượt, không qua cloud giả
// trả dòng viết tay. Chạy dưới `bash db/db-thu.sh oneinvest_suite_scc6 --chay-trong node --test scripts/do-ten-nguon-cloud.itest.mjs`
// (cụm PostGIS dùng một lần, DB trống từ migration). Hai bảng mang tên cloud được dựng trong DB ấy; exec nhận ĐÚNG chuỗi doCloud gửi
// («BEGIN READ ONLY; SELECT …; COMMIT;») và chạy nguyên chuỗi đó — câu catalog `ANY(ARRAY[…])`, câu khoá chính pg_index, câu trang
// keyset theo bộ khoá, LIMIT, chuyển OFFSET khi khoá mang tên nguồn. Số đếm kỳ vọng tính độc lập từ chính dòng cấy. Tên nguồn BỊA.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { test, before, after } from "node:test";
import { fileURLToPath } from "node:url";
import { doCloud } from "./do-ten-nguon-cloud.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(REPO, "pipeline/package.json"))("pg");
const DB = process.env.DATABASE_URL;
const choChay = DB && /\/oneinvest_suite_[a-z0-9_]+(\?|$)/.test(DB) ? {} : { skip: "cần DATABASE_URL của DB thử oneinvest_suite_* (db/db-thu.sh --chay-trong)" };

const BIA = [
  { code: "S97", realName: "Nguonbia Kappa", wholeOnly: true },
  { code: "S97", realName: "nguonbiakappa.example", wholeOnly: true },
  { code: "S95", realName: "Kap", wholeOnly: false },
];
const N = 450; // > 2 trang đầu (limit 200) để câu keyset thật sự chạy
let c;
let cau = [];

/** exec như Management API: nhận chuỗi đã bọc, chạy NGUYÊN chuỗi (nhiều câu), trả dòng của câu SELECT. */
async function exec(sql) {
  cau.push(sql);
  const kq = await c.query(sql);
  const r = (Array.isArray(kq) ? kq : [kq]).find((x) => x.command === "SELECT");
  assert.ok(r, "câu gửi phải có một SELECT");
  return r.rows;
}

before(async () => {
  if (choChay.skip) return;
  c = new pg.Client({ connectionString: DB });
  await c.connect();
  await c.query(`DROP TABLE IF EXISTS public.ref_calib_scc6, public.ref_calib_scc6k;
    CREATE TABLE public.ref_calib_scc6 (id text PRIMARY KEY, title text, metrics jsonb, photo_urls text[], n int);
    CREATE TABLE public.ref_calib_scc6k (a text, b int, ghi_chu text, PRIMARY KEY (a, b));`);
  // Dòng i: tiêu đề trúng khi i % 7 = 0; metrics có khoá tên miền khi i % 11 = 0; ảnh trúng khi i % 13 = 0; «Kap» đứng riêng khi i % 17 = 0.
  for (let i = 0; i < N; i++) {
    const id = `k${String(i).padStart(4, "0")}`;
    const title = i % 7 === 0 ? `Căn ${i} trên Nguonbia Kappa` : i % 17 === 0 ? `Kapital và Kap ${i}` : `sạch ${i}`;
    const metrics = i % 11 === 0 ? { "nguonbiakappa.example": i, gia: 1.25 } : { gia: i };
    const photos = i % 13 === 0 ? [`https://cdn.nguonbiakappa.example/${i}.jpg`] : [`https://anh.example/${i}.jpg`];
    await c.query("INSERT INTO public.ref_calib_scc6 VALUES ($1, $2, $3, $4, $5)", [id, title, metrics, photos, i]);
  }
  // Bảng khoá ghép, dòng rộng (~10 KB) để trang sau trang đầu nhỏ (~140 dòng): trang 2 là keyset theo bộ khoá (sau «a0199»); khoá
  // mang tên nguồn từ dòng 250 (xếp sau «a…») → dòng cuối trang 2 mang tên nguồn, câu kế tiếp không được mang nó, lệnh chuyển OFFSET.
  const dem = "x".repeat(10_000);
  for (let i = 0; i < 600; i++) {
    const a = i >= 250 ? `nguonbia kappa-${i}` : `a${String(i).padStart(4, "0")}`;
    await c.query("INSERT INTO public.ref_calib_scc6k VALUES ($1, $2, $3)", [a, i % 3, (i % 5 === 0 ? `ghi Nguonbia Kappa ${i} ` : `ghi ${i} `) + dem]);
  }
});

after(async () => {
  if (c) await c.end();
});

test("SCC-6R: câu đo chạy thật trên Postgres của lượt — đếm đúng, mọi câu là SELECT trong giao dịch chỉ đọc", choChay, async () => {
  cau = [];
  const r = await doCloud({ exec, entries: BIA, fill: ["airdna_scc6", "airdna_scc6k"] });
  const dem = (f) => Array.from({ length: N }, (_, i) => i).filter(f).length;
  assert.deepEqual(r.kq, {
    "ref_calib_scc6.id": { cloud: 0, thoCloud: 0 },
    "ref_calib_scc6.title": { cloud: dem((i) => i % 7 === 0 || i % 17 === 0), thoCloud: dem((i) => i % 7 === 0 || i % 17 === 0) },
    "ref_calib_scc6.metrics": { cloud: dem((i) => i % 11 === 0), thoCloud: dem((i) => i % 11 === 0) },
    "ref_calib_scc6.photo_urls": { cloud: dem((i) => i % 13 === 0), thoCloud: dem((i) => i % 13 === 0) },
    "ref_calib_scc6k.a": { cloud: 350, thoCloud: 350 },
    "ref_calib_scc6k.ghi_chu": { cloud: 120, thoCloud: 120 },
  }, "SCC-6R số ô theo bảng.cột trên Postgres thật");
  assert.ok(cau.every((s) => /^BEGIN READ ONLY; SELECT [\s\S]+; COMMIT;$/.test(s)), "SCC-6R: câu không bọc giao dịch chỉ đọc");
  const trang = cau.filter((s) => s.includes('FROM public."ref_calib_scc6"'));
  assert.ok(trang.length >= 2 && trang.slice(1).every((s) => /WHERE \("id"\) > \('k\d{4}'\)/.test(s)), "SCC-6R: bảng một khoá phải phân trang keyset thật");
  const trangK = cau.filter((s) => s.includes('FROM public."ref_calib_scc6k"'));
  assert.ok(trangK.some((s) => /WHERE \("a", "b"\) > \(/.test(s)), "SCC-6R: bảng khoá ghép phải có câu keyset theo bộ khoá");
  assert.ok(trangK.some((s) => / OFFSET \d+$/.test(s.replace(/; COMMIT;$/, ""))), "SCC-6R: khoá mang tên nguồn phải chuyển OFFSET");
  assert.ok(cau.every((s) => !/nguonbia/i.test(s.replace(/"[^"]*"/g, ""))), "SCC-6R: câu gửi mang tên nguồn");
});

test("SCC-6R: chiều đỏ — giao dịch chỉ đọc của Postgres thật chặn câu ghi lọt vào exec", choChay, async () => {
  await assert.rejects(c.query("BEGIN READ ONLY; DELETE FROM public.ref_calib_scc6; COMMIT;"), /read-only transaction/);
  await c.query("ROLLBACK").catch(() => {});
  const { rows } = await c.query("SELECT count(*)::int AS n FROM public.ref_calib_scc6");
  assert.equal(rows[0].n, N, "SCC-6R: dòng bị xoá qua giao dịch chỉ đọc");
});

test("SCC-6R: chiều đỏ — câu trang hỏng cú pháp thì chính Postgres từ chối (cloud giả cũ trả dòng viết tay vẫn xanh)", choChay, async () => {
  const { cauTrang } = await import("./do-ten-nguon-cloud.mjs");
  const hong = (ct, pk, cols, o) => cauTrang(ct, pk, cols, o).replace(" ORDER BY ", " ORDER BYY ");
  await assert.rejects(doCloud({ exec, entries: BIA, fill: ["airdna_scc6"], cauTrangImpl: hong }), /syntax error/);
  await c.query("ROLLBACK").catch(() => {});
  const khoaSai = (ct, pk, cols, o) => cauTrang(ct, pk, cols, o).replace(/WHERE \(("id")\) > \(('k\d{4}')\)/, "WHERE ($1) > ($2, 0)");
  await assert.rejects(doCloud({ exec, entries: BIA, fill: ["airdna_scc6"], cauTrangImpl: khoaSai }), /operator does not exist/);
  await c.query("ROLLBACK").catch(() => {});
});
