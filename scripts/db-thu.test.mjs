// db-thu.test.mjs — hồ sơ test-suite-db-thu E1: chế độ --chay của db/db-thu.sh. Docker giả trong PATH ghi lại mọi lệnh,
// không cần Postgres. Câu đo là «lệnh nhận DATABASE_URL nào, và DB chung có nhận lệnh ghi nào không».
// Ca DL- (hồ sơ dau-luoc-do-ban-mau): câu dấu db/dau-luoc-do.sql chạy trên Postgres thật :5433, DB rỗng của riêng lượt, không nối DB chung.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

const SH = path.join(import.meta.dirname, "../db/db-thu.sh");
const CHUNG = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** Thư mục có docker giả; `dia`: chỗ trống VM. `mau`: nội dung COMMENT của bản mẫu («dấu giờ»), `dau`: dấu lược đồ DB chung; `chay`: container có chạy không. */
function dung({ mau = `d1 ${Math.floor(Date.now() / 1000)}`, mauLan2 = null, dau = "d1", chay = true, moCoi = "", dia = "46G", vacuumLoi = false } = {}) {
  const d = mkdtempSync(path.join(tmpdir(), "db-thu-"));
  const log = path.join(d, "docker.log");
  writeFileSync(log, "");
  writeFileSync(path.join(d, "docker"), `#!/usr/bin/env bash
# Mỗi lời gọi một dòng: câu dấu nhiều dòng (db/dau-luoc-do.sql) không được tách thành nhiều dòng log.
printf '%s\\n' "$(printf '%s' "$*" | tr '\\n' ' ')" >> ${JSON.stringify(log)}
case "$*" in
  inspect*) ${chay ? 'echo true' : 'exit 1'} ;;
  *shobj_description*)
    # Lần đọc đầu trả mau, từ lần hai trả mauLan2 (bên khác vừa dựng xong).
    if ${mauLan2 ? "[ -e " + JSON.stringify(log + ".doc") + " ]" : "false"}; then printf '%s\\n' ${JSON.stringify(mauLan2 ?? "")}; else : > ${JSON.stringify(log + ".doc")}; printf '%s\\n' ${JSON.stringify(mau)}; fi ;;
  *"VACUUM ANALYZE"*) ${vacuumLoi ? "echo vacuum-hong >&2; exit 2" : ":"} ;;
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

test("DT-AC-1 URL DB chung không có tên đăng nhập vẫn đổi sang DB riêng", () => {
  const { d, log } = dung();
  const r = chay(d, { DATABASE_URL: "postgres://localhost:5433/oneinvest" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /URL=postgres:\/\/oneinvest:oneinvest@localhost:5433\/oneinvest_suite_app_\d+/, "DB chung lọt qua");
  assert.deepEqual(ghiDbChung(log), []);
});

test("DT-AC-1 đối chứng: bản script bỏ nhánh đổi URL thì DB chung lọt và ca trên phải đỏ", () => {
  const { d } = dung();
  const goc = readFileSync(SH, "utf8");
  const dot = goc.replace('if [ "${u##*/}" != "oneinvest" ] || {', 'if true || {');
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
  assert.match(r.stdout, new RegExp(`URL=${khac} ADMIN=${khac}`), "kết nối quản trị phải theo URL đã giữ, không rơi về DB chung");
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

const dumpLenh = (log) => dong(log).filter((l) => /pg_dump -U/.test(l));
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

test("DT-AC-3 VACUUM ANALYZE lỗi: không đổi tên vào chỗ mẫu, lệnh không chạy", () => {
  const { d, log } = dung({ mau: "", dau: "moi", vacuumLoi: true });
  const r = chay(d);
  assert.notEqual(r.status, 0);
  assert.doesNotMatch(r.stdout, /^URL=/m, "lệnh không được chạy trên bản mẫu thiếu thống kê");
  assert.match(r.stdout, /dựng bản mẫu lỗi/);
  assert.ok(!dong(log).some((x) => /RENAME TO oneinvest_suite_mau/.test(x)), "bản hỏng không được vào chỗ mẫu");
});

test("DT-AC-3 bên khác dựng xong ngay trước khi xin khoá: không dựng lần hai", () => {
  const moi = `d1 ${Math.floor(Date.now() / 1000)}`;
  const { d, log } = dung({ mau: "", mauLan2: moi, dau: "d1" });
  const r = chay(d);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(dumpLenh(log).length, 0, "đã có mẫu mới thì không pg_dump");
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
/** Mọi tệp trong kho mà `tep` import, tính đệ quy: helper mang đuôi khác .test nên glob của bộ không thấy. Import động theo đường tính lúc chạy không đọc được. */
function tepNap(dsGoc) {
  const thay = new Set();
  const ngan = [...dsGoc];
  while (ngan.length) {
    const f = ngan.pop();
    if (thay.has(f)) continue;
    thay.add(f);
    for (const [, duong] of readFileSync(path.join(GOC, f), "utf8").matchAll(/(?:from|import\()\s*["']((?:\.\.?|@)\/[^"']+)["']/g)) {
      const goc = duong.startsWith("@/") ? path.join("app/src", duong.slice(2)) : path.join(path.dirname(f), duong);
      const tim = [goc, goc.replace(/\.js$/, ".ts"), `${goc}.ts`, `${goc}.tsx`, `${goc}.mjs`, `${goc}.js`, `${goc}/index.ts`].find((x) => existsSync(path.join(GOC, x)) && !statSync(path.join(GOC, x)).isDirectory());
      if (tim && /\.(ts|tsx|mjs|js)$/.test(tim)) ngan.push(tim);
    }
  }
  return [...thay];
}
/** Dòng tự trỏ DB chung. URL (trọn, ghép từ biến máy chủ, dựng bằng new URL, tách host/database) chỉ lành khi biến môi trường đứng ngay trước làm đường chính
 *  (`process.env.DATABASE_URL ?? "…"`), hoặc dòng sau đổi sang cổng 1 (DB chết có chủ ý). Thêm: bỏ DATABASE_URL khỏi env mà không gán lại. */
export function dongLot(noiDung) {
  const out = [];
  const BIEN = /process\.env\.(TEST_DATABASE_URL_ADMIN|DATABASE_URL)\s*(\?\?|\|\|)/;
  noiDung.split("\n").forEach((dong, i, ds) => {
    if (dong.trimStart().startsWith("//")) return;
    const m = /(5433|\}|placeholder)\/oneinvest(?![_a-z0-9])|database:\s*["']oneinvest["']|pathname\s*=\s*["']\/oneinvest["']/.exec(dong);
    if (m) {
      const lanh = BIEN.test(dong.slice(0, m.index)) || BIEN.test(ds[i - 1] ?? "") || /^\s*\[.*\],?\s*$/.test(dong) // dòng bảng dữ liệu của ca, không phải chuỗi kết nối
        || /if \(process\.env\.TEST_DATABASE_URL_ADMIN\) return/.test(ds[i - 1] ?? "") || /port = "1"/.test(ds.slice(i, i + 3).join("\n"));
      if (!lanh) out.push(`${i + 1}: ${dong.trim()}`);
    }
    const boBien = /delete\s+[\w.]+\.DATABASE_URL\b/.test(dong) || /\bDATABASE_URL:\s*(undefined|null|"")/.test(dong) || /\{[^}]*\bDATABASE_URL\b[^}]*\.\.\.\w+[^}]*\}\s*=/.test(dong);
    if (boBien && !/else\s*$|else /.test(`${ds[i - 1] ?? ""}${dong}`)) out.push(`${i + 1}: ${dong.trim()}`);
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

test("DT-AC-7 không tệp test nào của ba bộ, kể cả tệp chúng import, tự trỏ DB chung", () => {
  const lot = [];
  const tatCa = [];
  for (const [dir, re] of Object.values(BO)) {
    const tep = tepTest(dir, re);
    assert.ok(tep.length >= 20, `${dir}: quét ${tep.length} tệp — glob của bộ quét sai`);
    tatCa.push(...tep);
  }
  const nap = tepNap(tatCa);
  for (const f of ["pipeline/scripts/capture-ops-facts.mjs", "agent/tests/judge-chung.ts", "agent/tests/helpers/db.ts", "app/src/lib/db.ts", "app/src/lib/deals.ts"]) assert.ok(nap.includes(f), `bộ quét không thấy ${f}`);
  for (const f of nap) for (const d of dongLot(readFileSync(path.join(GOC, f), "utf8"))) lot.push(`${f}:${d}`);
  assert.deepEqual(lot, []);
});

test("DT-AC-7 đối chứng: bộ quét bắt đúng các dạng lọt, bỏ qua các dạng lành", () => {
  const bat = ['const U = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"', "const U = `postgres://o:o@localhost:5433/oneinvest?options=-c`", "const U = `${PG_SERVER}/oneinvest`", 'const u = new URL("postgres://placeholder/oneinvest")', "  delete env.DATABASE_URL",
    'process.env.DATABASE_URL = "postgres://o:o@localhost:5433/oneinvest"', "env: { ...process.env, DATABASE_URL: `${PG}/oneinvest` }", "delete process.env.DATABASE_URL", "env: { ...process.env, DATABASE_URL: undefined }", '{ port: 5433, database: "oneinvest" }', "const { DATABASE_URL: _, ...con } = process.env"];
  for (const d of bat) assert.equal(dongLot(d).length, 1, `phải bắt: ${d}`);
  const lanh = ['  ["DB chung", "postgres://localhost:5433/oneinvest", false],', 'const U = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"', "const U = process.env.DATABASE_URL ?? `${PG_SERVER}/oneinvest`", 'const U = "postgres://o:o@localhost:5433/oneinvest_tct"', "// 5433/oneinvest", 'if (process.env.TEST_DATABASE_URL_ADMIN) return process.env.TEST_DATABASE_URL_ADMIN\nconst u = new URL("postgres://placeholder/oneinvest")', 'const u = new URL("postgres://placeholder/oneinvest")\nu.hostname = "127.0.0.1"; u.port = "1"', "  if (x) env.DATABASE_URL = x\n  else delete env.DATABASE_URL"];
  for (const d of lanh) assert.deepEqual(dongLot(d), [], `không được bắt: ${d}`);
  assert.equal(dongLot(`// đọc DATABASE_URL trước\nconst U = "${CHUNG}"`).length, 1, "chữ DATABASE_URL trong chú thích không làm URL cứng thành lành");
});

// Dấu lược đồ (hồ sơ dau-luoc-do-ban-mau). Ma trận viết trước: mỗi ca một câu DDL, AC nó phục vụ, và câu dấu trước vòng này bắt hay sót nó.
// Ca chạy trong giao dịch trên DB rỗng oneinvest_suite_dau_<pid> (tạo từ DB postgres, không chép DB chung), đo ba điểm: dấu trước ca bằng gốc,
// sau ca khác gốc, sau ROLLBACK bằng gốc.
const DAU_MOI = readFileSync(path.join(GOC, "db/dau-luoc-do.sql"), "utf8");
/** Câu dấu trước vòng này (db/db-thu.sh trên main 29a9d988) — đối chứng: nó phải bắt và sót đúng như cột `cu` của ma trận. */
const DAU_CU = `SELECT md5(string_agg(x, '|' ORDER BY x)) FROM (
    SELECT 'c' || table_name || '.' || column_name || ':' || data_type AS x FROM information_schema.columns WHERE table_schema = 'public'
    UNION ALL SELECT 'v' || c.relname || md5(pg_get_viewdef(c.oid)) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('v', 'm') AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype = 'e')
    UNION ALL SELECT 'f' || p.proname || md5(p.prosrc) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')) t`;
/** Hai đột biến của câu mới: bỏ đúng một phần tinh, chỉ các ca của phần ấy được phép sai. */
const DOT_BIEN = {
  "bỏ tgenabled": [" || ':' || t.tgenabled::text", ["DL3-5"]],
  "bỏ typmod": ["format_type(a.atttypid, a.atttypmod)", ["DL5-1", "DL5-2", "DL5-4"]],
};
const thayDot = (cu) => (cu.startsWith(" ||") ? "" : "format_type(a.atttypid, NULL)");

const LUOC_DO_MAU = `
CREATE EXTENSION postgis;
CREATE SCHEMA sync_stage;
CREATE SCHEMA rac_12345;
CREATE TYPE muc AS ENUM ('a', 'b', 'c');
CREATE DOMAIN so_duong AS integer;
CREATE TYPE cap AS (x integer, y text);
CREATE SEQUENCE dem_seq;
CREATE TABLE cha (id integer PRIMARY KEY, ma text NOT NULL);
CREATE TABLE tin (id integer PRIMARY KEY, ten varchar(10) DEFAULT 'x', gia numeric(10,2), so integer, m muc, cha_id integer,
  vi_tri geometry(Point, 4326), ghi text, CONSTRAINT gia_duong CHECK (gia >= 0));
ALTER TABLE tin ADD CONSTRAINT so_nho CHECK (so < 1000) NOT VALID;
CREATE INDEX tin_ten ON tin (ten);
CREATE INDEX tin_gia_mot_phan ON tin (gia) WHERE gia > 0;
CREATE FUNCTION f_kich() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RETURN NEW; END$$;
CREATE FUNCTION f_cong(a integer) RETURNS integer LANGUAGE sql AS 'SELECT a + 1';
CREATE TRIGGER tin_kich BEFORE INSERT ON tin FOR EACH ROW EXECUTE FUNCTION f_kich();
CREATE VIEW v_tin AS SELECT id FROM tin;
CREATE MATERIALIZED VIEW mv_tin AS SELECT id FROM tin;
CREATE TABLE sync_stage.lo (id integer);
CREATE POLICY p_doc ON tin FOR SELECT USING (true);
GRANT SELECT ON tin TO PUBLIC;`;

const MA_TRAN = [
  { ma: "DL1-1", ac: "AC-1", cu: "sot", sql: "ALTER TABLE cha ADD CONSTRAINT ma_dai CHECK (length(ma) > 0)" },
  { ma: "DL1-2", ac: "AC-1", cu: "sot", sql: "ALTER TABLE tin DROP CONSTRAINT gia_duong; ALTER TABLE tin ADD CONSTRAINT gia_duong CHECK (gia > 0)" },
  { ma: "DL1-3", ac: "AC-1", cu: "sot", sql: "ALTER TABLE tin ADD CONSTRAINT tin_cha FOREIGN KEY (cha_id) REFERENCES cha (id)" },
  { ma: "DL1-4", ac: "AC-1", cu: "sot", sql: "ALTER TABLE cha ADD CONSTRAINT cha_ma UNIQUE (ma)" },
  { ma: "DL1-5", ac: "AC-1", cu: "sot", sql: "ALTER TABLE cha DROP CONSTRAINT cha_pkey" },
  { ma: "DL1-6", ac: "AC-1", cu: "sot", sql: "ALTER TABLE tin VALIDATE CONSTRAINT so_nho" },
  { ma: "DL1-7", ac: "AC-1", cu: "sot", sql: "ALTER DOMAIN so_duong ADD CONSTRAINT duong CHECK (VALUE > 0)" },
  { ma: "DL2-1", ac: "AC-2", cu: "sot", sql: "CREATE INDEX tin_so ON tin (so)" },
  { ma: "DL2-2", ac: "AC-2", cu: "sot", sql: "DROP INDEX tin_ten" },
  { ma: "DL2-3", ac: "AC-2", cu: "sot", sql: "DROP INDEX tin_ten; CREATE INDEX tin_ten ON tin (ghi)" },
  { ma: "DL2-4", ac: "AC-2", cu: "sot", sql: "DROP INDEX tin_gia_mot_phan; CREATE INDEX tin_gia_mot_phan ON tin (gia) WHERE gia > 10" },
  { ma: "DL2-5", ac: "AC-2", cu: "sot", sql: "DROP INDEX tin_ten; CREATE UNIQUE INDEX tin_ten ON tin (ten)" },
  { ma: "DL2-6", ac: "AC-2", cu: "sot", sql: "CREATE INDEX mv_tin_id ON mv_tin (id)" },
  { ma: "DL3-1", ac: "AC-3", cu: "sot", sql: "CREATE TRIGGER tin_kich2 AFTER UPDATE ON tin FOR EACH ROW EXECUTE FUNCTION f_kich()" },
  { ma: "DL3-2", ac: "AC-3", cu: "sot", sql: "DROP TRIGGER tin_kich ON tin" },
  { ma: "DL3-3", ac: "AC-3", cu: "sot", sql: "DROP TRIGGER tin_kich ON tin; CREATE TRIGGER tin_kich AFTER INSERT ON tin FOR EACH ROW EXECUTE FUNCTION f_kich()" },
  { ma: "DL3-4", ac: "AC-3", cu: "sot", sql: "DROP TRIGGER tin_kich ON tin; CREATE TRIGGER tin_kich BEFORE UPDATE ON tin FOR EACH ROW EXECUTE FUNCTION f_kich()" },
  { ma: "DL3-5", ac: "AC-3", cu: "sot", sql: "ALTER TABLE tin DISABLE TRIGGER tin_kich" },
  { ma: "DL4-1", ac: "AC-4", cu: "sot", sql: "ALTER TYPE muc ADD VALUE 'd'" },
  { ma: "DL4-2", ac: "AC-4", cu: "sot", sql: "ALTER TYPE muc ADD VALUE 'a0' BEFORE 'b'" },
  { ma: "DL4-3", ac: "AC-4", cu: "sot", sql: "ALTER TYPE muc RENAME VALUE 'a' TO 'a1'" },
  { ma: "DL4-4", ac: "AC-4", cu: "sot", sql: "CREATE TYPE muc2 AS ENUM ('x')" },
  // data_type của information_schema không mang (n), (p,s), SRID; kiểu PostGIS và enum đều là USER-DEFINED.
  { ma: "DL5-1", ac: "AC-5", cu: "sot", sql: "ALTER TABLE tin ALTER COLUMN ten TYPE varchar(20)" },
  { ma: "DL5-2", ac: "AC-5", cu: "sot", sql: "ALTER TABLE tin ALTER COLUMN gia TYPE numeric(12,2)" },
  { ma: "DL5-3", ac: "AC-5", cu: "bat", sql: "ALTER TABLE tin ALTER COLUMN so TYPE bigint" },
  { ma: "DL5-4", ac: "AC-5", cu: "sot", sql: "ALTER TABLE tin ALTER COLUMN vi_tri TYPE geometry(Point, 3857) USING ST_SetSRID(vi_tri, 3857)" },
  { ma: "DL5-5", ac: "AC-5", cu: "sot", sql: 'ALTER TABLE tin ALTER COLUMN ghi TYPE text COLLATE "C"' },
  { ma: "DL5-6", ac: "AC-5", cu: "sot", sql: "ALTER TABLE tin ALTER COLUMN ghi SET NOT NULL" },
  { ma: "DL5-7", ac: "AC-5", cu: "sot", sql: "ALTER TABLE cha ALTER COLUMN ma DROP NOT NULL" },
  { ma: "DL5-8", ac: "AC-5", cu: "sot", sql: "ALTER TABLE tin ALTER COLUMN gia SET DEFAULT 0" },
  { ma: "DL5-9", ac: "AC-5", cu: "sot", sql: "ALTER TABLE tin ALTER COLUMN ten SET DEFAULT 'y'" },
  { ma: "DL5-10", ac: "AC-5", cu: "bat", sql: "ALTER TABLE tin ADD COLUMN gia2 numeric GENERATED ALWAYS AS (gia * 2) STORED" },
  // Câu cũ ghép tên hàm với md5 thân: overload cùng thân thêm một dòng trùng, string_agg giữ dòng trùng nên dấu cũ vẫn đổi.
  { ma: "DL5-11", ac: "AC-5", cu: "bat", sql: "CREATE FUNCTION f_cong(a bigint) RETURNS bigint LANGUAGE sql AS 'SELECT a + 1'" },
  { ma: "DL5-12", ac: "AC-5", cu: "bat", sql: "ALTER TABLE tin ADD COLUMN moi integer" },
  { ma: "DL5-13", ac: "AC-5", cu: "bat", sql: "CREATE OR REPLACE VIEW v_tin AS SELECT id, 1 AS k FROM tin" },
  { ma: "DL5-14", ac: "AC-5", cu: "bat", sql: "CREATE OR REPLACE FUNCTION f_cong(a integer) RETURNS integer LANGUAGE sql AS 'SELECT a + 2'" },
  { ma: "DL6-1", ac: "AC-6", cu: "sot", sql: "ALTER TABLE sync_stage.lo ADD COLUMN x integer" },
  { ma: "DL6-2", ac: "AC-6", cu: "sot", sql: "CREATE SCHEMA moi; CREATE TABLE moi.b (id integer)" },
  { ma: "DL6-3", ac: "AC-6", cu: "sot", sql: "ALTER TABLE cha ENABLE ROW LEVEL SECURITY" },
  { ma: "DL6-4", ac: "AC-6", cu: "sot", sql: "CREATE POLICY p_ghi ON tin FOR INSERT WITH CHECK (true)" },
  { ma: "DL6-5", ac: "AC-6", cu: "sot", sql: "REVOKE SELECT ON tin FROM PUBLIC" },
  { ma: "DL6-6", ac: "AC-6", cu: "sot", sql: "GRANT SELECT ON cha TO PUBLIC" },
  // Hàm của extension bị câu cũ loại theo pg_depend, extension không có cột nào trong public.
  { ma: "DL6-7", ac: "AC-6", cu: "sot", sql: "CREATE EXTENSION pgcrypto" },
  { ma: "DL6-8", ac: "AC-6", cu: "sot", sql: "CREATE DOMAIN so_am AS integer" },
  // information_schema.columns không gồm thuộc tính kiểu composite.
  { ma: "DL6-9", ac: "AC-6", cu: "sot", sql: "ALTER TYPE cap ADD ATTRIBUTE z integer" },
  { ma: "DL6-10", ac: "AC-6", cu: "sot", sql: "ALTER SEQUENCE dem_seq INCREMENT BY 2" },
];
/** AC-7: sự kiện không phải lược đồ — dấu phải bằng gốc. `ngoai`: chạy ngoài giao dịch (VACUUM không chạy được trong giao dịch). */
const KHONG_DOI = [
  { ma: "DL7-1", sql: "INSERT INTO cha VALUES (1, 'a'); INSERT INTO tin (id, gia, cha_id) VALUES (1, 5, 1)" },
  { ma: "DL7-2", sql: "INSERT INTO cha VALUES (2, 'b'); UPDATE cha SET ma = 'c' WHERE id = 2" },
  { ma: "DL7-3", sql: "INSERT INTO cha VALUES (3, 'b'); DELETE FROM cha WHERE id = 3" },
  { ma: "DL7-4", sql: "ANALYZE tin" },
  { ma: "DL7-5", sql: "VACUUM tin", ngoai: true },
  { ma: "DL7-6", sql: "SELECT nextval('dem_seq')" },
  { ma: "DL7-7", sql: "CREATE TABLE rac_12345.b (id integer); CREATE INDEX ON rac_12345.b (id)" },
  { ma: "DL7-8", sql: "DROP SCHEMA rac_12345 CASCADE" },
  { ma: "DL7-9", sql: "SELECT 1" },
];
const DOI_CHUNG_7 = { ma: "DL7-dc", sql: "CREATE SCHEMA rac_moi; CREATE TABLE rac_moi.b (id integer)" };

const MAY_CHU = process.env.DL_PG_ADMIN ?? "postgres://oneinvest:oneinvest@localhost:5433/postgres";
const DB_DAU = `oneinvest_suite_dau_${process.pid}`;
const daNoi = []; // database của mọi kết nối test mở
let ketQua = null;
let conSot = null; // số DB của lượt còn trên máy chủ sau khi dọn
// Chỉ lỗi «máy chủ không nghe» mới được bỏ qua; sai mật khẩu, thiếu DB postgres hay thiếu module pg phải đỏ,
// nếu không lệnh DL- thoát 0 khi không ca nào chạy (lượt chấm S4 r1, AC-9).
const LOI_KHONG_NOI = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "EAI_AGAIN", "EHOSTUNREACH"]);
const laLoiKhongNoi = (e) =>
  LOI_KHONG_NOI.has(e?.code) || (Array.isArray(e?.errors) && e.errors.length > 0 && e.errors.every((x) => LOI_KHONG_NOI.has(x?.code)));
let pgMod = null;
async function noi(database) {
  const pg = pgMod;
  const u = new URL(MAY_CHU);
  u.pathname = `/${database}`;
  const c = new pg.Client({ connectionString: u.toString() });
  await c.connect();
  daNoi.push(database);
  return c;
}
/** Chạy ma trận một lần cho mọi ca DL-. Trả null khi máy không có Postgres (CI=true thì ném lỗi). */
function chayMaTran() {
  ketQua ??= (async () => {
    pgMod = createRequire(path.join(GOC, "app/package.json"))("pg"); // thiếu module thì ném, không bỏ qua
    let qt;
    try {
      qt = await noi("postgres");
    } catch (e) {
      if (process.env.CI === "true") throw new Error(`CI không nối được Postgres ${MAY_CHU}: ${e.message}`);
      if (!laLoiKhongNoi(e)) throw e;
      return null;
    }
    await qt.query(`DROP DATABASE IF EXISTS ${DB_DAU} WITH (FORCE)`);
    await qt.query(`CREATE DATABASE ${DB_DAU}`);
    await qt.end();
    const c = await noi(DB_DAU);
    try {
      await c.query(LUOC_DO_MAU);
      const cau = { moi: DAU_MOI, cu: DAU_CU };
      // Đột biến không khớp câu thì không chạy; DL-AC-9 đỏ vì thiếu nó, các ca khác vẫn đo câu mới.
      for (const [ten, [cu]] of Object.entries(DOT_BIEN)) if (DAU_MOI.includes(cu)) cau[ten] = DAU_MOI.replace(cu, thayDot(cu));
      const dau = async () => Object.fromEntries(await Promise.all(Object.entries(cau).map(async ([k, q]) => [k, (await c.query(q)).rows[0].md5])));
      const goc = await dau();
      const ca = {};
      for (const m of [...MA_TRAN, ...KHONG_DOI, DOI_CHUNG_7]) {
        if (m.ngoai) {
          await c.query(m.sql);
          const sau = await dau();
          ca[m.ma] = { truoc: sau.moi, sau, hoan: sau.moi };
          continue;
        }
        await c.query("BEGIN");
        const truoc = (await dau()).moi;
        await c.query(m.sql);
        const sau = await dau();
        await c.query("ROLLBACK");
        ca[m.ma] = { truoc, sau, hoan: (await dau()).moi };
      }
      return { goc, ca };
    } finally {
      await c.end();
      const don = await noi("postgres");
      await don.query(`DROP DATABASE IF EXISTS ${DB_DAU} WITH (FORCE)`);
      conSot = (await don.query("SELECT count(*)::int AS n FROM pg_database WHERE datname = $1", [DB_DAU])).rows[0].n;
      await don.end();
    }
  })();
  return ketQua;
}
after(async () => { if (ketQua) await ketQua.catch(() => {}); });

/** Ba điểm của một ca: lỗi đầu tiên, hoặc null. */
function baDiem({ goc, ca }, m) {
  const r = ca[m.ma];
  if (r.truoc !== goc.moi) return `nền lệch trước ca: ${m.ma}`;
  if (r.sau.moi === goc.moi) return `câu dấu bỏ sót: ${m.ma} ${m.sql}`;
  if (r.hoan !== goc.moi) return `dấu không về gốc sau ROLLBACK: ${m.ma}`;
  return null;
}
for (const ac of ["AC-1", "AC-2", "AC-3", "AC-4", "AC-5", "AC-6"]) {
  test(`DL-${ac} mỗi ca của ma trận đổi dấu theo ba điểm`, async (t) => {
    const kq = await chayMaTran();
    if (!kq) return t.skip("không có Postgres :5433");
    const cac = MA_TRAN.filter((m) => m.ac === ac);
    assert.ok(cac.length > 0);
    let dem = 0;
    for (const m of cac) {
      assert.equal(baDiem(kq, m), null);
      dem++;
    }
    assert.equal(dem, cac.length, "số ca đã đo phải bằng số phần tử ma trận của AC");
  });
}

test("DL-AC-7 dữ liệu, thống kê, sequence, schema rác và đọc lặp không đổi dấu; schema không đuôi số thì đổi", async (t) => {
  const kq = await chayMaTran();
  if (!kq) return t.skip("không có Postgres :5433");
  for (const m of KHONG_DOI) {
    const r = kq.ca[m.ma];
    assert.equal(r.sau.moi, kq.goc.moi, `dấu đổi vì sự kiện không phải lược đồ: ${m.ma} ${m.sql}`);
    assert.equal(r.hoan, kq.goc.moi, `dấu không về gốc: ${m.ma}`);
  }
  assert.equal(baDiem(kq, DOI_CHUNG_7), null, "đối chứng: schema rac_moi không đuôi số phải vào dấu");
});

test("DL-AC-9 câu cũ khớp từng ô kỳ vọng, đột biến chỉ làm sai đúng ca của nó, test chỉ nối DB của nó và xoá DB khi xong", async (t) => {
  const kq = await chayMaTran();
  if (!kq) return t.skip("không có Postgres :5433");
  let dem = 0;
  for (const m of MA_TRAN) {
    const bat = kq.ca[m.ma].sau.cu !== kq.goc.cu;
    assert.equal(bat ? "bat" : "sot", m.cu, `câu cũ lệch kỳ vọng: ${m.ma} ${m.sql}`);
    dem++;
  }
  assert.equal(dem, MA_TRAN.length);
  for (const [ten, [, sai]] of Object.entries(DOT_BIEN)) {
    assert.ok(ten in kq.goc, `đột biến «${ten}» không khớp câu dấu — chiều đỏ rỗng`);
    const thatSai = MA_TRAN.filter((m) => kq.ca[m.ma].sau[ten] === kq.goc[ten]).map((m) => m.ma);
    assert.deepEqual(thatSai, sai, `đột biến «${ten}» lệch: phải sai đúng ${sai.join(", ")}`);
  }
  assert.deepEqual([...new Set(daNoi)].sort(), [DB_DAU, "postgres"].sort(), "test chỉ được nối DB postgres và DB của nó");
  assert.equal(conSot, 0, `${DB_DAU} phải bị xoá khi xong`);
});

test("DL-AC-9b chỉ lỗi máy chủ không nghe mới cho bỏ qua ca DL-; sai mật khẩu, thiếu DB, thiếu module thì đỏ", () => {
  const loi = (code) => Object.assign(new Error(code), { code });
  for (const c of ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT"]) assert.equal(laLoiKhongNoi(loi(c)), true, `bỏ qua được: ${c}`);
  assert.equal(laLoiKhongNoi(Object.assign(new AggregateError([loi("ECONNREFUSED"), loi("ECONNREFUSED")]), {})), true, "cả ::1 lẫn 127.0.0.1 từ chối");
  for (const c of ["28P01", "3D000", "MODULE_NOT_FOUND", undefined]) assert.equal(laLoiKhongNoi(loi(c)), false, `không được bỏ qua: ${c}`);
  assert.equal(laLoiKhongNoi(new AggregateError([loi("ECONNREFUSED"), loi("28P01")])), false, "một nhánh lỗi khác thì không bỏ qua");
});

/** Lỗi chỉ đọc của lời gọi dấu trong log docker giả, hoặc null. Đọc từ argv docker ghi lại, không từ biến môi trường. */
const CO_CHI_DOC = "-e PGOPTIONS=-c default_transaction_read_only=on";
function loiChiDoc(log) {
  const goi = dong(log).filter((l) => l.includes("md5(string_agg"));
  if (goi.length === 0) return "không thấy lời gọi dấu";
  if (!goi.every((l) => l.includes(CO_CHI_DOC) && l.includes(DAU_MOI.replace(/\n/g, " ").trim()))) return "dấu không chạy chỉ đọc";
  return null;
}
test("DL-AC-8 dấu đọc từ db/dau-luoc-do.sql, chạy chỉ đọc, --dau in dấu mà không chép hay dump", () => {
  assert.doesNotMatch(readFileSync(SH, "utf8"), /SELECT md5/, "db-thu.sh không được giữ câu dấu riêng");
  const { d, log } = dung({ dau: "dauthu" });
  const r = spawnSync("bash", [SH, "--dau"], { env: moiTruong(d), encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), "dauthu");
  assert.equal(loiChiDoc(log), null);
  assert.ok(!dong(log).some((l) => /createdb|pg_dump -U|dropdb/.test(l)), "--dau không được chép, dump hay xoá DB");
  const c = dung();
  chay(c.d);
  assert.equal(loiChiDoc(c.log), null, "lời gọi dấu của --chay cũng phải chỉ đọc");
});

test("DL-AC-8 đối chứng: bản chép script bỏ cờ chỉ đọc thì thước đỏ", () => {
  const { d, log } = dung();
  const goc = readFileSync(SH, "utf8");
  const dot = goc.replace(` -e "PGOPTIONS=-c default_transaction_read_only=on"`, "");
  assert.notEqual(dot, goc, "đột biến không đổi mã — chiều đỏ rỗng");
  writeFileSync(path.join(d, "db-thu.sh"), dot);
  copyFileSync(path.join(GOC, "db/dau-luoc-do.sql"), path.join(d, "dau-luoc-do.sql"));
  spawnSync("bash", [path.join(d, "db-thu.sh"), "--dau"], { env: moiTruong(d), encoding: "utf8" });
  assert.equal(loiChiDoc(log), "dấu không chạy chỉ đọc");
});
