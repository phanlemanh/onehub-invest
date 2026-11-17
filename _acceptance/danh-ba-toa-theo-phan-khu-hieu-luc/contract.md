---
schema_version: 1
feature: Trang Danh bạ trên Ops đặt mỗi toà dưới phân khu hiệu lực (cụm S09, rồi phân khu S09, rồi cột gốc) đọc từ view v_toa_nut_vung, và hiện cả gốc lẫn hiệu lực khi hai giá trị khác nhau
slug: danh-ba-toa-theo-phan-khu-hieu-luc
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: implemented
design_doc: docs/superpowers/specs/2026-11-17-danh-ba-toa-theo-phan-khu-hieu-luc-design.md
approved_by:
approved_at:
veto_state: mo
veto_opened_at: 2026-11-17T20:40:00Z
---

# Acceptance Contract: danh-ba-toa-theo-phan-khu-hieu-luc

## Context

DA36 (lộ trình, đợt danh-ba-cau-truc-1711, ROADMAP §3 mục 54). View `v_toa_nut_vung` (097) đã sửa 40/54 toà treo sai,
nhưng `/ops/registry` đọc cột `buildings.region_node_id` gốc. Hàng chỉ đổi lớp đọc và chữ phụ của dòng toà.

## Acceptance Criteria

- AC-1: Given một lược đồ thử có toà mà nút hiệu lực (theo `v_toa_nut_vung`) khác cột gốc, When `docDanhBa` đếm cây, Then số
  toà, toà chưa có căn và căn của mỗi nút tính theo nút hiệu lực, đúng bảng kỳ vọng viết trước; tổng toà toàn danh bạ không
  đổi; và bản chép lớp đọc đọc lại cột gốc thì lệch bảng với thông điệp gọi tên nút.
- AC-2: Given trang một dự án render trong jsdom, When đọc bảng toà, Then mỗi toà nằm dưới nút hiệu lực của nó; toà có gốc
  khác hiệu lực hiện dòng phụ bắt đầu bằng tên nút hiệu lực rồi «S09 xếp lại, gốc: <tên nút gốc>» (tên qua bộ che tên
  nguồn); toà có gốc bằng hiệu lực không có cụm ấy; căn của toà vẫn đi theo toà; ô Toà của phân khu trên trang danh sách
  bằng số theo nút hiệu lực.
- AC-3: Given DB máy thu (chỉ đọc), When lớp đọc của `/ops/registry` chạy trên dữ liệu thật, Then số toà của từng nút khớp
  đếm trực tiếp trên `v_toa_nut_vung`; toà treo thẳng dưới dự án và phân khu không toà không con bằng đếm trên view và nhỏ
  hơn đếm theo cột gốc (đo 17/11 sau khi DA33 áp lên DB máy thu: 163 → 123 và 7 → 1; trước DA33: 54 → 14); tổng toà bằng đếm `buildings` đang dùng (307 sau DA33), không đổi so với
  cột gốc; không toà nào đổi dự án gốc giữa cột gốc và hiệu lực; probe đối chiếu sẵn có của `/ops/registry` vẫn khớp.
- AC-4: Given lớp đọc sau vòng, When quét các tệp `app/src/lib/ops/registry/*.ts`, Then không có câu ghi (luật chỉ-đọc của
  `trang-danh-ba-chi-doc`, ca `quetGhi`) và bộ test TDB sẵn có vẫn xanh.

## Coverage

Quét bằng ma trận nhỏ (preset test-matrix). Thước CE: đếm trên DB máy thu 17/11 (READ ONLY) theo `v_toa_nut_vung` ×
loại nút gốc/hiệu lực, đếm lại sau khi DA33 áp (15:06Z: 307 toà; 109 toà S16 mới đều theo cột gốc dưới nút dự án, không nối S09).

| Nguồn nút (view) | Gốc → hiệu lực | Số toà | Ai đọc phía sau | Xử lý |
|---|---|---|---|---|
| `goc` | project → project | 123 (OP1 46, Smart City 37, GP 19, OP2 14, OP3 7) | người vận hành (toà treo còn lại) | trong phạm vi — AC-1, AC-3 |
| `goc` | building → building | 10 | người vận hành | trong phạm vi — AC-1 (không đổi) |
| `s09_cum` | subzone → subzone | 54 | người vận hành | trong phạm vi — AC-1 (không đổi) |
| `s09_cum` | project → subzone | 15 | người vận hành (dòng phụ gốc) | trong phạm vi — AC-1, AC-2 |
| `s09_phan_khu` | building → building | 6 | người vận hành | trong phạm vi — AC-1 (không đổi) |
| `s09_phan_khu` | subzone → subzone | 74 | người vận hành | trong phạm vi — AC-1 (không đổi) |
| `s09_phan_khu` | project → subzone | 25 | người vận hành (dòng phụ gốc) | trong phạm vi — AC-1, AC-2 |
| gốc subzone → subzone khác | — | 0 | — | ngoài phạm vi, vì 0 dòng trên DB máy thu; fixture vẫn phủ gốc ≠ hiệu lực |
| hiệu lực sang dự án khác | — | 0 | người vận hành (toà biến khỏi trang dự án) | trong phạm vi — AC-3 giữ số 0 bằng probe |

- Trục A — nguồn nút: gốc | cụm S09 | phân khu S09
- Trục B — gốc so hiệu lực: bằng | khác
- Trục C — lớp đo: số cây | dòng phụ DOM | dữ liệu thật

Core: nguồn × khác × số cây (AC-1); khác × DOM (AC-2); mọi ô × dữ liệu thật (AC-3). Never: ghi dữ liệu (hàng chỉ đọc).

## Out of scope

- Sửa luật đúc toà (`s16-dung.mjs`, đúc S08) để cột gốc tự đúng — hàng khác (§0 mục 5 của phân tích).
- 14 toà còn treo và phân khu #22 Lumiere Riverside không toà — dữ liệu, không phải lớp đọc.
- Dự án con có cha (0/344) — DA khác của đợt.
- Thuật ngữ mới trong `CONTEXT.md` — ngoài ranh giới hàng; chữ phụ dùng từ sẵn («phân khu», «S09», «gốc»).

## Notes

Số trước DA33 (17/11 sáng): treo 54 → 14, tổng 198. Sau DA33 áp (15:06Z): treo 163 → 123, phân khu rỗng 7 → 1, tổng 307 — hàng vẫn đưa đúng 40 toà về phân khu; 123 toà còn treo chủ yếu là toà S16 chưa có nút phân khu (ngoài hàng: luật đúc của DA33). Probe đo theo đẳng thức với view, in số.
- Ngoài-1 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Một ca toà đặc biệt (có hai tên gọi từ nguồn) chưa được kiểm tự động trên màn hình thật. Nếu sau này dòng chữ phụ của toà đó vẽ sai trên trang Danh bạ thì bộ kiểm tra vẫn không báo. — `app/tests/registry-toa-hieu-luc.test.tsx`
- Ngoài-2 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Trang Danh bạ có thể vẽ sai dòng chữ phụ của một toà có hai tên gọi mà bộ kiểm tự động vẫn báo xanh. Người vận hành sẽ chỉ thấy khi tự mở trang xem. — `app/tests/registry-toa-hieu-luc.test.tsx`
- Ngoài-3 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Nếu phần nạp dữ liệu S09 sau này đổi cách đặt tên trường, bài kiểm vẫn xanh trong khi trang Danh bạ có thể xếp toà sai phân khu. Số đo trên dữ liệu thật vẫn bắt được lệch này, nhưng không chạy tự động khi gộp. — `app/tests/registry-toa-hieu-luc.test.tsx`
- Ngoài-4 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Bài kiểm cho toà có gốc trùng phân khu hiệu lực khá lỏng: nếu dòng phụ của toà đó bị bỏ hẳn, bài kiểm vẫn xanh. Trên trang thật, toà này hiện không có dòng phụ, đúng như mong muốn. — `app/tests/registry-toa-hieu-luc.test.tsx`
