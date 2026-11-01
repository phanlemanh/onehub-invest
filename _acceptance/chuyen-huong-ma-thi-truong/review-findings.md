# Review findings: chuyen-huong-ma-thi-truong (round 1)

## Trong hợp đồng

- **Eval E4 và AC-3 đòi kiểm trang phường, nhưng itest không gọi trang phường ở hai ca này**
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx:238`
  severity: medium
  AC: AC-4
  source: bugs
  detail: evals.yaml E4 ghi rõ `/vn/hanoi, /vn/hcmc, /vn/hanoi/listings, một trang phường Hà Nội thật trả phần tử trang, không ném`, và AC-4 cũng nêu `trang phường Hà Nội`. Ca CHM-AC-4 (dòng 238-242) chỉ gọi trang thị trường hanoi/hcmc và listing của hanoi, không gọi trang phường nào. Trong toàn tệp, trang [submarket] chỉ được gọi một lần, ở ca AC-2 `sau`, với mã dài (dòng 217-218). AC-3 cũng đòi `cùng các đường mã dài ở AC-2` (gồm `/vn/<tỉnh>/<phường>`) hiện như hôm nay trước 064, nhưng ca dòng 185 chỉ gọi trang thị trường và listing. Vì vậy các nhánh mới của [submarket]/page.tsx (mã thường, mã dài trước 064, mã dài không đích) không có phép đo nào. E3, E4 vẫn xanh, nên bằng chứng E4 khẳng định một điều chưa hề chạy. Cách sửa: thêm ca trang phường Hà Nội thật ở cả hai trạng thái, ca /vn/thanh-pho-da-nang/<slug> trên DB trước, và ca mã không đích ra 404.

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): E4/AC-4 liệt kê trang phường Hà Nội nhưng không ca nào gọi trang đó**
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx:238`
  severity: high
  AC: AC-4
  source: measurement
  detail: E4 ghi rõ phần tử phải trả về: '/vn/hanoi, /vn/hcmc, /vn/hanoi/listings, một trang phường Hà Nội thật trả phần tử trang, không ném'. AC-4 cũng nêu 'trang phường Hà Nội'. Test CHM-AC-4 (dòng 238-242) chỉ gọi market với hanoi/hcmc và listings với hanoi. Trang PG.submarket chỉ được nạp ở dòng 217-218, trong khối TT === 'sau', và chỉ với mã dài Đà Nẵng. Ca đếm truy vấn (dòng 248) cũng chỉ có market và listings. Vì vậy trang phường, tệp có nhánh mới ở page.tsx, không có đo nào cho mã thường. E4 xanh sẽ xác nhận một phần tử trong danh sách mà test không chạy. Danh sách này không có số assert tương ứng để lộ chỗ thiếu.

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): AC-8 nói 'mọi route ở AC-6 và AC-7', nhưng mã không đích và ca đếm truy vấn chỉ đo 2 route**
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx:314`
  severity: medium
  AC: AC-8
  source: measurement
  detail: AC-8 đặt lời hứa trên 'mọi route ở AC-6 và AC-7' (5 ô app + 9 ô data-api): mã không đích trả như hôm nay, và mã không mang tiền tố dài không phát sinh truy vấn thêm. Test chỉ có các điểm sau. App: /api/v1/listings?market=vn-tinh-khong-co và đếm vn-hanoi trên listings (dòng 314-322). Data-api: /v1/markets/vn-tinh-khong-co, /v1/listings?market=vn-tinh-khong-co và đếm /v1/markets/vn-hanoi (dòng 414-429). Asset-stats, deals, offers, /submarkets, /insights và các ô ?area không có ca mã không đích hay ca đếm nào. Mỗi route tự viết lời gọi giaiMaKhuVuc, nên một route tra thêm truy vấn hoặc đổi hành vi với mã không đích vẫn xanh. O_APP và O_API đã là ma trận viết sẵn, nhưng hai test này không lặp trên chúng.

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): lời hứa 3 trang × query × trạng thái DB chỉ đo ở vài ô; ?tab=x chỉ có trên trang thị trường, trang phường không có ca DB 'trước'**
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx:220`
  severity: medium
  AC: AC-3
  source: measurement
  detail: AC-2 hứa chuyển hướng ở trang thị trường, listing và phường 'giữ đoạn con và query'. Ba tệp page.tsx mỗi tệp tự nối noiQuery(..., await searchParams), nhưng ca ?tab=x duy nhất ở dòng 220 chỉ gọi trang market. Các kiemChuyen của listings (dòng 194) và submarket (dòng 218) truyền sp = {}, nên một trang bỏ query vẫn xanh. AC-3 yêu cầu 'cùng các đường mã dài ở AC-2' ở DB trước 064, nhưng test phường nằm trong if (TT === 'sau') ở dòng 210. Vì vậy /vn/thanh-pho-da-nang/<phường> ở DB trước không được đo. Nhánh mới của trang phường khi mã dài có đích mà phường không có dưới mã mới (rơi xuống notFound) cũng không có ca nào. Không có ma trận trang × trạng thái × query viết trước.

- **Hình dạng 4 (không có đối chứng dương): Lợi suất chỉ so bằng nhau, nhánh 'trùng trang mặc định' chỉ in log; ở DB 'trước' hai vế là cùng một lời gọi**
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx:278`
  severity: medium
  AC: AC-5
  source: measurement
  detail: E5 và AC-5 hứa Lợi suất 'chọn đúng thị trường' Đà Nẵng. Dòng 274-276 chỉ assert tuanTu(?area=DAI) === tuanTu(?area=M). Phép so với trang mặc định yDef ở dòng 277-278 chỉ đi vào console.log, và câu log chấp nhận sẵn kết quả 'trùng trang mặc định'. Không có assert nào đọc thị trường đã chọn hoặc yêu cầu khác yDef, trong khi Finder có assert fDai.market ở dòng 270 và So sánh có c1.ids ở dòng 282. Trang bỏ qua hoàn toàn ?area vẫn xanh vì yDai = yM = yDef. Ở DB 'trước', M === DAI nên hai vế là cùng một URL và phép so không đo gì, dù AC-5 hứa 'chọn đúng thị trường mã dài'. Lưu ý độ chính xác: ở DB sau với dữ liệu hiện tại, phép so có phân biệt được việc bỏ giaiMaKhuVuc, vì collation C.UTF-8 xếp 'Thành phố Hà Nội' trước 'Thành phố Đà Nẵng' nên mặc định là Hà Nội. Khả năng phân biệt này phụ thuộc thứ tự tên, không được test ghim.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **/yield?market=a&market=b mới sập 500: tham số URL mảng đi thẳng vào giaiMaKhuVuc mà không kiểm kiểu**
  Người dùng thấy gì: Nếu ai đó mở trang Ước tính lợi suất với tham số thị trường bị lặp hai lần trên đường dẫn, trang báo lỗi thay vì hiện bình thường. Người dùng thường hầu như không gặp.
  Căn cứ: Chỉ xảy ra với đường dẫn bị sửa tay bất thường, người dùng bỏ phần thừa rồi tải lại là xong, và không mất dữ liệu.
  file: `app/src/app/(app)/yield/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **E9 khai paths chỉ gồm scope.sh nên thước phạm vi và typecheck data-api không cũ đi khi code đổi**
  Người dùng thấy gì: Bằng chứng về phạm vi thay đổi có thể bị coi là còn mới dù sau đó code đã đổi. Người dùng cuối không bị ảnh hưởng trực tiếp.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của khâu kiểm nội bộ, không ảnh hưởng người dùng, và sửa lại rẻ khi cần.
  file: `_acceptance/chuyen-huong-ma-thi-truong/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **E8 cam kết các ca API app nhưng lệnh chm_api không chạy ca nào của app**
  Người dùng thấy gì: Một bản ghi bằng chứng ghi nhiều hơn những gì lệnh của nó thực sự chạy. Người dùng cuối không thấy gì.
  Căn cứ: Các ca đó vẫn chạy ở chế độ khác nên chỉ là sai lệch ghi chép nội bộ, không ảnh hưởng người dùng và sửa dễ.
  file: `_acceptance/chuyen-huong-ma-thi-truong/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Danh sách cho phép của scope.sh có glob khớp cả route ops thuộc T3**
  Người dùng thấy gì: Phép kiểm phạm vi có thể bỏ sót một thay đổi ngoài danh sách cho phép. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Không có tệp ngoài hợp đồng nào bị chứng minh là đã đổi, nên rủi ro chỉ là bỏ sót trong tương lai và dễ chặn.
  file: `_acceptance/chuyen-huong-ma-thi-truong/probes/scope.sh`
  severity: low
  Đề xuất: known-limits

- **Định danh và tên tệp mới bằng tiếng Việt trái quy ước đặt tên code tiếng Anh**
  Người dùng thấy gì: Một số tên trong mã nguồn viết bằng tiếng Việt thay vì tiếng Anh. Người dùng không thấy khác biệt.
  Căn cứ: Chỉ là vấn đề thẩm mỹ mã nguồn, không ảnh hưởng người dùng, và đổi tên lúc này tốn công ở cả repo công khai.
  file: `data-api/src/lib/ma-thi-truong.ts`
  severity: low
  Đề xuất: wont-fix

- **E12 lọc bỏ dòng đỏ cấp tệp, nên tệp test mới vỡ lúc nạp vẫn cho APP TEST PASS khi bộ test có sẵn ca đỏ**
  Người dùng thấy gì: Phép kiểm không thêm lỗi test mới có thể báo xanh nhầm trong một tình huống hẹp. Người dùng cuối không thấy ngay.
  Căn cứ: Chỉ làm mù một lớp kiểm nội bộ trong trường hợp hẹp, không gây hại trực tiếp cho người dùng.
  file: `scripts/chuyen-huong-ma-thi-truong/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **/yield?market=a&market=b giờ ném TypeError, trước thay đổi vẫn hiện trang**
  Người dùng thấy gì: Mở trang Ước tính lợi suất với tham số thị trường lặp hai lần sẽ báo lỗi, trong khi trước đây vẫn hiện trang. Chỉ gặp với đường dẫn bất thường.
  Căn cứ: Hiếm gặp, tải lại với đường dẫn đúng là hết, không mất dữ liệu.
  file: `app/src/app/(app)/yield/page.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): các ô ?area= xanh nhờ dòng cấp thị trường do fixture tự tạo, không qua writer; ô đo được khác ô E6 đã khai**
  Người dùng thấy gì: Dữ liệu thử dựng tay nên chưa chứng minh được đường từ phường đến số liệu thật. Người dùng cuối không thấy ngay.
  Căn cứ: Rủi ro đã được ghi nhận từ trước, chỉ làm yếu bằng chứng chứ không cho thấy lỗi thật.
  file: `scripts/chuyen-huong-ma-thi-truong/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (không ghim thông điệp): các chiều đỏ evals hứa 'đỏ ghim ...' không đo thông điệp của phép đo thật**
  Người dùng thấy gì: Thông báo lỗi của phép kiểm đột biến không chỉ rõ đúng điểm hỏng. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Việc phát hiện lỗi vẫn hoạt động, chỉ thiếu độ chi tiết thông điệp và không đáng công sửa.
  file: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 2/14 lỗi rơi vào file không bộ đo nào phủ (_acceptance/chuyen-huong-ma-thi-truong/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
