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
    const ds = [
      ["im×mot", "tg2-mot", null], ["khac×mot", "tg2-mot", f.ten2],
      ["im×hai", "tg2-hai", null], ["khac×hai", "tg2-hai", f.ten2],
      ["im×khong", "tg2-khong", null],
    ];
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

test("TG2-T4 E9 AC-7 DB chưa có bảng thẻ: lượt nạp thoát êm, đúng một dòng cảnh báo, năm số của lượt y như khi có bảng", async () => {
  let coBang, khongBang;
  await ca(async () => {
    await bai("tg2-ap", BAN); await bai("tg2-ap", BAN);
    coBang = await nap();
  });
  await ca(async () => {
    so -= 2; // cùng mã bài, cùng chữ bài với ca trên
    await bai("tg2-ap", BAN); await bai("tg2-ap", BAN);
    await c.query("DROP TABLE group_address_cards CASCADE");
    khongBang = await nap();
  });
  const bang = khongBang.canhBao.filter((x) => /thẻ địa chỉ/.test(x));
  assert.equal(bang.length, 1, `cần đúng một dòng nói vì sao bỏ bước, có ${bang.length}: ${JSON.stringify(khongBang.canhBao)}`);
  for (const k of ["offers", "rejected", "reconcile", "loaiGiaPhiLy", "nguonLoai"]) {
    assert.deepEqual(khongBang.kq[k], coBang.kq[k], `khoá ${k} của lượt đổi khi thiếu bảng thẻ`);
  }
});
