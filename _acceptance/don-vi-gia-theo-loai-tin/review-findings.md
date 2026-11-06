# Review findings: don-vi-gia-theo-loai-tin (round 1)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Nhãn UI mới «mã thẻ» chưa có thuật ngữ trong CONTEXT.md**
  Người dùng thấy gì: Từ «mã thẻ» hiện trên ba màn gắn nhãn nhưng chưa được ghi vào bảng từ vựng chung. Người dùng vẫn thấy và chép mã bình thường, chỉ là tên gọi chưa được chốt chính thức.
  Căn cứ: Không ảnh hưởng người dùng đang dùng màn, chỉ là sổ từ vựng thiếu một dòng, và bổ sung sau rất rẻ.
  file: `app/src/components/ops/labels/ma-the.tsx`
  severity: low
  Đề xuất: new-contract

- **gia-la.ts gõ cứng chuỗi 'rent_lt' / 'sale', không dùng KIND trong vocab.generated.ts**
  Người dùng thấy gì: Đơn vị giá và câu hỏi giá lạ hiện chạy đúng theo Loại tin. Nếu sau này tên loại tin ở nguồn đổi, chỗ này có thể lặng lẽ không theo kịp.
  Căn cứ: Hiện không có lỗi nào với người dùng và giá trị loại tin hiếm khi đổi, nên không đáng mở việc riêng.
  file: `app/src/components/ops/labels/gia-la.ts`
  severity: low
  Đề xuất: wont-fix

- **Probe phạm vi của hai hồ sơ nền đỏ trên HEAD xếp chồng hiện tại (không tính đến nhánh xếp sau)**
  Người dùng thấy gì: Hai phép kiểm phạm vi của các hồ sơ nền có thể báo đỏ khi chạy lại trên nhánh xếp chồng này, dù sản phẩm không có lỗi. Người dùng không thấy gì, nhưng cổng nghiệm thu có thể bị chặn oan.
  Căn cứ: Không ảnh hưởng người dùng cuối, chỉ có thể làm cổng báo đỏ nhầm; sửa thước đo gọn nhưng thuộc hồ sơ khác.
  file: `_acceptance/the-gan-nhan-nguoi-dang/probes/pham-vi.sh`
  severity: low
  Đề xuất: new-contract

- **Hình dạng 4 (assertion âm tính một mình): ca bảng nguồn rỗng/vắng chỉ kiểm HTML không có tên, không kiểm HTML vẫn có «Người đăng: ID <id>»**
  Người dùng thấy gì: Phép kiểm tự động cho thẻ khi bảng nguồn rỗng hơi lỏng, nên nếu dòng «Người đăng: ID» biến mất thì test có thể không bắt được. Màn hình hiện vẫn hiển thị đúng.
  Căn cứ: Chỉ là độ chặt của bài kiểm tra, người dùng không gặp lỗi, và có thể siết lại sau mà không mất dữ liệu.
  file: `app/tests/labels-nguoi-dang.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (kiểm chuỗi có mặt trong khi lời hứa là quan hệ): giờ trên HTML của thẻ ghép không phân biệt được tin chữ với bài ảnh**
  Người dùng thấy gì: Phép kiểm giờ đăng trên thẻ ghép không phân biệt được giờ của tin chữ với giờ của bài ảnh vì hai bài cách nhau chỉ vài chục giây. Nếu lấy nhầm giờ, test vẫn có thể qua.
  Căn cứ: Chênh lệch giờ chỉ vài chục giây nên người dùng gần như không nhận ra, và phần dữ liệu đã được kiểm ở mức khác.
  file: `app/tests/labels-nguoi-dang.test.tsx`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

⚠ Cụm ngoài vùng phủ: 3/5 lỗi rơi vào file không bộ đo nào phủ (_acceptance/the-gan-nhan-nguoi-dang/probes/pham-vi.sh, app/tests/labels-nguoi-dang.test.tsx) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
