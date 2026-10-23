---
schema_version: 1
slug: canonical-khong-tin-gia
feature: Bảng canonical không còn tin sinh từ dữ liệu thử, và transform từ chối post thử nếu lọt vào
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh gõ «build duyệt» ở thẻ khởi tạo đợt dot0-cam-mau
decided_by: Mạnh
decided_at: 2026-10-23T09:02:39Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL2
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL2 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).

Bảng canonical không còn tin sinh từ dữ liệu thử, và transform từ chối post thử nếu lọt vào

Vì sao: L19: 93% tin S03 là giả; 153/155 bait gap S03 tính trên tin giả; có thể đã lên cloud. Dọn qua reconcile_stale_offers để có audit.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «0 dòng sale_offers và sellers sinh từ snapshot thử; ops_audit có dòng dọn; tính lại bait gap» chưa?
- Kết quả nào là SỐNG: [đề xuất] 0 dòng sale_offers và sellers sinh từ snapshot thử; ops_audit có dòng dọn; tính lại bait gap
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «0 dòng sale_offers và sellers sinh từ snapshot thử; ops_audit có dòng dọn; tính lại bait gap» khi hết timebox
- Timebox: …
