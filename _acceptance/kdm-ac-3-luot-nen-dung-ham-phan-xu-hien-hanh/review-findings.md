# Review findings: kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh (round 2)

## Trong hợp đồng

(không có finding nào)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **CHUOI_PHAN_XU chỉ là danh sách khai báo, không nối với chuỗi nạp lại thật của napPhatBieu**
  Người dùng thấy gì: Một lần thêm migration mới có thể làm bước kiểm danh sách báo xanh dù bộ nạp lại chưa áp phần mới. Bước so bản hàm trên dữ liệu thật vẫn bắt được, nên chỉ chậm phát hiện một nhịp.
  Căn cứ: Hậu quả nhẹ: chỉ là công cụ đo nội bộ, không ảnh hưởng dữ liệu người dùng, và có lưới kiểm thứ hai bắt lại; chỉ cần ghi rõ giới hạn.
  file: `pipeline/lib/nap-045.mjs`
  severity: low
  Đề xuất: known-limits

- **CLI không kiểm --pha có hợp với chế độ hay không: chiều đỏ có thể chạy lặng lẽ như chiều xanh**
  Người dùng thấy gì: Người chạy công cụ kiểm có thể gõ nhầm tổ hợp tuỳ chọn và nhận kết quả xanh trông như đã kiểm chiều đỏ. Không ảnh hưởng dữ liệu thật hay người dùng cuối.
  Căn cứ: Chỉ gây hiểu nhầm cho người vận hành khi gõ sai lệnh, không mất hay lộ dữ liệu, chạy lại là xong.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: low
  Đề xuất: known-limits

- **Probe AC-7 ghi tệp .mjs tạm vào cây mã nguồn pipeline/ thay vì thư mục tạm**
  Người dùng thấy gì: Nếu phép so bị ngắt giữa chừng, hai tệp tạm có thể nằm lại trong thư mục mã nguồn và phải xoá tay. Không ảnh hưởng người dùng.
  Căn cứ: Chỉ để lại rác tạm trong kho mã, xoá tay được ngay, không chạm dữ liệu.
  file: `_acceptance/kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh/probes/so-cat-chuyen.mjs`
  severity: low
  Đề xuất: known-limits

- **Probe AC-7 không phát hiện được chênh lệch về số dòng lệch: đầu ra cắt ở 10 dòng và không in tổng**
  Người dùng thấy gì: Phép so sánh trước và sau bản sửa có thể không thấy khi số tin bị lệch thay đổi lớn mà mười dòng đầu vẫn giống. Kết luận không đổi đầu ra khi đó yếu hơn vẻ ngoài.
  Căn cứ: Là công cụ soát nội bộ, không đụng dữ liệu người dùng; mức tin cậy của bằng chứng thấp hơn nhưng sửa sau không tốn kém.
  file: `_acceptance/kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh/probes/so-cat-chuyen.mjs`
  severity: medium
  Đề xuất: known-limits

- **Probe AC-7 im lặng so nhánh với chính nó khi chuỗi import không khớp, hoặc khi cả hai lượt bị giết vì hết giờ**
  Người dùng thấy gì: Nếu cấu trúc tệp đổi, phép so có thể lặng lẽ so bản với chính nó và báo xanh giả. Chỉ ảnh hưởng độ tin cậy của bằng chứng nội bộ.
  Căn cứ: Rủi ro chỉ xảy ra khi tệp đo bị đổi về sau, không mất dữ liệu, dễ vá khi gặp.
  file: `_acceptance/kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh/probes/so-cat-chuyen.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo CHỈ DẪN thay vì ĐẦU RA): HT5-AC-1 đối chiếu hằng CHUOI_PHAN_XU, nhưng napPhatBieu không đọc hằng này**
  Người dùng thấy gì: Lời hứa trong tên ca kiểm rộng hơn thứ nó thật sự kiểm, nên người đọc có thể tin bộ nạp lại đã được ép cập nhật khi chưa. Dữ liệu và người dùng không bị ảnh hưởng.
  Căn cứ: Sai lệch nằm ở lời mô tả của công cụ kiểm; có lưới thứ hai trên dữ liệu thật, nên chỉ cần ghi chú đúng giới hạn.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 1 (đo CHỈ DẪN thay vì ĐẦU RA): eval E7 chỉ đọc lại so-cat-chuyen.md đã commit, không chạy lại phat-bieu-cat-chuyen**
  Người dùng thấy gì: Phép kiểm cuối chỉ đọc lại bản ghi đã lưu, nên nếu mã đổi sau đó mà không chạy lại phép so, nó vẫn báo xanh trên số cũ.
  Căn cứ: Chỉ làm bằng chứng cũ hơn mã hiện tại, không ảnh hưởng người dùng, chạy lại phép so là cập nhật được.
  file: `_acceptance/kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): ô «DB chưa có phần chèn 068, 099: không cấy thêm» không kiểm rằng trạng thái «chưa chèn» đã dựng được, và không có chiều đỏ**
  Người dùng thấy gì: Một ô kiểm có thể báo xanh mà chưa chứng minh được trạng thái thiếu phần chèn đã thật sự dựng, nên độ tin cậy của ô đó thấp hơn vẻ ngoài. Không ảnh hưởng dữ liệu người dùng.
  Căn cứ: Chỉ là độ chặt của công cụ kiểm nội bộ, không có mất mát hay lộ dữ liệu, bổ sung kiểm sau với chi phí thấp.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: medium
  Đề xuất: known-limits

- **CHUOI_PHAN_XU chỉ là danh sách khai, napPhatBieu không đọc nó; chú thích mô tả sai regex của ca canh (r1)**
  Người dùng thấy gì: Chú thích trong công cụ đo hứa một lớp canh mạnh hơn thực tế. Người đọc sau này có thể tin rằng thêm migration mới sẽ luôn bị bắt, trong khi thực ra chỉ có phép so bản hàm ở ca khác bắt được.
  Căn cứ: Chỉ là chú thích sai, không làm sai số liệu hay mất dữ liệu; một lớp canh khác vẫn bắt được lỗi thật, và sửa sau rất rẻ.
  file: `pipeline/lib/nap-045.mjs`
  severity: low
  Đề xuất: known-limits

- **Thước không kiểm --pha có hợp với chế độ: chiều đỏ có thể chạy ra xanh, chiều chưa khai vẫn chạy (r1)**
  Người dùng thấy gì: Nếu người chạy công cụ đo gõ nhầm tổ hợp tuỳ chọn, công cụ có thể báo xanh dù đang ở chiều thử lỗi, hoặc chạy một chiều chưa được khai. Chỉ ảnh hưởng người vận hành công cụ nội bộ.
  Căn cứ: Chỉ gây hiểu nhầm khi gõ sai lệnh, không đụng dữ liệu thật và người dùng cuối không thấy; chạy lại đúng lệnh là xong.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo CHỈ DẪN thay vì ĐẦU RA): HT5-AC-1 đối chiếu hằng CHUOI_PHAN_XU, mà napPhatBieu không hề đọc hằng này (r1)**
  Người dùng thấy gì: Ca kiểm danh sách migration chỉ đo lời khai, không đo việc nạp lại thật. Một migration mới có thể làm ca này xanh dù chưa được áp lại, và chỉ ca so bản hàm sau đó mới bắt được.
  Căn cứ: Lỗ này vẫn bị ca so bản hàm trên DB bịt lại nên không lọt ra dữ liệu thật; chỉ là lớp canh sớm kém hơn lời hứa, sửa sau không gấp.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 1 (đo CHỈ DẪN thay vì ĐẦU RA): eval E7 chỉ chạy `--kiem` trên so-cat-chuyen.md đã commit, không chạy lại phat-bieu-cat-chuyen (r1)**
  Người dùng thấy gì: Phép kiểm so sánh hai bản cắt chuyển chỉ đọc tệp ghi kết quả cũ, không chạy lại. Nếu mã đổi sau đó làm kết quả lệch thì phép kiểm này vẫn báo xanh.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng; chỉ làm bằng chứng nghiệm thu cũ đi, và có thể chạy lại bằng tay khi cần.
  file: `_acceptance/kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): ô «DB chưa có phần chèn 068, 099: không cấy thêm» thiếu đối chứng dương, và không kiểm rằng trạng thái «chưa chèn» đã dựng được thật (r1)**
  Người dùng thấy gì: Một ô kiểm có thể báo xanh dù bước dựng trạng thái thử không thật sự gỡ được phần cần gỡ. Khi đó ô này không chứng minh được điều nó nói.
  Căn cứ: Chỉ làm phép đo yếu đi, không gây mất hay lộ dữ liệu; phép đo chính vẫn có chiều đỏ, thêm đối chứng sau là rẻ.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
