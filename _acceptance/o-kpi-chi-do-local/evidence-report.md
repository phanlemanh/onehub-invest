---
schema_version: 2
feature_slug: o-kpi-chi-do-local
verdict: REJECT
failed_evals: [E10]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9b7cae0cde693c67fe0dd40de51901ef9c5809db
human_signoff:
---

# Evidence Report: o-kpi-chi-do-local

Vòng 1. Một eval ui-check (E10) không đạt: trang /ops/collections hiện khung lỗi ở cả ba trạng thái, không hiện nội dung ST-collections-*. Một lệnh suite không gắn eval (pipeline) cũng không xanh, ghi ở mục Lệnh suite.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | judgment | UNCERTAIN (hội đồng đề xuất FAIL, chờ người quyết) |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | ui-check | FAIL |

## Evidence

- eval: E1
  run_id: minted-o-kpi-chi-do-local-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:33:13Z
  output: |
    cd app && npm test
    ℹ duration_ms 10261.846458

- eval: E2
  run_id: minted-o-kpi-chi-do-local-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:33:13Z
  output: |
    cd app && npm test
    ℹ duration_ms 10261.846458

- eval: E3
  run_id: minted-o-kpi-chi-do-local-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:33:13Z
  output: |
    cd app && npm test
    ℹ duration_ms 10261.846458

- eval: E4
  run_id: minted-o-kpi-chi-do-local-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:33:13Z
  output: |
    cd app && npm test
    ℹ duration_ms 10261.846458

- eval: E5
  run_id: minted-o-kpi-chi-do-local-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:33:13Z
  output: |
    cd app && npm test
    ℹ duration_ms 10261.846458

- eval: E6
  run_id: minted-o-kpi-chi-do-local-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:33:13Z
  output: |
    cd app && npm test
    ℹ duration_ms 10261.846458

- eval: E7
  run_id: minted-o-kpi-chi-do-local-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T14:33:13Z
  output: |
    cd app && npm test
    ℹ duration_ms 10261.846458

- eval: E8
  judged_by: judge panel đề xuất (3 lens, fresh context)
  verdict: UNCERTAIN
  rationale: Hội đồng đề xuất FAIL (hai lens FAIL, một lens UNCERTAIN); người quyết ở Cổng 2. Khung chữ Số đo lúc … từ máy local và Máy local không đẩy số từ … khớp ADR-0014, các ô không đo được hiện «—» và «Chưa có số», không số 0, không badge xanh, không câu trấn an. Nhưng nhánh số cũ (stale) lệch ADR-0014 hàng «Cũ» (số cũ phải mờ, không badge xanh) ở một số chỗ, và ba tệp (format.ts, freshness.ts, ba page.tsx) nằm ngoài danh sách input nên chưa xác nhận được nguyên văn «HH:MM (giờ VN)» và «Chỉ đo ở máy local».
  votes:
    - domain-correctness: UNCERTAIN — Khung chữ FactsStamp và FactsStaleAlert khớp ADR-0014; các ô không đo được không còn số 0, badge xanh hay câu trấn an. Phần «HH:MM (giờ VN)» do fmtVnDateTime tạo ra và chữ «Chỉ đo ở máy local» do LOCAL_ONLY_TEXT quyết định, cả hai nằm ngoài năm tệp đầu vào nên không xác nhận được nguyên văn.
    - operational-feasibility: FAIL — Trong review-content.tsx, khi state là stale, số «N thẻ đang chờ» vẫn là font-semibold không có text-muted-foreground, trái ADR-0014 §Ngưỡng trễ (hàng Cũ) và mục 4 của design. Ở overview-tiles.tsx nhánh stale vẫn hiện câu trấn an «Mọi nguồn có snapshot đều trong hạn» và «Mọi nguồn đã có snapshot» khi không còn đo được hiện tại. Nhánh không có số (UnmeasuredTiles, Bản ghi 24h, Sức khoẻ nguồn, Cổng S03) thì sạch.
    - spec-alignment: FAIL — Chữ stamp và chữ Alert trong facts-status.tsx khớp bảng trạng thái, các ô không đo được hiện «—» và «Chưa có số». Nhưng ADR-0014 hàng «Cũ» đòi số cũ hiện mờ, không badge xanh: review-content.tsx dòng 36-38 vẽ «N thẻ đang chờ» đậm bình thường ở mọi state kể cả stale; ở collections-tiles.tsx, SegmentBar Sức khoẻ nguồn và Cổng S03 vẫn giữ tông bg-success khi stale (dòng 62-65, 88-94).
  required_evidence:
    - review-content.tsx nhánh cloud (dòng 36-38): số «N thẻ đang chờ» và Badge theo loại mờ (text-muted-foreground) khi cloud.state là stale; lấy bằng đọc lại tệp sau sửa hoặc test render state stale của /ops/review.
    - collections-tiles.tsx: khi cloud.stale thì SegmentBar của «Sức khoẻ nguồn» và «Cổng S03» không tô bg-success; lấy bằng đọc lại tệp sau sửa hoặc test render ST-collections-stale.
    - overview-tiles.tsx khi stale là true: chân ô «Quá hạn» và «Chưa có snapshot» không còn câu «Mọi nguồn có snapshot đều trong hạn» hay «Mọi nguồn đã có snapshot», hoặc một dòng trong design ghi rõ số đo cuối được phép giữ câu này.
    - Đầu ra thật của fmtVnDateTime (app/src/lib/format.ts) dạng «HH:MM (giờ VN)»; chữ LOCAL_ONLY_TEXT (app/src/lib/freshness.ts) là «Chỉ đo ở máy local»; ba page.tsx (/ops, /ops/collections, /ops/review) render FactsStamp, FactsStaleAlert, LocalOnlyAlert đúng một lần. Muốn xét thì thêm các tệp này vào inputs của E8.
  human_override:  # chi nguoi ghi

- eval: E9
  run_id: minted-o-kpi-chi-do-local-E9-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-10-24T14:33:13Z
  output: |
    cd app && npx tsc --noEmit && npm run lint
    tsc sạch, lint sạch

- eval: E10
  run_id: E10-bold-bassi-0e7f42
  exit_code: 1
  baseline: n-a
  verifier: config:executors.ui_check
  verified_at: 2026-10-24T14:33:13Z
  screenshot: evidence/E10-ST-ops-none.png   # 12 khung khác cùng thư mục evidence/, danh sách ở dưới
  observed: |
    Đã mở từng khung bằng Read. /ops (none, fresh, stale), /ops/review (none, count) và khung 390px của /ops, review khớp bảng trạng thái, không tràn ngang.
    Cả ba khung ST-collections-{none,fresh,stale}, khung tối và khung 390px của collections đều chỉ là Alert đỏ «Không tải được dữ liệu» + nút Thử lại + toast «2 Issues», không có ô KPI, dòng mốc đo hay Alert vàng 45′. Mâu thuẫn expected ở ba dòng ST-collections.
  network_observed: n-a (driver)
  output: |
    Kết quả assertion do bộ chụp trả:
    [PASS] Dựng lược đồ ops_cloud_proto 3 mode (none/fresh/stale); đăng nhập tài khoản ops thử (POST /login 303, cookie oi_session); 13 tệp lưu trong evidence/.
    [DEVIATION] Cổng :3460 đang có server của worktree khác (u1-compare-saved), không phải của vòng này nên không tắt và không dùng; chạy dev server của worktree này ở :3461 với DATABASE_URL của lược đồ; đã tắt :3461 và drop lược đồ khi xong.
    [PASS] /ops: ST-ops-none (4 ô dash, Alert info), ST-ops-fresh (4/4 SLO, 7 dòng), ST-ops-stale (Alert vàng, số mờ, 0 badge xanh ở ô KPI).
    [PASS] /ops/review: ST-review-none và ST-review-count (15 thẻ, agent_output 4, entity_match 11).
    [FAIL] /ops/collections: cả 3 trạng thái, kèm khung tối và khung 390px, đều hiện Alert đỏ «Không tải được dữ liệu», mã lỗi 869050949. Log dev server: 5 lần «relation airbnb_snapshots does not exist» tại getFlowDays (app/src/lib/collections-queries.ts:101), gọi từ CollectionsPage (page.tsx:28); lược đồ proto như cloud thật không có bảng airbnb_snapshots.
    [PASS] Không thanh cuộn ngang ở ba trang tại 390px và 1280px.
    [NOTE] Khung E10-narrow-ST-review-count.png chụp lúc mode stale theo đúng thứ tự bước, tên khung nói count. [NOTE] Mốc đo hiện «GMT+7», spec ghi «giờ VN». [NOTE] Dev server tự sinh app/AGENTS.md và sửa app/next-env.d.ts, không phải code kiểm.
    Khung: evidence/E10-ST-{ops,collections,review}-none.png, E10-ST-{ops,collections}-fresh.png, E10-ST-review-count.png, E10-ST-{ops,collections}-stale.png, E10-dark-ST-collections-stale.png, E10-narrow-ST-{ops,collections}-stale.png, E10-narrow-ST-review-count.png, E10-network.txt.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-o-kpi-chi-do-local-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-24T14:33:13Z

- cmd: cd pipeline && npm test
  run_id: minted-o-kpi-chi-do-local-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-10-24T14:33:13Z
  # 128/129 test đạt. Một ca đỏ: pipeline/scripts/entrypoint-symlink.test.mjs:134 «AC-3 không còn khuôn cũ», báo «AC-3 còn lối vào khuôn cũ: scripts/ops-cloud-proto.mjs». Lệnh này không gắn eval nào của vòng; ca đỏ nêu đúng tệp scripts/ops-cloud-proto.mjs mà E10 dùng để dựng lược đồ proto, người đọc kiểm tệp này có phải của vòng không.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-o-kpi-chi-do-local-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-24T14:33:13Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-o-kpi-chi-do-local-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-24T14:33:13Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả mã mới lẫn baseline), chứng minh harness chứ không chứng minh feature; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý:
- `cd app && npm test` phủ E1, E2, E3, E4, E5, E6, E7 (baseline green)

Eval phân biệt (red trên baseline): E9.
Baseline không đo: E10 (ui-check, không chạy được trên baseline).

## Variance

none — mọi eval chạy một lần, không eval nào ngẫu nhiên.

## Iterations

Round 1: E10 failed — /ops/collections hiện Alert lỗi ở cả ba trạng thái vì getFlowDays truy vấn airbnb_snapshots không điều kiện mà lược đồ cloud không có bảng này (collections-queries.ts:101); ba dòng ST-collections-* không có khung đúng. Lệnh suite pipeline npm test cũng đỏ một ca (entrypoint-symlink.test.mjs:134). Returned to implementation.

