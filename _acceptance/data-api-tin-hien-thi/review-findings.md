## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe AC-7 (do-db.mjs) lấy bản nền bằng merge-base với origin/main, đúng lỗi PB9 vừa sửa ở c60c50f74**
  Người dùng thấy gì: Sau khi bản này vào nhánh chính, phép đo so sánh trước/sau của việc ẩn tin nguồn không công khai sẽ không còn so được với bản cũ, nên có thể báo đỏ nhầm hoặc đo rỗng. Người dùng cuối không thấy gì; chỉ làm mất khả năng tự kiểm.
  Căn cứ: Chỉ ảnh hưởng công cụ kiểm tra nội bộ, không làm lộ hay mất dữ liệu của người dùng, và chỉnh lại sau gộp khá rẻ.
  file: `_acceptance/data-api-tin-hien-thi/probes/do-db.mjs`
  severity: high
  Đề xuất: known-limits

- **Probe ghi tệp tạm vào cây nguồn data-api/src/routes trong lúc chạy**
  Người dùng thấy gì: Khi chạy kiểm tra, công cụ tạm để vài tệp lạ trong mã của API; nếu bị ngắt giữa chừng chúng nằm lại và có thể làm các bước kiểm khác nhiễu. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ, chỉ gây nhiễu khi chấm và tự dọn được bằng cách xoá tệp thừa.
  file: `_acceptance/data-api-tin-hien-thi/probes/do-db.mjs`
  severity: low
  Đề xuất: known-limits

- **Probe do-db.mjs ghi tệp route tạm vào cây nguồn data-api; lượt bị ngắt để lại tệp, và đang còn trong worktree**
  Người dùng thấy gì: Nếu lượt kiểm bị ngắt, tệp tạm chứa bản API không lọc tin nguồn ẩn có thể bị đưa nhầm vào mã và đi ra kho công khai. Cần xoá ba tệp đang còn sót.
  Căn cứ: Có nguy cơ lộ tin không được công khai nếu lỡ commit, nhưng chỉ khi thao tác tay sai và dễ phát hiện, xoá tệp là xong.
  file: `_acceptance/data-api-tin-hien-thi/probes/do-db.mjs`
  severity: medium
  Đề xuất: known-limits

- **Sổ thiếu khoá nguon_khong_hien_thi thì sinh ra SOURCE_HIDDEN rỗng, /v1/listings bỏ lọc mà không báo lỗi**
  Người dùng thấy gì: Nếu ai đó lỡ xoá hay đổi tên danh sách nguồn không công khai, API công khai sẽ lặng lẽ trả luôn tin của các nguồn đó mà không báo lỗi.
  Căn cứ: Hậu quả nặng nếu xảy ra vì lộ tin không được hiện, nhưng hiện đã có test ghim danh sách thật nên khả năng xảy ra thấp và sửa rẻ.
  file: `pipeline/lib/vocab-core.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi/số có mặt thay vì QUAN HỆ): do-db so 'khoá còn lại trước = sau' chỉ bằng SỐ ĐẾM**
  Người dùng thấy gì: Phép đo chỉ so số lượng tin còn lại trước và sau, nên nếu một tin biến mất và một tin khác xuất hiện thay thế thì vẫn báo đạt.
  Căn cứ: Rủi ro hẹp, chỉ làm phép đo kém chặt chứ không ảnh hưởng dữ liệu người dùng thấy.
  file: `_acceptance/data-api-tin-hien-thi/probes/do-db.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm-tính-một-mình): ô đỏ 'app không nhập SOURCE_HIDDEN' mà E2 hứa không có trong probe**
  Người dùng thấy gì: Công cụ kiểm tra khẳng định đã thử đủ các trường hợp sai, nhưng một trường hợp (cổng Invest thôi lấy danh sách nguồn ẩn từ nguồn chung) chưa được thử thật.
  Căn cứ: Chỉ làm bằng chứng kiểm tra kém đáng tin hơn, không ảnh hưởng người dùng và bổ sung sau rẻ.
  file: `_acceptance/data-api-tin-hien-thi/probes/nguon-chung.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm-tính-một-mình): kiểm 'do-s03 còn đọc tệp app' không có đối chứng dương**
  Người dùng thấy gì: Một bước kiểm tra có thể luôn báo xanh nếu cách viết bắt lỗi bị lệch, nên chưa chắc nó phát hiện được lỗi thật.
  Căn cứ: Rủi ro thấp và chỉ ảnh hưởng độ tin cậy của công cụ kiểm tra nội bộ, không động đến dữ liệu người dùng.
  file: `_acceptance/data-api-tin-hien-thi/probes/nguon-chung.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, chốt đếm ô là hằng đúng): 'số ô đã assert = số ô ma trận' không thể đỏ**
  Người dùng thấy gì: Bộ kiểm có một phép đếm luôn đúng, nên nếu sau này ai bỏ bớt một đường hay bộ lọc khỏi danh sách kiểm thì sẽ không bị báo.
  Căn cứ: Chỉ làm yếu khả năng phát hiện sót ô kiểm trong tương lai, không gây hại cho người dùng hiện tại và sửa sau rẻ.
  file: `data-api/test/tin-hien-thi.test.ts`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
