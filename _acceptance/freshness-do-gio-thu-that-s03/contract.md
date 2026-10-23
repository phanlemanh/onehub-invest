---
schema_version: 1
feature: check-freshness đo S03/S05/S06 theo giờ THU thật của snapshot thay vì giờ NẠP — nguồn ngừng thu mà bị nạp lại bản cũ phải báo quá hạn
slug: freshness-do-gio-thu-that-s03
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, docs]
status: signed-off
design_doc: docs/superpowers/specs/2026-10-23-freshness-do-gio-thu-that-s03-design.md
veto_state: mo
veto_opened_at: 2026-10-23T12:22:00Z
approved_by:
---

# Acceptance Contract: freshness-do-gio-thu-that-s03

## Context

Ngoài-3 của AU4 `freshness-theo-nguon-that` (Mạnh chọn «mở hợp đồng mới», Cổng Bằng chứng 23/10; giám sát duyệt hàng
`P3-13`). AU4 đo S03/S05/S06 bằng `captured_at` của bảng nạp — cột importer ghi `now()` mỗi lần upsert (giờ NẠP), nên
nguồn ngừng thu mà bị nạp lại bản cũ vẫn báo tươi. Vòng này đổi ba mã sang `airbnb_snapshots.collected_at` (giờ THU)
và gom Ngoài-5, Ngoài-6 của AU4 (phép đo thiếu đối chứng / thiếu ô quá hạn). Nhánh nối tiếp nhánh AU4 (PR #38).

## Criteria

- AC-1: Given schema tạm và importer THẬT `pipeline/import-chotot.mjs` nạp một snapshot S06 (manifest `finishedAt` 40 giờ trước, item `fetchedAt` cũng 40 giờ) rồi nạp LẠI chính snapshot ấy (upsert ghi `captured_at = now()`), When `readFreshness`, Then S06/<thành phố> `stale` với `last` = `finishedAt` dù `captured_at` vừa thành giờ nạp; đối chứng dương cùng bàn: nạp tiếp snapshot thứ hai cùng `list_id` có `finishedAt` 10 giờ trước → `fresh`, `last` = `finishedAt` mới.
- AC-2: Given fixture S03 và S05 có hàng `stg_zalo_posts` mới nạp (1 giờ) thuộc snapshot thu quá SLO (S03 80 giờ, S05 13 giờ) — đúng ngữ nghĩa upsert Zalo (`pipeline/import-airbnb.mjs`: `ON CONFLICT (post_id) DO UPDATE SET text = …, captured_at = now()` KHÔNG đổi `snapshot_id`, nên bài giữ snapshot lần đầu thấy), When `readFreshness`, Then S03/hanoi và S05/hanoi đều `stale` với `last` = `collected_at`; đối chứng dương: snapshot thu trong SLO → `fresh`.
- AC-3: Given fixture có hàng S03 trong snapshot thu 80 giờ trước và hàng S05 trong snapshot thu 1 giờ trước, When `readFreshness`, Then S03/hanoi `stale` và S05/hanoi `fresh` — mốc của S05 không làm S03 trông tươi; chiều ngược: S03 mới, S05 cũ → S03 `fresh`, S05 `stale`.
- AC-4: Given ma trận viết trước 5 mã có SLO (S01, S02, S03, S05, S06) × {tuổi = SLO, tuổi = SLO + 1 giờ}, When `readFreshness` với `now` cố định, Then tuổi = SLO → `fresh`, SLO + 1 → `stale` cho từng mã; ca đếm khẳng định đủ 10 ca.
- AC-5: Given fixture S01 có hanoi thu 1 ngày và hcmc thu 9 ngày, và S04 `completed` có snapshot thu 200 ngày, When `readFreshness`, Then S01/hanoi `fresh` và S01/hcmc `stale` cùng lúc, không hàng S04 nào.
- AC-6: Given DB local lúc chấm, When chạy CLI thật `check-freshness.mjs --json` và bản chữ, Then cả hai thoát 1, tập lỗi chỉ S05/hanoi `stale` với `last` 2026-10-21T11:00Z (UTC, = 18:00 +07; ±1 phút, giờ thu) — ca chẩn đoán riêng `GT-AC-6` in mã thoát, tập lỗi, `last`, giờ chấm, và cho mỗi mã S03/S05/S06: max `captured_at` (giờ nạp), max `collected_at` (giờ thu) và số hàng stg không khớp snapshot; chỉ được xếp «nguồn thật đổi trạng thái» khi max `collected_at` của S05 khác 2026-10-21T11:00Z.
- AC-7: Given chú thích đầu `scripts/check-freshness.mjs` và mục độ tươi của `.claude/skills/ops-check/SKILL.md`, When người vận hành đọc, Then biết mọi mã tính tuổi theo giờ THU (S01/S03/S05/S06 từ `airbnb_snapshots.collected_at`, S02 từ `airdna_markets.captured_at` = giờ tải), không câu nào nói S03/S05/S06 đo cột nạp của bảng stg. (judgment)

- AC-8: Given ma trận viết trước mã → cột thời gian (S01 `airbnb_snapshots.collected_at` · S02 `airdna_markets.captured_at` · S03, S05, S06 `airbnb_snapshots.collected_at`), When đọc khai báo `TIME_SOURCE` mà `scripts/lib/freshness.mjs` xuất và câu SQL của từng probe, Then khai báo bằng đúng ma trận, mọi mã có SLO đều có mặt (mã thiếu → đỏ có tên), và câu SQL của mỗi probe lấy `max(` đúng cột ấy; chiều đỏ cùng bộ đo: bản sao module đổi một probe về `captured_at` của bảng stg → ca đỏ nêu tên mã.

## Coverage

Bỏ quét hình thái — thay bằng ma trận mã → cột thời gian đo máy ở AC-8 (dòng sổ thay d-3). Ma trận:

- Trục A — mã có cột thời gian khác nghĩa: S03 (AC-2, AC-3) | S05 (AC-2, AC-3) | S06 (AC-1) | S01, S02 đúng sẵn
  (AC-4 biên) [thước CE: bảng §1 design doc — ai ghi cột nào].
- Trục B — quan hệ giờ nạp / giờ thu: nạp mới + thu cũ (AC-1, AC-2) | cả hai mới (đối chứng dương AC-1, AC-2) |
  hai mã chung ống (AC-3).
- Trục C — biên SLO: tuổi = SLO | SLO + 1 cho cả 5 mã (AC-4) | theo thành phố + mã completed (AC-5).
- Trục D — bề mặt: DB thật (AC-6) | tài liệu (AC-7).

## Đường đo

- «snapshot cũ bị nạp lại có làm nguồn báo quá hạn không» · số từ ca GT-AC-1 (importer thật) / GT-AC-2 của `node --test scripts/check-freshness.test.mjs` · AC-1, AC-2
- ngưỡng CHẾT «còn một mã nào tính tuổi theo giờ nạp» · số từ ca GT-AC-8 (ma trận mã → cột, đối chiếu probe thật) · AC-8
- «trên DB hiện tại vẫn chỉ S05 quá hạn» · số từ ca chẩn đoán AC-6 · AC-6

## Out of scope

- `/ops`, `/ops/collections` dùng chung số — AU6.
- Đổi importer để `captured_at` giữ giờ thu — làn ZCode và không cần (snapshot đã mang giờ thu).
- Ngoài-1, Ngoài-2, Ngoài-4 của AU4 — Known limits đã ký.

## Notes

- Fixture cùng khuôn AU4: `LIKE` bảng thật trong schema tạm, không đụng bảng thật. Importer thật (AC-1) chạy với `DATABASE_URL` mang `options=-c search_path=<schema tạm>`.
- Zalo: chưa round-trip bằng `import-airbnb.mjs` thật (nhiều loại item + media); AC-2 dựng fixture theo đúng dòng upsert đã trích.
- Known limits — chọn ở Cổng Bằng chứng 2026-10-23:
  - Ngoài-1: con số «lệch-snapshot» trong dòng chẩn đoán luôn bằng 0 (cơ sở dữ liệu không cho trường hợp đó xảy ra) — không phải một phép kiểm thật.
  - Ngoài-4: ca chẩn đoán trên DB thật chỉ in số để người chấm đối chiếu, máy không tự báo đỏ khi chúng lệch.
  - Ngoài-5: ca nạp lại bài Zalo dựng bằng dữ liệu viết tay theo luật nạp đã trích, chưa chạy importer Zalo thật.
- Ngoài-3 (S03/S05 mốc theo snapshot đầu tiên thấy bài — có thể báo quá hạn giả khi nguồn chỉ ra bài đã có) — Mạnh chọn mở hợp đồng mới ở Cổng Bằng chứng 23/10.
