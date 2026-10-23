---
schema_version: 1
feature: Khoá Data API Supabase prod — thu quyền anon/authenticated, bật RLS mọi bảng public (migration 037)
slug: supabase-lock-anon-rls
owner: phanlemanh@gmail.com
risk_tier: T3      # db/migrations/** — quyền truy cập dữ liệu prod (PII tầng A: users, sessions, sellers)
surfaces: [config, docs]
status: draft
approved_by:
approved_at:
---

# Acceptance Contract: supabase-lock-anon-rls

## Context

Supabase prod `one-invest` (`smqpqiigzulwpmrsrhci`) đang để RLS tắt trên mọi bảng `public`.
Role anon và authenticated có toàn quyền trên mọi bảng, view và sequence; default privileges còn
cấp lại cho đối tượng tạo sau. Ai có anon key (Supabase coi là khoá công khai) đọc được qua
PostgREST `sessions` (token thô, chiếm được phiên `/ops`), `users`, `sale_offers`, `sellers`.
Việc này thêm migration `037_lock_anon_enable_rls.sql` để đóng lỗ mà không làm gãy app, sync-cloud
hay push-ops-facts (các đường này vào bằng postgres hoặc service_role). Kèm runbook áp, kiểm,
hoàn tác (`docs/ops/supabase-lock-anon-rls.md` + `.rollback.sql`), thước đo
`scripts/check-supabase-lock.sh` và bản đo cloud trước khi áp (`do-truoc-cloud.md`).

Source input: prompt — phiên «Setup project Invest và Điều phối» (`local_23b003f1…`), từ phát hiện
§2 của ghi chú `cloud-sync-atomic.md`.

## Criteria

- AC-1: Given một Supabase giả lập (image `supabase/postgres` 17.6, role và default privileges như
  cloud, PostgREST thật) dựng từ `db/migrations/` và đã tái hiện lỗ (anon GET `/sessions` = 200),
  When áp 037, Then không bảng, view, sequence hay hàm nào của postgres trong `public` còn quyền
  cho anon hoặc authenticated. SELECT/INSERT bằng anon vào `sessions`, `users`, `sale_offers`,
  `sellers`, `saved_markets`, `v_ruler_p2_area` lỗi `permission denied`, và PostgREST trả 401 cho
  anon trên `/sessions`, `/users`, `/sale_offers`.
- AC-2: Given Supabase giả lập sau 037, When đọc catalog, Then mọi bảng của postgres trong `public`
  bật RLS. Không bảng nào FORCE RLS, không có policy nào, và hai view chạy `security_invoker`.
- AC-3: Given Supabase giả lập sau 037, When chạy đúng các thao tác của đường sống, Then mọi thao tác
  thành công. service_role đọc `sessions`/`areas` và INSERT `ops_audit` qua SQL; qua PostgREST,
  service_role GET `/sessions` trả 200 và POST `/ops_audit` trả 201. postgres đọc users, sessions
  và view, chạy truy vấn leak gate, INSERT `ops_audit`, TRUNCATE … CASCADE.
- AC-4: Given Supabase giả lập sau 037, When postgres tạo một bảng (kèm sequence) và một hàm mới,
  Then anon và authenticated không có quyền nào trên chúng. service_role vẫn SELECT và INSERT được
  bảng mới.
- AC-5: Given Supabase giả lập, When áp 037 hai lần liên tiếp, Then cả hai lần exit 0 và bảng quyền
  sau lần 2 giống hệt sau lần 1.
- AC-6: Given một DB cùng image với DB local (kartoza/postgis 17, không có role anon) dựng từ
  `db/migrations/`, When áp 037 hai lần, Then cả hai lần exit 0 và
  báo bỏ qua. ACL, cờ RLS và option của mọi quan hệ public, quyền hàm và default privileges đều
  không đổi.
- AC-7: Given tệp 037, When đọc nội dung, Then tệp không ghi hay xoá dữ liệu (INSERT, UPDATE,
  DELETE, TRUNCATE, DROP, COPY), không GRANT, không đụng service_role, không FORCE RLS, không
  thêm policy, và có chốt no-op khi không có role anon.
- AC-8: Given Supabase giả lập sau 037, When chạy `docs/ops/supabase-lock-anon-rls.rollback.sql`,
  Then bảng quyền và default privileges trở về đúng như trước 037 (anon GET `/sessions` lại 200).
  Áp lại 037 sau đó cho ra đúng bảng quyền sau 037.
- AC-9: Given runbook `docs/ops/supabase-lock-anon-rls.md` và bản đo trước, When Mạnh đọc, Then
  thấy đủ các phần sau và không bước nào giao agent tự áp lên prod. (judgment)
  - Lý do có số đo.
  - Bảng đường kết nối nào bị ảnh hưởng.
  - Lệnh áp, thời điểm áp, cách kiểm sau áp và lệnh hoàn tác.
  - Khuyến nghị về `sessions`, anon key và service key, có căn cứ. Căn cứ chỉ ghi tên biến và
    nơi xuất hiện, không có giá trị khoá.

## Coverage

Bỏ quét morphological đầy đủ vì thay đổi hẹp: một migration chỉ chạm quyền. Các trục đã liệt kê:

- Trục role: anon và authenticated bị chặn (AC-1). service_role và postgres còn sống (AC-3).
  Role của supabase_admin (PostGIS) nằm ngoài tầm (Known limits).
- Trục đối tượng: bảng, view, sequence, hàm hiện có (AC-1, AC-2). Đối tượng tạo sau (AC-4).
- Trục lớp truy cập: SQL `SET ROLE` (AC-1, AC-3). PostgREST HTTP thật (AC-1, AC-3, AC-8).
- Trục nơi chạy: Supabase giả lập (AC-1 đến AC-5, AC-8). DB kiểu local trong container tạm (AC-6). Cloud thật chỉ đo trước
  (`do-truoc-cloud.md`). Đo sau khi áp do Mạnh chạy theo runbook (AC-9).
- Trục thời gian: áp lần 2 (AC-5), hoàn tác rồi áp lại (AC-8).

## Out of scope

- KHÔNG tự áp 037 hay hoàn tác lên Supabase production (luật 2). Mạnh ký rồi tự chạy theo runbook.
- KHÔNG xoá `sessions` hay đổi dữ liệu cloud. Runbook chỉ khuyến nghị, Mạnh quyết.
- KHÔNG xoay anon key, service key hay JWT secret, KHÔNG đổi env Vercel.
- KHÔNG sửa đối tượng của supabase_admin. Gồm: dời PostGIS khỏi `public`, `spatial_ref_sys`,
  `geometry_columns`, `geography_columns`, `st_estimatedextent` SECURITY DEFINER, và default
  privileges của supabase_admin.
- KHÔNG sửa `pipeline/sync-cloud.mjs`. Phiên «Sync cloud không cửa sổ trống» giữ tệp đó.
- KHÔNG thêm event trigger tự bật RLS cho bảng tạo sau. Default privileges đã chặn quyền của role API.
- KHÔNG bật RLS ở DB local. Local không có PostgREST, và 037 là no-op ở đó.

## Notes

- Code (037, script, runbook, rollback) viết TRƯỚC contract trong cùng phiên, theo tiền lệ
  `ruler-p2-views-migration`. Contract mô tả đúng cái đã làm, Cổng 1 duyệt trên vật có sẵn.
- Số 037 do sổ migration cấp chính thức 2026-10-23 (phiên điều phối liên làn). 037 độc lập với 036,
  merge trước hay sau đều được.
- Giáp ranh sync-cloud: bản sync mới nạp và tráo bảng qua Management API bằng postgres (chủ bảng).
  037 không FORCE RLS nên đường đó vẫn đi. push-ops-facts ghi qua `/api/v1/ops/ingest` của app,
  app ghi bằng postgres.
- Sự cố 2026-10-23 ~03:00 UTC: bài kiểm sync-cloud đã tạo role anon/authenticated (cấp cluster)
  trong DB chung :5433. Sau đó bản đầu của bài kiểm `local` (chạy thẳng vào DB chung) áp 037 khi
  hai role đã có, nên 037 không còn no-op: RLS bật trên 43 bảng, 2 view thành security_invoker,
  PUBLIC mất EXECUTE trên 2 hàm của 033. Đã hoàn tác bằng tay đúng các thay đổi đó trong một giao
  dịch, đo trước và sau: rls_on 43→0, option view hết, EXECUTE PUBLIC trở lại, defacl toàn cục
  trở về mặc định. Bài kiểm AC-6 nay chạy trên container tạm, không chạm DB chung.
- Lớp HTTP được đo bằng PostgREST thật (`supabase/postgrest` v14.16) trước role authenticator,
  với JWT anon/service_role ký bằng secret tạm của container. Đây là cùng đường mà anon key
  ngoài đời đi qua.
