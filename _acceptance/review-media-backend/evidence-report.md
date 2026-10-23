---
schema_version: 2
feature_slug: review-media-backend
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8d3e45f50b62f03ed2a9a0af1820538d27ea41ad
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: review-media-backend

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-9 | script | PASS |
| E11 | AC-9 | script | PASS |

## Evidence

Vòng 2 trên 8d3e45f. E1–E7 dùng chung lệnh `config:executors.test.app_ui` (`cd app && npm test`)
nhưng mỗi eval là MỘT lần chạy riêng (7 lần, mỗi lần 27/27 xanh); mỗi eval đối chiếu với đúng ca
mang nhãn AC của nó.

- eval: E1
  run_id: review-media-backend-E1-r2-20261023T015301
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T01:53:01Z
  output: |
    ✔ AC-1 admin lấy được ảnh snapshot: 200, đúng content-type, đúng byte, cache private (16.403958ms)
    ✔ AC-1 should-NOT-fire: cùng snapshot mà file không có trên đĩa → 404 (1.198958ms)
    ℹ tests 27
    ℹ pass 27
    ℹ fail 0

- eval: E2
  run_id: review-media-backend-E2-r2-20261023T015303
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T01:53:03Z
  output: |
    ✔ AC-2 không phải admin → 404 ở cả hai chế độ, kể cả file hợp lệ (0.802042ms)
    ℹ tests 27
    ℹ pass 27
    ℹ fail 0
    (ca lặp khách/user/ops × snapshot+file/path, đòi 404 và thân đúng "not found")

- eval: E3
  run_id: review-media-backend-E3-r2-20261023T015305
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T01:53:05Z
  output: |
    ✔ AC-3 should-NOT-fire: tham số cố ra khỏi vùng cho phép không bao giờ trả byte đích (3.588625ms)
    ℹ tests 27
    ℹ pass 27
    ℹ fail 0
    (16 ca: .. trong snapshot/file, / trong snapshot, ngoài media/, lồng sâu, đường tuyệt đối, đuôi .txt,
     symlink ra ngoài gốc, symlink tới media/ của snapshots-evil, symlink tới ảnh cùng gốc ngoài media/,
     thiếu từng tham số, rỗng)

- eval: E4
  run_id: review-media-backend-E4-r2-20261023T015307
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T01:53:07Z
  output: |
    ✔ AC-4 chế độ path cũ: OpenClaw media 200, openclaw.json 403, ảnh gốc snapshots 403 (3.2215ms)
    ℹ tests 27
    ℹ pass 27
    ℹ fail 0

- eval: E5
  run_id: review-media-backend-E5-r2-20261023T015309
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T01:53:09Z
  output: |
    ✔ AC-5 local trước, entry lỗi rơi về URL gốc expiring, không trùng, giữ thứ tự post (1.556375ms)
    ✔ AC-5 snapshotId thiếu trong entry thì dùng snapshot_id của post; tham số hỏng hoặc entry lỗi không thành ảnh local (0.175333ms)
    ✔ AC-5 should-NOT-fire: URL không phải http(s) và giá trị rác bị bỏ (0.09325ms)
    ✔ AC-5 tối đa 12 ảnh mỗi tin rao — 11 giữ đủ, 13 cắt còn 12 (0.118792ms)
    ℹ pass 27
    ℹ fail 0

- eval: E6
  run_id: review-media-backend-E6-r2-20261023T015311
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T01:53:11Z
  output: |
    ✔ AC-6 khoá theo id thẻ: entity_match có offer_a/offer_b, agent_output có offer, một truy vấn (0.253875ms)
    ✔ AC-6 tin rao không có post nào vẫn có mục rỗng để UI hiện «không có ảnh» (0.179292ms)
    ℹ pass 27
    ℹ fail 0

- eval: E7
  run_id: review-media-backend-E7-r2-20261023T015313
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T01:53:13Z
  output: |
    ✔ AC-7 should-NOT-fire: không phải admin → {} và không truy vấn DB (0.080708ms)
    ✔ AC-7 DB thiếu bảng stg_zalo_posts (cloud) → {}; lỗi DB khác vẫn ném (0.272042ms)
    ✔ AC-7 không thẻ nào cần ảnh → {} và không truy vấn (0.071167ms)
    ℹ pass 27
    ℹ fail 0

- eval: E8
  run_id: review-media-backend-E8-r2-20261023T015339
  exit_code: 0
  baseline: n-a
  layer: backend-effect
  verifier: config:executors.script.review_media_roundtrip
  verified_at: 2026-10-23T01:53:39Z
  output: |
    ok   một truy vấn cho cả hàng duyệt
    ok   agent_output: ảnh local trước, rồi URL gốc theo thứ tự post_ids (fbcdn của p2, zdn lỗi của p1), không lặp URL đã có local
    ok   entity_match: offer_a như trên, offer_b S06 không có post → chỉ image_url của evidence
    dọn: còn 0 dòng của lần chạy
    ROUNDTRIP PASS (rmtest8a1136b3)
    (kiểm độc lập sau lần chạy qua psql trong one-invest-db: sale_offers/stg_zalo_posts/airbnb_snapshots
     khớp 'rmtest' = 0|0|0)

- eval: E9
  run_id: review-media-backend-E9-r2-20261023T015340
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app
  verified_at: 2026-10-23T01:53:40Z
  output: |
    (tsc --noEmit không in dòng lỗi nào — 0 dòng "error TS"; kiểu Next .next/types có sẵn, không cần next typegen)
    > src@0.1.0 lint
    > eslint && node eslint-plugin-onehub-ui/check-bare-disables.mjs
    ✖ 3 problems (0 errors, 3 warnings)
    (3 cảnh báo react-hooks/exhaustive-deps cũ ở investment-simulator.tsx, user-event-beacon.tsx,
     use-file-upload.ts — không file nào của việc này)

- eval: E10
  run_id: review-media-backend-E10-r2-20261023T015349
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.review_media_no_cloud
  verified_at: 2026-10-23T01:53:49Z
  output: |
    ok   tự kiểm: chuỗi media_files cấy giả bị bắt
    ok   tự kiểm: chuỗi zalo-media cấy giả bị bắt
    ok   tự kiểm: FILL cấy stg_zalo_posts bị đọc ra
    ok   data-api/ không nhắc media_files|zalo-media (42 file, 0 dòng)
    ok   đọc được FILL của sync-cloud (21 bảng)
    ok   FILL của sync-cloud không có stg_zalo_posts
    LOCAL-ONLY PASS

- eval: E11
  run_id: review-media-backend-E11-r2-20261023T015350
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-23T01:53:50Z
  output: |
    ok   zalo-media: isAdmin chặn trước stat/readFile
    ok   zalo-media: ALLOWED_ROOTS đúng hai gốc ~/.openclaw/media + /tmp/openclaw
    ok   zalo-media: không so tiền tố chuỗi trên path (startsWith)
    ok   zalo-media: so bằng path.relative trên cả path chữ lẫn realpath
    ok   canAccessOps(role=admin, OPS_EMAILS trống) = true
    portal-compliance: ĐẠT

## Known limits

- `expiring` được gắn theo tên miền (fbcdn.net, fbsbx.com, zdn.vn), không theo việc entry tải lỗi. Với N1 Zalo URL gốc luôn là zdn/fbcdn nên khớp AC-5; một entry lỗi mang URL miền khác sẽ có `expiring: false`.
- «Thiếu file» ở AC-5 được hiểu là entry thiếu trường `file` (đúng DATA-CONTRACT: «Thiếu file/hoặc error»). Loader không kiểm file có thật trên đĩa: entry có `file` mà file đã bị xoá vẫn ra URL local, route trả 404 (trạng thái ảnh hỏng của UI), không rơi về URL gốc.
- Dữ liệu thật chưa có ảnh local: DB local có 0 dòng `stg_zalo_posts.media_files` khác NULL (đo lúc chấm vòng 2), nên E8 chỉ chứng trên dữ liệu tạo trong giao dịch rồi ROLLBACK; AC-1 chỉ chứng trên thư mục tạm của test. Chưa có lần nào phục vụ ảnh snapshot thật qua route đang chạy.

## Ngoài hợp đồng

- `isInside` loại mọi đường tương đối bắt đầu bằng `..`, kể cả tên file hợp lệ kiểu `..anh.jpg` nằm thẳng trong gốc (âm tính giả, vô hại vì regex đã cấm `..`). Chỉ báo.

## Analyst

Non-discriminating evals: E9 và E11 — green trên diffBase 148c073 (đo ở vòng 1: tsc 0 lỗi + lint 0 lỗi; portal-compliance ĐẠT; diffBase không đổi giữa hai vòng). Cả hai là lệnh hồi quy (typecheck/lint toàn app; ranh giới cổng tĩnh) — được chờ đợi xanh cả hai phía. Riêng E11: việc này sửa `scripts/check-portal-compliance.mjs` để đọc lõi mới, nên «green trên cây cũ» chỉ nói ý kiểm cũ vẫn đạt; sức phân biệt của AC-2/AC-3 nằm ở E2/E3.

Sức phân biệt của test (đột biến trên worktree tạm detached 8d3e45f, symlink `app/node_modules`, đã gỡ bằng `git worktree remove --force`; bản gốc 27/27 xanh):
- MA bỏ `mediaOnly && !inMediaDir(target)` ở lớp 2 → ca AC-3 đỏ (ca mới «symlink tới ảnh cùng gốc ngoài media/»).
- MB bỏ `entry.error ||` trong `localSrc` → ca AC-5 thứ hai đỏ (entry có `file` kèm `error`).
- Bốn đột biến của vòng 1 vẫn đỏ: bỏ gate admin → AC-2; bỏ realpath-isInside → AC-3; trần 13 → AC-5 trần; nuốt mọi lỗi DB → AC-7.
- Kiểm `mediaOnly` ở lớp 1 (theo chữ) vẫn trùng với regex `MEDIA_FILE` — chỉ nó bỏ thì không ca nào đỏ được, theo thiết kế (phòng thủ chiều sâu), không phải lỗ hổng: lớp 2 giờ đã có test giữ.

Baseline khong do:
- E1–E4: `app/tests/zalo-media.test.tsx` và `app/src/lib/ops/zalo-media.ts` chưa tồn tại trên diffBase 148c073 — ca AC-1…AC-4 chưa có, chạy lệnh trên cây cũ không chứng minh gì.
- E5–E7: `app/tests/review-media.test.tsx` và `app/src/lib/ops/review-media.ts` chưa tồn tại trên diffBase.
- E8: `app/scripts/review-media-roundtrip.ts` chưa tồn tại trên diffBase.
- E10: `scripts/check-review-media-local-only.mjs` chưa tồn tại trên diffBase.
- E9, E11 đo ở vòng 1 trên worktree tạm detached 148c073 (symlink `app/node_modules`, `next typegen` + tsc + lint, `check-portal-compliance.mjs`) → green; worktree đã gỡ.

## Variance

none — every multi-run eval is uniform (không eval nào khai runs > 1)

## Iterations

Round 1 (f0ae199): E1–E11 đều đạt expected, verdict PASS. Thử đột biến: bỏ kiểm `mediaOnly` và bỏ `entry.error` trong `localSrc` đều lọt (test vẫn xanh) → ghi Known limits. Báo cáo hoá cũ khi thêm hai ca test chặn đúng hai đột biến đó (8d3e45f, chỉ đổi `app/tests/zalo-media.test.tsx` và `app/tests/review-media.test.tsx`).
Round 2 (8d3e45f): chạy lại cả 11 eval, đều đạt expected; hai đột biến của vòng 1 giờ đỏ → gỡ Known limits 1–2. Limit «E1–E7 dùng chung một lần chạy» cũng gỡ: đó là cách tổ chức eval, không phải giới hạn của tính năng, và vòng này mỗi eval E1–E7 đã là một lần chạy riêng. Ghi chú: một lượt chạy E8 lúc 01:53:25Z bị khung chạy của người chấm bỏ sót dòng run-log (lỗi cwd ở khung chạy, kéo E9–E11 chạy sai thư mục và không ghi log); E8 lượt đó vẫn ROUNDTRIP PASS và DB còn 0 dòng — cả bốn eval được chạy lại đúng và chỉ các lần chạy lại được ghi log, dùng trong báo cáo này.
