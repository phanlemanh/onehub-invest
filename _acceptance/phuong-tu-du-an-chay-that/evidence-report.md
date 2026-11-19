---
schema_version: 2
feature_slug: phuong-tu-du-an-chay-that
verdict: BLOCKED
failed_evals: ["E5","E8"]
reason: "bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh ap-lui (E6): vuot thoi luong khai (long_running) — lenh cho tra __QUA_HAN, chua co dong __EXIT=. Chay lai voi tool timeout dai hon, khong phai loi code."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d09b0c1018eeea45ebce2e89a434936e6f7f09e1
human_signoff:
---

# Evidence Report: phuong-tu-du-an-chay-that

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | FAIL |
| E6 | AC-6 | script | BLOCKED |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | FAIL |

## Evidence

- eval: E1
  run_id: minted-phuong-tu-du-an-chay-that-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: scripts/phuong-tu-du-an-chuoi.test.mjs
  verified_at: 2026-11-19T19:46:44Z
  output: |
    ℹ duration_ms 17833.241875

- eval: E2
  run_id: minted-phuong-tu-du-an-chay-that-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-19T19:46:44Z
  output: |
    ok   chot-luot-dau: đạt

- eval: E3
  run_id: minted-phuong-tu-du-an-chay-that-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-19T19:46:44Z
  output: |
    ok   chay-lai: đạt

- eval: E4
  run_id: minted-phuong-tu-du-an-chay-that-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-19T19:46:44Z
  output: |
    ok   tin-moi: đạt

- eval: E5
  run_id: minted-phuong-tu-du-an-chay-that-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-19T19:46:44Z
  output: |
    ok   ô tinh-nhieuduan-theco: 0 tin, kết quả giu-nguyen-cot
    ok   ô trong-nhieuduan-theco: 0 tin, kết quả giu-nguyen-cot
    ok   số phép kiểm bằng số ô (13/13)
    tin đổi tỉnh: 10
    FAIL so-chay-thu.md liệt kê đủ 10 tin đổi tỉnh — thiếu offer_0ea3df84560c1949
    FAIL 1 chỗ (ma-tran)

- eval: E6
  run_id: minted-phuong-tu-du-an-chay-that-E6-r1
  exit_code: n-a (quá hạn, chưa có dòng kết thúc của lệnh)
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-19T19:46:44Z
  output: |
    ok   đối chứng: lượt ghi làm đổi cột tin S03
    ok   sau khi lùi và chạy lại chuỗi: phát biểu sống của luật về 0 (được 0)
    ok   sau khi lùi và chạy lại chuỗi: băm area_id của tin S03 bằng trước khi áp
    __QUA_HAN (công cụ cắt lệnh trước dòng tổng kết)

- eval: E7
  run_id: minted-phuong-tu-du-an-chay-that-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-19T19:46:44Z
  output: |
    ok   thoi-gian: đạt

- eval: E8
  run_id: minted-phuong-tu-du-an-chay-that-E8-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.scripts
  verified_at: 2026-11-19T19:46:44Z
  output: |
    PL34-AC-4 tập tệp: mọi tệp test nhắc zalo-import-daily đúng bằng mười một tệp kê trước
    AssertionError: số tệp thực 12, số tệp kê trước 11
    (scripts/zalo-import-job.test.mjs:353; scripts/zalo-import-job-lan.test.mjs:71 cũng đỏ cùng nguyên nhân)

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-19T19:46:44Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-19T19:46:44Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-19T19:46:44Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-19T19:46:44Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-test_b-r1
  exit_code: 1
  verified_at: 2026-11-19T19:46:44Z
  output: |
    599 test, 597 đạt, 1 đỏ, 1 bỏ qua
    NH-AC-10 chạy hằng đêm: scripts/zalo-import-daily.sh: bước media phải đứng ngay sau transform-zalo

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-19T19:46:44Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-19T19:46:44Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều đỏ trên baseline hoặc là eval mới (không có eval nào xanh cả hai phía).

Lệnh đỏ không gắn eval: `node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'` (1 ca đỏ: NH-AC-10, bước media phải đứng ngay sau transform-zalo trong zalo-import-daily.sh; cùng gốc với E8 là thứ tự bước trong zalo-import-daily.sh sau khi chèn bước phường). Lệnh `node --test scripts/*.test.mjs` đỏ gắn E8. Lệnh `bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh ma-tran` đỏ gắn E5.

Lệnh bị chặn: `bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh ap-lui` (E6) vượt thời lượng khai (long_running), lệnh chỉ trả __QUA_HAN, chưa có dòng __EXIT. Cách xử lý: chạy lại với tool timeout dài hơn.

Baseline không đo:
- node --test scripts/phuong-tu-du-an-chuoi.test.mjs: bo qua baseline: tep scripts/phuong-tu-du-an-chuoi.test.mjs co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh chot-luot-dau: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh chay-lai: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh tin-moi: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh ma-tran: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh ap-lui: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh thoi-gian: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy nhiều lần đều đồng nhất (mọi eval chạy một lần).

## Iterations

Round 1: E5 và E8 đỏ, E6 bị chặn (quá hạn, cần chạy lại với timeout dài hơn). E5: so-chay-thu.md thiếu offer_0ea3df84560c1949 trong danh sách 10 tin đổi tỉnh. E8: PL34-AC-4 đếm 12 tệp test nhắc zalo-import-daily thay vì 11 đã kê, kèm NH-AC-10 ở pipeline_b về thứ tự bước media sau transform-zalo. Trả về cho khâu triển khai.
