## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **(r3) Ngoại lệ ngày lễ trong soNhaTran làm lọt đúng lỗi CD-AC-17: số nhà 3/2, 2/9, 1/5, 30/4, 19/5, 23/9 trước phẩy vẫn được so như tên đường**
  Người dùng thấy gì: Một số địa chỉ có số nhà dạng 3/2, 2/9, 30/4 đứng trước tên đường khác có thể bị so nhầm là cùng đường với một đường mang tên ngày lễ. Khi đó thẻ duyệt có thể báo Khớp cho hai đường thật ra khác nhau.
  Căn cứ: Chỉ ảnh hưởng một nhóm nhỏ số nhà hẻm trùng ngày lễ, người duyệt vẫn thấy địa chỉ gốc để tự đối chiếu, không mất dữ liệu; sửa đúng cần phân biệt số nhà với tên đường nên đáng làm ở hàng riêng.
  file: `agent/src/agents/judge-entity.ts`
  severity: medium
  Đề xuất: known-limits

- **(r3) Hình dạng 5 — code khai lớp «sáu tên đường ngày lễ» nhưng ma trận chỉ có 3/6 phần tử**
  Người dùng thấy gì: Bộ kiểm tra chỉ thử ba trong sáu ngày lễ, nên nếu ai lỡ làm hỏng ba ngày còn lại thì kiểm tra vẫn xanh. Người dùng có thể gặp địa chỉ so sai mà không ai được báo trước.
  Căn cứ: Rủi ro chỉ xảy ra khi có người sửa nhầm sau này, hiện hành vi đang đúng; thêm ba ca kiểm tra rất rẻ nhưng không cấp bách.
  file: `agent/tests/judge-entity-duong.test.ts`
  severity: medium
  Đề xuất: known-limits

- **(r2) Probe context-resolver-that thiếu nhánh bỏ qua dưới CI như mọi probe dữ liệu thật khác**
  Người dùng thấy gì: Nếu bài kiểm tra này chạy ở nơi không có dữ liệu thật của máy thu (ví dụ môi trường kiểm tự động), nó sẽ báo đỏ thay vì bỏ qua có lý do. Người dùng cuối không bị ảnh hưởng, chỉ gây báo động giả cho người vận hành.
  Căn cứ: Chỉ gây đỏ giả ở môi trường kiểm tự động, không ảnh hưởng người dùng hay dữ liệu, và sửa sau rất rẻ.
  file: `agent/probes/context-resolver-that.test.ts`
  severity: low
  Đề xuất: known-limits

- **(r2) Probe agent tự viết lại URL DB mặc định thay vì dùng dbUrl() của chung.ts; probe app lại theo biến môi trường khác**
  Người dùng thấy gì: Các bài kiểm tra dữ liệu thật có thể đọc hai cơ sở dữ liệu khác nhau trong cùng một lượt chạy nếu người chạy đặt biến môi trường khác thường. Hiện chưa xảy ra vì cấu hình mặc định giống nhau.
  Căn cứ: Chưa gây sai lệch trong cách chạy hiện nay, không mất dữ liệu và chỉnh sau không tốn kém.
  file: `agent/probes/judge-luat-that.test.ts`
  severity: low
  Đề xuất: known-limits

- **(r2) probe-du-lieu-that.sh in ✅ cho probe bị skip (bàn đo rỗng), mục B5 của audit-all báo PASS dù không đo gì**
  Người dùng thấy gì: Khi dữ liệu thật thiếu, một số kiểm tra bị bỏ qua nhưng bảng kiểm sức khoẻ vẫn hiện xanh. Người vận hành có thể tưởng đã được kiểm trong khi thực tế chưa đo gì.
  Căn cứ: Chỉ làm bảng sức khoẻ lạc quan hơn thực tế khi dữ liệu thiếu, không làm hỏng dữ liệu, và dễ bổ sung cảnh báo sau.
  file: `scripts/probe-du-lieu-that.sh`
  severity: low
  Đề xuất: known-limits

- **(r2) Hình dạng 4 (assertion âm tính đứng một mình, chiều đỏ eval hứa mà test không có): CD-AC-7 thiếu chiều đỏ bỏ dòng L2**
  Người dùng thấy gì: Bài kiểm tra so thẻ duyệt với luật chưa chứng minh được nó sẽ đỏ nếu ai đó bỏ nhánh bóc số nhà mới. Người dùng không thấy gì ngay, nhưng một lần hỏng sau này có thể lọt qua.
  Căn cứ: Chỉ giảm độ chắc của lưới an toàn kiểm thử, không ảnh hưởng người dùng hiện tại, và bổ sung sau rẻ.
  file: `agent/tests/judge-entity-duong.test.ts`
  severity: medium
  Đề xuất: known-limits

- **(r2) Hình dạng 4 (assertion âm tính đứng một mình): «2A, Khu dân cư Vĩnh Phú 1» không có khoá «khu dan cu»**
  Người dùng thấy gì: Một bài kiểm tra chỉ xác nhận một khoá không xuất hiện, nên nếu hàm hỏng theo cách khác nó vẫn xanh. Người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ là điểm yếu nhỏ của bài kiểm tra, các ca khác trong cùng nhóm đã phủ hàm này và không có hậu quả cho người dùng.
  file: `agent/tests/judge-entity-duong.test.ts`
  severity: low
  Đề xuất: wont-fix

- **(r2) Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): PT-AC-8 kiểm mục B5 của audit-all bằng grep nguồn, không chạy mục B5**
  Người dùng thấy gì: Việc kiểm mục B5 của bảng sức khoẻ chỉ đọc chữ trong kịch bản chứ không chạy thật. Nếu phần in kết quả hỏng thì bài kiểm tra vẫn xanh, nhưng người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là công cụ nội bộ cho người vận hành, hậu quả nhỏ và tự phát hiện được khi đọc bảng, còn chạy thật tốn công hơn lợi ích.
  file: `agent/probes/du-lieu-that.test.ts`
  severity: low
  Đề xuất: wont-fix

- **(r1) L2 bóc «Đ.» nhưng không bóc «D.»: dạng có dấu và không dấu ra khoá khác nhau**
  Người dùng thấy gì: Địa chỉ viết «D. Lang» không dấu có thể không được nhận ra là cùng đường với «Đ. Láng» có dấu. Khi đó cặp tin có thể bị coi là thiếu căn cứ thay vì khớp.
  Căn cứ: Hậu quả nhẹ và nghiêng về phía thận trọng, chỉ làm lỡ một số cặp khớp chứ không ghép nhầm, nên ghi vào giới hạn đã biết và xử sau.
  file: `agent/src/agents/judge-entity.ts`
  severity: medium
  Đề xuất: known-limits

## Đã sửa trong vòng (không cần quyết)

Hồi quy do chính vòng này gây ra, GS giao sửa trong vòng (dòng revisit/fix trong decisions.jsonl); lượt chấm r3 PASS trên bản đã sửa.

- **(r1) L2 mới biến số nhà thành khoá đường: hai địa chỉ khác đường cùng số nhà báo «Khớp»** — sửa ở 1d48a543: soDuong bỏ khoá trần chỉ gồm số nhà; CD-AC-17 đỏ khi bỏ sửa.
- **(r2) soDuong báo Khớp nhầm khi hai địa chỉ khác đường có số nhà giống ngày tháng («12/3, Nguyễn Trãi» với «12/3, Lê Lợi»)** — sửa ở 09b09495: ngoại lệ chỉ còn sáu tên đường ngày lễ của danh sách L2 main; CD-AC-17 thêm cặp «12/3».
- **(r1) Hình dạng 4 (assert âm tính đứng một mình): «lượt script không để lại tệp đột biến» không có đối chứng dương** — sửa ở ede3a41e: PT-AC-8 có đối chứng dương cho phép đếm tệp tạm.
