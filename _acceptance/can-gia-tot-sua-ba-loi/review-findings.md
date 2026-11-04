# Review findings: can-gia-tot-sua-ba-loi (round 2)

## Trong hợp đồng

- **Bằng chứng E7 chụp bằng tài khoản Quản trị, trong khi AC-5 và E7 hứa vai Vận hành**
  file: `_acceptance/can-gia-tot-sua-ba-loi/evidence/E7-ly-do-man.png`
  severity: medium
  AC: AC-5
  source: conventions
  detail: AC-5 ghi «vai Vận hành mở trang», còn expected của E7 ghi «đăng nhập tài khoản thử vai ops». Ba frame E7-ten.png, E7-ly-do-man.png và E7-crumb-bang.png hiện rõ ở chân thanh bên «ops-test@local.test · Quản trị»; hai frame còn lại không thấy thanh bên. Theo scripts/dev-ops-account.mjs, đó là tài khoản admin mặc định. Vai ops thật là ops-role-test@local.test, chạy bằng `--vai ops`. Frame CG1 E9-step4c-trang-mot-can.png dùng đúng tài khoản này và hiện «Vận hành». Vì vậy E7 PASS chứng minh hành vi ở vai admin, không phải vai mà hợp đồng hứa. Cần chụp lại bằng tài khoản vai ops (làm cùng lúc với việc che dữ liệu), hoặc sửa AC-5, E7 nếu cố ý dùng admin.

- **Phép quét «unknown» của CGB-AC-1 không thấy chữ này khi nó nằm ngay sau nhãn, nên hàng «Tên» trong thân sheet không được đo**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:1056`
  severity: medium
  AC: AC-1
  source: bugs
  detail: `coChuGiuCho` đòi ký tự trước và sau `unknown` không phải chữ cái, nhưng nó quét `textContent`, thứ nối các phần tử không có khoảng trắng. Component `Dong` ở `deal-body.tsx:24-26` vẽ `<dt>Tên</dt><dd>{value}</dd><dt>SĐT</dt>`, nên chuỗi quét có dạng `TênunknownSĐT`. Chạy thử regex: `TênunknownSĐT0966` → false, `Người đăngunknown1 tin` → false, chỉ `Tên unknown SĐT` → true. Vì vậy hai assert âm ở dòng 1075 (sheet) và 1078 (trang) xanh ngay cả khi ô Tên hiện đúng chữ `unknown`. Trang: `dong("Tên")` và `soDong` vẫn đo dương. Footer sheet: assert mới so span tên. Hàng «Tên» trong thân sheet (`DealBody beMat="sheet"`): không có assert dương nào, nên phép quét mù này là phép đo duy nhất. E1 hứa «quét cả ba bề mặt của mọi dòng 0 chữ unknown đứng làm tên», nhưng hàng bảng không được quét, và ở sheet với trang phép quét bỏ sót đúng vị trí cần bắt. Đối chứng đỏ chỉ đi qua loader (`hong.getDeals()`), không chạy `coChuGiuCho` trên bề mặt đột biến. Hướng sửa: quét từng nút lá (so `textContent` của mọi `dd` và `span` với `/^\s*unknown\s*$/i`), hoặc so dương `sheet.querySelector('[data-deal-dong="Tên"] dd')`; kèm một đối chứng đỏ chạy phép quét trên bề mặt có `unknown` thật.

- **Hình dạng 5 — Tuyên quét lớp nhưng chỉ có điểm-case: CGB-AC-3 hứa «cả 33 căn ở từng nơi chạy», nhưng viewer chỉ đo 3 căn, cloud chỉ đo 5 căn**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:1188`
  severity: medium
  AC: AC-3
  source: measurement
  detail: E3 ghi «đo quan hệ... trên cả 33 căn ở từng nơi chạy» và «lặp ở vai viewer và lược đồ cloud»; tên ca cũng ghi «trên cả 33 căn». Chỉ dòng 1185 chạy đủ BA_MUOI_BA (ops, máy thu). Dòng 1188 (viewer) liệt tay [b01, b31, r-roi], thiếu cả hạng 30 (b30) lẫn căn cần xác minh (s-xm) của Trục C. Dòng 1207 (cloud) liệt tay 5 mã, và cloud không chạy ở vai viewer. Số assert ở hai nơi này không bằng số phần tử của ma trận đã khai. AC-3 còn hứa «?can= của căn ngoài danh sách vẫn chuyển sang trang một căn; đúng như vậy trên lược đồ cloud và ở vai Người xem», nhưng `vaoRedirect(ds, ..., "b31")` chỉ có ở dòng 1187, vai ops trên máy thu. Trong `kiemCrumb`, dòng 1163 bỏ qua vaoRedirect khi crumb không có ?can=, nên căn ngoài danh sách luôn so "" với "" và không đo gì về chuyển hướng ở viewer hay cloud.

- **Hình dạng 5 — Tuyên quét lớp nhưng chỉ có điểm-case: phần đếm nhiều tên của CGB-AC-6 chỉ đo trên đường hàm, không đo route và thẻ**
  file: `app/tests/tin-rao-cong-khai.test.tsx:486`
  severity: medium
  AC: AC-6
  source: measurement
  detail: Tên ca ghi «ma trận tên qua hàm, route và vùng máy chủ thật; unknown không tính là một tên». Trục F khai «hàm | route | vùng máy chủ; đếm nhiều tên có và không có chữ giữ chỗ». AC-6 hứa tài khoản hai tên giữ tên, tài khoản ba tên về nhãn. Các assert trên hai tài khoản này (dòng 486-488) nằm trong `kiemTenInvest`, tức chỉ đi qua `getPublicOffers`. Vòng lặp route và thẻ ở thân ca chỉ duyệt tám dòng `ten-i`: không `api.data` nào so hai-that hay ba-that, và không thẻ nào được kiểm có «Hai A» hay nhãn «Tài khoản nhiều tên». Nếu thẻ hoặc route xử lý sai `sellerManyNames`, ca vẫn xanh. Đối chứng `demCa` cũng chỉ ném trên đường hàm. Fixture đếm chỉ có đúng chữ `unknown`, nên các nhánh `lower(btrim())` và `''` của điều kiện SQL không có dòng nào đo; đột biến rút điều kiện về `seller_name <> 'unknown'` vẫn xanh.

- **Hình dạng 5 — Tuyên quét lớp nhưng chỉ có điểm-case: AC-1 trên cloud chỉ đo một ô ở hàng bảng, không đo sheet, trang, và không quét 0 chữ unknown**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:1114`
  severity: low
  AC: AC-1
  source: measurement
  detail: AC-1 hứa ở mọi bề mặt rằng «trên lược đồ cloud unknown không hiện», Trục D ánh xạ Cloud sang AC-1, và E1 ghi «lược đồ cloud: ... căn unknown 0 chữ unknown». Sau `dungCloud`, ca chỉ có `cl.html().includes(BAN)` (dòng 1113) và `oTenHang("m1") === "Chưa có tên"` (dòng 1114). Không có `coChuGiuCho` nào quét trang cloud, không mở `?can=m1` hay trang một căn trên cloud, và cloud chỉ có một giá trị `unknown` trong khi ma trận khai năm giá trị chữ giữ chỗ hoặc rỗng. Phép «0 chữ unknown» mà E1 khai không tồn tại trong mã.

- **Hình dạng 3 — Assert «chuỗi có mặt» trong khi lời hứa là nguyên câu: CGB-AC-2 trên page thật dùng includes, và phép cấm «Giảm/dưới ngưỡng» không chạy trên đầu ra của page**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:1140`
  severity: low
  AC: AC-2
  source: measurement
  detail: E2 ghi «so nguyên câu trong [data-deal-roi]», AC-2 hứa lý do của căn số âm «không có Giảm và dưới ngưỡng». Trên page, dòng 1140 chỉ có `nhan.includes(m.cau)`, dòng 1149 (cloud) cũng vậy; `nhan` là textContent của cả Alert, gồm tiêu đề và mô tả. So bằng tuyệt đối chỉ có ở loader (`deal?.roiDanhSach`), và `kiemLyDo` (dòng 1137) cũng chỉ nhận giá trị loader, không nhận chữ đã vẽ. Nếu page ghép thêm chữ vào Alert, ví dụ một câu «Giảm 20%, dưới ngưỡng 5%» bên cạnh câu đúng, ca vẫn xanh trên cả máy thu lẫn cloud.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Năm frame E7 đưa dữ liệu thật không che lên kho công khai: chữ bài gốc, ảnh tin, SĐT, tên người bán**
  Người dùng thấy gì: Ảnh chụp màn hình dùng làm bằng chứng đang để lộ nguyên văn bài gốc, ảnh tin rao và số điện thoại thật trên kho mã công khai, mà bình thường những thứ này chỉ người vận hành đăng nhập mới thấy.
  Căn cứ: Dữ liệu đã nằm trên kho công khai nên ai cũng xem được và không tự gỡ được; xử lý sau càng khó, nên cần người quyết cách làm mờ hoặc viết lại lịch sử.
  file: `_acceptance/can-gia-tot-sua-ba-loi/evidence/E7-ten.png`
  severity: high
  Đề xuất: new-contract

- **Điều kiện đếm nhiều tên trong SQL lệch với `tenTin` về khoảng trắng (r1)**
  Người dùng thấy gì: Hiếm khi một tài khoản người bán có tên lẫn ký tự lạ ở cuối, thẻ tin có thể hiện «nhiều tên» thay vì tên thật. Người xem chỉ thấy nhãn kém chính xác, không mất dữ liệu.
  Căn cứ: Chỉ ảnh hưởng nhãn hiển thị ở một số ít tài khoản có ký tự lạ, chưa thấy trên dữ liệu thật, và không làm lộ hay mất thông tin.
  file: `app/src/lib/offers-public.ts`
  severity: low
  Đề xuất: known-limits

- **Eval E8 của AC-6 đo route `/api/v1/listings` nhưng không khai route trong `paths` (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu sau này có người sửa hai tệp phục vụ danh sách tin rao, bằng chứng của việc này vẫn được coi là còn mới dù chưa đo lại. Người dùng cuối không thấy gì ngay.
  Căn cứ: Chỉ làm hệ nghiệm thu bỏ sót cảnh báo cũ về sau, không ảnh hưởng gì đến người dùng hôm nay và sửa sau rất rẻ.
  file: `_acceptance/can-gia-tot-sua-ba-loi/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Probe AC-4 báo xanh giả khi không so được tệp test: lỗi git bị nuốt thành 0 dòng xoá (r1)**
  Người dùng thấy gì: Nếu tệp kiểm cũ bị xoá hẳn, một phép kiểm phụ vẫn báo xanh. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Là kẽ hở của công cụ kiểm, chỉ xảy ra khi tệp bị xoá và các phép kiểm khác vẫn bắt được, nên chi phí sửa không đáng.
  file: `_acceptance/can-gia-tot-sua-ba-loi/probes/ca-cu-khong-doi.sh`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 — Không ghim thông điệp: ba đối chứng đỏ không chạy phép kiểm thật, nên thông điệp E1 và E3 khai «ném» không được chứng minh (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một số phép thử đối chứng chưa chứng minh được là báo đúng lỗi khi dữ liệu sai. Người dùng không thấy khác biệt, chỉ độ chắc của bằng chứng thấp hơn khai báo.
  Căn cứ: Chỉ làm yếu bằng chứng nội bộ, không ảnh hưởng hiển thị cho người dùng, và các giá trị đột biến vẫn đã được kiểm.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/7 lỗi rơi vào file không bộ đo nào phủ (_acceptance/can-gia-tot-sua-ba-loi/evidence/E7-ten.png, _acceptance/can-gia-tot-sua-ba-loi/evidence/E7-ly-do-man.png) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
