---
schema_version: 1
feature: Lệnh có khuôn đã duyệt trên cloud được máy thu kéo về bằng token máy riêng, áp đúng một lần và báo kết quả cùng giá trị trước/sau lên cloud
slug: so-lenh-bo-ap
owner: phanlemanh@gmail.com
risk_tier: T3      # máy suy: chạm db/migrations/**, app/src/app/api/v1/ops/**, pipeline/push-ops-facts.mjs (t3_paths); hàng lộ trình ghi T3
surfaces: [api, cli]
status: implemented
design_doc: docs/superpowers/specs/2026-11-10-so-lenh-bo-ap-design.md
approved_by: Mạnh
approved_at: 2026-11-10
---

# Acceptance Contract: so-lenh-bo-ap

## Context

Hàng TV4, mốc TVM1. Hôm nay không có đường nào từ cloud xuống máy thu (G4). ADR-0015 chốt đường lệnh kéo một chiều:
cloud chỉ ghi Lệnh có khuôn vào `change_requests`; máy thu kéo lệnh đã duyệt bằng token máy theo tên scope `ops:pull`,
kiểm, áp đúng một lần và báo kết quả kèm giá trị trước/sau qua `push-ops-facts` → `ingest`. Vòng này dựng nền đó với hai
loại lệnh đầu, `source.pause` và `source.resume`, trên `source_registry` ở máy thu (vòng đời của TV2a). Màn bấm là TV4b.

## Criteria

- AC-1: Given migration 091 chạy trên một lược đồ tạm kiểu máy thu (có `source_registry`, `ops_audit`) và một lược đồ tạm
  kiểu cloud (không có `source_registry`, không có `ops_audit`, có sẵn `ops_heartbeat` đúng khuôn cloud), When chạy nguyên
  tệp hai lần liền, Then cả hai lần không lỗi; có đủ `change_requests`, `machine_tokens`, `change_request_applies`,
  `ops_heartbeat`, `ops_audit` (cột đúng khuôn 018); `change_requests.type` nhận đúng 14 loại rút từ ADR-0015 §4 và từ
  chối loại khác, và tập ấy bằng danh sách loại của bản `.mjs` lẫn bản TS; `status` nhận đúng 9 trạng thái rút từ ADR-0015
  §5 và từ chối trạng thái khác; `idempotency_key` trùng bị từ chối; trên DB có role `anon` thì `anon` không còn quyền
  trên năm bảng và RLS bật.
- AC-2: Given route `POST /api/v1/ops/change-requests` trên DB thử đã migration, When gọi với phiên vai `ops` lệnh
  `source.pause` S05 có `reason`, Then 201, dòng `submitted` mang `requested_by` = `user:<id>`, và đúng một dòng
  `ops_audit` cùng giao dịch; cùng lời gọi thiếu `reason`, `reason` trống, loại chưa có bộ áp (`unit.create`), loại lạ,
  `target` sai khuôn, khoá payload ngoài danh sách, hay khoá cấm Zalo ở bất kỳ độ sâu → 400 và 0 dòng mới; vai `viewer`
  → 403; `source.resume` từ vai `ops` → 403 và từ vai `admin` → 201; Bearer `OPS_API_TOKEN` chung → 403. (cross-layer)
- AC-3: Given một lệnh `submitted`, When gọi `POST …/[id]/decide` duyệt hoặc từ chối, Then vai `admin` đổi sang
  `approved` / `rejected` với `approved_by`, `decided_at` và đúng một dòng audit cùng giao dịch; vai `ops` → 403; lệnh
  không ở `submitted` → 409 và dòng không đổi; admin tự duyệt `source.resume` S05 do chính mình gửi → 200; lệnh nhắm
  `S03` do chính người gửi duyệt → 409, người khác vai `admin` duyệt → 200. Các route tạo và duyệt chạy trên lược đồ kiểu
  cloud của AC-1. (cross-layer)
- AC-4: Given token máy cấp bằng `scripts/cap-token-may.mjs` (DB chỉ giữ băm sha256, chuỗi token không nằm trong bảng
  nào), When gọi `GET …/pull`, Then token còn hiệu lực có `ops:pull` nhận lệnh `approved` và `queued` cũ trước, các lệnh
  `approved` chuyển `queued` có `queued_at`, `last_used_at` của token được ghi; lệnh `submitted`, `rejected`, `applied`
  không bao giờ được trả; không header, phiên người vai `owner`, Bearer `OPS_API_TOKEN`, token đã thu hồi, token thiếu
  scope `ops:pull`, token lạ → 401 hoặc 403, không lệnh nào đổi trạng thái và `last_used_at` không đổi. (cross-layer)
- AC-5: Given ma trận viết trước của `kiemLenh` (lệnh hợp lệ hai loại, loại ngoài danh sách, loại trong 14 nhưng chưa có
  bộ áp, `target` sai khuôn, thiếu/trống `reason`, khoá payload thừa, mười một khoá cấm của ADR-0015 §7 mỗi khoá ở độ
  sâu 1 và 3), When gọi bản `.mjs` và bản TS của app trên cùng ma trận, Then mỗi ô trả đúng `{ok, ly_do}` viết trước,
  khoá cấm gọi đúng tên khoá, và hai bản trả giống hệt nhau trên mọi ô.
- AC-6: Given DB thử có `source_registry` S05 `active` và một cloud giả trả một lệnh `source.pause` S05 đã duyệt, When
  chạy `ops-apply` mười lượt liền với cùng lệnh được kéo về mỗi lượt và hai lời gọi `apLenh` song song trên cùng lệnh,
  Then S05 thành `paused` với đúng `reason`, `isRunnable` của S05 trả `nguon-paused`, `source_registry` bị ghi đúng một
  lần (`xmin` không đổi sau lượt đầu), `change_request_applies` có đúng một dòng `applied` với `before` `{status:
  active}` và `after` `{status: paused, reason}`, `ops_audit` ở máy thu có đúng một dòng actor `machine:ops-apply`; mỗi
  lượt vẫn gửi lại cùng kết quả lên cloud giả. (cross-layer)
- AC-7: Given DB thử, When áp `source.pause` nhắm nguồn đã `paused`, nguồn `retired`, nguồn không có dòng; `source.resume`
  nhắm nguồn `active`; và `source.pause` hợp lệ với hàm kiểm sau áp bị ép hỏng, Then bốn ca đầu có kết quả `failed` với
  lý do gọi tên tiền điều kiện; ca cuối có kết quả `reverted`; trong cả năm ca dòng `source_registry` trước/sau giống hệt
  nhau và sổ áp có đúng một dòng mang kết quả ấy. Đối chứng: `source.resume` nhắm nguồn `paused` có lý do → `applied`,
  `reason` và `resume_when` về `NULL`, `isRunnable` trả `chay`.
- AC-8: Given cloud thử có lệnh `queued`, When `push-ops-facts.mjs --chi-lenh` gửi kết quả `applied`, `failed`,
  `reverted` tới route `ingest` bằng token máy, Then mỗi lệnh khớp `id` + `idempotency_key` chuyển đúng trạng thái kèm
  `before`, `after`, `result`, `finished_at` và một dòng audit actor `machine:<tên token>`; dòng `ops_heartbeat` giữ
  nguyên `payload` và `pushed_at`; kết quả trùng lần hai, kết quả cho lệnh không `queued`, kết quả sai `idempotency_key`
  bị bỏ qua và đếm trong phản hồi; nhánh này gọi bằng Bearer `OPS_API_TOKEN` → 403; kết quả chứa tên nguồn thật của
  `source_registry` thì không gửi, thoát 1 và in dòng `FACTS CHẶN [tầng A]`; bản tin thường (không `kind`) vẫn upsert
  `ops_heartbeat` như trước. Đầu-cuối: lệnh tạo và duyệt qua route thật, `ops-apply` kéo từ route pull thật và gửi kết
  quả qua `push-ops-facts` tới route `ingest` thật → lệnh trên cloud thành `applied` với `before`, `after` bằng dòng sổ áp
  ở máy thu. (cross-layer)
- AC-9: Given lệnh đã duyệt và máy thu không kéo, When gọi `GET /api/v1/ops/change-requests` bằng phiên vai `viewer`,
  Then lệnh hiện `approved` (không bao giờ `applied` khi chưa có kết quả), `last_pull_at` là `null` khi chưa token nào
  kéo và bằng `last_used_at` mới nhất của token `ops:pull` còn hiệu lực sau một lượt kéo; token đã thu hồi không tính;
  không phiên → 401.
- AC-10: Given tệp phanh `ops-apply.dung` có mặt trong thư mục cấu hình mà bộ áp đọc, When chạy `ops-apply`, Then thoát
  0, in một dòng nêu phanh, cloud giả nhận 0 yêu cầu và DB không đổi; gỡ tệp thì lượt kế kéo và áp bình thường; cloud
  giả không trả lời hoặc trả 5xx → thoát 2, DB không đổi; thiếu `OPS_MACHINE_TOKEN` → thoát 2 không gọi mạng; token
  không xuất hiện trong stdout, stderr. Tệp `pipeline/cron/com.oneinvest.ops-apply.plist` là plist hợp lệ, `StartInterval`
  60, gọi `pipeline/ops-apply.mjs`.

## Coverage

Quét bằng morphological-scan, preset test-matrix (design doc mục «Không gian đã quét»):

- Trục A — lệnh × tiền điều kiện: pause active · pause đã paused · resume paused · resume active · nguồn retired · nguồn
  không có · loại ngoài danh sách · payload có khoá cấm [thước CE: ma trận viết trước AC-5, AC-7; NGÀNH: Stripe
  Idempotency-Key cho ca lặp] → AC-5, AC-6, AC-7
- Trục B — ai xưng danh: viewer · ops · admin · owner · bearer chung · token máy đủ scope · thiếu scope · thu hồi ·
  không gì [thước CE: bảng vai §3.5 + ADR-0015 §2; NGÀNH: GitHub Actions self-hosted runner, token riêng từng máy] →
  AC-2, AC-3, AC-4, AC-8, AC-9
- Trục C — chặng của lệnh: tạo · duyệt/từ chối · kéo · áp · báo kết quả · hiện trạng thái [thước CE: máy trạng thái
  ADR-0015 §5] → AC-2, AC-3, AC-4, AC-6, AC-8, AC-9
- Trục D — sự cố: kéo lặp mười lần · hai bộ áp cùng lúc · báo kết quả hỏng · kiểm sau áp hỏng · máy thu tắt · phanh bật ·
  cloud không trả lời [thước CE: `bat_khi` của hàng TV4] → AC-6, AC-7, AC-9, AC-10
- Cắt ngang: nhật ký người thật cùng giao dịch (AC-2, AC-3, AC-6, AC-8); tầng A không lên cloud (AC-8); migration chạy
  trên hai khuôn DB và khoá `anon` (AC-1).

## Đường đo

- Thước «lệnh đã duyệt áp trong ≤ 5′»: số từ `queued_at` → `finished_at` của lệnh trên cloud · vật bảo đảm: AC-4 ghi
  `queued_at`, AC-8 ghi `finished_at`, AC-10 có plist 60″ và bộ áp gửi kết quả ngay trong lượt (AC-6) — số thật đo ở
  phiên nghiệm thu sau khi nạp plist.
- Thước «mười lượt kéo lặp: áp đúng một lần»: `xmin` của dòng nguồn và số dòng sổ áp · AC-6.
- Thước «máy thu tắt: lệnh nằm chờ, cloud hiện mốc kéo cuối»: `last_pull_at` của route danh sách · AC-9.
- Thước «token chung hoặc thiếu scope ops:pull: từ chối»: mã HTTP và trạng thái lệnh không đổi · AC-4, AC-8.
- Thước «ops_heartbeat có migration»: bảng có trong 091 đúng khuôn cloud · AC-1.

## Out of scope

- Màn bấm tạm dừng/bật lại, ô lý do, dòng «Máy thu chưa nhận lệnh từ HH:MM», nút đóng băng của owner (TV4b).
- Lệnh `unit.*` cho S05/S06 (TV5), S03 qua cấu hình gateway (TV6), `source.set_schedule`, `job.rerun` (TV7),
  `source.set_slo` (TV8); lệnh đảo tự sinh từ một lệnh đã áp.
- Áp 091 lên DB máy thu và Supabase, cấp token máy thật, nạp plist vào launchd: bước triển khai sau gộp, mỗi việc một
  lời của Mạnh (Hỏi-1, Hỏi-2).
- Script thu tuân `isRunnable` (TV2b, làn ZCode) — vòng này chứng `isRunnable` đổi đúng, không chứng script thu dừng.

## Notes

- Không đổi `CLOUD_ALLOW` của `sync-cloud`: không bảng mới nào được chép từ máy thu lên cloud.
- Sửa `app/src/lib/ops-access.ts` (thêm hành động lệnh) và route `ingest` chạm vật của hồ sơ đã ký TV1, ON22: lưới
  trước-gộp có thể đòi ghim lại các hồ sơ ấy trong cùng PR.
