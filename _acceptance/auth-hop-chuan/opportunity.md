---
schema_version: 1
slug: auth-hop-chuan
feature: Khách đăng nhập hoặc đăng ký qua auth-4/auth-5 không còn chuyển động bị cấm, gradient tự chọn hay chữ kích thước tuỳ ý, và lỗi nhóm (auth) hiện error.tsx
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh 23/10 ở phiên giám sát dot0: «Mở mới cho dãy giao diện vì phiên điều phối có cơ chế đổi tài khoản nên hạn mức là cảnh báo chứ không phải giới hạn.» — theo kế hoạch dot1-giao-dien đã duyệt (nhóm A: UI1–UI7)
decided_by: Mạnh
decided_at: 2026-10-23T15:17:32Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: UI7
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng UI7 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).

Khách đăng nhập hoặc đăng ký qua auth-4/auth-5 không còn chuyển động bị cấm, gradient tự chọn hay chữ kích thước tuỳ ý, và lỗi nhóm (auth) hiện error.tsx

Vì sao: 7 vi phạm lint. (auth)/** thuộc t3_paths nên tách khỏi UI2.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: …
- Kết quả nào là SỐNG: …
- Kết quả nào là CHẾT: …
- Timebox: …
