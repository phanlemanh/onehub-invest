# Review findings: thuoc-tinh-can-s16 (round 1)

## Trong hợp đồng

- **Lần thu sau không thắng khi giá trị trùng một phát biểu cũ còn sống: ON CONFLICT DO NOTHING giữ observed_at cũ**
  file: `pipeline/scripts/thuoc-tinh-can-s16.mjs:87`
  severity: high
  AC: AC-6
  source: conventions
  detail: ghi() chèn với ON CONFLICT DO NOTHING theo field_assertions_live_uq (subject_key, field, value_key, method, rule_id, chỉ dòng chưa rút), không chứa observed_at và không rút phát biểu cũ. v_unit_thuoc_tinh lại xếp theo observed_at, nên giá trị quay về mức cũ không bao giờ thắng. Trái luật «lần thu sau thắng» của AC-6 và design.md §5. Đã tái hiện trên DB thử dựng từ db/migrations, gọi ghi() thật ba lượt: (1) living_area 70 ở T1, 72 ở T2, 70 ở T3: lượt T3 ghi 0 dòng, view vẫn trả 72 và observed_at T2. (2) Căn góc [east, north] ở T1, sang [east, south] ở T2: east bị bỏ qua nên giữ mốc T1, view chỉ trả [south], mất một hướng. Hệ quả phụ: căn không đổi giá trị thì ngày «Thu ...» trên lưới đứng ở lần thu đầu. Itest TTC-AC-6 không bắt được vì chỉ thử hai giá trị khác nhau theo một chiều. Hướng sửa: trong cùng giao dịch, rút phát biểu S16 sống của căn có giá trị khác hoặc đã cũ rồi chèn lại theo snapshot mới, kèm ca A→B→A và ca đổi một trong hai hướng.

- **Từ lần thu thứ hai, view trả sai hướng và diện tích vì ON CONFLICT DO NOTHING không làm mới observed_at của phát biểu cũ**
  file: `pipeline/scripts/thuoc-tinh-can-s16.mjs:87`
  severity: high
  AC: AC-6
  source: bugs
  detail: field_assertions_live_uq là (subject_key, field, value_key, method, rule_id) trên dòng sống, không có observed_at. Lần thu sau gặp giá trị trùng thì DO NOTHING nên dòng cũ giữ observed_at cũ, còn giá trị khác được chèn với observed_at mới. Không phát biểu nào bị rút. v_unit_thuoc_tinh (113) lại chọn theo observed_at mới nhất, nên kết quả sai. Đã tái hiện bằng tinh() + ghi() thật trên DB thử dựng từ migrations, ba snapshot: (1) Căn góc NE_NW rồi NE_SE: view trả [southeast], mất northeast; căn NE rồi NE_SE cũng trả [southeast]. (2) Diện tích 70 → 72 → 70: lần ba ghi 0 dòng mới, view vẫn trả 72, tức giá trị đã bị nguồn thay. (3) NE_NW rồi NE: lần hai 0 dòng mới, view vẫn trả [northeast, northwest]. Vi phạm luật «lần thu sau thắng» của design §4–§5. itest chỉ phủ hai lần thu với giá trị khác hẳn nhau nên không bắt được. Hướng sửa: trong cùng giao dịch --ghi, rút các phát biểu S16 của căn không còn trong snapshot mới rồi chèn lại những giá trị đổi mốc, hoặc để view phân xử theo lần thu mới nhất của cả căn có tính cả giá trị được xác nhận lại.

- **Hình dạng 5: ca «mã hai toà không có giá» chỉ phủ một nhánh, QA7 mơ hồ toà có giá 0 nên che lỗ của view**
  file: `pipeline/tests/thuoc-tinh-can-s16.itest.mjs:74`
  severity: high
  AC: AC-7
  source: measurement
  detail: Hệ thống có hai lớp «mã hai toà»: hai toà trong bảng nạp (QA6) và `mo_ho` theo `v_s16_can` (QA7). Ca TTC-AC-7 (dòng 223-225) tuyên «mã hai toà không có dòng» nhưng fixture QA7 không khai `gia`, nên nhận 0 và bị loại bởi điều kiện `sale_price > 0`, không phải bởi luật hai toà. Đã chạy thử đặt QA7 `gia: 3_000_000_000`: `v_s16_gia_cdt` trả thêm dòng `unit_key ...707, list_price 3000000000` và ca đỏ. View không lọc `mo_ho`, trong khi lệnh `tinh` và SQL_THANG của E13 đều loại nhóm này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Nhãn UI mới không được thêm vào CONTEXT.md**
  Người dùng thấy gì: Một số nhãn mới trên trang dự án chưa có trong bảng từ vựng chung, nên đội có thể gọi cùng một khái niệm bằng nhiều tên khác nhau.
  Căn cứ: Chỉ lệch tên gọi, không mất hay sai dữ liệu, bổ sung vào bảng từ vựng sau rất rẻ.
  file: `app/src/components/ops/registry/du-an-view.tsx`
  severity: medium
  Đề xuất: known-limits

- **Đầu tệp 113-lui.sql hướng dẫn trái với chính điều kiện chặn của tệp**
  Người dùng thấy gì: Tệp lùi có dòng hướng dẫn sai, người vận hành đọc lúc sự cố có thể đi nhầm đường lùi và bị tệp từ chối chạy.
  Căn cứ: Tệp tự chặn nên không làm hỏng dữ liệu, chỉ gây mất thời gian lúc sự cố, và tài liệu áp máy thu đã ghi đúng cách lùi.
  file: `_acceptance/thuoc-tinh-can-s16/lui/113-lui.sql`
  severity: low
  Đề xuất: known-limits

- **checked_on của trục assertion_field không cập nhật theo lần tra DD 2.1 ngày 18/11**
  Người dùng thấy gì: Sổ tra chuẩn dữ liệu ghi ngày tra cũ hơn thực tế, chỉ gây lệch hồ sơ, người dùng không thấy gì.
  Căn cứ: Chỉ là một ngày ghi sai trong sổ, không ảnh hưởng số liệu và sửa sau rất rẻ.
  file: `pipeline/mappings.yaml`
  severity: low
  Đề xuất: known-limits

- **catch nuốt mọi lỗi khi đọc nhóm mã mơ hồ, chạy thử báo số sai mà không cảnh báo**
  Người dùng thấy gì: Nếu bảng tra mã mơ hồ bị hỏng, lệnh chạy thử vẫn báo số mà không cảnh báo, có thể dẫn tới quyết định áp trên số sai.
  Căn cứ: Chỉ xảy ra khi cơ sở dữ liệu đã hỏng bất thường, số lệch sẽ lộ ở bước đối chiếu với số khoá, sửa sau không đắt.
  file: `pipeline/scripts/thuoc-tinh-can-s16.mjs`
  severity: medium
  Đề xuất: known-limits

- **Rào chặn máy chủ ngoài kiểm PGHOST trong khi pg kết nối theo host trong DATABASE_URL**
  Người dùng thấy gì: Khi hai biến cấu hình trỏ hai máy khác nhau, lệnh có thể ghi lên máy chủ ngoài dù đã hứa chặn.
  Căn cứ: Cần cấu hình lệch bất thường mới xảy ra, nhưng ghi nhầm lên máy ngoài khó gỡ, nên nên sửa sớm khi có dịp.
  file: `pipeline/scripts/thuoc-tinh-can-s16.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2: fixture viết tay đúng khuôn bên đọc, đường nối lớp đọc → hàng căn → màn không được đo**
  Người dùng thấy gì: Bài kiểm trang dự án không bắt được lỗi nối dữ liệu từ lớp đọc lên màn, nên màn có thể hiện sai hoặc nuốt lỗi mà vẫn qua kiểm.
  Căn cứ: Không làm sai dữ liệu hiện tại, bước chụp ảnh ba trang trên dữ liệu thật sẽ lộ lỗi, bổ sung bài kiểm sau là việc riêng.
  file: `app/tests/thuoc-tinh-can.test.tsx`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5: E13 tuyên so từng ô của năm dự án nhưng chỉ lặp trên dự án đang có trong DB**
  Người dùng thấy gì: Bài đo số thật có thể báo không lệch dù thiếu cả dự án, nên người ký có thể tin nhầm là số đã khớp.
  Căn cứ: Người ký vẫn đối chiếu số khoá và ảnh ba trang nên ít khi lọt, và sửa bài đo rẻ, chưa mất dữ liệu.
  file: `pipeline/tests/thuoc-tinh-can-s16-that.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5: ma trận TTC-AC-3 chỉ so một trường mỗi ô, không phải toàn bộ phát biểu**
  Người dùng thấy gì: Bài kiểm luật suy thuộc tính chưa bắt được trường hợp lõi sinh thêm thuộc tính thừa ở trường khác.
  Căn cứ: Hiện chưa có thuộc tính thừa thật, nếu có sẽ lộ khi đối chiếu số thật, sửa bài kiểm sau rẻ.
  file: `pipeline/tests/thuoc-tinh-can-s16.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4: assert âm «registry_inherit không thắng» không có đối chứng, bỏ bộ lọc vẫn xanh**
  Người dùng thấy gì: Bài kiểm chưa chứng minh được phát biểu kế thừa bị bỏ qua, nếu sau này ai đó gỡ bộ lọc thì không báo đỏ.
  Căn cứ: Hiện chưa có dữ liệu kế thừa nên không ảnh hưởng người dùng, thêm ca đối chứng sau rất rẻ.
  file: `pipeline/tests/thuoc-tinh-can-s16.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: lời hứa quan hệ «hướng của cùng lần thu» chỉ được đo bằng giá trị có mặt**
  Người dùng thấy gì: Bài kiểm chưa phân biệt được việc gộp hướng của một lần thu với gộp hướng của mọi lần thu.
  Căn cứ: Chỉ là kẽ hở của bài kiểm, lỗi thật nếu có đã được nêu ở phần sai hướng, sửa bài kiểm rẻ.
  file: `pipeline/tests/thuoc-tinh-can-s16.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: ca CHECK TTC-AC-2 chỉ ghim mã 23514, không ghim tên ràng buộc, không có đối chứng dương**
  Người dùng thấy gì: Bài kiểm chưa bảo đảm đúng các ràng buộc đã hứa còn tồn tại, một ràng buộc khác có thể che mất.
  Căn cứ: Ràng buộc hiện có và hoạt động, chỉ là bài kiểm lỏng, siết lại sau rất rẻ.
  file: `pipeline/tests/thuoc-tinh-can-s16.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: ô phủ chỉ assert chuỗi có mặt, không ghim quan hệ nhãn với số**
  Người dùng thấy gì: Bài kiểm màn chưa bắt được trường hợp hai số ở ô phủ bị hoán đổi nhãn cho nhau.
  Căn cứ: Số thật sẽ được đối chiếu và chụp ảnh ở bước nghiệm thu, sửa bài kiểm sau rẻ.
  file: `app/tests/thuoc-tinh-can.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: regex nhãn S16 khớp chữ S16 ở cột khác, không đo Badge trong ô thuộc tính**
  Người dùng thấy gì: Bài kiểm chưa chắc bắt được trường hợp nhãn nguồn S16 biến mất khỏi ô thuộc tính căn.
  Căn cứ: Nhãn hiện vẫn hiện, người ký thấy ngay khi xem ảnh trang, siết bài kiểm sau rẻ.
  file: `app/tests/thuoc-tinh-can.test.tsx`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/16 lỗi rơi vào file không bộ đo nào phủ (_acceptance/thuoc-tinh-can-s16/lui/113-lui.sql, pipeline/mappings.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
