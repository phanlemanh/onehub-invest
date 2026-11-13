// can-gia-cung-loai.test.tsx — hồ sơ can-gia-tot-cung-loai (CG8), AC-4: lời cho người khi thước là phường × loại hình.
// Hàm thuần, không DB. Ma trận viết trước: hai lý do mới, câu chứng minh theo nhãn loại, bốn ca cũ giữ chữ.
import { test } from "node:test";
import assert from "node:assert/strict";

import { cauChungMinh, lyDoRoi, thuocCua, type DealChiTiet } from "../src/lib/deals-chi-tiet";

const M = 100_000_000;
const can = (o: Partial<DealChiTiet>): DealChiTiet => ({
  offerId: "t", source: "S03", priceVnd: null, areaM2: 70, pricePerm2: 80_000_000, bedrooms: 2, phuong: "P", areaPath: null,
  medianPerm2: M, rulerN: 12, discountPct: 20, suspect: false, confidence: "high", firstSeen: "", lastSeen: "", nReposts: 0,
  sellerName: null, sellerPhone: null, groupName: null, brokerNAds: null, brokerMedianGap: null, propertyType: "apartment",
  block: null, floor: null, unit: null, streetNumber: null, street: null, district: null, images: [], ...o,
} as DealChiTiet);

const CHUA_RO = "Chưa rõ loại hình — không so được với thước cùng loại";

test("CG8-AC-4 lyDoRoi: tin chưa rõ loại hình (unknown, NULL)", () => {
  for (const t of ["unknown", null]) {
    assert.equal(lyDoRoi(can({ propertyType: t, medianPerm2: null, discountPct: null }), false), CHUA_RO, `loại ${t}`);
  }
});

test("CG8-AC-4 lyDoRoi: có loại mà phường thiếu thước cùng loại, nhãn từ LABELS_VI", () => {
  const ma: [string, string][] = [
    ["apartment", "căn hộ"], ["house", "nhà riêng"], ["land", "đất"], ["commercial", "mặt bằng"], ["room", "phòng"],
  ];
  for (const [t, nhan] of ma) {
    assert.equal(
      lyDoRoi(can({ propertyType: t, medianPerm2: null, discountPct: null }), false),
      `Phường chưa đủ tin ${nhan} để dựng thước`,
      `loại ${t}`,
    );
  }
});

test("CG8-AC-4 cauChungMinh nói thước <loại> cùng phường", () => {
  assert.match(cauChungMinh(can({ propertyType: "apartment" }))!, /thước căn hộ cùng phường/);
  assert.match(cauChungMinh(can({ propertyType: "house" }))!, /thước nhà riêng cùng phường/);
  assert.match(cauChungMinh(can({ propertyType: "land", discountPct: -10, pricePerm2: 110_000_000 }))!, /^Đắt hơn thước đất cùng phường 10 tr\/m²/);
  assert.equal(thuocCua("apartment"), "thước căn hộ cùng phường");
});

test("CG8-AC-4 bốn ca cũ của lyDoRoi giữ chữ", () => {
  assert.equal(lyDoRoi(can({}), true), "Tin quá 45 ngày chưa thấy lại");
  assert.equal(lyDoRoi(can({ discountPct: -12.5 }), false), "Đắt hơn thước phường 12.5%, không phải căn giá tốt");
  assert.equal(lyDoRoi(can({ discountPct: 3 }), false), "Giảm 3%, dưới ngưỡng 5%");
  assert.equal(lyDoRoi(can({ discountPct: 55 }), false), "Giảm 55%, trên ngưỡng 50%");
  assert.equal(lyDoRoi(can({}), false), null);
});
