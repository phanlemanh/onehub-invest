# Review findings: snapshot-nguyen-tu (round 1)

Phạm vi đọc: `git diff origin/main...HEAD -- collector/ scripts/apify-facebook-daily.sh scripts/zalo-import-daily.sh scripts/au3-nap-bao-loi/`
tại e0a8505 (storage.ts +52/−13, snapshot-nguyen-tu.test.ts +158, hai tệp bọc +13 mỗi tệp, harness AU3 +73), cùng hai nơi
gọi `SnapshotWriter` (`collector/src/core/scheduler.ts`, `collector/src/api/server.ts`) và các bộ đọc thư mục snapshot
(`pipeline/import-chotot.mjs`, `pipeline/backfill-zalo-media.mjs`, `scripts/airdna-daily.sh`). Mọi phép thử chạy trên thư mục
tạm và bản chép trong scratchpad; không chạm `collector/snapshots` thật, cổng :9210, launchctl hay DB.

## Trong hợp đồng

(không có finding nào map được vào AC — E1–E8 đều đạt; xem evidence-report.md)

Đã soát và KHÔNG thấy lỗi ở các đường sau:
- Đường mất dữ liệu ở tệp bọc: thư mục thiếu manifest trẻ hơn 30′ thì `break` trước `import_one`, MAXTS chưa chạm tới nó;
  `.partial` không bao giờ vào vòng lặp (glob `*` của bash vốn không khớp tên bắt đầu bằng dấu chấm, dòng kiểm `${b#.}`
  mới thêm là lớp phòng hờ thứ hai).
- Đường lặp tên trong một tiến trình: vòng chiếm sid kiểm tên thật rồi `mkdirSync` không `recursive` (EEXIST = đã có
  người chiếm) — ba ca cùng ms (trước/sau finalize, tên thật có sẵn) đều tách id. Ca đua giữa hai tiến trình: xem OOC-3.
- Thư mục thành phố chưa có: nhánh ENOENT tạo thư mục city rồi thử lại cùng sid; E1 chạy trên gốc tạm chưa có city và xanh.
  EACCES hay lỗi khác ném ra ngoài, không vòng vô hạn.
- Rename `.partial` → tên thật cùng thư mục cha nên cùng filesystem; manifest ghi trước rename, nên thư mục tên thật do
  bản mới tạo luôn có manifest.
- `finalize` vẫn suy `city` từ `this.dir` (đường tên thật) — manifest không mang chữ `.partial`.

## Ngoài hợp đồng

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **Lượt thu bị bỏ qua (ngoài cửa sổ giờ, vượt cap ngày) để lại một thư mục `.partial` rỗng mỗi lần**
  Người dùng thấy gì: Không thấy gì trên cổng hay trong số liệu; trên đĩa máy thu, thư mục `collector/snapshots/<city>/` tích dần các thư mục ẩn rỗng `.<city>__<source>__<ts>.partial`, mỗi lượt CLI bị skip một thư mục, không có bước dọn — ví dụ weekly-collect lặp tối đa 20 lượt `airbnb-listing` sau khi chạm cap ngày.
  Căn cứ: `scheduler.ts:38` gọi `new SnapshotWriter(...)` TRƯỚC hai cổng `return` ở dòng 41–50; từ vòng này constructor `mkdirSync` thư mục `.partial` ngay, trong khi bản main chỉ tạo thư mục ở `write()`. Phép thử: `runCollector` bản build HEAD với `CONDUCT_WINDOW=3-4`, collector giả, 3 lượt → 3 thư mục `.acc__fake-src__…partial` rỗng; bản main không tạo gì. Hợp đồng mục Out of scope chỉ chấp nhận `.partial` của writer bị kill giữa chừng, không phải đường skip bình thường.
  file: `collector/src/core/scheduler.ts`
  severity: low
  Đề xuất: new-contract (dời `new SnapshotWriter` xuống sau hai cổng skip — làn ZCode, lời giao riêng)

- **Cổng 30′ đo mtime của chính thư mục, nên snapshot kiểu cũ đang tải ảnh lâu có thể bị coi là mồ côi**
  Người dùng thấy gì: Trong khoảng giữa merge và triển khai lại collector :9210 (ZC4), collector chạy bản build cũ vẫn tạo thư mục tên thật ngay khi tải ảnh; nếu một lượt flush tải ảnh quá 30 phút, tệp bọc in «snapshot mồ côi», đẩy state qua nó và lô tin đó không bao giờ vào stg — đúng kiểu mất dữ liệu lặng lẽ mà việc này định chặn.
  Căn cứ: Hai tệp bọc (zalo-import-daily.sh và apify-facebook-daily.sh, cùng một khối) dùng `find "$SNAP" -maxdepth 0 -mmin -30` (mtime của thư mục cấp đầu). Ở `server.ts` bản cũ, `addExtraFile` tạo `<snap>/media/` trước rồi ghi ảnh vào thư mục con, nên mtime cấp đầu đứng yên suốt lượt tải ảnh. Phép thử: thư mục mtime 09:00, ghi tệp mới vào `media/` lúc 17:5x → cổng xếp «MỒ CÔI». Với bản build mới, thư mục tên thật luôn có manifest nên cổng này không chạm writer đang sống. Xác suất thấp: mỗi ảnh timeout 10 s, chạy 4 luồng song song, mỗi lượt flush khoảng 50 tin.
  file: `scripts/zalo-import-daily.sh`
  severity: low
  Đề xuất: known-limits (triển khai ZC4 sớm sau merge; muốn chặt hơn thì đo mtime mới nhất trong cây con thay vì thư mục cấp đầu)

- **Đua giữa kiểm tên thật và chiếm `.partial`: hai writer có thể chung sid, writer sau kẹt ở ENOTEMPTY**
  Người dùng thấy gì: Chưa ai thấy; nếu xảy ra, ở collector API các lượt flush sau đều lỗi, tin Zalo đứng trong bộ đệm RAM cho tới khi restart, và một `.partial` có manifest nằm lại mà `import-chotot.mjs`/`backfill-zalo-media.mjs` (dùng `readdir`, có thấy tên dấu chấm) có thể nhận như snapshot thật.
  Căn cứ: Constructor làm `existsSync(tên thật)` rồi mới `mkdirSync(.partial)` — hai bước không nguyên tử với `rename` của writer khác. Nếu writer A rename xong đúng giữa hai bước đó, B chiếm được `.<sid>.partial` cùng sid, và `finalize` của B gặp ENOTEMPTY. Trong `server.ts`, `writer` chỉ về null khi finalize thành công, nên các lượt sau tái dùng cùng writer và rename lỗi mãi. Điều kiện kích hoạt là hai writer cùng city + source + mili-giây ở hai tiến trình, hoặc rename đang chạy trong threadpool. Server có single-flight, các nguồn CLI khác source, nên đây là đường lý thuyết; phiên chấm không dựng được phép thử tất định.
  file: `collector/src/core/storage.ts`
  severity: low
  Đề xuất: known-limits

## Known limits

- Writer bị kill giữa chừng để lại `.<id>.partial` vĩnh viễn, không có bước dọn — hợp đồng đã chấp nhận (Out of scope). Từ
  vòng này thêm nguồn rác `.partial` rỗng do lượt thu bị skip (OOC-1).
- Thư mục thiếu manifest già hơn 30′ bị bỏ qua vĩnh viễn (state đi qua nó) — đúng AC-4; nếu đó là một writer kiểu cũ còn
  sống thì mất lô đó (OOC-2).
- `pipeline/import-airbnb.mjs` giữ cửa «thiếu manifest → bỏ qua, mã 0» làm lưới an toàn — hợp đồng đã chấp nhận.
- Triển khai collector :9210 bản build mới (ZC4) là lời giao riêng sau merge; trước đó bản đang chạy vẫn ghi kiểu cũ và chỉ
  cổng manifest của tệp bọc che chắn.
