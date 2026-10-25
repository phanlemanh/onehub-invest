---
schema_version: 2
feature_slug: lockdown-cloud-theo-facts
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1edcbdd12114aa7aa4039a027fe8852931a5815e
human_signoff:
---

# Evidence Report: lockdown-cloud-theo-facts

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | judgment | UNCERTAIN |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS |
| E9 | AC-9 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: minted-lockdown-cloud-theo-facts-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:37:51Z
  output: |
    cd app && npm test (một lần chạy chung cho E1-E6)
    ℹ duration_ms 21071.323875

- eval: E2
  run_id: minted-lockdown-cloud-theo-facts-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:37:51Z
  output: |
    cd app && npm test (một lần chạy chung cho E1-E6)
    ℹ duration_ms 21071.323875

- eval: E3
  run_id: minted-lockdown-cloud-theo-facts-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:37:51Z
  output: |
    cd app && npm test (một lần chạy chung cho E1-E6)
    ℹ duration_ms 21071.323875

- eval: E4
  run_id: minted-lockdown-cloud-theo-facts-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:37:51Z
  output: |
    cd app && npm test (một lần chạy chung cho E1-E6)
    ℹ duration_ms 21071.323875

- eval: E5
  run_id: minted-lockdown-cloud-theo-facts-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:37:51Z
  output: |
    cd app && npm test (một lần chạy chung cho E1-E6)
    ℹ duration_ms 21071.323875

- eval: E6
  run_id: minted-lockdown-cloud-theo-facts-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:37:51Z
  output: |
    cd app && npm test (một lần chạy chung cho E1-E6)
    ℹ duration_ms 21071.323875

- eval: E8
  run_id: minted-lockdown-cloud-theo-facts-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-10-25T00:37:51Z
  output: |
    cd app && npx tsc --noEmit && npm run lint chạy xong, không in dòng lỗi nào

- eval: E8b
  run_id: minted-lockdown-cloud-theo-facts-E8b-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-10-25T00:37:51Z
  output: |
    cd app && npm run test:lint-rules
    ℹ duration_ms 197.530417

- eval: E9
  run_id: minted-lockdown-cloud-theo-facts-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-25T00:37:51Z
  screenshot: evidence/E9-ST-lockdown-none.png
  observed: |
    none (1280): trang Thu thap co thong bao tim "Chi do o may thu"; o Khoa an toan hien "—" + badge vang "Chua kiem duoc tren may chu" + "Kiem o cong Ops tren may thu"; luoi "Khoa an toan & ha tang thu" mo ta "Chua co so tu may thu", tab Tat ca 8 / Chi kiem o may thu 8, 8 hang L1..cong 9210 deu badge vang "Chi kiem o may thu", khong badge xanh. Khop expected. fresh: dong ho "So do luc ... tu may thu", o Khoa an toan 3/8 voi thanh 3 xanh/1 do/4 xam; luoi 8 hang: L1,L2,L3,L4b "Chua kiem duoc", L4 "Hong" (do), OpenClaw/Kev :8009/cong 9210 "On" (xanh); tab Hong 1/Chua kiem duoc 4/On 3; muc May moc: Agent ingest :9210 va Kev gate :8009 "Song". Khop. mixed: o 4/8, thanh 4 xanh/2 do/2 xam; luoi co du ba nhan: On x4 (L1,L3,L4,Kev), Chua kiem duoc x2 (L2,OpenClaw), Hong x2 (L4b, cong 9210); tab 2/2/4; May moc: Agent ingest "Khong phan hoi" (vang), Kev gate "Song". Khop. stale: Alert vang "May thu khong day so tu 2026-10-25 06:55 (GMT+7)"; o Khoa an toan 3/8 so mo, thanh xam (chi doan Hong do); badge "On" vien xam, khong xanh; "Song" o May moc xam; Hong van do. Khop. dark-stale: giao dien toi day du, cung noi dung/trang thai stale (Alert vang toi, so mo, On xam). Khop. narrow-none (390): cot don, 4 o KPI xep doc, o Khoa an toan "—" + "Chua kiem duoc tren may chu", luoi 8 hang, tab "Chi kiem o may thu 8"; cot Trang thai nam sau cuon ngang trong bang; khong tran trang. narrow-fresh (390): o 3/8 voi thanh phan doan, tab Hong 1 / Chua kiem duoc..., 8 hang lop, May moc; khong tran trang (scrollWidth=innerWidth=390).
    Luu y cho nguoi duyet: o 390px cot "Trang thai" cua luoi bi cat sau thanh cuon NGANG BEN TRONG khung bang (trang khong tran). Neu coi thanh cuon ngang trong bang cung la "thanh cuon ngang" thi can xem lai.
  network_observed: no-app-traffic

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-lockdown-cloud-theo-facts-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-25T00:37:51Z

- cmd: cd pipeline && npm test
  run_id: minted-lockdown-cloud-theo-facts-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-25T00:37:51Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-lockdown-cloud-theo-facts-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-25T00:37:51Z

### Judgment

- eval: E7
  judged_by: judge panel (3 lens, fresh context) — đề xuất của panel: PASS, có một phiếu bất đồng
  verdict: UNCERTAIN
  rationale: Hai lens domain-correctness và operational-feasibility cho PASS; lens spec-alignment cho FAIL vì chấm tab «Sống» ở jobs-grid.tsx luôn là bg-success kể cả khi số cũ, trong khi ST-lockdown-stale đòi «Sống» không tô xanh. Còn bất đồng nên người quyết ở Cổng 2.
  required_evidence:
    - Sửa `app/src/components/ops/collections/jobs-grid.tsx`: khi `stale` (hoặc job có `stale`), tab «Sống» đổi `tone` từ `bg-success` sang `bg-muted-foreground/40`, giống `STALE_TABS` trong `lockdown-grid.tsx`. Có thay đổi này thì phần lệch ST-lockdown-stale được đóng.
    - Nếu chấm tab «Sống» ở `StatusGrid` (`app/src/components/ops/collections/status-grid.tsx`) thực ra không tô xanh khi `stale`, thêm tệp đó vào danh sách input. Kèm ảnh chụp máy chủ ở trạng thái stale cho thấy tab «Sống» không xanh thì phán quyết đổi.
  human_override:  # chi nguoi ghi

Phiếu của từng lens (đề xuất, đầy đủ, kể cả bất đồng):

- domain-correctness: PASS — Chữ thật khớp bảng ST-lockdown-*. Khi máy chủ không có khối, lưới ép 8 hàng thành «Chỉ kiểm ở máy thu» (badge vàng `warning-light`, tab tone `bg-warning`, mô tả «Chưa có số từ máy thu»), ô là «—» kèm «Chưa kiểm được trên máy chủ». Lớp `ok: null` hiện «Chưa kiểm được» (`outline`) ở lưới Khoá an toàn và `unchecked` ở lưới Máy móc. Khi số cũ, «Ổn» và «Sống» chuyển `outline` và chấm tab không xanh. Không chữ «máy local»/«cloud»/«lockdown» nào hiện trên giao diện, các từ này chỉ nằm trong comment và id neo; nhãn «máy thu», «máy chủ», «Khoá an toàn» khớp CONTEXT.md. Lens này chỉ đọc đúng các tệp được liệt kê, nên không đối chiếu được logic nguồn gán trạng thái cho hàng Kev gate và collector API (nằm ngoài danh sách).
- operational-feasibility: PASS — Trong các tệp được giao, bảng ST-lockdown-* khớp với chữ thật. Khi máy chủ không có khối, lưới Khoá an toàn hiện «Chỉ kiểm ở máy thu» bằng `warning-light` (màu vàng), ô Khoá an toàn hiện «—» kèm «Chưa kiểm được trên máy chủ», và lớp `ok:null` hiện «Chưa kiểm được» dạng `outline`. Khi số cũ, «Ổn» chuyển sang `outline`, tab và thanh phân đoạn bỏ màu xanh, lưới Máy móc cũng đổi «Sống» sang `outline`. Chuỗi hiển thị không còn chữ «máy local», «cloud» hay «lockdown», từ «lockdown» chỉ còn trong comment và tên mã. Trạng thái mới «Chưa kiểm được» của lưới Máy móc có đủ nhãn, tab và badge `outline`. Việc ánh xạ Kev gate và collector API từ lớp «Hạ tầng» nằm ở tệp ngoài danh sách input nên lens này không đối chiếu.
- spec-alignment: FAIL — Lưới Khoá an toàn, ô Khoá an toàn và nhãn từ vựng đều khớp đặc tả. Có một lệch: `jobs-grid.tsx` giữ chấm tab «Sống» luôn là `bg-success` kể cả khi `stale`, trong khi ST-lockdown-stale đòi «Sống» không tô xanh. `LockdownGrid` đã xử lý đúng bằng STALE_TABS. Những chỗ khớp: 8 hàng ở `lockdown-grid.tsx` ghi «Chỉ kiểm ở máy thu» bằng `warning-light`, mô tả «Chưa có số từ máy thu»; `ok: null` hiện «Chưa kiểm được» với `outline`; khối cũ làm «Ổn» thành `outline` và tab «Ổn» thôi xanh; ô «Khoá an toàn» khi không có khối hiện «—» và «Chưa kiểm được trên máy chủ»; không còn chữ «máy local», «cloud» hay «lockdown» trên giao diện (chúng chỉ nằm trong comment). Việc Kev gate và collector API lấy trạng thái từ hai lớp «Hạ tầng» nằm ở lớp dữ liệu, không có trong danh sách input nên lens này không kiểm được.

Ghi chú máy cho người đọc: phần observed của E9 (khung stale) ghi badge «Sống» ở mục Máy móc là xám; nó không nói riêng về chấm tab «Sống» mà phiếu bất đồng nêu. Người duyệt nên mở khung evidence/E9-ST-lockdown-stale.png để đối chiếu chấm tab này.

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả code mới lẫn baseline — chứng minh harness hơn là tính năng; viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- `cd app && npm test` — E1, E2, E3, E4, E5, E6
- `cd app && npm run test:lint-rules` — E8b

Baseline không đo: E9 (ui-check) — máy ghi n-a; máy không nêu lý do chi tiết.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval máy xanh (E1-E6, E8, E8b, E9); verdict PENDING-JUDGMENT vì E7 còn một phiếu bất đồng (spec-alignment, chấm tab «Sống» ở jobs-grid khi số cũ) và E9 có lưu ý thanh cuộn ngang bên trong khung bảng ở 390px, cần người xem.

