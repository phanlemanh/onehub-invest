---
schema_version: 2
feature_slug: listing-detail-product-detail-5
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 575e3bf7947f87487370756883a9dbbd70c1c7fc
human_signoff:
---

# Evidence Report: listing-detail-product-detail-5

Round 2 — verdict PASS. Mọi eval máy chạy xanh trên cây 575e3bf7; các eval mà delta không chạm paths (E8, E15, E18, E19, E20) được mang sang từ round 1 và ghi rõ `carried_from_round: 1` trong khối của chúng.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-2 | script | PASS |
| E5 | AC-3 | test | PASS |
| E6 | AC-3 | script | PASS |
| E7 | AC-4 | test | PASS |
| E8 | AC-5 | test | PASS |
| E9 | AC-5 | test | PASS |
| E10 | AC-6 | test | PASS |
| E11 | AC-6 | script | PASS |
| E12 | AC-7 | test | PASS |
| E13 | AC-7 | script | PASS |
| E14 | AC-8 | test | PASS |
| E15 | AC-8 | script | PASS |
| E16 | AC-8 | script | PASS |
| E17 | AC-9 | judgment | PASS |
| E18 | AC-9 | test | PASS |
| E19 | AC-10 | ui-check | PASS |
| E20 | AC-10 | script | PASS |
| E21 | AC-5 | script | PASS |

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline — chứng minh harness chứ không chứng minh feature; cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- E1, E3, E5, E7, E9, E10, E12, E14 (lệnh `cd app && npm test`)

Baseline khong do:
- node scripts/smoke-listing-detail.mjs: bo qua baseline: tep scripts/smoke-listing-detail.mjs co o cay dang kiem nhung chua co o merge-base 5104013a5e1d6df92f928c0076ffdc5944be6ccd — eval moi, chay tren code cu khong phan biet gi

## Evidence

- eval: E1
  run_id: minted-listing-detail-product-detail-5-E1-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T11:30:21Z
  output: |
    cd app && npm test
    ℹ duration_ms 32610.898958

- eval: E2
  run_id: minted-listing-detail-product-detail-5-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.listing_detail_smoke
  verified_at: 2026-10-25T11:30:21Z
  output: |
    node scripts/smoke-listing-detail.mjs
    listing-detail-smoke: ĐẠT

- eval: E3
  run_id: minted-listing-detail-product-detail-5-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T11:30:21Z
  output: |
    cd app && npm test
    ℹ duration_ms 32610.898958

- eval: E4
  run_id: minted-listing-detail-product-detail-5-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.listing_detail_smoke
  verified_at: 2026-10-25T11:30:21Z
  output: |
    node scripts/smoke-listing-detail.mjs
    listing-detail-smoke: ĐẠT

- eval: E5
  run_id: minted-listing-detail-product-detail-5-E5-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T11:30:21Z
  output: |
    cd app && npm test
    ℹ duration_ms 32610.898958

- eval: E6
  run_id: minted-listing-detail-product-detail-5-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.listing_detail_smoke
  verified_at: 2026-10-25T11:30:21Z
  output: |
    node scripts/smoke-listing-detail.mjs
    listing-detail-smoke: ĐẠT

- eval: E7
  run_id: minted-listing-detail-product-detail-5-E7-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T11:30:21Z
  output: |
    cd app && npm test
    ℹ duration_ms 32610.898958

- eval: E8
  run_id: minted-listing-detail-product-detail-5-E8-r1
  exit_code: 0
  verifier: config:executors.test.app
  verified_at: 2026-10-25T11:23:08Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd app && npx tsc --noEmit && npm run lint

- eval: E9
  run_id: minted-listing-detail-product-detail-5-E9-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T11:30:21Z
  output: |
    cd app && npm test
    ℹ duration_ms 32610.898958

- eval: E10
  run_id: minted-listing-detail-product-detail-5-E10-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T11:30:21Z
  output: |
    cd app && npm test
    ℹ duration_ms 32610.898958

- eval: E11
  run_id: minted-listing-detail-product-detail-5-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.listing_detail_smoke
  verified_at: 2026-10-25T11:30:21Z
  output: |
    node scripts/smoke-listing-detail.mjs
    listing-detail-smoke: ĐẠT

- eval: E12
  run_id: minted-listing-detail-product-detail-5-E12-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T11:30:21Z
  output: |
    cd app && npm test
    ℹ duration_ms 32610.898958

- eval: E13
  run_id: minted-listing-detail-product-detail-5-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.listing_detail_smoke
  verified_at: 2026-10-25T11:30:21Z
  output: |
    node scripts/smoke-listing-detail.mjs
    listing-detail-smoke: ĐẠT

- eval: E14
  run_id: minted-listing-detail-product-detail-5-E14-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T11:30:21Z
  output: |
    cd app && npm test
    ℹ duration_ms 32610.898958

- eval: E15
  run_id: minted-listing-detail-product-detail-5-E15-r1
  exit_code: 0
  verifier: config:executors.script.listing_static
  verified_at: 2026-10-25T11:23:08Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    listing-no-airdna: ĐẠT

- eval: E16
  run_id: minted-listing-detail-product-detail-5-E16-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.listing_detail_smoke
  verified_at: 2026-10-25T11:30:21Z
  output: |
    node scripts/smoke-listing-detail.mjs
    listing-detail-smoke: ĐẠT

- eval: E17
  judged_by: hội đồng 3 thấu kính (domain-correctness, operational-feasibility, spec-alignment) — fresh context
  verdict: PASS
  rationale: Cả ba thấu kính cùng thấy routes.md, design doc và catalog.md nhất quán về trang /listing/[id]; tên tệp khớp nhau và không chỗ nào còn coi đầu trang là việc chưa làm. Lệch duy nhất (dòng trang Duyệt listing so với catalog product-grid-2) nằm ngoài phạm vi trang chi tiết.
  votes:
    - domain-correctness: PASS — ba tệp nhất quán về /listing/[id]; catalog có dòng @reui/product-detail-5 kèm lý do không giữ bản gốc (ui/carousel.tsx đỏ lint react-hooks, kéo embla), khớp mục 9 của design doc; dòng form-5 ghi nút tooltip là TooltipTrigger. Chỗ lệch duy nhất thuộc trang Duyệt listing, ngoài phạm vi.
    - operational-feasibility: PASS — routes.md, design doc và catalog.md cùng ghi listing-gallery.tsx, listing-hero.tsx, ẩn gallery khi không có ảnh tự thu hoặc mọi ảnh chết, KPI và Listing tương tự tải trong Suspense kèm lỗi tại chỗ; mọi tệp catalog nhắc cho trang này đều có trong design doc.
    - spec-alignment: PASS — ba tệp khớp ở mọi điểm câu hỏi nêu, kể cả listing-calendar-empty.tsx và việc gỡ nút tay của form-5; không còn chỗ nào coi đầu trang là việc chưa làm.
  human_override:  # chi nguoi ghi

- eval: E18
  run_id: minted-listing-detail-product-detail-5-E18-r1
  exit_code: 0
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-10-25T11:23:08Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd app && node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs

- eval: E19
  run_id: minted-listing-detail-product-detail-5-E19-r1
  exit_code: 0
  verifier: scripts/ui-capture.sh
  verified_at: 2026-10-25T11:23:08Z
  carried_from_round: 1
  screenshot: evidence/E19-step1.png
  observed: |
    step1 (1280 sáng): ảnh chính phòng khách đầy khung 3:2, không méo; dải 5 thumbnail một hàng, thumbnail 1 có viền đen dày rõ, các ô còn lại mờ; thanh trượt ngang bên dưới; hộp 'Đặc điểm' bên phải: nhãn xám trái, giá trị đen phải (Loại phòng/Phòng ngủ/Sức chứa/Đánh giá/Phường/Thị trường), nút 'Mở trên Airbnb' đọc rõ. step2: sau bấm thumbnail 3 ảnh chính đổi sang ảnh phòng tắm dọc, hiện trọn (contain) giữa nền xám nhạt, không méo; thumbnail 3 có viền đen phân biệt, thumbnail 1 hết viền. step3 (1280 tối): nền tối, ảnh chính đúng, thumbnail 1 viền trắng sáng phân biệt rõ, nhãn/giá trị Đặc điểm và nút Airbnb đọc được. step4 (375 sáng): xếp dọc một cột, ảnh chính 3:2 không méo, dải thumbnail, rồi Đặc điểm (nhãn trái/giá trị phải) và nút 'Mở trên Airbnb' toàn chiều rộng; không thấy cuộn ngang (đo 375=375); chỉ có biểu tượng dev 'N' của Next đè lên một nhãn, không phải lỗi app. step5 (1280, không ảnh): không có khung ảnh trống; Đặc điểm trải ngang hai cột dưới tiêu đề, nút Airbnb nằm dưới bên trái. step6 (375, không ảnh): không khung ảnh, Đặc điểm một cột, nút Airbnb toàn rộng. step7 (1280 sáng, chưa lịch): khung 'Lịch 0 đêm tới' chứa Empty: icon lịch, tiêu đề 'Chưa có lịch cho listing này', mô tả, đúng một nút 'Xem lịch trên Airbnb'; đọc rõ. step8 (1280 tối): cùng Empty, chữ và nút đọc rõ trên nền tối, một nút. Tất cả khớp Expected.
  network_observed: no-app-traffic
  ghi_chu: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E20
  run_id: design-gate-e1b0b306f3
  exit_code: 0
  verifier: config:executors.script.listing_hero_design_gate
  verified_at: 2026-10-25T11:23:08Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    node design-gate.mjs --jsdom app app/src/components/listing/listing-hero.tsx

- eval: E21
  run_id: minted-listing-detail-product-detail-5-E21-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.listing_detail_smoke
  verified_at: 2026-10-25T11:30:21Z
  output: |
    node scripts/smoke-listing-detail.mjs
    listing-detail-smoke: ĐẠT

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-listing-detail-product-detail-5-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-25T11:30:21Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-listing-detail-product-detail-5-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-25T11:30:21Z

- cmd: cd pipeline && npm test
  run_id: minted-listing-detail-product-detail-5-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-25T11:30:21Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-listing-detail-product-detail-5-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-25T11:30:21Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-listing-detail-product-detail-5-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-25T11:30:21Z

## Known limits

## Ngoài hợp đồng

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: không eval máy nào đỏ, nhưng ba finding TRONG hợp đồng chưa được chứng: bậc Công suất của AC-8 lấy kỳ vọng từ chính đầu ra (E14), nhãn đêm của AC-5 chỉ ghim một trong ba trạng thái và «nhận focus bằng Tab» chỉ là một thuộc tính vắng mặt. Returned to implementation.
Round 2: commit 575e3bf7 siết phép đo AC-5/AC-8 (bậc công suất, nhãn 10 đêm, focus và Tab thật); E1-E7, E9-E14, E16, E21 và năm lệnh suite chạy lại và xanh; E8, E15, E18, E19, E20 mang sang từ round 1. verified_at của round 2 lấy từ mốc generated_at của s4-args-r2.json.
