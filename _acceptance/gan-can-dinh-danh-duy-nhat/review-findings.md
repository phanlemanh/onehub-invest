## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ảnh chứng E10 lộ email đăng nhập ở thanh bên Ops (tầng A), chưa che trước khi đẩy lên kho công khai**
  Người dùng thấy gì: Ảnh chụp màn hình dùng làm bằng chứng cho thấy rõ email của tài khoản thử ở góc thanh bên. Nếu đẩy lên kho công khai, email này sẽ bị người ngoài đọc được.
  Căn cứ: Email thuộc loại không được rời máy và kho sắp công khai nên cần che trước khi đẩy; tài khoản chỉ là tài khoản thử và nhánh chưa đẩy lên nên che lại rẻ, không mất dữ liệu.
  file: `_acceptance/gan-can-dinh-danh-duy-nhat/evidence/E10-step1.png`
  severity: high
  Đề xuất: new-contract

- **Bước E10 trong evals.yaml không ghi yêu cầu che email ở thanh bên**
  Người dùng thấy gì: Hướng dẫn chụp ảnh nghiệm thu không nhắc phải che email nên lần chụp lại sau này có thể lặp lỗi tương tự. Người dùng cuối của tính năng không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng quy trình nội bộ chứ không ảnh hưởng người dùng; sửa ảnh ở mục trước đã giải quyết phần hậu quả thực.
  file: `_acceptance/gan-can-dinh-danh-duy-nhat/evals.yaml`
  severity: medium
  Đề xuất: wont-fix

- **Ngăn tin còn câu cũ «Lên B2 cần gắn được tin về một căn», trái với §3.4 mới (B2 = Định vị)**
  Người dùng thấy gì: Khi mở chi tiết một tin, người vận hành thấy cùng lúc hai câu mâu thuẫn về điều kiện lên bậc B2: câu cũ nói cần gắn về một căn, dòng mới nói chỉ cần định vị. Có thể gây hiểu nhầm cho người vận hành đọc ngăn tin.
  Căn cứ: Chỉ là chữ gây nhầm trên trang nội bộ Ops, không mất hay lộ dữ liệu, và hợp đồng đã ghi sẵn là sẽ được sửa cùng hàng bậc hằng ngày.
  file: `app/src/components/ops/data-flow/record-sheet.tsx`
  severity: medium
  Đề xuất: known-limits

- **Câu bản ghi tin chép tay luật mức nhận diện và không đọc hai CTE nối danh bạ — phá luật «một định nghĩa» của 600 (r1)**
  Người dùng thấy gì: Khi sau này có bộ gắn tin vào danh bạ, số trên lưới và Sankey có thể báo tin đã Định vị hay Gắn căn trong khi ngăn chi tiết một tin vẫn ghi Gom cụm hoặc Chưa định vị. Hôm nay chưa xảy ra vì chưa tin nào được gắn.
  Căn cứ: Chưa gây sai số nào cho người dùng bây giờ vì chưa có tin được gắn; sửa lúc làm bộ gắn thì rẻ hơn nhiều, nên ghi lại làm hạn chế đã biết.
  file: `app/src/lib/data-flow-queries.ts`
  severity: medium
  Đề xuất: known-limits

- **Quyết định đổi thang bậc 08/11 chưa ghi vào ROADMAP §3 (r1)**
  Người dùng thấy gì: Quyết định đổi thang bậc chưa có trong sổ quyết định chung, nên phiên làm việc sau có thể không thấy và hỏi lại Mạnh điều đã chốt.
  Căn cứ: Không ảnh hưởng người dùng cuối nhưng dễ gây hỏi lại hoặc làm lệch việc sau; chỉ là việc ghi chép nhỏ, sửa rẻ ở một đợt riêng.
  file: `docs/product/FRAMING.md`
  severity: medium
  Đề xuất: new-contract

- **Cổng thiết kế E11 bỏ sót flow-journey.tsx dù tệp đổi trong vòng (r1)**
  Người dùng thấy gì: Biểu đồ Chặng theo ngày có thay đổi nhưng không được cổng kiểm thiết kế tự động soi, nên lỗi giao diện nhỏ ở đó có thể lọt qua.
  Căn cứ: Chỉ là lỗi hiển thị nhẹ, người dùng vẫn đọc được số; tiêu chí xem giao diện (AC-10) vẫn có người kiểm tay.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: ô Định vị (và Gắn căn) ở lưới AC-5 chỉ assert «chuỗi có mặt», không ghim quan hệ số/phần trăm (r1)**
  Người dùng thấy gì: Nếu sau này ô Định vị hay Gắn căn trên lưới hiện sai số, bài kiểm tự động hiện tại có thể vẫn báo đạt và không bắt được.
  Căn cứ: Hiện số liệu đúng nên người dùng chưa bị ảnh hưởng; rủi ro chỉ là bỏ lọt lỗi tương lai, có thể siết bài kiểm sau với chi phí thấp.
  file: `app/tests/gan-can-dinh-danh.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: gợi ý nút «Chưa định vị» (AC-6) chỉ assert chữ số có mặt, không ghim số nào đi với nhãn nào (r1)**
  Người dùng thấy gì: Nếu hai số trong gợi ý nút Chưa định vị bị đổi chỗ, bài kiểm tự động có thể không phát hiện và người xem sẽ đọc nhầm số tin ghi toà với số tin đủ định danh.
  Căn cứ: Hiện gợi ý đúng và chỉ là chú thích phụ; nhầm số chỉ gây hiểu sai nhẹ ở trang nội bộ và sửa bài kiểm sau rất rẻ.
  file: `app/tests/gan-can-dinh-danh.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: «tin đã nghỉ» trong fixture AC-3 là dòng viết tay đúng khuôn bên đọc, không đi qua retired_at của writer (r1)**
  Người dùng thấy gì: Bài kiểm không chứng minh được rằng tin đã nghỉ thật sự bị loại khỏi cụm trên dữ liệu thật; nếu nguồn dữ liệu thật không lọc, số Gom cụm có thể cao hơn thực tế.
  Căn cứ: Rủi ro thấp vì luật lọc tin nghỉ đã có sẵn ở tầng dữ liệu; chỉ là bằng chứng kiểm chưa trọn, người dùng tải lại sẽ thấy số đúng khi lượt làm tươi sửa.
  file: `app/tests/gan-can-dinh-danh.test.tsx`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/3 lỗi rơi vào file không bộ đo nào phủ (_acceptance/gan-can-dinh-danh-duy-nhat/evidence/E10-step1.png, _acceptance/gan-can-dinh-danh-duy-nhat/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
