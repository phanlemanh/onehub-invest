// the-dia-chi-nhom-lui.itest.mjs — hồ sơ the-dia-chi-nhom-s03 (TG1) E9 · AC-9: thư mục ap-may-thu/ đủ năm thứ, và tệp lùi 108
// chạy thật trên DB của riêng lượt (db/db-thu.sh oneinvest_suite_tg1l --chay). Mỗi ca trong BEGIN … ROLLBACK.
import { strict as assert } from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test, before, after } from "node:test";

import pg from "pg";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("the-dia-chi-nhom-lui.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*, không chạy trên oneinvest");
}
const GOC = join(import.meta.dirname, "..", "..");
const AP = join(GOC, "_acceptance/the-dia-chi-nhom-s03/ap-may-thu");
const MIG = readFileSync(join(GOC, "db/migrations/108_the_dia_chi_nhom.sql"), "utf8");
const LUI = readFileSync(join(AP, "108-lui.sql"), "utf8");
const KIEM = readFileSync(join(AP, "kiem-sau.sql"), "utf8");

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c?.end(); });
const trongGiaoDich = async (fn) => { await c.query("BEGIN"); try { await fn(); } finally { await c.query("ROLLBACK"); } };
const coBang = async () => (await c.query(`SELECT to_regclass('group_address_cards') IS NOT NULL a, to_regclass('group_address_card_history') IS NOT NULL b`)).rows[0];

test("TG1-AC-9a ap-may-thu có đủ năm tệp, README nêu bốn tệp kia theo thứ tự, sao lưu ra ngoài cây kho, lùi không CASCADE", () => {
  const tep = readdirSync(AP).sort();
  assert.deepEqual(tep, ["108-lui.sql", "README.md", "kiem-sau.sql", "sao-luu.sh", "so-chay-thu.md"], "TG1-AC-9a: năm tệp");
  const readme = readFileSync(join(AP, "README.md"), "utf8");
  const vt = ["sao-luu.sh", "so-chay-thu.md", "108-lui.sql", "kiem-sau.sql"].map((t) => readme.indexOf(t));
  assert.ok(vt.every((i) => i >= 0), "TG1-AC-9a: README thiếu một tệp");
  const buoc = ["1. **Sao lưu", "3. **Số chạy thử", "4. **Lùi", "5. **Kiểm sau"].map((t) => readme.indexOf(t));
  assert.ok(buoc.every((i, k) => i >= 0 && (k === 0 || i > buoc[k - 1])), "TG1-AC-9a: README không theo thứ tự bước");
  const sl = readFileSync(join(AP, "sao-luu.sh"), "utf8");
  assert.match(sl, /DICH="\$\{HOME\}\/onehub-backups\/db"/, "sao-luu.sh: đích phải là ~/onehub-backups/db");
  assert.match(sl, /\[ -s "\$TEP" \]/, "sao-luu.sh: thiếu kiểm tệp khác rỗng");
  assert.match(sl, /pg_dump/, "sao-luu.sh: thiếu pg_dump");
  assert.ok(!/CASCADE/i.test(LUI.replace(/--.*$/gm, "")), "108-lui.sql: không được CASCADE");
});

test("TG1-AC-9b tệp lùi chạy thật: hai bảng mất, áp lại 108 được, kiem-sau chạy và in số thẻ", { timeout: 300_000 }, async () => {
  await trongGiaoDich(async () => {
    await c.query(MIG);
    const { rows: [the] } = await c.query(`INSERT INTO group_address_cards (group_key, purpose, evidence) VALUES ('tg1lui-khoa', 'ban', '{}') RETURNING card_code`);
    assert.match(the.card_code, /^TN-\d{3,}$/);
    await c.query(LUI);
    assert.deepEqual(await coBang(), { a: false, b: false }, "TG1-AC-9b: còn bảng sau lùi");
    assert.equal((await c.query(`SELECT to_regclass('group_address_card_seq') IS NULL v`)).rows[0].v, true, "TG1-AC-9b: còn sequence");
    assert.equal((await c.query(`SELECT count(*)::int n FROM pg_proc WHERE proname = 'group_address_cards_kiem'`)).rows[0].n, 0, "TG1-AC-9b: còn hàm kiểm");
    await c.query(MIG);
    assert.deepEqual(await coBang(), { a: true, b: true }, "TG1-AC-9b: áp lại 108 sau lùi hỏng");
    await c.query(`INSERT INTO group_address_cards (group_key, purpose, evidence) VALUES ('tg1lui-khoa-2', 'thue', '{}')`);
    // kiem-sau.sql: bỏ lệnh meta của psql, chạy từng câu; câu số thẻ phải in đúng một thẻ vừa dựng.
    const cau = KIEM.split("\n").filter((l) => !l.startsWith("\\")).join("\n").split(";").map((s) => s.trim()).filter((s) => s && !/^--/.test(s.replace(/^(--.*\n)+/, "")));
    let soThe = null;
    for (const s of cau) {
      const r = await c.query(s);
      if (r.fields.some((f) => f.name === "so_the") && r.fields.some((f) => f.name === "nhom_co_bai")) soThe = Number(r.rows[0].so_the);
    }
    assert.equal(soThe, 1, "TG1-AC-9b: kiem-sau.sql không in đúng số thẻ");
  });
});

test("TG1-AC-9c đối tượng khác dựa trên bảng thẻ thì lùi lỗi cả khối, không đổi gì", { timeout: 300_000 }, async () => {
  await trongGiaoDich(async () => {
    await c.query(MIG);
    await c.query(`CREATE VIEW tg1_phu_thuoc AS SELECT card_code FROM group_address_cards`);
    await c.query("SAVEPOINT l");
    await assert.rejects(c.query(LUI), /depend|phụ thuộc/i, "TG1-AC-9c: lùi phải lỗi khi có view phụ thuộc");
    await c.query("ROLLBACK TO SAVEPOINT l");
    assert.deepEqual(await coBang(), { a: true, b: true }, "TG1-AC-9c: lùi lỗi mà vẫn mất bảng");
  });
});
