# CONTEXT — ngôn ngữ chuẩn onehub-invest

> Bộ từ vựng chung cho UI, code, tài liệu và tiêu chí nghiệm thu. Mạnh duyệt 2026-10-23
> (bảng chốt: `_acceptance/glossary-context/bang-chot.html`). Bối cảnh sản phẩm:
> `docs/product/CONTEXT-PRODUCT.md`. Luật đặt tên: `AGENTS.md` › Quy ước.

Cách đọc — mỗi khối một thuật ngữ:

- Dòng in đậm là **nhãn tiếng Việt chuẩn** — chữ dùng trên UI, trong văn xuôi và trong tiêu chí
  `_acceptance/*/contract.md`. Tên code/API/route đặt trong `backtick` (máy đọc bỏ qua code span).
- `Code` là tên tiếng Anh trong code; `RESO` là field/resource Data Dictionary tương ứng — bản tra chuẩn **DD 2.1**
  (ADR-0011, ADR-0013, `pipeline/mappings.yaml`).
- `Slug URL` là đoạn URL tiếng Anh của trang. Test `app/eslint-plugin-onehub-ui/tests/route-slugs.test.mjs`
  đòi mọi đoạn tĩnh của route nằm trong các dòng này. Tên riêng địa lý (`hanoi`, `vn-hanoi-tay-ho`) và mã quốc gia (`vn`) là slug động — không cần tiếng Anh.
- `Neo URL` (đoạn `#…`) và `Tham số URL` (`?…=`) cũng tiếng Anh; tham số camelCase theo tên code.
- `Slug cũ` là route tiếng Việt còn chạy — đổi sang slug đích trong đợt dọn của nhóm trang, kèm
  redirect vĩnh viễn trong `app/next.config.ts`.
- `_Avoid_` liệt tên lệch đã loại. Kit nghiệm thu đọc dòng này: lint W6 cảnh báo khi tiêu chí của
  hợp đồng dùng tên bị loại. Thêm thuật ngữ mới: thêm khối ở đây cùng commit với nhãn/route mới.

_Allow_: phạm vi dự án, entry dự án, thông tin đăng nhập, thông tin đăng ký, điện nước, nước ngoài, thành phố trực thuộc trung ương, thành phố thuộc tỉnh

## Địa lý

**Quốc gia**: Cấp gốc của cây khu vực (`areas.region_type = country`). Phạm vi sản phẩm hiện chỉ có Việt Nam (ADR-0008).
- Code: `country` · RESO: Country (ISO 3166-1)
- Slug URL: `vn`
_Avoid_: nước

**Thị trường**: Một tỉnh/thành phố trực thuộc trung ương — cấp `areas.region_type = market` (34 đơn vị sau sáp nhập 2025). Là đơn vị Finder xếp hạng và trang Insight trình bày.
- Code: `market` · RESO: StateOrProvince (ISO 3166-2:VN)
_Avoid_: tỉnh thành, thành phố, city, province

**Phường**: Đơn vị hành chính cấp xã (phường, xã, đặc khu) — cấp `areas.region_type = submarket`, con trực tiếp của thị trường. Trang hiện tên riêng ("Xã Bát Tràng"), nhãn chung ghi "Phường".
- Code: `submarket` · RESO: City (địa chỉ VN từ 07/2025 chỉ còn phường/xã + tỉnh — ADR-0013 §4)
- Ghi chú: Cấp huyện đã bỏ từ 07/2025: "quận" chỉ còn trong dữ liệu thô (`district_raw`).
_Avoid_: quận, quận/huyện, huyện, ward, tiểu thị trường

**Khu vực**: Một nút bất kỳ của cây địa lý (`areas`, khoá `area_id`, vd. `vn-hanoi-tay-ho`): quốc gia, thị trường hoặc phường. Dùng khi câu nói về mọi cấp (So sánh, Đã lưu).
- Code: `area` · RESO: Country / StateOrProvince / City tuỳ cấp
- Tham số URL: `area` · `areas`
- Ghi chú: Tham số URL `area` luôn là mã khu vực địa lý — diện tích căn dùng `livingArea`.
_Avoid_: địa bàn, region

**Khu đô thị**: Đại đô thị một chủ đầu tư phát triển (Ocean Park, Ecopark) — `asset_nodes.node_type = project`. Trục song song với khu vực, không thay phường (ADR-0011 Qđ 2).
- Code: `project` · RESO: SubdivisionName
_Avoid_: dự án, đại đô thị

**Phân khu**: Một phần/phase trong khu đô thị (Sapphire, The Rainbow) — `node_type = subzone`. Tên phân khu trùng giữa các khu đô thị nên chỉ resolve qua matcher 2 tầng.
- Code: `subzone` · RESO: Building.ComplexName / ComplexId (DD 2.1 — ADR-0013 §2)
_Avoid_: dự án con, phase

**Tòa nhà**: Một tòa chung cư (S1.03, BE02) — `node_type = building`; mã tòa thô trong tin nằm ở `block_raw`.
- Code: `building` · RESO: BuildingName + Building.BuildingKey (ADR-0013 §2)
_Avoid_: block, chung cư

**Trục căn**: Các căn cùng toà, cùng vị trí trên mặt bằng, khác tầng (cùng diện tích, số phòng). Môi giới thường lộ toà + trục mà che tầng («LD2xx11»), nên tin nhiều khi chỉ gắn được tới trục.
- Code: `stack` · RESO: không có — extension `Stack` (ADR-0013 §9)
_Avoid_: line căn, dòng căn

## Tài sản & tin

**Căn nhà**: "Một Căn Nhà" — đơn vị phân tích của nền tảng (bảng `properties`); nhiều tin rao từ nhiều nguồn gộp về một căn, nguồn chỉ là bằng chứng (ROADMAP §1.7).
- Code: `property` · RESO: định danh UPI (`UniversalPropertyId` + `UniversalPropertySubId`) + resource Building — **không phải** resource Property, vốn là một tin (ADR-0013 §1)
- Ghi chú: `asset_nodes` là cây khu đô thị/tòa, không phải căn nhà — vì thế "asset" bị loại.
_Avoid_: tài sản, bất động sản, BĐS, asset

**Listing**: Một chỗ cho thuê ngắn hạn tự thu (bảng `listings`, id `abnb_…`): nguyên căn hoặc phòng riêng, có lịch đêm và giá niêm yết.
- Code: `listing` · RESO: không có mô hình STR — local extension (reso-standards.md)
- Slug URL: `listings` · `listing`
_Avoid_: chỗ ở, phòng cho thuê

**Tin rao**: Một tin bán hoặc cho thuê dài hạn đã chuẩn hoá (bảng `sale_offers`). Khoá theo ADR-0013: id gốc tại nguồn (`OriginatingSystemKey`); hiện `offer_id` của tin nhóm (P1) còn băm nội dung — đổi ở PL14. Loại tin ở cột `kind`.
- Code: `sale_offer` · RESO: resource Property (một bản ghi = một tin) + ListPrice; bán/thuê qua PropertyType
_Avoid_: tin đăng, offer, rao vặt, sale offer

**Tin bán**: Tin rao có `kind = sale`.
- Code: `kind = sale` · RESO: PropertyType ∈ Residential, Land, ResidentialIncome

**Tin cho thuê**: Tin rao cho thuê dài hạn, giá theo tháng (`kind = rent_lt`).
- Code: `kind = rent_lt` · RESO: PropertyType = ResidentialLease + LeaseAmountFrequency = Monthly

**Căn giá tốt**: Tin rao giá nội bộ (P1) có giá/m² thấp hơn thước giá cùng phường và loại hình. Hiện chỉ ở cổng Ops (PR #3); từ 23/10 liên hệ người bán là tầng C nên có thể đưa lại lên cổng công khai.
- Code: `deal` · RESO: không có — chỉ số nội bộ
- Slug URL: `deals`
_Avoid_: deal tốt, kèo

**Kiểm chất lượng**: Một phép kiểm dữ liệu chạy định kỳ ở pipeline (độ tươi, từ vựng enum, số tham chiếu…), ghi kết quả theo từng đối tượng (bảng, nguồn, thị trường). Bảng «Kiểm chất lượng» trên `/ops/quality` hiện bản mới nhất của mỗi kiểm cho từng đối tượng trong 7 ngày; đầu trang đếm «n kiểm» (loại kiểm) và «m đối tượng» (dòng).
- Code: `dq_check_results` · `check_name` · `entity` · RESO: không có — chỉ số nội bộ
- Nhãn kết quả: «Đạt» · «Cảnh báo» · «Không đạt» · «Bỏ qua»
_Avoid_: DQ check, test dữ liệu

**Có số tham chiếu**: Nhãn kết quả của kiểm độ phủ tham chiếu (`truthful-coverage`) khi thị trường có số tham chiếu tươi để đối chiếu. KHÔNG có nghĩa là độ phủ đạt — độ phủ thật đọc ở cột «Chi tiết». Khi thiếu số tham chiếu (hoặc số cũ) nhãn là «Thiếu số tham chiếu». Kiểm này không bao giờ mang «Đạt» xanh lá.
- Code: `dqResult("truthful-coverage", "pass")` (`app/src/lib/dq-checks.ts`) · RESO: không có — chỉ số nội bộ
_Avoid_: «Đạt» (cho kiểm này), độ phủ đạt

**Tin cần xác minh**: Căn giá tốt rẻ hơn thước giá quá 35% — vẫn hiện trên danh sách nhưng đứng sau mọi căn giảm đến 35%, thẻ mang nhãn «cần xác minh». Giảm sâu như vậy thường là so lệch loại hình (thước còn theo phường) hơn là căn rẻ thật; người vận hành gọi xác minh trước khi tin số. Tin rao có diện tích hay số phòng phi lý không phải tin cần xác minh: chúng bị loại khỏi danh sách, có dòng audit lý do.
- Code: `suspect` · `NGHI_NGO_PCT = 35` (`app/src/lib/deals.ts`) · RESO: không có — chỉ số nội bộ
- Nhãn số lần đăng trên thẻ: «đăng 1 lần», «đăng n lần» (`repostLabel`)
_Avoid_: tin nghi ngờ, tin ảo, «mới» (để chỉ tin chưa đăng lại)

**Người bán**: Người đăng tin rao — chủ hoặc môi giới, không tự suy vai. Định danh xuyên nguồn bằng hash SĐT. Tên, SĐT, ID tài khoản người bán là tầng C — công khai, vì đăng rao là hoạt động bán hàng/môi giới (Mạnh chốt 23/10).
- Code: `seller` · RESO: resource Member; `seller_phone_hash` ≈ ULI
_Avoid_: chủ nhà, broker

**Diện tích**: Diện tích sử dụng của căn, m² (`numeric`, ADR-0011 Qđ 4).
- Code: `area_m2` · RESO: LivingArea (LivingAreaUnits = sqm)
- Tham số URL: `livingArea`
- Ghi chú: Tham số URL của /yield đang là `m2` → đổi `livingArea` khi dọn nhóm trang.

**Phòng ngủ**: Số phòng ngủ của căn hoặc listing; UI viết tắt "PN" ("2 PN").
- Code: `bedrooms` · RESO: BedroomsTotal
- Tham số URL: `bedrooms`
- Ghi chú: Tham số URL của /yield đang là `pn` → đổi `bedrooms` khi dọn nhóm trang.

## Giá

**Giá rao**: Giá ghi trong tin rao, VND (bigint).
- Code: `price_vnd` · RESO: ListPrice (thuê: LeaseAmount)

**Bậc giá**: Độ gần giá giao dịch của một tin rao: P0 giá giao dịch, P1 giá nội bộ, P2 giá công khai.
- Code: `price_tier` · RESO: không có — đặc trưng VN (mappings.yaml)
_Avoid_: tier giá

**Giá giao dịch**: Giá đã chốt thật (P0) — hiếm, trễ; dự phòng.
- Code: `price_tier = P0` · RESO: ClosePrice (ngữ nghĩa)

**Giá nội bộ**: Giá rao trong nhóm khép (P1, S03 và S05) — sát giao dịch, kèm SĐT.
- Code: `price_tier = P1` · RESO: không có
_Avoid_: giá thật

**Giá công khai**: Giá rao trên kênh công khai (P2, S06) — độ phủ rộng nhưng có giá câu và tin treo.
- Code: `price_tier = P2` · RESO: không có
_Avoid_: giá vải

**Giá/m²**: Giá rao ÷ diện tích (`price_vnd / area_m2`).
- Code: `price_perm2` · RESO: SalePricePerArea / LeasePricePerArea + PricePerAreaUnit (DD 2.1) — vẫn tự tính
_Avoid_: đơn giá

**Thước giá**: Trung vị giá/m² giá công khai (P2) cùng phường × loại hình, cần n ≥ 5 (view `v_ruler_p2_*`). Thước để đo căn giá tốt.
- Code: `ruler` · RESO: không có — chỉ số nội bộ
_Avoid_: ruler

**Chênh giá câu**: Chênh giữa giá công khai và giá nội bộ của cùng người bán, tính bằng %.
- Code: `bait_gap_pct` · RESO: không có — chỉ số P4
_Avoid_: bait gap

**Giá niêm yết**: Giá một đêm listing đang để trên kênh — không phải ADR (ADR chỉ tính trên đêm đã đặt).
- Code: `price_listed` · RESO: không có mô hình STR

## Chỉ số

**Đêm đã đặt**: Số đêm trong kỳ lịch listing bị chặn (`nights.available = false`) — gồm cả đêm chủ tự chặn, vì lịch công khai không tách hai loại.
- Code: `booked_nights` · RESO: không có

**Đêm khả dụng**: Đêm đã đặt + đêm trống (`available_nights`) trong kỳ — mẫu số của công suất và RevPAR.
- Code: `booked_nights + available_nights` · RESO: không có

**Doanh thu**: Tổng giá các đêm đã đặt trong kỳ (`market_metrics.revenue`); đêm thiếu giá lấy giá niêm yết của listing, listing không có giá niêm yết bị loại khỏi mẫu (300_metrics.sql). "Doanh thu năm" ở Lợi suất = giá niêm yết × công suất 90 đêm × 365, lấy p25/trung vị/p75 trên listing so sánh.
- Code: `revenue` · RESO: không có
- Ghi chú: UI ghi "Doanh thu ước tính" khi số dựng từ lịch tương lai (giá niêm yết × đêm đã chặn) — vẫn là thuật ngữ này.
_Avoid_: doanh số, doanh thu brutto

**ADR**: Giá trung bình một đêm đã đặt: doanh thu ÷ đêm đã đặt.
- Code: `adr` · RESO: không có
- Ghi chú: Biến `adr` trong `lib/yield.ts` (Lợi suất) là trung vị giá niêm yết của listing so sánh, KHÔNG phải ADR — đổi tên khi dọn nhóm trang. UI đang có 4 nhãn cho hai khái niệm: "Giá phòng (ADR)", "Giá đêm (ADR)" (= ADR) và "Giá niêm yết", "Giá/đêm" (= giá niêm yết một listing) — tách khi dọn nhóm trang.
_Avoid_: giá phòng, giá đêm, giá/đêm

**Công suất**: Đêm đã đặt ÷ đêm khả dụng (`market_metrics.occupancy`).
- Code: `occupancy` · RESO: không có
_Avoid_: tỷ lệ lấp đầy, lấp đầy, occupancy

**Công suất 90 đêm**: Công suất trên 90 đêm đầu của lịch tương lai (`listing_stats`, 410) — đầu vào doanh thu năm ở Lợi suất và Mô phỏng đầu tư.
- Code: `booked90 / nights90` · RESO: không có

**RevPAR**: Doanh thu ÷ đêm khả dụng = ADR × công suất.
- Code: `revpar` · RESO: không có

**Listing hoạt động**: Số listing có ≥ 1 đêm đã đặt trong tháng.
- Code: `listing_count` · RESO: không có

**Listing so sánh**: Tập listing cùng phường + số phòng ngủ (≥ 5, không đủ thì lùi ra thị trường) dùng để ước tính một căn.
- Code: `comps` · RESO: không có
_Avoid_: comps, listing tương tự

**Lợi suất**: Thu nhập năm của một căn ÷ giá mua; luôn ghi rõ gộp hay ròng và ngắn hạn hay dài hạn.
- Code: `yield` · RESO: không có
- Slug URL: `yield`
- Ghi chú: UI đang có "Yield ngắn hạn"/"Yield dài hạn" (`/so-sanh`) — đổi khi dọn nhóm trang.
_Avoid_: tỷ suất lợi nhuận, ROI, cap rate

**Lợi suất gộp**: Doanh thu năm ÷ giá mua (trước chi phí).
- Code: `grossYield` · RESO: không có
_Avoid_: gross yield, brutto, tổng lợi suất

**Lợi suất ròng**: Thu nhập ròng ÷ giá mua.
- Code: `netYield` · RESO: không có
_Avoid_: net yield, yield ròng

**Lợi suất vốn tự có**: (Thu nhập ròng tháng − trả nợ vay tháng) × 12 ÷ vốn tự có bỏ ra — chỉ có nghĩa khi có vay.
- Code: `cashOnCash` · RESO: không có
_Avoid_: cash-on-cash

**Thu nhập ròng**: Cho thuê ngắn hạn: doanh thu năm trừ phí quản lý, phí nền tảng, thuế và chi phí cố định. Cho thuê dài hạn: tiền thuê năm × (1 − thuế 10%). Cả hai chưa trừ trả nợ vay.
- Code: `noi` · RESO: không có
_Avoid_: lợi nhuận, NOI

**Độ tin cậy**: Mức chắc của một ước tính, theo cỡ mẫu, phạm vi lùi và độ phân tán giá — luôn hiện cạnh số ước tính.
- Code: `confidence (ước tính)` · RESO: không có

**Độ tin trích xuất**: Độ chắc của parser khi đọc một tin rao (high | medium | low) — chỉ dùng ở Ops, khác độ tin cậy của ước tính.
- Code: `sale_offers.confidence` · RESO: không có

**Mô phỏng**: Số dựng từ mô hình chứ không quan sát trực tiếp; mọi số như vậy mang badge MÔ PHỎNG.
- Code: `badge warning-light "MÔ PHỎNG"` · RESO: —

**Điểm One Invest**: Điểm xếp hạng khu vực của riêng nền tảng, một thang cố định, kèm điểm thành phần (chưa ship).
- Code: `score` · RESO: không có
- Ghi chú: Market Score là của AirDNA (S02) — không lên cổng Invest (luật 5).
_Avoid_: Market Score, điểm thị trường

## Chiến lược đầu tư

**Cho thuê ngắn hạn**: Chiến lược cho thuê theo đêm qua listing; dòng tiền đo bằng ADR × công suất.
- Code: `str (kind rent_st tương lai)` · RESO: không có mô hình — FeeFrequency=Daily chỉ là mảnh rời
_Avoid_: homestay

**Cho thuê dài hạn**: Chiến lược cho thuê theo tháng; dòng tiền đo bằng giá thuê tin cho thuê.
- Code: `ltr / kind rent_lt` · RESO: PropertyType = ResidentialLease

**Pipeline đầu tư**: North star sản phẩm, 4 giai đoạn: chọn thị trường → chọn căn → chi phí, vốn, dòng tiền → khai thác sau mua (`docs/research/investment-pipeline-4-stages.md`).
- Code: `investment pipeline (4 stages)` · RESO: —
_Avoid_: phễu đầu tư

## Dữ liệu & nguồn

**Nguồn**: Nơi dữ liệu đến, luôn gọi bằng mã S01–S07 (SPL, ADR-0007). Tên thật là tầng A.
- Code: `source (source_registry.code)` · RESO: OriginatingSystemName
_Avoid_: kênh dữ liệu

**Snapshot**: Bản ghi thô collector thu được — bất biến, chỉ ghi mới (luật 1). Mọi diễn giải nằm ở pipeline.
- Code: `snapshot (raw)` · RESO: —
_Avoid_: bản chụp, dump

**Staging**: Bảng nạp từ snapshot (`stg_*`) — ranh giới làn ZCode (thu) ↔ Claude (phần còn lại), định nghĩa trong DATA-CONTRACT.
- Code: `stg_*` · RESO: —

**Hợp đồng dữ liệu**: `collector/docs/DATA-CONTRACT.md` — giao diện collector ↔ pipeline; thêm field phải tăng `schemaVersion`.
- Code: `DATA-CONTRACT (schemaVersion)` · RESO: —

**Canonical**: Lớp dữ liệu đã chuẩn hoá đa nguồn theo RESO-first, đầu vào của căn nhà và chỉ số.
- Code: `sale_offers, listings` · RESO: Data Dictionary là lớp canonical

**Thu thập**: Việc collector lấy dữ liệu từ nguồn về snapshot (launchd, theo lịch).
- Code: `collect / collection` · RESO: —
- Slug URL: `collections`
_Avoid_: cào, crawl

**Độ tươi**: Thời gian từ lần thu gần nhất của một nguồn; vượt SLO thì `check-freshness.mjs` exit 1.
- Code: `freshness (SLO)` · RESO: ≈ ModificationTimestamp
_Avoid_: freshness

**Tầng A**: Tên nguồn thật, hồ sơ người dùng app — không rời máy local; cloud chỉ nhận hash + aggregate (luật 6). Định danh người bán trên tin rao KHÔNG thuộc tầng A (tầng C, 23/10).
- Code: `SPL tier A` · RESO: —

**Tầng B**: Mã nguồn S0x — dùng ở API và mọi trang Ops.
- Code: `SPL tier B` · RESO: —

**Tầng C**: Nhãn công khai ("Tự thu", "Hiệu chuẩn") — thứ duy nhất về nguồn hiện trên cổng Invest.
- Code: `SPL tier C` · RESO: —

**Nhãn nguồn**: Cách Ops gọi một nguồn ngoài `/ops/sources` — mã `S0x` kèm vai trò, dạng «S02 · Hiệu chuẩn»; vắng vai trò thì mã trần «S02». Vai trò là `label_vi` đọc từ `source_registry` ở local, từ `facts.sourceRuns` ở cloud. Tên nguồn thật chỉ hiện ở `/ops/sources`.
- Code: `sourceLabel(code, roles)` (`app/src/lib/source-labels.ts`) · RESO: — · Slug URL: —
_Avoid_: tên nguồn thật ở mọi trang Ops ngoài `/ops/sources`, kể cả nhãn job và dòng log cuối

**Tự thu**: Số tính từ dữ liệu nền tảng tự thu (không phải AirDNA) — nhãn tầng C trên cổng Invest.
- Code: `self-collected` · RESO: —

**Hiệu chuẩn**: Số AirDNA dùng để đối chiếu số tự thu — chỉ ở `/ops/quality`, không bao giờ lên cổng Invest (ToS, luật 5).
- Code: `calibration (S02)` · RESO: —
_Avoid_: calibration

**Hàng duyệt**: Hàng chờ người phán quyết đề xuất của máy/agent (entity_match, source_decision, agent_output) — LLM không ghi dữ liệu trực tiếp (luật 7).
- Code: `review_queue` · RESO: —
- Slug URL: `review`
- Ghi chú: Tiêu đề trang `/ops/review` đang là "Review Queue" — đổi khi dọn B1.
_Avoid_: Review Queue, hàng chờ

## Cổng & tính năng

**Cổng Invest**: Cổng công khai, chỉ đọc, cho nhà đầu tư (`docs/architecture/portals.md`).
- Code: `invest portal` · RESO: —
_Avoid_: Invest Portal, cổng nhà đầu tư

**Cổng Ops**: Cổng vận hành dữ liệu, bắt buộc đăng nhập, quyền ops/admin; mọi route nội bộ nằm dưới `/ops` (luật 9).
- Code: `ops portal` · RESO: —
- Slug URL: `ops`
_Avoid_: Ops Portal, trang admin

**Finder**: Tên tính năng (code, docs) của màn xếp hạng khu vực + bản đồ; UI ghi "Thị trường {quốc gia}", không in chữ Finder.
- Code: `finder` · RESO: —
_Avoid_: Market Finder

**Insight**: Tên tính năng (code, docs) của trang chiều sâu một thị trường hoặc phường; UI ghi tên khu vực, không in chữ Insight.
- Code: `insight` · RESO: —
- Neo URL: `#overview` · `#performance` · `#mix` · `#submarkets` · `#listings` · `#supply` · `#yield`
- Ghi chú: Neo mục lục đang tiếng Việt (#tong-quan, #hieu-suat, #co-cau, #phuong, #listing, #nguon-cung, #loi-suat — insight-page.tsx) → đổi sang neo tiếng Anh khi dọn nhóm trang.
_Avoid_: Market Insight

**Bản đồ**: Chế độ bản đồ của Finder (`?view=map`); route cũ chỉ còn redirect.
- Code: `map` · RESO: —
- Slug URL: `map`

**Ước tính lợi suất**: Tính năng nhập phường, số PN, diện tích, giá mua → báo cáo lợi suất kèm độ tin cậy (badge MÔ PHỎNG). Nav ghi "Lợi suất".
- Code: `yield estimator` · RESO: —
- Slug URL: `yield`
_Avoid_: Rentalizer

**Mô phỏng đầu tư**: Máy tính dòng tiền cho thuê ngắn hạn × dài hạn kèm vay, mặc định từ số tự thu (giai đoạn 3). Gộp vào Ước tính lợi suất thành mục Vay vốn (`#financing`).
- Code: `investment simulator` · RESO: —
- Slug cũ: `dau-tu` → `yield` (gộp vào /yield — redirect /yield?area=<market>#financing)
- Ghi chú: Mạnh đã chốt gộp vào /yield (phiên invest-target-map, PR #6) — không còn là câu hỏi.

**So sánh**: Đặt 2–4 khu vực cạnh nhau theo nhóm Hiệu suất / Nguồn cung / Lợi suất (`?areas=a,b`).
- Code: `compare` · RESO: —
- Slug URL: `compare`
- Slug cũ: `so-sanh` → `compare`

**Đã lưu**: Khu vực (sau này listing, báo cáo) người dùng đã lưu — cần đăng nhập.
- Code: `saved` · RESO: —
- Slug URL: `saved`

**Phương pháp**: Trang công khai giải nghĩa chỉ số, công thức và nhãn nguồn tầng C; là đích của các ⓘ trên ô KPI.
- Code: `methodology` · RESO: —
- Slug URL: `methodology`
- Slug cũ: `phuong-phap` → `methodology`

**Đăng nhập**: Trang đăng nhập (`/login?next=`).
- Code: `login` · RESO: —
- Slug URL: `login`

**Đăng ký**: Trang tạo tài khoản (`/register`).
- Code: `register` · RESO: —
- Slug URL: `register`

**Tổng quan vận hành**: Trang gốc Ops: hệ thống có khoẻ không (độ tươi từng nguồn, lần chạy gần nhất). Nav ghi "Tổng quan".
- Code: `ops overview` · RESO: —

**Nguồn dữ liệu**: Registry nguồn + quản trị tài khoản thu; trang duy nhất giải mã tầng A (chỉ admin).
- Code: `sources` · RESO: —
- Slug URL: `sources`

**Chất lượng dữ liệu**: Số tin được không: 4 trụ DQ (độ tươi, khối lượng, schema, phân bố) + đối chiếu hiệu chuẩn.
- Code: `quality` · RESO: —
- Slug URL: `quality`

**Thư viện thiết kế**: Trang trưng bày component ReUI đã cài.
- Code: `design` · RESO: —
- Slug URL: `design`
_Avoid_: ReUI Gallery
