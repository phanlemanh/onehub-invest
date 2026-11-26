# Review findings: s03-tai-bu-anh-bai-cu (round 1)

## Trong hợp đồng

- **Gặp http-403/429 vẫn tải tiếp các url còn lại của cùng bài**
  AC: AC-5
  file: `pipeline/backfill-s03-media-2511.mjs:251`
  severity: medium
  source: bugs
  detail: Khi một url trả 403/429, mã gán `maChan`, nhưng vòng trong `for (let i = 0; i < urls.length; i += 1)` không kiểm `maChan`. Chỉ vòng ngoài (`if (maChan) break;`) mới dừng, tức là ở bài kế tiếp. Vì vậy bài có nhiều ảnh vẫn tiếp tục gửi lời gọi tới host vừa chặn cho mọi url còn lại, trái với ý «dừng HẲN» trong đầu tệp (thoát 3, báo LL). Ca test «gặp http-403 dừng HẲN» không bắt được lỗi này nếu bài thử chỉ có một url cần tải. Cách sửa: thêm `if (maChan) break;` ở đầu thân vòng tải, hoặc ngay sau khi gán maChan.
  Lý do vào hợp đồng: AC-5 đòi 403 dừng hẳn; tiếp tục gửi lời gọi tới máy chủ vừa chặn trong cùng bài là chưa dừng hẳn.

- **Hình dạng 4: kiểm âm tính một mình. Ca «(2) raw bất biến» không bao giờ đọc snapshot gốc**
  AC: AC-4
  file: `pipeline/backfill-s03-media-2511.test.mjs:438`
  severity: high
  source: measurement
  detail: Trong fixture, payload.media chỉ có `${t.base}/jpg/broken.jpg`. Entry sống `{url: song-goc.jpg, file: media/cu-song.jpg}` nằm trong mediaFiles nhưng url của nó không có trong payload.media. ghiSnapshotBuu chỉ duyệt `media.map(urlCua)`, nên entryCua/chepAnhSong không bao giờ được gọi cho ảnh này, và cây snapshot gốc không hề bị chạm tới trong lượt bù. Lời chú thích ở dòng 452 («ảnh sống đọc từ snapshot gốc qua chepAnhSong») không đúng với code. Hai assert `deepEqual(bam(snapshotCu), truoc)` và so manifest là assert «không đổi» đứng một mình. Ca thiếu đối chứng dương cho thấy lượt bù có đọc snapshot gốc, ví dụ assert media/cu-song.jpg có mặt trong manifest của dirMoi hoặc `kq` có đếm một ảnh chép. Vì vậy ca xanh dù chepAnhSong có ghi đè hay chuyển tệp gốc đi. E4 (AC-4 raw bất biến) dựa trên đúng ca này.
  Lý do vào hợp đồng: ca kiểm là bằng chứng duy nhất của AC-4 nhưng không chạm snapshot gốc nên không chứng minh được raw bất biến.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Replay từ state 0 bị ngắt giữa chừng thì mất bảo đảm «snapshot bù phase cuối»**
  Người dùng thấy gì: Nếu lượt nạp lại toàn bộ bị dừng giữa chừng (quá giờ hoặc gặp lỗi), các ảnh đã bù của khoảng 695 bài cũ có thể không bao giờ được nạp lại và ảnh bài đó vẫn hỏng, không có báo lỗi.
  Căn cứ: Mất ảnh lặng lẽ nhưng chỉ khi lượt nạp lại lớn bị ngắt, hiếm và vận hành viên có thể đặt lại để chạy lại; sửa sau vẫn rẻ.
  file: `scripts/zalo-import-daily.sh`
  severity: high
  Đề xuất: known-limits

- **Thêm trường manifest `coverage.loai` có nghĩa với bên đọc mà không tăng schemaVersion**
  Người dùng thấy gì: Tài liệu hợp đồng dữ liệu không ghi phiên bản mới cho trường đánh dấu snapshot bù, nên người đọc sau khó biết trường này bắt đầu có nghĩa từ đâu.
  Căn cứ: Chỉ ảnh hưởng độ rõ của tài liệu, không làm mất hay sai dữ liệu của người dùng; bổ sung sau rất rẻ.
  file: `collector/docs/DATA-CONTRACT.md`
  severity: medium
  Đề xuất: known-limits

- **Probe đột biến sửa thẳng tệp nguồn đang được theo dõi, trong khi chú thích ghi là sửa «trên bản chép»; executor còn xoá collector/dist**
  Người dùng thấy gì: Chạy bộ kiểm trên máy đang vận hành có thể làm job nạp hằng ngày chạy nhầm bản đã bị sửa tạm, hoặc xoá bản build của bộ thu.
  Căn cứ: Chỉ xảy ra khi chạy kiểm ngoài thư mục làm việc riêng và trùng giờ với job; người vận hành tránh được và khôi phục được.
  file: `_acceptance/s03-tai-bu-anh-bai-cu/probes/kiem.sh`
  severity: medium
  Đề xuất: known-limits

- **sapXepReplay sắp theo đường dẫn đầy đủ (localeCompare), khác khoá sắp theo TS của khối liệt kê**
  Người dùng thấy gì: Nếu sau này có snapshot ở nhiều thư mục thành phố, thứ tự nạp lại có thể không theo thời gian, làm ảnh bù bị đè sai thứ tự.
  Căn cứ: Hiện chưa có dữ liệu ở nhiều thư mục nên chưa gây hại; khi xuất hiện thì sửa nhỏ, chạy lại là khôi phục được.
  file: `pipeline/backfill-s03-media-2511.mjs`
  severity: low
  Đề xuất: known-limits

- **Replay bị cắt giữa chừng (trần nạp 124 hay nạp lỗi) làm mất vĩnh viễn 5 snapshot bù cũ**
  Người dùng thấy gì: Nếu lượt nạp lại lớn bị cắt giữa chừng, 5 đợt ảnh bù của các bài cũ bị bỏ qua mãi mãi và ảnh các bài đó vẫn hỏng mà không báo.
  Căn cứ: Mất ảnh lặng lẽ nhưng chỉ khi gặp ca bị cắt hiếm gặp, có thể đặt lại và nạp lại; chi phí sửa vừa phải.
  file: `scripts/zalo-import-daily.sh`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 2: fixture viết tay đúng khuôn bên đọc, không đi vòng từ ghiSnapshotBuu sang import-airbnb**
  Người dùng thấy gì: Bộ kiểm chưa chứng minh được snapshot bù do công cụ thật tạo ra sẽ được bộ nạp nhận đúng; nếu hai bên lệch khoá thì lỗi không bị bắt.
  Căn cứ: Rủi ro chỉ khi hai phần code đổi lệch nhau sau này và lúc đó mất ảnh bù; bổ sung ca kiểm sau rẻ.
  file: `pipeline/backfill-s03-media-2511.test.mjs`
  severity: high
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
