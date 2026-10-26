---
schema_version: 2
feature_slug: listings-filters-store-locator
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2dd61ebaa54b4130ae14d8115c0a691890a4ea5b
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: listings-filters-store-locator

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-6 | script | PASS |
| E9 | AC-7 | script | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-8 | script | PASS |
| E12 | AC-8 | script | PASS |
| E13 | AC-9 | test | PASS |
| E14 | AC-10 | test | PASS |
| E15 | AC-10 | test | PASS |
| E16 | AC-10 | judgment | PASS |
| E17 | AC-10 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: minted-listings-filters-store-locator-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T02:50:24Z
  output: |
    cd app && npm test
    ℹ duration_ms 33908.520667

- eval: E2
  run_id: minted-listings-filters-store-locator-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T02:50:24Z
  output: |
    cd app && npm test
    ℹ duration_ms 33908.520667

- eval: E3
  run_id: minted-listings-filters-store-locator-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T02:50:24Z
  output: |
    cd app && npm test
    ℹ duration_ms 33908.520667

- eval: E4
  run_id: minted-listings-filters-store-locator-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.listings_browse_smoke
  verified_at: 2026-10-26T02:50:24Z
  output: |
    BASE_URL=${BASE_URL:-http://localhost:3460} node scripts/smoke-listings-browse.mjs
    listings-browse-smoke: ĐẠT

- eval: E5
  run_id: minted-listings-filters-store-locator-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T02:50:24Z
  output: |
    cd app && npm test
    ℹ duration_ms 33908.520667

- eval: E6
  run_id: minted-listings-filters-store-locator-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.listings_browse_smoke
  verified_at: 2026-10-26T02:50:24Z
  output: |
    BASE_URL=${BASE_URL:-http://localhost:3460} node scripts/smoke-listings-browse.mjs
    listings-browse-smoke: ĐẠT

- eval: E7
  run_id: minted-listings-filters-store-locator-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.listings_browse_smoke
  verified_at: 2026-10-26T02:50:24Z
  output: |
    BASE_URL=${BASE_URL:-http://localhost:3460} node scripts/smoke-listings-browse.mjs
    listings-browse-smoke: ĐẠT

- eval: E8
  run_id: minted-listings-filters-store-locator-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.listings_browse_smoke
  verified_at: 2026-10-26T02:50:24Z
  output: |
    BASE_URL=${BASE_URL:-http://localhost:3460} node scripts/smoke-listings-browse.mjs
    listings-browse-smoke: ĐẠT

- eval: E9
  run_id: minted-listings-filters-store-locator-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.listings_browse_smoke
  verified_at: 2026-10-26T02:50:24Z
  output: |
    BASE_URL=${BASE_URL:-http://localhost:3460} node scripts/smoke-listings-browse.mjs
    listings-browse-smoke: ĐẠT

- eval: E10
  run_id: minted-listings-filters-store-locator-E10-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T02:50:24Z
  output: |
    cd app && npm test
    ℹ duration_ms 33908.520667

- eval: E11
  run_id: minted-listings-filters-store-locator-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.listings_browse_smoke
  verified_at: 2026-10-26T02:50:24Z
  output: |
    BASE_URL=${BASE_URL:-http://localhost:3460} node scripts/smoke-listings-browse.mjs
    listings-browse-smoke: ĐẠT

- eval: E12
  run_id: minted-listings-filters-store-locator-E12-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-26T02:50:24Z
  output: |
    node scripts/check-portal-compliance.mjs
    portal-compliance: ĐẠT

- eval: E13
  run_id: minted-listings-filters-store-locator-E13-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T02:50:24Z
  output: |
    cd app && npm test
    ℹ duration_ms 33908.520667

- eval: E14
  run_id: minted-listings-filters-store-locator-E14-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-10-26T02:50:24Z
  output: |
    cd app && npx tsc --noEmit && npm run lint
    (tsc và lint không in lỗi)

- eval: E15
  run_id: minted-listings-filters-store-locator-E15-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-10-26T02:50:24Z
  output: |
    cd app && node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs
    ℹ duration_ms 53.312709

- eval: E16
  judged_by: judge-subagent (fresh context)
  verdict: PASS
  rationale: Ba lens cùng thấy routes.md, catalog.md, SKILL.md và spec nhất quán về trang Duyệt listing đã xong ở đợt I3 (một cây FilterQuery cho thanh chip và ngăn lọc, bản đồ trên ui/map.tsx theo khuôn store-locator, cụm và nhãn giá ở ListingLayers, thẻ ảnh 3:2, registry @mapcn trong components.json); tên tệp khớp design doc.
  judges:
    - domain-correctness: PASS — routes.md (dòng /[country]/[market]/listings, ghi «Đợt I3 xong») và catalog.md (các dòng @reui/filters, filter-sidebar-5, @mapcn/map, @mapcn/store-locator, product-grid-2, ListingsMap/ListingLayers, mục Bản đồ nền) nói giống nhau. Cả hai ghi: một cây FilterQuery cho thanh chip và ngăn lọc, bản đồ trên ui/map.tsx theo khuôn store-locator, cụm và nhãn giá ở ListingLayers không dùng MapClusterLayer, thẻ ảnh 3:2, registry @mapcn khai trong components.json. SKILL.md liệt kê listings-map.tsx là bản dựng bằng @mapcn/map và không có chỗ nào còn ghi bản đồ là MapLibre tay hay «phần còn lại của I3»; spec khớp thiết kế này, và mục «Hiện trạng (main 106cbd3)» của nó được ghi rõ là trạng thái trước đợt, không phải mô tả hiện tại.
    - operational-feasibility: PASS — Cả bốn tệp cùng nói trang Duyệt listing đã xong ở đợt I3. routes.md dòng `/[country]/[market]/listings` ghi «Đợt I3 xong» với `listings-filter-bar.tsx` (≥ lg), `listings-filter-sheet.tsx` (< lg) dùng chung một cây `FilterQuery`, bản đồ `listings-map.tsx` trên `ui/map.tsx` theo khuôn store-locator với cụm và nhãn giá ở `ListingLayers`, thẻ `listing-card.tsx` có ảnh 3:2. catalog.md dòng 53–57, 96 và 108 khớp từng điểm, kể cả việc không dùng `MapClusterLayer` và registry `@mapcn` đã khai trong `components.json`. SKILL.md và spec (§4, §8) cũng khớp. Chỗ còn nhắc MapLibre tay chỉ là ChoroplethMap/MiniMap của trang khác, hoặc mục «Hiện trạng» của spec ghi rõ là mốc cũ (main 106cbd3), nên không phải chỗ coi việc là chưa làm.
    - spec-alignment: PASS — Cả bốn tệp khớp nhau. routes.md dòng `/[country]/[market]/listings` ghi «Đợt I3 xong», dùng một cây `FilterQuery` cho thanh chip (≥ lg) và `listings-filter-sheet.tsx` (< lg), bản đồ trên `@mapcn/map` (`ui/map.tsx`) theo khuôn store-locator với cụm + nhãn giá ở `ListingLayers`, thẻ có ảnh 3:2. catalog.md khớp: có các dòng `@reui/filters`, `@reui/filter-sidebar-5`, `@mapcn/map`, `@mapcn/store-locator`, `@reui/product-grid-2` (khung 3:2), mục ListingsMap/ListingLayers chuyển thể từ store-locator, và «registry `@mapcn` khai trong `components.json`». SKILL.md và spec nói cùng như vậy. Không còn câu nào ghi ListingsMap là MapLibre tay hay «phần còn lại của đợt I3»; mục «Hiện trạng» trong spec chỉ mô tả trạng thái trước khi làm. MiniMap và ChoroplethMap còn MapLibre tay là việc I1/I2 ngoài phạm vi.
  human_override:  # chi nguoi ghi

- eval: E17
  run_id: minted-listings-filters-store-locator-E17-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-26T02:50:24Z
  screenshot: evidence/E17-step1.png
  observed: |
    Đã mở và đọc từng frame.
    step1 (1280 sáng): tiêu đề, nút "Thêm bộ lọc", "Xếp theo Doanh thu", "300 listing". Lưới thẻ 2 cột. Thẻ có ảnh (phòng ngủ) tỉ lệ 3:2, không méo. Thẻ đầu không có ảnh: không ô vỡ hay icon ảnh hỏng, chỉ là thẻ chữ có viền; chân thẻ giãn theo hàng nên có khoảng trắng giữa chip loại phòng và dòng Giá/Công suất/Doanh thu. Bản đồ sáng: cụm tròn đen số trắng, nhãn giá nền trắng chữ đen ("2,4 tr", "1,6 tr", "1,1 tr"), đọc rõ.
    step2: thanh chip hiện "Loại phòng | là | Nguyên căn" kèm nút ⋮, nút lọc, nút "Xoá" — đọc như câu «Loại phòng là Nguyên căn». Dòng đếm "191 listing khớp bộ lọc"; cụm bản đồ đổi số (56, 43, 26...).
    step3: bấm nhãn "2,4 tr" thì nhãn đổi sang nền đen, popup nền trắng, đổ bóng, viền rõ, tách khỏi bản đồ. Nội dung: tên căn, chip Nguyên căn / 2 PN, Giá/đêm 2.400.000 ₫, Công suất 6,3%, nút "Xem listing", nút đóng X.
    step4 (1280 tối): nền đen, chip và thẻ tối. Ảnh thẻ không méo. Bản đồ nền tối; cụm tròn trắng chữ đen, nhãn giá trắng chữ đen, tương phản cao, đọc rõ. Chip đọc rõ "Loại phòng là Nguyên căn".
    step5: kéo bản đồ thì hiện dòng "151 listing trong vùng bản đồ" và badge viền tím chữ tím sáng "Đang lọc theo vùng bản đồ ×" thấy rõ trên nền tối.
    step5b (thêm): popup tối nền xám đậm, viền sáng, chữ trắng, nút "Xem listing" đọc được. Tách khỏi bản đồ tối nhưng độ tách thấp hơn chế độ sáng, vẫn phân biệt được nhờ viền và bóng.
    step6 (390 sáng): trang một cột, tiêu đề, nút "Bộ lọc", "Xếp theo Doanh thu", toggle "Danh sách | Bản đồ". Thẻ không ảnh là thẻ chữ ổn; thẻ có ảnh 3:2 không méo. Không tràn ngang.
    step7: ngăn Bộ lọc trượt từ phải. Đầu ghim ("Bộ lọc", "Xoá hết", X). Chân ghim (nút đen "Xem 191 listing" và "Đặt lại"). Chip "Nguyên căn ×" ở trên; checkbox Nguyên căn đã tích. Số đếm bên phải (109, 191, Ba Đình 10, Bồ Đề 6, Cầu Giấy 0 mờ...) đọc rõ.
    step8: chế độ Bản đồ: nút "Bộ lọc" có badge đếm 1, toggle chuyển sang "Bản đồ". Bản đồ vừa khung 390 px, cụm và nhãn giá đọc được, nút zoom +/− thấy rõ. scrollWidth = clientWidth = 390.
    Đối chiếu Expected: khớp từng mục. Ghi chú nhỏ, không phải lỗi: thẻ không ảnh ở 1280 có khoảng trắng lớn do chiều cao hàng.
  network_observed: third-party-only

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-listings-filters-store-locator-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-26T02:50:24Z

- cmd: cd pipeline && npm test
  run_id: minted-listings-filters-store-locator-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-26T02:50:24Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-listings-filters-store-locator-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-26T02:50:24Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh ở cả HEAD lẫn baseline; chứng minh harness hơn là feature, là regression-guard có chủ ý hoặc nên viết lại để assert hành vi mới):

- cd app && npm test: E1, E2, E3, E5, E10, E13
- node scripts/check-portal-compliance.mjs: E12
- cd app && node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs: E15

Baseline không đo:

- BASE_URL=${BASE_URL:-http://localhost:3460} node scripts/smoke-listings-browse.mjs: bo qua baseline: tep scripts/smoke-listings-browse.mjs co o cay dang kiem nhung chua co o merge-base 106cbd3edb83f087b3cde91d6e1c00582b3451a5 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng đều (mọi eval chạy một lần, deterministic)

## Iterations

Round 1: 17 eval đều đạt (E1–E17), không eval nào hỏng; không trả về triển khai.
