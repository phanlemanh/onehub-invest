# Review findings: people-hien-so-goc (round 1)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Mở tên người đăng trên /ops/deals cho vai Vận hành mà không qua bộ che tên nguồn**
  Người dùng thấy gì: Trên trang Căn giá tốt, nhân viên Vận hành giờ thấy tên người đăng tin. Nếu tên đó trùng tên thật của một nguồn thu thập thì tên nguồn bị lộ, trong khi các trang khác đã che. Hiện 4 tin đang hiện chưa dính trường hợp này.
  Căn cứ: Chưa có ai bị lộ thật nhưng đây là loại thông tin phải giữ kín, và nhân viên nội bộ không tự phát hiện được; sửa nên làm thành việc riêng có kiểm thử.
  file: `app/src/components/ops/deal-card.tsx`
  severity: medium
  Đề xuất: new-contract

- **Eval đã ký portal-deals-airdna E5 vẫn ghi cổng isAdmin, trong khi cổng đã đổi và không khai thay bởi**
  Người dùng thấy gì: Một mục kiểm cũ vẫn ghi rằng chỉ quản trị viên thấy số điện thoại và tên trên Căn giá tốt, dù nay vai Vận hành cũng thấy. Người dùng không bị ảnh hưởng, chỉ là hồ sơ nghiệm thu ghi lệch thực tế.
  Căn cứ: Không ảnh hưởng người dùng cuối, chỉ làm hồ sơ cũ gây hiểu nhầm; sửa rất rẻ và có thể làm sau.
  file: `_acceptance/portal-deals-airdna/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Probe AC-10 tính vai Người xem là đạt cả khi trang không hề vẽ: không kiểm HTTP, không có đối chứng dương cho viewer, kênh RSC không có đối chứng ở vai nào**
  Người dùng thấy gì: Phép kiểm thử trên bản chạy thật có thể báo đạt cho vai Người xem dù trang không hiện gì (ví dụ bị đẩy về trang đăng nhập). Số điện thoại hiện không bị lộ, nhưng phép kiểm chưa chứng minh được điều đó chắc chắn.
  Căn cứ: Không có người dùng nào bị lộ số hôm nay, nhưng bằng chứng chống lộ số cho vai Người xem còn có thể xanh giả; siết lại rẻ và nên làm sớm.
  file: `_acceptance/people-hien-so-goc/probes/html-vai.mjs`
  severity: medium
  Đề xuất: new-contract

- **getDeals nuốt mọi lỗi của truy vấn đầy đủ: ở máy thu, vai Vận hành mất liên hệ không dấu vết và được báo sai lý do**
  Người dùng thấy gì: Nếu truy vấn gặp lỗi tạm thời trên máy thu, trang Căn giá tốt vẫn hiện đủ tin nhưng lặng lẽ mất phần liên hệ, kèm chú thích sai là thông tin chỉ có ở máy thu. Người dùng không biết có lỗi để bấm thử lại.
  Căn cứ: Chỉ làm mất phần liên hệ chứ không mất tin, tải lại thường khắc phục, nhưng lỗi bị che nên khó phát hiện; nên sửa trong một việc riêng.
  file: `app/src/lib/deals.ts`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4 (âm tính một mình): vai Người xem đạt 0 số trên HTML/RSC mà không chứng minh đã tải được trang, và kênh RSC không có đối chứng dương**
  Người dùng thấy gì: Kết luận «vai Người xem không thấy số» có thể đúng chỉ vì trang không tải được, chứ chưa chắc vì số đã được che. Hiện chưa có dấu hiệu số bị lộ.
  Căn cứ: Đây là bằng chứng duy nhất trên bản chạy thật cho việc không lộ số, nên đáng củng cố, nhưng không có ai bị ảnh hưởng ngay và sửa chỉ là siết phép kiểm.
  file: `_acceptance/people-hien-so-goc/probes/html-vai.mjs`
  severity: high
  Đề xuất: new-contract

- **Hình dạng 5 (tuyên quét lớp nhưng thiếu ma trận): bộ quét số mù với dạng thứ sáu và với các dạng URL-encode, không có ma trận dương theo từng dạng**
  Người dùng thấy gì: Bộ kiểm tra số điện thoại bỏ sót vài cách viết như «+84 912 345 678» hoặc dạng mã hoá trên địa chỉ trang. Nếu sau này số bị lộ theo các cách viết đó thì phép kiểm sẽ không báo.
  Căn cứ: Chưa có số nào bị lộ, nhưng lưới an toàn có lỗ hổng có thể làm lọt lỗi về sau; sửa rẻ và không đụng tới sản phẩm.
  file: `_acceptance/people-hien-so-goc/probes/html-vai.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): «bản cloud» của AC-6 là hàng tự null hoá, không rút từ dealsSql({cloud}), nên assert không thể đỏ**
  Người dùng thấy gì: Phép kiểm «bản cloud không hiện liên hệ» dùng dữ liệu tự dựng nên không bắt được lỗi nếu bản cloud thật vô tình lộ liên hệ. Hiện chưa có dấu hiệu lộ.
  Căn cứ: Ca này khó đỏ nên bảo vệ kém, nhưng việc cloud không có số còn được giữ bởi cấu trúc dữ liệu và các kiểm tra khác; chấp nhận được khi ghi rõ giới hạn.
  file: `app/tests/danh-ba-nguoi-deals-lien-he.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ): SHS-AC-2 không buộc «Đã nghỉ» vào đúng số đã nghỉ**
  Người dùng thấy gì: Trên trang một người, nhãn «Đã nghỉ» có thể bị gắn nhầm sang số đang dùng mà phép kiểm vẫn không báo. Hiện chưa thấy trang nào hiện sai.
  Căn cứ: Nếu sai thì người vận hành có thể bỏ qua số còn dùng, nhưng chưa có bằng chứng xảy ra và có thể nhìn thấy ngay trên trang; mức nhẹ.
  file: `app/tests/danh-ba-nguoi-tren-ops.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính không có đối chứng): ca `0912` «không ra người có số» không thể đỏ vì `0912` không phải chuỗi con của số E.164 nào trong fixture**
  Người dùng thấy gì: Việc gõ dở số như «0912» không dò ra người có số được kiểm bằng một ca khó bắt lỗi. Nếu sau này tìm dở số vô tình dò được số thì phép kiểm không báo.
  Căn cứ: Hợp đồng đã loại tìm theo một phần số khỏi phạm vi, nên đây chỉ là phép kiểm yếu và hậu quả nhỏ.
  file: `app/tests/danh-ba-nguoi-tren-ops.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (chỉ so số đếm trong khi lời hứa là quan hệ): SHS-DC so số hàng hiện số với n, không so tập người và không so số hiện với số của người đó**
  Người dùng thấy gì: Phép đối chiếu trên dữ liệu thật chỉ đếm số người hiện số chứ không kiểm từng người có đúng số của mình. Nếu hai người bị đổi số cho nhau thì phép đếm vẫn đạt.
  Căn cứ: Lỗi đổi số giữa các người khó xảy ra vì số lấy theo từng người, và đường tìm theo số đã kiểm đúng người; mức nhẹ.
  file: `app/tests/danh-ba-nguoi-doi-chieu.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): E12 và AC-10 nói «mọi trang» nhưng probe chỉ tải trang 2 và một khoá người**
  Người dùng thấy gì: Phép kiểm trên bản chạy thật chỉ thử một vài trang mẫu của danh bạ và một người, chưa duyệt hết. Một trang khác nếu lộ số thì phép kiểm có thể không thấy.
  Căn cứ: Các trang dùng chung một cách vẽ nên khả năng lộ riêng ở trang sau thấp; chấp nhận ghi giới hạn mẫu thay vì duyệt hết.
  file: `_acceptance/people-hien-so-goc/probes/html-vai.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
