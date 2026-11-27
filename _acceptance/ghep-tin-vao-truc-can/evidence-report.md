---
schema_version: 2
feature_slug: ghep-tin-vao-truc-can
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b2ce8deb05135928f1219b68541af6a78cc445c8
human_signoff:
---

# Evidence Report: ghep-tin-vao-truc-can

Round 3. Các eval máy đều chạy xong, nhưng review còn hai lỗi trong hợp đồng (AC-5 qua bí danh mã căn, AC-6 ca tắt một nguồn qua rỗng) nên verdict là REJECT. Chi tiết ở review-findings.md.

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
| E10 | AC-10 | judgment | PASS |
| E11 | AC-6 | script | PASS |
| E12 | AC-6 | script | PASS |
| E13 | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-ghep-tin-vao-truc-can-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh
  verified_at: 2026-11-27T03:40:01Z
  output: |
    XANH: ma trận, floor_raw và bốn đột biến

- eval: E2
  run_id: minted-ghep-tin-vao-truc-can-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh
  verified_at: 2026-11-27T03:40:01Z
  output: |
    XANH: ma trận, floor_raw và bốn đột biến

- eval: E3
  run_id: minted-ghep-tin-vao-truc-can-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh
  verified_at: 2026-11-27T03:40:01Z
  output: |
    XANH: ma trận, floor_raw và bốn đột biến

- eval: E4
  run_id: minted-ghep-tin-vao-truc-can-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/migration.sh
  verified_at: 2026-11-27T03:40:01Z
  output: |
    XANH: khuôn phát biểu và một đột biến

- eval: E5
  run_id: minted-ghep-tin-vao-truc-can-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/offer-unit.sh
  verified_at: 2026-11-27T03:40:01Z
  output: |
    XANH: offer_unit và hai đột biến

- eval: E6
  run_id: minted-ghep-tin-vao-truc-can-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/chay-lai.sh
  verified_at: 2026-11-27T03:40:01Z
  output: |
    XANH: vòng đời và hai đột biến

- eval: E7
  run_id: minted-ghep-tin-vao-truc-can-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/offer-building-nhanh.sh
  verified_at: 2026-11-27T03:40:01Z
  output: |
    XANH: offer_building và hai đột biến

- eval: E8
  run_id: minted-ghep-tin-vao-truc-can-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/cuoi-luot-nap.sh
  verified_at: 2026-11-27T03:40:01Z
  output: |
    XANH: bước cuối lượt nạp và hai đột biến

- eval: E9
  run_id: minted-ghep-tin-vao-truc-can-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/chay-kho.sh
  verified_at: 2026-11-27T03:40:01Z
  output: |
    XANH: OP1 tin mức trục + căn 488 ≥ 350

- eval: E10a
  run_id: minted-ghep-tin-vao-truc-can-E10a-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh
  verified_at: 2026-11-27T03:40:01Z
  output: |
    (probe không in dòng tóm tắt; tệp chấm evidence/cham-truc.md do probe sinh)

- eval: E11
  run_id: minted-ghep-tin-vao-truc-can-E11-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-27T03:40:01Z
  output: |
    ℹ duration_ms 278664.638042

- eval: E12
  run_id: minted-ghep-tin-vao-truc-can-E12-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-27T03:40:01Z
  output: |
    ℹ duration_ms 118321.867125

- eval: E13
  run_id: minted-ghep-tin-vao-truc-can-E13-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-27T03:40:01Z
  output: |
    ℹ duration_ms 2072857.697291

### Judgment

- eval: E10
  judged_by: judge panel (fresh context), đề xuất PASS
  verdict: PASS
  votes:
    - domain-correctness: PASS — Bảng bài sai rỗng (0 bài): OP1 100/100 đúng, cận dưới Wilson 0,963 ≥ 0,95. Theo AC-10 và quyết định d-25 của Mạnh, 0 bài sai là kết quả hợp lệ, nên không có kiểu lỗi nào của luật, nhãn người hay dữ liệu danh bạ.
    - operational-feasibility: PASS — Bảng «Bài máy gắn sai» trong cham-truc.md rỗng (OP1 100/100 đúng, Wilson 0,963 ≥ 0,95). AC-10 và d-25 (Mạnh «E10 - A») nói 0 bài sai là kết quả hợp lệ, ghi «không có kiểu lỗi nào».
    - spec-alignment: PASS — Bảng bài sai rỗng (0 bài), OP1 100/100 đúng, Wilson 0,963 ≥ 0,95. AC-10 nói rõ 0 bài sai là kết quả hợp lệ (d-25, Mạnh duyệt «E10 - A»); không có kiểu lỗi luật sửa được nào.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-27T03:40:01Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-27T03:40:01Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-27T03:40:01Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-27T03:40:01Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-27T03:40:01Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 3 (vòng cuối), chạy lại toàn bộ 14 eval (--no-carry) trên b2ce8deb05135928f1219b68541af6a78cc445c8. Mọi eval máy PASS, mọi lệnh suite ghim lại thoát 0 (không lệnh nào BLOCKED, không cần thử lại); E10 (judgment, ba lăng kính, inputs có contract.md + decisions.jsonl) đề xuất PASS. pipeline_that: tests 37, pass 37, fail 0, skipped 0; dòng «chay-that: vai may-phat-trien — bỏ qua 1 ca chỉ máy thu»; tập bỏ qua bằng đúng tập may_thu → ĐẠT theo luật GS 26/11. Chấm trên M5: ON22-AC-10 không chạy (HT33). REJECT do review xác nhận một finding HIGH trong hợp đồng (AC-5): căn khớp qua bí danh mã căn — luật JS ra mức căn, nhưng bên ghi chỉ lưu stack:tầng và view offer_unit tra lại bằng stack_key + floor, nên trên DB máy thu (28 261 căn đang hoạt động chỉ biết qua bí danh, stack_key/floor NULL) tin hạ về mức trục, unit_key NULL — số «căn» của lượt nạp và chạy khô đếm cao hơn view. Cùng gốc: một finding medium AC-5 (view so floor thô, JS chuẩn hoá); thêm một finding medium AC-6 (ca tắt một nguồn không có đối chứng dương ma > 0). Kit báo runLogWriteFailed — run-log của vòng do phiên chấm ghi từ kết quả.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đo được trên baseline đều red (có phân biệt): E11, E12, E13.

### Baseline khong do

- bash _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/migration.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/migration.sh co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/offer-unit.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/offer-unit.sh co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/chay-lai.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/chay-lai.sh co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/offer-building-nhanh.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/offer-building-nhanh.sh co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/cuoi-luot-nap.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/cuoi-luot-nap.sh co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/chay-kho.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/chay-kho.sh co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, không có phương sai).

## Iterations

Round 3: không eval máy nào đỏ, nhưng review còn hai lỗi trong hợp đồng — đường bí danh mã căn bị view offer_unit hạ về mức trục (AC-5), và ca tắt một nguồn của E6 qua rỗng (AC-6). Trả về triển khai.
