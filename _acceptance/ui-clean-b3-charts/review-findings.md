# Review findings: ui-clean-b3-charts (round 1)

## Trong hợp đồng

- **Hình dạng 3 (assert chuỗi có mặt thay cho QUAN HỆ): data-color chỉ kiểm bậc có mặt trong dòng, không kiểm bậc nằm đúng cột sáng/tối**
  - file: `scripts/ui-standards/b3-check.mjs:178`
  - severity: medium
  - AC: AC-3
  - source: measurement
  - detail: E3 hứa "mỗi khoá của palette.ts có một dòng bảng với ĐÚNG bậc sáng/tối", tức một quan hệ cột→giá trị. Code chỉ có `if (!row.includes(v.light) || !row.includes(v.dark))`: chỉ cần hai chuỗi xuất hiện ở đâu đó trong dòng. Đã thử trên bản sao: đổi dòng `revenue` thành `| indigo-400 (5,74) | indigo-500 (4,58) |` (đảo sáng và tối) thì `b3-check.mjs data-color --root <bản sao>` vẫn in "data-color: ĐẠT", thoát 0. Ca phá trong selftest (#16, sky-600→sky-500) chỉ kiểm việc mất chuỗi, không kiểm việc đặt sai cột. Bảng màu trong tài liệu có thể khai ngược chế độ mà thước vẫn xanh.
  - rationale: AC-3 đòi bảng trong data-color.md liệt mọi khoá với ĐÚNG bậc sáng/tối như module; thước chỉ kiểm hai chuỗi có mặt, đảo cột vẫn đạt nên AC-3 không được chứng minh.

- **Hình dạng 5 (tuyên quét lớp nhưng ma trận thiếu): quan hệ nghĩa→khoá chỉ quét kênh themeOf, bỏ trọn kênh swatchOf của chấm chú giải và tooltip**
  - file: `scripts/ui-standards/b3-check.mjs:101`
  - severity: medium
  - AC: AC-1
  - source: measurement
  - detail: E1 tuyên "quan hệ nghĩa→khoá đúng" cho performance, pnl và ba lát mix. Ma trận trong checkPalette (dòng 101-112) chỉ có các regex `series:` và `themeOf("…")`, tức màu nét và cột. Màu chấm thì đi đường riêng: `SWATCHES = { revenue: swatchOf("revenue"), … }` ở yield/pnl/data.ts:41-44 và `lead: swatchOf("share1")…` ở revenue-mix/value-faces.tsx:20-23. Các dòng này không phần tử nào nằm trong ma trận. Đã thử trên bản sao: đổi `revenue: swatchOf("revenue")` thành `swatchOf("margin")` ở pnl/data.ts thì `b3-check.mjs palette` vẫn "ĐẠT", thoát 0. Riêng với pnl, E14 (so pixel) có thể bắt được, nhưng với các lát revenue-mix thì không thước máy nào bắt, vì mix không có cặp pixel. Số quan hệ được assert (12, đều là themeOf) không bằng số chỗ gán màu theo nghĩa (12 themeOf + 7 swatchOf).
  - rationale: AC-1 đòi quan hệ nghĩa→khoá đúng cho Doanh thu, ba lát share1..3 và các chuỗi cùng tên; chấm chú giải/tooltip là chỗ gán màu theo nghĩa nhưng nằm ngoài phép quét, nên gán sai khoá vẫn đạt.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (assertion âm tính đứng một mình): nhánh 'còn bản riêng use-trigger-tooltip.ts/icons.tsx' không có ca đối chứng dương**
  Người dùng thấy gì: Thước kiểm tự động có một nhánh phụ chưa từng được thử cho thấy nó báo đỏ khi có tệp trùng bị cắm lại. Người dùng không thấy khác biệt gì; rủi ro chỉ là sau này ai đó cắm lại bản chép riêng mà nhánh phụ này không báo.
  Căn cứ: Nhẹ: hiện chưa có lỗi nào xảy ra với người dùng, nhánh dò đoạn trùng chính vẫn bắt được việc chép lại, và bổ sung ca thử sau này rẻ nên ghi lại là đủ.
  file: `scripts/ui-standards/b3-check.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): ràng buộc 'insight-page.tsx và yield/page.tsx không đổi' không có ca đỏ, và selftest không thể phá nó**
  Người dùng thấy gì: Thước kiểm tự động không thể tự chứng minh nó sẽ báo đỏ nếu hai trang dùng biểu đồ bị sửa nhầm. Hiện hai trang vẫn y nguyên nên người dùng không bị ảnh hưởng gì.
  Căn cứ: Nhẹ: hai trang hiện không đổi nên người dùng không gặp gì, và nếu có sửa nhầm sau này thì lệnh so sánh với nhánh chính và buổi duyệt trước khi gộp vẫn thấy được.
  file: `scripts/ui-standards/b3-check.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
