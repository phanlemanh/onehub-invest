# eval-classify đọc chữ theo tin ghép Implementation Plan

**Goal:** `eval-classify` chấm bộ đọc trên đúng chữ người gắn đã đọc.

**Spec:** `docs/superpowers/specs/2026-11-05-eval-classify-theo-chu-ref-design.md`

### Task 1: Đọc và gộp nhãn theo tin ghép (phục vụ E1, E3, E4; independent: false)

- Files: `pipeline/lib/eval-classify.mjs`, `pipeline/eval-classify.mjs`, `pipeline/scripts/eval-classify-ghep.test.mjs`
- `docNhanNguoi` nối chữ theo `coalesce(i.ghep->>'chu_ref', i.ref_id)`, lấy thêm `ghep`; `gopNhan` trả thêm `khong_chu`, `trung_co_nhan`; CLI in hai số.
- Verify: `cd pipeline && node --test scripts/eval-classify-ghep.test.mjs lib/eval-classify.test.mjs`

### Task 2: Đầu dò trên DB thử (phục vụ E2, E5, E6, E7; independent: false)

- Files: `_acceptance/eval-classify-theo-chu-ref/probes/db.mjs`, `_acceptance/config.yaml`
- `ghep` do `ghepLat` thật sinh; so mốc với hàm ở commit `467d3477`; CLI thật; quét tên nguồn.
- Verify: `node _acceptance/eval-classify-theo-chu-ref/probes/db.mjs`
