---
schema_version: 2
feature_slug: ghep-tin-vao-danh-muc
verdict: BLOCKED
failed_evals: ["E1","E2","E3","E7","E9"]
reason: "Lệnh `node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'` chạy qua 30 phút (bắt đầu 09:20, đến 09:51 vẫn chưa xong, tiến trình 82388 còn sống; suite test đang chạy `node --test --test-concurrency=1`). Bị đưa sang nền bởi công cụ (không phải bị giết do timeout công cụ). evals.yaml của ghep-tin-vao-danh-muc không khai long_running cho pipeline_a nên áp mặc định 30 phút, quá hạn, không có dòng kết thúc __EXIT= trong tệp đầu ra. Không kết luận PASS hay FAIL. Tác vụ nền đã được dừng theo quy định (không chạy lại)."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 197ad16e6134d27f1fff341395005234a7cbfef9
human_signoff:
---

# Evidence Report: ghep-tin-vao-danh-muc

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | FAIL |
| E2 | AC-2 | test | FAIL |
| E3 | AC-3 | test | FAIL |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | FAIL |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | FAIL |
| E10 | AC-9 | judgment | UNCERTAIN |
| E11 | AC-10 | script | PASS |

Vòng này BLOCKED: một lệnh suite (pipeline_a) quá hạn 30 phút nên không có kết luận. Song song, năm eval của hợp đồng đỏ (E1, E2, E3, E7, E9). Hai lệnh suite khác của vùng app (kiểm kiểu và test giao diện) đỏ; lệnh suite này không gắn eval nào.

## Evidence

- eval: E1
  run_id: minted-ghep-tin-vao-danh-muc-E1-r1
  exit_code: 3
  baseline: n-a
  verifier: bash _acceptance/ghep-tin-vao-danh-muc/probes/ham-gan.sh
  verified_at: 2026-11-24T02:02:11Z
  output: |
    == Ma trận trên mã thật
    ℹ tests 75
    ℹ pass 75
    ℹ fail 0
    == Đột biến
    đột biến «chon-toa-dau-o-mo-ho» → ca «ô «cot-mo-ho»» đỏ
    đột biến «bo-loc-du-an» → ca «mã S1.01 của tin dự án 16» đỏ
    đột biến không tìm thấy chuỗi gốc: re: ten.map((t) => mauTen(t)).filter(Boolean)

- eval: E2
  run_id: minted-ghep-tin-vao-danh-muc-E2-r1
  exit_code: 3
  baseline: n-a
  verifier: bash _acceptance/ghep-tin-vao-danh-muc/probes/ham-gan.sh
  verified_at: 2026-11-24T02:02:11Z
  output: |
    Cùng lệnh với E1: 75 ca của ma trận xanh, lệnh dừng ở bước đột biến vì không tìm thấy chuỗi gốc của một đột biến.
    đột biến «bo-loc-du-an» → ca «mã S1.01 của tin dự án 16» đỏ (đúng ca của AC-2)

- eval: E3
  run_id: minted-ghep-tin-vao-danh-muc-E3-r1
  exit_code: 3
  baseline: n-a
  verifier: bash _acceptance/ghep-tin-vao-danh-muc/probes/ham-gan.sh
  verified_at: 2026-11-24T02:02:11Z
  output: |
    Cùng lệnh với E1: 75 ca xanh.
    đột biến «nhan-kien-thuc-nghe» → ca «ô «can-cu-kien-thuc-nghe-coi-nhu-chua-doc»» đỏ
    đột biến «bo-kiem-ten-trong-trich» → ca «ô «model-mot-minh-ten-ngoai-trich»» đỏ
    đột biến không tìm thấy chuỗi gốc: re: ten.map((t) => mauTen(t)).filter(Boolean)

- eval: E4
  run_id: minted-ghep-tin-vao-danh-muc-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: bash _acceptance/ghep-tin-vao-danh-muc/probes/migration.sh
  verified_at: 2026-11-24T02:02:11Z
  output: |
    XANH: itest 117 và bốn đột biến

- eval: E5
  run_id: minted-ghep-tin-vao-danh-muc-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: bash _acceptance/ghep-tin-vao-danh-muc/probes/xung-dot.sh
  verified_at: 2026-11-24T02:02:11Z
  output: |
    XANH: năm ô và năm đột biến

- eval: E6
  run_id: minted-ghep-tin-vao-danh-muc-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: bash _acceptance/ghep-tin-vao-danh-muc/probes/chay-lai.sh
  verified_at: 2026-11-24T02:02:11Z
  output: |
    XANH: itest bước ghi và ba đột biến

- eval: E7
  run_id: minted-ghep-tin-vao-danh-muc-E7-r1
  exit_code: 1
  baseline: n-a
  verifier: bash _acceptance/ghep-tin-vao-danh-muc/probes/khong-pha.sh
  verified_at: 2026-11-24T02:02:11Z
  output: |
    đạt: thiếu 117: lượt nạp thoát 0
    đạt: thiếu 117: đúng một dòng cảnh báo · JOB WARN [ghep-toa] chưa áp migration 117, bỏ qua lượt gắn
    ghep-toa: 4114/7838 tin gắn · 23 xung đột · chèn 46830 · rút 0
    đạt: bước gắn xong trong 60 giây · 8.3 giây
    đạt: có 117: không cảnh báo
    ĐỎ: có 117: bước gắn đã chạy và không đổi gì ghep-toa: 4114/7838 tin gắn · 23 xung đột · chèn 212 · rút 0

- eval: E8
  run_id: minted-ghep-tin-vao-danh-muc-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: bash _acceptance/ghep-tin-vao-danh-muc/probes/do-phu.sh
  verified_at: 2026-11-24T02:02:11Z
  output: |
    XANH: do-phu và chiều đỏ

- eval: E9
  run_id: minted-ghep-tin-vao-danh-muc-E9-r1
  exit_code: 1
  baseline: n-a
  verifier: bash _acceptance/ghep-tin-vao-danh-muc/probes/cham-tap-test.sh
  verified_at: 2026-11-24T02:02:11Z
  output: |
    n1: da cham 110/110 · dung 109 · sai 1 · wilson 0.9503 · dat
    n2: da cham 110/110 · dung 108 · sai 2 · wilson 0.9361 · hut · DUNG GAN NHAN NHOM NAY
      may sai n2 00e5c7bbba8cc05376a5ef1b3991f4ee: may vung/389 · nguoi -/the rainbow -> {"vung":"48"}
      may sai n2 3605b344d86c8576e148fc0e05540c31: may vung/389 · nguoi -/the rainbow -> {"vung":"48"}
    CHUA DAT

- eval: E11
  run_id: minted-ghep-tin-vao-danh-muc-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: bash _acceptance/ghep-tin-vao-danh-muc/probes/doc-bu.sh
  verified_at: 2026-11-24T02:02:11Z
  output: |
    XANH: danh sách đọc bù và các chiều đỏ

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-ghep-tin-vao-danh-muc-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-24T02:02:11Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-ghep-tin-vao-danh-muc-SUITE-lint-r1
  exit_code: 2
  verified_at: 2026-11-24T02:02:11Z
  note: lệnh không gắn eval nào; kiểm kiểu báo thiếu tên LayoutProps và PageProps ở các tệp layout và page của app.

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-ghep-tin-vao-danh-muc-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-24T02:02:11Z
  note: lệnh không gắn eval nào; test data-api không nạp được gói pg (ERR_MODULE_NOT_FOUND) trong worktree.

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-ghep-tin-vao-danh-muc-SUITE-test_a-r1
  exit_code: none (quá hạn 30 phút, không có dòng kết thúc, không kết luận)
  verified_at: 2026-11-24T02:02:11Z
  note: BLOCKED, xem reason ở frontmatter.

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-ghep-tin-vao-danh-muc-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-24T02:02:11Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-ghep-tin-vao-danh-muc-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-24T02:02:11Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-ghep-tin-vao-danh-muc-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-24T02:02:11Z

### Judgment

- eval: E10
  judged_by: judge-subagent (fresh context), ba lăng kính
  proposal: PASS (đề xuất, chưa có người chốt)
  verdict: UNCERTAIN
  votes:
    - domain-correctness: UNCERTAIN — Báo cáo chấm evidence/cham-tap-test.md không tồn tại ở đường dẫn được giao nên không có gì để đối chiếu với AC-9; hợp đồng chỉ nêu yêu cầu (N1/N2 mỗi nhóm 110 bài, cận dưới Wilson từ 0,95, tách theo nguồn, mức toà/vùng và theo khu). Tệp cham-vong-2-may-moi-2411.md nằm ngoài danh sách input nên không dùng.
    - operational-feasibility: PASS — Báo cáo nêu cỡ mẫu 110/110 mỗi nhóm, cận dưới Wilson (n1 0,9503, n2 0,9361), tách số theo nguồn, mức toà/vùng, khu. Phần thấp được nói ra: kết luận «chưa đạt», n2 «hụt», C, F phải tắt, kèm danh sách bài sai (cặp nút 389/48). Báo cáo không có câu riêng nói mức vùng yếu hơn toà, chỉ hiện qua bảng; với AC-9 thì vậy là đủ.
    - spec-alignment: PASS — Báo cáo ghi đã chấm 110/110 cho n1 và n2, đúng cỡ mẫu đã chốt, có cận dưới Wilson từng nhóm, có bảng tách theo nguồn, mức toà/vùng và khu. Phần thấp được nói ra: kết luận "chưa đạt", nguồn phải tắt C, F, kèm danh sách bài sai và nguyên nhân lỗ danh bạ.
  required_evidence:
    - Tệp /Users/manhphan/dev/onehub-invest/.claude/worktrees/ghep-tin-vao-danh-muc/_acceptance/ghep-tin-vao-danh-muc/evidence/cham-tap-test.md có thật. Tệp này phải nêu cỡ mẫu từng nhóm n1 và n2 (110 bài), cận dưới Wilson 95% từng nhóm, số tách riêng nguồn A, B, C, F, mức toà so với mức vùng, và theo khu OP1 so với GP. Tệp cũng phải nói thẳng khi một phần có độ đúng thấp. Cách lấy: chạy `_acceptance/ghep-tin-vao-danh-muc/probes/cham-tap-test.sh` và lưu đầu ra vào đường dẫn này.
    - Nếu báo cáo thực sự nằm ở tệp khác (ví dụ `cham-vong-2-may-moi-2411.md`), cập nhật danh sách Input của eval E10 trỏ đúng tệp đó rồi chấm lại.
  human_override:  # chi nguoi ghi

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều không đo được baseline (n-a), nên chưa có eval nào được xác nhận là phân biệt hay không phân biệt.

Baseline khong do:
- bash _acceptance/ghep-tin-vao-danh-muc/probes/ham-gan.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/ham-gan.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-danh-muc/probes/migration.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/migration.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-danh-muc/probes/xung-dot.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/xung-dot.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-danh-muc/probes/chay-lai.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/chay-lai.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-danh-muc/probes/khong-pha.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/khong-pha.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-danh-muc/probes/do-phu.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/do-phu.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-danh-muc/probes/cham-tap-test.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/cham-tap-test.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-danh-muc/probes/doc-bu.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/doc-bu.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (không eval nào chạy quá một lần).

## Iterations

Round 1: E1, E2, E3 đỏ (probe ham-gan dừng ở một đột biến không tìm thấy chuỗi gốc, dù 75 ca ma trận xanh), E7 đỏ (bước gắn chạy lại trên DB có 117 vẫn chèn 212 dòng thay vì không đổi gì), E9 đỏ (nhóm n2 hụt ngưỡng, cận dưới Wilson 0,9361); lệnh suite pipeline_a quá hạn 30 phút nên BLOCKED. Trả về triển khai.
