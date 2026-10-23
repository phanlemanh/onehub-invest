---
schema_version: 2
feature_slug: cloud-sync-atomic
verdict: BLOCKED
failed_evals: [E1, E2]
reason: "E3 không có kết quả: lệnh `cd pipeline && node scripts/check-cloud-sync.mjs fidelity` — agent bị skip/chết, không có kết quả, không được tính là pass"
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 77e2502d2a154aaf10fac472fbef3a307447947f
human_signoff:
---

# Evidence Report: cloud-sync-atomic

Round 1. E1 và E2 đỏ thật; E3 không chạy ra kết quả (agent chết) nên báo cáo ở trạng thái BLOCKED, không phải PASS. Một lệnh suite (`cd app && npx tsc --noEmit && npm run lint`) cũng đỏ, không gắn eval nào (xem mục Lệnh suite).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | FAIL |
| E2 | AC-2 | script | FAIL |
| E3 | AC-3 | script | BLOCKED |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E11 | AC-11 | script | PASS |
| E8a | AC-8 | test | PASS |
| E8b | AC-8 | script | PASS |
| E9 | AC-9 | judgment | UNCERTAIN |
| E10 | AC-10 | judgment | PASS |

## Evidence

- eval: E1
  run_id: minted-cloud-sync-atomic-E1-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.cloud_sync_atomic
  verified_at: 2026-10-23T03:00:18Z
  output: |
    PASS fixture: số dòng cũ ≠ mới ở 23 bảng/view (mọi bảng ≥2 dòng + 2 view)
      bảng đọc (pha × trạng thái): {"tráo-mở×old":97,"ngoài×old":18,"tráo-mở×new":2}
    PASS luồng đọc 117 lần
    FAIL đọc trong lúc tráo mở: cũ 97, mới 2 (cần ≥5 cũ, 0 mới)
    PASS 0 lần thấy 0, 0 lần lẫn cũ/mới
    FAIL luồng đọc không bao giờ thấy bản mới
    PASS ĐỎ-ĐÚNG truncate: bộ nạp kiểu cũ — luồng đọc thấy 0/lẫn 134 lần
    PASS ĐỎ-ĐÚNG non-atomic: tráo từng câu tự COMMIT — luồng đọc thấy 0/lẫn 70 lần
    check-cloud-sync atomic: CÓ LỖI

- eval: E2
  run_id: minted-cloud-sync-atomic-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.cloud_sync_fail
  verified_at: 2026-10-23T03:00:18Z
  output: |
    FAIL (a) gãy-staging: [stage] mạng đứt (cấy); staging 13
    PASS (b) gãy-tráo: md5 không đổi, 0 dòng staging, [swap] null value in column "must_have" of relation "listings" violates not-null constraint
    PASS (c) chưa có sync_stage: dừng pha catalog, md5 không đổi, 1 câu gửi đi không câu nào là DDL
    PASS (d) kill -9: 14 dòng staging bỏ dở bị lượt sau dọn (quá 2 giờ); staging 10 phút của lượt khác còn nguyên
    PASS đối chứng: lượt lành sau cùng đổi md5 (thước không hằng-đúng)
    check-cloud-sync fail: CÓ LỖI

- eval: E3
  status: BLOCKED
  reason: lệnh `cd pipeline && node scripts/check-cloud-sync.mjs fidelity` — agent bị skip/chết, không có kết quả, không được tính là pass
  verifier: config:executors.script.cloud_sync_fidelity
  baseline: n-a

- eval: E4
  run_id: minted-cloud-sync-atomic-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_keep
  verified_at: 2026-10-23T03:00:18Z
  output: |
    check-cloud-sync keep: OK

- eval: E5
  run_id: minted-cloud-sync-atomic-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_pii
  verified_at: 2026-10-23T03:00:18Z
  output: |
    check-cloud-sync pii: OK

- eval: E6
  run_id: minted-cloud-sync-atomic-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_stage
  verified_at: 2026-10-23T03:00:18Z
  output: |
    check-cloud-sync stage: OK

- eval: E7
  run_id: minted-cloud-sync-atomic-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_overlap
  verified_at: 2026-10-23T03:00:18Z
  output: |
    check-cloud-sync overlap: OK

- eval: E11
  run_id: minted-cloud-sync-atomic-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_allow
  verified_at: 2026-10-23T03:00:18Z
  output: |
    check-cloud-sync allow: OK

- eval: E8a
  run_id: minted-cloud-sync-atomic-E8a-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T03:00:18Z

- eval: E8b
  run_id: minted-cloud-sync-atomic-E8b-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.sync_pii_mutation
  verified_at: 2026-10-23T03:00:18Z
  output: |
    MUTATION PASS

### Judgment

Đề xuất panel (máy chỉ đề xuất; người quyết ở Cổng 2). Ba lens cho mỗi eval.

- eval: E9
  judged_by: judge panel đề xuất — domain-correctness, operational-feasibility, spec-alignment (fresh context)
  verdict: UNCERTAIN
  votes:
    - domain-correctness: UNCERTAIN — Chú thích đầu sync-cloud.mjs (dòng 19-30) nói đúng luật 2026-10-23 và khớp code: định danh người bán là tầng C, tên nguồn thật là tầng A, chỉ CLOUD_ALLOW được gửi, seller_ref thành «S0x:<số>», có soát tên nguồn từ source_registry trước khi gửi, PII_EXCLUDE giữ vì phạm vi chứ không vì luật. docs/ops/cloud-sync-atomic.md không có câu nào sai nhưng không nêu luật tầng C/A, không nêu lý do giữ PII_EXCLUDE, không nhắc danh sách cột cho phép; chỉ có hai câu đúng về seller_ref S0x và việc soát tên nguồn (dòng 22-23). AC-9 viết «hai chỗ nói đúng luật đó» nên có hai cách đọc (đòi tài liệu nêu luật, hoặc chỉ đòi không mâu thuẫn); hai cách đọc cho hai kết quả nên judge không đoán PASS.
    - operational-feasibility: UNCERTAIN — Cùng kết luận: header sync-cloud.mjs (dòng 19-30, 72-74) đúng luật và khớp code (CLOUD_ALLOW, SELLER_REF_EXPR = `source || ':' || số cuối`, không có số thì NULL; scanSourceNames cho ba bảng). Không câu nào gọi SĐT/tên người bán là tầng A. Runbook không sai nhưng không nói tầng C, danh sách cột cho phép hay lý do giữ PII_EXCLUDE. Điều kiện «hai chỗ» có hai cách đọc; judge không tự chọn.
    - spec-alignment: PASS — Chú thích đầu sync-cloud.mjs (dòng 19-31) nói đúng luật AC-9; các hành vi mô tả khớp code (CLOUD_ALLOW trong selectList, SELLER_REF_EXPR cho ra `source:số` hoặc NULL, scanSourceNames với token từ source_registry, leak gate kiểm SELLER_REF_RE). Runbook chỉ nhắc `seller_ref` dạng `S0x:<số>` và việc soát tên nguồn, đều đúng với code, và không câu nào trong hai file còn gọi SĐT hay tên người bán là tầng A. Chỗ yếu duy nhất: tài liệu vận hành không nhắc lại luật hay PII_EXCLUDE — thiếu chứ không sai.
  rationale: hai lens không chốt được vì AC-9 «hai chỗ nói đúng luật đó» có hai cách đọc; một lens chấm PASS. Không câu nào trong hai file mô tả lệch code.
  required_evidence:
    - Mạnh xác nhận ở Cổng 2 (decisions.jsonl hoặc contract.md) rằng «hai chỗ» được hiểu là gộp — header giữ phần luật, docs/ops/cloud-sync-atomic.md chỉ cần không mâu thuẫn. Khi đó E9 thành PASS.
    - Hoặc docs/ops/cloud-sync-atomic.md có thêm một đoạn nêu ba ý: định danh người bán là tầng C; tầng A chỉ còn tên nguồn thật (kể cả trong giá trị cột) cùng hồ sơ người dùng/user_events/review_queue; PII_EXCLUDE giữ vì phạm vi sản phẩm chứ không vì luật; cột chỉ gửi theo CLOUD_ALLOW. Chạy lại judge E9 trên file đã sửa.
    - Xác nhận khoản «bảng tầng A (source_registry, stg_*, airbnb_snapshots, raw)» ở dòng 23 của sync-cloud.mjs nói về bảng chứa tên nguồn thô: các bảng stg_* còn chứa SĐT/tên người bán là tầng C, nên đọc dòng 23 như phân loại SĐT/tên thì dòng đó lệch luật.
  human_override:  # chi nguoi ghi

- eval: E10
  judged_by: judge panel đề xuất — domain-correctness, operational-feasibility, spec-alignment (fresh context)
  verdict: PASS
  votes:
    - domain-correctness: PASS — Hướng dẫn nêu đủ vì sao (bảng lỗi, cửa sổ trống, xoá saved_markets, lệch ngày), thứ tự bắt buộc (Mạnh áp 038 trước khi merge, kiểm rồi mới merge), lệnh áp (dán 038 vào SQL Editor), lệnh kiểm (kết quả mong đợi t|f|f), lượt thử với cloud-sync-watch (đọc MIN0, SAVED_MARKETS_DOI), cách lùi bằng git revert, và nói rõ không bước nào giao agent đổi schema production. sync-cloud.mjs kiểm to_regclass('sync_stage.rows'/'swaps') ở pha catalog trước mọi câu ghi và ném «cloud chưa có sync_stage»; script chỉ gửi DML và SELECT, không gửi DDL; 038 idempotent, chỉ tạo schema sync_stage (2 bảng) và REVOKE từ PUBLIC, anon, authenticated.
    - operational-feasibility: PASS — Tài liệu nêu đủ sáu ý của AC-10 (lý do, thứ tự bắt buộc, lệnh áp kèm lệnh kiểm `t | f | f`, lượt thử đo bằng cloud-sync-watch kèm cách đọc, lùi bằng `git revert`, hành vi khi cloud chưa có `sync_stage`). SQL và code khớp lời hướng dẫn; syncOnce kiểm to_regclass đầu tiên trong pha catalog trước mọi DELETE hay INSERT. Không bước nào giao agent đổi schema production: code không gửi DDL, Mạnh là người áp, lượt thử chỉ ghi dữ liệu như launchd vẫn làm.
    - spec-alignment: PASS — Hướng dẫn nêu đủ lý do, thứ tự, lệnh áp và lệnh kiểm `t|f|f`, lượt thử với cloud-sync-watch kèm cách đọc (có `saved_markets`), cách lùi, và câu cuối khẳng định không bước nào giao agent tự đổi schema production. `sync-cloud.mjs` kiểm `to_regclass` làm câu đầu tiên và ném PhaseError("catalog") trước mọi câu ghi hay xoá, thông điệp khớp văn bản; migration 038 idempotent nên phép kiểm USAGE cho ra `t|f|f`.
  rationale: ba lens cùng PASS; hướng dẫn nêu đủ các ý của AC-10 và khớp code, SQL.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-cloud-sync-atomic-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-23T03:00:18Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-cloud-sync-atomic-SUITE-lint-r1
  exit_code: 2
  verified_at: 2026-10-23T03:00:18Z
  note: lệnh đỏ, không gắn eval nào. Đuôi đầu ra toàn là lỗi TS2307 «Cannot find module» ('motion/react', 'shiki', 'shiki/langs/*', 'shiki/themes/*', 'shiki/core', 'shiki/engine/javascript', '@headless-tree/core') trong src/components/blocks/... và src/components/reui/...; không thấy lỗi nào trỏ vào file thuộc feature này. Có vẻ là phụ thuộc app/ chưa cài trong worktree, nhưng đuôi đầu ra không đủ để khẳng định nguyên nhân; cần người xem hoặc chạy lại sau khi cài phụ thuộc.

- cmd: cd app && npm test
  run_id: minted-cloud-sync-atomic-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-23T03:00:18Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-cloud-sync-atomic-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-23T03:00:18Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-cloud-sync-atomic-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-23T03:00:18Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline — chứng minh harness chứ không phải feature; nên viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý):

- E8a (`cd pipeline && npm test`): baseline green.
- E8b (`cd pipeline && node scripts/sync-pii-mutation.mjs`): baseline green.

Baseline khong do:

- cd pipeline && node scripts/check-cloud-sync.mjs atomic: bo qua baseline: tep pipeline/scripts/check-cloud-sync.mjs co o cay dang kiem nhung chua co o merge-base e2305776c886e2a23326c8b33accc50e9802f9a1 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node scripts/check-cloud-sync.mjs fail: bo qua baseline: tep pipeline/scripts/check-cloud-sync.mjs co o cay dang kiem nhung chua co o merge-base e2305776c886e2a23326c8b33accc50e9802f9a1 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node scripts/check-cloud-sync.mjs fidelity: bo qua baseline: tep pipeline/scripts/check-cloud-sync.mjs co o cay dang kiem nhung chua co o merge-base e2305776c886e2a23326c8b33accc50e9802f9a1 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node scripts/check-cloud-sync.mjs keep: bo qua baseline: tep pipeline/scripts/check-cloud-sync.mjs co o cay dang kiem nhung chua co o merge-base e2305776c886e2a23326c8b33accc50e9802f9a1 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node scripts/check-cloud-sync.mjs pii: bo qua baseline: tep pipeline/scripts/check-cloud-sync.mjs co o cay dang kiem nhung chua co o merge-base e2305776c886e2a23326c8b33accc50e9802f9a1 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node scripts/check-cloud-sync.mjs stage: bo qua baseline: tep pipeline/scripts/check-cloud-sync.mjs co o cay dang kiem nhung chua co o merge-base e2305776c886e2a23326c8b33accc50e9802f9a1 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node scripts/check-cloud-sync.mjs overlap: bo qua baseline: tep pipeline/scripts/check-cloud-sync.mjs co o cay dang kiem nhung chua co o merge-base e2305776c886e2a23326c8b33accc50e9802f9a1 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node scripts/check-cloud-sync.mjs allow: bo qua baseline: tep pipeline/scripts/check-cloud-sync.mjs co o cay dang kiem nhung chua co o merge-base e2305776c886e2a23326c8b33accc50e9802f9a1 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy 1 lần (runs: 1), không có phương sai.

## Iterations

Round 1: E1 đỏ (trong lúc giao dịch tráo mở, luồng đọc thấy bản mới 2 lần, cần 0 lần; thước báo luồng đọc không bao giờ thấy bản cũ-nguyên-vẹn), E2 đỏ ca (a) (sau khi gãy ở pha stage còn 13 dòng staging của run_id, trái yêu cầu tự dọn trước khi thoát; khớp với nghi vấn ở review-findings.md rằng cleanup chạy khi các worker nạp vẫn tiếp tục), E3 BLOCKED (agent chết, không có kết quả); E9 chưa chốt, chờ người. Returned to implementation.
