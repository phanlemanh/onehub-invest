## Trong hợp đồng

- **Hình dạng 3: TDB-AC-5 kiểm ô số bằng «chuỗi có mặt» lỏng thay vì kiểm quan hệ ô ↔ giá trị (và chỉ đo 3 trên 4 ô)**
  file: `app/tests/registry-chi-doc.test.tsx:301`
  severity: medium
  AC: AC-5
  source: measurement
  detail: Assert `assert.match(html, new RegExp(`${nhan}</h3>[\s\S]*?>${v}</span>`))` dùng `[\s\S]*?` không có biên, nên nó tìm `>v</span>` ở BẤT KỲ chỗ nào sau tiêu đề ô, không bắt buộc nằm trong ô đó. Với ma trận D1 (Phân khu 3, Toà 3, Căn 5): nếu ô Phân khu sai thì regex vẫn khớp với `>3</span>` của ô Toà; nếu ô Toà sai thì vẫn khớp với Badge `{rows.length}` = 3 của tab «Mọi toà» trong DuAnToaGrid (Badge in ra thẻ span). Lời hứa trong evals E5 là «bốn ô số bằng số của D1 ở docDanhBa», tức quan hệ giữa từng ô và giá trị của nó, nhưng phép đo chỉ chứng được rằng số đó xuất hiện ở đâu đó phía sau. Thêm nữa, vòng lặp chỉ có ba ô [Toà, Căn, Phân khu] và bỏ ô «Tin đang rao», trong khi hợp đồng nói bốn ô. Lý do: AC-5 đòi bốn ô số của trang dự án bằng đúng số của dự án đó; phép đo chỉ kiểm số có mặt lỏng và bỏ một ô nên chưa chứng được AC-5.

- **Hình dạng 3: TDB-AC-5 kiểm «tab Chưa có căn đếm 1» bằng regex lazy khớp `>1<` ở bất cứ đâu phía sau**
  file: `app/tests/registry-chi-doc.test.tsx:305`
  severity: medium
  AC: AC-5
  source: measurement
  detail: `assert.match(html, /Chưa có căn[\s\S]*?>1</, "TDB-AC-5 tab chưa có căn đếm 1")`: lần xuất hiện đầu của «Chưa có căn» là nhãn tab trong FrameHeader của du-an-toa-grid.tsx, nhưng regex không bị giới hạn trong Badge của tab. Nếu `chuaCan.length` sai (ví dụ 0), regex vẫn đi tiếp và khớp `>1<` ở bảng toà phía sau (T1 có soTruc = 1, cột Trục in `<span …>1</span>`). Lời hứa là quan hệ «số trên tab = số toà có 0 căn», còn phép đo chỉ kiểm có ký tự 1 nằm sau nhãn. Ca này cũng không có chiều đỏ. Lý do: AC-5 đòi tab «Chưa có căn» chỉ chứa toà không có căn và đếm đúng; phép đo có thể xanh khi số đếm sai.

- **Hình dạng 1: TDB-AC-8 grep mã nguồn page.tsx thay vì đo trạng thái lỗi được vẽ ra**
  file: `app/tests/registry-chi-doc.test.tsx:394`
  severity: medium
  AC: AC-8
  source: measurement
  detail: Evals E8 hứa «page bọc RegionError (nội dung ném lỗi → «Thử lại»)», nhưng test chỉ `readFileSync` hai tệp page.tsx rồi `assert.match(src, /<RegionError what="[^"]+">\s*<Suspense fallback={<RegistrySkeleton/)`. Phép đo này nhìn vào chữ trong mã nguồn, không dựng trang với một nội dung ném lỗi và không kiểm HTML có «Thử lại». Nếu RegionError không bắt được lỗi của con async, hoặc không hiện nút Thử lại, hoặc chuỗi đó nằm trong chú thích hay nhánh chết, ca vẫn xanh. Đầu ra mà AC hứa (lỗi tại chỗ kèm Thử lại) chưa được đo. Lý do: AC-8 đòi khi truy vấn lỗi thì hiện lỗi kèm «Thử lại»; test chỉ grep mã nguồn, không đo đầu ra được vẽ ra.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Đọc tên nguồn lỗi hoặc source_registry rỗng thì mọi tên trong danh bạ thành «—» mà không báo gì**
  Người dùng thấy gì: Nếu việc đọc danh sách tên nguồn bị lỗi, người vận hành thấy trang danh bạ đầy dấu «—» ở mọi tên và mã, ô tìm không khớp gì, mà không có cảnh báo nào. Dữ liệu không bị lộ hay mất, tải lại trang khi hết lỗi là hiện lại bình thường.
  Căn cứ: Hậu quả nhẹ: chỉ hiển thị trống tạm thời ở trang chỉ đọc, không lộ dữ liệu, người dùng tự tải lại được; chỉ gây nhầm lẫn chứ không gây sai số liệu.
  file: `app/src/lib/ops/registry/cay.ts`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
