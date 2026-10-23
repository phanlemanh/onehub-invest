---
schema_version: 2
feature_slug: ui-clean-b1-ops
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d1270328ec4a69050f263e89c9b1b94fdf49b116
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: ui-clean-b1-ops

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | test | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-11 | script | PASS |
| E11 | AC-2 | script | PASS |
| E12 | AC-6 | ui-check | PASS |
| E13 | AC-10 | ui-check | PASS |
| E14 | AC-9 | ui-check | PASS |
| E15 | AC-12 | script | PASS |
| E16 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: ui-clean-b1-ops-E1-20261023T013939Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_suppressions
  command: node scripts/ui-standards/b1-ops.mjs suppressions
  verified_at: 2026-10-23T01:39:50Z
  output: |
    b1-ops suppressions
      OK  0 mục baseline + 0 eslint-disable onehub-ui trong 42 tệp phạm vi

- eval: E2
  run_id: ui-clean-b1-ops-E2-20261023T013907Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  command: cd app && npx tsc --noEmit && npm run lint
  verified_at: 2026-10-23T01:39:11Z
  output: |
    > src@0.1.0 lint
    > eslint && node eslint-plugin-onehub-ui/check-bare-disables.mjs
    app/src/components/invest/investment-simulator.tsx 142:6 warning react-hooks/exhaustive-deps
    app/src/components/user-event-beacon.tsx 51:6 warning react-hooks/exhaustive-deps
    app/src/hooks/use-file-upload.ts 266:5 warning react-hooks/exhaustive-deps
    ✖ 3 problems (0 errors, 3 warnings)
    (tsc --noEmit không in gì; 3 cảnh báo cũ nằm ngoài phạm vi B1)

- eval: E3
  run_id: ui-clean-b1-ops-E3-20261023T013950Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_handdrawn
  command: node scripts/ui-standards/b1-ops.mjs handdrawn
  verified_at: 2026-10-23T01:39:55Z
  output: |
    b1-ops handdrawn
      OK  không khung tự kẻ, không ký tự làm icon

- eval: E4
  run_id: ui-clean-b1-ops-E4-20261023T013955Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_frame
  command: node scripts/ui-standards/b1-ops.mjs frame
  verified_at: 2026-10-23T01:40:00Z
  output: |
    b1-ops frame
      OK  5 trang: PageHeader đứng đầu, không tự viết h1

- eval: E5
  run_id: ui-clean-b1-ops-E5-20261023T014000Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_one_way
  command: node scripts/ui-standards/b1-ops.mjs one-way
  verified_at: 2026-10-23T01:40:05Z
  output: |
    b1-ops one-way
      OK  mỗi trang dựng từ đúng block đã chọn; không bảng tự dựng

- eval: E6
  run_id: ui-clean-b1-ops-E6-20261023T014005Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_dialogs
  command: node scripts/ui-standards/b1-ops.mjs dialogs
  verified_at: 2026-10-23T01:40:10Z
  output: |
    b1-ops dialogs
      OK  không hộp thoại gốc; xác nhận phá huỷ = AlertDialog; mọi kết quả qua toast

- eval: E7
  run_id: ui-clean-b1-ops-E7-20261023T014010Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_api_contract
  command: node scripts/ui-standards/b1-ops.mjs api-contract
  verified_at: 2026-10-23T01:40:15Z
  output: |
    b1-ops api-contract
      OK  11 lời gọi khớp bản chụp; bản chụp phủ đủ 11 phần tử ma trận viết tay

- eval: E8
  run_id: ui-clean-b1-ops-E8-20261023T013928Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_lint_rules
  command: cd app && npm run test:lint-rules
  verified_at: 2026-10-23T01:39:28Z
  output: |
    ✔ routes.md của skill onehub-ui (5.603083ms)
    ℹ tests 163
    ℹ suites 50
    ℹ pass 163
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
    ℹ todo 0
    ℹ duration_ms 208.184

- eval: E9
  run_id: ui-clean-b1-ops-E9-20261023T014015Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_design_page
  command: node scripts/ui-standards/b1-ops.mjs design-page
  verified_at: 2026-10-23T01:40:20Z
  output: |
    b1-ops design-page
      OK  trang trưng bày đủ mẫu, đủ block, không chữ thuật ngữ dev

- eval: E10
  run_id: ui-clean-b1-ops-E10-20261023T014020Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_docs
  command: node scripts/ui-standards/b1-ops.mjs docs
  verified_at: 2026-10-23T01:40:24Z
  output: |
    b1-ops docs
      OK  tổng sau B1 = 85 khớp tài liệu; catalog + routes đủ

- eval: E11
  run_id: ui-clean-b1-ops-E11-20261023T014040Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_selftest
  command: node scripts/ui-standards/b1-ops.mjs selftest
  verified_at: 2026-10-23T01:40:54Z
  output: |
      OK  design-page · chữ skill reui: muốn 1, được 1
      OK  states · bản sao sạch: muốn 0, được 0
      OK  states · Switch thiếu aria-label: muốn 1, được 1
      OK  shell · bản sao sạch: muốn 0, được 0
      OK  shell · bỏ /ops/review khỏi nav: muốn 1, được 1
      OK  shell · đổi dòng canAccessOps: muốn 1, được 1
      OK  docs · bản sao sạch: muốn 0, được 0
      OK  docs · lệch tổng 1: muốn 1, được 1
      25/25 cặp đạt
    (git status --short trước = sau lệnh: cây làm việc không đổi)

- eval: E12
  run_id: ui-clean-b1-ops-E12-20261023T014431Z
  exit_code: 0
  verifier: config:dev_server.start
  driver: ego-browser nodejs, task space s4r3-E12; app chạy sẵn ở http://localhost:3457 (config ghi :3456, cổng bận; tiến trình next-server có cwd là app/ của worktree này)
  verified_at: 2026-10-23T01:44:37Z
  screenshot: evidence/E12-r3-step1.png
  masked: true (trước khi mở hộp: masked 21, leaked 0, attrLeaked 0; step1 khi hộp mở: masked 22, leaked 0, attrLeaked 0; step2 sau Huỷ: masked 21, leaked 0, attrLeaked 0; checkedNames 25)
  observed: |
    Step1 (1440 sáng): AlertDialog giữa màn trên nền mờ, biểu tượng thùng rác đỏ, tiêu đề «Xoá nhóm thu?», câu hậu quả «Xoá «█████…» và 196 bài dữ liệu của nó. Nhóm khác không bị đụng.» (tên nhóm là khối █), hai nút Huỷ / Xoá nhóm.
    Step2 (sau Huỷ): hộp đã đóng; bảng «Nhóm Facebook (Apify)» vẫn 5 dòng đã che (dòng đầu 196 bài, cột Trạng thái Tắt/Đang thu), nút thùng rác còn đủ; phía trên là lưới nhóm Zalo đã che, công tắc và cột Sở hữu «default». Step3 n-a: chỉ có tài khoản Zalo «default».
    Thuộc tính /ops/sources: attrLeaked rỗng cả lúc hộp đóng lẫn mở; 8 Switch lưới nhóm Zalo nay có aria-label tĩnh «Bật/tắt nhóm» + aria-describedby trỏ vào ô tên mang data-tier-a (8/8).
  network_observed: clean
  output: |
    pre: delButtons 7, switches 15, h1 1; Switch Zalo nhãn tĩnh 8, có aria-describedby tới ô data-tier-a 8
    kiểm độc lập (ngoài mask-tier-a.js): 0 thuộc tính trong toàn document (kể cả head, trừ script/style) chứa tên danh sách DB; 0 thuộc tính / 0 chữ hiển thị chứa văn bản gốc của các ô data-tier-a (bỏ 2 từ chung có trong mã nguồn công khai, xem Analyst)
    step1: hộp mở, title "Xoá nhóm thu?", nút [Huỷ, Xoá nhóm], 1 phần tử data-tier-a trong hộp, câu hậu quả có khối █ và «196 bài»
    step2: hộp đóng; nút Xoá nhóm trước 7 / sau 7; fetch/xhr qua bộ ghi trong khoảng mở hộp → Huỷ: 0; POST/DELETE /api/v1/ops/source-groups: 0
    cả lượt: 6 fetch tới /api/v1/ops/zalo/{accounts,groups,login} đều thành công, 0 lỗi (evidence/E12-r3-network.txt)
    zalo: 1 menu tài khoản, 0 tài khoản khác default → step3 n-a; không bấm nút «Xoá nhóm» hay «Gỡ tài khoản»

- eval: E13
  run_id: ui-clean-b1-ops-E13-20261023T014533Z
  exit_code: 0
  verifier: config:dev_server.start
  driver: ego-browser nodejs, task space s4r3-E13; app chạy sẵn ở http://localhost:3457 (config ghi :3456, cổng bận)
  verified_at: 2026-10-23T01:46:28Z
  screenshot: evidence/E13-r3-ops-light-1440.png
  masked: true (sáng-1440: /ops 0, collections 10, quality 0, sources 21, design 0; tối-1440: 0/10/0/21/0; sáng-390: 0/10/0/21/0; /vn 0; leaked 0 và attrLeaked 0 ở cả 16 frame)
  observed: |
    15 frame Ops (5 trang × sáng-1440/tối-1440/sáng-390): ở 1440 thanh bên Ops đủ 7 mục chia nhóm Giám sát/Xử lý/Quản trị + Thư viện thiết kế ở đáy, mục hiện tại được tô; PageHeader (breadcrumb, tiêu đề, badge đếm, mô tả) đứng đầu vùng nội dung; tối đọc rõ, không chữ/khối đè nhau; cột «Tên thật (tầng A)» và tên nhóm Zalo trên sources là khối █.
    Ở 390 thanh bên thu thành nút gập góc trái trên, nội dung xếp dọc; bảng Registry trên sources cuộn ngang trong khung riêng. E13-r3-invest.png: /vn vẫn top nav cũ (One Invest · Thị trường · Listing · Lợi suất · So sánh), không thanh bên.
    Chỉ thấy nút dev-tools «N» của Next.js (chế độ dev) ở góc trái dưới, ở 390 nó đè một phần chữ — lớp phủ dev, không phải UI sản phẩm.
  network_observed: clean
  output: |
    15/15 frame Ops: h1Count 1, h1 nằm trong main và là heading đầu tiên (Tổng quan · Thu thập · Chất lượng dữ liệu · Nguồn dữ liệu · Thư viện thiết kế)
    15/15: documentElement.scrollWidth <= innerWidth (1440/1440, 390/390)
    1440 sáng + tối: 7/7 mục nav hiện; 390: nút gập thanh bên hiện (link /ops* còn thấy ở 390 chỉ là breadcrumb/link trong thân trang)
    tối: html.dark bật ở 5/5 trang
    /ops/collections: 10 dòng lưới mang data-row-id theo vị trí «nhom-<i>»; kiểm độc lập thuộc tính: 0 ở cả 16 frame
    /vn: 1 h1, 0 thanh bên Ops, header có 5 link top nav
    mạng: 18 fetch tới /api/v1/ops/zalo/* (3 lượt mở /ops/sources) đều thành công; các trang khác render phía server, 0 request lỗi (evidence/E13-r3-network.txt)

- eval: E14
  run_id: ui-clean-b1-ops-E14-20261023T014727Z
  exit_code: 0
  verifier: config:dev_server.start
  driver: ego-browser nodejs, task space s4r3-E14; app chạy sẵn ở http://localhost:3457 (config ghi :3456, cổng bận)
  verified_at: 2026-10-23T01:47:36Z
  screenshot: evidence/E14-r3-step1.png
  masked: true (0 phần tử ở cả 3 frame; leaked 0, attrLeaked 0)
  observed: |
    step1 (sáng) / step2 (tối): PageHeader «Thư viện thiết kế» đầu trang (badge «7 loại UI», «6 mẫu cổng Ops»), mục Đầu trang [PageHeader], Ô KPI [StatTiles] với Badge Khá/Nhóm đầu, Bảng (InsightGrid) 3 phường mẫu; tối đọc rõ.
    step3 (sáng, cuộn xuống): Trạng thái [Badge] Đạt/Đang xem/Trễ SLO/Quá hạn/Chưa có, Đang tải [Skeleton], Lỗi [PageError] kèm «Thử lại», Trống [Empty] kèm nút «Tìm thị trường», bảng «Mẫu dùng cho cổng Ops» 6 dòng (solution-agents-5 ghi «/ops/review (vòng sau)», «chưa áp dụng»). Không thấy chữ skill/reui/.claude.
  network_observed: no-app-traffic
  output: |
    sáng + tối + cuộn: h1 = ["Thư viện thiết kế"], heading đầu của main là H1, scrollWidth 1440
    mục thiếu: [] (Đầu trang, Ô KPI, Bảng, Trạng thái, Đang tải, Lỗi, Trống, Mẫu dùng cho cổng Ops)
    thẻ tên component thiếu: [] (PageHeader, StatTiles, InsightGrid, Badge, Skeleton, PageError, Empty)
    chữ cấm trong innerText (skill, reui, .claude, gallery): không có
    mạng: 0 fetch/xhr app (trang render phía server; evidence/E14-r3-network.txt)

- eval: E15
  run_id: ui-clean-b1-ops-E15-20261023T014029Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_states
  command: node scripts/ui-standards/b1-ops.mjs states
  verified_at: 2026-10-23T01:40:34Z
  output: |
    b1-ops states
      OK  trạng thái vùng viết lại + nhãn a11y + đánh dấu tầng A đủ

- eval: E16
  run_id: ui-clean-b1-ops-E16-20261023T014034Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_shell
  command: node scripts/ui-standards/b1-ops.mjs shell
  verified_at: 2026-10-23T01:40:40Z
  output: |
    b1-ops shell
      OK  Ops trong shell riêng, Invest giữ PortalShell, nav đủ 7 mục, chặn quyền nguyên văn

### Lệnh suite (hồi quy)

Suite 1 (`cd app && npx tsc --noEmit && npm run lint`) = E2 và suite 2 (`cd app && npm run test:lint-rules`) = E8 — chạy một lần, dùng chung run_id của eval.

- cmd: node scripts/check-portal-compliance.mjs
  run_id: ui-clean-b1-ops-SUITE-portal-compliance-20261023T013933Z
  exit_code: 0
  verified_at: 2026-10-23T01:39:39Z

## Known limits

- Task 12 (`/ops/review` + `components/ops/review-card.tsx` theo solution-agents-5) đã tách khỏi vòng này theo quyết định Mạnh «tách» (2026-10-23; dòng descope `d-20261023T005514Z-33` trong `decisions.jsonl`): review-card còn tự vẽ tay và 20 mục baseline của nó còn nguyên. Trang `/ops/review` chỉ nằm trong shell Ops mới (nav nhóm Xử lý); thân trang không được chấm vòng này.
- E12 bước 3 (hộp «Gỡ tài khoản Zalo?») là n-a: DB local chỉ có tài khoản `default`, nên đường Huỷ của hộp gỡ tài khoản chưa được nhìn trên bản chạy (E6 chỉ kiểm trên mã).
- Ba eval ui-check chạy trên app đang chạy sẵn ở :3457 (config ghi :3456, cổng bận), chế độ `next dev`; ảnh có nút dev-tools «N» của Next.js, bản build không có.

## Ngoài hợp đồng

## Analyst

Baseline khong do: mọi eval script dùng harness `scripts/ui-standards/b1-ops.mjs`, tệp này không có ở diffBase 021b48e (eval mới, chạy trên mã cũ không chứng minh gì). E2/E8 không đo baseline trong lượt chấm độc lập này (không dựng cây diffBase).
Non-discriminating evals: không xác định được, vì không có baseline.
Kiểm độc lập ba sửa của 3b8ec24 (không dựa vào lời tuyên bố): (1) đọc diff — `zalo-groups-grid.tsx` đổi `aria-label` Switch sang chữ tĩnh và thêm `aria-describedby` tới ô tên mang `data-tier-a`; trên bản chạy 8/8 Switch như vậy; nhãn nhánh xung đột vẫn ghép mã tài khoản Zalo (`ownedBy`), không thuộc danh sách tầng A. (2) `collections-tables.tsx` khoá hàng theo vị trí; trên bản chạy 10 dòng `data-row-id` dạng `nhom-<i>`. (3) `mask-tier-a.js` nay trả `attrLeaked` (quét thuộc tính mọi phần tử trong body, bỏ `script`/`style`) và gộp vào `leaked`; trường có mặt ở mọi lần gọi. Ngoài ra lượt chấm chạy một bộ kiểm riêng: quét thuộc tính toàn document (kể cả head) với danh sách DB, và so văn bản gốc của mọi ô `data-tier-a` (chụp trước khi che, chỉ giữ trong trang) với thuộc tính + chữ hiển thị sau khi che. Kết quả 0 ở mọi frame. Lần chạy đầu bộ kiểm riêng báo 2 chuỗi (dài 4 và 7 ký tự) nằm trong ô `data-tier-a` lại xuất hiện ngoài ô; đối chiếu bằng `git grep` (chỉ in số đếm) thấy cả hai có trong 25 và 8 tệp `app/src` — là từ chung công khai, cùng quy tắc loại trừ của `tier-a-names.mjs`, nên được bỏ khỏi bộ kiểm riêng; không phải lộ tầng A. Hai lần chạy E12 đầu (cùng task space) dừng trước khi chụp: lần một vì selector chờ khớp 7 nút, lần hai vì bộ kiểm riêng chặn chụp như trên; không bấm nút xác nhận nào, không ghi dòng run-log cho hai lần này.
Bộ tự kiểm của `mask-tier-a.js` bỏ qua thẻ `script` theo thiết kế (dữ liệu RSC gửi cho người dùng Ops đã đăng nhập, không phải bề mặt hiển thị); lượt chấm không đánh giá phần đó.
Ghi chú run-log: dòng E2 của round 3 ghi JSON có dấu cách sau dấu phẩy/hai chấm (cùng nội dung; trình đọc `JSON.parse` không phân biệt); các dòng sau ghi gọn. Dòng thừa của round 2 giữ nguyên vì run-log chỉ được ghi thêm.

## Variance

none — mọi eval chạy một lần, tất định.

## Iterations

Round 1 (verified_commit ba1b25c): REJECT, E12 hỏng. Hộp xác nhận «Xoá nhóm thu?» in tên nhóm thu thật dạng chữ trần trong câu hậu quả, mask-tier-a.js báo lộ tầng A nên frame step1 không chụp được. Trả lại vòng làm.
Round 2 (verified_commit 52b9345): PASS, 16/16 eval và 3 lệnh suite đạt; hộp xoá bọc tên trong `data-tier-a`. Ngoài hợp đồng ghi 3 mục: tên nhóm Zalo trong `aria-label` Switch lưới nhóm Zalo ở `/ops/sources`; `data-row-id` là tên nhóm ở bảng Nhóm Zalo `/ops/collections`; `mask-tier-a.js` chỉ tự kiểm innerText.
Round 3 (verified_commit 3b8ec24): PASS, 16/16 eval và 3 lệnh suite đạt. Cả 3 mục Ngoài hợp đồng của round 2 đã sửa và kiểm độc lập trên bản chạy: Switch Zalo nhãn tĩnh + `aria-describedby` (8/8), `data-row-id` theo vị trí (10 dòng), mask-tier-a.js trả `attrLeaked` — rỗng ở mọi frame của E12/E13/E14, bộ kiểm thuộc tính riêng của lượt chấm cũng 0.

### Re-pin lần 1 — 2026-10-23, do merge main 148c073 (enrich PR #14) + api-contract bỏ so phần hoãn
run_id: repin-20261023T015632Z-18112
sha: ba9ae020ce0aea60f59b5a11927a676760181cff · suites: 6 lệnh exit 0 · evals: 13/13 eval máy đạt kỳ vọng · ngoài làn máy: E12 (E12 không khai paths), E13 (E13 không khai paths), E14 (E14 không khai paths) · AC không có chốt máy: AC-10

### Re-pin lần 2 — 2026-10-23, do merge main b5aef31 (PR #6 bản đồ đích Invest) + thước docs đọc cột theo tiêu đề
run_id: repin-20261023T021448Z-51921
sha: d1270328ec4a69050f263e89c9b1b94fdf49b116 · suites: 6 lệnh exit 0 · evals: 13/13 eval máy đạt kỳ vọng · ngoài làn máy: E12 (E12 không khai paths), E13 (E13 không khai paths), E14 (E14 không khai paths) · AC không có chốt máy: AC-10
