---
schema_version: 2
feature_slug: enrich-qua-de-xuat
verdict: PENDING-JUDGMENT
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b4ed852fd042af8cb82efbc46da45c4f936275a5
human_signoff:
---

# Evidence Report: enrich-qua-de-xuat

Round 3. Mọi lệnh máy đều xanh (E1–E5, E7–E12, E14–E16 và hai lệnh suite). Verdict PENDING-JUDGMENT vì ba mục judgment (E6, E13, E17) đang chờ người chốt ở Cổng 2; `human_override` để trống. Không eval nào chạy nhiều lần nên không có tín hiệu phương sai.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-5 | judgment | PASS (đề xuất của hội đồng, chưa có human_override) |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-10 | test | PASS |
| E13 | AC-4 | judgment | PASS (đề xuất của hội đồng, chưa có human_override) |
| E14 | AC-7 | test | PASS |
| E15 | AC-11 | test | PASS |
| E16 | AC-11 | test | PASS |
| E17 | AC-11 | judgment | PASS (đề xuất của hội đồng, chưa có human_override) |

## Evidence

- eval: E1
  run_id: minted-enrich-qua-de-xuat-E1-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.agent
  verified_at: 2026-10-23T00:34:19Z
  output: |
    cd agent && npm test
    ℹ duration_ms 518.048458

- eval: E2
  run_id: minted-enrich-qua-de-xuat-E2-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.agent
  verified_at: 2026-10-23T00:34:19Z
  output: |
    cd agent && npm test
    ℹ duration_ms 518.048458

- eval: E3
  run_id: minted-enrich-qua-de-xuat-E3-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.agent
  verified_at: 2026-10-23T00:34:19Z
  output: |
    cd agent && npm test
    ℹ duration_ms 518.048458

- eval: E4
  run_id: minted-enrich-qua-de-xuat-E4-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.agent
  verified_at: 2026-10-23T00:34:19Z
  output: |
    cd agent && npm test
    ℹ duration_ms 518.048458

- eval: E5
  run_id: minted-enrich-qua-de-xuat-E5-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.agent
  verified_at: 2026-10-23T00:34:19Z
  output: |
    cd agent && npm test
    ℹ duration_ms 518.048458

- eval: E7
  run_id: minted-enrich-qua-de-xuat-E7-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.agent
  verified_at: 2026-10-23T00:34:19Z
  output: |
    cd agent && npm test
    ℹ duration_ms 518.048458

- eval: E8
  run_id: minted-enrich-qua-de-xuat-E8-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.agent
  verified_at: 2026-10-23T00:34:19Z
  output: |
    cd agent && npm test
    ℹ duration_ms 518.048458

- eval: E9
  run_id: minted-enrich-qua-de-xuat-E9-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.agent
  verified_at: 2026-10-23T00:34:19Z
  output: |
    cd agent && npm test
    ℹ duration_ms 518.048458

- eval: E10
  run_id: minted-enrich-qua-de-xuat-E10-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T00:34:19Z
  output: |
    cd app && npm test
    ℹ duration_ms 569.732458

- eval: E11
  run_id: minted-enrich-qua-de-xuat-E11-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.agent
  verified_at: 2026-10-23T00:34:19Z
  output: |
    cd agent && npm test
    ℹ duration_ms 518.048458

- eval: E12
  run_id: minted-enrich-qua-de-xuat-E12-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T00:34:19Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 45.231

- eval: E14
  run_id: minted-enrich-qua-de-xuat-E14-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.agent
  verified_at: 2026-10-23T00:34:19Z
  output: |
    cd agent && npm test
    ℹ duration_ms 518.048458

- eval: E15
  run_id: minted-enrich-qua-de-xuat-E15-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.agent
  verified_at: 2026-10-23T00:34:19Z
  output: |
    cd agent && npm test
    ℹ duration_ms 518.048458

- eval: E16
  run_id: minted-enrich-qua-de-xuat-E16-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T00:34:19Z
  output: |
    cd app && npm test
    ℹ duration_ms 569.732458

### Judgment

- eval: E6
  judged_by: hội đồng 3 thấu kính (fresh context) — đề xuất, chờ người
  verdict: PASS
  rationale: Với thẻ enrich không xung đột, applyIds giữ null nên route.ts chạy nhánh else gọi decide_enrichment_review với id, status nhận từ body và actor theo tiền tố hitl:. Lệnh nằm giữa BEGIN và COMMIT, cùng một client, sau UPDATE review_queue; auditOpsWrite review:decide chạy sau COMMIT cho mọi item_type.
  votes:
    - domain-correctness: PASS — Với thẻ enrich không có xung đột, `applyIds` giữ null. Nhánh else ở route.ts dòng 118-120 khi đó gọi `SELECT decide_enrichment_review($1,$2,$3)` với `[id, status, actor]`. `status` là giá trị nhận được từ body và `actor` là `hitl:${user?.id ?? "api"}`. Lệnh này nằm sau UPDATE review_queue (dòng 89) và trước `COMMIT` (dòng 122), tức cùng transaction. `auditOpsWrite(..., "review:decide", ...)` ở dòng 124 chạy sau commit cho mọi item_type, giống nhánh entity_match. Tiền tố `hitl:` theo đúng quy ước của nhánh entity_match ở dòng 105.
    - operational-feasibility: PASS — Với thẻ enrich không xung đột thì applyIds vẫn là null, nên route chạy nhánh else ở dòng 119: `SELECT decide_enrichment_review($1, $2, $3)` với [id, status, actor]. Giá trị status là đúng cái nhận từ body, còn actor là `hitl:${user?.id ?? "api"}`. Lệnh này nằm giữa BEGIN (dòng 52) và COMMIT (dòng 122), sau UPDATE review_queue (dòng 89) và cùng client. Sau COMMIT, auditOpsWrite(..., "review:decide", ...) (dòng 124) chạy không điều kiện cho mọi item_type, gồm cả enrich, như nhánh entity_match.
    - spec-alignment: PASS — Với thẻ enrich không xung đột, hasConflict=false nên applyIds=null. Route chạy UPDATE review_queue (dòng 89) rồi `SELECT decide_enrichment_review($1,$2,$3)` với [id, status, actor] (dòng 119), actor=`hitl:${user?.id ?? "api"}`. Cả hai nằm giữa BEGIN (dòng 52) và COMMIT (dòng 122), trên cùng một `client`. Sau COMMIT, `auditOpsWrite(..., "review:decide", ...)` (dòng 124) chạy cho mọi nhánh, cùng cách với nhánh entity_match, và không có `choices` vì applyIds=null.
  human_override:  # chi nguoi ghi

- eval: E13
  judged_by: hội đồng 3 thấu kính (fresh context) — đề xuất, chờ người
  verdict: PASS
  rationale: Tài liệu enrichment-agent-design.md không còn mô tả đường ghi cũ như đường đang chạy; UPDATE thẳng và confidence nhỏ hơn ngưỡng chỉ còn ở dạng ghi chú lịch sử đã gỡ ngày 22/10. Luồng mới (enrichment_proposals, luật xác định, thẻ /ops/review agent_output; LLM trái E1 thì lên thẻ) khớp spec. Cả ba thấu kính nêu một điểm lệch nhỏ là tài liệu không nói riêng route E1 direct.
  votes:
    - domain-correctness: PASS — enrichment-agent-design.md không còn mô tả đường ghi cũ. Header, §3 và bảng E3 đều ghi đường mới: đề xuất vào enrichment_proposals, luật xác định áp qua apply_enrichment(), phần còn lại thành thẻ /ops/review agent_output. Doc nói rõ confidence LLM không bao giờ là căn cứ, và `UPDATE sale_offers` thẳng cùng `confidence < threshold → review_queue` chỉ còn xuất hiện như ghi chú lịch sử «đã gỡ 22/10». Nhánh LLM trái E1 (cả hai lên thẻ, người chọn, field bị giữ qua các lượt) khớp spec §3.2/§3.6. Một điểm nhỏ: doc không nêu riêng route E1 `direct` (E1 một mình, LLM vắng) mà spec có, nhưng điều đó không mâu thuẫn với spec.
    - operational-feasibility: PASS — Tài liệu research không còn mô tả đường ghi cũ như đường đang chạy. Header, §3 và E3 ở §5 ghi đường mới (đề xuất vào enrichment_proposals, rồi luật xác định, rồi /ops/review), và §3 nói rõ UPDATE thẳng cùng ngưỡng confidence đã gỡ ngày 22/10. Phần luật khớp design doc: căn cứ chỉ có E1 cùng giá trị hoặc block_raw khớp node building, LLM trái E1 thì không áp bên nào mà đẩy lên thẻ, confidence của LLM không bao giờ là căn cứ, thẻ có item_type='agent_output' và item_id='enrich:<offer_id>', và áp qua apply_enrichment / decide_enrichment_review.
    - spec-alignment: PASS — Tài liệu thiết kế enrichment không còn mô tả đường ghi cũ như đường đang chạy. Các chỗ còn nhắc `UPDATE sale_offers` thẳng và `confidence < threshold → review_queue` (dòng 3–7, 118–120) đều ghi rõ là đã gỡ ngày 22/10, và dòng 117 khẳng định confidence của LLM không bao giờ là căn cứ. Phần Pipeline tích hợp và hàng E3 khớp với spec của vòng ở ba điểm: đề xuất vào `enrichment_proposals`, luật xác định chỉ có hai căn cứ (E1 cùng giá trị, `block_raw` khớp building trong `asset_nodes`), còn lại thành một thẻ `/ops/review` `agent_output` có `enrich:<offer_id>`, và LLM trái E1 thì không áp bên nào. Điểm lệch nhỏ: tài liệu không nói riêng rằng E1 một mình thì `direct` áp thẳng như spec §3.2. Điều này không phải dấu vết của đường ghi cũ nên không đổi verdict.
  human_override:  # chi nguoi ghi

- eval: E17
  judged_by: hội đồng 3 thấu kính (fresh context) — đề xuất, chờ người
  verdict: PASS
  rationale: Khi approved và thẻ có field trùng, route.ts kiểm planEnrichApproval trước câu UPDATE review_queue đầu tiên (sai thì ROLLBACK và trả 400), rồi trong cùng transaction gọi apply_enrichment(applyIds) và decide_enrichment_review(id, 'rejected') trước COMMIT. Route không có UPDATE sale_offers hay enrichment_proposals viết tay; audit review:decide kèm choices; nhánh entity_match không gọi hàm enrich nào.
  votes:
    - domain-correctness: PASS — Khi approved, route đọc đề xuất queued của thẻ. Nếu có field trùng, planEnrichApproval kiểm choices, và khi sai thì ROLLBACK rồi trả 400 trước câu UPDATE review_queue. Sau đó route gọi apply_enrichment(applyIds) rồi decide_enrichment_review(id,'rejected') trước COMMIT, không có UPDATE sale_offers hay enrichment_proposals viết tay. Audit 'review:decide' kèm choices khi thẻ xung đột. Thẻ không xung đột gọi decide_enrichment_review với đúng status nhận được. Nhánh entity_match chỉ UPDATE property_candidates và không gọi hàm enrich nào, vì isEnrich yêu cầu item_type='agent_output'.
    - operational-feasibility: PASS — Trong route.ts, khi approved và thẻ có field trùng, route chạy planEnrichApproval trước câu UPDATE review_queue đầu tiên. Nếu plan sai thì ROLLBACK rồi trả 400 (dòng 72-86). Sau đó trong cùng transaction BEGIN..COMMIT, route gọi apply_enrichment(applyIds) rồi decide_enrichment_review(id,'rejected'). Route không có UPDATE sale_offers hay enrichment_proposals; chỉ có SELECT đọc queued, UPDATE review_queue và UPDATE property_candidates (dòng 112-121). auditOpsWrite 'review:decide' kèm choices khi applyIds có giá trị (dòng 124-128). Thẻ không xung đột gọi decide_enrichment_review với đúng status nhận được (dòng 119). Nhánh entity_match chỉ chạy các UPDATE review_queue và property_candidates, nên không gọi hàm enrich nào vì isEnrich chỉ đúng khi item_type là agent_output.
    - spec-alignment: PASS — Trong route.ts (dòng 72-86), nhánh enrich approved đọc các đề xuất queued của thẻ, gọi planEnrichApproval khi có field trùng, và nếu plan.ok=false thì ROLLBACK rồi trả 400, tất cả trước câu UPDATE review_queue ở dòng 89. Khi có xung đột, route gọi apply_enrichment(applyIds) rồi decide_enrichment_review(id,'rejected') trước COMMIT cùng transaction (dòng 114-122), không có UPDATE sale_offers hay enrichment_proposals viết tay, và auditOpsWrite 'review:decide' kèm choices (dòng 124-128). Khi không xung đột, route gọi decide_enrichment_review với đúng status nhận được (dòng 119). Nhánh entity_match chỉ UPDATE property_candidates, và isEnrich đòi item_type='agent_output' nên không gọi hàm enrich nào.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-enrich-qua-de-xuat-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-10-23T00:34:19Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-enrich-qua-de-xuat-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-23T00:34:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval KHÔNG-PHÂN-BIỆT (xanh trên CẢ code hiện tại lẫn baseline diffBase — chứng minh harness chứ chưa chứng minh feature; nên viết lại để assert hành vi mới hoặc xác nhận đây là regression-guard có chủ ý):

- `cd agent && npm test`: E1, E2, E3, E4, E5, E7, E8, E9, E11, E14, E15
- `cd pipeline && npm test`: E12

Eval có phân biệt (đỏ trên baseline): E10, E16 (`cd app && npm test`).

Lệnh suite xanh-cả-hai-phía là regression-guard bình thường, không liệt kê.

## Variance

none — mọi eval chạy một lần (deterministic), không eval nào có pass_rate hỗn hợp.

## Iterations

Round 1: không eval nào hỏng ở lớp lệnh máy; verdict REJECT vì 1 finding mức high nằm TRONG hợp đồng (AC-3: block_raw chỉ chuẩn hoá phía LLM, E1 trả mã thô). Returned to implementation.
Round 2: sửa S4-r1 (commit 9f36941, chuẩn hoá mã toà E1 về tên node); mọi lệnh máy xanh (E1-E5, E7-E11 chạy lại; E12 carry-forward từ round 1); E6 và E13 chờ người chốt ở Cổng 2.
Round 3: thêm xử lý E1 trái LLM lên thẻ đối chiếu (AC-7, AC-11) cùng eval E14–E17; mọi lệnh máy xanh, E12 chạy lại; E6, E13, E17 chờ người chốt ở Cổng 2. Danh sách finding xem review-findings.md.
