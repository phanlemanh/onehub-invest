# Leak gate kiểm quyền anon (AU1 · `leak-gate-kiem-anon`) — design

Hàng AU1 của `docs/plan/lo-trinh.json`, đợt 0 «Cầm máu». Gốc: audit 23/10 dòng P12 và §6 dòng 0.2
(`docs/audit/2026-10-23-hien-trang-va-lo-trinh.md`): RLS 0/37 bảng, anon SELECT 37/37 bảng + 4 view trên
Supabase prod. Migration 037 (PR #20) khoá lỗ đó, Mạnh áp lên prod theo `docs/ops/supabase-lock-anon-rls.md`.
Việc này chặn TÁI PHÁT: một GRANT lỡ tay, một bảng mới được default privileges cấp lại, một lần ai đó hoàn tác
037 — lượt sync kế phải dừng và báo đỏ.

## Hiện trạng

`pipeline/sync-cloud.mjs` có `leakGate(exec)` chạy SAU nhát tráo: bảng tầng A/thô vắng hoặc 0 dòng, không bảng
`airdna%`, `seller_ref` dạng S0x, anon/authenticated không có USAGE trên `sync_stage`. Gate không hỏi gì về quyền
của anon trên schema `public` — chính cửa PostgREST mở cho mọi người cầm anon key.

## Cách làm

1. **`anonReadable(exec)`** (mới, export) trong `pipeline/sync-cloud.mjs` — trả danh sách vi phạm, rỗng = sạch:
   - `cloud không có role anon — không kiểm được quyền đọc công khai` khi `pg_roles` thiếu `anon` (fail-closed:
     Supabase luôn có role này; vắng nó nghĩa là đang nói chuyện với một DB khác hẳn, không được cho qua).
   - Mỗi cặp (role ∈ {`anon`, `authenticated`}, quan hệ thuộc schema `public` có `relkind` ∈ {r, p, v, m, f})
     mà `has_table_privilege(role, rel, 'SELECT') OR has_any_column_privilege(role, rel, 'SELECT')` → một dòng
     `<role> đọc được public.<tên> (<loại>, <đường cấp>; gỡ: <lệnh REVOKE>)`. `has_*_privilege` tính cả PUBLIC và
     role thành viên, nên một hàm đo phủ mọi đường; đường cấp suy từ `aclexplode` của `relacl`/`attacl`: `cấp thẳng`
     (gỡ `REVOKE SELECT ON public.<t> FROM <role>`), `qua PUBLIC` (gỡ `… FROM PUBLIC`), `cấp cột <c>` (gỡ
     `REVOKE SELECT (<c>) ON public.<t> FROM <role|PUBLIC>`), `qua role <r>` (gỡ `REVOKE <r> FROM <role>`).
   - **Chừa đúng ba quan hệ PostGIS** — `public.spatial_ref_sys`, `public.geometry_columns`,
     `public.geography_columns` — và CHỈ khi quan hệ là thành viên extension `postgis` (`pg_depend.deptype='e'`).
     Đây là Known limit của 037: chủ là `supabase_admin`, role `postgres` không thu quyền được; nội dung là bảng
     tham chiếu toạ độ công khai. Bảng thường trùng tên hoặc quan hệ của extension khác không được chừa.
2. **Hai chỗ gọi trong `syncOnce`:**
   - **Trước khi gửi** — ngay sau pha `catalog`, trước khi đọc local và nạp staging: có vi phạm → `PhaseError("gate",
     "LEAK GATE FAIL (trước khi gửi): …")`. Lượt dừng trước khi một dòng nào rời máy; dữ liệu cloud và staging không đổi.
   - **Sau tráo** — `leakGate` gộp thêm `anonReadable`; thông điệp `LEAK GATE FAIL (sau tráo): …`.
   - `main()` tách thành `runMain({ local, exec, out, err })` trả mã thoát (main gọi với deps thật, đặt
     `process.exitCode`) — để thước đo đúng dòng `SYNC FAIL [gate] …` và mã 1 mà tiến trình thật in, không cần cửa sau
     đổi đích cloud. Đẩy cảnh báo đi xa hơn (watchdog, `/ops`) là việc AU3.
   - **`--kiem-anon`** — chế độ chỉ đọc của CLI: `runKiemAnon({ exec, out })` chạy `anonReadable`, in từng vi phạm,
     mã 1 khi có. Mạnh chạy trên prod sau khi áp 037 (cần `~/.oneinvest/cloud.env`) — đó là bằng chứng «xanh khi
     sạch» trên cloud thật trước khi merge.
3. **Thước — ca `anon` trong `pipeline/scripts/check-cloud-sync.mjs`** (container Postgres tạm, cùng khuôn các
   ca cũ, không chạm DB local dùng chung, không gọi cloud):
   - Cloud mô phỏng NAY áp 037 sau khi dựng (như prod sau khi Mạnh áp) — mọi ca cũ chạy trên cloud đã khoá; thêm
     tuỳ chọn `lock: false` cho ca nào cần trạng thái trước 037.
   - Đối chứng dương: cấp SELECT cho anon trên ba quan hệ PostGIS (giống cloud thật) → lượt sync xanh.
   - Ma trận phải-bắn, mỗi ô một lượt sync riêng, đòi dừng pha `gate` với thông điệp gọi tên đúng đối tượng, md5
     cloud không đổi và 0 dòng staging: bảng (`users`), view (`v_ruler_p2_area`), materialized view tạo trong ca,
     bảng phân vùng tạo trong ca, cấp cho `authenticated`, cấp cho `PUBLIC`, cấp một cột, cấp qua role thành viên,
     bảng thường tên `spatial_ref_sys_copy`, cloud thiếu role `anon`.
   - Cấp giữa lượt (hook chạy GRANT lúc tráo) → dừng ở gate SAU tráo, thông điệp gọi tên bảng.
   - Ma trận gỡ: mỗi ô đỏ áp nguyên văn lệnh `gỡ:` trong thông điệp của nó → lượt kế xanh.
   - Ô AC-2 dùng local đã lệch cloud (tiền điều kiện md5 khác) và có đối chứng đỏ: bản sao `sync-cloud.mjs` bỏ chỗ
     kiểm trước khi gửi (đánh dấu bằng một dòng chú thích máy-đọc) phải làm ô FAIL ở vế md5.
   - `runMain` và `runKiemAnon` chạy trên cloud bẩn/sạch: mã thoát, dòng in, và `--kiem-anon` chỉ gửi `SELECT`.
4. **Tài liệu:** `docs/ops/supabase-lock-anon-rls.md` thêm mục «Leak gate kiểm anon» — thứ tự triển khai (áp 037
   lên prod TRƯỚC khi merge; ngược lại mọi lượt sync dừng đỏ), cách đọc dòng `SYNC FAIL [gate] … anon đọc được`,
   cách gỡ (REVOKE đúng đối tượng, không tắt gate), và ba quan hệ PostGIS được chừa vì sao.
   `docs/ops/runtime-map.md` + ROADMAP một dòng.

## Không làm

- Không kiểm quyền EXECUTE trên hàm (`/rpc`) hay schema khác `public` (`graphql_public`, `storage`…): câu giao chỉ
  nói bảng và view; 037 và `check-supabase-lock.sh` đã đo hàm. Ghi vào Out of scope.
- Không đo trực tiếp trên Supabase prod (đường đo chỉ đọc `check-supabase-lock.sh cloud` đã có, cần khoá Mạnh).
- Không tự áp 037, không tự thu quyền trên prod khi gate đỏ — gate chỉ dừng và nói.
