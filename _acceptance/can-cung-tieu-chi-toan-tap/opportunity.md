---
schema_version: 1
slug: can-cung-tieu-chi-toan-tap
feature: Trong sheet Căn giá tốt, tab «Căn cùng tiêu chí» và nút «Xem mọi căn trong phường» đếm, liệt kê căn cùng tiêu chí trên toàn tập đã lọc, không chỉ trang đang xem
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-11-19T04:57:19Z     # ISO UTC
prototype:
  base_commit:
  disposition:
---

## Vấn đề & ai gặp

Người vận hành mở sheet một căn trên `/ops/deals` để so với căn tương tự. Từ CG3, danh sách đọc theo trang ở máy chủ, nên tab
«Căn cùng tiêu chí» chỉ còn so trong 15 hay 50 căn của trang đang xem. Lượt chấm 4 của CG3 đo trên tin bán: cỡ 15 có 11/15 dòng
hiện 0, tổng 3 so với 337 thật; cỡ 50 có 39/50 dòng hiện 0, tổng 6 so với 760. Người vận hành đọc «0 căn» thành «căn này không có
căn nào để so», sai.

## Quyết định ở Cổng Đáng

Mạnh gõ ở phiên giám sát 2026-11-19T04:57:19Z, nguyên văn «Làm cả ba», trả lời câu «Cổng Đáng gom ba hàng DF8, CG16, CG17: cho
làm cả ba không?». Hàng này là CG17, làm ngay sau CG3, trên cùng màn.

## Kèm theo: AC-10 của CG3 trở lại

Mạnh chọn thu phạm vi CG3 sau lượt chấm 5 (2026-11-19T07:09:30Z, «Đồng ý theo lời khuyên»), đưa AC-10 ra Known limits với cam kết
trở lại ở hàng này: phép so trên DB máy thu đọc trong một snapshot nhất quán, đo thời gian tải khi máy yên, lint không quét tệp chép
tạm của test, ảnh xem màn thật quay lại.

## Ngưỡng chết / ngưỡng UAT

_Máy đề xuất, chờ chốt ở Cổng Phạm vi. Lệnh đo: `bash _acceptance/can-cung-tieu-chi-toan-tap/probes/do-may-thu.sh` (dựng ở S3), đọc DB máy thu trong một snapshot._

- Câu hỏi phép đo trả lời: [đề xuất] mở sheet một căn, người vận hành có thấy đúng số căn tương tự trên cả danh sách đang lọc không?
- Kết quả nào là SỐNG: [đề xuất] trang 1 tin bán không lọc, cỡ 15 và 50, số «Căn cùng tiêu chí» của mọi dòng bằng lệnh đếm độc lập (đo 19/11: hôm nay 12/15 và 44/50 dòng hiện 0, lệnh đếm ra 1/15 và 5/50); năm ý của AC-10 cũ CG3 có bằng chứng máy.
- Kết quả nào là CHẾT: [đề xuất] còn một dòng hiện 0 trong khi lệnh đếm khác 0, hay «Chưa có căn» hiện khi lệnh đếm khác 0.
- Timebox: một vòng
