# Review findings: lockdown-local-noi-that (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thẻ Gate 1 (OOS-1) còn ghi 'KHÔNG đổi cách ô Lockdown hiện trên cloud', trong khi code đã đổi ô đó trên cloud**
  Người dùng thấy gì: Thẻ duyệt nói ô Lockdown trên bản cloud không đổi, nhưng thực tế ô này sẽ hiện 'Chưa kiểm được' thay vì 'Ổn'. Người đọc hồ sơ có thể hiểu sai phạm vi thay đổi, nhưng Mạnh đã chấp nhận hệ quả này khi duyệt kế hoạch.
  Căn cứ: Chỉ là câu mô tả trong hồ sơ lệch với thực tế, không mất hay lộ dữ liệu; hiển thị mới an toàn hơn cũ và việc cloud sẽ được làm đúng ở hàng ON23, ghi lại là đủ.
  file: `_acceptance/lockdown-local-noi-that/card-plain.json`
  severity: low
  Đề xuất: known-limits

- **push-ops-facts.mjs còn import `stat` nhưng không dùng nữa, sau khi bỏ tailFile**
  Người dùng thấy gì: Không ảnh hưởng gì tới người dùng: màn hình và số liệu vẫn hiển thị đúng. Chỉ là một dòng khai báo thừa trong mã.
  Căn cứ: Không có hậu quả nào với người dùng, không mất dữ liệu, chi phí mở thêm việc lớn hơn nhiều so với lợi ích; có thể dọn tiện tay khi chạm tệp lần sau.
  file: `pipeline/push-ops-facts.mjs`
  severity: low
  Đề xuất: wont-fix

- **Cloud /ops/collections cũng đổi hiển thị Lockdown, trái với OOS-1 «KHÔNG đổi cách ô Lockdown hiện trên cloud»**
  Người dùng thấy gì: Trên bản cloud, ô Lockdown sẽ ghi 'Chưa kiểm được agent-turn hôm nay' và lớp agent-turn chuyển sang nhóm xám, thay vì báo 'Ổn' như trước. Người vận hành cloud sẽ thấy khác ngay sau khi phát hành, dù thực ra đúng hơn vì cloud không có log để kiểm.
  Căn cứ: Hậu quả nhẹ và theo chiều an toàn hơn (không còn báo 'Ổn' giả), không mất dữ liệu; hiển thị cloud đầy đủ sẽ được xử lý ở ON23 nên chỉ cần ghi là hạn chế đã biết.
  file: `app/src/lib/ops-queries.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): ca push-ops-facts đo văn bản mã nguồn, không đo đầu ra scheduler()**
  Người dùng thấy gì: Phần 'dòng log cuối' của từng job đẩy lên cloud chỉ được kiểm bằng cách soi mã, chưa chạy thử thật. Nếu sau này có người sửa nhầm khiến một job hiện sai dòng cuối, bài kiểm có thể vẫn báo xanh.
  Căn cứ: Rủi ro thấp và chỉ ảnh hưởng nhãn 'dòng log cuối' trên màn hình vận hành, không mất dữ liệu; hai đường đọc còn lại đã được đo bằng hành vi thật, và dựng cách chạy thử toàn bộ job thì tốn công hơn nhiều.
  file: `pipeline/scripts/last-log-line.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
