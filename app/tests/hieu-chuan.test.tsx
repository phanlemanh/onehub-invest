// hieu-chuan.test.tsx — hồ sơ hieu-chuan-mot-bo-so (ON10): vùng «Hiệu chuẩn» của /ops/quality.
// Hàm thuần bằng ma trận viết trước; truy vấn chạy ĐÚNG ba hàm của trang trên fixture trong BEGIN…ROLLBACK
// (Postgres local :5433, khoá 33033); thẻ/bảng vẽ trong jsdom.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isEmptyComparison,
  isThin,
  pickRepresentative,
  splitCalibrated,
  TU_THU_DINH_NGHIA,
} from "../src/lib/calibration";
import type { AirdnaComparison } from "../src/lib/queries";

// ---- Hàm thuần ----

test("HC-AC-1 market đại diện", () => {
  const pick = (ms: [string, number | null][]) => pickRepresentative(ms.map(([airdnaId, listingCount]) => ({ airdnaId, listingCount })));
  assert.deepEqual(pick([["10", 10], ["3", 3]]), { airdnaId: "10", ofMarkets: 2 }, "nhiều listing nhất");
  assert.deepEqual(pick([["7", 5], ["12", 5]]), { airdnaId: "7", ofMarkets: 2 }, "hoà → mã nhỏ hơn (so số)");
  assert.deepEqual(pick([["1", 0], ["2", 7]]), { airdnaId: "2", ofMarkets: 2 }, "market rỗng cạnh market có listing");
  assert.deepEqual(pick([["1", null], ["2", 2]]), { airdnaId: "2", ofMarkets: 2 }, "chưa có số coi là 0");
  assert.deepEqual(pick([["a9", 4], ["a10", 4]]), { airdnaId: "a10", ofMarkets: 2 }, "mã chữ so chuỗi");
  assert.deepEqual(pick([["5", 1]]), { airdnaId: "5", ofMarkets: 1 }, "một market");
  assert.equal(pick([]), null, "không market");
  // Thứ tự đầu vào không đổi kết quả (chạy hai lần ra cùng số).
  assert.deepEqual(pick([["3", 3], ["10", 10]]), pick([["10", 10], ["3", 3]]), "đảo thứ tự");
});

test("HC-AC-4 mẫu mỏng", () => {
  const table: [number | null, boolean][] = [[0, true], [1, true], [4, true], [5, false], [6, false], [null, false]];
  for (const [n, want] of table) assert.equal(isThin(n), want, `isThin(${n})`);
});

/** Một thẻ so sánh với các số cho trước (null = trống). */
function cmp(o: { score?: number | null; adr?: [number | null, number | null]; occ?: [number | null, number | null]; listing?: [number | null, number | null] }): AirdnaComparison {
  const m = (metric: string, v: [number | null, number | null] | undefined, unit: string) => ({
    metric, ourValue: v?.[0] ?? null, ourUnit: unit, airdnaValue: v?.[1] ?? null, airdnaUnit: unit, ratio: null,
  });
  return {
    marketScore: o.score === undefined || o.score === null ? null : { total: o.score, seasonality: 0, revenueGrowth: 0, regulation: 0, rentalDemand: 0 },
    metrics: [m("ADR", o.adr, "VND"), m("Công suất", o.occ, "%"), m("Listing tự thu", o.listing, "")],
    submarketCount: 0,
    capturedAt: null,
    representative: { airdnaId: "1", ofMarkets: 1 },
    ourListings: o.listing?.[0] ?? 0,
    sampleListings: null,
  };
}

const NAM_THI_TRUONG = () => [
  { market: { id: "vn-a", name: "Thành phố Đủ Số" }, data: cmp({ score: 80, adr: [900000, 1000000], occ: [0.5, 0.6], listing: [20, 300] }) },
  { market: { id: "vn-b", name: "Tỉnh Chỉ Điểm" }, data: cmp({ score: 61 }) },
  { market: { id: "vn-c", name: "Tỉnh Chỉ Tự Thu" }, data: cmp({ listing: [3, null] }) },
  { market: { id: "vn-d", name: "Tỉnh Trống Hết" }, data: null },
  { market: { id: "vn-e", name: "Tỉnh Toàn Không" }, data: cmp({ score: 0, adr: [0, 0], occ: [0, 0], listing: [0, 0] }) },
];

test("HC-AC-5 gộp thị trường chưa có số", () => {
  assert.equal(isEmptyComparison(null), true);
  assert.equal(isEmptyComparison(cmp({ score: 0, adr: [0, 0], occ: [0, 0], listing: [0, 0] })), true, "toàn 0 là chưa có số");
  assert.equal(isEmptyComparison(cmp({ score: 61 })), false, "chỉ điểm vẫn có số");
  const cal = splitCalibrated(NAM_THI_TRUONG());
  assert.deepEqual(cal.calibrated.map((c) => c.market.id), ["vn-a", "vn-b", "vn-c"]);
  assert.deepEqual(cal.empty, ["Trống Hết", "Toàn Không"], "tên ngắn của thị trường chưa có số");
  // Chiều đỏ: bộ lọc cũ của trang giữ cả thị trường toàn 0.
  assert.equal(NAM_THI_TRUONG().filter((c) => c.data !== null).length, 4, "đối chứng bộ lọc cũ");
});

test("HC-AC-6 đếm", () => {
  assert.equal(splitCalibrated(NAM_THI_TRUONG()).label, "3 thị trường hiệu chuẩn");
});

test("HC-AC-3 câu định nghĩa nguyên văn", () => {
  assert.equal(TU_THU_DINH_NGHIA, "Listing tự thu: số listing đang theo dõi trong cả khu vực (gồm phường con)");
});
