---
schema_version: 1
feature: Bộ đọc ngân sách của Yêu cầu đọc đúng đầu dưới, đầu trên và đơn vị ở các cách viết tắt và sáu lỗi Ngoài của hồ sơ bang-yeu-cau
slug: sua-doc-ngan-sach-yeu-cau
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
design_doc: docs/superpowers/specs/2026-11-11-sua-doc-ngan-sach-yeu-cau-design.md
approved_by: Mạnh
approved_at: 2026-11-11
---

# Acceptance Contract: sua-doc-ngan-sach-yeu-cau

## Context

Bộ đọc ngân sách của Yêu cầu (`docNganSach` trong `pipeline/lib/yeu-cau.mjs`, chép từ nhánh `feat/bang-yeu-cau`) cắt mất
phần lẻ, đảo khoảng có đầu dưới thiếu đơn vị và có thể trả đầu dưới lớn hơn đầu trên — lỗi làm đổ cả lượt transform S03
khi bảng Yêu cầu có CHECK. Mạnh dặn sửa trước khi áp bảng lên máy thu (Ngoài-4/5/7/9/10/11, Cổng Bằng chứng 30/10).

## Criteria

- AC-1: Given chữ viết liền phần lẻ `2ty6`, `2ty65`, `6tr5`, `3tr5`, When đọc ngân sách theo đúng dịch vụ, Then trần ra
  2,6 tỷ; 2,65 tỷ; 6,5 triệu; 3,5 triệu.
- AC-2: Given phần lẻ viết rời `2 tỷ 5`, `2 tỷ 500`, `1 tỷ 250`, `2 tỷ rưỡi`, `6 triệu rưỡi`, và sáu đối chứng
  `2 tỷ 2pn`, `2 tỷ 3 phòng`, `2 tỷ 70m2`, `2 tỷ 70m²`, `2 tỷ 5 tầng`, `2 tỷ 2 căn`, When đọc, Then ra 2,5 tỷ; 2,5 tỷ;
  1,25 tỷ; 2,5 tỷ; 6,5 triệu; còn sáu ca đối chứng ra đúng 2 tỷ.
- AC-3: Given khoảng có đầu dưới thiếu đơn vị `800 - 1,2 tỷ`, `2 - 2,5 tỷ`, `1,5-2 tỷ`, `5- 6tr`, When đọc, Then ra
  800 triệu tới 1,2 tỷ; 2 tới 2,5 tỷ; 1,5 tới 2 tỷ; 5 tới 6 triệu.
- AC-4: Given sàn và trần viết rời ngược nhau `tối đa 2 tỷ, từ 3 tỷ`, `dưới 2 tỷ trên 3 tỷ`, `từ 3 tỷ, tối đa 2 tỷ`,
  và khoảng viết ngược `3-2 tỷ`, When đọc, Then sàn/trần rời giữ biểu thức đầu và bỏ vế sau (trần 2 tỷ; trần 2 tỷ; sàn
  3 tỷ), khoảng ngược ra 2 tới 3 tỷ; trên toàn ma trận ca không đầu ra nào có đầu dưới lớn hơn đầu trên.
- AC-5: Given số sau `tc`, `tài chính`, `ngân sách` — `tc 8tr`, `tc8tr`, `tài chính 8` (thuê), `tc 2,5` (mua),
  `tc 8` (chưa rõ dịch vụ), When đọc, Then ra 8 triệu; 8 triệu; 8 triệu; 2,5 tỷ; trống.
- AC-6: Given `12tr quay đầu`, `tài chính 6tr quay đầu`, `2.3 tỷ quay đầu`, `5-6tr quay đầu`, When đọc, Then ba ca đầu ra
  trần đúng số với đầu dưới trống, ca cuối ra 5 tới 6 triệu.
- AC-7: Given toàn bộ bài S03 khớp `laYeuCau` trên DB máy thu, When chạy lệnh đo chỉ đọc so với bộ đọc ở commit chép gốc
  `6c4ee41d`, Then số bài có ngân sách không giảm, 0 bài mất ngân sách (gốc có, mới trống), 0 bài thuê mang ngân sách từ
  100 triệu/tháng trở lên, 0 bài có đầu dưới lớn hơn đầu trên; lệnh in thêm số bài đổi giá trị kèm 30 mẫu cho người soi ở
  Cổng Bằng chứng, và không ghi gì vào DB.
- AC-8: Given `pipeline/lib/yeu-cau.mjs` sau vòng, When bỏ khối «Ngân sách» rồi băm phần còn lại, Then băm bằng băm của
  cùng phần đó ở `git show 6c4ee41d:pipeline/lib/yeu-cau.mjs` (bản chép nguyên từ nhánh `feat/bang-yeu-cau`), ghim thành
  hằng trong test; đổi một dòng ngoài khối thì phép kiểm đỏ.

Bảng ca viết trước (ma trận của AC-1…AC-6; test ghim tổng số ca và mỗi mã có ít nhất hai ca):

| Mã | Ca |
|---|---|
| Ngoài-10 (phần lẻ) | `2ty6`, `2ty65`, `6tr5`, `3tr5`, `2 tỷ 5`, `2 tỷ 500`, `1 tỷ 250`, `2 tỷ rưỡi`, `6 triệu rưỡi` |
| Ngoài-5, Ngoài-11 (khoảng thiếu đơn vị) | `800 - 1,2 tỷ`, `2 - 2,5 tỷ`, `1,5-2 tỷ`, `5- 6tr` |
| Ngoài-4, Ngoài-7, Ngoài-9 (min lớn hơn max) | `tối đa 2 tỷ, từ 3 tỷ`, `dưới 2 tỷ trên 3 tỷ`, `từ 3 tỷ, tối đa 2 tỷ`, `3-2 tỷ` |
| tc | `tc 8tr`, `tc8tr`, `tài chính 8`, `tc 2,5`, `tc 8` (dịch vụ trống) |
| 2ty6, 6tr5 | các ca viết liền của Ngoài-10 |
| quay đầu | `12tr quay đầu`, `tài chính 6tr quay đầu`, `2.3 tỷ quay đầu`, `5-6tr quay đầu` |
| chặn phần lẻ | `2 tỷ 2pn`, `2 tỷ 3 phòng`, `2 tỷ 70m2`, `2 tỷ 70m²`, `2 tỷ 5 tầng`, `2 tỷ 2 căn` |

## Coverage

Bỏ quét không gian (dòng `descope` trong sổ) — hai trục liệt tay từ sổ Cổng Bằng chứng 30/10 và câu giao:

- Trục A — lỗi đã gọi tên: phần lẻ bị cắt (Ngoài-10) → AC-1, AC-2 · khoảng đầu dưới thiếu đơn vị (Ngoài-5, Ngoài-11) →
  AC-3 · đầu dưới lớn hơn đầu trên (Ngoài-4, Ngoài-7, Ngoài-9) → AC-4
- Trục B — cách viết của câu giao: `tc 8tr` → AC-5 · `2ty6`, `6tr5` → AC-1 · `quay đầu` → AC-6 · đơn vị theo dịch vụ →
  AC-5, AC-7
- Ngưỡng của ô trên dữ liệu thật → AC-7; giữ đường gộp của YC0 → AC-8.

## Đường đo

- Ma trận ca viết trước xanh hết: AC-1 tới AC-6, `pipeline/scripts/yeu-cau-ngan-sach.test.mjs`.
- Số bài có ngân sách không giảm, 0 bài thuê từ 100 triệu/tháng: AC-7, lệnh `pipeline/scripts/do-ngan-sach-yeu-cau.mjs`
  chạy chỉ đọc trên DB máy thu, in số cũ và mới.

## Out of scope

- Bảng `inquiry_records`, migration 058 và việc áp bảng lên máy thu: hàng YC0.
- Luật nhận bài Yêu cầu `laYeuCau` cho bài viết tắt: hàng YC2.
- Đọc dịch vụ, loại hình, số phòng của Yêu cầu.
- Gom nhu cầu trong 7 ngày: hàng YC4.

## Notes
