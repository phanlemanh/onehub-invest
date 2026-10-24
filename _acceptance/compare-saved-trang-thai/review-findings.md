## Trong hợp đồng

- **Hình dạng 3 (assert chuỗi có mặt thay vì quan hệ): link /vn của vùng trống /compare được đo bằng regex trên CẢ trang**
  file: `scripts/smoke-compare-saved.mjs:99`
  severity: medium
  AC: AC-7
  source: measurement
  detail: `check(et.includes("Chưa chọn khu vực nào") && /href="\/vn"/.test(e.html), "Empty Chưa chọn khu vực nào + link /vn")` chạy regex trên toàn bộ HTML của /compare. CompareBody luôn vẽ breadcrumb `{ label: "Việt Nam", href: "/vn" }` (compare-body.tsx), và nav có mục «Thị trường» href "/vn" (nav.tsx:36). Vì vậy href="/vn" luôn có trên trang, dù vùng Empty có link /vn hay không. Lời hứa ở E8 là một quan hệ: link /vn nằm TRONG khối Empty. Nếu xoá nút trong Empty thì phép đo vẫn xanh. Đoạn /saved ngay dưới (dòng 117–125) đã cắt đúng khối `data-slot="empty"` rồi mới đếm, còn /compare thì không cắt.
  rationale: AC-7 đòi Empty của So sánh có nút sang /vn; phép đo hiện tại luôn xanh nhờ breadcrumb và nav nên không chứng được vế này.

- **Hình dạng 3 (assert chuỗi có mặt thay vì quan hệ): «stat 3 khu vực» luôn xanh nhờ chữ của nút «So sánh 3 khu vực»**
  file: `scripts/smoke-compare-saved.mjs:144`
  severity: medium
  AC: AC-4
  source: measurement
  detail: `check(s3t.includes("3 khu vực"), "stat 3 khu vực")` dò chuỗi trên chữ của cả trang. Ngay dòng 147, cùng smoke đòi `s3t.includes("So sánh 3 khu vực")` (chữ của SavedCompareButton, saved-filter.tsx). Chuỗi này chứa sẵn "3 khu vực", nên dòng 144 bị dòng 147 kéo theo. Nếu stats của PageHeader (`${fmtInt(saved.length)} khu vực` trong saved-body.tsx) mất hoặc đếm sai thì ca vẫn xanh. Lời hứa ở E5 là số trên stat bằng số dòng saved_markets. Muốn đo thì phải đọc riêng vùng stat của PageHeader, không dò chuỗi trên cả trang.
  rationale: AC-4 đòi stat «3 khu vực» trong PageHeader của Đã lưu; phép đo xanh kể cả khi stat mất vì nút đã chứa sẵn chuỗi đó.

- **Hình dạng 3 (assert chuỗi có mặt thay vì quan hệ): /border/ khớp class gốc của MỌI variant Button, không phân biệt được outline**
  file: `app/tests/compare-saved.test.tsx:268`
  severity: medium
  AC: AC-7
  source: measurement
  detail: `assert.match(actions[0].className, /border/, "nút phải là variant outline")`. Trong app/src/components/ui/button.tsx, chuỗi cva gốc chứa `border border-transparent` cho mọi variant (default, ghost, secondary...). Vì vậy regex khớp với bất kỳ variant nào, và đổi `variant="outline"` thành variant khác thì ca vẫn xanh. E9 hứa "link href '/vn' mang data-variant='outline'", tức một quan hệ giữa phần tử và variant cụ thể. Phép đo chỉ thấy chuỗi con "border" có mặt.
  rationale: AC-7 đòi đúng một nút outline «Tìm thị trường» ở Đã lưu trống; phép đo không phân biệt được variant outline.

- **Hình dạng 4 (assertion âm tính đứng một mình): hàng «Lợi suất ngắn hạn/dài hạn» có thể xanh khi cả nhóm lợi suất vắng mặt**
  file: `scripts/smoke-compare-saved.mjs:90`
  severity: medium
  AC: AC-3
  source: measurement
  detail: `check(ct.includes("Lợi suất ngắn hạn") || !ct.includes("Lợi suất (căn"), ...)`: khi CompareTable bỏ nhóm yield (`hasYield` false, compare-body.tsx) thì cả hai chuỗi đều vắng và vế phải đúng. Lúc đó chỉ còn dòng 91 `!ct.includes("Yield ngắn hạn") && !ct.includes("Yield dài hạn")`, một assertion thuần âm tính. Ca không có đối chứng dương nào cho thấy hàng đổi tên thật sự được vẽ, và "Lợi suất dài hạn" không được assert ở đâu cả. E4 hứa 'ok hàng Lợi suất ngắn hạn/dài hạn' nhưng smoke vẫn ĐẠT khi hàng ấy không có trên trang (tuỳ thị trường mà pickAreas() chọn từ DB).
  rationale: AC-3 đòi hàng lợi suất ghi «Lợi suất ngắn hạn»/«Lợi suất dài hạn»; phép đo vẫn xanh khi hàng không được vẽ.

- **Hình dạng 4 (assertion âm tính đứng một mình): «chiều đỏ» của CS-AC-3 thêm cột là phép đo hiển nhiên đúng**
  file: `app/tests/compare-saved.test.tsx:354`
  severity: low
  AC: AC-3
  source: measurement
  detail: `const again = await addArea(["a", "b"], "a"); assert.deepEqual(again.calls.replace, [], ...)`. Trong addArea, `if (opt) await act(... opt.click())` (dòng 343) lặng lẽ bỏ qua khi không tìm thấy mục, và dòng 349 đã chứng 'a' không có trong danh sách. Vậy `replace` rỗng chỉ vì không có gì được bấm. Assertion âm này đúng sẵn, không chứng được rằng phép đo bắt được lỗi, và không ghim thông điệp. E17 hứa một chiều đỏ khác: router giả không nhận replace thì ca báo 'không đổi ?areas='. Ca đó không có trong tệp, và chuỗi 'không đổi ?areas=' không xuất hiện ở đâu.
  rationale: AC-3 đòi chọn khu vực gọi router.replace và mã đã có không chọn lại được; ca đo âm tính đúng sẵn nên không chứng được vế này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **design_pass toàn cục trong config.yaml bị ghim vào cổng 3460 riêng của dãy U1**
  Người dùng thấy gì: Kiểm giao diện của các hồ sơ nghiệm thu khác có thể mở nhầm bản chạy của dãy U1 và chụp trên mã nguồn của cây làm việc khác. Người dùng cuối không bị ảnh hưởng, chỉ có bằng chứng kiểm giao diện của dãy khác có thể sai nguồn.
  Căn cứ: Chỉ ảnh hưởng người chấm nội bộ, không tới người dùng cổng Invest; nhận ra ngay khi chạy dãy khác và sửa sau rất rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Header So sánh đếm và khoá nút theo mã đã lọc qua chỉ mục, còn bảng âm thầm bỏ khu vực không có market_metrics**
  Người dùng thấy gì: Người dùng chọn một khu vực chưa có số liệu thì tiêu đề ghi «2/4 khu vực» nhưng bảng chỉ hiện 1 cột, hoặc trống. Nếu chọn đủ 4 khu vực như vậy, nút «Thêm khu vực» bị tắt, bảng trống và không có nút gỡ nào, người dùng phải tự sửa địa chỉ trang.
  Căn cứ: Gây kẹt và số hiển thị sai lệch với bảng, nhưng không mất dữ liệu và thoát được bằng cách sửa địa chỉ; đáng làm thành việc riêng vì chạm cách đếm và lọc khu vực.
  file: `app/src/components/compare/compare-body.tsx`
  severity: medium
  Đề xuất: new-contract

- **RegionError không reset khi đổi cột: catchError chỉ xoá lỗi khi pathname đổi, mà thêm cột chỉ đổi ?areas=**
  Người dùng thấy gì: Khi bảng So sánh đã báo lỗi, người dùng thêm hoặc đổi khu vực vẫn thấy thông báo lỗi cũ cho tới khi bấm «Thử lại». Bảng của bộ khu vực mới không hiện ngay.
  Căn cứ: Chỉ xảy ra sau một lỗi tải, và người dùng thoát được ngay bằng nút «Thử lại» hoặc tải lại trang; không mất dữ liệu.
  file: `app/src/components/compare/compare-body.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
