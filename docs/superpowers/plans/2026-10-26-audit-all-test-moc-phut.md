# Kế hoạch: audit-all-test-moc-phut

Hồ sơ: `_acceptance/audit-all-test-moc-phut/` · design: `docs/superpowers/specs/2026-10-26-audit-all-test-moc-phut-design.md`

## Task 1 — bản giả `date` + ca canh MP-AC-1

- **Files:** `scripts/audit-all.test.mjs`
- **Việc:**
  1. Hằng `MOC_GHIM = "2026-10-23 09:00"`.
  2. Thêm khoá `date` (một dòng) vào `FAKES`: ghi `date $*` vào `$FAKE_LOG`; đúng một đối số `+%Y-%m-%d %H:%M` → in
     `MOC_GHIM`; còn lại → `PATH=/usr/bin:/bin exec date "$@"`.
  3. Ca canh `MP-AC-1` trong `describe` riêng: dòng tiêu đề bằng « AUDIT TOÀN DIỆN ONE INVEST — <MOC_GHIM>» (thông điệp
     «dòng tiêu đề phải mang mốc ghim»); nhật ký có `date +%Y-%m-%d %H:%M` («nhật ký lời gọi phải có date»); gọi
     `<bin>/date +%s` lệch giờ thật dưới 5 giây («date giả phải chuyển định dạng khác cho date thật»).
  4. Không đổi assert của ca nào khác.
- **Verify per-task:** `node --test scripts/audit-all.test.mjs` xanh; chạy bốn đầu dò của hồ sơ (gồm lượt phá-thử ba
  đột biến và đối chứng date nhảy phút).
- **Phục vụ:** E1, E2, E3, E4
- **independent:** false (task duy nhất)
