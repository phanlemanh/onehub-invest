---
schema_version: 1
feature: Bảng Yêu cầu bên mua (cần mua · cần thuê) đối xứng listing — transform ghi từ bài có phát biểu ý định = Yêu cầu, tiêu chí khu vực · loại hình · số PN · ngân sách, nạp lại không nhân dòng
slug: bang-yeu-cau
owner: phanlemanh@gmail.com
risk_tier: T3      # máy suy: db/migrations/ (058) — khớp t3_paths
surfaces: [cli]
status: draft
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-30-bang-yeu-cau-design.md
---

# Acceptance Contract: bang-yeu-cau

## Context

Hàng T3 của dãy P1 sau PL5, Cổng Đáng build (Mạnh 30/10 «nên mở luôn bảng Inquiry»; kéo mục chờ SH12 lên). Bảng lưu nhu
cầu bên mua theo CONTEXT «Yêu cầu»; hàng `do-cau-tu-yeu-cau` đọc từ bảng này. Nhánh cắt từ đỉnh PL5 (phát biểu
`listing_intent` của Kev là đầu vào); PR mở sau khi PL5 gộp (giám sát chọn 30/10).

## Acceptance criteria

- AC-1: Given migration 058, When áp hai lần lên DB thử, Then có bảng `inquiry_records` và view sống `inquiries`
  (`retired_at IS NULL`) với các cột của design doc; CHECK `kind` ∈ sổ trục kind, `property_type` ∈ sổ trục
  property_type, `source` dạng `S0x`, `budget_min_vnd ≤ budget_max_vnd`, `retired_reason` có khi và chỉ khi `retired_at`
  có; lần áp thứ hai không lỗi và migration không ghi dòng nào.
- AC-2: Given sổ `pipeline/mappings.yaml` có khối `inquiries` (dd_resource SavedSearch, mỗi cột ánh xạ RESO hoặc lý do
  extension) và trục kind/property_type gắn thêm cột `inquiry_records.*`, When chạy `vocab.mjs --check`, `--lint` và
  `--check-db` trên DB thử đã áp 057 + 058 và kiểm DQ enum, Then cả ba xanh, `dq-enum-vocab` có hai mục kiểm cho
  `inquiries`, và CONTEXT «Yêu cầu» không còn câu «bảng lưu yêu cầu … là tính năng sau».
- AC-3: Given ma trận viết trước các câu bài — mỗi dạng ngân sách một dòng (khoảng «2–3 tỷ» · «từ a đến b» · trần «dưới /
  tối đa / tầm dưới X» · sàn «trên / từ X» · đứng một mình «tầm / khoảng / tài chính X» theo Hỏi-1 · đơn vị «tr / triệu /
  củ» · ngoài khoảng giá phi lý), mỗi mục của bảng ánh xạ loại hình theo Hỏi-3 một dòng cộng một dòng «nhà» đứng một mình,
  dịch vụ theo chữ (cần mua · tìm thuê), có phường, có phát biểu kind/property_type — When hàm thuần đọc tiêu chí, Then mỗi
  dòng ra đúng (kind, property_type, bedrooms, area_m2, budget_min_vnd, budget_max_vnd, area_id) viết trước.
- AC-4: Given giao dịch ROLLBACK trên DB thử có bài S03 tổng hợp (Yêu cầu thuê có điểm Kev, tin rao, không phải tin, bài
  thử mang inquiry, bài chữ «khách tìm…» mà Kev gate down — mọi điểm trống nên PL5 không ghi phát biểu), When chạy
  transform-zalo hai lần, Then đúng các bài có phát biểu `listing_intent = inquiry` sống lớp cao nhất thành Yêu cầu sống
  với tiêu chí đúng, bài thử và bài không phát biểu không thành; lượt hai thêm 0, nghỉ 0. (cross-layer)
- AC-5: Given hai bài cùng người gửi cùng chữ (khác ngày), một bài cùng chữ khác người và một bài không có người gửi lẫn
  SĐT, When transform chạy, Then theo Hỏi-2: hai bài cùng người thành một Yêu cầu (`post_ids` hai phần tử,
  `first_seen`/`last_seen` theo bài), bài khác người và bài không người gửi mỗi bài một Yêu cầu riêng; và khi lượt sau
  có thêm bài đăng lại của nhóm thì `post_ids` cộng dồn (không ghi đè), lượt sau nữa Kev đổi một bài trong nhóm thành tin
  rao (qua bước Kev thật) thì `post_ids` co lại, Yêu cầu vẫn sống. (cross-layer)
- AC-6: Given một Yêu cầu sống, When Kev đổi ý bài ấy thành tin rao rồi chạy lại, và sau đó đổi về Yêu cầu rồi chạy lại,
  Then lượt một Yêu cầu nghỉ (`retired_reason = 'het-phat-bieu'`, dòng còn trong `inquiry_records`), lượt hai sống lại
  cùng `inquiry_id`; không câu `DELETE` nào nhắm `inquiry_records` (răng quét). (cross-layer)
- AC-7: Given một bài có phát biểu Kev `inquiry` (inferred) và phát biểu người `offer` (hitl, fact), When transform chạy,
  Then bài không thành Yêu cầu — lớp cao nhất thắng. (cross-layer)
- AC-8: Given DB thử chưa áp 058, When chạy transform-zalo, Then luồng offer và phát biểu Kev chạy như trước, không ghi
  Yêu cầu nào và in đúng một dòng «chưa áp 058». (cross-layer)
- AC-9: Given bản chép dữ liệu thật (DB thử, ROLLBACK) với điểm Kev tổng hợp cho mọi bài S03, When chạy thước, Then mỗi
  bài có phát biểu inquiry sống nằm trong `post_ids` của đúng một Yêu cầu sống (0 bài vắng, 0 bài lặp); mỗi Yêu cầu chỉ
  gồm bài cùng nguồn · người · chữ chuẩn hoá và không hai Yêu cầu chung bộ ấy; in với từng tiêu chí số bài có dấu hiệu chữ
  và tỉ lệ đọc ra giá trị trên mẫu số ấy (chỉ in), giây transform thêm, tập offer giống lượt không Yêu cầu;
  `inquiry_records` không nằm trong danh sách bảng của sync cloud. (cross-layer)
- AC-10: Given cây sau sửa, When chạy bộ test pipeline, ca DB phát biểu (045) và ca DB Kev (PL5) trên DB thử, Then tất cả
  xanh.

## Coverage

- Trục A — lược đồ: bảng + view | CHECK theo sổ | khoảng ngân sách | nghỉ có lý do | áp lại [AC-1] · sổ + DQ + CONTEXT [AC-2]
- Trục B — tiêu chí: dịch vụ | loại hình | PN | diện tích | ngân sách (khoảng · trần · sàn · đứng một mình) | khu vực [AC-3]
- Trục C — ai là Yêu cầu: phát biểu inquiry | bài thử | không phát biểu | lớp cao hơn thắng [AC-4, AC-7]
- Trục D — vòng đời: ghi | chạy lại | đăng lại | nghỉ | sống lại | chưa áp 058 [AC-4, AC-5, AC-6, AC-8] · dữ liệu thật [AC-9] ·
  không lùi [AC-10]
- Bỏ quét hình thái: dòng sổ `descope` «bỏ coverage-scan».

## Out of scope

- Ghép Yêu cầu với listing (hàng sau); trang `/ops` hiển thị Yêu cầu (hàng `do-cau-tu-yeu-cau`); đưa bảng lên cloud.
- Danh tính người tìm (tên, SĐT, tài khoản); gom hai bài khác chữ cùng một nhu cầu; Yêu cầu từ S05/S06; `rent_st`.
- Ngưỡng xác suất Kev cho Yêu cầu (PL21); áp migration 058 lên DB máy thu (bước triển khai sau gộp).

## Đường đo

- «Mỗi bài có phát biểu inquiry thành đúng một Yêu cầu» ← AC-4 (mẫu) + AC-9 (bản chép dữ liệu thật, quan hệ bài ↔ Yêu cầu;
  theo Hỏi-2 «một» là một nhóm đăng lại — ngưỡng SỐNG của ô đọc theo nhóm, dòng sổ ghi).
- «Nạp lại giữ nguyên số Yêu cầu» ← AC-4 (lượt hai thêm 0, nghỉ 0) + AC-6 (nghỉ thay vì xoá).
- «Tiêu chí đọc được ở bài có viết» ← AC-3 (ma trận) + AC-9 (tỉ lệ đọc ra trên số bài có dấu hiệu chữ của tiêu chí — chỉ
  in, không ngưỡng; dòng sổ descope ghi giá).

## Notes
