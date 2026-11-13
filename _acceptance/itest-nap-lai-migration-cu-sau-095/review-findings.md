# Review findings: itest-nap-lai-migration-cu-sau-095 (round 1)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Đối chứng TEP không dựng DB thử riêng cho từng tệp ở merge-base: tên oneinvest_suite_itnl_goc<i> không có tác dụng**
  Người dùng thấy gì: Bước đối chứng chạy bốn tệp kiểm cũ trên cùng một DB thử thay vì bốn DB riêng. Kết quả vẫn đúng và DB thật không bị đụng, chỉ là lời chú thích không khớp.
  Căn cứ: Không ảnh hưởng dữ liệu hay sản phẩm, chỉ là công cụ chấm nội bộ, và sửa không đáng công.
  file: `_acceptance/itest-nap-lai-migration-cu-sau-095/probes/doi-chung.mjs`
  severity: low
  Đề xuất: wont-fix

- **Probe co-096 không kiểm phần hetSo mà E11 ghi là kỳ vọng, chỉ in ra rồi vẫn thoát 0**
  Người dùng thấy gì: Công cụ kiểm tra chưa bắt được trường hợp một ca thử dựng DB sai mức migration. Hiện chưa có ca nào như vậy nên chưa gây hại.
  Căn cứ: Chỉ là chỗ hở của lưới kiểm tra về sau, không làm mất hay lộ dữ liệu, và có thể vá lúc có ca đầu tiên cần.
  file: `_acceptance/itest-nap-lai-migration-cu-sau-095/probes/co-096.mjs`
  severity: low
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình: tiền đề 'có phát biểu ngoài 061' là đối chứng dương giả, luôn đúng**
  Người dùng thấy gì: Một bước kiểm tra tiền đề trong bài thử nạp lại luôn qua, nên bài thử có thể xanh dù dữ liệu thử không đủ để làm lộ lỗi. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm bài thử yếu đi, không ảnh hưởng dữ liệu hay sản phẩm; bài thử đối chứng ở bản cũ vẫn đỏ đúng như kỳ vọng.
  file: `pipeline/scripts/nap-lai-giu-rang-buoc.itest.mjs`
  severity: high
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình: vòng kiểm hợp trường có thể rỗng, không đếm số câu ADD sau nạp**
  Người dùng thấy gì: Nếu sau này bộ nạp lại đổi cách viết câu lệnh, bài thử có thể xanh mà không kiểm gì. Hiện tại chưa gây lỗi cho ai.
  Căn cứ: Rủi ro chỉ ở tương lai và chỉ trong công cụ kiểm thử, không mất dữ liệu; sửa sau rẻ.
  file: `pipeline/scripts/nap-lai-giu-rang-buoc.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Assert 'chuỗi có mặt' trong khi lời hứa là QUAN HỆ: co-096 chỉ in mức hetSo, không so với mức của ca**
  Người dùng thấy gì: Công cụ kiểm tra chưa so mức migration của từng ca thử với DB nó dùng, nên chưa thể báo đỏ nếu lệch. Hiện chưa có ca nào lệch.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, chỉ là lưới kiểm thử còn hở và vá được khi cần.
  file: `_acceptance/itest-nap-lai-migration-cu-sau-095/probes/co-096.mjs`
  severity: high
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình: đối chứng TEP coi mọi lần đỏ là đúng, không ghim thông điệp lỗi**
  Người dùng thấy gì: Bước đối chứng chỉ xác nhận bốn bài thử cũ đỏ, chưa chứng minh đỏ đúng vì lỗi đã sửa. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm bằng chứng đối chứng kém chặt, không ảnh hưởng sản phẩm hay dữ liệu, và người ký vẫn xem lại được.
  file: `_acceptance/itest-nap-lai-migration-cu-sau-095/probes/doi-chung.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
