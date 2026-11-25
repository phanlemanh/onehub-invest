---
schema_version: 1
slug: s03-jpg-path-fallback
feature: Collector S03 tải lại ảnh bị CDN trả 400 vì đoạn /jpg/ trong đường dẫn — thử một lần URL bỏ /jpg/ (ZC16)
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (lời GS 01:40Z 25/11 «thêm hàng ZC16 s03-jpg-path-fallback», hang-viec sau ZC15, mốc 23/11; theo lời Mạnh «Báo GS giải quyết sớm» về ảnh S03)
decided_at: 2026-11-25T01:40:00Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Mạnh hỏi «Đã giải quyết S03 chưa». Sau ZC15 (r2.dev, host đích chuyển hướng) phần lớn ảnh S03 mất vẫn còn: ảnh họ zdn.vn trả
http-400. Làn thu tìm ra nguyên nhân 25/11: từ khoảng 19–20/11 link ảnh trong bài có đoạn `/jpg/` mà CDN trả 400; bỏ `/jpg/`
thì 200. Người gặp: Mạnh và đội vận hành (thẻ duyệt, gắn nhãn thiếu ảnh), model đọc tin bài chỉ có ảnh.

Đo 25/11 trên DB máy thu (bài S03 có ảnh, theo ngày đăng VN): mất hết ảnh 22/11 33,7% · 23/11 28,2% · 24/11 27,5%; bài mất hết
có ảnh lỗi 400 trên link `/jpg/`: 22/11 1.201 · 23/11 856 · 24/11 1.069. Làn thu đo 15–25/11: 22,9% → 8,1% sau vá.

Nguồn mã: nhánh làn thu `zcode/s03-jpg-path-fallback` @f6dcdf3fe (ZCode), xếp trên ZC15.

## Ngưỡng chết / ngưỡng UAT

Không đo được bằng người dùng cuối — việc nền làn thu. Đích đo trên máy thu sau áp (cùng ZC15): bài mới có ảnh lỗi http-400 trên
link `/jpg/` = 0; tỉ lệ bài S03 có ảnh mà mất hết ảnh của một ngày VN trọn sau áp ≤ khoảng 8% (từ khoảng 23–28%).
