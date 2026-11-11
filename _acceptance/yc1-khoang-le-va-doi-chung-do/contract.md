---
schema_version: 1
feature: Ngân sách Yêu cầu đọc đúng khoảng có phần lẻ viết rời ở đầu dưới, và lệnh đo ngân sách có đối chứng đỏ cho cả bốn lý do đỏ
slug: yc1-khoang-le-va-doi-chung-do
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-11-yc1-khoang-le-va-doi-chung-do-design.md
---

# Acceptance Contract: yc1-khoang-le-va-doi-chung-do

## Context

Mạnh ký Cổng Bằng chứng của `sua-doc-ngan-sach-yeu-cau` (YC1) ngày 11/11 và định tuyến hai mục «mở hợp đồng mới»:
`sua-doc-ngan-sach-yeu-cau` Ngoài-3 (khoảng «2 tỷ 5 - 3 tỷ» bị đọc thành trần 2 tỷ) và `sua-doc-ngan-sach-yeu-cau`
Ngoài-5 (bộ dò «thuê từ 100 triệu», «min lớn hơn max» của lệnh đo chưa từng được cho đỏ). Giám sát đợt gộp hai mục vào
một hàng để tốn một lượt chấm. Nhóm A (AC-1, AC-2) trả Ngoài-3; nhóm B (AC-3, AC-4) trả Ngoài-5.

## Criteria

Nhóm A — `sua-doc-ngan-sach-yeu-cau` Ngoài-3:

- AC-1: Given ma trận viết trước «khoảng có phần lẻ viết rời ở đầu dưới» = sáu dấu nối mà mẫu khoảng nhận (`-`, `–`, `—`,
  `~`, `đến`, `tới`) × hai đơn vị (`cần mua 2 tỷ 5 <nối> 3 tỷ` → 2,5 tới 3 tỷ; `cần thuê 8tr 5 <nối> 9tr` → 8,5 tới 9
  triệu), cộng `cần mua 2 tỷ 2 - 2 tỷ 5` → 2,2 tới 2,5 tỷ, When đọc ngân sách theo đúng dịch vụ, Then cả 13 ca ra đúng; đối
  chứng `tìm thuê tc 8tr 7-8/11` vẫn ra trần 8 triệu. 34 ca của ma trận YC1 giữ nguyên chữ và kết quả (băm phần bảng ca cũ
  bằng băm ở main `7e7b7073`), tổng ca ghim từ 34 thành 48. Bản sao giữ chặn dấu nối ở đầu dưới của khoảng thì đỏ «KHOANG LE
  ROI 2 tỷ 5 - 3 tỷ».
- AC-2: Given toàn bộ bài S03 khớp `laYeuCau` trên DB máy thu, When chạy lệnh đo chỉ đọc so với bộ đọc ở main `7e7b7073`,
  Then tổng bài và số bài có ngân sách ở bộ gốc đều lớn hơn 0; 0 bài mất ngân sách, 0 bài thuê từ 100 triệu/tháng, 0 bài
  min > max, số bài có ngân sách không giảm; lệnh in băm tệp của bộ đọc gốc và bộ đọc mới (hai băm phải khác nhau), số bài đổi
  giá trị kèm mẫu, và không ghi gì vào DB.

Nhóm B — `sua-doc-ngan-sach-yeu-cau` Ngoài-5:

- AC-3: Given danh sách bài dựng từ chữ thật và đầu ra thật của `docNganSach` + `docDichVu` (bộ đọc A), và bộ đọc B là A
  với đúng một đột biến trên đầu ra thật ấy, When gọi `soSanh` rồi `lyDoDo` của
  `pipeline/scripts/do-ngan-sach-yeu-cau.mjs` trong test thuần mới `pipeline/scripts/do-ngan-sach-yeu-cau.test.mjs`, Then:
  - hai bộ đọc giống nhau → không lý do nào;
  - làm rơi một bài, không thêm → đúng `SO CO NGAN SACH GIAM` và `MAT NGAN SACH`;
  - làm rơi một bài, thêm một bài khác → chỉ `MAT NGAN SACH`;
  - nhân trần của bài `cần thuê 8tr 5 - 9tr` lên 120 triệu → chỉ `THUE TU 100 TRIEU`;
  - đảo min và max của bài `cần mua 2 tỷ 5 - 3 tỷ` → chỉ `MIN LON HON MAX`.
- AC-4: Given lệnh đo chạy `--tu-kiem`, When chạy, Then nó chạy đúng bốn đột biến của AC-3 qua `soSanh` + `lyDoDo` của
  chính tệp, in «YCNS-DO TU-KIEM PASS 4/4» và thoát 0. Bản chép tệp bỏ nhánh `MIN LON HON MAX` của `lyDoDo` thì tự kiểm
  thoát 1, gọi tên đột biến min > max. Lệnh nối thành executor `ycns_tu_kiem`.

Bảng ca viết trước của AC-1 (mã `khoảng lẻ rời`, ghép vào ma trận của YC1, 14 ca):

| Chữ | Dịch vụ | min | max |
|---|---|---|---|
| `cần mua 2 tỷ 5 <nối> 3 tỷ`, `<nối>` ∈ `-` `–` `—` `~` `đến` `tới` (6 ca) | sale | 2,5e9 | 3e9 |
| `cần thuê 8tr 5 <nối> 9tr`, `<nối>` ∈ `-` `–` `—` `~` `đến` `tới` (6 ca) | rent_lt | 8,5e6 | 9e6 |
| `cần mua 2 tỷ 2 - 2 tỷ 5` | sale | 2,2e9 | 2,5e9 |
| `tìm thuê tc 8tr 7-8/11` (đối chứng) | rent_lt | — | 8e6 |

## Coverage

Bỏ quét không gian (dòng `descope` trong sổ) — hai mục Ngoài đã gọi tên, liệt tay:

- Trục A — khoảng có phần lẻ viết rời: sáu dấu nối (`-`, `–`, `—`, `~`, `đến`, `tới`) × hai đơn vị (tỷ, triệu) = 12 ô,
  cộng một ca hai đầu cùng có phần lẻ và đối chứng ngày → AC-1 · dữ liệu thật → AC-2
- Trục B — bốn lý do đỏ của lệnh đo: mỗi lý do một đột biến, một đối chứng dương → AC-3 · lệnh tự kiểm và nối executor →
  AC-4

## Out of scope

- Lệnh đo lấy dịch vụ theo phát biểu thắng và chọn bài theo đường ghi thật: `sua-doc-ngan-sach-yeu-cau` Ngoài-2, Ngoài-4
  (đã ghi Known limits).
- Luật «mỗi mã ít nhất hai ca» đếm gộp và chiều đỏ «THIEU CA» của bảng ca: `sua-doc-ngan-sach-yeu-cau` Ngoài-6, Ngoài-7
  (đã ghi Known limits).
- Bảng `inquiry_records` (YC0) và luật nhận Yêu cầu `laYeuCau` (YC2).

## Notes
