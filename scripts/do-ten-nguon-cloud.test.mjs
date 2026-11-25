// do-ten-nguon-cloud.test.mjs — HT26 `sync-cloud-che-ten-nguon-moi-cot` E6 (AC-6): lệnh đo chỉ gửi SELECT khoá + cột trong giao dịch
// chỉ đọc, không câu nào mang mẫu tên nguồn, đếm tại máy (lõi chung + phép đếm thô độc lập), không ghi tệp. Cloud là exec GIẢ ghi lại
// mọi câu; tên nguồn là chuỗi BỊA; thông điệp đỏ không in token. Không DB, không mạng.
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { findSourceNames } from "../pipeline/lib/mask-source-names.mjs";
import { cheDuLieu } from "../pipeline/sync-cloud.mjs";
import { bocChiDoc, cauTrang, demThoDuLieu, doCloud, oTrungTho, soatCau, tokenTho } from "./do-ten-nguon-cloud.mjs";

const BIA = [
  { code: "S97", realName: "Nguonbia Kappa", wholeOnly: true },
  { code: "S97", realName: "nguonbiakappa.example", wholeOnly: true },
  { code: "S95", realName: "Kap", wholeOnly: false }, // token ngắn: chỉ trúng khi đứng riêng
];
// Bảng cloud bịa có TÊN CỘT mang tên nguồn (như airdna_id): định danh lược đồ, được miễn khi soát câu.
const BANG = "ref_calib_listings";
const DONG = [
  { nguonbiakappa_id: "k1", title: "Căn trên Nguonbia Kappa", metrics: { "nguonbiakappa.example": 1, gia: 1.5 }, photo_urls: ["https://anh-sach.example/1.jpg"] },
  { nguonbiakappa_id: "k2", title: "sạch", metrics: { gia: 2 }, photo_urls: ["https://cdn.nguonbiakappa.example/2.jpg"] },
  { nguonbiakappa_id: "k3", title: "Kapital và Kap", metrics: {}, photo_urls: [] },
];

/** Cloud giả: catalog một bảng, phân trang theo khoá, ghi mọi câu nhận được. */
function cloudGia() {
  const cau = [];
  const exec = async (sql) => {
    cau.push(sql);
    const s = sql.replace(/^BEGIN READ ONLY; /, "").replace(/; COMMIT;$/, "");
    if (s.includes("information_schema.columns")) {
      return [["nguonbiakappa_id", "text"], ["title", "text"], ["metrics", "jsonb"], ["photo_urls", "_text"], ["n", "int4"]].map(([c, u]) => ({ t: BANG, c, u }));
    }
    if (s.includes("indisprimary")) return [{ t: BANG, c: "nguonbiakappa_id" }];
    if (s.includes(`FROM public."${BANG}"`)) {
      const sau = s.match(/> \('([^']*)'\)/)?.[1];
      const lim = Number(s.match(/LIMIT (\d+)/)[1]);
      return DONG.filter((r) => !sau || r.nguonbiakappa_id > sau).slice(0, lim);
    }
    return [];
  };
  return { exec, cau };
}

/** Soát nhật ký câu: mỗi câu là một SELECT bọc giao dịch chỉ đọc và không mang tên nguồn sau khi bỏ định danh. Trả vi phạm (không token). */
function viPham(cau, dinhDanh) {
  return cau.flatMap((sql, i) => {
    const out = [];
    if (!/^BEGIN READ ONLY; SELECT [\s\S]+; COMMIT;$/.test(sql)) out.push(`câu ${i + 1}: không phải SELECT trong giao dịch chỉ đọc`);
    if (soatCau(sql, BIA, dinhDanh)) out.push(`câu ${i + 1}: mang tên nguồn`);
    return out;
  });
}

test("SCC-6: mọi câu gửi cloud là SELECT khoá + cột trong giao dịch chỉ đọc, không mang tên nguồn; đếm tại máy đúng", async () => {
  const ghi = [];
  const goc = fs.writeFileSync;
  fs.writeFileSync = (...a) => { ghi.push(a[0]); return goc(...a); };
  try {
    const cg = cloudGia();
    const r = await doCloud({ exec: cg.exec, entries: BIA, fill: ["airdna_listings"] });
    assert.ok(cg.cau.length >= 3, "SCC-6 tiền đề: phải có câu catalog và câu trang");
    assert.deepEqual(viPham(cg.cau, r.dinhDanh), [], "SCC-6 câu gửi cloud");
    assert.ok(cg.cau.filter((s) => s.includes(`FROM public."${BANG}"`)).every((s) => /SELECT "nguonbiakappa_id", "title", "metrics", "photo_urls" FROM/.test(s)),
      "SCC-6: câu trang phải chỉ chọn khoá + cột chữ");
    assert.deepEqual(r.kq, {
      [`${BANG}.nguonbiakappa_id`]: { cloud: 0, thoCloud: 0 },
      [`${BANG}.title`]: { cloud: 2, thoCloud: 2 },
      [`${BANG}.metrics`]: { cloud: 1, thoCloud: 1 },
      [`${BANG}.photo_urls`]: { cloud: 1, thoCloud: 1 },
    }, "SCC-6 số ô theo bảng.cột");
    // Định danh được miễn (in ra output của lệnh): đúng các tên trong catalog.
    assert.ok(r.dinhDanh.includes("nguonbiakappa_id") && r.dinhDanh.every((d) => d === BANG || ["nguonbiakappa_id", "title", "metrics", "photo_urls", "n"].includes(d)),
      "SCC-6: danh sách định danh miễn phải lấy từ catalog");
    assert.deepEqual(ghi, [], "SCC-6: lệnh đo không được ghi tệp");
  } finally {
    fs.writeFileSync = goc;
  }
});

test("SCC-6: chiều đỏ — bản đo lọc ở cloud bằng mẫu tên nguồn bị chặn trước khi gửi, thông điệp nêu câu, không in token", async () => {
  const cg = cloudGia();
  const loc = (ct, pk, cols, o) => cauTrang(ct, pk, cols, o).replace(" ORDER BY", ` WHERE "title" ILIKE '%nguonbia kappa%' ORDER BY`);
  await assert.rejects(doCloud({ exec: cg.exec, entries: BIA, fill: ["airdna_listings"], cauTrangImpl: loc }), (e) => {
    assert.match(e.message, /câu thứ \d+ mang tên nguồn — không gửi/);
    assert.ok(!findSourceNames(e.message, BIA).length && !/nguonbia/i.test(e.message), "SCC-6: thông điệp in token");
    return true;
  });
  assert.ok(cg.cau.every((s) => !/ILIKE/.test(s)), "SCC-6: câu lọc bằng mẫu đã tới cloud");
  // Thước soát nhật ký cũng bắt được câu ấy khi nó lọt qua rào (đối chứng cho viPham).
  const sql = bocChiDoc(loc(BANG, ["nguonbiakappa_id"], ["title"], { limit: 10 }));
  assert.deepEqual(viPham([sql], [BANG, "nguonbiakappa_id", "title"]), ["câu 1: mang tên nguồn"]);
});

test("SCC-6: đếm thô độc lập — khớp thẳng chuỗi gốc không phân biệt hoa thường, token ngắn chỉ khi đứng riêng; payload đã che ra 0", () => {
  const tho = tokenTho(BIA);
  assert.equal(oTrungTho("đăng ở NGUONBIA KAPPA", tho), true);
  assert.equal(oTrungTho({ "nguonbiakappa.example": 1 }, tho), true, "khoá lồng");
  assert.equal(oTrungTho("Kapital", tho), false, "token ngắn giữa từ");
  assert.equal(oTrungTho("và Kap.", tho), true, "token ngắn đứng riêng");
  const data = new Map([[BANG, DONG.map((r) => JSON.stringify(r))]]);
  assert.deepEqual(demThoDuLieu(data, BIA), { [`${BANG}.title`]: 2, [`${BANG}.metrics`]: 1, [`${BANG}.photo_urls`]: 1 }, "SCC-6 đếm thô trước che");
  cheDuLieu(data, BIA, { columns: { [BANG]: Object.keys(DONG[0]) } });
  assert.deepEqual(demThoDuLieu(data, BIA), {}, "SCC-6 đếm thô sau che phải ra 0 (khoá cấp dòng không tính)");
});
