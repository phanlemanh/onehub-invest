# s03-cho-vay-khong-phai-bds — Implementation Plan

**Goal:** «<số> năm/nữ/nét» không còn là dấu hiệu BĐS «<số>n»; viết tắt phòng ngủ thật vẫn nhận.

**Spec:** `docs/superpowers/specs/2026-10-31-s03-cho-vay-khong-phai-bds-design.md` · hợp đồng AC-1..3 (làn V, 31/10).

### Task 1: Nhánh «<số>n» của DAU_HIEU_BDS + ma trận CV-AC-1/2 (independent: false)

**Files:** Modify `pipeline/transform-zalo.mjs` (một nhánh regex); Modify `pipeline/scripts/transform-zalo-loai-tin.test.mjs`.
**Phục vụ:** E1, E2, E3. **Verify:** `cd pipeline && node --test scripts/transform-zalo-loai-tin.test.mjs && npm test`.

- [ ] Viết ô CV-AC-1 (4 ô, so bản chép giữ ranh giới từ cũ) + CV-AC-2 (8 ô) + hai chiều đỏ; chạy → đỏ; sửa nhánh; chạy → xanh; commit.
