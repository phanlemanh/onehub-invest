---
schema_version: 1
feature: DATA-CONTRACT v15 (nháp) mục nguồn S09 danh bạ căn, gồm khuôn lượt bù căn thấp tầng 20/11, vào main để bộ nạp và DA50 đọc theo một bản
slug: s09-dc-v15-thap-tang
owner: phanlemanh@gmail.com
risk_tier: T1      # chỉ văn bản giao diện collector↔pipeline (collector/docs/DATA-CONTRACT.md); không đổi mã, dữ liệu, quyền hay schemaVersion bộ nạp
surfaces: [docs]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: s09-dc-v15-thap-tang

## Context

Làn thu (ZCode) viết mục nguồn `s09-danh-ba` của DATA-CONTRACT trên nhánh `zcode/s09-danh-ba-ban-do`
(việc 1811-12): bản nháp v15 (`9274d6820`), đặc tả nguồn đo thật 20/11 (`82a2e9576`) và khuôn lượt bù
`can-thap-tang` kèm luật hợp căn theo `data[].id` (`5d70193b3`). Diff so `main` chỉ một tệp
(`collector/docs/DATA-CONTRACT.md`, +84 dòng). LL đã soát nội dung và tự đếm lại ba bản thu trên kho snapshot.
GS cắt hàng này cho P2 ngay sau DA51 để mục nguồn vào `main` trước khi giao bộ nạp máy thu; bộ nạp và DA50
đọc theo bản trên `main`.

Hồ sơ chỉ có contract, theo tiền lệ `_acceptance/nang-kit-2-34-0/` và `_acceptance/adr-duong-lenh-keo/`: tệp đổi
nằm ngoài `t1_skip_globs` nên lưới trước-merge đòi hồ sơ, nhưng thay đổi là văn bản giao diện, không có mã để chấm.

## Criteria

- AC-1: Given mục `s09-danh-ba` trên đỉnh PR, When đọc, Then có đủ năm kind `danh-muc · toa · tang · khu-thap-tang · can-thap-tang`,
  bảng `meta` của `can-thap-tang` tách hai khuôn (bản 19/11 giữ nguyên `size · soCanNhan · canDuTrang`; lượt bù 20/11
  `duAnId · khuId · tienTo · tongNguon · soCanNhan · loi`), và một ví dụ JSON cho mỗi khuôn, khuôn lượt bù có `payload.meta {page, size, total}`.
- AC-2: Given mục ấy, When đọc phần đặc tả nguồn, Then ghi: nguồn cắt cứng 500 căn mỗi lời; tham số phân trang bị phớt;
  `property_number` là lọc tiền tố mã căn; phần không truy được qua tiền tố khai ở bảng đối soát, không suy ra là gì.
- AC-3: Given mục ấy, When đọc «Luật hợp căn», Then bên đọc PHẢI hợp căn theo `data[].id` trong cả khu, không cộng `soCanNhan`
  giữa các item cùng `sourceId`; đối soát bằng Σ id hợp so `tongNguon`.
- AC-4: Given các dòng PR thêm, When soát dấu nhận diện nguồn, Then không dòng nào mang đường dẫn API, tên miền hay tên phân hệ
  của nguồn: mọi giá trị `meta.duong` trong ví dụ là chỗ giữ khuôn trung tính (`<đường API · …>`), ví dụ JSON chỉ mang tên giả và
  uuid giả. Lệnh: `git diff origin/main -U0 -- collector/docs/DATA-CONTRACT.md | grep '^+' | grep -ciE 'https?://|\.vn\b|\.com\b|"duong":"/'`
  → 0, và grep tên phân hệ của nguồn (mẫu chỉ ở ghi chú local, không chép vào kho) → 0 (73 dòng thêm; đo 21/11). Bộ quét `findSourceNames` với sổ `docSourceNameEntries` KHÔNG phủ ca này: sổ `source_registry`
  máy thu chưa có dòng S09 (có S01–S08, S10–S16), nên «0 chỗ trúng» của nó không chứng minh gì về tên nguồn S09.
- AC-5: Given đỉnh PR, When chạy `bash scripts/pre-merge-check.sh . --base origin/main` và `node scripts/product-map.mjs --root . --check`,
  Then cả hai sạch; diff so `main` chỉ gồm `collector/docs/DATA-CONTRACT.md` và hồ sơ này.

## Out of scope

- Bộ nạp `stg_*` cho `s09-danh-ba` và migration (làn Claude giữ số 115): hàng riêng, sau khi mục này vào `main`.
- Ghim số schemaVersion 15: nháp; v14 (S16) và S17 cùng đang nháp, số chốt lúc gộp các nhánh ấy, bên đọc nhận theo `source`.
- Gói 2 (căn cao tầng theo tầng) của cùng nguồn: lượt thu riêng (DA43).
- Sửa nội dung mục nguồn: của làn thu; lỗi thấy được thì `tin MỞ LẠI` qua LL, không sửa ở đây.

## Notes

Hai điểm bên đọc phải theo (LL soát 20/11, để bộ nạp và DA50 dùng):

1. Cùng khu có nhiều item `can-thap-tang` cùng `sourceId` (mỗi tiền tố một item, căn trùng giữa các lá): PHẢI hợp căn theo
   `data[].id`, không cộng `soCanNhan`.
2. Mẫu số căn thấp tầng là **72.374** (tổng `tongNguon`). Ba bản thu hợp theo `data[].id` được **63.663 căn ở 91 khu**; phần thiếu
   **8.714 căn ở 44 khu** ghi «không truy được qua tiền tố», KHÔNG suy ra là đất trống.

Ba bản thu nạp: `vn__s09-danh-ba__2026-11-19T004959637`, `…__2026-11-20T015947402`, `…__2026-11-20T052953464`.
Bản `…__2026-11-19T211829028` là lượt hỏng, KHÔNG nạp.

Giao nạp máy thu (làn thu) chỉ gửi sau khi PR này gộp; gộp xong báo LL sha.
