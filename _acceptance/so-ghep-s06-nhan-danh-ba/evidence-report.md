---
schema_version: 2
feature_slug: so-ghep-s06-nhan-danh-ba
verdict: REJECT
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0c0bda2971ad75606efe6a357213842842488302
human_signoff:
---

# Evidence Report: so-ghep-s06-nhan-danh-ba

Round 3. Mọi eval của hợp đồng đều xanh: E1 đến E5 chạy lại ở vòng này; E6, E7, E7b, E8, E8u mang sang từ vòng 1; E9 mang sang từ vòng 2; E10 là đề xuất của hội đồng mang sang từ vòng 2, chờ người chốt. Verdict tổng là REJECT vì lệnh suite hồi quy `cd pipeline && npm test` không gắn eval nào và kết thúc với mã khác 0 ở vòng này: 454 đạt, 1 hỏng. Ca hỏng là GS-AC-3a «chuyển ẩn số» trong `pipeline/scripts/gan-sdt-s06.test.mjs` (dòng 328), lỗi «could not obtain lock on relation public.field_assertions» (mã 55P03), ném từ `khoaNguon` trong `pipeline/lib/luoc-do-rieng.mjs`. `failed_evals` để rỗng vì lệnh hỏng không thuộc eval nào. Ca AC-2 của `write-offers.test.mjs` (hỏng ở vòng 2) nay không còn trong danh sách hỏng. Bốn lệnh suite còn lại (`agent`, `app` lint, `app` test, `test:lint-rules`) và `check-portal-compliance` đều đạt.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS (mang sang từ round 1) |
| E7 | AC-7 | test | PASS (mang sang từ round 1) |
| E7b | AC-7 | script | PASS (mang sang từ round 1) |
| E8 | AC-8 | test | PASS (mang sang từ round 1) |
| E8u | AC-8 | ui-check | PASS (mang sang từ round 1) |
| E9 | AC-9 | script | PASS (mang sang từ round 2) |
| E10 | AC-10 | judgment | PASS (đề xuất của hội đồng, mang sang từ round 2, chờ người chốt) |

## Evidence

Mốc `verified_at` của các eval chạy ở vòng 3 ghi theo ngày; giờ chính xác nằm ở `run-log.jsonl`.

- eval: E1
  run_id: minted-so-ghep-s06-nhan-danh-ba-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T04:06:44Z
  output: |
    node --test pipeline/scripts/so-ghep-s06.test.mjs
    ℹ duration_ms 1982.735375

- eval: E2
  run_id: minted-so-ghep-s06-nhan-danh-ba-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T04:06:44Z
  output: |
    node --test pipeline/scripts/so-ghep-s06.test.mjs
    ℹ duration_ms 1982.735375

- eval: E3
  run_id: minted-so-ghep-s06-nhan-danh-ba-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T04:06:44Z
  output: |
    node --test pipeline/scripts/so-ghep-s06.test.mjs
    ℹ duration_ms 1982.735375

- eval: E4
  run_id: minted-so-ghep-s06-nhan-danh-ba-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T04:06:44Z
  output: |
    node --test pipeline/scripts/so-ghep-s06.test.mjs
    ℹ duration_ms 1982.735375

- eval: E5
  run_id: minted-so-ghep-s06-nhan-danh-ba-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T04:06:44Z
  output: |
    node --test pipeline/scripts/so-ghep-s06.test.mjs
    ℹ duration_ms 1982.735375

- eval: E6
  run_id: minted-so-ghep-s06-nhan-danh-ba-E6-r1
  carried_from_round: 1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_sync
  verified_at: 2026-11-03T01:11:06Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-so-ghep-s06-nhan-danh-ba-E7-r1
  carried_from_round: 1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_api
  verified_at: 2026-11-03T01:11:06Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7b
  run_id: minted-so-ghep-s06-nhan-danh-ba-E7b-r1
  carried_from_round: 1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sg_be_mat
  verified_at: 2026-11-03T01:11:06Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-so-ghep-s06-nhan-danh-ba-E8-r1
  carried_from_round: 1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_ui
  verified_at: 2026-11-03T01:11:06Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8u
  run_id: minted-so-ghep-s06-nhan-danh-ba-E8u-r1
  carried_from_round: 1
  exit_code: 0
  baseline: n-a
  verifier: config:capture.ui
  verified_at: 2026-11-03T01:11:06Z
  screenshot: evidence/E8u-truoc.png
  observed: |
    E8u-truoc.png (1870 rong): trang 'Tin ban tai Thanh pho Ha Noi', the 'Hai Yen' (7,5 ty, O Cho Dua) co Badge vang 'Chua xac minh' canh nut 'Xem so' khi chua bam; the 'ha duy anh' va 'Ngo Phuong' cung co Badge; cac the 'Chua co so' khong co Badge. Khop Expected.
    E8u-sau.png: cung trang, the Hai Yen sau khi bam: Badge 'Chua xac minh' VAN CON, nut chuyen thanh link tel: voi phan so la khoi xam tron (da che), khong doc duoc chu so. Khop Expected, khong lo so.
    E8u-truc-tiep.png: cuon toi the 'Tu Nguyen' (Hoang Mai, 4,4 ty, Dang boi Tu Nguyen) chi co nut 'Xem so', KHONG co Badge; the 'Tu Nguyen' (Vinh Tuy) ben canh co Badge de doi chieu. Khop Expected.
    E8u-320.png (320 rong): the 'Hai Yen' co Badge 'Chua xac minh' va link tel: da che xuong dong trong khung the, the lien ke 'ha duy anh' Badge + Xem so nam gon, khong cat/tran ngang; do bang JS scrollWidth=clientWidth=320. Khop Expected.
    E8u-thue.png: trang /vn/hanoi/listings/rent, the '16 tr/thang Nha rieng 30 m2 3 PN Tuong Mai Dang boi Quang Khai' co Badge 'Chua xac minh' + Xem so (the 10 tr/thang Quang Khai va 5 tr/thang datle cung co); cac the 'Chua co so' khong Badge. Khop Expected.
  network_observed: n-a (driver)
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-so-ghep-s06-nhan-danh-ba-E9-r2
  carried_from_round: 2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sg_do
  verified_at: 2026-11-03T03:29:16Z
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

### Judgment

- eval: E10
  judged_by: hội đồng ba góc nhìn (fresh context), đề xuất PASS
  verdict: PASS
  rationale: Panel giữ nguyên từ round 2 — inputs không đổi, không chấm lại; rationale xem round 2.
  votes:
    - domain-correctness: PASS (r2)
    - operational-feasibility: PASS (r2)
    - spec-alignment: PASS (r2)
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-03T04:06:44Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-03T04:06:44Z

- cmd: cd app && npm test
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-03T04:06:44Z

- cmd: cd pipeline && npm test
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-npm_test__13563d-r3
  exit_code: 1
  verified_at: 2026-11-03T04:06:44Z
  output: |
    tests 455, pass 454, fail 1, cancelled 0, skipped 0
    test at scripts/gan-sdt-s06.test.mjs:328:3
    ✖ GS-AC-3a chuyển ẩn số (102884.719833ms)
    error: could not obtain lock on relation "public.field_assertions" (code 55P03, routine RangeVarGetRelidExtended)
    tại khoaNguon (pipeline/lib/luoc-do-rieng.mjs:16) <- luocDoRieng (pipeline/lib/luoc-do-rieng.mjs:74) <- withTx (scripts/gan-sdt-s06.test.mjs:41)

- cmd: cd app && npm run test:lint-rules
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-03T04:06:44Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-03T04:06:44Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»

Eval không-phân-biệt: none — danh sách rỗng, nhưng baseline không đo được ở vòng này nên không khẳng định được mọi eval feature đều đỏ trên baseline (mọi field baseline là n-a).

Baseline khong do
- node --test pipeline/scripts/so-ghep-s06.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»

Lệnh fail không gắn eval: `cd pipeline && npm test` (kết thúc với mã khác 0, không thuộc eval nào). Ca hỏng duy nhất là GS-AC-3a trong `pipeline/scripts/gan-sdt-s06.test.mjs`, lỗi không lấy được khoá trên bảng `public.field_assertions` sau hơn 100 giây chờ. Vòng 2 cùng lệnh này hỏng ở ca khác (AC-2 của `write-offers.test.mjs`, deadlock), vòng 1 đạt. Hai lần hỏng liên tiếp đều là lỗi khoá trên DB dùng chung ở các ca khác nhau, nên có dấu hiệu tranh chấp khoá giữa các tệp test (hoặc với tiến trình khác trên :5433) hơn là lỗi logic của feature; điều này chưa được chứng minh, cần tìm nguyên nhân trước khi quyết.

## Variance

Không có eval nhiều lần chạy (mọi eval runs là 1), không có pass_rate hỗn hợp. Nghi vấn flaky ở lệnh suite (không phải eval): `cd pipeline && npm test` đạt ở vòng 1, hỏng ở vòng 2 và vòng 3 với ca hỏng khác nhau (khoá/deadlock); chưa root-cause.

## Iterations

Round 1: mọi eval của hợp đồng xanh, nhưng lệnh suite `cd app && npm test` không gắn eval nào kết thúc với mã khác 0 (ca trong app/tests/ops-nhan-theo-context.test.tsx mong danh sách rỗng nhưng nhận về nhiều khoá). Trả về thi công.
Round 2: E1 đến E5 và E9 chạy lại, xanh; E6, E7, E7b, E8, E8u mang sang từ round 1; `cd app && npm test` nay đạt; `cd pipeline && npm test` hỏng do deadlock ở ca AC-2 của write-offers.test.mjs, không gắn eval nào. REJECT, trả về thi công để xác định nguyên nhân.
Round 3: E1 đến E5 chạy lại, xanh; E6, E7, E7b, E8, E8u mang sang từ round 1, E9 và E10 mang sang từ round 2; `cd pipeline && npm test` hỏng ở ca GS-AC-3a của gan-sdt-s06.test.mjs (không lấy được khoá trên public.field_assertions), không gắn eval nào; mọi lệnh suite khác đạt. REJECT sau ba vòng, chuyển người quyết.
