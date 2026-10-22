# Kế hoạch (Cổng 1.5 — T3): ops-access-hardening

Nhánh `fix/ops-access-hardening` (từ `fix/portal-deals-airdna` — cần cổng admin của
`/api/zalo-media` và script smoke ở nhánh đó). Merge SAU `fix/portal-deals-airdna`.

## Bước

1. `app/src/lib/auth.ts` — `User.role` thêm `"ops"`; đọc `ops` từ DB, giá trị lạ rơi về `user`.
2. `app/src/lib/ops-access.ts` — `canAccessOps`: `admin`/`ops` → true; còn lại chỉ khi email
   trong `OPS_EMAILS`. Bỏ nhánh "danh sách trống → cho tất cả". `isAdmin` giữ nguyên.
   Mọi nơi gọi (layout `/ops`, `/ops/review`, 10 route `/api/v1/ops/*`) hưởng luật mới, không sửa từng nơi.
3. `app/src/app/api/zalo-media/route.ts` — gốc chỉ `~/.openclaw/media` + `/tmp/openclaw`;
   `isInside` bằng `path.relative` (không `startsWith`); hai lớp: path chữ, rồi `realpath`
   (chặn symlink); chỉ đuôi ảnh trong `MIME` (bỏ `application/octet-stream`).
4. `scripts/check-portal-compliance.mjs` — §8 kiểm tĩnh gốc/cách so path; §9 gọi thật
   `canAccessOps` qua ma trận role × `OPS_EMAILS` (Node bỏ kiểu TS khi import).
5. `scripts/smoke-portal-compliance.mjs` — thêm user `role=ops` tạm, ca user thường bị chặn
   (`/ops`, `/ops/deals`, API 401), và 9 ca path `/api/zalo-media` (file tạm trong
   `/tmp/openclaw` + `/tmp/openclaw-evil-*`, xoá trong `finally`).
6. Tài liệu: `docs/architecture/portals.md` (clearance law: data-ops = role ops|admin hoặc
   `OPS_EMAILS`), `app/CLAUDE.md`, `docs/api/openapi.yaml`, `docs/ROADMAP.md` §3.10 + V4.

## Không làm

Không migration (role là text không CHECK). Không UI cấp role. Không đụng Vercel env.

## Trước khi deploy prod (việc của Mạnh)

`SELECT email, role FROM users` trên Supabase → cấp `role='ops'` hoặc đặt `OPS_EMAILS` cho
người không phải admin cần vào Ops. Thiếu bước này họ nhận 404 ở `/ops`.
