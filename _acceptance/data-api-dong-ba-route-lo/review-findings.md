## Trong hợp đồng

- **Hình dạng 4 (không ghim thông điệp): ô coverage-cu của pha.mjs ghim tiền tố «DRL coverage lộ», và tiền tố này khớp cả thông điệp không thuộc lớp khoá cấm hay chuỗi canh**
  AC: AC-6
  file: `_acceptance/data-api-dong-ba-route-lo/probes/pha.mjs:21`
  severity: low
  source: measurement
  detail: Dòng 21 đặt `json: "DRL coverage lộ"`, và dòng 66 coi lớp JSON là đỏ khi `ra.includes(o.json)`. Tiền tố này khớp ba thông điệp khác nhau trong dong-ba-route.test.ts. Thứ nhất là «DRL coverage lộ: thiếu thị trường canh» (dòng 214), báo thiếu dòng chứ không báo lộ dữ liệu. Thứ hai là «DRL coverage lộ dấu S02: thị trường không có S02 bị bỏ khỏi danh sách» (dòng 220), kiểm sự có mặt của dòng. Thứ ba mới là «DRL coverage lộ khoá cấm» và «lộ chuỗi canh» (dòng 224-225). Bản coverage.ts cũ nối `JOIN LATERAL ... lc ON TRUE` nên thị trường B luôn bị bỏ, tức là thông điệp «lộ dấu S02» luôn xuất hiện. Vì vậy ô coverage-cu vẫn ra `lop_json = true` kể cả khi phần quét KHOA_CAM_COVERAGE hay phần dò chuỗi canh CANH.soS02/CANH.kyS02 bị hỏng hoặc không bao giờ đỏ. Trong khi đó evals.yaml E3 hứa rằng chiều đỏ ra «DRL coverage lộ khoá cấm», và E6 hứa «lớp JSON» đỏ. Nghĩa là chiều đỏ của hai phép đo đó không được chứng minh độc lập, vì tiền tố đã ghim lẫn chúng với một phép đo khác.
  rationale: AC-6 đòi mỗi lớp một thông điệp ghim riêng (lớp JSON là khoá cấm hay chuỗi canh) và hai lớp độc lập; tiền tố ghim quá rộng làm chiều đỏ của lớp JSON không được chứng minh riêng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Test DRL gọi /v1/deals và /v1/listings không lọc, nên trên DB có dữ liệu thật dòng canh có thể rơi khỏi trang đầu**
  Người dùng thấy gì: Khi chạy kiểm thử trên máy thu có nhiều dữ liệu thật, các ca kiểm có thể báo đỏ giả vì tin cấy thử bị đẩy ra khỏi trang đầu. Luật chặn lộ dữ liệu vẫn đúng, chỉ là phép kiểm có thể báo sai.
  Căn cứ: Chỉ làm phép kiểm báo đỏ nhầm trên máy có dữ liệu thật, không làm lộ hay mất dữ liệu của người dùng, chạy lại hoặc sửa sau đều rẻ.
  file: `data-api/test/dong-ba-route.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Test DRL tìm dòng cấy trong danh sách đã phân trang, không lọc theo khu; trên DB có dữ liệu thật sẽ đỏ giả (cả AC-1, AC-2, AC-5 và ô «goc» của pha.mjs)**
  Người dùng thấy gì: Trên máy có dữ liệu thật, bộ kiểm có thể báo đỏ dù ba đường API đã được gỡ đúng luật. Người dùng cuối không bị ảnh hưởng, chỉ người chạy kiểm thử thấy kết quả sai.
  Căn cứ: Hậu quả chỉ là báo động giả cho người kiểm, không ảnh hưởng dữ liệu hay người dùng, và có thể tự thử lại hoặc sửa sau với chi phí thấp.
  file: `data-api/test/dong-ba-route.test.ts`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
