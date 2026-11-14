---
schema_version: 2
feature_slug: s06-tran-trang
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e8dec6d91e7551b7939e82cf324920ef43409100
human_signoff: Mạnh 2026-11-14
---

# Evidence Report: s06-tran-trang

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | judgment | PASS |
| E5 | AC-5 | test | PASS |

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline):
- E3 (`cd pipeline && node --test scripts/chia-nua.test.mjs`): xanh trên cả hai phía, giữ làm regression-guard có chủ ý cho việc xếp test vào hai nửa.

Baseline không đo:
- node --test _acceptance/s06-tran-trang/probes/tran-mac-dinh.test.mjs: bo qua baseline: tep _acceptance/s06-tran-trang/probes/tran-mac-dinh.test.mjs co o cay dang kiem nhung chua co o merge-base b8953e89d25e344a5a1e86fe50cb99c5a2e553dd — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_s06tt_chan --chay node --test pipeline/scripts/collect-chotot-chan.test.mjs: bo qua baseline: tep pipeline/scripts/collect-chotot-chan.test.mjs co o cay dang kiem nhung chua co o merge-base b8953e89d25e344a5a1e86fe50cb99c5a2e553dd — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_s06tt_region --chay node --test _acceptance/s06-tran-trang/probes/nap-thieu-region.test.mjs: bo qua baseline: tep _acceptance/s06-tran-trang/probes/nap-thieu-region.test.mjs co o cay dang kiem nhung chua co o merge-base b8953e89d25e344a5a1e86fe50cb99c5a2e553dd — eval moi, chay tren code cu khong phan biet gi

## Evidence

- eval: E1
  run_id: minted-s06-tran-trang-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tt_tran
  verified_at: 2026-11-14T10:11:17Z
  output: |
    node --test _acceptance/s06-tran-trang/probes/tran-mac-dinh.test.mjs
    ℹ duration_ms 78.410958

- eval: E2
  run_id: minted-s06-tran-trang-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tt_chan
  verified_at: 2026-11-14T10:11:17Z
  output: |
    bash db/db-thu.sh oneinvest_suite_s06tt_chan --chay node --test pipeline/scripts/collect-chotot-chan.test.mjs
    ℹ duration_ms 1633.950875

- eval: E3
  run_id: minted-s06-tran-trang-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.s06tt_chia
  verified_at: 2026-11-14T10:11:17Z
  output: |
    cd pipeline && node --test scripts/chia-nua.test.mjs
    ℹ duration_ms 81.913625

- eval: E4
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment)
  verdict: PASS
  rationale: Tệp số đo có đủ bước thu theo manifest, từng bước nạp của hai lượt, tải máy, giờ bắt đầu và giờ kết thúc dự kiến đặt cạnh cửa S03, và kết luận dựa trên số. Phần resolve-properties được khai rõ là ước lượng.
  human_override:  # chi nguoi ghi

- eval: E5
  run_id: minted-s06-tran-trang-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tt_region
  verified_at: 2026-11-14T10:11:17Z
  output: |
    bash db/db-thu.sh oneinvest_suite_s06tt_region --chay node --test _acceptance/s06-tran-trang/probes/nap-thieu-region.test.mjs
    ℹ duration_ms 4243.156125

### Hội đồng chấm E4 (đề xuất PASS, human_override để trống)

- domain-correctness: PASS — Tệp số đo có đủ các mục câu hỏi đòi: thời gian bước thu từ manifest, từng bước nạp (import, transform, reassign-areas, 300+400) cho cả hai lượt 16 nghìn và 55 nghìn, tải máy và việc chạy cùng. resolve-properties được ghi là ước lượng ngoại suy từ hộp 20 phút, tăng 8–15%, mức sai ghi là «lớn» kèm khoảng dao động 85 phút đến hơn 4 giờ. Có giờ bắt đầu theo lịch (07:00Z, 22:30Z) và giờ kết thúc dự kiến (khoảng 09:15Z đến 12:25Z, ca xấu 12:30–13:00Z) đặt cạnh cửa S03 16:55Z. Kết luận là không lấn cửa, hai lượt không chồng, đề xuất giữ giờ. Các con số khớp nhau.
- operational-feasibility: PASS — Bước thu từ manifest của hai lượt (10′35″ và 36′25″), thời gian các bước nạp, tải máy và việc chạy cùng đều có. resolve-properties ghi rõ là ước lượng (+8–15%, dải 85 phút tới hơn 4 giờ, mức sai «lớn»). Có giờ bắt đầu, giờ kết thúc dự kiến và kết luận không lấn cửa S03 16:55Z–17:15Z. Hai điểm yếu nhỏ đã khai thẳng trong tệp: tốc độ cụm/phút không đo được từ hộp 20 phút, và mức sai chỉ nêu bằng dải.
- spec-alignment: PASS — Tệp ghi đủ các mục AC-4 hỏi: bước thu theo manifest, từng bước nạp của hai lượt, tải máy, việc chạy cùng, resolve-properties là ước lượng (+8–15%) với mức sai «lớn», lịch 07:00Z, giờ kết thúc dự kiến 09:15Z–12:25Z đặt cạnh cửa S03 16:55Z, và đề xuất giữ giờ. Điểm lệch nhỏ: hộp 20 phút không đo được tốc độ cụm nên ngoại suy theo cỡ bảng; tệp đã nói rõ nên không làm sai tiêu chí.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s06-tran-trang-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-14T10:11:17Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s06-tran-trang-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-14T10:11:17Z

- cmd: cd app && npm test
  run_id: minted-s06-tran-trang-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-14T10:11:17Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-s06-tran-trang-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-14T10:11:17Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-s06-tran-trang-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-14T10:11:17Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s06-tran-trang-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-14T10:11:17Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s06-tran-trang-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-14T10:11:17Z

## Known limits

## Ngoài hợp đồng

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval xanh (E1, E2, E3, E5 máy; E4 judgment PASS) — verdict PASS.
