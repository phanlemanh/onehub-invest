---
schema_version: 1
feature: Ảnh tin trên thẻ hàng duyệt /ops/review (dải ảnh + phóng to, nối loadReviewMedia)
slug: review-card-photos
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: implemented
approved_by:
approved_at:
veto_state: mo
veto_opened_at: 2026-10-23T03:20:00Z
---

# Acceptance Contract: review-card-photos

## Context

Người duyệt ở `/ops/review` cần nhìn ảnh tin để quyết: E1 từng ghi «đất» cho tin mà ảnh là nhà 4
tầng. Backend đã vào main ở PR #16 (`loadReviewMedia`, route `/api/zalo-media` chế độ snapshot).
Việc này (Task 12 bản nhỏ, phiên điều phối làn merge giao 23/10) nối `loadReviewMedia` vào trang và
hiện ảnh trên cả hai loại thẻ: «Cùng căn?» (mỗi bên Tin A, Tin B) và «Bổ sung dữ liệu». Mỗi thẻ có
dải ảnh nhỏ, bấm vào thì phóng to; có trạng thái không có ảnh và ảnh hỏng (URL fbcdn hết hạn). Ảnh
tin là tầng A: chỉ admin thấy.

Source input: prompt — brief phiên điều phối local_5d0e32a0 (23/10) + giao việc của phiên điều phối
làn merge local_23b003f1 (23/10, sau khi PR #16 merge).

## Criteria

- AC-1: Given admin mở `/ops/review` và một thẻ «Cùng căn?» mà `loadReviewMedia` trả ảnh cho cả hai bên, When trang render, Then dưới khối Tin A và khối Tin B mỗi bên có một dải ảnh với đúng số ảnh của bên đó, đúng thứ tự, mỗi ảnh có chữ thay thế nêu bên và số thứ tự.
- AC-2: Given admin và một thẻ «Bổ sung dữ liệu» có ảnh, When trang render, Then dưới đoạn tin có một dải ảnh với đúng số ảnh của tin đó.
- AC-3: Given một dải ảnh, When người duyệt bấm ảnh thứ n, Then một hộp thoại mở ảnh đó cỡ lớn, tiêu đề nêu bên (Tin A / Tin B / Tin) và «ảnh n/N», có nút trước/sau chuyển ảnh (tắt ở hai đầu) và đóng được.
- AC-4: Given một ảnh không tải được (URL gốc hết hạn), When trình duyệt báo lỗi ảnh, Then ô ảnh đó chuyển sang trạng thái «Ảnh hỏng» (biểu tượng + chữ, không còn ảnh vỡ) và vẫn bấm được; trong hộp thoại, ảnh hỏng hiện câu báo URL gốc có thể đã hết hạn thay cho ảnh.
- AC-5: Given một bên/tin mà `loadReviewMedia` trả mảng rỗng, When thẻ render, Then vùng ảnh hiện «Không có ảnh»; Given không có dữ liệu ảnh cho thẻ (người xem không phải admin), Then thẻ không có vùng ảnh nào và không có thẻ `<img>` ảnh tin.
- AC-6: Given ảnh từ URL ngoài (fbcdn, zdn, Chợ Tốt), When thẻ render, Then thẻ `<img>` mang `referrerpolicy="no-referrer"` và `loading="lazy"`; ảnh lưu trên máy đi qua `/api/zalo-media`.
- AC-7: Given dev server local và DB local có hàng duyệt thật, When một tài khoản admin thử và một tài khoản ops thử (tạo tạm, xoá sau) cùng tải `/ops/review`, Then HTML của admin chứa ảnh tin (URL fbcdn của Tin A, URL Chợ Tốt của Tin B), HTML của ops không chứa URL ảnh tin nào và vẫn tải đủ thẻ. (cross-layer)
- AC-8: Given toàn bộ thay đổi, When chạy typecheck, lint (gồm luật onehub-ui), bộ test của app và design gate, Then tất cả xanh, không thêm dòng nào vào baseline `eslint-suppressions.json`.
- AC-9: Given admin trên `/ops/review` thật, When chụp vùng thẻ có ảnh ở chế độ sáng, tối và bề rộng 390px, rồi mở hộp thoại phóng to, Then cả hai loại thẻ hiện dải ảnh, hộp thoại hiện ảnh lớn, không có thanh cuộn ngang trang.

## Coverage

- Bỏ coverage-scan — việc UI nhỏ do phiên điều phối giao (entry d-…-1); trục đã phủ bằng tay: loại thẻ (entity_match Tin A | Tin B | agent_output), số ảnh (0 | 1 | nhiều), nguồn ảnh (local | remote có hạn | remote Chợ Tốt), tải ảnh (được | lỗi), người xem (admin | ops | không dữ liệu), thao tác (bấm | trước/sau | đóng), giao diện (sáng | tối | 390px).

## Out of scope

- Dựng lại cả trang `/ops/review` theo `solution-agents-5` (bảng dữ liệu lọc theo loại thẻ + độ tin, sheet chi tiết) — phần lớn của Task 12 trong `routes.md`, để vòng sau; PR này giữ dáng thẻ hiện có.
- Sửa các vi phạm ReUI có sẵn trong `review-card.tsx` (nút tự vẽ, `text-[10px]`, khung `div` viền tay) — thuộc đợt dọn trang này cùng việc dựng lại.
- Proxy ảnh remote qua server, tải ảnh fbcdn về máy, hay làm mới URL hết hạn.
- Mở ảnh cho role `ops` (cần đổi cả route lẫn loader — hồ sơ review-media-backend).
- Phóng to bằng cử chỉ (pinch/zoom), tải ảnh xuống, xoay ảnh.

> Out of scope = scope-truth. Rationale từng mục → entry `descope` trong `decisions.jsonl`.

## Notes

- T2: đường dự kiến `app/src/app/ops/review/page.tsx`, `app/src/components/ops/review-card.tsx`, `app/src/components/ops/review-photos.tsx` (mới), `app/src/components/ui/attachment.tsx` + `examples/c-attachment-3.tsx` (vendor, cài bằng shadcn CLI), `app/tests/*`, `scripts/*` — không khớp `t3_paths`.
- Block dùng: `@reui/c-attachment-3` (dải ảnh `Attachment` dọc) + shadcn `Dialog`.
- AC-7 cần dev server :3456 chạy từ worktree đang kiểm + DB local :5433; tài khoản thử mang tiền tố riêng mỗi lần chạy và luôn được xoá.
- Dữ liệu thật hôm nay chưa có ảnh local (0 dòng `media_files`) — ảnh local chỉ chứng ở test jsdom.
