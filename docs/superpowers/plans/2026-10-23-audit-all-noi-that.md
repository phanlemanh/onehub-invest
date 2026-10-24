# Kế hoạch thi công — audit-all-noi-that (AU5, T2)

Hợp đồng: `_acceptance/audit-all-noi-that/contract.md` (duyệt 23/10, Hỏi-1 = A). Thiết kế:
`docs/superpowers/specs/2026-10-23-audit-all-noi-that-design.md`.

1. **Test trước** — `scripts/audit-all.test.mjs`: hộp giả (PATH = thư mục bản giả + `/usr/bin:/bin`, `HOME` tạm, env
   tối thiểu); bản giả `docker` (in một số cho mọi truy vấn), `curl` (ghi URL, trả mã theo ca), `launchctl` (phát lại
   `scripts/fixtures/launchctl-list-2026-10-23.txt` + dòng backup sinh từ dòng thật), `security` (không có khoá),
   `openclaw` ở `$HOME/.openclaw/bin` khi ca cần. Ca `AA-AC-1`…`AA-AC-6`; chiều đỏ = bản sao script thay khối backup
   bằng khuôn `|| echo 0` cũ. Chạy → đỏ trên script cũ.
2. **Script** — `scripts/audit-all.sh`: `ROOT` suy từ vị trí script; hàm `count_matches`; thay mọi `grep -c`; khối backup
   (vắng → FAIL · mã ≠ 0 → FAIL · plist không `BACKUP_DIR` → FAIL · không `db-*.sql.gz` ≤ 8 ngày → FAIL · có → PASS kèm
   tên tệp) giữa hai dấu `# --- backup (AU5) ---` / `# --- hết backup ---`; membership (CLI vắng/lỗi → LIMITED · có id →
   PASS · không id → LIMITED); `/ops` ở `OPS_BASE_URL` (mặc định `:3456`), 200 PASS · 302/307 LIMITED trỏ
   `scripts/dev-ops-login-check.sh` · khác FAIL.
3. **Tài liệu** — `.claude/skills/ops-check/SKILL.md` bước 2 (AC-7).
4. `/verify` (module scripts) → contract `implemented` → S4.
