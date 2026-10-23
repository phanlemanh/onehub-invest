---
schema_version: 1
feature: Backend ảnh tin cho hàng duyệt /ops/review (route /api/zalo-media + loader ảnh theo thẻ)
slug: review-media-backend
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: implemented
approved_by:
approved_at:
veto_state: mo
veto_opened_at: 2026-10-23T01:40:05Z
---

# Acceptance Contract: review-media-backend

## Context

Ngày 23/10, khi xem thẻ «Bổ sung dữ liệu» trước lúc ký Gate 2, Mạnh thấy thẻ duyệt ở `/ops/review`
không có ảnh tin nên khó quyết. Ví dụ: E1 ghi `property_type=land` cho tin mà ảnh là nhà 4 tầng.
Việc này làm PHẦN BACKEND: (1) route `/api/zalo-media` phục vụ thêm ảnh N1 nằm trong
`collector/snapshots/<market>/<snapshotId>/media/*`; (2) hàm nạp `loadReviewMedia` trả danh sách ảnh
cho từng thẻ `entity_match` (Tin A, Tin B) và `agent_output`. Nguồn ảnh: `stg_zalo_posts.media_files`
(migration 035, file local) và `stg_zalo_posts.media` (URL gốc có hạn: fbcdn S05, zdn S03) của các post
trong `sale_offers.post_ids`, cùng `evidence.*.image_url` (S06 Chợ Tốt). Ảnh tin là PII tầng A
(ADR-0007): chỉ admin xem, chỉ máy local, không lên cloud. Phần giao diện (dải thumbnail, phóng to,
trạng thái không ảnh/ảnh hỏng) và việc nối hàm nạp vào `page.tsx` do phiên B1 làm sau.

Source input: prompt — brief của phiên điều phối local_5d0e32a0 (23/10/2026), thu hẹp về backend theo
quyết định Mạnh chọn (a) «chia tầng», chuyển qua phiên điều phối làn merge local_23b003f1.

## Criteria

- AC-1: Given admin đã đăng nhập và file ảnh `<snapshotsRoot>/<market>/<snapshotId>/media/<tên>.jpg` có trên đĩa, When GET `/api/zalo-media?snapshot=<snapshotId>&file=media/<tên>.jpg`, Then trả 200, `content-type` đúng đuôi ảnh, thân bằng đúng byte của file, `cache-control: private`; cùng tham số mà file không có trên đĩa thì 404.
- AC-2: Given người gọi chưa đăng nhập, hoặc có role `ops`, hoặc role `user`, When gọi route ở cả chế độ `snapshot`/`file` lẫn chế độ `path` cũ với file ảnh hợp lệ, Then trả 404 và không đọc file.
- AC-3: Given admin, When tham số snapshot/file cố ra khỏi vùng cho phép (`..` trong snapshot hoặc file, `/` trong snapshot, file không nằm thẳng trong `media/`, đuôi không phải ảnh, thư mục anh em `snapshots-evil` trùng tiền tố, symlink trong `media/` trỏ ra ngoài gốc snapshots, thiếu một trong hai tham số), Then trả 400/403/404 và không bao giờ trả byte của file đích.
- AC-4: Given chế độ `?path=` của PR #5 cho gốc OpenClaw, When admin gọi với ảnh trong `~/.openclaw/media` và với `~/.openclaw/openclaw.json`, Then lần lượt 200 và 403 như trước khi đổi; chế độ `path` không đọc được ảnh trong gốc snapshots.
- AC-5: Given các bài (post) của một tin rao theo thứ tự `post_ids`, mỗi bài có `media_files` (file tải được, hoặc entry có `error`) và/hoặc `media` (URL gốc), cùng `image_url` của evidence, When dựng danh sách ảnh của tin rao, Then ảnh local đứng trước dưới dạng `/api/zalo-media?snapshot=…&file=…`; entry lỗi hoặc thiếu file rơi về URL gốc gắn `expiring: true`; URL đã có bản local không lặp lại; URL không phải http(s) bị bỏ; giữ thứ tự `post_ids`; tối đa 12 ảnh mỗi tin rao.
- AC-6: Given hàng duyệt gồm thẻ `entity_match` (evidence `offer_a`/`offer_b`) và `agent_output` (evidence `offer_id`), When admin gọi `loadReviewMedia(items, user)`, Then kết quả khoá theo id thẻ: thẻ so khớp có `offer_a` và `offer_b`, thẻ bổ sung có `offer`; loại thẻ khác hoặc evidence thiếu `offer_id` không có mục; cả hàng duyệt chỉ tốn một truy vấn.
- AC-7: Given người gọi không phải admin, When gọi `loadReviewMedia`, Then trả `{}` và không truy vấn DB; Given DB không có bảng `stg_zalo_posts` (cloud), When admin gọi, Then trả `{}` thay vì ném lỗi, còn lỗi DB khác vẫn ném.
- AC-8: Given DB local thật, với một snapshot, hai post (một có `media_files` local + một entry lỗi, một chỉ có `media` fbcdn) và một tin rao trỏ tới hai post đó, tạo trong một giao dịch, When `loadReviewMedia` chạy trên chính giao dịch đó cho một thẻ `agent_output` và một thẻ `entity_match`, Then danh sách ảnh đúng như AC-5/AC-6, và sau khi ROLLBACK DB không còn dòng nào của lần chạy.
- AC-9: Given toàn bộ thay đổi, When chạy typecheck + lint + bộ test của app, và quét `data-api/` cùng `pipeline/sync-cloud.mjs`, Then tất cả xanh, không chỗ nào trong `data-api/` nhắc tới `media_files` hay `zalo-media`, và danh sách bảng sync cloud (`FILL`) không có `stg_zalo_posts`.

## Coverage

- Bỏ coverage-scan — backend hẹp do phiên điều phối chia tầng (entry d-20261023T014005Z-1); trục đã phủ bằng tay: người gọi (khách | user | ops | admin), chế độ route (snapshot/file | path cũ), đường ra ngoài (`..` | `/` | sai thư mục | sai đuôi | tiền tố chuỗi | symlink | thiếu tham số), trạng thái ảnh (file local | entry lỗi | chỉ URL gốc | URL lạ | không ảnh), loại thẻ (entity_match | agent_output | khác), môi trường DB (local có stg | cloud thiếu bảng | lỗi khác).

## Out of scope

- Giao diện ảnh trên thẻ (dải thumbnail, phóng to, trạng thái không ảnh/ảnh hỏng) và nối `loadReviewMedia` vào `app/src/app/ops/review/page.tsx` — phiên B1 làm sau (Mạnh chọn (a)); KHÔNG sửa `review-card.tsx` hay `page.tsx`.
- Proxy ảnh remote (fbcdn/zdn/chotot) qua server — trình duyệt admin tải thẳng từ URL gốc; URL hết hạn là trạng thái «ảnh hỏng» của UI.
- Phục vụ `media[].path` (đường staging OpenClaw trong cột `media` cũ) cho thẻ duyệt.
- Sinh snapshot zalo-agent v2 thật hay backfill `media_files` — việc của ZCode/collector; DB local hiện 0 dòng có `media_files`, nên AC-8 dùng dữ liệu tạo trong giao dịch.
- Đưa ảnh, URL ảnh hay `media_files` lên cloud, `data-api` hay sync-cloud dưới mọi dạng — cấm theo ADR-0007.
- Ảnh chụp `/ops/review` có ảnh trên hai loại thẻ — điều kiện «xong» cũ, chuyển sang phiên B1 cùng phần UI.

> Out of scope = scope-truth (Gate 1 duyệt mục này). Rationale/trade-off từng mục → 1 entry `descope` trong `decisions.jsonl`.

## Notes

- T2: đường dự kiến `app/src/app/api/zalo-media/route.ts`, `app/src/lib/ops/zalo-media.ts`, `app/src/lib/ops/review-media.ts`, `app/tests/*`, `app/scripts/*` — không khớp `t3_paths`. Phase 3 kiểm lại diff thật.
- Cổng Phạm vi T2 theo làn V: `veto_state: mo`, Mạnh veto lúc nào cũng được.
- Gốc snapshots: env `SNAPSHOTS_DIR` (cùng tên với `pipeline/backfill-zalo-media.mjs`), mặc định `<cwd>/../collector/snapshots`. App chạy từ worktree cần đặt `SNAPSHOTS_DIR` trỏ checkout chính.
- `media_files[].file` tương đối thư mục snapshot; thư mục snapshot = `<root>/<market>/<snapshotId>`, với `market` là phần trước `__` của `snapshotId` (vd `hanoi__zalo-agent__2026-10-22T070651`).
- AC-8 cần DB local :5433 (container `one-invest-db`); mọi dòng tạo trong giao dịch và bị ROLLBACK.
