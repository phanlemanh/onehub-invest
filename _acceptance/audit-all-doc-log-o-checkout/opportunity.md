---
schema_version: 1
slug: audit-all-doc-log-o-checkout
feature: audit-all.sh và trang Ops ở máy local đọc log job ở checkout chính dù chạy từ worktree, không báo LIMITED hay «Hỏng» giả vì thư mục log rỗng
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON16
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON16 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

audit-all.sh và trang Ops ở máy local đọc log job ở checkout chính dù chạy từ worktree, không báo LIMITED hay «Hỏng» giả vì thư mục log rỗng

Vì sao: YC5 — AU5 Ngoài-1/3 (dời đợt sau khi đóng gọn dot0): ROOT suy từ vị trí script nên worktree đọc pipeline/logs rỗng (trùng audit L12).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Chạy audit-all từ một worktree: các mục log đọc đúng tệp ở checkout chính, kết quả trùng lần chạy từ checkout chính» chưa?
- Kết quả nào là SỐNG: [đề xuất] Chạy audit-all từ một worktree: các mục log đọc đúng tệp ở checkout chính, kết quả trùng lần chạy từ checkout chính
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Chạy audit-all từ một worktree: các mục log đọc đúng tệp ở checkout chính, kết quả trùng lần chạy từ checkout chính» khi hết timebox
- Timebox: …
