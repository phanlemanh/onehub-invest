# Kế hoạch thi công: Căn giá tốt lọc theo vị trí và xếp hạng (CG3)

Hồ sơ: `_acceptance/can-gia-tot-loc-xep-hang/`. Thiết kế: `docs/superpowers/specs/2026-11-18-can-gia-tot-loc-xep-hang-design.md`.
Mã đã dựng trên route thật trong bước design-pass, nên kế hoạch ghi lại các phần việc và lệnh kiểm của từng phần.

| Task | Việc | Tệp | Lệnh kiểm | Phục vụ | independent |
|---|---|---|---|---|---|
| T1 | Đọc theo trang ở máy chủ: đọc nhẹ, xếp tab, cắt trang, đọc đầy đủ | `app/src/lib/deals.ts`, `app/src/lib/deals-chi-tiet.ts` | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh` | E1, E3, E4, E5, E6, E8, E11 | false |
| T2 | Trang đi đường đọc theo trang, giữ đường cũ làm lối lùi | `app/src/app/ops/deals/page.tsx` | `cd app && npx tsc --noEmit` | E4, E7, E8, E9 | false |
| T3 | Bảng phân trang máy chủ, thanh lọc, nhãn hạng, trạng thái trống | `app/src/components/ops/deals-grid.tsx`, `deals-bo-loc.tsx`, `deals-cells.tsx` | `cd app && npm run lint` | E2, E7, E9, E10 | false |
| T4 | Test và lệnh đo trên dữ liệu máy thu | `app/tests/deals-loc-xep-hang.test.tsx`, `_acceptance/can-gia-tot-loc-xep-hang/probes/*` | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/do-may-thu.sh` | E1–E9, E11 | false |

Các task phụ thuộc nhau nên làm tuần tự.
