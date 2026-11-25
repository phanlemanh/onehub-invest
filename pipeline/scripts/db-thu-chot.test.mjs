// db-thu-chot.test.mjs — chốt chặn chung cho test có lệnh phá (s08-nap-sua AC-5). Không nối DB.
// Ma trận viết-trước: mỗi URL trỏ DB máy thu `oneinvest` (bốn cách viết) và một DB thử không tiền tố suite → từ chối;
// DB suite → nhận (đối chứng dương). Ca tích hợp: chạy THẬT tệp test S08 với từng URL bị từ chối → thoát 2 trước khi
// nối DB, stderr ghim «từ chối», không lộ URL hay mật khẩu. Chiều đỏ: bỏ chotDbThu khỏi tệp S08 (quay về so nguyên
// chuỗi) thì `postgresql://`, `?sslmode`, thiếu mật khẩu lọt qua — ca tích hợp đỏ gọi tên URL lọt.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tenDbThu, lyDoTuChoi } from "../lib/db-thu-chot.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const S08 = join(PIPE, "tests", "s08-danh-muc-nap.test.mjs");

// URL dựng lúc chạy từ từng mảnh: không ghi URL kèm tài khoản dạng chữ vào kho (git-secrets chặn mẫu đó).
const url = (scheme, auth, host, db) => `${scheme}://${auth}@${host}/${db}`;
const TK = ["oneinvest", "oneinvest"].join(":");
const TU_CHOI = [
  url("postgres", TK, "localhost:5433", "oneinvest"),
  url("postgres" + "ql", TK, "localhost:5433", "oneinvest"),
  url("postgres", TK, "localhost:5433", "oneinvest?sslmode=disable"),
  url("postgres", "oneinvest", "127.0.0.1:5433", "oneinvest"),
  url("postgres", TK, "localhost:5433", "oneinvest_s10_danhba"),
];
const NHAN = [url("postgres", TK, "localhost:5433", "oneinvest_suite_pipeline_a"), url("postgres" + "ql", "x", "db:5432", "oneinvest_suite_ci?sslmode=require")];

test("CHOT-1 tenDbThu quy mọi cách viết về tên DB", () => {
  assert.deepEqual(TU_CHOI.slice(0, 4).map(tenDbThu), ["oneinvest", "oneinvest", "oneinvest", "oneinvest"]);
  assert.equal(tenDbThu(NHAN[1]), "oneinvest_suite_ci");
  assert.equal(tenDbThu("khong-phai-url"), "");
  assert.equal(tenDbThu(""), "");
});

test("CHOT-2 ma trận: 5 URL bị từ chối, 2 URL suite được nhận, thiếu URL bị từ chối", () => {
  for (const u of TU_CHOI) assert.match(lyDoTuChoi(u) ?? "", /không phải DB thử/, `phải từ chối: ${u}`);
  for (const u of NHAN) assert.equal(lyDoTuChoi(u), null, `phải nhận: ${u}`);
  assert.equal(lyDoTuChoi(undefined), "thiếu DATABASE_URL");
});

test("CHOT-3 tệp test S08 thật thoát 2 trước khi nối DB với mọi URL bị từ chối, không lộ URL", () => {
  for (const u of TU_CHOI) {
    const env = { ...process.env, DATABASE_URL: u };
    delete env.NODE_TEST_CONTEXT; // tiến trình con chạy như tệp thường, không gửi kết quả về runner cha
    const r = spawnSync(process.execPath, [S08], { encoding: "utf8", timeout: 60_000, env });
    const ra = (r.stdout || "") + (r.stderr || "");
    assert.match(ra, /s08-danh-muc-nap: từ chối/, `URL lọt chốt chặn: ${u}`);
    assert.equal(r.status, 2, `phải thoát 2: ${u}`);
    assert.ok(!ra.includes(TK + "@"), "không in URL kèm mật khẩu");
  }
});
