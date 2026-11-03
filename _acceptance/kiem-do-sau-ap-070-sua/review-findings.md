# Review findings — kiem-do-sau-ap-070-sua (round 4)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thước độc lập của hồ sơ do-danh-ba-sdt còn công thức N3 cũ, trong khi diff làm các eval của hồ sơ ấy cũ**
  Người dùng thấy gì: Thước kiểm của một hồ sơ nghiệm thu cũ vẫn đếm số điện thoại theo cách cũ. Khi có số ghép từ sàn S06, thước đó có thể báo lệch dù số liệu trên màn hình đúng.
  Căn cứ: Chỉ làm một phép kiểm phụ báo đỏ nhầm sau này, không làm sai số liệu của người dùng; chạy lại hoặc sửa thước sau đều rẻ.
  file: `_acceptance/do-danh-ba-sdt/probes/db.mjs`
  severity: low
  Đề xuất: new-contract

- **AC-4 đo «đã áp 068» nhưng napPhatBieu đè mất 068 trong giao dịch, bộ gán SĐT bỏ qua mà phép đo vẫn báo đạt**
  Người dùng thấy gì: Phép đo trên bản chép thật báo đạt, nhưng đường ghi số điện thoại cho tin ghép của S06 không thật sự được chạy trong ba bộ kiểm. Bằng chứng nói nhiều hơn điều đã đo.
  Căn cứ: Không đụng dữ liệu thật vì mọi thứ nằm trong giao dịch hoàn tác; chỉ là khoảng trống bằng chứng, ghi lại rồi bổ sung ở lượt sau là đủ.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lỗi hạ tầng giữa phép đo bỏ qua bước xoá DB thử, và kết quả xoá không được kiểm**
  Người dùng thấy gì: Nếu phép đo gặp sự cố giữa chừng, một bản chép cơ sở dữ liệu thử có thể còn sót lại trên máy chủ dùng chung mà không ai hay.
  Căn cứ: Chỉ tốn chỗ chứa trên máy, không ảnh hưởng dữ liệu thật; người vận hành tự xoá bản thừa bất cứ lúc nào.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Thước độc lập của hồ sơ do-danh-ba-sdt còn công thức N3 cũ, sẽ báo lệch giả khi có số ghép S06**
  Người dùng thấy gì: Thước kiểm của hồ sơ danh bạ số điện thoại cũ sẽ báo lệch giả sau khi số ghép S06 được ghi vào hệ thống.
  Căn cứ: Chỉ gây báo động nhầm ở phép kiểm phụ, không làm sai số liệu hiển thị; sửa sau vẫn rẻ nhưng nên có hàng nhận để không bị quên.
  file: `_acceptance/do-danh-ba-sdt/probes/db.mjs`
  severity: low
  Đề xuất: new-contract

- **Nhãn Ops «SĐT trên tin» sai nghĩa với số N3 mới**
  Người dùng thấy gì: Trang vận hành ghi «N SĐT trên tin» nhưng con số nay đã loại một số số ghép chưa có bí danh, nên nhỏ hơn số thật mà không có lời giải thích.
  Căn cứ: Chỉ sai chữ trên trang nội bộ, trạng thái đạt hay không vẫn đúng; sửa nhãn sau rất rẻ.
  file: `app/src/lib/dq-labels.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: tuyên «ma trận bốn migration × hai trạng thái view» nhưng vế chạy thật chỉ có một điểm, ô 059 không được thực thi ở đâu cả**
  Người dùng thấy gì: Việc nạp lại bản cập nhật 059 sau khi áp 070 chỉ được kiểm bằng so văn bản, chưa được chạy thật trên cơ sở dữ liệu.
  Căn cứ: Rủi ro chỉ là bỏ sót lỗi hiếm ở một bước nạp lại nội bộ; không mất dữ liệu và có thể bổ sung phép chạy thật bất cứ lúc nào.
  file: `pipeline/scripts/kiem-do-sau-070.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: bí danh viết tay đúng khuôn vế EXISTS của SQL_N3, vế này chưa từng đọc dòng do dungNguoi ghi**
  Người dùng thấy gì: Phép kiểm số điện thoại có bí danh dùng dòng bí danh dựng tay, chưa đi qua đường ghi thật của danh bạ cho trường hợp số chỉ nằm trên tin ghép.
  Căn cứ: Nếu sai chỉ lệch một con số kiểm tra nội bộ, không ảnh hưởng người dùng cuối; có thể thêm ca kiểm sau khi nhận diện được.
  file: `pipeline/scripts/kiem-do-sau-070.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: đối chứng cột của E5 và sáu nhánh tự kiểm chỉ đếm số vi phạm, không ghim thông điệp như evals khai**
  Người dùng thấy gì: Phần tự kiểm của công cụ đo chỉ đếm số lỗi chứ không kiểm nội dung lỗi, nên một nhánh đổi sang báo lỗi khác vẫn có thể lọt.
  Căn cứ: Chỉ làm công cụ đo kém nhạy hơn mô tả, không đụng dữ liệu hay giao diện; củng cố sau rẻ.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: vế «không đổi migration có từ trước» của E5 âm tính một mình, không có đối chứng dương**
  Người dùng thấy gì: Phép kiểm «không sửa migration cũ» chưa có ca thử để chứng tỏ nó thật sự báo đỏ khi migration cũ bị sửa.
  Căn cứ: Không làm sai dữ liệu; hook và nhánh bảo vệ của kho đã chặn sửa migration đã commit nên rủi ro thấp.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1: kiểm bộ đo chạy đúng DB thử bằng grep mã nguồn, không đo đầu ra lúc chạy**
  Người dùng thấy gì: Việc ba bộ kiểm chạy đúng trên cơ sở dữ liệu thử chỉ được xác nhận bằng đọc mã, chưa bằng kết quả lúc chạy.
  Căn cứ: Khả năng chạy nhầm sang dữ liệu thật thấp vì mọi thứ nằm trong giao dịch hoàn tác; không mất dữ liệu.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2: tự kiểm «bỏ qua ca» và «lỗi view» bơm số thẳng vào xetBo, đường đọc nhật ký fail-open không được thử**
  Người dùng thấy gì: Nếu định dạng nhật ký của bộ kiểm đổi, công cụ đo có thể coi như «không ca nào bị bỏ qua» và báo đạt nhầm.
  Căn cứ: Hiện chưa có dấu hiệu sai, chỉ là điểm yếu tiềm ẩn của công cụ đo nội bộ; người dùng cuối không bị ảnh hưởng.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/11 lỗi rơi vào file không bộ đo nào phủ (_acceptance/do-danh-ba-sdt/probes/db.mjs, app/src/lib/dq-labels.ts) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
