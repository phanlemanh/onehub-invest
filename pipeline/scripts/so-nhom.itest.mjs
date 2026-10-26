// node --test pipeline/scripts/so-nhom.itest.mjs — cần DB local :5433 (ngoài `npm test`: CI không có DB).
// PL12 `so-nhom-mot-noi` ca «SN-*»: mỗi ca một lược đồ tạm dựng ở khuôn trước 047 rồi chạy nguyên tệp 047 + 048 trên
// đó. Trước và sau cả tệp chụp public — 048 chỉ áp lên public sau gộp, ca nào chạm public là đỏ.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import pg from "pg";
import { localDbUrl } from "./capture-ops-facts.mjs";
import { schemaUrl } from "./ops-facts-fixture.mjs";
import { DAU_SN, THAM_CHIEU, bangThamChieu, chay048, dungSauGop, nguonMau } from "./so-nhom-fixture.mjs";
import { COT_047, chay047, chupPublic, dungKhuonTruoc, xoaLuocDo } from "./vong-doi-fixture.mjs";

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


// ------------------------------------------------------------ AC-2 --
// Câu SQL chạm source_groups, rút NGUYÊN VĂN từ mã nguồn (chuỗi `…` và "…"). Số câu mỗi tệp viết trước — lệch là có câu
// mới chưa được đo.
const TEP_SQL = {
  "pipeline/apify-facebook-collector.mjs": 1,
  "pipeline/collect-chotot.mjs": 1,
  "app/src/lib/che-do-thu.ts": 3,
  "pipeline/ha-bung-het-han.mjs": 4,
  "app/src/app/api/v1/ops/source-groups/route.ts": 10,
  "pipeline/lib/vong-doi.mjs": 1,
};
function rutSql(text) {
  const out = [];
  const conLai = text.replace(/`[^`]*`/g, (m) => {
    out.push(m.slice(1, -1));
    return "``";
  });
  for (const m of conLai.matchAll(/"([^"\n]*)"/g)) out.push(m[1]);
  return out.map((q) => q.trim()).filter((q) => /source_groups/.test(q) && /^(SELECT|UPDATE|INSERT|DELETE)\b/i.test(q));
}

/** Tệp nhắc source_groups trên đỉnh nhánh (ngoài _acceptance/, docs/, migration) — tệp lạ là chỗ chưa được soát. */
const TEP_NHAC_SOURCE_GROUPS = [
  "CONTEXT.md",
  "LO-TRINH.html",
  "app/src/app/api/v1/ops/source-groups/route.ts",
  "app/src/components/ops/sources/sources-content.tsx",
  "app/src/lib/che-do-thu.ts",
  "app/tests/che-do-thu.test.tsx",
  "app/tests/so-nhom.test.tsx",
  "app/tests/vong-doi-nguon.test.tsx",
  "pipeline/apify-facebook-collector.mjs",
  "pipeline/collect-chotot.mjs",
  "pipeline/ha-bung-het-han.mjs",
  "pipeline/lib/vong-doi.mjs",
  "pipeline/scripts/so-nhom.itest.mjs",
  "pipeline/scripts/vong-doi-fixture.mjs",
  "pipeline/scripts/vong-doi-local.itest.mjs",
  "pipeline/scripts/vong-doi.itest.mjs",
  "scripts/cloud-sync.sh",
  "scripts/ui-standards/tier-a-names.mjs",
];

const K = (code, k) => `${DAU_SN}-${code}-${k}`;
/** Tham số của ca cho từng câu (khoá `tệp#thứ tự`); câu không tham số vắng khỏi bảng. */
const THAM_SO = {
  "app/src/lib/che-do-thu.ts#1": [1],
  "app/src/lib/che-do-thu.ts#2": [JSON.stringify({ mode: "duy_tri" }), 1],
  "pipeline/ha-bung-het-han.mjs#0": [1, "2026-10-26"],
  "pipeline/ha-bung-het-han.mjs#2": [1],
  "app/src/app/api/v1/ops/source-groups/route.ts#1": ["S05", K("S05", 2)],
  "app/src/app/api/v1/ops/source-groups/route.ts#2": ["S05", K("S05", 1), "lý do thử", null],
  "app/src/app/api/v1/ops/source-groups/route.ts#4": [false, "S05", K("S05", 1)],
  "app/src/app/api/v1/ops/source-groups/route.ts#5": ["S05", K("S05", 9), "nhóm mới", "{}"],
  "app/src/app/api/v1/ops/source-groups/route.ts#6": ["S06", K("S06", 9), "vùng mới", "{}"],
  "app/src/app/api/v1/ops/source-groups/route.ts#7": ["S05", K("S05", 1)],
  "app/src/app/api/v1/ops/source-groups/route.ts#8": ["S05", K("S05", 1)],
  "app/src/app/api/v1/ops/source-groups/route.ts#9": ["S05", K("S05", 1)],
  "pipeline/lib/vong-doi.mjs#0": ["S05", K("S05", 1)],
};

/** Khuôn sau 047 (A) hoặc sau 048 (B) với cùng 4 nhóm, cùng thứ tự chèn, cùng mốc thời gian. */
async function luocDoSong(ca, sau048) {
  const S = tenLuocDo(ca);
  await dungKhuonTruoc(admin, S);
  await nguonMau(admin, S);
  await admin.query(`CREATE TABLE "${S}".stg_zalo_posts (agent_id text, group_name text)`);
  const c = await moClient(S);
  const moc = "2026-10-01T00:00:00Z";
  for (const [code, k, params] of [["S05", 1, { mode: "bung", burst_until: "2026-10-20" }], ["S05", 2, {}],
    ["S06", 1, { region_v2: 13000 }], ["S06", 2, {}]]) {
    await c.query(`INSERT INTO source_groups (source_code, group_key, name, params, created_at, updated_at)
      VALUES ($1, $2, $3, $4::jsonb, $5, $5)`, [code, K(code, k), `${DAU_SN} ${code} ${k}`, JSON.stringify(params), moc]);
  }
  await chay047(c);
  await c.query(`UPDATE source_groups SET status = 'paused', reason = 'x', updated_at = $2 WHERE group_key = $1`, [K("S05", 2), moc]);
  await c.query(`UPDATE source_groups SET status = 'retired', updated_at = $2 WHERE group_key = $1`, [K("S06", 2), moc]);
  if (sau048) await chay048(c);
  return c;
}
const anhNhom = async (c) => dong(c, `SELECT id::int, source_code, group_key, name, enabled, params, note, status, reason,
  resume_when FROM source_groups ORDER BY id`);
const boGio = (rows) => rows.map(({ updated_at, ...r }) => r); // cột updated_at = now() khác nhau giữa hai lượt

test("SN-AC-2 câu đọc/ghi nguyên văn chạy y như trước qua view; tập tệp nhắc source_groups khớp danh sách", async () => {
  const cau = [];
  for (const [tep, soCau] of Object.entries(TEP_SQL)) {
    const rut = rutSql(readFileSync(path.join(ROOT, tep), "utf8"));
    assert.equal(rut.length, soCau, `${tep}: rút được ${rut.length} câu, viết trước ${soCau}`);
    rut.forEach((sql, i) => cau.push({ khoa: `${tep}#${i}`, sql }));
  }
  const A = await luocDoSong("ac2a", false);
  const B = await luocDoSong("ac2b", true);
  for (const { khoa, sql } of cau) {
    const ts = THAM_SO[khoa] ?? [];
    const ket = [];
    for (const c of [A, B]) {
      await c.query("BEGIN");
      try {
        const r = await c.query(sql, ts);
        ket.push({ rows: boGio(r.rows), rowCount: r.rowCount, sau: await anhNhom(c) });
      } finally {
        await c.query("ROLLBACK");
      }
    }
    assert.deepEqual(ket[1], ket[0], `${khoa} khác nhau trước/sau 048`);
  }

  // Đơn vị S03, S02 chỉ có ở sổ: không lọt vào câu đọc của script thu S05/S06; ha-bung khoá được dòng S03 mode bung;
  // docTrangThai hỏi S03 qua tên cũ được.
  await B.query(`INSERT INTO source_groups (source_code, group_key, name, params) VALUES ('S03', $1, 'nhóm S03', $2::jsonb),
    ('S02', $3, 'market S02', '{}')`, [K("S03", 1), JSON.stringify({ mode: "bung", burst_until: "2026-10-20" }), K("S02", 1)]);
  // docNhomThu (che-do-thu.ts#0) và GET route (route.ts#3) của trang nhóm thu cũ cũng chỉ thấy S05/S06.
  for (const khoa of ["pipeline/apify-facebook-collector.mjs#0", "pipeline/collect-chotot.mjs#0", "app/src/lib/che-do-thu.ts#0",
    "app/src/app/api/v1/ops/source-groups/route.ts#3"]) {
    const { sql } = cau.find((x) => x.khoa === khoa);
    assert.deepEqual((await B.query(sql)).rows, (await A.query(sql)).rows, `${khoa} thấy đơn vị ngoài nguồn của nó`);
  }
  const haBung = cau.find((x) => x.khoa === "pipeline/ha-bung-het-han.mjs#1").sql;
  await B.query("BEGIN");
  const khoaDong = (await B.query(haBung)).rows.map((r) => r.source_code);
  await B.query("ROLLBACK");
  assert.ok(khoaDong.includes("S03"), "ha-bung không khoá được dòng S03 mode bung");
  const { docTrangThai } = await import("../lib/vong-doi.mjs");
  assert.deepEqual(await docTrangThai(B, "S03", K("S03", 1)), { run: true, ly_do: "chay" });

  const tep = execFileSync("git", ["grep", "--untracked", "-l", "source_groups", "--", ".", ":(exclude)_acceptance", ":(exclude)docs",
    ":(exclude)db/migrations"], { cwd: ROOT, encoding: "utf8" }).trim().split("\n").sort();
  assert.deepEqual(tep, TEP_NHAC_SOURCE_GROUPS);
});

// Test C7 của trang Chế độ thu (app/tests/che-do-thu.test.tsx) chép khuôn bằng `LIKE public.<bảng>` — sau gộp
// public.source_groups là view. Chạy NGUYÊN VĂN bản chép của test đó với `public.` trỏ sang lược đồ mô phỏng public sau
// gộp (khuôn trước 047 + 047 + 048, ops_audit và stg_zalo_posts chép từ public).
const SO_CHO_PUBLIC_C7 = 1;
async function chayC7Tren(P) {
  const goc = readFileSync(path.join(ROOT, "app", "tests", "che-do-thu.test.tsx"), "utf8");
  assert.equal(goc.split("public.").length - 1, SO_CHO_PUBLIC_C7, "test C7 đổi số chỗ chép từ public — soát lại ca này");
  const tep = path.join(ROOT, "app", "tests", `.sn-che-do-thu-${process.pid}-${P}.test.tsx`);
  writeFileSync(tep, goc.replaceAll("public.", `${P}.`));
  try {
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT; // tiến trình con của node --test: biến này làm test con chỉ báo về cha, không tự chạy
    const out = execFileSync(process.execPath, ["--import", "tsx", "--test", tep], {
      cwd: path.join(ROOT, "app"), stdio: "pipe", timeout: 300_000, env, encoding: "utf8",
    });
    assert.match(out, /ℹ pass [1-9]/, "bản chép không chạy ca nào");
    return 0;
  } catch (e) {
    if (e.code === "ERR_ASSERTION") throw e;
    if (process.env.SN_IN_C7) console.error(String(e.stdout).split("✖ failing tests:")[1] ?? String(e.stdout).slice(-3000));
    return e.status ?? 1;
  } finally {
    rmSync(tep, { force: true });
  }
}
async function moPhongPublicSauGop(ca) {
  const P = tenLuocDo(ca);
  await dungSauGop(admin, P);
  for (const t of ["ops_audit", "stg_zalo_posts"]) await admin.query(`CREATE TABLE "${P}".${t} (LIKE public.${t} INCLUDING ALL)`);
  daMo.push([P, { end: async () => {} }]);
  return P;
}

test("SN-AC-2b test C7 (không sửa) xanh trên public mô phỏng sau gộp; đối chứng view thiếu cột params thì đỏ", async () => {
  const P = await moPhongPublicSauGop("ac2p");
  assert.equal(await chayC7Tren(P), 0, "test C7 đỏ trên public sau gộp");

  const Q = await moPhongPublicSauGop("ac2q");
  await admin.query(`DROP VIEW "${Q}".source_groups`);
  await admin.query(`CREATE VIEW "${Q}".source_groups AS SELECT id, source_code, group_key, name, enabled, note,
    created_at, updated_at, status, reason, resume_when FROM "${Q}".collection_units`);
  assert.notEqual(await chayC7Tren(Q), 0, "đối chứng: view thiếu cột params mà test C7 vẫn xanh — bản chép không đọc lược đồ mô phỏng");
});

test("SN-AC-2d ca VD-KHUON của TV2a vẫn đúng sau gộp: cột view source_groups trừ cột 047 = khuôn fixture", async () => {
  const P = tenLuocDo("ac2d");
  await dungSauGop(admin, P);
  const F = tenLuocDo("ac2d_f");
  await dungKhuonTruoc(admin, F);
  daMo.push([F, { end: async () => {} }], [P, { end: async () => {} }]);
  const cot = async (schema) => (await dong(admin, `SELECT column_name FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = 'source_groups' ORDER BY 1`, [schema])).map((r) => r.column_name);
  assert.deepEqual((await cot(P)).filter((x) => !COT_047.source_groups.includes(x)), await cot(F));
});

test("SN-AC-2c danh sách tên che ảnh chụp chỉ lấy nhóm S05/S06 của sổ", async () => {
  const S = tenLuocDo("ac2c");
  await dungSauGop(admin, S);
  const c = await moClient(S);
  for (const code of ["S02", "S03", "S05", "S06"]) {
    await c.query(`INSERT INTO source_groups (source_code, group_key, name) VALUES ($1, $2, $3)`,
      [code, `${DAU_SN}-khoa-${code}`, `${DAU_SN}-ten-nhom-${code}`]);
  }
  const ra = path.join(mkdtempSync(path.join(tmpdir(), "sn-tier-a-")), "ten.json");
  try {
    execFileSync(process.execPath, [path.join(ROOT, "scripts", "ui-standards", "tier-a-names.mjs"), "--out", ra],
      { cwd: ROOT, env: { ...process.env, DATABASE_URL: schemaUrl(S) }, stdio: "pipe" });
    const chu = readFileSync(ra, "utf8");
    for (const code of ["S05", "S06"]) {
      assert.ok(chu.includes(`${DAU_SN}-ten-nhom-${code}`) && chu.includes(`${DAU_SN}-khoa-${code}`), `thiếu ${code}`);
    }
    for (const code of ["S02", "S03"]) {
      assert.ok(!chu.includes(`${DAU_SN}-ten-nhom-${code}`) && !chu.includes(`${DAU_SN}-khoa-${code}`), `lọt ${code}`);
    }
  } finally {
    rmSync(ra, { force: true });
  }
});

// ------------------------------------------------------------ AC-7 --
test("SN-AC-7 isRunnable đọc trạng thái đơn vị S03, S02 từ sổ", async () => {
  const S = tenLuocDo("ac7");
  await dungSauGop(admin, S);
  const c = await moClient(S);
  await c.query(`UPDATE source_registry SET status = 'active'`);
  await c.query(`INSERT INTO source_groups (source_code, group_key, name, status, reason) VALUES
    ('S03', 'vd-nhom-1', 'n1', 'active', NULL), ('S03', 'vd-nhom-2', 'n2', 'paused', 'tắt ở gateway'),
    ('S02', '12345', 'm', 'retired', NULL), ('S05', $1, 'f', 'active', NULL)`, [`${DAU_SN}-s05`]);
  const { docTrangThai } = await import("../lib/vong-doi.mjs");
  assert.deepEqual(await docTrangThai(c, "S03", "vd-nhom-1"), { run: true, ly_do: "chay" });
  assert.deepEqual(await docTrangThai(c, "S03", "vd-nhom-2"), { run: false, ly_do: "don-vi-paused" });
  assert.deepEqual(await docTrangThai(c, "S02", "12345"), { run: false, ly_do: "don-vi-retired" });
  assert.deepEqual(await docTrangThai(c, "S05", `${DAU_SN}-s05`), { run: true, ly_do: "chay" });
});
