---
schema_version: 1
feature: Tin rao S03 thôi gộp nhầm bài của nhiều người khi thiếu phường/diện tích, và cột «Luồng 7 ngày» đếm đúng tập bài transform đọc
slug: s03-gop-trung-dung
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [pipeline, ui]
status: implemented
approved_by: Mạnh
approved_at: 2026-10-27T07:15:20Z
---

# Acceptance Contract: s03-gop-trung-dung

## Context

Căn cứ: phiên điều tra chỉ-đọc 26/10 trên `/ops/collections` «Luồng 7 ngày qua» (hai cột S03).

1. **Gộp trùng quá tay** — `pipeline/transform-zalo.mjs` bước 4 gom repost bằng khoá `kind|phường|giá|DT|PN`, trường
   thiếu thành «?». DB local 27/10: 321/324 tin S03 không có phường (bảng phường chỉ Hà Nội), 180 không có diện tích →
   mọi bài «cho thuê 12 triệu 2PN» không phường không DT của mọi người đăng gộp thành MỘT tin (nhóm lớn nhất 177 bài).
   Ngày 25/10: 876 bài có giá chỉ ra 37 tin mới.
2. **Cột bài nhận lệch tập transform đọc** — PR #136 (DF0) đã gạt bài S05 + bài thử khỏi `S03_POSTS_SQL`, nhưng lọc
   nguồn snapshot vẫn là `snapshot_id LIKE '%zalo-agent%'`, khác `loadStgPosts(client, "zalo")` + `testMarker`
   (`pipeline/lib/test-posts.mjs`).
3. Nhãn «bài thô» / «tin rao (đã đọc)» không nói cột đếm gì; ngày hôm nay luôn thiếu tin vì transform chạy đêm.

## Criteria

- AC-1: Given hai bài cùng nội dung đã đọc nhưng thiếu phường hoặc diện tích, When tính khoá gom (`repostKey`), Then
  hai người đăng (`sender_id`) khác nhau cho hai khoá khác nhau, một người đăng lại cho cùng một khoá.
- AC-2: Given bài đủ phường và diện tích, When tính khoá gom, Then khoá đúng bằng công thức nội dung trước vòng
  (`kind|phường|giá|DT|PN`) — bài người khác đăng lại cùng căn vẫn gộp.
- AC-3: Given bài thiếu trường mà không có `sender_id`, When tính khoá gom, Then SĐT trong bài phân biệt; không SĐT thì
  chữ bài đã chuẩn hoá (NFC, chữ thường, bỏ dấu câu) phân biệt.
- AC-4: Given lượt transform S03 thật (BEGIN…ROLLBACK, DB local) có bài fixture: người A đăng hai lần + người B một lần
  cùng nội dung thiếu trường, A và B mỗi người một bài đủ trường cùng nội dung, When `runTransformZalo` chạy, Then
  A-thiếu ra một tin `n_reposts = 2`, B-thiếu ra tin khác, hai bài đủ trường chung một tin `n_reposts = 2`, và đối soát
  `stale = 0` (đổi khoá gom không cho nghỉ tin đang sống — mảnh lớn thừa kế offer_id theo khoá dính PL14).
- AC-5: Given ma trận 10 bài viết trước (nguồn snapshot thật/khác tên/mock/example/e2e, tác tử thử, nhóm TEST/TESTING,
  tác tử S05), When đếm bằng `S03_POSTS_SQL`, Then số bằng đúng số bài `loadStgPosts(client, "zalo")` trả về; đột biến về
  lọc `LIKE '%zalo-agent%'` cũ ra thiếu một bài.
- AC-6: Given bảng «Luồng 7 ngày qua» ở máy thu và máy chủ, When dựng, Then hai cột S03 mang nhãn «S03 — bài nhận» /
  «S03 — tin rao mới», mô tả nói tin rao mới có sau lượt đọc đêm; `CONTEXT.md` có thuật ngữ «Gộp trùng» và nhãn đếm
  «bài nhận» cùng commit.

## Out of scope

- OOS-1: S05 (`transform-fb.mjs`) cùng công thức khoá — hàng riêng sau khi có số đo S05.
- OOS-2: `seller_ref` của tin S03 lấy `author_hash`, mà bài S03 thật mang `author_hash = 'openclaw…'` (tên tác tử thu) —
  không phải người đăng. Hàng riêng.
- OOS-3: Nhãn «S03 — bài thô» trên biểu đồ Hoạt động đồng bộ (`sync-activity.tsx`) — bản chụp TN-AC-7 của
  wanted-thanh-inquiry ghim markup; đổi cùng DF5 (bỏ cột tin rao khỏi Thu thập).

## Số đo DB local (27/10, transform trong ROLLBACK)

| | trước | sau |
|---|---|---|
| tin S03 | 349 | 586 |
| bài có giá vào gộp | 3.766 | 3.766 |
| nhóm lớn nhất | 177 bài (cho thuê 7 tr, 2PN, nhiều người) | 115 bài (một người, cùng một chữ bài đăng lại) |
| tin mới theo ngày 20→27/10 | 35 18 24 101 52 37 55 25 | 37 28 33 159 109 73 101 44 |
| đối soát `stale` | 0 | 0 |
