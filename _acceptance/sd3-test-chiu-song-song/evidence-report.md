---
schema_version: 2
feature_slug: sd3-test-chiu-song-song
verdict: REJECT
failed_evals: [E1]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2aebe70e5381fe878df42afe775310be7b0965c9
human_signoff:
---

# Evidence Report: sd3-test-chiu-song-song

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | FAIL |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-sd3-test-chiu-song-song-E1-r1
  result: thất bại (probe không in 'CHAN OK')
  baseline: n-a
  verifier: config:executors.script.sts_chan
  verified_at: 2026-11-01T00:52:40Z
  output: |
    error: canceling statement due to lock timeout (mã lỗi 55P03)
    at async moChan (_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs:68:5)
    at async song-song.mjs:77:13
    Phiên chặn B không lấy được khoá ACCESS EXCLUSIVE trong hạn lock_timeout 3 s nên probe sập trước khi đo test.

- eval: E2
  run_id: minted-sd3-test-chiu-song-song-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sts_khoa
  verified_at: 2026-11-01T00:52:40Z
  output: |
    KHOA OK

- eval: E3
  run_id: minted-sd3-test-chiu-song-song-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sts_assert
  verified_at: 2026-11-01T00:52:40Z
  output: |
    ASSERT OK

- eval: E4
  run_id: minted-sd3-test-chiu-song-song-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sts_pham_vi
  verified_at: 2026-11-01T00:52:40Z
  output: |
    PHAM VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sd3-test-chiu-song-song-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-01T00:52:40Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sd3-test-chiu-song-song-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-01T00:52:40Z

- cmd: cd app && npm test
  run_id: minted-sd3-test-chiu-song-song-SUITE-npm_test__bd9a35-r1
  result: thất bại, không gắn eval nào
  verified_at: 2026-11-01T00:52:40Z
  note: |
    Ca tests/the-duyet-du-can-cu.test.tsx dừng ở bước dọn (after) với lỗi "public đã bị chạm".
    Số dòng properties và property_offers ở DB lệch so với lúc đầu (properties 29841 so với 29828, property_offers 32815 so với 32799).
    Lệch này không thuộc tệp feature đổi, nhiều khả năng do tiến trình khác ghi vào DB dùng chung khi chạy. Chưa kiểm chứng nguyên nhân; cần chạy lại khi DB yên.

- cmd: cd pipeline && npm test
  run_id: minted-sd3-test-chiu-song-song-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-01T00:52:40Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sd3-test-chiu-song-song-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-01T00:52:40Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sd3-test-chiu-song-song-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-01T00:52:40Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Lưu ý: không eval nào đo được baseline (xem dưới), nên câu trên chỉ là "không có eval nào bị phát hiện xanh cả hai phía", không phải bằng chứng phân biệt.

Lệnh fail không gắn eval: `cd app && npm test` (xem khối suite ở trên).

Baseline khong do
- node _acceptance/sd3-test-chiu-song-song/probes/song-song.mjs chan: bo qua baseline: tep _acceptance/sd3-test-chiu-song-song/probes/song-song.mjs co o cay dang kiem nhung chua co o merge-base a686c72a05350151fe3654ce1cb9c3ed6e6016ff — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/sd3-test-chiu-song-song/probes/song-song.mjs khoa: bo qua baseline: tep _acceptance/sd3-test-chiu-song-song/probes/song-song.mjs co o cay dang kiem nhung chua co o merge-base a686c72a05350151fe3654ce1cb9c3ed6e6016ff — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/sd3-test-chiu-song-song/probes/song-song.mjs assert: bo qua baseline: tep _acceptance/sd3-test-chiu-song-song/probes/song-song.mjs co o cay dang kiem nhung chua co o merge-base a686c72a05350151fe3654ce1cb9c3ed6e6016ff — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/sd3-test-chiu-song-song/probes/pham-vi.sh: bo qua baseline: tep _acceptance/sd3-test-chiu-song-song/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base a686c72a05350151fe3654ce1cb9c3ed6e6016ff — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1 failed — probe chan: phiên chặn B hết hạn lock_timeout 3 s khi xin ACCESS EXCLUSIVE trên public.sale_offer_records / public.registry_aliases (lỗi 55P03 ở moChan). Returned to implementation.
