# s4-suite-theo-vung · kế hoạch thi công

**Goal:** Lượt chấm S4 / ghim lại chỉ chạy suite có vùng bị nhánh đổi; một lệnh dựng worktree chấm đủ tệp gitignored.

**Spec:** `docs/superpowers/specs/2026-11-10-s4-suite-theo-vung-design.md` · hồ sơ `_acceptance/s4-suite-theo-vung/`.

## Global Constraints

- Không chạm `executors.test.*`, `executors.script.portal_static` (eval hồ sơ đã ký trỏ vào). Không sửa kit, CI, `LUAT.md`.
- Không chắc thì CHẠY: ref gốc vắng · git lỗi · suite lạ · chỉ `_acceptance/` · diff rỗng · `SUITE_NEU_DOI=chay`.
- `dung-worktree-cham.sh` không ghi vào checkout chính, không ghi đè, không in nội dung env.

## Review Focus

1. Tệp chưa theo dõi trong vùng (worktree mới, chưa `git add`) phải kích hoạt suite (E2 ca thứ ba).
2. Lệnh bọc gọi từ thư mục con vẫn chạy lệnh ở gốc kho (E2 cwd).
3. Tham chiếu mới ra ngoài vùng ở một hàng sau → test canh phủ đỏ gọi tên tệp (E5).

### Task 1: `scripts/suite-neu-doi.mjs` + test · evals E1–E5 · independent: false
Verify: `node --test scripts/suite-neu-doi.test.mjs`; phá thử (bỏ qua luôn chạy) → S4V-AC-1 đỏ.

### Task 2: `_acceptance/config.yaml` (`executors.suite.*`, `suite_keys`, executor eval) + probe E6 · independent: false
Verify: `bash _acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh`; `node --test --test-name-pattern=S4V-AC-6 scripts/suite-neu-doi.test.mjs`.

### Task 3: `scripts/dung-worktree-cham.sh` + test · eval E7 · independent: true
Verify: `node --test scripts/dung-worktree-cham.test.mjs`; phá thử (bỏ rào checkout chính) → đỏ.
