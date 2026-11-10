# Review findings: bo-canh-dem-luot-agent (round 1)

## Trong hợp đồng

- **Bước kiểm E9/AC-8 «bản giả thắng PATH» không kiểm bản giả: chạy command -v với PATH thật của tiến trình node**
  AC: AC-8
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs:64`
  severity: high
  source: conventions (t1)
  detail: Vòng `for (const n of ["launchctl","pkill","osascript"]) spawnSync("/bin/sh", ["-c", `command -v ${n}`])` chạy trước khi tạo sandbox và không truyền env, nên nó chỉ xác nhận bản THẬT có trong PATH của máy. Nó không xác nhận bản giả trong `sb.stub` đứng trước. Ca «PATH sai thoát 2» mà E9 và AC-8 đòi chỉ xảy ra khi máy thiếu launchctl thật, tức ngược với ý định. Vòng này cũng chỉ có 3 trong 6 tên mà AC-8 liệt kê (thiếu pgrep, curl, sleep). Rào luật 8 «kiểm bản giả trước khi chạy» chưa được hiện thực. Cách sửa: trong makeSandbox/runWd, chạy `command -v <n>` với đúng env `PATH=${sb.stub}:…`, so kết quả với `join(sb.stub, n)` cho đủ 6 tên, lệch thì exit 2.

- **Phép so E9c «launchd gateway thật không đổi» luôn đúng (tautology)**
  AC: AC-8
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs:531`
  severity: high
  source: conventions (t2)
  detail: `check(sau === GW_BEFORE || !/KILL/.test(sau), ...)`: đầu ra của `/bin/launchctl list` không bao giờ chứa chuỗi «KILL», nên vế phải luôn true và phép so không bao giờ đỏ, kể cả khi `ai.openclaw.gateway` bị bootout thật. AC-8 còn đòi «tiến trình gateway thật không đổi» (E9 ghi «PID gateway thật»), nhưng không có chỗ nào chụp hay so PID. Cách sửa: lọc dòng `ai.openclaw.gateway` (gồm PID) trước và sau rồi so bằng, bỏ vế `|| !/KILL/`.

- **doc-that.sh (E10/AC-9) không đọc bản chép đã đóng sạch tệp phụ, và thoát 0 cả khi đọc lỗi**
  AC: AC-9
  file: `scripts/watchdog-l4d-agentdb/doc-that.sh:23`
  severity: high
  source: conventions (t3)
  detail: Chú thích đầu tệp, AC-9 và E10 đều nói phép đọc chạy «trên kho thật VÀ trên bản chép đã đóng sạch -wal/-shm». Script chỉ lặp glob trên thư mục agents, không có bước tạo bản chép đóng sạch. Trạng thái immutable=1 (lỗi rc 14 ngày 06/11, lý do của AC-5) không được đo trong môi trường launchd thật. Khi `l4d_read_db` lỗi, script chỉ in `LOI-doc-khong-duoc` ra stderr rồi vẫn thoát 0; không có kho nào cũng thoát 0 với đầu ra rỗng. AC-9 đòi «đọc lỗi thì không được gộp», nhưng executor `bcdl_doc_that` xanh trong cả hai ca. Cách sửa: đếm lỗi và thoát khác 0, thoát khác 0 khi không gặp kho nào, thêm bước sao chép kho sang thư mục tạm, đóng sạch (checkpoint) rồi đọc.

- **Ca riêng tư E8 rỗng một phần: «stdout» không được bắt, và không kiểm danh sách tệp ở chế độ mode=ro**
  AC: AC-7
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs:458`
  severity: medium
  source: conventions (t4)
  detail: E8a đọc `r_out(sb)` = `join(sb.S, "out.log")`, nhưng tệp này không bao giờ được ghi vì runWd trả `out` mà E8a bỏ đi. Vế «canary không lọt ra stdout» luôn đạt. E8c chú thích «WAL còn mở trạng thái», nhưng makeAgentDb đã đóng kết nối nên không có -wal: ca này đi nhánh immutable, chỉ so băm và không so danh sách tệp trước/sau. Yêu cầu «danh sách tệp trước, sau chỉ được thêm -shm khi đã có -wal» (nhánh mode=ro) không có ca nào kiểm. E8b cũng không kiểm «chế độ chỉ đọc» (mode=ro/immutable) trên dòng gọi sqlite3 như expected ghi.

- **doc-that.sh (E10) luôn exit 0 kể cả khi mọi lần đọc kho thật lỗi hoặc không có kho nào**
  AC: AC-9
  file: `scripts/watchdog-l4d-agentdb/doc-that.sh:24`
  severity: medium
  source: bugs (t7)
  detail: Vòng for chỉ in `LOI-doc-khong-duoc` ra stderr khi l4d_read_db thất bại, rồi đi tiếp. Lệnh cuối là `if/else echo`, nên mã thoát luôn là 0. Nếu glob không khớp (HOME sai hoặc chưa có agent) thì `[ -e ] || continue` cũng cho ra 0 mà không in dòng nào. Executor bcdl_doc_that chấm E10 theo «exit 0», nên phép đọc thật trước khi gộp (AC-9) vẫn xanh dù hàm đọc gãy đúng trong môi trường launchd. Cần gom lỗi rồi thoát khác 0, và thoát khác 0 khi số kho đọc được là 0.

- **doc-that.sh không có bước đọc «bản chép đã đóng sạch tệp phụ» mà E10/AC-9 đòi**
  AC: AC-9
  file: `scripts/watchdog-l4d-agentdb/doc-that.sh:24`
  severity: medium
  source: bugs (t8)
  detail: Chú thích đầu tệp và kỳ vọng E10 đều ghi «trên MỌI kho phiên thật và trên bản chép đã đóng sạch tệp phụ». Script chỉ lặp qua `${1:-$HOME/.openclaw/agents}`, không chép kho nào ra và không đóng tệp phụ nào. Executor trong config.yaml không truyền đối số. Nhánh immutable=1 (lỗi rc 14 gặp thật ngày 06/11) không bao giờ được thử trong môi trường launchd thật khi gateway đang giữ -wal, mà evidence E10 vẫn ghi là đã phủ.

- **Bước kiểm bản giả thắng PATH (E9) thực ra kiểm lệnh THẬT có trong PATH của harness**
  AC: AC-8
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs:63`
  severity: medium
  source: bugs (t9)
  detail: Vòng `command -v launchctl|pkill|osascript` chạy bằng spawnSync với env của chính tiến trình node, trước khi có sandbox hay thư mục stub. Nó chỉ xác nhận lệnh thật tồn tại, không xác nhận bản giả đứng trước trong PATH mà runWd dùng. Ca «PATH sai thoát 2» trong E9 cũng không có. Hiện runWd tự đặt stub lên đầu PATH nên an toàn, nhưng nếu ai đổi runWd thì không còn gì chặn. Cùng gốc t1.

- **Phép so launchd gateway thật ở E9c luôn đúng**
  AC: AC-8
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs:534`
  severity: medium
  source: bugs (t10)
  detail: `check(sau === GW_BEFORE || !/KILL/.test(sau), ...)`: đầu ra `launchctl list` không bao giờ chứa chữ «KILL», nên vế phải luôn true và phép kiểm không bao giờ đỏ, kể cả khi ai.openclaw.gateway thật đã bị bootout. Kỳ vọng E9 «so trước, sau launchd gateway thật, PID gateway thật» không được kiểm: không tách dòng ai.openclaw.gateway ra so, cũng không so PID. `logCuoi.includes("KILL")` ở dòng 538 cũng gần như vô nghĩa, vì KILL được ghi vào tệp alerts chứ không vào zalo-watchdog.log.

- **E8a: vế kiểm canary trên stdout không bao giờ kiểm gì**
  AC: AC-7
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs:469`
  severity: low
  source: bugs (t11)
  detail: `r_out(sb)` đọc `join(sb.S, "out.log")`, nhưng không chỗ nào ghi tệp này. Đầu ra stdout/stderr mà runWd trả về trong `.out` bị bỏ đi ở E8a, nên phần «canary không lọt ra stdout» luôn đạt rỗng. Muốn kiểm thật phải dùng giá trị trả về của runWd(sb).out.

- **E8c không kiểm đường mode=ro, không kiểm luật «chỉ thêm -shm khi đã có -wal»**
  AC: AC-7
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs:490`
  severity: low
  source: bugs (t12)
  detail: Chú thích ghi «WAL còn mở trạng thái», nhưng makeAgentDb đã đóng kết nối nên -wal/-shm bị xoá trước khi chạy. Ca này chỉ đi đường immutable=1, chỉ so băm tệp chính, không so danh sách tệp trước/sau. Kỳ vọng E8 «danh sách tệp trước, sau chỉ được thêm -shm khi đã có -wal» trên đường mode=ro không có ca nào kiểm.

- **Hình dạng 3 (chuỗi có mặt thay cho quan hệ): bước «command -v kiểm bản giả thắng» chỉ kiểm lệnh thật có trong PATH**
  AC: AC-8
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs:63`
  severity: high
  source: measurement (t14)
  detail: E9/AC-8 hứa một quan hệ: `command -v launchctl|pkill|osascript` phải trỏ vào thư mục stub (`sb.stub`) trước khi chạy, PATH sai thì thoát 2. Dòng 63-66 chạy `command -v` trong PATH của chính tiến trình node, lúc chưa dựng sandbox và chưa có stub; chỉ xác nhận `/bin/launchctl` thật có mặt và không so đường dẫn tìm được với `sb.stub`. Không có ca nào cố ý làm PATH sai để chứng minh script thoát 2, nên phần này của expected E9 chưa được đo. Cùng lỗi t1.

- **Hình dạng 4 (assertion âm tính một mình, luôn đúng): E9c so launchd và log thật bằng phép không thể sai**
  AC: AC-8
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs:534`
  severity: high
  source: measurement (t15)
  detail: Dòng 534 là `check(sau === GW_BEFORE || !/KILL/.test(sau), ...)`; đầu ra `launchctl list` không bao giờ chứa «KILL», nên việc so trước/sau bị vô hiệu. Expected còn hứa so PID gateway thật, nhưng code không làm. Dòng 538 `check(!logCuoi.includes("KILL"), ...)` trên log bộ canh thật: hàm `alert()` (`scripts/zalo-watchdog.sh` dòng 29) ghi «KILL» vào ALERT_LOG, không vào WD_LOG, nên phép này cũng luôn đạt. Cả hai phép đều không có đối chứng dương.

- **Hình dạng 4 (âm tính một mình, không đối chứng dương): E8a nói kiểm canary trên stdout nhưng đọc một tệp không ai ghi**
  AC: AC-7
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs:469`
  severity: high
  source: measurement (t17)
  detail: Dòng 469 ghép `alerts(sb) + read(sb.calls) + okLog(sb) + r_out(sb)`. `r_out` (dòng 473) đọc `join(sb.S, "out.log")`, nhưng không chỗ nào ghi tệp này: `runWd` trả `out` mà lần gọi ở dòng 468 bỏ giá trị đó. stdout/stderr của bộ canh không được kiểm dù nhãn ghi «cảnh báo/log/stdout». `okLog` chỉ lấy một dòng cuối. Phép `!all.includes(CANARY)` không có đối chứng dương (chứng minh canary nằm trong kho và một bộ đọc chạm cột nội dung thì phép này đỏ); nó đạt cả khi chuỗi gom rỗng.

- **Hình dạng 4 (âm tính một mình): E8c «băm kho không đổi» chạy trên kho đóng sạch, không chứng minh đã đọc, không kiểm danh sách tệp**
  AC: AC-7
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs:492`
  severity: medium
  source: measurement (t18)
  detail: Chú thích dòng 492 ghi «WAL còn mở trạng thái», nhưng `makeAgentDb` đã `db.close()` (dòng 81). Kho đã đóng sạch nên script đi nhánh `immutable=1`; nhánh `mode=ro` có -wal (nhánh có thể sinh -shm) không được đo. Dòng 496 chỉ kiểm băm không đổi, không kiểm mốc hay `killed` để biết lần đọc có thành công, nên một lần đọc hỏng cũng cho băm không đổi. Expected E8 hứa «danh sách tệp trước/sau chỉ được thêm -shm khi đã có -wal», nhưng E8c không liệt kê tệp.

- **Hình dạng 4 (âm tính một mình): doc-that.sh (E10) thoát 0 cả khi mọi lần đọc kho thật đều hỏng hoặc không có kho nào**
  AC: AC-9
  file: `scripts/watchdog-l4d-agentdb/doc-that.sh:23`
  severity: high
  source: measurement (t21)
  detail: Expected E10 là «exit 0; ... mỗi lần in đúng số|số». Trong vòng lặp ở dòng 23-31, khi đọc lỗi script chỉ `echo "$AG LOI-doc-khong-duoc" >&2` rồi đi tiếp; mã thoát của vòng `for` là của lệnh cuối (echo), nên executor `bcdl_doc_that` vẫn ra 0. Không thấy kho nào (`[ -e "$DB" ] || continue`) cũng ra 0 mà không in gì. Không có đối chứng dương như đòi ít nhất một dòng `agent số|số`. Phần «trên bản chép đã đóng sạch tệp phụ» mà chú thích đầu tệp (dòng 4-5) và expected tuyên bố không có trong code.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **card-plain.json thiếu AC-10, và xếp AC-5, AC-11 vào wont_do dù là việc sẽ làm**
  Người dùng thấy gì: Thẻ duyệt đưa cho người ký thiếu một tiêu chí về tài liệu và xếp nhầm hai việc sẽ làm vào mục «sẽ không làm», nên người ký có thể hiểu sai phạm vi.
  Căn cứ: Không ảnh hưởng hành vi bộ canh và không mất dữ liệu; chữ ký đã có, sửa lại thẻ sau rất rẻ.
  file: `_acceptance/bo-canh-dem-luot-agent/card-plain.json`
  severity: medium
  Đề xuất: known-limits

- **Đường tuyệt đối máy riêng /Users/manhphan/... ghi cứng trong script của kho công khai**
  Người dùng thấy gì: Bộ phép thử ghi cứng tên người dùng và thư mục máy của Mạnh; chạy trên máy khác thì một phép kiểm báo đạt mà thực ra không đo gì.
  Căn cứ: Không ảnh hưởng người dùng cuối, chỉ lộ đường máy riêng và làm phép thử yếu trên máy khác; sửa sau rẻ.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: low
  Đề xuất: known-limits

- **E14 chỉ thử log gateway, không thử log theo ngày dù kỳ vọng ghi «cả log gateway và log theo ngày»**
  Người dùng thấy gì: Một nhánh dò log theo ngày của bộ canh đã được sửa nhưng chưa có phép thử riêng; nếu nhánh này hỏng, lượt agent chỉ ghi ở log đó có thể không bị tắt gateway.
  Căn cứ: Nhánh log gateway chính đã được thử và lỗi này chỉ phủ đường phụ; vẫn có lớp đếm trên kho phiên bù, thêm ca thử sau rẻ.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn ghi cứng ROOT): E9c đo checkout của tác giả, không đo cây đang kiểm**
  Người dùng thấy gì: Phép kiểm tệp cảnh báo thật chỉ có nghĩa trên máy của Mạnh; trên máy khác nó báo đạt mà không đo gì.
  Căn cứ: Người dùng cuối không bị ảnh hưởng, chỉ làm bằng chứng nghiệm thu yếu ngoài máy tác giả; sửa sau rẻ.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (chuỗi có mặt thay cho quan hệ): E6 hứa «lý do phân biệt được» nhưng mọi ca chỉ kiểm cùng một chuỗi**
  Người dùng thấy gì: Khi bộ canh tắt gateway vì không đọc được kho phiên, thông báo dùng chung một câu cho mọi nguyên nhân nên người vận hành phải tự đoán nguyên nhân cụ thể.
  Căn cứ: Gateway vẫn bị tắt đúng và có nêu lý do chung; chỉ chậm chẩn đoán, không mất dữ liệu, cải thiện thông báo sau rẻ.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên phủ cả lớp nhưng chỉ có một điểm): E14 hứa «cả log gateway và log theo ngày» nhưng chỉ đo gateway.log**
  Người dùng thấy gì: Chỗ sửa dò log theo ngày chưa có phép thử riêng, nên chưa chắc nó tắt gateway đúng khi lượt agent chỉ để dấu ở log đó.
  Căn cứ: Đường chính vẫn được thử và còn lớp đếm trên kho phiên bù; thêm ca thử sau rẻ, không mất dữ liệu.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
