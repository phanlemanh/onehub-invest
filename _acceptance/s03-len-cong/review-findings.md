# Review findings: s03-len-cong (round 5)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Đổi SQL ở resolve-properties làm đỏ test RTLD-AC-7 của hồ sơ resolve-thu-lai-deadlock, mà CI không chạy test này nên không thấy**
  Người dùng thấy gì: Một bài kiểm gác việc ghép căn của hồ sơ trước đang đỏ vì câu lệnh đã đổi có chủ đích. Cách ghép căn chạy thật không sai, nhưng bài kiểm đó sẽ không còn báo được thay đổi lạ về sau.
  Căn cứ: Không mất dữ liệu và người dùng không thấy gì, nhưng thước gác đỏ im lặng khiến lần đổi sau khó phân biệt; sửa rẻ và chỉ cần một lượt chụp lại kèm ghi chú hồ sơ.
  file: `pipeline/resolve-properties.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 5 (tuyên quét lớp, thiếu ma trận toàn phần) kèm hình dạng 4 (âm tính một mình): «năm dòng ma trận» chỉ đo confidence và phuong_raw ở 2/5 dòng**
  Người dùng thấy gì: Bài kiểm khu vực chỉ chắc chắn bắt được lỗi ở các tin cấp thị trường. Nếu tin có phường bị mất độ tin cậy cao, bài kiểm này vẫn xanh.
  Căn cứ: Hành vi theo hợp đồng đã được kiểm; lỗ hổng chỉ làm sót một kiểu lỗi hiếm, người dùng không thấy ngay và bổ sung ca sau không tốn nhiều.
  file: `pipeline/scripts/s03-len-cong.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay, không round-trip qua writer rồi reader): luật gộp khu vực hai thị trường chỉ đo trên object dựng tay**
  Người dùng thấy gì: Luật cho tin đăng ở hai bài khai hai thị trường khác nhau chỉ được thử trên dữ liệu dựng tay. Chưa thấy lỗi thật, nhưng nếu cách ghi đổi dạng thì bài kiểm vẫn xanh.
  Căn cứ: Không có lỗi thực tế được thấy nên người dùng chưa chịu hậu quả; rủi ro chỉ xuất hiện khi cách ghi đổi sau này và thêm ca đo sau cũng rẻ.
  file: `pipeline/scripts/s03-len-cong.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Bài nói rõ là đất vẫn nhận loại hình «apartment» suy từ nhóm rồi hiện trên cổng (r4 · tệp đã đổi)**
  Người dùng thấy gì: Một số rất ít tin bán đất nền có thể hiện trên trang tin rao với nhãn loại hình là căn hộ. Nhà đầu tư xem tin đó sẽ thấy loại hình sai.
  Căn cứ: Hiện chỉ khoảng hai bài trên hơn năm mươi nghìn bài, nên ảnh hưởng nhỏ; ghi lại như hạn chế đã biết, sửa sau khá rẻ nhưng chưa cần chặn ra mắt.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **Tin nhóm Facebook S05 lên cổng không có nhãn «Chưa xác minh» (r4)**
  Người dùng thấy gì: Tin lấy từ nhóm Facebook hiện trên trang tin rao mà không có nhãn «Chưa xác minh», nên người xem tưởng tin đã được đối chiếu.
  Căn cứ: Hiện chỉ có một tin như vậy trên cổng, nên người dùng ít gặp; việc có mở nhãn sang nguồn này hay không là quyết định sản phẩm của người ký.
  file: `app/src/lib/offers-filters.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (có mặt thay vì quan hệ): E13 chỉ so tập tên tệp, không kiểm kết luận gắn với tệp (r4 · tệp đã đổi)**
  Người dùng thấy gì: Danh sách các chỗ đọc khu vực được kiểm theo tên tệp, còn phần ghi chú kết luận về từng chỗ không được máy kiểm. Ghi chú sai vẫn có thể lọt mà không báo đỏ.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng cuối, chỉ làm bằng chứng nghiệm thu yếu hơn; người rà soát đọc lại được, nên ghi lại là đủ.
  file: `pipeline/scripts/do-s03-len-cong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): E12 chỉ có đối chứng cho tên nguồn, không có cho khoá nhóm, tên nhóm và chữ bài (r4 · tệp đã đổi)**
  Người dùng thấy gì: Kiểm tra chống lộ thông tin chỉ chứng minh được là bắt tên nguồn thật; với tên nhóm và nội dung bài, chưa chắc nó báo đỏ khi có rò rỉ.
  Căn cứ: Rủi ro lộ thông tin tầng A là nặng nếu xảy ra, nhưng lần này diff chưa thấy rò và thêm đối chứng sau là rẻ; ghi lại để người ký biết giới hạn của rào.
  file: `pipeline/scripts/do-s03-len-cong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): `!co.includes("<a href")` không thể đỏ kể cả khi thẻ có liên kết phường (r4 · tệp đã đổi)**
  Người dùng thấy gì: Một phép kiểm phụ về liên kết phường trên thẻ tin cấp thị trường không có khả năng báo lỗi, nhưng một phép kiểm khác đã đo đúng việc này.
  Căn cứ: Không mất khả năng phát hiện lỗi thật vì có phép kiểm đúng ở chỗ khác; sửa không đem lại gì nên chấp nhận.
  file: `app/tests/s03-len-cong.test.tsx`
  severity: medium
  Đề xuất: wont-fix

- **Hình dạng 4 (âm tính một mình): «tin observed giữ giá trị cũ» chỉ assert 0 đề xuất, không ghim tin đã được chọn (r4 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm xác nhận tin loại hình đã xác thực vẫn giữ giá trị cũ còn yếu, có thể không bắt được lỗi ghi đè nhầm.
  Căn cứ: Hai ca đỏ chính của luật này đã có và chạy đúng, nên rủi ro mất dữ liệu thấp; thêm đối chứng sau là rẻ.
  file: `agent/tests/s03-len-cong.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên cả lớp, đo điểm-case): E9 nói «unverified đúng từng nguồn» nhưng chỉ gieo S03 và S06 (r4 · tệp đã đổi)**
  Người dùng thấy gì: Mô tả của phép kiểm nói «đúng từng nguồn» nhưng thực tế chỉ thử hai nguồn mà hợp đồng cam kết.
  Căn cứ: Hợp đồng chỉ cam kết hai nguồn nên việc đo đã đủ; chỉ cần chỉnh lời mô tả, không đáng mở việc riêng.
  file: `app/tests/s03-len-cong.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (âm tính một mình): confidence ở ca qua transform thật chỉ có notEqual "high", không có dòng phường đối chứng lên high (r3 · tệp đã đổi)**
  Người dùng thấy gì: Nếu có lỗi làm mọi tin S03 đều không được xếp độ tin cậy cao, bài kiểm tra hiện tại vẫn báo xanh. Nhà đầu tư có thể thấy tin có phường bị hạ độ tin cậy mà không ai phát hiện.
  Căn cứ: Hậu quả nhẹ vì chỉ lệch nhãn độ tin cậy, không mất hay lộ dữ liệu, và sửa lại được khi chạy lại bước xử lý; bổ sung ca đối chứng sau cũng rẻ.
  file: `pipeline/scripts/s03-len-cong.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng phạm vi thiếu): hợp đồng nói E13 quét «toàn kho», mã chỉ quét năm thư mục (r3 · tệp đã đổi)**
  Người dùng thấy gì: Một vài script vận hành và truy vấn phụ ngoài các thư mục chính có thể đọc dữ liệu khu vực theo cách lạ mà bài kiểm tra không phát hiện. Số liệu ở các công cụ nội bộ đó có thể lệch mà không ai biết.
  Căn cứ: Các chỗ bị bỏ sót là công cụ nội bộ, không hiện trên cổng nhà đầu tư, nên hậu quả nhẹ và dễ phát hiện khi dùng; mở rộng phạm vi quét về sau không đắt.
  file: `pipeline/scripts/do-s03-len-cong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Stub E9 của tin-rao-giao-dien thiếu hasPublicOffers và không có tác dụng: ca này đọc DB thật (r2)**
  Người dùng thấy gì: Một ca kiểm tra trang tin rao đang đọc dữ liệu thật thay vì dữ liệu giả, nên có thể đỏ khi máy không có cơ sở dữ liệu. Người dùng cuối không thấy thay đổi nào.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của một ca kiểm tra nội bộ, không làm sai hay mất dữ liệu hiển thị, và sửa sau rẻ.
  file: `app/tests/tin-rao-giao-dien.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Cột «Có phường» và luật nút thắt của Ops đếm cả tin cấp thị trường, che mất chỗ tắc của S03 (r2)**
  Người dùng thấy gì: Trên trang theo dõi luồng dữ liệu của Ops, tỷ lệ tin có phường của S03 sẽ cao hơn thực tế vì tính cả tin chỉ có thị trường, nên chỗ tắc về phường có thể hiện xanh dù chưa được giải quyết.
  Căn cứ: Gây hiểu sai cho người vận hành về chất lượng dữ liệu nhưng không làm hỏng dữ liệu hay lộ ra cổng nhà đầu tư; số đọc lại được sau khi sửa.
  file: `pipeline/sql/600_data_flow.sql`
  severity: medium
  Đề xuất: new-contract

- **Bảng tin của Ops hiện tên thị trường ở ô Phường và báo «chưa gắn» thị trường cho tin cấp thị trường (r2)**
  Người dùng thấy gì: Trong Ops, tin chỉ có thị trường sẽ hiện tên thị trường ở ô Phường và ghi «chưa gắn thị trường», nên lọc theo thị trường sẽ không thấy các tin này.
  Căn cứ: Chỉ nhân viên vận hành thấy nhầm nhãn và lọc thiếu, không mất dữ liệu và nhà đầu tư không bị ảnh hưởng; sửa sau không đắt.
  file: `app/src/lib/data-flow-queries.ts`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4 (âm tính một mình): «thước 0 dòng cấp thị trường» không thể đỏ, 6 tin mồi S03 không bao giờ thành căn (r2 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm tra rằng thước giá không có dòng cấp thị trường luôn xanh nên không bắt được lỗi nếu sau này có người đổi cách tạo căn. Hiện người dùng không thấy số sai.
  Căn cứ: Rủi ro nằm ở việc lỗi tương lai khó bị phát hiện, chưa có hậu quả với người dùng hôm nay; bổ sung phép kiểm sau rẻ.
  file: `pipeline/scripts/s03-len-cong.itest.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): băm «dòng phường không đổi» của 500 không có đối chứng đỏ, bản 500 cũ cũng xanh (r2 · tệp đã đổi)**
  Người dùng thấy gì: Một phép so sánh số liệu phường trước và sau khi thêm tin cấp thị trường không phân biệt được bản đúng với bản sai, dù số liệu thật hiện không bị lệch.
  Căn cứ: Không có sai lệch thật với nhà đầu tư và phép kiểm chính vẫn bắt được lỗi; chỉ là lưới an toàn phụ yếu.
  file: `pipeline/scripts/s03-len-cong.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): E12 quét khoá nhóm, tên nhóm, chữ bài không có đối chứng dương và không chặn tập so rỗng (r2 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm chống lộ khoá nhóm và nội dung bài chưa được thử bằng mẫu giả, nên chưa chắc nó bắt được nếu có rò rỉ. Hiện chưa thấy rò rỉ nào.
  Căn cứ: Nếu phép kiểm lỏng thì rò rỉ có thể lọt, nhưng phép kiểm chính về tên nguồn thật đã có đối chứng; bổ sung sau rẻ.
  file: `pipeline/scripts/do-s03-len-cong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): chốt lechMau và tinTachNhoSo không có ca đỏ (r2 · tệp đã đổi)**
  Người dùng thấy gì: Hai phép kiểm phụ về mẫu lệch và tin tách nhỏ chưa từng được chứng minh là biết báo đỏ, nên có thể im lặng khi có sai.
  Căn cứ: Chỉ giảm độ tin của lưới kiểm phụ, không gây sai dữ liệu hiện tại; bổ sung ca đỏ sau rẻ.
  file: `pipeline/scripts/do-s03-len-cong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): E9 hứa «unverified đúng từng nguồn» nhưng chỉ đo S03 và S06 (r2 · tệp đã đổi)**
  Người dùng thấy gì: Nếu sau này có nguồn khác lên cổng, nhãn «Chưa xác minh» có thể gắn sai mà phép kiểm hiện tại không phát hiện. Hiện chỉ S03 và S06 hiển thị.
  Căn cứ: Hậu quả chỉ xuất hiện khi thêm nguồn mới, nhãn sai tự sửa được khi sửa luật; chưa có tác động hôm nay.
  file: `app/tests/s03-len-cong.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): comment tuyên ca Hà Nội nhưng lệnh chỉ đo thị trường không phường (r2 · tệp đã đổi)**
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

- **Ma trận bên đọc ghi «Sửa trong hàng này» cho ba tệp không hề đổi (r1 · tệp đã đổi)**
  Người dùng thấy gì: Hồ sơ cho người ký mô tả sai ba tệp là đã sửa trong hàng này, dù thực tế chúng không đổi. Sản phẩm không bị ảnh hưởng.
  Căn cứ: Chỉ là chú thích sai trong hồ sơ, không đổi hành vi nào của sản phẩm, sửa chữ là xong bất cứ lúc nào.
  file: `_acceptance/s03-len-cong/ben-doc.json`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
