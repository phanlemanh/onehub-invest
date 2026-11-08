## Trong hợp đồng

- **Nút «Mở thẻ chờ cũ nhất» không mở được sheet khi bấm ngay trên /ops/review**
  file: `app/src/components/ops/review/review-queue.tsx:929`
  severity: medium
  AC: AC-10
  source: bugs
  detail: ReviewNhip (app/src/components/ops/review/review-nhip.tsx:859-866) có một Link trỏ tới `/ops/review?card=<oldestPendingId>`, tức là chính trang đang mở. Next.js App Router (bản 16.4.2 đã cài) giữ nguyên cây client khi chỉ searchParams đổi: page segment vẫn là `__PAGE__` nên không remount. Trong ReviewQueue, `moBanDau` chỉ được đọc trong hàm khởi tạo của `useState` ở dòng 929-931 (`useState(() => moBanDau?.id != null && items.some(...) ? moBanDau.id : null)`), và không có `key` nào theo `card` (review-content.tsx:512 truyền `moBanDau={docCard(card)}` nhưng không đặt key). Bấm nút thì URL đổi, server render lại với `moBanDau` mới, nhưng `openId` vẫn là `null`, nên sheet không mở. Nút chỉ đổi URL mà không mở thẻ nào. Trạng thái trống này hiện mỗi khi chưa có lượt đo nào trong 7 ngày, nghĩa là lúc mới triển khai ai cũng gặp, nên đây là lối thoát chính của vùng trống. Test OD1-AC-4 (app/tests/ops-duyet-nhip.test.tsx:617) chỉ kiểm thuộc tính href nên không bắt được lỗi. Hướng sửa: đặt `key` cho ReviewQueue theo `card`, hoặc dùng useEffect để đồng bộ openId khi `moBanDau?.id` đổi, hoặc cho nút gọi thẳng setOpenId.
  lý do vào hợp đồng: đi tới ?card=<id> phải mở sẵn sheet thẻ đó; bấm nút ngay trên trang chỉ đổi địa chỉ mà sheet không mở.

- **Hình dạng 5: quét LỚP (xưng hô ở mọi tệp review*) nhưng chỉ có điểm-case, cộng hình dạng 4: không có chiều đỏ XUNG HO**
  file: `app/tests/ops-duyet-nhip.test.tsx:377`
  severity: high
  AC: AC-8
  source: measurement
  detail: E8 hứa: «mọi tệp app/src/components/ops/review* không chứa từ 'bạn' hay 'anh' đứng riêng», chiều đỏ «chữ 'bạn' trở lại → 'XUNG HO'». Dòng 377–378 chỉ ghép `document.body.textContent` với HTML tĩnh của MỘT `ReviewCard` (MAU.ghep). Lúc đó body chỉ còn thẻ MAU.deXuat, vì `ve()` (dòng 81) đặt lại `document.body.innerHTML` mỗi lần dựng, nên chú thích «danh sách + sheet + thẻ» không đúng: danh sách ReviewQueue và sheet đã bị xoá khỏi body trước khi quét. Không có danh sách tệp viết trước để số assert bằng số tệp review*, cũng không đọc nguồn từng tệp. Các nhánh chữ không được dựng (thẻ Người, Đối chiếu, DoneState, Alert, ReviewNhip, review-photos…) lọt ngoài phép đo. Assert `!/(bạn|anh)/.test(chu)` cũng đứng một mình: không có bản chép đột biến chèn «bạn» để chứng minh regex bắt được, nên chiều đỏ 'XUNG HO' mà eval khai không tồn tại.
  lý do vào hợp đồng: AC-8 đòi chữ hàng duyệt không xưng «bạn»/«anh», nhưng phép đo chỉ quét một thẻ nên chưa chứng minh được.

- **Hình dạng 4: assert trung vị «Giữa hai lượt» có điều kiện, không có đối chứng dương nên có thể rỗng nghĩa; cột 'giua' không được kiểm**
  file: `app/tests/ops-duyet-nhip.test.tsx:575`
  severity: medium
  AC: AC-4
  source: measurement
  detail: E4 hứa: fill có since_prev 20/30/40 s → trung vị giữa hai lượt 30, và Frame hiện '30' ở cột Giữa hai lượt. Trong ca: (a) fixture dòng 585–586 gọi route liên tiếp vài mili-giây, nên since_prev ≈ 0 chứ không phải 20/30/40, và không có assert nào ghim giá trị 30; (b) dòng 575 `if (ghi.length > 0) { … assert.equal(f.medianSincePrev, …) }`: nếu route không còn ghi since_prev_seconds thì `ghi` rỗng và phép so bị bỏ qua lặng lẽ, vì không có assert dương rằng `ghi.length > 0` hay `f.medianSincePrev !== null`; (c) phép so lấy kỳ vọng bằng cách tính lại trung vị từ chính các dòng DB, không phải từ ma trận viết trước; (d) phần render chỉ kiểm data-cot 'trung-vi', 'qua-tran', 'cho', không hề kiểm `[data-cot=giua]` (review-nhip.tsx:58). Lời hứa «trung vị giữa hai lượt 30» và «'30' ở cột Giữa hai lượt» vì vậy không được đo.
  lý do vào hợp đồng: AC-4 nêu cột Trung vị giây giữa hai lượt, phép đo có thể bị bỏ qua lặng lẽ và không kiểm cột đó.

- **Hình dạng 2: prop choGhep viết tay đúng khuôn bên đọc, không round-trip từ loadPendingUnitMatches qua trang**
  file: `app/tests/ops-duyet-nhip.test.tsx:681`
  severity: medium
  AC: AC-9
  source: measurement
  detail: E9 hứa DealsGrid và «trang /ops/deals/[offerId] (server component render tĩnh)» có cùng badge và liên kết. Dòng 681 truyền tay `choGhep={{ offer_A: [701] }}` vào DealsGrid, dòng 690 truyền tay `choGhep={[701]}` vào DealBody. Không có ca nào dựng page.tsx thật, nên đường nối viết → đọc mà diff thêm vào không được đo: deals/page.tsx `loadPendingUnitMatches(rows.map(d => d.offerId))` → `choGhep={choGhep}` và deals/[offerId]/page.tsx `choGhep={choGhep[d.offerId]}`. Nếu trang quên truyền prop hay tra sai khoá (ví dụ offerId so với id) thì badge biến mất mà test vẫn xanh, vì fixture đã được nặn sẵn đúng hình dạng component chờ.
  lý do vào hợp đồng: AC-9 đòi lưới, sheet và trang một căn đều hiện badge, nhưng đường nối từ trang tới thành phần chưa được đo.

- **Hình dạng 4: assert âm tính đứng một mình cho bộ lọc «Loại khác»**
  file: `app/tests/ops-duyet-nhip.test.tsx:364`
  severity: medium
  AC: AC-8
  source: measurement
  detail: Sau `chon("Loại thẻ", "Loại khác")`, assert duy nhất là `!ids().includes(2)` (không có thẻ Người). Bộ fixture có sẵn thẻ data_quality khác (MAU.dqKhac, id 10) đáng ra phải xuất hiện, nhưng không có đối chứng dương nào kiểm `ids()` chứa 10. Bộ lọc trả rỗng, hỏng, hay không áp gì mà vẫn loại được id 2 thì test vẫn xanh. Lời hứa của E8 «'Loại khác' ra 0 thẻ Người» chỉ có nghĩa khi đồng thời chứng minh «Loại khác» vẫn ra đúng thẻ loại khác.
  lý do vào hợp đồng: AC-8 đòi bộ lọc «Loại khác» không nhận thẻ Người; test thiếu đối chứng rằng nó vẫn ra đúng thẻ loại khác.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **launch.json: SNAPSHOTS_DIR dùng đường dẫn tuyệt đối riêng máy (/Users/manhphan/...) trên kho công khai, lệch khuôn tương đối của mục liền trước**
  Người dùng thấy gì: Tệp cấu hình chạy thử có tên tài khoản máy của Mạnh, nên chỉ chạy được trên máy này và lộ tên thư mục cá nhân trên kho công khai. Người dùng cổng không bị ảnh hưởng.
  Căn cứ: Không ảnh hưởng người dùng cuối, không lộ dữ liệu tầng A, và sửa hay bỏ sau khi gộp đều rẻ.
  file: `.claude/launch.json`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
