---
schema_version: 1
feature: Siết quyền — cổng Ops đóng mặc định, /api/zalo-media chỉ ảnh staging
slug: ops-access-hardening
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [api, auth]
status: draft
approved_by:
approved_at:
---

# Acceptance Contract: ops-access-hardening

## Context

Phát hiện khi vá cổng `/deals → /ops/deals` (hồ sơ `portal-deals-airdna`), hai lỗ quyền:

1. `canAccessOps` (`app/src/lib/ops-access.ts`) cho MỌI user đăng nhập vào `/ops/**` khi
   `OPS_EMAILS` trống. `/register` mở cho mọi người → ai cũng tự tạo tài khoản rồi vào Ops
   (smoke 2026-10-22: user thường tạm vào được `/ops/deals`; API `/api/v1/ops/*` trả 200).
2. `/api/zalo-media` cho phép cả `~/.openclaw` (có `openclaw.json`, `credentials/`,
   `mac-control.token`) và so path bằng `startsWith` → admin đọc được file cấu hình
   (200), và `/tmp/openclaw-evil/...` lọt qua tiền tố `/tmp/openclaw`.

Mạnh chọn (2026-10-22, trong phiên): **đóng mặc định + role `ops`** — vào Ops khi
`users.role` ∈ {`ops`, `admin`} HOẶC email trong `OPS_EMAILS`. Cột `role` là `text` không
CHECK → không cần migration; cấp quyền bằng `UPDATE users SET role = 'ops'`.

Source input: prompt (phiên điều phối giao việc sau bản vá portal-deals-airdna).

## Criteria

- AC-1: Given user tự đăng ký (`role=user`), email không trong `OPS_EMAILS`, When mở `/ops`, `/ops/deals` hoặc gọi `/api/v1/ops/coverage`, Then trang trả 404 và API trả 401 — không thấy nội dung Ops.
- AC-2: Given user `role=ops`, When mở `/ops/deals` và gọi `/api/v1/ops/coverage`, Then vào được (200) nhưng không thấy SĐT người bán (0 link `tel:`), `/ops/sources` vẫn 404 và `/api/zalo-media` vẫn 404 (tầng A chỉ admin).
- AC-3: Given admin, When mở `/ops/deals`, Then vào được và thấy SĐT như trước — kể cả khi `OPS_EMAILS` đặt mà không chứa email admin.
- AC-4: Given `OPS_EMAILS` liệt kê email (không phân biệt hoa thường, có khoảng trắng), When user `role=user` có email đó đăng nhập, Then vào được Ops (cửa phụ theo env giữ nguyên).
- AC-5: Given khách chưa đăng nhập, When gọi `canAccessOps(null)` / mở `/ops/**`, Then bị chặn (proxy đưa về `/login`).
- AC-6: Given admin, When gọi `/api/zalo-media` với path tới `~/.openclaw/openclaw.json`, `~/.openclaw/media/../openclaw.json` hoặc `~/.openclaw/credentials`, Then nhận 403.
- AC-7: Given admin, When gọi `/api/zalo-media` với ảnh nằm ở `/tmp/openclaw-evil-*/x.png` (khớp tiền tố chuỗi nhưng ngoài gốc), Then nhận 403.
- AC-8: Given admin, When gọi `/api/zalo-media` với symlink `.png` đặt trong `/tmp/openclaw` trỏ ra ngoài gốc, Then nhận 403 (kiểm lại trên realpath).
- AC-9: Given admin, When gọi `/api/zalo-media` với file không phải ảnh trong gốc cho phép, Then nhận 403; ảnh PNG thật trong `/tmp/openclaw` → 200 `image/png`; ảnh không tồn tại trong gốc → 404.

## Coverage

- Trục người xem: khách | `role=user` | `role=user` + email trong `OPS_EMAILS` | `role=ops` | `role=admin` [thước CE: `User.role` + `canAccessOps`]
- Trục `OPS_EMAILS`: không đặt | rỗng | có, chứa email | có, không chứa email [thước CE: nhánh trong `canAccessOps`]
- Trục bề mặt: trang `/ops/**` (layout) | API `/api/v1/ops/*` | `/ops/sources` (admin-class) | `/api/zalo-media` [thước CE: các nơi gọi `canAccessOps`/`isAdmin`]
- Trục path media: trong gốc (ảnh / không ảnh / không tồn tại) | ngoài gốc trong `~/.openclaw` | leo `..` | tiền tố chuỗi giả | symlink ra ngoài [thước CE: `isInside` lớp chữ + lớp realpath]
- Ô `OPS_EMAILS` × HTTP chỉ phủ bằng gọi thật hàm (`check-portal-compliance.mjs` §9): smoke không đổi được env của server đang chạy.

## Out of scope

- Không thêm UI quản lý role (cấp `ops` bằng SQL tay; `/ops/sources` admin có thể làm sau).
- Không đổi `/register` (vẫn mở; tài khoản mới là `role=user`).
- Không đổi luật Bearer `OPS_API_TOKEN` của API ops (machine token giữ nguyên).
- Không kiểm/đặt Vercel env prod — việc của Mạnh trước khi deploy (xem Notes).
- Không đổi nơi OpenClaw lưu ảnh; không đụng cấu hình OpenClaw.

## Notes

- Hợp đồng viết SAU khi code xong (phiên điều phối giao kèm tiêu chí; Mạnh đã chọn luật trong phiên). T3 → Cổng 1 (hợp đồng + evals), Cổng 1.5 (`plan.md`) và Cổng 2 đều chờ Mạnh ký. Code nằm sẵn trên nhánh `fix/ops-access-hardening`, chưa merge; bằng chứng máy chạy trước ở `evidence/` để Mạnh duyệt cùng lúc.
- **Rủi ro deploy**: prod Vercel — mọi user không phải admin đang vào Ops nhờ `OPS_EMAILS` trống sẽ mất quyền. Trước khi merge: `SELECT email, role FROM users` trên Supabase, cấp `role='ops'` cho ai cần, hoặc đặt `OPS_EMAILS`.
- Hành vi đổi kèm: admin luôn vào Ops kể cả khi `OPS_EMAILS` đặt mà thiếu email admin (trước đây bị chặn) — đúng clearance law (admin ⊃ data-ops).
- Gốc media: OpenClaw lưu ảnh inbound ở `~/.openclaw/media/inbound` (`src/media/store.ts`, `getMediaDir`); `/tmp/openclaw` giữ theo đề bài. Rủi ro còn lại: `/tmp/openclaw` có ảnh QR đăng nhập Zalo (`openclaw-zalouser-qr-*.png`) — admin đọc được; admin vốn đã đăng nhập Zalo được ở `/ops/sources` nên không mở thêm quyền.
- DB local hiện chỉ có 1 dòng `media[].path` (`/tmp/x.jpg`, dữ liệu thử) — ảnh deals thực tế đi theo `url`, nên thu hẹp gốc không làm mất ảnh nào đang hiện.
