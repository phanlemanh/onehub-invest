---
schema_version: 2
feature_slug: trang-chu-methodology
verdict: BLOCKED
failed_evals: []
reason: "E19: lệnh chạy đến cuối (không bị công cụ giết, không timeout). next build hoàn tất và in bảng route, nhưng scripts/smoke-trang-chu-loi-db.mjs dừng ngay với thông báo «FAIL cổng 3462 đang có tiến trình khác — tắt nó rồi chạy lại», nên không chạy được ca kiểm tra nào. Nguyên nhân: cổng 3462 đang bị một tiến trình khác giữ. Theo chỉ dẫn không sửa code, không kill tiến trình và không chạy lại nhiều lần, nên không có kết quả đạt/không đạt của smoke. Cách gỡ: giải phóng cổng 3462 rồi chạy lại E19."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c1eda5e5eca4ff6cab7dcc86b6c95fc4645ba0c2
human_signoff:
---

# Evidence Report: trang-chu-methodology

Round 1. Verdict BLOCKED: E19 không chạy được vì cổng 3462 bị chiếm (hạ tầng, không phải lỗi code). Mọi eval máy còn lại đạt; E15 là judgment, hội đồng đề xuất PASS, chờ người.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-2 | script | PASS |
| E5 | AC-3 | test | PASS |
| E6 | AC-3 | script | PASS |
| E7 | AC-4 | test | PASS |
| E8 | AC-5 | test | PASS |
| E9 | AC-6 | test | PASS |
| E10 | AC-7 | test | PASS |
| E11 | AC-8 | test | PASS |
| E12 | AC-9 | test | PASS |
| E13 | AC-9 | test | PASS |
| E14 | AC-10 | test | PASS |
| E15 | AC-10 | judgment | đề xuất PASS (chờ người) |
| E16 | AC-4 | ui-check | PASS |
| E17 | AC-4 | script | PASS |
| E18 | AC-8 | script | PASS |
| E19 | AC-8 | script | BLOCKED |
| E20 | AC-5 | ui-check | PASS |
| E21 | AC-7 | ui-check | PASS |
| E22 | AC-8 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: minted-trang-chu-methodology-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.trang_chu_methodology_smoke
  verified_at: 2026-10-24T23:46:53Z
  output: |
    smoke-trang-chu-methodology: đạt

- eval: E2
  run_id: minted-trang-chu-methodology-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-10-24T23:46:53Z
  output: |
    ℹ duration_ms 62.980375

- eval: E3
  run_id: minted-trang-chu-methodology-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T23:46:53Z
  output: |
    ℹ duration_ms 13400.175

- eval: E4
  run_id: minted-trang-chu-methodology-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.trang_chu_methodology_smoke
  verified_at: 2026-10-24T23:46:53Z
  output: |
    smoke-trang-chu-methodology: đạt

- eval: E5
  run_id: minted-trang-chu-methodology-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T23:46:53Z
  output: |
    ℹ duration_ms 13400.175

- eval: E6
  run_id: minted-trang-chu-methodology-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.trang_chu_methodology_smoke
  verified_at: 2026-10-24T23:46:53Z
  output: |
    smoke-trang-chu-methodology: đạt

- eval: E7
  run_id: minted-trang-chu-methodology-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T23:46:53Z
  output: |
    ℹ duration_ms 13400.175

- eval: E8
  run_id: minted-trang-chu-methodology-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T23:46:53Z
  output: |
    ℹ duration_ms 13400.175

- eval: E9
  run_id: minted-trang-chu-methodology-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T23:46:53Z
  output: |
    ℹ duration_ms 13400.175

- eval: E10
  run_id: minted-trang-chu-methodology-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T23:46:53Z
  output: |
    ℹ duration_ms 13400.175

- eval: E11
  run_id: minted-trang-chu-methodology-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T23:46:53Z
  output: |
    ℹ duration_ms 13400.175

- eval: E12
  run_id: minted-trang-chu-methodology-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-24T23:46:53Z
  output: |
    tsc --noEmit và npm run lint hoàn tất sạch (lệnh kết thúc thành công, không in lỗi).

- eval: E13
  run_id: minted-trang-chu-methodology-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T23:46:53Z
  output: |
    ℹ duration_ms 13400.175

- eval: E14
  run_id: minted-trang-chu-methodology-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-10-24T23:46:53Z
  output: |
    ℹ duration_ms 51.252041

- eval: E17
  run_id: design-gate-c8f243d8ca
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.methodology_design_gate
  verified_at: 2026-10-24T23:46:53Z
  output: |
    design-gate trên definition-grid.tsx (jsdom) kết thúc thành công; JSON kết quả đã in đủ.

- eval: E18
  run_id: design-gate-9cf3acc98c
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.app_crash_design_gate
  verified_at: 2026-10-24T23:46:53Z
  output: |
    design-gate trên app-crash.tsx (jsdom) kết thúc thành công; JSON kết quả đã in đủ.

- eval: E19
  run_id: minted-trang-chu-methodology-E19-r1
  exit_code: n/a (BLOCKED — smoke dừng trước khi chạy ca nào, không có kết quả đạt/không đạt)
  baseline: n-a
  verifier: config:executors.script.trang_chu_loi_db_smoke
  verified_at: 2026-10-24T23:46:53Z
  output: |
    next build chạy xong và in bảng route (có /methodology, /compare, /saved, /yield…).
    Sau đó smoke-trang-chu-loi-db.mjs in: FAIL cổng 3462 đang có tiến trình khác — tắt nó rồi chạy lại.
    Không có ca nào của smoke được chạy. Không giết tiến trình giữ cổng, không chạy lại (theo chỉ dẫn).

- eval: E16
  run_id: e16v
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-24T23:46:53Z
  screenshot: evidence/E16-step1.png
  observed: |
    Đã mở từng frame bằng Read.
    step1 (1280 sáng, full page): header navbar, tiêu đề "Số liệu đến từ đâu, và được tính thế nào", 3 chip; ba nhóm "Chỉ số", "Mô hình lợi suất", "Nguồn dữ liệu" mỗi nhóm là lưới HAI cột kẻ mảnh (đường ngang + một đường dọc giữa), mỗi ô có câu hỏi in đậm kèm câu trả lời hiển thị sẵn, không có accordion cần bấm (ô lẻ cuối nhóm Chỉ số để trống nửa phải). Cuối trang có hàng "Xem các chỉ số trên số thật" với hai nút "Xem thị trường" và "Ước tính lợi suất ->" đọc được, rồi footer.
    step2 (1280 tối): cùng bố cục hai cột kẻ mảnh trên nền đen, chữ tiêu đề trắng, thân chữ xám sáng đọc được, badge "Mô phỏng" vàng nổi trên nền tối, hai nút cuối trang đọc rõ (nút viền sáng + link), navbar nút "Bắt đầu" đảo sang nền sáng. Có chỉ báo "Compiling" của Next dev ở mép trái (artefact dev, không thuộc trang).
    step3 (375 sáng): một cột, mọi câu trả lời hiện sẵn, không tràn ngang (ảnh rộng 375); hàng cuối gồm khối "Xem các chỉ số trên số thật" và hai nút "Xem thị trường", "Ước tính lợi suất ->" xếp dưới, đọc được; footer xuống dòng gọn. Nút N của Next dev chồng nhẹ lên một dòng chữ ở ô "Thế nào là một đêm đã đặt" (artefact dev overlay).
    step4 (1280 sáng, #revpar, ảnh khung nhìn): trang đã cuộn; ô "RevPAR" cùng nội dung hiện ngay dưới navbar (cách khoảng 24px), không bị navbar che, nằm cạnh "Listing hoạt động".
    Đối chiếu Expected: khớp toàn bộ.
  network_observed: no-app-traffic

- eval: E20
  run_id: minted-trang-chu-methodology-E20-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-24T23:46:53Z
  screenshot: evidence/E20-step1.png
  observed: |
    E20-step1 (1280 sáng): nền hero xanh dương đậm với dải sáng chéo mảnh ở đáy và cạnh phải, thẻ trắng 'Thành phố Hà Nội' (Listing 257, Công suất 14,0%, RevPAR 223.917 đ) với 4 hàng phường và thanh chàm/xanh. So với home-truoc light: cùng bố cục, cùng vị trí thẻ và dải sáng. Chỉ khác ở sắc, nền sau ngả chàm-tím hơn (trước là xanh cobalt thuần). Không mất dải. Phần 'Thị trường đang theo dõi' lộ ở đáy ảnh. Số listing 469 so với 456 là dữ liệu, không phải bố cục.
    E20-step2 (1280 tối): nền trang gần đen, hero xanh với cùng dải sáng chéo ở đáy và phải, thẻ tối với 4 hàng phường. Khớp home-truoc dark: bố cục như nhau, chỉ khác sắc, nền hero hơi ngả chàm. Không mất dải.
    E20-step3 (375 sáng): một cột, badge, tiêu đề, ô tìm kiếm, 2 dòng check, rồi khối hero xanh với thẻ trắng bắt đầu ở đáy. Không thấy cắt ngang hay tràn ngang. scrollWidth = clientWidth = 375.
    E20-step4 (1280 sáng, đã cuộn): hai thẻ thị trường Hà Nội và TP.HCM. Dải diện tích ở đáy có nền chàm rất nhạt, vùng chàm đậm gradient đến tím rõ nét, tương phản đủ đọc trên nền sáng. Bên dưới là khối 'Từ thị trường đến một căn', bình thường. Tiêu đề h2 bị thanh header sticky che phần trên do scrollIntoView; không phải lỗi bố cục.
    E20-step5 (1280 tối, đã cuộn): cùng hai thẻ. Dải diện tích có nền chàm tối (navy-tím) và vùng chàm sáng/tím, tương phản rõ trên nền tối, đọc tốt. Bố cục giống bản sáng.
    Kết luận: mọi mệnh đề Expected đều khớp (nền hero xanh có dải sáng giữ nguyên bố cục, khác ở sắc, ở cả sáng lẫn tối; dải chàm đọc rõ ở cả hai nền; 375 px không cuộn ngang).
  network_observed: clean

- eval: E21
  run_id: minted-trang-chu-methodology-E21-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-24T23:46:53Z
  screenshot: evidence/E21-step1.png
  observed: |
    Đã mở từng ảnh bằng Read. E21-step1.png (1280 sáng): navbar One Invest (Sản phẩm, Phương pháp, ô tìm kiếm, nút Bắt đầu) ở trên; ở giữa một Alert đỏ nhạt có tiêu đề 'Không tải được dữ liệu', đoạn mô tả, 'Mã lỗi: 3035486390' (font mono) và nút 'Thử lại' có icon; chân trang ở dưới (Hà Nội, Đã lưu, Phương pháp, Nội bộ, bản quyền). Chữ đọc rõ, tương phản đủ. Góc dưới trái có chỉ báo 'Issues' của Next dev (cố ý gây lỗi, không thuộc app), che một phần mục đầu chân trang. E21-step2.png (1280 tối): nền tối, navbar và chân trang vẫn hiện; Alert nền đỏ sẫm viền đỏ, tiêu đề trắng, mô tả xám sáng, mã lỗi và nút 'Thử lại' đọc được. E21-step3.png (375 sáng): navbar thu gọn (logo, nút menu, tìm kiếm, avatar); Alert rộng bằng chiều ngang trừ lề 16px, nút 'Thử lại' xuống dưới mô tả, mã lỗi hiện đủ; chân trang xuống dòng, chữ bản quyền bị chỉ báo Next dev che một phần (dev overlay). Cả ba khớp Expected.
  network_observed: n-a (driver)

- eval: E22
  run_id: minted-trang-chu-methodology-E22-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-24T23:46:53Z
  screenshot: evidence/E22-step1.png
  observed: |
    step1 (1280 sang): nen trang, giua man hinh mot Alert destructive vien/nen hong nhat, bieu tuong tron do, tieu de "One Invest không mở được", mo ta "Đã có lỗi khi dựng trang. Thử lại sau giây lát; nếu vẫn lỗi, báo cho đội vận hành kèm mã bên dưới.", dong mono "Mã lỗi: 1719932715", nut "Thử lại" (co icon) va "Về trang chủ" (co icon nha). Khong navbar/footer. Chu den tren nen sang, doc ro. step2 (1280 toi): nen gan den, Alert nen nau do dam vien do dam, tieu de va nut chu trang, mo ta xam sang, ma loi xam; bieu tuong do sang; khong navbar; doc ro, nen va chu doi theo giao dien toi. step3 (375 sang): Alert chiem gan het chieu ngang (le ~16px), noi dung xuong dong gon, hai nut "Thử lại" va "Về trang chủ" xep hang duoi mo ta, khong tran ngang, khong navbar, doc ro. Ca ba khop Expected.
  network_observed: clean

- eval: E15
  judged_by: judge panel đề xuất (domain-correctness, operational-feasibility, spec-alignment), chưa có người chốt
  verdict: PASS (đề xuất của hội đồng, chưa có người chốt)
  rationale: Cả ba lens cùng thấy ba tệp (routes.md, catalog.md, app/CLAUDE.md) nhất quán. /methodology là route sống, /phuong-phap chỉ còn là chuyển hướng 301; faq-3 gắn với trang Phương pháp, faq-6 chỉ gắn với trang chủ.
  votes:
    - domain-correctness: PASS — Cả ba tệp nhất quán. /methodology là route sống và /phuong-phap chỉ xuất hiện như chuyển hướng 301 (routes.md dòng 42, app/CLAUDE.md dòng 64). faq-3 gắn với marketing/definition-grid.tsx cho trang Phương pháp, còn faq-6 chỉ gắn với trang chủ (routes.md dòng 41-42, catalog.md dòng 63-64, app/CLAUDE.md dòng 63-64). Hero và card-29 dùng biến palette hoặc cặp dark:, không hex (routes.md dòng 41, catalog.md dòng 60-61). (marketing)/error.tsx và global-error.tsx với states/app-crash.tsx được nêu ở routes.md dòng 41 và catalog.md dòng 26. Chữ «thay faq-6» ở dòng 42 chỉ ghi lại việc đổi block cũ, không phải mâu thuẫn.
    - operational-feasibility: PASS — Ba tệp khớp nhau và không tệp nào liệt /phuong-phap là route sống. routes.md dòng 42 và app/CLAUDE.md dòng 64 đều ghi /methodology với /phuong-phap chuyển 301. faq-3 (definition-grid.tsx) thuộc trang Phương pháp, faq-6 thuộc trang chủ, ở cả routes.md (dòng 41-42), catalog.md (dòng 63-64) và app/CLAUDE.md (dòng 63-64). Nền hero và thẻ thị trường dùng biến palette hoặc cặp dark:, không hex (routes.md dòng 41, catalog.md dòng 60-61). (marketing)/error.tsx và global-error.tsx (states/app-crash.tsx) được nêu nhất quán ở routes.md dòng 41 và catalog.md dòng 26. app/CLAUDE.md không nhắc error.tsx hay global-error nhưng không mâu thuẫn với hai tệp kia.
    - spec-alignment: PASS — Cả ba tệp đều ghi /methodology là trang sống và /phuong-phap chỉ xuất hiện dưới dạng chuyển hướng 301 (routes.md dòng 42, app/CLAUDE.md dòng 64). faq-3 gắn với trang Phương pháp (routes.md dòng 42, catalog.md dòng 64), còn faq-6 chỉ gắn với trang chủ (routes.md dòng 41, catalog.md dòng 63, app/CLAUDE.md dòng 63). Nền hero và dải card-29 dùng biến palette hoặc cặp dark:, không dùng hex (routes.md dòng 41, catalog.md dòng 60). (marketing)/error.tsx và global-error.tsx với states/app-crash.tsx đều được ghi (routes.md dòng 41, catalog.md dòng 26). app/CLAUDE.md không nhắc tới error boundary nhưng cũng không mâu thuẫn với hai tệp kia.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-trang-chu-methodology-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-24T23:46:53Z

- cmd: cd pipeline && npm test
  run_id: minted-trang-chu-methodology-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-24T23:46:53Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-trang-chu-methodology-SUITE-test_lint_rules-r1
  exit_code: khác 0 (đỏ, không ghi số thô vào báo cáo)
  verified_at: 2026-10-24T23:46:53Z
  note: Lệnh này không gắn eval nào. Ca «phủ đúng mọi page.tsx dưới app/src/app» của routes-map.test.mjs báo thiếu trong routes.md hai đường (marketing)/design-pass-loi-trang/page.tsx và design-pass-loi-toan-cuc/page.tsx. Hai tên này trùng với hai route tạm mà bước ui-check E21 và E22 tạo rồi xoá sau khi chụp, nên nhiều khả năng lệnh suite chạy lúc hai thư mục tạm còn trên đĩa. Đây là suy luận từ tên đường dẫn và ghi chú của E21, E22, chưa được chứng minh bằng lần chạy lại. E14 (cùng tệp routes-map.test.mjs, chạy riêng) vẫn đạt. Cần chạy lại suite này khi cây sạch để xác nhận.

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-trang-chu-methodology-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-24T23:46:53Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)

Mọi field baseline ở round này là n-a. Danh sách eval không-phân-biệt (xanh cả HEAD lẫn baseline) rỗng nhưng KHÔNG đo được: không có số đo baseline nên chưa khẳng định được eval nào phân biệt được tính năng mới.

Baseline khong do:
- BASE_URL=${BASE_URL:-http://localhost:3460} node scripts/smoke-trang-chu-methodology.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && npm test: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && npx next build && cd .. && node scripts/smoke-trang-chu-loi-db.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- node /Users/manhphan/.claude/plugins/cache/acceptance-gate-kit/acceptance-gate/2.32.0/scripts/design-gate.mjs --jsdom app app/src/components/marketing/definition-grid.tsx: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- node /Users/manhphan/.claude/plugins/cache/acceptance-gate-kit/acceptance-gate/2.32.0/scripts/design-gate.mjs --jsdom app app/src/components/states/app-crash.tsx: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic)

## Iterations

Round 1: E19 BLOCKED — cổng 3462 bị tiến trình khác giữ nên smoke bản build DB chết không chạy được ca nào; không phải lỗi code. Cần giải phóng cổng rồi chạy lại E19. Suite test:lint-rules đỏ ở ca phủ route, nghi do hai thư mục route tạm của E21/E22 còn trên đĩa lúc chạy; cần chạy lại trên cây sạch. Baseline bị chặn hạ tầng.
