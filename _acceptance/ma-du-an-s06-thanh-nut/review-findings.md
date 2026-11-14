# Review findings: ma-du-an-s06-thanh-nut (round 1)

## Trong hợp đồng

- **Hình dạng 3: lời hứa 'xã nhiều tin nhất' là quan hệ giữa các giá trị, nhưng test chỉ kiểm 'area_ids có mặt'**
  AC: AC-4
  file: `pipeline/tests/noi-du-an-s06.itest.mjs:188`
  severity: medium
  source: measurement
  detail: E4 hứa area_ids[1] bằng xã có nhiều tin nhất của mã, tính độc lập. Dòng 188 chỉ assert `theoMa[ma].area_ids.length >= 1`. Dòng 194 chỉ kiểm fx-hoa, mà fx-hoa là ô hoà (lb 5, ak 5). Trong FIXTURE (dòng 88-102), không mã 'duc' nào trải nhiều xã với số tin khác nhau. Mã duy nhất như vậy là fx-2tinh (6/6) thì lại thuộc chua_noi. Vì vậy, nếu bản phá đổi SQL_DOC_MA thành `ORDER BY ma, count(*) ASC, area_id` (chọn xã ÍT tin nhất), mọi assert vẫn xanh. Quan hệ 'nhiều nhất' chưa bao giờ được đo, test không có phép tính độc lập xã có số tin lớn nhất để so.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Nút ứng viên do thẻ luật S06 đúc làm gãy lệnh --sua-xa (DV1) của danh-ba-vat-the: kiemTepXa đòi mọi nút project có mục trong xa-nut-du-an.json**
  Người dùng thấy gì: Sau khi áp thẻ luật lên máy thu, lệnh sửa mã xã cho các nút dự án sẽ báo lỗi và dừng. Mã xã của dự án và phường của toà sẽ không cập nhật được cho đến khi sửa.
  Căn cứ: Chỉ xảy ra sau khi Mạnh áp thẻ lên máy thu và không làm mất dữ liệu. Lệnh chạy lại được sau khi sửa, và sửa rẻ hơn nhiều so với rủi ro nếu để lỡ.
  file: `pipeline/noi-du-an-s06.mjs`
  severity: medium
  Đề xuất: new-contract

- **Đảo một luật cũ sau khi đã áp luật mới gần như không đảo gì, nhưng luật vẫn bị ghi là đã đảo**
  Người dùng thấy gì: Nếu áp thẻ luật lần hai trên dữ liệu đã đổi rồi đảo luật đầu, hệ thống báo đã đảo nhưng các liên kết dự án vẫn còn nguyên. Đảo luật sau thì gỡ cả liên kết của luật đầu.
  Căn cứ: Chỉ gặp khi áp nhiều luật liên tiếp, hiện mới có một luật và đã được xem mẫu. Liên kết sai vẫn gỡ được thủ công và không mất dữ liệu gốc, nhưng thông báo đã đảo gây hiểu nhầm.
  file: `pipeline/noi-du-an-s06.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: assert 'nut-trung' âm tính đứng một mình, thiếu đối chứng đỏ đã khai**
  Người dùng thấy gì: Phép kiểm chống nút trùng khi áp lần hai chưa chứng minh được là sẽ đỏ nếu bước chống trùng bị bỏ. Một lỗi đúc nút trùng trong tương lai có thể lọt qua mà không ai biết.
  Căn cứ: Hành vi hiện tại đúng và người dùng không bị ảnh hưởng. Đây chỉ là độ tin của phép kiểm, tăng thêm bất cứ lúc nào mà không mất gì.
  file: `pipeline/tests/noi-du-an-s06.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1: đối chứng đỏ của E11 grep mã nguồn context-resolver.ts thay vì chạy bản phá của resolver**
  Người dùng thấy gì: Phép kiểm cho trợ lý đọc ngữ cảnh chưa chứng minh được là sẽ đỏ nếu ai đó bỏ điều kiện loại nút ứng viên. Nút ứng viên có thể lẫn vào câu trả lời của trợ lý mà không bị bắt.
  Căn cứ: Hành vi hiện tại đúng và đã có phép kiểm âm tính. Rủi ro chỉ khi mã bị sửa sau này, sửa test không tốn nhiều.
  file: `agent/tests/context-resolver-ung-vien.test.ts`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
