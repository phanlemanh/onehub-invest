# Review findings: ranh-gioi-khu-vuc-dung (round 3)

## Trong hợp đồng

- **Hình dạng 4 (khẳng định một mình, không đối chứng): kiểm rollup vn-hanoi của AC-7 đúng theo định nghĩa nên không bao giờ đỏ**
  file: `scripts/kiem-ranh-gioi-khu-vuc.mjs:146`
  severity: high
  AC: AC-7
  source: measurement
  detail: `check(ru.thang > 0 && ru.lech === 0, 'rollup vn-hanoi bằng tổng con mỗi tháng …')` (dòng 146-147) gọi `rollup()` (dòng 76-86). Hàm này tính tổng `market_metrics` JOIN `areas a ON a.parent_id='vn-hanoi' AND a.region_type='submarket'`, tức đúng công thức mà `pipeline/sql/300_metrics.sql` dòng 48-62 dùng để INSERT dòng cấp market (sau TRUNCATE và DELETE dòng market). Script chạy 300 ngay trước khi gọi `rollup()` (dòng 136-137), nên `lech === 0` đúng theo cách dựng: ranh giới đúng hay sai thì kết quả vẫn vậy, kể cả khi `runReassign` không làm gì. Script cũng không đo rollup ở trạng thái trước nên không có đối chứng nào cho thấy phép đo này có thể đỏ. Vì vậy nửa «metrics tính lại theo ranh giới đúng» của AC-7/E7 chưa được đo thật.

- **Hình dạng 4 (khẳng định âm tính một mình): «0 dòng trỏ khu vực lạc» với market_metrics/area_breakdowns tự đúng nhờ TRUNCATE của 300/400 và FK, không có số trước để đối chứng**
  file: `scripts/kiem-ranh-gioi-khu-vuc.mjs:144`
  severity: medium
  AC: AC-7
  source: measurement
  detail: `tro(c, lac…)` chỉ được gọi ở trạng thái sau (dòng 144-145); trạng thái trước không đo nên không có đối chứng dương. Khu vực lạc mồi (dòng 117-123) chỉ có một dòng `market_metrics`, không có listing hay tin bán. Dòng đó bị `TRUNCATE market_metrics` (300_metrics.sql dòng 19) và `TRUNCATE area_breakdowns` (400_breakdowns.sql dòng 7) xoá dù `runReassign` có dọn hay không. Vế «trỏ tới id không có trong areas» cũng không thể đỏ vì các bảng này có FK `REFERENCES areas(id)` (db/migrations/001_init.sql, 008_zalo_offers.sql). Phép đo chỉ còn ý nghĩa cho listings/sale_offers khi DB local còn khu vực lạc thật. Sau khi áp thật thì không còn, mà script không in hay assert số dòng trỏ ở trạng thái trước.

- **Hình dạng 3 (assert «chuỗi có mặt» thay cho quan hệ): DQ area_con_ngoai_cha chỉ kiểm detail có một số khác 0, không so với số con ngoài cha thật**
  file: `pipeline/scripts/reassign-areas.test.mjs:278`
  severity: low
  AC: AC-5
  source: measurement
  detail: `assert.match(JSON.stringify(rows[0].detail), /[1-9]\d* khu vực/)` chỉ kiểm có một số dương đứng trước «khu vực». AC-5/E5 hứa «fail kèm số khu vực», tức con số phải bằng số khu vực con có tâm ngoài polygon cha. Test không tính số này độc lập (ví dụ bằng truy vấn `NOT ST_DWithin(p.geom, ST_PointOnSurface(c.geom), 0.01)` như scripts/kiem-ranh-gioi-khu-vuc.mjs dòng 45-47) để so bằng nhau. Vì thế nếu `count(*) FILTER` trong 450_dq_checks.sql đếm sai (ví dụ in tổng số con) thì test vẫn xanh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Check DQ mới 'area_con_ngoai_cha' chưa có nhãn ở bên đọc /ops/quality và sai khuôn tên check: test ON12-AC-5 sẽ đỏ**
  Người dùng thấy gì: Trên trang chất lượng dữ liệu của Ops, kiểm tra mới về khu vực con nằm ngoài khu vực cha sẽ hiện dưới nhãn chung «Kiểm khác (chưa diễn giải)» kèm chuỗi thô, và một bài kiểm tra của trang này sẽ báo đỏ.
  Căn cứ: Chỉ ảnh hưởng người vận hành nhìn trang Ops, không mất hay sai dữ liệu, tự hiện lại đúng sau khi thêm nhãn và sửa rất rẻ.
  file: `pipeline/sql/450_dq_checks.sql`
  severity: medium
  Đề xuất: new-contract

- **Lượt theo lịch (không cờ): transform-airbnb gán lại listing vào chính khu vực lạc mà reassign vừa loại khỏi PIP**
  Người dùng thấy gì: Sau mỗi lượt chạy hằng tuần, một số căn Airbnb nằm ngoài Hà Nội (thuộc tỉnh lân cận) vẫn có thể bị đưa lại vào danh sách khu vực Hà Nội, nên bộ lọc tìm căn và số liệu tổng Hà Nội vẫn lẫn căn ngoài tỉnh.
  Căn cứ: Lỗi lặp lại hằng tuần và làm số liệu hiển thị cho người dùng lệch, nhưng chỉ ở vài chục căn, không mất dữ liệu gốc và chạy lại được; sửa cần chung một luật phường hợp lệ giữa hai bước nên đáng một việc riêng.
  file: `pipeline/reassign-areas.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): khu vực lạc mồi được INSERT thẳng vào areas với meta khớp bộ lọc của reader, không đi qua writer**
  Người dùng thấy gì: Đây là độ chặt của bài kiểm tra nội bộ: dữ liệu mẫu khu vực lạc được dựng tay nên nếu cách hệ thống ghi khu vực đổi, bài kiểm tra có thể vẫn xanh trong khi thực tế lệch. Người dùng cuối không thấy gì.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu; rủi ro chỉ là bài kiểm tra bỏ sót trong tương lai và chi phí dựng lại đường nạp thật cao hơn lợi ích.
  file: `pipeline/scripts/reassign-areas.test.mjs`
  severity: medium
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

