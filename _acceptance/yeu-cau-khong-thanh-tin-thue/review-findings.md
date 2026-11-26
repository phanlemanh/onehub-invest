## Trong hợp đồng

- **Mẫu PL42 «em/mình tìm» kéo câu môi giới «em tìm gấp khách/người thuê…», «em tìm được khách» vào Yêu cầu (lỗ của loại trừ AC-2)**
  AC: AC-2
  file: `pipeline/transform-zalo.mjs:508`
  severity: medium
  source: bugs
  detail: Mẫu cuối của YEU_CAU_PL42 là `(?:em|mình|e)\s+(?:đang\s+)?(?:cần\s+)?tìm(?![\p{L}])(?!\s+(?:kh[aá]ch|người))`. Phần loại trừ chỉ xét chữ đứng NGAY sau «tìm», nên chỉ cần một từ chen vào là lọt. Mẫu «tìm gấp» (dòng 499) có loại trừ «tìm gấp khách/người» nhưng mẫu này không có, nên vẫn khớp. Đã chạy thử suyLoai(parsePost(t), t, 'ca-hai') trên code của nhánh:
  - «Em tìm gấp khách thuê căn 2pn 8tr» → {kind:null, nguon:'yeu-cau'}
  - «Mình đang tìm gấp người thuê căn 1pn 6tr» → yeu-cau
  - «Em tìm được khách rồi, còn 1 căn 2pn 8tr» → yeu-cau
  Theo YEU_CAU cũ, cả ba câu đều KHÔNG khớp và ra rent_lt/don-vi-gia. Ngược lại, «tìm gấp khách thuê 2pn 8tr» (không có «em») vẫn ra rent_lt đúng. Đây là hồi quy mới: tin rao của môi giới bị rút khỏi tin sống (nghỉ hoặc mất bài khỏi post_ids), trái đúng loại trừ hẹp mà AC-2 định chặn. Ma trận TIN_RAO trong yeu-cau-khong-thanh-tin-thue.test.mjs không có ca «em/mình + tìm gấp khách/người» hay «tìm được khách», nên test vẫn xanh. Cách sửa: mở loại trừ ra cả dạng `(?!\s+(?:gấp\s+|được\s+)?(?:kh[aá]ch|người))`, hoặc cho «gấp/được» đi trước rồi mới xét khách/người, và thêm hai ca này vào TIN_RAO.
  rationale: AC-2 đòi các câu rao gần giống mẫu giữ như «em tìm khách thuê…» và «tìm gấp khách thuê…» vẫn ra đúng loại của hàm cũ; biến thể «em tìm gấp khách thuê…» bị rút thành Yêu cầu nên chiều đỏ của AC-2 hỏng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **pipeline/CLAUDE.md ghi sai nơi `--kiem` ghi tệp mẫu (lệch với code và luật GS 26/11 điểm 6)**
  Người dùng thấy gì: Tài liệu hướng dẫn chạy lệnh đo ghi sai chỗ lưu tệp mẫu, nên người đọc có thể tưởng chạy lệnh là làm mới bản bằng chứng đã nộp. Dữ liệu và người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ gây nhầm cho người vận hành đọc tài liệu, không mất hay lộ dữ liệu, tự phát hiện được khi chạy thử và sửa một dòng chữ là xong.
  file: `pipeline/CLAUDE.md`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: E10 hứa một QUAN HỆ (tập ca bị bỏ = tập may_thu của ci-bo-qua.json) nhưng lệnh chỉ đo exit 0 / fail 0**
  Người dùng thấy gì: Phép kiểm trên máy phát triển chỉ xác nhận bộ kiểm thử chạy xanh, chưa xác nhận số ca bị bỏ qua đúng danh sách đã khai. Nếu có ca bị bỏ thừa hay thiếu thì vẫn không bị báo đỏ.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, chỉ làm lưới kiểm thử thưa hơn ở một chỗ; kho đã có phép đo riêng cho quan hệ này nên rủi ro thấp.
  file: `_acceptance/yeu-cau-khong-thanh-tin-thue/evals.yaml`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
