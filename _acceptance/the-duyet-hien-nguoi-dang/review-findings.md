## Trong hợp đồng

- **Hình dạng 3 — assert «chuỗi có mặt» cho căn cứ của vai: câu «chưa ghi căn cứ» cũng làm ca xanh**
  file: `app/tests/the-duyet-hien-nguoi-dang.test.tsx:256`
  severity: medium
  AC: AC-1
  source: measurement
  detail: `assert.ok(chuO(a, "[data-review-can-cu]"), "ND-AC-1 thiếu căn cứ của vai")` chỉ đòi chuỗi khác rỗng, và đây là chỗ duy nhất trong tệp đọc `data-review-can-cu`. `ONguoi` luôn in `nhanCanCu(neo.canCu)`, mà `nhanCanCu(undefined)` trả `CHUA_CAN_CU_TIN` («Chưa ghi căn cứ — đọc từ tin»), cũng khác rỗng. Nếu `nguoiCuaTin`/`docCanCu` làm rơi căn cứ, hoặc tier/method bị đọc sai, ô hiện «chưa ghi căn cứ» mà ca vẫn xanh. Đó là điều ngược lại với AC-1. Lời hứa là quan hệ giữa ô và vai trong `party_roles`: nd_a1 do dungNguoi ghi source_field/fact nên ô phải bằng `nhanCanCu({lop:"fact",phuongPhap:"source_field"})`. AC-1 nói «mỗi ô», nhưng căn cứ của ô B không được kiểm, kể cả mức có mặt.
  rationale: AC-1 hứa mỗi ô hiện căn cứ của vai nhưng ca đo không phân biệt căn cứ thật với câu «chưa ghi căn cứ».

- **Hình dạng 3 — assert tên/SĐT có mặt, nhưng dữ liệu thử không phân biệt người neo trong danh bạ với chữ trên tin**
  file: `app/tests/the-duyet-hien-nguoi-dang.test.tsx:254`
  severity: medium
  AC: AC-6
  source: measurement
  detail: `ONguoi` hiện `neo?.ten ?? ben.ten` và `ben.sdt ?? neo?.sdts[0]`. Lời hứa của AC-6 và E6 là quan hệ: «ô hiện người có bí danh tai_khoan_nguon bằng seller_ref». Mọi assert `data-review-nguoi-ten` đều không đo được quan hệ này. Dòng 254: nd_a1 có `seller_name` trùng bí danh, cùng là «Nguyễn Văn Minh», nên đổi thành `ben.ten` vẫn xanh. Dòng 494: tin không có người. Dòng 506-507: đều mong «—», mà tin nd_u1/nd_u2 có tên «unknown» bị lọc nên đổi như trên vẫn ra «—». Ca AC-6 kiểm người neo ở tầng ngữ cảnh (dòng 453, `m.ds[0].partyKey`), còn trên DOM chỉ kiểm «+2 người khác» (dòng 455), dù E6 ghi «ô hiện người đó». nd_m1 không có `seller_name` nên đúng là chỗ phân biệt được, nhưng ca không đọc tên ở đó. Vì vậy cả nhánh `neo?.ten` và cột `ten` lấy từ registry_aliases trong `NGUOI_SQL` có thể gãy mà không ca nào đỏ. Nhánh `neo?.sdts[0]` của ô cũng không được đo: dòng 255 và 495 lấy số trên tin, dòng 257 là «Chưa có SĐT».
  rationale: AC-6 hứa ô hiện người có bí danh khớp seller_ref, nhưng ca không đo được quan hệ này trên màn thẻ.

- **Hình dạng 4 — băm «không đổi» âm tính một mình: review_queue rỗng, không có đối chứng dương, không phủ «mọi bảng»**
  file: `app/tests/the-duyet-hien-nguoi-dang.test.tsx:479`
  severity: medium
  AC: AC-7
  source: measurement
  detail: `assert.deepEqual(await bam(), truoc, "ND-AC-7 đọc thẻ làm đổi dữ liệu")` (dòng 518) so hai lần băm. `review_queue` trong lược đồ tạm không hề có dòng: tệp test không INSERT, `dungNguoi` (pipeline/lib/danh-ba-nguoi.mjs) không nhắc tới bảng này, và thẻ dựng trong bộ nhớ qua `theGhep`. Thành phần `q` vì thế luôn là md5('') ở cả hai lần, nên lời hứa «evidence không đổi» của AC-7 không được đo. `bam()` cũng chỉ băm 3 bảng trong khi AC-7 hứa «mọi bảng»: `registry_aliases`, `parties`, `registry_events` không nằm trong băm. Đây là bảng chữ `backend-effect` duy nhất cho chiều không ghi, nhưng không có bản chép đột biến nào có ghi để chứng minh phép băm biết đỏ, khác với các ca khác trong tệp đều có chiều đỏ ghim thông điệp.
  rationale: AC-7 hứa evidence và mọi bảng không đổi sau khi mở thẻ, nhưng phép đo không phủ và không biết đỏ.

- **Hình dạng 5 — hợp đồng tuyên ma trận 9 phần tử qua loadReviewContext và thẻ thật, nhưng đầu-cuối chỉ có điểm-case**
  file: `app/tests/the-duyet-hien-nguoi-dang.test.tsx:322`
  severity: medium
  AC: AC-3
  source: measurement
  detail: AC-3 hứa ma trận 9 phần tử «tính nhãn So của hàng qua `loadReviewContext` và thẻ thật». `kiemAc3` chạy cả 9 phần tử, nhưng chỉ trên hàm thuần `soNguoiDang` với `BenNguoi` viết tay bằng `ben()/nd()`. Ca đầu-cuối (dòng 342-356) chỉ có 3 điểm: Khớp, Lệch, Cùng SĐT. Phần tử «hai tin nhiều người có một người chung → Khớp kèm tên người chung» và «cùng nguồn một bên chỉ có SĐT → Thiếu» không có ca nào đi từ danh bạ dựng thật tới thẻ thật. Dòng 350 còn chỉ match /Cùng người trong danh bạ/, không ghim tên, nên «kèm tên» cũng không được đo đầu-cuối. E3 đã ghi hẹp lại đúng phần này so với AC-3, nên không có ma trận toàn phần viết trước ở tầng mà hợp đồng tuyên.
  rationale: AC-3 hứa ma trận 9 phần tử qua loadReviewContext và thẻ thật, nhưng đầu-cuối chỉ có 3 điểm.

- **Hình dạng 4 — ca «chỉ Badge, không chữ phụ» chỉ assert vế âm**
  file: `app/tests/the-duyet-hien-nguoi-dang.test.tsx:430`
  severity: low
  AC: AC-5
  source: measurement
  detail: Comment dòng 428 nói «Người neo từ 10 tin, người kia nhiều hơn: chỉ Badge, không chữ phụ», nhưng ca chỉ có `assert.equal(neoLon.querySelector("[data-review-so-tin]"), null, ...)`. Không có assert Badge tồn tại, cũng không ghim `Đăng 40 tin`. Đây là tổ hợp duy nhất có neo ≥10 và người khác có số lớn hơn, nên lời hứa AC-5 «Badge ... số của người ấy» không được đo ở nhánh này. Ô không có Badge, hoặc Badge mang số của người neo (15), vẫn qua ca này.
  rationale: AC-5 hứa Badge mang số của người ấy ở nhánh người neo từ 10 tin, nhưng ca không đo Badge tồn tại hay số.

- **Hình dạng 4 — kiểm nút quyết bằng `.every` không ghim số nút, danh sách rỗng làm cả hai chiều xanh**
  file: `app/tests/the-duyet-hien-nguoi-dang.test.tsx:516`
  severity: low
  AC: AC-7
  source: measurement
  detail: `(await nutCuaThe(...)).slice(0, 2).every(Boolean)` (dòng 516) và `.slice(0, 2).every((t) => !t)` (dòng 517) đều đúng hiển nhiên khi mảng rỗng. `nutCuaThe` lấy nút bằng selector `[data-review-actions] button` và không có assert nào về số nút. Nếu selector hay thuộc tính đổi, cả cặp «tắt khi chưa có lý do / bật khi có lý do» vẫn xanh mà không đo gì. Ca thiếu đối chứng dương kiểu `nut.length >= 2`. Về của AC-7 «nút chỉ phụ thuộc ... tin rời kho» cũng không có assert nào trong ca này.
  rationale: AC-7 hứa nút quyết chỉ phụ thuộc lý do và tin rời kho, nhưng ca đo có thể xanh khi không có nút nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hàng Người đăng hiện tên người bán chưa qua bộ che tên nguồn thật (tầng A)**
  Người dùng thấy gì: Trên thẻ duyệt, tên người đăng hiếm khi có thể chứa tên thật của một nguồn thu, thứ lẽ ra chỉ được hiện bằng mã nguồn. Người duyệt nội bộ có thể thấy tên nguồn thật ở chỗ không được phép.
  Căn cứ: Đây là lộ thông tin nhạy cảm nội bộ nhưng chỉ ở màn Ops, ít trường hợp (đo được 1 tin), không ra ngoài; sửa rẻ nên đáng làm thành việc riêng ngay.
  file: `app/src/lib/ops/review-context.ts`
  severity: high
  Đề xuất: new-contract

- **ContextQuery bị nới từ dòng có kiểu sang any[], kết quả truy vấn được ép kiểu không kiểm**
  Người dùng thấy gì: Không ảnh hưởng gì người duyệt thấy; chỉ làm việc kiểm tra kiểu của lập trình viên lỏng hơn ở một chỗ.
  Căn cứ: Không có hậu quả với người dùng, không mất hay lộ dữ liệu, chỉ là nợ kỹ thuật nhẹ có thể dọn sau.
  file: `app/src/lib/ops/review-context.ts`
  severity: low
  Đề xuất: known-limits

- **Badge «Đăng n tin» dưới tên người neo hiện số của người khác khi người neo từ 10 tin và người kia nhiều tin hơn**
  Người dùng thấy gì: Khi một tin có nhiều người đăng, ô có thể ghi «Đăng 40 tin» ngay dưới tên một người chỉ có 15 tin, nên người duyệt có thể đọc nhầm số tin của người đó.
  Căn cứ: Gây hiểu nhầm khi duyệt nhưng chỉ ở tin nhiều người đăng (16 tin S03 đo được), không mất dữ liệu và người duyệt vẫn còn thông tin khác để đối chiếu.
  file: `app/src/components/ops/review/review-compare.tsx`
  severity: medium
  Đề xuất: new-contract

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
