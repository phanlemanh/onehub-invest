## Trong hợp đồng

- **Hình 3 — kiểm 'có mặt / tập con' trong khi lời hứa là QUAN HỆ BẰNG giữa hai tập vai (TN-AC-7)**
  file: `pipeline/scripts/the-duyet-nguoi.itest.mjs:270`
  severity: medium
  AC: AC-7
  source: measurement
  detail: E7 hứa «tập vai sống (tin, người, phương pháp) bằng tập trước lần gộp». Test lấy `truoc` (chuỗi subject|party|method) rồi `tapNguoiTruoc = truoc.map(v => v.split('|').slice(0,2))`, bỏ hẳn cột method, và chỉ assert `[...tapNguoiTruoc].every(v => sau.some(s => s.startsWith(v)))` cùng `sau.some(v => v.includes(biGop))`. Đây là phép chứa một chiều (truoc ⊆ sau) theo tiền tố chuỗi, không phải so bằng. Nếu sau khi tách còn thừa vai sống (vd vai trên người đích chưa bị rút, nên một tin có hai vai sống), hoặc vai trả về với method khác, test vẫn xanh. Muốn khớp lời hứa thì phải so `assert.deepEqual(sau, truoc)` trên đủ ba cột. AC-7 đòi vai sống trả về đúng như trước lần gộp; phép kiểm chỉ chứng minh một chiều nên không chứng minh được AC này.

- **Hình 4 — assertion âm tính đứng một mình, rỗng nghĩa khi DB thử không có source_registry (TN-AC-4)**
  file: `pipeline/scripts/the-duyet-nguoi.itest.mjs:184`
  severity: medium
  AC: AC-4
  source: measurement
  detail: `ten` lấy từ source_registry, và khi bảng vắng hoặc không có real_name thì `ten = []`. Lúc đó `assert.deepEqual(lo(chuoi), [], 'TN-AC-4 evidence lộ tên nguồn thật')` luôn xanh. Phần đối chứng dương nằm trong `if (ten.length) {...}` nên cũng bị bỏ qua mà không có t.skip hay diagnostic nào. E4 hứa phép quét «đọc từ DB thử», nhưng ca này có thể xanh mà không so với một tên thật nào. Cách sửa là cho ca đỏ hoặc t.skip có lý do khi `ten.length === 0`. AC-4 đòi evidence không chứa tên nguồn thật; phép kiểm có thể xanh mà không so với tên thật nào nên không chứng minh được AC.

- **Hình 4 — assert rỗng nghĩa `kq2.the_moi >= 0` đứng thay cho lời hứa «lượt hai 0»**
  file: `pipeline/scripts/the-duyet-nguoi.itest.mjs:118`
  severity: low
  AC: AC-2
  source: measurement
  detail: Trong TN-AC-2, `assert.ok(kq2.the_moi >= 0)` đúng với mọi số không âm, nên không đo gì. E2 hứa «lượt một sinh N thẻ, lượt hai 0». Phần chống trùng hiện chỉ được chốt gián tiếp qua đếm thẻ của nhóm a1 (`the(db,'a1').length === 1`). Không có assert `the_moi === 0` trên toàn lượt hai, nên thẻ thừa sinh cho nhóm khác không bị bắt. AC-2 đòi dựng lượt hai không đổi dữ liệu sinh 0 thẻ mới; assert >= 0 không đo được điều đó.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Tin mẫu sắp «mới nhất trước» bằng String(Date): thứ tự thực ra theo tên thứ trong tuần**
  Người dùng thấy gì: Năm tin mẫu hiện trên thẻ duyệt có thể không phải năm tin mới nhất. Người duyệt vẫn thấy đủ thông tin để quyết định, chỉ là mẫu không đúng như mô tả.
  Căn cứ: Hậu quả nhẹ: không mất hay lộ dữ liệu, thẻ vẫn đủ bằng chứng để duyệt, và sửa sau vẫn rẻ.
  file: `pipeline/lib/the-duyet-nguoi.mjs`
  severity: medium
  Đề xuất: known-limits

- **Tiền tố lý do 'the-duyet:' viết cứng trong thước nap-lai-nguoi thay vì dùng hằng LY_DO_THE**
  Người dùng thấy gì: Hiện người dùng không thấy gì sai. Nếu sau này ai đó đổi tiền tố lý do, kiểm tra một-SĐT có thể lặng lẽ sai.
  Căn cứ: Không có hậu quả nào hôm nay với người dùng, và rủi ro chỉ xuất hiện khi có người đổi tiền tố, nên chi phí sửa lớn hơn hậu quả.
  file: `pipeline/scripts/nap-lai-nguoi.mjs`
  severity: low
  Đề xuất: wont-fix

- **Tin mẫu sắp «mới nhất trước» theo chuỗi Date (thứ trong tuần), không theo thời gian**
  Người dùng thấy gì: Năm tin mẫu trên thẻ có thể không phải năm tin mới nhất. Việc quyết định gộp hay tách vẫn làm được bình thường.
  Căn cứ: Chỉ lệch việc chọn mẫu minh hoạ, không mất hay lộ dữ liệu, người duyệt vẫn quyết định đúng nhờ các bảng tài khoản và SĐT.
  file: `pipeline/lib/the-duyet-nguoi.mjs`
  severity: medium
  Đề xuất: known-limits

- **Đối chứng --the-duyet có thể ép gộp một người vào chính nó, hoặc sập khi có ít hơn 2 dòng**
  Người dùng thấy gì: Phép tự thử của công cụ kiểm có thể báo sai trên một số dữ liệu, hoặc dừng với lỗi khó hiểu. Dữ liệu thật không bị đổi vì thao tác được hoàn tác.
  Căn cứ: Chỉ ảnh hưởng người vận hành khi chạy công cụ kiểm, dữ liệu không bị hỏng vì có hoàn tác, chạy lại được.
  file: `pipeline/scripts/nap-lai-nguoi.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 4 — đối chứng của thước chỉ đếm > 0, không ghim thông điệp 'hai SĐT' + party_key như E10 hứa**
  Người dùng thấy gì: Phép tự thử của công cụ kiểm chỉ chứng minh có người hai SĐT đâu đó, không chỉ đúng cặp vừa thử. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm bằng chứng kiểm hơi lỏng, không ảnh hưởng dữ liệu hay người dùng, nâng độ chặt sau cũng rẻ.
  file: `pipeline/scripts/nap-lai-nguoi.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 2 — fixture evidence của thẻ viết tay theo khuôn bên đọc, không lấy từ writer evidenceThe**
  Người dùng thấy gì: Nếu sau này phía tạo thẻ đổi tên trường, màn duyệt có thể hiện trống mà test không báo. Hiện hai phía đang khớp.
  Căn cứ: Hiện chưa gây lỗi, kiểm tra trên dữ liệu thật vẫn bắt được, và nếu có lỗi chỉ là hiển thị, sửa lại dễ.
  file: `app/tests/review-nguoi.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
