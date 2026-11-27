---
schema_version: 1
slug: s03-tai-bu-anh-bai-cu
feature: Tải bù ảnh S03 của bài cũ sau ZC15 + ZC16, và giữ ảnh đã bù khi nạp lại raw (ZC20)
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (hàng ZC20 trong hang-viec.json, dãy ZT; ba điều kiện cổng của GS do LL chuyển 26/11; giao thu claudedp-2511-51, -56)
decided_at: 2026-11-26T00:10:00Z     # ISO UTC
prototype:
  base_commit:
  disposition:
---

## Vấn đề & ai gặp

ZC15 (host r2.dev, hậu tố host) và ZC16 (thử lại bỏ `/jpg/`) chỉ vá cho tin mới. Bài S03 đăng 21–24/11 đã mất ảnh vì hai lỗi
ấy; làn thu tải bù 695 bài (21/11 177 · 22/11 318 · 23/11 35 · 24/11 165) thành 5 snapshot bù. Bộ nạp thay trọn
`media_files` khi giá trị khác null, nên nạp lại raw theo thứ tự tên sẽ để bản gốc (entry lỗi) đè ảnh đã bù. Người gặp: Mạnh
và đội vận hành (thẻ duyệt, gắn nhãn thiếu ảnh), model đọc tin bài chỉ có ảnh.

## Ngưỡng nghiệm thu

Ba điều kiện cổng của GS: (1) thứ tự nạp lại raw giữ ảnh bù; (2) hợp đồng dữ liệu ghi 5 snapshot bù 21–25/11 và 695 bài theo
ngày; (3) đặt state về 00000000T000000 rồi nạp lại không mất ảnh bù.
