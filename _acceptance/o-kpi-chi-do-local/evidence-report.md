---
schema_version: 2
feature_slug: o-kpi-chi-do-local
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 09d2cd2cbf0500006c61a3a0a7acbb8343430c1d
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: o-kpi-chi-do-local

Vòng 3 (lối ra ON3: chấm thêm một lượt sau khi đổi khuôn). Mọi eval máy (E1-E7, E9, E10) đều đạt và bốn lệnh suite không gắn eval đều xanh. Rà soát vòng này không có finding nào nằm TRONG hợp đồng; năm finding ngoài hợp đồng nằm ở review-findings.md để người quyết ở Cổng 2. Mục E8 (judgment) còn hai lens UNCERTAIN nên verdict là PENDING-JUDGMENT, chờ người quyết. Hai điểm hội đồng chưa kết luận được: (1) ô «Cổng S03 hôm nay» trên cloud được coi là đã đo theo trạng thái bản tin, mà nguồn số phễu chưa xác minh được (finding liên quan nằm ở mục «Ngoài hợp đồng» của review-findings.md); (2) hàng ST-collections-none trong bảng ghi một Alert info, còn ảnh E10 và code dựng hai Alert (khung chụp vòng này có thêm Alert «Phần còn lại của trang chưa có số trên cloud»).

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
  run_id: minted-o-kpi-chi-do-local-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T22:31:06Z
  output: |
    cd app && npm test
    ca khai trong eval: ON3-AC-1 không facts (ma trận 3 trang, một chữ chỉ-local mỗi trang, 0 ô KPI số 0, 0 badge success, ô không số là «—») và hai chiều đỏ bắt được bản sao
    ℹ duration_ms 18058.876958

- eval: E2
  run_id: minted-o-kpi-chi-do-local-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T22:31:06Z
  output: |
    cd app && npm test
    ca khai trong eval: ON3-AC-2 /ops facts tươi (bản tin từ push-ops-facts thật qua handler ingest thật) và chiều đỏ lệch giờ VN
    ℹ duration_ms 18058.876958

- eval: E3
  run_id: minted-o-kpi-chi-do-local-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T22:31:06Z
  output: |
    cd app && npm test
    ca khai trong eval: ON3-AC-3 /ops/collections facts tươi (Bản ghi 24h, Sức khoẻ nguồn, dòng mốc đo, ô Lockdown «—») và chiều đỏ Bản ghi 24h đọc 0
    ℹ duration_ms 18058.876958

- eval: E4
  run_id: minted-o-kpi-chi-do-local-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T22:31:06Z
  output: |
    cd app && npm test
    ca khai trong eval: ON3-AC-4 bản tin thật mốc lùi 46′ (2 trang, một Alert, số mờ, không badge success) và chiều đỏ bản tin 44′ không Alert
    ℹ duration_ms 18058.876958

- eval: E5
  run_id: minted-o-kpi-chi-do-local-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T22:31:06Z
  output: |
    cd app && npm test
    ca khai trong eval: ON3-AC-5 /ops/review cloud (N thẻ đang chờ, đếm theo item_type, một chỗ chữ chỉ-local), không số thì «—», và chiều đỏ đổi khuôn byType
    ℹ duration_ms 18058.876958

- eval: E6
  run_id: minted-o-kpi-chi-do-local-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T22:31:06Z
  output: |
    cd app && npm test
    ca khai trong eval: ON3-AC-6 ma trận khối lỗi do bên ghi thật (freshness, records24h, reviewQueue) ra «—» và «Chưa có số», 0 số 0, 0 badge success
    ℹ duration_ms 18058.876958

- eval: E7
  run_id: minted-o-kpi-chi-do-local-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T22:31:06Z
  output: |
    cd app && npm test
    ca khai trong eval: ON3-AC-7 DB local đủ bảng, ba trang không dòng mốc đo, không Alert số cũ, không truy vấn ops_heartbeat
    ℹ duration_ms 18058.876958

- eval: E8
  judged_by: judge panel đề xuất (3 lens, fresh context)
  verdict: UNCERTAIN
  verified_at: 2026-10-24T22:31:06Z
  judges: domain-correctness, operational-feasibility, spec-alignment
  rationale: Hội đồng đề xuất UNCERTAIN (một lens PASS, hai lens UNCERTAIN); người quyết ở Cổng 2, human_override để trống. Chữ khớp ADR-0014 và bảng trạng thái ở các tệp được đọc, nhưng hai điểm chưa kết luận được: nguồn của số phễu ô «Cổng S03 hôm nay» trên cloud, và số Alert info của /ops/collections khi không có số (bảng ghi 1, code dựng 2).
  votes:
    - domain-correctness: UNCERTAIN — Chữ của dòng mốc đo (tươi), Alert số cũ và chữ chỉ-local từng trang khớp bảng trạng thái và ADR-0014. Ô KPI của /ops và /ops/review không có số thì hiện «—», «Chưa có số», không badge xanh, không số 0. Còn hai điểm không xác minh được từ các tệp được giao: ô «Cổng S03 hôm nay» trên cloud, và số Alert info của trang Thu thập khi không có số (bảng ghi 1, code dựng 2).
    - operational-feasibility: PASS — Chữ thật khớp bảng trạng thái và ADR-0014 §Ngưỡng trễ. FactsStamp hiện «Số đo lúc {fmtVnDateTime} từ máy local» khi tươi hoặc cũ. FactsStaleAlert hiện «Máy local không đẩy số từ {fmtVnDateTime}» (variant warning) khi cũ. fmtVnDateTime sinh «YYYY-MM-DD HH:MM (GMT+7)». Chữ chỉ-local nằm đúng một chỗ mỗi trang: «Chỉ đo ở máy local» ở /ops và /ops/collections khi none, «Hàng chờ duyệt chỉ có ở máy local» ở /ops/review. Khi không đo được, các ô đều là «—», muted, chú thích «Chưa có số», không badge và không dải phân đoạn (UnmeasuredTiles, ô Sức khoẻ nguồn / Bản ghi 24h / Cổng S03 ở cloud, «— thẻ đang chờ»). Khi cũ không còn badge success-light «Không có». Trong ba tệp trang không còn câu trấn an «Không có», «Mọi nguồn …» hay số 0 cho ô không có số. Câu «Mọi nguồn …» chỉ còn khi đã đo, và khi cũ nó có tiền tố «Lần đo cuối:».
    - spec-alignment: UNCERTAIN — Chữ thật khớp bảng và ADR-0014: dòng mốc «Số đo lúc … (GMT+7) từ máy local» (FactsStamp), Alert vàng «Máy local không đẩy số từ …» (FactsStaleAlert) và chữ «Chỉ đo ở máy local» đều lấy giờ từ fmtVnDateTime. Review dùng đúng chữ «Hàng chờ duyệt chỉ có ở máy local». Ô /ops và các ô «Sức khoẻ nguồn», «Bản ghi 24h», Lockdown khi không đo được đều ra «—» + «Chưa có số», không số 0 hay badge xanh. Chưa kết luận PASS vì ô «Cổng S03 hôm nay» trên cloud coi là đã đo (`funnelMeasured: state !== "none"`) mà tệp đầu vào không cho biết `funnel.today` lấy từ đâu; nếu là 0 mặc định thì ô sẽ hiện «0/0» và «0 tin bị cổng chặn», tức một câu trấn an.
  required_evidence:
    - Nguồn của prop `funnel` mà CloudCollections nhận khi chạy trên cloud, tức hàm dựng `CollectionsData.funnel` trong app/src/app/ops/collections/page.tsx kèm hàm nó gọi (getGateFunnel trong app/src/lib/collections-queries.ts hay getLocalFacts). Cần thấy `funnel.today.passed/messages/skipped` trên cloud lấy từ khối `ops_heartbeat` đã đo, chứ không phải giá trị mặc định 0 khi tệp log vắng. Nếu `funnel` là số 0 mặc định mà ô vẫn hiện «0 / 0» và «0 tin bị cổng chặn» khi state là fresh hay stale (`funnelMeasured: cloud.state !== "none"`), thì đó là câu trấn an khi không đo được và kết luận chuyển sang không đạt. Nếu là số đo thật thì mục này không còn chặn PASS.
    - Xác nhận ý định về số Alert info của /ops/collections khi state là none. Hàng ST-collections-none ghi «1 Alert info», nhưng collections-view.tsx dựng 2 LocalOnlyAlert: «Chỉ đo ở máy local» và «Phần còn lại của trang chưa có số trên cloud». Cần bảng Đặc tả UX của design được cập nhật theo khuôn lượt 3 (ghi 2 Alert, chữ «Chỉ đo ở máy local» chỉ một lần), hoặc ghi chú trong sổ quyết định `_acceptance/o-kpi-chi-do-local` rằng Alert thứ hai không tính vào «đúng một lần mỗi trang».
    - Xác nhận FactsStamp được phép hiện cùng FactsStaleAlert ở state stale. Design §3 bước 3 cho phép, nhưng bảng ST-*-stale và bảng «Ngưỡng trễ» của ADR-0014 chỉ ghi Alert cho mức Cũ. Cần một dòng chốt trong design hoặc sổ quyết định để đối chiếu.
  human_override: Mạnh 2026-10-25 — Đạt

- eval: E9
  run_id: minted-o-kpi-chi-do-local-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-24T22:31:06Z
  output: |
    cd app && npx tsc --noEmit && npm run lint
    tsc sạch, lint sạch

- eval: E10
  run_id: minted-o-kpi-chi-do-local-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:capture.ui   # tác tử chấm chụp bằng playwright-cli theo capture.ui (kèm đăng nhập ops thử); bản tổng hợp ghi nhầm khoá executors.ui_check không có trong config — sổ d-41
  verified_at: 2026-10-24T22:31:06Z
  screenshot: evidence/E10-ST-ops-none.png   # 11 khung khác cùng thư mục evidence/, danh sách ở dưới
  observed: |
    E10-ST-ops-none.png (/ops, none): nhãn «Tổng quan»; 1 Alert tím «Chỉ đo ở máy local» (chữ «Máy local chưa đẩy số tổng hợp lên cloud…»); 4 ô KPI (Đạt SLO, Quá hạn, Chưa có snapshot, Snapshot mới nhất) đều «—» với «Chưa có số»; bảng «Độ tươi theo nguồn» trống «Chưa có dữ liệu», 0 mục mỗi tab. Khớp ST-ops-none.
    E10-ST-collections-none.png (/ops/collections, none): 4 ô: Sức khoẻ nguồn «—», Bản ghi 24h «—», Cổng S03 «—» (đều «Chưa có số»), Lockdown «—» kèm badge vàng «Chưa kiểm được trên cloud»; Alert info tím «Chỉ đo ở máy local»; bảng Sức khoẻ nguồn trống; CÓ THÊM Alert info thứ hai «Phần còn lại của trang chưa có số trên cloud» (luồng 7 ngày, Cần chú ý, lockdown, ống S03…). Không có lỗi, không «Hỏng». Khớp ST-collections-none về các ô «—» và Alert chỉ-local; lệch về chữ «1 Alert».
    E10-ST-review-none.png (/ops/review, none): «Review Queue», dòng «— thẻ đang chờ», 1 Alert info «Hàng chờ duyệt chỉ có ở máy local». Khớp ST-review-none.
    E10-ST-ops-fresh.png (/ops, fresh): dòng «Số đo lúc 2026-10-25 05:33 (GMT+7) từ máy local»; không có Alert; ô: 4/4 nguồn đạt SLO («4 Đạt»), Quá hạn 0 với badge xanh «Không có», Chưa có snapshot 0, Snapshot mới nhất 2026-10-24 (S03 · hanoi); bảng 7 dòng toàn badge xanh «Đạt». Khớp ST-ops-fresh.
    E10-ST-collections-fresh.png (/ops/collections, fresh): dòng mốc đo 05:33 (GMT+7); Sức khoẻ nguồn 4/4 với thanh xanh; Bản ghi 24h 1.487 «Nhiều nhất: S03 (743)»; Cổng S03 0/0; Lockdown «—» + badge vàng «Chưa kiểm được trên cloud»; bảng 4 nguồn badge xanh «Đạt». Khớp ST-collections-fresh.
    E10-ST-review-count.png (/ops/review, fresh): «13 thẻ đang chờ», hai nhãn «agent_output: 2» và «entity_match: 11», dòng «Số đo lúc 2026-10-25 05:33 (GMT+7) từ máy local», Alert info «Hàng chờ duyệt chỉ có ở máy local». Khớp ST-review-count và SQL local.
    E10-ST-ops-stale.png (/ops, stale): mốc đo 04:48; Alert VÀNG «Máy local không đẩy số từ 2026-10-25 04:48 (GMT+7)» + «kiểm cloud-sync ở máy thu»; số 4/4, 0, 0, 2026-10-24 trong 4 ô màu xám mờ; chấm «4 Đạt» xám; badge «Đạt» trong bảng viền xám, không xanh. Khớp ST-ops-stale.
    E10-ST-collections-stale.png (/ops/collections, stale): cùng Alert vàng 04:48; số 4/4, 1.487, 0/0 xám mờ; thanh tiến độ xám; chấm xám; badge «Đạt» xám; Lockdown vẫn «Chưa kiểm được trên cloud»; không có Alert 30′ cũ. Khớp ST-collections-stale.
    E10-dark-ST-collections-stale.png: nền tối, đúng /ops/collections trạng thái stale (breadcrumb Thu thập, Alert vàng viền/nền vàng tối 04:48, số mờ, chữ đọc được). Đúng tên.
    E10-narrow-ST-ops-stale.png (390px): /ops stale, Alert vàng (tiêu đề bị cắt «…04:48…»), ô KPI xếp dọc 1 cột, số mờ, không tràn ngang.
    E10-narrow-ST-collections-stale.png (390px): /ops/collections stale, Alert vàng, ô Sức khoẻ nguồn / Bản ghi 24h / Cổng S03 xếp dọc, số mờ, không tràn ngang.
    E10-narrow-ST-review-count.png (390px): /ops/review fresh, «13 thẻ đang chờ», hai nhãn loại, dòng mốc đo, Alert info, vừa khung.
    Tám dòng ST đều có khung mang đúng tên và khớp mô tả (với một điểm lệch chữ ở ST-collections-none); khung tối và 390px đúng trang/trạng thái; scrollWidth == innerWidth ở ba trang.
  network_observed: no-app-traffic
  output: |
    Khung đã lưu (_acceptance/o-kpi-chi-do-local/evidence/): E10-ST-ops-none.png, E10-ST-collections-none.png, E10-ST-review-none.png, E10-ST-ops-fresh.png, E10-ST-collections-fresh.png, E10-ST-review-count.png, E10-ST-ops-stale.png, E10-ST-collections-stale.png, E10-dark-ST-collections-stale.png, E10-narrow-ST-ops-stale.png, E10-narrow-ST-collections-stale.png, E10-narrow-ST-review-count.png, E10-network.txt.
    (3) Ảnh chỉ chụp phần nhìn thấy (900/844px) nên phần dưới trang không nằm trong khung.
    (4) Mốc hiển thị dạng «GMT+7».
    Dọn: đã tắt server :3461, drop lược đồ ops_cloud_proto, hoàn tác app/next-env.d.ts, xoá app/AGENTS.md do dev server sinh. Không đụng server :3460 của worktree khác.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-o-kpi-chi-do-local-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-10-24T22:31:06Z

- cmd: cd pipeline && npm test
  run_id: minted-o-kpi-chi-do-local-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-10-24T22:31:06Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-o-kpi-chi-do-local-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-10-24T22:31:06Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-o-kpi-chi-do-local-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-24T22:31:06Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay.

Eval không phân biệt (xanh trên cả mã mới lẫn baseline), chứng minh harness chứ không chứng minh feature; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý:
- `cd app && npm test` phủ E1, E2, E3, E4, E5, E6, E7 (baseline green ở lần đo cuối, vòng 2)

Baseline không đo: mọi khối eval máy ghi n-a vì vòng này không đo lại baseline (evals.yaml không đổi từ lần đo baseline cuối, vòng 2). Ở vòng 2, E9 là eval phân biệt (red trên baseline); E10 (ui-check) không chạy được trên baseline.

## Variance

none — mọi eval chạy một lần, không eval nào ngẫu nhiên.

## Iterations

Round 1: E10 failed — /ops/collections hiện Alert lỗi ở cả ba trạng thái vì getFlowDays truy vấn airbnb_snapshots không điều kiện mà lược đồ cloud không có bảng này (collections-queries.ts:101); ba dòng ST-collections-* không có khung đúng. Lệnh suite pipeline npm test cũng đỏ một ca (entrypoint-symlink.test.mjs:134). Returned to implementation.
Round 2: mọi eval máy và mọi lệnh suite đều xanh, E10 chụp lại đủ 12 khung, /ops/collections không còn Alert lỗi. REJECT vì rà soát tìm ra ba lỗi trong hợp đồng (RotationPanel câu «mọi thị trường đều tươi» khi không đo được, mục «Hỏng» giả của lockdown trong «Cần chú ý» trên cloud, hai badge xanh còn lại ở stale) mà test hiện tại không bắt được. Returned to implementation.
Round 3 (lối ra ON3, đổi khuôn): mọi eval máy (E1-E7, E9, E10) và bốn lệnh suite đều xanh, E10 chụp lại đủ 12 khung; rà soát không có finding trong hợp đồng. PENDING-JUDGMENT vì E8 còn hai lens UNCERTAIN (nguồn số phễu ô «Cổng S03 hôm nay» trên cloud; số Alert info của /ops/collections khi không có số) — người quyết ở Cổng 2.


### Re-pin lần 1 — 2026-10-24, do ghim lại sau gộp main có ON12 (đổi chữ máy thu/máy chủ)
run_id: repin-20261024T234416Z-12233
sha: 82c3c83865da1a326abfec8fe0c9ba52deb07963 · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng · ngoài làn máy: E8, E10 (E10 không khai paths) · diff chạm vật đo ngoài làn máy: E8 — chưa chứng lại, đi vòng S4 delta · AC không có chốt máy: AC-8, AC-10

### Re-pin lần 2 — 2026-10-25, do ghim lại trên nhánh ON23 — ON23 đổi tệp trong paths của ON3 (hai ca test «tới khi ON23», lưới khoá an toàn)
run_id: repin-20261025T032923Z-31932
sha: 0a5494f913e5560e5a63fcc6136bd29f480c795f · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng · ngoài làn máy: E8, E10 (E10 không khai paths) · diff chạm vật đo ngoài làn máy: E8 — chưa chứng lại, đi vòng S4 delta · AC không có chốt máy: AC-8, AC-10

### Re-pin lần 3 — 2026-10-25, do ghim lại sau gộp main (PR #84)
run_id: repin-20261025T033221Z-12070
sha: 09d2cd2cbf0500006c61a3a0a7acbb8343430c1d · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng · ngoài làn máy: E8, E10 (E10 không khai paths) · AC không có chốt máy: AC-8, AC-10
