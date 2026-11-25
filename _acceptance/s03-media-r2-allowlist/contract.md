---
schema_version: 1
feature: Collector S03 nhận ảnh trên host R2 của người đăng và host đích chuyển hướng của CDN ảnh S03; ảnh JPEG XL được giữ nguyên byte (ZC15, phần host của ZC9)
slug: s03-media-r2-allowlist
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, config]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-25T01:05:36Z
design_doc: docs/superpowers/specs/2026-11-25-s03-media-r2-allowlist-design.md
---

# Acceptance Contract: s03-media-r2-allowlist

## Context

Hàng ZC15 (dãy ZT), mở từ hàng ZC9 `s03-anh-tai-loi` của lộ trình, phần host. Đo 25/11 trên DB máy thu: bài S03 có ảnh mà
mất hết ảnh 27,5% (24/11, ngày đăng VN). Trong 8 ngày, 2.624 bài mất ảnh vì host r2.dev nằm ngoài danh sách cho phép và 61
bài vì ảnh chuyển hướng sang host đích họ băm `99ee4ac919` (CDN của chính S03) nằm ngoài danh sách; 6.602 bài vì ảnh họ
zdn.vn trả http-400 (ngoài phạm vi).

Nguồn mã: nhánh làn thu `zcode/s03-media-r2-allowlist` @573820d37 (ZCode viết, LL soát) thêm `r2.dev` vào danh sách mặc
định. Vòng này thêm (lời LL 24/11): danh sách hậu tố thêm đọc từ tệp local `collector/state/media-host-suffixes.txt` và biến
`ONEINVEST_MEDIA_HOST_SUFFIXES` (tên thật của host đích là tầng A, chỉ ở máy thu); Accept chỉ xin jpeg, png, webp, gif; ảnh
JPEG XL lưu nguyên byte với đuôi `.jxl`; hồ sơ áp lên máy thu và bộ kiểm sau áp.

## Acceptance Criteria

- AC-1: Given danh sách mặc định của bộ tải ảnh, When một tin có ảnh ở host `pub-x.r2.dev`, Then ảnh được tải, có file và
  sha256 trong `meta.mediaFiles`; host `zdn.vn` vẫn được tải như trước.
- AC-2: Given danh sách mặc định, When host là `evilr2.dev`, `r2.dev.evil.com` hay có `zdn.vn` ở giữa, Then ảnh bị chặn với
  lỗi `host-not-allowed` (ranh giới dấu chấm của hậu tố giữ nguyên).
- AC-3: Given thư mục trạng thái của collector có tệp `media-host-suffixes.txt` ghi hậu tố của host đích, When ảnh của host
  được phép chuyển hướng sang host đích, Then ảnh được tải, có file và sha256; xoá tệp ấy thì cùng ảnh lỗi `redirect-host`
  như trước, và URL gốc thuộc host đích cũng lỗi `host-not-allowed`.
- AC-4: Given biến môi trường `ONEINVEST_MEDIA_HOST_SUFFIXES` (phẩy) hoặc tệp hậu tố có dòng hỏng (một nhãn như `vn`, ký tự
  lạ, dấu chấm đầu/cuối, chú thích `#`, dòng trống), When collector khởi động, Then hậu tố hợp lệ từ cả hai nguồn được thêm,
  dòng hỏng bị bỏ, collector vẫn chạy, và log khởi động chỉ in số hậu tố thêm, không in tên host.
- AC-5: Given bộ tải gửi yêu cầu ảnh, When CDN giả ghi lại header của yêu cầu, Then `accept` có `image/jpeg` và không có
  `image/jxl` hay `*/*`.
- AC-6: Given CDN trả ảnh mà byte mở đầu bằng mã JPEG XL (codestream `FF 0A` hoặc hộp `JXL `), When bộ tải lưu ảnh, Then
  tệp mang đuôi `.jxl`, sha256 khớp byte gốc, entry không có lỗi; ảnh JPEG cùng URL dạng `.jpg` vẫn mang đuôi `.jpg`.
- AC-7: Given mọi bảo vệ cũ của bộ tải (trần dung lượng, trần giờ, huỷ theo hạn tắt, trần URL mỗi lần ghi, chặn giao thức
  lạ, chặn chuyển hướng ra ngoài danh sách), When chạy lại toàn bộ test collector trên dist sạch và kiểm kiểu, Then mọi ca
  xanh và khuôn `meta.mediaFiles` không đổi (không trường mới, DATA-CONTRACT giữ nguyên).
- AC-8: Given tên thật của host đích chỉ có trong tệp local trên máy thu, When soát toàn cây và lịch sử nhánh hồ sơ so với
  main, Then không tệp hay commit nào chứa tên ấy; chép tên vào một tệp của bản sao thì chốt đỏ với thông điệp ghim.
- AC-9: Given hồ sơ áp `ap-may-thu/README.md` và bộ kiểm sau áp `ap-may-thu/kiem-sau.mjs`, When người ký Cổng Bằng chứng
  đọc, Then có đủ năm mục (lệnh áp · số chạy thử · sao lưu trước · cách lùi · lệnh kiểm sau) có lệnh hay con số thật, có
  dòng khởi động lại collector API kèm «lời riêng của Mạnh»; và bộ kiểm sau áp chấm đúng các bộ dòng mẫu (một ĐẠT, mỗi lỗi
  sửa được còn sót một KHÔNG ĐẠT đúng lý do) cùng dòng sinh từ chính bộ tải: bản nhánh → ĐẠT, bản main → KHÔNG ĐẠT.

## Out of scope

- Ảnh họ zdn.vn trả http-400 (6.602/9.377 bài mất hết ảnh trong 8 ngày) — ngoài phạm vi, vì nguyên nhân chưa đo (ZCode: link
  chết phía CDN với mọi UA); đã báo GS 25/11 đề nghị mở việc làn thu riêng.
- Tải bù ảnh của bài cũ đã lỗi `host-not-allowed` hay `redirect-host` — ngoài phạm vi, vì cần lệnh ghi snapshot bù cho bài
  cũ, ngoài vùng `collector/src` của hàng (phần tải bù của ZC9).
- Đổi định dạng JPEG XL sang JPEG — ngoài phạm vi, vì snapshot gốc bất biến (luật 1) và bên đọc nằm ở pipeline/app; đo 25/11
  host đích không trả JPEG XL khi không xin (36/36 lượt).
- Ghi host cuối sau chuyển hướng vào `meta.mediaFiles` — ngoài phạm vi, vì thêm trường là đổi DATA-CONTRACT (luật 4).
- Chép tệp hậu tố, build `dist`, khởi động lại collector API trên máy thu — ngoài phạm vi vòng code, vì là bước triển khai sau
  gộp do phiên ZCode vận hành làm theo `ap-may-thu/README.md` (khởi động lại cần lời riêng của Mạnh).

## Coverage

- Trục host của URL ảnh: zdn.vn · r2.dev · host đích họ `99ee4ac919` · host lạ · host giả mạo hậu tố [thước CE: bảng lỗi theo
  họ host đo 25/11 trên DB máy thu] — AC-1, AC-2, AC-3.
- Trục nguồn hậu tố thêm: không có · tệp local · biến môi trường · cả hai · dòng hỏng — AC-3, AC-4.
- Trục định dạng byte trả về: JPEG · JPEG XL codestream · JPEG XL hộp · khác [thước CE: đo 25/11, 36 lượt tải host đích] —
  AC-5, AC-6.
- Trục bảo vệ cũ của bộ tải: trần byte · trần giờ · hạn tắt · trần URL · giao thức · chuyển hướng ra ngoài — AC-7.
- Trục nơi tên host đích có thể rò: mã · test · hồ sơ · commit · log khởi động — AC-4, AC-8.
- Trục áp lên máy thu: trước (sao lưu) · làm (build + tệp hậu tố + khởi động lại) · kiểm sau · lùi — AC-9.

## Đường đo

Tỉ lệ bài S03 có ảnh mà mất hết ảnh theo ngày đăng VN, đo bằng `node _acceptance/s03-media-r2-allowlist/ap-may-thu/kiem-sau.mjs
--ty-le` trên DB máy thu (số trước 25/11: 22/11 33,7% · 23/11 28,2% · 24/11 27,5%). Đích ngày VN trọn đầu tiên sau áp: bài mới
lỗi `host-not-allowed` họ r2.dev = 0, `redirect-host` = 0, tỉ lệ mất hết ảnh giảm đúng phần hai lỗi ấy (24/11 ước 20,9%).
AC-9 bảo đảm bộ đo.

## Notes

- Mã r2.dev và test hành vi: ZCode (claudedp 2211-16, 2211-17), LL soát; đột biến bỏ `r2.dev` → 2 ca đỏ.
- Tên thật của host đích và URL mẫu nằm ở tệp nghiên cứu local của LL (mode 600); vòng này chỉ đọc nó bằng lệnh in băm.
