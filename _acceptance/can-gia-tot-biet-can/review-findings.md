# Review findings: can-gia-tot-biet-can (round 1)

## Trong hợp đồng

- **DealThumb dùng thẻ img trần, ảnh lỗi không hiện «Ảnh hỏng» như AC-9 và pattern của ReviewPhotos**
  file: `app/src/components/ops/deals-cells.tsx:55`
  severity: medium
  AC: AC-9
  source: conventions
  detail: Hợp đồng AC-9 ghi «ảnh không tải được hiện «Ảnh hỏng»», và hợp đồng thừa nhận có căn chỉ còn link gốc hết hạn. `ReviewPhotos` đã xử lý ca này bằng `onError` và `markBroken`. `DealThumb` thì render `<img src={anh}>` không có `onError`, cả ở ô 40 px lẫn trong HoverCard. Nó được dùng ở mọi hàng của bảng (`deals-grid.tsx`) và ở bảng căn cùng tiêu chí (`deal-similar.tsx`). Khi `/api/zalo-media?media=` không lấy được ảnh, các ô này hiện ảnh vỡ hoặc ô trống, không có chữ báo. Ô «Chưa có ảnh» cũng không hiện vì `d.images` vẫn có phần tử.

- **Trang một căn in câu chứng minh sai và số giảm âm cho căn đã rời danh sách vì giảm dưới 5%**
  file: `app/src/lib/deals-chi-tiet.ts:71`
  severity: high
  AC: AC-4
  source: bugs
  detail: `dealSql` cố ý không lọc theo mức giảm (Hỏi-1), nhưng `cauChungMinh` chỉ chặn `discountPct === null`. Nhánh còn lại luôn ghi «Rẻ hơn thước phường X tr/m², tức Y%, trên ngưỡng vào danh sách 5% và chưa tới ngưỡng cần xác minh 35%». Căn giảm 2% vì thế được nói là trên ngưỡng 5%, ngược với cảnh báo «Đã rời danh sách» ngay phía trên. Căn đắt hơn thước (`bait_gap_pct` âm, `refresh-bait-gap.mjs` không chặn dấu) nhận câu «Rẻ hơn thước phường -3 tr/m², tức -10%». Tiêu đề `app/src/app/ops/deals/[offerId]/page.tsx:41` ghép `−${d.discountPct.toFixed(0)}%` thành «−-10%». Khối vẫn có tên «Vì sao giá tốt». Đo DB máy thu chỉ đọc: 16 tin P1 bán có số giảm âm và 10 tin giảm từ 0 đến dưới 5%, đều mở được theo mã. Cách sửa: trả null khi `discountPct < NGUONG_VAO_PCT` (hoặc khi `roiDanhSach` khác null) và không ghép dấu trừ cho số âm. Test hiện chỉ dùng căn trong ngưỡng nên không bắt được.

- **Lỗi đọc source_registry bị nuốt, tên, nhóm và chữ bài thành null, trang báo sai là căn thiếu**
  file: `app/src/lib/deals.ts:202`
  severity: medium
  AC: AC-7
  source: bugs
  detail: `hoanTat` gọi `getSourceNameEntries()`. Hàm này (`app/src/lib/source-roles.ts`) có `catch {}` trả `[]` với mọi lỗi DB, và `maskSourceNames` trả null khi danh sách rỗng. Một lỗi tạm ở câu này (khoá, timeout, mất kết nối), hoặc `source_registry` rỗng, khiến `sellerName`, `groupName`, `postTextFull` của mọi căn về null. Sau đó `thieuGi` thêm «Chưa có chữ bài», căn chuyển sang tab «Còn thiếu», trang ghi «Chưa có tên» và không có khối lỗi Thử lại. Đây đúng loại lỗi mà ghi chú của `truyVan` nói phải ném tiếp thay vì nuốt (S4 r1 E12). Che đóng chặt thì đúng, nhưng phải phân biệt lỗi hạ tầng với dữ liệu thiếu. Cách sửa: ở máy thu, chỉ coi 42P01 là không có registry, còn lỗi khác ném tiếp cho RegionError.

- **Khi thiếu bảng media, chữ bài và tên chưa che tên nguồn vẫn xuống dữ liệu trang**
  file: `app/src/lib/deals.ts:200`
  severity: medium
  AC: AC-6
  source: bugs
  detail: Nhánh `return { rows, mayThu: false }` trong `hoanTat` chạy khi câu đọc `media` lỗi 42P01 hoặc 42703, tức `truyVan` đã đọc thành công `stg_zalo_posts`. Nhánh này thoát trước bước `maskSourceNames`, nên `postTextFull`, `sellerName`, `groupName` còn nguyên chữ gốc. `DealBody` ẩn chữ bài vì `mayThu=false`, nhưng `dealTheoVai` với vai Vận hành không bỏ trường này, nên `dealHang` đưa nguyên chữ vào prop `rows` của client component `DealsGrid` (dữ liệu RSC). Tên người bán còn được vẽ ra màn hình mà chưa che. Tên nguồn thật là tầng A, và câu «Máy chủ chưa giữ hai phần này» cũng sai vì dữ liệu đang nằm trong payload. Test «mất bảng media khi còn stg_zalo_posts» chỉ kiểm mã căn và `mayThu`. Cách sửa: ở nhánh này, che tên rồi đặt `postTextFull` về null.

- **Ảnh thu nhỏ không xử lý lỗi tải, link hết hạn thành ô trống thay vì «Ảnh hỏng»**
  file: `app/src/components/ops/deals-cells.tsx:52`
  severity: medium
  AC: AC-9
  source: bugs
  detail: `DealThumb` kiểm `d.images[0]?.src` rồi vẽ `<img alt="">` không có `onError`. Nguồn ảnh `?media=` có thể trả lỗi khi link gốc hết hạn, ca mà `can-gia-tot-ba-vai.mjs` đếm riêng là «chỉ còn link hết hạn». Khi đó hàng bảng và tab «Căn cùng tiêu chí» hiện ô 40 px trống, không có biểu tượng `ImageOffIcon` của nhánh không ảnh và không có chữ nào. AC-9 (`_acceptance/can-gia-tot-biet-can/evals.yaml`, E9) yêu cầu «img không tải được hiện Ảnh hỏng». `ReviewPhotos` đã làm việc này bằng `markBroken`, còn `DealThumb` thì không, nên lỗi tải bị im lặng. Thẻ HoverCard cùng thành phần cũng thiếu xử lý tương tự. Cách sửa: thêm state lỗi và rơi về ô `ImageOffIcon` với nhãn «Ảnh hỏng».

- **Hình dạng 1, đo chỉ dẫn thay vì đầu ra: «0 trường lọc Ảnh» gọi truongLoc với tham số false viết cứng, không đo bộ lọc bảng thật**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:627`
  severity: high
  AC: AC-6
  source: measurement
  detail: Dòng 485 (viewer, AC-6) và dòng 627 (cloud với ops, admin, AC-7) gọi `truongLoc(rows, false)` rồi assert không có trường `anh`. Giá trị false do test tự đưa vào, nên kết quả chỉ phản ánh tham số đó. Quyết định thật nằm ở `deals-grid.tsx:176`: `truongLoc(rows, xemNoiDung && mayThu)`. Đột biến dòng 176 thành `truongLoc(rows, true)` làm viewer và cloud có lọc Ảnh mà cả hai assert vẫn xanh. Riêng dòng 627, `b.rows` với ops trên cloud có xemNoiDung = true, nên đây là nhánh do `mayThu` quyết định và test không chạm tới. Lời hứa ở E6, E7 («0 trường lọc Ảnh») vì vậy chưa được đo trên đầu ra: không đọc `fields` DealsGrid truyền vào, cũng không mở menu lọc.

- **Hình dạng 3, chuỗi có mặt thay vì quan hệ: hàng bảng AC-1 dùng cùng giá, cùng SĐT cho mọi căn nên không chứng được «đúng của chính căn đó»**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:267`
  severity: medium
  AC: AC-1
  source: measurement
  detail: E1 hứa mỗi hàng có tên căn, giá, thước, số tin, href tel «đúng dữ liệu của chính căn đó». Fixture `tin()` cho a1, a3, a4 cùng `price_vnd` 2 tỷ, cùng `seller_phone` SO, cùng thước. Vì vậy dòng 267 `includes(fmtCompact(2_000_000_000))` và dòng 268 `tel:${SO}` vẫn xanh khi giá hoặc SĐT bị gắn sang hàng khác. Chỉ ảnh có đối chứng tráo hàng (dòng 273), giá và tel thì không. Danh sách `can` ở dòng 267 cũng không có tên căn, dù E1 và contract AC-1 đều nêu. E1 hứa «đúng một img» nhưng dòng 266 dùng `querySelector("img")`, chỉ đọc img đầu và không đếm. Hàng a2 bị loại khỏi vòng kiểm trường, trong khi lời hứa là mỗi hàng.

- **Hình dạng 3, chuỗi có mặt thay vì quan hệ: «đúng tập căn viết trước» của E13 chỉ so số đếm, kỳ vọng lại tính từ chính dữ liệu**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:688`
  severity: medium
  AC: AC-11
  source: measurement
  detail: E13 hứa bốn trường lọc nhân hai toán tử «ra đúng tập căn viết trước». Vòng dòng 686-690 chỉ so `demTab("Tất cả")` và tổng ba tab với `hopNhan(dung)`, tức `rows.filter(f).length`. Không dòng nào so tập offerId đang hiện với tập kỳ vọng, nên bộ lọc trả sai căn nhưng đúng số lượng vẫn xanh. Kỳ vọng cũng là predicate chạy trên `rows` lúc test chạy, không phải tập viết trước như lời khai ở evals.yaml dòng 115. Đối chứng dòng 692-694 chỉ phủ lỗi đếm, không phủ lỗi tập.

- **Hình dạng 3, chuỗi có mặt thay vì quan hệ: E8 chỉ đòi thieuGi không rỗng, không đòi «nhãn tương ứng»**
  file: `app/tests/can-gia-tot-doi-chieu.test.tsx:20`
  severity: medium
  AC: AC-8
  source: measurement
  detail: E8 hứa «đủ bốn số hoặc thieuGi có nhãn tương ứng». Dòng 20 chỉ có `assert.ok(thieu.length > 0, ...)`. Căn thiếu thước mà chỉ mang nhãn «Chưa có SĐT» hay «Chưa có ảnh» vẫn đạt, nên quan hệ số thiếu ↔ nhãn không được đo. Nhánh này cũng không có đối chứng đỏ. Đối chứng duy nhất ở dòng 61 chỉ phủ ảnh.

- **Hình dạng 4, âm tính một mình: chặn URL gốc ở AC-3 không có đối chứng đỏ chạm tới, thông điệp cũng không ghim**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:354`
  severity: high
  AC: AC-3
  source: measurement
  detail: Dòng 331 assert HTML và JSON không chứa URL_GOC, `?path=`, `gai-listing.example`, đây là lời hứa chính của E3. Đối chứng đỏ ở dòng 354 gọi `kiemAnhCan(srcs, ky, "", "")`, tức HTML và JSON đều rỗng. Lệnh ném ở deepEqual dòng 328 («ảnh sai thứ tự hay sai số») trước khi tới dòng 331, và regex `/CGT-AC-3/` chấp nhận mọi thông điệp của ca. Do đó vế không lộ chưa từng được chứng là đỏ được khi bản vẽ thật mang URL gốc: đột biến `buildMediaImages` trả media_url không đi qua page render, nên HTML và cây phần tử không được quét trong chiều đỏ.

- **Hình dạng 4, âm tính một mình: E11 khai đối chứng đỏ dealMediaSrc nhưng không phép đo nào chạy nó**
  file: `_acceptance/config.yaml:178`
  severity: medium
  AC: AC-3
  source: measurement
  detail: evals.yaml dòng 36 hứa «gài lại dealMediaSrc vào bản chép tạm thì deals-gate đỏ». Lệnh `can_gia_tot_quet_ma` chỉ chạy `! grep ...`, `check-portal-compliance --only deals-gate --root .`, grep routes.md và test:lint-rules. Grep `dealMediaSrc` trong scripts/, app/tests/ và probe của _acceptance không ra ca nào gài mẫu đó. Đột biến trong `people-hien-so-goc/probes/chu.mjs` chỉ phủ ba đột biến về cổng vai. Vì vậy `check(!/dealMediaSrc|\?path=/.test(deals), ...)` ở check-portal-compliance.mjs dòng 66 là phủ định chưa có chứng cứ bắt được lỗi.

- **Hình dạng 4, âm tính một mình: «0 dòng rỗng, không chưa có» trên trang chỉ quét dl chứa dòng đầu tiên**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:315`
  severity: medium
  AC: AC-2
  source: measurement
  detail: Dòng 315 là `assert.doesNotMatch(document.querySelector("[data-deal-dong]")?.parentElement?.textContent ?? "", /chưa có/)`. `querySelector` trả dòng đầu tiên, `parentElement` là đúng một `<dl>` trong nhiều khối của DealBody (Vì sao, Gọi ai, Ở đâu, Thông tin tin), nên các khối khác không được quét. Vế `?? ""` còn cho đạt khi không có dòng nào. Câu assert không có thông điệp ghim và không có chiều đỏ. Dòng 314 chỉ đếm 0 cho năm nhãn địa chỉ, trong khi b2 còn thiếu loại hình, phòng ngủ, chữ bài, ảnh. Lời hứa «0 dòng rỗng» của E2 vì vậy chỉ đo một phần.

- **Hình dạng 4, âm tính một mình: khuôn số của viewer trong ba-vai không có đối chứng dương**
  file: `scripts/can-gia-tot-ba-vai.mjs:116`
  severity: medium
  AC: AC-10
  source: measurement
  detail: `quetViewer` là phép âm tính duy nhất cho sáu dạng SĐT, dùng `khuonSo` ở dòng 50-53. Script không chạy `quetViewer` hay `khuonSo` trên trang ops để chứng khuôn này bắt được số thật, và không có chiều đỏ. Chiều dương của ops ở dòng 130 dùng matcher khác, `t.includes("tel:" + phone)`, nên không chứng gì cho khuôn. Nếu khuôn hỏng, ví dụ do `chuan` hay dạng lưu của số, E10 vẫn báo «0 khớp» và thoát thành công. Điều này trái dòng 4 của evals.yaml: «mỗi phép đo mới có cặp hai chiều».

- **Hình dạng 4, âm tính một mình: E8 bỏ chiều đỏ của ảnh khi coMedia rỗng và in câu sai rằng đã chạy trên mẫu**
  file: `app/tests/can-gia-tot-doi-chieu.test.tsx:62`
  severity: low
  AC: AC-8
  source: measurement
  detail: Khi `coMedia.size === 0`, nhánh else chỉ `console.log("... chiều đỏ của ảnh chạy trên mẫu")`, không có mẫu nào được chạy. Lúc đó assert dòng 22 cũng không chạy cho căn nào, nên E8 xanh mà không có phép đo ảnh và báo cáo lại khẳng định ngược lại. E8 hứa đối chứng đỏ «bản bỏ ảnh → ném» vô điều kiện.

- **Hình dạng 5, tuyên quét lớp nhưng chỉ có điểm-case: E10 khai bốn lớp cấm với viewer nhưng không quét đường ảnh đọc từ DB**
  file: `scripts/can-gia-tot-ba-vai.mjs:108`
  severity: high
  AC: AC-10
  source: measurement
  detail: evals.yaml dòng 107 hứa viewer «0 khớp với SĐT..., tên, chữ bài, đường ảnh đọc từ DB của chính các căn đó». `CAM_VIEWER` ở dòng 108-112 chỉ có ba loại số, tên, chữ bài. Câu SELECT ở dòng 98-101 không đọc `media_url` hay `local_file`. Dòng 114 chỉ dò chuỗi cố định `/api/zalo-media?`. Vì vậy URL gốc hay đường tệp của ảnh lộ cho viewer theo dạng khác không bị bắt, dù chỉ có đường ảnh là thiếu trong ma trận khai.

- **Hình dạng 5, tuyên quét lớp nhưng chỉ có điểm-case: AC-3 hứa sheet và trang nhưng ca chỉ đo trang**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:345`
  severity: medium
  AC: AC-3
  source: measurement
  detail: Contract AC-3 nêu «mở sheet và trang một căn», và paths của E3 có `deal-sheet.tsx`. Ma trận thực tế ở dòng 344-349 là hai vai × một bề mặt: chỉ `vaoTrang(await chiTiet(), role, { offerId: "m1" })`. Không có lượt `vaoTrang(ds, role, { can: "m1" })`, nên 12 ảnh đúng thứ tự, chữ bài 500 ký tự và 0 URL gốc đều chưa được đo trên sheet. Riêng E3 không viết rõ sheet, nên chỗ lệch nằm giữa contract và ca đo.

- **Hình dạng 5, tuyên quét lớp nhưng chỉ có điểm-case: danh sách trường của AC-2 thiếu «số tin», «ngày thấy» chỉ kiểm truthy**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:300`
  severity: medium
  AC: AC-2
  source: measurement
  detail: E2 và contract AC-2 liệt kê cả «số tin» trong danh sách trường của loader và phần thân. `moi` ở dòng 296 và `ky` ở dòng 300 không có `brokerNAds` hay dòng «Số tin của người này» (`deal-body.tsx:102`), và fixture cũng không dựng giá trị kỳ vọng cho nó. Dòng 303 `assert.ok(dong("Thấy lần đầu"))` chỉ kiểm truthy, nên chuỗi «chưa có» hay ngày của căn khác vẫn đạt, trái lời hứa «từng giá trị trong đúng dòng nhãn».

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2, fixture viết tay: phần cloud của SHS-AC-6 tự xoá ảnh và chữ bài rồi assert không có chúng**
  Người dùng thấy gì: Một ca kiểm cũ về bản cloud chỉ lặp lại điều nó tự đặt sẵn nên không bắt được lỗi. Người dùng không thấy khác biệt gì, chỉ là một lớp kiểm yếu thừa.
  Căn cứ: Không ảnh hưởng người dùng, đã có phép kiểm khác phủ đúng chỗ này, nên ghi lại và để vậy là đủ.
  file: `app/tests/danh-ba-nguoi-deals-lien-he.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
