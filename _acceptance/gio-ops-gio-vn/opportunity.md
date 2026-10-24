---
schema_version: 1
slug: gio-ops-gio-vn
feature: Người vận hành đọc mọi mốc giờ trên cổng Ops theo giờ Việt Nam có ghi múi, ngày gom theo giờ Việt Nam, và nguồn quá hạn hiện đúng mức trễ thay vì tuổi bằng SLO
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON8
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON8 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành đọc mọi mốc giờ trên cổng Ops theo giờ Việt Nam có ghi múi, ngày gom theo giờ Việt Nam, và nguồn quá hạn hiện đúng mức trễ thay vì tuổi bằng SLO

Vì sao: OPS-7: cắt chuỗi ISO UTC bằng slice(0,16), lệch 7 tiếng (AirDNA lịch 19:05 hiện 12:13); getFlowDays chia ngày UTC. YC4 (AU6 Ngoài-3): fmtAge làm tròn xuống nên «8 ngày / SLO 8 ngày». Gốc G3.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Mốc 2026-10-23T12:13Z hiện «19:13 (GMT+7)» ở mọi bảng Ops; tin lúc 23:30 giờ VN rơi vào đúng ngày VN; nguồn trễ 8,4 ngày với SLO 8 ngày hiện mức trễ, không «8 ngày / SLO 8 ngày»» chưa?
- Kết quả nào là SỐNG: [đề xuất] Mốc 2026-10-23T12:13Z hiện «19:13 (GMT+7)» ở mọi bảng Ops; tin lúc 23:30 giờ VN rơi vào đúng ngày VN; nguồn trễ 8,4 ngày với SLO 8 ngày hiện mức trễ, không «8 ngày / SLO 8 ngày»
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Mốc 2026-10-23T12:13Z hiện «19:13 (GMT+7)» ở mọi bảng Ops; tin lúc 23:30 giờ VN rơi vào đúng ngày VN; nguồn trễ 8,4 ngày với SLO 8 ngày hiện mức trễ, không «8 ngày / SLO 8 ngày»» khi hết timebox
- Timebox: …
