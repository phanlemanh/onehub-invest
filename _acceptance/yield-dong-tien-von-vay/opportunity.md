---
schema_version: 1
slug: yield-dong-tien-von-vay
feature: Nhà đầu tư dùng /yield thấy bảng chi phí vận hành và phần «Dòng tiền vốn vay» dựng bằng data-grid-advanced-7, còn link /vn/<market>/dau-tu cũ chuyển 301 về /yield?area=…#financing
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh 23/10 ở phiên giám sát dot0: «Mở mới cho dãy giao diện vì phiên điều phối có cơ chế đổi tài khoản nên hạn mức là cảnh báo chứ không phải giới hạn.» — theo kế hoạch dot1-giao-dien đã duyệt (nhóm A: UI1–UI7)
decided_by: Mạnh
decided_at: 2026-10-23T15:17:32Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: UI3
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng UI3 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).

Nhà đầu tư dùng /yield thấy bảng chi phí vận hành và phần «Dòng tiền vốn vay» dựng bằng data-grid-advanced-7, còn link /vn/<market>/dau-tu cũ chuyển 301 về /yield?area=…#financing

Vì sao: 16 vi phạm lint (investment-simulator 12). Gộp /dau-tu vào /yield đã chốt ở bản đồ đích (PR #6).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: …
- Kết quả nào là SỐNG: …
- Kết quả nào là CHẾT: …
- Timebox: …
