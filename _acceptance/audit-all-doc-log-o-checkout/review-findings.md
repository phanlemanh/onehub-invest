# Review findings: audit-all-doc-log-o-checkout (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Smoke AC-6 tuyên bố 'không CLI OpenClaw' nhưng chỉ đổi HOME, PATH thật vẫn đi theo nên audit-all vẫn gọi CLI OpenClaw thật**
  Người dùng thấy gì: Khi chạy phép thử trên máy này, bước kiểm tra vẫn hỏi thật công cụ Zalo (chỉ đọc, không gửi gì) trong thư mục tạm, trái với lời ghi là không đụng tới Zalo. Không mất dữ liệu và không gửi tin nào, nhưng lời cam kết an toàn trong tệp thử chưa đúng hẳn.
  Căn cứ: Chỉ là lệnh đọc, không gửi tin vào nhóm và không làm mất dữ liệu; hậu quả nhẹ nên ghi lại là hạn chế đã biết, sửa sau khi có dịp.
  file: `scripts/smoke-doc-log-o-checkout.mjs`
  severity: medium
  Đề xuất: known-limits

- **Rotation preview vẫn đọc trạng thái launchd ở worktree: khi thiếu tệp, cursor lặng lẽ về 0**
  Người dùng thấy gì: Khi chạy app từ bản làm việc phụ, trang Thu thập hiện danh sách '6 thị trường kế tiếp' tính từ đầu và báo như chưa có đêm nào chạy, dù thực tế đã chạy. Chỉ lệch trong môi trường phát triển, không báo lỗi nên dễ tin nhầm.
  Căn cứ: Chỉ ảnh hưởng chỗ xem trước trên máy dev, không mất dữ liệu; chạy app từ checkout chính thì hiển thị đúng, nên có thể ghi hạn chế hoặc mở việc nhỏ sau.
  file: `app/src/lib/collections-queries.ts`
  severity: medium
  Đề xuất: known-limits

- **Smoke AC-6 vẫn xanh khi cả hai bên đều không đọc được log AirDNA**
  Người dùng thấy gì: Phép thử trên máy thật có thể báo xanh dù cả hai bên đều không đọc được nhật ký AirDNA, vì chỉ so hai bên giống nhau chứ không kiểm nhật ký có nội dung. Người ký có thể tưởng đã chứng minh đọc đúng chỗ trong khi chưa.
  Căn cứ: Chỉ làm bằng chứng yếu đi chứ không làm hỏng tính năng hay dữ liệu; các phép thử trong hộp cây tạm đã chứng minh phần đọc đúng, nên chấp nhận và ghi lại.
  file: `scripts/smoke-doc-log-o-checkout.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4: chiều đỏ của smoke AC-7 chỉ kiểm có lệch, không ghim lệch ở mục nào. Bộ canh và nhãn lớp 1–4 có thể qua mà không chứng được gì**
  Người dùng thấy gì: Phép thử trang Thu thập có thể báo xanh cho mục Bộ canh và nhãn lớp 1–4 mà không thật sự chứng minh chúng đọc đúng nhật ký, khi nhật ký bộ canh vắng. Người ký dễ tin hơn mức bằng chứng cho phép.
  Căn cứ: Không ảnh hưởng người dùng cuối hay dữ liệu, chỉ làm bằng chứng nghiệm thu yếu đi ở hai mục; người ký có thể tự nhìn ảnh chụp trang để bù nên ghi lại là hạn chế đã biết.
  file: `scripts/smoke-doc-log-o-checkout.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5: AC-5 có câu chú thích nhận cả phía app chỉ dựng đường pipeline/logs ở một chỗ, nhưng chỉ quét 2 tệp có tên sẵn và chỉ so chuỗi nguyên văn**
  Người dùng thấy gì: Nếu sau này có người thêm một chỗ đọc nhật ký mới ở tệp khác, hoặc viết đường dẫn theo cách khác, bộ canh tự động sẽ không bắt được và trang Ops có thể lại đọc nhầm thư mục rỗng.
  Căn cứ: Chỉ là nguy cơ cho thay đổi tương lai, hiện không có lỗi hiển thị nào; người dùng không bị ảnh hưởng ngay và sửa lúc nào cũng được.
  file: `app/tests/doc-log-o-checkout.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: log-root.ts nói dùng chung một luật với audit-all.sh, nhưng phía app chỉ kiểm 2 trong 4 ca biên, còn ca kho trần không được kiểm ở phía nào**
  Người dùng thấy gì: Trong vài tình huống hiếm (thư mục git hỏng, checkout chính đã dời, kho trần), chưa có phép thử chứng minh trang Ops chọn đúng thư mục nhật ký, nên có thể hiện trạng thái sai mà không ai biết.
  Căn cứ: Chỉ xảy ra ở tình huống hiếm trên máy dev, không mất dữ liệu và người dùng tự khắc phục được bằng cách chạy lại từ checkout chính; thêm phép thử sau cũng rẻ.
  file: `app/tests/doc-log-o-checkout.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

