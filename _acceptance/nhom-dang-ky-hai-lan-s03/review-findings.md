## Trong hợp đồng

- **Thước AC-6 chỉ băm hai cột của bảng bài S03, không băm toàn bộ như hợp đồng ghi**
  AC: AC-6
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs:139`
  severity: low
  source: bugs
  detail: AC-6 yêu cầu băm toàn bộ `collection_units` và bảng bài S03 không đổi. `bamSo` băm cả dòng (`u::text`), còn `bamBai` chỉ băm `post_id || coalesce(conversation_id, '')`. Nếu lệnh đổi `text`, `group_name` hay `snapshot_id` của bài, phép đo vẫn in 'ok AC-6 bam bai khong doi', tức là xanh giả. Thước này cũng không có đối chứng đỏ: chiều đỏ của E6 chỉ thử băm sổ ('do: loi bam so'), không thử băm bài. Hiện `label-sample.mjs` không có câu lệnh ghi nào vào bảng bài, nên đây là lỗ hổng của phép đo, không phải lỗi dữ liệu đang xảy ra. Cách sửa: băm cả dòng như sổ, `md5(string_agg(p::text, '|' ORDER BY post_id))`, và thêm một đối chứng đổi rồi hoàn lại một dòng bài của fixture. Phạm vi đã kiểm: 15 ca trong `pipeline/lib/eval-labels.test.mjs` đều xanh; `that-chi-doc.mjs` và `label-sample --thu` chạy chỉ đọc trên `oneinvest_gcn_nhan` đều đạt, báo 3 cặp gộp, xác nhận kết nối chỉ đọc có hiệu lực. Không chạy `mau-hai-khoa.mjs` vì probe này ghi vào DB thử; phần đó chỉ đọc mã. Không tìm thấy lỗi correctness hay lỗi bị nuốt trong mã `khoaNhomThat`, `donViTheoNhomThat`, `donViCuaBai`, `layMauTheoNhom`.
  rationale: AC-6 yêu cầu băm toàn bộ bảng bài S03 không đổi, mà phép đo chỉ băm hai cột nên không chứng minh đúng điều AC nêu.

- **Hình dạng 5 — tuyên bảng 13 ô của AC-4 nhưng ô 12 không thể đỏ và cột «khoá thật» không được so**
  AC: AC-4
  file: `pipeline/lib/eval-labels.test.mjs:124`
  severity: medium
  source: measurement
  detail: `kiemBangNhomThat` chỉ so đơn vị của bài và `[unit_code, gop_tu]`. Nó không so khoá thật, dù AC-4 hứa «mỗi ô cho đúng khoá thật, đại diện và tầng». Ô 12 hứa `k:group:` «giữ nguyên vì không còn khoá sau tiền tố», nhưng sổ và bài đi qua cùng một hàm `khoaNhomThat`, nên khoá bị đổi thành rỗng vẫn tra ra A. Đã chạy đột biến bỏ `(?=.)` trên bản chép ở scratchpad: cả 13 ô đều đúng (sai 0), trong khi `khoaNhomThat("k:group:")` trả `""`, và hai dòng `k1:group:`, `k2:group:` bị gộp thành một tầng. Phép gọi `khoaNhomThat` trực tiếp duy nhất là `k:group:x` ở ca chiều đỏ (dòng 184). Bản đột biến M1, M4 và fixture của probe đều không chạm `(?=.)`, nên ô này chỉ có mặt về số đếm: `assert.equal(..., 13)` xanh mà lời hứa của ô chưa được đo.
  rationale: AC-4 hứa mỗi ô cho đúng khoá thật, đại diện và tầng; phép kiểm không so khoá thật nên ô 12 không được đo thật.

- **Hình dạng 4 — «AC-6 bam bai khong doi» âm tính một mình, không có đối chứng dương và băm thiếu cột**
  AC: AC-6
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs:139`
  severity: medium
  source: measurement
  detail: AC-6 hứa băm toàn bộ bảng bài không đổi. `bamBai` chỉ nối `post_id || conversation_id`, nên lệnh sửa `text`, `group_name` hay cột khác vẫn cho băm y hệt. Dòng 144 chỉ so bằng trước và sau. Đối chứng dương ở dòng 146-147 chỉ đổi một dòng sổ để làm đỏ `bamSo`; không có bước nào đổi bài rồi chứng minh `bamBai` đỏ. E6 cũng chỉ khai đối chứng «loi bam so». Khác với `bamSo` băm `u::text` cả dòng, thước băm bài vừa hẹp vừa chưa từng được thấy đỏ.
  rationale: Cùng gốc với lỗ ở AC-6: băm bảng bài thiếu cột so với «băm toàn bộ» trong hợp đồng và chưa từng được thấy đỏ.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe thêm mới tên nguồn thật vào khoá snapshot và giá trị nguồn của fixture, thay vì dùng mã S03**
  Người dùng thấy gì: Tệp kiểm thử của vòng này có ghi tên thật của một kênh nguồn vào dữ liệu giả, trong khi kho mã đang công khai và quy ước là chỉ gọi nguồn bằng mã. Người dùng cuối không thấy gì, nhưng tên nguồn nằm lộ trên kho công khai.
  Căn cứ: Hậu quả nhẹ với người dùng vì chỉ là dữ liệu giả trong tệp kiểm thử, nhưng tên nguồn thật đã nằm trên kho công khai; sửa sau rẻ (đổi hai chuỗi) và đã có tiền lệ, đồng thời việc dọn tên nguồn toàn kho đã được hẹn sau 05/11.
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — hai assert âm tính của AC-5 không có chiều đỏ**
  Người dùng thấy gì: Phép kiểm việc chạy lại không làm đổi lát mẫu và không khuyên xoá chưa từng được thử làm đỏ, nên nếu sau này có lỗi thì phép kiểm có thể không báo. Hiện tại hành vi thật vẫn đúng.
  Căn cứ: Không có hậu quả với người dùng hôm nay vì hành vi đúng; chỉ giảm độ tin cậy của phép kiểm về sau, và sửa sau không mất dữ liệu.
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — đầu probe tuyên «mỗi lời hứa có chiều đỏ riêng» nhưng ma trận đột biến chỉ phủ một phần**
  Người dùng thấy gì: Tệp kiểm thử tự nói là mọi lời hứa đều có phép thử làm đỏ, nhưng thực tế ba lời hứa chưa có. Người dùng không bị ảnh hưởng; chỉ là độ tin cậy của phép kiểm bị nói quá.
  Căn cứ: Hậu quả nhẹ vì chỉ là chú thích nói quá về độ phủ của phép kiểm, không làm sai dữ liệu hay giao diện; có thể ghi lại hạn chế và bổ sung sau.
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
