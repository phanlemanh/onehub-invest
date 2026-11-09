## Trong hợp đồng

- **The watchdog's 'bo-canh' event is never written under launchd because the watchdog plist does not set S03_LOOKUP_DIR**
  file: `scripts/{S03}-watchdog.sh:33`
  severity: medium
  detail: The S4-2 change (pass 9, item ii) only appends `{"loai":"bo-canh"}` to `$S03_LOOKUP_DIR/sukien-listener.jsonl` when the env var `S03_LOOKUP_DIR` is set and the directory exists. The watchdog runs from pipeline/cron/com.oneinvest.{S03}-watchdog.plist, which has no EnvironmentVariables, and the script does not source any env file. docs/ops/runtime-map.md:366 describes S03_LOOKUP_DIR as an env var of the gateway, not of the watchdog. In production the `if` branch therefore never runs, and AC-2's safe stop 'watchdog fires within 30 minutes after a call → listener-dong-sau-goi' is not wired. Tests pass only because they set the env var themselves. Fix by declaring the variable in the plist (or reading it from the gateway's config) and adding a check that fails when the watchdog is missing it while the lookup job is enabled.
  source: conventions
  AC: AC-2

- **Việc gỡ getConnected{S03}Api khỏi danh sách miễn AC-10 không có hiệu lực, bộ quét vẫn miễn nó**
  file: `scripts/link-nguoi-ban-s03/ten-nguon.mjs:43`
  severity: medium
  detail: `dinhDanhUpstream` lấy MỌI chuỗi trong dấu backtick nằm giữa «Danh sách:» và «Chỉ áp» trên dòng Notes. Commit 2ff91fbe chỉ thêm vào cùng đoạn đó một câu trong ngoặc: «`getConnected{S03}Api` gỡ 09/11 khi … `layApiDangNoi` …». Chạy thử trên contract.md HEAD thì danh sách miễn trả về vẫn có 'getConnected{S03}Api' (và cả 'layApiDangNoi'). Nghĩa là lệnh quét tên nguồn E10 vẫn bỏ qua định danh mà hợp đồng đã ký nói là đã gỡ. Ca đối chứng «định danh upstream trên dòng mã được miễn» cũng dùng chính getConnected… làm ví dụ, nên nó xanh nhờ lỗi này.
  source: bugs
  AC: AC-10

- **Lượt lớn: mã đối chứng bị gọi lại ở mọi lời, mỗi lời 22 mã, vượt trần 20 của AC-1**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:479`
  severity: medium
  detail: Trong seller-lookup.ts, dòng patch 479 xoá khỏi `daGoiTrongLuot` mọi mã không thuộc `yeuCau.mas`, tức là xoá luôn hai mã đối chứng đã ghi vào da-goi-luot.jsonl ở lời trước. Đến dòng 492, `doiChungYeuCau.filter((m) => !daGoiTrongLuot.has(m))` vì thế luôn giữ cả hai mã. Hệ quả: phép lọc «DC đã gọi không gọi lại» không còn tác dụng, nhánh dòng 552-553 là mã chết, và mỗi lời của lượt lớn gửi 20 mã người bán cộng 2 đối chứng = 22 mã. Hai người đối chứng bị tra lại tới 30 lần mỗi đêm, trong khi AC-3 đòi lượt lớn «vẫn giữ trần của AC-1» (≤20 mã mỗi lời).
  source: bugs
  AC: AC-3

- **Tệp yêu cầu có mã trùng làm lượt thử lặp lời gọi mỗi 60 giây, tới 30 lời mỗi đêm**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:522`
  severity: medium
  detail: Điều kiện đóng lượt là `phuBan.size >= yeuCau.mas.length`, tức so kích thước một Set với độ dài mảng. Ở lượt thử `phuBan = new Set(yeuCau.mas)`, nên chỉ cần `mas` có một mã trùng là điều kiện sai mãi. Khi đó không ghi da-thu.txt (dòng 522) và không đổi tên yeu-cau.json (dòng 589). Nhịp kế (≥60 giây) thấy chưa có dấu đã thử nên gọi lại `getUserInfo` với cùng bộ mã, lặp tới trần 30 lời/ngày, đêm nào cũng vậy. Nó phá luật «đúng một lời» của AC-3. Kiểm khuôn ở dòng 434-437 không chặn mã trùng. lap-yeu-cau-ho-so không sinh mã trùng, nhưng tệp sửa tay thì có thể.
  source: bugs
  AC: AC-3

- **Đường báo «bo-canh» của watchdog không chạy: plist launchd không có S03_LOOKUP_DIR**
  file: `scripts/{S03}-watchdog.sh:33`
  severity: low
  detail: Dòng sự kiện `bo-canh` chỉ được ghi khi `S03_LOOKUP_DIR` có trong môi trường của watchdog. pipeline/cron/com.oneinvest.{S03}-watchdog.plist không khai EnvironmentVariables, còn runtime-map nói biến này là «env của gateway». Dưới launchd, nhánh `if` này vì thế không bao giờ chạy, và điểm dừng an toàn «bộ canh báo trong 30′ sau lời gọi → listener-dong-sau-goi» của AC-2 không hoạt động. Nếu gateway được khởi lại trong vòng 30 phút, bộ tra gọi tiếp mà không thấy sự kiện nào.
  source: bugs
  AC: AC-2

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **A pipeline test imports the collector build output (collector/dist), which is gitignored, so the CI pipeline job will fail**
  Người dùng thấy gì: Bộ kiểm tự động của đường nạp dữ liệu có thể đỏ trên máy chủ kiểm, làm tính năng không qua được cổng gộp dù chạy đúng.
  Căn cứ: Không ảnh hưởng người dùng cuối, chỉ chặn quy trình gộp; nhưng sửa rẻ và dễ thấy nên nên có một việc riêng.
  file: `pipeline/scripts/importer-schema-v5.test.mjs`
  severity: high
  Đề xuất: new-contract

- **collector/package-lock.json is deleted in a feature commit while package.json is unchanged**
  Người dùng thấy gì: Lần cài đặt bộ thu thập kế tiếp có thể kéo phiên bản thư viện khác bản đang chạy, gây lỗi khó đoán ở bộ thu hằng đêm.
  Căn cứ: Dữ liệu không mất và khôi phục tệp từ nhánh chính là rẻ, nhưng nếu bỏ sót có thể làm bộ thu hỏng âm thầm.
  file: `collector/package-lock.json`
  severity: medium
  Đề xuất: new-contract

- **`lay_luc` at the /s03-ho-so boundary is checked only with Date.parse, not as ISO as the contract requires**
  Người dùng thấy gì: Nếu bộ tra gửi thời điểm viết lạ, kết quả có thể bị nạp lỗi hoặc ghi trùng cho cùng một lần tra.
  Căn cứ: Chỉ xảy ra khi bộ tra của kho gửi sai khuôn, hiếm; không lộ dữ liệu và sửa sau cũng rẻ.
  file: `collector/src/api/server.ts`
  severity: low
  Đề xuất: known-limits

- **coBangHoSo swallows errors and returns false, contradicting its own comment ('Ném để dừng lượt', i.e. throw to stop the run)**
  Người dùng thấy gì: Khi cơ sở dữ liệu lỗi lúc nạp, hệ thống báo nhầm là chưa áp bước nâng cấp và bỏ qua hồ sơ người bán mà không báo lỗi thật.
  Căn cứ: Dữ liệu không mất vì lần sau nạp lại được, nhưng lỗi thật bị che nên vận hành khó phát hiện.
  file: `pipeline/import-{S01}.mjs`
  severity: low
  Đề xuất: known-limits

- **Không job nào nạp snapshot hồ sơ s03-ho-so vào stg, nên kết quả tra nằm kẹt trên đĩa**
  Người dùng thấy gì: Kết quả tra hồ sơ người bán sẽ nằm trên đĩa mà không vào danh bạ, nên link hồ sơ không bao giờ xuất hiện dù lượt tra chạy.
  Căn cứ: Dữ liệu không mất nhưng tính năng không cho kết quả nào và không có cảnh báo; cần một việc nối job riêng, sửa không đắt.
  file: `scripts/{S03}-import-daily.sh`
  severity: medium
  Đề xuất: new-contract

- **importer-schema-v5.test.mjs import collector/dist (bị gitignore), CI pipeline không build nên cả tệp test sẽ đỏ**
  Người dùng thấy gì: Bộ kiểm tự động của đường nạp có thể đỏ cả tệp trên máy chủ kiểm, chặn việc gộp mã dù tính năng đúng.
  Căn cứ: Không chạm người dùng cuối, chỉ chặn quy trình; sửa rẻ.
  file: `pipeline/scripts/importer-schema-v5.test.mjs`
  severity: medium
  Đề xuất: new-contract

- **collector/package-lock.json bị xoá mà commit không nhắc**
  Người dùng thấy gì: Cài đặt bộ thu thập có thể không tái lập được và kéo thư viện khác bản đang chạy ở bước triển khai.
  Căn cứ: Không mất dữ liệu, khôi phục tệp là rẻ; để sót có thể làm bộ thu hằng ngày hỏng âm thầm.
  file: `collector/package-lock.json`
  severity: medium
  Đề xuất: new-contract

- **Một dòng JSONL ghi dở làm bộ tra chết vĩnh viễn: JSON.parse nằm ngoài try ở spool và tệp sự kiện**
  Người dùng thấy gì: Nếu máy bị tắt đột ngột giữa lúc ghi, bộ tra hồ sơ người bán có thể ngừng hẳn mà không ai biết cho tới khi có người dọn tay.
  Căn cứ: Chỉ hỏng tính năng tra, không mất dữ liệu hay ảnh hưởng người dùng; dừng là hướng an toàn nhưng im lặng.
  file: `_acceptance/link-nguoi-ban-s03/extension.patch`
  severity: medium
  Đề xuất: known-limits

- **Collector từ chối lô thì lỗi bị nuốt im; spool phát lại cả khối một POST, quá 1000 dòng thì kẹt 413 mãi**
  Người dùng thấy gì: Nếu cấu hình sai khoá, kết quả tra dồn lại mà không báo, và sau vài đêm có thể không xả được nữa dù đã sửa khoá.
  Căn cứ: Dữ liệu vẫn còn trong hàng chờ nên không mất, nhưng đến lúc phát hiện thì phải xử tay.
  file: `_acceptance/link-nguoi-ban-s03/extension.patch`
  severity: medium
  Đề xuất: known-limits

- **E6 không kiểm «snapshot hồ sơ không bị đánh dấu đã nạp» dù evals ghi là có; itest thoát 0 khi thiếu env**
  Người dùng thấy gì: Chưa có phép kiểm tự động bảo đảm hồ sơ chưa nạp không bị đánh dấu là đã nạp khi cơ sở dữ liệu thiếu bước nâng cấp.
  Căn cứ: Chưa thấy lỗi thật, chỉ là thiếu lưới an toàn; nếu sai sẽ mất kết quả tra, nên nên bổ sung sau.
  file: `scripts/link-nguoi-ban-s03/db-nap.mjs`
  severity: medium
  Đề xuất: known-limits

- **Thiếu bộ nghe tin ở bất kỳ nhịp nào cũng ghi tệp chặn bám dính, kể cả ngoài khung giờ và khi không có tệp yêu cầu**
  Người dùng thấy gì: Một lần bộ nghe tin nối lại ngoài giờ có thể làm bộ tra tắt cho tới khi có người xoá tệp chặn, nên lượt đêm sau bị bỏ.
  Căn cứ: Thất bại theo hướng an toàn, chỉ mất một lượt tra và người gỡ được dễ dàng.
  file: `_acceptance/link-nguoi-ban-s03/extension.patch`
  severity: low
  Đề xuất: known-limits

- **coBangHoSo nuốt lỗi dò bảng, trái với chú thích «Ném để dừng lượt»**
  Người dùng thấy gì: Khi truy vấn cơ sở dữ liệu lỗi, vòng nạp vẫn báo xanh trong lúc hồ sơ người bán không vào.
  Căn cứ: Không mất dữ liệu vì nạp lại được, nhưng thất bại im lặng làm vận hành tưởng ổn.
  file: `pipeline/import-{S01}.mjs`
  severity: low
  Đề xuất: known-limits

- **quyetLienLacHoSo phụ thuộc thứ tự mã: tính «giữ» theo liên lạc sẽ bị rút ngay trong cùng lượt**
  Người dùng thấy gì: Hiếm khi, một người bán có hai tài khoản ra kết quả khác nhau thì liên lạc hồ sơ chat có thể thiếu một đêm.
  Căn cứ: Tự lành ở lượt sau, không lộ hay mất dữ liệu.
  file: `pipeline/lib/lien-lac-ho-so.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): ca E9 «lệnh đo trước–sau in đủ dòng đóng, PID, post 202» chỉ dò tên tệp**
  Người dùng thấy gì: Lệnh đo trước và sau khi khởi động lại chưa được kiểm thật, nên có thể in thiếu số liệu mà không ai biết.
  Căn cứ: Chỉ ảnh hưởng độ tin của việc canh sau triển khai; người vận hành tự thấy khi chạy và sửa sau rẻ.
  file: `scripts/link-nguoi-ban-s03/tich-hop/bo-tra.tich-hop.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): E5 kể năm chỗ chứa canary và spool, lệnh chấm chỉ đo items/manifest snapshot**
  Người dùng thấy gì: Chưa có phép kiểm đầy đủ rằng tên, SĐT, ảnh của người bán không lọt vào hàng chờ, tệp chặn hay log.
  Căn cứ: Nếu rò thật thì là dữ liệu cá nhân thừa nằm trên máy, khó thu hồi, nên đáng dựng việc đo đủ.
  file: `collector/src/test/ho-so-api.test.ts`
  severity: high
  Đề xuất: new-contract

- **Hình dạng 3 (assert có mặt/ngưỡng trong khi lời hứa là quan hệ): schemaVersion hồ sơ `>= 7`, kênh tin so với chính hằng trong mã**
  Người dùng thấy gì: Bộ kiểm phiên bản dữ liệu quá lỏng, nếu số phiên bản đổi sai thì bộ nạp có thể từ chối mà kiểm vẫn xanh.
  Căn cứ: Lỗi sẽ lộ ngay khi nạp thật và không mất dữ liệu; sửa sau rẻ.
  file: `collector/src/test/ho-so-api.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): E6 nạp RawItem hồ sơ tự dựng, không lấy snapshot do bên ghi của E5 sinh**
  Người dùng thấy gì: Phép kiểm nạp dùng dữ liệu tự dựng nên có thể không bắt được lệch khuôn giữa bên ghi và bên nạp.
  Căn cứ: Lệch khuôn sẽ lộ ở lần nạp thật đầu tiên, không mất dữ liệu.
  file: `scripts/link-nguoi-ban-s03/db-nap.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): bảng stg_s03_ho_so dựng bằng DDL tay «mô phỏng 080»**
  Người dùng thấy gì: Nếu bước nâng cấp cơ sở dữ liệu đổi cột, bộ kiểm vẫn xanh trong khi nạp thật có thể hỏng.
  Căn cứ: Chỉ làm lỗi lộ muộn ở lần nạp thật; không mất dữ liệu, sửa rẻ.
  file: `pipeline/tests/ho-so-nap.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): snapshot hồ sơ «chưa nạp» của E8 dựng tay manifest/items**
  Người dùng thấy gì: Phép kiểm chọn mã chưa tra dùng snapshot dựng tay nên chưa chắc đọc đúng snapshot thật.
  Căn cứ: Nếu sai, hậu quả là tra lại mã đã tra hoặc bỏ sót, không lộ dữ liệu.
  file: `scripts/link-nguoi-ban-s03/chon.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): «mốc lời cuối đọc lại từ đĩa sau khởi động lại» dùng moc-60s.txt ghi tay**
  Người dùng thấy gì: Chưa chứng minh khoảng cách 60 giây giữa các lời gọi thật sự sống qua lần khởi động lại.
  Căn cứ: Nếu sai, các lời gọi có thể dồn sát nhau, nhưng trần ngày và khung giờ vẫn giữ; nên đo sau.
  file: `scripts/link-nguoi-ban-s03/tich-hop/bo-tra.tich-hop.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn cứng tới máy/checkout của tác giả): ca E9 phán lùi đòi gateway.log thật ở ~/Library/Logs**
  Người dùng thấy gì: Một phép kiểm chỉ xanh trên máy có sẵn nhật ký thật, máy khác sẽ báo đỏ dù mã đúng.
  Căn cứ: Không ảnh hưởng người dùng, chỉ gây nhiễu khi kiểm ở nơi khác.
  file: `scripts/link-nguoi-ban-s03/tich-hop/bo-tra.tich-hop.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đo checkout của tác giả thay vì cây đang kiểm): E4-phu đọc monitor.ts ở ~/dev/openclaw qua OPENCLAW_EXT_DIR**
  Người dùng thấy gì: Phép kiểm marker bộ canh có thể đạt dựa trên bản mã trên máy tác giả chứ không phải bản vá thật.
  Căn cứ: Nếu bản vá làm mất marker thì không bị bắt, nên nên kiểm lại trước khi khởi động lại gateway thật.
  file: `collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo đầu vào thay vì đầu ra): assert «tự nối lại + handler vẫn nhận tin» trên chính chuỗi log test viết**
  Người dùng thấy gì: Một phép kiểm luôn đạt, nên chưa chứng minh được tin vẫn đến khi bộ tra dừng vì lỗi.
  Căn cứ: Chỉ là lưới an toàn giả; hành vi thật chưa thấy sai.
  file: `collector/openclaw/tests/link-nguoi-ban/phai-lui-ho-so.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo thứ khác thay vì đầu ra): «E9-phu tái kiểm ngay trước lời — có tệp chặn không gọi» chỉ gọi tiền kiểm trước khởi động lại**
  Người dùng thấy gì: Chưa có phép kiểm thật rằng đặt tệp chặn giữa lượt thì các lời gọi còn lại dừng ngay.
  Căn cứ: Cách tắt khẩn cấp chưa được đo kỹ; nên bổ sung vì đây là công tắc an toàn.
  file: `collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình, không đối chứng dương): canary error_message trong ca lỗi E2, nhánh «lỗi lạ» không bao giờ mang canary tới bộ tra**
  Người dùng thấy gì: Phần lớn ca lỗi không thật sự thử việc thông điệp lỗi thô có lọt vào tệp chặn hay không.
  Căn cứ: Chưa thấy rò thật, hai ca đo thật đã phủ phần chính.
  file: `scripts/link-nguoi-ban-s03/tich-hop/bo-tra.tich-hop.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên lớp, thiếu phần tử): ca «còn tệp yêu cầu / lượt lớn / chặn» chỉ dựng hai trong ba tệp**
  Người dùng thấy gì: Phép kiểm trước khi khởi động lại chưa thử trường hợp còn tệp chặn, nên có thể bỏ sót cảnh báo đó.
  Căn cứ: Rủi ro nhỏ, dễ thấy khi chạy thật; bổ sung ca là rẻ.
  file: `collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
