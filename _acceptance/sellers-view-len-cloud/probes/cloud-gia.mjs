// cloud-gia.mjs — hồ sơ sellers-view-len-cloud. DB thử chép máy thu (sellers là view sau 060) đứng vai cloud; mọi bước trong
// BEGIN … ROLLBACK, không chạm Supabase.
//   cloud (mặc định): E2 (AC-2) — syncOnce thật dừng ở pha catalog gọi tên sellers; dựng sellers bằng DDL 022 → không bảng
//     FILL nào bị chặn; chèn kiểu tráo vào view lỗi. E7 (AC-7) — đọc view bằng localReadSql thật, nạp sync_stage, chạy
//     buildSwapSql thật cho sellers trên bảng DDL 022: đủ dòng, khoá duy nhất; trùng khoá → TRAO TRUNG KHOA.
//   doc: E3 (AC-3) — câu đọc thật lấy đúng CLOUD_ALLOW.sellers, không name, đủ dòng; đối chứng NAME LEN CLOUD.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg");
const S = await import(path.join(ROOT, "pipeline/sync-cloud.mjs"));
const DB_URL = process.env.DB_URL;
assert.match(DB_URL ?? "", /\/oneinvest_p4_svc$/, "chỉ chạy trên DB thử oneinvest_p4_svc");
const MODE = process.argv[2] ?? "cloud";

const c = new pg.Client({ connectionString: DB_URL, types: S.localTypes });
await c.connect();
const rows = async (sql, v) => (await c.query(sql, v)).rows;
const exec = (sql) => rows(sql);
/** Một bước trong SAVEPOINT; trả lỗi (hoặc null) rồi lùi về điểm lưu. */
async function thu(ten, fn) {
  await c.query(`SAVEPOINT ${ten}`);
  try {
    await fn();
    return null;
  } catch (e) {
    return e;
  } finally {
    await c.query(`ROLLBACK TO SAVEPOINT ${ten}`);
  }
}

// DDL cloud thật của sellers: câu CREATE TABLE của 022, rút nguyên văn (không viết tay).
const DDL_022 = readFileSync(path.join(ROOT, "db/migrations/022_chotot_source.sql"), "utf8").match(
  /CREATE TABLE IF NOT EXISTS sellers \([\s\S]*?\n\);/,
)?.[0];
assert.ok(DDL_022, "không rút được CREATE TABLE sellers từ 022");
const SQL_038 = readFileSync(path.join(ROOT, "db/migrations/038_sync_stage.sql"), "utf8");
/** sellers về hình cloud: bỏ view, dựng bảng theo 022 (gỡ view phụ thuộc trước). */
const sellersThanhBang = async () => {
  await c.query("DROP VIEW sellers CASCADE");
  await c.query(DDL_022);
};
const cotView = async (t) =>
  (await rows(`SELECT column_name AS c FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position`, [t])).map((r) => r.c);

try {
  await c.query("BEGIN");
  assert.equal((await rows("SELECT relkind FROM pg_class WHERE oid = to_regclass('public.sellers')"))[0]?.relkind, "v",
    "DB thử: sellers không phải view — chưa qua 060");

  if (MODE === "doc") {
    const cols = await cotView("sellers");
    const { sql, cols: len } = S.selectList("sellers", cols);
    assert.deepEqual([...len].sort(), [...S.CLOUD_ALLOW.sellers].sort(), "cột đọc khác CLOUD_ALLOW.sellers");
    assert.ok(!len.includes("name"), "NAME LEN CLOUD");
    const doc = await rows(S.localReadSql("sellers", sql));
    const [{ n }] = await rows("SELECT count(*)::int AS n FROM sellers");
    assert.equal(doc.length, n, "câu đọc thật thiếu dòng so với view");
    // Đối chứng đỏ: danh sách cho phép mở name và danh sách loại bỏ name → bộ kiểm trên bắt.
    const allow = S.CLOUD_ALLOW.sellers, pii = S.PII_EXCLUDE.sellers ?? [];
    S.CLOUD_ALLOW.sellers = [...allow, "name"];
    if (S.PII_EXCLUDE.sellers) S.PII_EXCLUDE.sellers = pii.filter((x) => x !== "name");
    const lot = S.selectList("sellers", cols).cols;
    S.CLOUD_ALLOW.sellers = allow;
    if (S.PII_EXCLUDE.sellers) S.PII_EXCLUDE.sellers = pii;
    assert.throws(() => assert.ok(!lot.includes("name"), "NAME LEN CLOUD"), /NAME LEN CLOUD/, "đối chứng NAME LEN CLOUD không bắt");
    console.log(`# đọc view sellers: ${doc.length} dòng, cột ${len.join(",")}`);
    console.log("DOC LOCAL OK");
  } else {
    // E7 nguồn: đọc view máy thu bằng câu đọc thật TRƯỚC khi đổi hình gì.
    const { sql: list, cols: gui } = S.selectList("sellers", await cotView("sellers"));
    const docRows = (await rows(S.localReadSql("sellers", list))).map((r) => r.j);
    const n = docRows.length;
    assert.ok(n > 0, "view sellers rỗng — phép tráo không đo được gì");
    const defSellers = (await rows("SELECT pg_get_viewdef('public.sellers') AS d"))[0].d;

    // Hình cloud cho hai bảng 044 làm thành view ở máy thu (cloud giữ bảng — catch-up 044): bảng bản ghi về tên cũ; view
    // sellers (đọc sale_offers và view thước) dựng lại nguyên định nghĩa. Thêm sync_stage của 038.
    for (const [v, ban] of [["sale_offers", "sale_offer_records"], ["listings", "listing_records"]]) {
      if ((await rows("SELECT relkind FROM pg_class WHERE oid = to_regclass($1)", [`public.${v}`]))[0]?.relkind === "v") {
        await c.query(`DROP VIEW ${v} CASCADE`);
        await c.query(`ALTER TABLE ${ban} RENAME TO ${v}`);
      }
    }
    // CASCADE gỡ cả hai view thước (sellers đọc chúng) — dựng lại đúng như 034 trước view sellers.
    await c.query(readFileSync(path.join(ROOT, "db/migrations/034_ruler_p2_views.sql"), "utf8"));
    // Định nghĩa chụp trước khi đổi tên còn gọi bảng bản ghi bằng tên cũ — trỏ về tên mới (cùng một bảng).
    const defMoi = defSellers.replace(/\bsale_offer_records\b/g, "sale_offers").replace(/\blisting_records\b/g, "listings");
    await c.query(`CREATE OR REPLACE VIEW sellers AS ${defMoi}`);
    await c.query(SQL_038);
    const ten = S.FILL.map(S.RENAME);

    // E2a — syncOnce thật: sellers là view → dừng ở pha catalog, gọi tên sellers, trỏ tệp catch-up; không câu ghi staging.
    const goi = [];
    const err = await thu("e2a", () => S.syncOnce({ local: null, exec: (q) => (goi.push(q), exec(q)), log: () => {} }));
    assert.ok(err, "syncOnce không dừng khi sellers là view");
    assert.equal(err.phase, "catalog", `dừng sai pha: ${err.phase} ${err.message}`);
    assert.match(err.message, /sellers \(v\)/, `thông điệp không gọi tên sellers: ${err.message}`);
    assert.ok(err.message.includes(S.CATCHUP_060), "thông điệp không trỏ tệp catch-up 060");
    assert.deepEqual(S.dichKhongPhaiBang(await exec(S.kieuBangSql(ten))), ["sellers"], "bảng khác ngoài sellers bị chặn");
    assert.equal(goi.filter((q) => /INSERT INTO sync_stage\.rows/i.test(q)).length, 0, "đã ghi staging trước khi chặn");
    console.log(`# E2a: ${err.message}`);

    // E2b — sellers dựng bằng DDL 022 → không bảng FILL nào bị chặn (đối chứng dương).
    const e2b = await thu("e2b", async () => {
      await sellersThanhBang();
      const kieu = await exec(S.kieuBangSql(ten));
      assert.deepEqual(S.dichKhongPhaiBang(kieu), [], `chặn oan: ${S.dichKhongPhaiBang(kieu)}`);
      console.log(`# E2b: ${kieu.length} bảng FILL có trên DB thử, 0 bị chặn`);
    });
    assert.equal(e2b, null, `E2b: ${e2b?.message}`);

    // E2c — lỗi có thật mà chốt chặn trước: chèn kiểu tráo vào view sellers.
    const e2c = await thu("e2c", () =>
      c.query(`INSERT INTO public.sellers (phone_hash) SELECT r.phone_hash
        FROM jsonb_populate_record(NULL::public.sellers, '{"phone_hash":"x"}'::jsonb) r`));
    assert.ok(e2c, "chèn vào view sellers không lỗi — chốt chặn một lỗi không có");
    console.log(`# E2c: chèn vào view lỗi: ${e2c.message.split("\n")[0]}`);
    console.log("CLOUD GIA OK");

    // E7 — tráo thật trên bảng DDL 022.
    const cot = gui.filter((x) => S.CLOUD_ALLOW.sellers.includes(x));
    const trao = async (dong, dem) => {
      await sellersThanhBang();
      const runId = "svc_e7";
      const tag = S.dollarTag(runId);
      for (const json of S.chunkRows(dong, S.CHUNK_BYTES)) await c.query(S.stageInsertSql(runId, "sellers", json, tag));
      const plan = S.planTables({ fill: ["sellers"], fks: [], pks: { sellers: ["phone_hash"] } });
      const sql = S.buildSwapSql({ runId, readAt: new Date().toISOString(), plan, counts: { sellers: dem }, columns: { sellers: cot } });
      await c.query(sql.replace(/^BEGIN;$/m, "").replace(/^COMMIT;$/m, ""));
      return rows("SELECT count(*)::int AS n, count(DISTINCT phone_hash)::int AS k FROM public.sellers");
    };
    const e7 = await thu("e7", async () => {
      const [{ n: sau, k }] = await trao(docRows, n);
      assert.equal(sau, n, `tráo xong ${sau} dòng ≠ view ${n}`);
      assert.equal(k, n, `khoá phone_hash trùng: ${k} khác nhau / ${n}`);
      console.log(`# E7: tráo thật ${sau} dòng, ${k} khoá khác nhau, cột ${cot.join(",")}`);
    });
    assert.equal(e7, null, `E7: ${e7?.message}`);
    // Đối chứng đỏ: một dòng trùng khoá trong staging → lượt tráo lỗi.
    const trung = await thu("e7do", () => trao([...docRows, docRows[0]], n + 1));
    assert.ok(trung && /duplicate key|trùng/i.test(trung.message), `TRAO TRUNG KHOA không bắt: ${trung?.message}`);
    console.log(`# E7 đối chứng: ${trung.message.split("\n")[0]}`);
    console.log("TRAO THAT OK");
  }
} finally {
  await c.query("ROLLBACK").catch(() => {});
  await c.end();
}
