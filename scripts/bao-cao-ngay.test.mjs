// node --test scripts/bao-cao-ngay.test.mjs
// Báo cáo số liệu ngày: phần thuần (chấm, so hôm qua, ô nghi tụt, gợi ý, markdown) + bất biến chỉ đọc / SPL của CLI.
// Ca DB (cuối tệp) chạy gom() trên DB local trong giao dịch READ ONLY; bỏ qua khi không kết nối được.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

import { bienDong, chamBang, danhGia, demNs1, dungMarkdown, fmt, fmtNgay, goiY, oBacGiam } from "./lib/bao-cao-ngay.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MT = JSON.parse(readFileSync(path.join(HERE, "bao-cao-ngay/muc-tieu.json"), "utf8"));

describe("danhGia", () => {
  test("hướng tăng: đạt, vàng, đỏ", () => {
    const mt = { huong: "tang", dich: 50, do: 20 };
    assert.equal(danhGia(55, mt), "dat");
    assert.equal(danhGia(30, mt), "vang");
    assert.equal(danhGia(10, mt), "do");
  });
  test("hướng giảm: ngưỡng đỏ 0 nghĩa là mọi số > 0 đều đỏ", () => {
    const mt = { huong: "giam", dich: 0, do: 0 };
    assert.equal(danhGia(0, mt), "dat");
    assert.equal(danhGia(1, mt), "do");
  });
  test("không đích → theo dõi; null → thiếu số", () => {
    assert.equal(danhGia(5, { huong: "tang", dich: null }), "theo");
    assert.equal(danhGia(null, { huong: "tang", dich: 1 }), "thieu");
  });
});

describe("bienDong", () => {
  test("đi ngược hướng tốt quá ngưỡng là xấu, trong ngưỡng thì không", () => {
    assert.equal(bienDong(90, 100, { huong: "tang" }, 5).xau, true);
    assert.equal(bienDong(97, 100, { huong: "tang" }, 5).xau, false);
    assert.equal(bienDong(110, 100, { huong: "giam" }, 5).xau, true);
  });
  test("từ 0 lên khi hướng giảm là xấu (pct không tính được)", () => {
    const b = bienDong(2, 0, { huong: "giam" });
    assert.equal(b.pct, null);
    assert.equal(b.xau, true);
  });
  test("thiếu hôm qua → null", () => assert.equal(bienDong(5, null, { huong: "tang" }), null));
});

describe("oBacGiam", () => {
  const r = (market_id, data_level, n, unit = "tin_le", property_type = "house") => ({ market_id, property_type, unit, data_level, n });
  test("tin rời ô (gắn căn) không tính là tụt", () => {
    const { nghi, roi } = oBacGiam([r("m", "B1", 200), r("m", "B0", 10)], [r("m", "B1", 70), r("m", "B0", 10)]);
    assert.equal(nghi.length, 0);
    assert.equal(roi.length, 1);
  });
  test("bậc trên co, bậc dưới tăng tương ứng → nghi tụt", () => {
    const { nghi } = oBacGiam([r("m", "B1", 200), r("m", "B0", 10)], [r("m", "B1", 150), r("m", "B0", 60)]);
    assert.equal(nghi.length, 1);
    assert.match(nghi[0].o, /m\|house\|tin_le\|≥B1/);
  });
  test("co nhỏ hơn ngưỡng tuyệt đối hoặc ô nhỏ → bỏ qua (nhiễu)", () => {
    assert.equal(oBacGiam([r("m", "B1", 500), r("m", "B0", 0)], [r("m", "B1", 490), r("m", "B0", 10)]).nghi.length, 0);
    assert.equal(oBacGiam([r("m", "B1", 30), r("m", "B0", 0)], [r("m", "B1", 0), r("m", "B0", 30)]).nghi.length, 0);
  });
});

// thang-bac-moi-b0-b5 (E6 · AC-6): hai ảnh chụp khác thang không so; NS1, NS1b đếm theo thang mới.
describe("TB-AC-6 đổi thang", () => {
  const s = (scale) => (market_id, unit, data_level, n, property_type = "apartment") => ({ market_id, property_type, unit, data_level, n, scale });
  const cu = s("thang-2310"), moi = s("thang-0811");
  const truoc = [cu("m", "can", "B2", 68543), cu("m", "tin_le", "B1", 1698), cu("m", "tin_le", "B0", 3459)];
  const sau = [moi("m", "tin_le", "B1", 75000), moi("m", "tin_le", "B0", 3459)];
  test("TB-AC-6 NS3 không so khác thang: không ô co lại hay rời ô, có dòng «đổi thang, không so»", () => {
    const o = oBacGiam(truoc, sau);
    assert.deepEqual([o.nghi, o.roi], [[], []], "TB-AC-6 đổi thang thành tụt");
    assert.deepEqual(o.doiThang, { truoc: "thang-2310", sau: "thang-0811" });
    const md = dungMarkdown({ ngay: "2026-11-12", doLuc: "07:30", mucTieuTrangThai: "de-xuat", homQuaNgay: null, bang: [], goiY: [], lat: null, oGiam: o });
    assert.match(md, /đổi thang \(thang-2310 → thang-0811\), không so/);
    // chiều đỏ: cùng hai ảnh chụp mà bỏ cột scale (luật cũ) → báo rời ô
    const bo = (rows) => rows.map(({ scale, ...x }) => x);
    const cuLuat = oBacGiam(bo(truoc), bo(sau));
    assert.ok(cuLuat.roi.length > 0 && !cuLuat.doiThang, "đối chứng: luật cũ phải đọc ô can co lại thành rời ô");
  });
  test("TB-AC-6 cùng thang vẫn so như cũ", () => {
    const o = oBacGiam([moi("m", "tin_le", "B1", 200, "house"), moi("m", "tin_le", "B0", 10, "house")],
      [moi("m", "tin_le", "B1", 100, "house"), moi("m", "tin_le", "B0", 20, "house")]);
    assert.equal(o.doiThang, undefined);
    assert.equal(o.roi.length, 1);
  });
  test("TB-AC-6 NS1 theo thang mới: 0 căn từ B3, không cộng dòng thang cũ (kèm chiều đỏ)", () => {
    assert.deepEqual(demNs1(sau), { NS1: 0, NS1b: 0 });
    // đối chứng dương: dòng thang mới từ B3 được đếm
    assert.deepEqual(demNs1([...sau, moi("m", "can", "B5", 2), moi("m", "can", "B3", 3, "house")]), { NS1: 5, NS1b: 5 });
    // dòng thang cũ ở B3 trở lên (căn = cụm properties của 23/10) không được cộng; dòng không ghi thang là thang cũ
    const lanCu = [cu("m", "can", "B5", 700), cu("m", "can", "B3", 40, "house"), { ...cu("m", "can", "B4", 9), scale: undefined }];
    assert.deepEqual(demNs1([...sau, ...lanCu]), { NS1: 0, NS1b: 0 });
    // chiều đỏ: bộ đếm bỏ cột thang (luật trước vòng này) cộng cả 749 đơn vị thang cũ
    const boThang = (rows) => demNs1(rows.map((r) => ({ ...r, scale: "thang-0811" })));
    assert.throws(() => assert.deepEqual(boThang([...sau, ...lanCu]), { NS1: 0, NS1b: 0 }, "TB-AC-6 NS1 cộng dòng thang cũ"),
      /TB-AC-6 NS1 cộng dòng thang cũ/);
  });
  test("TB-AC-6 một ảnh chụp: không so, không lỗi", () => {
    assert.deepEqual(oBacGiam([], sau), { nghi: [], roi: [] });
  });
});

describe("goiY và markdown", () => {
  const so = { NS3: 0, P1: 2, H1: 651, H1b: 0, C1: 0.11, Q1: 0, C4: 0 };
  const bang = chamBang(so, null, MT);
  test("bảng mục tiêu đề xuất → gợi ý cho Mạnh; độ tươi, thẻ chờ → cho điều phối", () => {
    const g = goiY(bang, { mucTieuTrangThai: "de-xuat", freshnessBad: ["S01/vn 354h>192h"] });
    assert.ok(g.some((x) => x.cho === "manh" && x.id === "MT"));
    assert.ok(g.some((x) => x.cho === "dieu-phoi" && x.id === "P1" && x.cau.includes("S01/vn")));
    assert.ok(g.some((x) => x.cho === "dieu-phoi" && x.id === "H1"));
    assert.ok(!g.some((x) => x.cho === "manh" && ["P1", "H1", "Q1"].includes(x.id)), "việc vận hành không đẩy lên Mạnh");
  });
  test("đã duyệt thì không còn gợi ý MT", () => {
    assert.ok(!goiY(bang, { mucTieuTrangThai: "da-duyet" }).some((x) => x.id === "MT"));
  });
  test("markdown có đủ phần và nhãn trạng thái mục tiêu", () => {
    const md = dungMarkdown({ ngay: "2026-11-07", doLuc: "07:30", mucTieuTrangThai: "de-xuat", homQuaNgay: null, bang, goiY: goiY(bang, { mucTieuTrangThai: "de-xuat" }), lat: null, oGiam: { nghi: [], roi: [] } });
    for (const h of ["## Lệch đích và tụt", "## Bảng số", "Cho Mạnh:", "Cho phiên điều phối:", "ĐỀ XUẤT, chưa duyệt"]) assert.ok(md.includes(h), h);
  });
  test("định dạng số và ngày", () => {
    assert.equal(fmt(0.00037), "0,00037");
    assert.equal(fmt(34121), "34.121");
    assert.equal(fmtNgay("2026-11-30"), "30/11");
  });
});

describe("bất biến của CLI", () => {
  const src = readFileSync(path.join(HERE, "bao-cao-ngay.mjs"), "utf8");
  test("mọi truy vấn trong giao dịch READ ONLY rồi ROLLBACK; không câu ghi nào", () => {
    assert.match(src, /BEGIN READ ONLY/);
    assert.match(src, /ROLLBACK/);
    assert.doesNotMatch(src, /\b(INSERT|UPDATE|DELETE|TRUNCATE|DROP|ALTER|CREATE)\s/);
  });
  test("SPL: không đọc tên nguồn thật; không gọi model", () => {
    assert.doesNotMatch(src, /real_name|source_ids/);
    assert.doesNotMatch(src, /gateway|anthropic|fetch\(/i);
  });
  test("mọi chỉ số trong muc-tieu.json có tên, nhóm, hướng", () => {
    for (const [id, mt] of Object.entries(MT.chi_so)) {
      assert.ok(mt.ten && mt.nhom && ["tang", "giam"].includes(mt.huong), id);
    }
    assert.ok(["de-xuat", "da-duyet"].includes(MT.trang_thai));
  });
});

describe("gom() trên DB local (chỉ đọc)", async () => {
  const require = createRequire(new URL("../app/package.json", import.meta.url));
  const pg = require("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  let ok = true;
  try {
    await client.connect();
  } catch {
    ok = false;
  }
  test("ra đủ số chính, không để giao dịch mở", { skip: !ok && "không kết nối được DB local" }, async () => {
    const { gom } = await import("./bao-cao-ngay.mjs");
    try {
      const kq = await gom(client);
      for (const id of ["NS1", "F3", "F5", "P1", "P2a", "H1", "Q1"]) assert.ok(id in kq.so, id);
      const [{ s }] = (await client.query("SELECT current_setting('transaction_read_only') s")).rows;
      assert.equal(s, "off", "gom() phải ROLLBACK, không để lại giao dịch chỉ đọc đang mở");
      assert.ok(kq.ngu.freshnessBad.every((x) => /^S0\d\//.test(x)), "độ tươi chỉ mang mã S0x");
    } finally {
      await client.end();
    }
  });
});

describe("ô đã biết và ngày thu trọn (07/11, liên lạc soát báo cáo ngày đầu)", async () => {
  const { tachDaBiet } = await import("./lib/bao-cao-ngay.mjs");
  const { ngayTron } = await import("./bao-cao-ngay.mjs");
  const cfg = [{ id: "P1", o: "S01/vn", ly_do: "đang thử", den: "2026-11-14" }];
  test("ô đã biết còn hạn không tính đỏ; hết hạn thì tính lại; khác chỉ số thì không áp", () => {
    const it = [{ nhan: "S01/vn" }, { nhan: "S06/hcmc" }];
    assert.deepEqual(tachDaBiet(it, "P1", cfg, "2026-11-07").tinh.map((x) => x.nhan), ["S06/hcmc"]);
    assert.equal(tachDaBiet(it, "P1", cfg, "2026-11-15").tinh.length, 2);
    assert.equal(tachDaBiet(it, "Q1", cfg, "2026-11-07").tinh.length, 2);
  });
  test("ngày d trọn khi lần thu cuối đã qua 00:00 giờ VN ngày d+1", () => {
    assert.equal(ngayTron("2026-11-06"), Date.parse("2026-11-06T17:00:00Z"));
    assert.ok(Date.parse("2026-11-06T07:05:00Z") < ngayTron("2026-11-06"), "thu 14:05 VN cùng ngày → chưa trọn");
  });
});
