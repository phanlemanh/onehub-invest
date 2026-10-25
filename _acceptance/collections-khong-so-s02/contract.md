---
schema_version: 1
feature: Người vận hành mở /ops/collections không thấy số S02 nào ở biểu đồ, bảng hay panel Rotation; số S02 chỉ ở /ops/quality và tiêu đề biểu đồ nói rõ đang đếm gì
slug: collections-khong-so-s02
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: approved
approved_by: Mạnh
approved_at: 2026-10-25
design_doc: docs/superpowers/specs/2026-10-25-collections-khong-so-s02-design.md
lo_trinh_ma: ON6
---

# Acceptance Contract: collections-khong-so-s02

## Context

Hàng ON6 (OPS-14, gốc G5, luật 5: số AirDNA — mã S02 — chỉ ở `/ops/quality`). «Số S02» = số bản ghi hay số lượng của
nguồn S02 (listing, thị trường, lượt chạy, dòng staging, tin rao) và tên thị trường S02 trong danh sách vòng thu. Trạng
thái và độ tươi của S02 (sức khoẻ vận hành) không phải số S02 và được giữ. «Số lính canh» = giá trị riêng biệt chỉ đặt
vào trường S02 của dữ liệu thử để đếm sự có mặt trong HTML; «đếm» = cộng số lần xuất hiện của MỌI dạng in ra của nó: số
thô (987654), dạng vi-VN của `fmtInt` (987.654) và dạng rút gọn của `fmtCompact`. Vùng và định nghĩa ở design doc §1–§2.

Ma trận lính canh viết trước (AC-6 in đúng một dòng đếm cho mỗi hàng; số Rotation theo Hỏi-2):

| # | Nơi | Trường S02 | Lính canh |
|---|---|---|---|
| 1 | máy thu | lưới nguồn hàng S02 · `items24h` (cũng vào ô Bản ghi 24h) | 987654 |
| 2 | máy thu | lưới nguồn hàng S02 · `stgRows` | 876543 |
| 3 | máy thu | lưới nguồn hàng S02 · `offers` | 765432 |
| 4 | máy thu | Rotation · `total` (số thị trường trong vòng) | 654321 |
| 5 | máy thu | Rotation · `cursor` | 543210 |
| 6 | máy thu | Rotation · `next[].name` (6 tên) | «Lính canh S02 1» … «Lính canh S02 6» |
| 7 | máy chủ | khối `records24h` · hàng S02 `n` (vào lưới nguồn và ô Bản ghi 24h) | 432109 |

Biểu đồ và bảng luồng không có trường S02 sau vòng này (kiểu `FlowDay`); phần đó đo bằng câu SQL `getFlowDays` thật sự
chạy (AC-3).

## Criteria

- AC-1: Given biểu đồ «Luồng 7 ngày» dựng với dữ liệu có số lính canh ở trường S02, When chọn tab «Listing» (mặc định),
  Then biểu đồ có đúng một chuỗi `airbnbListingsSeen` («S01 — listing tươi»), cấu hình chú giải không có khoá S02, tổng
  ở mô tả chỉ cộng listing tự thu; chiều đỏ: bản sao thêm lại chuỗi `airdnaListings` → thước báo tên chuỗi.
- AC-2: Given cùng biểu đồ, When đọc mô tả dưới tiêu đề ở từng tab, Then tab Listing nói «Listing tự thu (S01)» và tab tin
  S03 nói «Bài thô và tin rao S03 theo ngày đăng», cả hai kèm tổng của đúng tab và «giờ VN»; chiều đỏ: bản sao để mô tả
  chung «N bản ghi trong 7 ngày» → thước báo tab.
- AC-3: Given trang Thu thập ở máy thu, When dựng bảng «Luồng 7 ngày qua» và ghi lại MỌI câu SQL `getFlowDays` chạy
  trên pool thật, Then bảng có đúng 5 cột `day`, `airbnbSeen`, `airbnbSnapshots`, `zaloPosts`, `zaloOffers` (không cột
  S02) và không câu SQL nào chạm bảng `airdna_*`; chiều đỏ: bản sao còn cột `airdnaMarkets` → thước báo cột; bản sao câu
  SQL còn `airdna_listings` → thước báo tên bảng.
- AC-4: Given panel vòng thu với dữ liệu ở hàng 4–6 của ma trận, When dựng panel, Then panel hiện đúng thứ Hỏi-2 chọn
  (khuyến nghị: lịch chạy, số lượt thu mỗi đêm, giờ cập nhật cuối — không số thị trường, không con trỏ, không tên); chiều
  đỏ: bản sao liệt tên → thước báo tên; bản sao hiện số thị trường → thước báo lính canh hàng 4.
- AC-5: Given lưới «Sức khoẻ nguồn» và ô «Bản ghi 24h» ở máy thu (dữ liệu hàng 1–3) và ở máy chủ dựng từ bản tin do
  bên ghi THẬT đẩy trên lược đồ tạm có snapshot S02 trong 24 giờ nhiều hơn mọi nguồn khác, đi qua `readOpsFacts`, When
  dựng, Then ba ô số của hàng S02 hiện theo Hỏi-1 (không số), trạng thái và độ tươi S02 còn; ô «Bản ghi 24h» bằng tổng
  khối `records24h` trừ hàng S02 (tính độc lập từ bản tin) và «Nhiều nhất» không là S02; chiều đỏ: bản sao cộng cả S02 →
  thước báo tổng sai; bên ghi đột biến viết mã «s02» thường → thước báo «Nhiều nhất: s02» hoặc tổng sai.
- AC-6: Given toàn trang Thu thập (máy thu và máy chủ) dựng với dữ liệu mang đủ 7 hàng của ma trận lính canh, When đếm
  mọi dạng in của từng lính canh trong HTML, Then in đúng 7 dòng đếm, mỗi dòng 0 lần; đối chứng dương: trên các bản sao
  gỡ phần ẩn của từng vùng (lưới nguồn, ô Bản ghi 24h, Rotation) mỗi lính canh xuất hiện ≥ 1 lần ở dạng đã định dạng (in
  số đếm trước/sau từng hàng); và `scripts/check-portal-compliance.mjs` có luật «mã render trang Thu thập không đọc trường
  S02» báo ĐẠT; chiều đỏ: bản sao mã có `airdnaListings` → luật tĩnh báo tệp.
- AC-7: Given app chạy thật từ worktree ở máy thu (DB local), phiên admin tạm, Chromium 1280×800, When mở
  `/ops/collections`, Then DOM không có cột S02 ở bảng luồng, tab Listing của biểu đồ có đúng một mục chú giải, panel
  Rotation không có huy hiệu tên thị trường, hàng S02 của lưới nguồn hiện theo Hỏi-1; ảnh chụp lưu cho người ký; chiều
  đỏ: chèn lại một huy hiệu tên vào Rotation → báo.

## Coverage

Trục: {vùng: biểu đồ (2 tab), bảng luồng, Rotation, lưới nguồn, ô Bản ghi 24h} × {nơi: máy thu, máy chủ} × {loại số S02:
listing, thị trường, lượt chạy, staging, tin rao, tên thị trường}. AC-1/AC-2 phủ biểu đồ; AC-3 bảng; AC-4 Rotation; AC-5
lưới + ô ở hai nơi; AC-6 quét toàn trang với ma trận lính canh viết trước (mỗi trường S02 một số riêng) + luật tĩnh; AC-7
trang thật. Biên: S02 là nguồn nhiều bản ghi nhất (AC-5); tab không có dữ liệu (Empty hiện có).

## Đường đo

- «trang Thu thập không có số bản ghi S02» — SSR toàn trang với số lính canh · AC-6; luật tĩnh · AC-6; trang thật · AC-7.
- «tab Listing chỉ đếm tự thu» — AC-1.
- «Rotation chỉ còn đếm job» — AC-4.

## Out of scope

- Trang `/ops` và các trang Ops khác.
- Sửa nguồn số «Staging» của S02 (đang đọc nhầm bảng S01).
- Khối `records24h` / `rotation` trong bản tin máy thu (`push-ops-facts.mjs`).

## Notes

- Độ tươi/trạng thái S02 giữ để «x/y nguồn đạt SLO» trùng `/ops` (AU6).
