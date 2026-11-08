## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Phím 1–4, J/K vẫn chạy khi hộp ảnh (Dialog của review-photos) đè lên sheet, nên có thể quyết thẻ mà người duyệt không thấy**
  Người dùng thấy gì: Khi đang phóng to ảnh của thẻ, bấm phím số hay J/K vẫn quyết hoặc chuyển thẻ phía sau mà người duyệt không nhìn thấy.
  Căn cứ: Quyết nhầm thẻ là lỗi thật nhưng có toast Hoàn tác 5 giây để gỡ, không mất dữ liệu; sửa rẻ nên đáng làm thành việc riêng.
  file: `app/src/components/ops/review/review-queue.tsx`
  severity: medium
  Đề xuất: new-contract

- **Nhãn đáp án ở «Quyết định gần đây» bỏ màu trạng thái, lệch khuôn ReviewStatusBadge và bản gốc recent-decisions**
  Người dùng thấy gì: Ở mục Quyết định gần đây, nhãn đáp án hiện không có màu như ở bảng thẻ, nên khó liếc nhận ra thẻ nào bị loại, thẻ nào được duyệt.
  Căn cứ: Chỉ là chênh lệch về hình thức, thông tin vẫn đủ và đúng, không ảnh hưởng dữ liệu; có thể chỉnh sau.
  file: `app/src/components/ops/review/review-gan-day.tsx`
  severity: low
  Đề xuất: known-limits

- **CONTEXT.md mô tả «Hộp hạng mục» khác với hành vi đã dựng: mục hết thẻ chờ vẫn được liệt**
  Người dùng thấy gì: Tài liệu từ vựng mô tả hộp hạng mục chỉ liệt mục còn thẻ chờ, trong khi giao diện thật còn liệt cả mục đã hết thẻ chờ.
  Căn cứ: Người dùng không bị ảnh hưởng, chỉ người đọc tài liệu có thể hiểu sai; sửa một câu rất rẻ khi tiện.
  file: `CONTEXT.md`
  severity: low
  Đề xuất: known-limits

- **Skeleton của trang chưa theo bố cục mới: không có PageHeader, hộp hạng mục và Frame «Quyết định gần đây»**
  Người dùng thấy gì: Trong lúc trang đang tải, khung chờ hiện bố cục cũ nên khi dữ liệu về, trang nhảy sang bố cục mới.
  Căn cứ: Chỉ gây nháy hình thoáng qua, không mất hay sai dữ liệu, tự hết khi tải xong; sửa sau cũng rẻ.
  file: `app/src/components/ops/review-content.tsx`
  severity: low
  Đề xuất: known-limits

- **Thêm block ReUI Pro solution-agents-9 (khoảng 1.660 dòng) vào kho đang PUBLIC**
  Người dùng thấy gì: Vòng này đưa thêm một khối giao diện trả phí lên kho đang công khai, có thể vi phạm điều khoản giấy phép của nhà cung cấp.
  Căn cứ: Rủi ro pháp lý chứ không gây hại cho người dùng, và Mạnh đã hoãn quyết định chung; chỉ cần ghi lại để quyết cùng lúc.
  file: `app/src/components/blocks/solution-agents-9/components/memory-manager.tsx`
  severity: medium
  Đề xuất: known-limits

- **Giữ phím số (key auto-repeat) quyết liền nhiều thẻ kế tiếp**
  Người dùng thấy gì: Nếu người duyệt giữ phím số hơi lâu, hệ thống quyết liền nhiều thẻ kế tiếp mà họ chưa kịp xem.
  Căn cứ: Có thể quyết hàng loạt thẻ chưa đọc, mỗi thẻ chỉ có một toast Hoàn tác ngắn dễ sót; nhưng chỉ xảy ra khi giữ phím và sửa rất rẻ.
  file: `app/src/components/ops/review/use-phim-duyet.ts`
  severity: medium
  Đề xuất: new-contract

- **Xả hàng chờ khi gỡ thành phần gửi bỏ qua kết quả, quyết định hỏng mất mà không báo**
  Người dùng thấy gì: Khi người duyệt chuyển sang trang khác ngay sau khi quyết, nếu lần ghi thất bại thì quyết định mất mà không có thông báo nào.
  Căn cứ: Người duyệt tưởng đã ghi nhưng thẻ vẫn còn chờ; không hỏng dữ liệu cũ, thẻ hiện lại ở lần sau nên tự phát hiện được.
  file: `app/src/components/ops/review/hang-gui.tsx`
  severity: medium
  Đề xuất: new-contract

- **Route lỗi đưa thẻ trở lại nhưng mất lý do đã gõ; bấm lại thì gửi nhãn đáp án thay lý do**
  Người dùng thấy gì: Khi lần ghi bị lỗi, thẻ quay lại nhưng lý do người duyệt đã gõ biến mất, bấm lại sẽ ghi nhãn mặc định thay cho lý do đó.
  Căn cứ: Mất lý do gõ tay và ghi lý do chung chung mà người duyệt không hay; hiếm xảy ra vì cần lỗi route, sửa rẻ.
  file: `app/src/components/ops/review/review-queue.tsx`
  severity: low
  Đề xuất: new-contract

- **Hình dạng 4: chiều đỏ không ghim thông điệp — regex đột biến kèm nhánh bắt-tất-cả `|OD2-AC-n` / `|không tìm thấy`**
  Người dùng thấy gì: Một số phép thử lỗi có thể báo qua do lỗi khác, nên chưa chắc đã chứng minh đúng chỗ cần bắt.
  Căn cứ: Không ảnh hưởng người dùng cuối; chỉ làm giảm độ tin cậy của bộ kiểm tra, có thể siết dần.
  file: `app/tests/ops-duyet-hop-hang-muc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5: tuyên «ma trận viết trước 12 phím (số assert = 12)» nhưng chỉ có chuỗi điểm-case với bộ đếm tự tăng**
  Người dùng thấy gì: Phép thử phím tắt chưa kiểm hết các phím như đã tuyên bố, nên một số lỗi phím có thể lọt qua mà không bị phát hiện.
  Căn cứ: Không làm hỏng chức năng hiện tại, chỉ để hở khả năng lỗi phím tương lai không bị bắt; bổ sung test sau được.
  file: `app/tests/ops-duyet-hop-hang-muc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: chiều đỏ «GIU TACH CON BAT LY DO» được khai nhưng không có đột biến nào chạy**
  Người dùng thấy gì: Chưa có phép thử chứng minh nút Giữ tách của thẻ Người đúng luật lý do mới.
  Căn cứ: Chỉ là thiếu một phép kiểm, hành vi hiện đúng; rủi ro thấp và bổ sung rẻ.
  file: `app/tests/ops-duyet-hop-hang-muc.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4: assert «sau lỗi nút phải bấm lại được» không phụ thuộc đường lỗi — thay cho assert dương đã bị xoá**
  Người dùng thấy gì: Phép thử sau khi ghi lỗi không còn chứng minh được lỗi có được xử lý, nên xử lý lỗi hỏng sau này có thể không bị phát hiện.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chỉ giảm khả năng bắt lỗi về sau; bổ sung sau được.
  file: `app/tests/review-queue.test.tsx`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
