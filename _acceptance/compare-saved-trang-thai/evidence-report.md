---
schema_version: 2
feature_slug: compare-saved-trang-thai
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 625c9618a0812c656fe4a5cb8b102cf05e4302dc
human_signoff:
---

# Evidence Report: compare-saved-trang-thai

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E17 | AC-3 | test | PASS |
| E18 | AC-4 | test | PASS |
| E19 | AC-3 | test | PASS |
| E20 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-8 | test | PASS |
| E12 | AC-9 | test | PASS |
| E13 | AC-9 | judgment | PASS |
| E14 | AC-10 | ui-check | PASS |
| E15 | AC-10 | script | PASS |
| E16 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-compare-saved-trang-thai-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.compare_saved_smoke
  verified_at: 2026-10-24T14:58:11Z
  output: |
    compare-saved smoke: ĐẠT

- eval: E2
  run_id: minted-compare-saved-trang-thai-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-10-24T14:58:11Z
  output: |
    ℹ duration_ms 49.743708

- eval: E3
  run_id: minted-compare-saved-trang-thai-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:58:11Z
  output: |
    ℹ duration_ms 10227.206667

- eval: E4
  run_id: minted-compare-saved-trang-thai-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.compare_saved_smoke
  verified_at: 2026-10-24T14:58:11Z
  output: |
    compare-saved smoke: ĐẠT

- eval: E5
  run_id: minted-compare-saved-trang-thai-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.compare_saved_smoke
  verified_at: 2026-10-24T14:58:11Z
  output: |
    compare-saved smoke: ĐẠT

- eval: E17
  run_id: minted-compare-saved-trang-thai-E17-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:58:11Z
  output: |
    ℹ duration_ms 10227.206667

- eval: E18
  run_id: minted-compare-saved-trang-thai-E18-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:58:11Z
  output: |
    ℹ duration_ms 10227.206667

- eval: E19
  run_id: minted-compare-saved-trang-thai-E19-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:58:11Z
  output: |
    ℹ duration_ms 10227.206667

- eval: E20
  run_id: minted-compare-saved-trang-thai-E20-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:58:11Z
  output: |
    ℹ duration_ms 10227.206667

- eval: E6
  run_id: minted-compare-saved-trang-thai-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:58:11Z
  output: |
    ℹ duration_ms 10227.206667

- eval: E7
  run_id: minted-compare-saved-trang-thai-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:58:11Z
  output: |
    ℹ duration_ms 10227.206667

- eval: E8
  run_id: minted-compare-saved-trang-thai-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.compare_saved_smoke
  verified_at: 2026-10-24T14:58:11Z
  output: |
    compare-saved smoke: ĐẠT

- eval: E9
  run_id: minted-compare-saved-trang-thai-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:58:11Z
  output: |
    ℹ duration_ms 10227.206667

- eval: E10
  run_id: minted-compare-saved-trang-thai-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-24T14:58:11Z
  output: |
    tsc --noEmit và npm run lint chạy xong, không in lỗi.

- eval: E11
  run_id: minted-compare-saved-trang-thai-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:58:11Z
  output: |
    ℹ duration_ms 10227.206667

- eval: E12
  run_id: minted-compare-saved-trang-thai-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-10-24T14:58:11Z
  output: |
    ℹ duration_ms 51.013375

- eval: E13
  judged_by: judge panel (fresh context, 3 lens)
  verdict: PASS
  rationale: Cả ba lens cùng thấy năm tệp (routes.md, catalog.md, portals.md kiến trúc, .claude/rules/portals.md, CONTEXT.md) nhất quán về /compare và /saved; không còn ghi PageHeader chưa có cho hai trang này; /so-sanh chỉ còn ở dạng slug cũ và redirect 301.
  judges:
    - domain-correctness: PASS — routes.md ghi /compare và /saved đã có PageHeader (I5 xong), tải bằng Suspense skeleton và lỗi tại chỗ; Đã lưu trống dùng c-empty-11 ở saved/saved-empty.tsx. catalog.md có cả PageError và RegionError, và dòng c-empty-11 trỏ về saved-empty.tsx. CONTEXT.md (slug cũ so-sanh → compare), docs/architecture/portals.md (/compare, /so-sanh → 301) và .claude/rules/portals.md (liệt /compare) đều khớp. «PageHeader chưa có» chỉ còn ở trang khác (/[country] thuộc I1, /ops/deals).
    - operational-feasibility: PASS — năm tệp nói nhất quán, không mâu thuẫn. routes.md ghi «PageHeader (I5 xong)» cho /compare và /saved, nói /so-sanh chuyển 301, ghi trạng thái tải bằng skeleton trong Suspense và lỗi tại chỗ. Đã lưu trống dùng c-empty-11 khớp catalog.md dòng 44. catalog.md có RegionError cạnh PageError. portals.md (dòng 119) và .claude/rules/portals.md liệt /compare thay /so-sanh.
    - spec-alignment: PASS — routes.md (dòng 53, 54, 77) ghi /compare có PageHeader xong (I5), /so-sanh → 301, Suspense skeleton, lỗi tại chỗ bằng region-error.tsx. catalog.md có PageError và RegionError (dòng 26, 94). portals.md (dòng 119) và .claude/rules/portals.md (dòng 11) liệt /compare, /so-sanh chỉ còn là redirect 301. CONTEXT.md ghi slug compare, slug cũ so-sanh → compare.
  human_override:  # chi nguoi ghi

- eval: E14
  run_id: minted-compare-saved-trang-thai-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-24T14:58:11Z
  screenshot: evidence/E14-step1.png
  observed: |
    Đã mở từng khung trong 10 khung bằng Read. /compare 3 khu vực (1280 sáng, tối, 375): PageHeader có breadcrumb, tiêu đề «So sánh khu vực», badge «3/4 khu vực», nút «Thêm khu vực», không bị cắt; ba ô đầu cột có ba ảnh khác nhau; ô tốt nhất đậm xanh, đọc rõ ở sáng và tối; ở 375 bảng cuộn ngang trong khung riêng, scrollWidth 375 = clientWidth 375.
    /saved 3 khu vực (1280 sáng, tối, 375): header có badge «3 khu vực», nút «So sánh 3 khu vực», tab Tất cả 3 / Thị trường 1 / Phường 2; ba thẻ ba ảnh khác nhau, nhãn Phường/Thị trường đọc được trên ảnh; nút ✕ hiện khi rê ở 1280 và luôn hiện ở 375 (scrollWidth 375 = clientWidth 375).
    Hai vùng trống (/compare trống ở 375; /saved trống ở 1280 sáng, tối và 375) mỗi vùng có đúng một nút hành động («Xem thị trường Việt Nam», «Tìm thị trường»), đọc rõ. Khung /compare trống ở nền tối không nằm trong các bước nên không chụp.
  network_observed: third-party-only

- eval: E15
  run_id: design-gate-35bdc2fa93
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.compare_design_gate
  verified_at: 2026-10-24T14:58:11Z
  output: |
    design-gate (jsdom) chạy xong trên app/src/components/compare/comparison.tsx; kết quả JSON đóng bình thường.

- eval: E16
  run_id: design-gate-3b85dd4460
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.saved_design_gate
  verified_at: 2026-10-24T14:58:11Z
  output: |
    design-gate (jsdom) chạy xong trên app/src/components/saved/saved-list.tsx; kết quả JSON đóng bình thường.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-compare-saved-trang-thai-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-24T14:58:11Z

- cmd: cd pipeline && npm test
  run_id: minted-compare-saved-trang-thai-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-24T14:58:11Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-compare-saved-trang-thai-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-24T14:58:11Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-compare-saved-trang-thai-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-24T14:58:11Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)

Danh sách eval không-phân-biệt: none (rỗng). Lưu ý baseline không đo được ở round này nên danh sách này không chứng minh eval nào phân biệt được code cũ và mới.

Baseline khong do:
- BASE_URL=${BASE_URL:-http://localhost:3460} node scripts/smoke-compare-saved.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && npm test: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- node /Users/manhphan/.claude/plugins/cache/acceptance-gate-kit/acceptance-gate/2.32.0/scripts/design-gate.mjs --jsdom app app/src/components/compare/comparison.tsx: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- node /Users/manhphan/.claude/plugins/cache/acceptance-gate-kit/acceptance-gate/2.32.0/scripts/design-gate.mjs --jsdom app app/src/components/saved/saved-list.tsx: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval xanh (E13 do hội đồng đề xuất PASS, human_override để trống cho người quyết ở Gate 2); baseline không đo được do hạ tầng.
