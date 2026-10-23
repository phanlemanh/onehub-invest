# Kế hoạch — freshness-theo-nguon-that (AU4, T2)

Contract: `_acceptance/freshness-theo-nguon-that/contract.md` (duyệt 23/10, Hỏi-1 A). Mọi task chung một tệp test → tuần tự.

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| Độ tươi từng nguồn đọc đúng bảng nạp thật của nó | `scripts/lib/freshness.mjs` (mới) | AC-1…AC-6 (đo đúng bảng) |
| Lệnh kiểm chỉ báo nguồn thật sự đứng, thoát lỗi đúng lúc, không lộ tên nguồn | `scripts/check-freshness.mjs` | AC-7, AC-8 (lệnh chạy thật) |
| Người vận hành biết ngưỡng và bảng của từng nguồn | `.claude/skills/ops-check/SKILL.md`, chú thích đầu script | AC-9 (tài liệu) |

## T1 — module độ tươi
- Files: `scripts/lib/freshness.mjs`, `scripts/check-freshness.test.mjs` (ca AC-1…AC-6, schema tạm trong giao dịch ROLLBACK).
- Verify: `node --test scripts/check-freshness.test.mjs`; phá thử: bỏ gộp max / đổi bảng S02 → ca đỏ có tên mã.
- Phục vụ E1–E6. `independent: false`.

## T2 — vỏ CLI
- Files: `scripts/check-freshness.mjs` (`runCheck`, `--json`, `--now`, `--schema`), test AC-7 (tiến trình con trên schema tạm đã commit, webhook HTTP local, chuỗi canh) + AC-8 (chẩn đoán DB thật).
- Verify: cùng lệnh; phá thử: vỏ CLI thoát 0 bất kể → ca AC-7 thoát-1 đỏ.
- Phục vụ E7, E8. `independent: false`.

## T3 — tài liệu
- Files: `.claude/skills/ops-check/SKILL.md`, chú thích đầu `scripts/check-freshness.mjs`. `CONTEXT.md` không sửa (sinh từ `terms.mjs` của hồ sơ glossary-context đã ký; câu hiện có vẫn đúng).
- Phục vụ E9. `independent: false`.
