---
schema_version: 2
feature_slug: ghep-tin-vao-truc-can
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6e946bb29f99fc3639f8e6f0b4baa29fd6692759
human_signoff: Mạnh 2026-11-27
---

# Evidence Report: ghep-tin-vao-truc-can

Round 4. Mọi eval máy đều xanh; còn một mục judgment (E10) chờ người chốt ở Cổng 2.

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
| E10 | AC-10 | judgment | PENDING-JUDGMENT |
| E11 | AC-6 | script | PASS |
| E12 | AC-6 | script | PASS |
| E13 | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-ghep-tin-vao-truc-can-E1-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh
  verified_at: 2026-11-27T07:25:26Z
  output: |
    XANH: ma trận, floor_raw và bốn đột biến

- eval: E2
  run_id: minted-ghep-tin-vao-truc-can-E2-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh
  verified_at: 2026-11-27T07:25:26Z
  output: |
    XANH: ma trận, floor_raw và bốn đột biến

- eval: E3
  run_id: minted-ghep-tin-vao-truc-can-E3-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh
  verified_at: 2026-11-27T07:25:26Z
  output: |
    XANH: ma trận, floor_raw và bốn đột biến

- eval: E4
  run_id: minted-ghep-tin-vao-truc-can-E4-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/migration.sh
  verified_at: 2026-11-27T07:25:26Z
  output: |
    XANH: khuôn phát biểu và một đột biến

- eval: E5
  run_id: minted-ghep-tin-vao-truc-can-E5-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/offer-unit.sh
  verified_at: 2026-11-27T07:25:26Z
  output: |
    XANH: offer_unit và bốn đột biến

- eval: E6
  run_id: minted-ghep-tin-vao-truc-can-E6-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/chay-lai.sh
  verified_at: 2026-11-27T07:25:26Z
  output: |
    XANH: vòng đời và hai đột biến

- eval: E7
  run_id: minted-ghep-tin-vao-truc-can-E7-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/offer-building-nhanh.sh
  verified_at: 2026-11-27T07:25:26Z
  output: |
    XANH: offer_building và hai đột biến

- eval: E8
  run_id: minted-ghep-tin-vao-truc-can-E8-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/cuoi-luot-nap.sh
  verified_at: 2026-11-27T07:25:26Z
  output: |
    XANH: bước cuối lượt nạp và hai đột biến

- eval: E9
  run_id: minted-ghep-tin-vao-truc-can-E9-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/chay-kho.sh
  verified_at: 2026-11-27T07:25:26Z
  output: |
    XANH: OP1 tin mức trục + căn 488 ≥ 350

- eval: E10a
  run_id: minted-ghep-tin-vao-truc-can-E10a-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh
  verified_at: 2026-11-27T07:25:26Z
  output: |
    Lệnh chấm trục chạy xong; tệp evidence/cham-truc.md đã sinh (OP1 100/100 đúng, cận dưới Wilson 0,963).

- eval: E11
  run_id: minted-ghep-tin-vao-truc-can-E11-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-27T07:25:26Z
  output: |
    nửa A bộ test pipeline xong, 0 fail

- eval: E12
  run_id: minted-ghep-tin-vao-truc-can-E12-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-27T07:25:26Z
  output: |
    nửa B bộ test pipeline xong, 0 fail

- eval: E13
  run_id: r4-l11-1-20261127072526
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-27T07:25:26Z
  output: |
    suite pipeline_that (ca dữ liệu thật trên bản chép) xong, fail 0

### Judgment

- eval: E10
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment)
  verdict: PASS
  rationale: Bảng bài máy gắn sai trong cham-truc.md rỗng (OP1 100/100 đúng, cận dưới Wilson 0,963 so với ngưỡng 0,95). AC-10 và d-25 nói 0 bài sai là kết quả hợp lệ, nên không có kiểu lỗi nào cần xếp loại.
  votes:
    - domain-correctness: PASS — bảng bài sai 0 dòng; không có kiểu lỗi chung của luật (dạng mã, tiền tố toà, tra trục), không có lỗi nhãn người hay danh bạ.
    - operational-feasibility: PASS — bảng rỗng, GP có 0 bài; AC-10 nói 0 bài sai là kết quả hợp lệ nên không có kiểu lỗi luật sửa được.
    - spec-alignment: PASS — AC-10 và decisions d-25 (Mạnh «E10 - A») cho phép 0 bài sai, khi đó người chấm ghi không có kiểu lỗi nào.
  human_override: Mạnh 2026-11-27 — Đạt

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r4
  exit_code: 0
  verified_at: 2026-11-27T07:25:26Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-27T07:25:26Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r4
  exit_code: 0
  verified_at: 2026-11-27T07:25:26Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-27T07:25:26Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r4
  exit_code: 0
  verified_at: 2026-11-27T07:25:26Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): VÒNG 4, vượt trần theo lời Mạnh 27/11 do GS chuyển («PL36, PL42 thực hiện theo khuyên»). Chạy lại toàn bộ 14 eval (--no-carry) trên 72acc1e0a1a1942d476e5ab306f73ad6f6f3ab56 (= 003db61dc + tệp evidence probe); soát 72acc1e0a-20261127T142427 xanh pipeline + scripts. Mọi eval máy PASS, mọi lệnh suite thoát 0, không lệnh nào BLOCKED. pipeline_that chạy TRONG vòng qua eval E13 (long_running 90 do hồ sơ khai — không chạm trần 30′, nên không cần đường ngoài vòng HT37; lệnh suite trùng được bỏ khỏi danh sách suite): tests 37, pass 37, fail 0, skipped 0; «bỏ qua 1 ca chỉ máy thu» → ĐẠT theo luật GS 26/11. Chấm trên M5: ON22-AC-10 không chạy (HT33). Finding high AC-5 của vòng 3 (căn qua bí danh mất ở view) đã đóng: review vòng này không còn finding trong hợp đồng; bốn finding ngoài hợp đồng đề xuất Known limits. Kit trả PENDING-JUDGMENT vì E10 (judgment) đề xuất PASS chờ người ở Cổng 2. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 3 — baseline khong do lai round nay

Không có eval không-phân-biệt cần liệt kê. Các lệnh suite xanh cả hai phía là regression-guard bình thường.

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 1-3: lịch sử nằm trong run-log.jsonl của hồ sơ.
Round 4: 13 eval máy xanh, 5 lệnh suite xanh; E10 (judgment) chờ người chốt nên verdict PENDING-JUDGMENT.

### Re-pin lần 1 — 2026-11-27, do làn trọn trước chữ ký Cổng 2 sau gộp main a94013aaf, lượt 2 sau sửa probe cham-truc (T3, lời GS 27/11)
run_id: repin-20261127T162015Z-75784
sha: 6e946bb29f99fc3639f8e6f0b4baa29fd6692759 · suites: 8 lệnh exit 0 · evals: 13/13 eval máy đạt kỳ vọng · ngoài làn máy: E10 (E10 không khai paths)
