# Review findings: don-hex-tho (round 2)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **DHT-AC-8 vẫn chặn mãi sau khi merge: commit nào sau này sửa map-colors.ts cùng một tệp vendor sẽ làm CI scripts đỏ**
  Người dùng thấy gì: Người dùng cuối không bị ảnh hưởng. Về sau, nếu đội nâng cấp thư viện bản đồ và chỉnh màu bản đồ trong cùng một lần, kiểm tra tự động sẽ báo đỏ dù việc đó không liên quan, làm chậm việc đưa thay đổi lên.
  Căn cứ: Chỉ gây vướng cho người làm sản phẩm ở các lần sửa sau, không ảnh hưởng người dùng; khi gặp thì gỡ bằng một lần chỉnh nhỏ, và đến lúc đó mới biết cách chỉnh cho đúng.
  file: `scripts/don-hex-tho.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **catalog.md của skill onehub-ui vẫn dạy "Màu trong MapLibre phải là hex" mà không trỏ tới lib/map-colors.ts**
  Người dùng thấy gì: Không ảnh hưởng người dùng cuối. Người dựng bản đồ mới đọc hướng dẫn cũ có thể đặt màu sai chỗ, rồi bị kiểm tra tự động chặn và phải làm lại.
  Căn cứ: Hậu quả nhẹ, chỉ tốn thêm một lượt sửa cho người làm; kiểm tra tự động đã chặn lỗi trước khi tới người dùng, và sửa lại câu hướng dẫn sau rất rẻ.
  file: `.claude/skills/onehub-ui/catalog.md`
  severity: low
  Đề xuất: known-limits

- **Chú thích executors.design trong config.yaml đã lỗi thời sau vòng dọn này**
  Người dùng thấy gì: Không ảnh hưởng người dùng cuối. Ghi chú nội bộ còn nêu số liệu cũ, có thể làm người đọc hiểu sai việc dọn màu còn dở bao nhiêu.
  Căn cứ: Chỉ là ghi chú nội bộ lệch số, không mất dữ liệu hay hỏng chức năng; việc nối sàn thiết kế ở vòng kế tiếp sẽ tự phải cập nhật lại đúng chỗ này.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **E8 (gate_don_hex_tho) passes without checking anything: in dom mode the design gate does not inspect .ts/.tsx files**
  Người dùng thấy gì: Màn hình bản đồ và sơ đồ dòng chảy được báo là đạt kiểm tra thiết kế nhưng thực tế chưa được đo độ tương phản. Nếu có màu khó đọc thì kiểm tra này sẽ không phát hiện, người dùng có thể thấy chữ mờ.
  Căn cứ: Vòng này giữ nguyên từng giá trị màu cũ nên rủi ro hiển thị thay đổi rất thấp; nếu có lỗi chỉ là khó đọc, người dùng vẫn dùng được, và đo thật có thể bổ sung sau.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình) + hình dạng 2 (fixture viết tay): DHT-AC-8 kết luận «0 tệp vendor» mà không ghim rằng tập commit của vòng khác rỗng**
  Người dùng thấy gì: Không ảnh hưởng người dùng cuối. Trong tình huống hiếm khi lịch sử thay đổi bị viết lại, kiểm tra tự động có thể báo xanh dù thực ra không kiểm được gì.
  Căn cứ: Kịch bản kích hoạt hiếm và chỉ gây chủ quan cho người làm, không ảnh hưởng người dùng; hiện kết quả đang đúng và chi phí thêm ràng buộc sau này thấp.
  file: `scripts/don-hex-tho.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo khai báo thay vì đầu ra): việc bốn tệp giao diện mất miễn trừ hex chỉ được đo bằng regex trên chữ nguồn của MAP_FILES**
  Người dùng thấy gì: Không ảnh hưởng người dùng cuối. Nếu về sau ai đó vô tình cho phép màu thô trở lại ở các tệp bản đồ giao diện, kiểm tra tự động có thể không bắt được.
  Căn cứ: Cần một thay đổi cấu hình cố ý mới gây ra, người dùng không thấy gì, và nếu xảy ra thì chỉ là màu thô quay lại, dọn lại dễ dàng.
  file: `scripts/don-hex-tho.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng đo tập con): DHT-AC-1 nói quét design.surface_globs trừ vendor nhưng chỉ duyệt .ts/.tsx/.css**
  Người dùng thấy gì: Không ảnh hưởng người dùng cuối. Hiện chưa có tệp nào thuộc loại khác chứa màu thô; về sau nếu có thì lần dọn này sẽ không phát hiện, đến khi nối sàn thiết kế mới bị chặn.
  Căn cứ: Hiện chưa có tệp nào bị sót nên chưa có hậu quả thật, và nếu xuất hiện sau này thì sàn thiết kế sắp nối sẽ bắt được trước khi tới người dùng.
  file: `scripts/don-hex-tho.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Rút MAP_FILES còn 2 tệp làm đỏ test cũ LB-AC-1 (app/tests/listings-browse.test.tsx), test này vẫn ghim đúng 5 tệp (r1 · tệp đã đổi)**
  Người dùng thấy gì: Giao diện người dùng không đổi, nhưng một bước kiểm tra tự động cũ của trang danh sách tin sẽ báo lỗi sau thay đổi này. Lỗi đó có thể chặn việc đưa bản cập nhật lên.
  Căn cứ: Người dùng không thấy gì khác, nhưng bước kiểm tra đỏ chặn việc đưa bản lên và phải sửa trước khi nhập; sửa nhỏ, rẻ, làm riêng thành một việc ngoài hợp đồng này.
  file: `app/eslint.config.mjs`
  severity: high
  Đề xuất: new-contract

- **Hình dạng 4 (assertion âm-tính-một-mình): DHT-AC-8 trên commit thật chỉ assert danh sách vendor rỗng, không ghim rằng đã tìm thấy commit nào của vòng (r1)**
  Người dùng thấy gì: Một phép kiểm nội bộ xác nhận vòng dọn màu không chạm mã cài sẵn có thể báo xanh dù không tìm thấy thay đổi nào để kiểm. Người dùng cuối không bị ảnh hưởng, chỉ giảm độ tin cậy của lưới an toàn.
  Căn cứ: Không ảnh hưởng người dùng cuối và không làm mất dữ liệu; rủi ro chỉ xảy ra trong tình huống hiếm về lịch sử thay đổi, và có thể bổ sung sau với giá rẻ.
  file: `scripts/don-hex-tho.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn hardcode): DHT-AC-1 (d) đọc kit ở đường cache plugin cố định theo máy tác giả và phiên bản 2.35.0, không có thì skip (r1)**
  Người dùng thấy gì: Phép đối chiếu cách quét màu với công cụ kiểm của bộ nghiệm thu chỉ chạy được trên máy có đúng phiên bản công cụ đó, ở máy khác nó bị bỏ qua. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Hợp đồng đã chấp nhận điều kiện này và không ảnh hưởng người dùng cuối; chỉ làm yếu một phép đối chiếu phụ, có thể nâng cấp sau khi kit đổi phiên bản.
  file: `scripts/don-hex-tho.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/7 lỗi rơi vào file không bộ đo nào phủ (.claude/skills/onehub-ui/catalog.md, _acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

