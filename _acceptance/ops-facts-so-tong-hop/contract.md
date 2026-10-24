---
schema_version: 1
feature: Sau mỗi lượt cloud-sync, máy local đẩy lên cloud năm khối số tổng hợp Ops có mốc đo, qua bộ soát tầng A, và cloud có một hàm đọc chung báo số cũ quá 45′
slug: ops-facts-so-tong-hop
owner: phanlemanh@gmail.com
risk_tier: T3      # pipeline/push-ops-facts.mjs (t3_paths)
surfaces: [pipeline, api, docs]
status: verified
design_doc: docs/superpowers/specs/2026-10-24-ops-facts-so-tong-hop-design.md
approved_by: Mạnh
approved_at: 2026-10-24
---

# Acceptance Contract: ops-facts-so-tong-hop

## Context

ADR-0014 (Mạnh chốt 24/10, «Chọn A»): trang Ops trên cloud không tự đo được gì chỉ có ở máy local, nên máy local tính
sẵn số tổng hợp rồi đẩy lên qua đường duy nhất `pipeline/push-ops-facts.mjs` → `ops_heartbeat`. Vòng này dựng năm khối
số (độ tươi/SLO từng nguồn, job launchd, lockdown từng lớp, bản ghi 24h theo S0x, số thẻ chờ duyệt), mỗi khối có mốc
đo riêng, và một hàm đọc chung trên cloud phân biệt «chưa có số», «số tươi», «số cũ quá 45′». Phần hiện lên trang là
của ON3/ON23/AU12.

Căn cứ: docs/plan/lo-trinh.json ON22 (`bat_khi`, `ghi_chu`); docs/adr/0014-ops-cloud-doc-so-tong-hop.md (§Quyết định,
§Ngưỡng trễ, §Hệ quả); AGENTS.md luật 6 (tầng A), luật 10 (precompute); NT2 `soat-tang-a-moi-duong-len-cloud` (bộ soát).

## Criteria

- AC-1: Given `push-ops-facts.mjs` THẬT chạy với lược đồ tạm, cây log tạm và máy chủ thu tạm, When bản tin gửi đi, Then
  `payload.blocks` có đúng năm khối `freshness`, `jobs`, `lockdown`, `records24h`, `reviewQueue`, mỗi khối có
  `measured_at` là mốc ISO nằm trong khoảng chạy lệnh, và mọi khoá cấp một cũ của bản tin vẫn còn.
- AC-2: Given cùng lược đồ tạm, When `push-ops-facts` gửi bản tin và `check-freshness --json` chạy với cùng mốc `now`,
  Then hàng của khối `freshness` bằng từng hàng đầu ra của `check-freshness` (cùng mã, thành phố, tuổi, SLO, trạng thái);
  chiều đỏ: bản sao bên ghi lệch định nghĩa (đổi SLO một mã) → phép so bắt đúng mã đó.
- AC-3: Given lược đồ tạm có snapshot trong và ngoài 24 giờ của nhiều luồng thu, When bản tin gửi, Then khối `records24h`
  bằng `items24h` từng mã mà `getSourceFeedHealth` của app tính trên cùng lược đồ; chiều đỏ: bản sao `.mjs` đếm cả
  ngoài 24 giờ → phép so bắt. (Phép đối chiếu chỉ áp khi bảng đọc được; ca bảng vắng thuộc AC-7 — ở đó bên ghi cố ý
  lệch hàm app: ghi `error`, không ghi 0.)
- AC-4: Given `review_queue` tạm có thẻ `pending` và thẻ đã quyết thuộc nhiều loại, When bản tin gửi, Then khối
  `reviewQueue` có `byType` = số thẻ `pending` theo `item_type` và `total` = tổng, và khối chỉ mang ba khoá
  `byType`/`total`/`measured_at` (không tiêu đề, không bằng chứng của thẻ); chiều đỏ: bản sao đẩy kèm tiêu đề thẻ → bắt.
- AC-5: Given ma trận cây log viết trước — watchdog `ok` mới, watchdog `ok` cũ quá 15′, watchdog có dòng báo sự cố mới
  (dòng cuối không `ok`), không có log watchdog, log gateway trong ngày không có lượt agent, log gateway có lượt agent,
  không có log gateway — When bản tin gửi, Then khối `lockdown` bằng từng lớp `getLockdownStatus` của app trên cùng cây
  log và cùng `now`; lớp không kiểm được là `null` (không bao giờ `true`), lớp kiểm thấy sự cố là `false` (không bao giờ
  `null`); chiều đỏ: bản sao biến `false` thành `null` → bắt, nêu tên lớp.
- AC-6: Given `launchctl list` trả bản chụp thật 23/10 (bản giả trên PATH), When bản tin gửi, Then khối `jobs` có một
  hàng cho mỗi nhãn khai trong `pipeline/cron/*.plist` có mặt trong bản chụp, mang `lastExit` và `pid` đúng bản chụp,
  `lastLogAt` = mốc ghi cuối của tệp log mà plist khai (`null` khi tệp vắng), và nhãn mang tên nguồn thật được thay bằng
  mã S0x; `launchctl` không chạy được → khối có `error`, không có hàng nào.
- AC-7: Given ma trận khối không đo được — `review_queue` vắng (reviewQueue), `launchctl` vắng (jobs), bảng của độ tươi
  vắng (freshness), `airbnb_snapshots` vắng (records24h) — When bản tin gửi, Then khối đó là `{measured_at, error}`
  (không 0, không mảng rỗng, không `ok: true`), các khối còn lại vẫn đo và bản tin vẫn gửi. Khối `lockdown` không có
  lỗi cả khối: lớp không kiểm được là `null` từng lớp (AC-5).
- AC-8: Given ma trận viết trước cấy tên nguồn thật vào từng khối trong năm khối, When chạy, Then mỗi bản bị chặn
  (thoát ≠ 0, máy chủ thu không nhận POST), dòng chặn nêu đúng đường JSON viết trước trong `blocks.<khối>` và mã S0x.
- AC-9 (cross-layer): Given bản tin do `push-ops-facts` THẬT dựng trên lược đồ tạm được POST qua handler
  `/api/v1/ops/ingest` THẬT vào `ops_heartbeat` của lược đồ tạm, When `readOpsFacts()` đọc với `now` lần lượt: chưa có
  dòng; `pushedAt`+44′; `pushedAt`+46′; bản tin ấy với một khối đã chỉnh `measured_at` lùi 50′ (lần đẩy 10′ trước); bản
  tin của ca khối lỗi (AC-7), Then lần lượt `state` = `none` (facts null), `fresh` với năm khối `fresh` và `measuredAt`
  từng khối bằng `measured_at` bên ghi và hàng `freshness` bằng `check-freshness --json`, `stale` kèm `measuredAt` của
  lần đẩy cuối, `fresh` với riêng khối đó `stale`, khối đó `error`; hằng 45′ khai đúng một chỗ; chiều đỏ: bản sao bên
  ghi đổi tên khoá `measured_at` → ca đọc trên cloud đỏ.
- AC-10: Given log, cấu hình và DB THẬT của máy thu, When chạy `push-ops-facts --kho` (không gửi), Then năm khối đều có
  `measured_at`, khối `freshness` bằng `check-freshness --json` cùng lúc, bộ soát 0 chỗ chặn, và đầu ra chỉ in tên khối
  + trạng thái đo được/không (không giá trị, không tên); ca KHÔNG được bỏ qua: thiếu DB hay `launchctl` thì đỏ.

## Coverage

Bỏ quét hình thái: phạm vi đã chốt sẵn ở ADR-0014 (năm khối × ba mức trễ) — xem dòng `descope` «bỏ coverage-scan» trong
sổ quyết định. Trục và thước lấy từ ADR:

- Trục khối: freshness (AC-2) · jobs (AC-6) · lockdown (AC-5) · records24h (AC-3) · reviewQueue (AC-4) — đủ năm
  [thước CE: ADR-0014 §Quyết định 1, năm gạch].
- Trục trạng thái đo: đo được (AC-1…AC-6) · không đo được (AC-7: bốn khối có lỗi cả khối; AC-5: lớp lockdown `null`) · kiểm thấy sự cố (AC-5: `false`) · đo được nhưng còn tên tầng A (AC-8).
- Trục trễ ở bên đọc (qua route ingest thật): không có · tươi ≤ 45′ · cũ > 45′ · khối cũ trong bản tin tươi · khối lỗi (AC-9)
  [thước CE: ADR-0014 §Ngưỡng trễ, ba mức].
- Trục môi trường: lược đồ/cây log tạm (AC-1…AC-9) · máy thu thật (AC-10).

## Đường đo

- Ngưỡng «ops_heartbeat có đủ năm khối, mỗi khối có measured_at» ← AC-9 (bản tin thật qua handler ingest thật vào
  `ops_heartbeat`, đọc lại bằng `readOpsFacts`); bên gửi: AC-1, AC-10 (máy thật, chế độ khô).
- Ngưỡng «độ tươi từng nguồn trên cloud trùng check-freshness chạy cùng lúc ở local» ← AC-9 (đọc trên cloud), AC-2 (bản
  tin gửi đi), AC-10 (máy thật).
- Ngưỡng «cấy tên nguồn thật vào payload: lệnh dừng trước khi gửi, cloud không đổi» ← AC-8 (máy chủ thu không nhận POST).
- Ngưỡng «ngừng đẩy 46′: hàm đọc trả stale kèm mốc đo cuối» ← AC-9.

## Out of scope

- Hiện số lên trang (dòng «Số đo lúc …», Alert «Máy local không đẩy số từ …») — ON3.
- Trang lockdown trên cloud đọc khối `lockdown` — ON23; `/api/v1/ops/coverage` đọc khối độ tươi — AU12.
- Bảng riêng / migration cho số tổng hợp — ADR-0014 giữ `ops_heartbeat.payload` jsonb.
- Nội dung thẻ chờ duyệt lên cloud — tầng A.
- Đổi hàm app `getLockdownStatus`, `getSourceFeedHealth` thành bản dùng chung.

## Notes

- `pipeline/push-ops-facts.mjs` (t3_paths) chung với ON2, ON4, ON5, AU12 — chạy liền nhau, không song song.
- An toàn Zalo: lockdown chỉ đọc log + probe GET như ON2; không phương thức ghi nào lên OpenClaw hay route Zalo.
