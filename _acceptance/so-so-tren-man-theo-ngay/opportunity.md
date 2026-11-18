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

## Đo hiện trạng (18/11, DB máy thu, chỉ đọc)

| Số mốc của S03 | Hôm nay | Nguồn số | Lịch sử theo ngày |
|---|---|---|---|
| Có dự án | 6.890 / 7.070 tin (97,45%) | ô «Định vị» trong `data_flow_snapshot`, lượt 04:43Z | Không có |
| Gắn toà | 0 | chưa có bảng nối tin với toà (`toa_link` trong 600 đang rỗng) | Không có |
| Có hạng cấp dự án | 5.428 tin, 1.119 tin nhãn «giá tốt» | `offer_price_rank`, `cap = 'du_an'`, lượt 04:50Z | Không có |
| Có hạng cấp toà | 0 | chưa có giá trị `cap` cho toà | Không có |

- Biểu đồ «Chặng theo ngày» hiện có đếm bài và tin MỚI theo ngày đăng. Nó không cho biết tổng số tin đạt mốc ở mỗi ngày, nên không trả lời được hàng nào làm số tăng.
- `data_flow_snapshot` bị xoá và ghi lại mỗi 15 phút, nên không giữ được số của ngày trước.
- Không dựng lại được quá khứ: `offer_project` và `offer_price_rank` chỉ giữ trạng thái hiện tại. Biểu đồ bắt đầu từ lượt ghi đầu tiên.
- Số đếm trực tiếp lệch màn trong khoảng giữa hai lượt làm tươi (cùng lúc đo: 6.896 / 7.077 so với 6.890 / 7.070). Dòng theo ngày phải lấy từ đúng lượt làm tươi của màn thì mới khớp.
- Lời giao ghi hạng cấp dự án 5.553 tin (1.145 có nhãn); phép đếm trên tin S03 đang rao ra 5.428 (1.119). Định nghĩa số này chốt ở Cổng Phạm vi.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Mỗi lượt đêm ghi một dòng số mốc; chạy lại cùng ngày không nhân dòng; số trên biểu đồ khớp số của màn chặng cùng thời điểm; số đứng yên hai ngày liền thì ô được đánh dấu» chưa?
- Kết quả nào là SỐNG: [đề xuất] Mỗi lượt đêm ghi một dòng số mốc; chạy lại cùng ngày không nhân dòng; số trên biểu đồ khớp số của màn chặng cùng thời điểm; số đứng yên hai ngày liền thì ô được đánh dấu
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Mỗi lượt đêm ghi một dòng số mốc; chạy lại cùng ngày không nhân dòng; số trên biểu đồ khớp số của màn chặng cùng thời điểm; số đứng yên hai ngày liền thì ô được đánh dấu» khi hết timebox
- Timebox: [đề xuất] ba lượt đêm liên tiếp sau khi hàng được gộp và áp lên máy thu
