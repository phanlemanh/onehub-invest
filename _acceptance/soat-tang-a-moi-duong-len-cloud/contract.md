---
schema_version: 1
feature: Mọi đường dữ liệu rời máy (sync và ops-facts) qua cùng một bộ soát tầng A chặn khi lỗi
slug: soat-tang-a-moi-duong-len-cloud
owner: phanlemanh@gmail.com
risk_tier: T3      # pipeline/push-ops-facts.mjs, pipeline/sync-cloud.mjs (t3_paths)
surfaces: [pipeline, ui, docs]
status: approved
design_doc: docs/superpowers/specs/2026-10-24-soat-tang-a-moi-duong-len-cloud-design.md
approved_by: Mạnh
approved_at: 2026-10-24
---

# Acceptance Contract: soat-tang-a-moi-duong-len-cloud

## Context

Hai đường đưa dữ liệu rời máy: `sync-cloud` (bảng → Supabase) đã có bộ soát tên nguồn cho bảng người bán và leak gate,
còn `push-ops-facts` (bản tin `ops_heartbeat`) chưa qua bộ soát nào — một hồi quy hay một khối số mới (ON22) sẽ đẩy tên
nguồn thật lên cloud không ai chặn. Leak gate cũng chưa soát cột: một cột PII lọt lên bảng người bán ở cloud không làm gate
đỏ. Việc này đưa cả hai đường qua MỘT bộ soát (`pipeline/lib/tier-a-guard.mjs`, lõi khớp tên của ON7), cho `push-ops-facts`
dừng trước khi gửi khi bản tin còn tên thật, và cho leak gate đỏ khi cloud có cột ngoài danh sách cho phép hoặc bảng tầng A
có dòng.

Căn cứ: docs/plan/lo-trinh.json NT2 (`bat_khi`, `ghi_chu`); AGENTS.md luật 6 (tầng A: tên nguồn thật, hồ sơ người dùng
app, `user_events/user_profile`, `review_queue`; tên nhóm S03 tầng C; tên tài khoản thu «giữ như tầng A»);
docs/adr/0014-ops-cloud-doc-so-tong-hop.md (chuỗi AU13 → ON7 → NT2 → ON22); docs/plan/BOI-CANH.md §4 (NT2 ↔ AU12, ON22).

## Criteria

- AC-1: Given `push-ops-facts.mjs` THẬT chạy với cây log tạm và máy chủ thu tạm, When bản tin lành (đã che theo ON7), Then
  lệnh thoát 0 và máy chủ thu nhận đúng một POST (đối chứng dương của bộ soát).
- AC-2: Given bản sao `push-ops-facts` bỏ bộ che dòng log (tên thật còn trong `jobs[i].lastLine`), When chạy, Then lệnh thoát
  ≠ 0, máy chủ thu KHÔNG nhận POST nào, stderr có dòng `FACTS CHẶN [tầng A] jobs[<i>].lastLine <S0x>` và không chứa tên.
- AC-3: Given ma trận viết trước các bản sao `push-ops-facts` cấy tên thật vào: mỗi khoá cấp một của bản tin, một chuỗi lồng
  sâu trong mảng đối tượng, và trường anh em cạnh đường miễn (`zaloGroups[0].<khác>`), When chạy từng bản, Then mỗi bản bị chặn
  y như AC-2 và dòng chặn nêu đúng đường JSON viết trước; đối chứng dương: tên trong `zaloGroups[0].name` (tầng C) KHÔNG bị chặn.
- AC-4: Given tên tài khoản thu theo Hỏi-1, When bản tin dựng từ cấu hình tài khoản có tên, Then (Hỏi-1 = A) bản tin gửi
  `zaloAccounts[i].name = null`, và bản sao gửi tên tài khoản thì bị chặn với dòng nêu `zaloAccounts[<i>].name`.
- AC-5: Given `source_registry` không đọc được (danh sách tên rỗng), When `push-ops-facts` chạy tới bước gửi, Then chặn
  (thoát ≠ 0, không POST) với dòng nói không có danh sách tên để soát — đóng chặt.
- AC-6: Given bảng ca tên dùng chung của ON7 (`pipeline/scripts/mask-source-names.cases.json`), When chạy qua
  `scanSourceNames` của `sync-cloud` và qua `guardValues` của bộ soát chung, Then hai đường cho cùng kết quả trúng/không trúng
  từng ca — cùng một bộ soát; và `sync-cloud` với danh sách tên rỗng dừng trước khi đẩy bảng (đóng chặt, như AC-5).
- AC-7: Given cloud mô phỏng (DB tạm như AU1), When (a) bảng người bán ở cloud có thêm cột ngoài danh sách cho phép (phạm vi
  bảng theo Hỏi-2), (b) cột ấy có ở LOCAL rồi `sync-cloud` thật chạy (đi qua bên ghi), (c) cloud có bảng `user_events` với một
  dòng, Then leak gate đỏ, lượt sync dừng trước khi tráo, bảng cloud không mang cột ấy sau lượt (b), dòng đỏ nêu `<bảng>.<cột>`
  ở (a)(b) và `user_events=1` ở (c); cloud sạch thì leak gate xanh (đối chứng dương).
- AC-8: Given `docs/ops/runtime-map.md` sau vòng, When người vận hành đọc mục cloud-sync, Then thấy: mọi đường lên cloud đi
  qua một bộ soát tầng A; dòng `FACTS CHẶN [tầng A] …` để tìm trong log và việc phải làm; leak gate nay đỏ khi có cột ngoài
  danh sách cho phép hoặc bảng tầng A có dòng; tên tài khoản thu theo Hỏi-1. (judgment)

- AC-9: Given Hỏi-1 = A (tên tài khoản thu gửi `null`), When trang `/ops/sources` dựng ở chế độ cloud với facts có
  `zaloAccounts[i].name = null`, Then hàng tài khoản hiện mã tài khoản thay tên, không lỗi, không chữ «null». (Hỏi-1 = C → bỏ AC.)
- AC-10: Given bản tin dựng từ log và cấu hình THẬT của máy thu (chế độ khô, không gửi), When chạy bộ soát, Then 0 chỗ trúng —
  bản tin hiện tại không bị chặn oan; đầu ra chỉ in đường JSON + mã S0x.

## Coverage

Quét hình thái (preset risk-premortem) — trục và thước CE:

- Trục đường ra: bản tin ops-facts (AC-1…AC-5) · sync bảng (AC-6, AC-7). [thước CE: hai lệnh duy nhất của
  `scripts/cloud-sync.sh` — sync-cloud, push-ops-facts]
- Trục kiểu rò: tên nguồn trong dòng log (AC-2) · tên nguồn ở trường mới (AC-3) · tên tài khoản thu (AC-4) · cột PII ngoài
  danh sách (AC-7a) · bảng tầng A (AC-7b). [thước CE: AGENTS.md luật 6 — liệt kê tầng A]
- Trục trạng thái bộ soát: có danh sách tên (AC-1…AC-4) · không có (AC-5 đóng chặt).
- Chân ngành: [NGÀNH: OWASP ASVS V8 Data Protection — kiểm dữ liệu nhạy cảm trước khi rời ranh giới tin cậy, fail-closed].

## Đường đo

- Ngưỡng «Cấy tên nguồn thật vào payload ops-facts …: lệnh đẩy dừng trước khi gửi» ← `cd pipeline && npm test`
  (AC-2, AC-3; đối chứng AC-1).
- Ngưỡng «… hoặc một cột: … leak gate đỏ khi cloud có cột PII ngoài danh sách cho phép» ← `cd pipeline && node
  scripts/check-cloud-sync.mjs pii-cot` (AC-7). Phạm vi «cột PII» theo Hỏi-2: (A) chỉ bảng có `CLOUD_ALLOW` (`sale_offers`,
  `sellers`, `properties`) + bảng tầng A có tên — PROXY, các bảng sync khác không có danh sách cột; (B) danh sách cột cho mọi
  bảng sync.

## Out of scope

- Đổi khoá JSON của bản tin (Hỏi-1 của ON7 — đo giá trị).
- Soát mẫu PII chung trong chữ tự do (SĐT, email) — định danh người bán là tầng C từ 23/10.
- Áp tay lên cloud prod — gate chạy ở lượt sync kế.
- Sửa plist launchd (làn ZCode).

## Notes

- `pipeline/push-ops-facts.mjs` (t3_paths) chung với ON22, ON2, ON4, ON5, AU12 — chạy liền nhau, không song song.
