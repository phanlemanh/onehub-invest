## Trong hợp đồng

- **TPL-AC-4: E4 ghi bốn hàng chữ ra 'lech' nhưng test không ghim nhãn đó, chỉ so với soGiaTri của chính module đang đo**
  AC: AC-4
  file: `app/tests/the-duyet-phuong-lech-gia.test.tsx:152`
  severity: medium
  source: conventions
  detail: Commit 6533c944 bỏ hai assert ghim cứng `"lech"` cho street và block, thay bằng `assert.equal(so, mod.soGiaTri(x, y), ...)`. Đáp án ở đây lấy từ chính module `mod`, mà `mod` có thể là bản đột biến. Trong khi đó evals.yaml E4 (dòng 33) vẫn ghi: "property_type 'Nhà riêng'/'nha-rieng', street ..., block ..., floor ... → 'lech'". Như vậy evals hứa có ghim nhãn mà test không còn ghim. Mẫu có sẵn cùng tệp là E3 / TPL-AC-3: mỗi assert so CẢ với nhãn ghim LẪN với soGiaTri. Hậu quả: nếu một thay đổi đưa chuẩn hoá kiểu khoaPhuong vào soGiaTri (rò rỉ theo chiều ngược lại, mọi hàng đều đi qua soGiaTri), cả hai vế cùng ra 'khop', ca vẫn xanh. Lúc đó bốn hàng chữ không còn bắt được đúng điều AC-4 cấm, là chuẩn hoá phường lan sang hàng khác. Hiện ca vẫn chạy xanh (đã chạy lại với CI=1: 5 pass, 1 skip). Cần ghim thêm nhãn mong đợi cho từng hàng (ví dụ cột thứ tư trong KHAC_PHUONG), hoặc sửa expected của E4 cho khớp với điều test thật sự đo.
  rationale: AC-4 đòi chín hàng còn lại so như trước vòng (ví dụ «Đường Phan Văn Trị» với «Phan Văn Trị» vẫn «Lệch»); phép đo của nó không ghim nhãn mong đợi nên không bắt được việc chuẩn hoá phường lan sang hàng khác, và lệch với điều evals đã hứa.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Danh sách chín hàng còn lại viết cứng, `KHAC_PHUONG.length === 9` không ràng vào TRUONG_GHEP_CAN**
  Người dùng thấy gì: Nếu sau này bảng so ghép căn có thêm một hàng mới, hàng đó sẽ không được kiểm tra xem có bị so nhầm theo kiểu phường hay không, mà bộ kiểm vẫn báo xanh. Hiện tại bảng có đúng mười hàng nên người dùng chưa gặp ảnh hưởng nào.
  Căn cứ: Chưa gây sai lệch nào cho người dùng, chỉ là khoảng hở kiểm tra khi bảng đổi trong tương lai; ghi lại làm hạn chế đã biết là đủ, sửa sau rẻ.
  file: `app/tests/the-duyet-phuong-lech-gia.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — assert «chuỗi có mặt» t.includes("Phường") để chứng minh có nhãn hàng luôn đúng nhờ chính giá trị, nên không đo gì (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu nhãn «Phường» bị mất hoặc hai giá trị bị đảo cột trên thẻ duyệt, bài kiểm tra vẫn báo đạt. Người duyệt vẫn thấy badge Khớp/Lệch đúng, chỉ là cách bố trí hàng không được kiểm chặt.
  Căn cứ: Hậu quả nhẹ: kết quả Khớp/Lệch người dùng nhìn thấy vẫn đúng, không mất hay lộ dữ liệu, và siết lại bài kiểm tra sau này rẻ, không cần đụng tới tính năng.
  file: `app/tests/the-duyet-phuong-lech-gia.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture evidence của TPL-AC-5 viết tay theo khuôn bên đọc (ReviewEvidence) thay vì rút từ bên ghi (r1 · tệp đã đổi)**
  Người dùng thấy gì: Hiện thẻ duyệt hiển thị đúng. Nhưng nếu sau này phần sinh thẻ đổi tên trường phường, một bài kiểm tra sẽ không báo, và hàng Phường có thể trống hoặc báo Thiếu mà không ai hay.
  Căn cứ: Chưa gây lỗi nào đang xảy ra, nếu có sự cố thì người duyệt thấy ngay trên màn hình và dữ liệu không bị mất; ghi lại làm hạn chế đã biết là đủ cho tới khi bên sinh thẻ được sửa.
  file: `app/tests/the-duyet-phuong-lech-gia.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
