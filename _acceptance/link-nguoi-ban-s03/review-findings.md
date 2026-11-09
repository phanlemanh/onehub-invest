## Trong hợp đồng

- **Điểm dừng an toàn `listener-dong-sau-goi` không được cài ở đâu cả: bộ tra vẫn gọi tiếp sau khi bộ nghe tin đóng**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:680`
  severity: high
  AC: AC-2
  source: bugs
  detail: AC-2 ghi «bộ nghe tin đóng, lỗi hay bộ canh báo trong 30 phút sau một lời gọi → ghi tệp chặn `listener-dong-sau-goi` và in `dung-goi-Manh`». Trong seller-lookup.ts chuỗi này chỉ nằm trong `MA_LOI_CHAN` (dòng 680), không có nhánh nào ghi vào chan.txt, monitor.ts không móc vào sự kiện đóng listener. Script `collector/openclaw/tests/link-nguoi-ban/phai-lui-ho-so.mjs` chỉ `console.log(JSON.stringify(kq))`, không ghi chan.txt, và chỉ đọc mốc của lời gọi CUỐI trong moc-60s.txt nên lần đóng rồi nối lại trong 60 giây bị lọc mất (điều kiện `d.atMs > mocLoiGoi`). Hệ quả: ở lượt lớn, bộ tra vẫn gọi `getUserInfo` mỗi 60 giây tới trần 30 lời/ngày sau khi kênh có dấu hiệu phản ứng.

- **Vòng hẹn giờ thật (khoiDongBoTra) không chặn chạy chồng, fetch tới collector không có timeout, nên hai vòng có thể cùng qua cổng 60 giây**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:1060`
  severity: low
  AC: AC-1
  source: bugs
  detail: monitor.ts gọi `khoiDongTuEnv → khoiDongBoTra`; setInterval gọi `chayVong` mỗi 60 giây không có cờ `dangChay` (cờ chỉ có trong `dungBoHenGio`, đường chạy thật không dùng). `phatLaiSpool`/`guiCollector` gọi `fetchImpl` không timeout, nên một vòng có thể kéo quá 60 giây và vòng kế chạy song song. Hai vòng cùng đọc moc-60s.txt trước khi bên nào ghi: hai lời getUserInfo trong dưới 60 giây (vượt trần AC-1), demNgay ghi đè nhau và đếm thiếu, spool bị phát lại hai lần.

- **Vòng hẹn giờ thật log cả mã tài khoản đối chứng vào log gateway**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:1063`
  severity: low
  AC: AC-3
  source: bugs
  detail: `khoiDongBoTra` log `JSON.stringify(v)`, trong đó `v.doi_chung` là `[{ ma, loai }]`, nên mã tài khoản của hai người đối chứng bị ghi vào gateway.log. `dungBoHenGio` song song cố ý chỉ in `loai`, và lap-yeu-cau-ho-so cũng nói «không in mã». Đường chạy thật lệch cam kết này.

- **Hình dạng 4 (âm tính một mình): kiểm canary PII trong spool so với PII.canary, một khoá không tồn tại**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:377`
  severity: high
  AC: AC-5
  source: measurement
  detail: Ca vitest «collector không nhận → spool nối dần; PII canary KHÔNG xuất hiện ở bất kỳ đâu» dùng `expect(spool).not.toContain(PII.canary)`. Đối tượng PII (dòng 57-64) chỉ có khoá ten, sdt, anh, sinh, loi, cookie, không có `canary`, nên giá trị so là undefined. Phép so âm này qua dù spool có chứa chuỗi đánh dấu thật hay không, không có đối chứng dương. E5 hứa 0 lần xuất hiện ở snapshot, spool, tệp chặn, log gateway thử, evidence.

- **Hình dạng 4 (âm tính một mình): «tệp chặn còn → 0 lời» và «mốc 60 giây sống qua khởi động lại» đạt nhờ một cổng khác**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:267`
  severity: high
  AC: AC-2
  source: measurement
  detail: Ca dòng 267-276: lượt 1 đã đổi tên yeu-cau.json thành yeu-cau.da-xu.json và ghi da-thu.txt, nên lượt 2 cho 0 lời do không còn tệp yêu cầu và do dấu đã thử, không phải do mốc 60 giây đọc từ đĩa; `deps2` còn dùng chung `now` cố định. Các dòng 292-294 và 440-442 chỉ kiểm `api.dem.getUserInfo` vẫn bằng 1; lượt 2 vẫn ra 0 khi bỏ tệp chặn. Không ca nào ghim `v.chan === "chan-con"`. Ca dòng 347-358 đặt chan.txt trước khi chạy nên dừng ở cổng đầu; nhánh tái kiểm ngay trước lời gọi (`tonTai(chan) || !tonTai(yeuCau)`) không ca nào chạm tới.

- **Hình dạng 4 (âm tính một mình): ca «không có phiên» khẳng định spy login/createS03 chưa được gọi, trên một API không bao giờ được trao cho mã**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:242`
  severity: medium
  AC: AC-1
  source: measurement
  detail: Dòng 237 đặt `layApi = () => undefined`, nên các spy vi.fn() không bao giờ tới tay chayVong. `expect(api.login).not.toHaveBeenCalled()` và `expect(api.createS03).not.toHaveBeenCalled()` đúng một cách hiển nhiên; E1 hứa «0 lần đăng nhập, băm tệp phiên không đổi» nhưng không có spy nào nằm trên đường bộ tra thật sự có thể gọi.

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có ca điểm): bẫy Proxy hứa «mọi hàm API ngoài getUserInfo» nhưng chỉ đếm 5 hàm có sẵn trên đối tượng giả**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:451`
  severity: high
  AC: AC-4
  source: measurement
  detail: Chú thích ghi «không cần biết trước tên hàm». Nhưng bẫy `get` chỉ tăng daGoi khi `typeof goc === "function"`, mà đích Proxy là `gắnApiGia(apiGia)` chỉ có login, loginQR, createS03, requestOldMessages, sendS03TextMessage. Một lời gọi addReaction, sendTypingEvent, sendSeenEvent, sendDeliveredEvent, getAllFriends hay send* khác trả undefined mà không được đếm; nếu nằm trong try của chayVong, bị xếp thành loi-la và `expect([...daGoi.keys()]).toEqual([])` vẫn xanh. Danh sách cấm của E4 không viết trước thành ma trận đủ phần tử.

- **Hình dạng 2 (fixture viết tay theo khuôn bên đọc): lỗi máy chủ và «treo 15 giây» là Error tự viết, khớp đúng regex của maLoiChanTuError**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:422`
  severity: high
  AC: AC-2
  source: measurement
  detail: Bảng `it.each` ném `new Error("HTTP 401: unauthorized")`, `"Too many requests — throttle"` và `new Error("het-15s")`, chọn cho khớp `/\b401\b/`, `/rate|too many|throttle/` và `/^het-15s$/`. Ca «treo 15 giây» không dựng promise treo mà ném thẳng chuỗi của nhánh Promise.race, nên đường hết giờ thật (`deps.treMs(TRAN.treMs)`) không chạy; `taoDeps` đặt treMs ngắt sau 0 ms. E2 hứa «ném theo dạng thư viện (error_code máy chủ…)» và «0 dòng từ lời treo khi nó trả muộn», nhưng không ca nào ném lỗi có error_code và không ca nào treo thật.

- **Hình dạng 6 (đường dẫn hardcode vào checkout của tác giả): E4-phu kiểm marker trong monitor.ts của ~/dev/openclaw thay vì cây base + extension.patch**
  file: `collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.test.mjs:96`
  severity: medium
  AC: AC-4
  source: measurement
  detail: `monFile = join(process.env.OPENCLAW_EXT_DIR, "src/monitor.ts")`, với OPENCLAW_EXT_DIR do scripts/link-nguoi-ban-s03/acceptance.mjs:35 suy ra là `join(OPENCLAW_SRC ?? ~/dev/openclaw, extensions/<d>)`, tức cây làm việc của tác giả, không phải bản `git archive base` cộng `git apply extension.patch` mà chayVitestBoTra dựng ở thư mục tạm. E4 hứa marker bộ canh còn trong monitor build từ base + extension.patch, nhưng assert `mon.includes("pluginHooks") && mon.includes("SuppressMessageReceivedHooks")` đo checkout cục bộ.

- **Hình dạng 3 (assert chuỗi có mặt khi lời hứa là quan hệ): E4-phu dò chữ khoiDongTuEnv trong khối diff monitor**
  file: `collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.test.mjs:103`
  severity: low
  AC: AC-4
  source: measurement
  detail: `assert.ok(/khoiDongTuEnv/.test(khoiMon))` chỉ kiểm chuỗi có mặt; câu import cũng đủ làm nó khớp. E4 hứa «đúng một lời GỌI khoiDongTuEnv nằm trong đường khởi động Provider (đếm trên AST hoặc bằng spy, không dò chữ)». Hai assert âm `!/^\+.*\blisten\s*\(/` và `!/createServer/` chạy trên `khoiMaNguon` mà không kiểm khác rỗng; bộ lọc tên tệp lệch thì cả hai vẫn qua.

- **Hình dạng 1 (đo đầu vào thay vì đầu ra): assert «tự nối lại + handler vẫn nhận tin» chạy regex trên chính chuỗi log do test viết tay**
  file: `collector/openclaw/tests/link-nguoi-ban/phai-lui-ho-so.test.mjs:65`
  severity: high
  AC: AC-2
  source: measurement
  detail: `assert.ok(/starting .*provider/.test(log) && /post 202/.test(log), ...)`: `log` là mảng chuỗi do test tự soạn ở dòng 51-57, nên assert luôn đúng và không đo hành vi nào. Ca «E2-phu» cũng không đo điều E2 hứa (lời 2 bằng 0, có tệp chặn listener-dong-sau-goi, bộ nghe tin không bị đóng); nó chỉ phán lùi trên log tự viết.

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): E9-phu «tái kiểm thật ngay trước lời» gọi hàm tiền kiểm khởi động lại, không đếm lời gọi của bộ tra**
  file: `collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.test.mjs:115`
  severity: medium
  AC: AC-9
  source: measurement
  detail: Ca chỉ gọi `tienKiemHoSo(d, p)` (kiểm tồn tại tệp trước khi khởi động lại gateway) rồi assert danh sách lỗi rỗng hay không. Không chạy chayVong, không có API giả, không đếm lời. E9 hứa «lượt 3 lời, đặt tệp chặn sau lời 1 thì lời 2, 3 bằng 0; ca riêng xoá tệp yêu cầu sau lời 1 cũng vậy». Nhánh tái kiểm trong chayVong không được ca này hay ca vitest nào chạm tới.

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có ca điểm): tiền kiểm hứa ba tệp và sáu lời gọi cấm, test chỉ phủ hai tệp và một lời gọi**
  file: `collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.test.mjs:28`
  severity: medium
  AC: AC-9
  source: measurement
  detail: Tên ca ghi «còn tệp yêu cầu / lượt lớn / chặn → từng lỗi nêu tên tệp» nhưng chỉ ghi yeu-cau.json và luot-lon.txt rồi `assert.equal(loi.length, 2)`; chan.txt (điều kiện thứ ba trong tien-kiem-ho-so.mjs:21) không có ca. Danh sách cấm `cam` có 6 phần tử (login(, loginQR(, createS03(, requestOldMessages(, sendS03TextMessage(, addReaction() nhưng chỉ `login(` được kiểm (dòng 61-68) và assert chỉ dò chữ «cấm», không ghim tên lời gọi.

- **Hình dạng 2 (fixture viết tay theo khuôn bên đọc): itest bộ nạp tự CREATE TABLE «mô phỏng 080» thay vì áp migration thật**
  file: `pipeline/tests/ho-so-nap.itest.mjs:47`
  severity: medium
  AC: AC-6
  source: measurement
  detail: `CREATE TABLE IF NOT EXISTS stg_s03_ho_so (source_id text PRIMARY KEY, ma_tai_khoan text NOT NULL, username text, loai text, captured_at timestamptz)` viết cho khớp câu INSERT/ON CONFLICT (source_id) của napHoSo. MIG_080 thật có ở pipeline/lib/nap-080.mjs nhưng không dùng; 080 đổi ràng buộc, kiểu hay khoá thì test vẫn xanh. Tệp còn `process.exit(0)` khi thiếu LNB_IMPORT_FILE (dòng 13), thoát xanh mà không đo gì.

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): «mã chỉ có trong thành viên nhóm hay chỉ bình luận không được chọn» đo bằng regex trên chữ SQL**
  file: `scripts/link-nguoi-ban-s03/chon.mjs:34`
  severity: medium
  AC: AC-8
  source: measurement
  detail: `/FROM sale_offer_records/.test(SQL_CM.taiKhoan) && !/member|thanh_vien|comment|binh_luan/i.test(Object.values(SQL_CM).join(" "))` dò chữ trong câu SQL, không dựng mã chỉ có trong thành viên nhóm hay bình luận trên DB thử rồi kiểm docVaChon không chọn. E8 liệt kê ca này như một đầu ra, nhưng phép đo là văn bản chỉ dẫn.

- **Hình dạng 4 (âm tính một mình): đối chứng của E10 chỉ chạy hàm đếm, không chạy phép quét thật**
  file: `scripts/link-nguoi-ban-s03/ten-nguon.mjs:143`
  severity: medium
  AC: AC-10
  source: measurement
  detail: Assert chính `moi.length === 0` là âm tính, phụ thuộc danh sách tệp từ git diff/ls-files trong ROOT và phép so trước–sau qua `git show base:f`. Đối chứng dương chỉ ghi một tệp tạm ngoài kho rồi gọi thẳng `dem(readFileSync(...), entries)`, bỏ qua bước liệt kê tệp và bước so trước–sau. E10 hứa «chèn một tên miền thử vào tệp tạm thì phép quét đỏ»; nếu `tep` rỗng hay `truoc` đọc sai, phép quét vẫn xanh mà đối chứng không phát hiện. Đối chứng cũng dùng tên trong sổ chứ không dùng tên miền thử.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Không job nạp nào đọc snapshot hồ sơ `__s03-ho-so__`, nên stg_s03_ho_so không được ghi khi chạy thật**
  Người dùng thấy gì: Link hồ sơ người bán sẽ không tự xuất hiện sau khi chạy thật, vì dữ liệu tra được không được đưa vào kho mỗi đêm. Tính năng trông như chạy nhưng không ra kết quả nào.
  Căn cứ: Hậu quả là tính năng không cho ra kết quả mà không ai hay biết, nhưng không mất dữ liệu và nối thêm bước nạp sau vẫn lấy lại được.
  file: `scripts/S03-import-daily.sh`
  severity: medium
  Đề xuất: new-contract

- **Migration 080 và API mới đặt tên bảng, cột, field bằng tiếng Việt; mappings.yaml ghi sai điều kiện (3) của ADR-0011**
  Người dùng thấy gì: Tên bảng và trường dữ liệu mới viết bằng tiếng Việt, lệch quy ước chung của dự án. Người dùng cuối không thấy gì, chỉ gây khó cho người bảo trì.
  Căn cứ: Chỉ lệch quy ước đặt tên, người dùng không bị ảnh hưởng; đổi tên càng muộn càng đắt nhưng không gây mất dữ liệu.
  file: `db/migrations/080_ho_so_s03.sql`
  severity: medium
  Đề xuất: known-limits

- **Enum `loai` (4 loại kết quả tra) viết tay ở nhiều chỗ, không qua sổ từ vựng và không có CHECK**
  Người dùng thấy gì: Bốn loại kết quả tra được khai ở nhiều nơi, sau này có thể lệch nhau mà không ai phát hiện. Hiện chưa gây sai kết quả cho người dùng.
  Căn cứ: Rủi ro chỉ xảy ra khi có người sửa một nơi mà quên nơi khác; chưa có hậu quả với người dùng và sửa sau vẫn rẻ.
  file: `collector/src/api/server.ts`
  severity: medium
  Đề xuất: known-limits

- **collector/package-lock.json bị xoá trong một commit tính năng, package.json không đổi**
  Người dùng thấy gì: Bộ thu thập có thể mất phiên bản thư viện đã ghim, cài lại có thể kéo bản khác và chạy sai hoặc không cài được. Máy thu thật dùng mã này hằng ngày.
  Căn cứ: Gộp vào có thể làm bộ thu thập thật hỏng khi cài lại, nhưng khôi phục tệp từ main rất rẻ và không mất dữ liệu.
  file: `collector/package-lock.json`
  severity: medium
  Đề xuất: new-contract

- **`lay_luc` chỉ được kiểm bằng Date.parse, nên chuỗi Postgres từ chối vẫn lọt vào snapshot bất biến**
  Người dùng thấy gì: Một thời điểm viết sai khuôn có thể lọt vào kho thu và làm cả lượt nạp của snapshot đó lỗi mãi. Bộ tra thật gần như luôn gửi đúng khuôn nên khó gặp.
  Căn cứ: Xác suất gặp thấp vì phía gửi luôn dùng khuôn chuẩn; nếu gặp thì một lô hồ sơ bị kẹt nhưng chỉ ảnh hưởng tính năng này.
  file: `collector/src/api/server.ts`
  severity: low
  Đề xuất: known-limits

- **Mọi snapshot S03 bị đóng dấu schemaVersion 6 (albumMeta) dù không code nào phát albumMeta**
  Người dùng thấy gì: Số phiên bản hợp đồng dữ liệu có thể mang hai nghĩa nếu nhánh album gộp với định nghĩa khác. Người dùng không thấy ngay, chỉ gây nhầm lẫn khi đọc dữ liệu cũ.
  Căn cứ: Chỉ là rủi ro phối hợp giữa hai nhánh, chưa có sai dữ liệu nào và đối chiếu lại được khi gộp.
  file: `collector/src/core/storage.ts`
  severity: low
  Đề xuất: known-limits

- **coBangHoSo: chú thích nói ném lỗi nhưng code nuốt lỗi; hằng STG_HO_SO khai lại kèm chú thích lỗi thời**
  Người dùng thấy gì: Chú thích trong mã mô tả sai hành vi thật. Người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ là chú thích lỗi thời, chưa mất dữ liệu và sửa lúc nào cũng rẻ.
  file: `pipeline/import-S01.mjs`
  severity: low
  Đề xuất: wont-fix

- **Không job nào nạp snapshot `s03-ho-so`, nên stg_s03_ho_so luôn rỗng và ghiLienLacHoSo chạy không ghi gì mà không báo**
  Người dùng thấy gì: Link hồ sơ người bán không có dữ liệu để ghi và hệ thống không báo lỗi nào. Nếu sau này nối job theo lịch kiểu hiện tại, các hồ sơ bỏ qua do chưa áp migration sẽ mất luôn.
  Căn cứ: Không mất dữ liệu thu vì snapshot còn nguyên, nhưng tính năng im lặng không chạy nên cần việc nối riêng.
  file: `pipeline/import-S01.mjs`
  severity: medium
  Đề xuất: new-contract

- **phatLaiSpool gọi JSON.parse không bọc try: một dòng spool dở làm bộ tra kẹt vĩnh viễn**
  Người dùng thấy gì: Một dòng ghi dở trong bộ đệm có thể làm bộ tra ngừng hoạt động mà không báo gì cho đến khi có người sửa tay. Dữ liệu cũ không mất.
  Căn cứ: Hiếm gặp và chỉ dừng tính năng, không mất dữ liệu; người vận hành tự gỡ được bằng cách sửa tệp.
  file: `_acceptance/link-nguoi-ban-s03/extension.patch`
  severity: medium
  Đề xuất: known-limits

- **Phát lại spool gửi cả tệp trong một lô và nuốt mọi phản hồi lỗi: spool quá 1000 dòng hay có một dòng sai thì không bao giờ xả được, và không ai biết**
  Người dùng thấy gì: Nếu khoá kết nối sai hoặc bộ đệm quá lớn, kết quả tra kẹt lại và không bao giờ được gửi đi, mà không ai biết. Dữ liệu không mất nhưng không dùng được.
  Căn cứ: Dữ liệu vẫn còn nguyên nên không mất; kẹt chỉ xảy ra sau vài ngày chạy lượt lớn, mà lượt lớn đang ngoài phạm vi.
  file: `_acceptance/link-nguoi-ban-s03/extension.patch`
  severity: medium
  Đề xuất: known-limits

- **coBangHoSo nuốt lỗi thành false, trái với chính comment «KHÔNG được nuốt… Ném để dừng lượt»**
  Người dùng thấy gì: Khi bước kiểm tra bảng gặp lỗi lạ, hồ sơ có thể bị coi là đã xử lý và mất vĩnh viễn mà không báo lỗi. Chỉ xảy ra khi cơ sở dữ liệu có sự cố.
  Căn cứ: Cần sự cố cơ sở dữ liệu hiếm mới gặp, nhưng nếu gặp thì kết quả tra lượt đó mất và phải tra lại.
  file: `pipeline/import-S01.mjs`
  severity: low
  Đề xuất: known-limits

- **lap-yeu-cau-ho-so bỏ qua spool trong im lặng khi shell không có S03_LOOKUP_DIR**
  Người dùng thấy gì: Có thể tra lặp lại cùng một người bán và tốn bớt lời gọi trong trần ngày. Không có hại khác.
  Căn cứ: Chỉ tốn một phần hạn mức gọi, trần ngày vẫn giữ và chạy lại không gây mất gì.
  file: `pipeline/lap-yeu-cau-ho-so.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
