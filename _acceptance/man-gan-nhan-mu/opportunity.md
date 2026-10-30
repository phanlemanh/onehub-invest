---
schema_version: 1
slug: man-gan-nhan-mu
feature: Người gắn nhãn mở màn gắn nhãn trên /ops, gắn trường lõi cho tin của lát mà không thấy giá trị máy đoán, và 20% tin được gắn trùng để đo đồng thuận
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-29T23:59:28Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL7
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL7 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6` — chưa có trang: mã C1.3
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người gắn nhãn mở màn gắn nhãn trên /ops, gắn trường lõi cho tin của lát mà không thấy giá trị máy đoán, và 20% tin được gắn trùng để đo đồng thuận

Vì sao: T6 Đo là gốc mọi con số độ tin (§0.2); F5: Mạnh và đội gắn nhãn.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: người gắn nhãn có gắn được lát đầu (khoảng 200 tin và 100 cặp) trên màn này với số đo đáng tin không?
- Kết quả nào là SỐNG: trên phần 20% tin gắn trùng hai người, độ đồng thuận đạt 0,9 trở lên (ngưỡng F5).
- Kết quả nào là CHẾT: đồng thuận dưới 0,9 sau một lần sửa hướng dẫn gắn nhãn, hoặc gắn hết lát tốn quá khoảng 6 giờ công.
- Timebox: 2 tuần sau khi gộp.

## Cổng 0

- **decision = build** Căn cứ: Mạnh chọn «Làm theo khuyến nghị» ngày 30/10/2026 (giờ VN). Tập nhãn là gốc mọi con số độ tin (§0.2, T6 Đo); PL8 và PL9 xếp ngay sau hàng này; PL6 đã ký.
- **disposition = (không có bản mẫu)** Căn cứ: hàng mở thẳng từ lộ trình, không qua prototype.
- **Ngưỡng UAT chốt cùng lúc ký:** như mục Ngưỡng ở trên.
- **Lưu nhãn:** cho mở một migration mới (số do sổ migration cấp, dự kiến 053); nhãn chỉ lưu ở máy thu, không lên cloud (theo C1.3). Đánh đổi đã nêu với Mạnh: người gắn nhãn thuê ngoài phải ngồi máy thu; gắn từ xa qua cloud là hàng riêng nếu cần.
