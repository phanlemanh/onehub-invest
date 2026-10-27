# Review findings: quyen-bon-vai-mot-cho (round 1)

## Trong hợp đồng

- **Hình dạng 4 (âm tính một mình): ô «qua» của ma trận QV-AC-2 chỉ assert «không phải 401/403», nhận cả 500**
  file: `app/tests/quyen-bon-vai.test.tsx:395`
  severity: high
  AC: AC-2
  source: measurement
  detail: Với mọi ô `o.ky === "qua"`, phép đo chỉ có `if (r.status === 401 || r.status === 403) sai.push(...)`. Nó không ghim mã dương nào, trong khi E2 hứa «mỗi ô ghim mã HTTP mong đợi (... 2xx/4xx nghiệp vụ khi qua)». Dòng 301-303 còn đổi mọi lỗi handler ném ra thành `new Response(..., { status: 500 })`. Hệ quả: nếu chính `kiemQuyen` ném lỗi (đọc phiên hỏng, thiếu bảng sessions, v.v.) thì ô vẫn trả 500 và vẫn tính là «qua cổng quyền». Ô qua không có đối chứng dương: không assert 2xx/4xx, không ghim thông điệp. Vì vậy 147 ô không phân biệt được «cổng cho qua» với «cổng sập».

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): QV-AC-3 tự liệt kê 12 ca thay vì mọi ô «qua» của hành động ghi trong MA_TRAN**
  file: `app/tests/quyen-bon-vai.test.tsx:430`
  severity: high
  AC: AC-3
  source: measurement
  detail: E3 và AC-3 hứa «với mọi ô qua-và-thành-công của hành động ghi ở MA_TRAN» thì đúng 1 dòng audit, actor `user:<id>`, đúng action. Nhưng mảng `ca` (dòng 430-441) viết tay, không rút từ `MA_TRAN`, và mỗi hành động chỉ có một người gọi. ingest chỉ chạy bearer và ops. review.decide chỉ chạy ops, thiếu admin và owner. Năm unit.* chỉ chạy admin, thiếu owner. zalo.admin chỉ có accounts POST/DELETE và groups POST với admin, không có ô zalo/login. Vai owner không xuất hiện ở bất kỳ ô ghi nào. Không có assert dạng `ca.length === <số ô qua-ghi của MA_TRAN>`. Phần kiểm audit/actor ở mức route còn trống cho các ô qua-ghi khác của QV-AC-2, mà QV-AC-2 thì không đếm audit ở ô qua.

- **Hình dạng 3 (chuỗi/khoá có mặt thay cho quan hệ): QV-AC-3 chỉ kiểm detail có khoá from/to, không kiểm giá trị trước/sau**
  file: `app/tests/quyen-bon-vai.test.tsx:450`
  severity: high
  AC: AC-3
  source: measurement
  detail: `assert.ok("from" in d.detail && "to" in d.detail, ...)` chỉ đo khoá có mặt. Lời hứa của AC-3 là một quan hệ: «detail mang trạng thái trước và sau khi thao tác đổi trạng thái». Cần assert `from` bằng trạng thái đọc trước thao tác (vd toggle: 'active') và `to` bằng trạng thái sau ('paused'). Hiện ghi `from` = `to`, ghi null hay ghi đảo chiều đều vẫn xanh. Phép đo chỉ chạy nhánh vòng đời (lược đồ dungSauGop). Nhánh toggle không vòng đời ở source-groups/route.ts:165 ghi detail không có `from` mà không ca nào chạm tới.

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): QV-AC-5 hứa việc lỗi cho mọi lệnh zalo nhưng không đo nhánh openclaw thoát 1**
  file: `app/tests/quyen-bon-vai.test.tsx:38`
  severity: high
  AC: AC-5
  source: measurement
  detail: E5 hứa «cùng lệnh [groups POST, accounts POST/DELETE, login POST/DELETE] khi openclaw giả thoát 1 hoặc tệp cấu hình không ghi được → mã lỗi ≥ 400 và 0 dòng audit». Hằng `OC_FAIL` (dòng 38, dùng trong script giả ở dòng 41) không bao giờ được tạo, nên nhánh openclaw thoát 1 không chạy lần nào. Phần việc lỗi (dòng 549-566) chỉ có hai điểm-case cấu hình chỉ-đọc (groups POST, accounts POST), cộng thêm login POST với id lạ. Ca id lạ là lỗi kiểm đầu vào 400, không phải việc ngoài DB lỗi. accounts DELETE lỗi, login POST lỗi khi spawn hay khi openclaw thoát 1, và login DELETE lỗi đều không có ô nào. Không có ma trận lệnh × kiểu lỗi viết trước.

- **Hình dạng 2 (dựng tay đúng khuôn bên đọc, không round-trip writer→reader): QV-AC-10 tự viết header bearer thay vì dùng request của push-ops-facts**
  file: `app/tests/quyen-bon-vai.test.tsx:648`
  severity: medium
  AC: AC-10
  source: measurement
  detail: `captureOpsFacts` chạy push-ops-facts thật, nhưng máy chủ thu tạm (capture-ops-facts.mjs) chỉ giữ body, không giữ header hay URL. Ca thử sau đó tự gọi `goi("ingest", "POST", { authorization: `Bearer ${TOKEN}` }, { body: payload })`, tức header viết tay theo đúng khuôn mà `kiemQuyen` đọc. Chỉ payload được round-trip. Header thật của bên ghi (push-ops-facts.mjs:281 `authorization: Bearer ${token}` lấy từ CLOUD_OPS_API_TOKEN) và đường INGEST_URL không đi qua route. Nếu push-ops-facts đổi tên header, bỏ tiền tố Bearer hay đổi đường dẫn, ca vẫn xanh, trái với lời hứa E10 «đẩy số qua route ingest thật bằng bearer» và AC-10 «máy đêm nạp số vẫn chạy».

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Vai viewer mới qua canAccessOps nên đọc được thẻ duyệt review_queue, trái luật 6 «thẻ duyệt cho vai ops trở lên»**
  Người dùng thấy gì: Nếu sau này có người được cấp vai chỉ-xem, người đó sẽ thấy nguyên văn các thẻ duyệt trên trang duyệt, thứ lẽ ra chỉ dành cho vai vận hành trở lên. Hiện chưa ai mang vai này nên chưa lộ thật.
  Căn cứ: Chưa có ai mang vai chỉ-xem nên chưa lộ dữ liệu thật, nhưng phải xử lý trước khi cấp vai đó cho bất kỳ ai; việc này thuộc phần kiểm vai ở trang mà vòng này đã loại ra.
  file: `app/src/lib/ops-access.ts`
  severity: medium
  Đề xuất: new-contract

- **source-groups POST trả 400 luật PL12 cho người gọi chưa qua cổng quyền**
  Người dùng thấy gì: Người chưa đăng nhập hoặc không đủ quyền, nếu gửi yêu cầu sai nhóm, sẽ nhận thông báo lỗi nhóm thay vì bị từ chối quyền, nên biết được một phần luật nhóm. Không có dữ liệu nào bị đổi.
  Căn cứ: Chỉ lộ một câu chữ của luật và không ghi hay đổi gì; người dùng thật không bị ảnh hưởng, sửa sau cũng không đắt.
  file: `app/src/app/api/v1/ops/source-groups/route.ts`
  severity: low
  Đề xuất: known-limits

- **nguoiTuRequest gọi decodeURIComponent trên cookie thô, không bắt lỗi: cookie hỏng biến 401 thành 500**
  Người dùng thấy gì: Một yêu cầu mang cookie đăng nhập bị hỏng sẽ nhận lỗi máy chủ thay vì yêu cầu đăng nhập lại. Cookie thật do hệ thống cấp không gặp lỗi này.
  Căn cứ: Chỉ xảy ra khi cookie bị sửa tay hoặc hỏng, người dùng bình thường không chạm phải; không lộ hay mất dữ liệu, tải lại hoặc đăng nhập lại là xong.
  file: `app/src/lib/auth.ts`
  severity: low
  Đề xuất: known-limits

- **ghiRoiLam giữ transaction mở trong lúc startZaloLogin chờ QR tới 20 giây**
  Người dùng thấy gì: Khi bấm đăng nhập Zalo, một kết nối cơ sở dữ liệu bị giữ tới khoảng 20 giây chờ mã QR; bấm liên tiếp nhiều lần có thể làm các thao tác khác chậm hoặc nghẽn tạm thời.
  Căn cứ: Chỉ ảnh hưởng khi vài người bấm đăng nhập Zalo cùng lúc, tự hết sau vài chục giây và không mất dữ liệu; thao tác này hiếm và do quản trị viên làm.
  file: `app/src/lib/audit.ts`
  severity: low
  Đề xuất: known-limits

- **Smoke cổng tuân thủ vẫn chờ 401 cho phiên role=user, nhưng kiemQuyen nay trả 403, nên lệnh portal_smoke sẽ đỏ**
  Người dùng thấy gì: Bài kiểm tra nhanh của cổng tuân thủ sẽ báo đỏ dù hệ thống hoạt động đúng, vì nó còn chờ mã từ chối cũ. Người vận hành có thể bị báo động giả.
  Căn cứ: Hệ thống chạy đúng, chỉ có bài kiểm tra báo sai nên không ảnh hưởng người dùng; cần chỉnh kỳ vọng của bài kiểm tra để khỏi báo động giả, sửa rẻ.
  file: `scripts/smoke-portal-compliance.mjs`
  severity: medium
  Đề xuất: known-limits

- **source-groups POST trả 400 theo luật PL12 trước khi kiểm quyền: khách và vai thấp nhận 400 thay vì 401/403**
  Người dùng thấy gì: Khách hoặc người vai thấp gửi yêu cầu sai nhóm sẽ nhận thông báo lỗi nhóm thay vì bị từ chối quyền. Không có dữ liệu nào bị thay đổi.
  Căn cứ: Hậu quả chỉ là sai mã từ chối và lộ một câu chữ luật, không ghi hay mất dữ liệu; người dùng thật không gặp.
  file: `app/src/app/api/v1/ops/source-groups/route.ts`
  severity: low
  Đề xuất: known-limits

- **nguoiTuRequest ném URIError khi cookie oi_session có mã % hỏng, nên route Ops trả 500 thay vì 401**
  Người dùng thấy gì: Yêu cầu mang cookie đăng nhập bị hỏng nhận lỗi máy chủ thay vì được yêu cầu đăng nhập lại. Phiên đăng nhập thật không bị ảnh hưởng.
  Căn cứ: Chỉ cookie dựng tay mới gây ra, người dùng bình thường không gặp; không lộ hay mất dữ liệu và đăng nhập lại là xử lý được.
  file: `app/src/lib/auth.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình, không ghim thông điệp): đối chứng dương QV-AC-2b chỉ assert notEqual 403**
  Người dùng thấy gì: Bài kiểm tra chứng minh bộ thử phát hiện được lỗi phân quyền còn lỏng, nên có thể bỏ sót một số kiểu hỏng của cổng quyền. Người dùng cuối không thấy ảnh hưởng trực tiếp.
  Căn cứ: Chỉ làm bộ kiểm tra tự thân kém chặt, không ảnh hưởng chức năng đang chạy hay dữ liệu; có thể bổ sung sau với chi phí thấp.
  file: `app/tests/quyen-bon-vai.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
