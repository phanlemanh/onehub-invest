// node --test scripts/zalo-import-job-khoa.itest.mjs   (qua: bash db/db-thu.sh oneinvest_suite_zik --chay …)
// Hồ sơ s03-len-nhanh-nac-1 AC-3 (cross-layer): tệp bọc nạp S03 THẬT, lượt nhanh (--luot-nhanh), node thật, transform thật,
// trên DB của riêng lượt (bản chép DB chung; từ chối DB tên oneinvest). Cây tạm: tệp bọc + job-step.sh chép nguyên,
// pipeline/ là liên kết tới từng mục của pipeline thật TRỪ logs/ (thư mục thật trong cây tạm — state, sổ đếm không chạm cây
// thật), collector/snapshots rỗng (phần nạp không có gì để nạp). Một phiên pg giữ khoá ACCESS EXCLUSIVE trên stg_zalo_posts.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(REPO, "pipeline/package.json"))("pg");
const DB_URL = process.env.DATABASE_URL ?? "";
const SCRATCH = mkdtempSync(path.join(realpathSync(tmpdir()), "zalo-import-khoa-"));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
const BO = "BỎ LƯỢT [zalo-import-daily] bước transform-zalo: đụng khoá";

before(() => {
  assert.ok(DB_URL, "SK: thiếu DATABASE_URL — chạy qua db/db-thu.sh --chay");
  assert.notEqual(new URL(DB_URL).pathname.replace(/^\//, ""), "oneinvest", "SK: từ chối chạy trên DB dùng chung oneinvest");
});

function cay() {
  const root = mkdtempSync(path.join(SCRATCH, "cay-"));
  for (const rel of ["scripts/zalo-import-daily.sh", "scripts/lib/job-step.sh"]) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    copyFileSync(path.join(REPO, rel), path.join(root, rel));
  }
  mkdirSync(path.join(root, "pipeline/logs"), { recursive: true });
  for (const t of readdirSync(path.join(REPO, "pipeline"))) {
    if (t === "logs") continue;
    symlinkSync(path.join(REPO, "pipeline", t), path.join(root, "pipeline", t));
  }
  mkdirSync(path.join(root, "collector/snapshots"), { recursive: true });
  return root;
}

/** Chạy tệp bọc lượt nhanh; trả {xong, thayBo (ms tới dòng BỎ LƯỢT transform-zalo hoặc null), kill}. */
function chay(root, env) {
  const t0 = Date.now();
  const con = spawn("/bin/bash", [path.join(root, "scripts/zalo-import-daily.sh"), "--luot-nhanh"], {
    cwd: root, env: { ...process.env, DATABASE_URL: DB_URL, ...env }, stdio: ["ignore", "pipe", "pipe"], detached: true,
  });
  let err = "";
  let out = "";
  let thayBo = null;
  con.stderr.on("data", (d) => { err += d; if (thayBo === null && err.includes(BO)) thayBo = Date.now() - t0; });
  con.stdout.on("data", (d) => { out += d; });
  const xong = new Promise((res) => con.on("close", (code, sig) => res({ code, sig, err, out })));
  // Giết cả nhóm tiến trình (bash + node con), không để node chạy tiếp sau khi nhả khoá.
  const kill = () => { try { process.kill(-con.pid, "SIGKILL"); } catch { /* đã xong */ } };
  return { xong, thay: () => thayBo, kill };
}

async function demS03(c) {
  return Number((await c.query(`SELECT count(*) n FROM sale_offers WHERE source = 'S03'`)).rows[0].n);
}
async function giuKhoa() {
  const a = new pg.Client({ connectionString: DB_URL });
  await a.connect();
  await a.query("BEGIN");
  await a.query("LOCK TABLE stg_zalo_posts IN ACCESS EXCLUSIVE MODE");
  return async () => { await a.query("ROLLBACK"); await a.end(); };
}
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

let C;
before(async () => { C = new pg.Client({ connectionString: DB_URL }); await C.connect(); });
after(async () => { await C?.end(); });

test("SK-AC-3 giữ khoá stg_zalo_posts: lượt nhanh thật BỎ LƯỢT transform-zalo trong 30 s, thoát 0, sale_offers S03 không đổi", async () => {
  const truoc = await demS03(C);
  const nha = await giuKhoa();
  let k;
  const r = chay(cay(), { S03_NHANH_LOCK_TIMEOUT: "2s" });
  try { k = await Promise.race([r.xong, ngu(300_000).then(() => { r.kill(); return { code: null, err: "quá 300 s" }; })]); } finally { await nha(); }
  assert.equal(k.code, 0, `SK-AC-3 thoát ${k.code}: ${k.err.slice(-600)}`);
  assert.ok(r.thay() !== null, `SK-AC-3 không có dòng BỎ LƯỢT: ${k.err.slice(-600)}`);
  assert.ok(r.thay() < 30_000, `SK-AC-3 BỎ LƯỢT sau ${r.thay()} ms`);
  assert.equal(await demS03(C), truoc, "SK-AC-3 sale_offers S03 đổi sau lượt bỏ");
});

test("SK-AC-3 đối chứng: không ai giữ khoá → transform-zalo xong, không BỎ LƯỢT, không JOB FAIL", async () => {
  const r = chay(cay(), {});
  const k = await Promise.race([r.xong, ngu(400_000).then(() => { r.kill(); return { code: null, err: "quá 400 s" }; })]);
  assert.equal(k.code, 0, `SK-AC-3 đối chứng thoát ${k.code}: ${k.err.slice(-600)}`);
  assert.ok(!k.err.includes("BỎ LƯỢT"), `SK-AC-3 đối chứng có BỎ LƯỢT: ${k.err.slice(-400)}`);
  assert.ok(!k.err.includes("JOB FAIL"), `SK-AC-3 đối chứng có JOB FAIL: ${k.err.slice(-400)}`);
});

test("SK-AC-3 chiều đỏ: lock_timeout tắt (0) → lượt nhanh treo sau khoá (bị giết sau 20 s)", async () => {
  const nha = await giuKhoa();
  const r = chay(cay(), { S03_NHANH_LOCK_TIMEOUT: "0" });
  const k = await Promise.race([r.xong.then((x) => ({ ...x, xong: true })), ngu(20_000).then(() => ({ xong: false }))]);
  r.kill();
  await nha();
  await r.xong;
  assert.equal(k.xong, false, "SK-AC-3 không lock_timeout thì treo sau khoá — lượt lại xong trong 20 s, thước không phân biệt");
});
