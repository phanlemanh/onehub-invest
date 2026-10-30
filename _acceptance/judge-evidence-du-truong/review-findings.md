## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E1/E3 trong evals.yaml thiếu agent/tests/judge-chung.ts ở paths dù hàm kiểm nằm ở đó**
  Người dùng thấy gì: Nếu sau này ai đó sửa phần dùng chung của bộ kiểm, bằng chứng cũ của hai ca kiểm khuôn thẻ và nạp bảng số có thể vẫn bị coi là còn mới. Người dùng cuối không bị ảnh hưởng, chỉ là hệ thống nhắc kiểm lại chậm hơn.
  Căn cứ: Chỉ làm cảnh báo bằng chứng cũ đến muộn hơn, không làm mất hay sai dữ liệu của ai, và thêm hai dòng khai báo sau này cũng rẻ.
  file: `_acceptance/judge-evidence-du-truong/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4/5 — kiểm «thẻ cũ giữ nguyên» của JE-AC-6 qua được khi lô rỗng, đối chứng đỏ (2) bị bỏ qua mà không báo**
  Người dùng thấy gì: Khi kho không có thẻ cũ đang chờ, phép kiểm vẫn báo xanh dù chưa hề thử việc giữ nguyên thẻ cũ. Người duyệt có thể tưởng thẻ cũ đã được kiểm an toàn trong khi thực ra chưa được thử.
  Căn cứ: Chỉ xảy ra ở lô không có thẻ cũ và không làm hỏng dữ liệu thật, nhưng có thể cho cảm giác yên tâm giả, nên ghi lại để người ký biết.
  file: `agent/tests/judge-lo-that.itest.ts`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
