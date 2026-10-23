---
schema_version: 2
feature_slug: review-media-backend
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f0ae199856144e321f2554d9e1d00fd0276c9d66
human_signoff:
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

E1–E7 dùng chung lệnh `config:executors.test.app_ui` (`cd app && npm test`), chạy MỘT lần lúc
2026-10-23T01:49:25Z (27 ca, 27 xanh); mỗi eval có run_id riêng trong run-log và được đối chiếu với
đúng ca mang nhãn AC của nó.

- eval: E1
  run_id: review-media-backend-E1-20261023T014925
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T01:49:25Z
  output: |
    ✔ AC-1 admin lấy được ảnh snapshot: 200, đúng content-type, đúng byte, cache private (12.677167ms)
    ✔ AC-1 should-NOT-fire: cùng snapshot mà file không có trên đĩa → 404 (0.613208ms)
    ℹ tests 27
    ℹ pass 27
    ℹ fail 0

- eval: E2
  run_id: review-media-backend-E2-20261023T014925
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T01:49:25Z
  output: |
    ✔ AC-2 không phải admin → 404 ở cả hai chế độ, kể cả file hợp lệ (0.81475ms)
    ℹ tests 27
    ℹ pass 27
    ℹ fail 0
    (ca lặp khách/user/ops × snapshot+file/path, đòi 404 và thân đúng "not found")

- eval: E3
  run_id: review-media-backend-E3-20261023T014925
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T01:49:25Z
  output: |
    ✔ AC-3 should-NOT-fire: tham số cố ra khỏi vùng cho phép không bao giờ trả byte đích (1.617ms)
    ℹ tests 27
    ℹ pass 27
    ℹ fail 0
    (15 ca: .. trong snapshot/file, / trong snapshot, ngoài media/, lồng sâu, đường tuyệt đối, đuôi .txt,
     symlink ra ngoài gốc, symlink tới media/ của snapshots-evil, thiếu từng tham số, rỗng)

- eval: E4
  run_id: review-media-backend-E4-20261023T014925
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T01:49:25Z
  output: |
    ✔ AC-4 chế độ path cũ: OpenClaw media 200, openclaw.json 403, ảnh gốc snapshots 403 (1.093083ms)
    ℹ tests 27
    ℹ pass 27
    ℹ fail 0

- eval: E5
  run_id: review-media-backend-E5-20261023T014925
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T01:49:25Z
  output: |
    ✔ AC-5 local trước, entry lỗi rơi về URL gốc expiring, không trùng, giữ thứ tự post (0.881416ms)
    ✔ AC-5 snapshotId thiếu trong entry thì dùng snapshot_id của post; tham số hỏng không thành ảnh local (0.106583ms)
    ✔ AC-5 should-NOT-fire: URL không phải http(s) và giá trị rác bị bỏ (0.073625ms)
    ✔ AC-5 tối đa 12 ảnh mỗi tin rao — 11 giữ đủ, 13 cắt còn 12 (0.498042ms)
    ℹ pass 27
    ℹ fail 0

- eval: E6
  run_id: review-media-backend-E6-20261023T014925
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T01:49:25Z
  output: |
    ✔ AC-6 khoá theo id thẻ: entity_match có offer_a/offer_b, agent_output có offer, một truy vấn (0.480833ms)
    ✔ AC-6 tin rao không có post nào vẫn có mục rỗng để UI hiện «không có ảnh» (0.084833ms)
    ℹ pass 27
    ℹ fail 0

- eval: E7
  run_id: review-media-backend-E7-20261023T014925
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T01:49:25Z
  output: |
    ✔ AC-7 should-NOT-fire: không phải admin → {} và không truy vấn DB (0.116084ms)
    ✔ AC-7 DB thiếu bảng stg_zalo_posts (cloud) → {}; lỗi DB khác vẫn ném (0.267834ms)
    ✔ AC-7 không thẻ nào cần ảnh → {} và không truy vấn (0.06475ms)
    ℹ pass 27
    ℹ fail 0

- eval: E8
  run_id: review-media-backend-E8-20261023T014935
  exit_code: 0
  baseline: n-a
  layer: backend-effect
  verifier: config:executors.script.review_media_roundtrip
  verified_at: 2026-10-23T01:49:35Z
  output: |
    ok   một truy vấn cho cả hàng duyệt
    ok   agent_output: ảnh local trước, rồi URL gốc theo thứ tự post_ids (fbcdn của p2, zdn lỗi của p1), không lặp URL đã có local
    ok   entity_match: offer_a như trên, offer_b S06 không có post → chỉ image_url của evidence
    dọn: còn 0 dòng của lần chạy
    ROUNDTRIP PASS (rmtest682dc98c)
    (kiểm độc lập sau lần chạy qua psql trong one-invest-db: sale_offers/stg_zalo_posts/airbnb_snapshots
     khớp 'rmtest' = 0|0|0)

- eval: E9
  run_id: review-media-backend-E9-20261023T014945
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app
  verified_at: 2026-10-23T01:49:45Z
  output: |
    (tsc --noEmit không in dòng lỗi nào; kiểu Next .next/types đã có sẵn, không cần chạy next typegen)
    > src@0.1.0 lint
    > eslint && node eslint-plugin-onehub-ui/check-bare-disables.mjs
    ✖ 3 problems (0 errors, 3 warnings)
    (3 cảnh báo react-hooks/exhaustive-deps cũ ở investment-simulator.tsx, user-event-beacon.tsx,
     use-file-upload.ts — không file nào của việc này)

- eval: E10
  run_id: review-media-backend-E10-20261023T014956
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.review_media_no_cloud
  verified_at: 2026-10-23T01:49:56Z
  output: |
    ok   tự kiểm: chuỗi media_files cấy giả bị bắt
    ok   tự kiểm: chuỗi zalo-media cấy giả bị bắt
    ok   tự kiểm: FILL cấy stg_zalo_posts bị đọc ra
    ok   data-api/ không nhắc media_files|zalo-media (42 file, 0 dòng)
    ok   đọc được FILL của sync-cloud (21 bảng)
    ok   FILL của sync-cloud không có stg_zalo_posts
    LOCAL-ONLY PASS

- eval: E11
  run_id: review-media-backend-E11-20261023T015002
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-23T01:50:02Z
  output: |
    ok   zalo-media: isAdmin chặn trước stat/readFile
    ok   zalo-media: ALLOWED_ROOTS đúng hai gốc ~/.openclaw/media + /tmp/openclaw
    ok   zalo-media: không so tiền tố chuỗi trên path (startsWith)
    ok   zalo-media: so bằng path.relative trên cả path chữ lẫn realpath
    ok   canAccessOps(role=admin, OPS_EMAILS trống) = true
    portal-compliance: ĐẠT

## Known limits

- Lớp kiểm `mediaOnly` (thư mục cha phải là `media/`, ở cả lớp chữ lẫn lớp realpath) không có ca test nào phân biệt: đột biến bỏ cả hai lần kiểm này, bộ app_ui vẫn xanh 27/27. Lý do: regex `MEDIA_FILE` đã ép `file` thành `media/<tên>` nên lớp 1 trùng; còn lớp 2 chỉ có tác dụng với symlink trong `media/` trỏ tới file ảnh khác NẰM TRONG gốc snapshots nhưng ngoài `media/` (vd. `other/b.jpg`) — ca này hợp đồng AC-3 không liệt kê và test không dựng. Các ca AC-3 hợp đồng nêu đều được chặn bởi lớp khác (regex + realpath-isInside), nên không phải lỗi hợp đồng; chỉ là lớp phòng thủ chiều sâu chưa có test giữ.
- Điều kiện `entry.error` trong `localSrc` cũng không có ca phân biệt: đột biến bỏ nó, test vẫn xanh, vì mọi entry lỗi trong test (và trong DATA-CONTRACT v2: «Thiếu file/hoặc error») đều có `file: null`. Một entry vừa có `error` vừa có `file` chuỗi sẽ thành ảnh local — hình dạng đó hợp đồng collector không sinh ra.
- `expiring` được gắn theo tên miền (fbcdn.net, fbsbx.com, zdn.vn), không theo việc entry tải lỗi. Với N1 Zalo URL gốc luôn là zdn/fbcdn nên khớp AC-5; một entry lỗi mang URL miền khác sẽ có `expiring: false`.
- «Thiếu file» ở AC-5 được hiểu là entry thiếu trường `file` (đúng DATA-CONTRACT). Loader không kiểm file có thật trên đĩa: entry có `file` mà file đã bị xoá vẫn ra URL local, route trả 404 (trạng thái ảnh hỏng của UI), không rơi về URL gốc.
- Dữ liệu thật chưa có ảnh local: DB local có 0 dòng `stg_zalo_posts.media_files` khác NULL (đo lúc chấm), nên E8 chỉ chứng trên dữ liệu tạo trong giao dịch rồi ROLLBACK; AC-1 chỉ chứng trên thư mục tạm của test. Chưa có lần nào phục vụ ảnh snapshot thật qua route đang chạy.
- E1–E7 chạy một lần chung lệnh `cd app && npm test`; bảy run_id là bảy dòng run-log trỏ cùng một lần chạy, phân biệt bằng ca test mang nhãn AC.

## Ngoài hợp đồng

- `isInside` loại mọi đường tương đối bắt đầu bằng `..`, kể cả tên file hợp lệ kiểu `..anh.jpg` nằm thẳng trong gốc (âm tính giả, vô hại vì regex đã cấm `..`). Chỉ báo.

## Analyst

Non-discriminating evals: E9 và E11 — green trên diffBase 148c073 (tsc 0 lỗi + lint 0 lỗi; portal-compliance ĐẠT). Cả hai là lệnh hồi quy (typecheck/lint toàn app; ranh giới cổng tĩnh) — được chờ đợi xanh cả hai phía. Riêng E11: việc này sửa `scripts/check-portal-compliance.mjs` để đọc lõi mới, nên «green trên cây cũ» chỉ nói ý kiểm cũ vẫn đạt; sức phân biệt của AC-2/AC-3 nằm ở E2/E3.

Kiểm thêm sức phân biệt của test (đột biến trên worktree tạm của f0ae199, đã gỡ): bỏ gate admin → ca AC-2 đỏ; bỏ lớp realpath-isInside → ca AC-3 đỏ; nâng trần lên 13 → ca AC-5 trần đỏ; nuốt mọi lỗi DB → ca AC-7 lỗi khác đỏ; bỏ `mediaOnly` hoặc bỏ `entry.error` → vẫn xanh (xem Known limits).

Baseline khong do:
- E1–E4: `app/tests/zalo-media.test.tsx` và `app/src/lib/ops/zalo-media.ts` chưa tồn tại trên diffBase 148c073 — ca AC-1…AC-4 chưa có, chạy lệnh trên cây cũ không chứng minh gì.
- E5–E7: `app/tests/review-media.test.tsx` và `app/src/lib/ops/review-media.ts` chưa tồn tại trên diffBase.
- E8: `app/scripts/review-media-roundtrip.ts` chưa tồn tại trên diffBase.
- E10: `scripts/check-review-media-local-only.mjs` chưa tồn tại trên diffBase.
- E9, E11 đo được: worktree tạm detached 148c073 trong scratchpad, symlink `app/node_modules`, chạy `next typegen` + tsc + lint và `check-portal-compliance.mjs` → green; worktree đã gỡ bằng `git worktree remove --force`.

## Variance

none — every multi-run eval is uniform (không eval nào khai runs > 1)

## Iterations

Round 1: E1–E11 đều đạt expected trên f0ae199; không eval nào trượt.
