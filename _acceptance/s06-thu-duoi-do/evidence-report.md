---
schema_version: 2
feature_slug: s06-thu-duoi-do
verdict: REJECT
failed_evals: ["E6","E10a"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: cff224123578ad004b5a6bc01ce923c4ac04637f
human_signoff:
---

# Evidence Report: s06-thu-duoi-do

Round 1. Hai eval đỏ: E6 (probe phủ ca dừng giữa chừng vì lỗi quyền ghi thư mục tạm) và E10a (nửa B bộ test pipeline đỏ ở các ca «DB thật»). Mọi lệnh đỏ đều đã gắn eval; không có lệnh đỏ nào ngoài eval.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E1b | AC-1 | script | PASS |
| E2b | AC-2 | script | PASS |
| E3b | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | FAIL |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10a | AC-4 | test | FAIL |
| E10b | AC-7 | test | PASS |
| E10c | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s06-thu-duoi-do-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_test
  verified_at: 2026-11-26T16:54:41Z
  output: |
    cd pipeline && node --test scripts/collect-s06-duoi.test.mjs
    ℹ duration_ms 97.962167

- eval: E2
  run_id: minted-s06-thu-duoi-do-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_test
  verified_at: 2026-11-26T16:54:41Z
  output: |
    cd pipeline && node --test scripts/collect-s06-duoi.test.mjs
    ℹ duration_ms 97.962167

- eval: E3
  run_id: minted-s06-thu-duoi-do-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_test
  verified_at: 2026-11-26T16:54:41Z
  output: |
    cd pipeline && node --test scripts/collect-s06-duoi.test.mjs
    ℹ duration_ms 97.962167

- eval: E1b
  run_id: minted-s06-thu-duoi-do-E1b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_dot_bien
  verified_at: 2026-11-26T16:54:41Z
  output: |
    DOT-BIEN OK

- eval: E2b
  run_id: minted-s06-thu-duoi-do-E2b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_dot_bien
  verified_at: 2026-11-26T16:54:41Z
  output: |
    DOT-BIEN OK

- eval: E3b
  run_id: minted-s06-thu-duoi-do-E3b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_dot_bien
  verified_at: 2026-11-26T16:54:41Z
  output: |
    DOT-BIEN OK

- eval: E4
  run_id: minted-s06-thu-duoi-do-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_db
  verified_at: 2026-11-26T16:54:41Z
  output: |
    bash db/db-thu.sh oneinvest_suite_s06td --chay node --test pipeline/scripts/collect-s06-duoi.test.mjs
    ℹ duration_ms 1640.3715

- eval: E5
  run_id: minted-s06-thu-duoi-do-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_mang
  verified_at: 2026-11-26T16:54:41Z
  output: |
    KHONG-MANG OK

- eval: E6
  run_id: minted-s06-thu-duoi-do-E6-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.s06td_phu_ca
  verified_at: 2026-11-26T16:54:41Z
  output: |
    ghim phep do: băm nhật ký, báo cáo, 231 manifest khớp
    tu kiem ghim: thêm một dòng vào bản chép nhật ký → BAM LECH
    phep do: 288 lượt · 522 lời gọi · nguồn S06
    snapshot: nhật ký trỏ 231 · đọc lại được 231 (sha256 khớp manifest) · tổng 1215 tin = tổng mục mới 1215
    Error: EACCES: permission denied, open '.../s06-duoi-phu-ca-NKUC26/hcmc__S06__2026-11-24T012115/items-0001.json.gz'
        at writeFileSync (phu-ca.mjs:113)
    Probe dừng ở bước tự kiểm lật một byte trong bản chép; không in 'PHU-CA OK'.

- eval: E7
  run_id: minted-s06-thu-duoi-do-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.s06td_chia
  verified_at: 2026-11-26T16:54:41Z
  output: |
    cd pipeline && node --test scripts/chia-nua.test.mjs
    ℹ duration_ms 39.457875

- eval: E8
  run_id: minted-s06-thu-duoi-do-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_pham_vi
  verified_at: 2026-11-26T16:54:41Z
  output: |
    PHAM-VI OK

- eval: E9
  run_id: minted-s06-thu-duoi-do-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_so_do
  verified_at: 2026-11-26T16:54:41Z
  output: |
    SO-DO OK

- eval: E10a
  run_id: r1-l9-1-20261126165441
  exit_code: 1
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T16:54:41Z
  output: |
    ✖ DB thật: tra stg theo list_id — TypeError: Cannot read properties of undefined (reading 'list_id') (collect-s06-duoi.test.mjs:800)
    ✖ DB thật: lượt quét đủ cùng ngày — TypeError: reading 'city_code' (collect-s06-duoi.test.mjs:812)
    ✖ DB thật: kiểm lượt quét đủ đã nạp xong — TypeError: reading 'city_code' (collect-s06-duoi.test.mjs:822)
    ✖ DB thật: tập lượt quét đủ lấy giờ đăng — AssertionError: thiếu dữ liệu để kiểm: tin mới chưa bị đẩy lại (collect-s06-duoi.test.mjs:846)
    Bốn trong năm ca «DB thật» đỏ trên DB suite pipeline_b (bảng không có dòng mẫu); lệnh dừng với mã lỗi 1.

- eval: E10b
  run_id: minted-s06-thu-duoi-do-E10b-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T16:54:41Z
  output: |
    ℹ duration_ms 192779.512792

- eval: E10c
  run_id: r1-l11-1-20261126165441
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T16:54:41Z
  output: |
    ℹ duration_ms 2101004.6655

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s06-thu-duoi-do-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T16:54:41Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s06-thu-duoi-do-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T16:54:41Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s06-thu-duoi-do-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-26T16:54:41Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s06-thu-duoi-do-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T16:54:41Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s06-thu-duoi-do-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T16:54:41Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: E10a — bốn ca «DB thật» của pipeline/scripts/collect-s06-duoi.test.mjs (tra stg theo list_id; lượt quét đủ cùng ngày; kiểm lượt quét đủ đã nạp xong; tập lượt quét đủ lấy giờ đăng) trên cụm dùng một lần của pipeline_b (DB trống từ migration)

Ghi chú phiên chấm M5:
- E10a đỏ không vì M5: bốn ca cần dòng dữ liệu thật nhưng nằm ở nửa b (cụm DB trống, CI=true); cần xếp vào pipeline_that (ci-bo-qua.json) hoặc tự cấy dữ liệu.
- E6 đỏ ở bước tự kiểm của probes/phu-ca.mjs:113 (EACCES): bản chép tạm giữ quyền r--r--r-- của snapshot phép đo, lật một byte bị từ chối; mọi dòng kiểm trước đó xanh (ghim băm 231 manifest, 288 lượt · 522 lời gọi, 231/231 đọc lại, 1215 = 1215). Lỗi của probe (cùng dạng với ZC18 chon-nap.mjs lượt 1), không của mã thu.
- E10c (pipeline_that): tests 37, pass 37, fail 0; dòng «chay-that: vai may-phat-trien — bỏ qua 1 ca chỉ máy thu»; tập bỏ qua bằng đúng tập may_thu → ĐẠT theo luật GS 26/11. Chấm trên M5: ON22-AC-10 không chạy (HT33). Đầu ra: evidence/m5-pipeline-that.txt.
- Che tên nguồn: một mã snapshot trong đầu ra E6 có tên nguồn thật, đã thay bằng «S06» trước khi commit.

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline): E7 (`cd pipeline && node --test scripts/chia-nua.test.mjs`). Cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý.

Baseline khong do
- cd pipeline && node --test scripts/collect-s06-duoi.test.mjs: bo qua baseline: tep pipeline/scripts/collect-s06-duoi.test.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/s06-thu-duoi-do/probes/dot-bien.mjs: bo qua baseline: tep _acceptance/s06-thu-duoi-do/probes/dot-bien.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_s06td --chay node --test pipeline/scripts/collect-s06-duoi.test.mjs: bo qua baseline: tep pipeline/scripts/collect-s06-duoi.test.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/s06-thu-duoi-do/probes/khong-mang.mjs: bo qua baseline: tep _acceptance/s06-thu-duoi-do/probes/khong-mang.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/s06-thu-duoi-do/probes/phu-ca.mjs --do "${S06_DUOI_DO:-$HOME/dev/onehub-wt/zt-thu-duoi-s06-do/state/phep-do-s06-24h}": bo qua baseline: tep _acceptance/s06-thu-duoi-do/probes/phu-ca.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s06-thu-duoi-do/probes/pham-vi.sh: bo qua baseline: tep _acceptance/s06-thu-duoi-do/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/s06-thu-duoi-do/probes/phu-ca.mjs --e9 --do "${S06_DUOI_DO:-$HOME/dev/onehub-wt/zt-thu-duoi-s06-do/state/phep-do-s06-24h}": bo qua baseline: tep _acceptance/s06-thu-duoi-do/probes/phu-ca.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định).

## Iterations

Round 1: E6, E10a failed — E6 dừng vì lỗi quyền ghi tệp bản chép trong thư mục tạm khi tự kiểm lật byte (phu-ca.mjs dòng 113); E10a đỏ bốn ca «DB thật» của collect-s06-duoi.test.mjs trên DB suite pipeline_b vì thiếu dòng dữ liệu mẫu. Returned to implementation.
