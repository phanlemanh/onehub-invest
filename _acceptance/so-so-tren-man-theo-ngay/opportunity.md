---
schema_version: 1
slug: so-so-tren-man-theo-ngay
feature: Người vận hành mở /ops/data-flow và thấy mỗi con số mốc của S03 — có dự án, gắn toà, có hạng cấp dự án, có hạng cấp toà — theo từng ngày, kèm mức đổi so với hôm trước
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: SM1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng SM1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/dat-lai-lo-trinh-1511.md#b00cddc4283afe255830157060caff31141d3f18` — chưa có trang: mã R8
Mốc: Tin S03 có dự án ngay lúc nạp: ô «Định vị» của S03 trên /ops/data-flow đạt từ 90% tin đang rao, và mọi nhóm S03 có thẻ địa chỉ — chưa có ngày.

Người vận hành mở /ops/data-flow và thấy mỗi con số mốc của S03 — có dự án, gắn toà, có hạng cấp dự án, có hạng cấp toà — theo từng ngày, kèm mức đổi so với hôm trước

Vì sao: Điều tra 15/11 ghi «chưa đo được»: không có lịch sử số trên màn theo ngày nên không biết hàng nào làm số tăng. Luật 15/11: hàng trên đường găng xong khi con số trên màn đổi.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Mỗi lượt đêm ghi một dòng số mốc; chạy lại cùng ngày không nhân dòng; số trên biểu đồ khớp số của màn chặng cùng thời điểm; số đứng yên hai ngày liền thì ô được đánh dấu» chưa?
- Kết quả nào là SỐNG: [đề xuất] Mỗi lượt đêm ghi một dòng số mốc; chạy lại cùng ngày không nhân dòng; số trên biểu đồ khớp số của màn chặng cùng thời điểm; số đứng yên hai ngày liền thì ô được đánh dấu
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Mỗi lượt đêm ghi một dòng số mốc; chạy lại cùng ngày không nhân dòng; số trên biểu đồ khớp số của màn chặng cùng thời điểm; số đứng yên hai ngày liền thì ô được đánh dấu» khi hết timebox
- Timebox: …
