---
schema_version: 2
feature_slug: s17-bo-thu-mo-rong
verdict: REJECT
failed_evals: ["E1","E2","E3","E4","E5","E6","E8"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f4587ba7cab83b77e9907a4ee9ea2aadcdc052fd
human_signoff:
---

# Evidence Report: s17-bo-thu-mo-rong (round 2)

Một lệnh gộp phủ E1–E6 và E8 thoát mã khác 0. Chuỗi lệnh dừng ở probe `dot-bien.sh` sau khi build, 280 ca test xanh và kiểm phạm vi nhánh đều qua. Probe in hai dòng FAIL: số ca (280, khoá ghi 263) và có cờ `--bo-doc-so-du` trong `collector/src`. Cả bảy eval cùng dùng lệnh này nên cùng bị REJECT. Lệnh không bị công cụ giết, và không sửa code hay đổi nhánh.

Các dòng PASS của từng chiều đỏ (E1–E6) vẫn có trong output. Chúng chỉ chứng minh từng ghim riêng lẻ. Chúng không cứu được lệnh tổng vì chuỗi `&&` kết thúc bằng exit khác 0.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | FAIL |
| E2 | AC-2 | test | FAIL |
| E3 | AC-3 | test | FAIL |
| E4 | AC-4 | test | FAIL |
| E5 | AC-5 | test | FAIL |
| E6 | AC-6 | test | FAIL |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | FAIL |

## Evidence

- eval: E1
  run_id: bxd0wlb4q
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.zc21_s17
  verified_at: 2026-11-26T13:43:11Z
  output: |
    Lệnh gộp dừng ở probe dot-bien.sh. Dòng liên quan AC-1 trong output:
    PASS bo-bat-buoc-tran-loi → ĐỎ 2 ca, gồm «parseCli: thiếu trần lời gọi hoặc trần thời gian thì từ chối…»
    Lệnh tổng không sạch vì hai dòng FAIL của probe (xem E8).

- eval: E2
  run_id: bxd0wlb4q
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.zc21_s17
  verified_at: 2026-11-26T13:43:11Z
  output: |
    PASS bo-dung-khi-403 → ĐỎ 7 ca, gồm «403: dừng cả lượt, mọi lời sau không gửi nữa…»
    PASS bo-dung-han-khi-chan-hai-lan → ĐỎ 2 ca, gồm «tăng tốc: bị chặn hai lần thì dừng hẳn…»
    Lệnh tổng không sạch vì hai dòng FAIL của probe (xem E8). Chiều đỏ khai «ĐỎ 1 ca» nhưng probe đo 2 ca.

- eval: E3
  run_id: bxd0wlb4q
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.zc21_s17
  verified_at: 2026-11-26T13:43:11Z
  output: |
    PASS khoa-phien-bo-another-run → ĐỎ 2 ca, gồm «khoá chung mọi pha cần phiên: một lúc chỉ một pha giữ khoá…»
    Lệnh tổng không sạch vì hai dòng FAIL của probe (xem E8).

- eval: E4
  run_id: bxd0wlb4q
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.zc21_s17
  verified_at: 2026-11-26T13:43:11Z
  output: |
    PASS bo-dung-khi-so-du-giam → ĐỎ 2 ca, gồm «số dư giảm…»
    Lệnh tổng không sạch vì hai dòng FAIL của probe (xem E8).

- eval: E5
  run_id: bxd0wlb4q
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.zc21_s17
  verified_at: 2026-11-26T13:43:11Z
  output: |
    PASS bo-chan-dia-chi-noi-bo → ĐỎ 2 ca, gồm «diaChiNoiBo: IPv4 dải riêng…»
    PASS loi-may-chu-thanh-vinh-vien → ĐỎ 1 ca, gồm «pha ảnh máy chủ nguồn: lỗi cấp máy chủ…»
    Lệnh tổng không sạch vì hai dòng FAIL của probe (xem E8).

- eval: E6
  run_id: bxd0wlb4q
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.zc21_s17
  verified_at: 2026-11-26T13:43:11Z
  output: |
    PASS ghi-tien-do-khi-lo-chua-chot → ĐỎ 7 ca, gồm «projects: chỉ lưu trạng thái khi snapshot đã chốt…»
    PASS bo-kiem-tep-dung → ĐỎ 4 ca, gồm «tệp DUNG xuất hiện giữa lượt…»
    Lệnh tổng không sạch vì hai dòng FAIL của probe (xem E8).

- eval: E7
  run_id: minted-s17-bo-thu-mo-rong-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc21_tang_a
  verified_at: 2026-11-26T13:43:11Z
  output: |
    TANG-A OK

- eval: E8
  run_id: bxd0wlb4q
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.zc21_s17
  verified_at: 2026-11-26T13:43:11Z
  output: |
    ℹ tests 280
    ℹ pass 280
    ℹ fail 0
    ℹ skipped 0
    ℹ todo 0
    FAIL bản lành: mã 0, tests 280 (khoá 263), fail 0, skipped 0, todo 0
    PASS 23 ca nêu tên trong evals chạy xanh
    PASS phạm vi nhánh: mọi tệp đổi nằm trong danh sách trắng
    FAIL có cờ --bo-doc-so-du trong collector/src (commit 4d026c6d2 ngoài phạm vi)
  Nguyên nhân: số ca thực 280 lệch khoá SO_CA 263, và cờ --bo-doc-so-du hiện diện trong collector/src.

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T13:43:11Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T13:43:11Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-26T13:43:11Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-26T13:43:11Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-26T13:43:11Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-test_that-r2
  exit_code: 0
  verified_at: 2026-11-26T13:43:11Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T13:43:11Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T13:43:11Z

Lệnh fail không gắn eval: không có. Lệnh gộp duy nhất bị fail gắn đủ E1, E2, E3, E4, E5, E6, E8.

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không (280/280 xanh; lệnh eval thoát 1 do hai dòng FAIL của probe dot-bien.sh)

Ghi chú phiên chấm M5 (r2): hai dòng FAIL là thước probe chưa theo kịp đầu vào đã tích hợp (quyết định d-20261126T132356Z-13): `SO_CA=263` trong khi bộ nay 280 ca (LL báo 280/280), và kiểm «vắng cờ --bo-doc-so-du» trong khi commit 4d026c6d2 mang cờ đó đã được đưa vào. 9/9 đột biến bị bắt; ba ca fetchGhim/DNS-rebinding của AC-5 xanh. Năm finding trong hợp đồng của r1 có bản sửa trong mã (pha-can-ho.ts:149 ghi trang sau khi quét xong; exec.test.ts ca «bị chặn HAI LẦN THẬT» đi đường cộng dồn; client.ts `stopped ??=`; mo-rong.test.ts so sha256 với byte; fetchGhim ghim địa chỉ) và review r2 không xác nhận finding mới.

## Known limits

## Ngoài hợp đồng

## Analyst

carried từ round 1 — baseline không đo lại round này.

Eval không-phân-biệt: không có. Lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — không eval nào chạy nhiều lần (mọi eval runs: 1, không có phương sai).

## Judge panels

Không có panel judge nào được đề xuất cho round này. Mọi eval là máy (test/script) nên không có judgment item. human_override để trống.

## Iterations

Round 1: lịch sử round cũ không được chép lại trong lượt này.
Round 2: E1, E2, E3, E4, E5, E6, E8 fail vì lệnh gộp thoát khác 0 ở probe dot-bien.sh. Cụ thể số ca thực 280 lệch khoá 263, và cờ --bo-doc-so-du còn trong collector/src (commit 4d026c6d2 ngoài phạm vi). E7 đạt. Trả về triển khai.
