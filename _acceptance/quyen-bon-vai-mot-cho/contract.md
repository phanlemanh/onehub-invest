---
schema_version: 1
feature: Mọi route /api/v1/ops/** kiểm vai theo một bảng bốn vai (viewer, ops, admin, owner) ở ops-access.ts, và mỗi thao tác ghi đúng một dòng ops_audit mang id người thật trong cùng transaction
slug: quyen-bon-vai-mot-cho
owner: phanlemanh@gmail.com
risk_tier: T3      # máy suy: app/src/lib/ops-access.ts, app/src/app/api/v1/ops/**, db/migrations/** (t3_paths)
surfaces: [api]
status: verified
design_doc: docs/superpowers/specs/2026-10-27-quyen-bon-vai-mot-cho-design.md
approved_by: Mạnh
approved_at: 2026-10-27
---

# Acceptance Contract: quyen-bon-vai-mot-cho

## Context

Hàng TV1 (phủ TV1 + TVN3) của lộ trình Ops tự vận hành. Hôm nay 11 route `/api/v1/ops/**` tự chép một khuôn kiểm
«bearer chung hoặc vai ops», route quản trị không đòi admin, `ops_audit.actor` là hằng, audit ghi nền ngoài
transaction, `GET source-groups` kiểm quyền trên request rỗng, `users.role` không CHECK. Vòng này dựng một bảng quyền và
một đường audit cho mọi route ấy.

Source input: `_acceptance/quyen-bon-vai-mot-cho/opportunity.md`.

## Criteria

- AC-1: Given cây sau sửa, When quét 11 tệp `app/src/app/api/v1/ops/**/route.ts`, Then mỗi cặp route · phương thức (· action với `source-groups` POST) gọi `kiemQuyen(req, "<hành động>")` đúng hành động của bảng trong design doc (ma trận 21 ô viết trước), và không route nào còn tự đọc `OPS_API_TOKEN`, gọi `canAccessOps`, `isAdmin` hay `getSessionUser`.
- AC-2: Given lược đồ tạm có người ở mỗi vai (user, viewer, ops, admin, owner) với phiên thật, When gọi route thật cho từng ô route · phương thức (· action) của AC-1 với bảy kiểu người gọi (không ai, user, viewer, ops, admin, owner, bearer chung), Then mỗi ô trả 401, 403 hoặc qua đúng bảng (ma trận 21 × 7 = 147 ô viết trước); ở ô 401/403, bảng nghiệp vụ, `ops_audit`, tệp cấu hình Zalo giả và số lệnh của openclaw giả đều không đổi. (cross-layer)
- AC-3: Given một thao tác ghi qua quyền (mọi ô «qua» của hành động ghi ở AC-2), When nó thành công, Then có đúng một dòng `ops_audit` mới, actor `user:<id người gọi>` (bearer nạp số: `machine:cloud-sync`), action đúng tên hành động, detail mang trạng thái trước và sau khi thao tác đổi trạng thái; ô «không đổi», 409 và 400 ghi 0 dòng. (cross-layer)
- AC-4: Given một thao tác ghi DB (review.decide, unit.toggle, unit.create, unit.delete), When INSERT audit hỏng, Then route trả 500 và bảng nghiệp vụ giữ nguyên; When bước ghi nghiệp vụ hỏng, Then 0 dòng audit. Đối chứng: bản route trước sửa đã ghim (39c660ca) vẫn đổi bảng khi audit hỏng. (cross-layer)
- AC-5: Given việc ngoài DB của `zalo.admin` (ghi tệp cấu hình, chạy và dừng tiến trình đăng nhập) với openclaw giả, When việc lỗi, Then route trả lỗi và 0 dòng audit; When việc thành công, Then đúng một dòng — kể cả `zalo/login` POST và DELETE (hôm nay 0 dòng); When INSERT audit hỏng, Then route trả 5xx, tệp cấu hình và nhật ký lệnh của openclaw giả không đổi. (cross-layer)
- AC-6: Given `GET /api/v1/ops/source-groups` gọi bằng bearer chung trên request thật, When route kiểm quyền, Then trả 200 và danh sách nhóm; không bearer, không phiên → 401. Đối chứng: bản route trước sửa đã ghim trả 401 cho bearer.
- AC-7: Given migration mới áp lên lược đồ tạm ở khuôn hiện tại, When ghi `users.role` lần lượt năm vai rồi `superuser`, Then năm vai nhận, `superuser` bị từ chối với lỗi nêu tên ràng buộc; chạy lại migration không lỗi; DB local có 0 dòng vi phạm trước khi áp.
- AC-8: Given người ở mỗi vai và email trong `OPS_EMAILS`, When gọi `canAccessOps`, `isAdmin` và đọc vai từ phiên, Then viewer/ops/admin/owner vào Ops, chỉ admin/owner qua cổng admin, email `OPS_EMAILS` tính như ops, `user` và giá trị lạ không vào.
- AC-9: Given sổ bề mặt `app/src/lib/api-surface.ts` sau sửa, When chạy bộ kiểm sổ của NT4 và đối chiếu sổ với bảng quyền, Then chế độ từng route · phương thức khớp bảng (phương thức ghi không bearer khai không bearer) và bộ kiểm sổ xanh.
- AC-10: Given máy đêm nạp số (`push-ops-facts` → `ingest` bằng bearer) và lưới `/ops/sources` gọi công tắc bằng phiên admin, When chạy sau sửa, Then nạp số trả 200 với đúng một dòng audit `machine:cloud-sync`; mọi chỗ trong cây gọi `/api/v1/ops/**` bằng `OPS_API_TOKEN` chỉ nhắm hành động bảng cho bearer; và các ca thử hiện có của công tắc, vòng đời, sổ đơn vị, chế độ thu xanh khi gọi bằng phiên thật thay bearer.

## Coverage

Quét bằng morphological-scan, preset test-matrix:
- Trục A — người gọi: không ai | user | viewer | ops | admin | owner | bearer chung [thước CE: §3.5 bảng vai + bearer `OPS_API_TOKEN`]
- Trục B — hành động: ops.read | audit.read | ingest.push | review.decide | unit.toggle | unit.create | unit.delete | unit.set_mode | unit.update_meta | zalo.admin [thước CE: bảng của design doc, 11 route]
- Trục C — kết cục: qua và thành công | qua mà không đổi (unchanged, 409, 400) | qua mà việc lỗi | qua mà audit lỗi | 401 | 403 [thước CE: luật audit của design doc]
- Trục D — loại việc: ghi DB | ghi tệp | tiến trình [thước CE: bảng route của khảo sát 27/10]
- Cắt ngang: actor là người thật; một dòng mỗi thao tác; cổng trang suy cùng bậc vai.

## Out of scope

- Token máy theo tên và scope `ops:pull` (TV4); giao diện quản vai (TV5); cấp vai owner/viewer cho tài khoản thật (việc của người).
- Đảo được thao tác purge (`delete` vẫn xoá cứng).
- Kiểm vai theo hành động ở trang `/ops/**` (trang giữ `canAccessOps`/`isAdmin`).

## Notes

- Migration 049 (liên làn cấp, P1-34). Đo 27/10 (chỉ đếm): local user=1, admin=2; cloud admin=1, 0 người vai ops — CHECK qua cả hai.
  Áp DB local dùng chung sau gộp. Áp Supabase prod là quyết định của Mạnh (Hỏi-3): áp tay bằng `psql` tệp 049, lùi bằng
  `ALTER TABLE users DROP CONSTRAINT users_role_chk`.
- Đối chứng các AC chạy trên bản route trước sửa ghim thành fixture (route ở 39c660ca), không đọc ref nhánh lúc chạy.
