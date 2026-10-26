// tin-rao-gan-khu-vuc-dung AC-1…AC-7 — bốn bước gán (S03, S05, S06, PIP TP.HCM) chỉ gán vào phường hợp lệ.
// Mồi tự chèn trong BEGIN…ROLLBACK (không phụ thuộc dữ liệu thật, chạy được cả trên DB dựng từ migration); AC-7 đọc tĩnh.
import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

import pg from "pg";

import { docPhuongHopLe, ganPhuongTheoToaDo } from "../lib/osm.mjs";
import { runTransformChotot } from "../transform-chotot.mjs";
import { runTransformFb } from "../transform-fb.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const PIPE = join(import.meta.dirname, "..");
const MIG_044 = readFileSync(join(PIPE, "../db/migrations/044_nap_lai_khong_xoa.sql"), "utf8");
const SNAP_ZALO = "hanoi__zalo-agent__2099-02-02T000000";
const SNAP_CT = "hanoi__chotot__2099-02-02T000000";

// Khu vực mồi — tên lạ để chữ tin rao thật không khớp nhầm
const HN_HOP_LE = { id: "vn-hanoi-moi-hop-le-trg", parent: "vn-hanoi", name: "Mồi Hợp Lệ Trg", src: "osm-phuong" };
const HN_LAC = { id: "vn-hanoi-moi-lac-trg", parent: "vn-hanoi", name: "Mồi Lạc Trg", src: "osm-phuong", lac: true };
const HN_CU = { id: "vn-hanoi-quan-moi-cu-trg", parent: "vn-hanoi", name: "Quận Mồi Cũ Trg", src: "airbnb-discovery" };
const HCM_HOP_LE = { id: "vn-hcmc-moi-hop-le-hcm-trg", parent: "vn-hcmc", name: "Mồi Hợp Lệ Hcm Trg", src: "osm-phuong", pt: [110.0, 10.0] };
const HCM_LAC = { id: "vn-hcmc-moi-lac-hcm-trg", parent: "vn-hcmc", name: "Mồi Lạc Hcm Trg", src: "osm-phuong", lac: true, pt: [111.0, 10.0] };
const HCM_TRUNG = { id: "vn-hcmc-moi-trung-trg", parent: "vn-hcmc", name: "Mồi Trùng Trg", src: "osm-phuong" };

async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)"); // cùng khoá với test-posts: transform S03/S05 không chạy song song
    // PL14: transform ghi bảng bản ghi của 044 — DB chưa áp thì nạp 044 trong giao dịch.
    if (!(await c.query(`SELECT to_regclass('sale_offer_records') IS NOT NULL AS ok`)).rows[0].ok) await c.query(MIG_044);
    for (const [id, name] of [["vn-hanoi", "Hà Nội"], ["vn-hcmc", "TP. Hồ Chí Minh"]]) {
      await c.query(
        `INSERT INTO areas (id, region_type, name, country_code) VALUES ($1, 'market', $2, 'vn') ON CONFLICT (id) DO NOTHING`,
        [id, name],
      );
    }
    for (const [id, source] of [[SNAP_ZALO, "zalo-agent"], [SNAP_CT, "chotot"]]) {
      await c.query(
        `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', $2, '{}')
         ON CONFLICT (snapshot_id) DO NOTHING`,
        [id, source],
      );
    }
    for (const a of [HN_HOP_LE, HN_LAC, HN_CU, HCM_HOP_LE, HCM_LAC, HCM_TRUNG]) await mocArea(c, a);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

async function mocArea(c, a) {
  const meta = { source: a.src, ...(a.lac ? { lac: true } : {}) };
  await c.query(
    `INSERT INTO areas (id, parent_id, region_type, name, country_code, geom, meta)
     VALUES ($1, $2, 'submarket', $3, 'vn',
             CASE WHEN $5::float8 IS NULL THEN NULL
                  ELSE ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint($5, $6), 4326), 0.05)) END, $4::jsonb)`,
    [a.id, a.parent, a.name, JSON.stringify(meta), a.pt?.[0] ?? null, a.pt?.[1] ?? null],
  );
}

let seq = 0;
const pid = (tag) => `t_trg_${tag}_${process.pid}_${++seq}`;
/** Tin bán đủ giá + diện tích; diện tích/giá lạ để băm offer không trùng tin thật. */
const tinBan = (ten, m2, gia) => `Bán căn hộ 2PN ${m2}m2 ${ten}, giá ${gia} tỷ. LH 09${String(8000000 + seq).padStart(8, "0")}`;

async function insertPost(c, { agent_id = "openclaw-hook", group_name = "BĐS Hà Nội", text }) {
  const post_id = pid("p");
  await c.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at)
     VALUES ($1, $2, $3, $4, $5, '2026-10-25T08:00:00Z')`,
    [post_id, SNAP_ZALO, agent_id, group_name, text],
  );
  return post_id;
}

const areaOfPost = async (c, postId) => {
  const { rows } = await c.query(`SELECT area_id FROM sale_offers WHERE $1 = ANY(post_ids)`, [postId]);
  assert.equal(rows.length, 1, `bài ${postId} phải sinh đúng một tin bán, được ${rows.length}`);
  return rows[0].area_id;
};

test("TRG-AC-1 docPhuongHopLe chỉ trả phường hợp lệ", async () => {
  await withTx(async (c) => {
    const ids = (await docPhuongHopLe(c, ["vn-hanoi", "vn-hcmc"])).map((r) => r.id);
    assert.ok(ids.includes(HN_HOP_LE.id), "thiếu phường hợp lệ mồi");
    assert.ok(!ids.includes(HN_LAC.id), "khu vực lạc mồi lọt vào danh sách");
    assert.ok(!ids.includes(HN_CU.id), "khu vực airbnb-discovery mồi lọt vào danh sách");
    assert.deepEqual(await docPhuongHopLe(c, []), [], "danh sách thị trường rỗng phải trả rỗng");
  });
});

test("TRG-AC-1 gỡ dấu lac thì khu vực trở lại", async () => {
  await withTx(async (c) => {
    await c.query(`UPDATE areas SET meta = meta - 'lac' WHERE id = $1`, [HN_LAC.id]);
    const ids = (await docPhuongHopLe(c, ["vn-hanoi"])).map((r) => r.id);
    assert.ok(ids.includes(HN_LAC.id), "gỡ dấu lac mà khu vực không trở lại — bộ đọc lọc theo thứ khác");
  });
});

test("TRG-AC-2 transform-zalo không gán khu vực lạc", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    const pLac = await insertPost(c, { text: tinBan(HN_LAC.name, 71.3, "3.71") });
    const pHopLe = await insertPost(c, { text: tinBan(HN_HOP_LE.name, 72.3, "3.72") });
    const pTrung = await insertPost(c, { text: tinBan(HCM_TRUNG.name, 73.3, "3.73") });
    await runTransformZalo(c);
    assert.notEqual(await areaOfPost(c, pLac), HN_LAC.id, "S03 gán tin vào khu vực lạc");
    assert.equal(await areaOfPost(c, pHopLe), HN_HOP_LE.id, "S03 không gán được phường hợp lệ mồi (đối chứng dương)");
    assert.notEqual(await areaOfPost(c, pTrung), HCM_TRUNG.id, "S03 (chỉ Hà Nội) lấy nhầm phường TP.HCM trùng tên");
  });
});

test("TRG-AC-3 transform-fb không gán khu vực lạc (Hà Nội, TP.HCM)", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    const fb = { agent_id: "apify-facebook" };
    const pLacHn = await insertPost(c, { ...fb, group_name: "MUA BÁN NHÀ ĐẤT HÀ NỘI", text: tinBan(HN_LAC.name, 81.3, "4.81") });
    const pLacHcm = await insertPost(c, { ...fb, group_name: "MUA BÁN NHÀ TPHCM", text: tinBan(HCM_LAC.name, 82.3, "4.82") });
    const pHopLeHn = await insertPost(c, { ...fb, group_name: "MUA BÁN NHÀ ĐẤT HÀ NỘI", text: tinBan(HN_HOP_LE.name, 83.3, "4.83") });
    const pHopLeHcm = await insertPost(c, { ...fb, group_name: "MUA BÁN NHÀ TPHCM", text: tinBan(HCM_HOP_LE.name, 84.3, "4.84") });
    await runTransformFb(c);
    assert.notEqual(await areaOfPost(c, pLacHn), HN_LAC.id, "S05 gán tin Hà Nội vào khu vực lạc");
    assert.notEqual(await areaOfPost(c, pLacHcm), HCM_LAC.id, "S05 gán tin TP.HCM vào khu vực lạc");
    assert.equal(await areaOfPost(c, pHopLeHn), HN_HOP_LE.id, "S05 không gán được phường hợp lệ Hà Nội (đối chứng dương)");
    assert.equal(await areaOfPost(c, pHopLeHcm), HCM_HOP_LE.id, "S05 không gán được phường hợp lệ TP.HCM (đối chứng dương)");
  });
});

test("TRG-AC-4 transform-chotot không gán khu vực lạc", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    await c.query("DELETE FROM stg_chotot_ads"); // trong transaction — chỉ chạy hai tin mồi
    const ad = async (listId, ward, price) => {
      await c.query(
        `INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, subject, price, size_m2,
                                     ward_name_v3, payload, snapshot_id)
         VALUES ($1, 12000, 'vn-hanoi', 1010, 's', 'Bán căn hộ', $2, 70, $3, '{}', $4)`,
        [listId, price, ward, SNAP_CT],
      );
      return `offer_${createHash("sha256").update(`S06|${listId}`).digest("hex").slice(0, 16)}`;
    };
    const oLac = await ad(9900000001, HN_LAC.name, 3_910_000_000);
    const oHopLe = await ad(9900000002, HN_HOP_LE.name, 3_920_000_000);
    await runTransformChotot(c);
    const area = async (id) => (await c.query(`SELECT area_id FROM sale_offers WHERE offer_id = $1`, [id])).rows[0]?.area_id;
    assert.notEqual(await area(oLac), HN_LAC.id, "S06 gán tin vào khu vực lạc theo ward_name_v3");
    assert.equal(await area(oHopLe), HN_HOP_LE.id, "S06 không gán được phường hợp lệ mồi (đối chứng dương)");
  });
});

test("TRG-AC-5 transform-fb không gán khu vực airbnb-discovery", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    const p = await insertPost(c, {
      agent_id: "apify-facebook", group_name: "MUA BÁN NHÀ ĐẤT HÀ NỘI", text: tinBan(HN_CU.name, 85.3, "4.85"),
    });
    await runTransformFb(c);
    assert.notEqual(await areaOfPost(c, p), HN_CU.id, "S05 gán tin vào khu vực «Quận …» airbnb-discovery");
  });
});

test("TRG-AC-6 ganPhuongTheoToaDo bỏ qua khu vực lạc", async () => {
  await withTx(async (c) => {
    await c.query(
      `INSERT INTO listings (id, area_id, last_seen, latitude, longitude) VALUES
         ('trg-moi-trong-lac', 'vn-hcmc', current_date, $1, $2),
         ('trg-moi-trong-hop-le', 'vn-hcmc', current_date, $3, $4)`,
      [HCM_LAC.pt[1], HCM_LAC.pt[0], HCM_HOP_LE.pt[1], HCM_HOP_LE.pt[0]],
    );
    await ganPhuongTheoToaDo(c, "vn-hcmc");
    const area = async (id) => (await c.query(`SELECT area_id FROM listings WHERE id = $1`, [id])).rows[0].area_id;
    assert.equal(await area("trg-moi-trong-lac"), "vn-hcmc", "listing trong khu vực lạc bị gán vào nó");
    assert.equal(await area("trg-moi-trong-hop-le"), HCM_HOP_LE.id, "listing trong phường hợp lệ không được gán (đối chứng dương)");
  });
});

// ---- AC-7: ma trận viết trước mọi chỗ gán khu vực trong pipeline/ (design doc §5) ----
const RAW = [
  /region_type\s*=\s*'submarket'/,
  /'osm-phuong'/,
  /SET\s+area_id\b/,
  /UPDATE\s+(listings|sale_offers)\b[^;`]*?\barea_id\b/,
];
const HELPER = [/\bdocPhuongHopLe\(/, /\bganPhuongTheoToaDo\(/, /\bphuongHopLe\(/];
/** Nhãn: «nguon» = định nghĩa điều kiện · «chung» = dùng bộ chung · «vong» = dùng bộ chung, sửa ở vòng này (0 câu riêng) · «mien». */
export const MA_TRAN = {
  "lib/osm.mjs": "nguon",
  "reassign-areas.mjs": "chung",
  "transform-airbnb.mjs": "chung",
  "transform-zalo.mjs": "vong",
  "transform-fb.mjs": "vong",
  "transform-chotot.mjs": "vong",
  "transform-hcmc-simple.mjs": "vong",
  "scripts/bench-extraction.mjs": "mien",
  "sql/200_transform.sql": "mien",
  "sql/300_metrics.sql": "mien",
  "sql/450_dq_checks.sql": "mien",
  "refresh-bait-gap.mjs": "mien",
};

function docPipeline() {
  const files = new Map();
  (function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(mjs|sql)$/.test(e.name) && !/\.(test|itest)\./.test(e.name)) files.set(relative(PIPE, p), readFileSync(p, "utf8"));
    }
  })(PIPE);
  return files;
}

/** Lỗi của bộ tệp so với ma trận: tệp khớp mẫu ngoài ma trận, tệp ma trận không còn khớp, tệp «vong» còn câu riêng, 'osm-phuong' ngoài lib. */
export function kiemMaTran(files, maTran = MA_TRAN) {
  const loi = [];
  const khop = [...files].filter(([, s]) => RAW.some((r) => r.test(s)) || HELPER.some((r) => r.test(s))).map(([f]) => f);
  for (const f of khop) if (!(f in maTran)) loi.push(`${f}: khớp mẫu gán khu vực nhưng không có trong ma trận`);
  for (const f of Object.keys(maTran)) if (!khop.includes(f)) loi.push(`${f}: có trong ma trận nhưng không còn khớp mẫu`);
  for (const [f, nhan] of Object.entries(maTran)) {
    const s = files.get(f);
    if (!s) continue;
    if (nhan === "vong") {
      const rieng = RAW.filter((r) => r.test(s));
      if (rieng.length) loi.push(`${f}: còn câu chọn khu vực riêng (${rieng.map(String).join(", ")})`);
      if (!HELPER.some((r) => r.test(s))) loi.push(`${f}: không gọi bộ chung`);
    }
  }
  for (const [f, s] of files) if (f !== "lib/osm.mjs" && /'osm-phuong'/.test(s)) loi.push(`${f}: mang chuỗi 'osm-phuong' ngoài lib/osm.mjs`);
  return loi;
}

test("TRG-AC-7 tập tệp khớp mẫu bằng đúng ma trận viết trước", () => {
  assert.equal(Object.keys(MA_TRAN).length, 12, "ma trận viết trước phải đủ 12 tệp (design doc §5)");
  assert.deepEqual(kiemMaTran(docPipeline()), []);
});

test("TRG-AC-7 tệp dùng bộ chung không còn câu chọn riêng", () => {
  const files = docPipeline();
  for (const [f, nhan] of Object.entries(MA_TRAN)) {
    if (nhan !== "vong") continue;
    const s = files.get(f);
    assert.ok(s, `thiếu tệp ${f}`);
    assert.ok(!RAW.some((r) => r.test(s)), `${f} còn câu chọn khu vực riêng`);
  }
  const coChuoi = [...files].filter(([, s]) => /'osm-phuong'/.test(s)).map(([f]) => f);
  assert.deepEqual(coChuoi, ["lib/osm.mjs"], "'osm-phuong' chỉ được ở pipeline/lib/osm.mjs");
});

test("TRG-AC-7 bản sao thêm câu chọn riêng → báo tên tệp", () => {
  const files = docPipeline();
  files.set("transform-fb.mjs", files.get("transform-fb.mjs") + "\nconst x = `SELECT id FROM areas WHERE region_type = 'submarket'`;\n");
  assert.deepEqual(kiemMaTran(files), ["transform-fb.mjs: còn câu chọn khu vực riêng (/region_type\\s*=\\s*'submarket'/)"]);
});

test("TRG-AC-7 tệp mới khớp mẫu ngoài ma trận → báo tệp", () => {
  const files = docPipeline();
  files.set("transform-moi.mjs", "await c.query(`UPDATE listings SET area_id = 'x'`);\n");
  assert.deepEqual(kiemMaTran(files), ["transform-moi.mjs: khớp mẫu gán khu vực nhưng không có trong ma trận"]);
});
