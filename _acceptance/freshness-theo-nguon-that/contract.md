---
schema_version: 1
feature: check-freshness đo độ tươi theo bảng thật của từng nguồn, có SLO cho S05 và S06, không còn dòng quá hạn giả
slug: freshness-theo-nguon-that
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, docs]
status: draft
design_doc: docs/superpowers/specs/2026-10-23-freshness-theo-nguon-that-design.md
lo_trinh_ma: AU4
---

# Acceptance Contract: freshness-theo-nguon-that

## Context

Hàng AU4 (đợt `cam-mau-2310`). Audit 23/10 L5: `scripts/check-freshness.mjs` báo 8 dòng quá hạn, cả 8 giả; S05/S06
không có SLO. Đo lại 23/10 (design doc §1): 9 dòng, cả 9 giả — đọc mọi nguồn từ `airbnb_snapshots` (S02 không ghi
ở đó), không gộp nhiều source_id của cùng mã, ghép chéo mọi mã × mọi thành phố, S04 `completed` vẫn bị đo. Vòng
này: một module định nghĩa độ tươi (`scripts/lib/freshness.mjs`) đọc bảng thật của từng mã, SLO cho S05/S06, và
`check-freshness.mjs` dùng nó.

Source input: hàng AU4 `docs/plan/lo-trinh.json` + ô cơ hội `_acceptance/freshness-theo-nguon-that/opportunity.md`
(Mạnh «build duyệt» 23/10) + LUAT đợt `dot0-cam-mau`.

## Criteria

- AC-1: Given fixture (schema tạm `LIKE` bảng thật, trong giao dịch rollback) có S01 với hai source_id của S01 cùng thành phố — một snapshot cũ quá 8 ngày, một mới 1 ngày, When `readFreshness`, Then S01/<thành phố> `fresh` với `last` = snapshot mới (gộp max theo mã); chiều đỏ cùng fixture: dời snapshot mới thành 9 ngày → `stale`, thông điệp nêu `S01/<thành phố>`.
- AC-2: Given fixture S02 chỉ có hàng `airdna_markets` (captured_at 2 ngày, `country_code` vn) và KHÔNG có hàng S02 nào trong `airbnb_snapshots`, When `readFreshness`, Then đúng một hàng S02/vn `fresh` và không hàng S02 nào `none`; chiều đỏ: captured_at 36 ngày → S02/vn `stale`.
- AC-3: Given fixture `stg_zalo_posts` trong snapshot thuộc S03 có hàng `agent_id` ∈ `source_ids` của S05 (mới 2 giờ), hàng `agent_id` khác (mới 1 giờ) và hàng snapshot mock cũ 5 ngày, When `readFreshness`, Then S05/hanoi `fresh` từ đúng hàng S05, S03/hanoi `fresh` từ hàng S03 mới (hàng mock cũ không làm S03 quá hạn); chiều đỏ: hàng S05 thành 13 giờ → S05/hanoi `stale` trong khi S03/hanoi vẫn `fresh` (hai mã tách nhau).
- AC-4: Given fixture `stg_chotot_ads` ở hai snapshot hanoi và hcmc của S06 (10 giờ và 40 giờ), When `readFreshness`, Then S06/hanoi `fresh`, S06/hcmc `stale` (SLO S06 36 giờ) — thành phố lấy từ snapshot của chính hàng.
- AC-5: Given registry fixture có S04 `completed` (có hàng dữ liệu cũ) và một mã `active` không có trong bảng SLO (có hàng mới), When `readFreshness`, Then không hàng S04 nào; mã thiếu SLO ra `no-slo`; SLO đúng bảng S05 12 · S06 36 giờ và S01 · S02 · S03 theo đáp án Hỏi-1 (khuyến nghị 192 · 840 · 72 giờ = 8 · 35 · 3 ngày của ADR-0007) — ca ghim cả năm giá trị.
- AC-6: Given fixture S03 chỉ có dữ liệu Hà Nội và S01 có Hà Nội + TP.HCM, và một mã `active` không có hàng nào, When `readFreshness`, Then không hàng S03/hcmc nào (bỏ ghép chéo), S01 có đúng hai thành phố, mã không dữ liệu ra đúng một hàng `none`; chiều đỏ: bỏ hàng S01/hcmc khỏi fixture → S01 còn một hàng, không sinh `none` cho hcmc.
- AC-7: Given fixture dựng trong một schema tạm riêng của lượt chạy (`LIKE` bảng thật, xoá khi xong) và CLI thật `node scripts/check-freshness.mjs --schema <tạm>` chạy làm tiến trình con, When (a) mọi hàng `fresh`, (b) S05 `last` = now − 13 giờ với `--now` cố định, (c) có `none`/`no-slo`, Then (a) thoát 0; (b) thoát 1, dòng chữ của S05/hanoi ghi đúng tuổi `13` giờ và SLO `12` giờ, và `--json` có hàng `code` S05, `city` hanoi với `ageHours` 13, `sloHours` 12, `status` stale (cùng một hàng); (c) thoát 1; webhook trỏ máy chủ HTTP local nhận đúng một body chứa `S05/hanoi`; registry fixture mang `real_name` là chuỗi canh `REALNAME-CANARY` và `source_ids` canh — ca kiểm chuỗi canh CÓ trong registry trước, rồi đòi nó VẮNG trong stdout, stderr, `--json` và body webhook.
- AC-8: Given DB local hiện tại lúc chấm, When chạy CLI thật `node scripts/check-freshness.mjs --json` và bản chữ, Then cả hai thoát 1 và tập hàng `stale | none | no-slo` chỉ gồm S05/hanoi với `status` stale và `last` 2026-10-21T14:02 (±1 phút) — ca chẩn đoán in đủ mã, thành phố, status, `last` và giờ chấm, không chặn bộ test; tập lệch vì một nguồn thật đổi trạng thái thì ghi «ngoài hợp đồng» kèm hàng gây lệch.
- AC-9: Given `.claude/skills/ops-check/SKILL.md`, `CONTEXT.md` (mục «Độ tươi») và chú thích đầu `scripts/check-freshness.mjs`, When người vận hành đọc, Then biết mỗi mã đo ở bảng nào, SLO từng mã (kể cả S05/S06), S04 không đo vì đã xong, và lệnh `--json` — không câu nào còn nói mọi nguồn đọc từ bảng snapshot. (judgment)

## Coverage

Bỏ quét hình thái — xem dòng `bỏ coverage-scan` trong sổ. Không gian liệt bằng ma trận:

- Trục A — mã nguồn trong registry: S01 (AC-1) | S02 (AC-2) | S03 (AC-3) | S04 completed (AC-5) | S05 (AC-3) | S06 (AC-4)
  | mã mới chưa khai SLO (AC-5) [thước CE: 6 hàng `source_registry` hôm nay].
- Trục B — trạng thái một ô (mã, thành phố): tươi | quá hạn | chưa có dữ liệu | thiếu SLO — mỗi AC-1..AC-6 có cặp
  tươi/quá hạn, AC-5/AC-6 phủ `no-slo`/`none`.
- Trục C — lỗi giả đã đo 23/10: không gộp source_id (AC-1, AC-3) | sai bảng S02 (AC-2) | ghép chéo thành phố (AC-6) |
  đo mã completed (AC-5) [thước CE: 9 dòng giả ở design doc §1].
- Trục D — bề mặt: module (AC-1..AC-6) | script + exit + SPL (AC-7) | DB thật (AC-8) | tài liệu (AC-9).

## Đường đo

- «Trên DB hiện tại: chỉ S05 (đứng từ 21/10) báo quá hạn» · số từ ca chẩn đoán `AC-8` (chạy `check-freshness.mjs --json` trên DB local lúc chấm) · AC-8, đỡ bởi AC-1..AC-7

## Out of scope

- `/ops`, `/ops/collections`, `/api/v1/ops/coverage` dùng chung số SLO — AU6 (sau AU4); module mới là chỗ AU6 nối.
- Sửa ADR-0007 (thêm SLO S05/S06) — đề nghị trong design doc, chủ kho sửa ở commit riêng.
- Độ tươi theo phút của F4 (lát đầu), kênh cảnh báo mới ngoài webhook có sẵn.
- Sửa S05 đứng (402 khi khởi chạy actor) — làn ZCode.

## Notes

- Phép đo không đụng bảng thật của DB chung: hàng mẫu nằm trong schema tạm riêng của lượt chạy (giao dịch `ROLLBACK` cho ca module; schema `freshness_test_<pid>_<n>` đã commit cho ca CLI, `DROP SCHEMA … CASCADE` ở cuối ca).
- Cho tới AU6, `/ops` (app) và CLI giữ hai bảng SLO khác nhau (app: S01 36 · S02 36 · S03 2 giờ) — AU6 nối app vào module này.
