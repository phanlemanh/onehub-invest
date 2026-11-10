# Review findings: thuoc-song-song-dem-theo-ten-ca (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **neo.sh ghi một commit lơ lửng vào kho object dùng chung mỗi lần chạy**
  Người dùng thấy gì: Mỗi lần chạy phép kiểm này để lại một mẩu dữ liệu thừa rất nhỏ trong kho mã dùng chung. Người dùng không thấy gì và không ảnh hưởng sản phẩm.
  Căn cứ: Hậu quả gần như bằng không, kho tự dọn theo thời gian, không mất dữ liệu; sửa không đáng công.
  file: `_acceptance/thuoc-song-song-dem-theo-ten-ca/probes/neo.sh`
  severity: low
  Đề xuất: wont-fix

- **ghim.sh bỏ qua mã thoát của pre-merge-check mỗi khi có dòng vi phạm được miễn**
  Người dùng thấy gì: Nếu bộ kiểm trước-gộp tự hỏng theo kiểu lạ, phép kiểm này vẫn báo sạch và lỗi có thể lọt qua mà không ai biết. Hiện tại kết quả vẫn đúng.
  Căn cứ: Rủi ro chỉ xảy ra khi bộ kiểm hỏng theo cách hiếm; hiện không có sai lệch thật và người ký vẫn thấy được khi soát lại.
  file: `_acceptance/thuoc-song-song-dem-theo-ten-ca/probes/ghim.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 + 4: bộ dò «ca ngoài danh sách» chỉ được đối chứng bằng dòng reporter viết tay; không có assert dương rằng tenDaChay rút được đúng 3 tên từ đầu ra thật**
  Người dùng thấy gì: Nếu định dạng đầu ra của công cụ chạy test đổi trong tương lai, phép đếm ba ca có thể lặng lẽ hết tác dụng mà vẫn báo xanh. Hiện nay vẫn đúng.
  Căn cứ: Chưa có sai lệch thật, chỉ lộ khi nâng phiên bản công cụ; thử lại và soát được khi đó.
  file: `_acceptance/app-test-chiu-song-song/probes/song-song.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 + 4: đối chứng «vi phạm khác vẫn chặn» chép lại bộ lọc trên chuỗi viết tay, không đi qua nhánh quyết định thật**
  Người dùng thấy gì: Phép thử đối chứng của bộ kiểm không chạm đúng chỗ quyết định thật, nên nếu chỗ đó bị sửa hỏng thì phép thử vẫn xanh. Hiện không có lỗi thật nào.
  Căn cứ: Chỉ là độ chặt của công cụ kiểm nội bộ, không ảnh hưởng người dùng; có thể bổ sung ở lượt sau.
  file: `_acceptance/thuoc-song-song-dem-theo-ten-ca/probes/ghim.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6: E5 neo cứng khoảng commit a86804f7..2070958c nên đo nhánh gốc của tác giả, không đo cây đang kiểm**
  Người dùng thấy gì: Phép kiểm phạm vi của hồ sơ cũ giờ luôn đo cùng một khoảng lịch sử cố định, không theo nhánh đang kiểm. Đây là chủ ý và phạm vi nhánh hiện tại đã có thước riêng.
  Căn cứ: Đúng như hợp đồng đã duyệt, không gây hại cho người dùng; đổi lại sẽ làm hồ sơ cũ đỏ vô cớ ở mọi nhánh.
  file: `_acceptance/app-test-chiu-song-song/probes/pham-vi.sh`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 2/5 lỗi rơi vào file không bộ đo nào phủ (_acceptance/thuoc-song-song-dem-theo-ten-ca/probes/ghim.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
