# Review findings: quyen-bon-vai-mot-cho (round 2)

## Trong hợp đồng

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): nhánh «openclaw giả thoát 1» của E5 không có ma trận, ô duy nhất lại assert ngược lời hứa**
  file: app/tests/quyen-bon-vai.test.tsx:621
  severity: medium
  AC: AC-5
  source: measurement
  detail: E5 (evals.yaml) hứa cho cả lớp lệnh zalo ghi: «cùng lệnh khi openclaw giả thoát 1 hoặc tệp cấu hình không ghi được → mã lỗi ≥ 400 và 0 dòng audit». Bảng viết trước LOI (dòng 597-602) chỉ có kiểu lỗi cấu hình ('cfg-chi-doc' | 'cfg-khong-doc'). Nhánh openclaw thoát 1 (OC_FAIL) chỉ được bật ở một điểm-case, dòng 621-633 (zalo/accounts DELETE), và ở đó ca assert điều ngược lại: `assert.equal(r.status, 200)` và `(await nAudit()) - n0 === 1`. Không ô nào chạy zalo/login POST hay zalo/groups POST hay zalo/accounts POST với openclaw thoát 1. Riêng login POST mà openclaw thoát 1 thì startZaloLogin chờ QR rồi trả `qrBase64: null`, tức 200 kèm 1 dòng audit, trái với E5. Văn bản E5 chưa được sửa theo hành vi «đăng xuất best-effort». Kết quả là ca thử xanh trong khi `expected` của E5 không đúng cho nhánh này.
  rationale: AC-5 đòi khi việc ngoài DB lỗi (openclaw giả) thì route trả lỗi và 0 dòng audit, nhưng nhánh openclaw thoát 1 không được đo cho cả lớp lệnh zalo và ca duy nhất assert 200 kèm 1 dòng audit.

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc, không round-trip): đối chứng dương của QV-AC-10b bơm thẳng vào map nội bộ, bỏ qua bước thu tệp**
  file: app/tests/quyen-bon-vai.test.tsx:778
  severity: medium
  AC: AC-10
  source: measurement
  detail: quetBearer(goc, them) gộp `them` thẳng vào `doc` (dòng 757: `const doc = { ...them }`), tức khuôn {đường dẫn: nội dung} mà vòng so khớp đọc. Bước thu tệp thật (`git ls-files` cộng bộ lọc loại `app/tests/`, `docs/`, `*.md|html|json` ở dòng 754-756) bị bỏ qua hoàn toàn. Đối chứng dòng 778-779 vì thế chỉ chứng minh regex `/api/v1/ops/([a-z-]+)` bắt được chuỗi. Nó không chứng minh tệp thật ở `scripts/` đi qua được bộ lọc để vào tập quét. Bộ lọc có lỡ loại cả lớp tệp chạy thật thì đối chứng vẫn xanh. E10 hứa «thêm một tệp giả trong thư mục tạm … vào tập quét», nhưng ở đây không có tệp nào được tạo hay được ls-files/đọc ra.
  rationale: AC-10 đòi «mọi chỗ trong cây» gọi bằng OPS_API_TOKEN chỉ nhắm hành động bảng cho bearer, mà thước quét không chứng minh được tệp thật ở scripts/ đi qua bộ lọc vào tập quét.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **source-groups POST: chặn PL12 (S02/S03) chạy TRƯỚC kiemQuyen cho toggle/add/delete, người chưa đăng nhập nhận 400 kèm luật thay vì 401/403**
  Người dùng thấy gì: Người chưa đăng nhập gửi yêu cầu bật/tắt nhóm nguồn thuộc loại bị cấm sẽ thấy báo lỗi kèm câu giải thích luật, thay vì bị yêu cầu đăng nhập. Không có dữ liệu nào bị đổi hay lộ ngoài câu luật.
  Căn cứ: Hậu quả nhẹ: chỉ lộ một câu luật nội bộ, không ghi hay lộ dữ liệu, và sửa sau rẻ nên có thể ghi nhận rồi ship.
  file: `app/src/app/api/v1/ops/source-groups/route.ts`
  severity: medium
  Đề xuất: known-limits
- **nguoiTuRequest: decodeURIComponent không bọc try, cookie oi_session hỏng làm mọi route /api/v1/ops/** ném 500 thay vì 401**
  Người dùng thấy gì: Nếu trình duyệt giữ một cookie đăng nhập bị hỏng, các lệnh gọi Ops trả lỗi máy chủ thay vì yêu cầu đăng nhập lại. Người dùng xoá cookie hoặc đăng nhập lại là hết.
  Căn cứ: Hậu quả nhẹ và hiếm gặp, không mất hay lộ dữ liệu, người dùng tự khắc phục bằng cách xoá cookie hoặc đăng nhập lại.
  file: `app/src/lib/auth.ts`
  severity: medium
  Đề xuất: known-limits
- **che-do-thu.ts và so-don-vi.ts vẫn tự viết INSERT ops_audit, không đi qua ghiAuditTrong mới**
  Người dùng thấy gì: Người dùng không thấy khác biệt: các thao tác đổi chế độ thu và sửa thông tin đơn vị vẫn ghi nhật ký đúng. Chỉ là mã nguồn có hai chỗ ghi nhật ký lệch khuôn chung.
  Căn cứ: Không ảnh hưởng người dùng, chỉ là chuyện gọn mã nên ghi nhận và dọn khi chạm lại phần này.
  file: `app/src/lib/che-do-thu.ts`
  severity: low
  Đề xuất: known-limits
- **portal_smoke sẽ đỏ: smoke vẫn chờ 401 cho phiên role=user, nhưng kiemQuyen nay trả 403**
  Người dùng thấy gì: Bài kiểm nhanh tuân thủ cổng sẽ báo đỏ dù hệ thống chạy đúng, vì nó còn chờ mã từ chối cũ. Người dùng cuối không bị ảnh hưởng, nhưng người vận hành có thể thấy cảnh báo giả.
  Căn cứ: Chỉ là kỳ vọng lỗi thời của một bài kiểm, không ảnh hưởng người dùng hay dữ liệu, sửa sau rẻ.
  file: `scripts/smoke-portal-compliance.mjs`
  severity: medium
  Đề xuất: known-limits
- **source-groups POST trả 400 luật PL12 trước khi kiểm quyền (toggle/add/delete)**
  Người dùng thấy gì: Khách chưa đăng nhập hoặc vai thấp gửi yêu cầu cho nhóm nguồn bị cấm nhận báo lỗi kèm câu luật thay vì bị từ chối quyền. Không có dữ liệu nào bị đổi.
  Căn cứ: Hậu quả nhẹ, không ghi hay lộ dữ liệu ngoài một câu luật, nên ghi nhận như giới hạn đã biết.
  file: `app/src/app/api/v1/ops/source-groups/route.ts`
  severity: low
  Đề xuất: known-limits
- **nguoiTuRequest: decodeURIComponent không bắt lỗi, cookie % hỏng làm route Ops ném lỗi (500) thay vì 401**
  Người dùng thấy gì: Cookie đăng nhập hỏng khiến trang/lệnh Ops báo lỗi máy chủ thay vì đưa về đăng nhập. Đăng nhập lại là xử lý được.
  Căn cứ: Hiếm gặp, không mất dữ liệu, người dùng tự gỡ được bằng cách xoá cookie.
  file: `app/src/lib/auth.ts`
  severity: low
  Đề xuất: known-limits
- **zalo/login POST ghi audit 'login.start' cả khi chỉ trả lại tiến trình đăng nhập đang chạy (không có thay đổi)**
  Người dùng thấy gì: Nhật ký thao tác có thể có thêm dòng «bắt đầu đăng nhập Zalo» khi người dùng bấm lại lúc tiến trình đang chạy, dù không có phiên mới nào bật. Chỉ làm nhật ký dài hơn thực tế.
  Căn cứ: Chỉ thừa một dòng nhật ký, không đổi dữ liệu hay quyền, nên chấp nhận và ghi nhận.
  file: `app/src/app/api/v1/ops/zalo/login/route.ts`
  severity: low
  Đề xuất: known-limits
- **Hình dạng 4 (không ghim thông điệp): đối chứng dương QV-AC-2b không chạy phép đo của QV-AC-2 và không ghim tên ô được báo**
  Người dùng thấy gì: Bài kiểm chứng minh thước đo phân quyền bắt được lỗi còn yếu hơn lời hứa: nó chưa chứng minh thước gọi đúng tên ô bị hỏng. Người dùng cuối không bị ảnh hưởng, chỉ là độ tin cậy của bài kiểm thấp hơn dự kiến.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, chỉ là độ chặt của một bài kiểm đối chứng, bổ sung sau rẻ.
  file: `app/tests/quyen-bon-vai.test.tsx`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/10 lỗi rơi vào file không bộ đo nào phủ (app/src/lib/che-do-thu.ts, scripts/smoke-portal-compliance.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
