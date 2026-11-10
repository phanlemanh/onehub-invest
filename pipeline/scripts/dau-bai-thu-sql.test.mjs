// dau-bai-thu-sql.test.mjs — dau-noi-dung-sql-bai-thu (GN5). Bốn bản SQL chép định nghĩa bài thử phải khớp testMarker
// (pipeline/lib/test-posts.mjs) TỪNG DÒNG: S03_POSTS_SQL (ops-flow), bản chép trong app/src/lib/collections-queries.ts, vị từ
// câu đếm độc lập của test-data-residue, đoạn IS_TEST của pipeline/sql/600_data_flow.sql.
// Chạy trong giao dịch ROLLBACK; bảng TẠM che stg_zalo_posts / sale_offers / sellers (pg_temp đứng trước trong search_path),
// nên không đọc hay ghi bảng thật. DB: DATABASE_URL (npm test: DB của riêng lượt), mặc định DB local :5433.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { S03_POSTS_SQL } from "../lib/ops-flow.mjs";
import { NOI_DUNG_SQL, testMarker } from "../lib/test-posts.mjs";
import { TEST_POST_SQL_T, measureResidue } from "./test-data-residue.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const doc = (p) => readFileSync(join(ROOT, p), "utf8");

async function trongGiaoDich(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const SNAP = "hanoi__zalo-agent__2099-02-01T000000";
const NFD = "Bán căn [Tên sàn] giá tốt".normalize("NFD");
// Ma trận viết trước: [snapshot_id, agent_id, group_name, text, dấu mong đợi]. Mỗi dòng một ngày posted_at riêng, nên đếm theo
// ngày của S03_POSTS_SQL so được TỪNG dòng chứ không chỉ tổng.
const MA_TRAN = [
  ["hanoi__zalo-mock__2099-02-01T000000", "openclaw-hook", "Nhóm thật", "Bán căn 2PN", "snapshot-source"],
  [SNAP, "e2e-agent", "Nhóm thật", "Bán căn 2PN", "agent"],
  [SNAP, "openclaw-hook", "TEST-G1", "Bán căn 2PN", "group"],
  [SNAP, "openclaw-hook", "TESTING ROOM", "Bán căn 2PN", null],
  [SNAP, "openclaw-hook", "Nhóm thật", "Xem ảnh https://abc.trycloudflare.com/x nhé", "noi-dung"],
  [SNAP, "openclaw-hook", "Nhóm thật", "Bán căn [Tên sàn] giá tốt", "noi-dung"],
  [SNAP, "openclaw-hook", "Nhóm thật", "BÁN CĂN [TÊN SÀN] GIÁ TỐT", "noi-dung"],
  [SNAP, "openclaw-hook", "Nhóm thật", NFD, "noi-dung"],
  [SNAP, "openclaw-hook", "Nhóm thật", "Liên hệ tên sàn Hà Nội để xem", null],
  [SNAP, "openclaw-hook", "Nhóm thật", "Bán căn [Tên sàn mới] giá tốt", null],
  [SNAP, "openclaw-hook", "Nhóm thật", "Ảnh https://photo.zdn.vn/a.jpg", null],
  [SNAP, "openclaw-hook", "Nhóm thật", null, null],
  [SNAP, "openclaw-hook", "Nhóm thật", "Bán chung cư 2PN 3,2 tỷ", null],
];
const ID = (i) => `dnd_${String(i).padStart(2, "0")}`;
const NGAY = (i) => `2099-02-${String(i + 1).padStart(2, "0")}`;

async function napMaTran(c) {
  await c.query(`CREATE TEMP TABLE stg_zalo_posts (post_id text PRIMARY KEY, snapshot_id text, agent_id text, group_name text,
    text text, posted_at timestamptz, captured_at timestamptz DEFAULT now()) ON COMMIT DROP`);
  for (const [i, [snap, agent, group, text]] of MA_TRAN.entries())
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at) VALUES ($1,$2,$3,$4,$5,$6)`,
      [ID(i), snap, agent, group, text, `${NGAY(i)}T03:00:00Z`]);
  const { rows } = await c.query("SELECT count(*)::int n FROM stg_zalo_posts");
  assert.equal(rows[0].n, MA_TRAN.length, "bảng tạm phải che stg_zalo_posts");
}

/** Bản S03_POSTS_SQL của app, rút từ mã nguồn rồi dựng như lúc chạy (template literal thật, ${VN_TZ} → giờ VN). */
function appS03PostsSql() {
  const m = doc("app/src/lib/collections-queries.ts").match(/const S03_POSTS_SQL = `([^`]*)`/);
  assert.ok(m, "không rút được S03_POSTS_SQL trong app/src/lib/collections-queries.ts");
  return new Function("VN_TZ", `return \`${m[1]}\`;`)("Asia/Ho_Chi_Minh");
}

/** Đoạn IS_TEST giữa cặp chú thích của 600_data_flow.sql. */
function doan600(sql = doc("pipeline/sql/600_data_flow.sql")) {
  const m = sql.match(/\/\*<<<IS_TEST\*\/([\s\S]*?)\/\*IS_TEST>>>\*\//);
  assert.ok(m, "không rút được đoạn IS_TEST trong 600_data_flow.sql");
  return m[1];
}

/** Tập post_id bài thử theo một câu đếm-theo-ngày kiểu S03_POSTS_SQL (ngày có 0 bài = bài thử). */
async function thuTheoNgay(c, sql) {
  const { rows } = await c.query(sql, ["2099-01-01T00:00:00+07:00"]);
  const n = new Map(rows.map((r) => [r.d, r.n]));
  return new Set(MA_TRAN.map((_, i) => ID(i)).filter((_, i) => (n.get(NGAY(i)) ?? 0) === 0));
}
const thuTheoViTu = async (c, viTu, bang = "stg_zalo_posts t") =>
  new Set((await c.query(`SELECT post_id FROM ${bang} WHERE (${viTu})`)).rows.map((r) => r.post_id));

/** Dòng lệch giữa một tập bài thử SQL và testMarker; rỗng = khớp. */
function lech(ten, thu) {
  const sai = MA_TRAN.map((r, i) => [ID(i), (testMarker({ snapshot_id: r[0], agent_id: r[1], group_name: r[2], text: r[3] }) !== null)])
    .filter(([id, laThu]) => thu.has(id) !== laThu).map(([id]) => id);
  return sai.length ? `${ten} LECH testMarker: ${sai.join(", ")}` : "";
}

test("DND-AC-1 bốn bản SQL bài thử khớp testMarker từng dòng", { timeout: 120_000 }, async () => {
  // Đáp án viết trước của chính testMarker.
  assert.deepEqual(MA_TRAN.map((r) => testMarker({ snapshot_id: r[0], agent_id: r[1], group_name: r[2], text: r[3] })),
    MA_TRAN.map((r) => r[4]), "bảng viết trước lệch testMarker");
  // Chuỗi regex SQL của dấu nội dung chỉ viết ở test-posts.mjs.
  for (const p of ["pipeline/lib/ops-flow.mjs", "pipeline/scripts/test-data-residue.mjs"])
    assert.ok(!doc(p).includes("trycloudflare"), `${p} chép chữ dấu nội dung thay vì dùng NOI_DUNG_SQL`);

  const app = appS03PostsSql();
  const sql600 = doan600();
  await trongGiaoDich(async (c) => {
    await napMaTran(c);
    const ban = {
      S03_POSTS_SQL: (s = S03_POSTS_SQL) => thuTheoNgay(c, s),
      "APP S03_POSTS_SQL": (s = app) => thuTheoNgay(c, s),
      "RESIDUE SQL": (s = TEST_POST_SQL_T) => thuTheoViTu(c, s),
      "600 IS_TEST": (s = sql600) => thuTheoViTu(c, s, "stg_zalo_posts"),
    };
    for (const [ten, chay] of Object.entries(ban)) assert.equal(lech(ten, await chay()), "", ten);

    // Chiều đỏ trên cùng ma trận — mỗi đột biến báo đúng tên bản và post_id lệch.
    const NOI_DUNG_IDS = "dnd_04, dnd_05, dnd_06, dnd_07";
    const dot = async (ten, s, mong) => {
      assert.notEqual(s, null);
      assert.equal(lech(ten, await ban[ten](s)), `${ten} LECH testMarker: ${mong}`);
    };
    const boOps = S03_POSTS_SQL.replace(` AND NOT (${NOI_DUNG_SQL})`, "");
    assert.notEqual(boOps, S03_POSTS_SQL, "đột biến phải bỏ được vế nội dung của S03_POSTS_SQL");
    await dot("S03_POSTS_SQL", boOps, NOI_DUNG_IDS);
    const appKhongNfc = app.replace("normalize(coalesce(text, ''), NFC)", "coalesce(text, '')");
    assert.notEqual(appKhongNfc, app, "đột biến phải bỏ được NFC của bản app");
    await dot("APP S03_POSTS_SQL", appKhongNfc, "dnd_07");
    const appPhanBiet = app.replace("NFC) ~* 'trycloudflare", "NFC) ~ 'trycloudflare");
    assert.notEqual(appPhanBiet, app, "đột biến phải đổi ~* thành ~ ở bản app");
    await dot("APP S03_POSTS_SQL", appPhanBiet, "dnd_05, dnd_06, dnd_07"); // ~ phân biệt hoa thường: lọt mọi dòng viết «Tên»
    const bo600 = sql600.replace(/\s*OR normalize\(coalesce\(text, ''\), NFC\)[^\n]*/, "");
    assert.notEqual(bo600, sql600, "đột biến phải bỏ được vế nội dung của 600");
    await dot("600 IS_TEST", bo600, NOI_DUNG_IDS);
    const boResidue = TEST_POST_SQL_T.replace(/\s*OR normalize[\s\S]*$/, "");
    assert.notEqual(boResidue, TEST_POST_SQL_T, "đột biến phải bỏ được vế nội dung của câu đếm dư lượng");
    await dot("RESIDUE SQL", boResidue, NOI_DUNG_IDS);
    // Đột biến bù trừ: bỏ NFC (lọt dòng NFD) và gạt thêm «tên sàn» không ngoặc — tổng bài đếm không đổi, vẫn phải đỏ đúng hai dòng.
    const buTru = S03_POSTS_SQL.replace("normalize(coalesce(text, ''), NFC)", "coalesce(text, '')")
      .replace(" GROUP BY 1", " AND coalesce(text, '') !~* '^liên hệ tên sàn' GROUP BY 1");
    const tong = async (s) => (await c.query(s, ["2099-01-01T00:00:00+07:00"])).rows.reduce((a, r) => a + r.n, 0);
    assert.equal(await tong(buTru), await tong(S03_POSTS_SQL), "đột biến bù trừ phải giữ nguyên tổng");
    await dot("S03_POSTS_SQL", buTru, "dnd_07, dnd_08");
  });
});

test("DND-AC-4 câu đếm độc lập của test-data-residue đếm tin sinh từ bài nội dung thử", { timeout: 120_000 }, async () => {
  await trongGiaoDich(async (c) => {
    await c.query(`CREATE TEMP TABLE stg_zalo_posts (post_id text PRIMARY KEY, snapshot_id text, agent_id text, group_name text,
      text text, posted_at timestamptz, captured_at timestamptz DEFAULT now()) ON COMMIT DROP`);
    await c.query(`CREATE TEMP TABLE sale_offers (offer_id text PRIMARY KEY, post_ids text[], bait_gap_pct numeric,
      seller_phone_hash text) ON COMMIT DROP`);
    await c.query("CREATE TEMP TABLE sellers (phone_hash text) ON COMMIT DROP");
    const bai = [
      ["dnd_a", "Bán căn [Tên sàn] giá tốt"],
      ["dnd_b", "Xem https://abc.trycloudflare.com/x"],
      ["dnd_c", "Bán chung cư 2PN 3,2 tỷ"],
    ];
    for (const [id, text] of bai) {
      await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at)
        VALUES ($1, $2, 'openclaw-hook', 'Nhóm thật', $3, now())`, [id, SNAP, text]);
      await c.query("INSERT INTO sale_offers (offer_id, post_ids) VALUES ($1, ARRAY[$2])", [`o_${id}`, id]);
    }
    const r = await measureResidue(c);
    assert.equal(r.markers["noi-dung"], 2, "testMarker phải nhận hai bài nội dung thử");
    assert.equal(r.offers_from_test, 2, "đếm qua testMarker");
    assert.equal(r.offers_from_test_sql, r.offers_from_test,
      `RESIDUE offers_from_test_sql ${r.offers_from_test_sql} ≠ offers_from_test ${r.offers_from_test}`);
    // Chiều đỏ cùng fixture: câu đếm SQL bỏ vế nội dung.
    const bo = TEST_POST_SQL_T.replace(/\s*OR normalize[\s\S]*$/, "");
    assert.notEqual(bo, TEST_POST_SQL_T);
    const { rows: [q] } = await c.query(`SELECT count(*)::int AS n FROM sale_offers o WHERE EXISTS (
      SELECT 1 FROM stg_zalo_posts t WHERE t.post_id = ANY(o.post_ids) AND (${bo}))`);
    assert.equal(`RESIDUE offers_from_test_sql ${q.n} ≠ offers_from_test ${r.offers_from_test}`,
      "RESIDUE offers_from_test_sql 0 ≠ offers_from_test 2");
  });
});
