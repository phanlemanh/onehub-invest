---
schema_version: 2
feature_slug: yeu-cau-khong-thanh-tin-thue
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3c1fe5acdf08088df7f0d66348016453ebd07460
human_signoff:
---

# Evidence Report: yeu-cau-khong-thanh-tin-thue

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | judgment | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pl42_unit
  verified_at: 2026-11-26T17:54:10Z
  output: |
    node --test pipeline/scripts/yeu-cau-khong-thanh-tin-thue.test.mjs
    ℹ duration_ms 112.116417

- eval: E2
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pl42_unit
  verified_at: 2026-11-26T17:54:10Z
  output: |
    node --test pipeline/scripts/yeu-cau-khong-thanh-tin-thue.test.mjs
    ℹ duration_ms 112.116417

- eval: E3
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pl42_unit
  verified_at: 2026-11-26T17:54:10Z
  output: |
    node --test pipeline/scripts/yeu-cau-khong-thanh-tin-thue.test.mjs
    ℹ duration_ms 112.116417

- eval: E4
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pl42_ac4
  verified_at: 2026-11-26T17:54:10Z
  output: |
    ca PL42-AC-4 trên DB riêng của lượt (oneinvest_suite_pl42)
    ℹ duration_ms 48121.225416

- eval: E5
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl42_do_that
  verified_at: 2026-11-26T17:54:10Z
  output: |
    do-yeu-cau-lot-tin.test.mjs xanh, rồi do-yeu-cau-lot-tin.mjs --kiem trên bản chép (oneinvest_suite_pl42_that)
    KẾT: đạt

- eval: E7
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E7-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pl42_loai_tin
  verified_at: 2026-11-26T17:54:10Z
  output: |
    git diff rỗng so với origin/main cho hai tệp test loại tin; hai tệp xanh
    ℹ duration_ms 488963.045209

- eval: E8
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E8-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T17:54:10Z
  output: |
    nửa a bộ pipeline
    ℹ duration_ms 206839.155375

- eval: E9
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E9-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T17:54:10Z
  output: |
    nửa b bộ pipeline
    ℹ duration_ms 116629.379333

- eval: E10
  run_id: r2-l7-1-20261126175410
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T17:54:10Z
  output: |
    suite ca dữ liệu thật trên bản chép (pipeline_that)
    ℹ duration_ms 2324876.255292

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-yeu-cau-khong-thanh-tin-thue-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T17:54:10Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-yeu-cau-khong-thanh-tin-thue-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T17:54:10Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-yeu-cau-khong-thanh-tin-thue-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-26T17:54:10Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-yeu-cau-khong-thanh-tin-thue-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T17:54:10Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-yeu-cau-khong-thanh-tin-thue-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T17:54:10Z

### Judgment

- eval: E6
  judged_by: judge panel (fresh context), đề xuất PASS
  Phiếu của hội đồng:
  - domain-correctness: PASS — Cả 25 bài trong tệp mẫu đều là câu tìm căn của khách thuê (cụm «Tìm», «Cần», «Khách thuê/chốt liền», «Xem liền», «ac có gửi em» kèm giá mong muốn). Không bài nào nêu một căn cụ thể đang cho thuê hay bán. 5 bài Haiku gắn nhãn offer cũng chỉ là bài tìm căn nên việc đổi sang Yêu cầu là đúng.
  - operational-feasibility: PASS — 20 bài ngẫu nhiên mở đầu bằng «Tìm», «Cần» hoặc «Khách tìm/thuê»; 5 bài nhãn offer có dấu hiệu người tìm («Ac có gửi em», «Khách chốt liền», «Khách sale… tìm stu», «Xem liền… lấy BE»). Không có mã tin nào là tin rao thật.
  - spec-alignment: PASS — Đọc cả 25 bài (5 offer, 20 chưa nhãn); bài nào cũng là câu của người cần thuê. Bài offer_507951f2f67f23de có «Khách sale» và «giá mềm» nhưng cả ba mục trong bài đều là nhu cầu tìm căn.
  human_override:  # chi nguoi ghi

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5: vòng 2 chạy lại đủ 10 eval (carry không dùng được: run-log vòng 1 lẫn hai sha). Contract ở «verified» từ vòng 1 khi P3 sửa mã; giữ verified. E10 (pipeline_that) chạy lại ở 3c1fe5acd: tests 37, pass 37, fail 0, skipped 0; dòng «chay-that: vai may-phat-trien — bỏ qua 1 ca chỉ máy thu»; tập bỏ qua bằng đúng tập may_thu → ĐẠT theo luật GS 26/11. Chấm trên M5: ON22-AC-10 không chạy (HT33). evidence/m5-pipeline-that.txt đã thay bằng đầu ra của lượt này (đóng finding t1 «bằng chứng E10 chạy trước lần sửa regex»).

Soi tay của phiên chấm M5 (suyLoai(parsePost(t), t, "ca-hai") trên 3c1fe5acd, so bản 06ab5cb08):
- Yêu cầu thật vẫn giữ: «Em tìm gấp phòng studio … dưới 6tr», «Mình đang tìm gấp căn 2pn …», «Em tìm được căn nào 1pn dưới 7tr gửi em với», «Em cần tìm gấp căn hộ 2pn …» → yeu-cau.
- Finding AC-2 vòng 1 đóng: «Em tìm gấp khách thuê căn 2pn 8tr», «Em tìm được khách rồi, còn 1 căn 2pn 8tr», «Mình đang tìm gấp người thuê căn 1pn 6tr», «E tìm được người thuê nhanh, … 9tr ib» → rent_lt/don-vi-gia.
- Đổi do phép loại trừ mới: «Em tìm gấp người ở ghép phòng 3tr» yeu-cau → bo (câu tìm người ở ghép; nhập nhằng, không tính là nuốt Yêu cầu tìm căn).
- Có từ trước, không do vòng này: «Mình tìm (gấp) người cho thuê lại căn 1pn», «Em tìm được người cho thuê căn 2pn chưa ạ» → rent_lt/chu-bai ở cả hai bản (người tìm chủ cho thuê bị coi là tin rao).

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc là eval mới không đo được baseline; không eval nào xanh cả hai phía.

Baseline khong do
- node --test pipeline/scripts/yeu-cau-khong-thanh-tin-thue.test.mjs: bo qua baseline: tep pipeline/scripts/yeu-cau-khong-thanh-tin-thue.test.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- set -o pipefail; cd pipeline && bash ../db/db-thu.sh oneinvest_suite_pl42 --chay node --test --test-name-pattern 'PL42-AC-4' scripts/yeu-cau-khong-thanh-tin-thue.itest.mjs 2>&1 | awk '{print > "/dev/stderr"} /^ℹ pass /{p=$3} /^ℹ fail /{f=$3} /^ℹ skipped /{s=$3} END{exit !(p>=1 && f==0 && s==0)}': bo qua baseline: tep pipeline/scripts/yeu-cau-khong-thanh-tin-thue.itest.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node --test scripts/do-yeu-cau-lot-tin.test.mjs && bash ../db/db-thu.sh oneinvest_suite_pl42_that --chay node scripts/do-yeu-cau-lot-tin.mjs --kiem: bo qua baseline: tep pipeline/scripts/do-yeu-cau-lot-tin.test.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that': baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — mọi eval nhiều lần chạy đều đồng đều (không eval nào có runs lớn hơn 1).

## Iterations

Round 1: E10 BLOCKED — suite pipeline_that vượt trần 30 phút của công cụ (khai long_running 90 theo khuôn HT9 E3a). Trả lại để khai lại eval.
Round 2: toàn bộ eval PASS, E6 do hội đồng đề xuất PASS.
