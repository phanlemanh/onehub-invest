---
schema_version: 2
feature_slug: phuong-tu-du-an-chay-that
verdict: BLOCKED
failed_evals: ["E7"]
reason: "Lệnh `node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'` chạy quá 30 phút chưa xong (khai long_running: 30 cho eval trong evals.yaml, không có khai báo riêng cho pipeline_b, mặc định 30 phút). Không phải bị công cụ giết; tiến trình nền đã được dừng sau ngưỡng."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 94b9b9353b68eb3fba906b6f7346c3ddf92a3652
human_signoff:
---

# Evidence Report: phuong-tu-du-an-chay-that

Vòng 2. Verdict BLOCKED: suite pipeline_b không có kết quả vì quá ngưỡng thời gian; E7 chạy xong nhưng lệch số đo. Các lệnh suite app_ui và pipeline_a thoát khác 0, không gắn eval nào (xem mục Lệnh suite).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | FAIL |
| E8 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-phuong-tu-du-an-chay-that-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: scripts/phuong-tu-du-an-chuoi.test.mjs
  verified_at: 2026-11-20T05:29:47Z
  output: |
    ℹ duration_ms 6232.324958

- eval: E2
  run_id: minted-phuong-tu-du-an-chay-that-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-20T05:29:47Z
  output: |
    ok   chot-luot-dau: đạt

- eval: E3
  run_id: minted-phuong-tu-du-an-chay-that-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-20T05:29:47Z
  output: |
    ok   chay-lai: đạt

- eval: E4
  run_id: minted-phuong-tu-du-an-chay-that-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-20T05:29:47Z
  output: |
    ok   tin-moi: đạt

- eval: E5
  run_id: minted-phuong-tu-du-an-chay-that-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-20T05:29:47Z
  output: |
    ok   ma-tran: đạt

- eval: E6
  run_id: minted-phuong-tu-du-an-chay-that-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-20T05:29:47Z
  output: |
    ok   ap-lui: đạt

- eval: E7
  run_id: minted-phuong-tu-du-an-chay-that-E7-r2
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-20T05:29:47Z
  output: |
    toàn kho: 78/7795 → 7517/7795 · cửa sổ 13–19/11: 21/1659 → 1554/1659
    giây lượt đầu: 118.2 · giây lượt lặp: 3.3
    ok   lượt lặp không có gì mới xong trong 60 giây (3.3 giây)
    ok   so-chay-thu.md có mốc đo dạng ISO (yyyy-mm-ddThh:mmZ)
    ok   so-chay-thu.md đủ số: tử 78 → 7409, mẫu 7657, cửa sổ 21 → 1539/1641, giây 94.9
    FAIL tử số, mẫu số ghi (78 → 7409/7657) khớp phép đo trên bản chép (78 → 7517/7795)
    FAIL cửa sổ 13–19/11 ghi (21 → 1539/1641) khớp phép đo (21 → 1554/1659)
    ok   giây lượt đầu ghi 94.9 cùng cỡ phép đo 118.2
    FAIL 2 chỗ (thoi-gian)

- eval: E8
  run_id: minted-phuong-tu-du-an-chay-that-E8-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.scripts
  verified_at: 2026-11-20T05:29:47Z
  output: |
    ℹ duration_ms 1365123.889834

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-20T05:29:47Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-20T05:29:47Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 1
  verified_at: 2026-11-20T05:29:47Z
  note: không gắn eval nào. Hai ca đỏ trong đuôi đầu ra, đều đo trên DB máy thu: ops-nhan-ma-nguon-cloud (dựng lược đồ cloud, push-ops-facts thoát khác 0, in «FACTS CHẶN») và «E4b đối chiếu DB máy thu» (tin mang định danh không đọc lại được qua đường công khai, tin-rao-doi-chieu.test.tsx:95).

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-test_a-r2
  exit_code: 1
  verified_at: 2026-11-20T05:29:47Z
  note: không gắn eval nào. Ca đỏ NT2-AC-10 (bản tin dựng từ log và cấu hình thật, chế độ khô) báo «FACTS CHẶN [tầng A]» ở nhóm S16 trong blocks.dataFlow.windows.7d.groups (soat-tang-a.test.mjs:185), cùng một ca đỏ ở dòng 167.

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-test_b-r2
  exit_code: 1
  verified_at: 2026-11-20T05:29:47Z
  note: không có kết quả. Lệnh bị chuyển sang nền sau 600 giây, đến phút 31:18 vẫn chưa in dòng thoát, tệp đầu ra rỗng suốt quá trình; vượt ngưỡng 30 phút nên đã dừng. Đây là BLOCKED, không phải kết luận đỏ hay xanh.

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-20T05:29:47Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-20T05:29:47Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc không đo được baseline (xem dưới); không eval nào xanh cả hai phía.

Baseline không đo
- node --test scripts/phuong-tu-du-an-chuoi.test.mjs: bo qua baseline: tep scripts/phuong-tu-du-an-chuoi.test.mjs co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh chot-luot-dau: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh chay-lai: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh tin-moi: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh ma-tran: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh ap-lui: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh thoi-gian: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định).

## Iterations

Round 1: lịch sử vòng 1 nằm ở các commit trước (round 1 chỉnh phép đo AC-3/5/6/7 và kê tệp test vào PL34-AC-4).
Round 2: BLOCKED — E7 đỏ vì so-chay-thu.md ghi tử số, mẫu số (78 → 7409/7657) và cửa sổ 13–19/11 (21 → 1539/1641) lệch số đo trên bản chép (78 → 7517/7795; 21 → 1554/1659); suite pipeline_b quá 30 phút chưa xong; suite app_ui và pipeline_a đỏ trên DB máy thu, không gắn eval. Trả về triển khai: cập nhật số trong so-chay-thu.md theo phép đo hiện tại, chạy lại pipeline_b với thời hạn dài hơn.
