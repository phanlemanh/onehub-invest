---
schema_version: 1
slug: s06-duong-du-an-len-tin
feature: Đường và dự án của tin S06 đi tới tin và căn, không rơi giữa chừng
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh «Chốt, chuyển việc» ở phiên MT local_c69a4aa4-32c7-456d-a9e5-878ea1e76c0f (kế hoạch ra mắt 05/11, §3 việc 6); giám sát đợt dot0-cam-mau giao
decided_by: Mạnh
decided_at: 2026-11-02T15:41:12Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DS1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng DS1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt ke-hoach-ra-mat-0211, mã V6
Mốc: Ba việc của kế hoạch ra mắt 05/11 xong; từ 22:00 ngày 04/11 chỉ gộp bản vá đường ống — 04/11/2026.

Đường và dự án của tin S06 đi tới tin và căn, không rơi giữa chừng

Vì sao: Chỉ số Không tệ đi: đường 95% ở thô còn 19% ở tin và căn; dự án 22% ở thô còn 0.

## Ngưỡng chết / ngưỡng UAT

- Dự án của tin và căn tách sang hàng DS2 `s06-du-an-len-tin-can` (Mạnh chọn tách ở Hỏi-1, 03/11): vế «dự án có mặt ở tin và căn» trong ngưỡng dưới do DS2 đo, vòng này đo hai vế còn lại.
- Câu hỏi phép đo trả lời: đã đạt «Đường ≥ 90% ở tin; dự án có mặt ở tin và căn; các trường khác không giảm quá 1 điểm %» chưa?
- Kết quả nào là SỐNG: Đường ≥ 90% ở tin; dự án có mặt ở tin và căn; các trường khác không giảm quá 1 điểm %
- Kết quả nào là CHẾT: chưa đạt «Đường ≥ 90% ở tin; dự án có mặt ở tin và căn; các trường khác không giảm quá 1 điểm %» khi hết timebox
- Timebox: 2026-11-04 (mốc Ba việc của kế hoạch ra mắt 05/11 xong; từ 22:00 ngày 04/11 chỉ gộp bản vá đường ống)
