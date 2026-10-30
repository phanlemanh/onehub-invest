# Review findings: do-danh-ba-sdt (round 2)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **N5: bộ dò rộng bỏ sót số đứng sau chữ kết thúc bằng «o» (zalo, alo) nên N5 đếm thiếu và có thể báo pass sai**
  Người dùng thấy gì: Số điện thoại viết kiểu «zalo 091 23•45 678» không được đếm vào phần bài còn sót số. Màn Kiểm chất lượng có thể báo đạt dù vẫn còn vài bài như vậy.
  Căn cứ: Chỉ làm số đo thiếu chứ không mất hay lộ dữ liệu, và kiểm này vốn chỉ là số trước khi sửa; chỉnh bộ dò sau này rẻ và không ảnh hưởng người dùng cuối.
  file: `pipeline/do-danh-ba-sdt.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: fixture viết tay đúng khuôn bên đọc — «vai đã rút» và «đã gộp» chưa từng đi qua bên ghi/đọc thật**
  Người dùng thấy gì: Bài kiểm thử chưa chứng minh được hai quy tắc loại trừ (vai đã rút, người đã gộp). Nếu ai đó lỡ bỏ một quy tắc, số đo có thể lệch mà kiểm thử vẫn xanh.
  Căn cứ: Không gây mất hay lộ dữ liệu cho người dùng, chỉ làm lưới an toàn khi sửa code về sau mỏng hơn; bổ sung ca thử sau này rẻ.
  file: `pipeline/do-danh-ba-sdt.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1: đo chỉ dẫn thay vì đầu ra — «bộ bóc là extractPhones (so tham chiếu hàm)» kiểm bằng grep mã nguồn**
  Người dùng thấy gì: Bài kiểm thử xác nhận «dùng đúng bộ bóc số» chỉ bằng cách đọc chữ trong tệp, chưa đo hành vi thật. Người dùng không thấy ảnh hưởng gì.
  Căn cứ: Không tác động đến số liệu người dùng thấy, và các phép đo khác đã bắt lệch hành vi; chi phí sửa lớn hơn lợi ích.
  file: `pipeline/do-danh-ba-sdt.test.mjs`
  severity: medium
  Đề xuất: wont-fix

- **Hình dạng 5: tuyên ma trận theo ca nhưng chỉ assert số gộp — các ca N5/N4 có thể bù trừ nhau**
  Người dùng thấy gì: Bài kiểm thử chỉ so tổng số, nên hai lỗi ngược chiều có thể triệt tiêu nhau và không bị phát hiện. Người dùng không thấy ảnh hưởng trực tiếp.
  Căn cứ: Rủi ro rất thấp vì còn phép đối chiếu độc lập ở tầng khác, không mất dữ liệu; sửa tốn công mà ít lợi.
  file: `pipeline/do-danh-ba-sdt.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4: quét PII chỉ có assertion âm tính, không có đối chứng dương**
  Người dùng thấy gì: Phép quét kiểm tra có lọt số điện thoại hay khoá băm vào bảng kết quả chưa được thử trên ca có thật, nên có thể không bắt được nếu có rò. Hiện chưa thấy rò rỉ thật.
  Căn cứ: Chưa có bằng chứng dữ liệu bị lộ; nếu lộ thì đây là thông tin nội bộ ở màn Ops. Thêm ca đối chứng sau này rẻ và nên ghi lại như hạn chế đã biết.
  file: `_acceptance/do-danh-ba-sdt/probes/db.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): ca «có vai đã rút vẫn tính không vai» không hề có vai rút nào (r1)**
  Người dùng thấy gì: Nếu ai đó vô tình đổi cách tính người có vai đã rút, phép kiểm đêm có thể đếm sai số người SĐT không vai mà các phép thử hiện tại không báo đỏ. Số liệu hiển thị hôm nay vẫn đúng.
  Căn cứ: Hậu quả nhẹ: chỉ là lỗ hổng bắt hồi quy trong tương lai, không làm mất hay lộ dữ liệu, và có thể bổ sung phép thử sau với chi phí rẻ.
  file: `pipeline/do-danh-ba-sdt.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): «cùng tham chiếu hàm extractPhones» chỉ là grep dòng import (r1)**
  Người dùng thấy gì: Phép thử hiện chỉ kiểm tệp có nạp đúng bộ bóc SĐT, chưa kiểm bộ bóc thực chạy. Nếu sau này có người thay bằng bản chép, số tin nhiều SĐT có thể lệch mà không ai hay.
  Căn cứ: Rủi ro thấp và chỉ xảy ra khi có thay đổi mã sau này; hiện lệnh vẫn đo đúng, và đối chiếu độc lập ở phép đo số liệu vẫn bắt lệch số.
  file: `pipeline/do-danh-ba-sdt.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): quét SĐT/khoá băm trong dq_check_results không có đối chứng dương, và thiếu ca sender_name (r1)**
  Người dùng thấy gì: Phép kiểm tra «không lộ số điện thoại hay khoá băm» chỉ biết báo sạch, chưa chứng minh được nó sẽ bắt được khi có số lọt vào. Sản phẩm vẫn chạy đúng, nhưng nếu sau này có số điện thoại lọt vào kết quả đo thì phép kiểm tra có thể không báo.
  Căn cứ: Nhẹ: chỉ là độ tin cậy của một phép kiểm tra phụ, hiện chưa thấy dữ liệu nào bị lộ, và bổ sung ca đối chứng sau này rẻ, không mất dữ liệu.
  file: `_acceptance/do-danh-ba-sdt/probes/db.mjs`
  severity: low
  Đề xuất: known-limits

- **Bộ dò rộng N5 nuốt mất SĐT đứng sau từ tận cùng bằng «o» (vd «Zalo 09…») nên N5 đếm thiếu mà không báo gì (r1)**
  Người dùng thấy gì: Số bài bị bỏ sót số điện thoại có thể bị đếm thiếu khi số đứng ngay sau chữ «Zalo». Màn chất lượng có thể báo đạt trong khi vẫn còn bài lọt.
  Căn cứ: Chỉ làm số đo nội bộ thấp hơn thực tế ở một kiểu tin, không mất hay lộ dữ liệu người dùng, và số này vốn đang báo chưa đạt nên chưa gây hiểu lầm lớn.
  file: `pipeline/do-danh-ba-sdt.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: 'cặp đã merged' và 'vai đã rút' chỉ là Set dựng tay, đường SQL sinh ra chúng không được đo (r1)**
  Người dùng thấy gì: Nếu sau này ai đó sửa nhầm cách tính người đã gộp hoặc vai đã rút, bộ kiểm có thể vẫn xanh và số trên màn chất lượng lệch mà không ai hay.
  Căn cứ: Không ảnh hưởng người dùng hiện tại vì số đo đang đúng; rủi ro chỉ xuất hiện khi có sửa đổi sau này và có thể bổ sung phép thử sau với chi phí thấp.
  file: `pipeline/do-danh-ba-sdt.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên ma trận 'số assert = số phần tử' nhưng các ca bị gộp thành ô tổng (r1)**
  Người dùng thấy gì: Một số ca riêng lẻ được kiểm gộp chung nên một lỗi nhỏ ở một ca có thể bị che bởi ca khác. Người dùng cuối không thấy ảnh hưởng trực tiếp.
  Căn cứ: Chỉ là độ mịn của bộ kiểm nội bộ, đã có phép đo độc lập bù lại; tách nhỏ ra tốn công mà ít thêm bảo vệ.
  file: `pipeline/do-danh-ba-sdt.test.mjs`
  severity: medium
  Đề xuất: wont-fix

- **Hình dạng 1 — đo mã nguồn thay vì đầu ra: 'bộ bóc là extractPhones (so tham chiếu hàm)' kiểm bằng grep dòng import (r1)**
  Người dùng thấy gì: Bộ kiểm chỉ xác nhận dòng khai báo còn đó chứ không chứng minh số đo dùng đúng bộ bóc số điện thoại. Hiện số liệu vẫn đúng nên người dùng chưa bị ảnh hưởng.
  Căn cứ: Số đo hiện đã trùng phép đo độc lập nên kết quả đúng; lỗ hổng chỉ là phép thử lỏng và sửa sau rẻ nhưng không cấp bách.
  file: `pipeline/do-danh-ba-sdt.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 — quét lọt SĐT/khoá băm chỉ có chiều âm, không đối chứng dương, và fixture không sinh được chuỗi để bắt (r1)**
  Người dùng thấy gì: Phép kiểm không lộ số điện thoại có thể không bắt được nếu sau này có số lọt vào kết quả ghi. Hiện chưa có bằng chứng số nào bị lọt.
  Căn cứ: Hậu quả tiềm năng là lộ định danh nên đáng ghi nhận, nhưng hiện chưa lọt và người ký có thể chấp nhận ghi hạn chế rồi bổ sung phép đối chứng sau.
  file: `_acceptance/do-danh-ba-sdt/probes/db.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
