// khuon-mau-ocp1.mjs — PL8 `tap-nhan-mau-ocp1`: thư viện khuôn tin mẫu của lát OCP1.
// Spec: docs/superpowers/specs/2026-10-30-tap-nhan-mau-ocp1-design.md. Bộ sinh: lib/tap-mau.mjs.
//
// Mỗi khuôn là khung câu rút từ MỘT tin S03 thật của lát; `goc` = textHash (lib/eval-labels.mjs) của tin ấy — băm, không
// chép chữ tin. Khung đã bỏ SĐT, URL, tên người, tên nhóm và các chữ số dễ đọc nhầm thành giá/diện tích; giá trị thay
// bằng ô `{gia}` `{dt}` `{pn}` `{toa}` `{du_an}` `{sdt}`. Phép đo AC-5 (probes/db.mjs) đối chiếu khung với tin gốc.
//
// Nhãn cố định của khuôn theo bảng trường của PL7. Quy ước loại hình: chữ có «căn hộ»/«CHCC», hoặc mã toà chung cư của dự
// án (PR1, LD2, BE1…) kèm số phòng ngủ → apartment; «biệt thự» → house; «shop chân đế» → commercial. Tin không phải tin
// rao (not_listing) không có ô nào: mọi trường trừ ý định là «tin không nêu».

/** @typedef {{ id: string, goc: string, listing_intent: string, kind: string|null, property_type: string|null, khung: string }} Khuon */

const DS = [
  // offer × sale
  { id: "K01", goc: "797a6745170f0711bf18e3c4ed31466aff817316b83b07875ddbb2c56d821116", listing_intent: "offer", kind: "sale", property_type: "apartment",
    khung: "⛔️ BÁN {pn} ,Căn {toa} Dt {dt}\n✳️ Giá bán: {gia} thu về\n✳ Hướng : TN\n✳️ Tình trạng : TTTĐ 2 năm" },
  { id: "K02", goc: "0987329290917c67bff45a77b6a817f66731171a944955fa157218101d109463", listing_intent: "offer", kind: "sale", property_type: "apartment",
    khung: "Bán CHCC {pn} {dt} {du_an}, view hồ, tổng {gia}. LH {sdt}" },
  { id: "K03", goc: "7017403b9b853b5c91f201738c9f4825a12ce953bff7dfdb315b61d1f61e64c9", listing_intent: "offer", kind: "sale", property_type: "apartment",
    khung: "🍀 Bán {pn} {toa} giá cực rẻ\n🏡{dt}\n✔️Giá bán: {gia}\n✔️Hướng: Đông Bắc\n✔️View: Hồ điều hoà Gia Lâm" },
  { id: "K04", goc: "f79e38a6dfd871c5a20d434c898240bc9d49ebab6824772eddf8c9fb40ffed13", listing_intent: "offer", kind: "sale", property_type: "apartment",
    khung: "Toà: {toa}\nLoại căn: {pn}\nHướng: ĐB\nDT: {dt}\nNội thất: NB CĐT\nGiá bán: {gia} bao thuế phí\nThông tin: Đã nhận nhà" },
  { id: "K05", goc: "bd3b6dbcd290f9c514b15ef85d55453d70406436240f62320185c8ed4b2dfb19", listing_intent: "offer", kind: "sale", property_type: "apartment",
    khung: "⛔ CẮT LỖ căn {pn} GÓC, {toa}- CĂN ĐẸP NHẤT KHU {du_an}!\n💰 Giá: {gia} (thu về)\n📐 DT: {dt}\n🧭 Hướng: Đông Nam - Đông Bắc\n🛋 Nội thất: NB CĐT" },
  // offer × rent_lt
  { id: "K06", goc: "2573cb0d52f499d830b1db7df41b93932e36c25acc57b317f6a1601d3207b48d", listing_intent: "offer", kind: "rent_lt", property_type: "apartment",
    khung: "🌿 CHO THUÊ CĂN HỘ {du_an} - {toa}\n🌿 {pn} + 2 WC \" Full nội thất\" Tầng 19\n💰  Giá thuê: {gia} \"không bao phí\"\n🏡 Hợp đồng: 1 năm - thanh toán 3 cọc 1\n☎  Lh {sdt}" },
  { id: "K07", goc: "90fef34934fe79c1226fed94ecb859e8d139c1c269e4a510f4705812cf6f2fd0", listing_intent: "offer", kind: "rent_lt", property_type: "apartment",
    khung: "Cho thuê {pn} {dt} ĐN toà {toa}  Full nội thất, ngoài đẹp hơn ảnh Giá: {gia} kbp, đóng 2 cọc 1" },
  { id: "K08", goc: "2a081d1fbc0f56729474c83f54f778de46496fec574bf9c6b6f9182aca6dca86", listing_intent: "offer", kind: "rent_lt", property_type: "apartment",
    khung: "Cho thuê {pn} góc {gia} kbp toà {toa}. Ib {sdt}" },
  { id: "K09", goc: "0c0a320a64c1d176ef55156e5792dcbb8713dd7ae481c05278839ad9056d56b7", listing_intent: "offer", kind: "rent_lt", property_type: "apartment",
    khung: "Cho thuê 🥰😍\n🏡 Toà: {toa}\n🏡 Loại căn: {pn}\n🏡 Nội thất: full \n🏡 Giá thuê: {gia}\n🏡 Bao phí: có\n🏡 Hợp đồng: 1 năm 3 cọc 1\n🏡 Xem nhà: hẹn trước \n🏡 Vào ở: vào luôn" },
  { id: "K10", goc: "ad6d2ded726eb88b3c95254323e6726bedf3ca2ae3d0c5d5e9af4d1636bb0cfd", listing_intent: "offer", kind: "rent_lt", property_type: "house",
    khung: "💥CHO THUÊ CĂN BIỆT THỰ {du_an}\nHoàn thiện 4 tầng 1 tum\nCó thang máy\nGiá chỉ: {gia} bao phí" },
  { id: "K11", goc: "74fbe6f1af5839fd5d4ec4ae574e0e42fb2220d97c7bebc117f21147e432e6c9", listing_intent: "offer", kind: "rent_lt", property_type: "commercial",
    khung: "Cho thuê shop chân đế tại {du_an} {dt} giá thuê {gia} ibox em nhé" },
  // inquiry × sale
  { id: "K12", goc: "cc71c81114760b7878355c4dbd0c757d92734f7d2e2370f69c62704db25067bc", listing_intent: "inquiry", kind: "sale", property_type: "apartment",
    khung: "khách  nét tìm mua căn {pn} toà {toa}, tài chính {gia}. Ace có hàng nhắn mình nhé" },
  { id: "K13", goc: "dfe3be46363f0fea05becbdb44554b5e14ef19b632ca70709c745c2ceb499acd", listing_intent: "inquiry", kind: "sale", property_type: "apartment",
    khung: "Khách nét tìm mua căn {pn} tòa {toa}, khoảng tầng 10 -15. Ace có hàng nhắn mình nha" },
  { id: "K14", goc: "be0ab9273eec9143ca57a00c581b061d4766804551375c1795438b65c40fd83b", listing_intent: "inquiry", kind: "sale", property_type: "apartment",
    khung: "✅ Khách nét cần mua căn hộ {pn} {du_an} để ở. \nK quan trọng tầng, hướng, view\nƯu tiên giá tốt\nAce có căn ib" },
  // inquiry × rent_lt
  { id: "K15", goc: "82f72c9e3ab4a9d4946aed7500259e73a12b5081710414ed3ebe5a53a3864957", listing_intent: "inquiry", kind: "rent_lt", property_type: "apartment",
    khung: "E cần tìm thuê gấp cho khách căn hộ {pn} full đồ đẹp tc {gia} ạ" },
  { id: "K16", goc: "33f4139a4111056915a97578b22f0da43ae38ddf9c2ac370dab81ea82cf0749c", listing_intent: "inquiry", kind: "rent_lt", property_type: "apartment",
    khung: "Khách tìm thuê {pn} nguyên bản toà {toa} view thoáng tầng 10 trở lên." },
  { id: "K17", goc: "ad0838771d218d53fad9781ef133bb70a2a1b78ca10b610c6764f8afe0b33ba0", listing_intent: "inquiry", kind: "rent_lt", property_type: "apartment",
    khung: "Khách quen tìm thuê căn hộ {pn} {du_an} full đồ đẹp vào ở được luôn . Ac có hàng nhắn e với ạ" },
  // not_listing
  { id: "K18", goc: "a0d050a0cde17b01599b0c9b739ec096dae6ca7874b9025c4b301542f539a938", listing_intent: "not_listing", kind: null, property_type: null,
    khung: "Bác nào chủ nhà join gr chủ nhà nhé. Em tạo để cbi đi nhận nhà" },
  { id: "K19", goc: "4f85ba89e08f814bdb602ecc7ff872f5b8c4b47f237ad5a405f37c672e55796e", listing_intent: "not_listing", kind: null, property_type: null,
    khung: "Truy cập link để tham gia nhóm\nBấm vào đây để tham gia nhóm" },
];

/** @type {readonly Khuon[]} */
export const KHUON = Object.freeze(DS.map(Object.freeze));

/** Bể giá trị của từng ô. Giá bán theo triệu (phần lẻ ≥ 150 triệu, bước 50 — dạng «x tỷ y» luôn đọc một nghĩa); giá
 *  thuê theo nghìn; diện tích theo phần mười m²; toà là mã công khai của dự án lấy từ chữ tin của lát. */
export const BE = Object.freeze({
  gia_ban: Object.freeze(Array.from({ length: 6 * 17 }, (_, i) => (1 + Math.floor(i / 17)) * 1000 + 150 + (i % 17) * 50)),
  gia_thue: Object.freeze([5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 10000, 10500, 11000, 12000, 13000, 14000, 15000, 18000, 20000, 25000]),
  gia_khoang: Object.freeze([100, 150, 200, 300]),
  dt: Object.freeze(Array.from({ length: 93 }, (_, i) => (28 + i) * 10).flatMap((x) => [x, x + 5])),
  pn: Object.freeze([1, 2, 3]),
  toa: Object.freeze(["PR1", "PR2", "PR5", "PR6", "LD2", "LD3", "BE1", "BE2", "BE4", "M3", "S1", "S2", "H2"]),
  du_an: Object.freeze(["Ocean Park 1", "OCP1", "Vinhomes Ocean Park"]),
  sdt: "09xx xxx xxx",
});
