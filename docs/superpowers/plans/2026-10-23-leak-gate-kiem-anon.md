# Kế hoạch — leak-gate-kiem-anon (AU1, T3)

Hợp đồng: `_acceptance/leak-gate-kiem-anon/contract.md` (Cổng Phạm vi duyệt 23/10). Design:
`docs/superpowers/specs/2026-10-23-leak-gate-kiem-anon-design.md`. Bốn task, tuần tự (cùng hai tệp).

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| Lượt đồng bộ dừng và báo đỏ khi khoá công khai đọc được một bảng, kèm lệnh gỡ | `pipeline/sync-cloud.mjs` | AC-1…AC-7 (phép kiểm), AC-11 (báo đỏ thật) |
| Mạnh có một lệnh chỉ đọc để soi prod trước khi merge | `pipeline/sync-cloud.mjs` (`--kiem-anon`) | AC-11 (lệnh soi prod) |
| Thước chứng được cả chiều đỏ lẫn chiều gỡ trên cloud mô phỏng | `pipeline/scripts/check-cloud-sync.mjs` | AC-1…AC-9, AC-11 |
| Người vận hành biết thứ tự triển khai và cách gỡ | `docs/ops/supabase-lock-anon-rls.md` | AC-10 (sổ vận hành) |

## Task 1 — `anonReadable` + hai chốt + `runMain`/`--kiem-anon` trong `pipeline/sync-cloud.mjs`

- Files: `pipeline/sync-cloud.mjs`
- `export const PUBLIC_READ_ALLOW = ["spatial_ref_sys", "geometry_columns", "geography_columns"]` (chừa khi là
  thành viên extension `postgis`).
- `export async function anonReadable(exec)`: (1) `pg_roles` thiếu `anon` → `["cloud không có role anon — không kiểm
  được quyền đọc công khai"]`; (2) một câu SQL trả (role, rel, kind, đường, cột) cho role ∈ {anon, authenticated},
  `public`, relkind r/p/v/m/f, `has_table_privilege OR has_any_column_privilege` SELECT, trừ danh sách chừa; đường suy
  bằng `aclexplode(relacl)` (grantee = role → `cấp thẳng`; grantee 0 → `qua PUBLIC`), `aclexplode(attacl)` (→ `cấp
  cột <c>`), còn lại → `qua role <r>` (role trung gian có quyền mà role đo là thành viên, `pg_has_role … MEMBER`).
  Mỗi dòng `<role> đọc được public.<t> (<loại>, <đường>; gỡ: <REVOKE …>)`.
- `syncOnce`: sau `lap("catalog")` gọi `anonReadable` → có dòng thì `PhaseError("gate", "LEAK GATE FAIL (trước khi
  gửi): …")`; dòng gọi mang chú thích máy-đọc `// AU1:kiem-truoc-khi-gui` (đột biến của thước xoá đúng dòng đó).
  `leakGate` nối thêm `anonReadable`; thông điệp sau tráo đổi thành `LEAK GATE FAIL (sau tráo): …`.
- `export async function runMain({ local, exec, out = console.log, err = console.error })` → trả 0/1, in đúng các
  dòng `main()` cũ in. `export async function runKiemAnon({ exec, out })` → in vi phạm hoặc «sạch», trả 0/1.
  `main()` chỉ dựng deps thật (token, pg local) rồi gọi `runMain` / `runKiemAnon` theo `--kiem-anon`
  (`--kiem-anon` không mở kết nối local).
- Verify: `cd pipeline && npm test` + `node --check sync-cloud.mjs`. Phục vụ E1–E9, E19. `independent: false`.

## Task 2 — cloud mô phỏng áp 037 mặc định

- Files: `pipeline/scripts/check-cloud-sync.mjs`
- `buildCloudSim(..., { lock = true })`: sau 038 (và sau migration đột biến nếu có), `lock` → áp
  `db/migrations/037_lock_anon_enable_rls.sql`, rồi `GRANT SELECT` ba quan hệ PostGIS cho anon (giống cloud thật).
  `caseStage` gọi với `lock: false` (ca đo riêng 038, cần default ACL trước 037).
- Verify: chạy 8 ca cũ `stage atomic fail fidelity keep pii overlap allow` — tất cả OK. Phục vụ E10–E17.
  `independent: false`.

## Task 3 — ca `anon` trong `check-cloud-sync.mjs`

- Files: `pipeline/scripts/check-cloud-sync.mjs`, `_acceptance/config.yaml` (đã có khoá `cloud_sync_anon`).
- Một local mô phỏng + một cloud mô phỏng (đã khoá). Các ô, mỗi ô một lượt `runSync` và một khối gỡ:
  - đối chứng dương: tiền điều kiện anon SELECT được `spatial_ref_sys` thật; lượt xanh, `anonReadable` rỗng.
  - AC-2: tiền điều kiện md5 local ≠ cloud (dùng `makeOldDiffer`); GRANT `users` → dừng `gate`, «(trước khi gửi)»,
    «anon đọc được public.users», md5 cloud không đổi, staging 0. Đối chứng đỏ: chép `sync-cloud.mjs` sang thư mục tạm
    cạnh `node_modules` (symlink), xoá dòng mang mốc `AU1:kiem-truoc-khi-gui`, import bản đột biến → cùng ô phải
    FAIL ở vế md5 (ghim).
  - AC-3: view `v_ruler_p2_area`, materialized view `acc_mv`, bảng phân vùng `acc_part` — mỗi ô tên đúng.
  - AC-4: authenticated (có «authenticated đọc được», không có «anon đọc được»), PUBLIC («qua PUBLIC»), cột («cấp cột»),
    role trung gian `acc_reader` mà anon là thành viên («qua role acc_reader»).
  - AC-5: bảng `spatial_ref_sys_copy` → đỏ; thông điệp không nhắc ba quan hệ PostGIS thật.
  - AC-6: cloud mô phỏng `roles: false` → «cloud không có role anon».
  - AC-7: hook `cloudExec` chạy GRANT khi gặp câu tráo → «(sau tráo)», không có «(trước khi gửi)»; đối chứng: hook
    không GRANT → xanh.
  - AC-8: mỗi ô đỏ AC-2…AC-5 áp NGUYÊN VĂN chuỗi sau «gỡ: » → lượt kế xanh; đếm ô gỡ = ô đỏ.
  - AC-11: `runMain` với `out/err` thu dòng: cloud bẩn → mã 1 + dòng khớp `SYNC FAIL [gate] … anon đọc được
    public.users`; sạch → mã 0 + «leak gate PASS». `runKiemAnon` với exec ghi log: bẩn → mã 1, sạch → mã 0, mọi câu
    gửi bắt đầu `SELECT` (sau khi bỏ khoảng trắng / `WITH`).
- Verify: `cd pipeline && node scripts/check-cloud-sync.mjs anon` OK; phá-thử: xoá chừa PostGIS trong bản sao →
  ô đối chứng dương đỏ (chạy tay, ghi vào sổ). Phục vụ E1–E8, E19. `independent: false`.

## Task 4 — tài liệu

- Files: `docs/ops/supabase-lock-anon-rls.md` (mục «Leak gate kiểm anon»), `docs/ops/runtime-map.md` (một dòng),
  `docs/ROADMAP.md` (Track 5 dòng V8 thêm ghi chú gate).
- Verify: đối chiếu bốn điều của E18 với chuỗi thông điệp và `PUBLIC_READ_ALLOW` trong code. Phục vụ E18.
  `independent: true` (chỉ tài liệu) — làm cuối, tuần tự.
