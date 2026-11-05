# Review findings: doc-so-m2-bi-sot (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E3 quét cả bài thử và bài S05 nhưng thẻ ký ghi «80.317 bài thật» của S03**
  Người dùng thấy gì: Con số «80.317 bài thật» trên thẻ ký thực ra gồm cả khoảng 1.300 bài thử và 100 bài từ nguồn khác. Kết quả sửa vẫn đúng: 141 bài đổi đều là bài S03, nhưng người ký đọc con số này sẽ hiểu rộng hơn thực tế.
  Căn cứ: Hậu quả nhẹ: chỉ lệch cách gọi con số trên hồ sơ, không có tin nào bị đọc sai hay mất dữ liệu, và ghi chú lại hồ sơ lúc nào cũng rẻ.
  file: `_acceptance/doc-so-m2-bi-sot/probes/so-bo-doc.mjs`
  severity: medium
  Đề xuất: known-limits

- **Luật nhãn đọc nhầm kích thước và dải viết bằng dấu ngoài danh sách chặn**
  Người dùng thấy gì: Nếu bài mới ghi diện tích kiểu «20*30» hay «65%» thì hệ thống có thể lấy nhầm số đầu làm diện tích, kéo theo giá theo mét vuông sai và có thể gom nhầm tin. Hiện chưa có bài thật nào mắc dạng này.
  Căn cứ: Hiện chưa ảnh hưởng tin nào trong 80 nghìn bài; nếu sau này gặp thì sai nằm ở một tin lẻ, đo lại và sửa được, nên ghi nhận rồi xử lý khi thấy bài thật.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **E4 đếm tin không tồn tại thành «giữ rỗng», kiểm tra có thể xanh rỗng**
  Người dùng thấy gì: Bước kiểm tra «4 tin phải giữ rỗng» có thể báo đạt dù tin đó đã biến mất khỏi dữ liệu. Hiện cả 4 tin đều còn nên kết quả đang đúng.
  Căn cứ: Không ảnh hưởng người dùng cổng; chỉ làm phép kiểm lần sau kém chặt, và hiện 4 tin đều có mặt nên chưa có sai lệch nào.
  file: `_acceptance/doc-so-m2-bi-sot/probes/transform-thu.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm-tính-một-mình: ca «SĐT đậm không thành diện tích» xanh cả khi bỏ chặn SĐT**
  Người dùng thấy gì: Ca kiểm «số điện thoại in đậm không bị đọc thành diện tích» vẫn báo đạt dù lớp gạt số điện thoại bị bỏ đi. Hôm nay bộ đọc chạy đúng, nhưng nếu ai làm hỏng phần gạt số điện thoại sau này thì ca kiểm này sẽ không kêu.
  Căn cứ: Không có tin nào sai hôm nay; rủi ro chỉ là bắt lỗi chậm hơn sau này, và bổ sung ca kiểm sau vẫn rẻ.
  file: `pipeline/parse.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên quét lớp «phá từng chặn» nhưng thiếu chặn `(?![\d.,]*\d)`: đột biến sống, E2 vẫn xanh**
  Người dùng thấy gì: Bộ kiểm không chứng minh được rằng bài ghi «Diện tích: 120.000» sẽ không bị đọc thành 120 m². Hiện luật còn nguyên nên chưa có tin sai, nhưng nếu luật bị bỏ nhầm thì bộ kiểm không phát hiện.
  Căn cứ: Hiện không tin nào bị đọc sai; chỗ thiếu chỉ làm lưới an toàn mỏng, và thêm ca kiểm sau này không tốn nhiều.
  file: `_acceptance/doc-so-m2-bi-sot/probes/dot-bien.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Quét lớp «dải, kích thước» theo điểm-case: en dash và `~` trong lớp ký tự không có ca nào**
  Người dùng thấy gì: Dải viết bằng gạch dài hoặc dấu ngã như «60–70» không có ca kiểm riêng, nên nếu luật bị sửa lỡ tay thì bộ kiểm vẫn xanh và tin có thể bị đọc thành 60 m². Hiện luật còn nguyên.
  Căn cứ: Không tin nào sai hôm nay; chỉ là lưới kiểm thưa, nhẹ và bổ sung sau rẻ.
  file: `pipeline/parse.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm-tính-một-mình: «4 tin giu rong» của E4 tính cả tin không tồn tại**
  Người dùng thấy gì: Phép kiểm «4 tin giữ rỗng» có thể đếm cả tin đã biến mất khỏi dữ liệu như một tin đạt. Hiện cả 4 tin đều còn nên số đang đúng.
  Căn cứ: Không ảnh hưởng người dùng cổng và chưa có sai lệch nào; chỉ làm phép kiểm lần sau kém chặt.
  file: `_acceptance/doc-so-m2-bi-sot/probes/transform-thu.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm-tính-một-mình: «nhom gom khong doi» không có đối chứng phá**
  Người dùng thấy gì: Phép kiểm «không nhóm tin nào đổi thành viên» chưa được thử bằng một ca cố tình làm sai để xem nó có kêu không. Kết quả 0 nhóm đổi hiện là đúng theo lần đo riêng.
  Căn cứ: Số liệu hôm nay đã đúng nhờ một lần đo độc lập; thiếu đối chứng chỉ làm lần kiểm sau kém tin cậy hơn, không mất hay lộ dữ liệu.
  file: `_acceptance/doc-so-m2-bi-sot/probes/transform-thu.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
