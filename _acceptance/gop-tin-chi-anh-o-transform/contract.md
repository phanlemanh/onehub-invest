---
schema_version: 1
feature: Ảnh của tin chỉ-ảnh S03 (ảnh gửi riêng trước hay sau tin chữ, cùng người, dưới 2 phút) vào đúng offer trong bảng ảnh canonical; bảng nạp và sale_offers giữ nguyên
slug: gop-tin-chi-anh-o-transform
owner: phanlemanh@gmail.com
risk_tier: T2      # máy suy: pipeline/transform-media.mjs, pipeline/lib/ — không khớp t3_paths; không migration
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-10-30
design_doc: docs/superpowers/specs/2026-10-30-gop-tin-chi-anh-o-transform-design.md
---

# Acceptance Contract: gop-tin-chi-anh-o-transform

## Context

Hàng PL28. Môi giới S03 gửi ảnh thành tin riêng (mỗi ảnh một event, chữ chỉ là URL ảnh), trước hoặc sau tin chữ. Tin
chỉ-ảnh không thành offer nên ảnh không bao giờ tới bảng ảnh canonical (`media`, NH1) — offer S03 có ảnh 276/885 (31,2%,
30/10). Vòng này gộp ảnh ấy vào offer của tin chữ cùng người ở bước dựng bảng `media`; `sale_offers` và `stg_zalo_posts`
không đổi. Câu hỏi quy tắc gộp: Hỏi-1 (sổ quyết định).

## Acceptance criteria

- AC-1: Given ma trận viết trước gồm chữ chỉ có URL (một URL, nhiều URL cách bằng dấu cách và xuống dòng, URL `www.`),
  chữ rỗng, chữ có lời kèm URL («Cho thuê 2PN 7tr https://…»), chữ thường không URL, When `laChiAnh` đọc, Then ba dạng
  chỉ-URL và chữ rỗng ra `true`, hai dạng có lời ra `false`.
- AC-2: Given ma trận viết trước các cặp bài chỉ-ảnh và bài chữ (ảnh trước chữ 30 giây, ảnh sau chữ 30 giây, cách 119 giây,
  cách 120 giây, khác người gửi, khác nhóm, thiếu người gửi, hai bài chữ cách 10 và 50 giây, hai bài chữ cách đều 30
  giây trước và sau), When `ganBaiAnh` gán, Then ảnh vào bài chữ ở ba dòng đầu, không gán ở cách 120 giây / khác người /
  khác nhóm / thiếu người gửi, vào bài chữ cách 10 giây ở dòng hai bài chữ, vào bài chữ đứng SAU ở dòng cách đều.
- AC-3: Given giao dịch ROLLBACK trên DB thử có một offer S03 tổng hợp hai bài chữ có ảnh và bốn bài chỉ-ảnh cùng người
  (hai bài trước, một bài sau chữ trong 2 phút; một bài cách 5 phút), When chạy `runTransformMedia(c, ["S03"])` hai lần,
  Then offer có dòng ảnh của ba bài chỉ-ảnh trong cửa sổ, xếp SAU ảnh của chính hai bài chữ, không có ảnh của bài cách 5
  phút, và lượt hai không thêm, không đổi, không xoá dòng nào; rồi khi chèn một bài chữ của offer khác (và, biến thể, một
  bài chữ không offer) gần một bài chỉ-ảnh hơn và chạy lượt ba, Then offer cũ còn 0 dòng của bài ảnh ấy, offer mới có
  dòng của nó (biến thể không offer: không offer nào có). (cross-layer)
- AC-4: Given cùng giao dịch, một bài chỉ-ảnh gần một bài chữ KHÔNG thuộc offer nào (gần hơn bài chữ của offer cùng người),
  When chạy `runTransformMedia(c, ["S03"])`, Then ảnh ấy không sinh dòng nào trong `media` (quy tắc khuyến nghị của
  Hỏi-1; Mạnh chọn «chỉ xét tin chữ thuộc offer» thì Then đổi thành: ảnh vào offer của bài chữ cùng người gần nhất, và
  AC-4/E4/E6 sửa theo trước khi duyệt). (cross-layer)
- AC-5: Given cùng giao dịch, When chạy `runTransformMedia(c, ["S03"])`, Then băm toàn bộ `stg_zalo_posts` và bộ
  (`offer_id`, `post_ids`, `n_reposts`) của `sale_offers` trước và sau bằng nhau. (cross-layer)
- AC-6: Given bản chép dữ liệu thật (DB thử, ROLLBACK, ít nhất 500 offer S03), When trong cùng giao dịch chạy transform-media
  S03 bằng bản nền ghim (lấy «trước») rồi bằng cây sau sửa (lấy «sau»), Then in số offer, tỉ lệ có ảnh trước → sau, và
  tỉ lệ sau ≥ ngưỡng của ô cơ hội (đọc từ `opportunity.md`, không viết cứng); và trong ngày mẫu 28/10 (giờ VN), tập cặp
  «bài chỉ-ảnh → offer» tính độc lập bằng SQL (gần nhất, hai phía, dưới 2 phút, cùng người và nhóm, bỏ bài thử và bài
  không có cột ảnh, hoà → bài chữ đứng sau) bằng tập cặp đọc từ bảng `media` theo cả hai chiều (cặp lệch: 0, in từng
  cặp lệch). (cross-layer)
- AC-7: Given cây sau sửa, When chạy bộ test pipeline, test app của NH1 (`media-canonical.test.tsx`) và ca DB của NH1
  (`media-canonical.itest.mjs`) trên DB thử, Then tất cả xanh.

## Coverage

- Trục A — nhận bài chỉ-ảnh: chỉ URL | nhiều URL | rỗng | có lời kèm URL | không URL [AC-1]
- Trục B — gán: hai phía | biên 2 phút | khác người | khác nhóm | thiếu người gửi | nhiều bài chữ (gần nhất, hoà) | gần nhất là
  tin không offer [AC-2, AC-4]
- Trục C — đường ghi: bảng `media` đúng offer, đúng thứ tự, nạp lại không nhân [AC-3] · bảng nạp và `sale_offers` không
  đổi [AC-5] · dữ liệu thật [AC-6] · không lùi NH1 [AC-7]
- Bỏ quét hình thái: dòng sổ `descope` «bỏ coverage-scan».

## Out of scope

- Trang dòng chảy («bài đọc được») và `n_reposts` vẫn không tính bài chỉ-ảnh — chỉ bảng ảnh đổi (Hỏi-2).
- Gắn bài chỉ-ảnh vào `sale_offers.post_ids` / `n_reposts` (đổi «bài đại diện» của enrich, deals, data-api) — xem lối (a)
  của design doc.
- Đọc chữ trong ảnh (SH7), sửa tải ảnh lỗi của collector (ZC-ảnh), nguồn S05.
- Nạp lại bảng `media` thật trên DB máy thu (bước triển khai sau gộp).

## Đường đo

- «Offer S03 có ảnh trước → sau» ← AC-6 (thước `do-gop-anh.mjs` trên DB thử). Ngưỡng của ô cơ hội ≥ 45% (Mạnh chọn ở
  Cổng Phạm vi 30/10, Hỏi-1: quy tắc gần nhất; đo 30/10 ra 47,7%); thước đọc ngưỡng từ ô cơ hội.
- «Mọi tin chỉ-ảnh có tin chữ cùng người trong 2 phút ở hai phía đều được gộp» ← AC-6 (ngày mẫu, cặp lệch 0) + AC-2.
- «Raw không đổi» ← AC-5.

## Notes
