# Review findings: tin-rao-tren-invest (round 3)

## Trong hợp đồng

(không có finding trong hợp đồng ở vòng này)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E4b in nguyên giá trị sellerName khi đỏ, trái cam kết chỉ in số và có thể đưa tên nguồn thật (tầng A) vào bằng chứng**
  Người dùng thấy gì: Nếu lớp che tên bị hỏng và bài kiểm tra đỏ, nội dung báo lỗi có thể in ra tên nguồn thật rồi bị đưa vào hồ sơ bằng chứng trên kho công khai. Hiện chưa có bản ghi nào bị lộ.
  Căn cứ: Chỉ xảy ra khi bài kiểm tra đỏ và chưa thấy lộ thật; người dùng cuối không bị ảnh hưởng, còn việc sửa rất rẻ nên nên làm sớm ở vòng sau.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): vòng đọc lại tin mang định danh không có đối chứng dương, 0 tin vẫn đạt**
  Người dùng thấy gì: Phép kiểm tra việc che tên chỉ có tác dụng khi dữ liệu thật còn đúng một tin mang định danh nguồn. Khi tin đó hết hạn, lỗi gỡ che tên sau này có thể lọt qua mà bài kiểm tra vẫn xanh.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chỉ làm lưới an toàn mỏng đi theo thời gian; có thể ghi lại và bổ sung dữ liệu mẫu sau.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): soát định danh trên `gap` không ghim số dòng đã duyệt, gap rỗng vẫn cho 0 trúng**
  Người dùng thấy gì: Bài kiểm tra không chứng minh đã duyệt đủ các trang tin, nên nếu việc lấy trang bị thiếu thì kết quả «0 tin lộ định danh» vẫn hiện xanh. Người dùng chưa gặp lỗi nào từ chuyện này.
  Căn cứ: Chỉ là độ tin cậy của phép kiểm thấp hơn lời hứa, không làm lộ hay mất dữ liệu; sửa rẻ nên có thể làm ở vòng kiểm tra sau.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Dòng route /listings khai operational + Table-backed + block đích dù trang chỉ là redirect 308 (r2)**
  Người dùng thấy gì: Sổ tay giao diện ghi trang /listings như một trang có giao diện đầy đủ, trong khi thực tế nó chỉ chuyển sang Bán hoặc Cho thuê. Người làm giao diện sau này có thể hiểu nhầm, người dùng cuối không thấy gì.
  Căn cứ: Chỉ là ghi chú sai trong tài liệu nội bộ, không ảnh hưởng người dùng, sửa một dòng bất cứ lúc nào.
  file: `.claude/skills/onehub-ui/routes.md`
  severity: medium
  Đề xuất: known-limits

- **Ba dòng listings có dấu | trần trong Ghi chú: 11 ô so với 8 cột, và câu chữ bị cắt khi tách dòng (r2)**
  Người dùng thấy gì: Một phần ghi chú về ba trang tin rao trong sổ tay giao diện bị cắt khi hiển thị, nên người đọc thiếu thông tin về ô chọn Dài hạn, Ngắn hạn. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ mất chữ trong tài liệu nội bộ, không mất dữ liệu hay chức năng, và sửa lại rất rẻ.
  file: `.claude/skills/onehub-ui/routes.md`
  severity: medium
  Đề xuất: known-limits

- **sourceEntries viết lại truy vấn to_regclass thay vì dùng localOnlyTable có sẵn (r2)**
  Người dùng thấy gì: Hai chỗ trong mã cùng kiểm tra một bảng chỉ có ở máy thu theo hai cách viết. Người dùng không thấy khác biệt nào.
  Căn cứ: Không có hậu quả nào với người dùng; chỉ gọn mã, để dọn khi tiện.
  file: `app/src/lib/offers-public.ts`
  severity: low
  Đề xuất: wont-fix

- **Số bị che ở getOfferPhone nhưng hasPhone, withPhone và lọc has_phone vẫn tính nó (r2)**
  Người dùng thấy gì: Ở máy thu, một số tin có thẻ hiện nút Xem số nhưng bấm vào lại báo Chưa có số, và bộ lọc Chỉ tin có số đếm dư vài tin. Trên cổng công khai ở cloud không gặp.
  Căn cứ: Hậu quả nhẹ: chỉ gây một lần bấm vô ích ở một số ít tin, không lộ dữ liệu nào, và chỉ xảy ra ở máy thu.
  file: `app/src/lib/offers-public.ts`
  severity: low
  Đề xuất: known-limits

- **routes.md: tách dòng làm hỏng câu mô tả và ghi trang redirect /listings là operational (r2)**
  Người dùng thấy gì: Sổ tay giao diện ghi sai loại trang cho /listings và cụt một câu về ô thời hạn của trang Cho thuê. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Chỉ sai tài liệu nội bộ, không ảnh hưởng người dùng, sửa nhanh và rẻ.
  file: `.claude/skills/onehub-ui/routes.md`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): ca che định danh nguồn ở lớp đọc chỉ thử real_name, bỏ trống ô source_ids và ô số khi bảng rỗng (r2)**
  Người dùng thấy gì: Phần kiểm tự động việc che tên, số người bán có nguồn thật chưa thử hết các trường hợp, nên sau này có thể sửa hỏng mà không bị báo. Hiện chưa thấy người dùng bị ảnh hưởng.
  Căn cứ: Là lỗ hổng của phép kiểm chứ chưa phải lỗi sản phẩm, không lộ dữ liệu ngay, bổ sung ca kiểm sau không tốn nhiều.
  file: `app/tests/tin-rao-cong-khai.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (dữ liệu viết tay, không round-trip writer → reader): ca 'bấm Ngắn hạn thoát được lỗi' không bấm, kind đưa tay vào ListingsPageBody (r2)**
  Người dùng thấy gì: Một ca kiểm tự động nói là bấm Ngắn hạn nhưng thực ra không bấm, nên nếu nút này hỏng thì ca đó không báo. Việc bấm thật vẫn được kiểm bằng bước thử giao diện riêng.
  Căn cứ: Hành vi đã có lớp kiểm khác phủ, chỉ thiếu một lớp kiểm tự động phụ, nhẹ và sửa sau rẻ.
  file: `app/tests/tin-rao-giao-dien.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Ký tự NUL trong ward hoặc id làm truy vấn Postgres lỗi, API công khai ném lỗi chưa bắt thay vì bỏ qua hay trả 404 (r1)**
  Người dùng thấy gì: Ai gõ tay một đường dẫn có ký tự lạ ở bộ lọc phường sẽ thấy trang tin Bán hoặc Cho thuê báo lỗi thay vì bỏ qua bộ lọc đó. Chỉ xảy ra với đường dẫn cố tình dựng, người dùng thường không gặp.
  Căn cứ: Hậu quả nhẹ vì chỉ xảy ra với đường dẫn cố tình dựng, không lộ dữ liệu, tải lại hoặc bỏ tham số là xong, và sửa sau không đắt.
  file: `app/src/lib/offers-filters.ts`
  severity: medium
  Đề xuất: known-limits

- **streetOf cắt nửa số nhà và không bỏ dạng «Số N», nên chữ sai và lộ số nhà trên thẻ, API công khai (r1)**
  Người dùng thấy gì: Một số ít thẻ tin hiện tên đường bị cụt chữ đầu, hoặc vẫn còn số nhà dạng «Số 1». Người xem thấy địa chỉ hơi lạ nhưng vẫn hiểu được.
  Căn cứ: Ảnh hưởng nhỏ, chỉ vài chục trong hàng nghìn tin, không làm sai giá hay số liên hệ, sửa sau không đắt.
  file: `app/src/lib/offers-public.ts`
  severity: low
  Đề xuất: known-limits

- **Tham số bí danh `area` bật được bộ lọc nhưng không gỡ được bằng chip hay «Xoá bộ lọc» (r1)**
  Người dùng thấy gì: Nếu ai mở link ngoài có sẵn tham số phường kiểu cũ, họ không gỡ được bộ lọc đó bằng nút Xoá bộ lọc, dù chip đã biến mất.
  Căn cứ: Chỉ gặp khi vào bằng link gõ tay hoặc từ ngoài, người dùng thoát được bằng cách bỏ tham số trên thanh địa chỉ, sửa sau rẻ.
  file: `app/src/lib/offers-filters.ts`
  severity: low
  Đề xuất: known-limits

- **Trang vượt quá tổng số báo sai «Không có tin khớp bộ lọc» và mất phân trang (r1)**
  Người dùng thấy gì: Khi mở link cũ tới một trang đã không còn tin, người xem thấy báo «không có tin khớp» và không còn nút chuyển trang, phải bấm Xoá bộ lọc mới quay lại được.
  Căn cứ: Chỉ gặp với link chia sẻ cũ, không mất dữ liệu, người dùng tự thoát bằng cách bỏ bộ lọc hoặc sửa số trang, sửa sau không đắt.
  file: `app/src/components/listing/offers-explorer.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay, không round-trip): E8b dùng sort, has_phone, trang, kind viết tay thay vì giá trị bộ dựng URL sinh ra (r1)**
  Người dùng thấy gì: Bài kiểm có thể không phát hiện nếu sau này ai đổi tên tham số sắp xếp hay trang ở bộ lọc. Hiện sản phẩm vẫn chạy đúng.
  Căn cứ: Không ảnh hưởng người dùng hôm nay, chỉ giảm khả năng bắt lỗi về sau, bổ sung bài kiểm lúc nào cũng được.
  file: `app/tests/tin-rao-cong-khai.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): 'v1/offers không phiên 401' đo bằng indexOf trên mã nguồn route, không quan sát status 401 (r1)**
  Người dùng thấy gì: Bài kiểm chưa chứng minh trực tiếp rằng khách chưa đăng nhập bị từ chối ở API nội bộ, nên nếu ai làm hỏng chỗ này bài kiểm có thể không báo.
  Căn cứ: Hiện chưa có lỗi thật, chỉ là lưới an toàn mỏng, và việc chạy thử thật có thể làm sau khi ra mắt.
  file: `app/tests/tin-rao-cong-khai.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): E6 grep mã nguồn smoke và chỉ kiểm cú pháp, không chạy ca khách 200 và 401 (r1)**
  Người dùng thấy gì: Bài kiểm chỉ đọc chữ trong kịch bản kiểm tra, chưa chạy thật, nên có thể bỏ sót nếu kịch bản đó bị sửa sai.
  Căn cứ: Người dùng không bị ảnh hưởng, đây là lưới an toàn nội bộ và có thể bổ sung sau.
  file: `scripts/check-api-surface.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): bảng link nội bộ E8 grep chuỗi trong tệp nguồn, không đọc href đã dựng (r1)**
  Người dùng thấy gì: Bài kiểm có thể báo xanh dù một link từ trang Insight hay thanh đầu trang thực tế không dẫn đúng, nhưng chưa thấy link nào sai.
  Căn cứ: Không có lỗi thấy được hôm nay, link sai nếu có thì người dùng thấy ngay và sửa nhanh.
  file: `app/tests/tin-rao-giao-dien.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): số đo E4b nói 'toàn bộ tin hiện có số' nhưng câu truy vấn có LIMIT 500, không ORDER BY (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm khuôn số điện thoại chỉ soát một mẫu 500 tin chứ chưa phải mọi tin có số, nên số sai khuôn ở tin khác có thể lọt.
  Căn cứ: Số tin có số hiện rất ít nên rủi ro thấp, và có thể mở rộng phép kiểm sau khi ra mắt.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): saiKhuon bằng 0 không có đối chứng dương, coThat bằng 0 vẫn đạt (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm có thể báo đạt dù không soát được số nào, nên không bảo đảm chắc chắn rằng số hiện ra đều đúng khuôn.
  Căn cứ: Hiện chưa có số sai thật, chỉ là phép kiểm lỏng, bổ sung điều kiện kiểm sau không đắt.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 và 4 (điểm-case, âm tính không thể đỏ): E5 tuyên 'mọi trường hợp khác' nhưng thiếu các ca thiếu phường, loại, giá; ô thieu-phuong của E4 không thể đỏ (r1)**
  Người dùng thấy gì: Bài kiểm không đủ ca để bắt trường hợp tin thiếu phường hoặc thiếu loại bị lộ số liên hệ nếu ai sửa sai điều kiện ẩn sau này.
  Căn cứ: Hiện chưa thấy tin nào lộ, nhưng nếu về sau lộ thì liên quan số liên hệ nên nên thêm ca sớm khi có dịp.
  file: `app/tests/tin-rao-cong-khai.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert có mặt trong khi lời hứa là quan hệ): E4c 'các cột khác của dòng nguyên vẹn' chỉ đếm dòng và đếm price_vnd khác null (r1)**
  Người dùng thấy gì: Bài kiểm chưa chứng minh mọi thông tin khác của tin vẫn nguyên sau khi đồng bộ lên máy chủ, chỉ kiểm vài chỉ số thô.
  Căn cứ: Chưa có dữ liệu sai thật được thấy, và có thể đối chiếu từng cột sau khi ra mắt.
  file: `app/tests/tin-rao-cong-khai.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert có mặt trong khi lời hứa là quan hệ): 'hai thẻ cùng thứ tự ô' so hai danh sách mốc khác nhau, ListingCard không có mốc hàng cuối (r1)**
  Người dùng thấy gì: Bài kiểm có thể không phát hiện nếu hàng cuối của thẻ thuê ngắn hạn bị đặt sai chỗ, nhưng chưa thấy thẻ nào sai.
  Căn cứ: Chỉ là lỗi hiển thị nhỏ nếu xảy ra, thấy ngay bằng mắt và sửa nhanh.
  file: `app/tests/tin-rao-giao-dien.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): ma trận 32 mã dài và '3 trang × query' sau khi tách trang chỉ còn listings/sale, trang rent không có ô (r1)**
  Người dùng thấy gì: Link cũ chứa mã thị trường dài mở sang trang Cho thuê chưa được kiểm tự động, nên nếu hỏng có thể đưa người xem tới sai trang mà không ai biết.
  Căn cứ: Hậu quả thấy được là link cũ mở sai trang, người dùng tự đổi được, nhưng nên có bài kiểm riêng cho trang Cho thuê.
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx`
  severity: low
  Đề xuất: new-contract

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
