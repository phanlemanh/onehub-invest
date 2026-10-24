---
schema_version: 1
slug: o-kpi-chi-do-local
feature: Người vận hành mở /ops, /ops/collections và /ops/review trên cloud thấy ô số đọc từ số máy local đẩy lên (ADR-0014) kèm «Số đo lúc HH:MM (giờ VN) từ máy local»; ô không có số ghi «—» kèm «Chỉ đo ở máy local» đúng một lần, số cũ quá 45′ báo «Máy local không đẩy số từ …», không badge xanh, không số 0 trấn an; /ops/review chỉ hiện «N thẻ đang chờ»
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh gõ ở phiên P2 24/10: «Cổng Đáng ON3 o-kpi-chi-do-local: build»
decided_by: Mạnh
decided_at: 2026-10-24T12:30:00Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON3
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON3 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành mở /ops, /ops/collections và /ops/review trên cloud thấy ô số đọc từ số máy local đẩy lên (ADR-0014) kèm «Số đo lúc HH:MM (giờ VN) từ máy local»; ô không có số ghi «—» kèm «Chỉ đo ở máy local» đúng một lần, số cũ quá 45′ báo «Máy local không đẩy số từ …», không badge xanh, không số 0 trấn an; /ops/review chỉ hiện «N thẻ đang chờ»

Vì sao: OPS-4, OPS-5 (cao): «Quá hạn 0» xanh, «Bản ghi 24h = 0» khi dữ liệu vẫn chảy — người trực tưởng pipeline chết hoặc tưởng mọi thứ ổn. YC6 (ops-prod-sap-source-registry Ngoài-2) cùng gốc. OPS-20: chữ chỉ-local lặp ba lần, bảng trống không hành động. Gốc G2.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Không facts (lược đồ như cloud): 0 ô KPI xanh hay số 0 trên ba trang, «Chỉ đo ở máy local» một lần mỗi trang; facts tươi: ô hiện đúng số của khối và mốc đo giờ VN; facts cũ 46′: Alert «Máy local không đẩy số từ …», 0 badge xanh; /ops/review cloud: «N thẻ đang chờ» bằng số đếm ở local» chưa?
- Kết quả nào là SỐNG: [đề xuất] Không facts (lược đồ như cloud): 0 ô KPI xanh hay số 0 trên ba trang, «Chỉ đo ở máy local» một lần mỗi trang; facts tươi: ô hiện đúng số của khối và mốc đo giờ VN; facts cũ 46′: Alert «Máy local không đẩy số từ …», 0 badge xanh; /ops/review cloud: «N thẻ đang chờ» bằng số đếm ở local
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Không facts (lược đồ như cloud): 0 ô KPI xanh hay số 0 trên ba trang, «Chỉ đo ở máy local» một lần mỗi trang; facts tươi: ô hiện đúng số của khối và mốc đo giờ VN; facts cũ 46′: Alert «Máy local không đẩy số từ …», 0 badge xanh; /ops/review cloud: «N thẻ đang chờ» bằng số đếm ở local» khi hết timebox
- Timebox: …
