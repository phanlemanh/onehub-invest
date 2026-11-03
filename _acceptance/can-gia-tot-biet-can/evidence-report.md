---
schema_version: 2
feature_slug: can-gia-tot-biet-can
verdict: REJECT
failed_evals: ["E9"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7b3c62a2019d4cf7eaba08a5af7faec786323ee6
human_signoff:
---

# Evidence Report: can-gia-tot-biet-can

Round 3. Nội dung thay toàn bộ round cũ, lịch sử round nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E11 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E12 | AC-6 | test | PASS (carry-forward từ round 2) |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | ui-check | FAIL |
| E10 | AC-10 | script | PASS |
| E13 | AC-11 | test | PASS |
| E14 | AC-12 | test | PASS |

Lệnh đỏ không gắn eval nào: `cd pipeline && npm test` (một ca đỏ, GS-AC-2 trong scripts/gan-sdt-s06.test.mjs, lỗi không lấy được khoá bảng public.field_assertions; ca này nằm ngoài các tệp của tính năng) và `ui-check:E9` (gắn E9, xem dưới).

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-biet-can-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 8226.013125

- eval: E2
  run_id: minted-can-gia-tot-biet-can-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 8226.013125

- eval: E3
  run_id: minted-can-gia-tot-biet-can-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 8226.013125

- eval: E11
  run_id: minted-can-gia-tot-biet-can-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.can_gia_tot_quet_ma
  verified_at: 2026-11-03T13:08:19Z
  output: |
    quét dealMediaSrc, deals-gate, routes.md, can-gia-tot-quet-ma.test.mjs, test:lint-rules
    ℹ duration_ms 314.128334

- eval: E4
  run_id: minted-can-gia-tot-biet-can-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 8226.013125

- eval: E5
  run_id: minted-can-gia-tot-biet-can-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 8226.013125

- eval: E6
  run_id: minted-can-gia-tot-biet-can-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 8226.013125

- eval: E12
  run_id: minted-can-gia-tot-biet-can-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.deals_lien_he
  verified_at: 2026-11-03T12:01:51Z
  carried_from_round: 2
  note: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-can-gia-tot-biet-can-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 8226.013125

- eval: E8
  run_id: minted-can-gia-tot-biet-can-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot_doi_chieu
  verified_at: 2026-11-03T13:08:19Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-doi-chieu.test.tsx
    ℹ duration_ms 360554.266708

- eval: E9
  run_id: E9-verify-2026-11-03
  exit_code: 1
  baseline: n-a
  verifier: executor ui-check (không khai ref trong eval)
  verified_at: 2026-11-03T13:08:19Z
  screenshot: evidence/E9-step1.png
  observed: |
    Đã mở và đọc từng ảnh. Số, tên, chữ bài và ảnh thật đều bị làm mờ bằng CSS blur trước khi chụp.
    - step1 (1280 sáng): tab «Đủ để gọi» đang chọn, chip «Phường là <phường>» đã thêm. Số trên tab đổi từ 4/0/1/3 thành 1/0/0/1; bảng hiện «Mục này chưa có căn.» (chỉ có chữ, không có nút hành động).
    - step2: sheet căn 1 mở, bộ đếm 1/4, hai tab «Chi tiết» và «Căn cùng tiêu chí 0». Bảng phía sau bị phủ mờ.
    - step3: tab «Căn cùng tiêu chí» trống, có nút «Xem mọi căn trong phường». Bộ đếm vẫn 1/4.
    - step4: lightbox «Căn · ảnh 1/5», có nút Ảnh trước/Ảnh sau. step4b: sau khi bấm «Ảnh sau» là ảnh 2/5.
    - step4c: trang một căn, lưới 5 ảnh. step4d: sau history.back() về bảng thì sheet căn 4 tự mở lại (?can=). step4e: sau Esc sheet đóng, hàng 4 giữ data-state=selected, nền oklab muted 0.5, các hàng khác trong suốt.
    - step4f: căn 2 hiện 5 ô «Ảnh hỏng», không vỡ.
    - step5, step5b, step6 (1280 tối): bảng, sheet và tab cùng tiêu chí đều đọc được. Contrast đo được ≥ 6,5.
    - step7 (390 sáng): bảng chỉ còn cột Căn và Giá. Mức giảm hiện dưới giá, không cần cuộn. Nhưng có thanh cuộn ngang bên trong bảng, vùng cuộn rộng 906 px trong khung 348 px, cột Giảm/Tình trạng/Gọi ai/Thấy đã bị ẩn. Thanh tab ngoài cũng bị cắt ở «Cần xác minh», «Còn thiếu» nằm ngoài khung.
    - step8, step9 (390 sheet và tab cùng tiêu chí): không tràn ngang, đọc được.
    Đối chiếu Expected: chip, tab, J, K, tab cùng tiêu chí, đường về bảng và nền hàng đã xem đều đúng. Điểm lệch duy nhất: bảng ở 390 px tràn ngang bên trong (xem outputTail).
  network_observed: clean
  output: |
    Driver: ego-browser (ego lite) qua CDP Emulation.setDeviceMetricsOverride. Ảnh lưu bằng page.screenshot. Server :3460 là next-server của chính worktree (cwd khớp), dùng chung nên không tắt. Phiên là ops-role-test@local.test, vai Vận hành, mở ra «Vận hành».
    Dữ liệu thật chỉ có 4 căn: tab Tất cả 4, Đủ để gọi 0, Cần xác minh 1, Còn thiếu 3.

    PASS
    - Tab «Đủ để gọi» bấm được (tab đổi, bảng rỗng). Chip Phường/là/<giá trị>: thêm được, số trên tab đổi 4/0/1/3 thành 1/0/0/1, bấm «Xoá» thì về 4/0/1/3.
    - Mở hàng: ?can= đổi, bộ đếm 1/4. Phím J sang căn 2/4, phím K về 1/4. Hàng chọn có data-state=selected.
    - Tab «Căn cùng tiêu chí»: mở được, trống, có nút hành động. Cả 4 căn đều hiện 0.
    - Lightbox: ảnh 1/5 sang 2/5 sang đóng. Nút «Mở trang một căn» dẫn tới /ops/deals/offer_X, quay về mở lại sheet, Esc đóng sheet, hàng căn 4 giữ nền chọn.
    - Nút gọi trong hàng: 4/4 href khớp tel:+84 theo regex ^tel:\+84\d{8,10}$. Bấm vào thì URL vẫn /ops/deals, 0 dialog, không hàng nào selected.
    - Số căn thấy trọn trên 1280x800: 4/4 căn (cả 4 hàng, thanh phân trang «1–4 / 4»).
    - Chữ ở 1280 sáng và tối: tỉ lệ tương phản đo bằng canvas, tab/th/tiêu đề ≥ 6,5 ở tối; nhãn dt 4,74 và mô tả cảnh báo 4,63 ở sáng. Không có chữ nào dưới 4,5.
    - Ảnh trong sheet, naturalWidth: căn 1 không có dòng media (DB: 0 dòng media; sheet «Chưa có ảnh»). Căn 2 có 5 dòng media đều qua proxy, 0 img, 5 «Ảnh hỏng», tỉ lệ hỏng 5/5 = 100%. Căn 3: [784, 1042], hỏng 0/2. Căn 4: [2568, 2568, 1920, 1280, 960], hỏng 0/5.
    - Căn 2 trên 50% hỏng nhưng thuộc ngoại lệ E10: chạy node scripts/can-gia-tot-ba-vai.mjs ra kết quả đạt, «n căn = 4 · căn có dòng media 3 · tải được ảnh 2 · chỉ còn link hết hạn 1», ?media= vai Vận hành tải được 0/5. Vì vậy không tính là lỗi.
    - 390 sheet: scrollWidth 389 = clientWidth 389 (dialog và vùng cuộn). 390 sheet cùng tiêu chí: 389 = 389. Tài liệu ở cả ba màn 390: docSW 390 = docCW 390, bodySW 390.
    - Mức giảm ở 390 px: nằm dưới giá, vis=true trong khung, không cần cuộn.
    - Đã bật/tắt lại: localStorage theme về «light».

    KHÔNG ĐO ĐƯỢC TRÊN DỮ LIỆU THẬT (do E13, E14 chứng trên fixture)
    - Chuyển trang: chỉ 1 trang, 4 căn, trang 15 hàng.
    - Tab «Căn cùng tiêu chí» có căn: cả 4 căn đều 0.
    - Chip Phường chọn giá trị trong «Đủ để gọi» không thể kiểm kết quả có hàng, vì tab này 0 căn. Chip chạy đúng ở mức số trên tab.

    ĐỎ (nên eval không đạt)
    - 390 px, bảng: tài liệu không tràn ngang (390 = 390), nhưng vùng cuộn của bảng data-grid có scrollWidth 906 so với clientWidth 348 và hiện thanh cuộn ngang. Nguyên nhân đo được: <th> bị display:none nhưng <colgroup>/<col> vẫn giữ độ rộng 190+120+150+110, nên bảng rộng 906 px. Expected «scrollWidth = clientWidth ở 390 px» và AC-9 «không tràn ngang ở 390 px» không đạt ở bảng. Cuộn sang phải chỉ thấy vùng trống.
    - Quan sát thêm, không tính vào kết luận: thanh tab ngoài bảng ở 390 px bị cắt (scrollWidth 465, «Còn thiếu» ra ngoài khung). Empty state «Mục này chưa có căn.» chỉ có chữ, không có nút hành động, trái với ghi chú design-pass «danh sách trống đổi sang ui/empty có hành động».

    Ghi chú che dữ liệu: ảnh chứng đã blur các ô dữ liệu, ảnh thật, SĐT, tên. Một vài ảnh còn lộ phần mờ nhẹ ở phường (tên địa lý công khai) và nhãn «unknown» ở chân sheet căn 1. Ảnh E9-step6b-dark-tab.png trong thư mục evidence là bản cũ không phải của lần chạy này.

    NETWORK: ego-browser không có read_network_requests, nên dùng Resource Timing responseStatus (4 căn mở sheet) và ghi vào evidence/E9-network.txt. Có traffic app-origin: script/link /_next, img zalo-media ?snapshot= 7 lần thành công, img ?media= 6 lần lỗi phía proxy. Không có third-party và không có fetch/XHR lỗi. Phần lỗi là ảnh qua proxy của căn 2 (link hết hạn), thuộc static asset nên chỉ ghi chú. Console không đọc được.

    Frame đã lưu trong /Users/manhphan/dev/onehub-invest/.claude/worktrees/nhan-kit-2-36-0-7d7813/_acceptance/can-gia-tot-biet-can/evidence/: E9-step1.png, E9-step2.png, E9-step3.png, E9-step4.png, E9-step4b-lightbox2.png, E9-step4c-trang-mot-can.png, E9-step4d-ve-bang.png, E9-step4e-hang-vua-xem.png, E9-step4f-anh-hong.png, E9-step5.png, E9-step5b-sheet-dark.png, E9-step6.png, E9-step7.png, E9-step8.png, E9-step9.png, E9-network.txt.

- eval: E10
  run_id: minted-can-gia-tot-biet-can-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.can_gia_tot_ba_vai
  verified_at: 2026-11-03T13:08:19Z
  output: |
    CGT ba vai: ĐẠT

- eval: E13
  run_id: minted-can-gia-tot-biet-can-E13-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 8226.013125

- eval: E14
  run_id: minted-can-gia-tot-biet-can-E14-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 8226.013125

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-can-gia-tot-biet-can-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-03T13:08:19Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-can-gia-tot-biet-can-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-03T13:08:19Z

- cmd: cd app && npm test
  run_id: minted-can-gia-tot-biet-can-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-03T13:08:19Z

- cmd: cd pipeline && npm test
  run_id: minted-can-gia-tot-biet-can-SUITE-npm_test__13563d-r3
  exit_code: 1
  verified_at: 2026-11-03T13:08:19Z
  note: 439 ca, 438 đạt, 1 đỏ (GS-AC-2 trong scripts/gan-sdt-s06.test.mjs, không lấy được khoá bảng public.field_assertions). Lệnh không gắn eval nào.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-can-gia-tot-biet-can-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-03T13:08:19Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-can-gia-tot-biet-can-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-03T13:08:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Baseline không đo: mọi eval ghi `baseline: n-a` vì round này không đo lại (evals.yaml không đổi từ lần baseline cuối).

Eval không phân biệt (xanh cả trên HEAD lẫn baseline), cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý:
- `cd app && node --import tsx --test tests/danh-ba-nguoi-deals-lien-he.test.tsx` (E12)

## Variance

none — không eval nào chạy nhiều lần, không có phương sai.

Judge panels: không có eval judgment nào trong round này, không có panel để đề xuất.

## Iterations

Round 1: baseline được đo, chi tiết xem lịch sử run-log.
Round 2: E12 chạy và đạt, được mang sang round 3.
Round 3: E9 đỏ — bảng ở 390 px có vùng cuộn ngang bên trong (906 px trong khung 348 px) vì colgroup giữ độ rộng cột đã ẩn; AC-9 «không tràn ngang ở 390 px» không đạt ở bảng. Pipeline suite có một ca đỏ ngoài tính năng (GS-AC-2, khoá bảng). Trả về implementation.
