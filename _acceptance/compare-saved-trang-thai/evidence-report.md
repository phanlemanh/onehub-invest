---
schema_version: 2
feature_slug: compare-saved-trang-thai
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b0e3d44a1c979f62836270752ff449eea19e2fc6
human_signoff:
---

# Evidence Report: compare-saved-trang-thai

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS (carry-forward từ round 2) |
| E2 | AC-1 | test | PASS (carry-forward từ round 1) |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | script | PASS (carry-forward từ round 2) |
| E5 | AC-4 | script | PASS (carry-forward từ round 2) |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | script | PASS (carry-forward từ round 2) |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | test | PASS (carry-forward từ round 1) |
| E11 | AC-8 | test | PASS |
| E12 | AC-9 | test | PASS (carry-forward từ round 1) |
| E13 | AC-9 | judgment | PASS (đề xuất của hội đồng, chờ người) |
| E14 | AC-10 | ui-check | PASS (carry-forward từ round 1) |
| E15 | AC-10 | script | PASS (carry-forward từ round 1) |
| E16 | AC-10 | script | PASS (carry-forward từ round 1) |
| E17 | AC-3 | test | PASS |
| E18 | AC-4 | test | PASS |
| E19 | AC-3 | test | PASS |
| E20 | AC-4 | test | PASS |

## Evidence

- eval: E3
  run_id: minted-compare-saved-trang-thai-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:21:53Z
  output: |
    ℹ duration_ms 10229.212

- eval: E6
  run_id: minted-compare-saved-trang-thai-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:21:53Z
  output: |
    ℹ duration_ms 10229.212

- eval: E7
  run_id: minted-compare-saved-trang-thai-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:21:53Z
  output: |
    ℹ duration_ms 10229.212

- eval: E9
  run_id: minted-compare-saved-trang-thai-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:21:53Z
  output: |
    ℹ duration_ms 10229.212

- eval: E11
  run_id: minted-compare-saved-trang-thai-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:21:53Z
  output: |
    ℹ duration_ms 10229.212

- eval: E17
  run_id: minted-compare-saved-trang-thai-E17-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:21:53Z
  output: |
    ℹ duration_ms 10229.212

- eval: E18
  run_id: minted-compare-saved-trang-thai-E18-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:21:53Z
  output: |
    ℹ duration_ms 10229.212

- eval: E19
  run_id: minted-compare-saved-trang-thai-E19-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:21:53Z
  output: |
    ℹ duration_ms 10229.212

- eval: E20
  run_id: minted-compare-saved-trang-thai-E20-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:21:53Z
  output: |
    ℹ duration_ms 10229.212

- eval: E1
  run_id: minted-compare-saved-trang-thai-E1-r2
  exit_code: 0
  verifier: config:executors.script.compare_saved_smoke
  verified_at: 2026-10-24T15:14:03Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-compare-saved-trang-thai-E2-r1
  exit_code: 0
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-10-24T14:58:11Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-compare-saved-trang-thai-E4-r2
  exit_code: 0
  verifier: config:executors.script.compare_saved_smoke
  verified_at: 2026-10-24T15:14:03Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-compare-saved-trang-thai-E5-r2
  exit_code: 0
  verifier: config:executors.script.compare_saved_smoke
  verified_at: 2026-10-24T15:14:03Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-compare-saved-trang-thai-E8-r2
  exit_code: 0
  verifier: config:executors.script.compare_saved_smoke
  verified_at: 2026-10-24T15:14:03Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-compare-saved-trang-thai-E10-r1
  exit_code: 0
  verifier: config:executors.test.app
  verified_at: 2026-10-24T14:58:11Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E12
  run_id: minted-compare-saved-trang-thai-E12-r1
  exit_code: 0
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-10-24T14:58:11Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E14
  run_id: minted-compare-saved-trang-thai-E14-r1
  exit_code: 0
  verifier: scripts/verify-ui-check (executor ui-check, khung của lượt gốc round 1)
  verified_at: 2026-10-24T14:58:11Z
  carried_from_round: 1
  screenshot: evidence/E14-step1.png
  observed: |
    Đã mở từng khung trong 10 khung bằng Read. /compare 3 khu vực (1280 sáng, tối, 375): PageHeader có breadcrumb, tiêu đề «So sánh khu vực», badge «3/4 khu vực», nút «Thêm khu vực», không bị cắt; ba ô đầu cột có ba ảnh khác nhau; ô tốt nhất đậm xanh, đọc rõ ở sáng và tối; ở 375 bảng cuộn ngang trong khung riêng, scrollWidth 375 = clientWidth 375.
    /saved 3 khu vực (1280 sáng, tối, 375): header có badge «3 khu vực», nút «So sánh 3 khu vực», tab Tất cả 3 / Thị trường 1 / Phường 2; ba thẻ ba ảnh khác nhau, nhãn Phường/Thị trường đọc được trên ảnh; nút ✕ hiện khi rê ở 1280 và luôn hiện ở 375 (scrollWidth 375 = clientWidth 375).
    Hai vùng trống (/compare trống ở 375; /saved trống ở 1280 sáng, tối và 375) mỗi vùng có đúng một nút hành động («Xem thị trường Việt Nam», «Tìm thị trường»), đọc rõ. Khung /compare trống ở nền tối không nằm trong các bước nên không chụp.
  network_observed: third-party-only
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E15
  run_id: design-gate-35bdc2fa93
  exit_code: 0
  verifier: config:executors.script.compare_design_gate
  verified_at: 2026-10-24T14:58:11Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E16
  run_id: design-gate-3b85dd4460
  exit_code: 0
  verifier: config:executors.script.saved_design_gate
  verified_at: 2026-10-24T14:58:11Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Judgment (đề xuất panel, human_override để trống)

- eval: E13
  judged_by: judge panel (fresh context) — domain-correctness, operational-feasibility, spec-alignment
  verdict: PASS
  rationale: Ba lens cùng thấy năm tệp nhất quán.
  votes:
    - domain-correctness: PASS — Năm tệp nói nhất quán. `routes.md` dòng 53 và 54 ghi `/compare` và `/saved` "PageHeader (I5 xong)", `/so-sanh` chỉ xuất hiện như redirect 301, Đã lưu trống dùng `c-empty-11` ở `saved/saved-empty.tsx`, và cả hai trang tải trong Suspense, lỗi tại chỗ. `catalog.md` dòng 26 và 94 có `page-error.tsx` cho cả trang cùng `RegionError` cho một vùng; `docs/architecture/portals.md` dòng 119 và `.claude/rules/portals.md` dòng 11 liệt `/compare` thay `/so-sanh`; `CONTEXT.md` ghi slug cũ `so-sanh` → `compare`. Không còn chỗ nào ghi "PageHeader chưa có, I5" hay coi `/so-sanh` là route sống.
    - operational-feasibility: PASS — Cả năm tệp nhất quán. routes.md dòng 53–54 ghi /compare và /saved đã có PageHeader («I5 xong»), tải trong Suspense (skeleton), lỗi tại chỗ, và Đã lưu trống dùng c-empty-11 ở saved/saved-empty.tsx. catalog.md có cả PageError (dòng 26) lẫn RegionError (dòng 26, 94). CONTEXT.md đặt slug `compare` và ghi `so-sanh` là slug cũ. portals.md (docs, dòng 119) ghi /compare với /so-sanh → 301, rules/portals.md dòng 11 liệt /compare, và không tệp nào liệt /so-sanh là route sống. Các dòng «PageHeader chưa có» còn lại thuộc /[country] (I1) và /ops/deals, không liên quan hai trang này.
    - spec-alignment: PASS — Năm tệp khớp nhau, không có chỗ nào mâu thuẫn. routes.md nói /compare giữ slug, có PageHeader (I5 xong), tải trong Suspense, lỗi tại chỗ bằng region-error, và /so-sanh chuyển 301. /saved dùng c-empty-11 ở saved/saved-empty.tsx (cả routes.md lẫn catalog.md đều ghi vậy). catalog.md liệt cả RegionError (một vùng) lẫn PageError (cả trang). portals.md và .claude/rules/portals.md đều liệt /compare cho cổng Invest và không còn /so-sanh là route sống; CONTEXT.md ghi slug cũ `so-sanh` → `compare`. Dòng «PageHeader (chưa có, I1)» của /[country] và /ops/deals thuộc trang khác nên không mâu thuẫn.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-compare-saved-trang-thai-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-10-24T15:21:53Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-compare-saved-trang-thai-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-10-24T15:21:53Z

- cmd: cd pipeline && npm test
  run_id: minted-compare-saved-trang-thai-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-10-24T15:21:53Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-compare-saved-trang-thai-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-10-24T15:21:53Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-compare-saved-trang-thai-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-24T15:21:53Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)

Baseline khong do:
- cd app && npm test: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)

none — danh sách eval không-phân-biệt không đo được ở round này vì baseline bị chặn hạ tầng; mọi field baseline ghi n-a.

## Variance

none — mọi eval chạy một lần, không có eval nhiều lượt.

## Iterations

Round 1: E1–E12, E14–E20 chạy lượt gốc (commit 7a4018f ghi S4 r1 PASS kèm sửa 5 phép đo trong hợp đồng); E2, E10, E12, E14, E15, E16 được giữ lại sang round 2 vì delta không chạm paths của chúng.
Round 2: các lệnh máy cho kết quả xanh, nhưng người review chạy lại `cd app && npm test` ở HEAD 7a4018f và ca «CS-AC-3 thêm cột» (phép đo của E17, AC-3) đỏ lặp lại do root React cũ còn portal cmdk khi renderWithRouter thay body. Finding trong hợp đồng, mức high, nên verdict là REJECT (commit b0e3d44). Trả về cho khâu cài đặt sửa phép đo.
Round 3: chạy lại `cd app && npm test` cùng các lệnh suite ở HEAD b0e3d44; E3, E6, E7, E9, E11, E17, E18, E19, E20 xanh; E1, E4, E5, E8 giữ lại từ round 2 và E2, E10, E12, E14, E15, E16 giữ lại từ round 1 vì delta không chạm paths của chúng. Không còn eval nào đỏ.
