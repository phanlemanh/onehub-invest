// reassign-areas.test.mjs — AU9 `ranh-gioi-khu-vuc-dung` AC-1…AC-5, AC-9: khu vực Hà Nội chỉ nhận phường cấp 6
// nằm trong polygon Hà Nội, khu vực lạc được dọn an toàn, snapshot hỏng thì dừng, check DQ con-ngoài-cha.
// Mọi ca chạy trong BEGIN…ROLLBACK trên Postgres local; mồi phường chép payload của một dòng THẬT của
// stg_osm_boundaries (không tự dựng khuôn bên đọc). DB không có dòng thật (CI dựng từ migration) → bỏ qua có lý do.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import pg from "pg";

import { toMultiPolygon } from "../lib/osm.mjs";
import { runReassign, WARD_LEVEL } from "../reassign-areas.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const ROOT = join(import.meta.dirname, "../..");
const HUNG_YEN = [106.05, 20.65]; // ngoài polygon Hà Nội, ngoài mọi phường Hà Nội/TP.HCM

// Khối check DQ con-ngoài-cha, rút đúng đoạn giữa hai marker của 450 (đo chính SQL sẽ chạy)
const DQ_SQL = (() => {
  const s = readFileSync(join(ROOT, "pipeline/sql/450_dq_checks.sql"), "utf8");
  const a = s.indexOf("-- AU9 area_con_ngoai_cha");
  const b = s.indexOf("-- /AU9", a);
  return a < 0 || b < 0 ? null : s.slice(a, b);
})();

function ghiLog() {
  const dong = [];
  const ghi = (...a) => dong.push(a.join(" "));
  return { dong, log: { log: ghi, warn: ghi } };
}

let snap = null;

async function withTx(t, fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    const { rows } = await c.query(
      `SELECT payload, snapshot_id FROM stg_osm_boundaries
       WHERE snapshot_id LIKE 'hanoi__%' AND payload->'tags'->>'admin_level' = $1
       ORDER BY osm_id, snapshot_id DESC`,
      [WARD_LEVEL],
    );
    // dòng thật đầu tiên mà bên ghi (toMultiPolygon) dựng được polygon
    const that = rows.find((r) => toMultiPolygon(r.payload));
    if (!that) {
      if (process.env.CI) return t.skip("cần stg_osm_boundaries thật của Hà Nội (DB local)");
      throw new Error("DB local không có ranh giới cấp 6 nào của Hà Nội — không có mồi thật để chép");
    }
    // Mồi nạp vào chính snapshot thật mới nhất của Hà Nội (khoá ngoại sang airbnb_snapshots)
    const { rows: [moi] } = await c.query(
      `SELECT max(snapshot_id) s FROM stg_osm_boundaries WHERE snapshot_id LIKE 'hanoi__%'`,
    );
    snap = moi.s;
    return await fn(c, that.payload);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

/** Chép payload thật, đổi tên/cấp, tuỳ chọn tịnh tiến kinh độ. */
function chep(payload, { name, level = WARD_LEVEL, dLon = 0 }) {
  const p = structuredClone(payload);
  p.tags = { ...p.tags, name, admin_level: level };
  if (dLon) for (const m of p.members ?? []) for (const g of m.geometry ?? []) g.lon = Number(g.lon) + dLon;
  return p;
}

async function nap(c, osmId, payload) {
  await c.query(
    `INSERT INTO stg_osm_boundaries (snapshot_id, osm_id, name, payload) VALUES ($1, $2, $3, $4)`,
    [snap, osmId, payload.tags.name, payload],
  );
}

const dem = async (c, sql, p = []) => Number((await c.query(sql, p)).rows[0].n);

test("AU9-AC-1 chỉ ranh giới cấp 6 thành phường", async (t) => {
  await withTx(t, async (c, that) => {
    await nap(c, "au9-moi-6", chep(that, { name: "Phường Mồi AU9" }));
    await nap(c, "au9-moi-4", chep(that, { name: "Tỉnh Mồi AU9", level: "4" }));
    const khacCap = await dem(
      c,
      `SELECT count(*) n FROM (SELECT DISTINCT ON (osm_id) payload->'tags'->>'admin_level' lvl
         FROM stg_osm_boundaries WHERE snapshot_id LIKE 'hanoi__%' ORDER BY osm_id, snapshot_id DESC) x
       WHERE lvl IS DISTINCT FROM $1`,
      [WARD_LEVEL],
    );
    const { dong, log } = ghiLog();
    await runReassign(c, ["hanoi"], { log });
    assert.equal(await dem(c, `SELECT count(*) n FROM areas WHERE id = 'vn-hanoi-moi-au9' AND parent_id = 'vn-hanoi'`), 1);
    const m = dong.join("\n").match(/bỏ (\d+) dòng khác cấp/);
    assert.ok(m, "log phải có dòng «bỏ N dòng khác cấp»");
    assert.equal(Number(m[1]), khacCap, "số in ra = số dòng khác cấp 6 của snapshot");
    assert.ok(khacCap >= 1);
  });
});

test("AU9-AC-1 ranh giới cấp 4 bao Hà Nội không vào areas", async (t) => {
  await withTx(t, async (c, that) => {
    await nap(c, "au9-moi-4", chep(that, { name: "Tỉnh Mồi AU9", level: "4" }));
    await runReassign(c, ["hanoi"], { log: ghiLog().log });
    assert.equal(await dem(c, `SELECT count(*) n FROM areas WHERE meta->>'osm_id' = 'au9-moi-4'`), 0, "ranh giới cấp 4 không được vào areas");
    assert.equal(await dem(c, `SELECT count(*) n FROM areas WHERE id = 'vn-hanoi-tinh-moi-au9'`), 0);
  });
});

test("AU9-AC-2 phường cấp 6 nằm ngoài polygon market bị bỏ, in tên", async (t) => {
  await withTx(t, async (c, that) => {
    await nap(c, "au9-moi-ngoai", chep(that, { name: "Phường Ngoài AU9", dLon: 3 }));
    const { dong, log } = ghiLog();
    await runReassign(c, ["hanoi"], { log });
    assert.equal(await dem(c, `SELECT count(*) n FROM areas WHERE meta->>'osm_id' = 'au9-moi-ngoai'`), 0);
    assert.ok(dong.some((d) => d.includes("Phường Ngoài AU9") && d.includes("ngoài polygon vn-hanoi")), dong.join("\n"));
  });
});

test("AU9-AC-2 market chưa có polygon → không chốt, in cảnh báo", async (t) => {
  await withTx(t, async (c, that) => {
    await nap(c, "au9-moi-ngoai", chep(that, { name: "Phường Ngoài AU9", dLon: 3 }));
    await c.query(`UPDATE areas SET geom = NULL WHERE id = 'vn-hanoi'`);
    const { dong, log } = ghiLog();
    await runReassign(c, ["hanoi"], { log });
    assert.ok(dong.some((d) => d.includes("vn-hanoi chưa có polygon")), dong.join("\n"));
    assert.equal(await dem(c, `SELECT count(*) n FROM areas WHERE meta->>'osm_id' = 'au9-moi-ngoai'`), 1, "không chốt thì phường vẫn nạp");
  });
});

/** Khu vực lạc mồi + listing trong/ngoài + tin bán + metrics/breakdowns trỏ vào. */
async function mocLac(c) {
  await c.query(
    `INSERT INTO areas (id, parent_id, region_type, name, country_code, geom, meta)
     SELECT 'vn-hanoi-tinh-moi-au9', 'vn-hanoi', 'submarket', 'Tỉnh Mồi AU9', 'vn',
            ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint($1, $2), 4326), 0.05)),
            '{"source":"osm-phuong","osm_id":"au9-lac"}'::jsonb`,
    HUNG_YEN,
  );
  const { rows: [p] } = await c.query(
    `SELECT ST_X(ST_PointOnSurface(geom)) x, ST_Y(ST_PointOnSurface(geom)) y FROM areas
     WHERE parent_id = 'vn-hanoi' AND meta->>'source' = 'osm-phuong' AND id <> 'vn-hanoi-tinh-moi-au9'
       AND name NOT LIKE 'Tỉnh %' AND name NOT LIKE 'Thành phố %' AND geom IS NOT NULL ORDER BY id LIMIT 1`,
  );
  await c.query(
    `INSERT INTO listings (id, area_id, last_seen, latitude, longitude) VALUES
       ('au9-moi-trong', 'vn-hanoi-tinh-moi-au9', current_date, $1, $2),
       ('au9-moi-ngoai', 'vn-hanoi-tinh-moi-au9', current_date, $3, $4)`,
    [p.y, p.x, HUNG_YEN[1], HUNG_YEN[0]],
  );
  await c.query(
    `INSERT INTO sale_offers (offer_id, area_id, kind, first_seen, last_seen) VALUES ('au9-moi', 'vn-hanoi-tinh-moi-au9', 'sale', now(), now())`,
  );
  await c.query(`INSERT INTO market_metrics (area_id, month) VALUES ('vn-hanoi-tinh-moi-au9', '2026-01-01')`);
  await c.query(`INSERT INTO area_breakdowns (area_id, kind, label, payload) VALUES ('vn-hanoi-tinh-moi-au9', 'au9', 'moi', '{}')`);
}

test("AU9-AC-3 dọn khu vực lạc", async (t) => {
  await withTx(t, async (c) => {
    await mocLac(c);
    const { log } = ghiLog();
    const r = await runReassign(c, ["hanoi"], { log });
    assert.ok(r.stale.includes("vn-hanoi-tinh-moi-au9"));
    // listing trong Hà Nội → một phường hợp lệ có ST_Covers điểm
    assert.equal(
      await dem(
        c,
        `SELECT count(*) n FROM listings l JOIN areas a ON a.id = l.area_id
         WHERE l.id = 'au9-moi-trong' AND a.meta->>'source' = 'osm-phuong' AND a.parent_id IN ('vn-hanoi', 'vn-hcmc')
           AND ST_Covers(a.geom, ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326))`,
      ),
      1,
    );
    assert.equal(await dem(c, `SELECT count(*) n FROM listings WHERE id = 'au9-moi-ngoai'`), 0, "listing ngoài mọi phường bị bỏ");
    assert.equal(await dem(c, `SELECT count(*) n FROM sale_offers WHERE offer_id = 'au9-moi' AND area_id IS NULL`), 1);
    for (const tb of ["market_metrics", "area_breakdowns"])
      assert.equal(await dem(c, `SELECT count(*) n FROM ${tb} WHERE area_id = 'vn-hanoi-tinh-moi-au9'`), 0, tb);
    assert.equal(await dem(c, `SELECT count(*) n FROM areas WHERE id = 'vn-hanoi-tinh-moi-au9'`), 0);
  });
});

test("AU9-AC-3 khu vực lạc có saved_markets thì giữ", async (t) => {
  await withTx(t, async (c) => {
    await mocLac(c);
    await c.query(`INSERT INTO users (id, email, password_hash) VALUES ('au9-moi', 'au9-moi@local.test', 'x')`);
    await c.query(`INSERT INTO saved_markets (user_id, area_id) VALUES ('au9-moi', 'vn-hanoi-tinh-moi-au9')`);
    const { dong, log } = ghiLog();
    const r = await runReassign(c, ["hanoi"], { log });
    assert.equal(await dem(c, `SELECT count(*) n FROM areas WHERE id = 'vn-hanoi-tinh-moi-au9'`), 1, "khu vực còn");
    assert.equal(await dem(c, `SELECT count(*) n FROM saved_markets WHERE user_id = 'au9-moi'`), 1, "saved_markets còn nguyên");
    assert.deepEqual(r.kept, [{ id: "vn-hanoi-tinh-moi-au9", saved: 1, properties: 0 }]);
    assert.ok(dong.some((d) => d.includes("vn-hanoi-tinh-moi-au9") && d.includes("1 saved_markets")), dong.join("\n"));
  });
});

test("AU9-AC-3 khu vực lạc có properties thì giữ; market_asset_stats là cache thì xoá cùng khu vực", async (t) => {
  await withTx(t, async (c) => {
    await mocLac(c);
    await c.query(`INSERT INTO market_asset_stats (area_id, kind) VALUES ('vn-hanoi-tinh-moi-au9', 'sale')`);
    const r1 = await runReassign(c, ["hanoi"], { log: ghiLog().log });
    assert.equal(await dem(c, `SELECT count(*) n FROM areas WHERE id = 'vn-hanoi-tinh-moi-au9'`), 0, "asset_stats không giữ khu vực");
    assert.equal(await dem(c, `SELECT count(*) n FROM market_asset_stats WHERE area_id = 'vn-hanoi-tinh-moi-au9'`), 0);
    assert.ok(r1.removed.some((x) => x.id === "vn-hanoi-tinh-moi-au9"));
  });
  await withTx(t, async (c) => {
    await mocLac(c);
    await c.query(`INSERT INTO properties (area_id) VALUES ('vn-hanoi-tinh-moi-au9')`);
    const { dong, log } = ghiLog();
    const r = await runReassign(c, ["hanoi"], { log });
    assert.equal(await dem(c, `SELECT count(*) n FROM areas WHERE id = 'vn-hanoi-tinh-moi-au9'`), 1, "properties giữ khu vực");
    assert.deepEqual(r.kept, [{ id: "vn-hanoi-tinh-moi-au9", saved: 0, properties: 1 }]);
    assert.ok(dong.some((d) => d.includes("vn-hanoi-tinh-moi-au9") && d.includes("1 properties")), dong.join("\n"));
  });
});

test("AU9-AC-4 chạy lần hai không đổi gì", async (t) => {
  await withTx(t, async (c) => {
    await mocLac(c);
    const r1 = await runReassign(c, ["hanoi"], { log: ghiLog().log });
    // đối chứng dương: lần một có việc thật (gỡ khu vực lạc mồi, bỏ listing ngoài)
    assert.ok(r1.removed.some((x) => x.id === "vn-hanoi-tinh-moi-au9"), "lần một phải gỡ khu vực lạc mồi");
    assert.ok(r1.dropped.some((d) => d.id === "au9-moi-ngoai"), "lần một phải bỏ listing ngoài");
    const r2 = await runReassign(c, ["hanoi"], { log: ghiLog().log });
    assert.deepEqual(r2.moves.filter((m) => m.old_id !== m.new_id), [], "không listing nào đổi khu vực");
    assert.deepEqual(r2.dropped, []);
    assert.deepEqual(r2.removed, []);
  });
});

/** runReassign phải ném TRƯỚC mọi lệnh ghi: đếm ngay sau khi ném (lỗi JS, transaction chưa hỏng). */
async function dungKhongXoa(c, re) {
  const dem3 = async () => [
    await dem(c, `SELECT count(*) n FROM areas`),
    await dem(c, `SELECT count(*) n FROM listings`),
    await dem(c, `SELECT count(*) n FROM market_metrics`),
    await dem(c, `SELECT count(*) n FROM sale_offers WHERE area_id IS NULL`),
  ];
  const truoc = await dem3();
  await assert.rejects(runReassign(c, ["hanoi"], { log: ghiLog().log }), re);
  assert.deepEqual(await dem3(), truoc, "không xoá/đổi dòng nào trước khi dừng");
}

test("AU9-AC-9 snapshot mất tag admin_level → dừng, không xoá gì", async (t) => {
  await withTx(t, async (c) => {
    await mocLac(c);
    await c.query(`UPDATE stg_osm_boundaries SET payload = payload #- '{tags,admin_level}' WHERE snapshot_id LIKE 'hanoi__%'`);
    await dungKhongXoa(c, /vn-hanoi: chỉ 0 phường hợp lệ \/ \d+ con/);
  });
});

test("AU9-AC-9 snapshot còn dưới một nửa số phường → dừng, không xoá gì", async (t) => {
  await withTx(t, async (c) => {
    await mocLac(c);
    // chỉ 10 ranh giới cấp 6 giữ tag, phần còn lại mất tag
    await c.query(
      `UPDATE stg_osm_boundaries SET payload = payload #- '{tags,admin_level}'
       WHERE snapshot_id LIKE 'hanoi__%' AND osm_id NOT IN (
         SELECT osm_id FROM stg_osm_boundaries WHERE snapshot_id LIKE 'hanoi__%'
           AND payload->'tags'->>'admin_level' = $1 ORDER BY osm_id LIMIT 10)`,
      [WARD_LEVEL],
    );
    await dungKhongXoa(c, /vn-hanoi: chỉ ([1-9]\d?) phường hợp lệ \/ \d+ con/);
  });
});

test("AU9-AC-5 DQ area_con_ngoai_cha fail khi có con ngoài cha", async (t) => {
  assert.ok(DQ_SQL, "450_dq_checks.sql thiếu khối giữa marker «-- AU9 area_con_ngoai_cha» / «-- /AU9»");
  await withTx(t, async (c) => {
    await mocLac(c);
    await c.query(DQ_SQL);
    const { rows } = await c.query(
      `SELECT status, detail FROM dq_check_results WHERE check_name = 'area_con_ngoai_cha' AND entity = 'vn-hanoi'
       ORDER BY checked_at DESC, ctid DESC LIMIT 1`,
    );
    assert.equal(rows[0]?.status, "fail");
    assert.match(JSON.stringify(rows[0].detail), /[1-9]\d* khu vực/);
  });
});

test("AU9-AC-5 DQ area_con_ngoai_cha pass trên dữ liệu sạch", async (t) => {
  assert.ok(DQ_SQL, "450_dq_checks.sql thiếu khối giữa marker");
  await withTx(t, async (c) => {
    await runReassign(c, ["hanoi"], { log: ghiLog().log });
    await c.query(DQ_SQL);
    const { rows } = await c.query(
      `SELECT status FROM dq_check_results WHERE check_name = 'area_con_ngoai_cha' AND entity = 'vn-hanoi'
       ORDER BY checked_at DESC, ctid DESC LIMIT 1`,
    );
    assert.equal(rows[0]?.status, "pass");
  });
});
