## Trong hợp đồng

- **Hình dạng 4 (assertion âm tính một mình): vế (1) của răng E5 kiểm «ops_audit can-theo-tin:* không đổi khi áp 066 lần hai» trên DB mà khối sửa không bao giờ chạy**
  AC: AC-5
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs:136`
  severity: medium
  source: measurement
  detail: Vế (1) dựng DB trống bằng scripts/ci-db-init.mjs. DB này không có dòng ops_audit 'phat-bieu:cat-chuyen' (chỉ nap-045.mjs chèn dòng ấy trong giao dịch thử, hoặc lệnh cắt chuyển thật) và cũng không có đề xuất applied nào. Khối «-- 4. Sửa dữ liệu một lần» của 066 bắt đầu bằng `IF EXISTS (... 'phat-bieu:cat-chuyen')` (066 dòng 235), nên cả lần áp đầu lẫn lần hai đều không làm gì. Vì thế `if (m2.audit !== m1.audit)` luôn so 0 với 0 và không bao giờ đỏ, kể cả khi khối sửa không lũy đẳng. Không có đối chứng dương nào, chẳng hạn kiểm dòng cat-chuyen có mặt hay số căn lệch > 0 trước lần áp. Vế (2) cũng vậy: không assert `canLech > 0`. Khi bản chép oneinvest có 0 căn lệch hoặc thiếu dòng cat-chuyen, các phép `sau1.audit - audit0 === 0`, `conLech === 0` và `sau2.audit === sau1.audit` đều xanh mà không đường ghi nào được chạy. Script chỉ in canLech ra log, không chặn.
  rationale: AC-5 đòi áp 066 lần hai không đổi nhật ký, nhưng răng đo điều này trên DB mà khối sửa không chạy nên không thể đỏ, tức AC-5 không được chứng minh thật.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E5 expected không khớp với răng ap-hai-lan.mjs (nguồn dựng DB và điều kiện trên oneinvest)**
  Người dùng thấy gì: Dòng mô tả kiểm tra ghi hơi khác so với việc kiểm tra thật làm, nên người ký có thể hiểu sai phạm vi. Không ảnh hưởng đến dữ liệu hay người dùng cuối.
  Căn cứ: Chỉ là chênh lệch câu chữ trong tài liệu nghiệm thu, không gây mất hay sai dữ liệu, ghi lại là đủ và sửa lúc nào cũng rẻ.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **CT-AC-4 so detail của khối sửa (đếm trên toàn DB) với số ô lệch chỉ của căn PB thử: test đỏ ngay khi DB thử chép từ oneinvest có lệch thật**
  Người dùng thấy gì: Bài kiểm tra có thể báo đỏ nhầm nếu sau này chạy trên bản sao dữ liệu thật đang có căn lệch, dù tính năng vẫn đúng. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ gây báo lỗi nhầm cho người làm kiểm thử, không đụng đến dữ liệu người dùng, và chạy lại hay chỉnh bài kiểm tra bất cứ lúc nào được.
  file: `pipeline/scripts/can-theo-tin.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **ap-hai-lan.mjs gọi process.exit(2) bên trong try nên finally không chạy, DB thử oneinvest_p2_ct_mig_<pid> bị bỏ lại**
  Người dùng thấy gì: Khi bước kiểm tra gặp lỗi, một cơ sở dữ liệu thử có thể bị bỏ lại trên máy dev. Không ảnh hưởng dữ liệu thật hay người dùng.
  Căn cứ: Chỉ để lại rác trên máy phát triển trong trường hợp lỗi hiếm, xoá tay dễ dàng, chi phí sửa không đáng so với hậu quả.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): răng nhận ra «bản 066» bằng cách grep chuỗi '066' trong thân hàm, và chuỗi ấy chỉ nằm trong comment**
  Người dùng thấy gì: Phép kiểm tra phiên bản hàm dựa vào một dòng ghi chú nên có thể nhận nhầm, nhưng hành vi thật đã có bài kiểm tra khác phủ. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Rủi ro chỉ là nhận diện nhầm phiên bản trong kiểm thử, có bài kiểm tra hành vi khác bảo vệ, không mất dữ liệu và sửa sau không đắt.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
