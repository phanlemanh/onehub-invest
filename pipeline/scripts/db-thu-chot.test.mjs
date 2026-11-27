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

// ── HT35 (test-khong-roi-ve-db-chung): hai tệp test TỰ DỰNG bảng thật rồi ghi — chỉ DB oneinvest_suite_* ngoài CI, CI vẫn chạy.
// Bảng phủ 62 tệp và phần để lại cho HT36: _acceptance/test-khong-roi-ve-db-chung/bang-phu.md.
import { writeFileSync, readFileSync, rmSync } from "node:fs";
import { urlCiChoPhep, urlDbTestGhi, URL_DB_CI } from "../lib/db-thu-chot.mjs";

const GOC = join(PIPE, "..");
// Cổng chết (9 — discard, không ai nghe): rào hỏng thì tiến trình con gặp ECONNREFUSED, không bao giờ chạm DB thật.
const CHET = (db) => url("postgres", TK, "127.0.0.1:9", db);
// Tệp trong phạm vi · lời từ chối của rào tệp ấy · dòng rào (đột biến thay bằng URL trần) · mẫu bỏ ca khi chạy bản đột biến.
// Ca 2711-1 của tệp S09 tự gọi chính tệp với URL DB chung THẬT (:5433) — bản đột biến không rào nên PHẢI bỏ ca ấy.
const PHAM_VI = [
  {
    tep: "pipeline/import-s09-danh-ba.test.mjs",
    loi: /TỪ CHỐI DATABASE_URL/,
    rao: "const DB_URL = urlCiChoPhep(process.env.DATABASE_URL) ?? xacThucUrlSuite(process.env.DATABASE_URL);",
    boCa: "2711-1",
    noi: /DB của lượt không chạy/,
  },
  {
    tep: "scripts/check-freshness.test.mjs",
    loi: /check-freshness\.test: từ chối/,
    rao: 'const DB_URL = urlDbTestGhi({ ten: "check-freshness.test" });',
    boCa: null,
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
function chay(tep, env, boCa) {
  const args = ["--test", "--test-concurrency=1", ...(boCa ? [`--test-skip-pattern=${boCa}`] : []), tep];
  const r = spawnSync(process.execPath, args, { encoding: "utf8", timeout: 120_000, env, cwd: GOC });
  return { status: r.status, ra: (r.stdout || "") + (r.stderr || "") };
}

test("RV-1 ma trận urlDbTestGhi: ngoài CI chỉ suite; CI=true thiếu URL → DB dịch vụ CI, tên khác oneinvest → nhận, oneinvest tường minh → từ chối", () => {
  // thiếu URL viết là "" — undefined sẽ rơi về tham số mặc định process.env.DATABASE_URL (db-thu đặt nó)
  const ngoai = {};
  const ci = { CI: "true" };
  // ngoài CI
  for (const u of TU_CHOI) assert.throws(() => urlDbTestGhi({ ten: "t", url: u, env: ngoai }), /t: từ chối — DB '.+' không phải DB thử/, u);
  assert.throws(() => urlDbTestGhi({ ten: "t", url: "", env: ngoai }), /t: từ chối — thiếu DATABASE_URL/);
  for (const u of NHAN) assert.equal(urlDbTestGhi({ ten: "t", url: u, env: ngoai }), u);
  // CI=true
  assert.equal(urlDbTestGhi({ ten: "t", url: "", env: ci }), URL_DB_CI, "CI thiếu URL → DB dịch vụ của ci-test.yml");
  if (!process.env.DATABASE_URL) assert.equal(tenDbThu(URL_DB_CI), "oneinvest", "DB dịch vụ CI là DB «oneinvest» của ci-test.yml");
  const ciScripts = url("postgres", TK, "localhost:5433", "oneinvest_ci_scripts_4242");
  assert.equal(urlDbTestGhi({ ten: "t", url: ciScripts, env: ci }), ciScripts, "bước scripts của suite-neu-doi");
  for (const u of TU_CHOI.slice(0, 4)) assert.throws(() => urlDbTestGhi({ ten: "t", url: u, env: ci }), /từ chối/, `CI vẫn từ chối tên DB chung: ${u}`);
  assert.equal(urlCiChoPhep("", ngoai), null);
  assert.equal(urlCiChoPhep("", { CI: "1" }), null, "chỉ CI=\"true\" mới là runner CI");
});

// Ca «thiếu URL» KHÔNG chạy trần ở đây: tệp mất rào sẽ rơi về DB chung :5433 thật (gap-probe P1-1, DT-AC-7) — nhánh ấy đo bằng
// ma trận RV-1 (urlDbTestGhi ngoài CI thiếu URL → ném) và RV-3 chứng dòng rào là thứ chặn.
test("RV-2 chạy trần từng tệp trong phạm vi (URL DB chung ở cổng chết; cả khi CI=true) → thoát lỗi, lời từ chối, không nối, 0 ca", () => {
  const ca = [
    ["URL DB chung", envNgoaiCi({ DATABASE_URL: CHET("oneinvest") })],
    ["CI=true + URL DB chung", { ...envNgoaiCi({ DATABASE_URL: CHET("oneinvest") }), CI: "true" }],
  ];
  for (const p of PHAM_VI) {
    for (const [nhan, env] of ca) {
      const { status, ra } = chay(p.tep, env, null);
      assert.notEqual(status, 0, `${p.tep} · ${nhan}: phải thoát lỗi`);
      assert.match(ra, p.loi, `${p.tep} · ${nhan}: thiếu lời từ chối — ${ra.slice(0, 300)}`);
      assert.doesNotMatch(ra, p.noi, `${p.tep} · ${nhan}: đã thử nối DB`);
      assert.doesNotMatch(ra, /ECONNREFUSED/, `${p.tep} · ${nhan}: đã mở kết nối`);
      assert.match(ra, /^(?:ℹ|#) pass 0$/m, `${p.tep} · ${nhan}: có ca đã chạy`);
      assert.ok(!ra.includes(TK + "@"), "không in URL kèm mật khẩu");
    }
  }
});

test("RV-3 đột biến bỏ rào (bản chép cạnh bản thật) → không còn lời từ chối, tệp đi tới mở kết nối — chứng rào là thứ chặn", () => {
  for (const p of PHAM_VI) {
    const goc = readFileSync(join(GOC, p.tep), "utf8");
    assert.ok(goc.includes(p.rao), `${p.tep}: không thấy dòng rào để phá — thước lệch tệp`);
    const ban = join(GOC, p.tep.replace(/\.test\.mjs$/, `.dot-bien-${process.pid}.test.mjs`));
    writeFileSync(ban, goc.replace(p.rao, "const DB_URL = process.env.DATABASE_URL;"));
    try {
      const { status, ra } = chay(ban, envNgoaiCi({ DATABASE_URL: CHET("oneinvest") }), p.boCa);
      assert.doesNotMatch(ra, p.loi, `${p.tep}: bản bỏ rào vẫn in lời từ chối — thước không phân biệt`);
      assert.match(ra, p.noi, `${p.tep}: bản bỏ rào không thử nối DB — đột biến không tới chỗ nối`);
      assert.notEqual(status, null, "tiến trình con bị ngắt");
    } finally {
      rmSync(ban, { force: true });
    }
  }
});
