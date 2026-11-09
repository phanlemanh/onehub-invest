## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **KN-AC-2/KN-AC-3: phiên chặn dựng ngoài try, lỗi lúc dựng làm rò phiên c (và s) đang mở giao dịch**
  Người dùng thấy gì: Nếu bước dựng thử nghiệm bị lỗi, bộ kiểm tra có thể treo khoảng hai phút và báo lỗi hết giờ thay vì lỗi gốc. Người dùng sản phẩm không bị ảnh hưởng, chỉ người chạy kiểm tra thấy chậm và khó đọc lỗi.
  Căn cứ: Chỉ xảy ra khi chính bước dựng kiểm tra hỏng, không ảnh hưởng người dùng cuối, tự hết sau vài phút và chạy lại là được; sửa có thể để lần chạm tệp sau.
  file: `pipeline/scripts/luoc-do-rieng.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): E4 so danh sách tệp import với hằng HOI_QUY chép tay, không so với lệnh E5/E6 thật sự chạy**
  Người dùng thấy gì: Nếu sau này thêm một tệp kiểm tra dùng thư viện này mà chỉ cập nhật một trong hai danh sách, phép kiểm vẫn báo khớp trong khi tệp mới không được chạy lại. Hiện tại hai danh sách đang đúng.
  Căn cứ: Hiện chưa có sai lệch nào và hậu quả chỉ là một tệp kiểm tra có thể bị bỏ sót chạy về sau; ghi lại để người thêm tệp mới nhớ cập nhật cả hai chỗ, sửa rẻ khi cần.
  file: `_acceptance/khoa-nguon-nghi-khi-ddl-sua/probes/dot-bien.mjs`
  severity: low
  Đề xuất: known-limits

- **Chú thích executor kn_dot_bien ghi «hai bản đột biến» trong khi probe và E4 có bốn (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một dòng chú thích trong tài liệu lệnh kiểm ghi sai số bản thử đột biến (hai thay vì bốn). Người chấm có thể hiểu nhầm phạm vi kiểm, nhưng việc kiểm thật vẫn chạy đủ.
  Căn cứ: Chỉ sai một chữ trong chú thích, không ảnh hưởng kết quả kiểm hay dữ liệu nào, sửa lúc nào cũng rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Trần 600 s của probe không có tác dụng khi đang chạy spawnSync, trái với lời hứa trong chú thích đầu tệp (r1)**
  Người dùng thấy gì: Nếu bước kiểm đột biến bị giết giữa chừng, vài tệp tạm có thể nằm lại và làm bộ thử sau báo đỏ giả. Chỉ ảnh hưởng người chạy kiểm, không ảnh hưởng người dùng sản phẩm.
  Căn cứ: Hậu quả nhẹ, chỉ xảy ra khi tiến trình bị giết ngoài ý muốn, người chạy tự xoá tệp thừa là xong, không mất dữ liệu.
  file: `_acceptance/khoa-nguon-nghi-khi-ddl-sua/probes/dot-bien.mjs`
  severity: low
  Đề xuất: known-limits

- **Trần 600 s của probe đột biến không bao giờ chạy (timer chết), nên lời hứa dọn bản chép tạm khi vượt trần không giữ được (r1)**
  Người dùng thấy gì: Bước kiểm có thể chạy lâu hơn trần đã hứa và nếu bị giết giữa chừng thì để lại tệp tạm gây báo đỏ giả ở lần chạy sau. Người dùng sản phẩm không bị ảnh hưởng.
  Căn cứ: Chỉ là lỗi công cụ kiểm nội bộ, xảy ra hiếm, tự gỡ được bằng cách xoá tệp thừa, không động tới dữ liệu.
  file: `_acceptance/khoa-nguon-nghi-khi-ddl-sua/probes/dot-bien.mjs`
  severity: low
  Đề xuất: known-limits

- **Fixture viết tay đúng khuôn bên đọc (hình 2): HOI_QUY trong probe là bản chép tay, không đọc từ lệnh E5/E6 thật trong config.yaml (r1)**
  Người dùng thấy gì: Phép kiểm danh sách tệp hồi quy so với một bản chép tay chứ không so với lệnh thật, nên sau này nếu hai nơi lệch nhau thì kiểm vẫn xanh. Hiện tại hai bên đang khớp.
  Căn cứ: Chưa có sai lệch thật nào, chỉ là nguy cơ khi ai đó sửa danh sách sau này, không ảnh hưởng người dùng và dễ phát hiện khi soát.
  file: `_acceptance/khoa-nguon-nghi-khi-ddl-sua/probes/dot-bien.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
