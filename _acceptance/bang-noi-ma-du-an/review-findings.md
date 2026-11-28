# Review findings: bang-noi-ma-du-an (round 1)

## Trong hợp đồng

- **Hình dạng 3 (kiểm số đếm có mặt trong khi lời hứa là quan hệ): S16 giữ 5 dòng nhưng không kiểm nút đích bằng NOI_DU_AN_S16**
  file: `pipeline/tests/noi-du-an-nguon.itest.mjs:127`
  severity: medium
  AC: AC-6
  source: measurement
  detail: E6 hứa thẻ S16 có 5 dòng giu căn cứ S16-noi-san và nút đích bằng NOI_DU_AN_S16. Ca chỉ có `assert.equal(s16.tong.giu, 5)`: không so `node_id` của từng dòng giu với id của slug trong NOI_DU_AN_S16, cũng không kiểm căn cứ S16-noi-san. Nếu chép cứng trỏ sai nút mà vẫn đủ 5 dòng thì ca vẫn xanh.

- **Hình dạng 3/5 (lời hứa cho từng phần tử, chỉ kiểm có mặt một lần): 6 ca S08 mỗi ca phải ghi «quy ước dự án con có cha»**
  file: `pipeline/tests/noi-du-an-nguon.itest.mjs:131`
  severity: medium
  AC: AC-6
  source: measurement
  detail: E6 hứa thẻ bóng S08 liệt đủ 6 ca khác nối tay, mỗi ca ghi «quy ước dự án con có cha (mục 39)». Ca chỉ kiểm `s08.lech.length === 6`, rồi chạy một lần `assert.match(s08.markdown, ...)` trên cả tệp. Chỉ cần câu ấy xuất hiện một lần là xanh; không có assert cho từng ca trong 6 ca.

- **Hình dạng 5 (ô ma trận khai mà fixture không mang đặc trưng của ô): ô «nút mot_loi_khai nguồn khác» và «nút do S08 đúc» không có hạng hay nguồn đúc**
  file: `pipeline/scripts/khop-du-an.test.mjs:40`
  severity: medium
  AC: AC-2
  source: measurement
  detail: E2 khai hai ô riêng: «nút mot_loi_khai nguồn khác cùng tỉnh trùng tên → noi:T» và «nút mot_loi_khai do S08 đúc cách 150 m → noi:K2». Hàm `nut()` (dòng 17) không đặt `tier` hay `nguonDuc`. Ô `nut-ung-vien-nguon-khac` (dòng 40) chạy trên đúng nút 5 thường như ô T (dòng 37), chỉ khác là không có xã, tức là bản sao của ô T. NUT_S08 (dòng 83) cũng không phải nút mot_loi_khai do S08 đúc. Nếu bộ khớp sau này lọc hay chặn theo hạng hoặc nguồn đúc thì các ô này không đỏ được; ma trận 12 ô thực ra không phủ hai ô đã khai.

- **Hình dạng 1 (đo bản chép của bên đọc thay vì đầu ra của bên đọc): s09-dung và danh-ba-vat-the được thay bằng một câu SQL của probe**
  file: `pipeline/scripts/noi-du-an-nguon-that.mjs:100`
  severity: medium
  AC: AC-7
  source: measurement
  detail: E7 hứa đo «bản đồ bí danh toà, trục, căn mà s09-dung (S09) và danh-ba-vat-the (S08) đọc». Hàm `chup()` không gọi bộ đọc của hai module đó mà băm câu SQL tự viết: `registry_aliases WHERE ... source = '<nguồn>' AND value NOT LIKE 'du\_an/%'`. Bộ lọc loại đúng khuôn giá trị mà DA3 ghi, nên phép so luôn bằng theo cách dựng. Chiều đỏ `--cay-do` (chèn 'da3-cay-do/toa-x') chỉ chứng minh câu SQL của probe thấy dòng mới, không chứng minh s09-dung thật đổi đầu ra. Nhãn in ra 'LỆCH bên đọc s09-dung' gọi tên bên đọc mà bên đọc ấy không được chạy.

- **Hình dạng 4 (chiều đỏ ghim lỏng): đột biến 400 m chấp nhận ô 301 m thay cho ô 350 m đã hứa**
  file: `pipeline/scripts/khop-du-an.test.mjs:102`
  severity: low
  AC: AC-2
  source: measurement
  detail: E2 hứa: nâng ngưỡng K2 lên 400 m thì ô 350 m đỏ. Regex của `assert.throws` là `/ô K2 biên 301m-khac-xa ...|ô K2 biên 350m-khac-xa .../`. `kiemBienK2` dừng ở ô lỗi đầu tiên, với ngưỡng 400 m ô đó là 301m-khac-xa, nên ô 350 m không bao giờ được chứng minh là đỏ. Phép đo không phân biệt được với đột biến chỉ làm hỏng ô 301 m.

- **Hình dạng 5 (tuyên quét mọi mã, chỉ quét một phần): kiểm 'thẻ không chứa mã' chỉ xét ô bảng sau tiêu đề ## đầu tiên**
  file: `pipeline/tests/noi-du-an-nguon.itest.mjs:45`
  severity: low
  AC: AC-3
  source: measurement
  detail: E3 hứa 'tệp không chứa mã dự án nguồn nào (quét mọi mã của bản ghi)'. Ca chỉ tách các ô `| ... |` nằm sau `\n## ` đầu tiên rồi so khớp nguyên ô với mã. Mã nằm trong dòng chữ thường, trong phần trước `##`, hay ghép với chữ khác trong một ô (ví dụ 'Tên (123)') đều lọt. Nếu `indexOf` trả -1 thì `slice(-1)` chỉ còn một ký tự. Phép đo không phủ trọn tệp như lời hứa.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bốn executor noi_da_* mới trong config.yaml trỏ tới tệp test không tồn tại (còn sót từ thiết kế S1 đã bỏ)**
  Người dùng thấy gì: Trong tệp cấu hình chung còn bốn lệnh kiểm trỏ tới tệp không có. Người dùng cuối không thấy gì; chỉ khi ai đó gọi nhầm lệnh ấy thì báo đỏ vô nghĩa.
  Căn cứ: Nhẹ: không ảnh hưởng dữ liệu hay màn hình, không eval nào dùng, gỡ sau rất rẻ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **suite-neu-doi: lý do thêm vùng _acceptance/bang-noi-ma-du-an/** vào LOI_APP sai, suite app không chạy app/probes**
  Người dùng thấy gì: Mỗi lần sửa hồ sơ này, bộ kiểm của app chạy thừa một lượt. Chỉ tốn thời gian chạy, không ảnh hưởng người dùng.
  Căn cứ: Chỉ làm chậm kiểm tra chứ không mất hay lộ dữ liệu; sửa tốn công hơn lợi ích.
  file: `scripts/suite-neu-doi.mjs`
  severity: low
  Đề xuất: wont-fix

- **Probe TDB-DC (registry-doi-chieu) chưa theo đổi S09 của doc.ts nên đỏ trên DB máy thu**
  Người dùng thấy gì: Một phép kiểm của màn danh bạ sẽ báo đỏ dù màn hình đã hiện đúng theo cách đếm S09 mới. Người dùng không thấy lỗi, nhưng cổng của vài hồ sơ khác bị đỏ giả.
  Căn cứ: Không sai dữ liệu hay màn hình, chỉ làm cổng kiểm của hồ sơ khác đỏ giả; cần cập nhật phép kiểm ở hồ sơ sở hữu nó.
  file: `app/probes/registry-doi-chieu.test.tsx`
  severity: high
  Đề xuất: new-contract

- **Áp thẻ ghi đè rule_id của dòng nối sẵn không do DA3 ghi ('giu'); đảo luật noi-san làm mất các dòng nối ấy**
  Người dùng thấy gì: Nếu sau này có dự án được nối tay hoặc từ bước khác ở S07, S10, S16, việc áp rồi đảo thẻ có thể làm mất dấu nối đó. Hiện chưa có dòng nào như vậy nên chưa ảnh hưởng.
  Căn cứ: Chưa xảy ra trên dữ liệu thật và chưa ai chạm tới; nhưng nếu xảy ra có thể mất nối tay khó khôi phục, nên ghi rõ và sửa trước khi có nối tay ở ba nguồn này.
  file: `pipeline/noi-du-an-nguon.mjs`
  severity: medium
  Đề xuất: known-limits

- **Executor noi_da_* trong config.yaml trỏ tới các tệp test không có**
  Người dùng thấy gì: Trong tệp cấu hình chung còn lệnh kiểm trỏ tới tệp không tồn tại; chỉ gây đỏ vô nghĩa nếu ai gọi tới.
  Căn cứ: Nhẹ: không động tới dữ liệu hay màn hình, không eval nào gọi, gỡ sau rất rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Công cụ đo S1 q.mjs nuốt lỗi SQL và vẫn thoát 0**
  Người dùng thấy gì: Công cụ đo phụ có thể im lặng bỏ qua một câu truy vấn lỗi. Không ảnh hưởng người dùng hay dữ liệu.
  Căn cứ: Chỉ là công cụ đo dùng tay ở giai đoạn thiết kế, người chạy thấy dòng lỗi ngay; sửa không đáng công.
  file: `_acceptance/bang-noi-ma-du-an/probes/s1/q.mjs`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 8/12 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml, scripts/suite-neu-doi.mjs, app/probes/registry-doi-chieu.test.tsx, _acceptance/bang-noi-ma-du-an/probes/s1/q.mjs, pipeline/scripts/khop-du-an.test.mjs, pipeline/scripts/noi-du-an-nguon-that.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
