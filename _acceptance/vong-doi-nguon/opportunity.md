---
schema_version: 1
slug: vong-doi-nguon
feature: source_registry và sổ nhóm có vòng đời năm trạng thái kiểm bằng CHECK kèm lý do và điều kiện bật lại, và một hàm isRunnable trả quyết định chạy cho từng nguồn và đơn vị thu
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau theo Mạnh 26/10 «Cắt 4 mốc Ops tự vận hành … vào dãy P1 và U2» và ADR-0015 đã duyệt (#124)
decided_at: 2026-10-26T05:50:00Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: TV2a
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng TV2a của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`), mốc «Đội vận hành tạm dừng/bật nguồn và quản nhóm
S05/S06 từ cloud, có nhật ký người thật». G1 (`docs/research/ops-tu-van-hanh-nguon-saas.md` §2.4): status không CHECK,
«paused» chỉ tắt đo độ tươi — không script thu nào tuân. Đứng trên TV0 (ADR-0015, #124). Mở cửa cho PL12 → TV11 (dãy U2),
TV4 và TV2b (ZCode).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] DB và một hàm có quyết định chạy đúng cho mọi trạng thái nguồn × đơn vị chưa?
- Kết quả nào là SỐNG: [đề xuất] Trạng thái ngoài draft/active/paused/retired/completed: DB từ chối; isRunnable đúng trên đủ ma trận trạng thái nguồn × đơn vị; paused thiếu reason: từ chối
- Kết quả nào là CHẾT: [đề xuất] còn một ô của ma trận trả sai, hoặc DB nhận trạng thái ngoài năm giá trị, khi hết timebox
- Timebox: …
