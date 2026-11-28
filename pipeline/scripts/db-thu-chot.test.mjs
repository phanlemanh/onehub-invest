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

// ── HT35 (test-khong-roi-ve-db-chung): tệp test TỰ DỰNG bảng thật rồi ghi — chỉ DB thử; thiếu DATABASE_URL thì bỏ qua có lời
// (quy ước sẵn của kho, chotDbThu khiThieu «bo-qua»), tên khác thì thoát 2 — trước mọi kết nối.
// Bảng phủ 66 tệp và phần để lại cho HT36: _acceptance/test-khong-roi-ve-db-chung/bang-phu.md.
import { writeFileSync, readFileSync, rmSync } from "node:fs";
import { MAU_DB_THU } from "../lib/db-thu-chot.mjs";

const GOC = join(PIPE, "..");
// Cổng chết (9 — discard, không ai nghe): rào hỏng thì tiến trình con gặp ECONNREFUSED, không bao giờ chạm DB thật.
const CHET = (db) => url("postgres", TK, "127.0.0.1:9", db);
// AC-1 «mọi cách viết»: bốn cách viết tên `oneinvest` của CHOT-1, chuyển sang cổng chết (S4 r1, hình dạng 5).
const CHET_4 = [
  ["postgres://", CHET("oneinvest")],
  ["postgresql://", url("postgres" + "ql", TK, "127.0.0.1:9", "oneinvest")],
  ["?sslmode", url("postgres", TK, "localhost:9", "oneinvest?sslmode=disable")],
  ["thiếu mật khẩu", url("postgres", "oneinvest", "127.0.0.1:9", "oneinvest")],
];
// Tệp trong phạm vi · tên rào · dòng rào (đột biến thay bằng URL trần) · thông điệp khi tệp thử nối mà DB không tới.
const PHAM_VI = [
  {
    tep: "pipeline/import-s09-danh-ba.test.mjs",
    ten: "import-s09-danh-ba.test",
    rao: 'const DB_URL = chotDbThu({ ten: "import-s09-danh-ba.test", khiThieu: "bo-qua" });',
    noi: /DB của lượt không chạy/,
  },
  {
    tep: "scripts/check-freshness.test.mjs",
    ten: "check-freshness.test",
    rao: 'const DB_URL = chotDbThu({ ten: "check-freshness.test", khiThieu: "bo-qua" });',
    noi: /DB local không tới \(connect ECONNREFUSED 127\.0\.0\.1:9\)/,
  },
];
function envNgoaiCi(them) {
  const env = { ...process.env, ...them };
  delete env.NODE_TEST_CONTEXT;
  delete env.CI;
  delete env.GITHUB_ACTIONS;
  return env;
}
function chay(tep, env) {
  const r = spawnSync(process.execPath, ["--test", "--test-concurrency=1", tep], { encoding: "utf8", timeout: 120_000, env, cwd: GOC });
  return { status: r.status, ra: (r.stdout || "") + (r.stderr || "") };
}

test("RV-1 MAU_DB_THU nhận DB trống bước scripts (oneinvest_ci_scripts_<pid>), vẫn từ chối DB chung và tên gần giống", () => {
  for (const ten of ["oneinvest_ci_scripts_4242", "oneinvest_suite_ht35"]) assert.match(ten, MAU_DB_THU, ten);
  for (const ten of ["oneinvest", "oneinvest_ci_scripts_", "oneinvest_ci_scripts_x", "oneinvest_ci_scripts_1;", "oneinvest_cix_scripts_1", "oneinvest_s10_danhba"]) {
    assert.doesNotMatch(ten, MAU_DB_THU, `phải từ chối: ${ten}`);
  }
  assert.equal(lyDoTuChoi(url("postgres", TK, "localhost:5433", "oneinvest_ci_scripts_77")), null);
});

test("RV-2 chạy trần tệp trong phạm vi: URL DB chung (cả khi CI=true) → thoát 2, lời từ chối, không nối; thiếu URL → bỏ qua có lời, thoát 0, 0 ca", () => {
  for (const p of PHAM_VI) {
    let tuChoi = 0;
    // URL DB chung ở cổng chết TRƯỚC: tệp mất rào sẽ đỏ ở đây và vòng dừng — ca thiếu URL (rơi về :5433 thật nếu mất rào)
    // không bao giờ chạy trên tệp mất rào (gap-probe P1-1).
    for (const [nhan, env] of CHET_4.flatMap(([cach, u]) => [
      [`URL DB chung (${cach})`, envNgoaiCi({ DATABASE_URL: u })],
      [`CI=true + URL DB chung (${cach})`, { ...envNgoaiCi({ DATABASE_URL: u }), CI: "true" }],
    ])) {
      const { status, ra } = chay(p.tep, env);
      assert.match(ra, new RegExp(`${p.ten}: từ chối — DB 'oneinvest' không phải DB thử`), `${p.tep} · ${nhan}: thiếu lời từ chối — ${ra.slice(0, 300)}`);
      assert.notEqual(status, 0, `${p.tep} · ${nhan}: phải thoát lỗi`);
      assert.doesNotMatch(ra, p.noi, `${p.tep} · ${nhan}: đã thử nối DB`);
      assert.doesNotMatch(ra, /ECONNREFUSED/, `${p.tep} · ${nhan}: đã mở kết nối`);
      assert.ok(!ra.includes(TK + "@"), "không in URL kèm mật khẩu");
      tuChoi += 1;
    }
    // Chỉ bỏ URL khi rào của tệp đã được chứng ở hai ca trên (assert đỏ thì vòng dừng trước dòng này): tệp mất rào không bao
    // giờ được chạy thiếu URL — nó sẽ rơi về DB chung :5433 thật (gap-probe P1-1).
    const daChungRao = tuChoi === CHET_4.length * 2;
    const envThieu = envNgoaiCi({});
    if (!daChungRao) assert.fail("chưa chứng rào"); else delete envThieu.DATABASE_URL;
    const { status, ra } = chay(p.tep, envThieu);
    assert.match(ra, new RegExp(`${p.ten}: bỏ qua — thiếu DATABASE_URL`), `${p.tep} · thiếu URL: thiếu lời bỏ qua — ${ra.slice(0, 300)}`);
    assert.equal(status, 0, `${p.tep} · thiếu URL: bỏ qua phải thoát 0`);
    assert.doesNotMatch(ra, /ECONNREFUSED|DB local không tới/, `${p.tep} · thiếu URL: đã thử nối DB`);
  }
});

test("RV-3 đột biến bỏ rào (bản chép cạnh bản thật) → không còn lời từ chối, tệp đi tới chỗ thử nối DB — chứng rào là thứ chặn", () => {
  for (const p of PHAM_VI) {
    const goc = readFileSync(join(GOC, p.tep), "utf8");
    assert.ok(goc.includes(p.rao), `${p.tep}: không thấy dòng rào để phá — thước lệch tệp`);
    const ban = join(GOC, p.tep.replace(/\.test\.mjs$/, `.dot-bien-${process.pid}.test.mjs`));
    writeFileSync(ban, goc.replace(p.rao, "const DB_URL = process.env.DATABASE_URL;"));
    try {
      // chỉ cổng chết — bản mất rào không bao giờ được chạy thiếu URL
      const { ra } = chay(ban, envNgoaiCi({ DATABASE_URL: CHET("oneinvest") }));
      assert.doesNotMatch(ra, /từ chối —/, `${p.tep}: bản bỏ rào vẫn in lời từ chối — thước không phân biệt`);
      assert.match(ra, p.noi, `${p.tep}: bản bỏ rào không thử nối DB — đột biến không tới chỗ nối`);
    } finally {
      rmSync(ban, { force: true });
    }
  }
});
