---
schema_version: 2
feature_slug: portal-deals-airdna
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0e3a25c7e01391877a72afe57e50d241b8aa2679
human_signoff: Mạnh 2026-10-22
---

# Evidence Report: portal-deals-airdna

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-3 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-5 | script | PASS |
| E9 | AC-6 | script | PASS |
| E10 | AC-6 | script | PASS |
| E11 | AC-7 | script | PASS |
| E12 | AC-7 | ui-check | PASS |
| E13 | AC-8 | script | PASS |
| E14 | AC-9 | judgment | UNCERTAIN |
| E15 | AC-10 | script | PASS |
| E16 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: portal-deals-airdna-smoke-20261022214122
  exit_code: 0
  baseline: n-a
  verifier: scripts/smoke-portal-compliance.mjs (config:executors.script.portal_smoke)
  verified_at: 2026-10-22T14:41:23Z
  output: |
    ok   khách: nav Invest (/vn) không có link /deals
    portal-smoke: ĐẠT

- eval: E2
  run_id: portal-deals-airdna-static-20261022214109
  exit_code: 0
  baseline: red
  verifier: scripts/check-portal-compliance.mjs (config:executors.script.portal_static)
  verified_at: 2026-10-22T14:41:10Z
  output: |
    ok   không còn route Invest src/app/(app)/deals
    ok   có route src/app/ops/deals/page.tsx
    ok   nav Invest không có mục deals
    ok   nav Ops có href /ops/deals
    ok   next.config redirect /deals → /ops/deals
    portal-compliance: ĐẠT

- eval: E3
  run_id: portal-deals-airdna-smoke-20261022214122
  exit_code: 0
  baseline: n-a
  verifier: scripts/smoke-portal-compliance.mjs (config:executors.script.portal_smoke)
  verified_at: 2026-10-22T14:41:23Z
  output: |
    ok   khách: /deals chuyển sang /ops/deals
    ok   khách: /ops/deals bị đưa về /login
    portal-smoke: ĐẠT

- eval: E4
  run_id: portal-deals-airdna-smoke-20261022214122
  exit_code: 0
  baseline: n-a
  verifier: scripts/smoke-portal-compliance.mjs (config:executors.script.portal_smoke)
  verified_at: 2026-10-22T14:41:23Z
  output: |
    ok   user thường: /ops/deals trả 200 hoặc 404 (vào được)
    ok   user thường: không có SĐT (0 link tel:)
    portal-smoke: ĐẠT

- eval: E5
  run_id: portal-deals-airdna-static-20261022214109
  exit_code: 0
  baseline: red
  verifier: scripts/check-portal-compliance.mjs (config:executors.script.portal_static)
  verified_at: 2026-10-22T14:41:10Z
  output: |
    ok   ops/deals tính showContact từ isAdmin(user)
    ok   ops/deals: khối SĐT/tên người bán chỉ render khi showContact
    ok   ops/deals: nội dung tin chỉ render khi showContact
    ok   ops/deals: ảnh tin chỉ render khi showContact
    ok   ops/deals: có đủ 3 khối gate tầng A
    portal-compliance: ĐẠT

- eval: E6
  run_id: portal-deals-airdna-smoke-20261022214122
  exit_code: 0
  baseline: n-a
  verifier: scripts/smoke-portal-compliance.mjs (config:executors.script.portal_smoke)
  verified_at: 2026-10-22T14:41:23Z
  output: |
    ok   user thường: không có SĐT (0 link tel:)
    ok   admin: /ops/deals trả 200
    ok   admin: thấy SĐT người bán (30 link tel:, DB có 1154 tin P1 kèm SĐT)
    portal-smoke: ĐẠT

- eval: E7
  run_id: portal-deals-airdna-smoke-20261022214122
  exit_code: 0
  baseline: n-a
  verifier: scripts/smoke-portal-compliance.mjs (config:executors.script.portal_smoke)
  verified_at: 2026-10-22T14:41:23Z
  output: |
    ok   admin: /ops/deals trả 200
    ok   admin: chữ hiển thị chỉ dùng mã nguồn S0x (0 nút chữ có tên nguồn thật)
    portal-smoke: ĐẠT

- eval: E8
  run_id: portal-deals-airdna-static-20261022214109
  exit_code: 0
  baseline: green
  verifier: scripts/check-portal-compliance.mjs (config:executors.script.portal_static)
  verified_at: 2026-10-22T14:41:10Z
  output: |
    ok   ops/deals: không tên nguồn thật trong mã render (0 dòng)
    portal-compliance: ĐẠT

- eval: E9
  run_id: portal-deals-airdna-smoke-20261022214122
  exit_code: 0
  baseline: n-a
  verifier: scripts/smoke-portal-compliance.mjs (config:executors.script.portal_smoke)
  verified_at: 2026-10-22T14:41:23Z
  output: |
    ok   khách: /api/zalo-media trả 404 (không lộ có/không có file)
    ok   user thường: /api/zalo-media bị chặn (404, chưa tới kiểm path)
    ok   admin: /api/zalo-media qua cổng quyền, chặn ở kiểm path (403)
    portal-smoke: ĐẠT

- eval: E10
  run_id: portal-deals-airdna-static-20261022214109
  exit_code: 0
  baseline: red
  verifier: scripts/check-portal-compliance.mjs (config:executors.script.portal_static)
  verified_at: 2026-10-22T14:41:10Z
  output: |
    ok   zalo-media: isAdmin chặn trước stat/readFile
    portal-compliance: ĐẠT

- eval: E11
  run_id: portal-deals-airdna-smoke-20261022214122
  exit_code: 0
  baseline: n-a
  verifier: scripts/smoke-portal-compliance.mjs (config:executors.script.portal_smoke)
  verified_at: 2026-10-22T14:41:23Z
  output: |
    ok   khách: /vn/hanoi/dau-tu trả 200
    ok   khách: /dau-tu không chứa chữ AirDNA (0)
    ok   khách: /dau-tu ghi nguồn mặc định là dữ liệu tự thu
    portal-smoke: ĐẠT

- eval: E12
  run_id: portal-deals-airdna-E12-20261022214146
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh (config:capture.ui)
  verified_at: 2026-10-22T14:41:49Z
  screenshot: evidence/E12-step1.png
  observed: |
    step1 (E12-step1.png): trang "Mô phỏng đầu tư · Thành phố Hà Nội", hai cột thẻ "Mua & vốn" / "Doanh thu & chi phí vận hành" và hai thẻ kết quả STR/LTR cạnh nhau; ô Giá đêm (ADR) ghi gợi ý "median tự thu: 1188k (n=257)", ô Công suất ghi "median tự thu 90 đêm tới: 27%"; không thấy chữ AirDNA ở đâu trên khung.
    step2 (E12-step2.png): khách mở /deals rơi vào trang "Đăng nhập" (ô Email, Mật khẩu, nút Đăng nhập, link Đăng ký) — không có thẻ căn giá tốt, giá, SĐT hay tên người bán nào lộ ra.
  network_observed: n-a (driver)

- eval: E13
  run_id: portal-deals-airdna-static-20261022214109
  exit_code: 0
  baseline: red
  verifier: scripts/check-portal-compliance.mjs (config:executors.script.portal_static)
  verified_at: 2026-10-22T14:41:10Z
  output: |
    ok   lib/invest.ts không đọc airdna_* / crosswalk S02
    ok   src/lib/invest.ts: không tên AirDNA/nguồn thật trong mã render (0 dòng)
    ok   lib/invest.ts lấy STR từ listing_stats (90 đêm)
    portal-compliance: ĐẠT

- eval: E14
  judged_by: judge-subagent (fresh context, feature-loop:cham-doc, mù diff)
  verdict: UNCERTAIN
  rationale: Đường dự phòng của getDeals đúng thiết kế — câu `full` lỗi trên cloud (thiếu cột seller_* và bảng stg_zalo_posts), catch chuyển sang `noContact`; ba lệnh replace khớp đúng chuỗi nên `noContact` không còn nhắc cột/bảng vắng, khối liên hệ ẩn hết. Nhưng `noContact` vẫn đọc view `v_ruler_p2_area`, và ba tệp bằng chứng không cho biết view có trên cloud không; thiếu view thì câu dự phòng cũng lỗi và trang sập (không có try thứ hai).
  required_evidence:
    - Định nghĩa `CREATE VIEW v_ruler_p2_area` trong `db/migrations/*.sql` (chỉ đọc bảng có trên cloud), kèm `SELECT to_regclass('v_ruler_p2_area')` chạy trên Supabase qua Management API cho thấy view có trên cloud.
  human_override: Mạnh 2026-10-22 — Đạt

- eval: E15
  run_id: design-gate-d71f8f2810
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.gate
  verified_at: 2026-10-22T14:42:19Z
  output: |
    "target": "app/src/app/ops/deals/page.tsx",
    "mode": "dom",
    "verdict": "PASS",
    "p0_count": 0,
    "blocking": [],
    "findings": []

- eval: E15
  run_id: design-gate-59248b43dc
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.gate
  verified_at: 2026-10-22T14:42:20Z
  output: |
    "target": "app/src/components/invest/investment-simulator.tsx",
    "mode": "dom",
    "verdict": "PASS",
    "p0_count": 0,
    "blocking": [],
    "findings": [ { "rule": "single-font", "severity": "warning", "pTier": "P2" } ]

- eval: E15
  run_id: design-gate-5d7701e9e5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.gate
  verified_at: 2026-10-22T14:42:20Z
  output: |
    "target": "app/src/app/(app)/[country]/[market]/dau-tu/page.tsx",
    "mode": "dom",
    "verdict": "PASS",
    "p0_count": 0,
    "blocking": [],
    "findings": []

- eval: E16
  run_id: portal-deals-airdna-E16-20261022214232
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-22T14:42:41Z
  output: |
    > src@0.1.0 lint
    > eslint
    investment-simulator.tsx 142:6 warning react-hooks/exhaustive-deps (có từ trước bản vá)
    user-event-beacon.tsx 51:6 warning react-hooks/exhaustive-deps
    use-file-upload.ts 266:5 warning react-hooks/exhaustive-deps
    ✖ 3 problems (0 errors, 3 warnings)

## Known limits

- AC-3 chỉ được đo trên HTTP thật ở phần SĐT (E4 đếm link `tel:`); tên người bán, tên nhóm, nội dung tin, ảnh tin với user thường chỉ được phủ TĨNH (E5 kiểm 3 khối `showContact &&` trong mã). Đọc mã thấy `groupName` nằm bên trong khối `showContact && (d.sellerPhone || d.sellerName)`, nên phủ tĩnh là khớp — nhưng chưa có lần kiểm HTML nào cho user thường đếm tên/nội dung/ảnh.
- AC-10 phần «khung chụp cho thấy bố cục không đổi»: chỉ có khung sau bản vá của `/vn/hanoi/dau-tu` (E12 step1), không có khung trước bản vá để so, và không có khung nào của `/ops/deals` (cần phiên đăng nhập; capture.ui không mang cookie). E15 chạy design gate chế độ DOM trên mã nguồn TSX, không phải trên trang đang render.
- `config:executors.design.gate` ghim kit bản 2.32.0 trong khi kit đang cài mới nhất là 2.33.1 — kết quả E15 là của bộ dò bản 2.32.0.
- E6 có nhánh tự đạt khi DB local không có tin P1 kèm SĐT (`withPhone = 0`); vòng này DB có 1154 tin nên nhánh đó không kích hoạt — kết quả có nghĩa, nhưng phụ thuộc dữ liệu local.

- E14 / AC-9 — tra theo required_evidence của judge (người điều phối, sau lượt chấm): `v_ruler_p2_area` KHÔNG có trong `db/migrations/` (grep cả repo + lịch sử git: commit 50005b7 nhắc view trong message nhưng migration 027 không định nghĩa nó). Ở DB local view tồn tại, chỉ đọc `properties` / `property_offers` / `sale_offers` (đều được sync-cloud đẩy lên). Không có quyền đọc cloud trong vòng này nên chưa biết view có trên Supabase không. Lỗ này có từ trước bản vá và chạm cả `/api/v1/deals` lẫn `/dau-tu` (cùng đọc view) — không do bản vá gây ra.
- E14 / AC-9 — cập nhật 2026-10-22 từ phiên «Migration cho view thước P2» (truy vấn chỉ đọc trên cloud): cloud ĐÃ CÓ `v_ruler_p2_area` (tạo tay, giống local) nên đường dự phòng chạy được; migration 034 ở nhánh `fix/ruler-p2-views-migration` đưa view vào repo. Nhưng sync cloud đang gãy (cloud `sale_offers` thiếu cột `bathrooms` của 030) nên `sale_offers` trên cloud hiện 0 dòng — `/ops/deals` ở prod sẽ hiện trạng thái trống chứ không lỗi, tới khi Mạnh chạy SQL bắt kịp cloud.

## Ngoài hợp đồng

- Ô «Giá mua» trên `/vn/hanoi/dau-tu` hiện giá trị không làm tròn `85,553775` tr/m² (thấy trong E12-step1). Không do bản vá này gây ra: `useState((defaults.salePerm2 ?? 80e6) / 1e6)` và truy vấn giá bán không nằm trong diff.
- `app/CLAUDE.md` mục Routes vẫn ghi «`/deals` — Căn giá tốt» ở Invest; sau bản vá route đã sang `/ops/deals` — tài liệu module cũ.
- Smoke xác nhận user thường đăng nhập VÀO ĐƯỢC `/ops/deals` («vào được») vì `OPS_EMAILS` trống — đúng như contract đã khai ở Out of scope (siết `canAccessOps` là việc T3 tiếp theo); ghi lại để Mạnh thấy hiện trạng thật.

## Analyst

Non-discriminating evals:
- E8 — green trên cây trước bản vá (36553d0~1) chỉ vì kiểm tra đọc ĐƯỜNG MỚI `src/app/ops/deals/page.tsx`, file này chưa tồn tại ở baseline → chuỗi rỗng → 0 dòng (đạt rỗng). Bản cũ `src/app/(app)/deals/page.tsx` có 4 dòng mã render chứa Zalo/Facebook/Chợ Tốt (badge nguồn dòng 25–26, mô tả dòng 49–50) — nếu kiểm trỏ đúng file cũ thì sẽ red. Đề xuất: viết lại E8/kiểm tĩnh để quét cả route cũ, hoặc khẳng định có file trước khi đếm. E7 (smoke HTTP) vẫn phủ AC-5 ở tầng chạy thật.
- Các eval portal_static còn lại (E2, E5, E10, E13) red trên baseline — phân biệt được.

Baseline khong do:
- E1, E3, E4, E6, E7, E9, E11 (portal_smoke) và E12 (ui-check): cần một dev server chạy cây cũ; đề bài cấm khởi server khác.
- E15 (design gate): chạy theo từng file; một trong ba file (`ops/deals/page.tsx`) không tồn tại ở baseline — không có A/B ý nghĩa.
- E16 (test.app): tsc + lint toàn app trên cây cũ cần cài node_modules riêng cho bản xuất `git archive`; không đo trong vòng này.

## Variance

none — mọi eval chạy một lần, tất định.

## Iterations

Round 1: mọi eval máy (E1–E11, E13, E15, E16) và ui-check E12 đạt trên commit 0e3a25c; E14 (judgment) chờ tác tử chấm mù riêng.
