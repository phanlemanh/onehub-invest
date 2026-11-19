// deals-phi-ly-do.test.tsx — hồ sơ deals-phi-ly-do-doi-chung-tu-tinh: lõi đo của scripts/deals-phi-ly-do.mjs tự dựng tin phi
// lý đối chứng trong giao dịch. Mỗi ca dựng lược đồ riêng trong BEGIN…ROLLBACK (bản rỗng các bảng, view tin như 044, thước
// 034, sellers 060 — pipeline/lib/luoc-do-rieng.mjs), fixture ở trạng thái SAU bước đêm: không tin phi lý nào trong danh sách
// (đúng trạng thái DB máy thu làm đối chứng cũ đỏ oan). Chiều đỏ: bước đêm bỏ luật loại, và danh sách rỗng.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

import { doTrongGiaoDich } from "../../scripts/deals-phi-ly-do.mjs";
import { luocDoRieng, neuLaBang } from "../../pipeline/lib/luoc-do-rieng.mjs";
import { MIG_060 } from "../../pipeline/lib/nap-060.mjs";
import { refreshBaitGap } from "../../pipeline/refresh-bait-gap.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const ROOT = join(import.meta.dirname, "../..");
const SQL_034 = readFileSync(join(ROOT, "db/migrations/034_ruler_p2_views.sql"), "utf8");
// Bảng mà dealsSql, refreshBaitGap, view tin, thước 034 và 060 chạm tới — chép rỗng sang lược đồ riêng của từng ca.
const BANG = [
  "sale_offer_records", "properties", "property_offers", "areas", "stg_zalo_posts",
  "registry_aliases", "parties", "ref_lookup", "ops_audit",
];

const PHUONG = "vn-hanoi-t-dpd";
const M = 100_000_000; // giá/m² của năm căn thước bịa
// Ba tin P1 hợp lý (80 m² 2PN), giảm 30/20/10% — t_dpd_00 đứng đầu danh sách.
const GIAM = [30, 20, 10];
const ids = GIAM.map((_, i) => `t_dpd_0${i}`);

async function withTx<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    // 060 bỏ BẢNG sellers bằng câu DROP không tên lược đồ — DB chưa áp 060 thì chép nó để câu ấy rơi vào bản riêng.
    await luocDoRieng(c, [...BANG, ...(await neuLaBang(c, "sellers"))], { tienTo: "dpd" });
    await c.query("CREATE VIEW sale_offers AS SELECT * FROM sale_offer_records WHERE retired_at IS NULL");
    await c.query(SQL_034);
    await c.query(MIG_060);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

/** Thước: năm căn S06 bịa (P2) cùng phường × căn hộ giá M/m² — v_ruler_p2 ra trung vị M, n = 5. */
async function thuoc(c: pg.Client) {
  for (let i = 0; i < 5; i++) {
    const oid = `t_dpd_thuoc_${i}`;
    await c.query(
      `INSERT INTO sale_offers (offer_id, source, kind, confidence, first_seen, last_seen, post_ids, price_tier,
         property_type, area_id, area_m2, price_perm2)
       VALUES ($1, 'S06', 'sale', 'high', now(), now(), '{}', 'P2', 'apartment', $2, 80, $3)`,
      [oid, PHUONG, M],
    );
    const pid = (await c.query(`INSERT INTO properties (kind, area_id, property_type) VALUES ('sale', $1, 'apartment') RETURNING id`, [PHUONG])).rows[0].id;
    await c.query(`INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)`, [pid, oid]);
  }
  const r = (await c.query(`SELECT area_id, m FROM v_ruler_p2 WHERE property_type = 'apartment'`)).rows;
  assert.deepEqual(r.map((x) => [x.area_id, Number(x.m)]), [[PHUONG, M]], "DPD thước bịa không ra đúng một phường × loại");
}

/** Tin P1 hợp lý, số giảm do bước đêm thật đặt (refreshBaitGap) — fixture không tự viết bait_gap_pct. */
async function seed(c: pg.Client) {
  await thuoc(c);
  for (const [i, g] of GIAM.entries()) {
    await c.query(
      `INSERT INTO sale_offers (offer_id, source, kind, confidence, first_seen, last_seen, post_ids, price_tier,
         property_type, area_id, area_m2, bedrooms, price_vnd, price_perm2, n_reposts)
       VALUES ($1, 'S03', 'sale', 'high', now(), now(), '{}', 'P1', 'apartment', $2, 80, 2, $3, $4, 1)`,
      [ids[i], PHUONG, Math.round(80 * M * (1 - g / 100)), Math.round(M * (1 - g / 100))],
    );
  }
  // Trạng thái sau bước đêm: số giảm đã tính, luật loại đã chạy (không có gì để loại).
  const log = console.log;
  console.log = () => {};
  try {
    await refreshBaitGap(c);
  } finally {
    console.log = log;
  }
  const gap = (await c.query(`SELECT offer_id, bait_gap_pct FROM sale_offers WHERE offer_id = ANY($1) ORDER BY offer_id`, [ids])).rows;
  assert.deepEqual(gap.map((r) => Number(r.bait_gap_pct)), GIAM, "DPD fixture: bước đêm không ra đúng số giảm");
}

/** Bước đêm hỏng: refreshBaitGap THẬT qua client bọc bỏ đúng hai câu ghi của luật loại — số giảm vẫn do bên ghi thật tính. */
let soChan = 0;
async function demBoLuat(c: pg.Client) {
  const boc = new Proxy(c, {
    get(t, k) {
      if (k === "query") {
        return (sql: string, ...rest: unknown[]) => {
          const cau = String(sql).trim();
          if (/^UPDATE sale_offers SET bait_gap_pct = NULL WHERE offer_id = ANY/.test(cau)
            || (/^INSERT INTO ops_audit/.test(cau) && cau.includes("bait-gap:loai-phi-ly"))) {
            soChan++;
            return Promise.resolve({ rows: [], rowCount: 0 });
          }
          return (t.query as (...a: unknown[]) => unknown)(sql, ...rest);
        };
      }
      const v = Reflect.get(t, k);
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
  await refreshBaitGap(boc);
}

const im = () => {};
const tim = (kiem: { ok: boolean; msg: string }[], tienTo: string) => kiem.filter((k) => k.msg.startsWith(tienTo));

test("DPD-AC-1 DB đã qua bước đêm: đối chứng tự dựng bắt được tin đầu danh sách", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await seed(c);
    const kq = await doTrongGiaoDich(c, { log: im });
    assert.equal(kq.doiChung, "t_dpd_00", "DPD-AC-1 tin đối chứng phải là tin đầu danh sách");
    assert.deepEqual(kq.kiem.filter((k) => !k.ok).map((k) => k.msg), [], "DPD-AC-1 có kiểm đỏ trên DB lành");
    assert.equal(kq.dat, true);
    assert.equal(tim(kq.kiem, "đối chứng: bản chưa loại còn 1 tin phi lý").length, 1, "DPD-AC-1 thiếu kiểm đối chứng");
    assert.equal(tim(kq.kiem, "luật loại bắt tin đối chứng t_dpd_00").length, 1, "DPD-AC-1 thiếu kiểm luật loại bắt tin đối chứng");
    // Đối chứng đã lùi về SAVEPOINT: tin đối chứng còn diện tích, vẫn đứng đầu danh sách của phần đo chính, audit không còn.
    const dt = (await c.query(`SELECT area_m2 FROM sale_offers WHERE offer_id = 't_dpd_00'`)).rows[0].area_m2;
    assert.equal(Number(dt), 80, "DPD-AC-1 tin đối chứng mất diện tích sau lượt");
    assert.equal(kq.dau, "t_dpd_00", "DPD-AC-1 phần đo chính đọc danh sách đã mất tin đầu");
    const audit = (await c.query(`SELECT count(*)::int AS n FROM ops_audit WHERE action = 'bait-gap:loai-phi-ly'`)).rows[0].n;
    assert.equal(audit, 0, "DPD-AC-1 dòng audit của đối chứng còn sau SAVEPOINT");
  });
});

test("DPD-AC-2 luật loại hỏng: lượt đo đỏ, gọi tên", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await seed(c);
    soChan = 0;
    const kq = await doTrongGiaoDich(c, { refresh: demBoLuat, log: im });
    // Một lượt trong SAVEPOINT đối chứng có tin để loại (2 câu bị chặn); lượt đo chính không có (0). Chặn 0 = client bọc
    // không còn khớp câu của bên ghi — ca phá không phá gì.
    assert.equal(soChan, 2, "DPD-AC-2 client bọc không chặn đúng hai câu ghi của luật loại");
    assert.equal(kq.dat, false, "DPD-AC-2 luật loại hỏng mà lượt đo vẫn đạt");
    assert.deepEqual(tim(kq.kiem, "luật loại bắt tin đối chứng").map((k) => k.ok), [false],
      "DPD-AC-2 kiểm «luật loại bắt tin đối chứng» không đỏ");
  });
});

test("DPD-AC-3 danh sách rỗng: không giả đạt", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await thuoc(c);
    const kq = await doTrongGiaoDich(c, { log: im });
    assert.equal(kq.dat, false, "DPD-AC-3 danh sách rỗng mà lượt đo đạt");
    assert.deepEqual(tim(kq.kiem, "không dựng được tin đối chứng").map((k) => k.ok), [false],
      "DPD-AC-3 thiếu kiểm đỏ «không dựng được tin đối chứng»");
  });
});

test("DPD-AC-5 các kiểm cũ giữ nguyên nghĩa", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await seed(c);
    const kq = await doTrongGiaoDich(c, { log: im });
    for (const t of [
      "không tin thiếu diện tích trong danh sách",
      "không tin phòng quá nhỏ trong danh sách",
      "không tin phi lý nào trong danh sách",
      "đầu danh sách ≤ 35%",
      "đối chứng: bản chưa loại còn",
    ]) {
      assert.deepEqual(tim(kq.kiem, t).map((k) => k.ok), [true], `DPD-AC-5 kiểm «${t}» vắng hoặc đỏ`);
    }
  });
});

test("DPD-AC-6 đối chứng không đổi danh sách mà các kiểm chính đọc", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await thuoc(c);
    for (const [id, g] of [["t_dpd_30", 30], ["t_dpd_40", 40]] as const) {
      await c.query(
        `INSERT INTO sale_offers (offer_id, source, kind, confidence, first_seen, last_seen, post_ids, price_tier,
           property_type, area_id, area_m2, bedrooms, price_vnd, price_perm2, n_reposts)
         VALUES ($1, 'S03', 'sale', 'high', now(), now(), '{}', 'P1', 'apartment', $2, 80, 2, $3, $4, 1)`,
        [id, PHUONG, Math.round(80 * M * (1 - g / 100)), Math.round(M * (1 - g / 100))],
      );
    }
    const log = console.log;
    console.log = () => {};
    try { await refreshBaitGap(c); } finally { console.log = log; }
    const kq = await doTrongGiaoDich(c, { log: im });
    assert.equal(kq.doiChung, "t_dpd_30", "DPD-AC-6 tin đối chứng phải là tin 30% đầu danh sách");
    assert.deepEqual(tim(kq.kiem, "đầu danh sách ≤ 35% (DB còn 1 tin ≤ 35%)").map((k) => k.ok), [true],
      "DPD-AC-6 kiểm đầu danh sách không đọc danh sách nguyên");
    assert.deepEqual(tim(kq.kiem, "DB không còn tin đủ điều kiện"), [], "DPD-AC-6 rơi vào lối thoát vì đối chứng đã loại tin ≤ 35%");
    assert.equal(kq.dau, "t_dpd_30");
  });
});
