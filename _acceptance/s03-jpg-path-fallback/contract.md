---
schema_version: 1
feature: Collector S03 tải lại ảnh bị CDN trả 400 vì đoạn /jpg/ trong đường dẫn — thử một lần URL bỏ /jpg/; khuôn meta.mediaFiles giữ nguyên (ZC16)
slug: s03-jpg-path-fallback
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, config]
status: machine-cleared
veto_state: mo
veto_opened_at: 2026-11-25T01:57:41Z
design_doc: docs/superpowers/specs/2026-11-25-s03-jpg-path-fallback-design.md
---

# Acceptance Contract: s03-jpg-path-fallback

## Context

Hàng ZC16 (dãy ZT), xếp trên ZC15. Từ khoảng 19–20/11 link ảnh S03 có đoạn `/jpg/` bị CDN trả 400; bỏ `/jpg/` thì 200. Đo 25/11
trên DB máy thu: bài S03 có ảnh mà mất hết ảnh 24/11 27,5%; bài mất hết có ảnh 400 `/jpg/` 24/11 1.069/5.201. Nguồn mã: nhánh
làn thu `zcode/s03-jpg-path-fallback` @f6dcdf3fe (ZCode); vòng này gộp tay với ZC15, bỏ trường `urlFetched` theo phán GS.

## Acceptance Criteria

- AC-1: Given CDN trả 400 cho URL ảnh có đoạn `/jpg/` và 200 cho cùng URL bỏ `/jpg/`, When bộ tải xử lý ảnh, Then ảnh được tải
  qua URL bỏ `/jpg/`, entry có file và sha256 khớp byte, không lỗi; bỏ khối thử lại thì cùng ca ra `http-400`.
- AC-2: Given ảnh tải qua đường thử lại, When đọc `meta.mediaFiles`, Then entry giữ `url` gốc nguyên văn (cả `payload.media`),
  không có `urlFetched`, và tên tệp là băm của URL ĐÃ TẢI, không phải của URL gốc.
- AC-3: Given URL lỗi 400 không có `/jpg/`, lỗi khác 400 (404, timeout) có `/jpg/`, hoặc URL thay thế cũng lỗi, When bộ tải xử
  lý, Then không thử lại (hoặc thử đúng một lần) và entry giữ lỗi gốc của URL gốc.
- AC-7: Given URL `/jpg/` bị 400 và URL thay thế chuyển hướng sang host ngoài danh sách cho phép, When bộ tải thử lại, Then
  không tệp nào được ghi vào snapshot và entry giữ lỗi `http-400` của URL gốc (kiểm host cuối áp cho cả lần thử lại).
- AC-4: Given byte trả về là JPEG XL hay JPEG bất kể `content-type`, When bộ tải đặt đuôi, Then byte JPEG XL ra `.jxl`, byte
  JPEG ra `.jpg` (luật ZC15 giữ nguyên sau khi gộp).
- AC-5: Given mọi ca của ZC15 và các bảo vệ cũ của bộ tải, When chạy toàn bộ test collector trên dist sạch và kiểm kiểu, Then
  mọi ca xanh; khuôn `meta.mediaFiles` giữ đúng năm khoá; DATA-CONTRACT và `schemaVersion` không đổi.
- AC-6: Given hồ sơ áp `ap-may-thu/README.md` và bộ kiểm sau áp `ap-may-thu/kiem-sau.mjs`, When người ký đọc, Then có đủ năm
  mục có lệnh hay con số, dòng khởi động lại collector API kèm «lời riêng của Mạnh»; bộ kiểm chấm đúng bộ dòng mẫu (ảnh `/jpg/`
  lỗi 400 ≤ 5% → ĐẠT, trên 5% → KHÔNG ĐẠT, chưa có ảnh `/jpg/` → KHÔNG ĐẠT), tính tỉ lệ ngày đúng trên mẫu biết trước đáp án, và dòng sinh từ chính bộ tải: bản nhánh → ĐẠT,
  bản ZC15 (chưa có thử lại) → KHÔNG ĐẠT đúng lý do; đầu ra không in URL.

## Out of scope

- Trường `urlFetched` trong `meta.mediaFiles` — ngoài phạm vi, vì thêm trường phải tăng schemaVersion và sửa bộ nạp S03 ngoài
  vùng hàng (phán GS 25/11); làn thu muốn thì thành hàng riêng.
- Tải bù ảnh bài cũ đã lỗi 400 `/jpg/` — ngoài phạm vi, vì cần lệnh ghi snapshot bù ngoài vùng hàng.
- Lỗi 400 không có `/jpg/`, lỗi 404 (link cũ khoảng ba tuần) — ngoài phạm vi, vì không có biến thể nào đo được là sống.
- Đọc, thu nhỏ, hiện ảnh JPEG XL phía sau — ngoài phạm vi, vì là hàng HT22 của dãy P3.
- Build `dist` và khởi động lại collector API trên máy thu — ngoài phạm vi vòng code, vì là bước triển khai sau gộp do phiên
  ZCode vận hành làm cùng ZC15 (cần lời riêng của Mạnh).

## Coverage

- Trục lỗi của URL gốc: 400 có `/jpg/` · 400 không `/jpg/` · 404 có `/jpg/` · timeout có `/jpg/` [thước CE: bảng lỗi theo họ host
  đo 25/11] — AC-1, AC-3.
- Trục kết quả của URL thay thế: 200 · lỗi · chuyển hướng ra ngoài danh sách — AC-1, AC-3, AC-7.
- Trục người đọc đầu ra: `meta.mediaFiles` (bộ nạp S03) · tên tệp · manifest — AC-2, AC-5.
- Trục byte trả về: JPEG với header jxl · JPEG XL · JPEG [thước CE: đo 25/11, 6 URL thay thế byte JPEG, header image/jxl] —
  AC-4.
- Trục áp lên máy thu: trước · làm · kiểm sau · lùi — AC-6.

## Đường đo

Tỉ lệ bài S03 có ảnh mà mất hết ảnh theo ngày đăng VN, `node _acceptance/s03-jpg-path-fallback/ap-may-thu/kiem-sau.mjs --ty-le`
trên DB máy thu, cùng thước với mốc 25/11 (24/11 27,5%; mẫu số = bài có `media_files` không rỗng, ngày theo giờ VN). Đích ngày VN
trọn đầu tiên sau áp ZC15 + ZC16: tỉ lệ ≤ 8,0%; ảnh link `/jpg/` trên bài mới còn lỗi 400 ≤ 5% (24/11: 1.069/3.347 ≈ 32%) — không
đòi 0 vì ảnh chia lại từ link cũ chết cả hai biến thể vẫn giữ 400 của URL gốc. AC-6 bảo đảm bộ đo (gồm phép tính tỉ lệ).

## Notes

- Mã thử lại và ca test 2511-3: ZCode (claudedp-2511-3); vòng này bỏ `urlFetched`, thêm assert tên tệp băm URL đã tải; đột biến
  băm theo URL gốc, bỏ thử lại, thử lại mọi lỗi → đỏ; chạy lại mỗi lượt chấm bằng `probes/tu-thu.sh` (đuôi lệnh của E1–E3).
- Số đo cho HT9/kit (GS 25/11): đổi 5 dòng một tệp test (`collector/src/test/media-fetch.test.ts`, sửa AC-4 sau S4 r1) → 2 lượt ×
  ~65′ suite pipeline (ZC16 r2 + ghim lại ZC15), không có đường giữ kết quả suite khi mã sản xuất không đổi.
- Ngoài-1 (máy định tuyến 2026-11-25, đề xuất S4 known-limits): Khi chấm chung hai hồ sơ, bước kiểm sau áp của ZC15 có thể lúc đỏ lúc xanh dù mã đúng. Người dùng cuối không bị ảnh hưởng, chỉ người chấm có thể phải chạy lại. — `_acceptance/s03-media-r2-allowlist/ap-may-thu/kiem.sh`
- Ngoài-2 (máy định tuyến 2026-11-25, đề xuất S4 known-limits): Tài liệu mô tả cách đặt tên tệp ảnh đã lệch so với hành vi thật cho ảnh tải qua đường thử lại. Phía đọc dữ liệu dùng tên tệp ghi sẵn nên hiện chưa hỏng gì. — `collector/src/core/media-fetch.ts`
- Ngoài-3 (máy định tuyến 2026-11-25, đề xuất S4 known-limits): Khi ảnh lỗi cả hai lần, sổ chỉ ghi lỗi 400 ban đầu nên không phân biệt được lỗi mạng tạm thời với link chết. Tỉ lệ lỗi 400 đo sau khi áp có thể cao hơn thực tế một chút. — `collector/src/core/media-fetch.ts`
- Ngoài-4 (máy định tuyến 2026-11-25, đề xuất S4 known-limits): Sau khi ZC15 gộp vào nhánh chính, bước kiểm của ZC15 có thể báo đỏ giả dù mã đúng. Người ký có thể bị nhầm là có lỗi thật. — `_acceptance/s03-media-r2-allowlist/ap-may-thu/kiem.sh`
- Ngoài-5 (máy định tuyến 2026-11-25, đề xuất S4 known-limits): Bước kiểm của ZC15 có thể cho kết quả không ổn định khi chạy cùng lúc với bài kiểm của hồ sơ khác. Chỉ ảnh hưởng người chấm. — `_acceptance/s03-media-r2-allowlist/ap-may-thu/kiem.sh`
- Ngoài-6 (máy định tuyến 2026-11-25, đề xuất S4 known-limits): Bước tự thử có thể báo đã bắt được lỗi dù ca đỏ là do lý do khác, nên chưa chứng minh chắc là việc thử lại sai chỗ sẽ bị phát hiện. Phần mã tải ảnh chạy cho người dùng không đổi. — `_acceptance/s03-jpg-path-fallback/probes/tu-thu.sh`
- Ngoài-7 (máy định tuyến 2026-11-25, đề xuất S4 known-limits): Nếu bộ kiểm sau áp hỏng giữa chừng, phép soát rò tên vẫn báo ổn. Có thể bỏ sót một lần rò tên nguồn trong đầu ra. — `_acceptance/s03-jpg-path-fallback/ap-may-thu/kiem.sh`
- Ngoài-8 (máy định tuyến 2026-11-25, đề xuất S4 known-limits): Phép kiểm khuôn dữ liệu ảnh chỉ đọc phần khai báo, nên một đường ghi thêm khoá lạ có thể lọt. Hiện chưa thấy khoá thừa nào được ghi. — `_acceptance/s03-media-r2-allowlist/probes/khuon-media-files.mjs`
