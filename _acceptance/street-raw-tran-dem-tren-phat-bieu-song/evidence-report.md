---
schema_version: 2
feature_slug: street-raw-tran-dem-tren-phat-bieu-song
verdict: BLOCKED
failed_evals: []
reason: "Lệnh `node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'` chạy quá 30 phút chưa xong (bắt đầu 03:00 +07, hết chờ 03:31 +07, chưa có dòng kết thúc). Lệnh bị công cụ chuyển sang nền (ID bk30n5dzm), không bị giết; tệp đầu ra còn rỗng vì npm/suite đệm output. Không thấy khai báo long_running cho pipeline_that trong _acceptance/config.yaml (chỉ có trong keys của suite) nên áp trần mặc định 30 phút. Tiến trình vẫn chạy (6 process suite-neu-doi/test:that), chưa có kết quả đạt hay hỏng. Không tự kill, không chạy lại. Cách xử lý: chạy lại với trần công cụ dài hơn hoặc khai long_running cho pipeline_that, không phải sửa mã."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 78f227e7313cf245f80e916ac04ce957de4b2962
human_signoff: Mạnh 2026-11-27
---

# Evidence Report: street-raw-tran-dem-tren-phat-bieu-song

Round 3. Verdict BLOCKED: một lệnh suite (pipeline_that) chưa xong trong trần chờ, chưa có kết quả. Không có eval nào hỏng.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS (carry-forward từ round 1) |
| E2 | AC-2 | script | PASS (carry-forward từ round 1) |
| E3 | AC-3 | test | PASS (carry-forward từ round 1) |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-4 | test | PASS (carry-forward từ round 1; lệnh suite pipeline_that của round này chưa xong, xem mục suite) |

## Evidence

- eval: E1
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E1-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: scripts
  verified_at: 2026-11-26T15:56:56Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E2-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: scripts
  verified_at: 2026-11-26T15:56:56Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E3-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: scripts
  verified_at: 2026-11-26T15:56:56Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: scripts
  verified_at: 2026-11-26T18:56:34Z
  output: |
    cd pipeline && node --test scripts/street-raw-tran-dem.test.mjs scripts/chia-nua.test.mjs
    ℹ duration_ms 64.878625

- eval: E5
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T18:56:34Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 235343.541

- eval: E6
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T18:56:34Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    ℹ duration_ms 124042.984542

- eval: E7
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E7-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T15:56:56Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-26T18:56:34Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-26T18:56:34Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-26T18:56:34Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: bk30n5dzm
  exit_code: n-a (lệnh chưa xong, bị chặn bởi trần chờ 30 phút, không bị giết)
  verified_at: 2026-11-26T18:56:34Z
  note: bắt đầu 03:00 +07, hết chờ 03:31 +07; tệp đầu ra rỗng, chưa có dòng kết thúc; tiến trình còn chạy; không kill, không chạy lại.

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-26T18:56:34Z
  note: suite-neu-doi bỏ qua ui_lint_rules vì không đổi vùng app/**, db/**, CONTEXT.md, .claude/skills/onehub-ui/** (5 tệp đổi ngoài vùng).

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-26T18:56:34Z
  note: suite-neu-doi bỏ qua portal_static vì không đổi vùng liên quan (5 tệp đổi ngoài vùng).

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 3 (vòng cuối). Mọi eval 7/7 PASS (E4–E6 chạy lại, E1–E3, E7 mang sang); review không xác nhận finding mới — finding đo AC-4 của vòng 2 (nhánh 50 chỉ khẳng định âm tính) đóng. Kit trả BLOCKED chỉ vì suite ghim lại pipeline_that chạm trần 30′ (suite không có long_running). Theo luật GS đã chạy lại riêng suite một lần 20:32–21:09Z trên cùng sha c2bc40177: tests 37, pass 37, fail 0, skipped 0; dòng «chay-that: vai may-phat-trien — bỏ qua 1 ca chỉ máy thu»; tập bỏ qua bằng đúng tập may_thu → ĐẠT theo luật GS 26/11. Chấm trên M5: ON22-AC-10 không chạy (HT33). Đầu ra: evidence/m5-pipeline-that-r3.txt. Kit báo runLogWriteFailed — run-log của vòng được phiên chấm ghi tay từ kết quả.

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Field baseline cua moi eval ghi n-a (round nay khong do). Không có eval nào bị liệt kê là không-phân-biệt: [].

## Variance

none — không eval nào chạy nhiều lần (mọi eval runs = 1, xác định).

## Judgment

Không có judgment item; không có judge panel nào được khai ở round này.

## Iterations

Round 1: E1, E2, E3, E7 chạy và đạt; hồ sơ nền được tạo, baseline đo một lần.
Round 3: E4, E5, E6 đạt; E1, E2, E3, E7 carry-forward từ round 1 vì delta không chạm paths của chúng. Lệnh suite pipeline_that quá trần chờ 30 phút chưa xong nên verdict BLOCKED, chờ chạy lại với trần dài hơn.

### Re-pin lần 1 — 2026-11-27, do ghim lại bằng làn eval
run_id: repin-20261127T014056Z-29206
sha: 78f227e7313cf245f80e916ac04ce957de4b2962 · suites: 8 lệnh exit 0 · evals: 7/7 eval máy đạt kỳ vọng
