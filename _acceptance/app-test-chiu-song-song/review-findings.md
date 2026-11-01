# Review findings: app-test-chiu-song-song (round 1)

## Trong hợp đồng

- **MIG_060 giờ chạy vô điều kiện trong lược đồ riêng, nhưng nhánh DROP TABLE sellers của nó vẫn trỏ vào public**
  AC: AC-2
  file: pipeline/scripts/deals-phi-ly.test.mjs:703
  severity: medium
  source: conventions
  detail: Trước đây withTx gọi napSdtE164(c). Hàm này bỏ qua 060 nếu public.sellers đã là view, và lúc đó mọi việc chạy dưới khoá 33033. Bản mới bỏ khoá 33033 và chạy MIG_060 thẳng sau luocDoRieng (app/tests/deals-phi-ly.test.tsx:489 làm giống vậy). Khối DO ở db/migrations/060_sdt_e164.sql:66-72 kiểm `n.nspname = 'public' AND c.relname = 'sellers' AND c.relkind = 'r'`, nếu đúng thì chạy `DROP TABLE sellers`. Bảng sellers không có trong BANG nên lược đồ riêng không có nó, và với `search_path = <sc>, public` lệnh DROP sẽ trúng public.sellers. Hệ quả: trên DB local chưa áp 060 (napSdtE164 sinh ra đúng cho trường hợp này, và áp 060 lên máy thu là bước triển khai riêng), mỗi ca test giữ ACCESS EXCLUSIVE trên public.sellers tới khi ROLLBACK. Như vậy test lại xếp hàng nối tiếp nhau và chặn job khác đọc sellers, trái với bất biến mà hàng này đặt ra (không khoá nào mạnh hơn ACCESS SHARE trên public, AC-2). Probe E1/E2 chỉ xanh khi DB đang thử đã áp 060, nên lỗi bị che. Cách sửa: đưa sellers vào điều kiện, hoặc dựng 060 bằng một bản không chứa nhánh DROP thẳng vào public.

- **Hình dạng 4 (thông điệp không được ghim): đột biến «giữ 33033» của E4 khớp regex với tên test, không với lý do đỏ**
  AC: AC-4
  file: _acceptance/app-test-chiu-song-song/probes/song-song.mjs:283
  severity: high
  source: measurement
  detail: DOT[0] mong đợi /giữ khoá 33033/ trong output. Tên ca thứ 3 của pipeline/scripts/luoc-do-rieng.test.mjs (dòng 74) là «LDR hai phiên dựng song song không chờ nhau, không giữ khoá 33033, …», nên chuỗi này luôn có trong output của node --test, bất kể ca đỏ vì sao. Khi bị đột biến, phiên A giữ 33033, phiên B (SET LOCAL lock_timeout='2s') treo ở pg_advisory_xact_lock rồi lỗi «canceling statement due to lock timeout». Assert đếm khoá tư vấn (dòng 91, «LDR phiên dựng lược đồ riêng vẫn giữ khoá 33033») vì thế không bao giờ chạy tới. E4 in «đỏ đúng lý do» nhưng thật ra chỉ khớp tên test, và phép đếm advisory/objid=33033 chưa lần nào được chứng là bắt được.

- **Hình dạng 4 (thông điệp không được ghim): đối chứng dương C của E1 nhận mọi kiểu đỏ vì /cancelled/ khớp dòng tổng kết của node test**
  AC: AC-1
  file: _acceptance/app-test-chiu-song-song/probes/song-song.mjs:146
  severity: high
  source: measurement
  detail: Điều kiện `rDot.code !== 0 && (rDot.biGiet || /timed out|cancelled/i.test(rDot.out))`: node --test luôn in dòng tổng kết «ℹ cancelled 0» (reporter tap in «# cancelled 0»), nên vế regex luôn đúng và điều kiện rút lại chỉ còn `code !== 0`. Bản đột biến DROP TABLE public.stg_zalo_posts có thể đỏ vì lý do khác (ví dụ bảng không có trong DB thử, hoặc lỗi SQL) mà vẫn được tính là «treo dưới phiên C». Vế đối chứng A2 còn có phép quan sát pg_blocking_pids để ghim lý do, vế C thì không có gì tương tự. Dòng 178 (`r.biGiet || /timed out|cancelled/`) có cùng điểm yếu, nhưng ở đó biChan bù lại.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **chepBang lỗi với cột GENERATED: pg_get_expr(adbin, 0) ném 'expression contains variables'**
  Người dùng thấy gì: Công cụ dựng bản chép tạm cho test sẽ báo lỗi nếu bảng có cột tính tự động. Hiện chưa test nào dùng bảng như vậy nên không ảnh hưởng người dùng, chỉ vướng khi mở rộng sang test khác.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng cuối, lỗi hiện rõ ngay khi gặp nên không bị bỏ sót, và chỉ cần xử lý khi thật sự chuyển thêm test sang dùng.
  file: `pipeline/lib/luoc-do-rieng.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (dựng lại theo khuôn bên đọc): E2 đo khoá trên phần việc probe tự viết, không chạy câu thật của ba tệp test**
  Người dùng thấy gì: Phép đo khoá dùng bản mô phỏng việc của test chứ không chạy đúng từng câu thật. Nếu sau này ai thêm một câu gọi thẳng vào dữ liệu dùng chung thì phép đo có thể không phát hiện.
  Căn cứ: Hiện chưa có câu nào như vậy, hậu quả chỉ là test có thể chậm lại chứ không mất dữ liệu, và có thể bổ sung phép đo sau mà không ảnh hưởng người dùng.
  file: `_acceptance/app-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính đứng một mình): «hai phiên không chờ nhau» không có đối chứng dương**
  Người dùng thấy gì: Kiểm tra hai phiên dựng song song không chờ nhau chưa được chứng minh là thật sự bắt được trường hợp chờ. Nếu có hồi quy tinh vi, test có thể vẫn xanh.
  Căn cứ: Chỉ làm test kém nhạy hơn, không ảnh hưởng người dùng hay dữ liệu, và phần chính đã có kiểm tra bằng bản đột biến khác.
  file: `pipeline/scripts/luoc-do-rieng.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (đo cái có mặt thay vì quan hệ): «đủ ràng buộc» chỉ so số lượng theo contype**
  Người dùng thấy gì: Test chỉ so số lượng ràng buộc và chỉ mục của bản chép, chưa so nội dung từng cái. Một ràng buộc chép sai nội dung vẫn có thể qua mặt test.
  Căn cứ: Bản chép chỉ dùng trong test, không chạm dữ liệu thật, nên sai lệch nếu có chỉ làm test kém chặt; sửa sau không tốn nhiều.
  file: `pipeline/scripts/luoc-do-rieng.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
