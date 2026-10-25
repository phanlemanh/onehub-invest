---
schema_version: 2
feature_slug: yield-dong-tien-von-vay
verdict: REJECT
failed_evals: [E16]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0121289f97b3a77cb187c7c8c7beefe302608d85
human_signoff:
---

# Evidence Report: yield-dong-tien-von-vay

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-6 | script | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-9 | test | PASS |
| E13 | AC-10 | script | PASS |
| E14 | AC-11 | test | PASS |
| E15 | AC-11 | judgment | PASS (đề xuất của hội đồng, chờ người) |
| E16 | AC-4 | ui-check | FAIL |
| E17 | AC-8 | ui-check | PASS |
| E18 | AC-8 | script | PASS |
| E19 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-yield-dong-tien-von-vay-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yield_dong_tien_smoke
  verified_at: 2026-10-25T01:34:27Z
  output: |
    smoke-yield-dong-tien: ĐẠT

- eval: E2
  run_id: minted-yield-dong-tien-von-vay-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-10-25T01:34:27Z
  output: |
    ℹ duration_ms 62.437125

- eval: E3
  run_id: minted-yield-dong-tien-von-vay-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:34:27Z
  output: |
    ℹ duration_ms 20407.935334

- eval: E4
  run_id: minted-yield-dong-tien-von-vay-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yield_dong_tien_smoke
  verified_at: 2026-10-25T01:34:27Z
  output: |
    smoke-yield-dong-tien: ĐẠT

- eval: E5
  run_id: minted-yield-dong-tien-von-vay-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:34:27Z
  output: |
    ℹ duration_ms 20407.935334

- eval: E6
  run_id: minted-yield-dong-tien-von-vay-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:34:27Z
  output: |
    ℹ duration_ms 20407.935334

- eval: E7
  run_id: minted-yield-dong-tien-von-vay-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:34:27Z
  output: |
    ℹ duration_ms 20407.935334

- eval: E8
  run_id: minted-yield-dong-tien-von-vay-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yield_dong_tien_smoke
  verified_at: 2026-10-25T01:34:27Z
  output: |
    smoke-yield-dong-tien: ĐẠT

- eval: E9
  run_id: minted-yield-dong-tien-von-vay-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:34:27Z
  output: |
    ℹ duration_ms 20407.935334

- eval: E10
  run_id: minted-yield-dong-tien-von-vay-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:34:27Z
  output: |
    ℹ duration_ms 20407.935334

- eval: E11
  run_id: minted-yield-dong-tien-von-vay-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-25T01:34:27Z
  output: |
    tsc --noEmit và npm run lint chạy xong, không có dòng lỗi

- eval: E12
  run_id: minted-yield-dong-tien-von-vay-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:34:27Z
  output: |
    ℹ duration_ms 20407.935334

- eval: E13
  run_id: minted-yield-dong-tien-von-vay-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-25T01:34:27Z
  output: |
    portal-compliance: ĐẠT

- eval: E14
  run_id: minted-yield-dong-tien-von-vay-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-10-25T01:34:27Z
  output: |
    ℹ duration_ms 60.076042

- eval: E18
  run_id: design-gate-5e7e25e4d6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.financing_design_gate
  verified_at: 2026-10-25T01:34:27Z
  output: |
    design-gate chạy với --jsdom app trên app/src/components/yield/financing/financing-grid.tsx; phần cuối đầu ra chỉ còn dấu đóng JSON, lệnh kết thúc bình thường.

- eval: E19
  run_id: minted-yield-dong-tien-von-vay-E19-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yield_dong_tien_smoke
  verified_at: 2026-10-25T01:34:27Z
  output: |
    smoke-yield-dong-tien: ĐẠT

- eval: E16
  run_id: minted-yield-dong-tien-von-vay-E16-r1
  exit_code: 1
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-10-25T01:34:27Z
  screenshot: evidence/E16-step1.png
  observed: |
    E16-step1.png (1280 sáng, URL /yield?area=vn-hanoi#financing): thẻ «Dòng tiền vốn vay» ở giữa khung nhìn. Phụ đề: Khoản vay 4,4 tỷ · Trả nợ 39,2 tr ₫/tháng · Tiền mặt bỏ ra 2 tỷ · Dòng tiền/tiền mặt năm 1 -21,6%. Mỗi mục có dải màu riêng: Doanh thu xanh lục, Chi phí vận hành hổ phách, Thu nhập ròng xanh da trời, Trả nợ vay tím, Dòng tiền sau nợ cam đỏ, So với cho thuê dài hạn xám. Số âm đỏ (−36,3 tr ₫, −435,9 tr ₫, −362,8 tr ₫). Dòng tổng «Lợi nhuận / tiền mặt bỏ ra» -17,5% đến -15,8% màu đỏ. Khớp expected.
    E16-step2.png (1280 tối): cùng bố cục, chữ và dải màu đọc rõ trên nền tối. Nhưng «Dòng tiền sau nợ» (−36,3 tr ₫, −435,9 tr ₫) hiện màu cam; hàng «So với cho thuê dài hạn» (−30,2 tr ₫, −362,8 tr ₫) hiện xám trắng, không đỏ. Chỉ dòng tổng % (-17,5%…) còn đỏ. Mâu thuẫn «số âm đỏ» ở chế độ tối.
    E16-step3.png (cả trang 1280 sáng): form gồm Phường, Số phòng ngủ, Diện tích, Giá mua, nhóm Chi phí vận hành, nhóm «Vốn vay» (nhãn «Mặc định sửa được») với Vốn tự có 30 % giá mua, Lãi suất vay 9 %/năm, Kỳ hạn 20 năm; bên dưới là lưới vốn vay và biểu đồ. Khớp expected.
    E16-step4.png (eq=1#financing): lưới cuộn vào tầm nhìn; phụ đề «Khoản vay 0 · Trả nợ 0/tháng · Tiền mặt bỏ ra 6,4 tỷ · Dòng tiền/tiền mặt năm 1: 0,5%»; hàng Trả nợ vay, Lãi, Gốc đều 0; Dòng tiền sau nợ 2,9 tr đến 34,9 tr dương. Khớp expected.
  network_observed: no-app-traffic
  output: |
    Chụp bằng playwright-cli gọi trực tiếp (server :3460 chạy sẵn).
    PASS curl /vn/hanoi/dau-tu -> 301 Location http://localhost:3460/yield?area=vn-hanoi#financing
    PASS URL sau chuyển hướng ở trình duyệt = http://localhost:3460/yield?area=vn-hanoi#financing
    PASS step1 (1280 sáng): lưới «Dòng tiền vốn vay» trong khung nhìn; dải màu từng mục; dòng tổng % ghim cuối.
    FAIL step2 (1280 tối): số âm của hàng «Dòng tiền sau nợ» hiện CAM, không đỏ (lab(70 42 76)). Nguyên nhân: financing-cells.tsx đặt text-destructive cho số âm nhưng SECTION_TEXT.cash có dark:text-orange-400 đè ở chế độ tối. Hàng «So với cho thuê dài hạn» ở tối trắng xám (foreground/80); ở sáng cả hai hàng đỏ lab(48 77 61). Dòng tổng % đỏ ở cả hai chế độ.
    PASS step3 (/yield?area=vn-hanoi, 1280 sáng): form có nhóm «Vốn vay» 30 % · 9 %/năm · 20 năm.
    PASS step4 (eq=1#financing): Khoản vay 0, Trả nợ 0/tháng, dòng tổng 0,5%.
    Console: 0 lỗi, 1 cảnh báo preload font (không liên quan).
    Kết luận: không đạt vì expected nêu «số âm đỏ, đọc được ở sáng và tối» mà khung tối cho số âm màu cam.

- eval: E17
  run_id: minted-yield-dong-tien-von-vay-E17-r1
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-10-25T01:34:27Z
  screenshot: evidence/E17-step1.png
  observed: |
    E17-step1.png (375 px, sáng): thẻ «Dòng tiền vốn vay» vừa khít màn hình, không thanh cuộn ngang của trang. Lưới hiện cột nút mở (mũi tên) và cột tên khoản mục (Doanh thu ngắn hạn xanh lục, Chi phí vận hành cam, Thu nhập ròng xanh dương, Trả nợ vay tím, Dòng tiền sau nợ đỏ nhạt) có dải màu từng mục, cột «Hằng tháng» thấy ở phía phải (9,9 tr ₫; 7 tr ₫; 2,9 tr ₫; 39,2 tr ₫; −36,3 tr ₫ đỏ). Cột Năm 1 trở đi bị cắt ở mép phải khung, thanh cuộn nhỏ ở hàng cuối. Hàng «Doanh thu ngắn hạn» đang gập (mũi tên >), «Chi phí vận hành» và «Trả nợ vay» mở (mũi tên v) với các dòng con thụt vào.
    E17-step2.png: cùng bố cục sau khi cuộn ngang khung lưới; header cột đổi thành «Năm 1», số liệu Năm 1 (118,4 tr ₫; 83,5 tr ₫; 34,9 tr ₫; 470,8 tr ₫; −435,9 tr ₫; −362,8 tr ₫; hàng cuối −17,5%). Cột nút mở và tên khoản mục vẫn nằm yên bên trái, không có thanh cuộn ngang ở cấp trang. Khớp Expected.
    E17-step3.png (1280 px): lưới đủ cột Hằng tháng, Năm 1 đến Năm 5; hàng «Doanh thu ngắn hạn» đang mở (mũi tên v) và hiện dòng con «Giá/đêm × công suất × 365» (9,9 tr ₫ hằng tháng, 118,4 tr ₫ mỗi năm) ngay dưới; các mục khác không đổi. Bấm lại (xác nhận bằng aria-expanded và đếm hàng, không chụp frame) gập về 12 hàng. Khớp Expected: bấm hàng mục mở/gập đúng mục.
  network_observed: no-app-traffic
  output: |
    Khung đã lưu: evidence/E17-step1.png, E17-step2.png, E17-step3.png, E17-network.txt

- eval: E15
  judged_by: hội đồng judge (ngữ cảnh mới), ba lăng kính
  verdict: PASS
  rationale: |
    - domain-correctness: PASS — Bốn tệp nói nhất quán về việc gộp: app/CLAUDE.md:71, routes.md:51 và CONTEXT.md:359-361 đều nêu mục «Dòng tiền vốn vay» #financing, tham số eq/rate/term và 301 sang /yield?area=<market>#financing; routes.md:51 và catalog.md:65 ghi bản chuyển thể chỉ đọc của data-grid-advanced-7 ở yield/financing/. Mọi chỗ nhắc /dau-tu đều ghi là «cũ» hoặc «slug cũ». CONTEXT.md:173 còn «Lợi suất và Mô phỏng đầu tư» nhưng dòng 359 đã định nghĩa thuật ngữ đó là đã gộp.
    - operational-feasibility: PASS — CONTEXT.md (359-361), app/CLAUDE.md (71), routes.md (51, 75) và catalog.md (65) khớp nhau về việc /dau-tu đã gộp vào /yield. Không tệp nào liệt /dau-tu là route sống. Dòng 173 của CONTEXT.md là tên thuật ngữ đã định nghĩa là đã gộp, không phải route sống.
    - spec-alignment: PASS — routes.md dòng 51, catalog.md dòng 65, CONTEXT.md dòng 359-361 và app/CLAUDE.md dòng 71 nhất quán; không tệp nào liệt /dau-tu là route sống. CONTEXT.md dòng 173 nhắc «Mô phỏng đầu tư» như thuật ngữ đã gộp nên không đủ để coi là mô tả bộ mô phỏng cũ đang chạy.
  required_evidence:
    - (không có — hội đồng đề xuất PASS)
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-yield-dong-tien-von-vay-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-25T01:34:27Z

- cmd: cd pipeline && npm test
  run_id: minted-yield-dong-tien-von-vay-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-25T01:34:27Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-yield-dong-tien-von-vay-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-25T01:34:27Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)

Baseline khong do:
- BASE_URL=${BASE_URL:-http://localhost:3460} node scripts/smoke-yield-dong-tien.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && npm test: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- node scripts/check-portal-compliance.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- node /Users/manhphan/.claude/plugins/cache/acceptance-gate-kit/acceptance-gate/2.32.0/scripts/design-gate.mjs --jsdom app app/src/components/yield/financing/financing-grid.tsx: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)

none — moi eval feature deu red tren baseline (co phan biet). Lưu ý: ở round này baseline bị chặn hạ tầng nên danh sách eval không-phân-biệt không đo được; câu trên chỉ có nghĩa là máy không phát hiện eval nào xanh ở cả hai phía.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E16 failed — ở chế độ tối, số âm của hàng «Dòng tiền sau nợ» hiện màu cam (dark:text-orange-400 của SECTION_TEXT.cash đè text-destructive trong financing-cells.tsx) và hàng «So với cho thuê dài hạn» hiện xám trắng thay vì đỏ, trái expected «số âm đỏ, đọc được ở sáng và tối». Returned to implementation.
