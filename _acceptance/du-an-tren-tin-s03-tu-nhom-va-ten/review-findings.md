## Trong hợp đồng

- **Tin có ứng viên nhưng bài bị chặn bởi một tin mâu thuẫn khác bị rơi im lặng: không ghi, không vào bảng mâu thuẫn, phá đẳng thức của AC-7**
  AC: AC-7
  file: `pipeline/lib/du-an-tren-tin-s03.mjs:132`
  severity: medium
  source: bugs
  detail: Một tin có một ứng viên duy nhất được đưa vào tinTot (dòng 132). Nhưng nếu mọi bài mang ứng viên của tin đó cũng thuộc một tin mâu thuẫn khác (baiChan), vòng ghi bỏ qua hết các bài ấy và dòng 153 không tăng tin_co_du_an. Tin đó cũng không có trong mauThuan, nên không vào bảng --bang-mau-thuan để người duyệt; nó lặng lẽ bị tính vào «còn lại» dù có ứng viên. Đã chạy lại bằng hàm thuần với đúng hình của T1/T4 trong fixture AC-3 (T1=[a(g1:P1), b(g2:P2), B(g1:P1)], T4=[B]) và nhận tin_co_du_an=0, mau_thuan=1, mauThuan chỉ có T1, trong khi có 2 tin có ứng viên. Như vậy đẳng thức có tên trong contract AC-7, «tin có dự án + mâu thuẫn = số tin có ít nhất một ứng viên», sai trên dữ liệu thật mỗi khi một bài thuộc hai tin. Test DAT-AC-7 không bắt được lỗi này: evals.yaml ghi chạy «trên fixture của AC-1…AC-5 gộp», nhưng fxGop chỉ dựng fxAc1 cộng vài bài, không có ca bài dùng chung của AC-3.

- **Hai dòng sổ cùng khoá thật, một dòng một dự án và một dòng nhiều/không dự án, không bị coi là lệch, nên vẫn suy ra dự án**
  AC: AC-1
  file: `pipeline/lib/du-an-tren-tin-s03.mjs:57`
  severity: medium
  source: bugs
  detail: Vòng sổ nhóm `continue` ngay khi ids.length !== 1, trước khi so lệch. Vì vậy dòng có [P1,P2] hay [] không tham gia phát hiện lệch. Nếu nhóm đăng ký hai lần ('zalouser:group:9' → [P1], '9' → [P1,P2]), soNhom vẫn giữ P1 và bài vẫn được ghi project_node_id=P1 (đã chạy lại: dong.length=1, nhom_lech=0). Trường hợp xét lại trong AC-4 cũng lỗi theo: người sửa sổ chỉ đổi một trong hai dòng của nhóm (thành hai dự án, hay xoá dự án) thì phát biểu cũ không bị rút. Điều này trái với chú thích «khoá thật có hai dòng lệch dự án thì bỏ». Nhóm đăng ký hai lần là hiện tượng đã gặp trên dữ liệu S03.

- **Phép kiểm AC-8 không chặn được node:https/node:http; đối chứng dương trong evals bị thay bằng axios**
  AC: AC-8
  file: `pipeline/scripts/du-an-tren-tin-s03.test.mjs:394`
  severity: medium
  source: bugs
  detail: evals.yaml E8 yêu cầu kiểm «không có fetch(, http, https…» và đối chứng dương «bản sao có thêm import 'node:https' → ca ghim «DAT-AC-8 import ngoài danh sách: node:https»». Nhưng trong kiemNguon, mọi import bắt đầu bằng 'node:' đều được cho qua, và danh sách cam chỉ có ["fetch(", "@anthropic-ai", "openai", "agent/"], không có http/https. Vì vậy thêm `import https from "node:https"` hay node:http/node:net sẽ không làm ca đỏ. Ca đối chứng dương chỉ còn đạt nhờ thêm `import x from "axios"` và ghim chữ «axios». Nói cách khác, khẳng định «không gọi mạng» của AC-8 không được kiểm như evals mô tả, và bằng chứng đối chứng không khớp mục evals.

- **Assertion âm-tính-một-mình (hình dạng 4): nhánh xanh DAT-AC-6 «lỗi giữa chừng không để lại dòng» không thể đỏ**
  AC: AC-6
  file: `pipeline/scripts/du-an-tren-tin-s03.test.mjs:299`
  severity: high
  source: measurement
  detail: Ca xanh dùng fxAc1 trên DB mới, chưa có lượt --ghi nào nên field_assertions không có dòng nào của hai luật. Lỗi tiêm (DAT_LOI_SAU_LO, script dòng 47) nổ ngay sau UPDATE rút và trước INSERT đầu tiên. Vì vậy UPDATE rút không chạm dòng nào và không có dòng nào được chèn. Thêm nữa, demFa (dòng 286) đếm count(*) mà UPDATE rút không đổi count. Nên `assert.equal(await demFa(c), n0, ...)` ở dòng 299 vẫn xanh cả khi bỏ BEGIN/ROLLBACK: ca này không có đối chứng dương. Bằng chứng: ca đỏ ở dòng 302–315 phải đổi sang fixture khác (fxAc4, ghi trước rồi làm rỗng sổ) và phép đo khác (đếm dòng sống qua dong()) mới bắt được đột biến. Tức là đột biến bị một assertion KHÁC bắt, assertion ở ca xanh không có năng lực phân biệt. Dòng 293 (chạy thử, count trước = sau) cũng rỗng như vậy: DB không có dòng nào để rút nhầm, và đếm count(*) thì không thấy UPDATE.

- **Assertion âm-tính-một-mình, đối chứng dương ghi sai (hình dạng 4): DAT-AC-8 «thêm import node:https bị bắt» nhưng node:https không bị bắt**
  AC: AC-8
  file: `pipeline/scripts/du-an-tren-tin-s03.test.mjs:410`
  severity: high
  source: measurement
  detail: kiemNguon (dòng 396) cho qua mọi import `node:*` nên `import https from "node:https"` KHÔNG vào `ngoai`. Danh sách `cam` (dòng 397) chỉ có fetch(, @anthropic-ai, openai, agent/, không có http/https. Đối chứng dương ở dòng 411–413 xanh chỉ nhờ dòng `import x from "axios"` chèn thêm, và nó ghim chính thông điệp «...: axios» mà test tự viết trong assert.throws. evals.yaml E8 hứa hai điều: «không có fetch(, http, https» và đối chứng dương ghim «DAT-AC-8 import ngoài danh sách: node:https». Cả hai không được đo. Một tệp import node:https hay node:http để gọi mạng sẽ qua DAT-AC-8 xanh, nghĩa là lời hứa «không gọi mạng» (AC-8) không có phép đo thật cho đường node:http(s).

- **Đo chỉ dẫn thay vì đầu ra (hình dạng 1): E6 hứa exit 0/1/2, stdout, stderr nhưng test chỉ gọi chay() và soi e.code**
  AC: AC-6
  file: `pipeline/scripts/du-an-tren-tin-s03.test.mjs:295`
  severity: medium
  source: measurement
  detail: evals.yaml E6 hứa: chạy không cờ → thoát 0 và stdout có «chạy thử»; DB thiếu → thoát 2 kèm stderr ghim /project_node_id/ và /field_assertions/; lỗi tiêm → thoát 1. Test không chạy tiến trình. Nó gọi chay() trực tiếp và kiểm `e.code === "THIEU_DB"` (dòng 295–296), kiểm log callback (dòng 294) và kiểm rejects (dòng 298). Phép ánh xạ code → mã thoát và đường ra stderr nằm ở main (script dòng 117–121, `process.exit(e.code === "THIEU_DB" || ... ? 2 : 1)`) và không ca nào chạm tới. Đổi mã thoát hay bỏ console.error thì test vẫn xanh. Phép đo dừng ở đại lượng trung gian (thuộc tính lỗi), chưa tới đầu ra mà tiêu chí hứa.

- **Assert chuỗi có mặt trong khi lời hứa là quan hệ (hình dạng 3): «còn lại» ở DAT-AC-7 chép lại đúng công thức của lib thay vì đối chiếu truy vấn độc lập**
  AC: AC-7
  file: `pipeline/scripts/du-an-tren-tin-s03.test.mjs:340`
  severity: low
  source: measurement
  detail: E7 hứa so từng dòng của bảng đếm, kể cả «còn lại», với truy vấn SQL độc lập. Dòng 340 `assert.equal(d.con_lai, d.tin_s03 - d.tin_co_du_an - d.mau_thuan)` lại lặp nguyên văn phép tính ở lib dòng 155, nên không thể đỏ dù các vế có sai. Tương tự ở DAT-AC-3 (dòng 203–205): bảng mâu thuẫn chỉ được kiểm cột offer_id và ung_vien. Cột nguồn (x[2], quan hệ luật:dự án mà E3 hứa «với ứng viên {P1,P2} và nguồn») không có assertion nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Lệnh ghi field_assertions không mang run_id/changed_by, lệch khuôn ghi phát biểu đã có**
  Người dùng thấy gì: Các dự án gắn lên tin vẫn đúng, nhưng sau này khó truy ra một dòng gắn dự án hay rút dự án thuộc lượt chạy nào.
  Căn cứ: Không làm sai dữ liệu hay lộ gì, chỉ làm việc truy vết khó hơn; thêm nhãn lượt chạy về sau rẻ và không ảnh hưởng dữ liệu đã ghi.
  file: `pipeline/scripts/du-an-tren-tin-s03.mjs`
  severity: low
  Đề xuất: known-limits

- **Phát biểu lớp observed từ chữ bài lấy observed_at = lúc chạy thay vì thời điểm đăng bài**
  Người dùng thấy gì: Thời điểm ghi nhận dự án của một bài tính theo lúc chạy lệnh chứ không theo lúc bài được đăng, nên mốc thời gian có thể lệch.
  Căn cứ: Dự án gắn vào tin vẫn đúng và người dùng không thấy khác biệt; chỉ ảnh hưởng phân tích theo trục thời gian sau này, sửa được ở lần chạy xét lại.
  file: `pipeline/scripts/du-an-tren-tin-s03.mjs`
  severity: low
  Đề xuất: known-limits

- **Fixture viết tay đúng khuôn bên đọc (hình dạng 2): nhãn bạc chỉ dựng theo khuôn {o:{project}} mà docDuLieu đọc, không round-trip từ các writer silver_labels thật**
  Người dùng thấy gì: Chưa kiểm được trường hợp bài có nhãn ảnh hay nhãn ý định mới hơn che mất tên dự án trong nhãn cũ, nên một số bài có thể không được gắn dự án.
  Căn cứ: Hậu quả chỉ là bỏ sót một số tin chứ không gắn sai; lệnh chạy thử đếm trước khi ghi thật nên người duyệt thấy tỉ lệ phủ và xử lý được.
  file: `pipeline/scripts/du-an-tren-tin-s03.test.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
