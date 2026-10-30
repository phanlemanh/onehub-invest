// danh-ba-nguoi.itest.mjs — DB2b `ho-nguoi-theo-nguon` (AC-n ↔ _acceptance/ho-nguoi-theo-nguon/evals.yaml E1–E4, E6, E8,
// E10). Mỗi ca BEGIN … ROLLBACK với 055 nạp trong giao dịch. Chạy trên DB thử riêng (executor mặc định
// oneinvest_p3_nguoi), không trên DB `oneinvest` dùng chung khi 055 chưa áp (luật đo của đợt dot0-cam-mau).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { chotDbThuNguoi } from "../lib/danh-ba-nguoi.mjs";
import { checkDb, readMappings } from "../lib/vocab-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SQL_055 = readFileSync(path.join(ROOT, "db/migrations/055_danh_ba_nguoi.sql"), "utf8");
export const KHOA_DANH_BA = 55055;
const BON_BANG = ["parties", "registry_aliases", "registry_events", "party_roles"];
const TRUC_MOI = ["registry_status", "alias_kind", "registry_event_kind", "party_role"];
const PTY = "pty_01HZZZZZZZZZZZZZZZZZZZZZZZ";
const PTY2 = "pty_01HZZZZZZZZZZZZZZZZZZZZZZY";

let c;
before(async () => {
  if (!process.env.DATABASE_URL) throw new Error("thiếu DATABASE_URL — trỏ vào DB thử riêng (bash db/db-thu.sh oneinvest_p3_nguoi)");
  c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const { rows: [r] } = await c.query("SELECT current_database() AS db, to_regclass('public.parties')::text AS p");
  const loi = chotDbThuNguoi(r.db, Boolean(r.p));
  if (loi) throw new Error(loi);
});
after(async () => {
  await c?.end();
});

/** Chạy fn trong một giao dịch luôn ROLLBACK: khoá advisory của danh bạ lấy TRƯỚC khi nạp 055 (thứ tự như dungNguoi). */
export async function trongGiaoDich(fn, client = c) {
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock($1)", [KHOA_DANH_BA]);
    await client.query(SQL_055);
    return await fn(client);
  } finally {
    await client.query("ROLLBACK");
  }
}

/** Thông điệp lỗi chặn lệnh (tên ràng buộc + chữ), hoặc null khi lệnh vào được. Mỗi lệnh một SAVEPOINT. */
async function rangBuocChan(sql, values) {
  await c.query("SAVEPOINT ca");
  try {
    await c.query(sql, values);
    await c.query("RELEASE SAVEPOINT ca");
    return null;
  } catch (e) {
    await c.query("ROLLBACK TO SAVEPOINT ca");
    return `${e.constraint ?? ""} ${e.message}`.trim();
  }
}

async function anhLuocDo() {
  const q = async (sql) => JSON.stringify((await c.query(sql, [BON_BANG])).rows);
  return [
    await q(`SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns
              WHERE table_name = ANY($1) ORDER BY 1, 2`),
    await q(`SELECT conrelid::regclass::text AS t, conname, pg_get_constraintdef(oid) AS d FROM pg_constraint
              WHERE conrelid::regclass::text = ANY($1) ORDER BY 1, 2`),
    await q(`SELECT tgrelid::regclass::text AS t, tgname, tgtype FROM pg_trigger
              WHERE NOT tgisinternal AND tgrelid::regclass::text = ANY($1) ORDER BY 1, 2`),
    await q(`SELECT tablename, indexname, indexdef FROM pg_indexes WHERE tablename = ANY($1) ORDER BY 1, 2`),
  ].join("\n");
}

test("AC-1 khung danh bạ: 055 idempotent, ràng buộc và rào chỉ-thêm", async () => {
  await trongGiaoDich(async () => {
    const truoc = await anhLuocDo();
    await c.query(SQL_055);
    assert.equal(await anhLuocDo(), truoc, "AC-1 nạp 055 lần hai đổi lược đồ");

    // Dữ liệu nền cho các ô UPDATE/DELETE: một người, một bí danh, một sự kiện, một vai.
    await c.query(`INSERT INTO parties (party_key, source) VALUES ($1, 'S03')`, [PTY2]);
    await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'tai_khoan_nguon', 'nen', 'S03')`, [PTY2]);
    await c.query(`INSERT INTO registry_events (object_key, kind, reason, changed_by) VALUES ($1, 'nghi', 'nền test', 'itest')`, [PTY2]);
    const { rows: [vai] } = await c.query(
      `INSERT INTO party_roles (party_key, role, subject_key, evidence_tier, method, run_id)
       VALUES ($1, 'nguoi_dang', 'S03:TEST-DB2b-nen', 'fact', 'source_field', 'itest') RETURNING id`, [PTY2]);

    const tuChoi = (msg) => (m) => m !== null && (msg ? msg.test(m) : true);
    const chiThem = tuChoi(/chỉ thêm/);
    const MA_TRAN = [
      ["(1) khoá pty_ hợp lệ", `INSERT INTO parties (party_key, source) VALUES ($1, 'S03')`, [PTY], (m) => m === null],
      ["(2) khoá pty_abc", `INSERT INTO parties (party_key, source) VALUES ('pty_abc', 'S03')`, [], tuChoi()],
      ["(3) khoá usr_", `INSERT INTO parties (party_key, source) VALUES ('usr_01HZZZZZZZZZZZZZZZZZZZZZZZ', 'S03')`, [], tuChoi()],
      ["(4) status deleted", `INSERT INTO parties (party_key, source, status) VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZZZZX', 'S03', 'deleted')`, [], tuChoi()],
      ["(5) merged thiếu merged_into", `INSERT INTO parties (party_key, source, status) VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZZZZX', 'S03', 'merged')`, [], tuChoi()],
      ["(6) active có merged_into", `INSERT INTO parties (party_key, source, merged_into) VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZZZZX', 'S03', $1)`, [PTY2], tuChoi()],
      ["(7) parties.source tên thật", `INSERT INTO parties (party_key, source) VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZZZZX', 'chotot')`, [], tuChoi()],
      ["(8) registry_aliases.source tên thật", `INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ten', 'x', 'chotot')`, [PTY2], tuChoi()],
      ...BON_BANG.flatMap((t) => [
        [`DELETE ${t}`, `DELETE FROM ${t}`, [], chiThem],
        [`TRUNCATE ${t}`, `TRUNCATE ${t} CASCADE`, [], chiThem],
      ]),
      ["(17) rút vai không lý do", `UPDATE party_roles SET retracted_at = now() WHERE id = $1`, [vai.id], chiThem],
      ["(18) đổi party_key của vai", `UPDATE party_roles SET party_key = $2 WHERE id = $1`, [vai.id, PTY], chiThem],
    ];
    assert.equal(MA_TRAN.length, 18, "ma trận viết trước 18 dòng");
    let soAssert = 0;
    for (const [dong, sql, vals, dung] of MA_TRAN) {
      const m = await rangBuocChan(sql, vals);
      assert.ok(dung(m), `AC-1 ràng buộc không chặn: ${dong} → ${m ?? "vào được"}`);
      soAssert++;
    }
    assert.equal(soAssert, 18);
    // Đối chứng dương: rút CÓ lý do vào được.
    assert.equal(await rangBuocChan(`UPDATE party_roles SET retracted_at = now(), retract_reason = 'thay-boi-luot' WHERE id = $1`, [vai.id]), null,
      "AC-1 rút vai có lý do bị chặn");
  });
});

test("AC-2 enum và DQ (a): sổ từ vựng khớp DB cho bốn trục mới, chiều đỏ khi thiếu dòng", async () => {
  const reg = readMappings(ROOT);
  await trongGiaoDich(async () => {
    const lechMoi = (ds) => ds.filter((x) => TRUC_MOI.includes(x.axis) || /party_roles\./.test(x.column ?? ""));
    assert.deepEqual(lechMoi(await checkDb(c, reg)).map((x) => x.msg), [], "AC-2 sổ lệch DB");
    await c.query(`DELETE FROM ref_lookup WHERE lookup_name = 'party_role' AND lookup_value = 'nguoi_dang'`);
    const lech = lechMoi(await checkDb(c, reg));
    assert.ok(lech.some((x) => x.axis === "party_role"), `AC-2 --check-db không báo trục party_role: ${JSON.stringify(lech)}`);
  });
});
