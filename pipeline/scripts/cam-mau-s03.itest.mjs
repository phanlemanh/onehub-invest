// cam-mau-s03.itest.mjs — hồ sơ _acceptance/s03-cam-mau-so-lieu (N1): cả lượt transform S03 trên DB thử, BEGIN…ROLLBACK.
// Chỉ chạy trên DB thử (bash db/db-thu.sh oneinvest_p1_n1): transform đọc toàn bộ bài thật và giữ khoá đối soát, nên
// không chạy trên DB oneinvest dùng chung. Mỗi ca có ca đỏ: bản sao đột biến transform-zalo.mjs chạy cùng giao dịch.
import { strict as assert } from "node:assert";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

import pg from "pg";

import { napPhatBieu } from "../lib/nap-045.mjs";
import { docPhuongHopLe } from "../lib/osm.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("cam-mau-s03.itest: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc> (bash db/db-thu.sh …), không chạy trên oneinvest");
}
const TZ = join(import.meta.dirname, "../transform-zalo.mjs");
const SNAP = "hanoi__zalo-agent__2099-01-03T000000";
const tag = `cm_${process.pid}`;
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

/** Transform của bản sao đột biến (chép cạnh tệp thật để ./lib còn giải được, xoá ngay sau khi nạp). */
async function transformDotBien(thay) {
  let src = readFileSync(TZ, "utf8");
  for (const [cu, moi] of thay) {
    assert.ok(src.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
    src = src.replace(cu, moi);
  }
  const f = join(import.meta.dirname, `../.cm-mut-itest-${process.pid}-${++seq}.mjs`);
  writeFileSync(f, src);
  try {
    return (await import(pathToFileURL(f).href)).runTransformZalo;
  } finally {
    rmSync(f, { force: true });
  }
}

async function post(c, { sender, name = null, text, at, nhom = null, id: duoi = null }) {
  const id = duoi ? `t_${tag}_${duoi}` : `t_${tag}_${++seq}`;
  await c.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, sender_id, sender_name, conversation_id)
     VALUES ($1, $2, 'openclaw-hook', 'Nhóm thử N1', $3, $4, $5, $6, $7)`,
    [id, SNAP, text, at, `${tag}_${sender}`, name, nhom]);
  return id;
}
const offerOf = async (c, id) =>
  (await c.query(`SELECT offer_id, seller_name, area_id, price_vnd FROM sale_offers WHERE $1 = ANY(post_ids)`, [id])).rows[0] ?? null;

test("CM-AC-5 DB: bài thuê từ 1 tỷ và bán trên 100 tỷ không thành offer, đếm theo lý do", { timeout: 600_000 }, async () => {
  await withTx(async (c) => {
    const thue1ty = await post(c, { sender: "g1", text: "Cho thuê căn 2PN giá 1 tỷ/tháng", at: "2099-01-03T01:00:00Z" });
    const ban120 = await post(c, { sender: "g2", text: "Bán căn 2PN 120 tỷ", at: "2099-01-03T01:00:00Z" });
    const thue = await post(c, { sender: "g3", text: "Cho thuê căn 2PN giá 9.73 triệu/tháng", at: "2099-01-03T01:00:00Z" });
    const ban = await post(c, { sender: "g4", text: "Bán căn 2PN 3.271 tỷ", at: "2099-01-03T01:00:00Z" });
    const r = await runTransformZalo(c);
    assert.equal(await offerOf(c, thue1ty), null, "CM-AC-5 DB thuê 1 tỷ thành offer");
    assert.equal(await offerOf(c, ban120), null, "CM-AC-5 DB bán 120 tỷ thành offer");
    assert.equal(Number((await offerOf(c, thue))?.price_vnd), 9.73e6, "CM-AC-5 DB thuê 9,73 triệu không thành offer");
    assert.equal(Number((await offerOf(c, ban))?.price_vnd), 3.271e9, "CM-AC-5 DB bán 3,271 tỷ không thành offer");
    assert.ok(r.loaiGiaPhiLy["thue-tu-1-ty"] >= 1 && r.loaiGiaPhiLy["ban-tren-100-ty"] >= 1, `CM-AC-5 DB đếm ${JSON.stringify(r.loaiGiaPhiLy)}`);
  });
});

test("CM-AC-7: seller_name = tên của bài mới nhất có tên; không tên → null", { timeout: 600_000 }, async () => {
  const TEXT = "Cho thuê căn 2PN giá 11.37 triệu/tháng";
  // Mã bài đặt để thứ tự xử lý (ORDER BY post_id) NGƯỢC thứ tự thời gian: bài có tên mới nhất được xử lý TRƯỚC bài có
  // tên cũ — cài ngây thơ «bài có tên sau cùng thắng» ra «A», chỉ so posted_at mới ra «B».
  const mo = async (c) => ({
    moi: await post(c, { sender: "s7", name: " B ", text: TEXT, at: "2099-01-03T05:00:00Z", id: "s7a" }),
    cu: await post(c, { sender: "s7", name: "A", text: TEXT, at: "2099-01-03T01:00:00Z", id: "s7b" }),
    rong: await post(c, { sender: "s7", name: "", text: TEXT, at: "2099-01-03T06:00:00Z", id: "s7c" }),
    khongTen: await post(c, { sender: "s8", text: TEXT, at: "2099-01-03T02:00:00Z" }),
  });
  await withTx(async (c) => {
    const p = await mo(c);
    await runTransformZalo(c);
    const o = await offerOf(c, p.cu);
    assert.equal((await offerOf(c, p.rong))?.offer_id, o?.offer_id, "CM-AC-7 ba bài một người không chung offer");
    assert.equal(o?.seller_name, "B", "CM-AC-7 seller_name");
    assert.equal((await offerOf(c, p.khongTen))?.seller_name, null, "CM-AC-7 nhóm không tên phải null");
  });
  await withTx(async (c) => {
    const p = await mo(c);
    const dotBien = await transformDotBien([[">= new Date(o.sellerNameAt)", "< new Date(o.sellerNameAt)"]]);
    await dotBien(c);
    assert.notEqual((await offerOf(c, p.cu))?.seller_name, "B", "CM-AC-7 đột biến lấy bài sớm nhất vẫn ra «B» — thước không đo");
  });
  await withTx(async (c) => {
    const p = await mo(c);
    const ngayTho = await transformDotBien([["if (ten && (o.sellerNameAt === null || new Date(pr.post.posted_at) >= new Date(o.sellerNameAt))) {", "if (ten) {"]]);
    await ngayTho(c);
    assert.notEqual((await offerOf(c, p.cu))?.seller_name, "B", "CM-AC-7 đột biến «bài có tên sau cùng thắng» vẫn ra «B» — thước không tách thời gian khỏi thứ tự xử lý");
  });
});

/** Ba tên phường lấy từ areas lúc chạy: chỉ thuộc TP.HCM, chỉ thuộc Hà Nội, trùng giữa hai nơi. */
async function tenPhuong(c) {
  const bare = (n) => n.normalize("NFC").replace(/^(Quận|Huyện|Phường|Thị xã|Thị trấn|Xã)\s+/i, "");
  const hn = await docPhuongHopLe(c, ["vn-hanoi"]);
  const hcm = await docPhuongHopLe(c, ["vn-hcmc"]);
  const tenHn = new Set(hn.map((a) => bare(a.name).toLowerCase()));
  const tenHcm = new Set(hcm.map((a) => bare(a.name).toLowerCase()));
  // «Chỉ thuộc» một nơi: tên không trùng và không chứa / không nằm trong tên nào của nơi kia (khớp chuỗi con).
  const sach = (ten, khac) => [...khac].every((k) => !k.includes(ten) && !ten.includes(k));
  const chiHcm = hcm.find((a) => { const t = bare(a.name).toLowerCase(); return t.length >= 5 && sach(t, tenHn); });
  const chiHn = hn.find((a) => { const t = bare(a.name).toLowerCase(); return t.length >= 5 && sach(t, tenHcm); });
  const trung = hn.find((a) => tenHcm.has(bare(a.name).toLowerCase()));
  assert.ok(chiHcm && chiHn && trung, "CM-AC-8 areas thiếu phường HCM/HN hoặc tên trùng để dựng ca");
  return { chiHcm, chiHn, trung: bare(trung.name) };
}

test("CM-AC-8: phường theo thị trường của nhóm — năm ô", { timeout: 600_000 }, async () => {
  const mo = async (c) => {
    const t = await tenPhuong(c);
    const nhom = { hcm: `${tag}_hcm`, hn: `${tag}_hn`, chua: `${tag}_chua` };
    for (const [k, m] of [["hcm", ["vn-hcmc"]], ["hn", ["vn-hanoi"]], ["chua", []]])
      await c.query(`INSERT INTO collection_units (source_code, group_key, name, market_codes) VALUES ('S03', $1, $2, $3)`,
        [nhom[k], `Nhóm thử N1 ${k}`, m]);
    const bai = (sender, ten, g) => post(c, { sender, text: `Bán căn 2PN 3.59 tỷ phường ${ten}`, at: "2099-01-03T01:00:00Z", nhom: nhom[g] });
    return {
      t,
      o1: await bai("p1", bare(t.chiHcm.name), "hcm"),
      o2: await bai("p2", bare(t.chiHn.name), "hn"),
      o3: await bai("p3", bare(t.chiHcm.name), "hn"),
      o4: await bai("p4", bare(t.chiHcm.name), "chua"),
      o5: await bai("p5", t.trung, "chua"),
    };
  };
  const bare = (n) => n.normalize("NFC").replace(/^(Quận|Huyện|Phường|Thị xã|Thị trấn|Xã)\s+/i, "");
  await withTx(async (c) => {
    const p = await mo(c);
    await runTransformZalo(c);
    assert.equal((await offerOf(c, p.o1))?.area_id, p.t.chiHcm.id, "CM-AC-8 ô 1 nhóm HCM, tên HCM");
    assert.equal((await offerOf(c, p.o2))?.area_id, p.t.chiHn.id, "CM-AC-8 ô 2 nhóm HN, tên HN");
    assert.equal((await offerOf(c, p.o3))?.area_id, null, "CM-AC-8 ô 3 nhóm HN không nhận tên HCM");
    assert.equal((await offerOf(c, p.o4))?.area_id, p.t.chiHcm.id, "CM-AC-8 ô 4 nhóm chưa khai, tên chỉ thuộc HCM");
    assert.equal((await offerOf(c, p.o5))?.area_id, null, "CM-AC-8 ô 5 nhóm chưa khai, tên trùng HN–HCM");
  });
  await withTx(async (c) => {
    const p = await mo(c);
    const dotBien = await transformDotBien([["const moiThiTruong = await docThiTruongCoPhuong(client);", 'const moiThiTruong = ["vn-hanoi"];']]);
    await dotBien(c);
    assert.notEqual((await offerOf(c, p.o4))?.area_id, p.t.chiHcm.id, "CM-AC-8 đột biến chỉ nạp vn-hanoi vẫn ra vn-hcmc — thước không đo");
  });
});
