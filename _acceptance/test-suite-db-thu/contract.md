---
schema_version: 1
feature: npm test của app, pipeline, agent và eval SD-AC-6 chạy trên DB của riêng lượt bằng db-thu, không tranh khoá với job và phiên khác trên DB chung
slug: test-suite-db-thu
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, ci]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-05T12:00:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-05-test-suite-db-thu-design.md
---

# Acceptance Contract: test-suite-db-thu

## Context

Sáng 05/11 một lượt test song song với job S06 trên DB chung làm job chậm khoảng 25 phút và `SD-AC-6` deadlock 40P01, ca đã đỏ lặp lại ở
#303 và #315, tốn lượt chấm và buộc các phiên chờ nhau qua khoá S4. Log máy chủ đo được deadlock trên bảng thật của DB chung: 30/10 2 ca, 31/10 6,
01/11 68, 02/11 35, 03/11 50, 04/11 145, 05/11 199 (tới 18:30); 117 ca có câu `INSERT INTO property_offers` của job.

Đo trên đối chứng trước khi sửa (`probes/song-song.mjs chung`): `SD-AC-6` cùng DB với bên ghi thật có 8 mẫu chờ khoá, 5/5 lượt xanh, không tái hiện được deadlock
trong 5 lượt; số deadlock thật ở trên lấy từ log máy chủ. Hợp đồng này không chứng «hết deadlock trên DB chung»: nó chứng ba bộ `npm test` không còn nối vào DB đó.
Ai chạy `node --test` đơn tệp (86 executor còn lại) vẫn vào DB chung; xem Out of scope.

Source input: lời giao của giám sát 05/11 (phiên local_08504d44), khu vực `db/db-thu.sh`, `app/package.json`, `app/tests/**`.

## Criteria

- AC-1: Given chạy `--chay` khi `DATABASE_URL` trống hoặc trỏ DB `oneinvest` (cả dạng có `?options=` và dạng không có tên đăng nhập), When lệnh chạy, Then lệnh nhận `DATABASE_URL` và
  `TEST_DATABASE_URL_ADMIN` trỏ DB `oneinvest_suite_<bộ>_<pid>` chép từ bản mẫu, mã thoát của lệnh giữ nguyên, DB của lượt bị xoá khi lệnh xanh, đỏ hay
  nhận SIGTERM, và không lệnh `createdb`, `dropdb`, ghi nào nhằm vào `oneinvest`.
- AC-2: Given `DATABASE_URL` đã trỏ DB khác (kể cả tên chỉ bắt đầu bằng `oneinvest`, hoặc cùng tên `oneinvest` ở máy chủ, cổng khác `localhost:5433`), hoặc `CI=true` không có container, When chạy `--chay`, Then lệnh chạy thẳng trên URL
  đó; given máy không có container và không phải CI, Then thoát 3, lệnh không chạy, không rơi về DB chung; given đĩa VM còn dưới 10 GB, Then thoát 4, không chép,
  để job không đầy đĩa vì test; given tên ngoài khuôn `oneinvest_suite_*`, Then thoát 2; chế độ cũ của `db-thu.sh` (không `--chay`) không đổi.
- AC-3: Given bản mẫu cùng dấu lược đồ và dưới 24 giờ, When chạy, Then không pg_dump; given dấu lệch, mẫu quá tuổi hoặc chưa có, Then dựng lại đúng một lần
  bằng bản mới có `VACUUM ANALYZE` rồi đổi tên vào chỗ mẫu, cả khi ba lượt thấy mẫu cũ cùng lúc; given DB của lượt có chủ đã chết, Then bị dọn, chủ còn sống thì giữ.
- AC-4: Given Postgres thật, When hai lượt `--chay` song song, Then mỗi lượt một DB khác nhau có dữ liệu, xoá sạch sau khi xong; lệnh đỏ và SIGTERM (lệnh còn giữ
  kết nối) cũng không để sót DB; bản mẫu không nhận kết nối;
  lượt bị SIGKILL để lại DB thì lượt kế dọn.
- AC-5: Given bên ghi là `resolve-properties` và `refresh-bait-gap` thật đang ghi `property_offers` trên «DB chung» (bản chép đóng vai, không đụng DB thật),
  When `SD-AC-6` chạy ba lượt qua `--chay`, vào bằng `DATABASE_URL` trỏ `oneinvest`, Then cả ba xanh, 0 kết nối của lượt tới bản chép và tới `oneinvest` thật, có kết nối tới DB của lượt;
  đối chứng: `SD-AC-6` trỏ thẳng bản chép thì bộ lấy mẫu thấy kết nối của lượt và bộ đếm deadlock thấy ca tự gây. Executor `sellers_chip` cũng đi qua `--chay`.
- AC-6: Given chạy `npm test` của từng bộ app, pipeline, agent, When lấy mẫu `pg_stat_activity` theo `application_name` riêng của lượt mỗi 100 ms, Then bộ xanh,
  0 kết nối của lượt vào DB `oneinvest`, có kết nối ở DB khác (đối chứng dương của bộ đếm), và in số ca pass, skip.
- AC-7: Given `package.json` của ba bộ và mọi tệp test của chúng, When quét, Then `npm test` đi qua `db-thu --chay`, không tệp test nào (mỗi bộ quét ≥ 20 tệp) tự trỏ DB chung bỏ qua
  `DATABASE_URL` (chuỗi URL cứng, cả dạng kèm `?options=`, URL ghép từ biến máy chủ, URL dựng bằng `new URL`) hay xoá biến đó khỏi tiến trình con mà không gán lại, tính cả mọi tệp mà test import; đối chứng: bộ quét bắt đúng mười một dạng lọt và bỏ qua tám dạng lành.

## Coverage

- Trục **URL lúc vào** (trống · trỏ DB chung · trỏ DB chung kèm tham số · trỏ DB thử khác) — AC-1, AC-2.
- Trục **môi trường** (máy có container · máy thiếu container · CI) — AC-2.
- Trục **kết cục lệnh** (xanh · đỏ · SIGTERM · SIGKILL) — AC-1, AC-4.
- Trục **tuổi mẫu** (mới · lệch lược đồ · quá tuổi · chưa có · nhiều lượt cùng thấy cũ) — AC-3, AC-4.
- Trục **đường lọt về DB chung** (lối vào `npm test` · chuỗi URL cứng · tiến trình con mất biến) — AC-6, AC-7.
- Trục **bộ test** (app · pipeline · agent) — AC-6, AC-7.

## Đường đo

- Deadlock trên DB chung theo ngày và số ca có câu ghi `property_offers`, từ `docker logs one-invest-db`, lệnh `probes/dem-deadlock.mjs`; đọc sau khi gộp ba ngày. Còn ≥ 20 ca/ngày có câu ghi `property_offers` thì làm ngay việc 24 executor giao dịch trên bảng thật. Số này gồm cả ca job với job, nên không kỳ vọng về 0.

## Out of scope

- 86 executor đơn tệp còn lại trong `_acceptance/config.yaml` (`cd app && node --test tests/x…`) không đi qua `npm test`; 24 trong số đó mở giao dịch trên bảng thật của DB chung, nên lượt ghim lại chạy chúng vẫn có thể tranh khoá với job. Việc riêng, cùng cơ chế `--chay`.
- `node --test scripts/*.test.mjs` (không thuộc ba bộ, không nằm trong `suite_keys`).
- Dọn 21 DB thử cũ trên server; đổi tải CPU, đĩa của một Postgres dùng chung; bỏ khoá S4.

## Notes

- Số đo sau khi sửa, ba bộ chạy song song trên máy đang có job (05/11, 20:36): app 987 ca, 982 xanh, 5 bỏ qua, 6,1 phút; pipeline 563 xanh, 6,1 phút; agent 287 xanh, 0,9 phút; cả ba 0 kết nối của lượt vào `oneinvest`.
- Bộ đếm `lay-mau` không thấy kết nối dưới 100 ms và tiến trình con bị bỏ biến môi trường; hai đường đó do quét tĩnh AC-7 chặn. Riêng `env` liệt kê dương (`{ PATH, HOME }`) quét tĩnh không phân biệt được với tiến trình không nối DB: soát tay trong ba bộ không có ca nào vừa bỏ biến vừa nối DB, đường này còn là giới hạn.
- Diễn tập tải chấm sau khi sửa (05/11, 22:21): pipeline hai bộ, app một bộ và E3 chạy cùng lúc đều xanh; pipeline 572 ca 7 phút, app 995 ca 7,6 phút, 0 kết nối của lượt vào `oneinvest`.
- Lượt chấm 1 đỏ vì deadlock trong DB của lượt: chiều đỏ của `SD-AC-6` dựng lại `public.sellers` trong giao dịch, test đọc cùng lúc giữ view chờ bảng. Chiều đỏ nay dựng view đột biến ở lược đồ riêng. Ca chờ khoá 33033 vượt trần vì sáu bộ chạy cùng lúc: `E5`, `E6`, `E7` nay đo lần lượt, `npm test` của pipeline chạy từng tệp một vì các tệp giữ khoá độc quyền trên bảng thật cả phút, câu dư lượng giữ khoá gần 2 phút nay gom trước rồi nối.
- Bộ quét theo import tương đối và bí danh `@/`; import dựng đường lúc chạy (`pathToFileURL(join(…))`) không đọc được, đường đó là giới hạn. `CGT-DC` đọc từng tin một trên dữ liệu thật, dưới tải lượt chấm vượt trần 10 phút nên trần nay 20 phút; ca chỉ đọc, trần không chứng hiệu năng.
- `E4b` lấy lượt nhanh nhất trong tối đa sáu, nghỉ 5 giây giữa các lượt, để thước 1 giây đo câu truy vấn, không đo tải máy.
- Không áp migration, không ghi `oneinvest`; phép đo «DB chung» dùng bản chép đóng vai. Lượt job thật đầu tiên sau khi gộp chưa đo được trong hồ sơ này.
- Tệp test «thiếu mốc» của S06 trong `pipeline/scripts/` thuộc làn ZCode: sửa một dòng lấy URL từ env vì là lỗi tích hợp của việc này.
- Bản mẫu chạy `VACUUM ANALYZE` trước khi khoá kết nối: `pg_dump` không mang thống kê và visibility map, DB khoá kết nối thì autovacuum không tự làm. Lượt đo đầu không có bước này: `E4b` vượt trần 300 giây và bộ app kéo dài 98 phút (đo 05/11).
- Đo lượt đầu lộ hai đường còn vào DB chung mà bộ quét cũ không thấy: `localDbUrl()` trong `capture-ops-facts.mjs` (172 kết nối từ app, 6 từ pipeline) và `judge-chung.ts` (1 từ agent). Nay cả hai theo biến môi trường và bộ quét đọc cả tệp helper.
- Tên DB `oneinvest_suite_*` khớp khuôn «DB thử» của vài tệp test. `s03-len-cong` nhờ đó chạy thêm trong `npm test` (trong giao dịch ROLLBACK, xanh). `trang-chi-tiet-tin-db` loại DB `oneinvest_suite_*` khỏi khuôn vì ca đó tự dựng `next build`, chỉ chạy theo hồ sơ của nó.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-06:
  - Ngoài-1: Test trỏ tới DB chung bằng một cách viết địa chỉ khác hai cách đã chặn vẫn chạy thẳng trên DB chung.
  - Ngoài-2: Lần đo đầu trên máy chưa có bản mẫu có thể dùng bản mẫu thiếu thống kê, nên phép đo chậm hoặc lệch.
  - Ngoài-3: Một ca test của S06 có thể đỏ oan khi địa chỉ DB đã kèm tham số.
  - Ngoài-4: Bộ đếm deadlock báo 0 ca khi không đọc được nhật ký máy chủ, nên số 0 chỉ tin được khi chắc nhật ký đã đọc.
  - Ngoài-6: DB `oneinvest_suite_sellers_chip` còn trên máy chủ, việc dọn tự động không xoá nó, phải xoá tay.
  - Ngoài-7: Lượt đỏ có nhiều lỗi dài mất số ca hỏng trong bằng chứng (hiện -1); kết quả đỏ vẫn đúng.
  - Ngoài-8: Bộ quét test tự nối DB chung có thể bỏ sót kiểu viết mã cố tình lắt léo.
  - Ngoài-9: Phép đo «không chạm DB chung» không ràng buộc kết nối với DB của lượt, nên bằng chứng dùng DB riêng kém chặt hơn chữ.
  - Ngoài-10: Phép thử tải E3, E4 có thể xanh khi một trong hai bên ghi giả lập đã chết.
  - Ngoài-11: Ca «mẫu mới không dump» không bắt được lỗi dừng sớm của lệnh.
  - Ngoài-12: Đối chứng «bên ghi không chạy» chỉ có ở lượt E3, lượt E4 không chạy nó.
