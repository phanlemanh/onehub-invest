// import-s09-danh-ba.test.mjs — mảnh 2 GIAO 2011-17: bộ nạp stg_s09_danh_ba khớp từng điểm
// GS CHỐT (BÁO claudedp-2011-19). DB của riêng lượt (db-thu) — bảng stg_s09_danh_ba TỰ DỰNG
// đúng 7 cột GS NGOÀI db/migrations (index là migration 115 phía làn import).
//
// 2711-1: CHỈ nối DB SUITE — `xacThucUrlSuite` ném khi DATABASE_URL thiếu hoặc tên DB không khớp
// oneinvest_suite_* (dừng có lời, không nối, không tạo bảng, không ghi; ca chứng minh cuối tệp).
//
// LỆNH PHÁ theo danh sách cho phép (bản chép hỏng cạnh bản thật — mỗi lệnh làm ca ĐỎ):
//   T1 (thứ tự tệp): trong docSnapshot thay .sort(...) bằng .sort(() => 0) → ca "T1-đỏ"
//      (manifest.files trộn items-2 trước items-1, bản hỏng xếp sai thứ tự dong).
//   T2 (từ chối manifest.error): trong docSnapshot xoá khối kiểm manifest.error →
//      ca "từ-chối-error ĐỎ" (bản hỏng đọc được snapshot có error).
//   T3 (nạp lại không đổi số dòng): trong napDanhBaThuMuc xoá
//      `ON CONFLICT (snapshot_id, dong) DO NOTHING` → ca "nạp-lại ĐỎ" (lượt 2 trùng PK ném).
//   T4 (item thiếu mã, DA42 AC-1): trong napDanhBaThuMuc bỏ hai dòng lọc thieu_kind/thieu_source_id →
//      ca "thiếu-mã ĐỎ" (bản hỏng ghi chuỗi rỗng, CHECK của 115 làm cả lượt ROLLBACK).
import { test } from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import pg from "pg";

import { docSnapshot, napDanhBaThuMuc } from "./import-s09-danh-ba.mjs";
import { urlCiChoPhep } from "./lib/db-thu-chot.mjs";

const TEP = fileURLToPath(new URL("./import-s09-danh-ba.mjs", import.meta.url));

// 2711-1 (claudedp-2711-1): test CHỈ được nối DB SUITE (tên oneinvest_suite_* do db/db-thu.sh đặt).
// Thiếu DATABASE_URL hoặc tên DB khác → NÉM NGAY KHI NẠP: dừng có lời rõ, KHÔNG tạo client,
// KHÔNG CREATE TABLE, KHÔNG ghi — bài học 21/11: một lượt chạy trần tệp này đã ghi 40 dòng fixture
// (24 snapshot_id …__test…) vào DB máy thu thật vì URL mặc định trỏ DB chung :5433.
export function xacThucUrlSuite(url) {
  let u;
  try {
    u = new URL(url ?? "");
  } catch {
    throw new Error("TỪ CHỐI DATABASE_URL: không đọc được URL — cần postgres:// tới DB oneinvest_suite_* của riêng lượt (db/db-thu.sh --chay)");
  }
  const ten = decodeURIComponent(u.pathname.replace(/^\//, ""));
  if (!/^oneinvest_suite_[a-z0-9_]+$/.test(ten)) {
    throw new Error(
      `TỪ CHỐI DATABASE_URL: tên DB «${ten || "(trống)"}» không phải oneinvest_suite_* — test này TỰ DỰNG bảng ` +
        `stg_s09_danh_ba nên CHỈ chạy trên DB suite của riêng lượt: bash db/db-thu.sh oneinvest_suite_<bộ> --chay <lệnh> ` +
        `(db-thu đặt DATABASE_URL). Không bao giờ trỏ DB chung :5433.`,
    );
  }
  return url;
}
// HT35 (lỗi tích hợp với CI): runner CI không đặt DATABASE_URL — `urlCiChoPhep` trả DB dịch vụ CI; ngoài CI giữ nguyên rào 2711-1.
const DB_URL = urlCiChoPhep(process.env.DATABASE_URL) ?? xacThucUrlSuite(process.env.DATABASE_URL); // ném ở đây nếu thiếu/sai — tệp không nạp nổi, không đụng DB

// CA CHỨNG MINH 2711-1: đặt DATABASE_URL trỏ TÊN DB CHUNG → tệp (chạy tiến trình con) thoát LỖI với
// lời từ chối, và KHÔNG ca nào chạy (không CREATE TABLE, không ghi — guard ném trước khi có client).
// Lời từ chối ném TRƯỚC mọi kết nối nên ca này an toàn cả khi URL là DB chung thật.
// Đỏ trên main 1a2cb6a43: bản đó không có xacThucUrlSuite — tệp chấp nhận URL tên-chung rồi tự nối
// (chứng minh ở lượt chạy riêng với URL cùng tên nhưng CỔNG CHẾT để không đụng DB chung thật).
test("2711-1: DATABASE_URL trỏ DB chung → tiến trình con thoát lỗi với lời từ chối, 0 ca chạy 0 ghi", async () => {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const chay = promisify(execFile);
  const urlChung = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
  let ra = null;
  // gỡ biến ngữ cảnh của node --test cha — không thì con `node --test` lồng vào chế độ child-IPC và
  // thoát 0 im lặng (đã đụng thật: ca đỏ giả khi quên gỡ)
  const envCon = { ...process.env, DATABASE_URL: urlChung };
  delete envCon.NODE_TEST_CONTEXT;
  try {
    const r = await chay(process.execPath, ["--test", fileURLToPath(import.meta.url)], {
      env: envCon,
      timeout: 120_000,
    });
    ra = "con thoát 0 — stdout đầu: " + String(r.stdout).slice(0, 400);
  } catch (e) {
    ra = String(e.stdout) + String(e.stderr);
  }
  assert.match(ra, /TỪ CHỐI DATABASE_URL/, ra?.slice(0, 300));
  assert.doesNotMatch(ra, /0\/setup/, "không ca nào được chạy");
});

async function banChep(tim, thay, chay) {
  const goc = readFileSync(TEP, "utf8");
  const moi = goc.replace(tim, thay);
  assert.notEqual(moi, goc, "bản chép không đổi được — mẫu thay đã lệch mã");
  const ban = join(dirname(TEP), `.ban-${process.pid}-${Math.random().toString(36).slice(2)}-import-s09-danh-ba.mjs`);
  writeFileSync(ban, moi);
  try {
    return await chay(await import(pathToFileURL(ban).href));
  } finally {
    rmSync(ban, { force: true });
  }
}

function taoSnapshot(itemsTheoTep, { error = undefined, schemaVersion = 15, tramMan = false } = {}) {
  const thuMuc = mkdtempSync(join(tmpdir(), "s09-danh-ba-nap-"));
  const files = [];
  itemsTheoTep.forEach((items, i) => {
    const ten = `items-${i + 1}.json.gz`;
    const buf = gzipSync(Buffer.from(JSON.stringify(items), "utf8"));
    writeFileSync(join(thuMuc, ten), buf);
    files.push({ name: ten, sha256: createHash("sha256").update(buf).digest("hex") });
  });
  const manifest = {
    snapshotId: `vn__s09-danh-ba__test${Date.now()}${process.pid}`,
    city: "vn",
    source: "s09-danh-ba",
    schemaVersion,
    finishedAt: "2026-11-21T00:00:00.000Z",
    files: tramMan && files.length > 1 ? [files[1], files[0]] : files,
  };
  if (error !== undefined) manifest.error = error;
  writeFileSync(join(thuMuc, "manifest.json"), JSON.stringify(manifest));
  return { thuMuc, manifest };
}

test("0/setup: dựng stg_s09_danh_ba đúng 7 cột GS + airbnb_snapshots có sẵn", async (t) => {
  const client = new pg.Client({ connectionString: DB_URL, connectionTimeoutMillis: 2000 });
  try {
    await client.connect();
  } catch {
    t.skip("DB của lượt không chạy — chỉ kiểm phần tĩnh");
    return;
  }
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS stg_s09_danh_ba (
        snapshot_id text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
        dong bigint NOT NULL,
        kind text NOT NULL,
        source_id text NOT NULL,
        payload jsonb NOT NULL,
        meta jsonb NOT NULL,
        fetched_at timestamptz,
        PRIMARY KEY (snapshot_id, dong)
      )`);
    const { rows } = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='stg_s09_danh_ba' ORDER BY ordinal_position`,
    );
    assert.deepEqual(
      rows.map((r) => r.column_name).sort(),
      ["dong", "fetched_at", "kind", "meta", "payload", "snapshot_id", "source_id"].sort(),
    );
  } finally {
    await client.end();
  }
});

const it1 = { kind: "can-thap-tang", sourceId: "khu-a", fetchedAt: "2026-11-21T00:00:01.000Z",
  meta: { tienTo: "A1", soCanNhan: 2 }, payload: { data: [{ id: "c1" }, { id: "c2" }] } };
const it2 = { kind: "toa", sourceId: "toa-1", fetchedAt: "2026-11-21T00:00:02.000Z",
  meta: {}, payload: { data: [] } };

test("dong-từ-1: dong 1 và 3 chiếm, dong 2 hở (item phi-object bị bỏ vẫn đếm)", async (t) => {
  const client = new pg.Client({ connectionString: DB_URL, connectionTimeoutMillis: 2000 });
  try { await client.connect(); } catch { t.skip("DB của lượt không chạy"); return; }
  await client.end();
  const { thuMuc, manifest } = taoSnapshot([[it1, null, it2]]);
  try {
    const r = await napDanhBaThuMuc(thuMuc, DB_URL);
    assert.equal(r.ghi, 2);
    assert.equal(r.bo, 1);
    const c = new pg.Client({ connectionString: DB_URL });
    await c.connect();
    try {
      const { rows } = await c.query(
        `SELECT dong, kind, source_id, meta->>'tienTo' AS tien_to, fetched_at FROM stg_s09_danh_ba WHERE snapshot_id=$1 ORDER BY dong`,
        [manifest.snapshotId],
      );
      assert.deepEqual(rows.map((x) => Number(x.dong)), [1, 3]); // dong 2 HỞ — hợp lệ (bigint trả string)
      assert.equal(rows[0].kind, "can-thap-tang");
      assert.equal(rows[0].tien_to, "A1"); // tiền tố đọc meta->>'tienTo' — KHÔNG cột riêng
      const hong2 = await c.query(`SELECT dong FROM stg_s09_danh_ba WHERE snapshot_id=$1 AND dong=2`, [manifest.snapshotId]);
      assert.equal(hong2.rows.length, 0);
    } finally { await c.end(); }
  } finally { rmSync(thuMuc, { recursive: true, force: true }); }
});

test("thiếu-mã: item thiếu kind, item thiếu sourceId lẫn item tốt → item tốt vào, hai item kia đếm theo lý do; T4-đỏ khi bỏ lọc", async (t) => {
  const client = new pg.Client({ connectionString: DB_URL, connectionTimeoutMillis: 2000 });
  try { await client.connect(); } catch { t.skip("DB của lượt không chạy"); return; }
  // CHECK như migration 115 (bảng tự dựng ở ca 0/setup không có): thiếu CHECK thì chuỗi rỗng lọt và ca đỏ không đỏ.
  await client.query(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stg_s09_danh_ba_kind_check') THEN
      ALTER TABLE stg_s09_danh_ba ADD CONSTRAINT stg_s09_danh_ba_kind_check CHECK (btrim(kind) <> ''); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stg_s09_danh_ba_source_id_check') THEN
      ALTER TABLE stg_s09_danh_ba ADD CONSTRAINT stg_s09_danh_ba_source_id_check CHECK (btrim(source_id) <> ''); END IF;
  END $$`);
  await client.end();
  const thieuKind = { ...it2, kind: "  " };
  const thieuSid = { ...it2, sourceId: undefined };
  const dem = async (id) => {
    const c = new pg.Client({ connectionString: DB_URL });
    await c.connect();
    try { return (await c.query(`SELECT dong, kind, source_id FROM stg_s09_danh_ba WHERE snapshot_id=$1 ORDER BY dong`, [id])).rows; }
    finally { await c.end(); }
  };
  const a = taoSnapshot([[thieuKind, it1, thieuSid]]);
  try {
    const r = await napDanhBaThuMuc(a.thuMuc, DB_URL);
    assert.equal(r.ghi, 1);
    assert.equal(r.bo, 2);
    assert.deepEqual(r.boTheoLyDo, { phi_object: 0, thieu_kind: 1, thieu_source_id: 1 });
    const rows = await dem(a.manifest.snapshotId);
    assert.deepEqual(rows.map((x) => [Number(x.dong), x.kind, x.source_id]), [[2, "can-thap-tang", "khu-a"]]); // dong 1, 3 hở
  } finally { rmSync(a.thuMuc, { recursive: true, force: true }); }
  // T4-đỏ: bản chép bỏ lọc → lượt nạp ném vì CHECK, 0 dòng.
  const b = taoSnapshot([[thieuKind, it1, thieuSid]]);
  try {
    await banChep(
      `      if (kind === null) { bo++; boTheoLyDo.thieu_kind++; continue; }\n      if (sourceId === null) { bo++; boTheoLyDo.thieu_source_id++; continue; }\n`,
      "",
      async (m) => {
        // Bỏ lọc thì giá trị rỗng/thiếu đụng ràng buộc của bảng (CHECK của 115 hay NOT NULL) → cả lượt ROLLBACK.
        await assert.rejects(m.napDanhBaThuMuc(b.thuMuc, DB_URL), /violates (check|not-null) constraint/, "T4-đỏ: bỏ lọc mà lượt nạp không ném");
      });
    assert.equal((await dem(b.manifest.snapshotId)).length, 0, "T4-đỏ: lượt hỏng vẫn để lại dòng");
  } finally { rmSync(b.thuMuc, { recursive: true, force: true }); }
});

test("thứ-tự-tệp: manifest trộn items-2 trước items-1 — dong vẫn theo TÊN tăng dần", async (t) => {
  const client = new pg.Client({ connectionString: DB_URL, connectionTimeoutMillis: 2000 });
  try { await client.connect(); } catch { t.skip("DB của lượt không chạy"); return; }
  await client.end();
  const { thuMuc, manifest } = taoSnapshot([[it2], [it1]], { tramMan: true });
  assert.equal(manifest.files[0].name, "items-2.json.gz"); // trộn thật
  try {
    await napDanhBaThuMuc(thuMuc, DB_URL);
    const c = new pg.Client({ connectionString: DB_URL });
    await c.connect();
    try {
      const { rows } = await c.query(
        `SELECT dong, kind FROM stg_s09_danh_ba WHERE snapshot_id=$1 ORDER BY dong`,
        [manifest.snapshotId],
      );
      assert.deepEqual(rows.map((x) => x.kind), ["toa", "can-thap-tang"]); // items-1 TRƯỚC items-2
    } finally { await c.end(); }
  } finally { rmSync(thuMuc, { recursive: true, force: true }); }
});

test("T1-đỏ: bỏ sort → bản hỏng xếp theo thứ tự manifest trộn (ngược ca xanh)", async (t) => {
  const client = new pg.Client({ connectionString: DB_URL, connectionTimeoutMillis: 2000 });
  try { await client.connect(); } catch { t.skip("DB của lượt không chạy"); return; }
  await client.end();
  const { thuMuc, manifest } = taoSnapshot([[it2], [it1]], { tramMan: true });
  try {
    await banChep(
      `.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }))`,
      `.sort(() => 0)`,
      async (mo) => {
        await mo.napDanhBaThuMuc(thuMuc, DB_URL);
        const c = new pg.Client({ connectionString: DB_URL });
        await c.connect();
        try {
          const { rows } = await c.query(
            `SELECT dong, kind FROM stg_s09_danh_ba WHERE snapshot_id=$1 ORDER BY dong`,
            [manifest.snapshotId],
          );
          // bản hỏng theo thứ tự manifest trộn → items-2 (can-thap-tang) TRƯỚC
          assert.deepEqual(rows.map((x) => x.kind), ["can-thap-tang", "toa"]);
          assert.notDeepEqual(rows.map((x) => x.kind), ["toa", "can-thap-tang"], "bản hỏng phải khác thứ tự đúng");
        } finally { await c.end(); }
      },
    );
  } finally { rmSync(thuMuc, { recursive: true, force: true }); }
});

test("từ-chối-error: manifest.error → ném; cờ tường minh vượt; T2-đỏ khi bỏ kiểm", async (t) => {
  const { thuMuc } = taoSnapshot([[it1]], { error: "bị chặn giữa lượt" });
  try {
    assert.throws(() => docSnapshot(thuMuc), /manifest ghi error/);
    process.argv.push("--cho-phep-loi");
    try {
      const { snapshotId } = docSnapshot(thuMuc);
      assert.ok(snapshotId, "cờ tường minh --cho-phep-loi vượt được");
    } finally {
      process.argv.pop();
    }
    await banChep(
      `  if (manifest.error && !process.argv.includes("--cho-phep-loi")) {
    throw new Error("manifest ghi error — từ chối nạp (cờ tường minh --cho-phep-loi để vượt)");
  }
`,
      ``,
      async (mo) => {
        const { snapshotId } = mo.docSnapshot(thuMuc);
        assert.ok(snapshotId, "bản hỏng T2 đọc được snapshot có error — ca xanh phía trên đỏ khi áp T2");
      },
    );
  } finally { rmSync(thuMuc, { recursive: true, force: true }); }
});

test("nạp-lại: lượt 2 ghi 0 mới, số dòng không đổi, báo đúng soCoSan; T3-đỏ khi bỏ ON CONFLICT", async (t) => {
  const client = new pg.Client({ connectionString: DB_URL, connectionTimeoutMillis: 2000 });
  try { await client.connect(); } catch { t.skip("DB của lượt không chạy"); return; }
  await client.end();
  const { thuMuc, manifest } = taoSnapshot([[it1, it2]]);
  try {
    const r1 = await napDanhBaThuMuc(thuMuc, DB_URL);
    assert.equal(r1.ghi, 2);
    assert.equal(r1.soCoSan, 0);
    const r2 = await napDanhBaThuMuc(thuMuc, DB_URL);
    assert.equal(r2.ghi, 0, "lượt 2 không thêm dòng mới");
    assert.equal(r2.soLap, 2, "bỏ trùng đúng số");
    assert.equal(r2.soCoSan, 2, "báo đúng số dòng có sẵn");
    const c = new pg.Client({ connectionString: DB_URL });
    await c.connect();
    try {
      const { rows } = await c.query(`SELECT count(*)::int AS n FROM stg_s09_danh_ba WHERE snapshot_id=$1`, [manifest.snapshotId]);
      assert.equal(rows[0].n, 2, "số dòng KHÔNG đổi sau nạp lại");
    } finally { await c.end(); }
    await banChep(
      // mộc đãi đúng mệnh đề SQL (tránh trúng chuỗi cùng tên trong comment đầu tệp)
      `VALUES \${giaTri} ON CONFLICT (snapshot_id, dong) DO NOTHING`,
      `VALUES \${giaTri}`,
      async (mo) => {
        await assert.rejects(mo.napDanhBaThuMuc(thuMuc, DB_URL), /duplicate key|unique|đã tồn tại/i);
      },
    );
  } finally { rmSync(thuMuc, { recursive: true, force: true }); }
});

test("an-toàn: sai nguồn/schemaVersion/checksum sai → ném TRƯỚC khi mở DB", async () => {
  const saiNguon = taoSnapshot([[it1]]);
  const m = JSON.parse(readFileSync(join(saiNguon.thuMuc, "manifest.json"), "utf8"));
  m.source = "nguon-khac";
  writeFileSync(join(saiNguon.thuMuc, "manifest.json"), JSON.stringify(m));
  assert.throws(() => docSnapshot(saiNguon.thuMuc), /không phải nguồn s09-danh-ba/);
  rmSync(saiNguon.thuMuc, { recursive: true, force: true });

  const saiSchema = taoSnapshot([[it1]], { schemaVersion: 14 });
  assert.throws(() => docSnapshot(saiSchema.thuMuc), /schemaVersion 14 chưa hỗ trợ/);
  rmSync(saiSchema.thuMuc, { recursive: true, force: true });

  const checksum = taoSnapshot([[it1]]);
  const bufLech = gzipSync(Buffer.from("[]", "utf8"));
  const mm = JSON.parse(readFileSync(join(checksum.thuMuc, "manifest.json"), "utf8"));
  mm.files[0].sha256 = createHash("sha256").update(bufLech).digest("hex");
  writeFileSync(join(checksum.thuMuc, "manifest.json"), JSON.stringify(mm));
  assert.throws(() => docSnapshot(checksum.thuMuc), /checksum sai/);
  rmSync(checksum.thuMuc, { recursive: true, force: true });
});

test("cha-trước-con: nạp lần đầu snapshot mới thành công (cha có trước con cùng giao dịch)", async (t) => {
  const client = new pg.Client({ connectionString: DB_URL, connectionTimeoutMillis: 2000 });
  try { await client.connect(); } catch { t.skip("DB của lượt không chạy"); return; }
  await client.end();
  const { thuMuc, manifest } = taoSnapshot([[it1]]);
  try {
    const r = await napDanhBaThuMuc(thuMuc, DB_URL);
    assert.equal(r.ghi, 1, "nạp lần đầu thành công = cha có trước con trong cùng giao dịch");
    const c = new pg.Client({ connectionString: DB_URL });
    await c.connect();
    try {
      const { rows } = await c.query(`SELECT source, city FROM airbnb_snapshots WHERE snapshot_id=$1`, [manifest.snapshotId]);
      assert.equal(rows[0]?.source, "s09-danh-ba");
    } finally { await c.end(); }
  } finally { rmSync(thuMuc, { recursive: true, force: true }); }
});

test("script-con: chạy qua process.execPath với *_NODE_BIN quy ước GS (2011-18)", async (t) => {
  const client = new pg.Client({ connectionString: DB_URL, connectionTimeoutMillis: 2000 });
  try { await client.connect(); } catch { t.skip("DB của lượt không chạy"); return; }
  await client.end();
  // Bộ nạp chỉ nhận DB thử ^oneinvest_suite_ (rào giữ DB máy thu). CI và M5 chạy trên Postgres riêng tên «oneinvest» không qua
  // db-thu → ca này không có DB hợp lệ cho script con: bỏ qua có lý do, chạy thật qua db/db-thu.sh … --chay.
  const tenDb = new URL(DB_URL).pathname.replace(/^\//, "");
  if (!/^oneinvest_suite_[a-z0-9_]+$/.test(tenDb)) { t.skip(`DB '${tenDb}' không phải oneinvest_suite_* — chạy qua db/db-thu.sh`); return; }
  const { thuMuc } = taoSnapshot([[it2]]);
  try {
    const r = await new Promise((resolve) => {
      const p = spawn(process.execPath, [TEP, thuMuc], {
        env: {
          ...process.env,
          S09_NODE_BIN: process.execPath, // quy ước GS: test gọi script con tự đặt biến *_NODE_BIN
          DATABASE_URL: DB_URL,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let h = "";
      p.stdout.on("data", (d) => (h += d));
      p.stderr.on("data", (d) => (h += d));
      p.on("close", (code) => resolve({ code, h }));
    });
    assert.equal(r.code, 0, r.h);
    assert.match(r.h, /nạp: \d+\/\d+ dòng stg_s09_danh_ba/);
    assert.match(r.h, /đã có sẵn \d+ dòng trước lượt/);
  } finally { rmSync(thuMuc, { recursive: true, force: true }); }
});
