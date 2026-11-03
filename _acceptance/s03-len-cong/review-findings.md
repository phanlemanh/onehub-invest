# Review findings: s03-len-cong (round 3)

## Trong hợp đồng

- **Hình dạng 4 (âm tính một mình): «DB không đổi» của AC-6 chỉ soi hàng nhom[0], hàng mà các tệp hỏng không hề đổi**
  file: `pipeline/scripts/s03-len-cong.itest.mjs:326`
  severity: medium
  AC: AC-6
  source: measurement
  detail: `assert.deepEqual(await hang(), truoc, ...)` đọc một mình unit nhom[0] (dòng 287, 317). Bốn tệp hỏng ở dòng 318-323 không đưa giá trị mới nào cho hàng này. «mã lạ» và «thẻ thiếu một vế» sửa i === 1. «đơn vị không có trong sổ» giữ nguyên nhom[0], còn nhom[0] đã được ghi đúng giá trị đó ở bước --ghi trước. «thiếu đơn vị» bỏ hẳn nhom[0]. Vì vậy, một bản ghi hàng 1 hay số dòng ops_audit rồi mới ném lỗi vẫn xanh ở assert này. `assert.rejects` chỉ chứng minh có ném lỗi, không chứng minh DB không đổi. Vòng lặp không đếm nk() và không chụp toàn bộ collection_units, cũng không có đối chứng dương cho thấy thước đỏ khi có ghi. Ca lệnh thật ở dòng 339-342 chỉ xét exit code, stdout, stderr, không đọc DB. Lời hứa AC-6/E7 «mã lạ thoát khác 0 và DB không đổi» vì thế chưa được đo.
  rationale: AC-6 hứa rõ «mã thị trường lạ hay đơn vị lạ thì thoát khác 0, DB không đổi», và phép đo không chứng minh được vế DB không đổi.

- **Hình dạng 4 (âm tính một mình): ca «0 cặp chứa tin cấp thị trường» không thể đỏ, vì mẫu không có tin S06 cùng mã thị trường**
  file: `pipeline/scripts/s03-len-cong.itest.mjs:259`
  severity: high
  AC: AC-3
  source: measurement
  detail: `assert.equal(await cap([a.id, b.id]), 0, ...)` đo trên a, b đều là S03, mang area_id thị trường. Stage B ở pipeline/resolve-properties.mjs:95-115 chỉ ghép p1 (S03/S05) với p2 (source = 'S06') theo `p1.area_id = p2.area_id`, không lọc region_type. Hai tin S03 không bao giờ thành cặp với nhau, bất kể khu vực. View tạm ở dòng 242 còn thu tập S06 về đúng một phường, nên a, b không có đối tác nào. Mọi đột biến về khu vực vẫn cho 0. Đối chứng `cap([doiChung.id]) > 0` chỉ chứng minh bộ ghép chạy ở cấp phường, không chứng minh chiều cấp thị trường đỏ được. Bộ ghép không có điều kiện nào loại tin cấp thị trường. Nếu có tin S06 mang mã thị trường, cặp sẽ sinh ra, nhưng thước không gieo ca này. Truy vấn chỉ đọc trên oneinvest_n1_sl1 cho 0 tin S06 cấp thị trường, nên hiện kết quả 0 đến từ dữ liệu, không đến từ luật. Cần gieo một tin S06 cùng mã thị trường và ghim mong đợi, hoặc có ca đỏ riêng; E3 chỉ có ca đỏ cho 610.
  rationale: AC-3 hứa không có cặp ứng viên chứa tin cấp thị trường, và ca đo không thể đỏ nên lời hứa chưa được chứng minh.

- **Hình dạng 3 (chuỗi có mặt thay cho quan hệ): hai thứ tự 068/069 chỉ đếm chữ «fp_sdt» trong thân hàm, không đo phân xử giữ xuất xứ SĐT**
  file: `pipeline/scripts/s03-len-cong.itest.mjs:142`
  severity: medium
  AC: AC-5
  source: measurement
  detail: Lời hứa của AC-5 là hàm cuối giữ nguyên fp_sdt cùng hai mốc offer_status của 068: sau phân xử, field_provenance vẫn còn khoá seller_phone và offer_status, đồng thời luật inferred có hiệu lực. Ma trận thứ tự chỉ kiểm chuỗi trên pg_get_functiondef: `def.includes("fp_sdt")` và `def.split("fp_sdt").length === 4` (dòng 142, 145). Phần chạy thật ở dòng 146-149 chỉ gieo phát biểu property_type rồi đọc property_type, không gieo field_provenance.seller_phone hay offer_status và không đọc lại chúng sau resolve. Tệp không có assert nào về offer_status. Bản 069 làm hỏng phép nối provenance mà vẫn giữ đủ bốn lần xuất hiện chữ fp_sdt sẽ vẫn xanh. Cột 067 cũng chỉ đo kiểu này: `def.includes("unit_facing")` ở dòng 143.
  rationale: AC-5 yêu cầu 069 giữ nguyên fp_sdt và hai mốc offer_status của 068 ở cả hai thứ tự, mà phép đo chỉ đếm chuỗi.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (âm tính một mình): confidence ở ca qua transform thật chỉ có notEqual "high", không có dòng phường đối chứng lên high**
  Người dùng thấy gì: Nếu có lỗi làm mọi tin S03 đều không được xếp độ tin cậy cao, bài kiểm tra hiện tại vẫn báo xanh. Nhà đầu tư có thể thấy tin có phường bị hạ độ tin cậy mà không ai phát hiện.
  Căn cứ: Hậu quả nhẹ vì chỉ lệch nhãn độ tin cậy, không mất hay lộ dữ liệu, và sửa lại được khi chạy lại bước xử lý; bổ sung ca đối chứng sau cũng rẻ.
  file: `pipeline/scripts/s03-len-cong.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng phạm vi thiếu): hợp đồng nói E13 quét «toàn kho», mã chỉ quét năm thư mục**
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
