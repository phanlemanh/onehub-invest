# Review findings: thuoc-song-song-dem-theo-ten-ca (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe E4 (chế độ lib) không tự chặn khi chạy trên DB chung; chỉ executor ép sang DB thử**
  Người dùng thấy gì: Nếu ai đó chạy thẳng bước kiểm này mà không qua đường chuẩn, nó có thể dựng bảng và giữ khoá trên cơ sở dữ liệu dùng chung của máy. Đường chạy chuẩn thì an toàn.
  Căn cứ: Chỉ xảy ra khi người chạy bỏ qua đường chuẩn, tác động giới hạn ở DB local và tự hết khi tiến trình dừng, nên nhẹ và không mất dữ liệu.
  file: `_acceptance/app-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **evals.yaml mới không phải YAML hợp lệ: nháy kép lồng trong chuỗi nháy kép**
  Người dùng thấy gì: Tệp mô tả các bước kiểm của hồ sơ này sai chuẩn YAML nên công cụ khác đọc bằng trình phân tích chuẩn sẽ báo lỗi. Cổng nghiệm thu hiện tại vẫn đọc được bình thường.
  Căn cứ: Hậu quả nhẹ, chưa chặn việc gì hôm nay, và chỉ sửa một dòng chữ khi có công cụ khác cần đọc tệp này.
  file: `_acceptance/thuoc-song-song-dem-theo-ten-ca/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **ghim.sh (E7) bỏ qua mã thoát của lưới trước-gộp mỗi khi có dòng VIOLATION được tha, kể cả lỗi nội tại (exit 2) hoặc script chết giữa chừng**
  Người dùng thấy gì: Bước kiểm cuối trước khi gộp có thể báo sạch dù cổng kiểm bị hỏng giữa chừng trong một trường hợp hiếm. Lỗi như vậy sẽ lộ ra ở lần kiểm kế tiếp của cổng gộp.
  Căn cứ: Trường hợp hiếm, cổng gộp thật vẫn chặn lại sau đó, không mất dữ liệu và sửa rẻ khi cần.
  file: `_acceptance/thuoc-song-song-dem-theo-ten-ca/probes/ghim.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc), kéo theo hình dạng 3: đối chứng 'ca ngoài danh sách' chèn dòng tự chế khớp regex tenDaChay, không có assert nào cho thấy regex đọc được đầu ra thật của node --test**
  Người dùng thấy gì: Nếu công cụ chạy test đổi cách in kết quả, phép kiểm phát hiện ca lạ có thể âm thầm ngừng hoạt động mà vẫn báo xanh. Hiện với phiên bản đang dùng thì vẫn đọc đúng.
  Căn cứ: Rủi ro chỉ xuất hiện khi nâng phiên bản công cụ, hiện đã đo là còn đúng, và người dùng cuối không bị ảnh hưởng.
  file: `_acceptance/app-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay, không đi qua đường đọc thật): đối chứng 'vi phạm khác của hồ sơ này vẫn chặn' chạy trên một bản chép tay của chuỗi grep, không qua biến luoi/vp thật**
  Người dùng thấy gì: Phép thử đối chứng của bước ghim dùng bản sao của bộ lọc nên nếu bộ lọc thật bị nới, phép thử vẫn xanh. Hiện bộ lọc thật đang đúng.
  Căn cứ: Chỉ là độ chắc của phép thử, không ảnh hưởng người dùng, và chỉ đáng sửa nếu sau này có người đổi bộ lọc.
  file: `_acceptance/thuoc-song-song-dem-theo-ten-ca/probes/ghim.sh`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

⚠ Cụm ngoài vùng phủ: 3/5 lỗi rơi vào file không bộ đo nào phủ (_acceptance/thuoc-song-song-dem-theo-ten-ca/evals.yaml, _acceptance/thuoc-song-song-dem-theo-ten-ca/probes/ghim.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
