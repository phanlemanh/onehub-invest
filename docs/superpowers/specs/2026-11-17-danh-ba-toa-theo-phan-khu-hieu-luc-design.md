# danh-ba-toa-theo-phan-khu-hieu-luc — trang Danh bạ đặt toà dưới phân khu hiệu lực

Ngày: 2026-11-17 · Dãy N1 · Hạng T2 · Lộ trình DA36 (đợt danh-ba-cau-truc-1711, ROADMAP §3 mục 54). Căn cứ số:
`research-local/phan-tich-cau-truc-danh-ba-1711.md` §0–§1 (đo DB máy thu 17/11).

## 1. Vấn đề

Toà (`buildings`) nối vào cây vùng qua `buildings.region_node_id`, chọn một lần lúc đúc bằng luật chỉ nhìn nút loại
`building`, nên 54/198 toà treo thẳng dưới dự án. View `v_toa_nut_vung` (migration 097) đã tính nút vùng hiệu lực (cụm S09,
rồi phân khu S09, rồi cột gốc) và đưa 40/54 toà về đúng phân khu, nhưng lớp đọc của `/ops/registry`
(`app/src/lib/ops/registry/doc.ts`, `du-an.ts`) vẫn đọc cột gốc.

## 2. Thiết kế

- `doc.ts`: CTE `toa` lấy `region_node_id` từ `v_toa_nut_vung` (một dòng mỗi toà). Mọi số cây (toà, toà chưa có căn, căn
  của từng nút và tổ tiên) tính theo nút hiệu lực.
- `du-an.ts`: `SQL_TOA`, `SQL_CAN` lọc cây con theo nút hiệu lực; `ToaDanhBa` thêm `nutIdGoc` và `nguonNut`
  (`goc | s09_cum | s09_phan_khu`).
- `hang-toa.ts`: dòng phụ của toà hiện tên nút hiệu lực; khi khác cột gốc, thêm «S09 xếp lại, gốc: <tên nút gốc>» để người
  vận hành thấy nguồn của phân khu. Tên nút gốc tra trong TOÀN BỘ nút của danh bạ (không chỉ cây con) và qua bộ che tên
  nguồn như mọi chữ khác của dòng.
- Chỉ SELECT; không migration, không ghi dữ liệu. Không thêm thuật ngữ CONTEXT (CONTEXT ngoài ranh giới hàng).
- Bộ test TDB dựng lại `v_s09_toa`, `v_toa_nut_vung` trong lược đồ tạm (lớp đọc nay đọc view); chuỗi đột biến của chiều
  đỏ TDB-AC-2 viết lại cho CTE mới mà vẫn bỏ lọc status. Probe TDB-DC đếm tổng toà trên dự án gốc theo nút hiệu lực.

## 3. Phép đo

- Fixture riêng (`app/tests/registry-toa-hieu-luc.test.tsx`): ma trận viết trước toà × nguồn nút (gốc, cụm S09, phân khu
  S09, gốc ≠ hiệu lực), số cây theo nút, dòng phụ trên DOM; chiều đỏ: bản chép đọc lại cột gốc.
- Probe DB máy thu (`app/probes/registry-toa-hieu-luc.test.tsx`, READ ONLY): số lớp đọc khớp đếm trực tiếp trên view; in
  treo thẳng dưới dự án, phân khu không toà, tổng toà — 54 → 14, 7 → 1, 198 không đổi.
