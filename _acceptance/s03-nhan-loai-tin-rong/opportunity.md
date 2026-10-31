---
schema_version: 1
slug: s03-nhan-loai-tin-rong
feature: Bộ nhận loại tin S03 nhận tin bán và tin thuê không ghi chữ «bán/cho thuê» theo bối cảnh nhóm và đơn vị giá, vẫn loại bài khách tìm nhà
owner: phanlemanh@gmail.com
stage: decided                # discovery | decided | archived
decision: build           # Mạnh «Giao U1 sửa» 31/10, giám sát đợt dot0 chuyển (ưu tiên 1); bổ sung «toàn bộ group đã tham gia đều là mua bán», «nên tin họ mặc định là mua bán và cho thuê thiếu bối cảnh group»
decided_by: Mạnh
decided_at: 2026-10-31T09:00:00Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: RM1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng RM1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt ra-mat-0511, mã RM1
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Bộ nhận loại tin S03 nhận tin bán và tin thuê không ghi chữ «bán/cho thuê» theo bối cảnh nhóm và đơn vị giá, vẫn loại bài khách tìm nhà

Vì sao: parsePost chỉ nhận chữ «bán»/«cho thuê» nên loại 72% bài S03 (25.415/35.359); mẫu 3 ngày có 306 bài giá tỷ + dấu hiệu BĐS bị bỏ (~100/ngày). Mục tiêu ra mắt 05/11: S03 200 tin mới/ngày (ROADMAP).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Trên mẫu gắn nhãn: recall tin bán S03 tăng so với trước, precision không giảm, bài cầu (khách cần/tìm/xem) vẫn bị loại» chưa?
- Kết quả nào là SỐNG: [đề xuất] Trên mẫu gắn nhãn: recall tin bán S03 tăng so với trước, precision không giảm, bài cầu (khách cần/tìm/xem) vẫn bị loại
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Trên mẫu gắn nhãn: recall tin bán S03 tăng so với trước, precision không giảm, bài cầu (khách cần/tìm/xem) vẫn bị loại» khi hết timebox
- Timebox: …
