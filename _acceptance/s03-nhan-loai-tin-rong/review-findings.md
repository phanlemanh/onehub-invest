## Trong hợp đồng

- suyLoai xếp tin bán thành cho thuê khi chữ bài có «tháng» (bàn giao/ân hạn), kể cả khi giá là tr/m² hoặc đồng ≥ 1 tỷ
  AC: AC-2
  file: `pipeline/transform-zalo.mjs:326`
  severity: high
  source: bugs
  detail: Điều kiện `giaThue || (DON_VI_THUE.test(so) && !coTy)` chỉ loại trừ chữ «tỷ». DON_VI_THUE gồm `\btháng\b` trần, mà chữ này rất hay có trong tin bán («bàn giao tháng 12», «hỗ trợ lãi suất 0% 18 tháng», «nhận nhà tháng 11»). Nhánh này lại chạy TRƯỚC tín hiệu bán và bối cảnh nhóm, nên vẫn thắng ngay cả trong nhóm bán. Chạy suyLoai(parsePost(t), t, "sale") cho thấy: (1) «Căn hộ 2PN 70m2 giá 45tr/m2, bàn giao tháng 12» ra {kind: rent_lt, nguon: don-vi-gia}, giá/m² 45 triệu. lyDoGiaPhiLy chỉ xét priceVnd (đang null) nên bài lọt qua, có giá nên đạt confidence medium và được ghi thành tin THUÊ mang price_perm2 = 45 triệu. Tin rác này đi thẳng vào sale_offers mà không có cảnh báo nào. (2) «Căn 2PN 70m2 giá 3.200.000.000 sổ hồng, nhận nhà tháng 11» cũng ra rent_lt, dù có tín hiệu bán «sổ hồng». Sau đó bài bị gạt im lặng vào ô «thue-tu-1-ty», nên một tin bán hợp lệ bị mất, và con số đó lại bị đếm như lỗi giá chứ không phải lỗi phân loại. Cách sửa: không suy ra thuê khi đã có pricePerm2Vnd hoặc priceVnd ≥ 1e9; với «tháng» trần thì chỉ nhận khi đi liền sau giá (dạng /tháng, tr/tháng). Có thể cân nhắc xét tín hiệu bán trước đơn vị thuê.
  rationale: AC-2 chỉ cho nhận thuê khi giá không kèm /m² và bài không có chữ «tỷ»; hai ca lỗi vi phạm đúng các điều kiện này (và đè tín hiệu bán của AC-1).

- Assertion âm-tính-một-mình (hình dạng 4): «tin thuê ≥ 1 tỷ không tăng» trong SLT-DC-9 luôn đúng, kể cả khi suy loại sai
  AC: AC-9
  file: `pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs:322`
  severity: medium
  source: measurement
  detail: Dòng 322 kiểm `assert.ok(bat.thue_tu_1_ty <= tat.thue_tu_1_ty, ...)`, trong đó `thue_tu_1_ty` đếm `kind = 'rent_lt' AND price_vnd >= 1e9` trong view `sale_offers` (demS03, dòng 279-283). Nhưng trong runTransformZalo (pipeline/transform-zalo.mjs:520-521), bước lọc `lyDoGiaPhiLy` (dòng 454-456, `GIA_THUE_TRAN = 1e9` ở dòng 450) đã bỏ mọi bài rent_lt có priceVnd >= 1e9 trước khi ghi offer, và chạy sau suyLoai ở cả hai lượt tắt/bật. Vì vậy số này bằng 0 ở cả hai lượt, độc lập với suy loại: bản suy loại gán nhầm hàng loạt bài giá tỷ thành rent_lt vẫn làm phép đo xanh. Ca này không có đối chứng dương (không có bản đột biến nào, không có mồi nào cho thấy bộ đếm có thể ra số > 0), nên phần «tin thuê giá ≥ 1 tỷ không tăng» của AC-9/E9 thực ra không được đo. Muốn đo thật thì phải đếm trước bước lọc, ví dụ đọc `kq.loaiGiaPhiLy['thue-tu-1-ty']` của hai lượt.
  rationale: AC-9 nêu đích danh điều kiện «tin thuê giá ≥ 1 tỷ không tăng» trên DB thật; phép đo mô tả luôn ra 0 nên điều kiện này chưa được kiểm thật.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **SLT-DC-10 sẽ đỏ vĩnh viễn ngay khi lát s03-loai-tin được lấy mẫu thật trên DB máy thu**
  Người dùng thấy gì: Sau khi lấy mẫu thật để gắn nhãn, một ca kiểm tự động sẽ báo đỏ dù tính năng vẫn đúng. Người dùng không thấy gì khác lạ, chỉ người vận hành thấy báo động giả.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng cuối, chỉ gây báo đỏ giả cho người vận hành; sửa lúc nào cũng rẻ.
  file: `pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **YEU_CAU gạt nhầm câu mời xem nhà rất thường gặp của người bán («Khách thiện chí xem nhà…») thành Yêu cầu**
  Người dùng thấy gì: Một số tin bán có câu mời «khách thiện chí xem nhà» sẽ bị coi là người mua tìm nhà và không thành tin bán. Người dùng thấy thiếu một phần tin bán.
  Căn cứ: Chỉ làm hụt một phần tin bán, không mất dữ liệu gốc vì bài vẫn còn nguyên và có thể nhận lại khi chỉnh luật.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
