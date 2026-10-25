---
schema_version: 1
feature: "check-freshness và /ops đo S05 theo nhịp 2 lượt/tuần: SLO_HOURS.S05 = 96 giờ ở cả hai bản chép, giữ parity với /ops"
slug: s05-slo-theo-lich
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: signed-off
veto_state: mo
veto_opened_at: 2026-10-25T07:04:29Z
design_doc: docs/superpowers/specs/2026-10-25-s05-slo-theo-lich-design.md
approved_by:
approved_at:
---

# Acceptance Contract: s05-slo-theo-lich

## Context

Từ 7/11 S05 thu 2 lượt/tuần (thứ Ba + thứ Sáu 06:00); SLO 12 giờ hiện hành làm S05 đỏ gần như cả tuần trên
`check-freshness` và `/ops`. Vòng này nâng `SLO_HOURS.S05` lên 96 giờ (khoảng dài nhất thứ Sáu → thứ Ba) ở cả hai bản chép
định nghĩa độ tươi. Cổng Đáng `build`: giám sát đợt `dot0-cam-mau` (P4-36), căn cứ
`docs/plan/danh-gia-observability-s05-2510.md` §4 C1 + §5 P3; hạn merge trước 6/11.

Probe S05 đọc `airbnb_snapshots.collected_at` lớn nhất của snapshot chứa bài S05; tuổi tính bằng giờ làm tròn xuống, xanh khi
tuổi ≤ SLO. Với SLO 96 không đệm: lượt thứ Ba có mốc thu muộn hơn lượt thứ Sáu trước đó dưới 1 giờ vẫn xanh; muộn từ 1 giờ
trở lên thì S05 đỏ tới lượt kế — đó là cảnh báo thật về lượt trễ. Đường `/ops` trên cloud nhận trạng thái qua
`pipeline/push-ops-facts.mjs`, vốn gọi `readFreshness` của bản CLI.

Source input: `_acceptance/s05-slo-theo-lich/opportunity.md`.

## Criteria

- AC-1: Given hai bản chép định nghĩa độ tươi (`scripts/lib/freshness.mjs`, `app/src/lib/freshness.ts`), When đọc
  `SLO_HOURS`, Then cả hai ghi S05 = 96 và các mã khác giữ nguyên S01 192 · S02 840 · S03 72 · S06 36.
- AC-2: Given lịch S05 2 lượt/tuần thứ Ba + thứ Sáu 06:00 chạy đúng, When quét từng giờ trong hai tuần sau lượt đầu bằng
  `readFreshness` thật của cả hai bản trên client giả, Then S05 luôn `fresh`; đối chứng: bản sao giữ SLO 12 ra `stale` ở ít
  nhất một nửa số giờ của cùng lịch.
- AC-3: Given lượt thu S05 gần nhất cách 96 giờ / 96 giờ 59 phút / 97 giờ, When `readFreshness` của cả hai bản đọc, Then
  lần lượt `fresh` / `fresh` / `stale`; chữ của hàng 97 giờ: CLI ghi «quá hạn — 97 giờ (SLO 96 giờ)», `/ops` ghi «trễ 1 giờ»
  và SLO hiện là «4 ngày».
- AC-4: Given phép đo parity AU6 (`scripts/freshness-parity.test.mjs`), When chạy lại, Then xanh (hai bản khớp hằng, SQL và
  đầu ra).
- AC-5: Given phép đo `scripts/check-freshness.test.mjs` (AU4, DB local), When chạy lại, Then xanh — ca bảng SLO ghim giá trị
  mới và ma trận biên GT-AC-4 đi qua biên 96/97 của S05.

- AC-6: Given cây mã app, scripts, pipeline, data-api, agent (trừ tệp test), When quét nơi ghi SLO S05, Then chỉ còn hai bản
  chép ghi `S05: 96`, không nơi nào ghi `S05: 12`, và `pipeline/push-ops-facts.mjs` lấy `readFreshness` từ bản CLI.

## Coverage

Bỏ quét morphological-scan — xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Trục liệt tay:

- Trục A — hai bản chép: CLI · app · nơi thứ ba (cloud qua ops facts) → AC-1, AC-4, AC-6
- Trục B — tuổi S05: trong lịch (0–96) · biên 96/97 · bản cũ SLO 12 → AC-2, AC-3
- Trục C — hồi quy phép đo AU4 → AC-5
- Later: SLO đọc theo lịch động.
- Never: đổi luật so tuổi hay probe của mã khác.

## Đường đo

- Thước: «lịch đúng thì luôn xanh, quá 96 giờ thì quá hạn, hai bản khớp» (SỐNG của ô cơ hội) · số từ:
  `scripts/s05-slo.test.mjs` + `scripts/freshness-parity.test.mjs` · bảo đảm bởi: AC-2, AC-3, AC-4
- CHẾT = một giờ trong lịch đúng ra `stale`, hoặc parity lệch, ở lượt chấm cuối của vòng (timebox: trước 6/11).

## Out of scope

- `source_registry` S05 `paused → active` (ngày 7/11, phiên liên làn).
- Plist lịch 2 lượt/tuần (làn ZCode).
- SLO đọc theo lịch động.

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-10-25:
  - Ngoài-1: Phép quét «không nơi thứ ba ghi SLO S05» chưa bắt dạng chữ «S05 = N giờ» (và «<=», «12h»); hiện không có chỗ nào ghi sai.
  - Ngoài-2: Nếu máy chấm không có DB local, phép đo check-freshness vẫn báo xanh mà các ca quanh mốc 96/97 giờ không chạy.
