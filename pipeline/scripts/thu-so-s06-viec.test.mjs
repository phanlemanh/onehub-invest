// Danh sách việc của bộ thu số S06 (hop-dong-nguoi-ban-s06): mỗi tài khoản một lần, tin ẩn số không vào việc,
// không lấy mẫu mặc định, không còn pha 2. Chạy tiến trình thật với --minutes 0: đo xong thoát trước khi mở
// trình duyệt, không gọi nguồn. Lược đồ riêng do test dựng rồi xoá; tiến trình con đọc qua search_path.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const TEP = join(dirname(fileURLToPath(import.meta.url)), "..", "thu-so-s06.mjs");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const CO_SO = { phone: "+84900000001" };

function chay(thamSo, { url = DB_URL, base = "http://khong-dung.invalid" } = {}) {
  const env = { ...process.env, DATABASE_URL: url };
  if (base) env.S06_WEB_BASE = base;
  else delete env.S06_WEB_BASE;
  return spawnSync(process.execPath, [TEP, ...thamSo], { env, encoding: "utf8", timeout: 60_000 });
}

/** Dựng stg riêng, gieo dòng, chạy đo số việc, luôn xoá lược đồ. */
async function doSoViec(dong, thamSo = []) {
  const luocDo = `thu_so_viec_${process.pid}_${Date.now()}`;
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query(`CREATE SCHEMA ${luocDo}`);
    await c.query(`CREATE TABLE ${luocDo}.stg_chotot_ads (
      list_id bigint PRIMARY KEY, list_time timestamptz, area_name text, ad_type text,
      city_code text, seller jsonb, payload jsonb)`);
    for (const [i, d] of dong.entries()) {
      await c.query(
        `INSERT INTO ${luocDo}.stg_chotot_ads (list_id, list_time, area_name, ad_type, seller, payload)
         VALUES ($1, $2, 'Khu thử', 's', $3, $4)`,
        [
          d.id,
          new Date(Date.UTC(2026, 10, 1, i)).toISOString(),
          JSON.stringify(d.seller ?? {}),
          JSON.stringify({ account_id: d.tk, region_name: "Vùng thử", ...(d.an ? { phone_hidden: "true" } : {}) }),
        ],
      );
    }
    const url = new URL(DB_URL);
    url.searchParams.set("options", `-c search_path=${luocDo},public`);
    const r = chay(["--phase", "1", "--minutes", "0", ...thamSo], { url: url.toString() });
    assert.equal(r.status, 0, r.stderr);
    const m = r.stdout.match(/\[đo\] việc pha 1 còn lại: (\d+)/);
    assert.ok(m, "phải in dòng đo số việc");
    return Number(m[1]);
  } finally {
    await c.query(`DROP SCHEMA IF EXISTS ${luocDo} CASCADE`);
    await c.end();
  }
}

test("tài khoản đã có số ở tin KHÁC tin mới nhất không vào việc", async () => {
  // Tin 9001 cũ hơn có số, tin 9002 mới nhất chưa có: đúng ca đo được 542 tài khoản trên dữ liệu thật
  const n = await doSoViec([
    { id: 9001, tk: "a", seller: CO_SO },
    { id: 9002, tk: "a" },
  ]);
  assert.equal(n, 0);
});

test("đối chứng: tài khoản chưa có số vào việc đúng một lần dù có nhiều tin", async () => {
  const n = await doSoViec([
    { id: 9101, tk: "b" },
    { id: 9102, tk: "b" },
    { id: 9103, tk: "c" },
  ]);
  assert.equal(n, 2);
});

test("tin ẩn số không vào việc", async () => {
  const n = await doSoViec([
    { id: 9201, tk: "d", an: true },
    { id: 9202, tk: "e" },
  ]);
  assert.equal(n, 1);
});

test("mặc định không lấy mẫu; --mau N tường minh mới thêm tin thứ hai", async () => {
  const dong = [
    { id: 9301, tk: "f" },
    { id: 9302, tk: "f" },
  ];
  assert.equal(await doSoViec(dong), 1);
  assert.equal(await doSoViec(dong, ["--mau", "1"]), 2);
});

test("pha 2 đã bỏ: thoát khác 0, không chạy", () => {
  const r = chay(["--phase", "2", "--minutes", "0"]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /pha 2 đã bỏ/);
});

test("--threads lớn hơn 2: thoát 1; 2 luồng vẫn qua được bước kiểm", () => {
  const r = chay(["--phase", "1", "--threads", "3", "--minutes", "0"]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /--threads > 2 không được duyệt/);
  const hai = chay(["--phase", "1", "--threads", "2", "--minutes", "0"], { base: null });
  assert.match(hai.stderr, /thiếu env S06_WEB_BASE/, "2 luồng phải đi qua trần, dừng ở bước kiểm env");
});

test("thiếu S06_WEB_BASE: thoát khác 0, không có miền mặc định", () => {
  const r = chay(["--phase", "1", "--minutes", "0"], { base: null });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /thiếu env S06_WEB_BASE/);
});

test("mã thu và tài liệu mới không chứa URL ngoài máy (miền nguồn chỉ ở env)", () => {
  const goc = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  for (const tep of ["pipeline/thu-so-s06.mjs", "pipeline/bu-seller-v5.mjs", "collector/docs/seller-thu-so-phuong-an.md"]) {
    const ngoai = readFileSync(join(goc, tep), "utf8").match(/https?:\/\/(?!localhost|127\.0\.0\.1)[^\s"'`)]+/g) ?? [];
    assert.equal(ngoai.length, 0, `${tep} có ${ngoai.length} URL ngoài máy`);
  }
});
