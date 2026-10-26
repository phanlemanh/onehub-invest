// node --test pipeline/scripts/so-nhom.itest.mjs — cần DB local :5433 (ngoài `npm test`: CI không có DB).
// PL12 `so-nhom-mot-noi` ca «SN-*»: mỗi ca một lược đồ tạm dựng ở khuôn trước 047 rồi chạy nguyên tệp 047 + 048 trên
// đó. Trước và sau cả tệp chụp public — 048 chỉ áp lên public sau gộp, ca nào chạm public là đỏ.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import pg from "pg";
import { localDbUrl } from "./capture-ops-facts.mjs";
import { schemaUrl } from "./ops-facts-fixture.mjs";
import { DAU_SN, THAM_CHIEU, bangThamChieu, chay048, dungSauGop, nguonMau } from "./so-nhom-fixture.mjs";
import { chay047, chupPublic, dungKhuonTruoc, xoaLuocDo } from "./vong-doi-fixture.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const admin = new pg.Client({ connectionString: localDbUrl() });
const daMo = [];
let publicTruoc;

/** Ảnh chụp public của vòng này: khuôn TV2a + public chưa có collection_units + dòng ops_audit mang dấu PL12. */
async function chup() {
  const q = async (sql) => (await admin.query(sql)).rows[0];
  return {
    ...(await chupPublic(admin)),
    collection_units: (await q(`SELECT to_regclass('public.collection_units')::text AS r`)).r,
    ops_audit_sn: (await q(`SELECT count(*)::int AS n FROM public.ops_audit WHERE detail::text LIKE '%${DAU_SN}%'`)).n,
  };
}

before(async () => {
  await admin.connect();
  publicTruoc = await chup();
});
after(async () => {
  for (const [S, c] of daMo) {
    await c.end().catch(() => {});
    await xoaLuocDo(admin, S).catch(() => {});
  }
  const publicSau = await chup();
  await admin.end().catch(() => {});
  assert.deepEqual(publicSau, publicTruoc, "public đã bị chạm — 048 chỉ được áp sau gộp");
});

/** Client trỏ đúng lược đồ `S` (search_path chỉ gồm S); dọn khi hết tệp. */
async function moClient(S) {
  const c = new pg.Client({ connectionString: schemaUrl(S) });
  await c.connect();
  daMo.push([S, c]);
  return c;
}
const tenLuocDo = (ca) => `sn_${process.pid}_${ca}`;
const loi = async (p) => {
  try {
    await p;
  } catch (e) {
    return String(e.message);
  }
  return null;
};
const dong = async (c, sql, args) => (await c.query(sql, args)).rows;

/** Lược đồ khuôn trước 047 có 4 nhóm (S05 active, S05 paused 'x', S06 active, S06 retired) rồi chạy 047. */
async function bonNhomSau047(ca) {
  const S = tenLuocDo(ca);
  await dungKhuonTruoc(admin, S);
  await nguonMau(admin, S);
  const c = await moClient(S);
  for (const [code, k] of [["S05", 1], ["S05", 2], ["S06", 1], ["S06", 2]]) {
    await c.query(`INSERT INTO source_groups (source_code, group_key, name, params) VALUES ($1, $2, $3, $4::jsonb)`,
      [code, `${DAU_SN}-${code}-${k}`, `${DAU_SN} nhóm ${code} ${k}`, JSON.stringify({ k })]);
  }
  await chay047(c);
  await c.query(`UPDATE source_groups SET status = 'paused', reason = 'x' WHERE group_key = $1`, [`${DAU_SN}-S05-2`]);
  await c.query(`UPDATE source_groups SET status = 'retired' WHERE group_key = $1`, [`${DAU_SN}-S06-2`]);
  return { S, c };
}

/** Ảnh dữ liệu và khuôn của sổ — dùng so lần chạy 1 và lần 2. */
async function anhSo(c) {
  return {
    dong: await dong(c, `SELECT id::int, source_code, group_key, name, status, reason, enabled, params, unit_code, unit_type,
                                original_name, market_codes, project_node_ids FROM collection_units ORDER BY id`),
    dem: await dong(c, `SELECT source_code, unit_type, last FROM collection_unit_seq ORDER BY 1, 2`),
    trigger: (await dong(c, `SELECT t.tgname FROM pg_trigger t WHERE t.tgrelid = 'collection_units'::regclass
                             AND NOT t.tgisinternal ORDER BY 1`)).map((r) => r.tgname),
    rang_buoc: (await dong(c, `SELECT conname FROM pg_constraint WHERE conrelid = 'collection_units'::regclass ORDER BY 1`))
      .map((r) => r.conname),
  };
}

// ------------------------------------------------------------ AC-1 --
test("SN-AC-1 đổi tên giữ mọi dòng, trigger, CHECK; view gồm mọi dòng với tên cột cũ; chạy hai lần", async () => {
  const { c } = await bonNhomSau047("ac1");
  const truoc = await dong(c, `SELECT id::int, status, enabled, params FROM source_groups ORDER BY id`);

  await chay048(c);
  const lan1 = await anhSo(c);
  await chay048(c);
  const lan2 = await anhSo(c);
  assert.deepEqual(lan2, lan1, "lần chạy thứ hai đổi gì đó");

  const loai = Object.fromEntries((await dong(c, `SELECT relname, relkind FROM pg_class
    WHERE relnamespace = current_schema()::regnamespace AND relname IN ('collection_units', 'source_groups')`))
    .map((r) => [r.relname, r.relkind]));
  assert.deepEqual(loai, { collection_units: "r", source_groups: "v" });

  assert.deepEqual(await dong(c, `SELECT id::int, status, enabled, params FROM collection_units ORDER BY id`), truoc);
  assert.ok(lan1.trigger.includes("source_groups_dong_bo_enabled"), "trigger 047 không nằm trên collection_units");
  for (const ten of ["source_groups_status_chk", "source_groups_paused_reason_chk", "source_groups_enabled_khop_chk"]) {
    assert.ok(lan1.rang_buoc.includes(ten), `thiếu CHECK ${ten}`);
  }

  const cotView = (await dong(c, `SELECT column_name FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'source_groups' ORDER BY ordinal_position`)).map((r) => r.column_name);
  assert.deepEqual(cotView, ["id", "source_code", "group_key", "name", "enabled", "params", "note", "created_at",
    "updated_at", "status", "reason", "resume_when"]);
  const [{ n: nView }] = await dong(c, `SELECT count(*)::int AS n FROM source_groups`);
  const [{ n: nBang }] = await dong(c, `SELECT count(*)::int AS n FROM collection_units`);
  assert.equal(nView, nBang);
  assert.equal(nView, 4);

  // Đối chứng: đổi tên một cột cũ của view thì câu đọc rút nguyên văn từ script thu S06 ném lỗi nêu tên cột.
  const nguon = readFileSync(path.join(ROOT, "pipeline", "collect-chotot.mjs"), "utf8");
  const cau = nguon.match(/`(SELECT group_key, name, params FROM source_groups[\s\S]*?)`/)?.[1];
  assert.ok(cau, "không rút được câu đọc của script thu S06");
  assert.equal(await loi(c.query(cau)), null);
  await c.query(`ALTER VIEW source_groups RENAME COLUMN params TO params_doi`);
  assert.match(await loi(c.query(cau)) ?? "", /params/);
});

test("SN-AC-1b chèn qua view không nêu status/params nhận mặc định bảng gốc và loại suy theo nguồn", async () => {
  const S = tenLuocDo("ac1b");
  await dungSauGop(admin, S);
  const c = await moClient(S);
  await c.query(`INSERT INTO source_groups (source_code, group_key, name) VALUES ('S05', $1, 'nhóm cũ')`, [`${DAU_SN}-moi`]);
  const [r] = await dong(c, `SELECT status, enabled, params, unit_type, original_name, unit_code FROM collection_units`);
  assert.deepEqual(r, { status: "active", enabled: true, params: {}, unit_type: "nhom", original_name: "nhóm cũ", unit_code: "S05-N001" });
});

// ------------------------------------------------------------ AC-3 --
test("SN-AC-3 mã đơn vị: backfill theo id, tăng theo cặp, không cấp lại, không sửa được", async () => {
  const { c } = await bonNhomSau047("ac3");
  await chay048(c);
  assert.deepEqual((await dong(c, `SELECT unit_code FROM collection_units ORDER BY id`)).map((r) => r.unit_code),
    ["S05-N001", "S05-N002", "S06-V001", "S06-V002"]);

  const chen = async (code, k) => (await dong(c,
    `INSERT INTO source_groups (source_code, group_key, name) VALUES ($1, $2, $3) RETURNING id`,
    [code, `${DAU_SN}-them-${code}-${k}`, `thêm ${code} ${k}`]))[0].id;
  const ma = async (id) => (await dong(c, `SELECT unit_code FROM collection_units WHERE id = $1`, [id]))[0].unit_code;

  assert.equal(await ma(await chen("S03", 1)), "S03-N001");
  assert.equal(await ma(await chen("S05", 1)), "S05-N003");
  assert.equal(await ma(await chen("S06", 1)), "S06-V003");
  assert.equal(await ma(await chen("S02", 1)), "S02-M001");

  await c.query(`UPDATE collection_units SET status = 'retired' WHERE unit_code = 'S05-N002'`);
  const idN4 = await chen("S05", 2);
  assert.equal(await ma(idN4), "S05-N004");
  await c.query(`DELETE FROM source_groups WHERE id = $1`, [idN4]);
  assert.equal(await ma(await chen("S05", 3)), "S05-N005", "mã đã xoá bị cấp lại");

  const khuon = /^S0[0-9]-[NVM][0-9]{3}$/;
  const tatCa = (await dong(c, `SELECT unit_code FROM collection_units`)).map((r) => r.unit_code);
  assert.ok(tatCa.every((m) => khuon.test(m)));
  assert.equal(new Set(tatCa).size, tatCa.length);

  assert.match(await loi(c.query(`UPDATE collection_units SET unit_code = 'S05-N999' WHERE unit_code = 'S05-N001'`)) ?? "",
    /collection_units_khoa_ma/);
  assert.match(await loi(c.query(`INSERT INTO collection_units (source_code, group_key, name, unit_code)
    VALUES ('S05', $1, 'kèm mã', 'S05-N500')`, [`${DAU_SN}-kem-ma`])) ?? "", /collection_units_cap_ma/);

  // Đối chứng: gỡ trigger chặn sửa mã thì UPDATE unit_code được nhận.
  await c.query(`DROP TRIGGER collection_units_khoa_ma ON collection_units`);
  assert.equal(await loi(c.query(`UPDATE collection_units SET unit_code = 'S05-N999' WHERE unit_code = 'S05-N001'`)), null);
});

test("SN-AC-3b chèn nguồn không suy được loại bị từ chối có tên, không chèn nửa", async () => {
  const S = tenLuocDo("ac3b");
  await dungSauGop(admin, S);
  const c = await moClient(S);
  const [{ n: truoc }] = await dong(c, `SELECT count(*)::int AS n FROM collection_units`);
  assert.match(await loi(c.query(`INSERT INTO source_groups (source_code, group_key, name) VALUES ('S01', $1, 'x')`,
    [`${DAU_SN}-s01`])) ?? "", /không suy được unit_type cho S01/);
  const [{ n: sau }] = await dong(c, `SELECT count(*)::int AS n FROM collection_units`);
  assert.equal(sau, truoc);
});

// ------------------------------------------------------------ AC-4 --
test("SN-AC-4 market_codes chỉ nhận thị trường, project_node_ids chỉ nhận khu đô thị (Hỏi-3)", async () => {
  const S = tenLuocDo("ac4");
  await dungSauGop(admin, S, { thamChieu: true });
  const c = await moClient(S);
  await c.query(`INSERT INTO source_groups (source_code, group_key, name) VALUES ('S05', $1, 'nhóm')`, [`${DAU_SN}-ac4`]);
  const ghi = (cot, gt) => c.query(`UPDATE collection_units SET ${cot} = $1 WHERE group_key = $2`, [gt, `${DAU_SN}-ac4`]);
  const TEN = /collection_units_kiem_tham_chieu/;

  assert.match(await loi(ghi("market_codes", ["vn-xyz-khong-co"])) ?? "", TEN);
  assert.match(await loi(ghi("market_codes", [THAM_CHIEU.submarket])) ?? "", TEN);
  assert.equal(await loi(ghi("market_codes", [THAM_CHIEU.market])), null);
  assert.match(await loi(ghi("project_node_ids", [THAM_CHIEU.building])) ?? "", TEN);
  assert.match(await loi(ghi("project_node_ids", [999999])) ?? "", TEN);
  assert.equal(await loi(ghi("project_node_ids", [THAM_CHIEU.project])), null);

  const [r] = await dong(c, `SELECT market_codes, project_node_ids FROM collection_units WHERE group_key = $1`, [`${DAU_SN}-ac4`]);
  assert.deepEqual(r, { market_codes: [THAM_CHIEU.market], project_node_ids: [String(THAM_CHIEU.project)] });
});

