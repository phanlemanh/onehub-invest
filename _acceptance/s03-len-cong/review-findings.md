# Review findings: s03-len-cong (round 2)

## Trong hợp đồng

- **Ma trận bên đọc đã cũ, lệnh chấm AC-3 (s03_len_cong_ben_doc) đỏ tại HEAD**
  AC: AC-3
  file: `_acceptance/s03-len-cong/ben-doc.json`
  severity: high
  source: conventions
  detail: Đã chạy `cd pipeline && node scripts/do-s03-len-cong.mjs --ben-doc`, kết quả thoát khác 0. Năm tệp bị báo «tệp lạ, chưa có kết luận trong ma trận»: db/migrations/068_giu_nguon_goc_sdt.sql, pipeline/gan-sdt-s06.mjs, pipeline/scripts/gan-sdt-s06.test.mjs (ba tệp này khớp mẫu quét, có trong lần gộp main d86da5f3), pipeline/scripts/fixtures/067_tang_huong_tin.ban-sao.sql và pipeline/scripts/s03-len-cong.test.mjs (hai tệp này do fix 1b2083f7 thêm hoặc sửa). Mục eval có criterion AC-3 trong _acceptance/s03-len-cong/evals.yaml (cmd config:executors.script.s03_len_cong_ben_doc, dòng 107) yêu cầu thoát 0, nên AC-3 không đạt trên cây hiện tại. Riêng pipeline/gan-sdt-s06.mjs là đường chạy sản phẩm mới có khớp mẫu quét bên đọc, cần xét rồi mới ghi kết luận, không chỉ thêm tên cho hết đỏ. Hướng xử lý: bổ sung kết luận cho các tệp vào ben-doc.json rồi chạy lại lệnh chấm.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Stub E9 của tin-rao-giao-dien thiếu hasPublicOffers và không có tác dụng: ca này đọc DB thật**
  Người dùng thấy gì: Một ca kiểm tra trang tin rao đang đọc dữ liệu thật thay vì dữ liệu giả, nên có thể đỏ khi máy không có cơ sở dữ liệu. Người dùng cuối không thấy thay đổi nào.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của một ca kiểm tra nội bộ, không làm sai hay mất dữ liệu hiển thị, và sửa sau rẻ.
  file: `app/tests/tin-rao-giao-dien.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Cột «Có phường» và luật nút thắt của Ops đếm cả tin cấp thị trường, che mất chỗ tắc của S03**
  Người dùng thấy gì: Trên trang theo dõi luồng dữ liệu của Ops, tỷ lệ tin có phường của S03 sẽ cao hơn thực tế vì tính cả tin chỉ có thị trường, nên chỗ tắc về phường có thể hiện xanh dù chưa được giải quyết.
  Căn cứ: Gây hiểu sai cho người vận hành về chất lượng dữ liệu nhưng không làm hỏng dữ liệu hay lộ ra cổng nhà đầu tư; số đọc lại được sau khi sửa.
  file: `pipeline/sql/600_data_flow.sql`
  severity: medium
  Đề xuất: new-contract

- **Bảng tin của Ops hiện tên thị trường ở ô Phường và báo «chưa gắn» thị trường cho tin cấp thị trường**
  Người dùng thấy gì: Trong Ops, tin chỉ có thị trường sẽ hiện tên thị trường ở ô Phường và ghi «chưa gắn thị trường», nên lọc theo thị trường sẽ không thấy các tin này.
  Căn cứ: Chỉ nhân viên vận hành thấy nhầm nhãn và lọc thiếu, không mất dữ liệu và nhà đầu tư không bị ảnh hưởng; sửa sau không đắt.
  file: `app/src/lib/data-flow-queries.ts`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4 (âm tính một mình): «thước 0 dòng cấp thị trường» không thể đỏ, 6 tin mồi S03 không bao giờ thành căn**
  Người dùng thấy gì: Phép kiểm tra rằng thước giá không có dòng cấp thị trường luôn xanh nên không bắt được lỗi nếu sau này có người đổi cách tạo căn. Hiện người dùng không thấy số sai.
  Căn cứ: Rủi ro nằm ở việc lỗi tương lai khó bị phát hiện, chưa có hậu quả với người dùng hôm nay; bổ sung phép kiểm sau rẻ.
  file: `pipeline/scripts/s03-len-cong.itest.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): băm «dòng phường không đổi» của 500 không có đối chứng đỏ, bản 500 cũ cũng xanh**
  Người dùng thấy gì: Một phép so sánh số liệu phường trước và sau khi thêm tin cấp thị trường không phân biệt được bản đúng với bản sai, dù số liệu thật hiện không bị lệch.
  Căn cứ: Không có sai lệch thật với nhà đầu tư và phép kiểm chính vẫn bắt được lỗi; chỉ là lưới an toàn phụ yếu.
  file: `pipeline/scripts/s03-len-cong.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): E12 quét khoá nhóm, tên nhóm, chữ bài không có đối chứng dương và không chặn tập so rỗng**
  Người dùng thấy gì: Phép kiểm chống lộ khoá nhóm và nội dung bài chưa được thử bằng mẫu giả, nên chưa chắc nó bắt được nếu có rò rỉ. Hiện chưa thấy rò rỉ nào.
  Căn cứ: Nếu phép kiểm lỏng thì rò rỉ có thể lọt, nhưng phép kiểm chính về tên nguồn thật đã có đối chứng; bổ sung sau rẻ.
  file: `pipeline/scripts/do-s03-len-cong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): chốt lechMau và tinTachNhoSo không có ca đỏ**
  Người dùng thấy gì: Hai phép kiểm phụ về mẫu lệch và tin tách nhỏ chưa từng được chứng minh là biết báo đỏ, nên có thể im lặng khi có sai.
  Căn cứ: Chỉ giảm độ tin của lưới kiểm phụ, không gây sai dữ liệu hiện tại; bổ sung ca đỏ sau rẻ.
  file: `pipeline/scripts/do-s03-len-cong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): E9 hứa «unverified đúng từng nguồn» nhưng chỉ đo S03 và S06**
  Người dùng thấy gì: Nếu sau này có nguồn khác lên cổng, nhãn «Chưa xác minh» có thể gắn sai mà phép kiểm hiện tại không phát hiện. Hiện chỉ S03 và S06 hiển thị.
  Căn cứ: Hậu quả chỉ xuất hiện khi thêm nguồn mới, nhãn sai tự sửa được khi sửa luật; chưa có tác động hôm nay.
  file: `app/tests/s03-len-cong.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): comment tuyên ca Hà Nội nhưng lệnh chỉ đo thị trường không phường**
  Người dùng thấy gì: Một chú thích trong ca kiểm tra nói đã kiểm Hà Nội nhưng thực tế chưa kiểm, nên trang của vùng Hà Nội khi chỉ có tin cấp thị trường chưa được thử riêng.
  Căn cứ: Chỉ là độ phủ phép kiểm mỏng và chú thích sai, không thấy hậu quả với người dùng; sửa sau rất rẻ.
  file: `app/tests/s03-len-cong.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Cờ --neu-chua-co không an toàn khi các lệnh chấm chạy song song (r1)**
  Người dùng thấy gì: Khi nhiều lệnh chấm chạy cùng lúc trên máy chưa có DB thử, bằng chứng có thể đỏ giả hoặc đo trên dữ liệu thiếu. Không ảnh hưởng người dùng cuối, chạy lại từng lệnh là qua.
  Căn cứ: Chỉ ảnh hưởng bàn chấm nội bộ, không mất dữ liệu thật, chạy lại tuần tự là hết và sửa không cần cho lần ra mắt này.
  file: `db/db-thu.sh`
  severity: medium
  Đề xuất: known-limits

- **Executor s03_len_cong_ranh dùng DB thử nhưng không tự dựng như các executor cùng họ (r1 · tệp đã đổi)**
  Người dùng thấy gì: Trên máy chưa có DB thử, một phép kiểm về ranh giới dữ liệu nhạy cảm có thể đỏ vì không nối được chứ không vì vi phạm. Người dùng cuối không thấy gì.
  Căn cứ: Chỉ làm bàn chấm đỏ giả trong một tình huống hẹp, chạy các lệnh kia trước hoặc dựng DB tay là qua, sửa rẻ nhưng không chặn ra mắt.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Ma trận bên đọc ghi «Sửa trong hàng này» cho ba tệp không hề đổi (r1)**
  Người dùng thấy gì: Hồ sơ cho người ký mô tả sai ba tệp là đã sửa trong hàng này, dù thực tế chúng không đổi. Sản phẩm không bị ảnh hưởng.
  Căn cứ: Chỉ là chú thích sai trong hồ sơ, không đổi hành vi nào của sản phẩm, sửa chữ là xong bất cứ lúc nào.
  file: `_acceptance/s03-len-cong/ben-doc.json`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/10 lỗi rơi vào file không bộ đo nào phủ (_acceptance/s03-len-cong/ben-doc.json, app/tests/tin-rao-giao-dien.test.tsx) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
