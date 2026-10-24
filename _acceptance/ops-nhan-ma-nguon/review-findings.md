## Trong hợp đồng

- **Bộ quét chữ hiển thị bỏ sót chuỗi nằm trong ${…} của template literal: thước ON7 báo xanh dù có lộ tên**
  file:line: `scripts/lib/ops-visible-strings.mjs:1235`
  severity: medium
  AC: AC-3
  source: bugs
  detail: Trong scanSource, dòng `if (!ts.isTemplateExpression(n)) ts.forEachChild(n, visit)` cố ý không đi vào con của TemplateExpression. Hàm literalText chỉ nối các khúc tĩnh (head + span.literal), nên mọi chuỗi literal đặt trong biểu thức thay thế không bao giờ được quét. Việc bỏ đi vào con cũng không tránh được đếm trùng gì, vì TemplateHead/TemplateMiddle không khớp isLiteral; tác dụng duy nhất là bỏ sót. Kiểm thử thật bằng tên S01 lấy từ migration: `<div title={`a ${x ? "<tên>" : ""}`}/>` và `<div>{`a ${x ? "<tên>" : "b"}`}</div>` đều trả 0 hit. Trong khi đó `<div>{x ? "<tên>" : "b"}</div>` trả 1 hit. Mẫu này có thật trong vùng vừa đổi, ví dụ description của ZaloPipePanel `${zalo.heartbeatAgeMin === null ? "—" : …}`. Hậu quả: nếu ai đó viết tên nguồn thật ở một nhánh ternary bên trong template, check-portal-compliance mục 12 (check-ops-tier-a) vẫn báo «0 chỗ trúng», tức là lọt im lặng. Cách sửa: luôn gọi forEachChild, kể cả với TemplateExpression. Khúc tĩnh đã được quét qua literalText, còn chuỗi con sẽ được displayContext đánh giá riêng.
  rationale: AC-3 đòi bản sao chèn tên thật vào một template literal render qua {…} phải bị bắt; finding chứng minh tên đặt trong phần thay thế của template literal cho 0 hit.

- **Hình dạng 3 — kiểm «chuỗi có mặt» trong khi lời hứa là QUAN HỆ: cảnh báo kênh đứt có liên kết tới /ops/sources**
  file:line: `app/tests/ops-nhan-ma-nguon.test.tsx:89`
  severity: medium
  AC: AC-1
  source: measurement
  detail: AC-1 hứa «cảnh báo kênh đứt có liên kết tới /ops/sources», tức là liên kết phải nằm TRONG Alert kênh đứt. Nhưng assert chỉ là `assert.ok(h.includes('href="/ops/sources"'))` trên toàn bộ HTML. CollectionsView lúc nào cũng render ZaloGroupsTable (collections-view.tsx, bọc trong div#nhom-s03), và footnote của bảng này có `<Link href="/ops/sources">Nguồn dữ liệu</Link>` không kèm điều kiện nào (collections-tables.tsx:201). Ở biến thể canh-bao, heartbeatAgeMin=45 cũng bật Alert «Probe trễ», trong đó có thêm một href="/ops/sources" (pipe-panels.tsx:48). Vì vậy dù xoá Link khỏi Alert «Kênh … đứt» (pipe-panels.tsx:36), hay mục zalo-down của AttentionList chỉ có chữ «Đăng nhập lại ở Nguồn dữ liệu» mà không có liên kết, ca này vẫn xanh. Phép đo không ràng buộc href với khối cảnh báo kênh đứt.
  rationale: AC-1 hứa cảnh báo kênh đứt có liên kết tới /ops/sources, nhưng phép đo chỉ thấy liên kết ở đâu đó trong HTML nên không chứng được lời hứa này.

- **Hình dạng 5 — tuyên quét lớp «mọi nhánh cảnh báo» nhưng fixture chỉ bật một phần nhánh**
  file:line: `app/tests/ops-nhan-ma-nguon.test.tsx:76`
  severity: low
  AC: AC-1
  source: measurement
  detail: Tên ca ON7-AC-1 (dòng 85) tuyên «mọi nhánh cảnh báo → 0 tên nguồn thật». Thực tế fixture `collections("canh-bao")` đặt `feedHealth: []` (dòng 76) và `factsPushedAt: null` (dòng 75). Do đó trong issuesOf (attention-list.tsx) không chạy tới nhánh «Máy thu có thể offline», «<code> trễ SLO» và «<code> chưa có dữ liệu». Alert «Máy thu có thể offline» của CollectionsView cũng không render, FeedsGrid render với dữ liệu rỗng nên cột Nguồn (`row.original.labelVi`, feeds-grid.tsx:34) không có ô nào để quét. Fixture bật được 6 trong 9 nhánh của issuesOf, và không có bảng nhánh viết trước nào đối chiếu số nhánh với số ca. Ngoài ra, mục «đủ 6 job» mà hợp đồng AC-1 liệt kê không được assert trong ca này.
  rationale: AC-1 đòi dữ liệu mẫu bật mọi nhánh cảnh báo và đủ 6 job, nhưng fixture bỏ trống nhiều nhánh và không kiểm đủ 6 job.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Nhãn UI mới «Điểm thị trường» nằm trong danh sách _Avoid_ của CONTEXT.md, và lệch với «Market Score» ngay trong cùng component**
  Người dùng thấy gì: Trang chất lượng dữ liệu của người vận hành gọi cùng một con số bằng hai tên khác nhau («Điểm thị trường» và «Market Score»), có thể gây nhầm lẫn khi đọc. Không lộ dữ liệu và không ảnh hưởng số liệu.
  Căn cứ: Chỉ là lệch cách gọi tên trên màn hình nội bộ, không mất hay lộ dữ liệu, người vận hành vẫn hiểu được; sửa sau rẻ vì chỉ đổi chữ.
  file: `app/src/components/ops/quality-tables.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

