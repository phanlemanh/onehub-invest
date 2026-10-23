---
schema_version: 1
slug: listings-filters-store-locator
feature: Nhà đầu tư duyệt listing lọc bằng filters (màn hẹp filter-sidebar-5) và bản đồ @mapcn/store-locator gom cụm, vẫn lọc theo khung nhìn khi kéo hoặc zoom
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh 23/10 ở phiên giám sát dot0: «Mở mới cho dãy giao diện vì phiên điều phối có cơ chế đổi tài khoản nên hạn mức là cảnh báo chứ không phải giới hạn.» — theo kế hoạch dot1-giao-dien đã duyệt (nhóm A: UI1–UI7)
decided_by: Mạnh
decided_at: 2026-10-23T15:17:32Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: UI6
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng UI6 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).

Nhà đầu tư duyệt listing lọc bằng filters (màn hẹp filter-sidebar-5) và bản đồ @mapcn/store-locator gom cụm, vẫn lọc theo khung nhìn khi kéo hoặc zoom

Vì sao: Hàng chạy trước trong các hàng bản đồ phải khai registry @mapcn trong components.json.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: …
- Kết quả nào là SỐNG: …
- Kết quả nào là CHẾT: …
- Timebox: …
