---
schema_version: 2
feature_slug: ghep-tin-vao-truc-can
verdict: REJECT
failed_evals: [E5, E6, E7, E10a, E11, E13]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 83a5b770c866a96a55fbc400abe65b1f052079f5
human_signoff:
---

# Evidence Report: ghep-tin-vao-truc-can

Round 1. Verdict REJECT: sáu eval đỏ (E5, E6, E7, E10a, E11, E13). Mọi lệnh đỏ đều gắn với một eval, không có lệnh đỏ ngoài eval. Sáu chỗ đỏ chia thành ba nhóm nguyên nhân, nêu ở phần Evidence và Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | FAIL |
| E6 | AC-6 | script | FAIL |
| E7 | AC-7 | script | FAIL |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10a | AC-10 | script | FAIL |
| E10 | AC-10 | judgment | UNCERTAIN |
| E11 | AC-6 | script | FAIL |
| E12 | AC-6 | script | PASS |
| E13 | AC-6 | test | FAIL |

## Evidence

- eval: E1
  run_id: minted-ghep-tin-vao-truc-can-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh
  verified_at: 2026-11-26T18:49:09Z
  output: |
    XANH: ma trận và ba đột biến

- eval: E2
  run_id: minted-ghep-tin-vao-truc-can-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh
  verified_at: 2026-11-26T18:49:09Z
  output: |
    XANH: ma trận và ba đột biến (cùng lệnh với E1)

- eval: E3
  run_id: minted-ghep-tin-vao-truc-can-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh
  verified_at: 2026-11-26T18:49:09Z
  output: |
    XANH: ma trận và ba đột biến (cùng lệnh với E1)

- eval: E4
  run_id: minted-ghep-tin-vao-truc-can-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/migration.sh
  verified_at: 2026-11-26T18:49:09Z
  output: |
    XANH: khuôn phát biểu và một đột biến

- eval: E5
  run_id: minted-ghep-tin-vao-truc-can-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/offer-unit.sh
  verified_at: 2026-11-26T18:49:09Z
  output: |
    Ca rule-khac-khong-vao-view, dau-cuoi-luat-that-va-view-khop và các ca cùng tệp đỏ vì ENOENT.
    Hàm mig() trong pipeline/tests/ghep-tin-truc-can-131.itest.mjs dòng 17 nối đường dẫn tuyệt đối của tệp
    migration tạm vào sau thư mục pipeline, ra đường dẫn chồng đôi không tồn tại.
    Probe kết luận: đột biến «hai-truc-khong-xung-dot» không làm đỏ ca «ô «hai-truc»».

- eval: E6
  run_id: minted-ghep-tin-vao-truc-can-E6-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/chay-lai.sh
  verified_at: 2026-11-26T18:49:09Z
  output: |
    Vòng đời dòng trên mã thật: 7 ca, 7 qua, 0 đỏ.
    Phần đột biến: đột biến «bo-chua-ghep-can» không làm ca nào đỏ, tức chiều đỏ của AC-6 không chứng minh được.

- eval: E7
  run_id: minted-ghep-tin-vao-truc-can-E7-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/offer-building-nhanh.sh
  verified_at: 2026-11-26T18:49:09Z
  output: |
    Ca offer-building-dau-ra-giu-nguyen và offer-building-va-offer-unit-nhanh đỏ vì cùng lỗi ENOENT đường dẫn
    migration chồng đôi như E5.
    Probe kết luận: đột biến «doi-mot-dong-dau-ra» không làm đỏ ca «offer_building sau 131 khác 117».

- eval: E8
  run_id: minted-ghep-tin-vao-truc-can-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/cuoi-luot-nap.sh
  verified_at: 2026-11-26T18:49:09Z
  output: |
    XANH: bước cuối lượt nạp và một đột biến

- eval: E9
  run_id: minted-ghep-tin-vao-truc-can-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/chay-kho.sh
  verified_at: 2026-11-26T18:49:09Z
  output: |
    XANH: OP1 tin mức trục + căn 488 ≥ 350

- eval: E10a
  run_id: minted-ghep-tin-vao-truc-can-E10a-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh
  verified_at: 2026-11-26T18:49:09Z
  output: |
    Bộ test chấm: 5 ca, 5 qua, 0 đỏ (tap-dung-het-dat-nguong, the-cai-loai-khoi-phep-tinh... đều xanh).
    Sau đó tệp probes/cham-truc.sh dòng 16 dừng với lỗi «BO[@]: unbound variable»: mảng BO rỗng khi thiếu tệp thẻ cài lỗi,
    nên bước chấm Wilson và bước ghi evidence/cham-truc.md không chạy tới.

- eval: E11
  run_id: r1-l9-1-20261126184909
  exit_code: 1
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T18:49:09Z
  output: |
    Nửa A bộ test pipeline: các ca TV39 xanh; hai ca đỏ ở pipeline/scripts/hang-gia.test.mjs:
    «CG9-AC-11 ba job đêm có đúng một bước xep-hang-gia...» và «CG9-AC-11 DB chưa áp 104...».
    Cả hai đỏ ở taoDbThu (pipeline/scripts/db-thu-dbv.mjs dòng 43): scripts/ci-db-init.mjs dừng khi dựng DB thử từ thư mục migration tạm.

- eval: E12
  run_id: minted-ghep-tin-vao-truc-can-E12-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T18:49:09Z
  output: |
    Nửa B bộ test pipeline xanh, 0 đỏ (duration_ms 111309).

- eval: E13
  run_id: minted-ghep-tin-vao-truc-can-E13-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T18:49:09Z
  output: |
    Suite ca dữ liệu thật: 37 ca, 36 qua, 1 đỏ.
    Ca đỏ: «chiều đỏ PL20-E7: bản phá bỏ điều kiện chừa → dòng ghep-toa bị rút, đỏ» ở pipeline/scripts/assert-rut-thay.test.mjs dòng 169.
    Thông điệp: chỗ đột biến không còn trong lib/assert.mjs (đoạn «AND (fa.rule_id IS NULL OR fa.rule_id NOT LIKE 'ghep-...»).

### Judgment

- eval: E10
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment)
  verdict: UNCERTAIN
  rationale: Đề xuất của panel là PASS dựa trên tệp chấm OP1 100/100, cận dưới Wilson 0.963, bảng «Bài máy gắn sai» trống; tệp này sinh từ lần chạy cũ, còn lần chạy round này của E10a dừng trước bước chấm nên chưa có tệp mới. Một giám khảo UNCERTAIN vì bảng sai trống nên không có bài nào để xếp kiểu lỗi.
  required_evidence:
    - Một tập chấm có ít nhất một bài máy gắn sai, tức bảng «Bài máy gắn sai» ở _acceptance/ghep-tin-vao-truc-can/evidence/cham-truc.md có dòng (mã căn nguyên văn, toà, trục máy gắn, trục nhãn người).
    - Hoặc contract nêu rõ 0 bài sai là câu trả lời hợp lệ cho AC-10; khi đó có thể đổi thành PASS. Và E10a phải chạy xanh trở lại ở round sau.
  human_override:  # chi nguoi ghi

Phiếu từng giám khảo (đề xuất, chờ người quyết ở Cổng 2):

- domain-correctness: PASS — bảng «Bài máy gắn sai» trống (0 bài); OP1 100/100 đúng, cận dưới Wilson 0.963 so với ngưỡng 0.95; không có lỗi nhãn người hay dữ liệu danh bạ; khu GP 0 bài nên không đo được nhưng không làm lệch câu hỏi.
- operational-feasibility: PASS — bảng trống, OP1 100/100, GP không có bài; không có kiểu lỗi chung nào tồn tại.
- spec-alignment: UNCERTAIN — bảng trống (0 bài; OP1 100/100, GP 0 bài), không có bài sai để phân loại là lỗi luật sửa được, lỗi nhãn người hay lỗi danh bạ. Cần một tập chấm có bài sai, hoặc contract nêu rõ 0 bài sai là hợp lệ cho AC-10.

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T18:49:09Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T18:49:09Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-26T18:49:09Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T18:49:09Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-ghep-tin-vao-truc-can-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T18:49:09Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: E5, E7 (ENOENT đường dẫn migration chồng đôi ở mig() của pipeline/tests/ghep-tin-truc-can-131.itest.mjs:17); E6 (đột biến bo-chua-ghep-can không làm ca nào đỏ); E10a (probes/cham-truc.sh:16 «BO[@]: unbound variable»); E11 (pipeline_a: 15 ca CG9/CG10 đỏ ở taoDbThu — scripts/ci-db-init.mjs thoát 2 khi dựng DB thử từ thư mục migration tạm); E13 (pipeline_that: «chiều đỏ PL20-E7…» assert-rut-thay.test.mjs:169 — chỗ đột biến không còn trong lib/assert.mjs)

Ghi chú phiên chấm M5:
- E9 (đo thời gian/ngưỡng) XANH: «OP1 tin mức trục + căn 488 ≥ 350» — không cần đo lại trên Mac mini vì thời gian.
- E10a có phần do M5: /bin/bash 3.2 với set -u báo mảng rỗng «unbound», và tệp thẻ cài lỗi research-local/…/the-cai-hai-khu-truc-2411.json chỉ có ở máy thu nên BO rỗng; trên máy thu (có tệp) dòng này không hỏng. Bộ test chấm 5/5 xanh. Vẫn là lỗi probe: thiếu tệp thì phải chạy được hoặc dừng có tên.
- E11: cùng máy, cùng giờ, pipeline_a xanh ở nhánh PL42 và PL41 → lỗi nghiêng về bộ migration của nhánh này (ci-db-init thoát 2, stderr rỗng). Chưa giải mã stdout.
- E13 pipeline_that: 37 ca, 36 qua, 1 đỏ (ca trên); ngoài ca đó chỉ bỏ ON22-AC-10 (may_thu). Đỏ vì fail > 0 — không đạt theo luật GS.
- Ba finding high trong hợp đồng (AC-5, AC-6: assertion âm tính / ghim tên ca thay thông điệp) — xem review-findings.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc không đo được baseline (xem dưới); không eval nào xanh cả HEAD lẫn baseline.

Baseline khong do:
- bash _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/ham-gan.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/migration.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/migration.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/offer-unit.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/offer-unit.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/chay-lai.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/chay-lai.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/offer-building-nhanh.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/offer-building-nhanh.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/cuoi-luot-nap.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/cuoi-luot-nap.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/chay-kho.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/chay-kho.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (không eval nào có runs lớn hơn 1).

## Iterations

Round 1: E5, E6, E7, E10a, E11, E13 failed — ba nhóm nguyên nhân: (a) E5, E7 và các ca cùng tệp ghep-tin-truc-can-131.itest.mjs đỏ vì hàm mig() nối đường dẫn tuyệt đối vào sau pipeline/ (ENOENT), và E6 có đột biến bo-chua-ghep-can không làm ca nào đỏ (ca cau-rut-thay-boi-luot-chua-dong-ghep-can luôn xanh); (b) E10a dừng ở probes/cham-truc.sh dòng 16 do mảng BO rỗng (unbound variable) trước khi chấm; (c) E11 đỏ vì dựng DB thử bằng ci-db-init thất bại ở hai ca CG9-AC-11, E13 đỏ vì chỗ đột biến của ca PL20-E7 không còn trong lib/assert.mjs. Returned to implementation.
