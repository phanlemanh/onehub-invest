---
schema_version: 1
feature: Đầu trang /ops/data-flow đếm «đề xuất làm giàu» theo trạng thái chờ thật (queued), thôi luôn là 0
slug: df0-dem-de-xuat-lam-giau
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: approved
design_doc: docs/superpowers/specs/2026-10-26-df0-dem-de-xuat-lam-giau-design.md
approved_by: Mạnh
approved_at: 2026-10-26T23:09:00Z
---

# Acceptance Contract: df0-dem-de-xuat-lam-giau

## Context

Căn cứ: Ngoài-7 của `ops-dong-chay-df0` — Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 26/10
(`_acceptance/ops-dong-chay-df0/decisions.jsonl`, dòng «Ngoài-7: mở hợp đồng mới»); hàng U2 2.2 của đợt
dieu-phoi-dot0-cam-mau (LUAT.md mục «Hàng tách từ Cổng Bằng chứng DF0»).

`getDataFlow` đếm `enrichment_proposals WHERE status = 'pending'`, mà CHECK của bảng (migration 036) không có trạng thái
`pending` — đề xuất chờ mang `queued` (mặc định của migration 033). Đầu trang `/ops/data-flow` vì thế luôn ghi
«0 đề xuất làm giàu». Người gặp: người vận hành nhìn trang ở máy thu.

## Criteria

- AC-1: Given lược đồ tạm có `enrichment_proposals` với dòng ở MỌI cặp (trạng thái × tuyến) mà hai ràng buộc CHECK của bảng thật cho phép (danh sách rút từ ràng buộc, và tập trạng thái rút ra BẰNG đúng bảng phân loại ghim trước: `queued` đếm; `applied · rejected · superseded · skipped · reverted` không đếm), số dòng mỗi trạng thái là luỹ thừa 2 riêng (mọi tập con cho tổng khác nhau), When `getDataFlow` chạy thật với câu đếm trên lược đồ đó, Then `enrichPending` = tổng số dòng `queued` ở mọi tuyến (theo khuyến nghị Hỏi-1) — không phải 0, không phải tổng số dòng.
- AC-2: Given cùng fixture, When câu đếm đột biến về `status = 'pending'` (câu cũ), Then kết quả 0 ≠ số `queued` của AC-1 và ca đỏ với thông điệp ghim — phép đo phân biệt được bản cũ.
- AC-3: Given lược đồ tạm không có dòng `queued` (chỉ trạng thái đã xử lý), When `getDataFlow` chạy, Then `enrichPending` = 0 — số 0 lúc này là thật.
- AC-4: Given flow đọc từ AC-1 (`enrichPending` = N, số `queued`), When dựng `DataFlowView`, Then đầu trang có chữ «N đề xuất làm giàu» (N định dạng `fmtInt`).
- AC-5: Given cùng lược đồ tạm có `review_queue` (LIKE public kèm CHECK) với dòng ở mọi trạng thái rút từ ràng buộc (`pending` 2 dòng, mỗi trạng thái khác 1), When `getDataFlow` chạy, Then `reviewPending` = 2 — câu đếm thẻ chờ duyệt giữ nguyên `status = 'pending'`.
- AC-6: Given `app/src/app/ops/data-flow/page.tsx`, When trang dựng ở máy thu, Then kết quả `getDataFlow` đi thẳng vào prop `flow` của `DataFlowView`, và đầu trang đọc `flow.enrichPending` — không có đường số khác (judgment trên hai tệp).

## Coverage

Bỏ quét không gian AC — xem dòng `descope` «bỏ coverage-scan» (bản thay) trong `decisions.jsonl`: hai trục rời
(trạng thái × tuyến của đề xuất) quét toàn phần ở AC-1 bằng danh sách rút từ hai ràng buộc CHECK.

## Out of scope

- OOS-1: Tách số theo tuyến (tự áp / cần duyệt) — nhãn mới, cần thuật ngữ `CONTEXT.md`.
- OOS-2: Precompute số ở `pipeline/sql` (luật 10) — DF1.
- OOS-3: Số «thẻ chờ duyệt» và các mục Ngoài khác của DF0 (Ngoài-4/5/8) — hàng riêng.

## Notes

- Tệp test riêng `app/tests/df0-dem-de-xuat.test.tsx`; không chạm tệp test của `ops-dong-chay-df0`.
