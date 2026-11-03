# Review findings: kiem-do-sau-ap-070-sua (round 3)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thoát hạ tầng trong khối try bỏ qua finally, để lại bản chép DB thử**
  Người dùng thấy gì: Nếu phép đo gặp lỗi hạ tầng giữa chừng, một bản chép đầy đủ dữ liệu có thể còn nằm lại trên máy chủ dữ liệu dùng chung cho đến lần đo kế tiếp.
  Căn cứ: Hậu quả nhẹ: bản chép chỉ nằm trên máy nội bộ, không lộ ra ngoài, và tự bị ghi đè hoặc xoá tay được ở lần chạy sau.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Thước độc lập của hồ sơ do-danh-ba-sdt còn câu N3 cũ, sẽ lệch với lệnh sau khi áp 068**
  Người dùng thấy gì: Khi hồ sơ đo danh bạ cũ được chạy lại sau khi có số ghép, phép đối chiếu độc lập của nó có thể báo lệch dù lệnh đo đúng, làm người vận hành tưởng có lỗi.
  Căn cứ: Hôm nay chưa lộ vì dữ liệu chưa có số như vậy, và chỉ gây báo đỏ giả khi làm mới hồ sơ cũ; sửa thuộc việc riêng của hồ sơ đó.
  file: `_acceptance/do-danh-ba-sdt/probes/db.mjs`
  severity: low
  Đề xuất: new-contract

- **Khoá `sdt_tren_tin` và nhãn «SĐT trên tin» không còn đúng với số N3 mới**
  Người dùng thấy gì: Trang vận hành có thể hiện số «SĐT trên tin» nhỏ hơn số SĐT thực có trên tin mà không giải thích vì sao.
  Căn cứ: Chỉ là chữ nhãn trên màn hình vận hành nội bộ, không mất hay lộ dữ liệu; sửa chữ sau rất rẻ khi có dịp chạm tới nhãn.
  file: `pipeline/do-danh-ba-sdt.mjs`
  severity: low
  Đề xuất: known-limits

- **`paths` của eval bỏ sót phần được đo, nên bằng chứng không cũ khi các phần đó đổi**
  Người dùng thấy gì: Nếu sau này ai sửa ba bộ đo còn thiếu, hồ sơ nghiệm thu vẫn được coi là còn mới dù chưa đo lại.
  Căn cứ: Không ảnh hưởng người dùng cuối; chỉ làm bằng chứng nghiệm thu có thể cũ mà không bị báo, và bổ sung đường dẫn sau này rất dễ.
  file: `_acceptance/kiem-do-sau-ap-070-sua/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Lỗi hạ tầng giữa phép đo bỏ qua bước xoá DB thử, và kết quả xoá không được kiểm**
  Người dùng thấy gì: Phép đo có thể báo đạt dù bản chép thử chưa được xoá, để lại dữ liệu người bán trên máy chủ dùng chung ngoài ý muốn.
  Căn cứ: Dữ liệu người bán trên tin rao đã là công khai theo quy định hiện hành và bản chép chỉ ở máy nội bộ; người vận hành tự xoá được bằng một lệnh.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Câu đo độc lập của E2 do-danh-ba-sdt vẫn giữ công thức N3 cũ, sẽ báo LECH n3.sdt sau khi có số ghép**
  Người dùng thấy gì: Khi dữ liệu có số ghép chưa có bí danh, phép đối chiếu của hồ sơ danh bạ cũ sẽ báo lệch giả, khiến người duyệt nghi ngờ con số đúng.
  Căn cứ: Chưa xảy ra hôm nay, chỉ gây đỏ giả khi chạy lại hồ sơ cũ và không làm sai dữ liệu; nên xử lý trong lần làm mới hồ sơ đó.
  file: `_acceptance/do-danh-ba-sdt/probes/db.mjs`
  severity: low
  Đề xuất: new-contract

- **Hình dạng 5: «bốn migration × hai trạng thái view» chỉ là ma trận văn bản, vế chạy thật chỉ có một điểm, và 059 không được thực thi qua sqlNapLai**
  Người dùng thấy gì: Bài kiểm nạp lại cấu trúc dữ liệu cũ chưa chạy thử toàn bộ một trong bốn tệp trên view đã mở rộng, nên một lỗi hiếm ở tệp đó có thể lọt.
  Căn cứ: Không mất dữ liệu người dùng và chỉ lộ khi chạy lại tệp cũ trên máy dev; có thể bổ sung phép chạy thật sau khi cần mà không tốn kém.
  file: `pipeline/scripts/kiem-do-sau-070.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: bí danh viết tay đúng khuôn SQL_N3, vế EXISTS của n3 chưa từng đọc dòng do dungNguoi ghi**
  Người dùng thấy gì: Bài kiểm chưa chứng minh cách hệ thống thật ghi bí danh khớp với cách bài kiểm giả lập, nên nếu cách ghi đổi thì bài kiểm vẫn xanh.
  Căn cứ: Rủi ro chỉ là bài kiểm bỏ sót một thay đổi trong tương lai, không ảnh hưởng dữ liệu hiện tại và dễ bổ sung khi chạm vào phần ghi bí danh.
  file: `pipeline/scripts/kiem-do-sau-070.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: đối chứng cột của E5 và các nhánh bộ phán chỉ đếm số vi phạm, không ghim thông điệp như evals khai**
  Người dùng thấy gì: Phép tự kiểm của công cụ đo chỉ đếm số vi phạm nên một nhánh hỏng có thể lọt nếu sinh ra vi phạm khác.
  Căn cứ: Chỉ làm công cụ nghiệm thu kém chặt, không chạm người dùng cuối; sửa sau rẻ nhưng không cấp bách.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: vế «không đổi migration có từ trước» của E5 âm tính một mình, không có đối chứng dương**
  Người dùng thấy gì: Việc kiểm không sửa tệp cấu trúc dữ liệu cũ chưa có ca thử chứng minh nó bắt được thay đổi thật, nên nếu bộ lọc sai thì vẫn báo đạt.
  Căn cứ: Hiện chưa có thay đổi nào bị bỏ lọt và git vẫn chặn sửa migration đã commit, nên rủi ro thấp.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1: kiểm bộ chạy đúng DB thử bằng grep mã nguồn, không đo đầu ra**
  Người dùng thấy gì: Chưa có bằng chứng lúc chạy rằng ba bộ đo thật sự chạy trên bản chép thử chứ không phải trên dữ liệu thật, nên có thể đo hụt mà vẫn xanh.
  Căn cứ: Rủi ro là kết quả đo kém tin cậy chứ không làm mất hay lộ dữ liệu; chạy lại phép đo là kiểm lại được.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2: tự kiểm «bỏ qua ca» và «lỗi view» bơm số thẳng vào bộ phán, đường đọc nhật ký fail-open không được thử**
  Người dùng thấy gì: Nếu định dạng nhật ký của công cụ chạy test đổi, phép đo có thể không phát hiện ca bị bỏ qua mà vẫn báo đạt.
  Căn cứ: Chỉ xảy ra khi công cụ test đổi định dạng và không ảnh hưởng người dùng; nhật ký hiện tại khớp, sửa sau rẻ.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: «phần còn lại giữ nguyên» đo bằng startsWith và endsWith, không đo quan hệ bằng nhau**
  Người dùng thấy gì: Bài kiểm có thể không phát hiện nếu phần giữa của tệp nạp lại bị thay đổi ngoài ý muốn, vì chỉ so đầu và cuối.
  Căn cứ: Hàm này hiện chỉ cắt một câu cố định nên khả năng sai thấp, không ảnh hưởng người dùng cuối và có thể siết chặt khi cần.
  file: `pipeline/scripts/kiem-do-sau-070.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/13 lỗi rơi vào file không bộ đo nào phủ (_acceptance/do-danh-ba-sdt/probes/db.mjs, _acceptance/kiem-do-sau-ap-070-sua/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
