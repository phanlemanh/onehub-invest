# Bật feature_loop.ngoai_n_tu_dinh_tuyen — kế hoạch

Spec: `docs/superpowers/specs/2026-11-15-ngoai-n-tu-dinh-tuyen-bat-design.md` · hợp đồng `_acceptance/ngoai-n-tu-dinh-tuyen-bat/contract.md`.

### Task 1: thêm khoá vào `_acceptance/config.yaml`

- Files: `_acceptance/config.yaml` (khối `feature_loop:`, thêm `ngoai_n_tu_dinh_tuyen: true` kèm chú thích nguồn).
- Verify: `node _acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs` → mọi ca ĐẠT (trước khi thêm: 13 ca ĐỎ).
- Phục vụ E1–E7; E8–E9 đo ở đỉnh PR.
- independent: true (một task).
