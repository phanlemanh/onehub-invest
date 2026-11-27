# PB5 data-api-don-ten-nguon — kế hoạch

Spec: `docs/superpowers/specs/2026-11-25-data-api-don-ten-nguon-design.md` · Hồ sơ: `_acceptance/data-api-don-ten-nguon/`.

| # | Task | Files | Verify | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | Bộ quét theo cú pháp + danh sách định danh biết | `scripts/data-api-ten-nguon.mjs` | `node scripts/data-api-ten-nguon.mjs` (trên origin/main đỏ 52) | E5, E1 | false |
| 2 | Dọn 31 chú thích, 13 chuỗi mẫu, đổi tên 8 tệp | `data-api/db/**` | `node scripts/data-api-ten-nguon.mjs` thoát 0 | E1, E5 | false |
| 3 | Test thước + ca phá + lược đồ mẫu | `scripts/data-api-ten-nguon.test.mjs`, `scripts/data-api-ten-nguon-db.sh` | `node --test scripts/data-api-ten-nguon.test.mjs`; `bash scripts/data-api-ten-nguon-db.sh` | E1–E4 | false |
| 4 | Khoá lệnh trong config | `_acceptance/config.yaml` | s4-args sinh được | E1–E5 | false |

Thứ tự thật: task 1–3 làm trước khi hồ sơ có contract (sổ: dòng `fix` stage S3); mọi số trong contract đo lại sau đó.
