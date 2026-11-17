// dong-dau-dia-chi.itest.mjs — hồ sơ dong-dau-dia-chi-luc-nap (TG2) Task 4: lượt nạp thật đóng dấu thẻ lên tin.
// DB của riêng lượt (db/db-thu.sh oneinvest_suite_tg2 --chay) — bản chép máy thu, đã áp 108 + 109. Mỗi ca trong BEGIN … ROLLBACK:
// xoá bài sẵn có trong giao dịch rồi chỉ cấy bài mồi viết tay, nên lượt nạp chạy trên đúng ma trận của ca.
// Phục vụ E4 (AC-3 cross-layer), E5 (AC-4), E6 (AC-5), E7 (AC-6), E9 (AC-7), E11 (AC-9), Review Focus 2 và 6, nối AC-11.
import { strict as assert } from "node:assert";
import { test, before, after } from "node:test";

import pg from "pg";

import { runTransformZalo } from "../transform-zalo.mjs";
import { docNhanDuAn, docTheDaDuyet, phatBieuDiaChiNhom, RULE_ID } from "../lib/dia-chi-the-nhom.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("dong-dau-dia-chi.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*, không chạy trên oneinvest");
}
const SNAP = "hanoi__zalo-agent__2099-11-17T000000";
const SNAP_THU = "hanoi__example__2099-11-17T000000";

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c?.end(); });
const mot = async (sql, p = []) => (await c.query(sql, p)).rows[0];
const nhieu = async (sql, p = []) => (await c.query(sql, p)).rows;

/** Một ca: giao dịch riêng, kho bài rỗng, hai snapshot mồi; lùi hết khi xong. */
async function ca(fn) {
  await c.query("BEGIN");
  try {
    await c.query("DELETE FROM stg_zalo_posts");
    for (const s of [SNAP, SNAP_THU]) {
      await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}')
                     ON CONFLICT (snapshot_id) DO NOTHING`, [s]);
    }
    const nut = (await nhieu(`SELECT id::text AS id, name FROM asset_nodes WHERE node_type = 'project' ORDER BY id LIMIT 2`));
    const f = {
      duAn1: nut[0].id, ten1: nut[0].name, duAn2: nut[1].id, ten2: nut[1].name,
      phanKhu: (await mot(`SELECT id::text AS id FROM asset_nodes WHERE node_type IN ('subzone', 'building') ORDER BY id LIMIT 1`)).id,
      phuong1: (await mot(`SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1`)).id,
      phuong2: (await mot(`SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id OFFSET 1 LIMIT 1`)).id,
    };
    await fn(f);
  } finally {
    await c.query("ROLLBACK");
  }
}

/** Lượt nạp im lặng; trả kết quả và mọi dòng console.warn. */
async function nap(opts) {
  const log = console.log, warn = console.warn, canhBao = [];
  console.log = () => {};
  console.warn = (...a) => canhBao.push(a.join(" "));
  try { return { kq: await runTransformZalo(c, opts), canhBao }; } finally { console.log = log; console.warn = warn; }
}

let so = 0;
/** Cấy bài; mỗi bài một giá khác nhau nên thành một tin riêng. */
async function bai(nhom, text, { snap = SNAP, agent = "openclaw-hook", tenNhom = "Nhóm mồi TG2" } = {}) {
  so++;
  const post_id = `t_tg2_${process.pid}_${so}`;
  await c.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at)
     VALUES ($1, $2, $3, $4, $5, $6, '2026-11-10T08:00:00Z')`,
    [post_id, snap, agent, tenNhom, nhom, text.replaceAll("{n}", String(60 + so))]);
  return post_id;
}
const BAN = "Bán căn 2PN {n}m2 giá 3,{n} tỷ sổ hồng";

async function the(nhom, { status = "da_duyet", duAn = [], phuong = null, phanKhu = null, mucDich = null } = {}) {
  return mot(`INSERT INTO group_address_cards (group_key, status, project_node_ids, area_id, subzone_node_id, purpose)
              VALUES ($1, $2, $3::bigint[], $4, $5, $6) RETURNING card_code, version`,
    [nhom, status, duAn, phuong, phanKhu, mucDich]);
}
async function nhanChuBai(post_id, ten) {
  await c.query(
    `INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, probabilities, json_ok, run_id)
     VALUES ('S03', $1, 'tg2', 'tg2-test', 'tg2', 'offer', $2::jsonb, true, 'tg2-itest')`,
    [post_id, JSON.stringify({ o: { project: { v: ten, cc: "chu_bai", trich: ten, trich_ok: true } } })]);
}
const dongSong = (pid) => nhieu(
  `SELECT field, value, evidence FROM field_assertions WHERE subject_key = $1 AND rule_id = $2 AND retracted_at IS NULL ORDER BY field`,
  [`S03:${pid}`, RULE_ID]);
const dongRut = (pid, lyDo) => nhieu(
  `SELECT field, value, evidence FROM field_assertions WHERE subject_key = $1 AND rule_id = $2 AND retract_reason = $3`,
  [`S03:${pid}`, RULE_ID, lyDo]);

test("TG2-T4 E4 AC-3 cross-layer: lượt nạp thật ghi đúng những dòng hàm thuần sinh ra, ô Định vị lên mot_du_an", async () => {
  await ca(async (f) => {
    await the("tg2-mot", { duAn: [f.duAn1], phuong: f.phuong1, phanKhu: f.phanKhu, mucDich: "ban" });
    await the("tg2-hai", { duAn: [f.duAn1, f.duAn2], phuong: f.phuong2 });
    // Chín ô «chữ bài × thẻ»: chữ im · chữ nêu CÙNG dự án thẻ một-dự-án (ten1) · chữ nêu dự án KHÁC (ten2) × thẻ một dự án ·
    // thẻ hai dự án · nhóm không có thẻ đã duyệt. Ô then chốt: khac×khong — chữ nêu dự án trong nhóm không thẻ ra 0 dòng.
    const ds = [
      ["im×mot", "tg2-mot", null], ["cung×mot", "tg2-mot", f.ten1], ["khac×mot", "tg2-mot", f.ten2],
      ["im×hai", "tg2-hai", null], ["cung×hai", "tg2-hai", f.ten1], ["khac×hai", "tg2-hai", f.ten2],
      ["im×khong", "tg2-khong", null], ["cung×khong", "tg2-khong", f.ten1], ["khac×khong", "tg2-khong", f.ten2],
    ];
    assert.equal(ds.length, 9, "ma trận AC-3 phải đủ chín ô");
    const pid = {};
    for (const [k, nhom, ten] of ds) { pid[k] = await bai(nhom, BAN); if (ten) await nhanChuBai(pid[k], ten); }
    await nap();
    const { the: m } = await docTheDaDuyet(c);
    const nhanDuAn = await docNhanDuAn(c);
    const ky = phatBieuDiaChiNhom({ bai: ds.map(([k, nhom]) => ({ post_id: pid[k], conversation_id: nhom })), the: m, nhanDuAn });
    const can = ky.dong.map((d) => `${d.subject_key}|${d.field}|${d.value}|${d.evidence.nguon_o}`).sort();
    const co = (await nhieu(
      `SELECT subject_key || '|' || field || '|' || value || '|' || (evidence ->> 'nguon_o') AS k FROM field_assertions
        WHERE rule_id = $1 AND retracted_at IS NULL AND subject_key = ANY ($2::text[]) ORDER BY 1`,
      [RULE_ID, Object.values(pid).map((p) => `S03:${p}`)])).map((r) => r.k);
    assert.deepEqual(co, can, "dòng trên DB lệch dòng hàm thuần sinh ra");
    const st = async (p) => (await mot(
      `SELECT op.status, op.project_node_id::text AS du_an FROM offer_project op JOIN sale_offers o USING (offer_id)
        WHERE $1 = ANY (o.post_ids)`, [p])) ?? { status: null, du_an: null };
    assert.deepEqual(await st(pid["im×mot"]), { status: "mot_du_an", du_an: f.duAn1 }, "bài im của nhóm thẻ một dự án không lên ô Định vị");
    assert.deepEqual(await st(pid["khac×mot"]), { status: "mot_du_an", du_an: f.duAn2 }, "chữ bài nêu dự án khác mà ra dự án của thẻ");
    assert.equal((await st(pid["im×hai"])).status, null, "thẻ hai dự án mà tin vẫn có dự án");
    for (const k of ["im×khong", "cung×khong", "khac×khong"]) {
      assert.deepEqual(await dongSong(pid[k]), [], `ô ${k}: nhóm không có thẻ đã duyệt mà bài vẫn nhận dòng của luật này`);
    }
  });
});

test("TG2-T4 E5 AC-4 bốn ô: ba trường thành phát biểu, bán/thuê vào cột kind, cột phường của tin không đổi", async () => {
  await ca(async (f) => {
    await the("tg2-du", { duAn: [f.duAn1], phuong: f.phuong1, phanKhu: f.phanKhu, mucDich: "ban" });
    const p = await bai("tg2-du", "Căn hộ 2PN {n}m2 bàn giao tháng 12, giá 2.900"); // không chữ bán/thuê: kind phải đến từ thẻ
    const { kq } = await nap();
    assert.ok(kq.nguonLoai["the-nhom"] >= 1, `không bài nào lấy kind từ thẻ: ${JSON.stringify(kq.nguonLoai)}`);
    const o = await mot(`SELECT kind, area_id, phuong_raw FROM sale_offer_records WHERE $1 = ANY (post_ids)`, [p]);
    assert.equal(o?.kind, "sale", "bài không chữ bán/thuê mà kind không lấy từ thẻ");
    assert.equal(o.area_id, null, "cột area_id của tin bị thẻ ghi đè");
    assert.equal(o.phuong_raw, null, "cột phuong_raw của tin bị thẻ ghi đè");
    const d = await dongSong(p);
    assert.deepEqual(d.map((x) => x.field), ["area_id", "project_node_id", "subzone_node_id"]);
    for (const x of d) assert.deepEqual(Object.keys(x.evidence).sort(), ["ban", "nguon_o", "the"], `${x.field}: căn cứ thiếu khoá`);
    // Đọc đúng dòng ĐÃ GHI trên DB — không phải mảng dòng hàm thuần trao cho bộ ghi (phát hiện S4 vòng 1, «đo chỉ dẫn»).
    const cot = await nhieu(
      `SELECT field, evidence_tier, method, method_version, rule_id FROM field_assertions
        WHERE subject_key = $1 AND rule_id = $2 AND retracted_at IS NULL ORDER BY field`, [`S03:${p}`, RULE_ID]);
    assert.equal(cot.length, 3);
    for (const x of cot) {
      assert.deepEqual([x.evidence_tier, x.method, x.method_version, x.rule_id], ["inferred", "e1_rule", "dong-dau-dia-chi@1", "dia-chi-the-nhom"],
        `${x.field}: dòng trên DB sai lớp, phương pháp, phiên bản hay luật`);
    }
  });
});

test("TG2-T4 E6 AC-5 sửa thẻ đổi dự án: dòng bản cũ rút «the-doi-ban», dòng bản mới chèn; bài có chữ bài giữ nguyên; chạy lại 0 chèn 0 rút", async () => {
  await ca(async (f) => {
    const t1 = await the("tg2-sua", { duAn: [f.duAn1] });
    const im = await bai("tg2-sua", BAN);
    const chu = await bai("tg2-sua", BAN);
    await nhanChuBai(chu, f.ten2);
    await nap();
    const chuTruoc = await dongSong(chu);
    // Vế dương: bài có chữ bài PHẢI có đúng một dòng dự án, giá trị của chữ, nguồn chu_bai — không thì hai câu so dưới qua được
    // khi cả hai mốc đều rỗng (phát hiện S4 vòng 1).
    assert.deepEqual(chuTruoc.filter((x) => x.field === "project_node_id").map((x) => [x.value, x.evidence.nguon_o]),
      [[f.duAn2, "chu_bai"]], "bài có chữ bài nêu dự án không nhận đúng một dòng dự án của chữ");
    await c.query(`UPDATE group_address_cards SET project_node_ids = $2::bigint[], version = version + 1 WHERE group_key = $1`,
      ["tg2-sua", [f.duAn2]]);
    await nap();
    assert.equal((await dongRut(im, "the-doi-ban")).length, 1, "dòng bản cũ của bài im không bị rút với lý do the-doi-ban");
    const moi = await dongSong(im);
    assert.deepEqual(moi.map((x) => [x.value, x.evidence.ban, x.evidence.nguon_o]), [[f.duAn2, t1.version + 1, "the"]]);
    const chuSau = await dongSong(chu);
    assert.ok(chuSau.every((x) => x.evidence.nguon_o === "chu_bai"), "bài có chữ bài nhận dòng từ thẻ");
    assert.deepEqual(chuSau.map((x) => x.value), chuTruoc.map((x) => x.value), "giá trị chữ bài đổi theo thẻ");
    const dem = async () => mot(`SELECT count(*) FILTER (WHERE retracted_at IS NULL)::int AS song, count(*)::int AS tong
                                   FROM field_assertions WHERE rule_id = $1 AND subject_key = ANY ($2::text[])`,
      [RULE_ID, [`S03:${im}`, `S03:${chu}`]]);
    const truoc = await dem();
    await nap();
    assert.deepEqual(await dem(), truoc, "chạy lại với thẻ không đổi mà có chèn hay rút");
  });
});

test("TG2-T4 E6 AC-5 sửa thẻ CHỈ đổi ô phường: dòng dự án rút rồi chèn lại đúng một lần mang phiên bản mới; không hai dòng phường sống", async () => {
  await ca(async (f) => {
    const t1 = await the("tg2-phuong", { duAn: [f.duAn1], phuong: f.phuong1 });
    const p = await bai("tg2-phuong", BAN);
    await nap();
    await c.query(`UPDATE group_address_cards SET area_id = $2, version = version + 1 WHERE group_key = $1`, ["tg2-phuong", f.phuong2]);
    await nap();
    const d = await dongSong(p);
    const phuong = d.filter((x) => x.field === "area_id");
    assert.equal(phuong.length, 1, `nhóm mang ${phuong.length} dòng phường sống`);
    assert.equal(phuong[0].value, f.phuong2);
    const duAn = d.filter((x) => x.field === "project_node_id");
    assert.equal(duAn.length, 1);
    // Chỉ mục sống không gồm căn cứ và bộ ghi chèn bằng ON CONFLICT DO NOTHING: quên bước rút thì dòng mới bị nuốt lặng,
    // dòng cũ mang phiên bản cũ sống tiếp. Đếm dòng không bắt được — phải đọc phiên bản trong căn cứ.
    assert.equal(duAn[0].evidence.ban, t1.version + 1, "dòng dự án còn mang phiên bản thẻ cũ");
    assert.equal((await dongRut(p, "the-doi-ban")).filter((x) => x.field === "project_node_id").length, 1);
  });
});

test("TG2-T4 Review Focus 6: nhóm được cấp thẻ MỚI sau khi bác (mã đổi, phiên bản về 1) — dòng của thẻ cũ bị rút", async () => {
  await ca(async (f) => {
    const cu = await the("tg2-cap-lai", { duAn: [f.duAn1] });
    const p = await bai("tg2-cap-lai", BAN);
    await nap();
    await c.query(`DELETE FROM group_address_cards WHERE group_key = $1`, ["tg2-cap-lai"]);
    const moi = await the("tg2-cap-lai", { duAn: [f.duAn1] });
    assert.notEqual(moi.card_code, cu.card_code);
    assert.equal(moi.version, cu.version, "tiền đề của ca: hai thẻ cùng phiên bản");
    await nap();
    const d = await dongSong(p);
    assert.deepEqual(d.map((x) => x.evidence.the), [moi.card_code], "dòng sống còn mang mã thẻ cũ");
    assert.equal((await dongRut(p, "the-doi-ban")).length, 1);
  });
});

test("TG2-T4 Review Focus 2: nhóm từng có thẻ duyệt, nay bị bác — mọi dòng của luật trên bài nhóm ấy bị rút", async () => {
  await ca(async (f) => {
    await the("tg2-bac", { duAn: [f.duAn1], phuong: f.phuong1 });
    const p = await bai("tg2-bac", BAN);
    await nap();
    assert.equal((await dongSong(p)).length, 2);
    await c.query(`UPDATE group_address_cards SET status = 'bac', version = version + 1 WHERE group_key = $1`, ["tg2-bac"]);
    await nap();
    assert.deepEqual(await dongSong(p), [], "thẻ đã bác mà dòng của nó vẫn sống");
  });
});

test("TG2-T4 E7 AC-6 bốn dấu bài thử cấy vào nhóm có thẻ: 0 dòng cho cả bốn", async () => {
  await ca(async (f) => {
    await the("tg2-thu", { duAn: [f.duAn1], phuong: f.phuong1 });
    const thuong = await bai("tg2-thu", BAN);
    const thu = {
      "snapshot-source": await bai("tg2-thu", BAN, { snap: SNAP_THU }),
      agent: await bai("tg2-thu", BAN, { agent: "e2e-tg2" }),
      group: await bai("tg2-thu", BAN, { tenNhom: "Test nhóm TG2" }),
      "noi-dung": await bai("tg2-thu", `${BAN} xem tại abc.trycloudflare.com`),
    };
    await nap();
    assert.ok((await dongSong(thuong)).length > 0, "tiền đề: bài thường của nhóm phải được đóng dấu");
    for (const [dau, p] of Object.entries(thu)) assert.deepEqual(await dongSong(p), [], `bài thử mang dấu ${dau} được đóng dấu`);
  });
});

test("TG2-T4 E11 AC-9 dòng DV6 trên bài vừa đóng dấu dự án bị rút «thay-bang-the-nhom»; bài không đóng dấu dự án giữ nguyên", async () => {
  await ca(async (f) => {
    await the("tg2-dv6-mot", { duAn: [f.duAn1] });
    await the("tg2-dv6-hai", { duAn: [f.duAn1, f.duAn2], phuong: f.phuong1 }); // thẻ hai dự án: chỉ ghi ô phường
    const dau = await bai("tg2-dv6-mot", BAN);
    const khong = await bai("tg2-dv6-hai", BAN);
    for (const [p, rule, tier, method] of [
      [dau, "du-an-nhom-mot-du-an", "inferred", "e1_rule"], [dau, "du-an-ten-bai", "observed", "e2_llm"],
      [khong, "du-an-nhom-mot-du-an", "inferred", "e1_rule"]]) {
      await c.query(
        `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at)
         VALUES ($1, 'project_node_id', $2, $3, $4, 'du-an-tren-tin-s03@1', $5, '{}'::jsonb, now())`,
        [`S03:${p}`, f.duAn1, tier, method, rule]);
    }
    await nap();
    const dv6 = (p) => nhieu(`SELECT rule_id, retract_reason FROM field_assertions
                               WHERE subject_key = $1 AND rule_id LIKE 'du-an-%' ORDER BY rule_id`, [`S03:${p}`]);
    assert.deepEqual(await dv6(dau), [
      { rule_id: "du-an-nhom-mot-du-an", retract_reason: "thay-bang-the-nhom" },
      { rule_id: "du-an-ten-bai", retract_reason: "thay-bang-the-nhom" }]);
    assert.deepEqual(await dv6(khong), [{ rule_id: "du-an-nhom-mot-du-an", retract_reason: null }],
      "bài chỉ được đóng dấu phường mà dòng dự án DV6 bị rút — tin mất dự án");
  });
});

for (const [ten, pha] of [
  ["DB chưa có bảng thẻ", "DROP TABLE group_address_cards CASCADE"],
  ["bảng thẻ thiếu cột retired_at (áp 108, chưa áp 109)", "ALTER TABLE group_address_cards DROP COLUMN retired_at CASCADE"],
]) {
  test(`TG2-T4 E9 AC-7 ${ten}: lượt nạp thoát êm, đúng một dòng cảnh báo, năm số của lượt y như khi đủ lược đồ`, async () => {
    let du, thieu;
    await ca(async () => {
      await bai("tg2-ap", BAN); await bai("tg2-ap", BAN);
      du = await nap();
    });
    await ca(async () => {
      so -= 2; // cùng mã bài, cùng chữ bài với ca trên
      await bai("tg2-ap", BAN); await bai("tg2-ap", BAN);
      await c.query(pha);
      thieu = await nap();
    });
    const dong = thieu.canhBao.filter((x) => /thẻ địa chỉ/.test(x));
    assert.equal(dong.length, 1, `cần đúng một dòng nói vì sao bỏ bước, có ${dong.length}: ${JSON.stringify(thieu.canhBao)}`);
    for (const k of ["offers", "rejected", "reconcile", "loaiGiaPhiLy", "nguonLoai"]) {
      assert.deepEqual(thieu.kq[k], du.kq[k], `khoá ${k} của lượt đổi khi ${ten}`);
    }
  });
}


/** Cấy hai bài CÙNG chữ (thành một tin) vào hai nhóm — dạng bài đăng lại chéo nhóm. */
async function baiCheo(nhomA, nhomB) {
  so++;
  const text = `Bán căn 2PN ${60 + so}m2 giá 3,${60 + so} tỷ sổ hồng`;
  const ids = [];
  for (const [i, nhom] of [nhomA, nhomB].entries()) {
    const post_id = `t_tg2_${process.pid}_${so}_${i}`;
    await c.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at)
       VALUES ($1, $2, 'openclaw-hook', 'Nhóm mồi TG2', $3, $4, '2026-11-10T08:00:00Z')`, [post_id, SNAP, nhom, text]);
    ids.push(post_id);
  }
  return ids;
}
const trangThaiTin = async (p) => (await mot(
  `SELECT op.status, op.project_node_id::text AS du_an, cardinality(o.post_ids) AS n FROM sale_offers o
     LEFT JOIN offer_project op USING (offer_id) WHERE $1 = ANY (o.post_ids)`, [p]));

test("TG2-T4 E10 AC-8 bài đăng lại chéo hai nhóm có thẻ khác dự án: tin KHÔNG thành xung đột, không đoán dự án", async () => {
  await ca(async (f) => {
    await the("tg2-cheo-a", { duAn: [f.duAn1] });
    await the("tg2-cheo-b", { duAn: [f.duAn2] });
    const [a, b] = await baiCheo("tg2-cheo-a", "tg2-cheo-b");
    const { kq } = await nap();
    const t = await trangThaiTin(a);
    assert.equal(t.n, 2, "tiền đề: hai bài cùng chữ phải gom thành một tin");
    assert.notEqual(t.status, "xung_dot", "tin chéo hai nhóm thành xung đột do chính hàng này");
    for (const p of [a, b]) assert.ok(!(await dongSong(p)).some((x) => x.field === "project_node_id"), `bài ${p} vẫn mang dự án thẻ`);
    assert.equal(kq.the_nhom.tin.theBatDong, 1);
  });
});

test("TG2-T4 E10 AC-8 một bài chữ nêu dự án khác thẻ: tin mang đúng dự án của chữ, bài im cùng tin không nhận dự án thẻ", async () => {
  await ca(async (f) => {
    await the("tg2-chu-tin", { duAn: [f.duAn1] });
    const [a, b] = await baiCheo("tg2-chu-tin", "tg2-chu-tin");
    await nhanChuBai(a, f.ten2);
    await nap();
    assert.deepEqual(await trangThaiTin(a), { status: "mot_du_an", du_an: f.duAn2, n: 2 });
    assert.deepEqual((await dongSong(b)).filter((x) => x.field === "project_node_id"), [], "bài im cùng tin vẫn nhận dự án thẻ");
  });
});

test("TG2-T4 E10 AC-8 duyệt từng đợt: thẻ thứ hai bất đồng không làm tin MẤT dự án thẻ thứ nhất đã cho", async () => {
  await ca(async (f) => {
    await the("tg2-dot-a", { duAn: [f.duAn1] });
    await the("tg2-dot-b", { status: "nhap", duAn: [f.duAn2] });
    const [a] = await baiCheo("tg2-dot-a", "tg2-dot-b");
    await nap();
    assert.deepEqual(await trangThaiTin(a), { status: "mot_du_an", du_an: f.duAn1, n: 2 }, "tiền đề: đợt một cho tin dự án của thẻ đã duyệt");
    await c.query(`UPDATE group_address_cards SET status = 'da_duyet' WHERE group_key = 'tg2-dot-b'`);
    const { kq } = await nap();
    assert.deepEqual(await trangThaiTin(a), { status: "mot_du_an", du_an: f.duAn1, n: 2 }, "duyệt thêm thẻ bất đồng làm tin mất dự án");
    assert.equal(kq.the_nhom.tin.theGiuHienTai, 1);
  });
});

/** Dòng DV6 mồi trên một bài (như lệnh du-an-tren-tin-s03 --ghi để lại). */
async function dv6(p, giaTri) {
  await c.query(
    `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at)
     VALUES ($1, 'project_node_id', $2, 'inferred', 'e1_rule', 'du-an-tren-tin-s03@1', 'du-an-nhom-mot-du-an', '{}'::jsonb, now())`,
    [`S03:${p}`, giaTri]);
}
const dv6Song = async (p) => (await nhieu(
  `SELECT value FROM field_assertions WHERE subject_key = $1 AND rule_id = 'du-an-nhom-mot-du-an' AND retracted_at IS NULL`,
  [`S03:${p}`])).map((r) => r.value);

for (const [ten, doiThe] of [
  ["thẻ bị BÁC", `UPDATE group_address_cards SET status = 'bac', version = version + 1 WHERE group_key = 'tg2-tra-lai'`],
  ["thẻ sửa sang HAI dự án", null],
]) {
  test(`TG2-T4 E10 AC-8 ${ten} sau khi đã đóng dấu: dòng DV6 đã rút được GHI LẠI, tin không rơi khỏi ô Định vị`, async () => {
    await ca(async (f) => {
      await soNhom("tg2-tra-lai", f.duAn1); // DV6 muốn duAn1 thật (sổ nhóm), không chỉ một dòng viết tay
      await the("tg2-tra-lai", { duAn: [f.duAn1] });
      const p = await bai("tg2-tra-lai", BAN);
      await dv6(p, f.duAn1);
      await nap();
      assert.deepEqual(await dv6Song(p), [], "tiền đề: lượt một phải rút dòng DV6 trên bài vừa đóng dấu dự án");
      await c.query(doiThe ?? `UPDATE group_address_cards SET project_node_ids = $1::bigint[], version = version + 1
                               WHERE group_key = 'tg2-tra-lai'`, doiThe ? [] : [[f.duAn1, f.duAn2]]);
      const { kq } = await nap();
      assert.deepEqual(await dv6Song(p), [f.duAn1], "dòng DV6 không được ghi lại — tin mất dự án");
      assert.deepEqual(await trangThaiTin(p), { status: "mot_du_an", du_an: f.duAn1, n: 1 }, "tin rơi khỏi ô Định vị");
      assert.equal(kq.the_nhom.tra_lai_dv6, 1);
    });
  });
}

/** Sáu ô trạng thái thẻ (AC-2) ở lượt nạp thật; trả danh sách ô lệch, mỗi ô gọi tên. */
async function kiemSauO(pid) {
  const can = { nhap: false, nhan: true, sua: true, bac: false, nghi: false, khong_the: false };
  const lech = [];
  for (const [o, coDong] of Object.entries(can)) {
    const n = (await dongSong(pid[o])).length;
    if ((n > 0) !== coDong) lech.push(`ô ${o}: ${n} dòng (cần ${coDong ? "có" : "0"})`);
  }
  return lech;
}
async function caySauO(f) {
  await the("tg2-o-nhap", { status: "nhap", duAn: [f.duAn1] });
  await the("tg2-o-nhan", { duAn: [f.duAn1] });
  const sua = await the("tg2-o-sua", { duAn: [f.duAn1] });
  await c.query(`UPDATE group_address_cards SET project_node_ids = $2::bigint[], version = version + 1 WHERE card_code = $1`,
    [sua.card_code, [f.duAn2]]); // lối «sửa»: người đổi ô rồi lưu — vẫn da_duyet, phiên bản tăng
  await the("tg2-o-bac", { status: "bac", duAn: [f.duAn1] });
  await c.query(
    `INSERT INTO group_address_cards (group_key, status, project_node_ids, retired_at, retired_reason)
     VALUES ('tg2-o-nghi', 'nhap', $1::bigint[], now(), 'nhom-roi-tap-nhap')`, [[f.duAn1]]);
  const o = ["nhap", "nhan", "sua", "bac", "nghi", "khong_the"];
  assert.equal(o.length, 6, "ma trận AC-2 phải đủ sáu ô");
  const pid = {};
  for (const k of o) pid[k] = await bai(`tg2-o-${k.replace("_", "-")}`, BAN);
  return pid;
}

test("TG2-T4 E2 AC-2 sáu ô trạng thái thẻ ở lượt nạp thật: chỉ hai ô đã duyệt sống sinh phát biểu", async () => {
  await ca(async (f) => {
    const pid = await caySauO(f);
    await nap();
    assert.deepEqual(await kiemSauO(pid), []);
  });
});

test("chiều đỏ E2 AC-2: đổi ô bac thành da_duyet thì đúng ô ấy sinh dòng và bộ kiểm gọi tên ô", async () => {
  await ca(async (f) => {
    const pid = await caySauO(f);
    await c.query(`UPDATE group_address_cards SET status = 'da_duyet' WHERE group_key = 'tg2-o-bac'`);
    await nap();
    assert.deepEqual(await kiemSauO(pid), ["ô bac: 1 dòng (cần 0)"]);
  });
});

// ── AC-8 bảng phủ ca, khuôn S4-r3 (GS P4-199 «đổi khuôn»): trả dòng DV6 bằng Ý ĐỊNH HIỆN TẠI của DV6, không hồi sinh dòng cũ ──
// Ba chiều: chuyển trạng thái thẻ × DV6 muốn gì lúc trả × dạng bài. Ý định DV6 dựng bằng chính đầu vào của DV6 (sổ nhóm
// collection_units, nhãn chữ bài), không bằng dòng viết tay — nên «DV6 không còn muốn» có nghĩa thật. Bất biến đo ở MỌI ô:
// (1) mỗi bài tối đa MỘT dự án sống (mọi luật); (2) thẻ thôi phủ thì không còn dòng sống nào mang luật TG2; (3) tin mang đúng
// dự án kỳ vọng tính tay từ ba chiều (TG2 đóng dấu thì giá trị thẻ/chữ bài, không thì giá trị DV6 muốn); (4) chạy lại lần nữa ra
// đúng cùng tập dòng sống. Chiều đỏ: chạy bảng trên bản r2 (hồi sinh MỌI bản rút) thì các ô D3 (DV6 thôi muốn) và D4 (nhiều giá
// trị từng rút) đỏ ở (1) hoặc (3) — số ô đỏ ghi ở ap-may-thu/so-chay-thu.md.
async function soNhom(nhom, duAn) {
  await c.query(
    `INSERT INTO collection_units (source_code, group_key, name, unit_type, project_node_ids)
     VALUES ('S03', $1, $2, 'nhom', $3::bigint[])
     ON CONFLICT (source_code, group_key) DO UPDATE SET project_node_ids = EXCLUDED.project_node_ids`,
    [nhom, `Sổ mồi ${nhom}`, duAn == null ? [] : [duAn]]); // unit_code do trigger cấp
}
/** Dòng DV6 sống như lệnh du-an-tren-tin-s03 --ghi để lại (luật nhóm). */
async function dv6Nhom(p, giaTri) {
  await c.query(
    `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at)
     VALUES ($1, 'project_node_id', $2, 'inferred', 'e1_rule', 'du-an-tren-tin-s03@1', 'du-an-nhom-mot-du-an', '{}'::jsonb, now())`,
    [`S03:${p}`, giaTri]);
}
const duAnSong = async (p) => [...new Set((await nhieu(
  `SELECT value FROM field_assertions WHERE subject_key = $1 AND field = 'project_node_id' AND retracted_at IS NULL`,
  [`S03:${p}`])).map((r) => r.value))].sort();
const tg2Song = async (p) => (await nhieu(
  `SELECT value FROM field_assertions WHERE subject_key = $1 AND field = 'project_node_id' AND rule_id = $2 AND retracted_at IS NULL`,
  [`S03:${p}`, RULE_ID])).map((r) => r.value);
const tapSong = async (ps) => (await nhieu(
  `SELECT subject_key, field, value, rule_id FROM field_assertions
    WHERE subject_key = ANY ($1::text[]) AND retracted_at IS NULL ORDER BY 1, 2, 3, 4`, [ps.map((p) => `S03:${p}`)]));

const CHUYEN = {
  T1: "duyệt → bác",
  T2: "duyệt → sửa sang dự án khác",
  T3: "duyệt → sửa sang hai dự án",
  T4: "duyệt → bác → duyệt lại",
};
const DV6 = {
  D1: "DV6 muốn cùng dự án thẻ",
  D2: "DV6 muốn dự án khác",
  D3: "DV6 không còn muốn gì (sổ nhóm thôi ghi dự án)",
  D4: "DV6 từng bị rút hai giá trị, nay muốn giá trị sau",
};
const DANG = { P1: "bài một nhóm", P2: "bài đăng chéo sang nhóm không thẻ", P3: "bài có chữ nêu dự án" };

/**
 * Kỳ vọng tính tay, không qua mã đang kiểm. A = dự án thẻ ban đầu (và dự án chữ bài nêu), B = dự án thẻ sửa sang (T2) và giá
 * trị sổ sau của D4, C = dự án khác của D2. TG2 đóng dấu ở T2 (B, chữ bài thì A) và T4 (A). T3: thẻ hai dự án vẫn đã duyệt,
 * vẫn phủ nhóm — ô dự án của thẻ thôi cho giá trị, nhưng bài có chữ nêu A vẫn được TG2 ghi A (AC-3: chữ bài thắng). T1: thẻ bị
 * bác, TG2 thôi phủ hẳn → giá trị DV6 muốn; T3 bài không chữ → giá trị DV6 muốn.
 * DV6 với bài chữ nêu A: sổ cùng A thì A; sổ khác A thì hai ứng viên → DV6 không ghi (tin mâu thuẫn); không sổ thì A từ chữ bài.
 */
function kyVong(t, d, p, f) {
  const A = f.duAn1, B = f.duAn2, C = f.duAn3;
  const tg2 = t === "T2" ? (p === "P3" ? A : B) : t === "T4" ? A : t === "T3" && p === "P3" ? A : null;
  if (tg2) return tg2;
  const so = { D1: A, D2: C, D3: null, D4: B }[d];
  if (p !== "P3") return so;
  if (so == null || so === A) return A;
  return null;
}

// Một giao dịch cho cả 48 ô, chạy theo PHA (mỗi lượt nạp ~15–30 giây trên bản chép — 48 ô riêng là gần một giờ): lượt nạp đóng
// dấu cho mọi ô một lần ở mỗi pha. Lượt nạp thừa với một ô (ô T1–T3 qua pha T4) là lượt chạy lại trên trạng thái đã ổn — bất
// biến (4) nói nó không đổi gì. Mỗi ô một ca con có tên ô; khoá nhóm riêng từng ô nên các ô không chạm nhau.
test("TG2-r3 AC-8 bảng phủ 4 chuyển trạng thái thẻ × 4 ý định DV6 × 3 dạng bài (48 ô)", async (tt) => {
  await ca(async (f0) => {
    const ba = await nhieu(`SELECT id::text AS id, name FROM asset_nodes WHERE node_type = 'project' ORDER BY id LIMIT 3`);
    const f = { ...f0, duAn3: ba[2].id };
    const O = [];
    for (const t of Object.keys(CHUYEN)) for (const d of Object.keys(DV6)) for (const p of Object.keys(DANG)) {
      const G = `tg2-pc-${t}${d}${p}`.toLowerCase();
      O.push({ t, d, p, G, ten: `[${t}·${d}·${p}] ${CHUYEN[t]} · ${DV6[d]} · ${DANG[p]}` });
    }
    assert.equal(O.length, 48, "bảng phủ phải đủ 4 × 4 × 3 ô");
    const doi = (o, sql, ts = []) => c.query(sql, [o.G, ...ts]);
    // Pha 0 — dựng: sổ nhóm, thẻ đã duyệt dự án A, bài; DV6 đã ghi trước khi có thẻ (D2 + chữ bài A: hai ứng viên, DV6 không ghi).
    for (const o of O) {
      await soNhom(o.G, o.d === "D2" ? f.duAn3 : f.duAn1);
      await the(o.G, { duAn: [f.duAn1] });
      o.bai = o.p === "P2" ? await baiCheo(o.G, `${o.G}-cheo`) : [await bai(o.G, BAN)];
      if (o.p === "P3") await nhanChuBai(o.bai[0], f.ten1);
      if (!(o.d === "D2" && o.p === "P3")) await dv6Nhom(o.bai[0], o.d === "D2" ? f.duAn3 : f.duAn1);
    }
    await nap();
    const tienDe = [];
    for (const o of O) if (JSON.stringify(await tg2Song(o.bai[0])) !== JSON.stringify([f.duAn1])) tienDe.push(o.ten);
    assert.deepEqual(tienDe, [], "tiền đề: lượt một phải đóng dấu dự án thẻ (hay chữ bài) lên bài của mọi ô");
    // Pha 1 — DV6 đổi ý: D3 sổ thôi ghi dự án; D4 sổ sang B và DV6 chạy lại chèn B (lớp inferred của thẻ không chặn DV6).
    for (const o of O) {
      if (o.d === "D3") await soNhom(o.G, null);
      if (o.d === "D4") { await soNhom(o.G, f.duAn2); await dv6Nhom(o.bai[0], f.duAn2); }
    }
    await nap(); // lượt TG2 kế rút luôn B của D4 → D4 có hai giá trị từng bị rút
    // Pha 2 — T4 bác trước.
    for (const o of O.filter((x) => x.t === "T4")) await doi(o, `UPDATE group_address_cards SET status = 'bac', version = version + 1 WHERE group_key = $1`);
    await nap();
    // Pha 3 — chuyển trạng thái cuối của mọi ô.
    for (const o of O) {
      if (o.t === "T1") await doi(o, `UPDATE group_address_cards SET status = 'bac', version = version + 1 WHERE group_key = $1`);
      if (o.t === "T2") await doi(o, `UPDATE group_address_cards SET project_node_ids = $2::bigint[], version = version + 1 WHERE group_key = $1`, [[f.duAn2]]);
      if (o.t === "T3") await doi(o, `UPDATE group_address_cards SET project_node_ids = $2::bigint[], version = version + 1 WHERE group_key = $1`, [[f.duAn1, f.duAn2]]);
      if (o.t === "T4") await doi(o, `UPDATE group_address_cards SET status = 'da_duyet', version = version + 1 WHERE group_key = $1`);
    }
    await nap();
    for (const o of O) o.truoc = await tapSong(o.bai);
    await nap(); // bất biến (4): chạy lại lần nữa
    for (const o of O) {
      await tt.test(o.ten, async () => {
        for (const x of o.bai) {
          const ds = await duAnSong(x);
          assert.ok(ds.length <= 1, `${o.ten}: bài ${x} mang ${ds.length} dự án sống: ${ds.join(", ")}`);
        }
        // (2) thẻ thôi cho dự án: T1 bác → không còn dòng dự án TG2 nào; T3 hai dự án → không còn dòng dự án TG2 lấy từ THẺ
        // (dòng lấy từ chữ bài vẫn hợp lệ, AC-3).
        if (o.t === "T1" || o.t === "T3") {
          for (const x of o.bai) {
            const tuThe = (await nhieu(
              `SELECT value, evidence->>'nguon_o' AS nguon FROM field_assertions WHERE subject_key = $1 AND field = 'project_node_id'
                  AND rule_id = $2 AND retracted_at IS NULL AND (${o.t === "T1" ? "true" : "evidence->>'nguon_o' IS DISTINCT FROM 'chu_bai'"})`,
              [`S03:${x}`, RULE_ID]));
            assert.deepEqual(tuThe, [], `${o.ten}: thẻ thôi cho dự án mà bài ${x} còn dòng dự án TG2 ${JSON.stringify(tuThe)}`);
          }
        }
        const can = kyVong(o.t, o.d, o.p, f);
        const tin = await trangThaiTin(o.bai[0]);
        assert.equal(tin.n, o.bai.length, `${o.ten}: tiền đề số bài của tin`);
        if (can) assert.deepEqual({ status: tin.status, du_an: tin.du_an }, { status: "mot_du_an", du_an: can },
          `${o.ten}: tin mang ${tin.du_an} (${tin.status}), cần ${can}`);
        else assert.equal(tin.du_an ?? null, null, `${o.ten}: tin mang ${tin.du_an} (${tin.status}), cần không dự án`);
        assert.deepEqual(await tapSong(o.bai), o.truoc, `${o.ten}: chạy lại lần nữa đổi tập dòng sống`);
      });
    }
  });
});
