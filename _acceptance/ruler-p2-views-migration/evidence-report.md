---
schema_version: 2
feature_slug: ruler-p2-views-migration
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent (feature-loop:cham-lenh, E1–E7) + 3 lượt giám khảo mù (feature-loop:cham-doc, E8)
enforcement_mode: strict
bypass_used: false
verified_commit: ac7192c791b68138f711a057830fd45eb0268007
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: ruler-p2-views-migration

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | judgment | PASS (giám khảo ×3; Mạnh phán Đạt 2026-10-23) |

## Evidence

- eval: E1
  run_id: ruler-p2-views-migration-E1-20261022T224338Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ruler_views_fresh
  verified_at: 2026-10-22T22:43:40Z
  output: |
    note: 012_source_registry_roles_dq.sql lỗi trên DB trống (tồn đọng, ngoài phạm vi)
    note: 031_property_master.sql lỗi trên DB trống (tồn đọng, ngoài phạm vi)
    PASS 034 áp được trên DB dựng từ migrations
    PASS v_ruler_p2_area cột area_id,m,n
    PASS v_ruler_p2 cột area_id,property_type,m,n
    check-ruler-views fresh: OK

- eval: E2
  run_id: ruler-p2-views-migration-E2-20261022T224347Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ruler_views_idem
  verified_at: 2026-10-22T22:43:48Z
  output: |
    PASS 034 lần 1 exit 0
    PASS 034 lần 2 exit 0
    PASS v_ruler_p2_area kết quả không đổi (md5 4213c0d4ffec5964254a3d4e36425a91)
    PASS v_ruler_p2 kết quả không đổi (md5 5dea49fc82b7228e163605157c05ce18)
    check-ruler-views idem: OK

- eval: E3
  run_id: ruler-p2-views-migration-E3-20261022T224349Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ruler_views_idem
  verified_at: 2026-10-22T22:43:49Z
  output: |
    PASS v_ruler_p2_area có 150 phường
    PASS không phường nào dưới 5 căn lọt vào ruler (n<5: 0, phường 1–4 căn có mặt: 0)
    note: 37 phường có 1–4 căn ở local (bị chặn đúng)
    check-ruler-views idem: OK

- eval: E4
  run_id: ruler-p2-views-migration-E4-20261022T224357Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ruler_views_static
  verified_at: 2026-10-22T22:43:57Z
  output: |
    PASS sync-cloud PII_EXCLUDE có properties.seller_name
    check-ruler-views static: OK

- eval: E5
  run_id: ruler-p2-views-migration-E5-20261022T224358Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ruler_views_static
  verified_at: 2026-10-22T22:43:58Z
  output: |
    PASS SQL catch-up không tạo cột seller_name
    PASS SQL catch-up chỉ DDL
    PASS 034 không chạm cột người bán
    check-ruler-views static: OK

- eval: E6
  run_id: ruler-p2-views-migration-E6-20261022T224359Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ruler_views_cloudsim
  verified_at: 2026-10-22T22:44:01Z
  output: |
    PASS catch-up lần 1 exit 0
    PASS catch-up lần 2 exit 0
    PASS cột bảng sync khớp local, chỉ thiếu properties.seller_name
    PASS không có cột thừa so với local
    PASS asset_nodes.parent_id NULL được, không default
    PASS v_ruler_p2 có trên cloud mô phỏng
    check-ruler-views cloudsim: OK

- eval: E7
  run_id: ruler-p2-views-migration-E7-20261022T224412Z
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-22T22:44:12Z
  output: |
    borrowed: pipeline/node_modules -> /Users/manhphan/dev/onehub-invest/pipeline/node_modules
    symlink removed
    ℹ tests 17
    ℹ pass 17
    ℹ fail 0

- eval: E8
  judged_by: judge-subagent (fresh context, blind) — 3 lượt
  verdict: PASS
  rationale: Lượt 3 (chấm trên HEAD 17fcf12) — hướng dẫn có lý do kèm bảng đo local/cloud, thứ tự bắt buộc (merge bản vá PII vào main, grep kiểm trên checkout chính, rồi mới chạy SQL), hai đường chạy cụ thể (Dashboard / curl -fsS Management API) + launchctl kickstart, phần kiểm sau gồm log leak gate, số đối chiếu local và pii_col phải = 0; người chạy là Mạnh, không bước nào giao agent. SQL khớp: không UPDATE/INSERT/DELETE/TRUNCATE, không tạo seller_name, hai view trùng nguyên văn 034. Lượt 1 và 2 cũng PASS; góp ý của chúng đã sửa vào doc (17fcf12), sau lượt 3 sửa thêm đánh số bước 1-2-4 → 1-2-3-4 và thêm kiểm parent_id (bd94edd).
  human_override: Mạnh 2026-10-23 — Đạt

## Known limits

- Cloud thật KHÔNG được đo trong eval nào: AC-6 chạy trên DB mô phỏng (migration 001–029). Mạnh chạy SQL rồi kiểm theo mục «Kiểm sau khi chạy» của hướng dẫn.
- E1–E7 chạy trên `ac7192c`; sau đó chỉ đổi `docs/ops/cloud-schema-catchup-2026-10-22.md` (T1) và tệp hồ sơ — không có tệp nào bị lưới staleness tính.
- DB trống dựng từ repo vẫn vấp ở 012 và 031 bước 5 (tồn đọng, Out of scope; đã đề xuất phiên riêng).
- E7 mượn `node_modules` của checkout chính qua symlink tạm (worktree không cài dependency); đã gỡ sau khi chạy.
- Còn lại từ giám khảo, không sửa: lệnh lấy token dùng trích dẫn lồng (chạy đúng — đã thử, token 44 ký tự, không dính nháy); `DROP SEQUENCE` giả định tên `asset_nodes_parent_id_seq` (đã đo trên cloud 22/10: đúng tên đó).

## Ngoài hợp đồng

## Analyst

E7 xanh trên cả nhánh và diffBase — lệnh suite chặn hồi quy, đúng chủ đích. E1–E6: baseline n-a vì script đo (`scripts/check-ruler-views.sh`), migration 034 và SQL catch-up đều chưa có trên diffBase `f638258` — chạy trên cây cũ không chứng minh gì. Script đã có đối chứng âm lúc dựng: gài ba lỗi vào bản sao (bỏ dòng PII_EXCLUDE, thêm cột seller_name và một câu UPDATE vào SQL catch-up) → chế độ static báo ba FAIL.

## Variance

none — mọi eval chạy một lần, tất định.

## Iterations

Round 1: E1–E7 PASS (tác tử chấm lệnh); E8 PASS ở cả ba lượt giám khảo mù, góp ý của lượt 1–3 đã sửa vào hướng dẫn (chỉ docs). T3 → PENDING-JUDGMENT chờ Mạnh phán E8 trực tiếp và ký.
