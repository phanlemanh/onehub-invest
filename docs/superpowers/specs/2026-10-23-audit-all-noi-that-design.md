# audit-all nói thật (AU5 · `audit-all-noi-that`) — thiết kế

Hàng AU5 (`docs/plan/lo-trinh.json`, đợt `cam-mau-2310`, T2). Câu giao: «audit-all không còn PASS giả ở backup và
membership S03, và kiểm các trang /ops ở đúng cổng :3456». Ngưỡng (ô cơ hội): «Khi chưa có job backup: mục backup
FAIL». Gốc: audit 23/10 L6 — 28 PASS · 6 FAIL · 2 LIMITED; 2 PASS giả, 4 FAIL giả.

## 1. Vì sao PASS giả / FAIL giả (đọc `scripts/audit-all.sh` 23/10)

| Mục | Dòng | Lỗi |
|---|---|---|
| Backup | `BACKUP_INSTALLED=$(launchctl list … \| grep -c "oneinvest.backup" \|\| echo 0)` rồi `[ "$X" -eq 0 ] && limit … \|\| pass` | Không khớp → `grep -c` in `0` **và** thoát 1 → `\|\| echo 0` in thêm `0` → biến = `"0\n0"` → `[ -eq ]` lỗi cú pháp (false) → rơi xuống `\|\| pass`. Hôm nay 0 job backup (launchctl 23/10) mà báo PASS |
| Membership S03 | `DL3_MEMBER=$(openclaw … \| grep -c "<id nhóm>" \|\| echo 0)` cùng khuôn | CLI lỗi hay không còn trong nhóm đều ra `"0\n0"` → PASS |
| Đếm gate | `GATE_PASS/SKIP=$(grep -c … \|\| echo 0)` | log vắng → in `0\n0` vào dòng chữ |
| Trang `/ops` | `curl … http://localhost:3000$page` | app chạy `:3456` (CLAUDE.md) → 4 FAIL giả; và 307 (bị chuyển về đăng nhập vì cookie giả) được tính PASS — trang thật không được kiểm |
| `ROOT` | `ROOT="/Users/manhphan/dev/one-invest"` | viết cứng — chạy từ worktree đọc log của checkout chính |

## 2. Thiết kế

1. **Bộ đếm an toàn** `count_matches <mẫu> [tệp]` (đọc stdin khi vắng tệp): luôn in đúng MỘT số nguyên, 0 khi không
   khớp hay tệp vắng. Thay mọi `grep -c … || echo 0`.
2. **Backup** (ngưỡng): không có job `oneinvest.backup` trong `launchctl list` → **FAIL** «Backup tuần CHƯA cài»; có job
   mã ≠ 0 → FAIL kèm mã; có job mã 0 → đọc `BACKUP_DIR` trong `$HOME/Library/LaunchAgents/com.oneinvest.backup.plist`
   (install-cron.sh ghi bằng PlistBuddy): vắng → FAIL «chưa đặt BACKUP_DIR» (backup.sh thoát 0 mà không sao lưu); có mà
   không `db-*.sql.gz` nào ≤ 8 ngày (RPO 7 ngày ADR-0007 + 1) → FAIL; có → PASS kèm tên tệp.
3. **Membership S03**: CLI OpenClaw không chạy được → LIMITED «không kiểm được»; còn trong nhóm → PASS; không còn →
   LIMITED (giữ ý cũ «bị kick/rời nhóm»). Không đường nào ra PASS khi chưa thấy id nhóm.
4. **Trang `/ops`**: gốc `OPS_BASE_URL` (mặc định `http://localhost:3456`); 200 → PASS · 307/302 → LIMITED «chỉ thấy
   trang sống, chưa đăng nhập» · khác → FAIL. **Hỏi-1** cho Mạnh: (A, khuyên) giữ audit chỉ đọc — 307 LIMITED, trỏ
   `scripts/dev-ops-login-check.sh` để kiểm sau đăng nhập; (B) audit tự đăng nhập bằng tài khoản ops thử
   (`dev-ops-account.mjs` GHI vào DB) rồi đòi 200.
5. **`ROOT`** suy từ vị trí script.
6. Các mục khác giữ nguyên (không mở rộng phạm vi).

## 3. Phép đo — `scripts/audit-all.test.mjs`

Chạy NGUYÊN `scripts/audit-all.sh` trong cây tạm: PATH CHỈ gồm thư mục bản giả (`docker`, `curl`, `launchctl`,
`security`) + `/usr/bin:/bin`, `HOME` tạm (OpenClaw CLI giả ở `~/.openclaw/bin/openclaw` khi ca cần); mọi bản giả ghi
nhật ký lời gọi. Fixture `launchctl` phát lại bản chụp THẬT `scripts/fixtures/launchctl-list-2026-10-23.txt` (dòng
backup sinh bằng thay nhãn trên dòng thật); đầu ra OpenClaw dựng tay (không chạy CLI thật — an toàn Zalo). `curl` giả ghi mọi URL và trả mã theo ca — không lời gọi mạng
thật nào (ca kiểm `curl` thật không bị gọi). Ma trận viết trước: backup {vắng, có+0, có+1} × dòng mong đợi; membership
{CLI vắng, có id, không id}; `/ops` {200, 307, 500} × 4 trang + cổng; bộ đếm {tệp vắng, 0 khớp, 3 khớp}. Chiều đỏ: bản
sao script giữ khuôn `|| echo 0` cũ → ca backup ra PASS → ca đỏ có tên.

## 4. Ngoài phạm vi

Cài job backup + chọn `BACKUP_DIR` thật (audit Q6 của Mạnh) · các mục khác của audit-all (B1, F, G luôn PASS) · cổng `/ops` dùng
chung số (AU6).

## Đặc tả UX

Không chạm UI — bỏ (sổ: «bỏ đặc-tả-UX»).
