# Thiết kế — s05-slo-theo-lich

Căn cứ: `docs/plan/danh-gia-observability-s05-2510.md` §4 C1 + §5 P3; giám sát P4-36 (Cổng Đáng `build`, hạn merge trước 6/11).

## Vấn đề

`SLO_HOURS.S05 = 12` ở hai bản chép định nghĩa độ tươi: `scripts/lib/freshness.mjs` (CLI `check-freshness`, AU4) và
`app/src/lib/freshness.ts` (`/ops`, `/ops/collections`, API — AU6). Từ 7/11 S05 thu 2 lượt/tuần (thứ Ba + thứ Sáu 06:00):
khoảng cách dài nhất giữa hai lượt là thứ Sáu → thứ Ba = 96 giờ, nên với SLO 12 giờ S05 đỏ gần như cả tuần.

## Cách làm

- `S05: 12` → `S05: 96` ở cả hai bản; chú thích ghi «S05 = 96 giờ: lịch 2 lượt/tuần, khoảng dài nhất thứ Sáu → thứ Ba».
  Các mã khác giữ nguyên.
- `scripts/check-freshness.test.mjs` ca «AC-5 bảng SLO đúng năm giá trị giờ» ghim bảng — sửa giá trị S05 theo; ma trận biên
  GT-AC-4 tự lấy `SLO_HOURS` nên tự đổi biên (96/97).
- Không đổi luật so (`ageHours <= sloHours` → fresh) hay probe.

## Phép đo

`scripts/s05-slo.test.mjs` (client giả, không DB — khuôn `scripts/freshness-parity.test.mjs`): gọi `readFreshness` THẬT của cả
hai bản; quét từng giờ trong hai tuần theo lịch thứ Ba + thứ Sáu 06:00 → S05 luôn `fresh`; biên 96 → fresh, 97 → stale.
Đối chứng: bản sao `freshness.mjs` giữ SLO 12 đỏ ở phần lớn các giờ của cùng lịch. Hồi quy: `freshness-parity.test.mjs` (AU6)
và `check-freshness.test.mjs` (AU4, cần DB local — chỉ đọc trong giao dịch của chính test).

## Không làm

- `source_registry` S05 `paused → active` (việc ngày 7/11, phiên liên làn).
- Plist lịch 2 lượt/tuần (làn ZCode, P2).
- SLO theo lịch động (đọc plist) — một hằng là đủ cho lịch cố định.
