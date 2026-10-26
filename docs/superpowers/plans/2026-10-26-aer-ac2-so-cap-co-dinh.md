# aer-ac2-so-cap-co-dinh Implementation Plan

**Goal:** Ca «AER-AC-2 không lệnh nào đổi nghĩa» so cặp blob cố định `5e396cb2^ → 5e396cb2` trên hợp tập khoá, không đọc cây đang kiểm hay merge-base — PR khác thêm/sửa/xoá khoá `config.yaml` không bị CI chặn nhầm.

**Spec:** `_acceptance/aer-ac2-so-cap-co-dinh/contract.md` (T2, làn V). **Tech:** `node:test`, `lib/evidence-core.cjs` (`resolveConfigKey`).

### Task 1: soCapCoDinh + ba ca (đã làm, commit 979e2334)

`independent: true` · phục vụ E1, E2 · Files: `scripts/auth-error-thu-lai-retry.test.mjs`

- [x] Tái hiện lỗi trước khi sửa: thêm `pr_khac_them_khoa` vào `config.yaml` → ca cũ đỏ «giá trị đổi so với merge-base origin/main: executors.script.pr_khac_them_khoa».
- [x] `export function soCapCoDinh(show)` nhận bộ đọc `show(rev) → blob`, so `5e396cb2^` với `5e396cb2` bằng `kitBeforeAfter` (hợp tập khoá).
- [x] Ca: so cặp cố định (khac = []), chiều đỏ (đổi giá trị / xoá khoá ở bản «sau» → đúng khoá), ca «PR khác thêm khoá không làm đỏ» kèm đối chứng dương bộ so nhạy.
- [x] Verify: `node --test scripts/auth-error-thu-lai-retry.test.mjs` 9/9; thêm khoá vào `config.yaml` thật → vẫn 9/9; hoàn lại.

### Task 2: S4

- [ ] `node --test scripts/*.test.mjs` xanh → contract `implemented` → xin khoá `s4` → Workflow S4.
