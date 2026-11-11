// node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.itest.mjs
// Hồ sơ sao-luu-ma-hoa-b2 E6 (AC-6, cross-layer): DB nguồn nhỏ tự dựng trên server :5433 (container one-invest-db) — KHÔNG dump
// DB oneinvest dùng chung. Lệnh dump giả: pg_dump -Fc của DB nguồn + so-dong.tsv đếm bằng đúng câu DEM_SQL rút từ
// scripts/db-sao-luu.sh. Rồi chay vào kho restic cục bộ dưới thư mục tạm → kiem-db khôi phục vào DB thử khác và so số dòng.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

import { chay, docCauHinh, khoiTao, kiemDb, rutDemSql } from "./lib/sao-luu-ngoai-may.mjs";

const C = process.env.DB_CONTAINER || "one-invest-db";
const NGUON = `oneinvest_u1_saoluu_src_${randomBytes(3).toString("hex")}`;
const goc = fs.mkdtempSync(path.join(os.tmpdir(), "sl-itest-"));

function psql(db, sql) {
  const r = spawnSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", C, "psql", "-U", "oneinvest", "-h", "localhost", "-At", "-q",
    "-v", "ON_ERROR_STOP=1", "-d", db], { input: sql, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`psql ${db}: ${r.stderr}`);
  return r.stdout;
}

function dbCon() {
  return psql("postgres", "select datname from pg_database where datname like 'oneinvest_u1_saoluu_%' order by 1;\n").split("\n").filter(Boolean);
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
  const demSql = path.join(g, "dem.sql");
  fs.writeFileSync(demSql, `${rutDemSql()} \\gexec\n`);
  const dump = path.join(g, "dump.sh");
  fs.writeFileSync(dump, `#!/bin/bash
set -euo pipefail
mkdir -p "$1"
docker exec -e PGPASSWORD=oneinvest ${C} pg_dump -U oneinvest -h localhost -Fc ${NGUON} > "$1/oneinvest.dump"
docker exec -i -e PGPASSWORD=oneinvest ${C} psql -U oneinvest -h localhost -At -q -v ON_ERROR_STOP=1 -d ${NGUON} < ${JSON.stringify(demSql)} > "$1/so-dong.tsv"
${lechSoDong ? `sed -i '' 's/\\t5$/\\t6/' "$1/so-dong.tsv"` : ""}
`, { mode: 0o755 });
  const gocNguon = path.join(g, "goc");
  fs.mkdirSync(path.join(gocNguon, "collector", "snapshots"), { recursive: true });
  fs.writeFileSync(path.join(gocNguon, "collector", "snapshots", "a.json"), "{}\n");
  const env = {
    SAO_LUU_CAU_HINH: cauHinh, SAO_LUU_THU_MUC: thuMuc, SAO_LUU_SECURITY: security, SAO_LUU_GOC_NGUON: gocNguon,
    SAO_LUU_LENH_DUMP: `bash ${dump}`, SAO_LUU_RESTIC: "restic", DB_CONTAINER: C,
  };
  const cfg = docCauHinh({ env, home });
  assert.equal(khoiTao(cfg).ma, 0, "khoi-tao kho thử");
  return cfg;
}

before(() => {
  psql("postgres", `CREATE DATABASE ${NGUON};\n`);
  psql(NGUON, "create table t_ba (id int); insert into t_ba select generate_series(1,3);\n" +
    "create table t_nam (id int, x text); insert into t_nam select g, 'x'||g from generate_series(1,5) g;\n");
});

after(() => {
  try { psql("postgres", `DROP DATABASE IF EXISTS ${NGUON} WITH (FORCE);\n`); } finally { fs.rmSync(goc, { recursive: true, force: true }); }
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
    assert.match(k.thongDiep, /2 bảng khớp/, "E6: số bảng đã so");
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
