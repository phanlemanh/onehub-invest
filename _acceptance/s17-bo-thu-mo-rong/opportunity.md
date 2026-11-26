---
schema_version: 1
slug: s17-bo-thu-mo-rong
feature: Bộ thu S17 (thửa đất + căn thẩm định) mốc ngày 1, ngày 2 và mốc mở rộng — vào kho với các chốt an toàn có đo (ZC21)
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh (24/11 «Duyệt cả 2 ngày», «Phiên S17 riêng»; 25/11 «Mở rộng S17 toàn bộ dự án», «Có, mở cả thửa», «Lấy cả ảnh ở máy chủ ngoài», «Vẫn lấy hết») — hàng ZC21 do giám sát đợt dot0-cam-mau xếp (hang-viec.json, dãy ZT)
decided_at: 2026-11-25T01:45:00Z     # ISO UTC
prototype:
  base_commit:
  disposition:
---

## Vấn đề & ai gặp

Nguồn S17 (thửa đất + căn thẩm định, 2.505 dự án) đã được làn thu dựng bộ thu trên nhánh riêng và chạy thật trên máy thu
(24–25/11), nhưng mã chưa vào kho chính: không qua CI, không qua lượt chấm, và mọi lần sửa sau đều đi trên nhánh làn thu.
Người gặp: GS và LL (theo dõi tiến độ S17 tách riêng theo lời Mạnh), các hàng làn Claude nạp `stg_s17_*` sau này.

## Ngưỡng nghiệm thu

Không đặt ngưỡng số liệu sản phẩm cho vòng này: số thu (căn, thửa, ảnh) đo ở mốc của làn thu. Điểm xong của vòng là mã bộ
thu vào kho chính với các chốt an toàn có chiều đỏ đo được.
