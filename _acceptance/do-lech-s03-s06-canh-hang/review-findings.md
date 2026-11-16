## Trong hợp đồng

- **Số tin_s03_co_mat_bang của AC-7 đếm trùng tin thuê có m², làm phồng số so với ngưỡng 1.500**
  AC: AC-7
  file: `pipeline/scripts/do-lech-s03-s06-do.mjs:115`
  severity: medium
  source: bugs
  detail: `s03Du = mau.filter((r) => r.source === 'S03' && ky.get(khoa(r))?.tt === 'du').length` đếm theo dòng của SQL_MAU, không đếm theo tin. Một tin S03 thuê có m² xuất hiện hai lần: ở nhánh gia-m2 (dòng hạng của chính nó) và ở nhánh gom nhóm gia-thang-pn (UNION ALL). Nếu cả hai nhóm đều 'du' thì tin bị đếm hai lần. App (matBangCho) chỉ khớp tin với dòng hạng của chính nó, tức nhóm gia-m2, nên lần xuất hiện ở nhóm giá tháng không phải là tin có mặt bằng trên màn. Hệ quả là chỉ tiêu `s03_duoi_1500` có thể báo đạt khi số tin S03 thật sự có mặt bằng chưa tới 1.500. Cách sửa: đếm distinct offer_id, và chỉ lấy dòng có thuoc trùng dòng hạng của tin.
  rationale: AC-7 định nghĩa tin_s03_co_mat_bang là số tin S03 cấp dự án ở nhóm đủ và đòi ≥ 1.500; đếm trùng làm phép đo này có thể báo đạt sai.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Nhãn UI mới «Mặt bằng S06 cùng dự án» chưa có trong CONTEXT.md và trùng chữ với nhãn «Mặt bằng» (property_type commercial) đã có**
  Người dùng thấy gì: Chữ «Mặt bằng» trên màn các tin của người vận hành vừa chỉ loại hình nhà vừa chỉ mặt bằng giá so sánh, nên người đọc có thể hiểu nhầm. Số liệu hiển thị vẫn đúng.
  Căn cứ: Chỉ gây lẫn chữ cho người vận hành, không sai dữ liệu, và đổi nhãn hay thêm thuật ngữ sau này rẻ, không mất gì.
  file: `app/src/components/ops/deal-body.tsx`
  severity: medium
  Đề xuất: known-limits

- **Nhóm giá tháng của 423 bỏ sót tin thuê có m² mà 422 vẫn gom vào nhóm dth, nên n và trung vị lệch với thước hạng**
  Người dùng thấy gì: Với một số dự án thuê có ít phiếu, số căn và giá trung vị S06 hiện cạnh tin có thể ít hơn thực tế, và có nhóm bị ghi «chưa đủ để so» dù thật ra đủ. Người vận hành có thể bỏ lỡ so sánh, nhưng không có số sai được hiển thị như đủ.
  Căn cứ: Lỗi chỉ làm thiếu so sánh ở các nhóm thuê biên, không làm lộ hay mất dữ liệu, và chạy lại sau khi sửa là tính lại được.
  file: `pipeline/sql/423_project_source_baseline.sql`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
