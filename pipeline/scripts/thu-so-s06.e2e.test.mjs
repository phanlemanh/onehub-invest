// thu-so-s06.e2e.test.mjs — 0311-3 MỞ LẠI vòng 4: chạy MỘT LƯỢT THẬT qua main,
// không gọi nguồn thật: máy chủ HTTP giả trên 127.0.0.1 (S06_WEB_BASE), lược đồ
// tạm qua search_path (DATABASE_URL), state + snapshot riêng (S06_STATE_DIR /
// S06_SNAP_ROOT), cổng CDP riêng, Chrome ngoài màn hình và phải TẮT sau lượt.
// Ba kịch bản: (i) trang có số → thoát 0, có [nấc] + [đối chiếu], số vào stg tạm;
// (ii) 429 + Retry-After → thoát 2, in số giây, dừng ngay; (iii) SIGTERM giữa
// lượt → thoát 130, số đã thu vẫn vào stg tạm. Sau mỗi kịch bản: không còn tiến
// trình Chrome chứa profileDir của kịch bản, tệp PID trống.
import test from "node:test"; import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import pg from "pg";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SCRIPT = join(ROOT, "pipeline", "thu-so-s06.mjs");
const DB_BASE = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const run = promisify(execFile);

let dem = 0;
async function dungHạTang(cheDo) {
  dem += 1;
  const sc = `e2e_s06_${process.pid}_${dem}`;
  const stateDir = mkdtempSync(join(tmpdir(), "e2e-s06-state-"));
  const snapRoot = mkdtempSync(join(tmpdir(), "e2e-s06-snap-"));
  const cdp = 9231 + dem;
  // máy chủ giả: tot = trang có nút hiện số; 429 = chặn kèm Retry-After; cham = tot + chậm 4s
  const server = createServer((req, res) => {
    const tra = () => {
      if (cheDo === "429") {
        res.writeHead(429, { "retry-after": "120" });
        return res.end("chan");
      }
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(`<html><body><button id="h">Hiện số 0901 ***</button>
        <script>document.getElementById('h').onclick=()=>setTimeout(()=>{
          const a=document.createElement('a');a.href='tel:0901234567';a.textContent='Gọi 0901234567';
          document.body.appendChild(a);},150);</script></body></html>`);
    };
    if (cheDo === "cham") return setTimeout(tra, 4000);
    tra();
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  // lược đồ tạm COMMIT riêng + seed stg 3 tài khoản (phone_hidden NULL)
  const c0 = new pg.Client({ connectionString: DB_BASE });
  await c0.connect();
  await c0.query(`CREATE SCHEMA ${sc}`);
  await c0.query(`CREATE TABLE ${sc}.stg_chotot_ads (LIKE public.stg_chotot_ads INCLUDING ALL)`);
  await c0.query(`CREATE TABLE ${sc}.airbnb_snapshots (LIKE public.airbnb_snapshots INCLUDING ALL)`);
  for (let i = 1; i <= 3; i++) {
    await c0.query(
      `INSERT INTO ${sc}.stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, area_name, payload, snapshot_id)
       VALUES ($1,'808','vn-hanoi',1000,'s','Cầu Giấy',$2,'seed')`,
      [900000000 + i, JSON.stringify({ list_id: 900000000 + i, region_name: "hanoi", account_id: 80000 + i, account_name: `Môi giới ${i}`, list_time: Date.now() })],
    );
  }
  await c0.end();
  const dbUrl = `${DB_BASE}?options=-c%20search_path%3D${sc}`;
  return { sc, stateDir, snapRoot, cdp, server, port, dbUrl };
}

async function chayLuat(ht, args, tinHieu) {
  const con = spawn("node", [SCRIPT, ...args], {
    env: {
      ...process.env,
      S06_WEB_BASE: `http://127.0.0.1:${ht.port}`,
      DATABASE_URL: ht.dbUrl,
      S06_STATE_DIR: ht.stateDir,
      S06_SNAP_ROOT: ht.snapRoot,
      S06_CDP_PORT: String(ht.cdp),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let out = "";
  con.stdout.on("data", (d) => (out += d));
  con.stderr.on("data", (d) => (out += d));
  const code = await new Promise((res) => {
    if (tinHieu) {
      // kịch bản (iii): đợi state có ≥1 kết quả rồi gửi SIGTERM
      const f = join(ht.stateDir, "state.json");
      const iv = setInterval(() => {
        try {
          const s = JSON.parse(readFileSync(f, "utf8"));
          if (Object.keys(s.da_thu ?? {}).length >= 1) { clearInterval(iv); con.kill("SIGTERM"); }
        } catch {}
      }, 400);
      con.on("exit", (c) => { clearInterval(iv); res(c); });
    } else {
      con.on("exit", res);
    }
  });
  return { code, out };
}

async function donDep(ht) {
  await new Promise((r) => ht.server.close(r));
  const c = new pg.Client({ connectionString: DB_BASE });
  await c.connect();
  await c.query(`DROP SCHEMA IF EXISTS ${ht.sc} CASCADE`);
  await c.end();
  rmSync(ht.stateDir, { recursive: true, force: true });
  rmSync(ht.snapRoot, { recursive: true, force: true });
}

/** Kiểm sau mỗi kịch bản: Chrome bộ thu đã tắt (không tiến trình nào chứa
 * profileDir của kịch bản), tệp PID trống — Chrome của Mạnh không bị đụng. */
async function kiemSac(ht) {
  const profileDir = join(ht.stateDir, "chrome-profile");
  let conSong = "";
  try { conSong = await run("pgrep", ["-f", profileDir]); } catch { conSong = ""; } // pgrep exit 1 = không có
  assert.equal(String(conSong).trim(), "", `còn tiến trình Chrome chứa ${profileDir}`);
  const pidF = join(ht.stateDir, "chrome-pid");
  if (existsSync(pidF)) assert.equal(readFileSync(pidF, "utf8").trim(), "", "tệc PID phải trống sau khi tắt");
}

test("e2e (i) trang có số: thoát 0, [nấc] + [đối chiếu] lệch 0, số vào stg tạm", { timeout: 300_000 }, async () => {
  const ht = await dungHạTang("tot");
  try {
    const { code, out } = await chayLuat(ht, ["--phase", "1", "--threads", "1", "--minutes", "2", "--limit", "2"]);
    if (code !== 0) console.log("=== OUT (i) ===", out);
    assert.equal(code, 0, `thoát ${code} — stdout:\n${out.slice(-600)}`);
    assert.ok(out.includes("[nấc]"), "thiếu dòng [nấc]");
    assert.ok(out.includes("[đối chiếu]"), "thiếu dòng [đối chiếu]");
    assert.ok(out.includes("lệch 0"), "đối chiếu phải lệch 0");
    const c = new pg.Client({ connectionString: ht.dbUrl });
    await c.connect();
    const r = await c.query("SELECT seller->>'phone' AS p FROM stg_chotot_ads WHERE seller->>'phone' LIKE '+84%'");
    await c.end();
    assert.equal(r.rows.length, 2, `stg tạm phải có 2 số, có ${r.rows.length}`);
    await kiemSac(ht);
  } finally {
    await donDep(ht);
  }
});

test("e2e (ii) 429 + Retry-After: thoát 2 ngay, in số giây", { timeout: 180_000 }, async () => {
  const ht = await dungHạTang("429");
  try {
    const { code, out } = await chayLuat(ht, ["--phase", "1", "--threads", "1", "--minutes", "1", "--limit", "1"]);
    assert.equal(code, 2, `phải thoát 2, được ${code} — stdout:\n${out.slice(-600)}`);
    assert.ok(/DỪNG NGAY/.test(out), "phải in DỪNG NGAY");
    assert.ok(/Retry-After 120 giây/.test(out), "phải in Retry-After 120 giây");
    await kiemSac(ht);
  } finally {
    await donDep(ht);
  }
});

test("e2e (iii) SIGTERM giữa lượt: thoát 130, số đã thu vẫn vào stg tạm", { timeout: 300_000 }, async () => {
  const ht = await dungHạTang("cham");
  try {
    const { code, out } = await chayLuat(ht, ["--phase", "1", "--threads", "1", "--minutes", "3"], true);
    assert.equal(code, 130, `phải thoát 130, được ${code} — stdout:\n${out.slice(-600)}`);
    const c = new pg.Client({ connectionString: ht.dbUrl });
    await c.connect();
    const r = await c.query("SELECT seller->>'phone' AS p FROM stg_chotot_ads WHERE seller->>'phone' LIKE '+84%'");
    await c.end();
    if (r.rows.length < 1) console.log("=== OUT (iii) ===", out);
    assert.ok(r.rows.length >= 1, "số đã thu trước SIGTERM phải được flush + nạp vào stg tạm");
    await kiemSac(ht);
  } finally {
    await donDep(ht);
  }
});
