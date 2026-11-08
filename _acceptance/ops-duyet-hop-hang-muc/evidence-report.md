---
schema_version: 2
feature_slug: ops-duyet-hop-hang-muc
verdict: REJECT
failed_evals: [E1, E2, E3, E4, E5, E6, E7]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 17ef5e1da66c64c8df1698873a06f80a02ed2276
human_signoff:
---

# Evidence Report: ops-duyet-hop-hang-muc

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | FAIL |
| E2 | AC-2 | test | FAIL |
| E3 | AC-3 | test | FAIL |
| E4 | AC-4 | test | FAIL |
| E5 | AC-5 | test | FAIL |
| E6 | AC-6 | test | FAIL |
| E7 | AC-7 | test | FAIL |
| E8 | AC-3 | ui-check | PASS |
| E9 | AC-4 | test | PASS |
| E10 | AC-2 | test | PASS |
| E11 | AC-2 | script | PASS |

Ghi chú nguyên nhân: E1–E7 cùng chạy qua lệnh `cd app && npm test` (1069 phép thử, 1062 đạt, 2 hỏng, 5 bỏ qua). Lệnh thoát khác 0 vì hai phép thử hỏng nằm ngoài các tệp của tính năng này: `tests/s03-len-cong.test.tsx` (SL1-AC-8) và `tests/the-duyet-phuong-lech-gia.test.tsx` (TPL-AC-6, probe DB máy thu: van-lang-02143 và Phường Văn Lang cùng phường mà báo lệch). Vì lệnh gộp một mã thoát cho cả bảy eval, cả bảy eval bị tính hỏng. Ngoài ra `cd pipeline && npm test` cũng thoát khác 0 (PX1-AC-2 và PX1-AC-3 trong `scripts/nap-dvhc.test.mjs`), lệnh này không gắn eval nào.

## Evidence

- eval: E1
  run_id: minted-ops-duyet-hop-hang-muc-E1-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T11:56:42Z
  output: |
    tests 1069, pass 1062, fail 2, skipped 5 (lệnh gộp app npm test).
    Hai phép thử hỏng: SL1-AC-8 (s03-len-cong), TPL-AC-6 (the-duyet-phuong-lech-gia).

- eval: E2
  run_id: minted-ops-duyet-hop-hang-muc-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T11:56:42Z
  output: |
    tests 1069, pass 1062, fail 2, skipped 5 (lệnh gộp app npm test).

- eval: E3
  run_id: minted-ops-duyet-hop-hang-muc-E3-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T11:56:42Z
  output: |
    tests 1069, pass 1062, fail 2, skipped 5 (lệnh gộp app npm test).

- eval: E4
  run_id: minted-ops-duyet-hop-hang-muc-E4-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T11:56:42Z
  output: |
    tests 1069, pass 1062, fail 2, skipped 5 (lệnh gộp app npm test).

- eval: E5
  run_id: minted-ops-duyet-hop-hang-muc-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T11:56:42Z
  output: |
    tests 1069, pass 1062, fail 2, skipped 5 (lệnh gộp app npm test).

- eval: E6
  run_id: minted-ops-duyet-hop-hang-muc-E6-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T11:56:42Z
  output: |
    tests 1069, pass 1062, fail 2, skipped 5 (lệnh gộp app npm test).

- eval: E7
  run_id: minted-ops-duyet-hop-hang-muc-E7-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T11:56:42Z
  output: |
    tests 1069, pass 1062, fail 2, skipped 5 (lệnh gộp app npm test).

- eval: E8
  run_id: minted-ops-duyet-hop-hang-muc-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui_check
  verified_at: 2026-11-08T11:56:42Z
  screenshot: evidence/E8-step1.png
  observed: |
    step1: PageHeader 'Hàng duyệt' với ba chip 'Chờ duyệt 665', 'Quá 3 ngày 616', 'Đã quyết hôm nay 6'. step2: hộp Hạng mục 'Tất cả 665' cùng 7 mục kèm số chờ, cũ nhất, trung vị (Ghép căn 3 giây, Gộp Người 4 giây, mục khác '—'). step3: đầu sheet '1/25 · Gộp Người', nút K/J và biểu tượng phím tắt. step4: Dialog 'Phím tắt' liệt J/↓, K/↑, Esc, 1–4, R, ?. step5: sau '3' đầu sheet '1/23' thẻ kế #166531, toast 'Đã ghi #166527 · Hoãn' có 'Hoàn tác'. step6: hoàn tác về #166527 (1/24). step7: 'Quyết định gần đây' dòng đầu #166527 badge Hoãn, 'Lý do: Hoãn'. step8: 375 px tối, trang không cuộn ngang, hộp hạng mục cuộn ngang riêng.
  network_observed: n-a (driver)

- eval: E9
  run_id: minted-ops-duyet-hop-hang-muc-E9-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-11-08T11:56:42Z
  output: |
    tsc --noEmit sạch, npm run lint sạch.

- eval: E10
  run_id: minted-ops-duyet-hop-hang-muc-E10-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-11-08T11:56:42Z
  output: |
    route-slugs và routes-map xanh.

- eval: E11
  run_id: minted-ops-duyet-hop-hang-muc-E11-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.design.floor
  verified_at: 2026-11-08T11:56:42Z
  output: |
    design-floor-s4 sạch.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ops-duyet-hop-hang-muc-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-08T11:56:42Z

- cmd: cd pipeline && npm test
  run_id: bo85yf54l
  exit_code: 1
  verified_at: 2026-11-08T11:56:42Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ops-duyet-hop-hang-muc-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-08T11:56:42Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness chứ không phải tính năng):
- E10 (`cd app && npm run test:lint-rules`): regression-guard, không khẳng định hành vi mới.
- E11 (`design-floor-s4.mjs --root .`): regression-guard, không khẳng định hành vi mới.

Lệnh fail không gắn eval: `cd pipeline && npm test` (PX1-AC-2, PX1-AC-3 trong `pipeline/scripts/nap-dvhc.test.mjs`) thoát khác 0; không thuộc phạm vi tính năng này nhưng cần người xem trước khi gộp.

Hai phép thử hỏng của `cd app && npm test` (SL1-AC-8, TPL-AC-6) nằm ngoài tệp của tính năng; cần phân biệt lỗi môi trường DB máy thu với lỗi tính năng trước khi chạy lại vòng sau.

Baseline không đo:
- cd app && npm test: baseline vượt trần 180 giây/lệnh — đã dừng cả cây tiến trình; BLOCKED hạ tầng, không phải kết quả của code cũ

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần).

## Judge

Không có eval judgment nào trong hợp đồng này; không có panel giám khảo cần đề xuất và không có mục để người chốt.

## Iterations

Round 1: E1, E2, E3, E4, E5, E6, E7 hỏng — lệnh gộp app npm test có hai phép thử ngoài tính năng hỏng (SL1-AC-8, TPL-AC-6); pipeline npm test cũng hỏng (PX1-AC-2, PX1-AC-3). Trả về triển khai.
