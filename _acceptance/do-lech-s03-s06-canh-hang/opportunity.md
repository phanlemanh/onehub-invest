---
schema_version: 1
slug: do-lech-s03-s06-canh-hang
feature: "Người vận hành mở một dự án trên Căn giá tốt và thấy cạnh hạng của mỗi tin S03 mặt bằng giá của tin S06 cùng dự án, cùng loại và số phòng ngủ: trung vị hai nguồn, độ lệch phần trăm và số tin mỗi bên"
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: CG15
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng CG15 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/dat-lai-lo-trinh-1511.md#b00cddc4283afe255830157060caff31141d3f18` — chưa có trang: mã R4
Mốc: Tin S03 có hạng giá cấp dự án trên /ops/deals, kèm độ lệch so mặt bằng S06 cùng dự án — chưa có ngày.

Người vận hành mở một dự án trên Căn giá tốt và thấy cạnh hạng của mỗi tin S03 mặt bằng giá của tin S06 cùng dự án, cùng loại và số phòng ngủ: trung vị hai nguồn, độ lệch phần trăm và số tin mỗi bên

Vì sao: ROADMAP §3 mục 51: S03 là tin môi giới trao đổi với nhau, S06 là kênh quảng cáo nên giá có thể lệch. Độ lệch hai nguồn chưa từng được đo; đây cũng là dữ kiện cho người đọc hạng.

Số phủ đo nhanh trên DB máy thu (15/11, tin S03/S06 thấy trong 45 ngày, đã quy về một dự án qua view 105, nhóm dự án × bán/thuê × loại × PN):
thuê 760 nhóm — 3.271 tin S03, trong đó 2.718 tin (83%) nằm ở nhóm có ≥5 tin S06 làm mặt bằng; 29 nhóm chỉ có S03, 723 nhóm chỉ có S06.
bán 726 nhóm — 1.660 tin S03, trong đó 1.122 tin (68%) có ≥5 tin S06 cùng nhóm; 31 nhóm chỉ S03, 684 nhóm chỉ S06.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Mỗi nhóm dự án × loại × số phòng ngủ đủ căn ở cả hai nguồn có một dòng độ lệch tính sẵn ở pipeline; nhóm thiếu một bên ghi «chưa đủ để so»; số trên màn khớp truy vấn trên DB máy thu; chạy lại cùng ngày không nhân dòng» chưa?
- Kết quả nào là SỐNG: [đề xuất] Mỗi nhóm dự án × loại × số phòng ngủ đủ căn ở cả hai nguồn có một dòng độ lệch tính sẵn ở pipeline; nhóm thiếu một bên ghi «chưa đủ để so»; số trên màn khớp truy vấn trên DB máy thu; chạy lại cùng ngày không nhân dòng
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Mỗi nhóm dự án × loại × số phòng ngủ đủ căn ở cả hai nguồn có một dòng độ lệch tính sẵn ở pipeline; nhóm thiếu một bên ghi «chưa đủ để so»; số trên màn khớp truy vấn trên DB máy thu; chạy lại cùng ngày không nhân dòng» khi hết timebox
- Timebox: …
