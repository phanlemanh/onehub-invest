---
schema_version: 2
feature_slug: trang-chu-methodology
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 25b497892d873b6e9db1396d920e256fc0cd7c10
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: trang-chu-methodology

Round 2. Mọi eval máy đạt trên cây af67b7d. E19 (smoke bản build, DB chết, cổng trống do hệ điều hành cấp) chạy xong, hết bị chặn như round 1. Bảy eval không bị delta chạm được mang sang từ round 1 (E2, E12, E14, E16, E17, E18, E20). E15 là judgment: hội đồng đề xuất PASS, ô human_override để trống cho người.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | test | PASS (mang sang từ round 1) |
| E3 | AC-2 | test | PASS |
| E4 | AC-2 | script | PASS |
| E5 | AC-3 | test | PASS |
| E6 | AC-3 | script | PASS |
| E7 | AC-4 | test | PASS |
| E8 | AC-5 | test | PASS |
| E9 | AC-6 | test | PASS |
| E10 | AC-7 | test | PASS |
| E11 | AC-8 | test | PASS |
| E12 | AC-9 | test | PASS (mang sang từ round 1) |
| E13 | AC-9 | test | PASS |
| E14 | AC-10 | test | PASS (mang sang từ round 1) |
| E15 | AC-10 | judgment | đề xuất PASS (chờ người) |
| E16 | AC-4 | ui-check | PASS (mang sang từ round 1) |
| E17 | AC-4 | script | PASS (mang sang từ round 1) |
| E18 | AC-8 | script | PASS (mang sang từ round 1) |
| E19 | AC-8 | script | PASS |
| E20 | AC-5 | ui-check | PASS (mang sang từ round 1) |

## Evidence

- eval: E1
  run_id: minted-trang-chu-methodology-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.trang_chu_methodology_smoke
  verified_at: 2026-10-25T00:01:52Z
  output: |
    smoke-trang-chu-methodology: đạt

- eval: E3
  run_id: minted-trang-chu-methodology-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:01:52Z
  output: |
    ℹ duration_ms 11825.151042

- eval: E4
  run_id: minted-trang-chu-methodology-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.trang_chu_methodology_smoke
  verified_at: 2026-10-25T00:01:52Z
  output: |
    smoke-trang-chu-methodology: đạt

- eval: E5
  run_id: minted-trang-chu-methodology-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:01:52Z
  output: |
    ℹ duration_ms 11825.151042

- eval: E6
  run_id: minted-trang-chu-methodology-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.trang_chu_methodology_smoke
  verified_at: 2026-10-25T00:01:52Z
  output: |
    smoke-trang-chu-methodology: đạt

- eval: E7
  run_id: minted-trang-chu-methodology-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:01:52Z
  output: |
    ℹ duration_ms 11825.151042

- eval: E8
  run_id: minted-trang-chu-methodology-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:01:52Z
  output: |
    ℹ duration_ms 11825.151042

- eval: E9
  run_id: minted-trang-chu-methodology-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:01:52Z
  output: |
    ℹ duration_ms 11825.151042

- eval: E10
  run_id: minted-trang-chu-methodology-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:01:52Z
  output: |
    ℹ duration_ms 11825.151042

- eval: E11
  run_id: minted-trang-chu-methodology-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:01:52Z
  output: |
    ℹ duration_ms 11825.151042

- eval: E13
  run_id: minted-trang-chu-methodology-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:01:52Z
  output: |
    ℹ duration_ms 11825.151042

- eval: E19
  run_id: minted-trang-chu-methodology-E19-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.trang_chu_loi_db_smoke
  verified_at: 2026-10-25T00:01:52Z
  output: |
    smoke-trang-chu-loi-db: đạt

- eval: E2
  run_id: minted-trang-chu-methodology-E2-r1
  exit_code: 0
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-10-24T23:46:53Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E12
  run_id: minted-trang-chu-methodology-E12-r1
  exit_code: 0
  verifier: config:executors.test.app
  verified_at: 2026-10-24T23:46:53Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E14
  run_id: minted-trang-chu-methodology-E14-r1
  exit_code: 0
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-10-24T23:46:53Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E16
  run_id: e16v
  exit_code: 0
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-24T23:46:53Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval
  screenshot: evidence/E16-step1.png
  observed: |
    Đã mở từng frame bằng Read.
    step1 (1280 sáng, full page): header navbar, tiêu đề "Số liệu đến từ đâu, và được tính thế nào", 3 chip; ba nhóm "Chỉ số", "Mô hình lợi suất", "Nguồn dữ liệu" mỗi nhóm là lưới HAI cột kẻ mảnh (đường ngang + một đường dọc giữa), mỗi ô có câu hỏi in đậm kèm câu trả lời hiển thị sẵn, không có accordion cần bấm (ô lẻ cuối nhóm Chỉ số để trống nửa phải). Cuối trang có hàng "Xem các chỉ số trên số thật" với hai nút "Xem thị trường" và "Ước tính lợi suất ->" đọc được, rồi footer.
    step2 (1280 tối): cùng bố cục hai cột kẻ mảnh trên nền đen, chữ tiêu đề trắng, thân chữ xám sáng đọc được, badge "Mô phỏng" vàng nổi trên nền tối, hai nút cuối trang đọc rõ (nút viền sáng + link), navbar nút "Bắt đầu" đảo sang nền sáng. Có chỉ báo "Compiling" của Next dev ở mép trái (artefact dev, không thuộc trang).
    step3 (375 sáng): một cột, mọi câu trả lời hiện sẵn, không tràn ngang (ảnh rộng 375); hàng cuối gồm khối "Xem các chỉ số trên số thật" và hai nút "Xem thị trường", "Ước tính lợi suất ->" xếp dưới, đọc được; footer xuống dòng gọn. Nút N của Next dev chồng nhẹ lên một dòng chữ ở ô "Thế nào là một đêm đã đặt" (artefact dev overlay).
    step4 (1280 sáng, #revpar, ảnh khung nhìn): trang đã cuộn; ô "RevPAR" cùng nội dung hiện ngay dưới navbar (cách khoảng 24px), không bị navbar che, nằm cạnh "Listing hoạt động".
    Đối chiếu Expected: khớp toàn bộ.
  network_observed: no-app-traffic

- eval: E17
  run_id: design-gate-c8f243d8ca
  exit_code: 0
  verifier: config:executors.script.methodology_design_gate
  verified_at: 2026-10-24T23:46:53Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E18
  run_id: design-gate-9cf3acc98c
  exit_code: 0
  verifier: config:executors.script.app_crash_design_gate
  verified_at: 2026-10-24T23:46:53Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E20
  run_id: minted-trang-chu-methodology-E20-r1
  exit_code: 0
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-24T23:46:53Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval
  screenshot: evidence/E20-step1.png
  observed: |
    E20-step1 (1280 sáng): nền hero xanh dương đậm với dải sáng chéo mảnh ở đáy và cạnh phải, thẻ trắng 'Thành phố Hà Nội' (Listing 257, Công suất 14,0%, RevPAR 223.917 đ) với 4 hàng phường và thanh chàm/xanh. So với home-truoc light: cùng bố cục, cùng vị trí thẻ và dải sáng. Chỉ khác ở sắc, nền sau ngả chàm-tím hơn (trước là xanh cobalt thuần). Không mất dải. Phần 'Thị trường đang theo dõi' lộ ở đáy ảnh. Số listing 469 so với 456 là dữ liệu, không phải bố cục.
    E20-step2 (1280 tối): nền trang gần đen, hero xanh với cùng dải sáng chéo ở đáy và phải, thẻ tối với 4 hàng phường. Khớp home-truoc dark: bố cục như nhau, chỉ khác sắc, nền hero hơi ngả chàm. Không mất dải.
    E20-step3 (375 sáng): một cột, badge, tiêu đề, ô tìm kiếm, 2 dòng check, rồi khối hero xanh với thẻ trắng bắt đầu ở đáy. Không thấy cắt ngang hay tràn ngang. scrollWidth = clientWidth = 375.
    E20-step4 (1280 sáng, đã cuộn): hai thẻ thị trường Hà Nội và TP.HCM. Dải diện tích ở đáy có nền chàm rất nhạt, vùng chàm đậm gradient đến tím rõ nét, tương phản đủ đọc trên nền sáng. Bên dưới là khối 'Từ thị trường đến một căn', bình thường. Tiêu đề h2 bị thanh header sticky che phần trên do scrollIntoView; không phải lỗi bố cục.
    E20-step5 (1280 tối, đã cuộn): cùng hai thẻ. Dải diện tích có nền chàm tối (navy-tím) và vùng chàm sáng/tím, tương phản rõ trên nền tối, đọc tốt. Bố cục giống bản sáng.
    Kết luận: mọi mệnh đề Expected đều khớp (nền hero xanh có dải sáng giữ nguyên bố cục, khác ở sắc, ở cả sáng lẫn tối; dải chàm đọc rõ ở cả hai nền; 375 px không cuộn ngang).
  network_observed: clean

- eval: E15
  judged_by: judge panel đề xuất (domain-correctness, operational-feasibility, spec-alignment), chưa có người chốt
  verdict: PASS (đề xuất của hội đồng, chưa có người chốt)
  rationale: Cả ba lens cùng thấy ba tệp (routes.md, catalog.md, app/CLAUDE.md) nhất quán. /methodology là route sống, /phuong-phap chỉ còn là chuyển hướng 301; faq-3 gắn với trang Phương pháp, faq-6 chỉ gắn với trang chủ.
  votes:
    - domain-correctness: PASS — Ba tệp nhất quán: /methodology là route sống, /phuong-phap chỉ là 301 (routes.md, app/CLAUDE.md); faq-3 qua marketing/definition-grid.tsx mở sẵn cho Phương pháp, faq-6 chỉ cho trang chủ (cả ba tệp); nền hero và card-29 dùng biến palette có cặp dark:, không hex (routes.md, catalog.md); (marketing)/error.tsx và global-error.tsx/states/app-crash.tsx được ghi ở routes.md và catalog.md, còn app/CLAUDE.md không nhắc nhưng không mâu thuẫn. Lệch nhỏ ngoài phạm vi: app/CLAUDE.md dòng 20 còn liệt /login dưới (app).
    - operational-feasibility: PASS — Cả ba tệp nhất quán: routes.md (dòng `/` và `/methodology`) và app/CLAUDE.md (mục Routes) đều ghi /methodology là route sống và /phuong-phap chỉ là 301. Cả ba đều gắn faq-3 với trang Phương pháp (định nghĩa mở sẵn, `definition-grid.tsx` ở routes.md và catalog.md) và giữ faq-6 cho trang chủ. routes.md và catalog.md nói nền hero và thẻ thị trường dùng biến palette hoặc cặp `dark:` thay vì hex. routes.md và catalog.md cũng khớp về `(marketing)/error.tsx` và `global-error.tsx` dùng `states/app-crash.tsx`. Tôi không thấy chỗ nào liệt /phuong-phap là route sống hay ghi faq-6 cho trang Phương pháp.
    - spec-alignment: PASS — Ba tệp không mâu thuẫn nhau. Chỉ routes.md nhắc /phuong-phap, và nó ghi đó là 301 trong next.config.ts, còn /methodology là route sống. routes.md và catalog.md đều gán faq-3 (definition-grid.tsx, mở sẵn) cho trang Phương pháp và faq-6 cho trang chủ. Cả hai nói nền hero và dải card-29 dùng biến palette/cặp dark:, không hex. routes.md ghi (marketing)/error.tsx và global-error.tsx, catalog.md ghi states/app-crash.tsx trong global-error. app/CLAUDE.md chỉ dùng /methodology, liệt faq-6 cho trang chủ, và không nhắc error.tsx hay màu.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-trang-chu-methodology-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-25T00:01:52Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-trang-chu-methodology-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-25T00:01:52Z

- cmd: cd pipeline && npm test
  run_id: minted-trang-chu-methodology-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-25T00:01:52Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-trang-chu-methodology-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-25T00:01:52Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-trang-chu-methodology-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-25T00:01:52Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)

Mọi field baseline của eval chạy ở round này là n-a; các eval mang sang từ round 1 không chạy lại nên không có field baseline.

Baseline khong do:
- BASE_URL=${BASE_URL:-http://localhost:3460} node scripts/smoke-trang-chu-methodology.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && npm test: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && npx next build && cd .. && node scripts/smoke-trang-chu-loi-db.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)

none — moi eval feature deu red tren baseline (co phan biet)

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic)

## Iterations

Round 1: E19 BLOCKED — cổng 3462 bị tiến trình khác giữ nên smoke bản build DB chết không chạy được ca nào; không phải lỗi code. Suite test:lint-rules đỏ ở ca phủ route, nghi do hai thư mục route tạm của E21/E22 còn trên đĩa lúc chạy. Baseline bị chặn hạ tầng.
Round 2: không eval nào đỏ. Smoke E19 đã lấy cổng trống do hệ điều hành cấp và chạy hết; suite test:lint-rules xanh sau khi bỏ route tạm. E21 và E22 bị xoá khỏi evals (ảnh lỗi toàn cục nay do smoke E19 ghi). E2, E12, E14, E16, E17, E18, E20 mang sang từ round 1 vì delta không chạm paths của chúng. Baseline vẫn bị chặn hạ tầng.

### Re-pin lần 1 — 2026-10-25, do hoá cũ do gộp main #75
run_id: repin-20261025T004528Z-64975
sha: 25b497892d873b6e9db1396d920e256fc0cd7c10 · suites: 6 lệnh exit 0 · evals: 17/17 eval máy đạt kỳ vọng · ngoài làn máy: E15, E16, E20 · diff chạm vật đo ngoài làn máy: E15 — chưa chứng lại, đi vòng S4 delta
