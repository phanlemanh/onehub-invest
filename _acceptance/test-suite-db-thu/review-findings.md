## Trong hợp đồng

- **Thước E2 nhận 0 lần dựng trong khi AC-3 và expected của E2 vẫn ghi «đúng một lần»**
  file: `_acceptance/test-suite-db-thu/probes/that.sh:62`
  severity: medium
  AC: AC-3
  source: conventions
  detail: Sau lượt chấm 2, `that.sh` đổi thành `[ "$so_dung" -le 1 ]` (quyết định d-20261105T161456Z-16), nhưng hợp đồng không được cập nhật theo. AC-3 vẫn ghi «dựng lại đúng một lần», và evals.yaml dòng 33 của E2 vẫn ghi «đúng một lần dựng». Người ký đọc expected sẽ hiểu chặt hơn điều probe thật sự đo. `so_dung` đếm bằng cách grep chuỗi «dựng xong» trong stdout, nên nếu đổi câu thông báo thì số này luôn là 0 và vế đếm vẫn đạt. Khi đó chỉ còn các kiểm dấu mẫu và mau_moi sót, không kiểm nào phát hiện được dựng nhiều lần. Cần cho contract, evals và probe nói cùng một thước.
  rationale: AC-3 viết «dựng lại đúng một lần» nhưng phép đo chấp nhận cả 0 lần, nên điều AC hứa không được kiểm đúng như chữ.

- **Eval E2 và AC-3 hứa «đúng một lần dựng», còn that.sh nhận 0 hoặc 1 và không in số đếm**
  file: `_acceptance/test-suite-db-thu/probes/that.sh:61`
  severity: low
  AC: AC-3
  source: bugs
  detail: Commit cfacf45e nới thước thành `[ "$so_dung" -le 1 ]`. evals.yaml E2 vẫn ghi «ba lượt thấy mẫu lệch dấu cùng lúc thì đúng một lần dựng», contract.md AC-3 vẫn ghi «dựng lại đúng một lần». Dòng in «E2 đạt» không có so_dung, nên người chấm không phân biệt được lượt đã thật sự thử tranh khoá dựng mẫu (1) với lượt bên khác dựng hộ (0). Khi so_dung = 0, phần tranh khoá của ba lượt không tự dựng lần nào mà E2 vẫn đạt. Hướng sửa: đổi chữ của eval và in so_dung vào dòng đạt.
  rationale: AC-3 hứa «dựng lại đúng một lần» còn phép đo nhận cả 0 lần và không in số đếm, nên người chấm không phân biệt được lượt đã thật sự tranh khoá.

- **Hình 4 (âm-tính-một-mình): that.sh chỉ chặn trên số lần dựng nên 0 lần cũng đạt, trong khi E2 và AC-3 ghi «đúng một lần»**
  file: `_acceptance/test-suite-db-thu/probes/that.sh:61`
  severity: medium
  AC: AC-3
  source: measurement
  detail: Dòng 61 chỉ kiểm `[ "$so_dung" -le 1 ]`, chú thích dòng 60 nhận cả 0 lần. evals.yaml E2 vẫn ghi «đúng một lần dựng», AC-3 ghi «dựng lại đúng một lần ... cả khi ba lượt thấy mẫu cũ cùng lúc». Khi so_dung = 0, bản dựng đến từ lượt khác, nên không có bằng chứng rằng chính ba lượt này đã tranh khoá và chỉ một bên dựng. Dòng 63 chỉ khớp khuôn COMMENT, chứng được mẫu đã bị thay nhưng không chứng được điều đó. Nhánh này không có đối chứng dương và không in lý do, nên «E2 đạt» trông giống nhau ở cả hai trường hợp. Quyết định d-20261105T161456Z-16 chấp nhận 0 hoặc 1, nhưng lời hứa trong evals.yaml và contract.md chưa đổi theo.
  rationale: AC-3 viết «dựng lại đúng một lần ... cả khi ba lượt thấy mẫu cũ cùng lúc» nhưng phép đo đạt cả khi không lượt nào dựng, nên điều AC hứa không được chứng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Rào DB chung của --chay mở theo hướng cho qua: mọi dạng viết host khác hai chuỗi đã liệt kê đều chạy thẳng trên URL đó**
  Người dùng thấy gì: Nếu ai đó trỏ bài kiểm thử tới DB chung bằng một cách viết địa chỉ lạ, bài kiểm thử vẫn chạy thẳng trên DB chung thay vì được chuyển sang DB riêng của lượt. Hiện chưa nơi nào trong dự án viết địa chỉ theo kiểu đó.
  Căn cứ: Xác suất gặp thấp vì dự án chỉ dùng hai cách viết đã được chặn, và chưa chứng minh được máy này thật sự nối tới DB chung qua các cách kia.
  file: `db/db-thu.sh`
  severity: low
  Đề xuất: known-limits

- **nhanMau dựng bản mẫu bằng chế độ thường, bỏ qua các điều kiện của bản mẫu mà chính việc này đặt ra**
  Người dùng thấy gì: Lần đo đầu tiên trên một máy chưa có bản mẫu có thể dùng bản mẫu thiếu thống kê, làm phép đo chạy chậm hoặc lệch. Người dùng cuối của ứng dụng không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng lần đo đầu trên máy mới, tự hết sau khi bản mẫu chuẩn được dựng, và không chạm tới dữ liệu hay người dùng.
  file: `_acceptance/test-suite-db-thu/probes/song-song.mjs`
  severity: low
  Đề xuất: known-limits

- **Tệp test thiếu mốc của S06 nối chuỗi ?options= vào DATABASE_URL thay vì dùng searchParams như pattern có sẵn**
  Người dùng thấy gì: Khi địa chỉ DB đã kèm tham số, một bài kiểm thử của nguồn S06 có thể báo đỏ oan dù code không hỏng. Không ghi nhầm dữ liệu vào đâu.
  Căn cứ: Chỉ gây báo đỏ giả, không mất hay lộ dữ liệu, và chạy lại với địa chỉ không kèm tham số là qua.
  file: `pipeline/scripts/` (tệp test thiếu mốc của S06)
  severity: low
  Đề xuất: known-limits

- **dem-deadlock.mjs nuốt lỗi docker: không đọc được log vẫn báo 0 ca và thoát 0**
  Người dùng thấy gì: Công cụ đếm số ca deadlock trên DB chung có thể báo 0 ca khi thực ra nó không đọc được nhật ký. Người xem số đó có thể tưởng deadlock đã hết và bỏ qua việc xử lý tiếp. Người dùng cuối của sản phẩm không bị ảnh hưởng, chỉ có quyết định nội bộ về việc tiếp theo bị lệch.
  Căn cứ: Hậu quả nhẹ và không mất dữ liệu: chỉ khiến một con số theo dõi nội bộ sai khi máy thiếu công cụ đọc nhật ký, và chạy lại trên máy đủ công cụ là có số đúng. Ghi thành hạn chế đã biết là đủ, vì người đọc số chỉ cần biết không tin con số 0 khi chưa chắc nhật ký đã đọc được.
  file: `_acceptance/test-suite-db-thu/probes/dem-deadlock.mjs`
  severity: medium
  Đề xuất: known-limits

- **Dấu lược đồ bỏ sót constraint, index, trigger, giá trị enum và độ dài kiểu, nên mẫu cũ dùng tới 24 giờ dù lược đồ đã đổi**
  Người dùng thấy gì: Sau khi đổi cấu trúc DB theo một số kiểu (thêm ràng buộc, chỉ mục, giá trị liệt kê), bài kiểm thử có thể chạy trên cấu trúc cũ tới 24 giờ, nên báo đỏ oan hoặc xanh oan.
  Căn cứ: Kết quả kiểm thử sai tới 24 giờ có thể che lỗi thật hoặc gây báo động giả, nhưng tự hết khi bản mẫu hết tuổi và xoá tay bản mẫu là xử lý được ngay; sửa không đắt.
  file: `db/db-thu.sh`
  severity: medium
  Đề xuất: new-contract

- **DB oneinvest_suite_sellers_chip còn sót trên máy chủ, don_mo_coi không bao giờ dọn vì tên không có đuôi pid**
  Người dùng thấy gì: Một bản sao DB thử còn nằm trên máy chủ, chiếm chỗ đĩa cho tới khi có người xoá tay. Việc dọn tự động không xử lý được bản này.
  Căn cứ: Chỉ tốn một ít đĩa, nguồn gốc là lượt chạy trên bản cũ nên không lặp lại, và xoá tay bằng một lệnh là xong.
  file: `db/db-thu.sh`
  severity: low
  Đề xuất: known-limits

- **lay-mau.mjs chỉ giữ 2000 ký tự đuôi nên lượt đỏ in ca.tests và ca.fail bằng -1**
  Người dùng thấy gì: Khi bộ kiểm thử đỏ với nhiều lỗi dài, báo cáo bằng chứng mất số ca hỏng và hiện -1. Kết quả đỏ vẫn đúng, không có xanh giả.
  Căn cứ: Chỉ làm bằng chứng của lượt đỏ thiếu con số, không gây xanh giả hay mất dữ liệu, và người đọc có thể xem đầy đủ trong nhật ký gốc.
  file: `_acceptance/test-suite-db-thu/probes/lay-mau.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 3 (assert chuỗi có mặt trong khi lời hứa là QUAN HỆ): dongLot suy ra URL đã trỏ đúng hoặc biến đã được gán lại từ chữ ở dòng kề, không từ quan hệ thật**
  Người dùng thấy gì: Bộ quét phát hiện test tự nối DB chung có thể bỏ sót vài kiểu viết mã cố tình lắt léo. Hiện chưa thấy bài kiểm thử thật nào lọt.
  Căn cứ: Rủi ro chỉ xuất hiện khi có người viết mã đúng kiểu lách đó trong tương lai, và bộ quét vẫn bắt phần lớn các dạng phổ biến.
  file: `scripts/db-thu.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình 3 (assert chuỗi có mặt trong khi lời hứa là QUAN HỆ): thước của lay-mau và ba-bo không ràng buộc kết nối với DB của lượt, cũng không đọc ca.pass và ca.fail mà E5-E7 ghi**
  Người dùng thấy gì: Phép đo xác nhận bài kiểm thử không chạm DB chung có thể xanh dù không thật sự dùng DB riêng của lượt. Con số bằng chứng lúc đó kém chặt hơn lời mô tả.
  Căn cứ: Điều quan trọng nhất, không có kết nối vào DB chung, vẫn được đo đúng, nên chỉ là bằng chứng phụ kém chặt.
  file: `_acceptance/test-suite-db-thu/probes/lay-mau.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình 3 (assert chuỗi có mặt trong khi lời hứa là QUAN HỆ): bộ đếm bên ghi gộp hai bước, refresh-bait-gap chết hẳn thì E3, E4 vẫn xanh**
  Người dùng thấy gì: Phép thử tải có thể xanh dù một trong hai tiến trình giả lập tải ghi đã chết. Khi đó bằng chứng «chịu được tải thật» yếu hơn lời mô tả.
  Căn cứ: Chỉ làm bằng chứng tải nhẹ đi chứ không làm sai kết quả cách ly DB, và vẫn còn một bên ghi được chứng minh là hoạt động.
  file: `_acceptance/test-suite-db-thu/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình 4 (âm-tính-một-mình): ca «mẫu mới không dump» bỏ qua kết quả lệnh, script dừng sớm vẫn xanh**
  Người dùng thấy gì: Một bài kiểm thử có thể xanh dù lệnh dừng sớm giữa chừng, nên không bắt được lỗi dừng sớm đó ở riêng ca này.
  Căn cứ: Chỉ làm một ca kiểm yếu hơn mong muốn, không ảnh hưởng người dùng, và các ca khác vẫn kiểm hành vi dựng lại mẫu.
  file: `scripts/db-thu.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 4 (âm-tính-một-mình): E4 ghi đối chứng «bên ghi không chạy» nhưng lệnh của E4 không bao giờ chạy đối chứng đó**
  Người dùng thấy gì: Lượt chấm E4 không có đầu ra cho đối chứng mà mô tả hứa, nên người chấm phải xem sang lượt E3 để thấy đối chứng. Kết quả chính không đổi.
  Căn cứ: Rủi ro thấp vì hai lượt dùng chung mã đo và đối chứng vẫn chạy ở lượt kia; chỉ là mô tả và đầu ra lệch nhau.
  file: `_acceptance/test-suite-db-thu/probes/song-song.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
