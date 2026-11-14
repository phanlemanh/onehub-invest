---
schema_version: 1
slug: ma-du-an-s06-thanh-nut
feature: Mỗi mã dự án S06 có từ 10 tin căn hộ đang rao thành bí danh của đúng một nút dự án — nút có sẵn hoặc nút ứng viên máy đúc hàng loạt từ mã — qua một thẻ luật theo nguồn mà Mạnh xem mẫu trước khi áp, nên tin S06 đọc được dự án của mình qua bí danh
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh (QĐ5 14/11, giám sát ghi hộ — tra-loi/P4-180)
decided_at: 2026-11-14T02:26:00Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DA32
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng DA32 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/mo-neo-1411.md#25d4d86af406a37bd41d0ce5f05dead8bc4e54b2` — chưa có trang: mã M1
Mốc: Nhịp 1: người vận hành chọn một dự án trên Ops và thấy căn xếp theo hạng giá — chưa có ngày.

Mỗi mã dự án S06 có từ 10 tin căn hộ đang rao thành bí danh của đúng một nút dự án — nút có sẵn hoặc nút ứng viên máy đúc hàng loạt từ mã — qua một thẻ luật theo nguồn mà Mạnh xem mẫu trước khi áp, nên tin S06 đọc được dự án của mình qua bí danh

Vì sao: Phân tích 14/11: đường S06 qua DA3 (T3, chờ Cổng Phạm vi) → DA7 → DS2 là đường găng của nhịp 1, trong khi 268 mã dự án S06 đã phủ 11.045 tin căn hộ đang rao. Mạnh chốt QĐ5 14/11: lát mỏng «mã dự án S06 thành nút» đi trước bằng thẻ luật theo nguồn (đúng Hỏi-1 mục 44), Mạnh xem mẫu.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Trên DB máy thu: mọi mã S06 có từ 10 tin căn hộ đang rao (14/11: 268 mã, phủ 11.045 tin) có trạng thái nối, ứng viên hoặc từ chối có lý do; 0 mã nối hai nút; 0 cặp lệch tỉnh; nút ứng viên mang catalog_tier thấp nhất và có ít nhất một area_ids; thẻ luật có nhật ký, mẫu Mạnh xem ghi băm, đảo được cả loạt; chạy lại lần hai không đổi bí danh; số tin S06 căn hộ đọc được dự án qua bí danh khớp phép đếm SQL độc lập» chưa?
- Kết quả nào là SỐNG: [đề xuất] Trên DB máy thu: mọi mã S06 có từ 10 tin căn hộ đang rao (14/11: 268 mã, phủ 11.045 tin) có trạng thái nối, ứng viên hoặc từ chối có lý do; 0 mã nối hai nút; 0 cặp lệch tỉnh; nút ứng viên mang catalog_tier thấp nhất và có ít nhất một area_ids; thẻ luật có nhật ký, mẫu Mạnh xem ghi băm, đảo được cả loạt; chạy lại lần hai không đổi bí danh; số tin S06 căn hộ đọc được dự án qua bí danh khớp phép đếm SQL độc lập
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Trên DB máy thu: mọi mã S06 có từ 10 tin căn hộ đang rao (14/11: 268 mã, phủ 11.045 tin) có trạng thái nối, ứng viên hoặc từ chối có lý do; 0 mã nối hai nút; 0 cặp lệch tỉnh; nút ứng viên mang catalog_tier thấp nhất và có ít nhất một area_ids; thẻ luật có nhật ký, mẫu Mạnh xem ghi băm, đảo được cả loạt; chạy lại lần hai không đổi bí danh; số tin S06 căn hộ đọc được dự án qua bí danh khớp phép đếm SQL độc lập» khi hết timebox
- Đo lại ở S1 (14/11, theo chữ «từ 10 tin căn hộ đang rao»): **344 mã, 11.941 tin**; số 268 mã / 11.045 tin trong câu trên là
  định nghĩa nhóm giá (mã có nhóm bán hoặc thuê từ 10 tin có giá/m²). Hợp đồng theo 344; chênh lệch trình ở Cổng Phạm vi.
- Timebox: …
