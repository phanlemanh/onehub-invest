## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (âm tính một mình): ca 'AC-2 người quyết dở giao dịch' không kiểm rằng câu ghi của máy thật sự đứng chờ khoá trong lượt đo**
  Người dùng thấy gì: Bài kiểm tra cho tình huống người duyệt quyết thẻ dở giữa lúc máy chấm có thể báo xanh dù tình huống đó không thật sự xảy ra trong lần đo, nên chưa chứng minh chắc rằng thẻ người vừa quyết luôn được giữ nguyên. Hành vi thật của máy chưa bị chỉ ra là sai.
  Căn cứ: Chỉ làm bài kiểm tra yếu đi chứ không làm mất hay sai dữ liệu của người dùng, và nhánh bảo vệ vẫn đã được chứng minh ở lần đo đối chứng khác; ghi lại là đủ, siết bài kiểm tra có thể làm sau với chi phí thấp.
  file: `agent/tests/judge-run.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — AC-3 assert giá trị ai_suggestion đã có sẵn, không đo quan hệ trước/sau lượt 2 (đối chứng đỏ dựng trên hằng số) (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm tra cho việc thẻ chờ vẫn được chấm lại có một kẽ hở: nếu máy chấm lỡ bỏ qua vài thẻ đã mang sẵn kết luận đúng, bài kiểm tra vẫn báo xanh. Người dùng không thấy lỗi nào trên sản phẩm, chỉ là lưới an toàn khi sửa code sau này kém chặt hơn một chút.
  Căn cứ: Không có dữ liệu nào bị sai hay mất, chỉ là bài kiểm tra bắt lỗi kém nhạy ở một tình huống hẹp, và bộ đếm của lượt chạy vẫn bắt được phần lớn sự cố thật.
  file: `agent/tests/judge-run.test.ts`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
