---
schema_version: 1
slug: tang-tren-tin-s03
feature: Tin S03 ghi tầng (số tầng hay dải cao, trung, thấp) mang phát biểu tầng có trích dẫn, ở field đã kiểm RESO
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh "Build cả bốn" ở phiên giám sát, Cổng Đáng DV2–DV5 (10/11, sổ đợt h-20261110T142001Z-142)
decided_by: Mạnh
decided_at: 2026-11-10T14:20:00Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DV4
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng DV4 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/dinh-vi-gom-tin-s03.md#b77428029e34624bf732a2bb51a21f1ef40976b6` — chưa có trang: trang đợt dinh-vi-gom-tin-s03-1011
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Tin S03 ghi tầng (số tầng hay dải cao, trung, thấp) mang phát biểu tầng có trích dẫn, ở field đã kiểm RESO

Vì sao: Đo 09/11: 15% tin căn hộ S03 ghi tầng, phần lớn là dải; floor_raw của S03 đang trống.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Trên mẫu đọc tay, tầng đọc đúng từ 95%; mốc kiểu «T4/2027» không bị đọc thành tầng; field_assertions nhận field tầng, field lạ vẫn bị từ chối; nạp lại không nhân phát biểu» chưa?
- Kết quả nào là SỐNG: [đề xuất] Trên mẫu đọc tay, tầng đọc đúng từ 95%; mốc kiểu «T4/2027» không bị đọc thành tầng; field_assertions nhận field tầng, field lạ vẫn bị từ chối; nạp lại không nhân phát biểu
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Trên mẫu đọc tay, tầng đọc đúng từ 95%; mốc kiểu «T4/2027» không bị đọc thành tầng; field_assertions nhận field tầng, field lạ vẫn bị từ chối; nạp lại không nhân phát biểu» khi hết timebox
- Timebox: …
