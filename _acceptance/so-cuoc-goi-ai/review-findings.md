## Trong hợp đồng

- **Ghi sổ «fail-soft» không có timeout kết nối, nên runAgent vẫn có thể treo khi DB không phản hồi**
  file: agent/src/runtime/ai-call-log.ts:38
  severity: low
  AC: AC-4
  source: conventions
  detail: `recordCallDb` tạo `new pg.Client({ connectionString })` mà không đặt `connectionTimeoutMillis` hay `query_timeout`. Mặc định của pg là 0, tức chờ vô hạn. `ghiSo` trong loop.ts chỉ bắt lỗi ném ra, không bắt trường hợp treo. Lời gọi lại được `await` trước `writeTrace` và trước khi trả kết quả. Vì vậy khi DATABASE_URL trỏ tới host không trả RST (DB treo, mạng đen), lượt agent judge/enrich sẽ treo theo, trái với ý đồ «sổ hỏng không làm hỏng lượt agent» ghi trong comment (PL29 AC-4). Ca localhost từ chối kết nối thì vẫn lỗi nhanh, nên đường thường không bị ảnh hưởng.

- **Writer mặc định của sổ không có timeout kết nối/truy vấn, nên DB treo sẽ làm treo lượt agent dù ghi chú nói fail-soft**
  file: agent/src/runtime/ai-call-log.ts:38
  severity: low
  AC: AC-4
  source: bugs
  detail: recordCallDb tạo `new pg.Client({ connectionString })` mà không đặt connectionTimeoutMillis, statement_timeout hay query_timeout. Mặc định của pg là 0, tức chờ vô hạn. ghiSo trong loop.ts `await recordCall(r)` ngay trên đường trả kết quả của runAgent và chỉ bắt lỗi ném ra, không bắt trường hợp treo. Hai ca có thể xảy ra: container :5433 bị pause hoặc không phản hồi dù cổng vẫn mở, hoặc INSERT bị khoá chờ (ví dụ đang TRUNCATE hay ALTER ai_calls). Khi đó generateText đã xong nhưng runAgent không bao giờ trả về, các lượt judge-run/enrich-run treo theo. Điều này trái với cam kết «sổ hỏng không làm hỏng lượt agent» (AC-4).

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Migration 052 và khối bản tin dùng tên cột, khoá và enum tiếng Việt, trái luật đặt tên đã chốt**
  Người dùng thấy gì: Người dùng không thấy gì khác: trang Cuộc gọi AI chạy đúng. Chỉ là tên nội bộ của sổ ghi bằng tiếng Việt trong khi quy ước dự án muốn tiếng Anh, nên người làm sau sẽ thấy lẫn lộn.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu, nhưng đổi tên sau khi đã ghi dữ liệu thật thì tốn công sửa ở nhiều nơi, nên nên ghi rõ đây là ngoại lệ đã duyệt thay vì sửa.
  file: `db/migrations/052_ai_calls.sql`
  severity: medium
  Đề xuất: known-limits

- **Ô tổng chi phí ở đầu trang bỏ qua các nhóm chưa có giá, có thể ghi «0 đ — mô hình chạy tại máy»**
  Người dùng thấy gì: Khi có cả mô hình chạy tại máy (miễn phí) lẫn mô hình chưa khai giá, ô tổng chi phí ở đầu trang có thể ghi «0 đ — mô hình chạy tại máy», làm người xem tưởng chưa tốn đồng nào dù có cuộc gọi chưa biết giá. Dòng mô tả bên dưới vẫn nêu số nhóm chưa có giá.
  Căn cứ: Số đầu trang có thể gây hiểu nhầm về chi phí, nhưng không mất dữ liệu, bảng chi tiết và dòng mô tả bên dưới vẫn đúng, và chỉ xảy ra khi có mô hình chưa khai giá.
  file: `app/src/components/ops/ai-calls/ai-calls-view.tsx`
  severity: medium
  Đề xuất: known-limits

- **Lỗi ghi trace sau khi sổ đã ghi 'ok' làm một lượt bị ghi hai dòng (một ok, một lỗi)**
  Người dùng thấy gì: Nếu ổ đĩa đầy hoặc thiếu quyền ghi tệp vết, một lượt chạy agent có thể bị đếm thành hai cuộc gọi, một thành công và một lỗi, làm số liệu trên trang Cuộc gọi AI lệch nhẹ.
  Căn cứ: Chỉ xảy ra khi đĩa có sự cố hiếm, ảnh hưởng là lệch vài con số thống kê chứ không mất hay hỏng dữ liệu đầu tư, và sự cố đĩa thường được phát hiện từ chỗ khác.
  file: `agent/src/runtime/loop.ts`
  severity: low
  Đề xuất: known-limits

- **Đầu dò đối chiếu đếm cả trace do bộ test agent sinh ra, nên báo LECH giả**
  Người dùng thấy gì: Lệnh đối chiếu sổ với tệp vết có thể báo «lệch» giả sau khi chạy bộ test agent, khiến người vận hành lo nhầm là sổ sai trong khi sổ thật vẫn đúng.
  Căn cứ: Chỉ gây báo động giả cho người vận hành khi tự chạy lệnh đối chiếu, không ảnh hưởng dữ liệu hay trang, và chỉ cần biết để bỏ qua các nhóm mẫu thử.
  file: `_acceptance/so-cuoc-goi-ai/probes/doi-chieu.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình, không ghim thông điệp): ca 'mốc đo cũ → cảnh báo số cũ' chỉ kiểm s.html !== t.html**
  Người dùng thấy gì: Bài kiểm tự động cho cảnh báo «số đã cũ» chưa chứng minh chắc là cảnh báo có hiện; nếu sau này cảnh báo bị mất, bài kiểm vẫn có thể báo đạt.
  Căn cứ: Trang hiện tại chưa bị chứng minh là sai, rủi ro chỉ là lần sửa sau có thể làm mất cảnh báo mà không ai hay, và người dùng tự thấy được khi số quá cũ.
  file: `_acceptance/so-cuoc-goi-ai/probes/facts.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert 'chuỗi có mặt' trong khi lời hứa là quan hệ): 'chưa có giá' được khớp ở bất kỳ đâu trong HTML, không gắn với dòng của model chưa có giá**
  Người dùng thấy gì: Bài kiểm tự động chưa chắc bắt được trường hợp dòng của mô hình chưa có giá bị hiện «0 đ» thay vì «chưa có giá», vì chữ «chưa có giá» còn xuất hiện ở chỗ khác trên trang.
  Căn cứ: Trang hiện tại chưa bị chứng minh hiển thị sai; rủi ro chỉ là lỗi tương lai lọt qua kiểm tự động, người dùng nhìn bảng sẽ thấy được.
  file: `app/tests/ai-calls.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo cái đưa vào bộ dựng thay vì đầu ra): token và chi phí của từng nhóm chỉ được so trên data.nhom, không so trên HTML đã dựng**
  Người dùng thấy gì: Bài kiểm tự động chưa đối chiếu từng con số token và chi phí trong bảng trên màn hình, nên nếu một cột bị gắn nhầm số thì bài kiểm vẫn có thể không phát hiện.
  Căn cứ: Chưa có bằng chứng bảng đang sai; đây chỉ là khoảng hở kiểm tự động, và người dùng đọc bảng có thể tự nhận ra số lệch.
  file: `_acceptance/so-cuoc-goi-ai/probes/trang.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có case điểm): 'ma trận 3 model × 2 kết quả × 3 ngày' chỉ phủ 7/18 ô**
  Người dùng thấy gì: Bộ kiểm tự động cho phép tính chi phí và gom nhóm theo ngày chỉ thử một phần các tổ hợp mô hình, kết quả và ngày, nên một số tổ hợp hiếm chưa được kiểm.
  Căn cứ: Các tình huống chính đã được kiểm và chưa thấy số sai; tổ hợp còn thiếu hiếm gặp và nếu sau này lệch thì thấy được trên trang, không mất dữ liệu.
  file: `pipeline/lib/ai-calls.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo bản sao thay vì đầu ra thật): ma trận E5 kiểm tongHopDong (bản JS song sinh), còn đường chạy thật là AI_CALLS_SQL**
  Người dùng thấy gì: Phép tính chi phí và gom ngày được kiểm trên một bản tính song song chứ chưa kiểm trực tiếp trên đường tính thật của trang, nên lỗi ở ranh giới nửa đêm của đường thật có thể không bị bắt.
  Căn cứ: Chưa có bằng chứng số thật sai; nếu có lệch sẽ ở vài cuộc gọi sát nửa đêm làm lệch ngày, ảnh hưởng thống kê nhẹ và sửa sau không đắt.
  file: `pipeline/lib/ai-calls.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
