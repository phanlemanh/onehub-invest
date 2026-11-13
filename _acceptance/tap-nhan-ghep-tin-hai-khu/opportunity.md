---
schema_version: 1
slug: tap-nhan-ghep-tin-hai-khu
feature: Mẫu 300–450 bài căn hộ S03 của Ocean Park 1 và Grand Park chọn phân tầng theo khu và mức gắn, có nháp nhãn toà, trục, căn do tác tử điền kèm căn cứ, nạp vào eval_labels ở trạng thái nháp chờ người duyệt trên /ops/labels, và đóng băng được thành tập test của PL20
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-11-13T02:24:37Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL35
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL35 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/no-cat-hang-1311.md#8930a18f0d39e9d314ff3b6fc06e2e166a265920` — chưa có trang: mã B13
Mốc: Tin rao mang dự án và gắn được vào danh bạ; trang dự án trên Invest hiện thông tin có nguồn — chưa có ngày.

Mẫu 300–450 bài căn hộ S03 của Ocean Park 1 và Grand Park chọn phân tầng theo khu và mức gắn, có nháp nhãn toà, trục, căn do tác tử điền kèm căn cứ, nạp vào eval_labels ở trạng thái nháp chờ người duyệt trên /ops/labels, và đóng băng được thành tập test của PL20

Vì sao: Số đo S1 của PL20 (12/11): chưa có tập test nhãn người ở mức trục, toà nên cận dưới Wilson không đo được. Mạnh chốt 06/11: trợ lý điền nháp, Mạnh duyệt.

### Số đo nền (S1 của PL20, 12/11 — `ghep-tin-vao-danh-muc/gap-probe.md`)

| | Ocean Park 1 | Grand Park |
|---|---|---|
| Bài căn hộ S03 | 6.301 | 4.683 |
| Có phát biểu toà hay mã căn | 5.160 | 1.881 |
| Gắn được toà (danh bạ hiện tại) | 2.415 | 506 |
| Gắn được trục | 166 | 1 |
| Gắn được căn | 0 | 0 |
| Tên toà không có trong danh bạ | 2.579 | 1.355 |

- Ngưỡng nhóm A: cận dưới Wilson 0,95 (ADR-0013) — cần khoảng ≥ 73 ca đúng hết mỗi tầng.
- Hệ quả cho cách chia tầng: tầng «căn» gần như không có bài và tầng «trục» Grand Park chỉ 1 bài, nên không thể có
  đủ 73 ca ở mọi ô khu × mức gắn. Đề xuất chia tầng: khu × {toà, trục (chỉ Ocean Park 1), không gắn được} ≈ 5 tầng ×
  ~75 bài ≈ 375 bài (trong khoảng 300–450 của hàng); mức căn và trục Grand Park khai giới hạn, đo lại sau DA31/GC.
- Hàng đứng sau DA31 (toà S09 hai khu vào danh bạ): chọn mẫu trên danh bạ thiếu toà sẽ dồn bài vào tầng «không gắn».

### Công người (đây là chi phí chính của hàng)

- Mạnh (hoặc người Mạnh giao) duyệt từng nháp trên `/ops/labels`: ~375 bài × 30–45 giây/bài ≈ **3–5 giờ**, chia được
  nhiều buổi; PL20 chỉ đo trên phần đã duyệt nên duyệt dở vẫn dùng được (cận dưới Wilson rộng hơn).
- Máy làm: chọn mẫu tất định, tác tử điền nháp toà/trục/căn kèm câu trích làm căn cứ (không đọc kết quả bộ gắn PL20),
  đóng băng tập có băm. Chi phí model: một lượt đọc ~375 bài.
- Không dùng thì sao: PL20 không có tập test nhãn người ở mức toà/trục → không đo được cận dưới Wilson, không mở được
  hàng gắn căn.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Chọn mẫu chạy lại ra cùng tập (hạt cố định); mỗi tầng đủ cỡ cho cận dưới Wilson ở ngưỡng nhóm A; nháp không ghi đè nhãn người; tập đóng băng có băm, đổi một dòng thì băm đổi; tác tử điền nháp không đọc kết quả của bộ gắn PL20» chưa?
- Kết quả nào là SỐNG: [đề xuất] Chọn mẫu chạy lại ra cùng tập (hạt cố định); mỗi tầng đủ cỡ cho cận dưới Wilson ở ngưỡng nhóm A; nháp không ghi đè nhãn người; tập đóng băng có băm, đổi một dòng thì băm đổi; tác tử điền nháp không đọc kết quả của bộ gắn PL20
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Chọn mẫu chạy lại ra cùng tập (hạt cố định); mỗi tầng đủ cỡ cho cận dưới Wilson ở ngưỡng nhóm A; nháp không ghi đè nhãn người; tập đóng băng có băm, đổi một dòng thì băm đổi; tác tử điền nháp không đọc kết quả của bộ gắn PL20» khi hết timebox
- Timebox: [đề xuất] phần máy 1 vòng (≤ 1 ngày máy sau khi DA31 gộp); phần người 3–5 giờ duyệt, không chặn vòng.
