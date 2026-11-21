# Review findings: gop-nut-trung-ma-can-s16 (round 1)

## Trong hợp đồng

- **Hình dạng 4 (âm tính một mình, không đối chứng dương): GNT-7 «lượt dựng đêm chạy hai lần không đúc lại» chạy dung() với noiS16: {} nên bước S16 bỏ qua dự án thử**
  file: `pipeline/scripts/phan-khu-s16-ma-can.itest.mjs:293`
  severity: high
  source: measurement
  AC: AC-7
  detail: Vòng `for (const lan of [1, 2]) { const kq = await dung(db, { khuSlugs: [x.c.slug], ..., noiS16: {}, ... }); assert.equal(kq.khoa_moi, 0, ...) }`. Trong lib/s16-dung.mjs buocS16 dùng `noi[duoiDuAn(du_an)]`; vì noi rỗng nên mọi dự án S16, kể cả `pk-t7`, rơi vào `bo_du_an` và không dựng gì. Do đó khoa_moi = 0 đúng một cách hiển nhiên, dù bước S16 có đúc lại hay không. Không có đối chứng dương nào cho thấy lượt dựng thật sự chạm tới nút giữ và nút nghỉ, chẳng hạn khoa_moi > 0 khi chưa nối, hoặc s16.khu[x.c.slug] có mặt. Phần «dựng phân khu S16» được đo bằng dungTheLuat. Đây là hàm chỉ dựng kế hoạch, không ghi, và chỉ gọi MỘT lần (dòng 296). Vì vậy `(await demBang()).nut === truoc` không thể đỏ: không có lượt áp nào chạy hai lần. Lời hứa E7 «chạy hai lần: 0 nút mới, 0 khoá khu mới» chưa được đo trên đầu ra của lượt dựng.
  lý do vào hợp đồng: AC-7 đòi lượt dựng đêm chạy hai lần không đúc lại nút; phép đo hiện tại bỏ qua bước S16 nên không chứng minh được điều này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **docMaCan đọc mã căn và tên toà S16 thô, không chuẩn hoá như các chỗ khác trong repo**
  Người dùng thấy gì: Nếu mã căn hay tên toà có khoảng trắng thừa hoặc khác chữ hoa thường, hệ thống có thể bỏ sót một cặp phân khu đáng lẽ được gộp, và để nguyên hai nút trùng.
  Căn cứ: Lỗi chỉ làm bỏ sót việc gộp, không làm mất hay gộp sai dữ liệu, và người dùng có thể xử lý tay hoặc chạy lại sau khi sửa.
  file: `pipeline/phan-khu-s16.mjs`
  severity: medium
  Đề xuất: known-limits

- **docMaCan nhận cả mã căn giữ chỗ («K dung», «do not use») và không chuẩn hoá chữ hoa, nên một khu có mã rác không bao giờ đạt mức đủ tiền tố**
  Người dùng thấy gì: Khu có mã căn giữ chỗ sẽ không được gộp tự động và chỉ hiện là chưa đủ bằng chứng, mà không nói rõ lý do.
  Căn cứ: Hệ quả chỉ là bỏ sót việc gộp một số khu, không mất dữ liệu, và có thể gộp sau khi người xem xét.
  file: `pipeline/phan-khu-s16.mjs`
  severity: low
  Đề xuất: known-limits

- **Probe quet-ma-can nối stg_s16_can với stg_s16_toa chỉ bằng toa_id, thiếu du_an, nên số đo lệch với code thật**
  Người dùng thấy gì: Bảng số khảo sát ban đầu có thể lệch đôi chút so với thực tế, nhưng không ảnh hưởng đến dữ liệu hay màn hình của người dùng.
  Căn cứ: Chỉ là công cụ đo tạm của đợt làm, số cuối cùng dùng để ký được đo lại bằng đường khác.
  file: `_acceptance/gop-nut-trung-ma-can-s16/probes/quet-ma-can.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (âm tính một mình): chiều đỏ của GNT-3 không làm đỏ assert «ca cần người không đổi một byte»**
  Người dùng thấy gì: Phép kiểm tự động chưa chứng minh được rằng nó sẽ báo lỗi nếu ca cần người bị nối nhầm, nên một lỗi như vậy sau này có thể lọt qua.
  Căn cứ: Không có sai dữ liệu hiện tại; rủi ro nằm ở việc phát hiện lỗi về sau, và bổ sung phép kiểm sau này không tốn nhiều.
  file: `pipeline/scripts/phan-khu-s16-ma-can.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng thiếu phần tử): GNT-1 tuyên «ứng viên duy nhất là nút do luật đúc hay đã nghỉ» nhưng fixture không có ca nút đã nghỉ**
  Người dùng thấy gì: Chưa có phép thử riêng cho trường hợp nút phân khu đã nghỉ, nên nếu hệ thống nối nhầm vào nút đã nghỉ thì chưa chắc được phát hiện.
  Căn cứ: Là khoảng trống kiểm thử, không phải lỗi đã xảy ra, và nút nghỉ còn có kiểm tra khác ở bước đảo và soát.
  file: `pipeline/scripts/phan-khu-s16-ma-can.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn hardcode ROOT): probe do-p4.mjs mặc định đọc worktree tuyệt đối của checkout tác giả**
  Người dùng thấy gì: Công cụ đo chỉ chạy đúng trên máy của người làm, người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là tập lệnh đo nội bộ, số ký đã đi qua bản có ghim phiên bản, sửa không đem lại lợi ích.
  file: `_acceptance/gop-nut-trung-ma-can-s16/probes/do-p4.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc, không round-trip writer→reader): probe do-ben-doc.mjs và do-p4.mjs tự dựng trạng thái «sau nối» bằng UPDATE tay**
  Người dùng thấy gì: Số ước tính ban đầu về kết quả sau gộp dựng bằng cách giả lập, nhưng số dùng để ký đã lấy từ lượt gộp thật nên người dùng không bị ảnh hưởng.
  Căn cứ: Là số ước lượng sớm, không đi vào dữ liệu hay màn hình, và đã có số thật thay thế.
  file: `_acceptance/gop-nut-trung-ma-can-s16/probes/do-ben-doc.mjs`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 3/8 lỗi rơi vào file không bộ đo nào phủ (_acceptance/gop-nut-trung-ma-can-s16/probes/quet-ma-can.mjs, _acceptance/gop-nut-trung-ma-can-s16/probes/do-p4.mjs, _acceptance/gop-nut-trung-ma-can-s16/probes/do-ben-doc.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
