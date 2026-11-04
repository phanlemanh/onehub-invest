# Review findings: chu-nguon-tren-cong (round 3)

## Trong hợp đồng

- **Ngoại lệ link trang gốc không neo cuối khuôn, nên đường khác trên miền S01 vẫn được miễn và thước báo sạch**
  file: `scripts/quet-ten-nguon-html.mjs:73` · severity: low · source: bugs · AC: AC-1
  detail: Regex `https://www\.<tên>\.com/rooms/\d+` không có ranh giới sau `\d+`. Hit tên nguồn nằm trong đoạn khớp nên được tính vào `linkGoc`, không đỏ. Đã chạy `quetHtml(page('<a href="https://www.<S01>.com/rooms/1/evil">x</a>'), SEEDS, { coLinkGoc: true })` và nhận `html:{}`, `linkGoc:{S01:1}`. Như vậy `/rooms/1/evil`, `/rooms/1/reviews` và `/rooms/123abc` đều lọt trên trang listing. Điều này trái comment dòng 68 («chỉ đúng khuôn … không mở rộng») và trái contract («đường khác trên miền» phải đỏ). Đột biến «đường khác» trong test chỉ dùng `/users/1` nên không lộ lỗi. Trên trang thật hiện chưa có link dạng này: lần quét :3460 thoát 0 và link đúng khuôn. Cách sửa: thêm ranh giới sau số, ví dụ `(?![\w/-])`, và thêm một ca đột biến `/rooms/1/x`.

- **Hình dạng 3 (quan hệ không được đo): lời hứa mới «trang listing mẫu là listing có tiêu đề mang tên» không có assert nào**
  file: `_acceptance/chu-nguon-tren-cong/evals.yaml:21` · severity: medium · source: measurement · AC: AC-2
  detail: Vòng này E2 thêm vế 'trang listing mẫu là listing có tiêu đề mang tên' (AC-2: 'ưu tiên listing có tiêu đề mang tên'). Đây là quan hệ giữa `layMauListing` và danh sách từ DB, nhưng không ca nào đo. Máy chủ giả trong test trả cùng một thân cho mọi URL và không ghi URL đã gọi (scripts/quet-ten-nguon-html.test.mjs:142,145,152). Đột biến xoá `if (listings[0]) return listings[0].id;` trên bản chép: vẫn pass 40/fail 0. Báo cáo sống cũng in `/listing/:mau` chứ không in mã thật (quet-ten-nguon-html.mjs:205), nên E2 chỉ suy gián tiếp qua dòng 'tiêu đề tin', mà expected lại ghi dòng đó là 'có thể in'.

- **Hình dạng 3 (assert không buộc quan hệ): `>= 2` không đo được «thẻ và alt» (đã có ở r2, vẫn còn ở HEAD)**
  file: `app/tests/chu-nguon-tren-cong.test.tsx:81` · severity: medium · source: measurement · AC: AC-2
  detail: `assert.ok(r.tieuDeTin.S01 >= 2, 'thẻ và alt phải đếm riêng')` tính cả lần xuất hiện trong dữ liệu nhúng. Đo trên ListingCard thật: đủ là `{S01: 3}`; xoá alt còn `{S01: 2}` và assert vẫn đạt. Lời hứa về hai chỗ cụ thể chỉ được đo bằng một ngưỡng đếm tổng.

- **Hình dạng 3 (chuỗi có mặt, lời hứa là quan hệ): «số mô hình giữ nhãn» chỉ grep nhãn trong tệp (đã có ở r2, vẫn còn ở HEAD)**
  file: `app/tests/chu-nguon-tren-cong.test.tsx:33` · severity: medium · source: measurement · AC: AC-4
  detail: Dòng 33-35 và 42 chỉ `assert.match` chuỗi `label: "Mô phỏng"…`, `<Badge …>MÔ PHỎNG</Badge>`, `badge: "Mô phỏng"` ở bất kỳ đâu trong tệp nguồn. AC-4 hứa nhãn gắn với đúng bốn chỗ: bảng Lợi suất, đầu trang /yield, ô Yield ròng dài hạn, nhóm Lợi suất của So sánh. Chuyển nhãn sang ô hay bảng khác trong cùng tệp thì ca vẫn xanh. PHAI_CO ở bản quét cũng chỉ kiểm 'MÔ PHỎNG' có trên toàn trang.

- **Hình dạng 4 (âm tính một mình): kiểm snapshotId trên lát cắt có thể rỗng (đã có ở r2, vẫn còn ở HEAD)**
  file: `app/tests/chu-nguon-tren-cong.test.tsx:52` · severity: medium · source: measurement · AC: AC-4
  detail: `q.slice(q.indexOf('export type SupplyPoint'), …+200)` khi đổi tên kiểu thành `slice(-1, 199)`, tức chuỗi rỗng, nên `doesNotMatch(kieu, /snapshotId/)` xanh rỗng. Dòng 54 cắt giữa `getSupplyHistory` và `BreakdownRow` cũng rỗng khi hai mốc đổi tên hoặc đảo thứ tự. Không có assert lát cắt khác rỗng, không có đối chứng dương, không có thông điệp ghim. Cửa sổ 200 ký tự cũng không phủ chắc toàn bộ kiểu.

- **Hình dạng 5 (số assert khác số phần tử): TRANG có 12 trang, chỉ ghim 9 (đã có ở r2, vẫn còn ở HEAD)**
  file: `scripts/quet-ten-nguon-html.test.mjs:113` · severity: medium · source: measurement · AC: AC-2
  detail: Contract chốt đúng mười hai trang, nhưng ca chỉ ghim `length === 12` cộng 9 phần tử; thiếu `/vn/hanoi/map`, `/yield?area=vn-hanoi`, `/compare?areas=…`. Đột biến thay `/compare?areas=vn-hanoi,vn-hcmc` bằng một trang khác trên bản chép: vẫn pass 40/fail 0. Thước có thể bỏ sót trang So sánh mà E1 không đỏ.

- **Hình dạng 5 (tuyên lớp, chỉ có điểm-case): phạm vi trang của hai ngoại lệ không được đo (đã có ở r2, vẫn còn ở HEAD)**
  file: `scripts/quet-ten-nguon-html.test.mjs:58` · severity: medium · source: measurement · AC: AC-2
  detail: AC-2 và E1 hứa miễn tiêu đề chỉ ở ô thuê ngắn hạn và trang listing, miễn link gốc chỉ 'trên trang khai'. Test chỉ truyền tay `tieuDe` hoặc `coLinkGoc` vào `quetHtml`, không ca nào qua `quetTrang` đặt tên hay link trên trang ngoài danh sách. Hai đột biến trên bản chép đều vẫn pass 40/fail 0: thay `CO_TIEU_DE_TIN.has(p) ? tieuDeDb : []` bằng `tieuDeDb`, và đặt `coLinkGoc: true` cho mọi trang.

- **Hình dạng 5 (tuyên lớp, chỉ có điểm-case): PHAI_CO chỉ có một ô đỏ được ghim, fixture sinh từ chính PHAI_CO (đã có ở r2, vẫn còn ở HEAD)**
  file: `scripts/quet-ten-nguon-html.test.mjs:23` · severity: medium · source: measurement · AC: AC-4
  detail: `CHU_DU` rút từ `PHAI_CO`, nên rút bớt hằng thì fixture sạch tự co theo. Chiều đỏ chỉ ghim một ô: `THIẾU-CHỮ /methodology: nền tảng thuê ngắn hạn` (dòng 139). Đột biến làm rỗng mục `/vn/hanoi` và `/yield?area=vn-hanoi` của PHAI_CO: vẫn pass 40/fail 0, dù AC-4 hứa hai trang này có «chưa phải giá giao dịch», «MÔ PHỎNG».

- **Hình dạng 5 (tuyên lớp, chỉ có điểm-case): AC-7 hứa «hàm hay bảng số S02», fixture chỉ đo một trong ba nhánh (đã có ở r2, vẫn còn ở HEAD)**
  file: `scripts/quet-ten-nguon-html.test.mjs:304` · severity: low · source: measurement · AC: AC-7
  detail: Regex `docS02` có ba nhánh: `get<S02>…`, `getCalibration…`, `<s02>_…`. Fixture chỉ gọi `get<S02>Comparison`, không có ca bảng. Đột biến xoá hai nhánh còn lại trên bản chép: vẫn pass 40/fail 0. Vế 'bảng' của AC-7 không có chiều đỏ.

- **Hình dạng 6 (đo cây khác cây đang kiểm), dạng cổng cứng: E2 đo bất kỳ máy chủ nào ở :3460 (đã có ở r2, vẫn còn ở HEAD)**
  file: `_acceptance/config.yaml:194` · severity: medium · source: measurement · AC: AC-2
  detail: `cn_song` trỏ `http://localhost:3460`. Evals E2 chỉ ghi bằng lời 'Cần dev server từ cây này', còn `quetTrang` không đối chiếu gì giữa máy chủ và cây đang kiểm (commit, build id, cwd). E6-network.txt cũng ghi :3460 là 'server sẵn có' không do phép đo khởi động. Máy chủ từ worktree khác ở cổng này vẫn cho E2 thoát 0, và kết quả được ghi cho cây đang kiểm.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thước CN-AC-7 xanh giả khi trang công khai gọi hàm đọc bảng S02 có tên không chứa tên nguồn**
  Người dùng thấy gì: Nếu sau này có người cho một trang công khai gọi hàm đọc số liệu nguồn S02 mà tên hàm không chứa tên nguồn, bộ kiểm tự động sẽ không báo, và số S02 có thể lên cổng mà không ai hay.
  Căn cứ: Hôm nay chưa trang công khai nào làm vậy nên người dùng chưa thấy gì; rủi ro chỉ đến khi có thay đổi sau, và vá thước sau khi ra mắt vẫn rẻ.
  file: `scripts/check-invest-tier-a.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 (đo môi trường của tác giả): cn_quet ghi «không DB» nhưng các ca lệnh thật đọc DB localhost:5433**
  Người dùng thấy gì: Bộ kiểm tự động của phép quét có thể chạy theo hai nhánh khác nhau tùy máy có cơ sở dữ liệu hay không, nên kết quả xanh trên máy này chưa chắc nói được điều giống hệt trên máy khác.
  Căn cứ: Không ảnh hưởng gì tới người dùng cổng; chỉ làm người kiểm hiểu sai phép đo, và có thể ghi chú lại mà không đụng tới sản phẩm.
  file: `scripts/quet-ten-nguon-html.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): ca «round-trip» tự dựng khung dữ liệu nhúng hai lớp JSON**
  Người dùng thấy gì: Nếu Next đổi cách đóng gói dữ liệu nhúng trong trang, bộ kiểm có thể vẫn xanh trong khi phép quét thật đọc sai tiêu đề được miễn.
  Căn cứ: Chỉ xảy ra khi nâng phiên bản khung web, không tự gây lỗi trên cổng, và phép quét trên trang thật sẽ lộ ra lúc đó.
  file: `app/tests/chu-nguon-tren-cong.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (không ghim thông điệp): ca «không tới được» nuốt log trong khi E1 nói có ghim KHONG-DO (đã có ở r2, vẫn còn ở HEAD)**
  Người dùng thấy gì: Khi phép quét gặp lỗi lập trình thay vì trang không tới được, nó vẫn báo giống nhau là không đo được, nên người kiểm có thể mất công đoán nguyên nhân.
  Căn cứ: Cả hai trường hợp đều không bị tính là sạch nên không lọt tên nguồn ra cổng; chỉ khó chẩn đoán hơn, nhẹ và sửa rẻ sau.
  file: `scripts/quet-ten-nguon-html.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo nguồn thay vì đầu ra): câu giá rao của /compare và / chỉ được đo bằng grep tệp nguồn (đã có ở r2, vẫn còn ở HEAD)**
  Người dùng thấy gì: Câu nói giá là giá rao, chưa phải giá giao dịch trên trang So sánh và trang chủ chưa được kiểm trên trang đã hiển thị, nên có thể thiếu trên màn hình thật mà bộ kiểm vẫn xanh.
  Căn cứ: Câu nằm sẵn trong mã nguồn nên khả năng thiếu thấp; nếu thiếu thì người dùng chỉ thấy một dòng chú thích mờ hơn, không sai số liệu, và thêm phép kiểm sau rẻ.
  file: `app/tests/chu-nguon-tren-cong.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Bằng chứng E6 đưa thêm tên thật của S01 vào kho công khai (r2 · tệp đã đổi)**
  Người dùng thấy gì: Tên thật của một nguồn dữ liệu nằm trong hồ sơ nghiệm thu đã công khai trên kho mã, ai vào kho cũng đọc được. Người dùng cổng không thấy, nhưng đây là tên nguồn mà luật nội bộ cấm rời máy.
  Căn cứ: Hậu quả vừa: tên lộ ra ở nơi công khai và không rút lại được hoàn toàn khỏi lịch sử, nhưng chỉ là hồ sơ nội bộ, không phải trang người dùng; sửa rẻ nếu làm sớm, sau ra mắt sẽ khó dọn hơn.
  file: `_acceptance/chu-nguon-tren-cong/evidence/E6-assertions.json`
  severity: high
  Đề xuất: new-contract

- **Danh sách paths của E3 còn trỏ tệp thước đã bỏ, thiếu sổ tên thước đang dùng (r2 · tệp đã đổi)**
  Người dùng thấy gì: Khi sau này sửa bộ nhận diện tên nguồn, hồ sơ nghiệm thu của một phép kiểm có thể không tự báo là cũ. Người dùng cổng không bị ảnh hưởng.
  Căn cứ: Nhẹ: chỉ làm quy trình nghiệm thu nhạy kém ở các lần sửa sau, người dùng không thấy gì, và có thể chỉnh bất cứ lúc nào.
  file: `_acceptance/chu-nguon-tren-cong/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **E6 khai route không nằm trong ma trận trang mà nó đo (r2 · tệp đã đổi)**
  Người dùng thấy gì: Hồ sơ kiểm giao diện ghi sai trang được đo, nhưng ảnh bằng chứng vẫn chụp đúng bốn trang cần xem. Người dùng cổng không bị ảnh hưởng.
  Căn cứ: Rất nhẹ: chỉ là nhãn khai sai trong hồ sơ, bằng chứng thật không đổi và sửa tức thì khi cần.
  file: `_acceptance/chu-nguon-tren-cong/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **laPhepSo coi ??=, ||=, &&= là phép so nên chuỗi gán mang tên nguồn lọt thước tĩnh (r2)**
  Người dùng thấy gì: Nếu sau này lập trình viên gán chữ có tên nguồn bằng một dạng viết tắt hiếm, bộ kiểm mã nguồn sẽ không báo. Hiện trên cổng chưa có chỗ nào như vậy.
  Căn cứ: Nhẹ: chỉ là kẽ hở của rào kiểm cho dạng viết hiếm, chưa có chữ nào lọt, và vá sau rẻ.
  file: `scripts/check-invest-tier-a.mjs`
  severity: low
  Đề xuất: known-limits

- **paths của E3, E3b, E7b, E2 không phủ bộ khớp tên nên stale guard không hoá cũ khi bộ khớp đổi; E3 còn trỏ tệp thước không còn dùng (r2 · tệp đã đổi)**
  Người dùng thấy gì: Sửa bộ nhận diện tên nguồn sau này có thể không làm một số phép kiểm cũ bị đánh dấu cần chạy lại. Người dùng cổng không bị ảnh hưởng.
  Căn cứ: Nhẹ: chỉ ảnh hưởng độ nhạy của quy trình nghiệm thu về sau, không có gì lộ ra người dùng, chỉnh rẻ.
  file: `_acceptance/chu-nguon-tren-cong/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên lớp, chỉ có điểm-case): ngoại lệ tiêu đề và link gốc không có phép đo nào về việc trang nào được miễn (r2 · tệp đã đổi)**
  Người dùng thấy gì: Nếu có người sửa nhầm để mọi trang đều được miễn tên, bộ test hiện tại sẽ không báo ngay. Hiện hành vi trên cổng vẫn đúng.
  Căn cứ: Vừa: rủi ro chỉ xảy ra khi sửa sai về sau, chưa có chữ lộ nào hiện tại, và lần quét sau triển khai trên bản thật còn là lưới đỡ.
  file: `scripts/quet-ten-nguon-html.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt, lời hứa là quan hệ): 'số mô hình giữ nhãn' chỉ grep nhãn trong tệp, không buộc nhãn với ô hay bảng (r2 · tệp đã đổi)**
  Người dùng thấy gì: Nhãn «Mô phỏng» có thể bị chuyển nhầm sang ô khác mà bộ test không phát hiện. Hiện các nhãn đang đặt đúng chỗ.
  Căn cứ: Vừa: nếu nhãn lệch người dùng có thể hiểu nhầm số mô hình là số thật, nhưng hiện chưa lệch và ảnh bằng chứng đã xem hai trong bốn chỗ.
  file: `app/tests/chu-nguon-tren-cong.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): ca SupplyPoint không có đối chứng dương, xanh rỗng khi đổi tên (r2 · tệp đã đổi)**
  Người dùng thấy gì: Bộ test có thể xanh dù mã snapshot lại bị đưa ra trình duyệt nếu đổi tên kiểu dữ liệu. Hiện chưa có mã nào bị đưa ra.
  Căn cứ: Nhẹ: mã snapshot không phải tên nguồn thật, hiện đang đúng, chỉ là test yếu cho lần sửa sau.
  file: `app/tests/chu-nguon-tren-cong.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (số assert khác số phần tử): TRANG có 12 trang nhưng chỉ ghim 9 (r2 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ai đó thay ba trang trong danh sách quét bằng trang khác, bộ test sẽ không báo, và ba trang đó có thể bị bỏ sót khi kiểm.
  Căn cứ: Vừa: bỏ sót trang chỉ xảy ra khi sửa nhầm về sau, hiện danh sách đúng và sửa test rẻ.
  file: `scripts/quet-ten-nguon-html.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên lớp, chỉ có điểm-case): CN-AC-7 hứa 'bảng, hàm số S02' nhưng fixture chỉ có một trong ba nhánh (r2 · tệp đã đổi)**
  Người dùng thấy gì: Rào chặn đọc số của nguồn S02 trên cổng có thể mất tác dụng với hai dạng gọi mà không ai biết. Hiện cổng không gọi S02.
  Căn cứ: Vừa: số S02 không được lên cổng nên nếu rào hỏng thì hậu quả đáng kể, nhưng hiện chưa có vi phạm và vá test rẻ.
  file: `scripts/quet-ten-nguon-html.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): ngoại lệ link gốc ở thước tĩnh không có chiều đỏ (r2 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ngoại lệ cho đường link trang gốc bị nới quá rộng, bộ kiểm mã nguồn có thể cho tên nguồn lọt ở các tệp khác mà test không báo.
  Căn cứ: Vừa: chỉ xảy ra khi sửa sai về sau, hiện chưa lọt gì, và thước quét HTML thật vẫn bắt ở lớp kế.
  file: `scripts/quet-ten-nguon-html.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên lớp, chỉ có điểm-case): chữ bắt buộc PHAI_CO có 10 mục nhưng chỉ ghim 1 khi thiếu chữ, fixture lại sinh từ chính hằng của bên đọc (r2 · tệp đã đổi)**
  Người dùng thấy gì: Nếu danh sách chữ bắt buộc bị xoá bớt, bộ test vẫn xanh và hai trang Tổng quan Hà Nội, Lợi suất có thể không còn được kiểm câu «chưa phải giá giao dịch».
  Căn cứ: Vừa: câu giá rao hiện vẫn đang hiện đúng, rủi ro chỉ đến khi sửa nhầm về sau; thêm ca test độc lập là rẻ.
  file: `scripts/quet-ten-nguon-html.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo đầu vào thay vì đầu ra): câu giá rao của /compare chỉ được đo bằng grep tệp nguồn (r2 · tệp đã đổi)**
  Người dùng thấy gì: Chưa có phép đo xác nhận người dùng thực sự thấy câu «giá rao, chưa phải giá giao dịch» trên trang So sánh và trang chủ, dù câu có trong mã.
  Căn cứ: Vừa: nếu câu không hiện thì người dùng có thể hiểu giá rao là giá giao dịch, nhưng mã đã có câu và người xem ra mắt kiểm tay được.
  file: `app/tests/chu-nguon-tren-cong.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đo cây khác cây đang kiểm), dạng cổng cứng: E2 đo bất kỳ máy chủ nào ở cổng, không xác minh máy chủ chạy từ cây này (r2 · tệp đã đổi)**
  Người dùng thấy gì: Phép quét tên nguồn có thể đo nhầm một bản chạy khác thay vì bản đang nghiệm thu mà vẫn báo sạch. Lần quét trên bản thật sau triển khai vẫn bù lại.
  Căn cứ: Vừa: nếu đo nhầm cây thì kết luận «sạch» có thể sai, nhưng lần quét bản sản xuất sau triển khai là điều kiện đóng việc nên vẫn bắt được.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên lớp, chỉ có điểm-case): closure tuyên đi theo export…from và import(), nhưng fixture chỉ có import tĩnh (r2 · tệp đã đổi)**
  Người dùng thấy gì: Bộ kiểm mã nguồn có thể bỏ sót một số tệp được nạp theo kiểu hiếm mà test không báo. Hiện chưa thấy tệp nào bị bỏ sót.
  Căn cứ: Nhẹ: chỉ là kẽ hở kiểm cho kiểu nạp hiếm, chưa có chữ nào lọt, và bổ sung ca test sau rẻ.
  file: `scripts/quet-ten-nguon-html.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert không buộc đúng quan hệ): '>= 2' không đo được 'thẻ và alt', vì số đếm gồm cả dữ liệu nhúng (r2 · tệp đã đổi)**
  Người dùng thấy gì: Bộ test không phân biệt được thẻ tin có hiện tiêu đề hay thiếu chữ mô tả ảnh, nên có thể bỏ sót một thay đổi nhỏ ở thẻ.
  Căn cứ: Nhẹ: tiêu đề chủ nhà gõ vốn đã được miễn và chỉ một tin trong 838 có tên, nên rủi ro nhỏ và sửa test rẻ.
  file: `app/tests/chu-nguon-tren-cong.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (không ghim thông điệp): ca 'không tới được' nuốt log, trong khi E1 nói có ghim KHONG-DO (r2 · tệp đã đổi)**
  Người dùng thấy gì: Khi không kết nối được tới trang, thước vẫn báo lỗi đúng nhưng nội dung thông báo không được kiểm, nên có thể khó đọc hơn mong đợi.
  Căn cứ: Rất nhẹ: chỉ liên quan thông báo lỗi cho người vận hành, không ảnh hưởng người dùng cổng và sửa rẻ.
  file: `scripts/quet-ten-nguon-html.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Mã AC trong tên ca test lệch contract (r1 · tệp đã đổi)**
  Người dùng thấy gì: Người đọc hồ sơ nghiệm thu có thể lần theo nhầm tiêu chí khi tra bằng chứng. Người dùng cổng Invest không thấy ảnh hưởng nào.
  Căn cứ: Chỉ là nhãn ghi chép sai số, không đụng chữ hiện hay dữ liệu của người dùng, và sửa lúc nào cũng được vì không ảnh hưởng ngày ra mắt.
  file: `scripts/quet-ten-nguon-html.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Comment của executor trong config.yaml không còn khớp hồ sơ (r1 · tệp đã đổi)**
  Người dùng thấy gì: Chú thích trong sổ lệnh kiểm mô tả sai phạm vi một số phép đo, nên người vận hành có thể hiểu nhầm phép đo làm gì. Người dùng cổng không bị ảnh hưởng.
  Căn cứ: Chỉ là chú thích cũ, không làm sai kết quả đo hay chữ hiện trên cổng, và sửa sau rất rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Không đọc được source_registry thì bỏ sót S08 mà vẫn thoát 0 và in «sạch», catch nuốt mất lý do (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu chạy phép quét ở máy không có cơ sở dữ liệu, nó có thể báo sạch trong khi chưa kiểm tên của một nguồn. Người dùng có thể tưởng cổng đã được kiểm đủ.
  Căn cứ: Chỉ xảy ra khi chạy ở máy thiếu dữ liệu nguồn, đã có dòng log nói sổ tên hẹp hơn, và người vận hành tự tránh được bằng cách chạy ở máy thu; sửa sau không mất dữ liệu.
  file: `scripts/quet-ten-nguon-html.mjs`
  severity: medium
  Đề xuất: known-limits

- **Đổi nhãn nút làm hỏng smoke `listing_detail_smoke`, tệp smoke không được cập nhật (r1)**
  Người dùng thấy gì: Phép kiểm nhanh trang chi tiết tin sẽ báo đỏ giả khi chạy lại vì nút đã đổi chữ thành «Mở trang gốc». Người dùng cổng không thấy lỗi gì, nhưng đội vận hành mất tín hiệu từ phép kiểm này.
  Căn cứ: Nút trên cổng hoạt động đúng, chỉ có phép kiểm cũ không theo kịp nhãn mới, và sửa là việc nhỏ ở hồ sơ khác nên không đáng chặn ngày ra mắt.
  file: `scripts/smoke-listing-detail.mjs`
  severity: medium
  Đề xuất: new-contract

- **`--trang` tách theo dấu phẩy nên không đo được trang /compare trong chính danh sách TRANG (r1 · tệp đã đổi)**
  Người dùng thấy gì: Không thể dùng tuỳ chọn đo riêng trang So sánh với hai khu vực; công cụ báo lỗi chứ không báo sạch. Người dùng cổng không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng người vận hành khi muốn đo lẻ một trang, lỗi hiện rõ nên không gây hiểu nhầm, và đo đủ mười hai trang vẫn làm được.
  file: `scripts/quet-ten-nguon-html.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 — Âm tính một mình: «SQL không đỏ» đo trên tệp thước không đi tới (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm tự động về việc bỏ qua chữ trong câu lệnh dữ liệu có thể xanh dù không thực sự đo. Người dùng cổng không thấy ảnh hưởng ngay.
  Căn cứ: Chữ hiện của cổng không sai vì lỗi này; chỉ là một bài kiểm yếu hơn vẻ ngoài, có thể siết sau mà không mất gì.
  file: `scripts/quet-ten-nguon-html.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Âm tính một mình: kiểm snapshotId trên lát cắt có thể rỗng, không neo, không ghim thông điệp (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm đảm bảo mã phiên thu không lộ ra trình duyệt có thể không còn bắt được lỗi nếu cấu trúc mã đổi. Hiện người dùng chưa thấy ảnh hưởng.
  Căn cứ: Hiện tại dữ liệu không lộ mã này, rủi ro chỉ nằm ở lần sửa sau, và cải thiện bài kiểm là việc rẻ, làm lúc nào cũng được.
  file: `app/tests/chu-nguon-tren-cong.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — Assert chuỗi có mặt trong khi lời hứa là quan hệ giữa nhãn MÔ PHỎNG và số mô hình (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu sau này ai đó chuyển nhãn «Mô phỏng» sang nhầm ô, bài kiểm tự động sẽ không báo, và người dùng có thể thấy số mô hình không có nhãn. Hiện tại nhãn vẫn ở đúng chỗ.
  Căn cứ: Nhãn đang đúng nên người dùng chưa bị nhầm, và lỗi nếu có sẽ do sửa đổi sau này, tự nhìn thấy được trên trang và sửa nhanh.
  file: `app/tests/chu-nguon-tren-cong.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên quét lớp nhưng chỉ có điểm-case: danh sách 12 trang chỉ ghim 9 phần tử (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm không phát hiện nếu ai đó bỏ nhầm ba trang khỏi phép quét tên nguồn, khiến các trang đó không được kiểm. Hiện danh sách vẫn đủ.
  Căn cứ: Danh sách đang đủ mười hai trang, rủi ro chỉ ở thay đổi sau này, và thêm ghim cho bài kiểm là việc rẻ.
  file: `scripts/quet-ten-nguon-html.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên quét lớp nhưng chỉ có điểm-case: PHAI_CO có 10 ô, chỉ một ô được ghim, fixture lại rút từ chính PHAI_CO (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu danh sách chữ bắt buộc như «chưa phải giá giao dịch» bị rút bớt, phép kiểm vẫn xanh và trang có thể thiếu câu cảnh báo giá. Hiện các câu này vẫn có trên trang.
  Căn cứ: Câu cảnh báo hiện còn đủ trên cổng, rủi ro chỉ nằm ở lần sửa sau, và siết bài kiểm sau ra mắt không mất gì.
  file: `scripts/quet-ten-nguon-html.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên quét lớp nhưng chỉ có điểm-case: «trang khai» của hai ngoại lệ chỉ đo qua tham số, không ghim tập trang (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ngoại lệ cho phép tên nguồn bị nới nhầm ra nhiều trang, phép kiểm tự động sẽ không đỏ và tên có thể lọt lên cổng. Hiện ngoại lệ vẫn giới hạn đúng trang.
  Căn cứ: Ngoại lệ đang hẹp đúng, nên hiện chưa lộ tên; phép đo sau triển khai vẫn bắt được, và siết bài kiểm là việc nhỏ.
  file: `scripts/quet-ten-nguon-html.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên quét lớp nhưng chỉ có điểm-case: «hàm hay bảng số S02» có ba nhánh, fixture chỉ đo một (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu sau này ai gọi thẳng bảng số S02 từ trang công khai, bài kiểm tự động có thể không đỏ và số S02 có thể lên cổng. Hiện chưa có trang nào làm vậy.
  Căn cứ: Chưa có trang nào gọi số S02 nên không có số nào lộ; rủi ro ở thay đổi sau này và bổ sung bài kiểm là việc rẻ.
  file: `scripts/quet-ten-nguon-html.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/15 lỗi rơi vào file không bộ đo nào phủ (_acceptance/chu-nguon-tren-cong/evals.yaml, _acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
