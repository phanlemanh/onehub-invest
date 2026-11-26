---
schema_version: 1
slug: s03-media-r2-allowlist
feature: Collector S03 nhận ảnh trên host R2 của người đăng và host đích chuyển hướng của CDN ảnh S03 (ZC15, phần host của ZC9)
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (tra-loi ZT-5, 00:37Z 25/11; lời GS 00:37Z «mở ZC15 NGAY, chạy song song với KEV1»)
decided_at: 2026-11-25T00:37:18Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ZC9
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ZC9 `s03-anh-tai-loi` của lộ trình (phần host), hàng đợt ZC15 dãy ZT. Mạnh hỏi «Đã giải quyết S03 chưa»; GS đo
ảnh S03 hỏng khoảng 27% mỗi ngày. Người gặp: Mạnh và đội vận hành (thẻ duyệt, gắn nhãn thiếu ảnh), model đọc tin (bài chỉ có
ảnh mất ảnh thì không đọc được).

Đo 25/11 trên DB máy thu (bài S03 có ảnh, theo ngày đăng VN): tỉ lệ bài mất hết ảnh 22/11 33,7% · 23/11 28,2% · 24/11 27,5%.
Trong 8 ngày, 9.377 bài mất hết ảnh: 6.602 vì ảnh họ zdn.vn trả http-400, 2.624 vì host r2.dev ngoài danh sách cho phép,
61 vì chuyển hướng sang host đích (họ băm `99ee4ac919`) ngoài danh sách, 64 http-404.

Nguồn mã: nhánh làn thu `zcode/s03-media-r2-allowlist` @573820d37 (ZCode, LL soát) + bổ sung LL 24/11 (host đích qua cấu
hình local, kiểm JPEG XL).

## Ngưỡng chết / ngưỡng UAT

Không đo được bằng người dùng cuối — việc nền làn thu. Đích đo trên máy thu sau áp: bài mới lỗi `host-not-allowed` họ r2.dev = 0
và `redirect-host` họ `99ee4ac919` = 0; tỉ lệ bài mất hết ảnh của một ngày VN trọn sau áp giảm đúng phần do hai lỗi ấy
(24/11: 27,5% → khoảng 20,9%). Phần http-400 của zdn.vn (~21%) KHÔNG thuộc việc này — đã báo GS mở việc làn thu riêng.
