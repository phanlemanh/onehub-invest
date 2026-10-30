# Plan: bat-dieu-phoi-cap-du-an

Spec: `docs/superpowers/specs/2026-10-29-bat-dieu-phoi-cap-du-an-design.md` · hồ sơ `_acceptance/bat-dieu-phoi-cap-du-an/`.

## Task 1 — thước đo trước (independent: false)

- Files: `_acceptance/bat-dieu-phoi-cap-du-an/probes/settings.mjs`, `_acceptance/config.yaml` (+1 dòng
  `executors.script.bdp_settings`, giám sát duyệt P3-109)
- Hàm thuần: `kiemNoiDung(base, cur)` (AC-1), `kiemGoi(cur, base, manifest)` (AC-2), `kiemPhamVi(files, configDiff)`
  (AC-3); phần chạy đọc `git show 0103d246:.claude/settings.json`, tệp hiện tại, manifest marketplace (chỉ đọc), diff từ
  `merge-base(origin/main, HEAD)`; rồi chạy bảy bản phá AC-4 trên cùng các hàm. In `ok   …` / `FAIL …`, thoát 1 khi có FAIL.
- Verify: chạy thước TRƯỚC khi sửa settings → AC-1 đỏ «khoá dieu-phoi phải là true» (phá-thử chiều đỏ trên vật thật).
- Phục vụ: E1–E4

## Task 2 — bật gói (independent: false)

- Files: `.claude/settings.json`
- Thêm `"dieu-phoi@acceptance-gate-kit": true` ngay sau `road-map@acceptance-gate-kit`, giữ định dạng hai dấu cách.
- Verify: `node _acceptance/bat-dieu-phoi-cap-du-an/probes/settings.mjs` xanh cả bốn AC; `node -e` đọc JSON hợp lệ.
- Phục vụ: E1–E3
