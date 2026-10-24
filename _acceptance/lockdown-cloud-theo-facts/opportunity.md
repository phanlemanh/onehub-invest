---
schema_version: 1
slug: lockdown-cloud-theo-facts
feature: Người vận hành mở /ops/collections trên cloud thấy Lockdown và Máy móc đọc từ số máy local đẩy lên (ADR-0014) kèm mốc đo; lớp không có kết quả hiện «Chỉ kiểm ở máy local», không lớp nào xanh khi không kiểm
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON23
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON23 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành mở /ops/collections trên cloud thấy Lockdown và Máy móc đọc từ số máy local đẩy lên (ADR-0014) kèm mốc đo; lớp không có kết quả hiện «Chỉ kiểm ở máy local», không lớp nào xanh khi không kiểm

Vì sao: OPS-3 (cao, an toàn Zalo): getLockdownStatus không có nhánh cloud — hạ tầng «Hỏng» giả, L4b «Ổn» giả có thể che một sự cố agent-turn thật; hai bảng cùng trang mâu thuẫn. OPS-19: tail log không lọc dòng cảnh báo Node. Gốc G1 + G2.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Cloud không có facts lockdown: 8/8 lớp «Chỉ kiểm ở máy local», 0 lớp xanh; facts có kết quả: Lockdown và Máy móc cùng một trạng thái cho Kev gate và collector API» chưa?
- Kết quả nào là SỐNG: [đề xuất] Cloud không có facts lockdown: 8/8 lớp «Chỉ kiểm ở máy local», 0 lớp xanh; facts có kết quả: Lockdown và Máy móc cùng một trạng thái cho Kev gate và collector API
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Cloud không có facts lockdown: 8/8 lớp «Chỉ kiểm ở máy local», 0 lớp xanh; facts có kết quả: Lockdown và Máy móc cùng một trạng thái cho Kev gate và collector API» khi hết timebox
- Timebox: …
