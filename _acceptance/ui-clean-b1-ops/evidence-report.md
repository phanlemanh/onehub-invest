---
schema_version: 2
feature_slug: ui-clean-b1-ops
verdict: REJECT
failed_evals: [E12]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ba1b25c25def86b697f62eb547ddab956a1e8abd
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
| E12 | AC-6 | ui-check | FAIL |
| E13 | AC-10 | ui-check | PASS |
| E14 | AC-9 | ui-check | PASS |
| E15 | AC-12 | script | PASS |
| E16 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: ui-clean-b1-ops-E1-20261023T011318Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_suppressions (node scripts/ui-standards/b1-ops.mjs suppressions)
  verified_at: 2026-10-23T01:13:18Z
  output: |
    b1-ops suppressions
      OK  0 mục baseline + 0 eslint-disable onehub-ui trong 42 tệp phạm vi

- eval: E2
  run_id: ui-clean-b1-ops-E2-20261023T011301Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app (cd app && npx tsc --noEmit && npm run lint)
  verified_at: 2026-10-23T01:13:06Z
  output: |
    > src@0.1.0 lint
    > eslint && node eslint-plugin-onehub-ui/check-bare-disables.mjs
    app/src/components/invest/investment-simulator.tsx 142:6 warning react-hooks/exhaustive-deps
    app/src/components/user-event-beacon.tsx 51:6 warning react-hooks/exhaustive-deps
    app/src/hooks/use-file-upload.ts 266:5 warning react-hooks/exhaustive-deps
    ✖ 3 problems (0 errors, 3 warnings)

- eval: E3
  run_id: ui-clean-b1-ops-E3-20261023T011319Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_handdrawn (node scripts/ui-standards/b1-ops.mjs handdrawn)
  verified_at: 2026-10-23T01:13:19Z
  output: |
    b1-ops handdrawn
      OK  không khung tự kẻ, không ký tự làm icon

- eval: E4
  run_id: ui-clean-b1-ops-E4-20261023T011320Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_frame (node scripts/ui-standards/b1-ops.mjs frame)
  verified_at: 2026-10-23T01:13:21Z
  output: |
    b1-ops frame
      OK  5 trang: PageHeader đứng đầu, không tự viết h1

- eval: E5
  run_id: ui-clean-b1-ops-E5-20261023T011322Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_one_way (node scripts/ui-standards/b1-ops.mjs one-way)
  verified_at: 2026-10-23T01:13:22Z
  output: |
    b1-ops one-way
      OK  mỗi trang dựng từ đúng block đã chọn; không bảng tự dựng

- eval: E6
  run_id: ui-clean-b1-ops-E6-20261023T011323Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_dialogs (node scripts/ui-standards/b1-ops.mjs dialogs)
  verified_at: 2026-10-23T01:13:23Z
  output: |
    b1-ops dialogs
      OK  không hộp thoại gốc; xác nhận phá huỷ = AlertDialog; mọi kết quả qua toast

- eval: E7
  run_id: ui-clean-b1-ops-E7-20261023T011324Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_api_contract (node scripts/ui-standards/b1-ops.mjs api-contract)
  verified_at: 2026-10-23T01:13:24Z
  output: |
    b1-ops api-contract
      OK  11 lời gọi khớp bản chụp; bản chụp phủ đủ 11 phần tử ma trận viết tay

- eval: E8
  run_id: ui-clean-b1-ops-E8-20261023T011313Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_lint_rules (cd app && npm run test:lint-rules)
  verified_at: 2026-10-23T01:13:13Z
  output: |
    ✔ routes.md của skill onehub-ui (5.535958ms)
    ℹ tests 163
    ℹ suites 50
    ℹ pass 163
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0

- eval: E9
  run_id: ui-clean-b1-ops-E9-20261023T011330Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_design_page (node scripts/ui-standards/b1-ops.mjs design-page)
  verified_at: 2026-10-23T01:13:30Z
  output: |
    b1-ops design-page
      OK  trang trưng bày đủ mẫu, đủ block, không chữ thuật ngữ dev

- eval: E10
  run_id: ui-clean-b1-ops-E10-20261023T011331Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_docs (node scripts/ui-standards/b1-ops.mjs docs)
  verified_at: 2026-10-23T01:13:35Z
  output: |
    b1-ops docs
      OK  tổng sau B1 = 85 khớp tài liệu; catalog + routes đủ

- eval: E11
  run_id: ui-clean-b1-ops-E11-20261023T011343Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_selftest (node scripts/ui-standards/b1-ops.mjs selftest)
  verified_at: 2026-10-23T01:13:59Z
  output: |
      OK  api-contract · lời gọi qua hàm phụ vẫn trích được: muốn 1, được 1
      OK  design-page · chữ skill reui: muốn 1, được 1
      OK  states · Switch thiếu aria-label: muốn 1, được 1
      OK  shell · bỏ /ops/review khỏi nav: muốn 1, được 1
      OK  shell · đổi dòng canAccessOps: muốn 1, được 1
      OK  docs · bản sao sạch: muốn 0, được 0
      OK  docs · lệch tổng 1: muốn 1, được 1
      25/25 cặp đạt
    (cây làm việc sau lệnh: chỉ thêm tệp chưa theo dõi của hồ sơ — không tệp mã nào đổi)

- eval: E12
  run_id: ui-clean-b1-ops-E12-20261023T011545Z
  exit_code: 1
  verdict: FAIL
  verifier: config:dev_server.start (app chạy sẵn ở http://localhost:3457) + ego-browser nodejs, task space s4-E12
  verified_at: 2026-10-23T01:15:45Z
  screenshot: evidence/E12-step2.png
  masked: true (step2: 21 phần tử)
  observed: |
    Step1 KHÔNG chụp: hộp "Xoá nhóm thu?" (nút Huỷ / Xoá nhóm) mở được, nhưng mask-tier-a.js chạy lúc hộp mở báo leaked [3] —
    câu hậu quả in tên nhóm thu thật dạng chữ trần (0 phần tử data-tier-a trong hộp); tái hiện 2/2 lần (ở 1440 sáng).
    Step2 (sau Huỷ, 1440 sáng): hộp đã đóng, bảng "Nhóm Facebook (Apify)" vẫn 5 dòng đã che, tổng nút Xoá nhóm 7 trước = 7 sau. Step3 n-a: chỉ có tài khoản Zalo "default".
  network_observed: no-app-traffic
  output: |
    step1: hộp mở, tiêu đề "Xoá nhóm thu?", nút [Huỷ, Xoá nhóm]; tự kiểm tầng A: masked 21, leaked [3] → không chụp (luật: leaked khác rỗng = eval hỏng)
    nguyên nhân: app/src/components/ops/sources/source-groups.tsx:162-166 — description của ConfirmDelete là chuỗi
      `Xoá "${deleting.name}" …` / `Xoá "${deleting.name}" và N bài …`, không bọc data-tier-a nên mask không che được
    step2: hộp đóng; dòng nhóm trước 7 / sau 7; trong khoảng thao tác chỉ 2 request font tĩnh, 0 fetch/XHR, 0 POST/DELETE /api/v1/ops/source-groups
    (chi tiết: evidence/E12-network.txt)

- eval: E13
  run_id: ui-clean-b1-ops-E13-20261023T011856Z
  exit_code: 0
  verifier: config:dev_server.start (app chạy sẵn ở http://localhost:3457) + ego-browser nodejs, task space s4-E13
  verified_at: 2026-10-23T01:18:56Z
  screenshot: evidence/E13-ops-light-1440.png
  masked: true (mỗi frame: /ops 0, collections 10, quality 0, sources 21, design 0, invest 0; leaked [] ở cả 16 frame)
  observed: |
    15 frame Ops (5 trang × sáng-1440/tối-1440/sáng-390): ở 1440 thanh bên Ops thấy đủ 7 mục chia nhóm Giám sát/Xử lý/Quản trị + Thư viện thiết kế, PageHeader (breadcrumb, tiêu đề, badge đếm, mô tả) đứng đầu vùng nội dung; tối đọc rõ, không chữ/khối đè nhau; ô tầng A trên sources hiện thành khối █.
    Ở 390 thanh bên thu thành nút gập + chỉ còn PageHeader và thẻ xếp dọc, bảng Registry cuộn ngang trong khung riêng; "Luồng 7 ngày" (/ops/collections, chế độ Listing) vẽ cột tím, tối dùng tím sáng hơn. E13-invest.png: /vn vẫn top nav cũ (One Invest · Thị trường · Listing · Lợi suất · So sánh), không thanh bên.
    Chỉ thấy nút dev-tools "N" của Next.js (chế độ dev) đè góc trái dưới (ảnh đại diện ở thanh bên; ở 390 đè lên nội dung) — lớp phủ dev, không phải UI sản phẩm.
  network_observed: clean
  output: |
    15/15 frame Ops: h1Count 1, h1 là heading đầu tiên của main (Tổng quan · Thu thập · Chất lượng dữ liệu · Nguồn dữ liệu · Thư viện thiết kế)
    15/15: documentElement.scrollWidth <= innerWidth (1440/1440, 390/390)
    1440 sáng + tối: 7/7 mục nav hiện; 390: thanh bên ẩn, nút "Mở hoặc gập thanh bên" hiện
    tối: html.dark bật ở 5/5 trang
    /vn: 1 h1, không nút thanh bên Ops, header có 5 link top nav
    mạng: /ops/sources 6 fetch tới /api/v1/ops/zalo/* đều thành công; các trang khác chỉ tài liệu HTML; 0 request lỗi (evidence/E13-network.txt)

- eval: E14
  run_id: ui-clean-b1-ops-E14-20261023T012016Z
  exit_code: 0
  verifier: config:dev_server.start (app chạy sẵn ở http://localhost:3457) + ego-browser nodejs, task space s4-E14
  verified_at: 2026-10-23T01:20:16Z
  screenshot: evidence/E14-step1.png
  masked: true (0 phần tử ở cả 3 frame; leaked [])
  observed: |
    step1 (sáng) / step2 (tối): PageHeader "Thư viện thiết kế" đầu trang (badge "7 loại UI", "6 mẫu cổng Ops"), mục Đầu trang [PageHeader], Ô KPI [StatTiles] với Badge Khá/Nhóm đầu, Bảng (InsightGrid) 3 phường mẫu; tối đọc rõ.
    step3 (sáng, cuộn xuống): Trạng thái [Badge] hàng Đạt/Đang xem/Trễ SLO/Quá hạn/Chưa có, Đang tải [Skeleton], Lỗi [PageError] kèm "Thử lại", Trống [Empty] kèm nút hành động, bảng "Mẫu dùng cho cổng Ops" 6 dòng (app-shell-36, solution-dev-ops-5/-6/-1, solution-ai-ops-2, solution-agents-5) với link "Mở". Không thấy chữ skill/reui/.claude.
  network_observed: no-app-traffic
  output: |
    sáng + tối: h1 = ["Thư viện thiết kế"], heading đầu của main là H1
    mục tìm thấy: Đầu trang, Ô KPI, Bảng, Trạng thái, Đang tải, Lỗi, Trống (7/7)
    thẻ tên component: PageHeader, StatTiles, Badge, Skeleton, PageError, Empty
    chữ cấm trong innerText (skill, reui, .claude, gallery): không có
    mạng: chỉ tài liệu HTML /ops/design, không fetch/XHR (evidence/E14-network.txt)

- eval: E15
  run_id: ui-clean-b1-ops-E15-20261023T011336Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_states (node scripts/ui-standards/b1-ops.mjs states)
  verified_at: 2026-10-23T01:13:36Z
  output: |
    b1-ops states
      OK  trạng thái vùng viết lại + nhãn a11y + đánh dấu tầng A đủ

- eval: E16
  run_id: ui-clean-b1-ops-E16-20261023T011337Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b1_shell (node scripts/ui-standards/b1-ops.mjs shell)
  verified_at: 2026-10-23T01:13:37Z
  output: |
    b1-ops shell
      OK  Ops trong shell riêng, Invest giữ PortalShell, nav đủ 7 mục, chặn quyền nguyên văn

### Lệnh suite (hồi quy)

Suite 1 (`cd app && npx tsc --noEmit && npm run lint`) = E2 và suite 2 (`cd app && npm run test:lint-rules`) = E8 — chạy một lần, dùng chung run_id của eval.

- cmd: node scripts/check-portal-compliance.mjs
  run_id: ui-clean-b1-ops-SUITE-portal-compliance-20261023T011313Z
  exit_code: 0
  verified_at: 2026-10-23T01:13:13Z

## Known limits

- Task 12 (`/ops/review` + `components/ops/review-card.tsx` theo solution-agents-5) đã tách khỏi vòng này theo quyết định Mạnh «tách» (2026-10-23; dòng descope trong `decisions.jsonl`): review-card còn tự vẽ tay và 20 mục baseline của nó còn nguyên. Trang `/ops/review` chỉ nằm trong shell Ops mới (nav nhóm Xử lý); thân trang không được chấm vòng này.
- E12 bước 3 (hộp «Gỡ tài khoản Zalo?») là n-a: DB local chỉ có tài khoản `default`, nên đường Huỷ của hộp gỡ tài khoản chưa được nhìn trên bản chạy (E6 chỉ kiểm nó trên mã).
- Ba eval ui-check chạy trên app đang chạy sẵn ở :3457 (config ghi :3456 — cổng bận), chế độ `next dev`; ảnh có nút dev-tools «N» của Next.js không có ở bản build.

## Ngoài hợp đồng

- `mask-tier-a.js` chỉ thay chữ trong `[data-tier-a]` và tự kiểm bằng `document.body.innerText`, nên không thấy thuộc tính. Trên `/ops/sources`, `aria-label` của Switch và nút «Xoá nhóm …» ở bảng nhóm thu ghép tên nhóm (`source-groups.tsx:118`, cùng kiểu cho Switch). Sau khi che vẫn còn 12/24 tên trong danh sách tầng A nằm ở thuộc tính `aria-label`/`title` (17/24 ở đâu đó trong HTML). Ảnh chụp không lộ, nhưng snapshot cây truy cập thì lộ: lượt chấm này đã in một snapshot như thế vào phiên chấm (máy local). Nên mở rộng phần tự kiểm sang thuộc tính, hoặc bỏ tên khỏi nhãn.
- Bảng «Mẫu dùng cho cổng Ops» trên `/ops/design` ghi `solution-agents-5` → `/ops/review` «Hàng chờ duyệt + sheet chi tiết» như block đang dùng, trong khi Task 12 đã hoãn và review-card chưa chuyển thể. Người xem trang sẽ hiểu sai hiện trạng.

## Analyst

Baseline khong do: mọi eval script dùng harness `scripts/ui-standards/b1-ops.mjs`, và tệp này không có ở diffBase 021b48e (eval mới, chạy trên mã cũ không chứng minh gì). Các eval E2/E8 không đo baseline trong lượt chấm độc lập này (không dựng cây diffBase).
Non-discriminating evals: không xác định được, vì không có baseline.

## Variance

none — mọi eval chạy một lần, tất định.

## Iterations

Round 1: E12 hỏng. Hộp xác nhận «Xoá nhóm thu?» in tên nhóm thu thật dạng chữ trần trong câu hậu quả, nên mask-tier-a.js báo lộ tầng A và frame step1 không chụp được. Cần sửa `source-groups.tsx` (bọc tên trong `data-tier-a`, ví dụ truyền description dạng ReactNode). 15 eval còn lại và suite đều đạt. Trả lại vòng làm.
