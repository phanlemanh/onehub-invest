## Trong hợp đồng

- **Nhánh giữ URL DB thử không đặt TEST_DATABASE_URL_ADMIN, localDbUrl() vẫn trỏ DB chung và bộ quét coi là lành**
  file: `db/db-thu.sh:25`
  severity: medium
  AC: AC-2
  source: conventions
  detail: Khi DATABASE_URL đã trỏ DB khác, `exec "$@"` ở dòng 25-26 chạy trước `export TEST_DATABASE_URL_ADMIN` ở dòng 101. `localDbUrl()` (pipeline/scripts/capture-ops-facts.mjs:38) chỉ đọc TEST_DATABASE_URL_ADMIN, không đọc DATABASE_URL, nên rơi về `oneinvest`. Vì vậy `DATABASE_URL=.../oneinvest_x npm test` vẫn mở admin vào DB chung ở các tệp app dùng `new pg.Client({ connectionString: localDbUrl() })` (labels, quyen-bon-vai, che-do-thu...) và fixture `pipeline/scripts/ops-facts-fixture.mjs`. Hai tệp pipeline `cong-tac-that.test.mjs:23` và `s06-region-tinh.test.mjs:19` cũng có DB_ROOT rơi về DB chung cùng cách. Đây trái AC-2 («lệnh chạy thẳng trên URL đó») và AC-7 (không tự trỏ DB chung bỏ qua DATABASE_URL). Lưới chặn không bắt được vì `lanh = /DATABASE_URL/` ở scripts/db-thu.test.mjs:232 khớp cả chuỗi con trong TEST_DATABASE_URL_ADMIN. Ca DT-AC-2 cũng chỉ kiểm URL, không kiểm ADMIN. Đọc mã xác nhận, chưa chạy thật đường này; chưa thấy executor nào trong config dùng dạng lệnh này. Hướng sửa: nhánh giữ URL đặt `TEST_DATABASE_URL_ADMIN` mặc định bằng DATABASE_URL, hoặc localDbUrl rơi về DATABASE_URL, rồi siết regex quét theo đúng tên biến.

- **Bộ quét AC-7 bỏ sót thư mục agent/tests/helpers dù hợp đồng hứa quét cả tệp helper**
  file: `scripts/db-thu.test.mjs:220`
  severity: low
  AC: AC-7
  source: conventions
  detail: `tepHelper()` đọc agent/tests không đệ quy, trong khi app/tests đệ quy (dòng 221). `tepTest` của agent chỉ nhận đuôi `.test.ts`. Do đó `agent/tests/helpers/db.ts`, tệp có 8 tệp test agent nhắc tới `helpers/`, không được quét. Hiện tệp này lành (dòng 9 đọc DATABASE_URL trước), nhưng nếu đổi sang URL cứng thì DT-AC-7 vẫn xanh. Đây đúng loại đường lọt mà hợp đồng ghi đã từng xảy ra với judge-chung.ts. Cần thêm `{ recursive: true }` cho agent/tests.

- **Dựng bản mẫu không kiểm lại sau khi lấy khoá, có thể dựng hai lần và trái AC-3**
  file: `db/db-thu.sh:65`
  severity: low
  AC: AC-3
  source: conventions
  detail: `giu_mau_moi` gọi `mau_con_tot` rồi `mkdir` khoá và dựng ngay, không xem lại mẫu sau khi có khoá. `mau_con_tot` tốn vài lệnh docker exec. Nếu bên đang dựng đổi tên và `rm -rf` khoá trong khoảng đó, lượt này vẫn lấy được khoá với kết quả kiểm tra cũ. Khi đó nó pg_dump thêm một lần trên DB chung và `DROP DATABASE oneinvest_suite_mau WITH (FORCE)`, trong khi lượt khác có thể đang createdb -T. AC-3 hứa «dựng lại đúng một lần ... cả khi ba lượt thấy mẫu cũ cùng lúc»; thước E2 chỉ đo trường hợp không rơi vào khe này. Cần gọi lại `mau_con_tot` ngay sau mkdir, trước `dung_mau`.

- **Chốt «bên ghi có chạy» của song-song.mjs luôn đúng, vì chính câu DELETE của probe đã làm tăng seq_scan**
  file: `_acceptance/test-suite-db-thu/probes/song-song.mjs:116`
  severity: high
  AC: AC-5
  source: bugs
  detail: ghi0 chụp ở dòng 65, trước câu `DELETE FROM property_offers WHERE random() < 0.3` ở dòng 88 do client của probe chạy. random() là hàm volatile nên câu này buộc quét tuần tự, seq_scan của property_offers tăng ít nhất 1. tang_quet (dòng 112) vì vậy luôn > 0 ngay cả khi resolve-properties và refresh-bait-gap không chạy được. tang_ghi cũng bị cộng n_tup_del của câu DELETE. Bên ghi lại spawn với stdio "ignore" (dòng 51) và exit nào cũng respawn (dòng 53), không xét mã thoát, nên script crash ngay chỉ tạo vòng respawn im lặng. Hệ quả: E3, E4 không phân biệt được có hay không có tải ghi. Nhánh «thước hỏng: bên ghi không chạy» không bao giờ kích hoạt, nên E4 có thể xanh mà không chứng được SD-AC-6 chạy cùng bên ghi. Cách sửa: chụp ghi0 sau DELETE, đo trên số do bên ghi tạo (ví dụ n_tup_ins), và đòi có ít nhất một lượt bên ghi exit 0. Kết luận này rút từ đọc mã và cơ chế đếm của Postgres, chưa chạy trên DB thật.

- **`dung_mau || r=$?` tắt set -e, nên VACUUM ANALYZE lỗi mà bản mẫu thiếu thống kê vẫn được đóng dấu tốt và dùng 24 giờ**
  file: `db/db-thu.sh:68`
  severity: high
  AC: AC-3
  source: bugs
  detail: Bash bỏ qua errexit bên trong hàm được gọi ở vế trái của `||`. Trong dung_mau, lỗi của `bash "$0" "$moi"`, `dau=$(dau_chung)` và `VACUUM ANALYZE` đều không dừng hàm. Chỉ lệnh psql cuối quyết định mã trả về. Đã chạy với docker giả làm VACUUM ANALYZE thoát 2: script vẫn COMMENT, DROP mẫu cũ, RENAME bản mới vào chỗ mẫu, lệnh test chạy và exit=0, không có thông báo nào của db-thu ngoài stderr của psql. Mẫu đó mang dấu hợp lệ nên mau_con_tot chấp nhận suốt 24 giờ. Đây đúng là tình huống contract ghi nhận: thiếu bước này thì E4b vượt trần 300 giây và bộ app kéo dài 98 phút. Lỗi dump ba lần trên Postgres thật được chặn một cách tình cờ, vì chế độ cũ đã xoá $moi nên COMMENT thất bại; đường đó không đo trên DB thật. Bộ test DT-AC-3 không có ca lỗi nào. Cách sửa: thêm `|| return $?` cho từng bước trong dung_mau.

- **Khi --chay giữ nguyên DATABASE_URL, localDbUrl() và TEST_DATABASE_URL_ADMIN vẫn rơi về DB chung**
  file: `pipeline/scripts/capture-ops-facts.mjs:38`
  severity: medium
  AC: AC-2
  source: bugs
  detail: db/db-thu.sh chỉ export TEST_DATABASE_URL_ADMIN ở nhánh chép DB. Hai nhánh `exec "$@"` (dòng 22, 23) dành cho URL trỏ DB thử khác hoặc máy chủ khác thì không đặt biến này. Khi đó localDbUrl() trả về localhost:5433/oneinvest. schemaUrl() trong ops-facts-fixture dựng từ hàm này, nên các test như quyen-bon-vai, dong-chay-cloud tạo schema và ghi trên DB chung, dù người chạy đã trỏ `DATABASE_URL=.../oneinvest_x npm test`. cong-tac-that và s06-region-tinh cũng dùng `TEST_DATABASE_URL_ADMIN ?? DB chung`. Đây là đúng đường mà contract đo được 172 kết nối từ app, và trái AC-2 («lệnh chạy thẳng trên URL đó»). Quét DT-AC-7 không bắt được vì dòng trên có chữ DATABASE_URL được tính là lành. Hiện chưa thấy executor nào trong config dùng dạng này. Cách sửa: cho nhánh exec đặt TEST_DATABASE_URL_ADMIN=$DATABASE_URL khi có URL, hoặc cho localDbUrl() đọc DATABASE_URL trước khi rơi về mặc định.

- **Hình 4 (âm-tính-một-mình, đối chứng dương giả): «bên ghi có chạy» luôn xanh vì chính phép đo tự tạo lượt quét**
  file: `_acceptance/test-suite-db-thu/probes/song-song.mjs:116`
  severity: high
  AC: AC-5
  source: measurement
  detail: E3 và E4 (evals.yaml dòng 39, 47) dựa vào `ben_ghi.tang_quet > 0`, và dòng 116-117 trả mã 3 «thước hỏng: bên ghi không chạy» khi số này bằng 0. Mốc `ghi0` lấy ở dòng 65. Sau đó dòng 88 của chính probe chạy `DELETE FROM property_offers WHERE random() < 0.3`. Câu này không có điều kiện dùng được index nên là seq scan trên đúng bảng đó, tức `seq_scan` tăng ít nhất 1 trước khi tính `tang_quet`. Vì vậy resolve-properties và refresh-bait-gap có chết ngay khi khởi động thì đối chứng vẫn xanh. `tang_ghi` cũng bị DELETE này làm tăng qua `n_tup_del`, nên không phân biệt được, và cũng không được assert. Bên ghi chạy với `stdio: "ignore"`, còn `p.on("exit", ...)` dòng 53 đếm `soLuotGhi` bất kể mã thoát, nên bên ghi lỗi hoàn toàn không lộ ra. Hệ quả: «0 kết nối của lượt tới bản chép» ở E4 và «đối chứng» ở E3 không chứng được điều kiện AC-5 là «bên ghi thật đang ghi property_offers». Kết luận này từ đọc code, không chạy probe trên DB.

- **Hình 5 (tuyên quét LỚP, chỉ có điểm-case): dongLot bỏ lọt các dạng trỏ DB chung và bỏ biến mà AC-7 hứa chặn**
  file: `scripts/db-thu.test.mjs:232`
  severity: high
  AC: AC-7
  source: measurement
  detail: AC-7 hứa không tệp test nào «tự trỏ DB chung bỏ qua DATABASE_URL» hay «xoá biến đó khỏi tiến trình con mà không gán lại». Có hai chỗ hở. (1) Dòng 232 `lanh = /DATABASE_URL/.test(truoc)` miễn mọi dòng có chữ DATABASE_URL trong cửa sổ 3 dòng, không kiểm nó có «đứng trước làm đường chính» như comment dòng 224 nói. (2) Dòng 234 chỉ khớp đúng biến tên `env` với `^\s*delete env\.DATABASE_URL`. Đối chứng dòng 266-269 chỉ có 5 + 7 điểm-case viết theo đúng khuôn regex, không có ma trận dạng viết-trước. Chạy lại đúng hàm dongLot trên 12 dạng đều KHÔNG bị bắt: `process.env.DATABASE_URL = "…5433/oneinvest"`; `env: {...process.env, DATABASE_URL: `${PG}/oneinvest`}`; `process.env.TEST_DATABASE_URL_ADMIN = "…5433/oneinvest"`; comment nhắc DATABASE_URL ngay trên một URL cứng; `delete process.env.DATABASE_URL`; `delete childEnv.DATABASE_URL`; destructure bỏ biến; env liệt kê dương `{PATH, HOME}`; `DATABASE_URL: undefined`; `{port: 5433, database: "oneinvest"}`; `u.pathname = "/oneinvest"`; `docker exec … psql -d oneinvest`. Quét cây hiện tại chưa thấy dạng nào trong số đã grep đang lọt vào bộ npm test, nên đây là lỗ của lưới, chưa phải vi phạm đang chạy. Lỗ này nặng vì lay-mau.mjs dòng 4-5 giao đúng đường «tiến trình con bị bỏ biến môi trường» cho lưới này: các dạng trên không mang PGAPPNAME nên bộ lấy mẫu E5-E7 cũng không thấy.

- **Hình 5 (tuyên quét LỚP, chỉ có điểm-case): danh sách helper không gồm agent/tests/helpers/db.ts dù AC-7 hứa quét helper mà test nạp**
  file: `scripts/db-thu.test.mjs:220`
  severity: medium
  AC: AC-7
  source: measurement
  detail: AC-7 hứa quét «tính cả tệp helper mà test nạp». Dòng 220 đọc `agent/tests` không recursive, trong khi dòng 221 của app có recursive. Chạy thử, helper của agent chỉ ra `['judge-chung.ts']`, nên `agent/tests/helpers/db.ts` nằm ngoài lưới. Đây là helper `withTx` nối DB của bộ agent, dòng 8-9 có fallback tới URL DB chung. Dòng 222 của pipeline là danh sách theo tên (`fixture*`, `capture-*`), không rút từ import thật của test. Assert dòng 260 chỉ ghim hai tên capture-ops-facts và judge-chung, nên sửa db.ts bỏ `process.env.DATABASE_URL ??` thì ca DT-AC-7 vẫn xanh. Bản hiện tại của db.ts còn lành, lỗ này chỉ lộ khi có thay đổi sau.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **SD-AC-6 vẫn chạy thẳng trên DB chung qua executor shs_deals_cu**
  Người dùng thấy gì: Khi chấm lại hồ sơ cũ về người bán, bộ kiểm này vẫn chạy trên kho dữ liệu chung nên có thể tranh khoá với job thu thập và đỏ ngẫu nhiên. Chạy lại thường sẽ xanh, không mất dữ liệu.
  Căn cứ: Lỗi chỉ làm lượt chấm đôi khi đỏ giả hoặc chậm, không mất hay lộ dữ liệu, tự hết khi chạy lại, và mục này đã được hợp đồng gom vào việc riêng cho các executor còn lại.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Eval E9 ghi sai mã ca: DT-AC-7, trong khi ca thật là DT-AC-5**
  Người dùng thấy gì: Mô tả của một mục kiểm ghi nhầm mã ca nên người chấm tra theo mã sẽ không tìm thấy ca. Không ảnh hưởng đến kết quả kiểm hay dữ liệu.
  Căn cứ: Chỉ là nhãn ghi nhầm trong tài liệu, không đổi kết quả chạy, sửa sau rất rẻ và không gây hại nào cho người dùng.
  file: `_acceptance/test-suite-db-thu/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **dem-deadlock chỉ in tổng property_offers cả cửa sổ, không đọc được ngưỡng «≥ 20 ca/ngày» của hợp đồng**
  Người dùng thấy gì: Công cụ đếm lỗi khoá chỉ cho tổng cả khoảng thời gian chứ không theo từng ngày, nên người đọc phải tự tách số khi quyết định có làm tiếp việc dọn khoá hay không.
  Căn cứ: Chỉ làm khó việc đọc số theo dõi, không ảnh hưởng người dùng cuối hay dữ liệu, và người vận hành vẫn đối chiếu tay được.
  file: `_acceptance/test-suite-db-thu/probes/dem-deadlock.mjs`
  severity: low
  Đề xuất: known-limits

- **chotot-thieu-moc ghép chuỗi `?options=`, hỏng khi DATABASE_URL đã có query**
  Người dùng thấy gì: Nếu ai đó tự chạy bộ kiểm với địa chỉ kho dữ liệu đã kèm tham số, một ca kiểm của nguồn tin rao có thể không vào đúng vùng tạm và cho kết quả sai. Chạy theo lối thường không gặp.
  Căn cứ: Chỉ xảy ra khi tự đặt địa chỉ đặc biệt, hậu quả là ca kiểm đỏ hoặc sai chứ không mất dữ liệu thật, và đổi lại cách chạy là hết.
  file: `pipeline/scripts/chotot-thieu-moc.test.mjs`
  severity: low
  Đề xuất: known-limits

- **db-thu.test.mjs không dọn thư mục tạm, khác pattern của các test cùng thư mục**
  Người dùng thấy gì: Mỗi lượt chấm để lại một ít thư mục tạm trên máy, tích dần theo thời gian. Hệ điều hành thường tự dọn và không ảnh hưởng dữ liệu hay sản phẩm.
  Căn cứ: Hậu quả chỉ là chiếm một ít chỗ tạm trên máy phát triển, tự dọn được, nên chi phí sửa không đáng so với tác hại.
  file: `scripts/db-thu.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **dem-deadlock.mjs nuốt lỗi docker và in «0 ca», trong khi số này quyết định có làm việc tiếp hay không**
  Người dùng thấy gì: Công cụ đếm lỗi khoá có thể báo 0 ca khi thực ra nó không đọc được nhật ký, khiến người vận hành tưởng đã hết lỗi và bỏ qua việc dọn tiếp.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, chỉ có thể làm trễ một việc dọn và người vận hành đọc lại nhật ký là phát hiện được.
  file: `_acceptance/test-suite-db-thu/probes/dem-deadlock.mjs`
  severity: medium
  Đề xuất: known-limits

- **Dấu lược đồ bỏ sót constraint, index, trigger và enum, nên mẫu cũ vẫn được dùng tới 24 giờ sau migration**
  Người dùng thấy gì: Sau một đợt cập nhật cấu trúc kho dữ liệu chỉ đổi ràng buộc hay chỉ mục, bộ kiểm có thể chạy trên cấu trúc cũ tới 24 giờ, nên có ca đỏ giả hoặc xanh giả trong thời gian đó.
  Căn cứ: Chỉ ảnh hưởng độ chính xác của kết quả kiểm trong tối đa một ngày, không chạm dữ liệu thật, và mẫu tự làm mới sau 24 giờ hoặc khi xoá tay.
  file: `db/db-thu.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình 3 (assert chuỗi có mặt trong khi lời hứa là QUAN HỆ): ca dựng lại mẫu không ghim nguồn dump và không ghim thứ tự dựng rồi đổi tên rồi chép**
  Người dùng thấy gì: Một số ca kiểm của việc dựng bản mẫu còn lỏng, nên nếu sau này ai sửa nhầm thứ tự dựng thì bộ kiểm có thể không báo đỏ. Hiện chưa có lỗi thật nào xảy ra.
  Căn cứ: Đây là rủi ro bắt lỗi sót trong tương lai, không gây hại hiện tại cho người dùng hay dữ liệu, và có thể siết ca kiểm sau khi cần.
  file: `scripts/db-thu.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình 4 (âm-tính-một-mình, không đối chứng dương): ghiDbChung chỉ được assert rỗng, chưa ca nào cho thấy nó bắt được lệnh ghi**
  Người dùng thấy gì: Phép kiểm xác nhận không có lệnh ghi vào kho dữ liệu chung chưa từng được thử với lệnh ghi thật, nên có vài kiểu lệnh ghi nó có thể không nhận ra. Hiện chưa thấy lệnh ghi nào lọt.
  Căn cứ: Chưa có tổn hại thực tế, chỉ là lưới kiểm có thể sót kiểu lệnh lạ về sau, và bổ sung ca đối chứng sau này rẻ.
  file: `scripts/db-thu.test.mjs`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/18 lỗi rơi vào file không bộ đo nào phủ (_acceptance/test-suite-db-thu/evals.yaml, _acceptance/test-suite-db-thu/probes/dem-deadlock.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
