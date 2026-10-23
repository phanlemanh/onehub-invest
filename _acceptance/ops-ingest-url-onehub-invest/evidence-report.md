---
schema_version: 2
feature_slug: ops-ingest-url-onehub-invest
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6a42eaeca23f97286f21a9af07b085aa8374d570
human_signoff:
---

# Evidence Report: ops-ingest-url-onehub-invest

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: ops-ingest-url-onehub-invest-E1-20261023T085637
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_url_static
  verified_at: 2026-10-23T01:56:37Z
  output: |
    ok   không tệp code/config nào còn trỏ app-lilac-one-49.vercel.app
    ok   push-ops-facts: INGEST_URL mặc định = prod mới, env INGEST_URL vẫn đè được
    ok   audit-all: CLOUD = prod mới
    ok   mcp-tools.json: JSON hợp lệ, cloud_base_url = prod mới
    ok   cú pháp push-ops-facts.mjs + audit-all.sh
    CLOUD-URL STATIC PASS

- eval: E2
  run_id: ops-ingest-url-onehub-invest-E2-20261023T085642
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_url_static
  verified_at: 2026-10-23T01:56:42Z
  output: |
    ok   không tệp code/config nào còn trỏ app-lilac-one-49.vercel.app
    ok   push-ops-facts: INGEST_URL mặc định = prod mới, env INGEST_URL vẫn đè được
    ok   audit-all: CLOUD = prod mới
    ok   mcp-tools.json: JSON hợp lệ, cloud_base_url = prod mới
    ok   cú pháp push-ops-facts.mjs + audit-all.sh
    CLOUD-URL STATIC PASS

- eval: E3
  run_id: ops-ingest-url-onehub-invest-E3-20261023T085647
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_url_static
  verified_at: 2026-10-23T01:56:47Z
  output: |
    ok   không tệp code/config nào còn trỏ app-lilac-one-49.vercel.app
    ok   push-ops-facts: INGEST_URL mặc định = prod mới, env INGEST_URL vẫn đè được
    ok   audit-all: CLOUD = prod mới
    ok   mcp-tools.json: JSON hợp lệ, cloud_base_url = prod mới
    ok   cú pháp push-ops-facts.mjs + audit-all.sh
    CLOUD-URL STATIC PASS

- eval: E4
  run_id: ops-ingest-url-onehub-invest-E4-20261023T085651
  exit_code: 0
  baseline: green
  verifier: config:executors.script.cloud_url_mutation
  verified_at: 2026-10-23T01:56:51Z
  output: |
    ok   URL cũ bị bắt ở cả 3 tệp (3/3 đỏ)
    CLOUD-URL MUTATION PASS

- eval: E5
  run_id: ops-ingest-url-onehub-invest-E5-20261023T085656
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_url_live
  verified_at: 2026-10-23T01:56:56Z
  output: |
    ok   không token → 401 (should-NOT-fire: không ai ngoài máy thu ghi được)
    ok   token cloud + payload rỗng → 400 (token khớp prod mới, không ghi)
    CLOUD-URL LIVE PASS

- eval: E6
  run_id: ops-ingest-url-onehub-invest-E6-20261023T085733
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T01:57:33Z
  output: |
    ✔ không bảng nào trong FILL có cột ảnh media/media_files (schema DB local) (25.472458ms)
    ✔ mediaFilesOf: gắn snapshotId vào từng phần tử, giữ nguyên field hợp đồng (0.183666ms)
    ✔ mediaFilesOf: v1 / không ảnh / mảng rỗng → null (SQL NULL, COALESCE giữ bản cũ) (0.09125ms)
    ℹ tests 26
    ℹ pass 26
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0

## Known limits

- E6 chạy hai lần trong vòng 1. Lần đầu (run_id `ops-ingest-url-onehub-invest-E6-20261023T085705`, có trong run-log) đỏ vì môi trường: worktree không có `pipeline/node_modules`, Node báo `ERR_MODULE_NOT_FOUND` gói `pg` ở `parse.test.mjs` và `sync-pii.test.mjs` (5 test, 2 tệp không nạp được). Đây không phải lỗi sản phẩm. Lần hai mượn `node_modules` của checkout chính bằng symlink tạm (`package.json` và `package-lock.json` của pipeline giống hệt từng byte giữa hai cây), xanh 26/26, chạy xong thì gỡ symlink ngay. Hồ sơ chỉ dẫn lần hai làm bằng chứng.
- E5 chỉ so mã HTTP (401 / 400), không đọc thân phản hồi. Chuỗi «payload thiếu pushedAt» trong AC-5 được đối chiếu bằng cách đọc mã nguồn `app/src/app/api/v1/ops/ingest/route.ts` dòng 17–29 (bearer khớp thì bỏ qua session; payload thiếu `pushedAt` thì trả 400 trước `INSERT INTO ops_heartbeat` ở dòng 30), không phải bằng output của prod. Vì token sai thì route trả 401, nên mã 400 vẫn chứng được token khớp và không ghi gì.
- E1, E2, E3 cùng một lệnh (`static`) nên cùng một output; mỗi eval chỉ dựa vào dòng `ok` của tiêu chí mình, ba lần chạy độc lập cho kết quả như nhau.
- AC-2 nửa «env `INGEST_URL` vẫn đè được» được đo tĩnh: grep đúng biểu thức `process.env.INGEST_URL ?? "<prod mới>"` trong mã, không chạy `push-ops-facts.mjs` với env đặt sẵn (contract cấm chạy thật lên prod trong vòng này).

## Ngoài hợp đồng

- Hạng rủi ro có thể khai thấp: frontmatter contract ghi `risk_tier: T2` kèm chú thích «không chạm t3_paths», nhưng `_acceptance/config.yaml` liệt kê `pipeline/push-ops-facts.mjs` trong `risk_tiers.t3_paths`, và diff `main...HEAD` có sửa tệp này (một dòng đổi URL mặc định). Người ký Gate 2 cần quyết: giữ T2 vì thay đổi chỉ là một chuỗi hằng, hay nâng lên T3 (pre-merge có thể xếp theo t3_paths). Người chấm không sửa contract ở điểm này.

## Analyst

Non-discriminating evals: E4 và E6. E4 (mutation) xanh cả trên main: cây main vốn đã trỏ URL cũ, nên bản sao «quay về URL cũ» đỏ 3/3 trên cả hai cây. Đây là eval cố ý giữ thước đo (should-NOT-fire), chứng thước đo không xanh giả, không chứng tính năng. E6 là lệnh suite hồi quy, xanh trên main (26/26). Sức phân biệt của tính năng nằm ở E1–E3: trên main, lệnh `static` đỏ cả 3 tệp và còn 3 tệp trỏ tên cũ; trên nhánh, cả ba xanh.

Baseline khong do:
- E5: endpoint prod `onehub-invest.vercel.app` không phụ thuộc cây mã đang kiểm (prod chạy bản đã deploy, không phải diffBase), nên chạy trên diffBase không chứng thêm gì.
- Cách đo E1–E4, E6: `git archive main` (b5aef31) ra thư mục nháp ngoài repo, chép `scripts/check-cloud-url.sh` của nhánh vào (main chưa có tệp này), `git init` + `git add` để `git ls-files` chạy được, mượn `pipeline/node_modules` bằng symlink; đo xong xoá cả thư mục.

## Variance

none — every multi-run eval is uniform (không eval nào khai runs > 1)

## Iterations

Round 1: E1–E6 đều đạt expected trên 6a42eae; lần chạy E6 đầu vấp môi trường (thiếu node_modules) và được chạy lại sau khi có đủ phụ thuộc, không sửa code.
