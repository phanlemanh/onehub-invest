---
schema_version: 1
slug: s03-len-cong
feature: Nhà đầu tư mở trang tin rao và thấy tin S03 đủ giá, diện tích, kể cả tin không nói phường (mang khu vực cấp thị trường), kèm nhãn «chưa xác minh»
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: iterate        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-11-02T15:41:12Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: SL1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng SL1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt ke-hoach-ra-mat-0211, mã V3
Mốc: Ba việc của kế hoạch ra mắt 05/11 xong; từ 22:00 ngày 04/11 chỉ gộp bản vá đường ống — 04/11/2026.

Nhà đầu tư mở trang tin rao và thấy tin S03 đủ giá, diện tích, kể cả tin không nói phường (mang khu vực cấp thị trường), kèm nhãn «chưa xác minh»

Vì sao: 2.772 tin S03 chỉ 97 tin có khu vực nên cổng chỉ có 4 tin S03; 77% phường đang có là đọc nhầm hướng. Sổ nhóm 30 nhóm và thẻ 16 nhóm lớn cho tin khu vực đáng tin.

Cổng Đáng: Mạnh «Chốt, chuyển việc» lúc 15:41:12Z ngày 02/11 (phiên MT `local_c69a4aa4-32c7-456d-a9e5-878ea1e76c0f`) trên `docs/plan/ra-mat-0511-so-luong-chat-luong.md` §3 mục 3; giám sát đã đối chiếu và xác nhận (N1, 16:0xZ). Chỉ phủ việc 3.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: đã đạt «S03 lên cổng ≥ 900 tin; sai nặng ≤ 10%; tin khu vực cấp thị trường không có dấu hiệu theo phường và không làm lệch rollup 300, 400» chưa?
- Kết quả nào là SỐNG: S03 lên cổng ≥ 900 tin; sai nặng ≤ 10%; tin khu vực cấp thị trường không có dấu hiệu theo phường và không làm lệch rollup 300, 400
- Kết quả nào là CHẾT: đường gãy, số lên cổng không vượt 50 khi hết timebox. Dưới 900 mà trên 50 chỉ là cảnh báo, báo đúng số (kế hoạch §1: ngưỡng chỉ để cảnh báo, không chặn ra mắt; §4 mục 6: ra mắt S06 trước)
- Timebox: 2026-11-04 (mốc Ba việc của kế hoạch ra mắt 05/11 xong; từ 22:00 ngày 04/11 chỉ gộp bản vá đường ống)

## Kết quả đo (phiên nghiệm thu 04/11/2026)

Verdict của Mạnh: `iterate`. Chi tiết ở `uat-session.md` và `stranger-drive.md`.

- S03 lên cổng: 1179 tin trên DB chung (bán 774, thuê 405). Đạt ≥ 900. Trên cloud chưa đếm.
- Sai nặng: 4/30 = 13,3%, khoảng 5,3%–29,7%; chỉ tính giá trị sai 1/30 = 3,3%. Nhãn do tác tử gắn, không phải nhãn vàng. Trên đích 10%.
- Tin cấp thị trường: không có dấu hiệu theo phường, không lệch rollup 300, 400. Lọc theo phường trên cổng thật chưa đo.
- Không rơi vào ngưỡng chết.

Đầu vào cho vòng kế, ngoài ngưỡng đã chốt:

- Vị trí: 1154/1179 tin chỉ có khu vực cấp thị trường; đường 0/1179; mã toà 721/1179, thẻ chưa hiện và không kèm tên dự án; 451/1179 không có gì chi tiết hơn thành phố.
- Mạnh muốn tối thiểu biết vị trí: đường với nhà liền thổ, phân khu với thấp tầng, toà với căn hộ.
- Mạnh muốn thấy nhanh vì sao căn đáng quan tâm và có hợp phương pháp đầu tư không.
- Ảnh trên thẻ: thuộc hàng AC1, chưa mở hồ sơ.
