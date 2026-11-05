## Trong hợp đồng

- **Hàm kiểm không đòi lý do loại: dòng `loai` thiếu `ly_do` vẫn qua**
  AC: AC-9
  file: `pipeline/noi-du-an-s08.mjs:30`
  severity: medium
  source: conventions
  detail: `const loai = new Set((bang.loai ?? []).map((l) => l.project_id))` chỉ lấy mã dự án, không đọc `ly_do`. Spec ghi từ chối khi dự án trúng từ khoá lát mà «không nối cũng không có lý do loại», AC-9 ghi «có lý do loại». Đã chạy thử `loai: [{project_id: "2"}]` với dự án 2 trúng từ khoá: kết quả `loi: []` và ghi `chua_noi` với `ly_do: "loai-khoi-lat"`. Chỉ cần liệt kê mã là qua được kiểm `ung-vien-bi-sot`, và dòng trong DB mang một lý do hằng số không có căn cứ trong tệp. Fixture test và `nap.mjs` đều không có ca âm cho trường hợp này. Đây là thiếu validation ở ranh giới đầu vào tệp.

- **kiemBangNoi nhận dòng loai không có lý do, trái AC-9 và thiết kế**
  AC: AC-9
  file: `pipeline/noi-du-an-s08.mjs:31`
  severity: medium
  source: bugs
  detail: Dòng 31 chỉ lấy `project_id` của `bang.loai`, không đọc `ly_do`. Một dòng `{project_id}` không có lý do vẫn miễn được kiểm `ung-vien-bi-sot`. Đã chạy thử trên fixture: `loai:[{project_id:"2"}]` với dự án trúng từ khoá trả `loi: []` và ghi `chua_noi` / `loai-khoi-lat`. Thiết kế yêu cầu từ chối dự án trúng từ khoá «mà không nối cũng không có lý do loại», AC-9 yêu cầu «có lý do loại». Lý do trong tệp cũng không được lưu: DB chỉ nhận chuỗi chung `loai-khoi-lat`. Test và nap.mjs:168 chỉ đếm `loai.length`, nên không bắt được. Bảng nối hiện tại không dính lỗi: 1/1 dòng loai có lý do. Cần thêm mã lỗi khi `ly_do` rỗng và một ca đỏ.

- **Phép đo «chay lai khong doi» vẫn xanh khi lần chạy hai lỗi hoặc ghi đè trong cùng giây**
  AC: AC-4
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs:156`
  severity: medium
  source: bugs
  detail: Có hai lỗ, làm bằng chứng idempotent của AC-4/E4 yếu. (1) Dòng 156 bỏ qua kết quả `chay(TEP_BANG)`, không kiểm `status`. Lần chạy hai thoát lỗi thì bảng không đổi và phép đo vẫn `ok`. (2) Dòng 158 so `String(t1.m) === String(t2.m)`, mà `String(Date)` cắt mili giây (đã thử: hai mốc cách 700 ms cho cùng chuỗi). Băm `bam()` ở dòng 108 không gồm `updated_at`. Vì vậy nếu mệnh đề `WHERE ... IS DISTINCT FROM` hỏng và lần hai ghi đè cả bảng trong cùng giây, phép đo không phát hiện. Cần kiểm `status === 0` và so `max(updated_at)::text` để giữ đủ micro giây.

- **kiemTep nhận tệp được gitignore trong một kho git bất kỳ, không riêng kho này**
  AC: AC-2
  file: `pipeline/noi-du-an-s08.mjs:66`
  severity: low
  source: bugs
  detail: `git -C path.dirname(tep) check-ignore` chạy theo thư mục của chính tệp. Tệp bị bỏ qua trong kho khác cũng trả status 0 và qua được. Đã chạy thử: `kiemTep` trả `null` với tệp trong một kho git tạm ở scratchpad, có `.gitignore` riêng, nằm ngoài onehub-invest. Lệnh chạy tiếp và đọc tệp đó. Điều này trái docstring «phải nằm trong kho» và AC-2 («nằm ngoài kho» phải bị từ chối). E9 chỉ thử thư mục tạm không phải kho git, nên không bắt được. Cần so `git rev-parse --git-common-dir` của tệp với của kho chứa script.

- **E7 không kiểm nhánh nào của lệnh thật sự chạy tới, nên quét đầu ra có thể xanh rỗng**
  AC: AC-7
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs:75`
  severity: low
  source: conventions
  detail: Dòng 75–76 chỉ gom `stdout + stderr`, không kiểm `status` hay mã lỗi mong đợi của từng mẫu `lanh`, `bang-rong`, `project-id-la`, `ung-vien`. Nếu cả bốn dừng sớm ở cùng một lỗi (ví dụ `tep-khong-bi-bo-qua` hay lỗi kết nối), đầu ra không có tên hay mã dự án, nên `ok dau ra lenh khong co ten` và `ok dau ra lenh khong co ma` vẫn xanh. Evals lại ghi đã phủ «nhánh lành và nhánh lỗi». Hôm nay `.acceptance-runs` đã được gitignore nên đường tệp không tự vấp lỗi này; đây là lỗ của phép đo, không phải rò rỉ đã xảy ra. Cần kiểm `lanh` thoát 0 và mỗi mẫu lỗi in đúng mã của nó.

- **Hình 4 (âm tính một mình): quét đầu ra lệnh không chứng minh đã chạy tới nhánh lành và các nhánh lỗi**
  AC: AC-7
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs:75`
  severity: high
  source: measurement
  detail: Dòng 72-77 chạy bốn mẫu (lanh, bang-rong, project-id-la, ung-vien), chỉ giữ `r.stdout + r.stderr`, bỏ `r.status`. Dòng 79 và 82 chỉ khẳng định KHÔNG có tên, KHÔNG có mã. Không có assert nào rằng mẫu lanh in `thu: khong ghi` hay mẫu lỗi in `loi: bang-rong`, `loi: project-id-la`, `loi: ung-vien-bi-sot`, và không có đối chứng dương cho hai phép quét này. Nếu lệnh gãy sớm ở cả bốn mẫu (ví dụ cả bốn đều in `loi: tep-khong-bi-bo-qua` hoặc lỗi kết nối DB), hai dòng `ok dau ra lenh khong co ten` và `ok dau ra lenh khong co ma` vẫn xanh, trong khi E7 và AC-7 hứa đo cả nhánh lành lẫn nhánh lỗi. E9 trong nap.mjs có kiểm mã lỗi nhưng không quét tên trong đầu ra, nên không bù được.

- **Hình 4 (âm tính một mình): 'chay lai khong doi' bỏ qua kết quả của lần chạy thứ hai**
  AC: AC-4
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs:156`
  severity: high
  source: measurement
  detail: Dòng 156 gọi `chay(TEP_BANG)` và vứt kết quả; dòng 158 chỉ so băm bảng và `max(updated_at)` trước, sau. Lần chạy hai thoát lỗi (lỗi DB, lỗi tệp) thì bảng cũng không đổi và phép đo vẫn `ok`. Nhánh `ON CONFLICT ... WHERE ... IS DISTINCT FROM` ở pipeline/noi-du-an-s08.mjs:103-105 chỉ thật sự xử lý dòng trùng từ lần chạy thứ hai, nên đây là đường AC-4 cần đo. Không có assert `status === 0` hay `da ghi` cho lần này (lần một có, ở dòng 144).

- **Hình 4 (âm tính một mình): 'diff va ho so khong co ma s08' chỉ dò một khuôn chữ, không dùng tập mã thật, không đối chứng**
  AC: AC-7
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs:61`
  severity: high
  source: measurement
  detail: Dòng 61 chỉ là `!/"project_id":\s*"?\d/.test(...)`, tức chỉ bắt mã nằm sau đúng khoá JSON có ngoặc kép. Mã dự án xuất hiện dạng khác (bảng markdown, `project_id: 123`, CSV) đều lọt. Dòng 35 đã lấy `id` từ DB nhưng cột này không được dùng để quét. `project_code`, cột mà lệnh đọc làm `ma` (pipeline/noi-du-an-s08.mjs:86), hoàn toàn không được quét, dù AC-7 hứa diff và hồ sơ không chứa tên hay mã. Phần đối chứng ở dòng 63-64 chỉ cho quét tên, không có đối chứng dương cho quét mã. Đã đối chiếu tập 150 id và 150 project_code thật với diff, chỉ in vị trí: có trùng ở dãy 3 chữ số và mã 2 ký tự, nhiều khả năng là ngẫu nhiên; không kết luận có rò rỉ, lỗi là ở thước.

- **Hình 3 (có mặt thay vì quan hệ): 'moi du an s08 mot dong' là hằng đúng do khoá chính, 'tong bang' chỉ so số đếm**
  AC: AC-4
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs:151`
  severity: medium
  source: measurement
  detail: Dòng 150-151 so `count(*)` với `count(DISTINCT project_id)` trên s08_project_links, trong khi 074 khai `project_id text PRIMARY KEY`, nên phép so không thể đỏ. Dòng 153 chỉ so `soDong.n === soDuAn.n`. Lời hứa AC-4 «mỗi dự án S08 đúng một dòng» là quan hệ giữa hai tập project_id (stg_s08_inventory và bảng nối). Không dòng nào so tập: bảng có 150 mã sai vẫn xanh.

- **Hình 3 (có mặt thay vì quan hệ): cặp dự án - khu đã ghi xuống DB không được so với bảng nối, chỉ đếm theo nút**
  AC: AC-4
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs:147`
  severity: medium
  source: measurement
  detail: Dòng 145-148 chỉ đếm số dòng theo slug (3 và 5). Test đơn vị pipeline/noi-du-an-s08.test.mjs:32-33 cũng chỉ đếm `slug` và không kiểm `status` hay project_id nào vào slug nào. E10 đo quan hệ dự án - khu, nhưng dòng 166-176 chỉ gọi `kiemBangNoi` trên tệp trong bộ nhớ, không đọc lại `s08_project_links`. Nếu bước ghi (mảng song song ở pipeline/noi-du-an-s08.mjs:106) gán lệch cặp mà giữ nguyên số theo khu thì mọi phép đo vẫn xanh. Lời hứa của hợp đồng là mỗi dự án nối vào đúng khu đó, không chỉ đúng số lượng.

- **Hình 3 (có mặt thay vì quan hệ): 'tap ten s08 bang so du an' không so tập tên với số dự án, nhãn in sai sự thật**
  AC: AC-7
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs:40`
  severity: medium
  source: measurement
  detail: Nhãn hứa tập tên bằng số dự án, nhưng điều kiện là `tatCa.size > 0 && rows.length >= soDuAn`. `rows` là các cặp (id, ten) trước khi lọc nên tên null vẫn được đếm, còn `tatCa` chỉ cần khác rỗng. Đo chỉ đọc trên DB hiện tại: rows = 150, soDuAn = 150, tatCa = 143, vậy dòng in ra `ok tap ten s08 bang so du an 150` trong khi tập quét thực có 143 tên. Nếu đa số tên rỗng hoặc gộp về một, phép đo vẫn xanh và mọi phép quét tên phía sau gần như vô hiệu.

- **Hình 5 (điểm-case thay vì lớp): 'dau ra lenh khong co ma' chỉ quét mã của các dòng nối, không phải toàn bộ dự án**
  AC: AC-7
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs:80`
  severity: medium
  source: measurement
  detail: Dòng 80 dựng `maDuAn` từ `bang.noi`, tức 8 dự án của lát (nap.mjs:152 tính 'soDuAn.n - 8'), trong khi AC-7 hứa đầu ra không in `project_id` của S08 nói chung. Lệnh đọc đủ 150 dự án (pipeline/noi-du-an-s08.mjs:85) và dựng dòng cho cả chua_noi, nên lỗi in mã của một dự án chua_noi hoặc trong danh sách `loai` không bị bắt. Tập đủ mã đã có sẵn trong `rows` ở dòng 35 nhưng không được dùng.

- **Hình 5 (tuyên quét lớp): 'area_ids nut khac khong doi' chỉ duyệt nút project, bỏ sót nút building**
  AC: AC-6
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs:103`
  severity: low
  source: measurement
  detail: AC-6 hứa `area_ids` của nút khác không đổi. Dòng 103 duyệt `nutTruoc` lấy từ `nutProject()`, mà dòng 56 lọc `WHERE node_type = 'project'`. asset_nodes hiện có 20 project và 3 building (đo chỉ đọc), nên 3 nút building không vào phép so. Băm đủ asset_nodes ở dòng 41 chỉ áp cho DB oneinvest, không áp cho DB thử nơi 074 chạy.

- **Hình 4 (âm tính một mình): 'bang khong doi' và 'thu khong ghi' đo trên bảng rỗng**
  AC: AC-2
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs:122`
  severity: medium
  source: measurement
  detail: `truocSai` lấy ở dòng 122, khi s08_project_links vừa được tạo và dòng `thu-check` đã xoá (dòng 81, 88), lần ghi thật đầu tiên chỉ ở dòng 143. Vì vậy mọi `(await bam()) === truocSai` ở dòng 127, 133, 138, 140 chỉ chứng minh «không chèn dòng nào». AC-2 hứa «bảng không đổi dòng nào»: đường lỗi hay `--thu` có xoá hoặc sửa dòng sẵn có thì không thể lộ, vì không có dòng nào để mất. Các ca sai không được chạy lại trên bảng đã có dữ liệu sau bước 143.

- **Hình 4 (âm tính một mình): 'khong ma cong doc area_ids' coi lỗi git grep là sạch**
  AC: AC-6
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs:104`
  severity: low
  source: measurement
  detail: Dòng 104-105 chỉ lấy `stdout` của `git grep` và kiểm rỗng. `status` không được đọc, nên lỗi git (thoát 128) cũng cho stdout rỗng và `ok`. Không có đối chứng dương rằng lệnh grep này bắt được `area_ids` khi có, khác với cách làm cho sync ở kin.mjs:53.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Cột `ly_do` và enum `noi`/`chua_noi` trái luật đặt tên tiếng Anh**
  Người dùng thấy gì: Bảng nối dự án với khu đô thị đặt tên cột và giá trị bằng tiếng Việt, lệch quy ước đặt tên tiếng Anh của kho. Người dùng cuối không thấy gì; chỉ người làm tiếp sẽ thấy tên không đồng bộ.
  Căn cứ: Chỉ là lệch quy ước đặt tên, không làm mất hay sai dữ liệu; đổi tên sau khi bảng đã có dữ liệu thì tốn công hơn, nhưng chưa ảnh hưởng ai.
  file: `db/migrations/074_noi_du_an_s08.sql`
  severity: medium
  Đề xuất: known-limits

- **Probe ghi bảng nối thật vào thư mục không gitignore của kho công khai**
  Người dùng thấy gì: Nếu phép đo bị ngắt giữa chừng, một tệp tạm chứa mã dự án thật có thể nằm lại trong thư mục không được git bỏ qua và vô tình bị đưa lên kho công khai.
  Căn cứ: Chỉ xảy ra khi phép đo bị ngắt đúng lúc và người commit không để ý; lộ mã dự án trên kho công khai khó thu hồi, nhưng khả năng thấp và sửa rẻ.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs`
  severity: medium
  Đề xuất: known-limits

- **Test mới nằm ngoài glob của `npm test`, job CI pipeline không chạy nó**
  Người dùng thấy gì: Bộ test của phần nối dự án không chạy trong kiểm tra tự động khi gộp, nên một thay đổi sau này làm hỏng nó có thể không bị phát hiện ngay.
  Căn cứ: Không ảnh hưởng người dùng hôm nay và test vẫn xanh khi chạy tay; lỗ này có sẵn ở các test khác nên sửa chung một lần sẽ rẻ hơn.
  file: `pipeline/package.json`
  severity: low
  Đề xuất: known-limits

- **Tệp sai hình dạng bị báo nhầm thành lỗi DB thay vì mã lỗi tệp**
  Người dùng thấy gì: Khi tệp bảng nối sai cấu trúc, lệnh vẫn dừng an toàn nhưng báo như lỗi cơ sở dữ liệu, khiến người vận hành đi tìm sai chỗ.
  Căn cứ: Không mất hay lộ dữ liệu, bảng không bị đổi; chỉ tốn thời gian chẩn đoán và người vận hành tự sửa được tệp rồi chạy lại.
  file: `pipeline/noi-du-an-s08.mjs`
  severity: low
  Đề xuất: known-limits

- **Catch ghi mọi ngoại lệ thành `loi: db ?`, kể cả lỗi hình dạng tệp bảng nối**
  Người dùng thấy gì: Tệp bảng nối sai cấu trúc bị báo là lỗi cơ sở dữ liệu, làm người vận hành khó biết lỗi nằm ở tệp của mình.
  Căn cứ: Chỉ gây nhầm lẫn khi chẩn đoán, không mất hay lộ dữ liệu; sửa tệp rồi chạy lại là xong.
  file: `pipeline/noi-du-an-s08.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 5 (tuyên quét lớp, không ma trận viết trước): miễn trừ tên tính lúc chạy, không khai trước, không ghim số**
  Người dùng thấy gì: Phép kiểm không để lộ tên dự án có một số tên được bỏ qua theo quy tắc tự tính, nên danh sách bỏ qua có thể phình ra mà không ai hay.
  Căn cứ: Hôm nay chỉ bỏ qua 7 tên trong 143 và không có rò rỉ nào được tìm thấy; rủi ro là phép kiểm lỏng dần theo thời gian, sửa lúc nào cũng rẻ.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình 5 (điểm-case thay vì lớp): luật quét tên khai bốn quy tắc, đối chứng chỉ phủ casefold**
  Người dùng thấy gì: Phép kiểm không để lộ tên dự án chỉ thử lại được cách viết hoa viết thường, chưa thử bỏ dấu hay bỏ hậu tố, nên có thể bỏ lọt một cách viết khác của tên.
  Căn cứ: Hôm nay chưa thấy rò rỉ và đây chỉ là độ chặt của phép kiểm; thêm ca đối chứng sau này rẻ và người dùng không thấy ảnh hưởng.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 4 (âm tính một mình): bí danh đã bỏ và tên nút chỉ kiểm vắng mặt sau 074, không đối chứng có mặt trước 074**
  Người dùng thấy gì: Phép kiểm việc dọn bí danh dự án chỉ thấy bí danh đã biến mất, chưa chứng minh năm bí danh kia từng tồn tại trước khi dọn.
  Căn cứ: Trên dữ liệu hiện tại kết quả đúng, nên không có hại thực; chỉ là phép kiểm có thể xanh nhầm nếu dữ liệu đổi, sửa rẻ.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 6 (đo checkout của tác giả): 'tep bang noi bi git bo qua' đọc .gitignore của checkout chính, không phải cây đang kiểm**
  Người dùng thấy gì: Phép kiểm xem tệp bảng nối có được git bỏ qua đang đọc luật của thư mục chính chứ không phải nhánh đang chấm, nên nhánh gỡ luật bỏ qua có thể không bị phát hiện.
  Căn cứ: Chỉ xảy ra khi có ai gỡ luật bỏ qua trong nhánh, hiếm gặp, và các bước kiểm khi gộp sẽ thấy; sửa rẻ.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 1 (đo chỉ dẫn thay vì đầu ra): 'mappings chi local' dò chuỗi trong mô tả tự do mà không code nào đọc**
  Người dùng thấy gì: Tệp khai báo nguồn dự án có ghi chú «chỉ local» nhưng phép kiểm chỉ dò chữ, không phải một cấu hình mà hệ thống thực sự đọc; chặn đồng bộ thật nằm ở chỗ khác.
  Căn cứ: Dữ liệu dự án thực tế không bị đưa lên cloud vì đã có phép đo riêng cho việc đó; chỉ là câu chữ khai báo có thể không khớp, sửa lúc nào cũng rẻ.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
