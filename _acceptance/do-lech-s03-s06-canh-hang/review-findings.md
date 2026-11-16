## Trong hợp đồng

(không có finding nào)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Trang một căn vừa ghi «128 tin S06» dựng thước vừa ghi mặt bằng «S06 chưa đủ để so (0 căn)», hai dòng mâu thuẫn ngay cạnh nhau (thấy trên E8-step3.png)**
  Người dùng thấy gì: Trên trang một căn, hai dòng nằm sát nhau có thể nói trái nhau: một dòng ghi thước dựng từ 128 tin S06, dòng kế bên ghi S06 chưa đủ để so (0 căn). Người vận hành dễ hiểu sai độ phủ S06 của dự án, dù số mặt bằng ở dòng mới vẫn đúng.
  Căn cứ: Chỉ là nhãn dễ gây hiểu nhầm trên màn dành cho người vận hành, không mất hay sai dữ liệu, hạng và nhãn giá không đổi; nhãn sai có từ trước và sửa sau cũng rẻ.
  file: `app/src/components/ops/deal-body.tsx`
  severity: medium
  Đề xuất: known-limits

- **Nhãn UI mới «Mặt bằng S06 cùng dự án» chưa có trong CONTEXT.md và trùng chữ với nhãn «Mặt bằng» (property_type commercial) đã có (r2)**
  Người dùng thấy gì: Chữ «Mặt bằng» trên màn các tin của người vận hành vừa chỉ loại hình nhà vừa chỉ mặt bằng giá so sánh, nên người đọc có thể hiểu nhầm. Số liệu hiển thị vẫn đúng.
  Căn cứ: Chỉ gây lẫn chữ cho người vận hành, không sai dữ liệu, và đổi nhãn hay thêm thuật ngữ sau này rẻ, không mất gì.
  file: `app/src/components/ops/deal-body.tsx`
  severity: medium
  Đề xuất: known-limits

- **Nhóm giá tháng của 423 bỏ sót tin thuê có m² mà 422 vẫn gom vào nhóm dth, nên n và trung vị lệch với thước hạng (r2)**
  Người dùng thấy gì: Với một số dự án thuê có ít phiếu, số căn và giá trung vị S06 hiện cạnh tin có thể ít hơn thực tế, và có nhóm bị ghi «chưa đủ để so» dù thật ra đủ. Người vận hành có thể bỏ lỡ so sánh, nhưng không có số sai được hiển thị như đủ.
  Căn cứ: Lỗi chỉ làm thiếu so sánh ở các nhóm thuê biên, không làm lộ hay mất dữ liệu, và chạy lại sau khi sửa là tính lại được.
  file: `pipeline/sql/423_project_source_baseline.sql`
  severity: medium
  Đề xuất: known-limits

- **423 lấy h.gia_tri (giá của tin đại diện phiếu) nên khi một căn có tin S03 ghép tin S06, giá của nguồn này bị tính vào trung vị của nguồn kia (r1)**
  Người dùng thấy gì: Khi một căn vừa có tin S03 vừa có tin S06, giá của nguồn này có thể lọt vào mặt bằng của nguồn kia. Số trung vị và độ lệch người vận hành thấy có thể lệch nhẹ ở những căn như vậy.
  Căn cứ: Số hiển thị sai nhưng chỉ ở nhóm căn ghép hai nguồn, người vận hành không tự phát hiện được; sửa ở bước tính sẵn khá rẻ nhưng cần ca thử riêng nên nên mở việc riêng.
  file: `pipeline/sql/423_project_source_baseline.sql`
  severity: high
  Đề xuất: new-contract

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
