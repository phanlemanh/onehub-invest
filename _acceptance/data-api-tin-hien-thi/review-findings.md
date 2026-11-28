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

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
