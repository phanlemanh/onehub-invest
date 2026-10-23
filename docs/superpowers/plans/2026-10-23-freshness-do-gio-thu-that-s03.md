# Kế hoạch — freshness-do-gio-thu-that-s03 (T2, làn V)

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| Nguồn ngừng thu mà bị nạp lại bản cũ nay báo quá hạn | `scripts/lib/freshness.mjs` (S03/S05/S06 → `airbnb_snapshots.collected_at`, xuất `TIME_SOURCE`) | AC-1…AC-3 (giờ thu) |
| Phép đo phủ biên SLO, ma trận mã → cột, importer thật | `scripts/check-freshness.test.mjs` | AC-1, AC-4, AC-5, AC-8 |
| Người vận hành biết mọi mã tính theo giờ thu | chú thích `scripts/check-freshness.mjs`, `.claude/skills/ops-check/SKILL.md` | AC-7 |

T1 module · T2 phép đo (fixture AU4 dời mốc sang snapshot) · T3 tài liệu — tuần tự, cùng tệp test. Verify:
`node --test scripts/*.test.mjs`; phá thử: trả probe về `captured_at` → các ca GT đỏ; bản sao probe S06 → GT-AC-8 đỏ nêu S06.
