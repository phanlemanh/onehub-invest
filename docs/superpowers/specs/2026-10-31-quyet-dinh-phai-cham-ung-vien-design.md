# HD9 — quyết định trên thẻ ghép căn phải chạm đúng một ứng viên (thiết kế)

Hàng HD9 (audit hàng duyệt 30/10, H2 — `docs/research/audit-hang-duyet-3010.md` §1, §5.1). Cổng Đáng: Mạnh quyết ở §7.1 dòng
1 («cắt hàng sửa theo ba đợt, theo đề xuất»).

## 1. Hiện trạng (đo trên DB máy thu, 31/10)

| Đo | Số |
|---|---|
| `property_candidates` | 8 dòng: `needs_llm` 7, `pending` 1; không dòng `merged`/`rejected` nào |
| Khoá duy nhất | `(offer_a, offer_b)` một chiều; cặp trùng hai chiều: 0 |
| Thẻ `entity_match` | `pending` 7 (cả 7 có ứng viên, hai bên sống) · `rejected` 11 + `approved` 1 — cả 12 không có ứng viên khớp, hai bên đã rời kho |
| Route quyết định | `app/src/app/api/v1/ops/review/[id]/decide/route.ts`: ghi `review_queue` trước, rồi `UPDATE property_candidates` theo cặp khoá; không đếm số dòng đổi |
| Vòng đời ứng viên | `pipeline/resolve-properties.mjs` xoá mọi dòng `pending`/`needs_llm` rồi dựng lại mỗi lượt Stage B — thẻ có thể mất ứng viên sau một đêm |
| Nơi route chạy | Chỉ máy thu (DB :5433): `review_queue` là bảng tầng A buộc 0 dòng ở cloud (`pipeline/sync-cloud.mjs`, `TIER_A_TABLES`), và `review.decide` chưa có trong bộ áp lệnh kéo của ADR-0015 — ở cloud route trả 404 |

## 2. Thiết kế

Trong cùng giao dịch, trước khi ghi `review_queue`, nhánh `entity_match`:

1. Đọc cặp khoá từ `item_id` dạng `pair:<A>|<B>`. Sai khuôn (không tiền tố, thiếu một bên) → không chạm được ứng viên.
2. `UPDATE property_candidates SET status = …, decided_by = 'hitl:<id>' WHERE ((offer_a, offer_b) = (A, B) OR (offer_a,
   offer_b) = (B, A)) AND status IN ('pending', 'needs_llm') RETURNING id`.
3. Số dòng trả về khác 1 → `ROLLBACK`, phản hồi **422** `{ error, code: "khong-cham-ung-vien", so_dong }`; `error` là câu
   tiếng Việt nêu cặp và số dòng khớp. Thẻ vẫn `pending`, không dòng audit nào.
4. Đúng 1 → ghi `review_queue` (như cũ) và dòng audit mang thêm `ung_vien: <id>`.

Áp cho Cùng căn (→ `merged`) và Khác căn (→ `rejected`). «Để sau» (→ `pending`) theo Hỏi-1: máy khuyên áp cùng luật;
lối khác là cho «Để sau» đi qua không chạm ứng viên. «Ứng viên còn sống» = dòng khớp
cặp theo cả hai chiều, trạng thái `pending` hoặc `needs_llm`: ứng viên đã `merged`/`rejected` không bị quyết đè.

Nhánh `agent_output enrich:` và các nhánh 400/404/409 giữ nguyên.

Giao diện không đổi: thẻ đã hiện «Lỗi: <thông điệp route>» và giữ nguyên lý do khi route trả lỗi (`review-card.tsx`).

## 3. Không làm

- Đóng hay rút thẻ trỏ khoá chết (hàng `the-ghep-can-tin-roi-kho`, H1, `judge-run`).
- Khoá nút quyết trên thẻ có bên rời kho (hàng `the-so-doc-gia-tri-song`, dãy U1).
- Sửa `resolve-properties` (vòng đời ứng viên) hay khôi phục 11 quyết định 30/10 (Mạnh chọn bỏ, §7.1 dòng 2).

## 4. Rủi ro

- Sau mỗi lượt Stage B, ứng viên `pending`/`needs_llm` bị xoá và dựng lại cùng khoá; thẻ vẫn quyết được nếu cặp còn được
  dựng lại. Cặp không còn được dựng lại → thẻ bị 422 cho tới khi H1 rút nó.
- Đường ghi quyết định là `t3_paths`.
