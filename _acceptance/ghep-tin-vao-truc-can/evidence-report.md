---
schema_version: 2
feature_slug: ghep-tin-vao-truc-can
verdict: REJECT
failed_evals: ["E11"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7dd6bb0d64148af37748ec97740147014eba3365
human_signoff:
---

# Evidence Report: ghep-tin-vao-truc-can (round 2)

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10a | AC-10 | script | PASS |
| E10 | AC-10 | judgment | UNCERTAIN |
| E11 | AC-6 | script | FAIL |
| E12 | AC-6 | script | PASS |
| E13 | AC-6 | test | PASS |

Lệnh fail không gắn eval: không có. Lệnh duy nhất fail là `node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'`, và nó gắn với E11.

## Evidence

- eval: E1
  run_id: minted-ghep-tin-vao-truc-can-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh
  verified_at: 2026-11-27T00:57:30Z
  output: |
    XANH: ma trận và ba đột biến

- eval: E2
  run_id: minted-ghep-tin-vao-truc-can-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh
  verified_at: 2026-11-27T00:57:30Z
  output: |
    XANH: ma trận và ba đột biến

- eval: E3
  run_id: minted-ghep-tin-vao-truc-can-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh
  verified_at: 2026-11-27T00:57:30Z
  output: |
    XANH: ma trận và ba đột biến

- eval: E4
  run_id: minted-ghep-tin-vao-truc-can-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/migration.sh
  verified_at: 2026-11-27T00:57:30Z
  output: |
    XANH: khuôn phát biểu và một đột biến

- eval: E5
  run_id: minted-ghep-tin-vao-truc-can-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/offer-unit.sh
  verified_at: 2026-11-27T00:57:30Z
  output: |
    XANH: offer_unit và một đột biến

- eval: E6
  run_id: minted-ghep-tin-vao-truc-can-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/chay-lai.sh
  verified_at: 2026-11-27T00:57:30Z
  output: |
    XANH: vòng đời và một đột biến

- eval: E7
  run_id: minted-ghep-tin-vao-truc-can-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/offer-building-nhanh.sh
  verified_at: 2026-11-27T00:57:30Z
  output: |
    XANH: offer_building và hai đột biến

- eval: E8
  run_id: minted-ghep-tin-vao-truc-can-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/cuoi-luot-nap.sh
  verified_at: 2026-11-27T00:57:30Z
  output: |
    XANH: bước cuối lượt nạp và hai đột biến

- eval: E9
  run_id: minted-ghep-tin-vao-truc-can-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/chay-kho.sh
  verified_at: 2026-11-27T00:57:30Z
  output: |
    XANH: OP1 tin mức trục + căn 488 ≥ 350

- eval: E10a
  run_id: minted-ghep-tin-vao-truc-can-E10a-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh
  verified_at: 2026-11-27T00:57:30Z
  output: |
    (probe không in dòng tóm tắt; kết quả chấm nằm ở evidence/cham-truc.md)

- eval: E11
  run_id: minted-ghep-tin-vao-truc-can-E11-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-27T00:57:30Z
  output: |
    ✖ TRG-AC-7 tệp mới khớp mẫu ngoài ma trận → báo tệp (scripts/tin-rao-gan-khu-vuc.test.mjs:277)
    actual:   transform-zalo.loi-pl36-98820.mjs: khớp mẫu gán khu vực nhưng không có trong ma trận
              transform-moi.mjs: khớp mẫu gán khu vực nhưng không có trong ma trận
    expected: transform-moi.mjs: khớp mẫu gán khu vực nhưng không có trong ma trận
    ca liên quan cùng lượt: transform-fb.mjs còn câu chọn khu vực riêng (region_type submarket)

- eval: E12
  run_id: minted-ghep-tin-vao-truc-can-E12-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-27T00:57:30Z
  output: |
    ℹ duration_ms 134831

- eval: E13
  run_id: minted-ghep-tin-vao-truc-can-E13-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-27T00:57:30Z
  output: |
    ℹ duration_ms 2397083

### Judgment

- eval: E10
  judged_by: judge panel (fresh context, 3 lens)
  proposal: PASS
  votes:
    - domain-correctness: PASS — bảng «Bài máy gắn sai» có 0 dòng; OP1 máy gắn đúng 100/100, cận dưới Wilson 0.963 so với ngưỡng 0.95; GP có 0 bài nên không có gì để phân loại.
    - operational-feasibility: PASS — bảng sai rỗng, OP1 100/100, không có kiểu lỗi chung nào cần sửa luật hay sửa nhãn.
    - spec-alignment: UNCERTAIN — bảng sai rỗng nên câu «xếp từng bài sai vào một kiểu» vô nghĩa; judge không có contract trong inputs để biết 0 bài sai có là kết quả hợp lệ của AC-10 không.
  required_evidence:
    - Quyết định của người ký hoặc đoạn trong contract.md ghi rõ AC-10 coi 0 bài sai là kết quả hợp lệ (commit 7dd6bb0d6 «PL36 AC-10 — 0 bài sai là kết quả hợp lệ»).
    - Hoặc một tệp chấm mới có bảng «Bài máy gắn sai» với ít nhất một dòng đủ ref_id, mã căn nguyên văn, toà, trục máy gắn, trục nhãn người.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-27T00:57:30Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-27T00:57:30Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-27T00:57:30Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-27T00:57:30Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-27T00:57:30Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 2 của 3, chạy lại toàn bộ 14 eval (--no-carry) trên 7dd6bb0d6. Eval máy 13/14 PASS; E10 (judgment, chấm theo lời AC-10 mới) PASS. E11 đỏ vì suite pipeline_a đỏ 3 ca TRG-AC-7 (scripts/tin-rao-gan-khu-vuc.test.mjs): tệp tạm pipeline/transform-zalo.loi-pl36-<pid>.mjs mà ca «luot-nap-that-loi-nap-buoc-gan-can-van-thoat-0-mot-canh-bao» (pipeline/tests/ghep-tin-truc-can-ghi.itest.mjs:155) ghi cạnh tệp gốc lọt vào phép quét «khớp mẫu gán khu vực» của TRG-AC-7 khi hai lệnh chạy cùng lúc. Chạy lại riêng pipeline_a ngay sau lượt trên cùng sha: tests 420, pass 403, fail 0, skipped 17, thoát 0 (evidence/m5-pipeline-a-rieng-r2.txt). Tức là đỏ do đua giữa tệp tạm của nhánh và một test quét thư mục — lỗi cô lập test của nhánh, không phải hồi quy hành vi; nhánh nên ghi bản chép vào thư mục tạm riêng hoặc tên không khớp mẫu quét. pipeline_that xanh, tập bỏ qua đúng may_thu (HT33: ON22-AC-10 không chạy trên M5). Verdict REJECT còn đứng độc lập với E11: review xác nhận 7 finding trong hợp đồng (AC-3 ×2, AC-5 ×2, AC-6 ×2, AC-7) — chủ yếu ô ma trận khai mà ca không đo. Kit báo runLogWriteFailed — run-log của vòng do phiên chấm ghi từ kết quả.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đo được trên baseline đều red (có phân biệt). E11, E12, E13 là red trên baseline.

Nguyên nhân E11 fail: ca TRG-AC-7 của bộ test nửa A quét thư mục transform và thấy tệp `transform-zalo.loi-pl36-98820.mjs`, một tệp khớp mẫu gán khu vực mà ma trận không có. Ca kèm theo còn báo `transform-fb.mjs` chứa câu chọn khu vực riêng. Hai tệp này nằm ngoài các probe của feature, nên cần người xem tệp đó có thuộc nhánh không và có nên vào ma trận hay bị xoá.

Baseline không đo:
- bash _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/migration.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/migration.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/offer-unit.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/offer-unit.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/chay-lai.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/chay-lai.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/offer-building-nhanh.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/offer-building-nhanh.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/cuoi-luot-nap.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/cuoi-luot-nap.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/chay-kho.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/chay-kho.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval multi-run đều đồng đều (mọi eval chạy một lần, deterministic).

## Iterations

Round 1: không có dữ liệu trong lượt này; xem run-log.jsonl của feature.
Round 2: E11 failed — ca TRG-AC-7 của nửa A bộ test pipeline thấy tệp transform ngoài ma trận (`transform-zalo.loi-pl36-98820.mjs`) và `transform-fb.mjs` còn câu chọn khu vực riêng. Returned to implementation. E10 còn một phiếu UNCERTAIN chờ người ký.
