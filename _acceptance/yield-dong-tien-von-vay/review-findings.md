# Review findings: yield-dong-tien-von-vay (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Smoke bỏ qua lặng lẽ ca mã phường của thị trường chưa có số: dữ liệu thật không có phường nào như vậy**
  Người dùng thấy gì: Bước kiểm tự động chưa thật sự thử trường hợp một phường thuộc thị trường chưa có số liệu giá bán/thuê, dù báo là đã qua. Người dùng không thấy lỗi nào; chỉ là trường hợp hiếm này chưa được kiểm chứng tự động.
  Căn cứ: Không ảnh hưởng người dùng đang dùng vì trang vẫn chạy đúng với dữ liệu hiện có và trường hợp này hiếm; chỉ làm bằng chứng kiểm thử yếu hơn vẻ ngoài, ghi lại là đủ.
  file: `scripts/smoke-yield-dong-tien.mjs`
  severity: low
  Đề xuất: known-limits

- **Lưới vốn vay không truyền i18n: nút mở/gập mục đọc tiếng Anh «Expand row»/«Collapse row» (r1)**
  Người dùng thấy gì: Người dùng đọc màn hình sẽ nghe nút mở/gập khoản mục của bảng vốn vay bằng tiếng Anh, trong khi cả cổng còn lại là tiếng Việt. Người nhìn thấy bảng không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng nhóm nhỏ người dùng đọc màn hình, không sai số liệu, không mất dữ liệu, và sửa sau rất rẻ.
  file: `app/src/components/yield/financing/financing-grid.tsx`
  severity: medium
  Đề xuất: known-limits

- **Nhãn chỉ số vốn vay lệch từ vựng CONTEXT.md, thuật ngữ mới chưa vào glossary (r1)**
  Người dùng thấy gì: Một số tên chỉ số trong bảng vốn vay (như «Tiền mặt bỏ ra», «Dòng tiền / tiền mặt năm 1») khác từ vựng chuẩn của dự án, nên người đọc có thể thấy chỗ gọi tên này chỗ gọi tên khác. Số liệu vẫn đúng.
  Căn cứ: Chỉ là lệch cách gọi tên, không làm sai số hay mất dữ liệu, và có thể chỉnh chữ hoặc bổ sung bảng thuật ngữ sau với chi phí thấp.
  file: `app/src/components/yield/financing/financing-grid.tsx`
  severity: medium
  Đề xuất: known-limits

- **Tham số URL mới eq/rate/term không theo luật camelCase-theo-tên-code và không ghi vào CONTEXT.md (r1)**
  Người dùng thấy gì: Đường dẫn ước tính dùng tên tham số viết tắt (eq, rate, term) chưa theo quy ước đặt tên chung và chưa ghi vào từ vựng. Người dùng vẫn chia sẻ và mở lại link bình thường.
  Căn cứ: Không ảnh hưởng chức năng hay dữ liệu, chỉ lệch quy ước; đổi tên sau sẽ làm link đã chia sẻ cũ hỏng nên nên gom vào đợt dọn tham số URL chung.
  file: `app/src/components/yield/yield-form.tsx`
  severity: low
  Đề xuất: known-limits

- **config.yaml mất dấu cách sau ':' ở methodology_design_gate, file không còn là YAML hợp lệ (r1)**
  Người dùng thấy gì: Một dòng cấu hình của cổng nghiệm thu bị mất dấu cách; công cụ của cổng vẫn chạy được nhưng công cụ đọc YAML chuẩn khác sẽ báo lỗi. Người dùng cuối không thấy gì.
  Căn cứ: Không ảnh hưởng người dùng cuối và cổng hiện không đỏ; sửa một ký tự bất cứ lúc nào, rất rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Sự kiện dau_tu_input giữ tên cũ nhưng đổi đơn vị payload (phần trăm → tỉ lệ) (r1)**
  Người dùng thấy gì: Lịch sử thao tác nhập liệu đầu tư của người dùng giờ lẫn hai cách ghi (phần trăm cũ, tỉ lệ mới) dưới cùng một loại sự kiện, nên trợ lý AI đọc lại có thể hiểu nhầm số cũ.
  Căn cứ: Chỉ ảnh hưởng độ chính xác khi trợ lý đọc lại lịch sử cũ, không hiện ra cho người dùng, không mất dữ liệu, và có thể xử lý khi đọc sau này.
  file: `app/src/components/yield/yield-form.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): mục 7 của check-portal-compliance chỉ còn phép kiểm âm, và tệp thiếu vẫn ra ĐẠT (r1)**
  Người dùng thấy gì: Kiểm tra tự động về quy tắc cổng công khai có thể vẫn báo đạt nếu một tệp bị đổi tên hoặc dời chỗ, nên rò rỉ về sau có thể không bị bắt. Người dùng không thấy gì hôm nay.
  Căn cứ: Hôm nay không có rò rỉ nào và chỉ là rào kiểm yếu đi về sau; gia cố lúc nào cũng được với chi phí thấp.
  file: `scripts/check-portal-compliance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (thiếu đối chứng dương): smoke đo việc kẹp rate/term chỉ bằng phép so bằng, không ghim được ngưỡng (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép thử tự động chưa chứng minh được giới hạn lãi suất và kỳ hạn vay nằm đúng mức; nếu ngưỡng bị đổi nhầm thì người dùng có thể thấy số trả nợ lệch mà bài thử vẫn xanh.
  Căn cứ: Hiện chưa có dấu hiệu ngưỡng sai, chỉ là phép thử chưa đủ chặt, và người dùng tự thấy số khi tinh chỉnh; bổ sung phép thử sau là rẻ.
  file: `scripts/smoke-yield-dong-tien.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
