// node --test pipeline/scripts/source-name-entries.itest.mjs — chạy qua `bash db/db-thu.sh oneinvest_suite_cten --chay …`
// (DB thử chép từ oneinvest, xoá sau lượt). che-ten-nguon-khong-lay-tu-dau AC-1, AC-3, AC-4, AC-7. Nguồn GIẢ S90 (tên hai
// từ có từ đầu trùng thương hiệu dự án giả «Lumora Park»; tên miền có nhãn đầu là từ chung «market») — không tên nguồn
// thật nào trong tệp; mọi thông điệp chỉ nêu mã. Thứ tự ca có nghĩa (DB trước 112 → áp 112 → sau 112), chạy tuần tự.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import pg from "pg";
import * as pipeLoi from "../lib/mask-source-names.mjs";
import * as appLoi from "../../app/src/lib/mask-source-names.ts";
import { docSourceNameEntries, SQL_SO_CO_CO, SQL_SO_HINH, SQL_SO_KHONG_CO } from "../lib/source-name-entries.mjs";
import { guardValues, tokensFromEntries } from "../lib/tier-a-guard.mjs";
import { FILL, maskedSourceExpr, scanSourceNames } from "../sync-cloud.mjs";
import { captureOpsFacts } from "./capture-ops-facts.mjs";
import { chuoiCam } from "../do-hang-ngay.mjs";
import { chanLo } from "../lib/do-hang-ngay.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const URL_THU = process.env.DATABASE_URL ?? "";
const M112 = readFileSync(path.join(ROOT, "db", "migrations", "112_source_registry_match_whole.sql"), "utf8");
const TEN = "Lumora Thịnh";
const MIEN = "market.lumorathinh.vn";
const DU_AN = "dự án Lumora Park quận 9";
const c = new pg.Client({ connectionString: URL_THU });

const cotSo = async () =>
  (await c.query(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns
                  WHERE table_schema = current_schema() AND table_name = 'source_registry' ORDER BY ordinal_position`)).rows;
// Tập token đọc thẳng bằng câu SELECT riêng của test (không qua hàm nạp) để đối chiếu.
const tokenTruc = async () => (await c.query(
  `SELECT DISTINCT code, x FROM (SELECT code, real_name AS x FROM source_registry UNION ALL
     SELECT code, unnest(source_ids) FROM source_registry) t WHERE x IS NOT NULL AND btrim(x) <> '' ORDER BY 1, 2`)).rows
  .map((r) => `${r.code}|${r.x}`);
const khoa = (es) => [...new Set(es.map((e) => `${e.code}|${e.realName}`))].sort();

before(async () => {
  assert.match(URL_THU, /\/oneinvest_suite_[a-z0-9_]+$/, "chỉ chạy trên DB thử oneinvest_suite_* (bash db/db-thu.sh … --chay)");
  await c.connect();
});
after(async () => { await c.end(); });

test("AC-3 (b) DB chưa áp 112 (thiếu cột): hai bản hàm nạp trả đủ token, mọi cờ false, không ném", async () => {
  assert.equal((await cotSo()).some((r) => r.column_name === "match_whole"), false, "fixture: DB thử phải ở trạng thái trước 112");
  for (const [ten, nap] of [["pipeline", () => docSourceNameEntries(c)], ["app", () => appLoi.docSourceNameEntriesVoi(c)]]) {
    const es = await nap();
    assert.deepEqual(khoa(es), await tokenTruc(), `bản ${ten}: tập token lệch câu SELECT trực tiếp`);
    assert.equal(es.filter((e) => e.wholeOnly).length, 0, `AC-3 thiếu cột phải che thừa (bản ${ten})`);
  }
});

test("AC-3 (b) chiều đỏ: bản sao hàm nạp đặt cờ true khi thiếu cột → đỏ ghim «AC-3 thiếu cột phải che thừa»", async () => {
  const src = readFileSync(path.join(ROOT, "pipeline", "lib", "source-name-entries.mjs"), "utf8");
  const dot = src.replace("false AS match_whole", "true AS match_whole");
  assert.notEqual(dot, src, "khuôn đột biến không khớp hàm nạp");
  const dir = mkdtempSync(path.join(tmpdir(), "cten-nap-"));
  try {
    writeFileSync(path.join(dir, "nap.mjs"), dot);
    const m = await import(pathToFileURL(path.join(dir, "nap.mjs")).href);
    const es = await m.docSourceNameEntries(c);
    assert.throws(() => assert.equal(es.filter((e) => e.wholeOnly).length, 0, "AC-3 thiếu cột phải che thừa"), /AC-3 thiếu cột phải che thừa/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("AC-3 hai bản hàm nạp cùng câu SQL; lỗi khác thiếu bảng/thiếu cột thì ném (không đổi thành rỗng)", async () => {
  assert.equal(appLoi.SQL_SO_CO_CO, SQL_SO_CO_CO);
  assert.equal(appLoi.SQL_SO_KHONG_CO, SQL_SO_KHONG_CO);
  assert.equal(appLoi.SQL_SO_HINH, SQL_SO_HINH);
  const hong = { query: async () => { throw Object.assign(new Error("hỏng"), { code: "XX000" }); } };
  await assert.rejects(() => docSourceNameEntries(hong), /hỏng/);
  await assert.rejects(() => appLoi.docSourceNameEntriesVoi(hong), /hỏng/);
});

test("AC-1 áp 112 hai lần: lần hai không lỗi, lược đồ không đổi; cột boolean NOT NULL DEFAULT false; dòng cũ đều false", async () => {
  await c.query(M112);
  const lan1 = await cotSo();
  await c.query(M112);
  assert.deepEqual(await cotSo(), lan1, "AC-1 112 không chạy lại được (lược đồ đổi ở lần hai)");
  const cot = lan1.find((r) => r.column_name === "match_whole");
  assert.ok(cot, "thiếu cột match_whole");
  assert.equal(cot.data_type, "boolean");
  assert.equal(cot.is_nullable, "NO");
  assert.equal(cot.column_default, "false");
  assert.equal((await c.query("SELECT count(*)::int n FROM source_registry WHERE match_whole")).rows[0].n, 0);
  assert.ok(!FILL.includes("source_registry"), "source_registry không được lên cloud");
});

test("AC-1 chiều đỏ: bản sao 112 bỏ IF NOT EXISTS → lần hai đỏ ghim «AC-1 112 không chạy lại được»", async () => {
  const dot = M112.replace("ADD COLUMN IF NOT EXISTS", "ADD COLUMN");
  assert.notEqual(dot, M112);
  await assert.rejects(async () => {
    try { await c.query(dot); } catch (e) { throw new Error(`AC-1 112 không chạy lại được: ${e.code}`); }
  }, /AC-1 112 không chạy lại được/);
});

test("AC-3 (a) đã áp 112, dòng giả S90 match_whole=true: mỗi token S90 mang cờ true, mọi token khác false (hai bản)", async () => {
  await c.query(`INSERT INTO source_registry (code, label_vi, real_name, source_ids, match_whole, status)
                 VALUES ('S90', 'nguồn giả của test', $1, $2, true, 'retired') ON CONFLICT (code) DO UPDATE SET real_name = $1, source_ids = $2, match_whole = true`,
    [TEN, [MIEN, "s90-lumora"]]);
  for (const [ten, nap] of [["pipeline", () => docSourceNameEntries(c)], ["app", () => appLoi.docSourceNameEntriesVoi(c)]]) {
    const es = await nap();
    assert.deepEqual(khoa(es), await tokenTruc(), `bản ${ten}: tập token lệch câu SELECT trực tiếp`);
    const s90 = es.filter((e) => e.code === "S90");
    assert.equal(s90.length, 3, `bản ${ten}: S90 phải có 3 token`);
    assert.ok(s90.every((e) => e.wholeOnly === true), `bản ${ten}: token S90 phải mang cờ`);
    assert.ok(es.filter((e) => e.code !== "S90").every((e) => e.wholeOnly === false), `bản ${ten}: dòng khác phải cờ false`);
  }
});

// ---- AC-4: ma trận chỗ đọc × ba ca trên DB thử có S90 ----
const datCo = (v) => c.query("UPDATE source_registry SET match_whole = $1 WHERE code = 'S90'", [v]);
const sqlChe = async (tokens, v) => (await c.query(`SELECT ${maskedSourceExpr("v", tokens)} AS r FROM (SELECT $1::text AS v) t`, [v])).rows[0].r;

test("AC-4 sync-cloud: soát + che phía SQL — tên dự án qua khi khai cờ, bị chặn/che khi không; cụm tên và tên miền luôn bị", async () => {
  await datCo(true);
  let tk = tokensFromEntries(await docSourceNameEntries(c));
  assert.equal(scanSourceNames(DU_AN, tk), null, "AC-4 sync-cloud chặn nhầm tên dự án");
  assert.notEqual(await sqlChe(tk, DU_AN), null, "AC-4 sync-cloud che phía SQL đặt NULL tên dự án");
  for (const v of [`ngõ ${TEN} 3`, `tải ${MIEN} xong`]) {
    assert.ok(scanSourceNames(v, tk), "AC-4 sync-cloud bỏ lọt cụm tên/tên miền");
    assert.equal(await sqlChe(tk, v), null, "AC-4 sync-cloud không che cụm tên/tên miền phía SQL");
  }
  await datCo(false);
  tk = tokensFromEntries(await docSourceNameEntries(c));
  assert.ok(scanSourceNames(DU_AN, tk), "đối chứng: không khai cờ thì thương hiệu bị chặn như cũ");
  assert.equal(await sqlChe(tk, DU_AN), null, "đối chứng: không khai cờ thì che phía SQL như cũ");
});

test("AC-4 push-ops-facts THẬT (bộ soát bản tin; ops-local nhận names từ đây): tên dự án gửi được khi khai cờ, cụm tên chặn", async () => {
  const day = (dong) => ({ "airdna-daily.log": `2026-11-18T01:00:00 bắt đầu\n2026-11-18T01:01:00 ${dong}\n` });
  const chay = (dong) => captureOpsFacts({ logs: day(dong), env: { DATABASE_URL: URL_THU } });
  await datCo(true);
  const qua = await chay(DU_AN);
  assert.equal(qua.code, 0, `AC-4 push-ops-facts chặn nhầm tên dự án: ${qua.stderr.slice(0, 300).replace(/Lumora\S*/g, "…")}`);
  assert.equal(qua.posts, 1);
  for (const dong of [`lỗi ${TEN}`, `lỗi ${MIEN}`]) {
    const r = await chay(dong);
    const vet = JSON.stringify(r.payload ?? {});
    assert.ok(r.posts === 0 || !/lumora/i.test(vet), "AC-4 push-ops-facts để lọt cụm tên/tên miền");
  }
  await datCo(false);
  const cu = await chay(DU_AN);
  assert.ok(cu.posts === 0 || !/Lumora Park/.test(JSON.stringify(cu.payload ?? {})), "đối chứng không cờ: thương hiệu bị che/chặn như cũ");
});

test("AC-4 do-hang-ngay (chuỗi cấm từ hàm nạp mang cờ vào bộ soát)", async () => {
  await datCo(true);
  const cam = await chuoiCam(c, [], [], []);
  assert.doesNotThrow(() => chanLo({ nhan: DU_AN }, cam), "AC-4 do-hang-ngay chặn nhầm tên dự án");
  assert.throws(() => chanLo({ nhan: `x ${TEN}` }, cam), /LO TEN NGUON/);
  assert.throws(() => chanLo({ nhan: `x ${MIEN}` }, cam), /LO TEN NGUON/);
  await datCo(false);
  const camCu = await chuoiCam(c, [], [], []);
  assert.throws(() => chanLo({ nhan: DU_AN }, camCu), /LO TEN NGUON/, "đối chứng không cờ");
});

test("AC-4 offers-public, collections-queries, quet-ten-nguon-html (bản app + lõi): tên miền bị bắt, tên dự án qua khi khai cờ", async () => {
  await datCo(true);
  const es = await appLoi.docSourceNameEntriesVoi(c);
  assert.equal(appLoi.findSourceNames(DU_AN, es).length, 0, "AC-4 bản app bắt nhầm tên dự án");
  assert.ok(appLoi.findSourceNames(`người bán ${MIEN}`, es).length >= 1, "AC-4 chỗ đọc rơi token định danh");
  assert.equal(appLoi.maskSourceNames(`cron ${TEN} xong`, es), "cron S90 xong");
  const pe = await docSourceNameEntries(c);
  assert.equal(pipeLoi.findSourceNames(DU_AN, pe).length, 0);
  assert.ok(pipeLoi.findSourceNames(`<td>${MIEN}</td>`, pe).length >= 1);
});

test("AC-4 chiều đỏ: hàm nạp lọc bỏ token định danh → ca tên miền đỏ ghim «AC-4 chỗ đọc rơi token định danh»", async () => {
  await datCo(true);
  // định danh thứ hai (slug) không chứa tên thật: chỉ token định danh bắt được nó
  const chiTen = (await appLoi.docSourceNameEntriesVoi(c)).filter((e) => e.realName === TEN || e.code !== "S90");
  assert.ok(appLoi.findSourceNames("mã s90-lumora", await appLoi.docSourceNameEntriesVoi(c)).length >= 1, "đủ token thì bắt được slug");
  assert.throws(() => assert.ok(appLoi.findSourceNames("mã s90-lumora", chiTen).length >= 1, "AC-4 chỗ đọc rơi token định danh"),
    /AC-4 chỗ đọc rơi token định danh/);
});

test("AC-3 trong một giao dịch đang mở (sync-cloud đọc sổ trong giao dịch), DB thiếu cột: hàm nạp không làm hỏng giao dịch", async () => {
  await c.query("BEGIN");
  try {
    await c.query("ALTER TABLE source_registry DROP COLUMN IF EXISTS match_whole");
    const es = await docSourceNameEntries(c);
    assert.ok(es.length > 0 && es.every((e) => e.wholeOnly === false));
    assert.equal((await c.query("SELECT 1 AS x")).rows[0].x, 1, "AC-3 hàm nạp làm hỏng giao dịch đang mở");
  } finally { await c.query("ROLLBACK"); }
});

test("AC-3 (c) không có bảng source_registry: hai bản hàm nạp trả []", async () => {
  await c.query("CREATE SCHEMA IF NOT EXISTS cten_rong");
  const r = new pg.Client({ connectionString: URL_THU, options: "-c search_path=cten_rong" });
  await r.connect();
  try {
    assert.deepEqual(await docSourceNameEntries(r), []);
    assert.deepEqual(await appLoi.docSourceNameEntriesVoi(r), []);
    assert.equal(guardValues(["x"], []).length, 0);
  } finally { await r.end(); }
});

test("AC-7 sao lưu rồi khôi phục dòng S16 trên DB thử: về đúng bản sao lưu, cờ về false, kể cả khi S16 đã có đơn vị thu", async () => {
  const AP = path.join(ROOT, "_acceptance", "che-ten-nguon-khong-lay-tu-dau", "ap-may-thu");
  const home = mkdtempSync(path.join(tmpdir(), "cten-sao-luu-"));
  const env = { ...process.env, HOME: home, DB_AP: new URL(URL_THU).pathname.slice(1) };
  const dong = async () => JSON.stringify((await c.query(`SELECT to_jsonb(s) - 'match_whole' AS j, match_whole FROM source_registry s WHERE code = 'S16'`)).rows);
  try {
    const truoc = await dong();
    const ra = execFileSync("bash", [path.join(AP, "sao-luu.sh")], { env, encoding: "utf8" });
    const tep = ra.match(/đã sao lưu: (\S+)/)?.[1];
    assert.ok(tep, "sao-luu.sh không báo tệp sao lưu");
    // Đơn vị thu con: khoá ngoại tới source_registry làm cách xoá rồi chèn lại hỏng (ghim lý do dùng UPDATE).
    // Mã đơn vị do trigger cấp và ràng buộc mã chỉ nhận S0x, nên tắt trigger người dùng + bỏ kiểm mã trong phạm vi DB thử này.
    await c.query(`ALTER TABLE collection_units DISABLE TRIGGER USER`);
    await c.query(`ALTER TABLE collection_units DROP CONSTRAINT collection_units_unit_code_chk`);
    await c.query(`INSERT INTO collection_units (source_code, group_key, name, unit_code, unit_type, status, enabled)
                   VALUES ('S16', 'cten-thu', 'thu', 'S16-N999', 'nhom', 'draft', false)`);
    await c.query(`UPDATE source_registry SET real_name = $1, source_ids = $2, match_whole = true WHERE code = 'S16'`, [TEN, [MIEN]]);
    assert.ok((await dong()) !== truoc, "bước đổi dòng S16 của ca không có tác dụng");
    execFileSync("bash", [path.join(AP, "khoi-phuc-s16.sh"), tep], { env, encoding: "utf8" });
    assert.ok((await dong()) === truoc, "AC-7 khôi phục: dòng S16 không về đúng bản sao lưu"); // so bằng boolean để lỗi không in giá trị
  } finally {
    await c.query(`DELETE FROM collection_units WHERE source_code = 'S16' AND group_key = 'cten-thu'`);
    rmSync(home, { recursive: true, force: true });
  }
});

test("AC-7 tệp lùi: chạy thật trên DB thử — cột mất, áp lại 112 được", async () => {
  const lui = readFileSync(path.join(ROOT, "_acceptance", "che-ten-nguon-khong-lay-tu-dau", "ap-may-thu", "lui-cot.sql"), "utf8");
  await c.query(lui);
  assert.equal((await cotSo()).some((r) => r.column_name === "match_whole"), false, "tệp lùi không bỏ cột");
  await c.query(M112);
  assert.equal((await cotSo()).some((r) => r.column_name === "match_whole"), true, "áp lại 112 không được");
});
