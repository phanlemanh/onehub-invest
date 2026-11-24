# Review findings: lat-hai-khu-truc-khai-o (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bản đột biến ghi thẳng vào app/src/lib, lệch khuôn bản đột biến sẵn có của kho**
  Người dùng thấy gì: Nếu lượt kiểm bị ngắt đột ngột, một tệp tạm có thể nằm lại cạnh mã thật và vô tình bị đưa vào commit. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ, chỉ xảy ra khi lượt kiểm bị ngắt, người làm xoá tay được ngay và không ảnh hưởng dữ liệu hay màn hình.
  file: `app/tests/labels-lat-hai-khu-truc.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Chú thích nói lát khai ô là gắn mù nay sai với hai-khu-truc**
  Người dùng thấy gì: Chú thích trong mã còn ghi lát này là gắn mù trong khi nay nó hiện nháp máy. Người duyệt không thấy gì sai, chỉ người sửa mã sau này dễ hiểu nhầm.
  Căn cứ: Không đổi gì trên màn hình hay dữ liệu, sửa lúc nào cũng rẻ, rủi ro chỉ là người đọc mã hiểu sai.
  file: `app/src/components/ops/labels/label-form-nhom.tsx`
  severity: low
  Đề xuất: known-limits

- **Mô tả trang của lát khai ô vẫn ghi «toà, phân khu hoặc cụm» và «Máy không cho thấy nó đã đọc ra gì», trong khi hai-khu-truc hỏi Toà + Trục và đang hiện nháp máy**
  Người dùng thấy gì: Đầu trang gắn nhãn bảo người duyệt ghi phân khu hoặc cụm và nói máy không cho thấy gì, trong khi bên dưới chỉ có Toà và Trục và đã điền sẵn nháp máy. Người duyệt 110 bài có thể bối rối về việc ô điền sẵn là của máy.
  Căn cứ: Gây hiểu nhầm cho người duyệt đúng ở lát này nhưng không làm mất hay sai dữ liệu, sửa nhỏ và nên làm trong một hàng riêng.
  file: `app/src/components/ops/labels/labels-view.tsx`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 1: chiều đỏ AC-4 đo vị từ cấu hình hienNhap, không đo đầu ra gắn mù (nhapChoLat, biểu mẫu)**
  Người dùng thấy gì: Bài kiểm chứng cho thấy lát gắn mù không bị lộ nháp còn đo hơi gián tiếp. Người dùng không thấy khác biệt nào, chỉ là lưới an toàn bắt lỗi sau này mỏng hơn dự kiến.
  Căn cứ: Không làm sai màn hình hiện tại, chỉ làm lưới bắt lỗi tương lai yếu hơn, có thể bổ sung sau với giá rẻ.
  file: `app/tests/labels-lat-hai-khu-truc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: biểu mẫu AC-4 nhận nháp viết tay, không lấy đầu ra của nhapChoLat (thiếu round-trip máy chủ → màn)**
  Người dùng thấy gì: Chưa có bài kiểm nối liền từ máy chủ tới màn cho nháp của trợ lý. Nếu sau này hình dạng nháp đổi, màn có thể hỏng mà bài kiểm vẫn xanh.
  Căn cứ: Hiện chưa có lỗi thật, rủi ro chỉ xuất hiện khi có thay đổi sau này, và người duyệt sẽ thấy ngay trên màn nên tự phát hiện được.
  file: `app/tests/labels-lat-hai-khu-truc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5: AC-2 hứa «mỗi ô có «Không suy ra được»» nhưng chỉ kiểm ô Trục**
  Người dùng thấy gì: Bài kiểm mới xác nhận lựa chọn «Không suy ra được» cho ô Trục, chưa kiểm ô Toà. Trên màn rất có thể vẫn đúng, chỉ chưa được chứng minh bằng bài kiểm.
  Căn cứ: Không có hỏng hóc thấy được, người duyệt nhìn màn là biết ngay, bổ sung kiểm thêm một ô rất rẻ.
  file: `app/tests/labels-lat-hai-khu-truc.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: đối chứng «lát không khai vẫn đủ ô» chỉ so length > 2**
  Người dùng thấy gì: Bài kiểm chỉ xác nhận lát khác vẫn hiện nhiều hơn hai ô, chưa xác nhận đủ cả 17 ô. Nếu một lát mất ô thì bài kiểm chưa chắc bắt được.
  Căn cứ: Không gây lỗi hiện tại và dễ nhận ra khi duyệt, chỉ làm lưới bắt lỗi thưa hơn.
  file: `app/tests/labels-lat-hai-khu-truc.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4: «không ô căn cứ», «không ô Lý do» là assert âm một mình, không có đối chứng dương trên cùng bộ chọn**
  Người dùng thấy gì: Bài kiểm khẳng định lát này không có ô căn cứ và ô Lý do, nhưng chưa chứng minh bộ dò của nó còn tìm được các ô đó ở lát khác. Nếu chữ trên màn đổi, bài kiểm có thể xanh giả.
  Căn cứ: Chỉ có nguy cơ về sau khi nhãn đổi, không ảnh hưởng người dùng hiện tại và bổ sung đối chứng rất rẻ.
  file: `app/tests/labels-lat-hai-khu-truc.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

