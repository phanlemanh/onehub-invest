---
schema_version: 1
feature: tài khoản ops thử chỉ ở DB local cho máy tự đăng nhập dev
slug: dev-ops-account
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, config]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-22T22:39:27Z
approved_by:
approved_at:
---

# Acceptance Contract: dev-ops-account

## Context

Các vòng feature-loop đều phải bỏ eval `ui-observed` cho trang `/ops/**` vì Ops Portal bắt
đăng nhập mà máy (Claude, tác tử chấm S4) không có tài khoản. Hồ sơ này dựng một tài khoản ops
THỬ chỉ tồn tại trên Postgres local (:5433) để máy tự đăng nhập app dev; không dùng cơ chế bypass
auth (rủi ro lộ prod). Mật khẩu máy sinh, nằm ở tệp gitignored.

Source input: prompt — đề bài từ phiên feature-loop enrich-qua-de-xuat (2026-10-22), Mạnh chọn
đường hồ sơ T2 gọn để gỡ răng T1-escape của PR phanlemanh/onehub-invest#1.

## Criteria

- AC-1: Given `DATABASE_URL` trỏ host không phải `localhost`/`127.0.0.1`/`::1` (kể cả URL local có `?host=`/`?hostaddr=` ghi đè, hoặc giao thức không phải postgres), When chạy `node scripts/dev-ops-account.mjs`, Then script thoát mã 2 với thông điệp nói chỉ chạy trên Postgres local và không mở kết nối DB nào.
- AC-2: Given DB local không có bảng `users`/`sessions` đúng dạng auth của onehub, When `ensureAccount` chạy, Then nó từ chối với thông điệp nói sai schema và chỉ đọc `information_schema`, không ghi dòng nào.
- AC-3: Given chưa có user `ops-test@local.test`, When chạy script lần đầu, Then bảng `users` có đúng một dòng email đó với `role = admin` và `password_hash` dạng `<salt-hex 32>$<key-hex 128>` verify được bằng `scrypt(password, salt, 64)` như `app/src/lib/auth.ts`.
- AC-4: Given tài khoản đã có và mật khẩu trong tệp thông tin đăng nhập còn khớp hash, When chạy lại script không cờ, Then kết quả là `unchanged`, cùng user id, `password_hash` không đổi.
- AC-5: Given tài khoản đã có, When chạy với `--rotate` hoặc mật khẩu trong tệp lệch hash (worktree khác đã xoay), Then mật khẩu mới được sinh, mật khẩu cũ không còn verify được, và mọi dòng `sessions` của user đó bị xoá.
- AC-6: Given script chạy thành công, When đọc stdout và tệp `.claude/ops-test-account.json`, Then stdout không chứa mật khẩu, tệp bị `git check-ignore` và có quyền 600; và một đường dẫn không bị git ignore thì không được coi là nơi ghi hợp lệ.
- AC-7: Given `pipeline/sync-cloud.mjs` hiện tại, When đọc mảng `FILL` của nó, Then `users` và `sessions` không nằm trong đó (tài khoản thử không lên cloud).
- AC-8: Given dev server app chạy ở :3456 trên DB local và `OPS_EMAILS` không loại email thử, When POST form `/login` bằng email/mật khẩu trong tệp, Then trả 303 kèm cookie `oi_session` HttpOnly; cookie đó mở `/ops/sources` (trang admin-class) trả 200, còn không cookie thì `/ops/sources` không trả 200.

## Coverage

- Bỏ coverage-scan — tính năng hẹp một script dev local; trục rủi ro đã liệt kê thẳng trong AC: nơi chạy (AC-1, AC-2), vòng đời tài khoản tạo/giữ/xoay (AC-3–5), rò bí mật (AC-6), rời máy (AC-7), dùng được thật (AC-8).

## Out of scope

- Cơ chế bypass auth / cờ môi trường cho phép vào `/ops` không đăng nhập — cố ý không làm (rủi ro lộ prod).
- Tạo tài khoản trên DB cloud/production hay Supabase — script từ chối (AC-1).
- Sửa `app/.env.local` / `OPS_EMAILS` — script chỉ in nhắc, người tự thêm email thử.
- Cho `scripts/ui-capture.sh` tự đăng nhập trước khi chụp — việc tiếp theo, chưa làm ở đây.
- Khoá chống hai worktree xoay mật khẩu cùng lúc — chấp nhận: lần chạy sau tự xoay lại.
- Sửa lỗi 500 của `/ops/review` (`app/src/components/ops/review-card.tsx:60`) — lỗi render có sẵn, ngoài phạm vi.

## Notes

- Hồ sơ dựng SAU khi code xong (PR #1 đã mở, CI chặn vì thiếu hồ sơ). Tiêu chí lấy từ đề bài gốc
  của phiên mẹ (có trước khi code), không suy từ code; hai test AC-2, AC-7 và script đầu-cuối AC-8
  được thêm cùng lượt dựng hồ sơ.
- Role `admin` cho tài khoản thử: Mạnh chọn giữ (2026-10-23) để chụp được trang admin-class.
- Lệnh kiểm khai mới ở `_acceptance/config.yaml`: `executors.test.scripts`, `executors.script.ops_login`.
