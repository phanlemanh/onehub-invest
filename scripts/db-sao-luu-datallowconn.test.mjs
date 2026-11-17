// db-sao-luu-datallowconn.test.mjs — itest 1711-16 (a)(b)(c) trên CỤM THẬT bỏ đi.
// CHẠY LẺ (cần docker + ảnh DB): node --test --test-concurrency=1 scripts/db-sao-luu-datallowconn.test.mjs
// Dựng MỘT container PostGIS thải bỏ cùng ảnh với one-invest-db (KHÔNG đụng cụm dùng
// chung), dựng DB phụ «ok» (nhận kết nối) và DB «dc» tắt nhận kết nối
// (ALLOW_CONNECTIONS false), rồi chạy ĐÚNG scripts/db-sao-luu.sh với DB_CONTAINER trỏ
// container thải bỏ:
//   (a) DB_SAO_LUU_CHI=<dc> → script ĐI QUA (thoát 0, chỉ globals + manifest) — DB tắt
//       kết nối bị lọc; CA ĐỎ: gỡ bộ lọc datallowconn (đột biến) → pg_dump dc lỗi → thoát 1.
//   (c) KHÔNG CHI (mọi DB) → lọc dc, dump ok → thoát 0 + manifest có dump; gỡ lọc →
//       dc lỗi → thoát 1 NHƯNG manifest.sha256 VẪN có (phần đã dump) + stderr nêu DB lỗi.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs, { existsSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SCRIPT = path.join(REPO, "scripts", "db-sao-luu.sh");
const ANH =
  spawnSync("docker", ["inspect", "-f", "{{.Config.Image}}", process.env.DB_CONTAINER || "one-invest-db"], { encoding: "utf8" }).stdout.trim() ||
  "kartoza/postgis:17-3.5";
const C = `oneinvest-u1-dcam-${randomBytes(3).toString("hex")}`;
// Gốc phép thử dưới $HOME: Colima chỉ gắn $HOME, container phụ của db-sao-luu.sh ghi dump ra máy.
const goc = fs.mkdtempSync(path.join(os.homedir(), ".onehub-itest-dcam-"));
const CO_DOCKER = spawnSync("docker", ["info"], { encoding: "utf8" }).status === 0;

function psql(sql, db = "postgres") {
  const r = spawnSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", C, "psql", "-U", "oneinvest", "-h", "localhost", "-At", "-q",
    "-v", "ON_ERROR_STOP=1", "-d", db], { input: sql, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`psql ${db}: ${r.stderr}`);
  return r.stdout;
}

before(async () => {
  if (!CO_DOCKER) return;
  const r = spawnSync("docker", ["run", "-d", "--name", C, "-e", "POSTGRES_USER=oneinvest", "-e", "POSTGRES_PASSWORD=oneinvest", "-e", "POSTGRES_DB=oneinvest", ANH], { encoding: "utf8" });
  assert.equal(r.status, 0, `dựng container thải bỏ: ${r.stderr}`);
  for (let i = 0; i < 60; i++) {
    if (spawnSync("docker", ["exec", C, "pg_isready", "-U", "oneinvest"], { encoding: "utf8" }).status === 0) break;
    await new Promise((ok) => setTimeout(ok, 2000));
    assert.ok(i < 59, "postgres trong container thải bỏ không sẵn sàng sau 2 phút");
  }
  psql("CREATE DATABASE oneinvest_suite_sllt_ok;"); // phụ nhận kết nối — dump được
  psql("CREATE DATABASE oneinvest_suite_sllt_dc;");
  psql("ALTER DATABASE oneinvest_suite_sllt_dc ALLOW_CONNECTIONS false;"); // (a): DB tắt nhận kết nối
});

after(() => {
  if (CO_DOCKER) spawnSync("docker", ["rm", "-f", C], { encoding: "utf8" });
  rmSync(goc, { recursive: true, force: true });
});

/** Chạy script với DB_BACKUP_ROOT=<goc>/x-<lượt>, trả { r, banDir } — banDir = thư mục bản UTC mới nhất. */
let soLan = 0;
function chay(envThem = {}, script = SCRIPT) {
  soLan++;
  const x = path.join(goc, `x-${soLan}`);
  const r = spawnSync("bash", [script], {
    encoding: "utf8",
    timeout: 300_000,
    env: { ...process.env, DB_CONTAINER: C, DB_BACKUP_ROOT: x, ...envThem },
  });
  const cacBan = existsSync(x) ? fs.readdirSync(x).filter((d) => /^[0-9]{8}T[0-9]{6}Z$/.test(d)).sort() : [];
  return { r, banDir: cacBan.length ? path.join(x, cacBan[cacBan.length - 1]) : null };
}

test("1711-16(a): DB tắt nhận kết nối bị lọc — CHI=<dc> → script đi qua thoát 0, chỉ globals + manifest", () => {
  const { r, banDir } = chay({ DB_SAO_LUU_CHI: "oneinvest_suite_sllt_dc" });
  assert.equal(r.status, 0, `script đi qua — stderr=${(r.stderr || "").slice(0, 300)}`);
  assert.ok(banDir, "có thư mục bản");
  const ban = fs.readdirSync(banDir);
  assert.ok(ban.includes("globals.sql"), "có globals.sql");
  assert.ok(ban.includes("manifest.sha256"), "có manifest.sha256");
  assert.ok(!ban.includes("oneinvest_suite_sllt_dc.dump"), "DB tắt kết nối KHÔNG được dump (đã lọc)");
});

test("CA ĐỎ 1711-16(a): gỡ bộ lọc datallowconn → pg_dump dc lỗi → thoát khác 0", () => {
  const gocLib = fs.readFileSync(SCRIPT, "utf8");
  const dotBien = gocLib.replaceAll(" and datallowconn", ""); // gỡ lọc CẢ hai nhánh (mặc định + CHI)
  assert.notEqual(dotBien, gocLib, "đột biến không khớp mã thật — ca đỏ mất chiều");
  const viLib = path.join(goc, "db-sao-luu-dot-bien.sh");
  fs.writeFileSync(viLib, dotBien);
  try {
    const { r } = chay({ DB_SAO_LUU_CHI: "oneinvest_suite_sllt_dc" }, viLib);
    assert.notEqual(r.status, 0, `gỡ lọc → dc dump lỗi → phải thoát khác 0 — thực tế ${r.status}`);
  } finally {
    fs.rmSync(viLib, { force: true });
  }
});

test("1711-16(c): gỡ lọc → dc lỗi nhưng manifest VẪN phủ phần đã dump, stderr nêu DB lỗi, thoát 1", () => {
  const gocLib = fs.readFileSync(SCRIPT, "utf8");
  const dotBien = gocLib.replace(" and datallowconn", ""); // dc rơi vào vòng dump phụ
  const viLib = path.join(goc, "db-sao-luu-dot-bien-c.sh");
  fs.writeFileSync(viLib, dotBien);
  try {
    const { r, banDir } = chay({}, viLib);
    assert.equal(r.status, 1, `một DB phụ lỗi → thoát 1 — thực tế ${r.status}`);
    assert.ok(banDir, "vẫn có thư mục bản");
    const ban = fs.readdirSync(banDir);
    assert.ok(ban.includes("manifest.sha256"), "manifest.sha256 VẪN được ghi cho phần đã dump");
    assert.ok(ban.includes("oneinvest.dump"), "dump DB chính còn nguyên");
    assert.ok(ban.includes("globals.sql"), "globals.sql vẫn có (phần cốt của cụm)");
    assert.match(r.stderr, /CÓ DB PHỤ LỖI: oneinvest_suite_sllt_dc/, "stderr nêu đúng DB lỗi");
  } finally {
    fs.rmSync(viLib, { force: true });
  }
});

test("1711-16(b)+(c): không CHI — lọc dc, dump ok → thoát 0, manifest khớp", () => {
  const { r, banDir } = chay({});
  assert.equal(r.status, 0, `mặc định mọi DB (dc bị lọc) → thoát 0 — stderr=${(r.stderr || "").slice(0, 300)}`);
  assert.ok(banDir, "có thư mục bản");
  const ban = fs.readdirSync(banDir);
  assert.ok(ban.includes("oneinvest.dump") && ban.includes("oneinvest_suite_sllt_ok.dump"), "dump DB chính + DB phụ ok");
  assert.ok(!ban.includes("oneinvest_suite_sllt_dc.dump"), "dc bị lọc — không có dump");
  const c = spawnSync("shasum", ["-a", "256", "-c", "manifest.sha256", "--status"], { cwd: banDir });
  assert.equal(c.status, 0, "manifest khớp toàn bộ tệp bản sao");
});
