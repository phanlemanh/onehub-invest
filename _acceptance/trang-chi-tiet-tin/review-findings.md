# Review findings: trang-chi-tiet-tin (round 1)

## Trong hợp đồng

- **Ca HTTP TCT-AC-6 lặng lẽ bỏ qua phần thuê ngắn hạn và không đo 404 như tên ca đã nêu**
  AC: AC-6
  file: `app/tests/trang-chi-tiet-tin-db.test.tsx:418`
  severity: low
  source: bugs
  detail: Ca con «TCT-AC-6 trang listing thuê ngắn hạn không có noindex, id lạ cùng 404» có hai lỗ hổng. (1) Toàn bộ kiểm tra `/listing/abnb_…` (status 200, không noindex) nằm trong `if (rows[0])` ở dòng 420. DB thử không có listing `abnb_` thì ca vẫn xanh, không báo skip, nên đối chứng nhánh thuê ngắn hạn trên HTTP thật biến mất mà không ai biết. (2) Ca không có request nào tới id lạ của nhánh thuê ngắn hạn, và ca TCT-AC-5 chỉ tải id dạng `offer_…`. Vì vậy quyết định d-20261104T234132Z-19 («404 của route dùng chung cho cả id abnb_ lạ») chưa có phép đo HTTP nào, dù tên ca nói có. Cách sửa: dùng `assert.ok(rows[0], ...)` hoặc gieo một listing, rồi thêm một request `/listing/abnb_khongco` kiểm 404 và câu «Tin này không còn hiện». Giới hạn của kết luận: ở lượt chấm này tôi chạy tct_ui (7/7 xanh) nhưng không chạy tct_db, vì lệnh đó có thể dựng DB thử trên server dùng chung. Lỗi trên đọc trực tiếp từ mã nguồn, không phải từ kết quả chạy.

- **Hình dạng 5 (tuyên ma trận, số assert không bằng số phần tử): TCT-AC-4 đếm nguồn × nguồn thay vì nguồn × cột cấm**
  AC: AC-4
  file: `app/tests/trang-chi-tiet-tin-db.test.tsx:379`
  severity: high
  source: measurement
  detail: E4 hứa «ma trận viết trước ba nguồn × từng cột cấm, số assert bằng số phần tử». Vòng lặp ở dòng 370-376 tăng soAssert một lần cho mỗi cặp (trang, nguồn) và dòng 379 so với NGUON.length * NGUON.length, tức 9. Ma trận khai là 3 × 11 cột (10 trong COT_CAM cộng source). Cả danh sách cột gói trong một deepEqual(cotLo(...), []), nên bớt một phần tử khỏi COT_CAM (ví dụ bỏ latitude) thì số vẫn là 9 và test vẫn xanh. Phép đếm này không bảo vệ độ đủ của ma trận cột, đúng thứ mà mẫu P105 cần ghim.

- **Hình dạng 4 (âm tính một mình): cột source không có đối chứng dương, regex dò sai ưu tiên phép hoặc mà không ai phát hiện**
  AC: AC-4
  file: `app/tests/trang-chi-tiet-tin-db.test.tsx:338`
  severity: high
  source: measurement
  detail: AC-4 liệt kê source là cột cấm đầu tiên. Regex dựng bằng `(^|[^A-Za-z0-9_-])${NGUON.join("|")}([^A-Za-z0-9_-]|$)` được hiểu là `(^|x)S03 | S05 | S06(x|$)`: S03 chỉ có biên trái, S05 không có biên nào, S06 chỉ có biên phải, nên ý định chặn biên hai phía không thành. Không bản phá nào làm lộ source: bản phá ở dòng 429-451 chỉ dùng seller_phone, listing_url, street_number. Hợp đồng đòi «bản sao lộ một cột thì đỏ và gọi tên cột», nhưng nhánh ["source"] chưa từng được chứng minh là bật đúng; regex sai dạng tồn tại được chính vì thước này chưa có ca dương.

- **Hình dạng 4 (âm tính một mình): sáu ô chéo của TCT-AC-4 không có đối chứng rằng thẻ tin kia thật sự có trên trang**
  AC: AC-4
  file: `app/tests/trang-chi-tiet-tin-db.test.tsx:377`
  severity: high
  source: measurement
  detail: Dòng 343 giả định trang mỗi tin có thẻ của hai tin kia trong khối tin cùng tiêu chí, và dòng 373-376 dùng giả định đó để quét giá trị đánh dấu của nguồn khác. Đối chứng dương ở dòng 377 chỉ tìm «Anh Ba» và «BX», mà cả hai đều có sẵn trong phần thân của chính tin đó. Không có assert nào rằng offerId của hai tin kia hoặc chữ thẻ xuất hiện trong phản hồi. Nếu khối tin cùng tiêu chí rỗng, lỗi hoặc bị bỏ khỏi trang, sáu ô chéo (nghĩa là toàn bộ vế «cả thẻ trong khối tin cùng tiêu chí» của AC-4) vẫn xanh.

- **Hình dạng 5 (tuyên ma trận, chỉ có điểm-case): MA_TRAN_VE khai loại hình × loại tin × độ đủ nhưng thiếu ô, bộ đếm lại luôn đúng**
  AC: AC-2
  file: `app/tests/trang-chi-tiet-tin.test.tsx:138`
  severity: high
  source: measurement
  detail: Dòng 136 và AC-2 khai tích 3 × 2 × 2 = 12 ô, cộng tin cấp thị trường. Bảng chỉ có 7 ô cộng dòng cấp thị trường; thiếu căn hộ thuê thiếu, nhà bán thiếu, nhà thuê đủ, đất thuê đủ, đất thuê thiếu. Ô «nhà bán đủ» cũng không có mặt tiền. E2 hứa «số assert bằng số dòng», nhưng so++ nằm ngay trong for...of trên chính mảng đó và dòng 180 so với MA_TRAN_VE.length, nên không thể đỏ. Bảng không được sinh từ tích các trục, nên ô thiếu không bị phát hiện.

- **Hình dạng 3 (chuỗi có mặt thay vì quan hệ): kiemVe chỉ kiểm nhãn dt và đuôi đơn vị, không kiểm giá trị đi với nhãn**
  AC: AC-2
  file: `app/tests/trang-chi-tiet-tin.test.tsx:155`
  severity: high
  source: measurement
  detail: AC-2 hứa «hiện ĐÚNG giá, đơn giá, nhãn tin, thông số gồm block, tầng, vị trí, tuổi tin, người đăng». kiemVe chỉ xét nhãn dt có hay không (dòng 155-156) và text chứa «/m²» hoặc «/tháng» (dòng 157). Không có assert nào ghép dt với dd. Nếu OfferBody đổi lẫn giá trị Phòng ngủ và WC, block và tầng, hoặc in sai giá và đơn giá, test vẫn xanh, dù mau() có bedrooms 3, bathrooms 2, block B2, floor 12 khác nhau và đủ để so. Tuổi tin (firstSeenVi) không có assert nào trong cả hai tệp test; E2b chỉ kiểm tới đầu ra của reader, không tới trang.

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): TCT-AC-8 đo tiêu đề trên dòng pg tự viết**
  AC: AC-8
  file: `app/tests/trang-chi-tiet-tin.test.tsx:237`
  severity: medium
  source: measurement
  detail: pool.query bị thay và trả dòng viết tay có đúng các alias mà toPublicOffer đọc (many_names, has_phone, region_type, market_name...), SQL thật không chạy. Vế «tiêu đề không có tên người đăng» của AC-8 chỉ được đo ở đây. Ca HTTP ở tệp db (dòng 425-426) chỉ kiểm noindex, không đọc <title> trong khi trang có seller_name «Anh Ba». Đổi alias ở SQL hoặc đổi nguồn tiêu đề trong dữ liệu thật thì ca này không phản ánh được.

- **Hình dạng 2 (fixture viết tay): ca lỗi và ca trống của khối tin cùng tiêu chí dựng tay, không đi qua vùng và luồng thật**
  AC: AC-7
  file: `app/tests/trang-chi-tiet-tin.test.tsx:299`
  severity: medium
  source: measurement
  detail: Dòng 299 tự viết <RegionError what="tin cùng tiêu chí"> rồi assert câu «Không tải được tin cùng tiêu chí», tức là đo lại prop của chính test. Dòng 275 chỉ tìm RegionError trong cây, không so loi.props.what, nên đổi what trong OfferCompsRegion thì test vẫn xanh. Dòng 290 render trực tiếp OfferCompsEmpty; nhánh `comps.length === 0` của OfferComps không có assert nào ở cả hai tệp (không có assert «Chưa có tin cùng tiêu chí»). Sửa OfferComps trả null khi rỗng thì AC-7 và AC-9 vẫn xanh.

- **Hình dạng 1 (đo trung gian thay vì đầu ra): «tin cấp thị trường không có khối» chỉ đo getOfferComps, không đo trang**
  AC: AC-7
  file: `app/tests/trang-chi-tiet-tin-db.test.tsx:199`
  severity: medium
  source: measurement
  detail: E7 hứa «tin cấp thị trường không có khối». Dòng 199-200 chỉ kiểm getOfferComps trả [] và không truy vấn. Đầu ra thật nằm ở điều kiện `!o.atMarketLevel` của OfferBody, mà dòng market trong MA_TRAN_VE lại đi qua boKhoi(…, OfferCompsRegion), cắt khối đó trước khi vẽ. Ca HTTP không mở tin cấp thị trường và cũng không tìm chữ «Tin cùng tiêu chí». Nếu bỏ điều kiện ở OfferBody, trang sẽ hiện khối trống kèm nút, mà mọi test vẫn xanh.

- **Hình dạng 4 (âm tính một mình): assert noindex của listing thuê ngắn hạn tự bỏ qua khi không có dữ liệu**
  AC: AC-8
  file: `app/tests/trang-chi-tiet-tin-db.test.tsx:420`
  severity: medium
  source: measurement
  detail: Khối `if (rows[0])` bọc cả assert 200 lẫn assert không có noindex. DB thử không có dòng abnb_ thì ca vẫn xanh mà không đo gì về listing thuê ngắn hạn: không gieo dữ liệu, không fail hay skip có lời. Đối chứng ở dòng 425-426 chỉ chứng minh regex bắt được ở trang tin, không chứng minh nhánh listing đã chạy. Tên ca ghi thêm «id lạ cùng 404» nhưng trong ca không có assert nào về việc đó.

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): thước «mọi cột trang đọc đều trong CLOUD_ALLOW» chỉ quét một câu và một dạng cú pháp**
  AC: AC-2
  file: `app/tests/trang-chi-tiet-tin-db.test.tsx:86`
  severity: medium
  source: measurement
  detail: AC-2 hứa MỌI cột trang đọc. Dòng 94 chỉ bắt SQL của getPublicOffer, không bắt getOfferComps dù cùng trang chạy nó, và đối chứng ở dòng 115 chỉ nối chuỗi « o.listing_url » vào cuối SQL. Regex `\bo\.([a-z0-9_]+)` chỉ thấy cột có tiền tố o., nên bỏ sót cột không tiền tố trong CTE NHIEU_TEN (seller_ref, seller_name) và cột đọc qua `to_jsonb(o) ->> 'seller_phone_inferred'` có ngay trong OFFER_COLUMNS. Bản sao đọc thêm cột ngoài danh sách bằng hai đường này, hoặc thêm vào câu comps, thì không đỏ. Hiện các cột đó đều nằm trong CLOUD_ALLOW, nên lỗ hổng ở thước chứ chưa phải lỗi đang chạy.

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): «mỗi trường về đúng giá trị» dùng Partial, sót bốn trường**
  AC: AC-2
  file: `app/tests/trang-chi-tiet-tin-db.test.tsx:96`
  severity: medium
  source: measurement
  detail: E2b hứa «mỗi trường về đúng giá trị», nhưng mongDoi khai Partial<PublicOfferDetail> nên TypeScript không buộc liệt kê đủ khoá. Bảng thiếu sellerManyNames, phoneInferred, unverified, updatedAt. Không có assert nào trên kết quả getPublicOffer cho bốn trường này trong hai tệp test; chúng chỉ xuất hiện trong fixture mau() hoặc ở dạng props viết tay. Nhãn tin (unverified) và nhãn số (phoneInferred) đều là lời hứa của AC-2, AC-3, nhưng giá trị từ DB không được đọc lại.

- **Hình dạng 5 (tuyên quét lớp, có dòng được miễn): TCT-AC-5 bỏ một dòng ma trận và bỏ dữ liệu nhúng khỏi phép so «cùng thân»**
  AC: AC-5
  file: `app/tests/trang-chi-tiet-tin-db.test.tsx:411`
  severity: medium
  source: measurement
  detail: E5 hứa «mỗi dòng ma trận cùng trạng thái 404, thân phản hồi giống nhau sau khi bỏ mã id». Dòng 411 `continue` khiến dòng «id sai dạng» không vào phép so thân. Dòng 406 xoá toàn bộ <script>, nên __next_f, nơi dữ liệu nhúng khác nhau giữa tin ẩn và id lạ có thể lộ ra, nằm ngoài phép so. Test có ghi lý do bằng comment, nhưng kết quả đo thực tế hẹp hơn lời hứa của E5. Ngoài ra, dòng «id lạ» và «id sai dạng» không được kiểm getOfferPhone: dongVanHien chỉ duyệt idKhongHien, còn dòng 150-152 chỉ gọi getPublicOffer, trong khi E5 đòi mỗi dòng đều getOfferPhone trả null.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khối trống «Tin cùng tiêu chí» đặt nút trực tiếp trong Empty, thiếu EmptyContent**
  Người dùng thấy gì: Khi chưa có tin cùng tiêu chí, nút về danh sách có thể cách khối chữ hơi lệch so với các khối trống khác. Vẫn đọc và bấm được.
  Căn cứ: Chỉ là lệch nhẹ về khoảng cách, không mất dữ liệu, người dùng vẫn dùng được nút bình thường và sửa sau rẻ.
  file: `app/src/components/listing/offer-body.tsx`
  severity: low
  Đề xuất: known-limits

- **Chú thích của tct_gate chép nhầm từ hồ sơ khác**
  Người dùng thấy gì: Một dòng ghi chú nội bộ của bộ kiểm trỏ nhầm hồ sơ; người dùng cuối không thấy gì.
  Căn cứ: Không ảnh hưởng người dùng nào, chỉ gây nhầm khi người phát triển truy vết, sửa lúc nào cũng rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Cổng thiết kế E11 bỏ sót tệp giao diện mới not-found.tsx**
  Người dùng thấy gì: Trang báo «Tin này không còn hiện» chưa được bộ kiểm giao diện tự động quét, nên sau này sửa sai kiểu dáng có thể lọt mà không ai báo.
  Căn cứ: Hiện trang chưa sai gì, rủi ro chỉ ở lần sửa tương lai và người dùng tải lại là qua, nên ghi nhận rồi bổ sung sau.
  file: `_acceptance/trang-chi-tiet-tin/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): E11 hứa «trên tệp mới» nhưng tct_gate chỉ quét một tệp**
  Người dùng thấy gì: Trang báo «Tin này không còn hiện» chưa được bộ kiểm giao diện tự động quét, nên sửa sai kiểu dáng sau này có thể lọt.
  Căn cứ: Hiện chưa có lỗi hiển thị nào, rủi ro chỉ ở lần sửa sau và người dùng tải lại là qua, nên ghi nhận là đủ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/17 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml, _acceptance/trang-chi-tiet-tin/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
