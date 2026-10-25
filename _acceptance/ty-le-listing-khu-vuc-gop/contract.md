---
schema_version: 1
feature: "Thẻ hiệu chuẩn của khu vực gộp nhiều market S02 cho tỉ lệ «Listing» khớp bảng Độ phủ trung thực: tự thu của cả khu vực chia cho tổng listing S02 của mọi market thành phần"
slug: ty-le-listing-khu-vuc-gop
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, script]
status: implemented
design_doc: docs/superpowers/specs/2026-10-25-ty-le-listing-khu-vuc-gop-design.md
approved_by: Mạnh
approved_at: 2026-10-25
---

# Acceptance Contract: ty-le-listing-khu-vuc-gop

## Context

Dòng «Listing» của thẻ hiệu chuẩn (`/ops/quality`) chia số tự thu của cả khu vực cho listing S02 của một market đại
diện; bảng Độ phủ trung thực chia cùng tử số cho tổng mọi market thành phần. Khu vực gộp nhiều market (sáp nhập tỉnh
2025) vì vậy có hai tỉ lệ khác nhau. Vòng này cho dòng Listing của thẻ dùng đúng mẫu số của bảng Độ phủ. Cổng Đáng
`build`: giám sát đợt `dot0-cam-mau` (P4-25) theo lựa chọn «Ngoài-13: mở hợp đồng mới» của Mạnh ở Cổng Bằng chứng ON10.

Source input: `_acceptance/ty-le-listing-khu-vuc-gop/opportunity.md`.

## Criteria

- AC-1: Given danh sách số listing S02 của các market thành phần (có thể có số trống), When tính mẫu số chung, Then kết
  quả là tổng các số không trống; mọi số đều trống hoặc danh sách rỗng thì kết quả trống.
- AC-2: Given khu vực gộp hai market S02 có listing 4 và 9, When lấy thẻ hiệu chuẩn, Then ô S02 của dòng «Listing» là 13
  và tỉ lệ dòng ấy bằng số tự thu ÷ 13 — không phải ÷ 9 của market đại diện.
- AC-3: Given khu vực gộp nhiều market — kể cả khi các market có số listing ở những kỳ khác nhau —, When lấy thẻ và bảng
  Độ phủ, Then tỉ lệ «Listing» của thẻ bằng tỉ lệ dòng cùng khu vực ở bảng Độ phủ, và ô S02 của thẻ bằng số listing S02
  đang hoạt động của bảng Độ phủ (mỗi market lấy kỳ mới nhất của chính nó, như bảng Độ phủ).
- AC-4: Given khu vực gộp nhiều market, When lấy thẻ, Then ADR, công suất, điểm S02 và số tiểu thị trường vẫn lấy từ
  market đại diện (không cộng).
- AC-5: Given ba dạng khu vực — mọi market thành phần chưa có số listing S02; hai market mà một market chưa có số; chỉ
  một market —, When lấy thẻ, Then ca thứ nhất ô S02 và tỉ lệ dòng «Listing» trống (không chia cho 0); ca thứ hai ô S02
  bằng số của market có số và tỉ lệ bằng bảng Độ phủ; ca thứ ba ô S02 bằng số của market ấy.
- AC-6: Given thẻ của khu vực gộp nhiều market, When vẽ thẻ, Then chú thích có câu «Dòng Listing: S02 cộng cả k thị
  trường; ADR, công suất và điểm lấy thị trường đại diện.» với k là số market S02 của khu vực (cả market chưa có số);
  thẻ của khu vực một market không có câu ấy. (Dạng ô S02 và nguyên văn câu chờ người chọn ở Cổng Phạm vi — câu hỏi
  «ô S02 của dòng Listing hiện số nào»; hợp đồng soạn theo khuyến nghị.)
- AC-7: Given dữ liệu thật trên DB local, When chạy phép đo chỉ đọc, Then với mọi khu vực có cả thẻ và dòng Độ phủ, hai
  tỉ lệ «Listing» bằng nhau — tỉ lệ thẻ lấy từ đầu ra thật của hàm dựng thẻ, một bên trống còn bên kia có số tính là
  lệch —, có ít nhất một khu vực gộp nhiều market được so, và tỉ lệ kiểu cũ (chia cho market đại diện) lệch ở ít nhất
  một khu vực.
- AC-8: Given các ca của `hieu-chuan.test.tsx` (ON10) và các test app khác, When chạy lại, Then vẫn xanh.

## Coverage

Bỏ quét morphological-scan — xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Trục liệt tay:

- Trục A — số market S02 của khu vực: một · nhiều · không market có số → AC-2, AC-5
- Trục B — chỗ hiện tỉ lệ: thẻ · bảng Độ phủ → AC-3, AC-7
- Trục C — số của thẻ: dòng Listing (cộng) · ADR, công suất, điểm (đại diện) → AC-2, AC-4
- Trục D — chữ trên thẻ: khu vực gộp · một market → AC-6
- Later: ngưỡng «Khớp/Lệch» riêng cho dòng Listing.
- Never: cộng ADR, công suất, điểm của nhiều market S02.

## Đường đo

- Thước: «mọi khu vực ra cùng tỉ lệ ở thẻ và bảng Độ phủ» (SỐNG của ô cơ hội) · số từ: `scripts/hieu-chuan-do.mjs`
  trên DB local · bảo đảm bởi: AC-3, AC-7
- CHẾT = phép đo AC-7 còn một khu vực lệch ở lượt chấm cuối của vòng (timebox = vòng này, tối đa 3 lượt chấm S4).

## Out of scope

- Ngưỡng «Khớp/Lệch» 0,8–1,2× của dòng Listing.
- Cộng ADR, công suất, điểm của nhiều market S02 (ON10 đã chốt).
- Bảng thị trường S02 toàn quốc (không có cột tỉ lệ).

## Notes
