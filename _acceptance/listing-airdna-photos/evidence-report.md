---
schema_version: 2
feature_slug: listing-airdna-photos
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 906156608b038d81b98a97aca2add29724e5e318
human_signoff: Mạnh 2026-10-22
---

# Evidence Report: listing-airdna-photos

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-7 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: listing-airdna-photos-listing_smoke-20261022145917
  exit_code: 0
  baseline: n-a
  verifier: scripts/smoke-listing-no-airdna.mjs (config:executors.script.listing_smoke)
  verified_at: 2026-10-22T14:59:18Z
  output: |
    ok   DB có listing mang cả ảnh tự thu lẫn ảnh AirDNA (8)
    ok   abnb_1684709390587895076: có 9 ảnh AirDNA khác bộ tự thu (mẫu phân biệt được)
    ok   abnb_1684709390587895076: trả 200 (200)
    ok   abnb_1684709390587895076: hiện 10 ảnh, tất cả từ tự thu
    ok   abnb_1684709390587895076: 0 ảnh chỉ AirDNA có
    listing-smoke: ĐẠT

- eval: E2
  run_id: listing-airdna-photos-listing_smoke-20261022145917
  exit_code: 0
  baseline: n-a
  verifier: scripts/smoke-listing-no-airdna.mjs (config:executors.script.listing_smoke)
  verified_at: 2026-10-22T14:59:18Z
  output: |
    info DB không có listing chỉ có ảnh AirDNA — dùng listing không ảnh bất kỳ
    ok   DB có listing chưa có ảnh tự thu
    ok   abnb_1146242072149071598: trả 200 (200)
    ok   abnb_1146242072149071598: không có ảnh (trạng thái trống)
    listing-smoke: ĐẠT

- eval: E3
  run_id: listing-airdna-photos-listing_smoke-20261022145917
  exit_code: 0
  baseline: n-a
  verifier: scripts/smoke-listing-no-airdna.mjs (config:executors.script.listing_smoke)
  verified_at: 2026-10-22T14:59:18Z
  output: |
    ok   abnb_1684709390587895076: HTML không có chữ AirDNA
    ok   abnb_1146242072149071598: HTML không có chữ AirDNA
    listing-smoke: ĐẠT

- eval: E4
  run_id: listing-airdna-photos-listing_static-20261022145749
  exit_code: 0
  baseline: red
  verifier: scripts/check-listing-no-airdna.mjs (config:executors.script.listing_static)
  verified_at: 2026-10-22T14:57:49Z
  output: |
    ok   tìm thấy getListingDetail trong lib/queries.ts
    ok   getListingDetail không đọc bảng airdna_*
    ok   ListingDetail không còn photoSource/listingUrl (nguồn AirDNA)
    listing-no-airdna: ĐẠT

- eval: E5
  run_id: listing-airdna-photos-listing_static-20261022145749
  exit_code: 0
  baseline: red
  verifier: scripts/check-listing-no-airdna.mjs (config:executors.script.listing_static)
  verified_at: 2026-10-22T14:57:49Z
  output: |
    ok   quét 8 file route/components listing
    ok   src/app/(app)/listing/[id]/page.tsx: không AirDNA/photoSource trong mã render (0 dòng)
    ok   src/components/listing/booking-heatmap.tsx: không AirDNA/photoSource trong mã render (0 dòng)
    ok   src/components/listing/listing-actions.tsx: không AirDNA/photoSource trong mã render (0 dòng)
    ok   src/components/listing/listing-card.tsx: không AirDNA/photoSource trong mã render (0 dòng)
    ok   src/components/listing/listing-labels.ts: không AirDNA/photoSource trong mã render (0 dòng)
    ok   src/components/listing/listing-tables.tsx: không AirDNA/photoSource trong mã render (0 dòng)
    ok   src/components/listing/listings-explorer.tsx: không AirDNA/photoSource trong mã render (0 dòng)
    ok   src/components/listing/listings-map.tsx: không AirDNA/photoSource trong mã render (0 dòng)
    listing-no-airdna: ĐẠT

- eval: E6
  run_id: listing-airdna-photos-listing_smoke-20261022145917
  exit_code: 0
  baseline: n-a
  verifier: scripts/smoke-listing-no-airdna.mjs (config:executors.script.listing_smoke)
  verified_at: 2026-10-22T14:59:18Z
  output: |
    ok   abnb_1684709390587895076: còn link Mở trên Airbnb dựng từ id
    ok   abnb_1146242072149071598: còn link Mở trên Airbnb dựng từ id
    listing-smoke: ĐẠT

- eval: E7
  run_id: design-gate-079a804502
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.gate
  verified_at: 2026-10-22T14:58:29Z
  output: |
    "target": "app/src/app/(app)/listing/[id]/page.tsx",
    "fail_on": [ "P0" ],
    "mode": "dom",
    "verdict": "PASS",
    "p0_count": 0,
    "blocking": [],
    "findings": []

- eval: E8
  run_id: listing-airdna-photos-E8-20261022145810
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-22T14:58:17Z
  output: |
    > src@0.1.0 lint
    > eslint
    investment-simulator.tsx 142:6 warning react-hooks/exhaustive-deps (có từ trước bản vá)
    user-event-beacon.tsx 51:6 warning react-hooks/exhaustive-deps
    use-file-upload.ts 266:5 warning react-hooks/exhaustive-deps
    ✖ 3 problems (0 errors, 3 warnings)

- eval: E9
  run_id: listing-airdna-photos-E9-20261022145925
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh (config:capture.ui)
  verified_at: 2026-10-22T14:59:30Z
  screenshot: evidence/E9-step1.png
  observed: |
    step1 (E9-step1.png): "Tropical Pool Villa/KTV/Jacuzzi/Chill Lounge/Bida", nút "Mở trên Airbnb" góc phải đầu trang; lưới ảnh 1 ảnh chính lớn + 9 ảnh phụ, ngay dưới lưới là hàng 4 ô KPI (Giá niêm yết, Công suất, Đêm đã đặt, Doanh thu ước tính) — không có dòng chú thích nguồn ảnh hay link "Xem trên Airbnb", không thấy chữ AirDNA.
    step2 (E9-step2.png): "Secret Nest x Old Quarterl Big Kitchen | WS - DR", nút "Mở trên Airbnb" vẫn ở đầu trang; không có lưới ảnh — dưới tiêu đề đi thẳng xuống 4 ô KPI, rồi Lịch 365 đêm tới và Listing tương tự; không thấy chữ AirDNA.
  network_observed: n-a (driver)

## Known limits

- DB local không có listing «không ảnh tự thu + có ảnh AirDNA» (đúng ca cũ mượn ảnh): smoke in dòng info và rơi về căn không ảnh bất kỳ (`abnb_1146242072149071598`). Ô đó của trục Coverage chỉ được phủ TĨNH bằng E4/E5 (mã không còn đường đọc `airdna_*`, đỏ trên cây trước bản vá), chưa có lần đọc HTML thật nào trên ca đó.
- AC-7 phần «bố cục không đổi ngoài việc bỏ dòng chú thích»: chỉ có khung SAU bản vá (E9), không có khung trước bản vá để so. Theo diff, với căn có ảnh tự thu bản vá còn bỏ cả dòng link «Xem trên Airbnb ↗» dưới lưới (contract Notes đã khai) — khung step1 xác nhận dòng đó không còn.
- E2 xác định «không có ảnh» bằng heuristic chuỗi (HTML không chứa «Ảnh chính» và không chứa `muscache.com`), không đếm phần tử ảnh theo DOM.
- `config:executors.design.gate` ghim kit bản 2.32.0 trong khi kit đang cài mới nhất là 2.33.1 — E7 là kết quả của bộ dò 2.32.0, chế độ DOM trên mã nguồn TSX, không phải trang đang render.
- Khung E9 chụp trên dev server: nút chỉ báo «N» của Next.js dev đè lên góc trái ô «Giá niêm yết» ở step1 (che chữ số đầu) — chỉ có ở dev, không thuộc trang.

## Ngoài hợp đồng

- Chạy `next dev` trong worktree này tự sinh `app/AGENTS.md` (khối «nextjs-agent-rules») và đổi `app/next-env.d.ts` (trỏ `./.next/dev/types/...`). Người chấm đã tắt server và khôi phục cả hai về trạng thái commit; Mạnh có thể muốn quyết định commit hay gitignore để worktree khỏi bẩn sau mỗi lần chạy dev.
- Lưới ảnh step1 (10 ảnh) để trống 1 ô cuối hàng 3 — bố cục lưới có từ trước, contract đã để restyle ra ngoài phạm vi.

## Analyst

Non-discriminating evals:
none — mọi eval tính năng đã đo baseline (E4, E5) đều red trên cây trước bản vá (5b730ea~1): E4 trượt 2 kiểm (getListingDetail đọc `airdna_*`; ListingDetail còn photoSource/listingUrl), E5 trượt ở `listing/[id]/page.tsx` (3 dòng mã render chứa AirDNA/photoSource). Đo bằng `git archive 5b730ea~1 app/src` vào thư mục tạm, không đụng cây làm việc.

Baseline khong do:
- E1, E2, E3, E6 (listing_smoke) và E9 (ui-check): cần một dev server chạy cây cũ; vòng này chỉ khởi một server từ cây đang kiểm.
- E7 (design gate): chạy theo file trên mã mới; không chạy A/B trên page.tsx cũ.
- E8 (test.app): tsc + lint toàn app trên cây cũ cần node_modules riêng cho bản xuất; không đo.

## Variance

none — mọi eval chạy một lần, tất định.

## Iterations

Round 1: mọi eval máy (E1–E8) và ui-check E9 đạt trên commit 5b730ea.

### Re-pin lần 1 — 2026-10-22, do hợp nhất origin/main (PR #3 portal-deals-airdna) vào nhánh
run_id: repin-20261022T230822Z-46117
sha: 4a639621520872d4fe74ca28c1ab4194ed76e12c · suites: 1 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng · ngoài làn máy: E9 (E9 không khai paths)

### Re-pin lần 2 — 2026-10-22, do hợp nhất origin/main (PR #5 ops-access-hardening) vào nhánh
run_id: repin-20261022T231553Z-27262
sha: 4555f925264c16bb3285e24f187aa1fdbfe0e38b · suites: 2 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng · ngoài làn máy: E9 (E9 không khai paths)

### Re-pin lần 3 — 2026-10-22, do hợp nhất origin/main (PR #2 ui-standards-reui) vào nhánh
run_id: repin-20261022T234021Z-71105
sha: 906156608b038d81b98a97aca2add29724e5e318 · suites: 2 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng · ngoài làn máy: E9 (E9 không khai paths)
