import assert from "node:assert/strict";
import { test } from "node:test";

import { firstSeenVi, offerSpecs } from "../src/components/listing/offer-card";
import type { PublicOffer } from "../src/lib/offers-filters";

const offer = (o: Partial<PublicOffer>) =>
  ({ propertyType: "apartment", areaM2: 62, bedrooms: null, bathrooms: null, stories: null, frontageLength: null, ...o }) as PublicOffer;

test("TR-AC-8 thông số theo loại hình, trường thiếu thì bỏ", () => {
  const bang: [Partial<PublicOffer>, string[]][] = [
    [{ bedrooms: 2, bathrooms: 2 }, ["Căn hộ", "62 m²", "2 PN", "2 WC"]],
    [{ bedrooms: 2 }, ["Căn hộ", "62 m²", "2 PN"]],
    [{ propertyType: "house", areaM2: 30, stories: 6, bedrooms: 3, bathrooms: 2 }, ["Nhà riêng", "30 m²", "6 tầng", "3 PN"]],
    [{ propertyType: "land", areaM2: 65, frontageLength: 4.5, bedrooms: 1 }, ["Đất", "65 m²", "Mặt tiền 4,5 m"]],
    [{ propertyType: "land", areaM2: 65 }, ["Đất", "65 m²"]],
    [{ propertyType: "commercial", areaM2: 190 }, ["Mặt bằng", "190 m²"]],
  ];
  for (const [o, ra] of bang) assert.deepEqual(offerSpecs(offer(o)), ra);
});

test("TR-AC-8 tuổi tin nói «thấy», không nói «đăng»", () => {
  assert.equal(firstSeenVi(0), "Thấy từ hôm nay");
  assert.equal(firstSeenVi(1), "Thấy từ hôm qua");
  assert.equal(firstSeenVi(14), "Thấy từ 14 ngày trước");
});
