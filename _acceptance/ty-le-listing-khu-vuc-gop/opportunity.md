---
schema_version: 1
slug: ty-le-listing-khu-vuc-gop
feature: Thẻ hiệu chuẩn của khu vực gộp nhiều market S02 cho tỉ lệ «Listing» khớp bảng Độ phủ trung thực — số tự thu của cả khu vực chia cho số listing S02 của mọi market thành phần, không chỉ market đại diện
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (P4-25) theo lựa chọn của Mạnh ở Cổng Bằng chứng ON10
decided_at: 2026-10-25T03:29:07Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Sinh từ hồ sơ `hieu-chuan-mot-bo-so` (ON10): ở Cổng Bằng chứng 25/10 Mạnh ký «Ngoài-13: mở hợp đồng mới» (sổ
`_acceptance/hieu-chuan-mot-bo-so/decisions.jsonl`, dòng `d-20261025T012505Z-36`). Hàng chưa có trong
`docs/plan/lo-trinh.json`; giám sát giao P4 25/10 và duyệt Cổng Đáng ở P4-25 (làm sau hàng an toàn Zalo).

Người vận hành mở vùng «Hiệu chuẩn» của `/ops/quality`. Với khu vực gộp nhiều market S02 (sáp nhập tỉnh 2025, vd Cần
Thơ), dòng «Listing» của thẻ chia số tự thu của CẢ khu vực cho số listing S02 của MỘT market đại diện — tỉ lệ bị thổi lên
và có thể hiện cờ «Lệch» sai, trong khi bảng Độ phủ trung thực chia cho tổng mọi market thành phần và cho tỉ lệ khác cho
cùng khu vực.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] với mọi khu vực có cả thẻ hiệu chuẩn và dòng Độ phủ, tỉ lệ «Listing» của thẻ có bằng tỉ lệ Độ phủ không?
- Kết quả nào là SỐNG: [đề xuất] trên DB local, mọi khu vực ra cùng tỉ lệ ở hai chỗ; khu vực gộp nhiều market có ô S02 bằng tổng các market thành phần
- Kết quả nào là CHẾT: [đề xuất] còn một khu vực mà hai tỉ lệ lệch nhau khi hết timebox
- Timebox: …
