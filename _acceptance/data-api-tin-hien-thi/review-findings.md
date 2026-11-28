## Trong hợp đồng

- **Hình dạng 5 (tuyên quét lớp nhưng ma trận thiếu phần tử): ma trận AC-3 bỏ ô «không lọc» mà hợp đồng đã viết trước**
  AC: AC-3
  file: `data-api/test/tin-hien-thi.test.ts:105`
  severity: medium
  source: measurement
  detail: Hợp đồng AC-3 (contract.md) ghi trước năm bộ lọc: «không lọc · area · market · bedroomsTotal · limit/offset». Mảng LOC trong test lại là area, market, area+bedroomsTotal, market+bedroomsTotal, area+trang. Không có ô nào gọi /v1/listings mà không có tham số khu (comment ghi «mọi bộ lọc có phạm vi khu vực»). Vì MA_TRAN_3 được dựng từ chính LOC, hai câu `assert.equal(MA_TRAN_3.length, DUONG.length * LOC.length, …)` và `so === MA_TRAN_3.length` luôn đúng và không bắt được ô bị bỏ. Hệ quả: lời hứa «không lọc» không được đo. pha.mjs chép lại cùng LOC nên 29 thông điệp viết trước cũng không có ô này.
  rationale: AC-3 ghi rõ ma trận có ô «không lọc» và mỗi ô phải được assert; ma trận thật thiếu ô này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Lý do ngoại lệ enums_lint_allow của data-api/src/routes/listings.ts đã sai sau khi thêm đích sinh dataApi**
  Người dùng thấy gì: Một dòng ghi chú giải thích vì sao tệp danh sách tin được miễn kiểm tra nay nói sai sự thật. Người dùng cuối không thấy gì, chỉ người bảo trì có thể hiểu nhầm.
  Căn cứ: Chỉ là chữ giải thích sai, không ảnh hưởng dữ liệu hay kết quả trả về, và sửa lại sau rất rẻ.
  file: `pipeline/mappings.yaml`
  severity: low
  Đề xuất: known-limits

- **Sổ nguồn ẩn rỗng hoặc mất khoá thì /v1/listings lặng lẽ mở S02, S08 ra API công khai (fail-open)**
  Người dùng thấy gì: Nếu ai đó lỡ xoá hoặc gõ sai danh sách nguồn bị ẩn, API công khai sẽ lặng lẽ trả cả tin của hai nguồn không được phép công bố mà không báo lỗi nào.
  Căn cứ: Hậu quả nặng vì làm lộ dữ liệu nguồn cấm ra công khai và khó phát hiện, dù chỉ xảy ra khi sổ bị sửa sai; sửa sớm rẻ hơn nhiều so với gỡ dữ liệu đã lộ.
  file: `pipeline/lib/vocab-core.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4 (assertion một chiều, không có ô đỏ): kiểm «app và data-api nhập SOURCE_HIDDEN» chưa có chiều đỏ, dù E2 đã hứa**
  Người dùng thấy gì: Việc kiểm tra cổng Invest có đang lấy danh sách nguồn ẩn từ chỗ chung hay không chưa được thử bằng ca cố tình làm sai, nên chưa chắc nó báo động khi bị lệch.
  Căn cứ: Rủi ro thấp vì việc kiểm thường đã chạy trên mã thật và chỉ thiếu bằng chứng rằng nó biết kêu; bổ sung sau không làm mất hay lộ dữ liệu.
  file: `_acceptance/data-api-tin-hien-thi/probes/nguon-chung.mjs`
  severity: medium
  Đề xuất: known-limits

- **vòng 1 — Nhánh thuê ngắn hạn của /v1/listings không đi qua SOURCE_HIDDEN, mã nguồn 'S01' viết tay**
  Người dùng thấy gì: Tin thuê ngắn hạn luôn được coi là của một nguồn tự thu. Nếu sau này có nguồn ngắn hạn nào bị ẩn thì tin của nó vẫn có thể hiện ra qua API công khai.
  Căn cứ: Hiện chỉ có một nguồn ngắn hạn và đo thực tế không có tin ẩn lọt ra, nên chưa ai bị ảnh hưởng; chỉ thành vấn đề khi thêm nguồn ngắn hạn mới.
  file: `data-api/src/routes/listings.ts`
  severity: medium
  Đề xuất: known-limits

- **vòng 1 — bedroomsTotal không được kiểm ở biên, giá trị sai thành lỗi 500 lộ thông điệp Postgres**
  Người dùng thấy gì: Ai gọi API với số phòng ngủ không phải số sẽ nhận lỗi máy chủ kèm thông điệp nội bộ của cơ sở dữ liệu thay vì một thông báo gọn. Để trống thì API âm thầm chỉ trả căn 0 phòng ngủ.
  Căn cứ: Không làm mất hay lộ dữ liệu người dùng, người gọi tự sửa được bằng cách gửi lại đúng giá trị; nhưng thông điệp lỗi lộ chi tiết nội bộ trên API công khai nên nên sửa sớm và rẻ.
  file: `data-api/src/routes/listings.ts`
  severity: medium
  Đề xuất: new-contract

- **vòng 1 — Khoá mới trong mappings.yaml đặt tên tiếng Việt (nguon_khong_hien_thi, can_cu)**
  Người dùng thấy gì: Chỉ là chuyện đặt tên trong tệp cấu hình nội bộ, người dùng không thấy gì và không bị ảnh hưởng.
  Căn cứ: Không có hậu quả với người dùng, đổi tên đụng nhiều tệp sinh nên tốn hơn lợi ích.
  file: `pipeline/mappings.yaml`
  severity: low
  Đề xuất: wont-fix

- **vòng 1 — chuoiNgay đi vòng qua String(Date) nên mất phần mili giây của onMarketTimestamp và lastSeenTimestamp**
  Người dùng thấy gì: Thời điểm đăng và thấy tin lần cuối trên API bị làm tròn xuống giây, hai mốc cách nhau dưới một giây hiện ra giống nhau.
  Căn cứ: Sai lệch dưới một giây gần như không ai nhận ra và không làm mất dữ liệu gốc.
  file: `data-api/src/routes/listings.ts`
  severity: low
  Đề xuất: known-limits

- **vòng 1 — Tham số rỗng `bedroomsTotal=` hay `minBelowMedianPct=` bị âm thầm đọc thành 0**
  Người dùng thấy gì: Gửi tham số để trống thì API hiểu thành số 0 thay vì bỏ qua, nên người dùng nhận danh sách rỗng hoặc lệch mà không biết vì sao.
  Căn cứ: Người dùng tự gỡ được bằng cách bỏ tham số, không mất dữ liệu, sửa rẻ cùng lúc với việc kiểm đầu vào.
  file: `data-api/src/routes/listings.ts`
  severity: low
  Đề xuất: new-contract

- **vòng 1 — Trang chi tiết đòi khoá bí mật cả với tin bán, thuê dài hạn trong khi trang danh sách không đòi**
  Người dùng thấy gì: Khi máy chủ thiếu cấu hình khoá, danh sách trả mã tin nhưng bấm vào xem chi tiết lại báo lỗi dịch vụ.
  Căn cứ: Chỉ xảy ra khi triển khai thiếu cấu hình, tự hết khi cấu hình đủ, không mất hay lộ dữ liệu.
  file: `data-api/src/routes/listings.ts`
  severity: low
  Đề xuất: known-limits

- **vòng 1 — Hình dạng 3 (quan hệ trước-sau bị thay bằng so tệp với chính nó): danh sách bảng/view mong đợi giờ lấy từ chính schema.sql đang kiểm**
  Người dùng thấy gì: Nếu việc gộp tệp lược đồ làm rơi mất một bảng thì bài kiểm vẫn báo xanh, nên lỗi thiếu bảng có thể chỉ lộ khi chạy thật.
  Căn cứ: Không ảnh hưởng người dùng ngay, nhưng làm yếu lưới an toàn khi dựng cơ sở dữ liệu, nên đáng gom vào một việc kiểm riêng.
  file: `scripts/data-api-ten-nguon.test.mjs`
  severity: medium
  Đề xuất: new-contract

- **vòng 1 — Hình dạng 2 (bộ chuyển viết tay theo đúng khuôn bên đọc): kiểm «khoá cũ giữ» trên đầu ra của veHinhCu, nên luôn có mặt**
  Người dùng thấy gì: Bài kiểm xác nhận các khoá cũ vẫn còn thực ra chỉ kiểm bộ chuyển trong chính test, nên nếu API đổi tên khoá thì phần này vẫn xanh.
  Căn cứ: Ràng buộc thật với API vẫn còn ở dòng so khoá mới, nên rủi ro thấp và không chạm dữ liệu người dùng.
  file: `app/tests/can-gia-cung-loai-db.test.tsx`
  severity: low
  Đề xuất: known-limits

- **vòng 2 — Probe AC-7 (do-db.mjs) lấy bản nền bằng merge-base với origin/main, đúng lỗi PB9 vừa sửa ở c60c50f74**
  Người dùng thấy gì: Sau khi bản này vào nhánh chính, phép đo so sánh trước/sau của việc ẩn tin nguồn không công khai sẽ không còn so được với bản cũ, nên có thể báo đỏ nhầm hoặc đo rỗng. Người dùng cuối không thấy gì; chỉ làm mất khả năng tự kiểm.
  Căn cứ: Chỉ ảnh hưởng công cụ kiểm tra nội bộ, không làm lộ hay mất dữ liệu của người dùng, và chỉnh lại sau gộp khá rẻ.
  file: `_acceptance/data-api-tin-hien-thi/probes/do-db.mjs`
  severity: high
  Đề xuất: known-limits

- **vòng 2 — Hình dạng 3 (assert chuỗi/số có mặt thay vì QUAN HỆ): do-db so 'khoá còn lại trước = sau' chỉ bằng SỐ ĐẾM**
  Người dùng thấy gì: Phép đo chỉ so số lượng tin còn lại trước và sau, nên nếu một tin biến mất và một tin khác xuất hiện thay thế thì vẫn báo đạt.
  Căn cứ: Rủi ro hẹp, chỉ làm phép đo kém chặt chứ không ảnh hưởng dữ liệu người dùng thấy.
  file: `_acceptance/data-api-tin-hien-thi/probes/do-db.mjs`
  severity: medium
  Đề xuất: known-limits

- **vòng 2 — Hình dạng 4 (assertion âm-tính-một-mình): kiểm 'do-s03 còn đọc tệp app' không có đối chứng dương**
  Người dùng thấy gì: Một bước kiểm tra có thể luôn báo xanh nếu cách viết bắt lỗi bị lệch, nên chưa chắc nó phát hiện được lỗi thật.
  Căn cứ: Rủi ro thấp và chỉ ảnh hưởng độ tin cậy của công cụ kiểm tra nội bộ, không động đến dữ liệu người dùng.
  file: `_acceptance/data-api-tin-hien-thi/probes/nguon-chung.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
