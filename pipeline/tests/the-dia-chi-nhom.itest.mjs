// the-dia-chi-nhom.itest.mjs — hồ sơ the-dia-chi-nhom-s03 (TG1) E1 · AC-1, E3 · AC-3 và phần gạt bài thử của AC-7, chạy trên DB của riêng lượt
// (db/db-thu.sh oneinvest_suite_tg1 --chay). Mỗi ca trong BEGIN … ROLLBACK; 108 áp trong giao dịch.
import { strict as assert } from "node:assert";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { test, before, after } from "node:test";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { docDuLieu, dungTheoNhom, ghiNhap } from "../scripts/the-dia-chi-nhom.mjs";
import { TEST_POST_SQL_T } from "../scripts/test-data-residue.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("the-dia-chi-nhom.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*, không chạy trên oneinvest");
}
const GOC = join(import.meta.dirname, "..", "..");
const MIG = readFileSync(join(GOC, "db/migrations/108_the_dia_chi_nhom.sql"), "utf8");
const SCRIPT = join(GOC, "pipeline/scripts/the-dia-chi-nhom.mjs");

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c?.end(); });
const trongGiaoDich = async (fn) => { await c.query("BEGIN"); try { await fn(); } finally { await c.query("ROLLBACK"); } };
const mot = async (sql, p = []) => (await c.query(sql, p)).rows[0];

const dauLuocDo = async () => (await c.query(`
  SELECT string_agg(table_name || '.' || column_name || ':' || data_type, ',' ORDER BY table_name, ordinal_position) AS cot,
         (SELECT pg_get_functiondef('group_address_cards_kiem()'::regprocedure)) AS ham
    FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('group_address_cards', 'group_address_card_history')`)).rows[0];

test("TG1-AC-1 migration 108: áp hai lần, lược đồ không đổi, trigger chặn tham chiếu sai, không vào sync-cloud", async () => {
  await trongGiaoDich(async () => {
    await c.query(MIG);
    const lan1 = await dauLuocDo();
    await c.query(MIG);
    assert.deepEqual(await dauLuocDo(), lan1, "TG1-AC-1: lần hai đổi lược đồ");
    assert.ok(lan1.cot.includes("group_address_cards.project_node_ids") && lan1.cot.includes("group_address_card_history.before"));
    const nut = async (loai) => Number((await mot(`SELECT id FROM asset_nodes WHERE node_type = $1 ORDER BY id LIMIT 1`, [loai])).id);
    const pk = await nut("subzone"), da = await nut("project");
    const thi = (await mot(`SELECT id FROM areas WHERE region_type = 'market' ORDER BY id LIMIT 1`)).id;
    const sai = async (cot, gt, o) => {
      await c.query("SAVEPOINT s");
      await assert.rejects(c.query(`INSERT INTO group_address_cards (group_key, ${cot}) VALUES ('tg1-kiem', $1)`, [gt]),
        new RegExp(`o ${o}`), `TG1-AC-1: ${cot} sai không bị chặn (o ${o})`);
      await c.query("ROLLBACK TO SAVEPOINT s");
    };
    await sai("project_node_ids", [pk], "du_an");
    await sai("subzone_node_id", da, "phan_khu");
    await sai("area_id", thi, "phuong");
    await c.query("SAVEPOINT s");
    await assert.rejects(c.query(`INSERT INTO group_address_cards (group_key, project_node_ids) VALUES ('tg1-kiem', $1)`, [[da, da, da, da]]),
      /du_an_chk/, "TG1-AC-1: 4 dự án không bị chặn");
    await c.query("ROLLBACK TO SAVEPOINT s");
    const ok = await mot(`INSERT INTO group_address_cards (group_key, project_node_ids) VALUES ('tg1-kiem', $1) RETURNING card_code`, [[da]]);
    assert.match(ok.card_code, /^TN-\d{3,}$/);
    // Đối chứng đỏ: bản sao 108 bỏ kiểm loại nút dự án → dự án là phân khu lọt qua.
    const pha = MIG.replace("AND n.node_type = 'project') LIMIT 1", ") LIMIT 1");
    assert.notEqual(pha, MIG, "kiem-du-an: không phá được 108");
    await c.query(pha);
    await c.query("SAVEPOINT s");
    let lot = true;
    try { await c.query(`INSERT INTO group_address_cards (group_key, project_node_ids) VALUES ('tg1-pha', $1)`, [[pk]]); }
    catch { lot = false; }
    await c.query("ROLLBACK TO SAVEPOINT s");
    assert.equal(lot, true, "kiem-du-an: bản bỏ kiểm loại nút vẫn chặn — ca không phân biệt được");
  });
  const sync = readFileSync(join(GOC, "pipeline/sync-cloud.mjs"), "utf8");
  assert.ok(!/group_address_card/.test(sync), "TG1-AC-1: sync-cloud nhắc bảng thẻ");
});

/** Fixture năm lớp nhóm; trả khoá thật của từng lớp. Bài, nhãn, sổ đúng ràng buộc bảng thật. */
async function fixture() {
  const T = `tg1fx${process.pid}`;
  // Snapshot mượn phải KHÔNG mang dấu thử — nếu không mọi bài của fixture bị gạt và ca mất nghĩa.
  const { rows: [snap] } = await c.query(`SELECT snapshot_id FROM stg_zalo_posts t WHERE NOT (${TEST_POST_SQL_T}) LIMIT 1`);
  assert.ok(snap?.snapshot_id, "fixture: DB thử không có snapshot thật nào để mượn");
  const phuong = (await mot(`SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1`)).id;
  const nut = async (s) => Number((await mot(`INSERT INTO asset_nodes (node_type, name, slug, area_ids) VALUES ('project', $1, $1, $2) RETURNING id`,
    [`${T}-${s}`, [phuong]])).id);
  const A = await nut("a"), B = await nut("b");
  const so = async (khoa, duAn = []) => c.query(`INSERT INTO collection_units (source_code, group_key, name, project_node_ids, status, enabled)
                                                 VALUES ('S03', $1, $1, $2, 'active', true)`, [khoa, duAn]);
  let dem = 0;
  const bai = async (khoa, n, nhan, { thu = false } = {}) => {
    for (let i = 0; i < n; i++) {
      const pid = `${T}-p${++dem}`;
      await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, conversation_id, group_name, captured_at)
                     VALUES ($1, $2, 'bài thử', $3, $4, now())`,
        [pid, snap.snapshot_id, khoa, thu ? "TEST-G1" : null]);
      if (nhan) await c.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind,
                                 probabilities, json_ok, run_id, labeled_at)
                               VALUES ('S03', $1, 'h', 'thu', 'thu', 'offer', $2, $3, true, 'tg1', now())`,
        [pid, nhan.kind, { o: { project: { v: nhan.project ?? "", cc: "chu_bai" } } }]);
    }
  };
  const k = { mot: `${T}-mot`, chua: `${T}-chua`, nhieu: `${T}-nhieu`, ngoai: `${T}-ngoai`, khongBai: `${T}-khong`, hai: `${T}-hai`,
              thu: `${T}-thu` };
  await so(k.mot, [A]); await bai(k.mot, 6, { kind: "sale" });
  // Bài thử: nhóm toàn bài thử (có trong sổ) và hai bài thử lẫn trong một nhóm thật.
  await so(k.thu); await bai(k.thu, 3, { kind: "sale" }, { thu: true });
  await bai(k.mot, 2, { kind: "sale" }, { thu: true });
  await so(k.chua); await bai(`group:${k.chua}`, 8, { kind: "rent_lt", project: `${T}-a` });
  await so(k.nhieu, [A, B]); await bai(k.nhieu, 5, { kind: "sale", project: `${T}-b` });
  await bai(k.ngoai, 3, null);
  await so(k.khongBai);
  await so(k.hai); await so(`zalo:group:${k.hai}`); await bai(k.hai, 4, { kind: "sale" });
  return { k, A, B };
}

const bamBang = async (bang) => (await mot(`SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t::text), '')) AS h FROM ${bang} t`)).h;
const theCua = async (khoa) => (await c.query(`SELECT * FROM group_address_cards WHERE group_key = $1`, [khoa])).rows;
async function chay(ham = { docDuLieu, dungTheoNhom, ghiNhap }) {
  return ham.ghiNhap(c, ham.dungTheoNhom(await ham.docDuLieu(c)));
}

test("TG1-AC-3 lệnh dựng nháp: một thẻ mỗi nhóm thật có bài, chạy lại không đổi, giữ thẻ đã quyết, không chạm bảng khác", { timeout: 600_000 }, async () => {
  await trongGiaoDich(async () => {
    await c.query(MIG);
    const { k, A } = await fixture();
    const truoc = { so: await bamBang("collection_units"), fa: await bamBang("field_assertions"), tin: await bamBang("sale_offer_records") };
    await chay();
    for (const ten of ["mot", "chua", "nhieu", "ngoai", "hai"]) {
      const t = await theCua(k[ten]);
      assert.equal(t.length, 1, `TG1-AC-3: nhóm «${ten}» phải có đúng một thẻ`);
      assert.equal(t[0].status, "nhap", `TG1-AC-3: thẻ «${ten}» phải là nháp`);
    }
    assert.equal((await theCua(k.khongBai)).length, 0, "TG1-AC-3: nhóm không bài có thẻ");
    assert.equal((await theCua(k.ngoai))[0].unit_code, null, "TG1-AC-3: nhóm chưa có trong sổ phải có unit_code NULL");
    assert.deepEqual((await theCua(k.mot))[0].project_node_ids.map(Number), [A], "TG1-AC-3: nhóm sổ một dự án");
    assert.deepEqual((await theCua(k.chua))[0].project_node_ids.map(Number), [A], "TG1-AC-3: nhóm chưa ghi lấy dự án từ nhãn");
    assert.equal((await theCua(k.chua))[0].purpose, "thue");
    const ls = await mot(`SELECT count(*)::int n FROM group_address_card_history WHERE card_code = $1 AND action = 'dung_nhap'`, [(await theCua(k.mot))[0].card_code]);
    assert.equal(ls.n, 1, "TG1-AC-3: mỗi thẻ một dòng lịch sử dung_nhap");

    // Đặt trước một thẻ đã duyệt và một thẻ đã bác.
    await c.query(`UPDATE group_address_cards SET status = 'da_duyet', purpose = 'ca_hai' WHERE group_key = $1`, [k.mot]);
    await c.query(`UPDATE group_address_cards SET status = 'bac', decision_note = 'thử' WHERE group_key = $1`, [k.nhieu]);
    const the1 = await bamBang("group_address_cards"), ls1 = await bamBang("group_address_card_history");
    await chay();
    assert.equal(await bamBang("group_address_cards"), the1, "TG1-AC-3: lần hai đổi thẻ");
    assert.equal(await bamBang("group_address_card_history"), ls1, "TG1-AC-3: lần hai thêm lịch sử");
    assert.deepEqual({ so: await bamBang("collection_units"), fa: await bamBang("field_assertions"), tin: await bamBang("sale_offer_records") },
      truoc, "TG1-AC-3: lệnh chạm sổ, phát biểu hay tin");

    // Đối chứng đỏ: bản sao lệnh bỏ điều kiện giữ thẻ đã quyết → thẻ đã duyệt bị đổi.
    const goc = readFileSync(SCRIPT, "utf8");
    const pha = goc.replace(`if (r && r.status !== "nhap") { dem.giu_da_quyet++; continue; }`, "")
      .replace(`WHERE group_key = $1 AND status = 'nhap' RETURNING *`, `WHERE group_key = $1 RETURNING *`)
      .replace("if (r && r.evidence_hash === h)", "if (false)");
    assert.notEqual(pha, goc, "giu-da-duyet: không phá được lệnh");
    const tep = join(GOC, "pipeline/scripts", `.tg1-pha-${process.pid}.mjs`);
    writeFileSync(tep, pha);
    try {
      await chay(await import(pathToFileURL(tep).href));
    } finally { rmSync(tep, { force: true }); }
    assert.notEqual((await theCua(k.mot))[0].purpose, "ca_hai", "giu-da-duyet: bản bỏ điều kiện vẫn giữ thẻ đã duyệt — ca không phân biệt được");
  });
});

test("TG1-AC-7 lệnh dựng nháp gạt bài thử: nhóm toàn bài thử không có thẻ, số bài căn cứ không cộng bài thử", { timeout: 600_000 }, async () => {
  await trongGiaoDich(async () => {
    await c.query(MIG);
    const { k } = await fixture();
    await chay();
    assert.equal((await theCua(k.thu)).length, 0, "TG1-AC-7: nhóm toàn bài thử không được có thẻ");
    const t = (await theCua(k.mot))[0];
    assert.equal(t.evidence.so_bai, 6, "TG1-AC-7: số bài căn cứ của nhóm thật cộng cả bài thử");

    // Đối chứng đỏ: bản sao lệnh đọc thẳng stg_zalo_posts (không qua loadStgPosts) → nhóm toàn bài thử có thẻ.
    const goc = readFileSync(SCRIPT, "utf8");
    const pha = goc.replace('const { posts, rejected } = await loadStgPosts(client, "zalo");',
      'const { rows: posts } = await client.query(`SELECT DISTINCT ON (post_id) post_id, conversation_id FROM stg_zalo_posts'
      + ' WHERE conversation_id IS NOT NULL ORDER BY post_id, captured_at DESC NULLS LAST`); const rejected = { total: 0 };');
    assert.notEqual(pha, goc, "bai-thu: không phá được lệnh");
    const tep = join(GOC, "pipeline/scripts", `.tg1-pha-bai-thu-${process.pid}.mjs`);
    writeFileSync(tep, pha);
    try {
      await chay(await import(pathToFileURL(tep).href));
    } finally { rmSync(tep, { force: true }); }
    assert.equal((await theCua(k.thu)).length, 1, "bai-thu: bản đọc thẳng stg vẫn không dựng thẻ cho nhóm toàn bài thử — ca không phân biệt được");
  });
});
