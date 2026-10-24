---
schema_version: 2
feature_slug: o-kpi-chi-do-local
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e30f7a81b36ff5413e06443d9b5b5a165ed11801
human_signoff:
---

# Evidence Report: o-kpi-chi-do-local

Vòng 2. Mọi eval máy (E1-E7, E9, E10) đều đạt và bốn lệnh suite không gắn eval đều xanh. Vòng này vẫn bị REJECT vì bước rà soát tìm ra ba lỗi nằm TRONG hợp đồng (AC-3, AC-4, AC-8), chi tiết ở review-findings.md: RotationPanel hiện câu «mọi thị trường đều tươi» khi không đo được, «Cần chú ý» trên cloud vẫn báo «Hỏng» cho lớp lockdown đo trên máy chạy trang, và trạng thái stale của /ops/collections vẫn còn hai badge xanh (Kênh kết nối, Hoạt động). Các test hiện tại không phát hiện được vì fixture không chạm tới các nhánh này. Mục E8 (judgment) còn hai lens UNCERTAIN, chờ người quyết ở Cổng 2.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | judgment | UNCERTAIN |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: minted-o-kpi-chi-do-local-E1-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:26:26Z
  output: |
    cd app && npm test
    ca ON3-AC-1 không facts (ma trận 3 trang), hai chiều đỏ bắt được bản sao: ok
    ℹ duration_ms 18364.703083

- eval: E2
  run_id: minted-o-kpi-chi-do-local-E2-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:26:26Z
  output: |
    cd app && npm test
    ca ON3-AC-2 /ops facts tươi và chiều đỏ lệch giờ VN: ok
    ℹ duration_ms 18364.703083

- eval: E3
  run_id: minted-o-kpi-chi-do-local-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:26:26Z
  output: |
    cd app && npm test
    ca ON3-AC-3 /ops/collections facts tươi và chiều đỏ Bản ghi 24h đọc 0: ok
    ℹ duration_ms 18364.703083

- eval: E4
  run_id: minted-o-kpi-chi-do-local-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:26:26Z
  output: |
    cd app && npm test
    ca ON3-AC-4 bản tin thật mốc lùi 46′ (2 trang) và chiều đỏ bản tin trong ngưỡng: ok
    ℹ duration_ms 18364.703083

- eval: E5
  run_id: minted-o-kpi-chi-do-local-E5-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:26:26Z
  output: |
    cd app && npm test
    ca ON3-AC-5 /ops/review cloud (N thẻ đang chờ, đếm theo item_type) và chiều đỏ đổi khuôn byType: ok
    ℹ duration_ms 18364.703083

- eval: E6
  run_id: minted-o-kpi-chi-do-local-E6-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:26:26Z
  output: |
    cd app && npm test
    ca ON3-AC-6 ma trận khối lỗi do bên ghi thật (freshness, records24h, reviewQueue): ok
    ℹ duration_ms 18364.703083

- eval: E7
  run_id: minted-o-kpi-chi-do-local-E7-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T15:26:26Z
  output: |
    cd app && npm test
    ca ON3-AC-7 DB local đủ bảng, không truy vấn ops_heartbeat: ok
    ℹ duration_ms 18364.703083

- eval: E8
  judged_by: judge panel đề xuất (3 lens, fresh context)
  verdict: UNCERTAIN
  rationale: Hội đồng đề xuất UNCERTAIN (một lens PASS, hai lens UNCERTAIN); người quyết ở Cổng 2. Chữ khớp ADR-0014 và bảng trạng thái ở các tệp được đọc, nhưng hai chỗ trên /ops/collections chưa kết luận được vì nguồn của chúng nằm ngoài danh sách input: ô «Cổng S03 hôm nay» được coi là đã đo khi state khác none, và danh sách «cần chú ý» nhận lớp lockdown chưa ép về «chưa đo».
  votes:
    - domain-correctness: UNCERTAIN — Chữ khớp bảng trạng thái và ADR-0014. FactsStamp ra «Số đo lúc {fmtVnDateTime} từ máy local» và FactsStaleAlert ra «Máy local không đẩy số từ {fmtVnDateTime}», giờ có dạng «YYYY-MM-DD HH:MM (GMT+7)». Chữ chỉ-local đúng nguyên văn: «Chỉ đo ở máy local» ở /ops và /ops/collections, «Hàng chờ duyệt chỉ có ở máy local» ở /ops/review. Ô không đo được hiện «—» và «Chưa có số», không badge và không số 0. Hai chỗ vẫn có thể còn câu trấn an hoặc số 0, và nguồn của chúng nằm ngoài danh sách input nên không phân xử được. Chỗ thứ nhất: ô «Bản ghi 24h» có thể hiện «Chưa có bản ghi trong 24 giờ» dù đã có số. Chỗ thứ hai: ô «Cổng S03 hôm nay» có thể hiện số 0 và «0 tin bị cổng chặn» khi facts tươi hoặc cũ.
    - operational-feasibility: PASS — Chữ trong code khớp bảng trạng thái và ngưỡng ADR-0014. FactsStamp ra «Số đo lúc {fmtVnDateTime} từ máy local», tức dạng «YYYY-MM-DD HH:MM (GMT+7)». FactsStaleAlert ra «Máy local không đẩy số từ …» với Alert warning khi state là stale. Khi state là none, /ops và /ops/collections có đúng một LocalOnlyAlert «Chỉ đo ở máy local», còn /ops/review có đúng một Alert «Hàng chờ duyệt chỉ có ở máy local». Ô không đo được hiện «—» kèm «Chưa có số», không badge và không số 0. Khi stale, các ô trong phạm vi các tệp được giao đều mờ và không badge xanh. Hai điểm không thể đối chiếu trong phạm vi này và không tính là lệch: dạng giờ «YYYY-MM-DD HH:MM (GMT+7)» khác chữ giữ chỗ «HH:MM (giờ VN)» của ADR (design nêu ON8, sổ d-13 là căn cứ), và ô «Cổng S03 hôm nay» được coi là đã đo khi state khác none.
    - spec-alignment: UNCERTAIN — Chữ khớp ADR-0014 và bảng trạng thái. FactsStamp ra «Số đo lúc {fmtVnDateTime} từ máy local», FactsStaleAlert ra «Máy local không đẩy số từ {fmtVnDateTime}», và fmtVnDateTime ra «YYYY-MM-DD HH:MM (GMT+7)». Chữ chỉ-local khớp từng trang: «Chỉ đo ở máy local» ở /ops và /ops/collections, «Hàng chờ duyệt chỉ có ở máy local» ở /ops/review. Ô không đo được ở /ops («—», «Chưa có số») và ở review («—») không có câu trấn an. Hai chỗ trên Thu thập chưa kết luận được trong các tệp được phép đọc: (1) ô «Cổng S03 hôm nay» coi là đã đo khi `funnelMeasured: cloud.state !== "none"`, trong khi design không liệt kê khối funnel nào trong facts, nên có thể hiện «0 / 0» và «0 tin bị cổng chặn»; (2) `issuesOf` nhận `lockdown.layers` nguyên bản, còn ô Lockdown và LockdownGrid đã ép `ok: null`, nên danh sách «cần chú ý» có thể vẫn đỏ giả.
  required_evidence:
    - app/src/lib/ops-cloud.ts (getCloudOpsView) và app/src/app/ops/collections/page.tsx: tham số `feedHealth` của CollectionsView trên cloud có thành [] khi `cloud.feeds` null không, trong khi `cloud.records24h` vẫn có số (khối freshness lỗi, khối records24h tốt). Nếu có thì ô «Bản ghi 24h» hiện giá trị thật kèm chú thích sai «Chưa có bản ghi trong 24 giờ» (collections-tiles.tsx dòng 75) và verdict đổi thành FAIL. Nếu không thì bằng chứng này chặn được lỗi đó.
    - Nguồn của `funnel` (GateFunnel) mà trang /ops/collections truyền cho CollectionsTiles khi chạy trên cloud, tức app/src/app/ops/collections/page.tsx và app/src/lib/collections-queries.ts. Cần biết `funnelMeasured: cloud.state !== "none"` có đúng không khi facts fresh hoặc stale mà ON22 không có khối funnel. Nếu funnel trên cloud là 0 giả thì ô hiện «0/0» và «0 tin bị cổng chặn» là câu trấn an và verdict đổi thành FAIL. Nếu funnel đọc từ payload heartbeat thật thì phần này đạt.
    - app/src/lib/ops-facts.ts (FACTS_STALE_MS và kiểu của measuredAt): xác nhận ngưỡng là 45′ và measuredAt luôn mang múi giờ, để fmtVnDateTime không trả «—» làm dòng mốc thành «Số đo lúc — từ máy local».
    - Nguồn lens spec-alignment đề nghị thêm: hành vi của `issuesOf` trong app/src/components/ops/collections/attention-list.tsx khi nhận `lockdown.layers` có ok=false do probe chạy trên Vercel; chữ thật của app/src/components/ops/overview/objectives-grid.tsx và feeds-grid.tsx với prop `stale` và trạng thái không có số.
  human_override:  # chi nguoi ghi

- eval: E9
  run_id: minted-o-kpi-chi-do-local-E9-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-10-24T15:26:26Z
  output: |
    cd app && npx tsc --noEmit && npm run lint
    tsc sạch, lint sạch

- eval: E10
  run_id: E10-reverify-r2-20261024
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui_check
  verified_at: 2026-10-24T15:26:26Z
  screenshot: evidence/E10-ST-ops-none.png   # 12 khung khác cùng thư mục evidence/, danh sách ở dưới
  observed: |
    Đã mở và đọc 12 ảnh:
    - E10-ST-ops-none.png (/ops, none): 4 ô KPI toàn «—» với dòng «Chưa có số», 1 Alert info tím «Chỉ đo ở máy local», bảng Độ tươi theo nguồn trống «Chưa có dữ liệu», 0 mục mỗi tab. Khớp ST-ops-none.
    - E10-ST-collections-none.png (/ops/collections, none): trang hiện đầy đủ (không còn Alert lỗi): ô Sức khoẻ nguồn, Bản ghi 24h, Cổng S03 đều «—» «Chưa có số», Lockdown «—» + nhãn «Chưa kiểm được trên cloud», 1 Alert info «Chỉ đo ở máy local». Khớp ST-collections-none (có thêm mục «Cần chú ý» 2 việc, xem ghi chú).
    - E10-ST-review-none.png (/ops/review, none): «Review Queue», dòng «— thẻ đang chờ», Alert info «Hàng chờ duyệt chỉ có ở máy local». Khớp ST-review-none.
    - E10-ST-ops-fresh.png (/ops, fresh): dòng «Số đo lúc 2026-10-24 22:28 (GMT+7) từ máy local»; ô: 4/4 nguồn đạt SLO, Quá hạn 0 (badge xanh «Không có»), Chưa có snapshot 0, Snapshot mới nhất 2026-10-24; bảng 7 dòng toàn badge xanh «Đạt». Khớp ST-ops-fresh.
    - E10-ST-collections-fresh.png (/ops/collections, fresh): dòng mốc đo 22:28 (GMT+7), Sức khoẻ nguồn 4/4 + thanh xanh, Bản ghi 24h 1.060 «Nhiều nhất: S03 (529)», Cổng S03 0/0, Lockdown «—» «Chưa kiểm được trên cloud». Khớp ST-collections-fresh.
    - E10-ST-review-count.png (/ops/review, fresh): «15 thẻ đang chờ», theo loại agent_output: 4 · entity_match: 11, dòng «Số đo lúc 22:28», Alert info «Hàng chờ duyệt chỉ có ở máy local». Khớp ST-review-count.
    - E10-ST-ops-stale.png (/ops, stale): mốc đo 21:42, Alert VÀNG «Máy local không đẩy số từ 2026-10-24 21:42 (GMT+7)» + «kiểm cloud-sync ở máy thu»; số trong 4 ô màu xám mờ, chấm «4 Đạt» xám, badge «Đạt» trong bảng viền xám, 0 badge xanh. Khớp ST-ops-stale.
    - E10-ST-collections-stale.png (/ops/collections, stale): cùng Alert vàng 21:42; số 4/4, 1.060, 0/0 xám mờ, thanh tiến độ xám, các chấm xám, 0 badge/thanh xanh. Khớp ST-collections-stale.
    - E10-dark-ST-collections-stale.png: nền tối, đúng trang /ops/collections và đúng trạng thái stale (Alert vàng viền/nền vàng tối, số mờ, chữ đọc được).
    - E10-narrow-ST-ops-stale.png (390px): /ops stale, Alert vàng, ba ô KPI xếp dọc, số mờ, không tràn ngang.
    - E10-narrow-ST-collections-stale.png (390px): /ops/collections stale, Alert vàng, ô Sức khoẻ nguồn/Bản ghi 24h xếp dọc, số mờ, không tràn ngang.
    - E10-narrow-ST-review-count.png (390px): /ops/review fresh, 15 thẻ, hai nhãn loại, Alert info, vừa khung.
    Tám dòng ST đều có khung mang đúng tên và khớp mô tả; khung tối và 390px đúng trang/trạng thái; không thanh cuộn ngang ở ba trang (scrollWidth == innerWidth).
  network_observed: no-app-traffic
  output: |
    Khung đã lưu (_acceptance/o-kpi-chi-do-local/evidence/): E10-ST-ops-none.png, E10-ST-collections-none.png, E10-ST-review-none.png, E10-ST-ops-fresh.png, E10-ST-collections-fresh.png, E10-ST-review-count.png, E10-ST-ops-stale.png, E10-ST-collections-stale.png, E10-dark-ST-collections-stale.png, E10-narrow-ST-ops-stale.png, E10-narrow-ST-collections-stale.png, E10-narrow-ST-review-count.png, E10-network.txt.
    Ghi chú (không làm đỏ eval): (1) Khung narrow-ST-review-count chụp lần này đúng ở mode fresh (báo cáo vòng 1 ghi nhầm mode stale). (2) Ảnh 1280 lẫn 390 chỉ chụp phần nhìn thấy (900/844px cao) vì vùng cuộn nằm trong khung chính; phần dưới trang (bảng Sức khoẻ nguồn, ô còn lại ở 390px) không có trong khung. (3) Mode none ở /ops/collections vẫn hiện mục «Cần chú ý 2 việc»: «Lớp L4 Hỏng» và «3 nhóm S03 im > 72h» dù không có bản tin nào (bảng ST-collections-none chỉ nêu 3 ô «—» + 1 Alert info) — người duyệt cân nhắc có khẳng định «Hỏng» khi chưa đo được hay không; điều này trùng với lỗi trong hợp đồng ghi ở review-findings.md. (4) Mốc hiện «GMT+7», đặc tả viết «giờ VN». (5) network: playwright-cli requests không liệt kê XHR/fetch nào ngoài tài nguyên tĩnh nên khai no-app-traffic; số liệu phía server nằm ở dòng log. Dọn: tắt server :3461 của tôi, drop lược đồ ops_cloud_proto, hoàn tác app/next-env.d.ts, xoá app/AGENTS.md do dev server sinh; server :3460 của worktree khác giữ nguyên.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-o-kpi-chi-do-local-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-24T15:26:26Z

- cmd: cd pipeline && npm test
  run_id: minted-o-kpi-chi-do-local-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-24T15:26:26Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-o-kpi-chi-do-local-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-24T15:26:26Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-o-kpi-chi-do-local-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-24T15:26:26Z

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
Round 2: mọi eval máy và mọi lệnh suite đều xanh, E10 chụp lại đủ 12 khung, /ops/collections không còn Alert lỗi. REJECT vì rà soát tìm ra ba lỗi trong hợp đồng (RotationPanel câu «mọi thị trường đều tươi» khi không đo được, mục «Hỏng» giả của lockdown trong «Cần chú ý» trên cloud, hai badge xanh còn lại ở stale) mà test hiện tại không bắt được. Returned to implementation.

