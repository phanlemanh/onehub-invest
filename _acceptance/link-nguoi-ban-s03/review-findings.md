# Review findings: link-nguoi-ban-s03 (round 1)

## Trong hợp đồng

- **Bộ tra gửi POST /s03-ho-so không kèm Authorization nên collector luôn trả 401 và kết quả không bao giờ thành snapshot**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:321` · severity: high · source: conventions · AC: AC-5
  `guiCollector` chỉ gửi header content-type. `handleHoSo` ở collector/src/api/server.ts fail-closed khi thiếu khoá (401), còn hook hiện có (collector/openclaw/handler.js:62) có gửi `Bearer ${key}`. Mọi lô rơi xuống `spool-ho-so.jsonl` và không có gì phát lại spool. Lời tra vẫn tiêu hạn mức và gây rủi ro cho phiên kênh, nhưng `stg_s03_ho_so` không bao giờ có dữ liệu. Test vitest dùng `fetchImpl` giả trả ok nên không bắt được.

- **seller-lookup.ts trong .patch không qua được TS strict: deps mặc định thiếu hàm, gọi hàm không tồn tại, bộ hẹn giờ không được nối**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:381` · severity: high · source: conventions · AC: AC-1
  `taoDepsMacDinh` thiếu `doiTen`, `tonTai`, `xoaFile` (trường bắt buộc), nên `chayVong` ném TypeError ở `deps.tonTai`. `khoiDongBoTra` (dòng 408–412) gọi `chayVongLookup`, hàm không được định nghĩa. Patch không có chỗ gọi `khoiDongBoTra` hay `dungBoHenGio`, và không đọc env `S03_LOOKUP_DIR` như runtime-map mô tả. Lệnh chấm `lnb_tra` chỉ chạy vitest (không typecheck) trên deps giả nên lọt. Vi phạm luật 12 của AGENTS.

- **Snapshot hồ sơ vẫn bị đánh dấu đã nạp khi chưa áp 080, trái DATA-CONTRACT/AC-6, và thước db-nap không kiểm vế này**
  file: `pipeline/import-airbnb.mjs:205` · severity: medium · source: conventions · AC: AC-6
  Khi `coBang = false`, bộ nạp vẫn INSERT vào `airbnb_snapshots` rồi COMMIT. Bảng này là dấu «đã nạp» mà finalize-hanoi.sh:15 dùng. DATA-CONTRACT v7 và AC-6 ghi «KHÔNG đánh dấu snapshot hồ sơ đã nạp». Không lệnh `kiem` nào của scripts/link-nguoi-ban-s03/db-nap.mjs kiểm `airbnb_snapshots`.

- **Snapshot zalo-agent bị nâng lên schemaVersion 6 mà DATA-CONTRACT trên nhánh không khai v6 và không thêm field nào**
  file: `collector/src/api/server.ts:10` · severity: medium · source: conventions · AC: AC-5
  `ZALO_AGENT_SCHEMA_VERSION = 6` làm mọi snapshot tin S03 ghi manifest v6, trong khi DATA-CONTRACT vẫn ghi «schemaVersion 5 — 1–5 đều hợp lệ». v6 thuộc nhánh ma-album-s03 chưa gộp (`meta.albumMeta`). Luật 4 của AGENTS không được giữ. Hằng cũng bị khai lại ở server.ts (nhánh album khai ở core/storage.ts), có thể trùng hoặc xung đột import khi gộp, và được đặt xen giữa các câu `import`.

- **Bộ tra gửi kết quả tới collector không kèm Authorization: luôn bị 401 rồi lặng lẽ rơi xuống spool mà không có gì gửi lại**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:323` · severity: high · source: bugs · AC: AC-5
  Trùng ý với phát hiện trên. Thêm: `if (r.ok) return;` không ghi log; `maTrongSnapshot` (pipeline/lib/chon-ma-ho-so.mjs) chỉ đọc snapshot chứ không đọc spool, nên cùng các mã bị chọn lại ở lượt sau, tức là tra lặp. `ghiLienLacHoSo` không bao giờ thêm liên lạc.

- **Lối vào hẹn giờ thật của bộ tra gọi hàm không tồn tại và deps mặc định thiếu hàm; lỗi bị .catch(() => {}) nuốt**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:411` · severity: high · source: bugs · AC: AC-1
  `khoiDongBoTra` gọi `chayVongLookup` trong khi hàm tên `chayVong`. `taoDepsMacDinh` (dòng 381) thiếu `doiTen`, `tonTai`, `xoaFile`, nên TypeError ở `deps.tonTai(chan)` bị `.catch(() => {})` nuốt, không log, không tệp chặn. Patch không nối `khoiDongBoTra` hay `dungBoHenGio` vào monitor nên bộ tra không bao giờ chạy. Vitest dùng esbuild nên cả 11 lệnh chấm vẫn xanh.

- **unchanged_profiles bị xếp thành khong-username thay vì khong-ro, làm pipeline rút nhầm username đang đúng**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:161` · severity: medium · source: bugs · AC: AC-1
  `phanLoai` gán khoá trong unchanged_profiles thành `khong-username`, trong khi DATA-CONTRACT, migration 080 và runtime-map định nghĩa `khong-ro` là nhóm hồ sơ không đổi. `quyetLienLacHoSo` (pipeline/lib/lien-lac-ho-so.mjs ~711) gặp `khong-username` thì rút liên lạc chat_profile với lý do bo-username. Một mã đã có username, tra lại sau 30 ngày, nếu rơi vào unchanged_profiles thì username đúng bị rút.

- **Bộ nạp đánh dấu snapshot hồ sơ đã nạp và vứt dữ liệu khi chưa áp 080, trái hợp đồng; lỗi dò bảng bị nuốt thành false**
  file: `pipeline/import-airbnb.mjs:199` · severity: medium · source: bugs · AC: AC-6
  Khi `coBang=false`, vòng lặp chỉ đếm `hoSoBo` rồi `continue`, nhưng snapshot vẫn INSERT vào airbnb_snapshots (dòng 207), COMMIT, thoát 0, trong khi thông điệp nói «KHÔNG đánh dấu đã nạp». finalize-hanoi.sh bỏ qua snapshot đã có trong airbnb_snapshots, zalo-import-daily.sh vẫn đẩy con trỏ khi thoát 0, nên sau khi áp 080 các dòng hồ sơ không được nạp lại. `coBangHoSo(client).catch(() => false)` biến mọi lỗi truy vấn thành «chưa có 080» và rơi vào đúng đường mất dữ liệu này.

- **Lỗi quá 15 giây bị ghi chặn là loi-la thay vì het-15s**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:174` · severity: low · source: bugs · AC: AC-2
  Nhánh hết giờ ném `new Error("het-15s")` (dòng 280), nhưng `maLoiChanTuError` chỉ khớp /timeout|timed? out|ETIMEDOUT/i, nên chan.txt ghi `loi-la`. Mã `het-15s` trong MA_LOI_CHAN không bao giờ được sinh. Không test nào phủ nhánh này.

- **Hình dạng 2 — fixture viết tay lệch khuôn bên ghi: manifest source "S06" làm readSnapshot gọi process.exit(0), cả tệp test báo đạt mà không assert nào chạy**
  file: `pipeline/scripts/importer-schema-v5.test.mjs:44` · severity: high · source: measurement · AC: AC-5
  `dirSnapshot()` viết tay manifest với `source: "S06"`. SnapshotWriter thật không ghi giá trị này. pipeline/import-chotot.mjs:62-65 gặp `manifest.source !== "chotot-ads"` thì `process.exit(0)`. Chạy `--test-name-pattern=readSnapshot` in «bỏ qua theo manifest.source=S06», 1 test đạt. Các assert `doc.length`, `seller.phone`, ca v8 và hai ca DB không bao giờ chạy mà tệp vẫn xanh.

- **Hình dạng 4 — assert âm-tính rỗng: `expect(spool).not.toContain(PII.canary)` so với khoá không tồn tại**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:751` · severity: high · source: measurement · AC: AC-5
  Hằng PII trong seller-lookup.test.ts không có khoá `canary`, nên `PII.canary` là undefined và `not.toContain(undefined)` luôn đạt. Test không kiểm chuỗi đánh dấu nào, chỉ nhìn spool (không nhìn snapshot hay tệp chặn), và không có đối chứng dương. Vế PII của E5 và E2 dựa vào phép đo này.

- **Hình dạng 4 — «mốc 60 giây sống qua khởi động lại» đạt vì dấu đã-thử, không phải vì mốc 60 giây**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:641` · severity: high · source: measurement · AC: AC-1
  Vòng 1 ở chế độ thử ghi `da-thu.txt`. Ở vòng 2, `chayVong` trả 0 lời tại kiểm `!luotLon && tonTai(daThu)`, đứng TRƯỚC kiểm `moc60s` (~dòng 258). Assert đạt kể cả khi mốc 60 giây không được ghi hay đọc lại. Không có đối chứng dương (bật lượt lớn, đổi đồng hồ qua 60 giây). Các vế «21 mã ra 2 lời cách ≥ 60 giây» và «đúng 1 vòng hẹn giờ sau hai lần khởi động lại» không có phép đo hành vi; chỉ có regex trên văn bản .patch ở tien-kiem-ho-so.test.mjs.

- **Hình dạng 5 — E2 hứa năm loại lỗi + treo 15 giây + listener đóng, vitest chỉ có một điểm-case HTTP 429**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:652` · severity: high · source: measurement · AC: AC-2
  E2 liệt kê error_code máy chủ, HTTP 401, 429, giới hạn tần suất, lỗi lạ, treo 15 giây, listener đóng 10 giây. seller-lookup.test.ts chỉ có ca HTTP 429. Lỗ hổng có hậu quả thật: lời treo ra `loi-la` chứ không `het-15s`, và mã không bao giờ sinh `loi-may-chu` hay `listener-dong-sau-goi`.

- **Hình dạng 2 — bộ phân loại lỗi viết tay trong test (maChan) thay cho hàm thật, và lệch với hàm thật**
  file: `collector/openclaw/tests/link-nguoi-ban/phai-lui-ho-so.test.mjs:60` · severity: high · source: measurement · AC: AC-2
  Test «E2-phu» tự định nghĩa `maChan` rồi assert chính hàm đó; không mã sản phẩm nào được gọi, vế «dừng, 0 thử lại» không được đo. Bản viết tay lệch hàm thật: `maChan("het-15s") === "het-15s"` trong khi hàm thật trả `loi-la`; `http-5xx` không có trong MA_LOI_CHAN (mã dùng `loi-may-chu`).

- **Hình dạng 3 — «listener đóng 10 giây sau lời 1 → listener-dong-sau-goi» chỉ assert chuỗi có mặt trong log do chính test dựng**
  file: `collector/openclaw/tests/link-nguoi-ban/phai-lui-ho-so.test.mjs:46` · severity: high · source: measurement · AC: AC-2
  Test chỉ `assert.ok(/listener closed/.test(log))` và hai regex tương tự trên mảng chuỗi do chính test viết. Không gọi `phanLuiHoSo` hay `docDongDongListener`, không so mốc thời gian, không kiểm tệp chặn. Dòng log dùng ISO `T...+07:00` mà `docDongDongListener` (regex `^\d{4}-\d{2}-\d{2} \d{2}`) không đọc được, nên nếu nối vào hàm thật cũng ra 0 lần đóng.

- **Hình dạng 1 — E1-phu đo văn bản .patch (regex hằng) thay vì đầu ra của bộ tra**
  file: `collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.test.mjs:72` · severity: high · source: measurement · AC: AC-1
  Tên test hứa «21 mã → 2 lời cách ≥60 giây; hẹn sống qua 2 lần khởi động lại; API trống không tạo client; băm tệp phiên không đổi». Thân test chỉ có regex trên patch (`maMoiLoi:\s*20`, `giayGiuaLoi`, và một regex âm-tính gần như luôn đạt). Dòng 75 import một shim không tồn tại rồi nuốt lỗi bằng `.catch`. Không có lời gọi `chayVong`, không đếm lời, không băm tệp.

- **Hình dạng 4 — E9 «đặt chặn/xoá yêu cầu sau lời 1 thì lời 2, 3 bằng 0» chỉ đo bằng lambda tự-đúng và một ca vitest đi đường khác**
  file: `collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.test.mjs:96` · severity: high · source: measurement · AC: AC-9
  «E9-phu» dựng `loiGoi` ngay trong test, gán `coTep = false` rồi assert `loiGoi(2) === 0`; không chạm `chayVong`. Ca vitest «đặt tệp chặn giữa lượt (trước lời)» (extension.patch:721) ghi chan.txt TRƯỚC vòng nên thoát ở kiểm đầu `chan-con`. Đoạn tái kiểm ngay trước lời gọi (~dòng 264 của .patch) không ca nào chạm tới.

- **Hình dạng 6 — marker bộ canh đọc từ checkout OpenClaw của tác giả (~/dev/openclaw), không từ cây đã vá đang kiểm, và vắng biến thì lặng lẽ bỏ qua**
  file: `collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.test.mjs:89` · severity: medium · source: measurement · AC: AC-4
  `MON_FILE = OPENCLAW_EXT_DIR + "/src/monitor.ts"`; acceptance.mjs:36 đặt biến này theo cây làm việc của tác giả (`OPENCLAW_SRC` hoặc ~/dev/openclaw), trong khi bản vá thật chỉ áp lên bản `git archive` tạm trong chung-zcode.mjs. Thiếu biến thì chỉ `console.log("bỏ qua")` rồi đạt. Hai test ở dòng 77 và 85 đọc `./_acceptance/...extension.patch` theo cwd: chạy từ thư mục test thì ENOENT (đã chạy thử, 2 test đỏ).

- **Hình dạng 5 — tiền kiểm «lời gọi mới ngoài getUserInfo» chỉ quét ba tên cấm, test chỉ có ca login(**
  file: `collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.mjs:37` · severity: medium · source: measurement · AC: AC-9
  `cam = ["login(", "loginQR(", "createZalo("]`, trong khi ranh-gioi.mjs (E4) dùng danh sách rộng (send*, addReaction, sendTypingEvent, sendSeenEvent, sendDeliveredEvent, friend*, getAllFriends, requestOldMessages). Một .patch thêm `api.sendMessage(` hay `api.addReaction(` vẫn qua. Test (tien-kiem-ho-so.test.mjs:56) chỉ có điểm-case `login(`. Test «còn tệp yêu cầu / lượt lớn / chặn» (dòng 23) ghi hai tệp và assert `loi.length === 2`, nên chan.txt không được đo.

- **Hình dạng 5 — bẫy API giả cho AC-4 chỉ có 5 hàm cấm, không có lưới phủ lớp**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:754` · severity: medium · source: measurement · AC: AC-4
  E4 hứa 0 lời cho cả lớp hàm bị cấm. `gắnApiGia` chỉ gắn spy cho login, loginQR, createZalo, requestOldMessages, sendZaloTextMessage, không dùng Proxy đếm mọi truy cập. Nếu mã gọi `api.addReaction(...)` sẽ ném TypeError, bị catch thành tệp chặn `loi-la`; test chỉ assert `getUserInfo === 1` cùng năm spy nên vẫn xanh.

- **Hình dạng 4 — canary của E5 nhét vào username (trường hợp lệ) và chỉ kiểm vắng trong manifest, nơi không bao giờ chứa dữ liệu dòng**
  file: `collector/src/test/ho-so-api.test.ts:46` · severity: high · source: measurement · AC: AC-5
  CANARY đặt vào `username`, trường collector PHẢI lưu. Test assert `!JSON.stringify(manifest).includes(CANARY)` nhưng manifest vốn không mang payload nên luôn đạt. Không có đối chứng dương (items có chứa username). Canary không được nhét vào tên, SĐT, ảnh, ngày sinh, error_message, cookie như E5 hứa. Docstring nói «collector từ chối → spool» và «HOME giả» nhưng không assert nào cho hai việc đó.

- **Hình dạng 3 — «kênh khác giữ schemaVersion» chỉ assert hai snapshotId khác nhau và `schemaVersion >= 7`**
  file: `collector/src/test/ho-so-api.test.ts:52` · severity: medium · source: measurement · AC: AC-5
  Lời hứa là quan hệ giữa các giá trị. Test chỉ có `manifest.schemaVersion >= 7` và `notEqual(m2.snapshotId, manifest.snapshotId)`, không đọc `m2.schemaVersion`, không so với `HO_SO_SCHEMA_VERSION`, `ZALO_AGENT_SCHEMA_VERSION` hay DATA-CONTRACT. Hai kênh trùng số hoặc nhảy số vẫn xanh.

- **Hình dạng 4 — «nạp lại: +0 dòng» không kiểm mã thoát của lần nạp, bộ nạp sập vẫn đạt**
  file: `scripts/link-nguoi-ban-s03/db-nap.mjs:99` · severity: medium · source: measurement · AC: AC-6
  Dòng 98 gọi `nap(dHoSo);` và bỏ kết quả; dòng 99 chỉ assert `(await dem()) === 2`. pipeline/tests/ho-so-nap.itest.mjs:56-58 có cùng dạng. Không có đối chứng chứng minh lần nạp thứ hai đi tới đường ON CONFLICT.

- **Hình dạng 5 — rút liên lạc khi tra lại ra khong-username chưa có ca nào, chỉ có khong-tim-thay**
  file: `scripts/link-nguoi-ban-s03/lien-lac.mjs:559` · severity: low · source: measurement · AC: AC-7
  E7 hứa cả khong-username và khong-tim-thay đều rút với lý do bo-username. lien-lac.mjs (dòng 559) và pipeline/scripts/link-nguoi-ban-s03.test.mjs:38 chỉ có khong-tim-thay. Phần tử khong-username (nhánh ở lien-lac-ho-so.mjs:61-63) không có assert.

- **Hình dạng 4 — ca «v8 chưa khai bị từ chối» nới ghim thông điệp, chấp nhận cả lỗi không liên quan**
  file: `pipeline/scripts/importer-schema-v5.test.mjs:76` · severity: low · source: measurement · AC: AC-5
  `assert.rejects(..., /manifest thiếu finishedAt|schemaVersion 8 chưa hỗ trợ/)` dùng manifest không có finishedAt. Nếu kiểm phiên bản bị bỏ hay dời xuống sau kiểm finishedAt thì test vẫn đạt. Ngoài ra tệp thoát 0 trước khi tới ca này (xem phát hiện source "S06").

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Không job nào nạp snapshot `*__s03-ho-so__*`, nên stg_s03_ho_so luôn rỗng trên đường chạy đêm**
  Người dùng thấy gì: Dữ liệu hồ sơ người bán lấy về sẽ không tự vào kho mỗi đêm, nên link hồ sơ không xuất hiện nếu không ai nạp tay.
  Căn cứ: Không mất dữ liệu đã thu và người vận hành nạp tay được, nhưng thiếu bước này thì tính năng chạy đêm không có tác dụng; sửa rẻ nhưng thuộc làn khác nên cần việc riêng.
  file: `scripts/zalo-import-daily.sh`
  severity: high
  Đề xuất: new-contract

- **collector/package-lock.json bị xoá trong một commit không liên quan**
  Người dùng thấy gì: Cài lại bộ thu thập có thể ra phiên bản thư viện khác nhau giữa các lần, hoặc lệnh cài sạch báo lỗi.
  Căn cứ: Không ảnh hưởng dữ liệu người dùng và khôi phục tệp từ lịch sử là rẻ, nhưng nếu để lâu thì bản cài không còn ổn định.
  file: `collector/package-lock.json`
  severity: medium
  Đề xuất: new-contract

- **Collector nhận `lay_luc` là chuỗi bất kỳ mà Date.parse đọc được, không ép ISO như hợp đồng**
  Người dùng thấy gì: Thời điểm lấy hồ sơ có thể được ghi theo khuôn lạ nếu bộ tra gửi sai, làm mốc 30 ngày tra lại lệch.
  Căn cứ: Bộ tra của mình luôn gửi đúng khuôn nên hiếm xảy ra, hậu quả nhẹ và tự sửa được khi gặp.
  file: `collector/src/api/server.ts`
  severity: low
  Đề xuất: known-limits

- **Không job nạp hằng đêm nào nhận snapshot nguồn s03-ho-so**
  Người dùng thấy gì: Hồ sơ người bán đã lấy về không tự vào kho, nên bước ghi liên lạc hằng đêm luôn thấy bảng trống.
  Căn cứ: Không mất dữ liệu đã thu và nạp tay được, nhưng tính năng không chạy tự động nếu thiếu; cần việc riêng ở làn thu thập.
  file: `scripts/zalo-import-daily.sh`
  severity: medium
  Đề xuất: new-contract

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
