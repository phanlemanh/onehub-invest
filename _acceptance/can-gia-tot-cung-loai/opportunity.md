---
schema_version: 1
slug: can-gia-tot-cung-loai
feature: Số giảm của Căn giá tốt ở /ops/deals và ở API /v1/deals chỉ so tin với thước cùng phường × loại hình × bán/thuê; tin chưa rõ loại hình không có số giảm và ghi lý do
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh chốt Q1–Q5 «Căn giá tốt theo vị trí» 09/11 («Chốt theo đề xuất»; CG8 đứng đầu — Q5); giám sát đợt dot0-cam-mau ghi ô
decided_at: 2026-11-09T23:37:30Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Phân tích 09/11: thước của /ops/deals (v_ruler_p2_area qua refresh-bait-gap) và /v1/deals (market_asset_stats) gộp mọi loại hình theo phường; trung vị giá/m² căn hộ thấp hơn trung vị cả phường 45,5% (127 phường), nên căn hộ đúng giá vẫn hiện «rẻ» khoảng 45% trên API công khai.

Hàng CG8 trong `docs/plan/lo-trinh.json` (PR #394, bản phạm vi `docs/plan/pham-vi-can-gia-tot-vi-tri-0911.md`). Q5: làm trước mọi hàng, tách khỏi PL26 (PL26 chờ AU9, PL21). Dùng thước phường × loại có sẵn (v_ruler_p2, market_asset_stats theo kind), không migration. S06 có loại hình 100%; tin P1 chưa rõ loại không chấm thay cho «thước cả phường» của PL26.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Trên DB máy thu: phép đếm SQL độc lập cho 0 tin có số giảm tính từ thước khác loại hình hoặc khác bán/thuê ở cả hai đường; trung vị số giảm của tin căn hộ không còn lệch theo trung vị cả phường (09/11: −45,5%); tin chưa rõ loại có lý do «chưa rõ loại hình», không vào danh sách?
- Kết quả nào là SỐNG: [đề xuất] Trên DB máy thu: phép đếm SQL độc lập cho 0 tin có số giảm tính từ thước khác loại hình hoặc khác bán/thuê ở cả hai đường; trung vị số giảm của tin căn hộ không còn lệch theo trung vị cả phường (09/11: −45,5%); tin chưa rõ loại có lý do «chưa rõ loại hình», không vào danh sách
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
