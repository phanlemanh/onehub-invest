// node --test scripts/so-nguon-kho.test.mjs — chạy dưới `bash db/db-thu.sh oneinvest_suite_nk --chay …` (config:executors.test.nk_db)
// NK1 so-nguon-kho-khai-bao AC-1: migration 122 khai năm cột, họ và nhịp từng mã, dòng S09/S17, S11 tạm dừng, S01 thị trường
// có lịch; áp lần hai không đổi ô nào. Áp 122 lên public của DB của riêng lượt (bản chép, xoá khi lệnh dừng) — từ chối chạy
// trên DB chung `oneinvest`. Chỉ in mã nguồn, không in real_name/source_ids.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as boDoc from "./lib/so-nguon-122.mjs";
import { cadenceMap122, doc122, nhip122 } from "./lib/so-nguon-122.mjs";

const require = createRequire(new URL("../app/package.json", import.meta.url));
const pg = require("pg");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** Bảng mong đợi viết TRƯỚC: nhịp = đúng hằng SLO_HOURS trước NK1 (S01–S11), S16/S09 192 giữ chỗ (Hỏi-1), còn lại NULL. */
const MONG = {
  S01: { family: "flow", cadence_hours: 192, measured_markets: ["hanoi"] },
  S02: { family: "flow", cadence_hours: 840 },
  S03: { family: "flow", cadence_hours: 72 },
  S04: { family: "stock", cadence_hours: null },
  S05: { family: "flow", cadence_hours: 96 },
  S06: { family: "flow", cadence_hours: 36 },
  S07: { family: "stock", cadence_hours: null, stg_tables: ["stg_s07_project", "stg_s07_project_card", "stg_s07_sitemap_url"] },
  S08: { family: "stock", cadence_hours: 192 },
  S09: { family: "stock", cadence_hours: 192, status: "active", stg_tables: ["stg_s09_item"], real_name: null, source_ids: [] },
  S10: { family: "stock", cadence_hours: 192, stg_tables: ["stg_s10_project", "stg_s10_stock"] },
  S11: { family: "stock", cadence_hours: 192, status: "paused" },
  S12: { family: "stock", cadence_hours: null },
  S13: { family: "stock", cadence_hours: null },
  S14: { family: "stock", cadence_hours: null },
  S15: { family: "stock", cadence_hours: null },
  S16: {
    family: "stock",
    cadence_hours: 192,
    stg_tables: ["stg_s16_can", "stg_s16_can_chi_tiet", "stg_s16_item", "stg_s16_khu", "stg_s16_toa"],
  },
  S17: { family: "stock", cadence_hours: null, status: "draft", real_name: null, source_ids: [] },
};

/** So sổ với bảng mong đợi; trả danh sách lệch, mỗi mục gọi tên mã và cột (không in giá trị tầng A). */
export function soVoiMong(rows, mong = MONG) {
  const out = [];
  const by = new Map(rows.map((r) => [r.code, r]));
  for (const ma of ["S09", "S17"]) if (!by.has(ma)) out.push(`${ma}: không có dòng`);
  for (const r of rows) {
    const m = mong[r.code];
    if (!m) continue; // mã ngoài bảng (DB của máy khác) — chỉ đòi family có giá trị
    if (!["flow", "stock"].includes(r.family)) out.push(`${r.code}: family trống`);
    for (const [cot, v] of Object.entries(m)) {
      const got = r[cot];
      if (JSON.stringify(got ?? null) !== JSON.stringify(v)) out.push(`${r.code}: ${cot} lệch bảng mong đợi`);
    }
    if (!("measured_markets" in m) && r.measured_markets !== null) out.push(`${r.code}: measured_markets phải NULL`);
    if (!("stg_tables" in m) && r.stg_tables.length) out.push(`${r.code}: stg_tables phải rỗng`);
  }
  for (const r of rows) if (r.status === "paused" && !(r.reason ?? "").trim()) out.push(`${r.code}: paused thiếu reason`);
  return out;
}

const SO = `SELECT code, status, family, cadence_hours, universe, stg_tables, measured_markets, real_name, source_ids, reason,
                   resume_when, match_whole, label_vi
              FROM source_registry ORDER BY code`;

let c = null;
let dbErr = null;
let truoc = null;
before(async () => {
  try {
    c = new pg.Client({ connectionString: DB_URL });
    await c.connect();
  } catch (e) {
    dbErr = e.message;
    c = null;
    return;
  }
  const { rows: [{ db }] } = await c.query("SELECT current_database() AS db");
  if (db === "oneinvest") throw new Error("so-nguon-kho.test: không áp 122 lên DB chung oneinvest — chạy qua db/db-thu.sh --chay");
  truoc = (await c.query("SELECT code FROM source_registry ORDER BY code")).rows.map((r) => r.code);
  await c.query(doc122());
});
after(async () => c?.end());
const needDb = (t) => {
  if (!c) t.skip(`BỎ QUA — DB không tới (${dbErr}); eval đòi ok nên lượt này CHƯA đạt`);
  return !c;
};

describe("NK-AC-1 migration 122", () => {
  test("NK-AC-1 năm cột, CHECK và giá trị từng mã đúng bảng viết trước", async (t) => {
    if (needDb(t)) return;
    const { rows: cot } = await c.query(
      `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'source_registry'
          AND column_name IN ('family','cadence_hours','universe','stg_tables','measured_markets') ORDER BY column_name`,
    );
    assert.deepEqual(
      cot.map((x) => [x.column_name, x.data_type, x.is_nullable]),
      [
        ["cadence_hours", "integer", "YES"],
        ["family", "text", "YES"],
        ["measured_markets", "ARRAY", "YES"],
        ["stg_tables", "ARRAY", "NO"],
        ["universe", "jsonb", "NO"],
      ],
      "năm cột đúng kiểu",
    );
    const rows = (await c.query(SO)).rows;
    assert.deepEqual(soVoiMong(rows), [], "sổ sau 122 lệch bảng mong đợi");
    assert.ok(rows.every((r) => JSON.stringify(r.universe) === "{}"), "universe để {} (không ước)");
    const s11 = rows.find((r) => r.code === "S11");
    if (s11) assert.ok(s11.resume_when?.trim(), "S11 paused có điều kiện bật lại");
    // Dòng có sẵn trước 122 vẫn còn, chỉ thêm S09, S17.
    assert.deepEqual(rows.map((r) => r.code).filter((x) => !truoc.includes(x)).sort(), ["S09", "S17"].filter((x) => !truoc.includes(x)));
    // Bộ đọc test (so-nguon-122.mjs) ra cùng nhịp với sổ thật sau áp — test khác đọc nhịp qua nó.
    const doc = nhip122();
    for (const r of rows) if (doc[r.code]) assert.equal(doc[r.code].cadence_hours, r.cadence_hours, `${r.code}: bộ đọc 122 lệch sổ`);
    assert.deepEqual(cadenceMap122(), { S01: 192, S02: 840, S03: 72, S05: 96, S06: 36, S08: 192, S09: 192, S10: 192, S11: 192, S16: 192 });
  });

  test("NK-AC-1 áp 122 lần hai: không ô nào đổi, match_whole giữ", async (t) => {
    if (needDb(t)) return;
    const a = (await c.query(SO)).rows;
    await c.query(doc122());
    const b = (await c.query(SO)).rows;
    assert.deepEqual(b, a, "lần áp thứ hai đổi ô");
    // Ô người vận hành đổi sau áp không bị áp lại ghi đè.
    await c.query("BEGIN");
    try {
      await c.query("UPDATE source_registry SET cadence_hours = 100, match_whole = NOT match_whole WHERE code = 'S16'");
      await c.query(doc122());
      const s16 = (await c.query("SELECT cadence_hours, match_whole FROM source_registry WHERE code = 'S16'")).rows[0];
      const goc = a.find((r) => r.code === "S16");
      if (goc) {
        assert.equal(s16.cadence_hours, 100, "áp lại ghi đè nhịp người vận hành đã đổi");
        assert.equal(s16.match_whole, !goc.match_whole, "áp lại đổi match_whole");
      }
    } finally {
      await c.query("ROLLBACK");
    }
  });

  test("chiều đỏ NK-AC-1: family ngoài flow|stock bị CHECK chặn", async (t) => {
    if (needDb(t)) return;
    for (const [cot, v] of [["family", "'kho'"], ["cadence_hours", "0"]]) {
      await c.query("BEGIN");
      try {
        await assert.rejects(c.query(`UPDATE source_registry SET ${cot} = ${v} WHERE code = 'S01'`), /check constraint/, `${cot} = ${v} phải bị CHECK chặn`);
      } finally {
        await c.query("ROLLBACK");
      }
    }
  });

  test("chiều đỏ NK-AC-1: bảng mong đợi lệch một nhịp thì ca đỏ gọi tên mã", async (t) => {
    if (needDb(t)) return;
    const rows = (await c.query(SO)).rows;
    const lech = { ...MONG, S06: { ...MONG.S06, cadence_hours: 12 } };
    assert.deepEqual(soVoiMong(rows, lech), ["S06: cadence_hours lệch bảng mong đợi"]);
    // Bộ đọc 122 trên bản đột biến (S05 96 → 12) ra số đột biến — bộ đọc thật sự đọc tệp, không trả hằng.
    const dot = doc122().replace("('S05', 'flow',  96)", "('S05', 'flow',  12)");
    assert.notEqual(dot, doc122(), "đột biến không đổi gì");
    assert.equal(cadenceMap122(dot).S05, 12);
    // Thiếu dòng S09 thì đỏ gọi tên.
    assert.deepEqual(soVoiMong(rows.filter((r) => r.code !== "S09")), ["S09: không có dòng"]);
  });
});

// ---- ap122NeuThieu (GS duyệt 21/11): bản chép DB thử chưa áp 122 thì áp CHÍNH tệp 122; DB khác mà thiếu cột thì ném lỗi ----
/** Client giả: câu hỏi hình trả {db, co}; ghi mọi câu SQL. */
const gia = (db, co) => {
  const sqls = [];
  return { sqls, query: async (sql) => (sqls.push(sql), sql.includes("current_database()") ? { rows: [{ db, co }] } : { rows: [] }) };
};
/** Sổ đã có cột → không làm gì ở MỌI DB (kể cả oneinvest, tên lạ): không ném, 0 câu DDL, chỉ một câu hỏi hình. */
async function coCotLoi(mod) {
  const out = [];
  for (const db of ["oneinvest", "oneinvest_lan_khac", "postgres", "oneinvest_suite_x"]) {
    const c = gia(db, true);
    const kq = await mod.ap122NeuThieu(c).then((v) => v, (e) => `ném: ${e.message.slice(0, 40)}`);
    if (kq !== false) out.push(`${db}: đã có cột mà không phải phép không (${kq})`);
    if (c.sqls.length !== 1 || c.sqls.some((q) => /ALTER|INSERT|UPDATE|CREATE|DROP/.test(q))) out.push(`${db}: đã có cột mà chạy ${c.sqls.length - 1} câu thêm`);
  }
  return out;
}
/** Lỗi của bộ rào: mỗi mục gọi tên DB. Rỗng = rào đúng. */
async function raoLoi(mod) {
  const out = [];
  for (const db of ["oneinvest", "oneinvest_lan_khac", "postgres"]) {
    const c = gia(db, false);
    const loi = await mod.ap122NeuThieu(c).then(() => null, (e) => e.message);
    if (!loi || !/từ chối áp 122 vào DB «/.test(loi) || !loi.includes(db)) out.push(`${db}: không bị từ chối`);
    if (c.sqls.some((q) => q.includes("ALTER TABLE"))) out.push(`${db}: đã chạy SQL của 122`);
  }
  out.push(...(await coCotLoi(mod)));
  for (const db of ["oneinvest_suite_nk_123", "oneinvest_dbv_x"]) {
    const c = gia(db, false);
    if ((await mod.ap122NeuThieu(c)) !== true || !c.sqls.some((q) => q.includes(doc122().trim().slice(0, 200)))) out.push(`${db}: không áp chính tệp 122`);
  }
  return out;
}
describe("NK ap122NeuThieu", () => {
  test("NK ap122NeuThieu: DB thiếu cột mà không phải DB thử thì ném lỗi gọi tên DB; đã có cột thì không làm gì; DB thử thì áp chính tệp 122", async () => {
    assert.deepEqual(await raoLoi(boDoc), []);
  });
  test("chiều đỏ ap122NeuThieu: gỡ rào tên DB thì ca từ chối đỏ", async () => {
    const goc = readFileSync(fileURLToPath(new URL("./lib/so-nguon-122.mjs", import.meta.url)), "utf8");
    const rao = "  if (!DB_THU.test(r.db))\n    throw new Error(";
    assert.ok(goc.includes(rao), "khuôn phá lệch mã nguồn");
    const pha = goc.replace(rao, "  if (false)\n    throw new Error(")
      .replace('new URL("../../db/migrations/122_source_registry_family_cadence.sql", import.meta.url)', `new URL(${JSON.stringify(pathToFileURL(boDoc.TEP_122).href)})`);
    const dir = mkdtempSync(path.join(tmpdir(), "nk-rao-"));
    try {
      writeFileSync(path.join(dir, "so-nguon-122.mjs"), pha);
      const mod = await import(pathToFileURL(path.join(dir, "so-nguon-122.mjs")).href);
      assert.deepEqual(await raoLoi(mod), ["oneinvest: không bị từ chối", "oneinvest: đã chạy SQL của 122", "oneinvest_lan_khac: không bị từ chối",
        "oneinvest_lan_khac: đã chạy SQL của 122", "postgres: không bị từ chối", "postgres: đã chạy SQL của 122"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

test("NK ap122NeuThieu: đã có cột trên DB tên lạ (oneinvest, postgres) → không làm gì, 0 câu DDL", async () => {
  assert.deepEqual(await coCotLoi(boDoc), []);
});
test("chiều đỏ ap122NeuThieu: đảo thứ tự (rào tên trước kiểm cột) thì ca «đã có cột» đỏ", async () => {
  const goc = readFileSync(fileURLToPath(new URL("./lib/so-nguon-122.mjs", import.meta.url)), "utf8");
  const kiemCot = "  if (r.co) return false;\n";
  const rao = "  if (!DB_THU.test(r.db))\n    throw new Error(`ap122NeuThieu: từ chối áp 122 vào DB «${r.db}» — chỉ bản chép DB thử (oneinvest_suite_*, oneinvest_dbv_*)`);\n";
  assert.ok(goc.includes(kiemCot) && goc.includes(rao), "khuôn phá lệch mã nguồn");
  const pha = goc.replace(kiemCot, "").replace(rao, rao + kiemCot)
    .replace('new URL("../../db/migrations/122_source_registry_family_cadence.sql", import.meta.url)', `new URL(${JSON.stringify(pathToFileURL(boDoc.TEP_122).href)})`);
  const dir = mkdtempSync(path.join(tmpdir(), "nk-thu-tu-"));
  try {
    writeFileSync(path.join(dir, "so-nguon-122.mjs"), pha);
    const mod = await import(pathToFileURL(path.join(dir, "so-nguon-122.mjs")).href);
    const loi = await coCotLoi(mod);
    assert.deepEqual(loi.map((x) => x.split(":")[0]), ["oneinvest", "oneinvest_lan_khac", "postgres"], loi.join(" | "));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("NK ap122VaoSchema: từ chối public và tên rỗng, 0 câu SQL", async () => {
  for (const s of ["public", ""]) {
    const c = gia("oneinvest_suite_x", false);
    await assert.rejects(boDoc.ap122VaoSchema(c, s), /chỉ lược đồ tạm/, `«${s}» phải bị từ chối`);
    assert.equal(c.sqls.length, 0, `«${s}»: không được chạy câu nào`);
  }
  const c = gia("oneinvest_suite_x", false);
  await boDoc.ap122VaoSchema(c, "nk_tam");
  assert.ok(c.sqls.length === 1 && c.sqls[0].startsWith('SET search_path TO "nk_tam";') && c.sqls[0].includes(doc122().trim().slice(0, 200)), "áp chính tệp 122 trong lược đồ tạm");
});
