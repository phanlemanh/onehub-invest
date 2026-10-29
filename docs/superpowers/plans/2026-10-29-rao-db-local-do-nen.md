# Kế hoạch — rao-db-local-do-nen

Hợp đồng: `_acceptance/rao-db-local-do-nen/contract.md` (T2, chốt làn V 29/10). Thiết kế:
`docs/superpowers/specs/2026-10-29-rao-db-local-do-nen-design.md`.

| # | Task | Tệp | Kiểm per-task | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | Đầu dò rào: ba ca ngoài máy, ba ca local, soát thứ tự (bỏ comment), hai bản chép đột biến | `_acceptance/rao-db-local-do-nen/probes/rao.mjs` | chạy trên do.mjs CHƯA có rào → đỏ «KHONG CHAN» (chiều đỏ trước khi sửa) | E1, E2, E3 | false |
| 2 | Thêm rào: import `assertLocalDatabaseUrl`, gọi ngay sau dòng đọc `DB_URL` | `scripts/do-nen-hieu-nang/do.mjs` | `node _acceptance/rao-db-local-do-nen/probes/rao.mjs` → «RAO OK» | E1, E2, E3 | false (sau 1) |
| 3 | Đầu dò phạm vi + lưới trước-gộp của do-nen-hieu-nang | `_acceptance/rao-db-local-do-nen/probes/pham-vi.sh` | chạy sau task 4 → «PHAM-VI OK» | E5 | false |
| 4 | Ghim lại do-nen-hieu-nang bằng làn máy (đo 5 trang trên build hiện tại) | `_acceptance/do-nen-hieu-nang/{run-log.jsonl,evidence-report.md}` (máy ghi) | `repin-lane.mjs --slug do-nen-hieu-nang --write` xanh | E4, E5 | false (sau 2) |

Thứ tự: 1 → 2 → 4 → 3. Đầu dò viết trước để thấy đỏ trên mã cũ, rồi mới thêm rào.
