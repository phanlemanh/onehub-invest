---
schema_version: 1
slug: viewer-khong-thay-the-duyet
feature: Vai người xem (viewer) vào được Cổng Ops nhưng không thấy nội dung thẻ duyệt, tin gốc và ảnh — chỉ vai vận hành trở lên thấy
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau theo Mạnh 27/10 — Mạnh chọn «mở hợp đồng mới» cho Ngoài-9 ở Cổng Bằng chứng quyen-bon-vai-mot-cho; trả lời P1-38
decided_at: 2026-10-27T02:30:00Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

TV1 (`quyen-bon-vai-mot-cho`, PR #155) thêm vai `viewer` và cho nó qua `canAccessOps`. Trang `/ops/review` chỉ kiểm
`canAccessOps` rồi vẽ nội dung thẻ duyệt (tiêu đề, bằng chứng, gợi ý và lý giải của AI). Luật 6 của AGENTS.md (sửa đổi
ADR-0007) chỉ cho nội dung bài gốc, ảnh tin và thẻ duyệt lên cloud «cho vai `ops` trở lên»; §3.5 của
`docs/research/ops-tu-van-hanh-nguon-saas.md` cho viewer xem «mã S0x, số, tin đã che». Hôm nay chưa ai mang vai viewer,
nhưng cấp vai đó cho ai là người đó thấy thẻ duyệt nguyên văn. Nguồn: Ngoài-9 của
`_acceptance/quyen-bon-vai-mot-cho/review-findings.md`.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: một phiên vai viewer có đọc được nội dung thẻ duyệt, tin gốc hay ảnh tin ở bất kỳ trang hay
  API Ops nào không?
- Kết quả nào là SỐNG: 0 chỗ — mọi chỗ ấy che hoặc từ chối với viewer, còn vai ops trở lên thấy như hôm nay.
- Kết quả nào là CHẾT: còn một chỗ viewer đọc được nội dung tầng «ops trở lên».
- Timebox: trong đợt dot0-cam-mau, trước khi cấp vai viewer cho ai.
