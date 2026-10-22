# Bằng chứng máy chạy trước (chưa phải evidence-report — hợp đồng còn `draft`, chờ Cổng 1)

Chạy 2026-10-22, app `npm run dev -p 3456` từ worktree nhánh `fix/ops-access-hardening`,
DB local :5433, `OPS_EMAILS` không đặt.

| File | Lệnh | Kết quả |
|---|---|---|
| `static-new.txt` | `node scripts/check-portal-compliance.mjs` | exit 0, ĐẠT |
| `smoke-new.txt` | `BASE_URL=http://localhost:3456 node scripts/smoke-portal-compliance.mjs` | exit 0, 29/29 ĐẠT |
| `smoke-baseline-HEAD.txt` | cùng smoke, với 3 file app tạm trả về `19ada71` (trước bản vá) | 9 FAIL — smoke bắt được đúng hai lỗ |

Đáng chú ý ở baseline: admin đọc được `~/.openclaw/openclaw.json` (200) và ảnh ở
`/tmp/openclaw-evil-*` (200); user thường vào `/ops`, `/ops/deals` và API ops (200).
