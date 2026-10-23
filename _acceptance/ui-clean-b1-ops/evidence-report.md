---
schema_version: 2
feature_slug: ui-clean-b1-ops
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 52b934546a0475e5ddc664e0d371be25306a0ce2
human_signoff:
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
  run_id: ui-clean-b1-ops-E1-20261023T012637Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_suppressions
  command: node scripts/ui-standards/b1-ops.mjs suppressions
  verified_at: 2026-10-23T01:26:37Z
  output: |
    b1-ops suppressions
      OK  0 mục baseline + 0 eslint-disable onehub-ui trong 42 tệp phạm vi

- eval: E2
  run_id: ui-clean-b1-ops-E2-20261023T012548Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  command: cd app && npx tsc --noEmit && npm run lint
  verified_at: 2026-10-23T01:25:54Z
  output: |
    app/src/components/invest/investment-simulator.tsx 142:6 warning react-hooks/exhaustive-deps
    app/src/components/user-event-beacon.tsx 51:6 warning react-hooks/exhaustive-deps
    app/src/hooks/use-file-upload.ts 266:5 warning react-hooks/exhaustive-deps
    ✖ 3 problems (0 errors, 3 warnings)
    (tsc --noEmit không in gì; eslint + check-bare-disables xanh — 3 cảnh báo cũ ngoài phạm vi B1)

- eval: E3
  run_id: ui-clean-b1-ops-E3-20261023T012638Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_handdrawn
  command: node scripts/ui-standards/b1-ops.mjs handdrawn
  verified_at: 2026-10-23T01:26:38Z
  output: |
    b1-ops handdrawn
      OK  không khung tự kẻ, không ký tự làm icon

- eval: E4
  run_id: ui-clean-b1-ops-E4-20261023T012639Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_frame
  command: node scripts/ui-standards/b1-ops.mjs frame
  verified_at: 2026-10-23T01:26:39Z
  output: |
    b1-ops frame
      OK  5 trang: PageHeader đứng đầu, không tự viết h1

- eval: E5
  run_id: ui-clean-b1-ops-E5-20261023T012640Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_one_way
  command: node scripts/ui-standards/b1-ops.mjs one-way
  verified_at: 2026-10-23T01:26:40Z
  output: |
    b1-ops one-way
      OK  mỗi trang dựng từ đúng block đã chọn; không bảng tự dựng

- eval: E6
  run_id: ui-clean-b1-ops-E6-20261023T012642Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_dialogs
  command: node scripts/ui-standards/b1-ops.mjs dialogs
  verified_at: 2026-10-23T01:26:42Z
  output: |
    b1-ops dialogs
      OK  không hộp thoại gốc; xác nhận phá huỷ = AlertDialog; mọi kết quả qua toast

- eval: E7
  run_id: ui-clean-b1-ops-E7-20261023T012643Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_api_contract
  command: node scripts/ui-standards/b1-ops.mjs api-contract
  verified_at: 2026-10-23T01:26:43Z
  output: |
    b1-ops api-contract
      OK  11 lời gọi khớp bản chụp; bản chụp phủ đủ 11 phần tử ma trận viết tay

- eval: E8
  run_id: ui-clean-b1-ops-E8-20261023T012611Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_lint_rules
  command: cd app && npm run test:lint-rules
  verified_at: 2026-10-23T01:26:11Z
  output: |
    ✔ routes.md của skill onehub-ui (5.498625ms)
    ℹ tests 163
    ℹ suites 50
    ℹ pass 163
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
    ℹ todo 0

- eval: E9
  run_id: ui-clean-b1-ops-E9-20261023T012644Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_design_page
  command: node scripts/ui-standards/b1-ops.mjs design-page
  verified_at: 2026-10-23T01:26:44Z
  output: |
    b1-ops design-page
      OK  trang trưng bày đủ mẫu, đủ block, không chữ thuật ngữ dev

- eval: E10
  run_id: ui-clean-b1-ops-E10-20261023T012645Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_docs
  command: node scripts/ui-standards/b1-ops.mjs docs
  verified_at: 2026-10-23T01:26:49Z
  output: |
    b1-ops docs
      OK  tổng sau B1 = 85 khớp tài liệu; catalog + routes đủ

- eval: E11
  run_id: ui-clean-b1-ops-E11-20261023T012658Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_selftest
  command: node scripts/ui-standards/b1-ops.mjs selftest
  verified_at: 2026-10-23T01:27:12Z
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
  run_id: ui-clean-b1-ops-E12-20261023T012837Z
  exit_code: 0
  verifier: config:dev_server.start
  driver: ego-browser nodejs, task space s4r2-E12; app chạy sẵn ở http://localhost:3457 (config ghi :3456 — cổng bận)
  verified_at: 2026-10-23T01:29:25Z
  screenshot: evidence/E12-r2-step1.png
  masked: true (step1: 22 phần tử, leaked []; step2: 21 phần tử, leaked [])
  observed: |
    Step1 (1440 sáng): AlertDialog giữa màn, nền mờ, biểu tượng thùng rác đỏ, tiêu đề «Xoá nhóm thu?», câu hậu quả «Xoá «█████…» và 196 bài dữ liệu của nó. Nhóm khác không bị đụng.» — tên nhóm đã thành khối █, có số bài; hai nút Huỷ / Xoá nhóm.
    Step2 (sau Huỷ): hộp đã đóng, bảng «Nhóm Facebook (Apify)» vẫn 5 dòng đã che (dòng đầu 196 bài), nút thùng rác còn đủ; trên đó bảng nhóm Zalo đã che. Step3 n-a: chỉ có tài khoản Zalo «default».
    Thuộc tính: trên /ops/sources còn 5 phần tử có aria-label/title chứa tên tầng A (trước khi mở hộp = khi hộp mở = 5; hộp xoá không thêm phần tử nào) — đều là Switch của lưới nhóm Zalo, xem Ngoài hợp đồng.
  network_observed: n-a (tool-error: lượt chạy chính thấy 2 GET nền tới /api/v1/ops/zalo/login nhưng resource timing không ghi trạng thái; lượt lặp mở hộp + Huỷ có ghi trạng thái thì không có request app nào)
  output: |
    pre: delButtons 7, switches 15, h1 1; phần tử có aria-label/title chứa tên tầng A: 5
    step1: hộp mở, title "Xoá nhóm thu?", nút [Huỷ, Xoá nhóm], 1 phần tử data-tier-a trong hộp, câu hậu quả khớp khuôn «Xoá «█…» và 196 bài…»
    step1 mask: masked 22, checkedNames 24, leaked [] → chụp
    step2: hộp đóng; nút Xoá nhóm trước 7 / sau 7; fetch/xhr qua interceptor 0; không có POST/DELETE /api/v1/ops/source-groups
    lượt lặp (mở hộp + Huỷ): 0 request app; nút Xoá nhóm vẫn 7
    zalo: 1 menu tài khoản, 0 tài khoản khác default → step3 n-a (chi tiết: evidence/E12-r2-network.txt)

- eval: E13
  run_id: ui-clean-b1-ops-E13-20261023T013029Z
  exit_code: 0
  verifier: config:dev_server.start
  driver: ego-browser nodejs, task space s4r2-E13; app chạy sẵn ở http://localhost:3457 (config ghi :3456 — cổng bận)
  verified_at: 2026-10-23T01:31:22Z
  screenshot: evidence/E13-r2-ops-light-1440.png
  masked: true (sáng-1440: /ops 0, collections 10, quality 0, sources 13, design 0; tối-1440: 0/10/0/21/0; sáng-390: 0/10/0/21/0; invest 0; leaked [] ở cả 16 frame)
  observed: |
    15 frame Ops (5 trang × sáng-1440/tối-1440/sáng-390): ở 1440 thanh bên Ops có đủ 7 mục chia nhóm Giám sát/Xử lý/Quản trị + Thư viện thiết kế ở đáy, mục trang hiện tại được tô; PageHeader (breadcrumb, tiêu đề, badge đếm, mô tả) đứng đầu vùng nội dung; tối đọc rõ, không chữ/khối đè nhau; tên thật trên sources là khối █.
    Ở 390 thanh bên thu thành nút gập góc trái trên, nội dung xếp dọc; bảng Registry trên sources cuộn ngang trong khung riêng. E13-r2-invest.png: /vn vẫn top nav cũ (One Invest · Thị trường · Listing · Lợi suất · So sánh), không thanh bên.
    Chỉ thấy nút dev-tools «N» của Next.js (chế độ dev) ở góc trái dưới — lớp phủ dev, không phải UI sản phẩm.
  network_observed: clean
  output: |
    15/15 frame Ops: h1Count 1, h1 nằm trong main và là heading đầu tiên (Tổng quan · Thu thập · Chất lượng dữ liệu · Nguồn dữ liệu · Thư viện thiết kế)
    15/15: documentElement.scrollWidth <= innerWidth (1440/1440, 390/390)
    1440 sáng + tối: 7/7 mục nav hiện trong thanh bên; 390: thanh bên không hiện, nút gập thanh bên hiện
    tối: html.dark bật ở 5/5 trang
    /vn: 1 h1, không thanh bên Ops, header có 5 link top nav
    mạng: 29 fetch tới /api/v1/ops/zalo/* và /api/v1/ops/collections đều trạng thái thành công; 0 request lỗi (evidence/E13-r2-network.txt)

- eval: E14
  run_id: ui-clean-b1-ops-E14-20261023T013239Z
  exit_code: 0
  verifier: config:dev_server.start
  driver: ego-browser nodejs, task space s4r2-E14; app chạy sẵn ở http://localhost:3457 (config ghi :3456 — cổng bận)
  verified_at: 2026-10-23T01:32:49Z
  screenshot: evidence/E14-r2-step1.png
  masked: true (0 phần tử ở cả 3 frame; leaked [])
  observed: |
    step1 (sáng) / step2 (tối): PageHeader «Thư viện thiết kế» đầu trang (badge «7 loại UI», «6 mẫu cổng Ops»), mục Đầu trang [PageHeader], Ô KPI [StatTiles] với Badge Khá/Nhóm đầu, Bảng (InsightGrid) 3 phường mẫu; tối đọc rõ.
    step3 (sáng, cuộn xuống): Trạng thái [Badge] Đạt/Đang xem/Trễ SLO/Quá hạn/Chưa có, Đang tải [Skeleton], Lỗi [PageError] kèm «Thử lại», Trống [Empty] kèm nút «Tìm thị trường», bảng «Mẫu dùng cho cổng Ops» 6 dòng; dòng solution-agents-5 nay ghi «/ops/review (vòng sau)» và «Dự kiến: … — chưa áp dụng». Không thấy chữ skill/reui/.claude.
  network_observed: no-app-traffic
  output: |
    sáng + tối: h1 = ["Thư viện thiết kế"], heading đầu của main là H1, scrollWidth 1440
    mục tìm thấy: Đầu trang, Ô KPI, Bảng, Trạng thái, Đang tải, Lỗi, Trống (7/7, missing [])
    thẻ tên component: PageHeader, StatTiles, InsightGrid, Badge, Skeleton, PageError, Empty
    chữ cấm trong innerText (skill, reui, .claude, gallery): không có
    mạng: 0 fetch/xhr ở cả hai frame (evidence/E14-r2-network.txt)

- eval: E15
  run_id: ui-clean-b1-ops-E15-20261023T012650Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_states
  command: node scripts/ui-standards/b1-ops.mjs states
  verified_at: 2026-10-23T01:26:50Z
  output: |
    b1-ops states
      OK  trạng thái vùng viết lại + nhãn a11y + đánh dấu tầng A đủ

- eval: E16
  run_id: ui-clean-b1-ops-E16-20261023T012651Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_shell
  command: node scripts/ui-standards/b1-ops.mjs shell
  verified_at: 2026-10-23T01:26:51Z
  output: |
    b1-ops shell
      OK  Ops trong shell riêng, Invest giữ PortalShell, nav đủ 7 mục, chặn quyền nguyên văn

### Lệnh suite (hồi quy)

Suite 1 (`cd app && npx tsc --noEmit && npm run lint`) = E2 và suite 2 (`cd app && npm run test:lint-rules`) = E8 — chạy một lần, dùng chung run_id của eval.

- cmd: node scripts/check-portal-compliance.mjs
  run_id: ui-clean-b1-ops-SUITE-portal-compliance-20261023T012611Z
  exit_code: 0
  verified_at: 2026-10-23T01:26:11Z

## Known limits

- Task 12 (`/ops/review` + `components/ops/review-card.tsx` theo solution-agents-5) đã tách khỏi vòng này theo quyết định Mạnh «tách» (2026-10-23; dòng descope `d-20261023T005514Z-33` trong `decisions.jsonl`): review-card còn tự vẽ tay và 20 mục baseline của nó còn nguyên. Trang `/ops/review` chỉ nằm trong shell Ops mới (nav nhóm Xử lý); thân trang không được chấm vòng này.
- E12 bước 3 (hộp «Gỡ tài khoản Zalo?») là n-a: DB local chỉ có tài khoản `default`, nên đường Huỷ của hộp gỡ tài khoản và câu hậu quả đã bọc `data-tier-a` của nó chưa được nhìn trên bản chạy (E6 chỉ kiểm trên mã).
- Ba eval ui-check chạy trên app đang chạy sẵn ở :3457 (config ghi :3456 — cổng bận), chế độ `next dev`; ảnh có nút dev-tools «N» của Next.js không có ở bản build.

## Ngoài hợp đồng

- Tên nhóm Zalo (tầng A) vẫn nằm trong `aria-label` của Switch ở lưới nhóm Zalo trên `/ops/sources`: `app/src/components/ops/sources/zalo-groups-grid.tsx:70` dùng `` `Bật/tắt nhóm ${g.name}` ``. Đo trên bản chạy: 5 phần tử có `aria-label`/`title` chứa tên trong danh sách tầng A, cả 5 là Switch này. Commit 52b9345 chỉ sửa nhãn ở bảng nhóm thu (`source-groups.tsx`, nay «Bật/tắt thu nhóm» / «Xoá nhóm» + `aria-describedby`). Ảnh chụp không lộ, nhưng snapshot cây truy cập thì lộ. Sửa cùng kiểu: nhãn tĩnh + `aria-describedby` trỏ vào ô tên đã bọc `data-tier-a`.
- `/ops/collections`: 8 thẻ `<tr>` của một lưới dữ liệu mang tên tầng A trong `data-row-id` (id dòng lấy theo tên nhóm). Không hiện trong ảnh hay cây truy cập, nhưng có trong HTML của trang.
- `scripts/ui-standards/mask-tier-a.js` vẫn chỉ tự kiểm `document.body.innerText`, nên không bắt được hai chỗ trên (thuộc tính). Nên mở rộng phần tự kiểm sang thuộc tính (`aria-label`, `title`, `data-*`).

## Analyst

Baseline khong do: mọi eval script dùng harness `scripts/ui-standards/b1-ops.mjs`, và tệp này không có ở diffBase 021b48e (eval mới, chạy trên mã cũ không chứng minh gì). Các eval E2/E8 không đo baseline trong lượt chấm độc lập này (không dựng cây diffBase).
Non-discriminating evals: không xác định được, vì không có baseline.
Ghi chú run-log: trong round 2 có 10 dòng thừa (evalId dạng «E1 suppressions» … «E16 shell», lúc 01:26:16Z–01:26:27Z) do lượt chấm gọi harness sai cách truyền đối số (vòng lặp zsh không tách chữ), harness chỉ in hướng dẫn dùng và không chạy kiểm nào. Đã chạy lại đúng lệnh ngay sau đó; báo cáo này chỉ dùng run_id của các lần chạy đúng. Các dòng thừa giữ nguyên vì run-log chỉ được ghi thêm.

## Variance

none — mọi eval chạy một lần, tất định.

## Iterations

Round 1 (verified_commit ba1b25c): REJECT, E12 hỏng. Hộp xác nhận «Xoá nhóm thu?» in tên nhóm thu thật dạng chữ trần trong câu hậu quả, mask-tier-a.js báo lộ tầng A nên frame step1 không chụp được. Ngoài hợp đồng ghi thêm: tên nhóm trong `aria-label` Switch/nút xoá của bảng nhóm thu; bảng block `/ops/design` ghi solution-agents-5 như đã áp dụng. Trả lại vòng làm.
Round 2 (verified_commit 52b9345): PASS, 16/16 eval và 3 lệnh suite đạt. Hộp xoá nay bọc tên trong `data-tier-a` (mask che, leaked rỗng, chụp được step1); nhãn bảng nhóm thu đã tĩnh; dòng solution-agents-5 ở `/ops/design` ghi «vòng sau … chưa áp dụng». Còn tên nhóm Zalo trong `aria-label` Switch lưới nhóm Zalo và `data-row-id` ở `/ops/collections` — ngoài hợp đồng, ghi ở mục trên.
