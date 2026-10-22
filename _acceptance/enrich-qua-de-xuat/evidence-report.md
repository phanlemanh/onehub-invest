---
schema_version: 2
feature_slug: enrich-qua-de-xuat
verdict: PENDING-JUDGMENT
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9f36941060b970dedaa546d21c6b10d18a67ff8e
human_signoff:
---

# Evidence Report: enrich-qua-de-xuat

Round 2. Mọi lệnh máy đều xanh. Verdict PENDING-JUDGMENT vì hai mục judgment (E6, E13) đang chờ người chốt ở Cổng 2; `human_override` để trống. E12 mang từ round 1 (delta không chạm paths của eval).

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
| E12 | AC-10 | test | PASS (carry-forward từ round 1) |
| E13 | AC-4 | judgment | PASS (đề xuất của hội đồng, chưa có human_override) |

## Evidence

- eval: E1
  run_id: minted-enrich-qua-de-xuat-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-22T13:42:59Z
  output: |
    cd agent && npm test
    ℹ duration_ms 391.382708

- eval: E2
  run_id: minted-enrich-qua-de-xuat-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-22T13:42:59Z
  output: |
    cd agent && npm test
    ℹ duration_ms 391.382708

- eval: E3
  run_id: minted-enrich-qua-de-xuat-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-22T13:42:59Z
  output: |
    cd agent && npm test
    ℹ duration_ms 391.382708

- eval: E4
  run_id: minted-enrich-qua-de-xuat-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-22T13:42:59Z
  output: |
    cd agent && npm test
    ℹ duration_ms 391.382708

- eval: E5
  run_id: minted-enrich-qua-de-xuat-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-22T13:42:59Z
  output: |
    cd agent && npm test
    ℹ duration_ms 391.382708

- eval: E7
  run_id: minted-enrich-qua-de-xuat-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-22T13:42:59Z
  output: |
    cd agent && npm test
    ℹ duration_ms 391.382708

- eval: E8
  run_id: minted-enrich-qua-de-xuat-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-22T13:42:59Z
  output: |
    cd agent && npm test
    ℹ duration_ms 391.382708

- eval: E9
  run_id: minted-enrich-qua-de-xuat-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-22T13:42:59Z
  output: |
    cd agent && npm test
    ℹ duration_ms 391.382708

- eval: E10
  run_id: minted-enrich-qua-de-xuat-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-22T13:42:59Z
  output: |
    cd app && npm test
    ℹ duration_ms 776.043916

- eval: E11
  run_id: minted-enrich-qua-de-xuat-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-22T13:42:59Z
  output: |
    cd agent && npm test
    ℹ duration_ms 391.382708

- eval: E12
  run_id: minted-enrich-qua-de-xuat-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-22T13:33:40Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Judgment

- eval: E6
  judged_by: hội đồng 3 thấu kính (fresh context) — đề xuất, chờ người
  verdict: PASS
  rationale: Trong route.ts, nhánh agent_output với item_id bắt đầu bằng "enrich:" gọi decide_enrichment_review với id, status đã kiểm và người quyết theo tiền tố hitl:, nằm giữa BEGIN và COMMIT cùng một client, sau UPDATE review_queue; auditOpsWrite review:decide chạy cho mọi nhánh.
  votes:
    - domain-correctness: PASS — Trong route.ts, nhánh agent_output với item_id bắt đầu bằng "enrich:" (dòng 85-89) gọi `SELECT decide_enrichment_review($1,$2,$3)` với id review, status đã được kiểm tra và người quyết `hitl:${user?.id ?? "api"}`. Lời gọi nằm giữa BEGIN (dòng 44) và COMMIT (dòng 90), sau UPDATE review_queue, cùng một client. auditOpsWrite "review:decide" (dòng 92) chạy không điều kiện cho mọi nhánh, nên nhánh enrich vẫn được ghi audit như entity_match.
    - operational-feasibility: PASS — Trong route.ts, BEGIN nằm ở dòng 44 và UPDATE review_queue ở dòng 61. Nhánh `item_type === "agent_output" && item_id.startsWith("enrich:")` (dòng 85) gọi `SELECT decide_enrichment_review($1,$2,$3)` với (id, status, `hitl:${user?.id ?? "api"}`) ở dòng 86, rồi mới COMMIT ở dòng 90, nên cả hai nằm trong cùng transaction. `auditOpsWrite(..., "review:decide", {...})` ở dòng 92 chạy sau COMMIT cho mọi item_type, nên nhánh enrich cũng được ghi audit y như nhánh entity_match. Tôi không kiểm chứng được thứ tự tham số của hàm SQL vì migration 033 nằm ngoài input. Trong route, status đúng là giá trị đã validate và người quyết dùng cùng tiền tố `hitl:` như nhánh entity_match.
    - spec-alignment: PASS — Trong route.ts, nhánh `item_type === "agent_output" && item_id.startsWith("enrich:")` (dòng 85-89) gọi `SELECT decide_enrichment_review($1,$2,$3)` với `[id, status, "hitl:<user.id|api>"]`. Status được truyền nguyên từ body và người quyết theo cùng quy ước `hitl:` của nhánh entity_match. Lệnh gọi nằm sau `BEGIN` (dòng 44) và `UPDATE review_queue` (dòng 61), trước `COMMIT` (dòng 90), nên cùng transaction. `auditOpsWrite(..., "review:decide", ...)` ở dòng 92 chạy sau COMMIT cho mọi item_type, nên nhánh enrich vẫn được ghi audit như entity_match.
  human_override:  # chi nguoi ghi

- eval: E13
  judged_by: hội đồng 3 thấu kính (fresh context) — đề xuất, chờ người
  verdict: PASS
  rationale: docs/research/enrichment-agent-design.md không còn mô tả đường ghi cũ như đường hiện hành; UPDATE thẳng và confidence nhỏ hơn ngưỡng thì vào review_queue chỉ còn ở dạng "đã gỡ ngày 22/10". Luồng mới khớp spec 3.2-3.4.
  votes:
    - domain-correctness: PASS — docs/research/enrichment-agent-design.md không còn mô tả đường ghi cũ như đường hiện hành. Câu "UPDATE sale_offers thẳng" và "confidence < threshold → INSERT review_queue" chỉ còn xuất hiện ở dạng "đã gỡ ngày 22/10" (dòng 112-115). Header, §3 (Output → enrichment_proposals), sơ đồ pipeline và dòng E3 mô tả đúng đường mới trong spec: đề xuất, rồi luật xác định (E1 cùng giá trị hoặc khớp building asset_nodes, ghi qua apply_enrichment), rồi thẻ /ops/review agent_output qua decide_enrichment_review. Doc cũng nêu rõ confidence LLM không bao giờ là căn cứ, khớp spec §3.2.
    - operational-feasibility: PASS — Tài liệu research không còn mô tả đường ghi cũ như đang chạy. Dòng 6-7, §3 (dòng 85, 98-115) và hàng E3 chỉ nhắc `UPDATE sale_offers` thẳng và `confidence < threshold → review_queue` như đường đã gỡ ngày 22/10, và nói rõ "Confidence của LLM không bao giờ là căn cứ". Luồng mô tả khớp spec §3.2-3.4: `enrichment_proposals` → luật xác định (E1 cùng giá trị, hoặc block_raw khớp node building của asset_nodes) → `apply_enrichment()`; LLM trái E1 thì `superseded`; phần còn lại thành một thẻ `/ops/review` `agent_output` với `item_id='enrich:<offer_id>'`, rồi `decide_enrichment_review()`. Còn một điểm lệch nhỏ, không đủ để FAIL: E5 và §4 vẫn viết LLM "lưu alias vào asset_nodes" tự động, trong khi spec xếp E5 vào phần Later là "học alias từ duyệt". E5 đang ở trạng thái ⬜ và là ghi vào asset_nodes, không phải `sale_offers`, nên nằm ngoài câu hỏi.
    - spec-alignment: PASS — enrichment-agent-design.md không còn mô tả đường ghi cũ như đường hiện hành. Header, §3, pipeline và E3 đều mô tả đường mới: đề xuất vào enrichment_proposals, luật xác định (E1 cùng giá trị, khớp building của asset_nodes) áp qua apply_enrichment(), phần còn lại thành thẻ /ops/review agent_output. Lần nhắc đến UPDATE thẳng và confidence<threshold→review_queue chỉ nằm trong câu ghi rõ là đường cũ đã gỡ ngày 22/10. Văn bản khớp với design doc §3.2–3.4, kể cả điểm confidence của LLM không bao giờ là căn cứ.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-enrich-qua-de-xuat-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-22T13:42:59Z

- cmd: cd pipeline && npm test
  run_id: minted-enrich-qua-de-xuat-SUITE-npm_test-r2
  exit_code: 0
  verified_at: 2026-10-22T13:42:59Z

## Known limits

## Ngoài hợp đồng

## Analyst

Carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Field baseline cua tung block eval ghi n-a.

Eval KHONG-PHAN-BIET (green tren CA code hien tai lan baseline, ket qua carried tu round 1 — chung minh harness chu chua chung minh feature; nen viet lai de assert hanh vi moi hoac xac nhan day la regression-guard co chu y):

- `cd agent && npm test`: E1, E2, E3, E4, E5, E7, E8, E9, E11
- `cd pipeline && npm test`: E12

Lenh suite xanh-ca-hai-phia la regression-guard binh thuong, khong liet ke.

## Variance

none — mọi eval chạy một lần (deterministic), không eval nào có pass_rate hỗn hợp.

## Iterations

Round 1: không eval nào hỏng ở lớp lệnh máy; verdict REJECT vì 1 finding mức high nằm TRONG hợp đồng (AC-3: block_raw chỉ chuẩn hoá phía LLM, E1 trả mã thô). Returned to implementation.
Round 2: sửa S4-r1 (commit 9f36941, chuẩn hoá mã toà E1 về tên node); mọi lệnh máy xanh (E1-E5, E7-E11 chạy lại; E12 carry-forward từ round 1); E6 và E13 chờ người chốt ở Cổng 2.
