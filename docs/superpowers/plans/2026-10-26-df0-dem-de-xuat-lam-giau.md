# df0-dem-de-xuat-lam-giau — kế hoạch thi công

Hồ sơ: `_acceptance/df0-dem-de-xuat-lam-giau/` (T2, Cổng Phạm vi Mạnh duyệt 26/10, Hỏi-1: đếm mọi `queued`).
Design: `docs/superpowers/specs/2026-10-26-df0-dem-de-xuat-lam-giau-design.md`.

## Task 1 — câu đếm

- Files: `app/src/lib/data-flow-queries.ts`
- Việc: thêm hằng `ENRICH_PENDING_SQL` (`SELECT count(*) FROM enrichment_proposals WHERE status = 'queued'`); câu đếm
  trong `getDataFlow` dùng hằng đó; câu `review_queue` giữ nguyên.
- Verify: `cd app && npx tsc --noEmit`
- Phục vụ: E1, E2, E3, E5
- independent: false

## Task 2 — bài kiểm

- Files: `app/tests/df0-dem-de-xuat.test.tsx`
- Việc: lược đồ tạm `dem_<pid>` (enrichment_proposals + review_queue LIKE public kèm CHECK); trạng thái/tuyến rút từ
  CHECK; ca DD-AC-1…5 theo `evals.yaml`, mỗi ca có chiều đỏ cùng fixture; DD-AC-4 dựng `DataFlowView` trong jsdom.
- Verify: `cd app && node --import tsx --test tests/df0-dem-de-xuat.test.tsx` + lượt phá-thử (đổi hằng về `'pending'`
  → DD-AC-1 đỏ), rồi trả lại.
- Phục vụ: E1–E5 (E6 là judgment trên page.tsx + data-flow-view.tsx, không code mới)
- independent: false (phụ thuộc Task 1)
