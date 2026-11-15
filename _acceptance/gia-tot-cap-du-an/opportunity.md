---
schema_version: 1
slug: gia-tot-cap-du-an
feature: Người vận hành thấy tin có dự án được xếp hạng trong nhóm dự án × loại (× số phòng ngủ) và mang nhãn «giá tốt» khi nằm trong 20% thấp nhất và thấp hơn trung vị từ 5% — giá/m² cho tin bán và tin thuê có m², giá thuê/tháng theo số phòng ngủ cho tin thuê thiếu m²; tin chỉ biết phường mang «rẻ trong phường»; mỗi dòng ghi so với bao nhiêu căn của nhóm nào và thước đang dùng
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: CG10
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng CG10 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/can-gia-tot-vi-tri.md#91238b9784bb1f1d04077cdf336a49f81184726f` — chưa có trang: trang đợt can-gia-tot-vi-tri-0911
Mốc: Nhịp 1: người vận hành chọn một dự án trên Ops và thấy căn xếp theo hạng giá — chưa có ngày.

Người vận hành thấy tin có dự án được xếp hạng trong nhóm dự án × loại (× số phòng ngủ) và mang nhãn «giá tốt» khi nằm trong 20% thấp nhất và thấp hơn trung vị từ 5% — giá/m² cho tin bán và tin thuê có m², giá thuê/tháng theo số phòng ngủ cho tin thuê thiếu m²; tin chỉ biết phường mang «rẻ trong phường»; mỗi dòng ghi so với bao nhiêu căn của nhóm nào và thước đang dùng

Vì sao: Phân tích 09/11: ở cấp phường p20 thấp hơn trung vị 17,6% chủ yếu do khác dự án; ở cấp dự án chỉ 5,3%, nên «giá tốt» chỉ đúng nghĩa từ cấp dự án (Q1, Q3). Đại diện: 2.732 tin bán S06 trong 124 dự án có nhóm từ 10.

## Ngưỡng chết / ngưỡng UAT

Căn cứ: ROADMAP §3 mục 48 (mỏ neo 14/11, QĐ4 thước thuê, QĐ9 ba nhịp — MN1 «cấp dự án trên Ops»; thước chính «số tin căn hộ đang
rao được xếp hạng giá từ cấp dự án trở xuống và hiện trên màn», 14/11: 0) và mục 50 (hàng trên đường găng xong khi số trên màn đổi
trên dữ liệu thật; «Có, cấp dự án» cho dải diện tích suy ra, gộp vào CG10). Số đo chỉ đọc DB máy thu 15/11 (bảng phủ ca ở ghi chú
GS `cg10-bang-phu-ca-va-phac-thiet-ke.md`).

- Câu hỏi phép đo trả lời: trên Ops máy thu, người vận hành chọn một dự án có thấy căn xếp theo hạng giá TRONG dự án đó không — và
  số tin căn hộ có hạng cấp dự án trên màn đổi từ 0 lên bao nhiêu?
- Kết quả nào là SỐNG: (1) `/ops/deals` lọc Vinhomes Ocean Park 1 ra danh sách tin bán mang nhãn «Giá tốt» cấp dự án, mỗi dòng ghi
  «so với N căn cùng dự án …» (OP1 có 714 phiếu bán giá/m², chia đủ 4 nhóm PN ≥10; số tin nhãn đúng lấy từ chạy bản chấm CG10 trên
  bản chép ở S1, trần ≈ 140); (2) trang một căn thuê OP1 thiếu m² hiện hạng giá tháng × số phòng ngủ (201 tin, nhóm PN 0/1/2/3 =
  61/118/128/24); (3) thước chính MN1 trên DB máy thu ≥ 10.000 tin căn hộ có hạng cấp dự án (trần đo được ≈ 13.450: bán giá/m²
  4.591 · thuê giá/m² 6.228 · thuê giá tháng × PN 2.632, trước khi trừ tin phi lý).
- Kết quả nào là CHẾT: sau lượt chấm thật trên máy thu, dưới 5.000 tin có hạng cấp dự án, hoặc OP1 không có tin bán nào mang nhãn cấp
  dự án, hoặc Mạnh mở 10 tin nhãn «Giá tốt» ở OP1 mà quá 3 tin sai rõ (khác dự án, khác loại, giá lệch) → iterate thước, không lên
  nhịp 2.
- Timebox: một vòng, trước hết ngày 17/11/2026 (nhịp 1 đang chặn hàng ngoài đường găng — mục 50).
