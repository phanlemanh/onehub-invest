## Trong hợp đồng

- **Hình dạng 2 — Fixture viết tay đúng khuôn bên đọc: lưới và trang dự án không đi qua đường nối thật từ lớp đọc tới màn**
  file: `app/tests/thuoc-tinh-can.test.tsx:161`
  severity: high
  AC: AC-9
  source: measurement
  detail: Dòng 161 và 172-178 render DuAnToaGrid, DuAnView bằng props dựng tay (hang(), ttMau(), loiThuocTinh={true}, phuThuocTinh={...}). Kết quả của docThuocTinhCan không bao giờ đi qua dungHangToa(duAn, id, entries, thuocTinh) hay DuAnContent: trong app/tests chỉ tệp này nhắc tới thuocTinh, còn các lời gọi dungHangToa ở registry-chi-doc và registry-toa-hieu-luc đều không truyền đối số thuocTinh. Vì vậy phép nối thuocTinh.get(c.key) ở app/src/lib/ops/registry/hang-toa.ts và nhánh tt.ok ? tt.data : undefined, loiThuocTinh={!tt.ok || !phu.ok} ở du-an-content.tsx không có phép đo nào: đổi khoá nối khiến mọi căn thành «Chưa có thuộc tính» mà ca vẫn xanh. E9 (evals.yaml dòng 64) hứa đúng các chiều này: «HTML render của lưới (route thật)», «route vẫn 200», «đột biến đổi khoá nối unit_key ↔ stack → ca đỏ nêu unit_key», «đột biến bỏ khối bắt lỗi → ca đỏ nêu lỗi nội tuyến», và soát token tên nguồn từ source_registry; tệp test không có ca nào trong số đó.
  rationale: AC-9 là AC cross-layer đòi giá trị trên màn bằng view của đúng unit_key; phép nối thật không có phép đo nào.

- **Hình dạng 5 — Tuyên ma trận toàn phần nhưng mỗi ô chỉ soi một trường: phát biểu thừa lọt qua**
  file: `pipeline/tests/thuoc-tinh-can-s16.test.mjs:55`
  severity: high
  AC: AC-3
  source: measurement
  detail: E3 hứa «mỗi ô so mảng {field,value} đầy đủ + lý do bỏ», nhưng kiemMaTran (dòng 55) chỉ so lay(kq, c.f) và lyDo(kq, c.f) của đúng một trường c.f; các trường khác của cùng dòng không được so. Dòng 76 chỉ kiểm trường nằm trong danh sách cho phép, mà danh sách này có lot_size_area. Đã chạy đột biến trên bản chép trong thư mục nháp: thêm vào phatBieuTuDong một phát biểu lot_size_area = area_building cho căn HIGH_RISE (căn hộ cao tầng bị gán diện tích đất, trái luật Mạnh chốt 18/11); cả 3 ca TTC-AC-3 vẫn xanh. Không ô nào đặt c.f = lot_size_area với dòng HIGH_RISE. Ngoài ra E3 ghi «12 loại hình» trong khi ma trận và LOAI_HINH_S16 chỉ có 11 mã, nên số ô viết trước không khớp lời hứa.
  rationale: AC-3 đòi mỗi ô ra đúng danh sách {field,value}; đột biến thêm phát biểu thừa vẫn xanh nên AC không được bảo vệ.

- **Hình dạng 5 — Thước E13 tuyên so từng ô của năm dự án nhưng không có ma trận viết trước, dự án vắng thì không bị so**
  file: `pipeline/tests/thuoc-tinh-can-s16-that.mjs:94`
  severity: high
  AC: AC-11
  source: measurement
  detail: Vòng so ở dòng 94-104 chỉ duyệt các dự án có trong kết quả SQL_THANG. Dự án trong bang-phu-ca.md §1 hoặc khối chay-thu mà không có dòng nối (ví dụ bộ nạp bỏ sót cả ocean-park-3) thì không sinh ô nào, lech vẫn 0 và script thoát 0. Hai đường bỏ qua im lặng khác: ct !== undefined và bp !== undefined ở dòng 100 làm cột so biến mất khi ap-may-thu.md thiếu khối chay-thu, khi dòng sai số cột (dòng 86), hoặc khi tên dự án rơi vào «(khác)» ở dòng 90. E13 hứa bốn cột «bằng nhau từng ô của năm dự án đã nối» và «thoát 1 khi một ô lệch», nhưng không có assert số ô đã so = 5 dự án × 8 cột, cũng không kiểm đủ năm tên dự án.
  rationale: AC-11 đòi số thật bằng từng ô khoá của ba dự án và lệch thì dừng; thước để dự án vắng lọt im lặng.

- **Hình dạng 3 — Assert chuỗi có mặt cho ô phủ trong khi lời hứa là quan hệ nhãn ↔ số**
  file: `app/tests/thuoc-tinh-can.test.tsx:174`
  severity: medium
  AC: AC-10
  source: measurement
  detail: Dòng 174 kiểm riêng lẻ co.includes("Căn có giá chủ đầu tư"), co.includes("1.850"), co.includes("Chưa vào danh bạ") trên toàn HTML. Lời hứa của AC-10 (E11, E12) là mỗi ô hiện đúng số của nó, tức quan hệ giữa nhãn và giá trị. Tráo value của hai ô coGia và chuaVaoDanhBa trong oPhu thì mọi chuỗi vẫn có mặt và ca vẫn xanh. Giá trị chuaVaoDanhBa: 2 của fixture hoàn toàn không được assert ở mức màn.
  rationale: AC-10 đòi mỗi ô phủ hiện đúng X, Y, Z, N tương ứng nhãn; assert rời không bắt được tráo giá trị.

- **Hình dạng 3 — Regex nhãn nguồn S16 khớp sang cột Nguồn của hàng khác, không chứng minh ô thuộc tính có Badge**
  file: `app/tests/thuoc-tinh-can.test.tsx:166`
  severity: medium
  AC: AC-9
  source: measurement
  detail: assert.match(html, /data-thuoc-tinh="nguon"[\s\S]*?S16/) chỉ đòi có chữ S16 ở đâu đó phía sau thuộc tính, kể cả ngoài ô. Fixture hang() đặt nguon: ["S16"] ở cấp hàng nên cột «Nguồn» của hàng kế tiếp luôn cung cấp chữ này. Đã render DuAnToaGrid thật với ttMau({ nguon: [] }): 2 ô thuộc tính không ô nào chứa S16, regex vẫn khớp. Thông điệp «thiếu nhãn nguồn S16 ở ô thuộc tính» vì thế không đo được điều nó tuyên.
  rationale: AC-9 đòi Badge S16 ở hàng căn có thuộc tính; regex không chứng minh được điều đó.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ảnh chứng commit vào kho công khai làm lộ mã căn, toa_id và thuộc tính, giá S16 lấy bằng đăng nhập**
  Người dùng thấy gì: Ảnh chụp màn hình dùng làm bằng chứng chứa mã căn và giá chủ đầu tư thật. Nếu đẩy lên kho công khai, người ngoài sẽ thấy dữ liệu chỉ được giữ trên máy thu.
  Căn cứ: Nặng vì dữ liệu đã lên kho công khai thì không thu hồi được; hiện ảnh chưa đẩy lên nên còn kịp thay bằng ảnh đã che trước khi đẩy.
  file: `_acceptance/thuoc-tinh-can-s16/evidence/E10-step1.png`
  severity: high
  Đề xuất: new-contract

- **Migration 113 dựa vào DATA-CONTRACT v14 nhưng hợp đồng chưa khai kind và phiên bản này**
  Người dùng thấy gì: Tài liệu giao diện giữa khâu thu và khâu xử lý chưa ghi loại dữ liệu mới này. Người vận hành không thấy gì khác, nhưng bên thu và bên xử lý có thể hiểu lệch nhau về cột.
  Căn cứ: Nhẹ với người dùng vì màn hình không đổi; việc thuộc làn thu và đã được ghi là điều kiện phụ thuộc, bổ sung sau rẻ.
  file: `db/migrations/113_thuoc_tinh_can_s16.sql`
  severity: medium
  Đề xuất: known-limits

- **Cột «Thuộc tính từ» tự vẽ Badge nguồn thay vì dùng NguonBadges có sẵn**
  Người dùng thấy gì: Nhãn nguồn S16 hiện hai màu khác nhau trên cùng một hàng căn. Chỉ lệch về giao diện, thông tin vẫn đúng.
  Căn cứ: Rất nhẹ, chỉ thẩm mỹ, không mất hay lộ dữ liệu; sửa sau rẻ.
  file: `app/src/components/ops/registry/du-an-toa-grid.tsx`
  severity: low
  Đề xuất: known-limits

- **catch nuốt lỗi đọc v_s16_can: chạy thử coi mã mơ hồ toà là mã thường và in số sai**
  Người dùng thấy gì: Nếu việc đọc dữ liệu căn gặp sự cố, lệnh chạy thử vẫn in ra bảng số mà không cảnh báo, và số đó sai. Người áp dữ liệu có thể đối chiếu với số sai.
  Căn cứ: Chỉ xảy ra khi cơ sở dữ liệu hỏng và lệnh ghi thật vẫn báo lỗi lúc ghi; chạy lại là thấy, sửa rẻ nhưng không chặn việc ship.
  file: `pipeline/scripts/thuoc-tinh-can-s16.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lý do lỗi của lớp đọc thuộc tính bị bỏ, không được ghi log ở đâu**
  Người dùng thấy gì: Khi tải thuộc tính căn lỗi, màn hình chỉ báo chung chung và nguyên nhân không được lưu lại. Người vận hành khó biết vì sao lỗi.
  Căn cứ: Nhẹ vì người dùng vẫn thấy lỗi và thử lại được; chỉ làm chẩn đoán chậm hơn, thêm log sau rẻ.
  file: `app/src/components/ops/registry/du-an-content.tsx`
  severity: low
  Đề xuất: known-limits

- **Rào chặn máy chủ ngoài kiểm PGHOST trong khi pg kết nối theo host của DATABASE_URL**
  Người dùng thấy gì: Nếu hai biến cấu hình kết nối trỏ khác nhau, lệnh ghi có thể ghi dữ liệu S16 lên máy ngoài dù tưởng đã bị chặn.
  Căn cứ: Hậu quả nặng nếu xảy ra nhưng cần cấu hình lệch bất thường trên máy thu; không có trong dùng thường ngày, sửa rẻ.
  file: `pipeline/scripts/thuoc-tinh-can-s16.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính không ghim tên ràng buộc và không có đối chứng dương**
  Người dùng thấy gì: Bài kiểm từ chối dữ liệu xấu có thể xanh dù bị từ chối vì lý do khác. Chỉ ảnh hưởng độ chặt của bài kiểm, không ảnh hưởng người dùng.
  Căn cứ: Nhẹ vì không đổi hành vi sản phẩm và không lộ hay mất dữ liệu; làm chặt bài kiểm sau rẻ.
  file: `pipeline/tests/thuoc-tinh-can-s16.itest.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
