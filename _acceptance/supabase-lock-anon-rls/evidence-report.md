---
schema_version: 2
feature_slug: supabase-lock-anon-rls
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: db1fd5a5b171095a5393131f650f2d75b4691dc6
human_signoff:
---

# Evidence Report: supabase-lock-anon-rls

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-8 | script | PASS |
| E10 | AC-9 | judgment | PASS |

## Evidence

- eval: E1
  run_id: supabase-lock-anon-rls-E1-20261023T031532Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.supabase_lock_sim (bash scripts/check-supabase-lock.sh sim)
  verified_at: 2026-10-23T03:15:42Z
  output: |
    PASS giả lập tái hiện lỗ: anon/authenticated có quyền trên bảng của postgres
    PASS trước: PostgREST anon GET /sessions = 200 (lỗ tái hiện)
    PASS sau: rel_api_open=0
    PASS sau: seq_api_open=0
    PASS sau: fn_api_exec=0
    PASS anon: SELECT 1 FROM sessions LIMIT 1 → permission denied
    PASS anon: SELECT 1 FROM users LIMIT 1 → permission denied
    PASS anon: SELECT 1 FROM sale_offers LIMIT 1 → permission denied
    PASS anon: SELECT 1 FROM sellers LIMIT 1 → permission denied
    PASS anon: SELECT 1 FROM saved_markets LIMIT 1 → permission denied
    PASS authenticated: SELECT 1 FROM users LIMIT 1 → permission denied
    PASS anon: INSERT INTO sessions DEFAULT VALUES → permission denied
    PASS anon: SELECT 1 FROM v_ruler_p2_area LIMIT 1 → permission denied
    PASS PostgREST anon GET /sessions = 401
    PASS PostgREST anon GET /users = 401
    PASS PostgREST anon GET /sale_offers = 401
    check-supabase-lock sim: OK

- eval: E2
  run_id: supabase-lock-anon-rls-E2-20261023T031547Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.supabase_lock_sim (bash scripts/check-supabase-lock.sh sim)
  verified_at: 2026-10-23T03:15:57Z
  output: |
    == TRƯỚC 037
      tables_rls_off=39
      views_definer=2
    == SAU 037
      tables_rls_off=0
      views_definer=0
    PASS sau: tables_rls_off=0
    PASS sau: views_definer=0
    check-supabase-lock sim: OK

- eval: E3
  run_id: supabase-lock-anon-rls-E3-20261023T031524Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.supabase_lock_static (bash scripts/check-supabase-lock.sh static)
  verified_at: 2026-10-23T03:15:24Z
  output: |
    PASS 037 không INSERT/UPDATE/DELETE/TRUNCATE/DROP/COPY
    PASS 037 không GRANT quyền nào
    PASS 037 không đụng service_role
    PASS 037 không FORCE RLS
    PASS 037 không thêm policy
    PASS 037 dừng sớm khi không có role anon
    check-supabase-lock static: OK

- eval: E4
  run_id: supabase-lock-anon-rls-E4-20261023T031558Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.supabase_lock_sim (bash scripts/check-supabase-lock.sh sim)
  verified_at: 2026-10-23T03:16:08Z
  output: |
    PASS sau: svc_tables_missing=0
    PASS service_role đọc sessions/areas
    PASS service_role INSERT ops_audit (+ sequence)
    PASS PostgREST service_role GET /sessions = 200
    PASS PostgREST service_role POST /ops_audit = 201 (đường INSERT của sync-cloud)
    PASS postgres TRUNCATE … CASCADE (đường nạp của sync-cloud)
    PASS postgres đọc users/sessions/view + truy vấn leak gate
    PASS postgres INSERT ops_audit (đường ingest của push-ops-facts qua app)
    check-supabase-lock sim: OK

- eval: E5
  run_id: supabase-lock-anon-rls-E5-20261023T031609Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.supabase_lock_sim (bash scripts/check-supabase-lock.sh sim)
  verified_at: 2026-10-23T03:16:19Z
  output: |
    == TRƯỚC 037
      defacl_api=3
      defacl_fn_public=true
    == SAU 037
      defacl_api=0
      defacl_fn_public=false
    PASS sau: defacl_api=0
    PASS sau: defacl_fn_public=false
    PASS bảng/sequence/hàm tạo sau: anon+authenticated không quyền, service_role vẫn có
    check-supabase-lock sim: OK

- eval: E6
  run_id: supabase-lock-anon-rls-E6-20261023T031620Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.supabase_lock_sim (bash scripts/check-supabase-lock.sh sim)
  verified_at: 2026-10-23T03:17:26Z
  output: |
    PASS 037 lần 1 exit 0 trên Supabase giả lập
    PASS 037 lần 2 exit 0 trên Supabase giả lập
    PASS bảng quyền sau lần 1 == sau lần 2 (idempotent)
    check-supabase-lock sim: OK
    (script so md5 của bảng quyền sau lần 1 và lần 2 — scripts/check-supabase-lock.sh dòng 156-158)

- eval: E7
  run_id: supabase-lock-anon-rls-E7-20261023T031525Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.supabase_lock_local (bash scripts/check-supabase-lock.sh local)
  verified_at: 2026-10-23T03:15:32Z
  output: |
    PASS DB kiểu local không có role anon
    PASS 037 lần 1 exit 0 trên DB kiểu local
    PASS 037 lần 1 báo bỏ qua (no-op)
    PASS 037 lần 2 exit 0 trên DB kiểu local
    PASS 037 lần 2 báo bỏ qua (no-op)
    PASS quyền/RLS/option quan hệ không đổi (md5 698924fc9523d0bf4ed882e851674033)
    PASS quyền hàm + default privileges không đổi
    check-supabase-lock local: OK

- eval: E8
  run_id: supabase-lock-anon-rls-E8-20261023T031525Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.supabase_lock_static (bash scripts/check-supabase-lock.sh static)
  verified_at: 2026-10-23T03:15:25Z
  output: |
    PASS 037 không INSERT/UPDATE/DELETE/TRUNCATE/DROP/COPY
    PASS 037 không GRANT quyền nào
    PASS 037 không đụng service_role
    PASS 037 không FORCE RLS
    PASS 037 không thêm policy
    PASS 037 dừng sớm khi không có role anon
    check-supabase-lock static: OK

- eval: E9
  run_id: supabase-lock-anon-rls-E9-20261023T031727Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.supabase_lock_sim (bash scripts/check-supabase-lock.sh sim)
  verified_at: 2026-10-23T03:17:56Z
  output: |
    PASS rollback exit 0
    PASS sau rollback: bảng quyền + default privileges == trước 037
    PASS sau rollback: PostgREST anon /sessions = 200 (lỗ mở lại — đúng nghĩa hoàn tác)
    PASS áp lại 037 sau rollback → bảng quyền == sau 037
    note: 3 quan hệ của supabase_admin (PostGIS) anon vẫn đọc được — ngoài tầm postgres
    check-supabase-lock sim: OK
    (script so md5 bảng quyền + default privileges trước 037 với sau rollback — dòng 150, 196, 198)

- eval: E10
  judged_by: judge-subagent (fresh context)
  verdict: PASS
  rationale: Runbook đủ mọi ý AC-9 hỏi, và con số khớp do-truoc-cloud.md (36 bảng RLS tắt, 38 quan hệ mở, 4 sequence, số dòng anon thấy). Có bảng đường kết nối kèm role, hai cách áp, thời điểm áp kèm lock_timeout 15s, bốn bước kiểm sau áp, và lệnh hoàn tác có cảnh báo mở lại lỗ. Khuyến nghị dựa trên nơi đã kiểm và dấu vết log, chỉ ghi tên biến, không bước nào giao agent áp prod; 037 và tệp hoàn tác khớp lời runbook. Hạng T3 nên phán quyết này chỉ để tham khảo, Mạnh phải tự chấm.
  human_override:

## Known limits

- Các đối tượng PostGIS do supabase_admin làm chủ (spatial_ref_sys, geometry_columns, geography_columns, các hàm st_*, trong đó st_estimatedextent là SECURITY DEFINER) vẫn để anon đọc được. Lượt `sim` in dòng `note: 3 quan hệ của supabase_admin (PostGIS) anon vẫn đọc được — ngoài tầm postgres` (foreign_api_open=3 cả trước lẫn sau 037). Hợp đồng ghi rõ việc này ngoài phạm vi.
- Cloud mới có bản đo trước khi áp (`do-truoc-cloud.md`). Bản đo sau khi áp do Mạnh chạy theo runbook sau khi tự áp 037. Không eval nào trong vòng này đo Supabase production.
- Bản preview Vercel không chạm được DB prod, nên không dùng để kiểm 037 trên cloud.

## Ngoài hợp đồng

- Cả `sim` lẫn `local` đều in `note: lỗi trên DB trống (tồn đọng, ngoài phạm vi): 012_source_registry_roles_dq 031_property_master`. Hai migration này lỗi khi dựng DB trống từ `db/migrations/`. Đây là lỗi có từ trước, script tự ghi là ngoài phạm vi. Script vẫn kiểm đủ các bảng cần cho AC (`users sessions sale_offers sellers properties ops_audit saved_markets v_ruler_p2_area`) và không báo thiếu bảng nào.
- `.acceptance-runs/` chưa nằm trong `.gitignore` của repo (`git status` báo untracked). Nhật ký chạy của vòng này nằm ở đó và không được commit.

## Analyst

Baseline khong do: không chạy baseline A/B cho dossier này. `scripts/check-supabase-lock.sh` và `db/migrations/037_lock_anon_enable_rls.sql` chưa có trên diffBase (origin/main b4466370). Lệnh của mọi eval máy trỏ tới tệp chưa tồn tại ở đó, nên chạy trên code cũ không chứng minh gì. Tính phân biệt nằm ngay trong lượt `sim`: trước 037 lỗ được tái hiện (rel_api_open=41, anon GET /sessions = 200), sau 037 đều về 0 hoặc 401, và sau rollback lỗ mở lại.

## Variance

none — every multi-run eval is uniform. Sáu lượt `sim` trên db1fd5a (E1, E2, E4, E5, E6, E9) ra đầu ra giống hệt nhau từng byte.

## Iterations

Round 1: E1–E9 đều PASS trên db1fd5a. Lượt chạy đầu (03:11–03:14 UTC) bị bỏ vì HEAD đổi giữa chừng: b6c0723 thành db1fd5a, tức merge origin/main thêm migration 036 và 039, từ khoảng 03:11:58 UTC. Kết quả là E3, E8, E7, E1, E2 chạy trên cây cũ còn E4–E9 chạy trên cây mới, với fn_owned 2 so với 5. Lượt đầu cũng PASS hết, nhưng cả 9 eval đã được chạy lại trên một cây cố định là db1fd5a, và HEAD được kiểm trước lẫn sau mỗi lô. run-log.jsonl giữ cả 18 dòng. Báo cáo này chỉ dẫn 9 run_id của lượt chạy lại. E10 (judgment, T3) còn chờ judge và Mạnh.

Sau lượt chấm: judge mù E10 cho PASS và nêu 6 điểm runbook chưa khớp hoặc thiếu rõ ràng. Orchestrator đã sửa cả 6, chỉ trong `docs/ops/**` (nhóm T1): số lần thăm anon (10 HEAD + 1 rpc), đo cloud ngay sau khi áp và trước lượt sync, phạm vi toàn cục của việc thu EXECUTE PUBLIC, nguồn của con số advisor, nơi đặt service key, và `SET lock_timeout = '15s'` thêm vào tệp hoàn tác. Đổi thứ sáu chạm tệp mà E9 dùng. Orchestrator chạy lại `sim` để soát, kết quả OK với cả 4 dòng PASS của phần hoàn tác. Lượt soát này không phải bằng chứng; bằng chứng của E9 vẫn là run_id ở trên.
