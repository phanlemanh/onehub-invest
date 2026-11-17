# Review findings: job-step-do-tren-ban-chep (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Kho git tạm thừa hưởng GIT_DIR/GIT_INDEX_FILE từ process.env, nên có thể ghi vào kho thật**
  Người dùng thấy gì: Nếu bộ kiểm tra bị chạy từ một công cụ đã đặt sẵn biến trỏ vào kho thật, nó có thể ghi nhầm vào kho thật thay vì kho tạm. Cách chạy bình thường không bị ảnh hưởng.
  Căn cứ: Chỉ xảy ra khi chạy trong ngữ cảnh hiếm và là công cụ nội bộ của đội, không chạm người dùng cuối; nếu có thì sửa lại được bằng git, nên ghi lại là giới hạn đã biết.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Đột biến «bỏ kiểm mã thoát git show» chỉ khẳng định phủ định, nên có thể xanh rỗng**
  Người dùng thấy gì: Phép thử kiểm việc báo lỗi khi thiếu bản gốc có thể báo xanh dù ca thật không chạy tới đó, nên có thể bỏ sót một lỗi về sau. Người dùng không thấy tác động trực tiếp.
  Căn cứ: Rủi ro nhẹ: chỉ làm một phép kiểm nội bộ kém chặt, không mất hay lộ dữ liệu, và siết lại sau với chi phí thấp.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Ô (i) không kiểm mã thoát của `git diff -U0 origin/main`, lỗi git thành mảng rỗng tức là xanh**
  Người dùng thấy gì: Nếu lệnh so sánh với bản gốc bị lỗi, phép kiểm phạm vi làn có thể báo xanh dù chưa đo được gì. Người dùng không thấy ảnh hưởng, chỉ giảm độ tin của lưới nội bộ.
  Căn cứ: Hiếm gặp và chỉ làm lưới kiểm nội bộ yếu đi, không ảnh hưởng dữ liệu hay người dùng; sửa sau rẻ.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): chiều đỏ r4 của JST-AC-2-bc chỉ khẳng định lời báo vắng mặt, không có bằng chứng ca lưới đã thật sự chạy**
  Người dùng thấy gì: Phép thử cho trường hợp thiếu bản gốc chỉ kiểm lời báo không xuất hiện, nên có thể xanh khi ca thật chưa chạy. Lỗi về sau có thể lọt qua mà không ai biết.
  Căn cứ: Chỉ là công cụ kiểm nội bộ kém chặt, không chạm dữ liệu hay người dùng cuối, và dễ siết lại ở vòng sau.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
