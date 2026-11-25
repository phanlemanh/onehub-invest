# Stage A theo tập — kế hoạch thi công

**Goal:** Stage A của `pipeline/resolve-properties.mjs` chạy theo tập, cùng kết quả với vòng mỗi cụm, dưới 5 phút.
**Spec:** `docs/superpowers/specs/2026-11-15-resolve-stage-a-theo-tap-design.md` · hợp đồng `_acceptance/resolve-stage-a-theo-tap/contract.md`.

## Task 1 — Stage A theo tập (independent: false)
- Files: `pipeline/resolve-properties.mjs`, `pipeline/lib/thu-lai-deadlock.sql-base.json`, `pipeline/lib/thu-lai-deadlock.test.mjs`
- Hai bảng tạm `stage_a_tin`, `stage_a_cum`; UPDATE / INSERT căn / INSERT link theo tập; dòng log giữ khuôn; chụp lại bản ghim SQL (12 câu).
- Verify: `node --test pipeline/lib/thu-lai-deadlock.test.mjs` · `node --test --test-skip-pattern 'RTLD-AC-9' pipeline/tests/resolve-properties-deadlock.itest.mjs`
- Phục vụ: E5, E6, E7, E7b, E8. Trạng thái: xong (69824c78).

## Task 2 — Phép so cũ ↔ mới (independent: false, cần Task 1)
- Files: `pipeline/scripts/resolve-so-stage-a.mjs`, `pipeline/scripts/resolve-so-stage-a.sh`, `_acceptance/config.yaml` (executors rsa_*)
- Dựng bản chép qua `db/db-thu.sh`, đưa về trước lượt đêm, so tập theo stable_key, đối chứng âm, đếm đường chèn, trần giờ.
- Verify: `bash pipeline/scripts/resolve-so-stage-a.sh so --mau 200` (exit 0) và `… --pha` (exit 1, «TỔNG lệch 1»); `… gio --tran-giay 0` (exit 1).
- Phục vụ: E1, E2, E3, E4. Trạng thái: xong (69824c78, abef68a7).
