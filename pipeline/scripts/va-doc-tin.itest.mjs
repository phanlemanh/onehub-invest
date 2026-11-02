// va-doc-tin.itest.mjs — hồ sơ _acceptance/s03-va-doc-tin (SV1): cả lượt transform S03 trên DB thử, BEGIN…ROLLBACK.
// Chỉ chạy trên DB thử (bash db/db-thu.sh oneinvest_n1_sv1): transform đọc toàn bộ bài thật và giữ khoá đối soát, nên không
// chạy trên DB oneinvest dùng chung. Chữ trong ca là chữ dựng, không phải bài thật. Giá mỗi ca khác nhau và lạ để không gom nhầm bài thật.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import pg from "pg";

import { napPhatBieu } from "../lib/nap-045.mjs";
import { docPhuongHopLe } from "../lib/osm.mjs";
import { ASSERTION_FIELD, ASSERTION_METHOD, EVIDENCE_TIER } from "../lib/vocab.generated.mjs";
import { chinhLoaiThueTy, lyDoGiaPhiLy, parsePost, runTransformZalo } from "../transform-zalo.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("va-doc-tin.itest: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc> (bash db/db-thu.sh …), không chạy trên oneinvest");
}
const SNAP = "hanoi__zalo-agent__2099-01-05T000000";
const AT = "2099-01-05T01:00:00Z";
const tag = `sv1_${process.pid}`;
let seq = 0;

async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}')
      ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

async function post(c, text, sender = "a") {
  const id = `t_${tag}_${++seq}`;
  await c.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, sender_id, sender_name, conversation_id)
     VALUES ($1, $2, 'openclaw-hook', 'Nhóm thử SV1', $3, $4, $5, NULL, NULL)`,
    [id, SNAP, text, AT, `${tag}_${sender}`]);
  return id;
}
const tinCua = async (c, id) =>
  (await c.query(`SELECT offer_id, kind, price_vnd, block_raw, unit_number FROM sale_offers WHERE $1 = ANY(post_ids)`, [id])).rows[0] ?? null;
const phatBieuParser = async (c, id) => (await c.query(
  `SELECT field, value FROM field_assertions WHERE subject_key = $1 AND method = 'parser' AND field IN ('block_raw', 'unit_number')
     AND retracted_at IS NULL ORDER BY field`, [`S03:${id}`])).rows.map((r) => `${r.field}=${r.value}`);
const phatBieuLlm = (c, id, value) => c.query(
  `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at) VALUES ($1, $2, $3, $4, $5, $6)`,
  [`S03:${id}`, ASSERTION_FIELD.block_raw, value, EVIDENCE_TIER.observed, ASSERTION_METHOD.e2_llm, AT]);

test("SV1-AC-5 DB: thuê từ 1 tỷ không đơn vị thời gian thành bán; có đơn vị và bán trên 100 tỷ bị gạt, đếm đúng lý do", { timeout: 1_200_000 }, async () => {
  await withTx(async (c) => {
    // DB thử chép dữ liệu thật nên bộ đếm đã có sẵn số: đo phần tăng của đúng các bài dựng.
    const truoc = (await runTransformZalo(c)).loaiGiaPhiLy;
    const ba = await post(c, "Cho thuê căn 2PN giá 3.331 tỷ", "t1");
    const mot = await post(c, "Cho thuê căn 2PN giá 1 tỷ", "t2");
    const banKemThue = await post(c, "Bán căn 2PN đang cho thuê 7tr/tháng. Giá bán: 2,717 tỷ", "t7");
    const GAT = [
      ["/tháng", "Cho thuê căn 2PN giá 1.334 tỷ/tháng", "t3", "thue-tu-1-ty"],
      ["/th", "Cho thuê căn 2PN giá 1.335 tỷ/th", "t4", "thue-tu-1-ty"],
      ["/năm", "Cho thuê nguyên toà 1,336 tỷ/năm", "t5", "thue-tu-1-ty"],
      ["bán 120 tỷ", "Bán căn 2PN 120 tỷ", "t6", "ban-tren-100-ty"],
    ];
    const gat = [];
    for (const [ten, chu, tag, lyDo] of GAT) gat.push([ten, chu, lyDo, await post(c, chu, tag)]);
    const r = await runTransformZalo(c);
    assert.equal((await tinCua(c, ba))?.kind, "sale", "SV1-AC-5 DB thuê 3,331 tỷ không thành tin bán");
    assert.equal(Number((await tinCua(c, ba))?.price_vnd), 3.331e9, "SV1-AC-5 DB giá thuê 3,331 tỷ");
    assert.equal((await tinCua(c, mot))?.kind, "sale", "SV1-AC-5 DB thuê đúng 1 tỷ không thành tin bán");
    assert.equal(Number((await tinCua(c, mot))?.price_vnd), 1e9, "SV1-AC-5 DB giá thuê đúng 1 tỷ");
    assert.equal((await tinCua(c, banKemThue))?.kind, "sale", "SV1-AC-5 DB bài bán kèm tiền thuê không thành tin bán");
    assert.equal(Number((await tinCua(c, banKemThue))?.price_vnd), 2.717e9, "SV1-AC-5 DB giá bài bán kèm tiền thuê");
    for (const [ten, chu, lyDo, id] of gat) {
      assert.equal(await tinCua(c, id), null, `SV1-AC-5 DB «${ten}» thành tin`);
      const pr = parsePost(chu);
      chinhLoaiThueTy(pr, chu);
      assert.equal(lyDoGiaPhiLy(pr), lyDo, `SV1-AC-5 DB lý do «${ten}»`);
    }
    const tang = (k) => (r.loaiGiaPhiLy[k] ?? 0) - (truoc[k] ?? 0);
    assert.deepEqual([tang("thue-tu-1-ty"), tang("ban-tren-100-ty")], [3, 1], `SV1-AC-5 DB đếm ${JSON.stringify(r.loaiGiaPhiLy)} (trước ${JSON.stringify(truoc)})`);
  });
});

test("SV1-AC-8 DB: phát biểu toà, trục đúng cặp theo bài; khoá gom; phân xử với LLM; nạp lại không nhân dòng", { timeout: 1_800_000 }, async () => {
  await withTx(async (c) => {
    const hn = await docPhuongHopLe(c, ["vn-hanoi"]);
    const bare = (n) => n.normalize("NFC").replace(/^(Quận|Huyện|Phường|Thị xã|Thị trấn|Xã)\s+/i, "");
    const hcm = (await docPhuongHopLe(c, ["vn-hcmc"])).map((a) => bare(a.name).toLowerCase());
    // Tên chỉ thuộc Hà Nội, không trùng, không chứa tên nơi khác (khớp chuỗi con).
    const phuong = hn.map((a) => bare(a.name)).find((t) => t.length >= 5 && hcm.every((k) => !k.includes(t.toLowerCase()) && !t.toLowerCase().includes(k)));

    const motMa = await post(c, "Bán PR6.12.20 2PN 3.411 tỷ", "m1");
    const chuThuong = await post(c, "Bán pr6.12.25 2PN 3.423 tỷ", "m13");
    const cungToa = await post(c, "Bán LD1.12.02 và LD1.12.06 2PN 3.412 tỷ", "m2");
    const khacToa = await post(c, "Bán LD1.12.02 và PR2.10.10 2PN 3.413 tỷ", "m3");
    const chiToa = await post(c, "Bán căn toà GH2 2PN 3.414 tỷ", "m4");
    const duoiSo = await post(c, "Bán 2PN toà S1.03 3.415 tỷ", "m5");
    const noiBo = await post(c, "Bán 2PN 3.416 tỷ S115451", "m6");
    const khongMa = await post(c, "Bán 2PN 3.417 tỷ", "m7");
    const coMa = await post(c, "Bán PR6.12.21 2PN 3.418 tỷ", "m8");
    const thieuMa = await post(c, "Bán 2PN 3.418 tỷ", "m8");
    const truc1 = await post(c, `Bán 2PN 61,7m2 giá 3.419 tỷ phường ${phuong} mã PR6.12.22`, "m9");
    const truc2 = await post(c, `Bán 2PN 61,7m2 giá 3.419 tỷ phường ${phuong} mã PR6.12.23`, "m10");
    const llmKhac = await post(c, "Bán PR6.12.24 2PN 3.421 tỷ", "m11");
    const llmMotMinh = await post(c, "Bán 2PN 3.422 tỷ", "m12");
    await phatBieuLlm(c, llmKhac, "ZZ9");
    await phatBieuLlm(c, llmMotMinh, "ZZ8");

    // Lượt 1 đọc bỏ toà, trục như bản trước: hai bài khác trục đủ phường + DT chung một tin, offer_id dính vào cả hai bài.
    await runTransformZalo(c, { parse: (t) => { const pr = parsePost(t); pr.block = null; pr.unit = null; return pr; } });
    const dinh = await tinCua(c, truc1);
    assert.ok(dinh, "SV1-AC-8 DB lượt seed: bài đủ phường + DT không thành tin");
    assert.equal((await tinCua(c, truc2))?.offer_id, dinh.offer_id, "SV1-AC-8 DB lượt seed: hai bài không chung tin, ca dính không đo gì");

    await runTransformZalo(c);

    const cap = async (id, block, unit) => {
      const o = await tinCua(c, id);
      assert.ok(o, `SV1-AC-8 DB bài ${id} không thành tin`);
      assert.deepEqual([o.block_raw, o.unit_number], [block, unit], `SV1-AC-8 DB cặp toà, trục sai ở ${id}`);
      return o;
    };
    await cap(motMa, "PR6", "PR6.12.20");
    await cap(chuThuong, "pr6", "pr6.12.25");
    assert.deepEqual(await phatBieuParser(c, chuThuong), ["block_raw=pr6", "unit_number=pr6.12.25"], "SV1-AC-8 DB giữ nguyên chữ môi giới");
    assert.deepEqual(await phatBieuParser(c, motMa), ["block_raw=PR6", "unit_number=PR6.12.20"], "SV1-AC-8 DB phát biểu bài một mã");
    await cap(cungToa, "LD1", null);
    assert.deepEqual(await phatBieuParser(c, cungToa), ["block_raw=LD1"], "SV1-AC-8 DB bài nhiều mã cùng toà");
    await cap(khacToa, null, null);
    assert.deepEqual(await phatBieuParser(c, khacToa), [], "SV1-AC-8 DB bài nhiều mã khác toà");
    await cap(chiToa, "GH2", null);
    await cap(duoiSo, "S1.03", null);
    assert.deepEqual(await phatBieuParser(c, duoiSo), ["block_raw=S1.03"], "SV1-AC-8 DB toà có đuôi số");
    await cap(noiBo, null, null);
    await cap(khongMa, null, null);
    assert.deepEqual(await phatBieuParser(c, khongMa), [], "SV1-AC-8 DB bài không mã");

    const a = await cap(coMa, "PR6", "PR6.12.21");
    const b = await cap(thieuMa, null, null);
    assert.notEqual(a.offer_id, b.offer_id, "SV1-AC-8 DB bài có mã và bài thiếu mã chung tin");

    const t1 = await cap(truc1, "PR6", "PR6.12.22");
    const t2 = await cap(truc2, "PR6", "PR6.12.23");
    assert.notEqual(t1.offer_id, t2.offer_id, "SV1-AC-8 DB hai trục chung tin");
    assert.ok([t1.offer_id, t2.offer_id].includes(dinh.offer_id), "SV1-AC-8 DB không bài nào giữ offer_id dính cũ");

    assert.equal((await tinCua(c, llmKhac))?.block_raw, "PR6", "SV1-AC-8 DB parser phải thắng LLM khi khác");
    assert.equal((await tinCua(c, llmMotMinh))?.block_raw, "ZZ8", "SV1-AC-8 DB LLM phải được giữ khi parser không đọc ra");

    const dem = async () => Number((await c.query(`SELECT count(*) AS n FROM field_assertions WHERE subject_key LIKE $1`, [`S03:t_${tag}_%`])).rows[0].n);
    const truoc = await dem();
    await runTransformZalo(c);
    assert.equal(await dem(), truoc, "SV1-AC-8 DB nạp lại nhân dòng phát biểu");
    assert.equal((await c.query(
      `SELECT count(*) AS n FROM (SELECT offer_id FROM sale_offers o, unnest(o.post_ids) p
         JOIN field_assertions f ON f.subject_key = 'S03:' || p AND f.field = 'unit_number' AND f.method = 'parser' AND f.retracted_at IS NULL
        WHERE o.source = 'S03' GROUP BY offer_id HAVING count(DISTINCT f.value) > 1) x`)).rows[0].n, "0", "SV1-AC-8 DB có tin mang hai trục");
  });
});
