# Plan: don-clone-tam-design-floor

Spec: `docs/superpowers/specs/2026-10-29-don-clone-tam-design-floor-design.md` · hồ sơ `_acceptance/don-clone-tam-design-floor/`.

## Task 1 — hàm tempDir và bốn chỗ tạo (independent: false)

- Files: `scripts/design-floor/test-helpers.mjs`, `scripts/design-floor/fresh-sau-gop.test.mjs`,
  `scripts/design-floor/reuse-plan.test.mjs`
- `tempDir(prefix)` (khoanh dấu mốc `<<<TEMPDIR-MIEN` … `TEMPDIR-MIEN>>>`): `mkdtempSync` trong `tmpdir()`, ghi vào tập,
  lần đầu đăng ký `process.once('exit')` xoá cả tập; `DESIGN_FLOOR_TMP_LOG` bật thì nối đường vào tệp nhật ký.
  `copyRepo`, `soCapConfig`, `cloneWithConfigKey`, `WORK` của reuse-plan đổi sang `tempDir`; thư mục `plan-*` trong `WORK`
  tạo bằng `mkdirSync` với số đếm.
- Verify: `node --test scripts/design-floor/*.test.mjs` xanh; đếm thư mục tạm trước/sau một lượt.
- Phục vụ: E1, E3, E4

## Task 2 — tệp đo tmp-sach.test.mjs (independent: false)

- Files: `scripts/design-floor/tmp-sach.test.mjs`
- Ca AC-1 (bỏ qua khi `TMP_SACH_NESTED`), ca AC-2 (clone ở `89730e6b`), ca AC-3 (ném giữa chừng + đối chứng
  `mkdtempSync` trần trong vùng miễn `<<<RAW-MKDTEMP-DOI-CHUNG`), ca AC-4 (quét + hai cặp đỏ), ca AC-5 (không hạ thước +
  cặp đỏ).
- Verify: `node --test scripts/design-floor/tmp-sach.test.mjs`; phá-thử: tạm bỏ đăng ký `exit` trong `tempDir` → ca AC-1
  và AC-3 đỏ.
- Phục vụ: E1–E5
