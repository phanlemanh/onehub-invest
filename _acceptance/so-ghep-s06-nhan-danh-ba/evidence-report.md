---
schema_version: 2
feature_slug: so-ghep-s06-nhan-danh-ba
verdict: REJECT
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 63c0304c7292491ea949e4974c721b779862da07
human_signoff:
---

# Evidence Report: so-ghep-s06-nhan-danh-ba

Round 2. Mọi eval của hợp đồng đều xanh (sáu eval chạy lại ở vòng này: E1 đến E5 và E9; năm eval mang sang từ vòng 1: E6, E7, E7b, E8, E8u; E10 là đề xuất của hội đồng, chờ người chốt). Verdict tổng là REJECT vì lệnh suite hồi quy `cd pipeline && npm test` không gắn eval nào và kết thúc với mã khác 0 ở vòng này: ca AC-2 trong `pipeline/scripts/write-offers.test.mjs` gặp «deadlock detected». `failed_evals` để rỗng vì lệnh hỏng không thuộc eval nào. Lệnh `cd app && npm test` (hỏng ở vòng 1) nay đạt.

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
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | judgment | PASS (đề xuất của hội đồng, chờ người chốt) |

## Evidence

Mốc `verified_at` của các eval chạy ở vòng 2 ghi theo ngày; giờ chính xác nằm ở `run-log.jsonl`.

- eval: E1
  run_id: minted-so-ghep-s06-nhan-danh-ba-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T03:29:16Z
  output: |
    node --test pipeline/scripts/so-ghep-s06.test.mjs
    ℹ duration_ms 4715.458125

- eval: E2
  run_id: minted-so-ghep-s06-nhan-danh-ba-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T03:29:16Z
  output: |
    node --test pipeline/scripts/so-ghep-s06.test.mjs
    ℹ duration_ms 4715.458125

- eval: E3
  run_id: minted-so-ghep-s06-nhan-danh-ba-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T03:29:16Z
  output: |
    node --test pipeline/scripts/so-ghep-s06.test.mjs
    ℹ duration_ms 4715.458125

- eval: E4
  run_id: minted-so-ghep-s06-nhan-danh-ba-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T03:29:16Z
  output: |
    node --test pipeline/scripts/so-ghep-s06.test.mjs
    ℹ duration_ms 4715.458125

- eval: E5
  run_id: minted-so-ghep-s06-nhan-danh-ba-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T03:29:16Z
  output: |
    node --test pipeline/scripts/so-ghep-s06.test.mjs
    ℹ duration_ms 4715.458125

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
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sg_do
  verified_at: 2026-11-03T03:29:16Z
  output: |
    bash db/db-thu.sh oneinvest_sg >/dev/null && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_sg node pipeline/do-so-ghep-s06.mjs
    so_ghep_ra_so=0 so_ghep_ra_so_neu_bo_nhanh=12052 so_truc_tiep=590 tin_khong_dau=12052

### Judgment

- eval: E10
  judged_by: hội đồng ba góc nhìn (fresh context), đề xuất PASS
  verdict: PASS
  rationale: Cả ba góc nhìn đều thấy đủ bốn vế trong các tệp đầu vào. CONTEXT.md có thuật ngữ «Chưa xác minh» đúng khuôn (nhãn, định nghĩa, dòng Code kèm RESO, `_Avoid_`). `mappings.yaml` khai `seller_phone_inferred` đủ sáu điều kiện ADR-0011 (tra DD ngày 03/11 với `dd: null`, lý do đặc trưng VN, migration 070, kiểu boolean nên không cần CHECK, khai ở tệp này, kiểm DQ `so-chua-xac-minh` ở 450) và ghi chú `seller_phone` nay nói số lên cloud, chỉ qua route contact. Thiết kế cũ có đoạn «Đính chính 03/11» nêu cả mục hạ nguồn lẫn OOS-2. ROADMAP ghi thứ tự gộp, kéo về, áp cột cloud, áp 070, áp 068, nói rõ «070 trước 068».
  votes:
    - domain-correctness: PASS — CONTEXT.md có thuật ngữ «Chưa xác minh» đúng khuôn; mappings.yaml khai `seller_phone_inferred` đủ sáu điều kiện ADR-0011; thiết kế cũ có đoạn «Đính chính 03/11» sửa mục hạ nguồn và OOS-2; ROADMAP nêu «070 trước 068» cùng phần cột cloud (CLOUD_ALLOW, áp cột cloud, tệp cloud-schema-catchup).
    - operational-feasibility: PASS — cả bốn vế đều có trong các tệp đầu vào; mappings.yaml đủ sáu điều kiện ADR-0011 kèm DQ `so-chua-xac-minh` ở 450; ghi chú `seller_phone` đã sửa thành tầng C, lên cloud, chỉ qua route contact; ROADMAP ghi 070 trước 068 và phần cột cloud.
    - spec-alignment: PASS — cả bốn ý đều có trong các tệp: mục «Chưa xác minh» đúng khuôn trong CONTEXT.md; `seller_phone_inferred` đủ sáu điều kiện và ghi chú `seller_phone` nói số lên cloud; dòng «Đính chính 03/11» ngay sau mục hạ nguồn, nêu cả OOS-2; ROADMAP ghi thứ tự gộp, kéo về, áp cột cloud, áp 070, áp 068.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-03T03:29:16Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-03T03:29:16Z

- cmd: cd app && npm test
  run_id: `
  exit_code: 0
  verified_at: 2026-11-03T03:29:16Z

- cmd: cd pipeline && npm test
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-npm_test__13563d-r2
  exit_code: 1
  verified_at: 2026-11-03T03:29:16Z
  output: |
    test at scripts/write-offers.test.mjs:143:1
    ✖ AC-2 offer kế nhận đề xuất, áp lại, thẻ trỏ sang (28652.088375ms)
    error: deadlock detected (code 40P01, routine DeadLockReport)
    tại napLai061 (pipeline/lib/nap-061.mjs:22) <- napPhatBieu (pipeline/lib/nap-045.mjs:56) <- withTx (scripts/write-offers.test.mjs:37)
    detail: một tiến trình chờ AccessExclusiveLock trên một bảng, bị chặn bởi tiến trình kia, và ngược lại.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-03T03:29:16Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-03T03:29:16Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»

Eval không-phân-biệt: none — danh sách rỗng, nhưng baseline không đo được ở vòng này nên không khẳng định được mọi eval feature đều đỏ trên baseline (mọi field baseline là n-a).

Baseline khong do
- node --test pipeline/scripts/so-ghep-s06.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»
- bash db/db-thu.sh oneinvest_sg >/dev/null && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_sg node pipeline/do-so-ghep-s06.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»

Lệnh fail không gắn eval: `cd pipeline && npm test` (kết thúc với mã khác 0, không thuộc eval nào). Ca hỏng là AC-2 của `pipeline/scripts/write-offers.test.mjs`, lỗi deadlock giữa hai tiến trình DB. Ở vòng 1 cùng lệnh này đạt, nên chưa thể kết luận lỗi do feature hay do tranh chấp trên DB dùng chung; cần chạy lại và tìm nguyên nhân trước khi quyết.

Ghi chú về mã chạy: bản đồ run_id của lệnh `cd app && npm test` trả về giá trị là một dấu backtick đơn; báo cáo chép nguyên văn như bản đồ, người soát cần đối chiếu với `run-log.jsonl`.

## Variance

Không có eval nhiều lần chạy (mọi eval runs là 1), không có pass_rate hỗn hợp. Một nghi vấn flaky ở lệnh suite: `cd pipeline && npm test` đạt ở vòng 1 và hỏng ở vòng 2 với deadlock; mới chạy một lần mỗi vòng, chưa root-cause.

## Iterations

Round 1: mọi eval của hợp đồng xanh, nhưng lệnh suite `cd app && npm test` không gắn eval nào kết thúc với mã khác 0 (ca trong app/tests/ops-nhan-theo-context.test.tsx mong danh sách rỗng nhưng nhận về nhiều khoá). Trả về thi công.
Round 2: E1 đến E5 và E9 chạy lại, xanh; E6, E7, E7b, E8, E8u mang sang từ round 1; `cd app && npm test` nay đạt; `cd pipeline && npm test` hỏng do deadlock ở ca AC-2 của write-offers.test.mjs, không gắn eval nào. REJECT, trả về thi công để xác định nguyên nhân.
