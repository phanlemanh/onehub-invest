---
schema_version: 2
feature_slug: so-ghep-s06-nhan-danh-ba
verdict: REJECT
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: cb7d44dc8f35cda4d42d6b05ff5ef095934802c1
human_signoff:
---

# Evidence Report: so-ghep-s06-nhan-danh-ba

Round 1. Mọi eval của hợp đồng đều xanh, nhưng lệnh suite hồi quy `cd app && npm test` không gắn eval nào và kết thúc với mã khác 0, nên verdict tổng là REJECT (xem mục Lệnh suite và Iterations). `failed_evals` để rỗng vì lệnh hỏng không thuộc eval nào.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E7b | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E8u | AC-8 | ui-check | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | judgment | PASS (đề xuất của hội đồng, chờ người chốt) |

## Evidence

- eval: E1
  run_id: minted-so-ghep-s06-nhan-danh-ba-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T01:11:06Z
  output: |
    node --test pipeline/scripts/so-ghep-s06.test.mjs
    ℹ duration_ms 1497.51225

- eval: E2
  run_id: minted-so-ghep-s06-nhan-danh-ba-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T01:11:06Z
  output: |
    node --test pipeline/scripts/so-ghep-s06.test.mjs
    ℹ duration_ms 1497.51225

- eval: E3
  run_id: minted-so-ghep-s06-nhan-danh-ba-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T01:11:06Z
  output: |
    node --test pipeline/scripts/so-ghep-s06.test.mjs
    ℹ duration_ms 1497.51225

- eval: E4
  run_id: minted-so-ghep-s06-nhan-danh-ba-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T01:11:06Z
  output: |
    node --test pipeline/scripts/so-ghep-s06.test.mjs
    ℹ duration_ms 1497.51225

- eval: E5
  run_id: minted-so-ghep-s06-nhan-danh-ba-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T01:11:06Z
  output: |
    node --test pipeline/scripts/so-ghep-s06.test.mjs
    ℹ duration_ms 1497.51225

- eval: E6
  run_id: minted-so-ghep-s06-nhan-danh-ba-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_sync
  verified_at: 2026-11-03T01:11:06Z
  output: |
    node --test pipeline/sync-cloud.test.mjs && cd pipeline && node --test scripts/so-ghep-s06-cloud.itest.mjs
    ℹ duration_ms 185675.706625

- eval: E7
  run_id: minted-so-ghep-s06-nhan-danh-ba-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_api
  verified_at: 2026-11-03T01:11:06Z
  output: |
    cd app && node --import tsx --test tests/so-ghep-nhan.test.tsx
    ℹ duration_ms 1283.219167

- eval: E7b
  run_id: minted-so-ghep-s06-nhan-danh-ba-E7b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sg_be_mat
  verified_at: 2026-11-03T01:11:06Z
  output: |
    node scripts/check-api-surface.mjs
    api-surface static: ĐẠT

- eval: E8
  run_id: minted-so-ghep-s06-nhan-danh-ba-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_ui
  verified_at: 2026-11-03T01:11:06Z
  output: |
    cd app && node --import tsx --test tests/so-ghep-nhan-giao-dien.test.tsx
    ℹ duration_ms 1758.59175

- eval: E8u
  run_id: minted-so-ghep-s06-nhan-danh-ba-E8u-r1
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

- eval: E9
  run_id: minted-so-ghep-s06-nhan-danh-ba-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sg_do
  verified_at: 2026-11-03T01:11:06Z
  output: |
    bash db/db-thu.sh oneinvest_sg >/dev/null && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_sg node pipeline/do-so-ghep-s06.mjs
    so_ghep_ra_so=0 so_ghep_ra_so_neu_bo_nhanh=12052 so_truc_tiep=590 tin_khong_dau=12052

### Judgment

Hội đồng đề xuất PASS cho E10. Phiếu của từng lens ghi theo dạng «lens: kết quả — lý do»; mục human_override để TRỐNG cho người quyết ở Cổng 2.

- eval: E10
  judged_by: judge panel (fresh context) — domain-correctness, operational-feasibility, spec-alignment
  verdict: PASS
  rationale: |
    - domain-correctness: PASS — Cả bốn ý của AC-10 đều có trong sáu tệp. (1) CONTEXT.md có «Chưa xác minh» theo khuôn: định nghĩa, Code, RESO, _Avoid_. Nó cũng có «Số ghép theo tài khoản». (2) mappings.yaml khai `seller_phone_inferred` với `dd: null` và lý do đặc trưng VN. Mục này ghi tra DD ngày 03/11, migration 070, kiểu boolean nên không cần CHECK, DQ `so-chua-xac-minh` và `checked_on`, khớp sáu điều kiện của ADR-0011 Qđ 3. Ghi chú `seller_phone` giờ nói số lên cloud và chỉ qua route contact, không còn nói số ở lại máy. (3) Thiết kế cũ có dòng «Đính chính 03/11» đặt ngay dưới mục «Hạ nguồn đã soát». Dòng này nêu rõ mục đó và OOS-2 sai ba chỗ. (4) ROADMAP §2 ghi thứ tự gộp → kéo về → áp cột cloud → áp 070 → áp 068, nhấn «070 trước 068», và nêu cột lên cloud qua `CLOUD_ALLOW`. Lens này không mở được `450_dq_checks.sql` vì nằm ngoài danh sách input.
    - operational-feasibility: PASS — CONTEXT.md có mục «Chưa xác minh» theo khuôn các mục lân cận (định nghĩa, dòng Code gồm `seller_phone_inferred`, migration 070, RESO không có, `_Avoid_`). mappings.yaml khai `seller_phone_inferred` đủ sáu điều kiện ADR-0011: tra DD ngày 03/11 cho Member 2.0 và 2.1, lý do đặc trưng VN, migration 070, kiểu boolean nên không cần CHECK, đã khai ở mappings, DQ `so-chua-xac-minh` ở 450. Ghi chú `seller_phone` nay nói lên cloud và chỉ qua route contact, không còn nói số ở lại máy. Thiết kế cũ có «Đính chính 03/11» nêu mục hạ nguồn và OOS-2, còn ROADMAP ghi «070 trước 068» cùng phần cột cloud và tệp catch-up.
    - spec-alignment: PASS — Cả bốn tài liệu đều đáp ứng AC-10. CONTEXT.md có thuật ngữ «Chưa xác minh» đúng khuôn (nhãn, định nghĩa, Code, RESO, _Avoid_). mappings.yaml khai `seller_phone_inferred` với `dd: null`, rationale, ngày tra 03/11, nêu migration 070, ghi kiểu boolean không cần CHECK và DQ `so-chua-xac-minh`; đủ sáu điều kiện ADR-0011 Qđ 3. Ghi chú `seller_phone` đã nói «lên cloud, qua route contact», không còn «ở lại máy». Thiết kế cũ có đoạn «Đính chính 03/11» nêu cả mục hạ nguồn và OOS-2, và ROADMAP nêu «070 trước 068» cùng khâu áp cột cloud.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

Lệnh fail không gắn eval: `cd app && npm test` (không thuộc eval nào, kết thúc với mã khác 0). Đây là nguyên nhân của verdict REJECT. Năm lệnh suite còn lại xanh.

- cmd: cd agent && npm test
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-03T01:11:06Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-03T01:11:06Z

- cmd: cd app && npm test
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-03T01:11:06Z
  output: |
    Ca hỏng: app/tests/ops-nhan-theo-context.test.tsx dòng 351 (deepStrictEqual).
    actual: danh sách dài các khoá dạng 'truthful-coverage · vn-tinh-quang-ngai', 'truthful-coverage · vn-tinh-tuyen-quang', 'truthful-coverage · vn-thanh-pho-dong-nai', 'truthful-coverage · vn-tinh-phu-tho', 'truthful-coverage · vn-thanh-pho-bac-ninh', ... 'truthful-coverage · vn-thanh-pho-da-nang'
    expected: []
    code: ERR_ASSERTION, operator: deepStrictEqual

- cmd: cd pipeline && npm test
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-03T01:11:06Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-03T01:11:06Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-03T01:11:06Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»

Danh sách eval không-phân-biệt: rỗng, nhưng baseline không đo được ở round này (mọi field baseline là n-a) nên chỗ rỗng này KHÔNG có nghĩa mọi eval đều đỏ trên code cũ; chưa chứng minh được eval nào có phân biệt.

Baseline khong do:

- node --test pipeline/scripts/so-ghep-s06.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»
- node --test pipeline/sync-cloud.test.mjs && cd pipeline && node --test scripts/so-ghep-s06-cloud.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»
- cd app && node --import tsx --test tests/so-ghep-nhan.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»
- node scripts/check-api-surface.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»
- cd app && node --import tsx --test tests/so-ghep-nhan-giao-dien.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»
- bash db/db-thu.sh oneinvest_sg >/dev/null && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_sg node pipeline/do-so-ghep-s06.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»

## Variance

none — mọi eval chạy một lần (runs 1, xác định), không có eval ngẫu nhiên và không có eval nào chập chờn.

## Iterations

Round 1: mọi eval của hợp đồng (E1 đến E9, E8u, E10) đều xanh, nhưng lệnh suite `cd app && npm test` không gắn eval nào kết thúc với mã khác 0 — ca trong app/tests/ops-nhan-theo-context.test.tsx dòng 351 mong danh sách rỗng mà nhận về nhiều khoá «truthful-coverage · vn-…». Trả về thi công để xác định ca này do feature gây ra hay đã đỏ sẵn trên main; baseline chưa đo được nên chưa thể kết luận.
