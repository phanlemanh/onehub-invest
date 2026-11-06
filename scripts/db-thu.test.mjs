// db-thu.test.mjs — hồ sơ test-suite-db-thu E1: chế độ --chay của db/db-thu.sh. Docker giả trong PATH ghi lại mọi lệnh,
// không cần Postgres. Câu đo là «lệnh nhận DATABASE_URL nào, và DB chung có nhận lệnh ghi nào không».
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
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
printf '%s\\n' "$*" >> ${JSON.stringify(log)}
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
