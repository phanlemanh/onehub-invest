# Review findings: app-test-chiu-song-song (round 2)

## Trong hợp đồng

- **Probe AC-2 (khoa) dựng lược đồ riêng thiếu neuLaBang(sellers), lệch với cách hai tệp test dựng thật**
  file: `_acceptance/app-test-chiu-song-song/probes/song-song.mjs:245`
  severity: medium
  AC: AC-2
  source: conventions
  detail: Vòng này hai tệp test đã sửa finding round 1: withTx gọi `luocDoRieng(c, [...BANG, ...(await neuLaBang(c, "sellers"))])` (app/tests/deals-phi-ly.test.tsx, pipeline/scripts/deals-phi-ly.test.mjs). Nhờ vậy câu `DROP TABLE sellers` không ghi tên lược đồ trong khối DO của 060 (db/migrations/060_sdt_e164.sql, bước 5) rơi vào bản chép riêng. Mode `khoa` của probe thì chỉ rút danh sách bằng `bangCua(f)` (regex `const BANG = [...]`), gọi `luocDoRieng(c, bang, ...)` rồi chạy `MIG_060` mà không thêm `neuLaBang(c, "sellers")`. Trên DB `oneinvest` dùng chung (mode khoa không dùng DB thử), nếu public.sellers vẫn là BẢNG (DB chưa áp 060), khối DO thấy public.sellers có relkind 'r' và chạy `DROP TABLE sellers`. Câu này đi theo search_path `<sc>, public` và trúng public.sellers: probe giữ ACCESS EXCLUSIVE trên bảng thật của DB dùng chung tới lúc ROLLBACK, và báo đỏ «KHOA MANH TREN PUBLIC» dù mã test đang đúng. Probe đo một cách dựng khác với cách tệp test dựng; phép đo AC-2 chỉ đúng khi DB đã áp 060. Cách sửa: probe gọi `[...bangCua(f), ...(await neuLaBang(c, "sellers"))]` cho hai tệp có `xem: true`, hoặc kiểm chuỗi `neuLaBang(c, "sellers")` có trong tệp như đang làm với VIEW_TIN/SQL_034/MIG_060.

- **Probe khoa không còn dựng lại đúng lược đồ riêng của tệp: bỏ sót bảng sellers mà neuLaBang thêm**
  file: `_acceptance/app-test-chiu-song-song/probes/song-song.mjs:221`
  severity: low
  AC: AC-2
  source: bugs
  detail: Ở vòng này cả app/tests/deals-phi-ly.test.tsx và pipeline/scripts/deals-phi-ly.test.mjs đổi sang gọi `luocDoRieng(c, [...BANG, ...(await neuLaBang(c, "sellers"))], …)`. Nhưng `bangCua()` của probe (dòng 219-224) chỉ rút danh sách từ `const BANG = [...]`, nên ở bước dòng 245 probe gọi `luocDoRieng(c, bang)` mà không có sellers rồi chạy `MIG_060`. Probe vì thế không còn tái hiện đúng cái mà tệp test dựng, dù đầu tệp ghi là «dựng đúng lược đồ riêng mà từng tệp khai». Trên DB chưa áp 060 (public.sellers còn là BẢNG), khối DO của 060 sẽ thấy public.sellers là bảng và chạy `DROP TABLE sellers` không ghi tên lược đồ, rơi xuống public.sellers của DB thật oneinvest, xin ACCESS EXCLUSIVE ngay trong phiên probe (sau đó ROLLBACK). Probe báo đỏ oan «KHOA MANH TREN PUBLIC», trong khi chính tệp test không làm việc đó. DB local hiện tại có sellers là view nên lỗi chưa lộ ra. Sửa: cho bangCua (hoặc vòng `ca`) cộng thêm `await neuLaBang(c, "sellers")` giống hai tệp test.

- **Hình dạng 1 (đo chỉ dẫn / bản dựng lại thay vì đầu ra): E2 'khoa' đo bản tái dựng tay của tệp deals app, không đo đường DP-AC-5 vừa sửa**
  file: `_acceptance/app-test-chiu-song-song/probes/song-song.mjs:219`
  severity: low
  AC: AC-2
  source: measurement
  detail: bangCua() (dòng ~219-224) rút danh sách bảng bằng regex `const BANG\s*=\s*\[...\]`, nên bỏ mất phần `...(await neuLaBang(c, "sellers"))` mà vòng này thêm vào app/tests/deals-phi-ly.test.tsx:32 và pipeline/scripts/deals-phi-ly.test.mjs:55. Lời chú thích 'rút nguyên văn, không chép tay' vì vậy không còn đúng. Thêm nữa, `viec` của TEP.dealsApp chỉ chạy một câu SELECT viết tay. Nó không chạy DROP TABLE stg_zalo_posts CASCADE / xoaCotPii(c, sc), là đúng đoạn mã sửa ở 8ce6a983 (trước đây DROP VIEW sellers không tên lược đồ rơi xuống public.sellers). Hệ quả: lời hứa của E2 ('0 khoá mạnh hơn AccessShare trên public' cho deals app) đo một bản sao do probe tự dựng, không đo hành vi thật của tệp. Trên DB mà public.sellers còn là BẢNG, probe chạy MIG_060 khi lược đồ riêng không có sellers, nên câu DROP rơi vào public: probe đỏ oan, lệch với tệp thật. Phần đường sellers-rơi-public hiện chỉ được E1 phiên C bắt gián tiếp, và chỉ khi DB thử đã áp 060.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **chepBang lỗi với cột GENERATED: pg_get_expr(adbin, 0) ném 'expression contains variables' (r1 · tệp đã đổi)**
  Người dùng thấy gì: Công cụ dựng bản chép tạm cho test sẽ báo lỗi nếu bảng có cột tính tự động. Hiện chưa test nào dùng bảng như vậy nên không ảnh hưởng người dùng, chỉ vướng khi mở rộng sang test khác.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng cuối, lỗi hiện rõ ngay khi gặp nên không bị bỏ sót, và chỉ cần xử lý khi thật sự chuyển thêm test sang dùng.
  file: `pipeline/lib/luoc-do-rieng.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (dựng lại theo khuôn bên đọc): E2 đo khoá trên phần việc probe tự viết, không chạy câu thật của ba tệp test (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép đo khoá dùng bản mô phỏng việc của test chứ không chạy đúng từng câu thật. Nếu sau này ai thêm một câu gọi thẳng vào dữ liệu dùng chung thì phép đo có thể không phát hiện.
  Căn cứ: Hiện chưa có câu nào như vậy, hậu quả chỉ là test có thể chậm lại chứ không mất dữ liệu, và có thể bổ sung phép đo sau mà không ảnh hưởng người dùng.
  file: `_acceptance/app-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính đứng một mình): «hai phiên không chờ nhau» không có đối chứng dương (r1 · tệp đã đổi)**
  Người dùng thấy gì: Kiểm tra hai phiên dựng song song không chờ nhau chưa được chứng minh là thật sự bắt được trường hợp chờ. Nếu có hồi quy tinh vi, test có thể vẫn xanh.
  Căn cứ: Chỉ làm test kém nhạy hơn, không ảnh hưởng người dùng hay dữ liệu, và phần chính đã có kiểm tra bằng bản đột biến khác.
  file: `pipeline/scripts/luoc-do-rieng.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (đo cái có mặt thay vì quan hệ): «đủ ràng buộc» chỉ so số lượng theo contype (r1 · tệp đã đổi)**
  Người dùng thấy gì: Test chỉ so số lượng ràng buộc và chỉ mục của bản chép, chưa so nội dung từng cái. Một ràng buộc chép sai nội dung vẫn có thể qua mặt test.
  Căn cứ: Bản chép chỉ dùng trong test, không chạm dữ liệu thật, nên sai lệch nếu có chỉ làm test kém chặt; sửa sau không tốn nhiều.
  file: `pipeline/scripts/luoc-do-rieng.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
