# Review findings: ghep-tin-vao-truc-can (round 4)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **maTrongChu không bắt được mã căn khi tên toà có khoảng trắng mà chữ bài viết đúng như tên**
  Người dùng thấy gì: Với một số toà có tên nhiều chữ, tin chỉ ghi mã căn trong chữ bài sẽ không được gắn xuống trục hay căn mà không có cảnh báo nào. Tin vẫn nằm ở mức toà như hiện nay.
  Căn cứ: Hậu quả nhẹ: tin không mất và không bị gắn sai, chỉ dừng ở mức toà như trước. Chưa đo được bao nhiêu toà thuộc hai khu đang chấm bị ảnh hưởng, nên ghi là hạn chế đã biết trước.
  file: `pipeline/lib/ghep-tin-truc-can.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture danh bạ viết tay đúng khuôn bên đọc, không round-trip qua docDanhBa**
  Người dùng thấy gì: Một số bước chuẩn hoá khoá trục, khoá tầng và bí danh khi đọc danh bạ chưa được kiểm riêng. Nếu chúng sai thì bộ kiểm hiện tại không báo.
  Căn cứ: Không ảnh hưởng người dùng ngay vì chưa thấy lỗi thật, chỉ là lưới kiểm thủng một chỗ. Sửa sau không đắt và không làm mất dữ liệu.
  file: `pipeline/scripts/ghep-tin-truc-can.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 — tệp thẻ cài lỗi của lệnh chấm đọc từ checkout chính của tác giả, không ghim băm**
  Người dùng thấy gì: Con số độ chính xác gắn trục có thể đổi nếu tệp bài cài lỗi ở máy chính bị sửa, mà lệnh chấm không báo lệch. Người ký có thể thấy một con số không tái lập được.
  Căn cứ: Không mất dữ liệu người dùng, chỉ làm số chấm kém tin cậy khi chạy ở máy khác. Người chấm tự chạy lại được và việc ghim thêm tệp này sửa sau rẻ.
  file: `_acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — ca kiểm «try riêng, sau bước gắn toà» đọc văn bản mã transform-zalo.mjs thay vì đầu ra**
  Người dùng thấy gì: Việc bước gắn trục, căn chạy trong giao dịch riêng chỉ được kiểm bằng cách đọc chữ trong mã. Nếu ai đổi cách chạy mà vẫn giữ hình thức đó thì bộ kiểm không phát hiện.
  Căn cứ: Hành vi chính vẫn được kiểm bằng ca khác nên rủi ro thấp. Nếu lệch, lượt nạp có thể bị ảnh hưởng nhưng người vận hành thấy và chạy lại được.
  file: `pipeline/tests/ghep-tin-truc-can-ghi.itest.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
