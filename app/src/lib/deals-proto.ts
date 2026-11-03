// BẢN MẪU design-pass CG1: dữ liệu bịa, không lên main. Xoá ở S3.
import type { DealChiTiet } from "./deals-chi-tiet";

const anh = (mau: string, chu: string) => ({
  src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="640" height="420" fill="${mau}"/><text x="320" y="215" font-family="sans-serif" font-size="26" fill="#fff" text-anchor="middle">${chu}</text></svg>`)}`,
  origin: "proxy" as const,
  expiring: false,
});
const goc = {
  source: "S03", confidence: "medium", firstSeen: "2026-10-28T03:00:00Z", lastSeen: "2026-11-02T03:00:00Z", nReposts: 2, roiDanhSach: null,
  sellerName: "Người Bán Mẫu", sellerPhone: "+84900000001", groupName: "Nhóm mẫu BĐS", mediaPath: null, mediaUrl: null,
  postText: null, brokerNAds: 4, brokerMedianGap: 12, areaPath: "/vn/hanoi", suspect: false,
};
export const PROTO: DealChiTiet[] = [
  {
    ...goc, offerId: "proto-du", priceVnd: 5.2e9, areaM2: 74, pricePerm2: 70.3e6, bedrooms: 2, phuong: "Phường Mẫu A",
    medianPerm2: 90.1e6, rulerN: 41, discountPct: 22, propertyType: "apartment", block: "Toà M2", floor: "12", unit: "1208",
    streetNumber: null, street: "Đường Mẫu", district: "Quận Mẫu",
    images: [anh("#475569", "Ảnh mẫu 1"), anh("#64748b", "Ảnh mẫu 2"), anh("#334155", "Ảnh mẫu 3"), anh("#52525b", "Ảnh mẫu 4")],
    postTextFull: "Chính chủ cần bán gấp căn góc 74m2, 2 ngủ 2 vệ sinh, ban công Đông Nam, nội thất cơ bản.\nSổ đỏ lâu dài, phí dịch vụ thấp.\nGiá 5,2 tỷ còn thương lượng. Xem nhà buổi tối sau 18h.",
  },
  {
    ...goc, offerId: "proto-thieu", source: "S05", priceVnd: 3.1e9, areaM2: 62, pricePerm2: 50e6, bedrooms: null, phuong: "Phường Mẫu B",
    medianPerm2: 71.4e6, rulerN: 8, discountPct: 30, propertyType: "unknown", block: null, floor: null, unit: null,
    streetNumber: null, street: null, district: null, images: [],
    postTextFull: "Cần bán nhà, liên hệ em để biết thêm.", sellerName: null, brokerNAds: null, brokerMedianGap: null,
  },
  {
    ...goc, offerId: "proto-roi", priceVnd: 4e9, areaM2: 70, pricePerm2: 57e6, bedrooms: 2, phuong: "Phường Mẫu D",
    medianPerm2: 60e6, rulerN: 12, discountPct: 4, roiDanhSach: "Giảm còn 4%, dưới ngưỡng 5%", propertyType: "apartment", block: "Toà P", floor: null, unit: null,
    streetNumber: null, street: null, district: null, images: [anh("#475569", "Ảnh mẫu 1")], postTextFull: "Bán căn 2 ngủ, giá đã điều chỉnh.",
  },
  {
    ...goc, offerId: "proto-can-xac-minh", priceVnd: 2.4e9, areaM2: 60, pricePerm2: 40e6, bedrooms: 2, phuong: "Phường Mẫu C",
    medianPerm2: 62.5e6, rulerN: 15, discountPct: 36, suspect: true, propertyType: "apartment", block: "Toà K", floor: null, unit: null,
    streetNumber: null, street: null, district: null, images: [anh("#57534e", "Ảnh mẫu 1"), anh("#44403c", "Ảnh mẫu 2")],
    postTextFull: "Bán căn 2 ngủ tầng trung, giá tốt nhất khu.",
  },
];

// 30 căn bịa để đo mật độ của bảng: trộn đủ, thiếu, cần xác minh; S0x là mã, không có tên thật.
const PHUONG = ["Phường Mẫu A", "Phường Mẫu B", "Phường Mẫu C", "Phường Mẫu D", "Phường Mẫu E"];
const MAU = ["#475569", "#64748b", "#334155", "#52525b", "#57534e"];
export const PROTO_BANG: DealChiTiet[] = Array.from({ length: 30 }, (_, i) => {
  const dt = 48 + ((i * 7) % 62);
  const giam = 5 + ((i * 13) % 44);
  const thuoc = (58 + ((i * 13) % 50)) * 1e6;
  const m2 = thuoc * (1 - giam / 100);
  const coToa = i % 3 !== 1;
  const coAnh = i % 5 !== 2;
  const loai = i % 6 === 5 ? "unknown" : i % 6 === 2 ? "house" : "apartment";
  return {
    ...goc, offerId: `proto-${String(i + 1).padStart(2, "0")}`, source: i % 3 === 2 ? "S05" : "S03",
    priceVnd: Math.round((m2 * dt) / 1e8) * 1e8, areaM2: dt, pricePerm2: m2, bedrooms: dt > 95 ? 3 : dt > 60 ? 2 : 1,
    phuong: i === 29 ? "Phường Mẫu F" : PHUONG[i % 3], medianPerm2: thuoc, rulerN: 6 + ((i * 9) % 58), discountPct: giam, suspect: giam > 35,
    propertyType: loai, block: coToa ? `Toà M${(i % 6) + 1}` : null, floor: coToa ? String(3 + (i % 20)) : null,
    unit: i % 4 === 0 ? String(1000 + i * 7) : null, streetNumber: null, street: null, district: "Quận Mẫu",
    images: coAnh ? [anh(MAU[i % 5], "Ảnh mẫu 1"), anh(MAU[(i + 1) % 5], "Ảnh mẫu 2"), anh(MAU[(i + 2) % 5], "Ảnh mẫu 3")] : [],
    postTextFull: `Bán căn ${dt}m2, sổ lâu dài, thiện chí bán. Xem nhà buổi tối sau 18h.`,
    sellerName: i % 7 === 6 ? null : `Người Bán Mẫu ${(i % 9) + 1}`,
    sellerPhone: `+849000000${String((i % 89) + 10)}`, brokerNAds: 1 + ((i * 5) % 11), nReposts: 1 + (i % 4),
    firstSeen: new Date(Date.UTC(2026, 9, 3 + i, 3)).toISOString(),
  };
}).sort((a, b) => Number(a.suspect) - Number(b.suspect) || b.discountPct - a.discountPct);
