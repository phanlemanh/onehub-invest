# Review findings: don-vi-gia-theo-loai-tin (round 2)

## Trong hợp đồng

Không có finding.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

Không có finding mới ở round này (9 mục carried từ round trước do máy tự chèn).

- **Nhãn UI mới «mã thẻ» chưa có thuật ngữ trong CONTEXT.md (r1)**
  Người dùng thấy gì: Từ «mã thẻ» hiện trên ba màn gắn nhãn nhưng chưa được ghi vào bảng từ vựng chung. Người dùng vẫn thấy và chép mã bình thường, chỉ là tên gọi chưa được chốt chính thức.
  Căn cứ: Không ảnh hưởng người dùng đang dùng màn, chỉ là sổ từ vựng thiếu một dòng, và bổ sung sau rất rẻ.
  file: `app/src/components/ops/labels/ma-the.tsx`
  severity: low
  Đề xuất: new-contract

- **gia-la.ts gõ cứng chuỗi 'rent_lt' / 'sale', không dùng KIND trong vocab.generated.ts (r1 · tệp đã đổi)**
  Người dùng thấy gì: Đơn vị giá và câu hỏi giá lạ hiện chạy đúng theo Loại tin. Nếu sau này tên loại tin ở nguồn đổi, chỗ này có thể lặng lẽ không theo kịp.
  Căn cứ: Hiện không có lỗi nào với người dùng và giá trị loại tin hiếm khi đổi, nên không đáng mở việc riêng.
  file: `app/src/components/ops/labels/gia-la.ts`
  severity: low
  Đề xuất: wont-fix

- **Probe phạm vi của hai hồ sơ nền đỏ trên HEAD xếp chồng hiện tại (không tính đến nhánh xếp sau) (r1)**
  Người dùng thấy gì: Hai phép kiểm phạm vi của các hồ sơ nền có thể báo đỏ khi chạy lại trên nhánh xếp chồng này, dù sản phẩm không có lỗi. Người dùng không thấy gì, nhưng cổng nghiệm thu có thể bị chặn oan.
  Căn cứ: Không ảnh hưởng người dùng cuối, chỉ có thể làm cổng báo đỏ nhầm; sửa thước đo gọn nhưng thuộc hồ sơ khác.
  file: `_acceptance/the-gan-nhan-nguoi-dang/probes/pham-vi.sh`
  severity: low
  Đề xuất: new-contract

- **Hình dạng 4 (assertion âm tính một mình): ca bảng nguồn rỗng/vắng chỉ kiểm HTML không có tên, không kiểm HTML vẫn có «Người đăng: ID <id>» (r1)**
  Người dùng thấy gì: Phép kiểm tự động cho thẻ khi bảng nguồn rỗng hơi lỏng, nên nếu dòng «Người đăng: ID» biến mất thì test có thể không bắt được. Màn hình hiện vẫn hiển thị đúng.
  Căn cứ: Chỉ là độ chặt của bài kiểm tra, người dùng không gặp lỗi, và có thể siết lại sau mà không mất dữ liệu.
  file: `app/tests/labels-nguoi-dang.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (kiểm chuỗi có mặt trong khi lời hứa là quan hệ): giờ trên HTML của thẻ ghép không phân biệt được tin chữ với bài ảnh (r1)**
  Người dùng thấy gì: Phép kiểm giờ đăng trên thẻ ghép không phân biệt được giờ của tin chữ với giờ của bài ảnh vì hai bài cách nhau chỉ vài chục giây. Nếu lấy nhầm giờ, test vẫn có thể qua.
  Căn cứ: Chênh lệch giờ chỉ vài chục giây nên người dùng gần như không nhận ra, và phần dữ liệu đã được kiểm ở mức khác.
  file: `app/tests/labels-nguoi-dang.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Nhãn UI mới «mã thẻ» chưa có thuật ngữ trong CONTEXT.md, và cùng chữ đó đã mang nghĩa khác trong code (r1)**
  Người dùng thấy gì: Chữ «mã thẻ» hiện trên màn nhưng chưa có định nghĩa trong từ vựng chung, trong khi nơi khác chữ này chỉ một loại mã khác. Người đọc tài liệu có thể hiểu nhầm, còn màn hình vẫn dùng bình thường.
  Căn cứ: Chỉ ảnh hưởng cách gọi tên trong tài liệu, không làm mất hay sai dữ liệu, và bổ sung định nghĩa sau rất rẻ.
  file: `app/src/components/ops/labels/ma-the.tsx`
  severity: low
  Đề xuất: known-limits

- **docThe nay trả giờ đăng của tin chữ, nhưng lượt hai vẫn lấy giờ của dòng mẫu: cùng một thẻ ghép hiện hai giờ đăng khác nhau (r1)**
  Người dùng thấy gì: Với thẻ ghép nhiều bài, lượt một và lượt hai có thể hiện hai giờ đăng khác nhau. Có trường hợp thẻ không hiện giờ đăng.
  Căn cứ: Chỉ là chữ thông tin hiển thị lệch, không mất hay ghi sai dữ liệu nhãn, và người gắn nhãn vẫn làm việc được.
  file: `app/src/lib/labels-cum.ts`
  severity: low
  Đề xuất: known-limits

- **Lượt một và lượt hai hiện giờ đăng khác nhau cho cùng một thẻ ghép (r1)**
  Người dùng thấy gì: Cùng một thẻ ghép có thể hiện giờ đăng khác nhau ở lượt một và lượt hai, và đôi khi mất dòng giờ đăng mà không báo.
  Căn cứ: Nhẹ: chỉ sai lệch hiển thị, không mất dữ liệu, mở lại thẻ là thấy, sửa sau không đắt.
  file: `app/src/lib/labels-cum.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — kiểm âm tính đứng một mình: HTML khi bảng nguồn rỗng/vắng chỉ có doesNotMatch /Cô Mai/, không có đối chứng dương trên cùng HTML (r1)**
  Người dùng thấy gì: Một bài kiểm tự động của tính năng người đăng chưa đủ chặt, nên có thể bỏ sót khi phần hiện người đăng bị hỏng. Người dùng không thấy gì khác đi.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp, dữ liệu đã được kiểm bằng đường khác, chi phí sửa vượt lợi ích.
  file: `app/tests/labels-nguoi-dang.test.tsx`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
