// db-thu.test.mjs — hồ sơ test-suite-db-thu E1: chế độ --chay của db/db-thu.sh. Docker giả trong PATH ghi lại mọi lệnh,
// không cần Postgres. Câu đo là «lệnh nhận DATABASE_URL nào, và DB chung có nhận lệnh ghi nào không».
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SH = path.join(import.meta.dirname, "../db/db-thu.sh");
const CHUNG = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** Thư mục có docker giả; `dia`: chỗ trống VM. `mau`: nội dung COMMENT của bản mẫu («dấu giờ»), `dau`: dấu lược đồ DB chung; `chay`: container có chạy không. */
function dung({ mau = `d1 ${Math.floor(Date.now() / 1000)}`, dau = "d1", chay = true, moCoi = "", dia = "46G" } = {}) {
  const d = mkdtempSync(path.join(tmpdir(), "db-thu-"));
  const log = path.join(d, "docker.log");
  writeFileSync(log, "");
  writeFileSync(path.join(d, "docker"), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> ${JSON.stringify(log)}
case "$*" in
  inspect*) ${chay ? 'echo true' : 'exit 1'} ;;
  *shobj_description*) printf '%s\\n' ${JSON.stringify(mau)} ;;
  *md5*) echo ${JSON.stringify(dau)} ;;
  *"datname ~"*) printf '%s' ${JSON.stringify(moCoi)} ;;
  *" df "*) printf 'Avail\\n%s\\n' ${JSON.stringify(dia)} ;;
esac
exit 0
`);
  chmodSync(path.join(d, "docker"), 0o755);
  return { d, log };
}
const moiTruong = (d, them = {}) => {
  const env = { ...process.env, PATH: `${d}:${process.env.PATH}`, DB_THU_KHOA: path.join(d, "khoa"), ...them };
  if (!("DATABASE_URL" in them)) delete env.DATABASE_URL;
  if (!("CI" in them)) delete env.CI;
  delete env.TEST_DATABASE_URL_ADMIN;
  return env;
};
const inUrl = ["bash", "-c", 'echo "URL=$DATABASE_URL ADMIN=$TEST_DATABASE_URL_ADMIN"; exit ${MA:-0}'];
const chay = (d, them, lenh = inUrl) => spawnSync("bash", [SH, "oneinvest_suite_app", "--chay", ...lenh], { env: moiTruong(d, them), encoding: "utf8" });
const dong = (log) => readFileSync(log, "utf8").split("\n").filter(Boolean);
/** Lệnh ghi nhằm vào DB chung — phải luôn rỗng. Đọc dấu lược đồ và pg_dump nguồn không tính. */
const ghiDbChung = (log) => dong(log).filter((l) => /(createdb|dropdb)( .*)? oneinvest$/.test(l) || (/-d oneinvest\b/.test(l) && !/md5/.test(l)));

test("DT-AC-1 lệnh nhận DB của riêng lượt, DB xoá khi xong, DB chung không nhận lệnh ghi", () => {
  const { d, log } = dung();
  const r = chay(d);
  assert.equal(r.status, 0, r.stderr);
  const m = r.stdout.match(/URL=(\S+) ADMIN=(\S+)/);
  assert.ok(m, r.stdout);
  assert.match(m[1], /\/oneinvest_suite_app_\d+$/);
  assert.equal(m[2], m[1], "TEST_DATABASE_URL_ADMIN phải trỏ cùng DB của lượt");
  const ten = m[1].split("/").pop();
  const l = dong(log);
  assert.ok(l.some((x) => x.includes(`createdb -U oneinvest -h localhost -T oneinvest_suite_mau ${ten}`)), "phải chép từ bản mẫu");
  assert.ok(l.some((x) => x.includes(`dropdb -U oneinvest -h localhost --force --if-exists ${ten}`)), "phải xoá DB của lượt");
  assert.deepEqual(ghiDbChung(log), []);
});

test("DT-AC-1 URL đang trỏ DB chung thì vẫn đổi sang DB riêng", () => {
  for (const url of [CHUNG, `${CHUNG}?options=-c%20search_path%3Dx`]) {
    const { d, log } = dung();
    const r = chay(d, { DATABASE_URL: url });
    assert.match(r.stdout, /URL=\S+\/oneinvest_suite_app_\d+ /, `DB chung lọt qua: ${url}`);
    assert.deepEqual(ghiDbChung(log), []);
  }
});

test("DT-AC-1 đối chứng: bản script bỏ nhánh đổi URL thì DB chung lọt và ca trên phải đỏ", () => {
  const { d } = dung();
  const goc = readFileSync(SH, "utf8");
  const dot = goc.replace('[ "${u##*/}" = "oneinvest" ] || exec "$@"', 'exec "$@"');
  assert.notEqual(dot, goc, "đột biến không đổi mã — chiều đỏ rỗng");
  const tep = path.join(d, "db-thu-dot.sh");
  writeFileSync(tep, dot);
  const r = spawnSync("bash", [tep, "oneinvest_suite_app", "--chay", ...inUrl], { env: moiTruong(d, { DATABASE_URL: CHUNG }), encoding: "utf8" });
  assert.match(r.stdout, new RegExp(`URL=${CHUNG} `), "bản đột biến phải để lộ URL DB chung");
});

test("DT-AC-1 mã thoát của lệnh giữ nguyên, lệnh đỏ vẫn xoá DB", () => {
  const { d, log } = dung();
  const r = chay(d, { MA: "7" });
  assert.equal(r.status, 7);
  const ten = r.stdout.match(/URL=\S+\/(oneinvest_suite_app_\d+)/)[1];
  assert.ok(dong(log).some((x) => x.includes(`--force --if-exists ${ten}`)), "lệnh đỏ phải xoá DB của lượt");
});

test("DT-AC-1 SIGTERM dừng lệnh và xoá DB", async () => {
  const { d, log } = dung();
  const dau = path.join(d, "da-chay");
  const p = spawn("bash", [SH, "oneinvest_suite_app", "--chay", "bash", "-c", `echo $DATABASE_URL > ${dau}; exec sleep 60`], { env: moiTruong(d), stdio: "ignore" });
  for (let i = 0; i < 100 && !existsSync(dau); i++) await new Promise((r) => setTimeout(r, 50));
  const ten = readFileSync(dau, "utf8").trim().split("/").pop();
  const xong = new Promise((r) => p.on("exit", (code, sig) => r({ code, sig })));
  const t0 = Date.now();
  p.kill("SIGTERM");
  const kq = await xong;
  assert.ok(Date.now() - t0 < 5000, "phải dừng ngay, không chờ lệnh con");
  assert.equal(kq.code, 143);
  assert.ok(dong(log).some((x) => x.includes(`--force --if-exists ${ten}`)), "SIGTERM phải xoá DB của lượt");
});

test("DT-AC-2 URL đã trỏ DB thử khác thì giữ, không gọi docker", () => {
  const { d, log } = dung();
  const url = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_tct";
  const r = chay(d, { DATABASE_URL: url });
  assert.match(r.stdout, new RegExp(`URL=${url} `));
  assert.deepEqual(dong(log), []);
});

test("DT-AC-2 cùng tên oneinvest ở máy chủ khác cổng thì giữ nguyên URL; 127.0.0.1:5433 vẫn là DB chung", () => {
  const urlTai = (noi) => CHUNG.replace("localhost:5433", noi); // literal có user và IP bị hook bí mật bắt nhầm
  const khac = urlTai("127.0.0.1:55001");
  const a = dung();
  const r = chay(a.d, { DATABASE_URL: khac });
  assert.match(r.stdout, new RegExp(`URL=${khac}`));
  assert.deepEqual(dong(a.log), [], "không được gọi docker");
  const b = dung();
  const r2 = chay(b.d, { DATABASE_URL: urlTai("127.0.0.1:5433") });
  assert.match(r2.stdout, /URL=postgres:\/\/oneinvest:oneinvest@localhost:5433\/oneinvest_suite_app_\d+/);
});

test("DT-AC-2 tên DB chỉ bắt đầu bằng oneinvest thì không bị coi là DB chung", () => {
  const { d } = dung();
  const url = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_khac?options=-c%20search_path%3Dx";
  const r = chay(d, { DATABASE_URL: url });
  assert.ok(r.stdout.includes(`URL=${url} `), r.stdout);
});

test("DT-AC-2 đĩa VM dưới 10 GB: dừng trước khi chép, lệnh không chạy", () => {
  const { d, log } = dung({ dia: "8G" });
  const r = chay(d);
  assert.equal(r.status, 4);
  assert.doesNotMatch(r.stdout, /URL=/, "lệnh không được chạy");
  assert.match(r.stdout, /đĩa VM còn 8 GB/);
  assert.ok(!dong(log).some((l) => l.includes("createdb")), "không được chép khi đĩa thấp");
});

test("DT-AC-2 chế độ cũ không đổi: tên oneinvest bị từ chối, --xoa chỉ xoá đúng tên", () => {
  const { d, log } = dung();
  const cam = spawnSync("bash", [SH, "oneinvest", "--xoa"], { env: moiTruong(d), encoding: "utf8" });
  assert.equal(cam.status, 2);
  assert.match(cam.stdout, /không được là oneinvest/);
  const xoa = spawnSync("bash", [SH, "oneinvest_p1_x", "--xoa"], { env: moiTruong(d), encoding: "utf8" });
  assert.equal(xoa.status, 0);
  assert.match(xoa.stdout, /đã xoá oneinvest_p1_x/);
  assert.deepEqual(dong(log).filter((l) => /dropdb/.test(l)).map((l) => l.split(" ").pop()), ["oneinvest_p1_x"]);
});

test("DT-AC-2 CI không có container: chạy thẳng trên Postgres của CI", () => {
  const { d, log } = dung({ chay: false });
  const r = chay(d, { CI: "true", DATABASE_URL: CHUNG });
  assert.equal(r.status, 0);
  assert.match(r.stdout, new RegExp(`URL=${CHUNG} `));
  assert.deepEqual(dong(log).filter((l) => !l.startsWith("inspect")), []);
});

test("DT-AC-2 máy không có container: dừng, lệnh không chạy, không rơi về DB chung", () => {
  const { d } = dung({ chay: false });
  const r = chay(d, { DATABASE_URL: CHUNG });
  assert.equal(r.status, 3);
  assert.doesNotMatch(r.stdout, /URL=/, "lệnh không được chạy");
  assert.match(r.stdout, /container one-invest-db không chạy/);
});

test("DT-AC-2 tên không thuộc oneinvest_suite_* bị từ chối", () => {
  const { d } = dung();
  const r = spawnSync("bash", [SH, "oneinvest_p1_x", "--chay", "true"], { env: moiTruong(d), encoding: "utf8" });
  assert.equal(r.status, 2);
  assert.match(r.stdout, /--chay chỉ nhận tên oneinvest_suite_/);
});

const dumpLenh = (log) => dong(log).filter((l) => l.includes("pg_dump"));
test("DT-AC-3 mẫu cùng dấu lược đồ và còn mới: không dump", () => {
  const { d, log } = dung();
  chay(d);
  assert.equal(dumpLenh(log).length, 0);
});

test("DT-AC-3 lược đồ DB chung đổi: dựng lại mẫu rồi mới chạy, dump đọc từ DB chung, đích là bản mới", () => {
  // Docker giả trả dấu cố định nên vòng «xem lại» sau khi dựng không lặp: bên dựng đi tiếp không cần đọc lại.
  const { d, log } = dung({ mau: `cu ${Math.floor(Date.now() / 1000)}`, dau: "moi" });
  const r = chay(d);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const dump = dumpLenh(log);
  assert.equal(dump.length, 1, "phải dump đúng một lần");
  assert.match(dump[0], /oneinvest_suite_mau_moi_\d+$/m);
  const l = dong(log);
  const iAnalyze = l.findIndex((x) => /-d oneinvest_suite_mau_moi_\d+ -c VACUUM ANALYZE/.test(x));
  const iKhoa = l.findIndex((x) => /ALTER DATABASE oneinvest_suite_mau_moi_\d+ ALLOW_CONNECTIONS false/.test(x));
  assert.ok(iAnalyze >= 0 && iAnalyze < iKhoa, "bản mới phải VACUUM ANALYZE trước khi khoá kết nối: pg_dump không mang thống kê");
  assert.ok(l.some((x) => /COMMENT ON DATABASE oneinvest_suite_mau_moi_\d+ IS 'moi \d+'/.test(x)), "phải ghi dấu mới");
  assert.ok(l.some((x) => /ALTER DATABASE oneinvest_suite_mau_moi_\d+ RENAME TO oneinvest_suite_mau/.test(x)), "phải đổi tên vào chỗ mẫu");
  assert.deepEqual(ghiDbChung(log), []);
});

test("DT-AC-3 mẫu quá 24 giờ hoặc chưa có: dựng lại", () => {
  for (const mau of [`d1 ${Math.floor(Date.now() / 1000) - 90_000}`, ""]) {
    const { d, log } = dung({ mau });
    chay(d);
    assert.equal(dumpLenh(log).length, 1, `mẫu «${mau}» phải dựng lại`);
  }
});

test("DT-AC-3 DB của lượt đã chết được dọn, DB của lượt đang sống thì giữ", () => {
  const { d, log } = dung({ moCoi: `oneinvest_suite_app_999999\noneinvest_suite_agent_${process.pid}\n` });
  chay(d);
  const l = dong(log);
  assert.ok(l.some((x) => x.includes("--if-exists oneinvest_suite_app_999999")), "DB mồ côi phải bị xoá");
  assert.ok(!l.some((x) => x.includes(`--if-exists oneinvest_suite_agent_${process.pid}`)), "DB của tiến trình sống phải giữ");
});

// Lưới chống lọt của ba bộ test: lối vào qua --chay, và không tệp test nào tự trỏ DB chung bỏ qua DATABASE_URL.
const GOC = path.join(import.meta.dirname, "..");
const BO = { app: ["app/tests", /\.test\.tsx$/], pipeline: ["pipeline", /\.test\.mjs$/], agent: ["agent/tests", /\.test\.ts$/] };
const tepTest = (dir, re) => readdirSync(path.join(GOC, dir), { recursive: true, encoding: "utf8" })
  .filter((f) => re.test(f) && !f.includes("node_modules")).map((f) => path.join(dir, f));
/** Tệp helper mà test của ba bộ nạp, không mang đuôi .test nên glob của bộ không thấy. */
const tepHelper = () => [
  ...readdirSync(path.join(GOC, "agent/tests")).filter((f) => /\.ts$/.test(f) && !/\.(test|itest)\.ts$/.test(f)).map((f) => `agent/tests/${f}`),
  ...readdirSync(path.join(GOC, "app/tests"), { recursive: true, encoding: "utf8" }).filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx$/.test(f)).map((f) => `app/tests/${f}`),
  ...readdirSync(path.join(GOC, "pipeline/scripts")).filter((f) => /fixture.*\.mjs$|^capture-.*\.mjs$/.test(f)).map((f) => `pipeline/scripts/${f}`),
];
/** Dòng tự trỏ DB chung, ba cách viết: URL trọn, URL ghép từ biến máy chủ, URL dựng bằng new URL(placeholder). Lành khi có DATABASE_URL đứng trước làm đường chính,
 *  hay dòng ngay sau đổi sang cổng 1 (DB chết có chủ ý). Thêm: xoá DATABASE_URL khỏi env tiến trình con mà không gán lại. */
export function dongLot(noiDung) {
  const out = [];
  noiDung.split("\n").forEach((dong, i, ds) => {
    if (dong.trimStart().startsWith("//")) return;
    const truoc = ds.slice(Math.max(0, i - 2), i + 1).join("\n");
    const sau = ds.slice(i, i + 3).join("\n");
    const lanh = /DATABASE_URL/.test(truoc) || /port = "1"/.test(sau);
    if (/(5433|\}|placeholder)\/oneinvest(?![_a-z0-9])/.test(dong) && !lanh) out.push(`${i + 1}: ${dong.trim()}`);
    if (/^\s*delete env\.DATABASE_URL/.test(dong) && !/else\s*$|else /.test(`${ds[i - 1] ?? ""}${dong}`)) out.push(`${i + 1}: ${dong.trim()}`);
  });
  return out;
}

test("DT-AC-7 cả ba bộ test đi qua db-thu --chay", () => {
  for (const b of Object.keys(BO)) {
    const s = JSON.parse(readFileSync(path.join(GOC, b, "package.json"), "utf8")).scripts.test;
    assert.match(s, new RegExp(`^bash \\.\\./db/db-thu\\.sh oneinvest_suite_${b} --chay `), `${b}: npm test không đi qua db-thu`);
  }
});

test("DT-AC-5 executor sellers_chip đi qua db-thu", () => {
  const dong = readFileSync(path.join(GOC, "_acceptance/config.yaml"), "utf8").split("\n").find((l) => /^\s+sellers_chip:/.test(l));
  assert.ok(dong, "config không có sellers_chip");
  assert.match(dong, /db-thu\.sh oneinvest_suite_\w+ --chay/, "sellers_chip không đi qua db-thu");
});

test("DT-AC-7 không tệp test nào của ba bộ tự trỏ DB chung", () => {
  const lot = [];
  for (const [dir, re] of Object.values(BO)) {
    const tep = tepTest(dir, re);
    assert.ok(tep.length >= 20, `${dir}: quét ${tep.length} tệp — glob của bộ quét sai`);
    for (const f of tep) for (const d of dongLot(readFileSync(path.join(GOC, f), "utf8"))) lot.push(`${f}:${d}`);
  }
  const helper = tepHelper();
  assert.ok(helper.includes("pipeline/scripts/capture-ops-facts.mjs") && helper.includes("agent/tests/judge-chung.ts"), "bộ quét không thấy tệp helper");
  for (const f of helper) for (const d of dongLot(readFileSync(path.join(GOC, f), "utf8"))) lot.push(`${f}:${d}`);
  assert.deepEqual(lot, []);
});

test("DT-AC-7 đối chứng: bộ quét bắt đúng các dạng lọt, bỏ qua các dạng lành", () => {
  const bat = ['const U = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"', "const U = `postgres://o:o@localhost:5433/oneinvest?options=-c`", "const U = `${PG_SERVER}/oneinvest`", 'const u = new URL("postgres://placeholder/oneinvest")', "  delete env.DATABASE_URL"];
  for (const d of bat) assert.equal(dongLot(d).length, 1, `phải bắt: ${d}`);
  const lanh = ['const U = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"', "const U = process.env.DATABASE_URL ?? `${PG_SERVER}/oneinvest`", 'const U = "postgres://o:o@localhost:5433/oneinvest_tct"', "// 5433/oneinvest", 'if (process.env.TEST_DATABASE_URL_ADMIN) return process.env.TEST_DATABASE_URL_ADMIN\nconst u = new URL("postgres://placeholder/oneinvest")', 'const u = new URL("postgres://placeholder/oneinvest")\nu.hostname = "127.0.0.1"; u.port = "1"', "  if (x) env.DATABASE_URL = x\n  else delete env.DATABASE_URL"];
  for (const d of lanh) assert.deepEqual(dongLot(d), [], `không được bắt: ${d}`);
});
