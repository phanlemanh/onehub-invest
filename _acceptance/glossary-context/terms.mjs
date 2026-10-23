// Nguồn dữ liệu DUY NHẤT của bảng chốt thuật ngữ (bang-chot.html) và của CONTEXT.md.
// Sửa thuật ngữ ở đây rồi chạy `node _acceptance/glossary-context/build.mjs`.
// Thuật ngữ có `choice` là chỗ Mạnh chọn; `vn` giữ phương án khuyến nghị cho tới khi chốt.
//
// Trường:
//   vn     nhãn tiếng Việt chuẩn (UI, văn xuôi, tiêu chí hợp đồng) — đầu khối `**…**:` của CONTEXT.md
//   code   tên trong code/API (tiếng Anh; RESO khi có)
//   reso   field/resource RESO Data Dictionary 2.0 tương ứng, hoặc lý do không có
//   slug   đoạn URL tiếng Anh của trang (nếu là trang)
//   old    slug tiếng Việt đang chạy → slug đích (đổi trong đợt dọn nhóm trang, kèm redirect vĩnh viễn)
//   def    định nghĩa 1–2 câu; chỉ số kèm công thức
//   avoid  tên lệch đã loại (_Avoid_)
//   use    khoá đếm trong do-ten-2026-10-23.json (số file đang dùng)

export const MEASURED = "2026-10-23 trên main f51b01c";

export const GROUPS = [
  ["geo", "Địa lý"],
  ["asset", "Tài sản & tin"],
  ["price", "Giá"],
  ["metric", "Chỉ số"],
  ["strategy", "Chiến lược đầu tư"],
  ["data", "Dữ liệu & nguồn"],
  ["portal", "Cổng & tính năng"],
];

export const TERMS = [
  // ---------------------------------------------------------------- Địa lý
  {
    group: "geo", vn: "Quốc gia", code: "country", reso: "Country (ISO 3166-1)",
    slug: ["vn"], slugNote: "mã quốc gia, đoạn động [country]",
    def: "Cấp gốc của cây khu vực (`areas.region_type = country`). Phạm vi sản phẩm hiện chỉ có Việt Nam (ADR-0008).",
    avoid: ["nước"], use: ["country", "quốc gia"],
  },
  {
    group: "geo", vn: "Thị trường", code: "market", reso: "StateOrProvince (ISO 3166-2:VN)",
    slugNote: "tên riêng không dấu, đoạn động [market] (vd. hanoi)",
    def: "Một tỉnh/thành phố trực thuộc trung ương — cấp `areas.region_type = market` (34 đơn vị sau sáp nhập 2025). Là đơn vị Finder xếp hạng và trang Insight trình bày.",
    avoid: ["tỉnh thành", "thành phố", "city", "province"],
    use: ["market", "markets", "thị trường", "tỉnh", "tỉnh/thành", "thành phố", "city", "province"],
    choice: {
      q: "Q1", title: "Nhãn UI cho cấp `market`",
      options: [
        { label: "Thị trường", note: "đang dùng 50 file, nav \"Thị trường\", tiêu đề Finder \"Thị trường Việt Nam\"; khớp tên code" },
        { label: "Tỉnh/thành", note: "đúng tên hành chính; phải đổi nav, tiêu đề và mọi câu \"thị trường này\"" },
      ],
      rec: 0, why: "Ít đổi nhất, khớp code `market`; định nghĩa đã nói rõ đó là một tỉnh/thành.",
    },
  },
  {
    group: "geo", vn: "Phường", code: "submarket", reso: "không có cấp phường — gần City (mappings.yaml)",
    slugNote: "tên riêng không dấu, đoạn động [submarket]",
    def: "Đơn vị hành chính cấp xã (phường, xã, đặc khu) — cấp `areas.region_type = submarket`, con trực tiếp của thị trường. Trang hiện tên riêng (\"Xã Bát Tràng\"), nhãn chung ghi \"Phường\".",
    avoid: ["quận", "quận/huyện", "huyện", "ward", "tiểu thị trường"],
    use: ["submarket", "submarkets", "phường", "phường/xã", "xã", "quận", "quận/huyện", "ward", "district"],
    choice: {
      q: "Q2", title: "Nhãn UI cho cấp `submarket`",
      options: [
        { label: "Phường", note: "72 file; ngắn, vừa ngân sách nhãn 1–2 chữ; định nghĩa phủ cả xã" },
        { label: "Phường/xã", note: "đúng pháp lý; UI đang có \"Phường / xã\" ở 5 chỗ; dài hơn trong cột, nút" },
      ],
      rec: 0, why: "Trang luôn hiện tên riêng có tiền tố (Phường…/Xã…), nên nhãn chung ngắn không gây hiểu sai.",
    },
    note: "Cấp huyện đã bỏ từ 07/2025: \"quận\" chỉ còn trong dữ liệu thô (`district_raw`).",
  },
  {
    group: "geo", vn: "Khu vực", code: "area", reso: "Country / StateOrProvince / City tuỳ cấp",
    def: "Một nút bất kỳ của cây địa lý (`areas`, khoá `area_id`, vd. `vn-hanoi-tay-ho`): quốc gia, thị trường hoặc phường. Dùng khi câu nói về mọi cấp (So sánh, Đã lưu).",
    params: ["area", "areas"], avoid: ["địa bàn", "region"], use: ["area", "areas", "khu vực", "địa bàn"],
    note: "Tham số URL `area` luôn là mã khu vực địa lý — diện tích căn dùng `livingArea`.",
  },
  {
    group: "geo", vn: "Khu đô thị", code: "project", reso: "SubdivisionName",
    def: "Đại đô thị một chủ đầu tư phát triển (Ocean Park, Ecopark) — `asset_nodes.node_type = project`. Trục song song với khu vực, không thay phường (ADR-0011 Qđ 2).",
    avoid: ["dự án", "đại đô thị"], use: ["project", "khu đô thị", "dự án"],
  },
  {
    group: "geo", vn: "Phân khu", code: "subzone", reso: "không có — local extension (ADR-0011)",
    def: "Một phần/phase trong khu đô thị (Sapphire, The Rainbow) — `node_type = subzone`. Tên phân khu trùng giữa các khu đô thị nên chỉ resolve qua matcher 2 tầng.",
    avoid: ["dự án con", "phase"], use: ["subzone", "phân khu"],
  },
  {
    group: "geo", vn: "Tòa nhà", code: "building", reso: "ComplexName",
    def: "Một tòa chung cư (S1.03, BE02) — `node_type = building`; mã tòa thô trong tin nằm ở `block_raw`.",
    avoid: ["block", "chung cư"], use: ["building", "tòa", "tòa nhà", "chung cư"],
  },

  // ---------------------------------------------------------------- Tài sản & tin
  {
    group: "asset", vn: "Căn nhà", code: "property", reso: "resource Property",
    def: "\"Một Căn Nhà\" — đơn vị phân tích của nền tảng (bảng `properties`); nhiều tin rao từ nhiều nguồn gộp về một căn, nguồn chỉ là bằng chứng (ROADMAP §1.7).",
    avoid: ["tài sản", "bất động sản", "BĐS", "asset"],
    use: ["property", "properties", "Một Căn Nhà", "căn nhà", "tài sản", "asset", "BĐS", "bất động sản"],
    note: "`asset_nodes` là cây khu đô thị/tòa, không phải căn nhà — vì thế \"asset\" bị loại.",
  },
  {
    group: "asset", vn: "Listing", code: "listing", reso: "không có mô hình STR — local extension (reso-standards.md)",
    slug: ["listings", "listing"], slugNote: "`/[country]/[market]/listings` danh sách · `/listing/[id]` chi tiết",
    def: "Một chỗ cho thuê ngắn hạn tự thu (bảng `listings`, id `abnb_…`): nguyên căn hoặc phòng riêng, có lịch đêm và giá niêm yết.",
    avoid: ["chỗ ở", "phòng cho thuê"],
    use: ["listing", "listings", "chỗ ở", "homestay"],
    choice: {
      q: "Q3", title: "Nhãn UI cho listing cho thuê ngắn hạn (menu đang ghi \"Listing\")",
      options: [
        { label: "Listing", note: "79 file; thuật ngữ ngành như ADR/RevPAR; portals.md §4 đã cố định" },
        { label: "Chỗ ở", note: "tiếng Việt, phủ cả phòng riêng; nhưng mơ hồ với người đọc là nhà đầu tư" },
      ],
      rec: 0, why: "\"Căn\" sai với listing phòng riêng, \"chỗ ở\" mơ hồ; giữ \"Listing\" như ADR/RevPAR và đổi cùng nhóm nếu Q5 Việt hoá.",
    },
  },
  {
    group: "asset", vn: "Tin rao", code: "sale_offer", reso: "Property + ListPrice; bán/thuê qua PropertyType",
    def: "Một tin bán hoặc cho thuê dài hạn đã chuẩn hoá (bảng `sale_offers`, khoá `offer_id` = hash nguồn + id gốc). Loại tin ở cột `kind`.",
    avoid: ["tin đăng", "offer", "rao vặt", "sale offer"],
    use: ["sale_offers", "offer", "offers", "tin rao", "tin đăng", "rao vặt"],
    choice: {
      q: "Q4", title: "Tên tiếng Việt cho `sale_offers`",
      options: [
        { label: "Tin rao", note: "8 file; khớp \"giá rao\" của pipeline 4 giai đoạn" },
        { label: "Tin đăng", note: "4 file; chữ phổ thông hơn" },
      ],
      rec: 0, why: "Cặp \"tin rao / giá rao\" nói đúng bản chất: giá người bán rao, chưa phải giá giao dịch.",
    },
  },
  {
    group: "asset", vn: "Tin bán", code: "kind = sale", reso: "PropertyType ∈ Residential, Land, ResidentialIncome",
    def: "Tin rao có `kind = sale`.", avoid: [], use: ["tin bán", "mua bán"],
  },
  {
    group: "asset", vn: "Tin cho thuê", code: "kind = rent_lt", reso: "PropertyType = ResidentialLease + LeaseAmountFrequency = Monthly",
    def: "Tin rao cho thuê dài hạn, giá theo tháng (`kind = rent_lt`).", avoid: [], use: ["tin cho thuê", "rent_lt"],
  },
  {
    group: "asset", vn: "Căn giá tốt", code: "deal", reso: "không có — chỉ số nội bộ",
    slug: ["deals"], slugNote: "`/ops/deals`",
    def: "Tin rao giá nội bộ (P1) có giá/m² thấp hơn thước giá cùng phường và loại hình. Chỉ ở cổng Ops vì kèm liên hệ người bán (tầng A).",
    avoid: ["deal tốt", "kèo"], use: ["deal", "deals", "căn giá tốt", "deal tốt"],
  },
  {
    group: "asset", vn: "Người bán", code: "seller", reso: "resource Member; `seller_phone_hash` ≈ ULI",
    def: "Người đăng tin rao — chủ hoặc môi giới, không tự suy vai. Định danh xuyên nguồn bằng hash SĐT; SĐT thô là tầng A.",
    avoid: ["chủ nhà", "broker"], use: ["seller", "sellers", "người bán", "chủ nhà", "broker", "môi giới"],
  },

  {
    group: "asset", vn: "Diện tích", code: "area_m2", reso: "LivingArea (LivingAreaUnits = sqm)", params: ["livingArea"],
    def: "Diện tích sử dụng của căn, m² (`numeric`, ADR-0011 Qđ 4).", avoid: [], use: [],
    note: "Tham số URL của /yield đang là `m2` → đổi `livingArea` khi dọn nhóm trang.",
  },
  {
    group: "asset", vn: "Phòng ngủ", code: "bedrooms", reso: "BedroomsTotal", params: ["bedrooms"],
    def: "Số phòng ngủ của căn hoặc listing; UI viết tắt \"PN\" (\"2 PN\").", avoid: [], use: [],
    note: "Tham số URL của /yield đang là `pn` → đổi `bedrooms` khi dọn nhóm trang.",
  },

  // ---------------------------------------------------------------- Giá
  {
    group: "price", vn: "Giá rao", code: "price_vnd", reso: "ListPrice (thuê: LeaseAmount)",
    def: "Giá ghi trong tin rao, VND (bigint).", avoid: [], use: ["giá rao"],
  },
  {
    group: "price", vn: "Bậc giá", code: "price_tier", reso: "không có — đặc trưng VN (mappings.yaml)",
    def: "Độ gần giá giao dịch của một tin rao: P0 giá giao dịch, P1 giá nội bộ, P2 giá công khai.",
    avoid: ["tier giá"], use: ["price_tier", "P0", "P1", "P2"],
  },
  {
    group: "price", vn: "Giá giao dịch", code: "price_tier = P0", reso: "ClosePrice (ngữ nghĩa)",
    def: "Giá đã chốt thật (P0) — hiếm, trễ; dự phòng.", avoid: [], use: ["P0"],
  },
  {
    group: "price", vn: "Giá nội bộ", code: "price_tier = P1", reso: "không có",
    def: "Giá rao trong nhóm khép (P1, S03 và S05) — sát giao dịch, kèm SĐT.",
    avoid: ["giá thật"], use: ["P1", "giá thật", "giá nội bộ"],
  },
  {
    group: "price", vn: "Giá công khai", code: "price_tier = P2", reso: "không có",
    def: "Giá rao trên kênh công khai (P2, S06) — độ phủ rộng nhưng có giá câu và tin treo.",
    avoid: ["giá vải"], use: ["P2", "giá công khai", "giá vải", "vải"],
  },
  {
    group: "price", vn: "Giá/m²", code: "price_perm2", reso: "không có — tự tính",
    def: "Giá rao ÷ diện tích (`price_vnd / area_m2`).", avoid: ["đơn giá"], use: [],
  },
  {
    group: "price", vn: "Thước giá", code: "ruler", reso: "không có — chỉ số nội bộ",
    def: "Trung vị giá/m² giá công khai (P2) cùng phường × loại hình, cần n ≥ 5 (view `v_ruler_p2_*`). Thước để đo căn giá tốt.",
    avoid: ["ruler"], use: ["ruler", "thước", "thước giá"],
  },
  {
    group: "price", vn: "Chênh giá câu", code: "bait_gap_pct", reso: "không có — chỉ số P4",
    def: "Chênh giữa giá công khai và giá nội bộ của cùng người bán, tính bằng %.",
    avoid: ["bait gap"], use: ["bait gap", "bait_gap", "giá câu"],
  },
  {
    group: "price", vn: "Giá niêm yết", code: "price_listed", reso: "không có mô hình STR",
    def: "Giá một đêm listing đang để trên kênh — không phải ADR (ADR chỉ tính trên đêm đã đặt).",
    avoid: [], use: [],
  },

  // ---------------------------------------------------------------- Chỉ số
  {
    group: "metric", vn: "Đêm đã đặt", code: "booked_nights", reso: "không có",
    def: "Số đêm trong kỳ lịch listing bị chặn (`nights.available = false`) — gồm cả đêm chủ tự chặn, vì lịch công khai không tách hai loại.",
    avoid: [], use: ["booked_nights", "đêm đã đặt"],
  },
  {
    group: "metric", vn: "Đêm khả dụng", code: "booked_nights + available_nights", reso: "không có",
    def: "Đêm đã đặt + đêm trống (`available_nights`) trong kỳ — mẫu số của công suất và RevPAR.",
    avoid: [], use: ["available_nights", "đêm trống"],
  },
  {
    group: "metric", vn: "Doanh thu", code: "revenue", reso: "không có",
    def: "Tổng giá các đêm đã đặt trong kỳ (`market_metrics.revenue`); đêm thiếu giá lấy giá niêm yết của listing, listing không có giá niêm yết bị loại khỏi mẫu (300_metrics.sql). \"Doanh thu năm\" ở Lợi suất = giá niêm yết × công suất 90 đêm × 365, lấy p25/trung vị/p75 trên listing so sánh.",
    avoid: ["doanh số", "doanh thu brutto"], use: ["revenue", "doanh thu"],
    note: "UI ghi \"Doanh thu ước tính\" khi số dựng từ lịch tương lai (giá niêm yết × đêm đã chặn) — vẫn là thuật ngữ này.",
  },
  {
    group: "metric", vn: "ADR", code: "adr", reso: "không có",
    def: "Giá trung bình một đêm đã đặt: doanh thu ÷ đêm đã đặt.",
    avoid: ["giá phòng", "giá đêm", "giá/đêm"],
    note: "Biến `adr` trong `lib/yield.ts` (Lợi suất) là trung vị giá niêm yết của listing so sánh, KHÔNG phải ADR — đổi tên khi dọn nhóm trang. UI đang có 4 nhãn cho hai khái niệm: \"Giá phòng (ADR)\", \"Giá đêm (ADR)\" (= ADR) và \"Giá niêm yết\", \"Giá/đêm\" (= giá niêm yết một listing) — tách khi dọn nhóm trang.",
    use: ["ADR", "giá phòng", "giá đêm", "giá/đêm", "giá trung bình"],
    choice: {
      q: "Q5", title: "ADR và RevPAR: giữ chữ tắt ngành hay Việt hoá",
      options: [
        { label: "ADR · RevPAR (chữ tắt + ⓘ định nghĩa)", note: "64 và 27 file; nhà đầu tư STR quen; UI đang ghi \"Giá phòng (ADR)\" ở 3 chỗ" },
        { label: "Giá đêm TB · Doanh thu/đêm khả dụng", note: "tiếng Việt, nhưng dài và dễ lẫn với giá niêm yết" },
      ],
      rec: 0, why: "\"Giá phòng\"/\"giá đêm\" đang bị dùng cho cả giá niêm yết lẫn ADR — chữ tắt kèm ⓘ là cách duy nhất không lẫn.",
    },
  },
  {
    group: "metric", vn: "Công suất", code: "occupancy", reso: "không có",
    def: "Đêm đã đặt ÷ đêm khả dụng (`market_metrics.occupancy`).",
    avoid: ["tỷ lệ lấp đầy", "lấp đầy", "occupancy"],
    use: ["occupancy", "công suất", "lấp đầy", "tỷ lệ lấp đầy"],
  },
  {
    group: "metric", vn: "Công suất 90 đêm", code: "booked90 / nights90", reso: "không có",
    def: "Công suất trên 90 đêm đầu của lịch tương lai (`listing_stats`, 410) — đầu vào doanh thu năm ở Lợi suất và Mô phỏng đầu tư.",
    avoid: [], use: [],
  },
  {
    group: "metric", vn: "RevPAR", code: "revpar", reso: "không có",
    def: "Doanh thu ÷ đêm khả dụng = ADR × công suất.", avoid: [], use: ["RevPAR"],
  },
  {
    group: "metric", vn: "Listing hoạt động", code: "listing_count", reso: "không có",
    def: "Số listing có ≥ 1 đêm đã đặt trong tháng.", avoid: [], use: [],
  },
  {
    group: "metric", vn: "Listing so sánh", code: "comps", reso: "không có",
    def: "Tập listing cùng phường + số phòng ngủ (≥ 5, không đủ thì lùi ra thị trường) dùng để ước tính một căn.",
    avoid: ["comps", "listing tương tự"], use: ["comps", "listing so sánh"],
  },
  {
    group: "metric", vn: "Lợi suất", code: "yield", reso: "không có", slug: ["yield"], slugNote: "`/yield`",
    def: "Thu nhập năm của một căn ÷ giá mua; luôn ghi rõ gộp hay ròng và ngắn hạn hay dài hạn.",
    avoid: ["tỷ suất lợi nhuận", "ROI", "cap rate"],
    use: ["yield", "lợi suất", "tỷ suất", "ROI", "cap rate"],
    note: "UI đang có \"Yield ngắn hạn\"/\"Yield dài hạn\" (`/so-sanh`) — đổi khi dọn nhóm trang.",
  },
  {
    group: "metric", vn: "Lợi suất gộp", code: "grossYield", reso: "không có",
    def: "Doanh thu năm ÷ giá mua (trước chi phí).", avoid: ["gross yield", "brutto", "tổng lợi suất"], use: ["gross yield"],
  },
  {
    group: "metric", vn: "Lợi suất ròng", code: "netYield", reso: "không có",
    def: "Thu nhập ròng ÷ giá mua.", avoid: ["net yield", "yield ròng"], use: ["net yield"],
  },
  {
    group: "metric", vn: "Lợi suất vốn tự có", code: "cashOnCash", reso: "không có",
    def: "(Thu nhập ròng tháng − trả nợ vay tháng) × 12 ÷ vốn tự có bỏ ra — chỉ có nghĩa khi có vay.",
    avoid: ["cash-on-cash"], use: [],
    choice: {
      q: "Q9", title: "Nhãn UI cho cash-on-cash (`cocYear` ở Mô phỏng đầu tư)",
      options: [
        { label: "Lợi suất vốn tự có", note: "tiếng Việt, tự giải nghĩa mẫu số; cùng họ Lợi suất gộp/ròng" },
        { label: "Cash-on-cash", note: "thuật ngữ ngành; UI đang ghi \"Cash-on-cash /năm\"" },
      ],
      rec: 0, why: "Khác ADR/RevPAR, chỉ số này có tên Việt ngắn và rõ hơn chữ tắt.",
    },
  },
  {
    group: "metric", vn: "Thu nhập ròng", code: "noi", reso: "không có",
    def: "Cho thuê ngắn hạn: doanh thu năm trừ phí quản lý, phí nền tảng, thuế và chi phí cố định. Cho thuê dài hạn: tiền thuê năm × (1 − thuế 10%). Cả hai chưa trừ trả nợ vay.",
    avoid: ["lợi nhuận", "NOI"], use: ["NOI", "thu nhập"],
  },
  {
    group: "metric", vn: "Độ tin cậy", code: "confidence (ước tính)", reso: "không có",
    def: "Mức chắc của một ước tính, theo cỡ mẫu, phạm vi lùi và độ phân tán giá — luôn hiện cạnh số ước tính.",
    avoid: [], use: ["độ tin cậy"],
  },
  {
    group: "metric", vn: "Độ tin trích xuất", code: "sale_offers.confidence", reso: "không có",
    def: "Độ chắc của parser khi đọc một tin rao (high | medium | low) — chỉ dùng ở Ops, khác độ tin cậy của ước tính.",
    avoid: [], use: ["confidence"],
  },
  {
    group: "metric", vn: "Mô phỏng", code: "badge `warning-light` \"MÔ PHỎNG\"", reso: "—",
    def: "Số dựng từ mô hình chứ không quan sát trực tiếp; mọi số như vậy mang badge MÔ PHỎNG.",
    avoid: [], use: ["mô phỏng"],
  },
  {
    group: "metric", vn: "Điểm One Invest", code: "score", reso: "không có",
    def: "Điểm xếp hạng khu vực của riêng nền tảng, một thang cố định, kèm điểm thành phần (chưa ship).",
    avoid: ["Market Score", "điểm thị trường"], use: ["score", "Market Score", "Điểm One Invest"],
    note: "Market Score là của AirDNA (S02) — không lên cổng Invest (luật 5).",
  },

  // ---------------------------------------------------------------- Chiến lược
  {
    group: "strategy", vn: "Cho thuê ngắn hạn", code: "str (kind `rent_st` tương lai)", reso: "không có mô hình — FeeFrequency=Daily chỉ là mảnh rời",
    def: "Chiến lược cho thuê theo đêm qua listing; dòng tiền đo bằng ADR × công suất.",
    avoid: ["homestay"], use: ["STR", "thuê ngắn hạn", "cho thuê ngắn hạn", "rent_st", "homestay"],
  },
  {
    group: "strategy", vn: "Cho thuê dài hạn", code: "ltr / kind `rent_lt`", reso: "PropertyType = ResidentialLease",
    def: "Chiến lược cho thuê theo tháng; dòng tiền đo bằng giá thuê tin cho thuê.",
    avoid: [], use: ["LTR", "thuê dài hạn", "cho thuê dài hạn"],
  },
  {
    group: "strategy", vn: "Pipeline đầu tư", code: "investment pipeline (4 stages)", reso: "—",
    def: "North star sản phẩm, 4 giai đoạn: chọn thị trường → chọn căn → chi phí, vốn, dòng tiền → khai thác sau mua (`docs/research/investment-pipeline-4-stages.md`).",
    avoid: ["phễu đầu tư"], use: [],
  },

  // ---------------------------------------------------------------- Dữ liệu & nguồn
  {
    group: "data", vn: "Nguồn", code: "source (`source_registry.code`)", reso: "OriginatingSystemName",
    def: "Nơi dữ liệu đến, luôn gọi bằng mã S01–S07 (SPL, ADR-0007). Tên thật là tầng A.",
    avoid: ["kênh dữ liệu"], use: ["source", "nguồn", "mã nguồn"],
  },
  {
    group: "data", vn: "Snapshot", code: "snapshot (raw)", reso: "—",
    def: "Bản ghi thô collector thu được — bất biến, chỉ ghi mới (luật 1). Mọi diễn giải nằm ở pipeline.",
    avoid: ["bản chụp", "dump"], use: ["snapshot", "raw snapshot"],
  },
  {
    group: "data", vn: "Staging", code: "stg_*", reso: "—",
    def: "Bảng nạp từ snapshot (`stg_*`) — ranh giới làn ZCode (thu) ↔ Claude (phần còn lại), định nghĩa trong DATA-CONTRACT.",
    avoid: [], use: ["staging", "stg_"],
  },
  {
    group: "data", vn: "Hợp đồng dữ liệu", code: "DATA-CONTRACT (`schemaVersion`)", reso: "—",
    def: "`collector/docs/DATA-CONTRACT.md` — giao diện collector ↔ pipeline; thêm field phải tăng `schemaVersion`.",
    avoid: [], use: ["DATA-CONTRACT"],
  },
  {
    group: "data", vn: "Canonical", code: "sale_offers, listings", reso: "Data Dictionary là lớp canonical",
    def: "Lớp dữ liệu đã chuẩn hoá đa nguồn theo RESO-first, đầu vào của căn nhà và chỉ số.",
    avoid: [], use: ["canonical"],
  },
  {
    group: "data", vn: "Thu thập", code: "collect / collection", reso: "—", slug: ["collections"], slugNote: "`/ops/collections`",
    def: "Việc collector lấy dữ liệu từ nguồn về snapshot (launchd, theo lịch).",
    avoid: ["cào", "crawl"], use: ["collection", "thu thập"],
  },
  {
    group: "data", vn: "Độ tươi", code: "freshness (SLO)", reso: "≈ ModificationTimestamp",
    def: "Thời gian từ lần thu gần nhất của một nguồn; vượt SLO thì `check-freshness.mjs` exit 1.",
    avoid: ["freshness"], use: ["freshness", "độ tươi"],
  },
  {
    group: "data", vn: "Tầng A", code: "SPL tier A", reso: "—",
    def: "Tên nguồn thật, SĐT, hồ sơ cá nhân — không rời máy local; cloud chỉ nhận hash + aggregate (luật 6).",
    avoid: [], use: ["SPL", "tầng A"],
  },
  {
    group: "data", vn: "Tầng B", code: "SPL tier B", reso: "—",
    def: "Mã nguồn S0x — dùng ở API và mọi trang Ops.", avoid: [], use: ["tầng B"],
  },
  {
    group: "data", vn: "Tầng C", code: "SPL tier C", reso: "—",
    def: "Nhãn công khai (\"Tự thu\", \"Hiệu chuẩn\") — thứ duy nhất về nguồn hiện trên cổng Invest.", avoid: [], use: ["tầng C"],
  },
  {
    group: "data", vn: "Tự thu", code: "self-collected", reso: "—",
    def: "Số tính từ dữ liệu nền tảng tự thu (không phải AirDNA) — nhãn tầng C trên cổng Invest.", avoid: [], use: [],
  },
  {
    group: "data", vn: "Hiệu chuẩn", code: "calibration (S02)", reso: "—",
    def: "Số AirDNA dùng để đối chiếu số tự thu — chỉ ở `/ops/quality`, không bao giờ lên cổng Invest (ToS, luật 5).",
    avoid: ["calibration"], use: ["AirDNA", "hiệu chuẩn", "calibration"],
  },
  {
    group: "data", vn: "Hàng duyệt", code: "review_queue", reso: "—", slug: ["review"], slugNote: "`/ops/review`",
    def: "Hàng chờ người phán quyết đề xuất của máy/agent (entity_match, source_decision, agent_output) — LLM không ghi dữ liệu trực tiếp (luật 7).",
    avoid: ["Review Queue", "hàng chờ"], use: ["Review", "Review Queue", "duyệt"],
    note: "Tiêu đề trang `/ops/review` đang là \"Review Queue\" — đổi khi dọn B1.",
  },

  // ---------------------------------------------------------------- Cổng & tính năng
  {
    group: "portal", vn: "Cổng Invest", code: "invest portal", reso: "—",
    slugNote: "không prefix: `/`, `/[country]/…`, `/listing/…`, `/yield`, `/compare`, `/saved`",
    def: "Cổng công khai, chỉ đọc, cho nhà đầu tư (`docs/architecture/portals.md`).",
    avoid: ["Invest Portal", "cổng nhà đầu tư"], use: ["Invest Portal", "cổng Invest"],
  },
  {
    group: "portal", vn: "Cổng Ops", code: "ops portal", reso: "—", slug: ["ops"], slugNote: "`/ops/**`",
    def: "Cổng vận hành dữ liệu, bắt buộc đăng nhập, quyền ops/admin; mọi route nội bộ nằm dưới `/ops` (luật 9).",
    avoid: ["Ops Portal", "trang admin"], use: ["Ops Portal", "cổng Ops"],
  },
  {
    group: "portal", vn: "Finder", code: "finder", reso: "—", slugNote: "`/[country]` (vd. `/vn`)",
    def: "Tên tính năng (code, docs) của màn xếp hạng khu vực + bản đồ; UI ghi \"Thị trường {quốc gia}\", không in chữ Finder.",
    avoid: ["Market Finder"], use: ["Finder"],
  },
  {
    group: "portal", vn: "Insight", code: "insight", reso: "—", slugNote: "`/[country]/[market]`, `/[country]/[market]/[submarket]`",
    anchors: ["overview", "performance", "mix", "submarkets", "listings", "supply", "yield"],
    def: "Tên tính năng (code, docs) của trang chiều sâu một thị trường hoặc phường; UI ghi tên khu vực, không in chữ Insight.",
    note: "Neo mục lục đang tiếng Việt (#tong-quan, #hieu-suat, #co-cau, #phuong, #listing, #nguon-cung, #loi-suat — insight-page.tsx) → đổi sang neo tiếng Anh khi dọn nhóm trang.",
    avoid: ["Market Insight"], use: ["Insight"],
  },
  {
    group: "portal", vn: "Bản đồ", code: "map", reso: "—", slug: ["map"], slugNote: "`/[country]/[market]/map` (chỉ redirect)",
    def: "Chế độ bản đồ của Finder (`?view=map`); route cũ chỉ còn redirect.", avoid: [], use: [],
  },
  {
    group: "portal", vn: "Ước tính lợi suất", code: "yield estimator", reso: "—", slug: ["yield"], slugNote: "`/yield`",
    def: "Tính năng nhập phường, số PN, diện tích, giá mua → báo cáo lợi suất kèm độ tin cậy (badge MÔ PHỎNG). Nav ghi \"Lợi suất\".",
    avoid: ["Rentalizer"], use: [],
  },
  {
    group: "portal", vn: "Mô phỏng đầu tư", code: "investment simulator", reso: "—",
    old: [{ from: "dau-tu", to: "yield", note: "gộp vào /yield — redirect /yield?area=<market>#financing" }],
    slugNote: "`/[country]/[market]/dau-tu` (đang chạy)",
    def: "Máy tính dòng tiền cho thuê ngắn hạn × dài hạn kèm vay, mặc định từ số tự thu (giai đoạn 3). Gộp vào Ước tính lợi suất thành mục Vay vốn (`#financing`).",
    avoid: [], use: [],
    note: "Mạnh đã chốt gộp vào /yield (phiên invest-target-map, PR #6) — không còn là câu hỏi.",
  },
  {
    group: "portal", vn: "So sánh", code: "compare", reso: "—", slug: ["compare"],
    old: [{ from: "so-sanh", to: "compare" }], slugNote: "`/so-sanh` → `/compare`",
    def: "Đặt 2–4 khu vực cạnh nhau theo nhóm Hiệu suất / Nguồn cung / Lợi suất (`?areas=a,b`).",
    avoid: [], use: ["Compare", "so sánh"],
  },
  {
    group: "portal", vn: "Đã lưu", code: "saved", reso: "—", slug: ["saved"],
    def: "Khu vực (sau này listing, báo cáo) người dùng đã lưu — cần đăng nhập.", avoid: [], use: ["Saved", "đã lưu"],
  },
  {
    group: "portal", vn: "Phương pháp", code: "methodology", reso: "—", slug: ["methodology"],
    old: [{ from: "phuong-phap", to: "methodology" }], slugNote: "`/phuong-phap` → `/methodology`",
    def: "Trang công khai giải nghĩa chỉ số, công thức và nhãn nguồn tầng C; là đích của các ⓘ trên ô KPI.",
    avoid: [], use: ["Phương pháp", "methodology"],
  },
  {
    group: "portal", vn: "Đăng nhập", code: "login", reso: "—", slug: ["login"], def: "Trang đăng nhập (`/login?next=`).", avoid: [], use: ["đăng nhập"],
  },
  {
    group: "portal", vn: "Đăng ký", code: "register", reso: "—", slug: ["register"], def: "Trang tạo tài khoản (`/register`).", avoid: [], use: ["đăng ký"],
  },
  {
    group: "portal", vn: "Tổng quan vận hành", code: "ops overview", reso: "—", slugNote: "`/ops`",
    def: "Trang gốc Ops: hệ thống có khoẻ không (độ tươi từng nguồn, lần chạy gần nhất). Nav ghi \"Tổng quan\".", avoid: [], use: [],
  },
  {
    group: "portal", vn: "Nguồn dữ liệu", code: "sources", reso: "—", slug: ["sources"], slugNote: "`/ops/sources` (admin)",
    def: "Registry nguồn + quản trị tài khoản thu; trang duy nhất giải mã tầng A (chỉ admin).", avoid: [], use: [],
  },
  {
    group: "portal", vn: "Chất lượng dữ liệu", code: "quality", reso: "—", slug: ["quality"], slugNote: "`/ops/quality`",
    def: "Số tin được không: 4 trụ DQ (độ tươi, khối lượng, schema, phân bố) + đối chiếu hiệu chuẩn.", avoid: [], use: [],
  },
  {
    group: "portal", vn: "Thư viện thiết kế", code: "design", reso: "—", slug: ["design"], slugNote: "`/ops/design`",
    def: "Trang trưng bày component ReUI đã cài.", avoid: ["ReUI Gallery"], use: ["Thư viện thiết kế"],
  },
];

// Câu hỏi không gắn với một thuật ngữ — luật slug.
export const RULE_CHOICES = [
  {
    q: "Q7", title: "Hạn của danh sách ngoại lệ route tiếng Việt (so-sanh, phuong-phap, dau-tu)",
    options: [
      { label: "2026-12-31", note: "test đỏ sau ngày này nếu route Việt còn — ép đợt dọn nhóm trang làm trong quý" },
      { label: "Không hạn — chỉ chặn route Việt MỚI", note: "ít áp lực, nhưng ngoại lệ dễ thành vĩnh viễn" },
    ],
    rec: 0, why: "Ngoại lệ có hạn mới là ngoại lệ; ngày gần đủ để B2/B5 làm kịp.",
  },
  {
    q: "Q8", title: "Mã redirect khi đổi slug",
    options: [
      { label: "`permanent: true` (Next.js trả 308)", note: "mặc định của Next.js; Google xử 308 như 301; giữ method" },
      { label: "`statusCode: 301` đúng chữ", note: "khớp câu chốt \"301\"; phải ghi tay mỗi dòng" },
    ],
    rec: 0, why: "Cùng hiệu lực SEO, ít ghi tay; luật ghi \"redirect vĩnh viễn (301/308)\".",
  },
];

// Slug động là tên riêng địa lý / mã quốc gia — không qua danh sách slug.
// _Allow_ toàn cục: cụm hợp lệ chứa một tên bị loại.
export const ALLOW = ["phạm vi dự án", "entry dự án", "thông tin đăng nhập", "thông tin đăng ký", "điện nước", "nước ngoài", "thành phố trực thuộc trung ương", "thành phố thuộc tỉnh"];

export const GEO_SLUG_NOTE = "Tên riêng địa lý (`hanoi`, `vn-hanoi-tay-ho`) và mã quốc gia (`vn`) là slug động — không cần tiếng Anh.";
