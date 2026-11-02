## Trong hợp đồng

- **Phép băm ND-AC-7 ghi «mọi bảng bộ đọc có thể chạm» nhưng bỏ sót hai bảng mà CONTEXT_SQL đọc**
  AC: AC-7
  file: `app/tests/the-duyet-hien-nguoi-dang.test.tsx:525`
  severity: low
  source: bugs
  detail: `BANG_BAM` gồm review_queue, sale_offer_records, party_roles, registry_aliases, parties, registry_events. `CONTEXT_SQL` còn đọc `stg_zalo_posts` và `stg_chotot_ads` (review-context.ts dòng 62 và 67), hai bảng này cũng có trong lược đồ tạm (`BANG_GHI`). Một bộ đọc ghi nhầm vào hai bảng đó vẫn làm ca xanh, trong khi AC-7 hứa «mọi bảng không đổi» và comment dòng 524 khẳng định đã phủ hết. Thêm hai tên này vào `BANG_BAM` là đủ. Đây là lỗ hổng đo, không phải lỗi đang chạy: đọc mã hiện tại không thấy lệnh ghi nào.

- **Hình dạng 5 — lớp «nhãn khác Không so được thì không hiện cờ» chỉ có một điểm-case, không phân biệt được hai điều kiện của cờ tên gọi**
  AC: AC-4
  file: `app/tests/the-duyet-hien-nguoi-dang.test.tsx:412`
  severity: medium
  source: measurement
  detail: AC-4 hứa cờ chỉ hiện khi «thẻ khác nguồn nhãn Không so được», và «nhãn khác Không so được thì không hiện cờ». Code là `khacNguon = so === "khong_so" && a !== null && b !== null && a.source !== b.source` (review-can-cu.ts, soNguoiDang). Phía không-cờ của lớp này chỉ có dòng 412: S03↔S03 nhãn Lệch. Ca đó sai ở CẢ HAI điều kiện nên không đo riêng điều kiện nào. Toàn bộ CO_TEN (dòng 407) là S05↔S06 nhãn khong_so, sai ở cả hai điều kiện đều không đổi kết quả. Suy từ đọc code, chưa chạy đột biến: (a) bỏ `so === "khong_so"` thì Khớp hoặc Thiếu khác nguồn vẫn có cờ, ca vẫn xanh. (b) bỏ `a.source !== b.source` thì thẻ cùng nguồn «Cùng SĐT» nhãn khong_so có cờ, ca vẫn xanh. kiemAc3 và DAU_CUOI không đọc tenGoi hay [data-review-ten-goi]; ND-AC-8 chỉ đếm cờ để in, không assert. Thiếu các phần tử viết trước: Khớp khác nguồn, Thiếu khác nguồn, Không so được cùng nguồn; mỗi phần tử cần kèm toàn văn có tên, để đối chứng với ca dương.

- **Hình dạng 5 — lớp «tên chỉ là một phần của từ khác» chỉ có điểm-case phía sau tên, ranh giới phía trước không được đo**
  AC: AC-4
  file: `app/tests/the-duyet-hien-nguoi-dang.test.tsx:399`
  severity: low
  source: measurement
  detail: AC-4 hứa tên nằm trong từ khác thì không có cờ. timTenGoi dùng hai ranh giới: lookbehind trước tên và lookahead sau tên. Trong CO_TEN, ca dựa vào ranh giới là «Hoa» + «chị Hoan» (dòng 401), chỉ lookahead chặn được. Ca «An» + «Thanh» (dòng 400) đã null vì phân biệt hoa thường, nên không đo ranh giới. Đột biến KHOP GIUA TU (dòng 422-425) gỡ cùng lúc cả hai ranh giới nên đỏ nhờ riêng lookahead. Suy từ đọc code, duyệt tay từng dòng CO_TEN, chưa chạy: bỏ riêng lookbehind thì cả 9 dòng CO_TEN, dòng 412 và ca DOM dòng 421 vẫn xanh. Khi đó tên kết thúc bằng «Anh» gặp «XANH» hoặc «THANH» trong văn bản viết hoa sẽ bật cờ sai, vì nhánh `x.toUpperCase()` khớp «ANH» ở cuối từ và lookahead không chặn. Ma trận thiếu một phần tử có tên ở cuối từ khác.

- **Hình dạng 5 — phép băm tuyên «mọi bảng bộ đọc có thể chạm» nhưng danh sách bỏ sót hai bảng bộ đọc thực sự đọc**
  AC: AC-7
  file: `app/tests/the-duyet-hien-nguoi-dang.test.tsx:525`
  severity: low
  source: measurement
  detail: Comment dòng 524 ghi «Mọi bảng bộ đọc có thể chạm, trong lược đồ tạm», và AC-7 hứa «mọi bảng không đổi». BANG_BAM (dòng 525) chỉ có review_queue, sale_offer_records, party_roles, registry_aliases, parties, registry_events. CONTEXT_SQL lại đọc thêm stg_zalo_posts và stg_chotot_ads, hai bảng này đều nằm trong lược đồ tạm (BANG_GHI dòng 126) nhưng không được băm. Danh sách cũng không được đối chiếu với tập bảng thật của lược đồ, nên bản chép bộ đọc ghi vào hai bảng ấy vẫn qua dòng 576. Đối chứng dương dòng 578-582 chỉ ghi review_queue, nên chỉ chứng minh phép băm biết đỏ ở bảng đó. Lời tuyên về lớp bảng vì thế không khớp với danh sách thực đo.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hàng Người đăng hiện một bí danh tên không liên quan tới tin khi người có nhiều tên, và E12 chấm PASS trên ảnh đang lộ lỗi này**
  Người dùng thấy gì: Khi một người đăng có nhiều tên, thẻ có thể hiện một tên khác hẳn tên ghi trên tin, kèm địa danh khác khu vực của tin. Người duyệt nhìn thẻ hỏi «Cùng căn?» sẽ thấy tên lạ, và cờ tên gọi cũng dò theo tên lạ đó.
  Căn cứ: Hiện thật trên 4 trong 7 thẻ đang chờ và làm người duyệt hiểu nhầm, nhưng không mất dữ liệu và quyết định không bị ghi sai; sửa cần chọn quy tắc hiển thị tên nên hợp đồng riêng hợp lý hơn.
  file: `app/src/lib/ops/review-context.ts`
  severity: medium
  Đề xuất: new-contract

- **Hàng Người đăng hiện tên người bán chưa qua bộ che tên nguồn thật (tầng A) (r1)**
  Người dùng thấy gì: Trên thẻ duyệt, tên người đăng hiếm khi có thể chứa tên thật của một nguồn thu, thứ lẽ ra chỉ được hiện bằng mã nguồn. Người duyệt nội bộ có thể thấy tên nguồn thật ở chỗ không được phép.
  Căn cứ: Đây là lộ thông tin nhạy cảm nội bộ nhưng chỉ ở màn Ops, ít trường hợp (đo được 1 tin), không ra ngoài; sửa rẻ nên đáng làm thành việc riêng ngay.
  file: `app/src/lib/ops/review-context.ts`
  severity: high
  Đề xuất: new-contract

- **ContextQuery bị nới từ dòng có kiểu sang any[], kết quả truy vấn được ép kiểu không kiểm (r1)**
  Người dùng thấy gì: Không ảnh hưởng gì người duyệt thấy; chỉ làm việc kiểm tra kiểu của lập trình viên lỏng hơn ở một chỗ.
  Căn cứ: Không có hậu quả với người dùng, không mất hay lộ dữ liệu, chỉ là nợ kỹ thuật nhẹ có thể dọn sau.
  file: `app/src/lib/ops/review-context.ts`
  severity: low
  Đề xuất: known-limits

- **Badge «Đăng n tin» dưới tên người neo hiện số của người khác khi người neo từ 10 tin và người kia nhiều tin hơn (r1)**
  Người dùng thấy gì: Khi một tin có nhiều người đăng, ô có thể ghi «Đăng 40 tin» ngay dưới tên một người chỉ có 15 tin, nên người duyệt có thể đọc nhầm số tin của người đó.
  Căn cứ: Gây hiểu nhầm khi duyệt nhưng chỉ ở tin nhiều người đăng (16 tin S03 đo được), không mất dữ liệu và người duyệt vẫn còn thông tin khác để đối chiếu.
  file: `app/src/components/ops/review/review-compare.tsx`
  severity: medium
  Đề xuất: new-contract

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
