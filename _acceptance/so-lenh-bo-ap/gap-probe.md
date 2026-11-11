---
slug: so-lenh-bo-ap
at: 2026-11-10T13:45:00Z
verdict: findings
p0: 1
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ d-20261110T132433Z-5 gom ba luật quyền (admin tự duyệt, source.resume chỉ admin, S03 cần người thứ hai) dưới một câu trích chỉ quyết việc ops gửi pause | Một admin gửi rồi tự duyệt source.resume S05 mà không câu nào đã chốt điều đó, và không ca nào đo | Mỗi luật một dòng sổ có câu trích quyết được nó; E3 thêm ca admin tự duyệt lệnh không S03 | fixed: bốn dòng S1 mới supersedes d-5, mỗi dòng trích nguyên văn ADR-0015 §6 hoặc tài liệu §3.5, §4.8 #4; AC-3 và E3 thêm ca admin A tự duyệt source.resume S05 → 200 |
| P1 | evals | Hai mối nối của đường lệnh (khuôn lệnh route pull → ops-apply, tệp kết quả ops-apply → ingest) chỉ đo bằng fixture viết tay | Route pull đổi tên khoá, mọi eval vẫn xanh, sau nạp plist lệnh nằm queued mãi | Ca đầu-cuối qua handler thật ở cả hai mối, đối chứng đổi tên khoá | fixed: AC-8 thêm vế đầu-cuối; E11 ca SL-NOI chạy ops-apply thật qua route pull và ingest thật, đối chứng đổi khoá idempotency_key |
| P1 | contract | Route cloud ghi ops_audit cùng giao dịch nhưng 091 không bảo đảm bảng có ở cloud; lược đồ thử của route không ghim là khuôn cloud | Áp 091 lên Supabase thiếu ops_audit thì mọi lệnh trả 500 | 091 tạo ops_audit IF NOT EXISTS khuôn 018; ca route chạy trên lược đồ kiểu cloud | fixed: AC-1 thêm ops_audit vào lược đồ cloud do 091 tạo, đo cột đúng 018; E2, E3 chạy trên lược đồ kiểu cloud; dòng sổ S1 ghi lựa chọn |
| P2 | evals | E1 kiểm CHECK 14 loại và 9 trạng thái bằng danh sách chép tay | Migration và test cùng gõ sai một tên loại, E1 vẫn xanh | Rút danh sách từ ADR-0015 §4, §5; so với pg_constraint và LOAI_LENH hai bản | fixed: E1 rút danh sách bằng bộ đọc tệp, assert 14 và 9, so ba nguồn; đối chứng đổi tên một loại |
