// node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.itest.mjs
// Hồ sơ sao-luu-ma-hoa-b2 E6 (AC-6, cross-layer): một container PostGIS THẢI BỎ cùng ảnh với one-invest-db, DB «oneinvest»
// nhỏ tự dựng bên trong — KHÔNG đụng container hay DB oneinvest dùng chung. Bản dump đi qua ĐÚNG scripts/db-sao-luu.sh (lệnh
// dump mặc định của chay, DB_CONTAINER trỏ container thải bỏ), vào kho restic cục bộ dưới thư mục tạm, rồi kiem-db khôi phục
// vào DB thử khác trong cùng container và so số dòng với so-dong.tsv. Container bị xoá ở after().
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

import { chay, docCauHinh, khoiTao, kiemDb } from "./lib/sao-luu-ngoai-may.mjs";

const GOC_KHO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ANH = spawnSync("docker", ["inspect", "-f", "{{.Config.Image}}", process.env.DB_CONTAINER || "one-invest-db"], { encoding: "utf8" }).stdout.trim()
  || "kartoza/postgis:17-3.5";
const C = `oneinvest-u1-saoluu-${randomBytes(3).toString("hex")}`;
const NGUON = "oneinvest";
// Gốc phép thử dưới $HOME (không /var/folders): Colima chỉ gắn $HOME, container phụ của db-sao-luu.sh mới ghi được dump ra máy.
const goc = fs.mkdtempSync(path.join(os.homedir(), ".onehub-itest-sao-luu-"));

function psql(db, sql) {
  const r = spawnSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", C, "psql", "-U", "oneinvest", "-h", "localhost", "-At", "-q",
    "-v", "ON_ERROR_STOP=1", "-d", db], { input: sql, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`psql ${db}: ${r.stderr}`);
  return r.stdout;
}

function dbCon() {
  return psql("postgres", "select datname from pg_database order by 1;\n").split("\n").filter(Boolean);
}

function dungMoiTruong({ lechSoDong = false } = {}) {
  const g = fs.mkdtempSync(path.join(goc, "f-"));
  const home = path.join(g, "home");
  const cauHinh = path.join(home, ".oneinvest", "b2.env");
  fs.mkdirSync(path.dirname(cauHinh), { recursive: true });
  const gia = (ten) => `${ten}-CANARY-${randomBytes(6).toString("hex")}`;
  fs.writeFileSync(cauHinh, [`RESTIC_REPOSITORY=${path.join(g, "kho")}`, `B2_ACCOUNT_ID=${gia("B2ID")}`, `B2_ACCOUNT_KEY=${gia("B2KEY")}`, ""].join("\n"), { mode: 0o600 });
  const thuMuc = path.join(home, ".oneinvest", "sao-luu");
  fs.mkdirSync(thuMuc, { recursive: true });
  fs.writeFileSync(path.join(thuMuc, "da-cat-khoa"), "đã cất\n");
  const kc = path.join(g, "kc");
  fs.mkdirSync(kc);
  const security = path.join(g, "security");
  fs.writeFileSync(security, `#!/bin/bash
D=${JSON.stringify(kc)}
cmd=$1; shift; s=""; w=0; pw=""
while [ $# -gt 0 ]; do case $1 in -s) s=$2; shift 2;; -a) shift 2;; -w) if [ $# -ge 2 ]; then pw=$2; shift 2; else w=1; shift; fi;; *) shift;; esac; done
case $cmd in
  find-generic-password) [ -f "$D/$s" ] || exit 44; [ $w = 1 ] && cat "$D/$s"; exit 0;;
  add-generic-password) [ -f "$D/$s" ] && exit 45; printf %s "$pw" > "$D/$s"; exit 0;;
esac
exit 2
`, { mode: 0o755 });
  // Lệnh dump = đúng scripts/db-sao-luu.sh; ca đỏ chỉ sửa so-dong.tsv SAU khi script thật đã ghi xong.
  // Bản chép so-dong.tsv do script thật ghi (trước khi ca đỏ sửa) — lượt ok dọn thư mục dump nên đọc từ bản chép.
  const tsvSao = path.join(g, "so-dong-ban-sao.tsv");
  const lenhDump = `bash ${JSON.stringify(path.join(GOC_KHO, "scripts", "db-sao-luu.sh"))} "$1" && cp "$1/so-dong.tsv" ${JSON.stringify(tsvSao)}` +
    (lechSoDong ? ` && perl -pi -e 's/^public\\.t_nam\\t5$/public.t_nam\\t6/' "$1/so-dong.tsv"` : "") + " && true";
  const gocNguon = path.join(g, "goc");
  fs.mkdirSync(path.join(gocNguon, "collector", "snapshots"), { recursive: true });
  fs.writeFileSync(path.join(gocNguon, "collector", "snapshots", "a.json"), "{}\n");
  const env = {
    SAO_LUU_CAU_HINH: cauHinh, SAO_LUU_THU_MUC: thuMuc, SAO_LUU_SECURITY: security, SAO_LUU_GOC_NGUON: gocNguon,
    SAO_LUU_LENH_DUMP: lenhDump, SAO_LUU_RESTIC: "restic", DB_CONTAINER: C,
  };
  const cfg = docCauHinh({ env, home });
  assert.equal(khoiTao(cfg).ma, 0, "khoi-tao kho thử");
  cfg.tsvSao = tsvSao;
  return cfg;
}

before(() => {
  const r = spawnSync("docker", ["run", "-d", "--name", C, "-e", "POSTGRES_USER=oneinvest", "-e", "POSTGRES_PASS=oneinvest",
    "-e", "POSTGRES_DB=oneinvest", "-e", "POSTGRES_MULTIPLE_EXTENSIONS=postgis", ANH], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`docker run: ${r.stderr}`);
  const het = Date.now() + 180_000;
  for (;;) {
    // Ảnh kartoza dựng cụm bằng một server tạm rồi tắt và khởi động lại — chỉ coi là sẵn sàng sau dòng «restarting in
    // foreground» VÀ một lời gọi psql thành công sau đó; gọi sớm hơn thì phiên của db-sao-luu.sh bị cắt giữa chừng.
    const log = spawnSync("docker", ["logs", C], { encoding: "utf8" });
    const daKhoiDongLai = /restarting in foreground/.test((log.stdout || "") + (log.stderr || ""));
    const ok = daKhoiDongLai && spawnSync("docker", ["exec", "-e", "PGPASSWORD=oneinvest", C, "psql", "-U", "oneinvest", "-h", "localhost", "-At",
      "-d", "oneinvest", "-c", "select 1"], { encoding: "utf8" });
    if (ok && ok.status === 0 && ok.stdout.trim() === "1") break;
    if (Date.now() > het) throw new Error(`container ${C} không sẵn sàng sau 180s`);
    spawnSync("sleep", ["2"]);
  }
  psql(NGUON, "create table t_ba (id int); insert into t_ba select generate_series(1,3);\n" +
    "create table t_nam (id int, x text); insert into t_nam select g, 'x'||g from generate_series(1,5) g;\n");
});

after(() => {
  try { spawnSync("docker", ["rm", "-f", "-v", C]); } finally { fs.rmSync(goc, { recursive: true, force: true }); }
});

describe("E6 kiem-db (AC-6)", () => {
  test("bản dump khôi phục vào DB thử có số dòng khớp so-dong.tsv; DB thử bị xoá", () => {
    const cfg = dungMoiTruong();
    const r = chay(cfg);
    assert.equal(r.ma, 0, `E6: chay — ${r.lyDo}`);
    const truoc = dbCon();
    const k = kiemDb(cfg);
    assert.equal(k.ma, 0, `E6: kiem-db — ${k.thongDiep}`);
    assert.deepEqual(k.bangLech, [], "E6: bảng lệch");
    assert.match(k.thongDiep, /\d+ bảng khớp/, "E6: số bảng đã so");
    const tsv = fs.readFileSync(cfg.tsvSao, "utf8");
    assert.match(tsv, /^public\.t_ba\t3$/m, "E6: so-dong.tsv của db-sao-luu.sh có t_ba");
    assert.match(tsv, /^public\.t_nam\t5$/m, "E6: so-dong.tsv của db-sao-luu.sh có t_nam");
    assert.deepEqual(dbCon(), truoc, "E6: DB thử còn sót sau kiem-db");
  });

  test("so-dong.tsv lệch một dòng → mã 1 nêu bảng lệch", () => {
    const cfg = dungMoiTruong({ lechSoDong: true });
    assert.equal(chay(cfg).ma, 0, "E6 đỏ: chay");
    const k = kiemDb(cfg);
    assert.equal(k.ma, 1, "E6 đỏ: mã");
    assert.deepEqual(k.bangLech, ["public.t_nam"], "E6 đỏ: bảng lệch");
  });
});
