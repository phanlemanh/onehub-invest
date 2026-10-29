# Review findings: do-nen-hieu-nang (round 1)

## Trong hợp đồng

- **Bộ che tên nguồn (và đầu dò AC-5) lấy danh sách từ migration thay vì source_registry sống, nên bỏ sót tên S08**
  AC: AC-5
  file: `scripts/do-nen-hieu-nang/do.mjs:37`
  severity: medium
  source: conventions
  detail: `TEN_NGUON = sourceRegistrySeeds(ROOT)` đọc các câu `INSERT INTO source_registry` trong `db/migrations`. Theo chú thích của `scripts/lib/tier-a-source-names.mjs`, helper này dành cho THƯỚC chạy ở CI không có DB. Bộ che lúc chạy theo mẫu có sẵn (`pipeline/push-ops-facts.mjs` dòng 129/204) đọc `SELECT code, real_name FROM source_registry` từ DB local; `.claude/rules/pii-spl.md` cũng ghi «đọc mã từ source_registry». do.mjs đã có kết nối DB nhưng vẫn dùng seed migration. Tôi đã kiểm: migration chỉ cho ra S01–S06, còn DB local có thêm S08 kèm real_name. AGENTS.md luật 5 ghi rõ tên miền thật của S08 chỉ có ở source_registry local. Vậy nếu câu truy vấn hay tên bảng chứa tên S08, nó sẽ lọt vào `docs/research/*.json|md`, mà kho này đã công khai. `_acceptance/do-nen-hieu-nang/probes/khong-luat.mjs` (dòng 18) dùng cùng nguồn seed, nên không bắt được ca này. Contract AC-5 lại ghi «tên rút từ `source_registry` lúc chạy», tức lệch với code. Tôi đã quét các tệp giao hiện tại bằng danh sách sống: 0 chỗ khớp, nên hiện chưa lộ gì; lỗ hổng là ở cơ chế.

- **Hinh dang 4 (đối chứng dương không ghim thông điệp, bỏ qua đường thật): đối chứng tầng A gọi thẳng quet(), không qua dongDiff và không kiểm việc nêu tệp**
  AC: AC-5
  file: `_acceptance/do-nen-hieu-nang/probes/khong-luat.mjs:33`
  severity: medium
  source: measurement
  detail: Đường quét thật (dòng 23-30) lấy dòng thêm/bớt qua `dongDiff` (git diff --unified=0, lọc tiền tố '+'/'-'), rồi in `LO TEN NGUON: ${f}`. Đối chứng dương ở dòng 33 gọi `quet(doMjs, readFileSync(...) + tên)` trực tiếp trên chuỗi tự dựng, bỏ qua hoàn toàn `dongDiff` và vòng lặp `doiTrenNhanh`. Nếu bước rút dòng diff trả rỗng hoặc sai (vd luật `!l.startsWith('+++')` nuốt dòng thêm có nội dung bắt đầu bằng '++'), quét thật ra 0 mà đối chứng vẫn xanh. Ngoài ra dòng in «→ bat, neu tep» là chuỗi cố định: probe không kiểm rằng có thông điệp nào nêu tên tệp, trong khi AC-5 và expected E5 hứa «nêu tệp».

- **Hinh dang 3 (assert chuỗi có mặt thay cho quan hệ): «nêu tên kèm cỡ» chỉ khớp \d+ MB bất kỳ, không so với cỡ trong ảnh chụp; «nights phình» chỉ là regex gần nhau**
  AC: AC-4
  file: `_acceptance/do-nen-hieu-nang/probes/thong-ke.mjs:17`
  severity: medium
  source: measurement
  detail: `thieuTrong` dùng regex "`" + x.bang + "`[^\n]*\d+ (MB|GB|kB)". Chỉ cần tên bảng và MỘT con số có đơn vị bất kỳ cùng dòng. Giá trị `x.co` của JSON (vd nights '1322 MB') không được so, nên tài liệu ghi sai cỡ vẫn qua. Lời hứa của AC-4 là quan hệ tài liệu↔ảnh chụp, và probe in `${x.bang} ${x.co}` ở dòng 14 như thể đã đối chiếu. Dòng 25 `/`nights`[\s\S]{0,300}phình/` cũng chỉ kiểm hai chữ đứng gần nhau, không gắn với số trong JSON (byte so với reltuples của nights). Dòng 24 kiểm gốc bằng một cụm chữ «bộ đếm thống kê bị xoá», còn vế «bảng không ghi thêm nên không tự ANALYZE» mà contract nêu thì không được kiểm.

- **Hinh dang 5 (tuyên 5/5 nhưng ma trận rút từ chính dữ liệu, không viết trước): bảng trang lặp theo js.trang**
  AC: AC-3
  file: `_acceptance/do-nen-hieu-nang/probes/tai-lieu.mjs:44`
  severity: medium
  source: measurement
  detail: `kiemTaiLieu` (dòng 17-21) chỉ lặp `for (const t of js.trang)`, rồi dòng 44 in `ok bang trang: ${js.trang.length}/5`. Không có assert `js.trang.length === 5`, cũng không so với danh sách 5 đường viết trước (TRANG trong do.mjs hoặc contract: /vn, /vn/hanoi, /vn/hanoi/listings, /ops, /ops/data-flow). JSON thiếu một trang thì probe vẫn in «ok … 4/5» và kết «TAI LIEU OK». Dòng trang thừa trong tài liệu cũng không bị bắt. Số assert đi theo số phần tử của dữ liệu đang kiểm, không theo ma trận viết trước.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **do.mjs tạo tài khoản admin và reset pg_stat_statements mà không qua rào chỉ-DB-local của dev-ops-account**
  Người dùng thấy gì: Nếu máy đang trỏ nhầm vào cơ sở dữ liệu thật trên cloud, lệnh đo sẽ tạo một tài khoản quản trị thử và xoá bộ đếm thống kê ở đó.
  Căn cứ: Hậu quả nặng nếu xảy ra vì ghi nhầm vào dữ liệu thật, dù chỉ khi người chạy tự đặt sai biến môi trường; sửa rẻ nhưng nằm ngoài phạm vi hàng đo này nên cần một việc riêng.
  file: `scripts/do-nen-hieu-nang/do.mjs`
  severity: high
  Đề xuất: new-contract

- **CREATE EXTENSION pg_stat_statements chạy từ script trên DB dùng chung, ngoài migration**
  Người dùng thấy gì: Một cơ sở dữ liệu dựng mới từ các bản migration sẽ chưa có bộ đếm thống kê truy vấn cho đến khi chạy lệnh đo hoặc bật tay.
  Căn cứ: Hậu quả nhẹ: chỉ ảnh hưởng máy dựng mới và người chạy thấy ngay là thiếu, tự bật lại được; ghi vào giới hạn đã biết là đủ.
  file: `scripts/do-nen-hieu-nang/do.mjs`
  severity: medium
  Đề xuất: known-limits

- **Design doc và tài liệu nghiên cứu mô tả cách làm cũ, không khớp code và trạng thái đã chốt**
  Người dùng thấy gì: Người đọc tài liệu thiết kế sẽ hiểu sai cách đăng nhập khi đo và tưởng việc chọn thước đo còn chờ Mạnh quyết, dù đã chốt ngày 29/10.
  Căn cứ: Chỉ gây hiểu nhầm khi đọc, không mất dữ liệu và không đổi số đo; sửa vài dòng chữ bất cứ lúc nào.
  file: `docs/superpowers/specs/2026-10-27-do-nen-hieu-nang-design.md`
  severity: low
  Đề xuất: known-limits

- **Lỗi của next start bị nuốt: svLog gom nhưng không bao giờ in, và không kiểm tiến trình con còn sống hay đúng là server vừa spawn**
  Người dùng thấy gì: Khi máy chủ thử không khởi động được, người chạy chỉ thấy thông báo chung chung và có thể đo nhầm trên một máy chủ cũ còn sót lại.
  Căn cứ: Hiếm gặp và người chạy thử lại được sau khi tắt tiến trình cũ; số đo sai nếu xảy ra nhưng không làm mất dữ liệu.
  file: `scripts/do-nen-hieu-nang/do.mjs`
  severity: medium
  Đề xuất: known-limits

- **Đầu dò AC-2 dùng lại mọi bản build có sẵn, kể cả bản cũ, nên khi app/src đổi vẫn đo build lỗi thời**
  Người dùng thấy gì: Chạy lại phép đo sau khi mã ứng dụng đổi vẫn có thể đo bản dựng cũ mà vẫn báo xanh.
  Căn cứ: Người dùng cuối không bị ảnh hưởng, chỉ làm số đo có thể cũ; xoá bản dựng rồi chạy lại là khắc phục được.
  file: `_acceptance/do-nen-hieu-nang/probes/trang.sh`
  severity: low
  Đề xuất: known-limits

- **Cột «byte»/«HTML (KB)» thật ra đếm đơn vị UTF-16, không phải byte**
  Người dùng thấy gì: Cột dung lượng trang trong báo cáo hơi thấp hơn thực tế vì trang tiếng Việt có nhiều ký tự chiếm nhiều byte.
  Căn cứ: Chỉ lệch số phụ, không ảnh hưởng thước đo chính là thời gian tải; sửa một dòng bất cứ lúc nào.
  file: `scripts/do-nen-hieu-nang/do.mjs`
  severity: low
  Đề xuất: known-limits

- **Tài liệu khẳng định «mọi truy vấn» có số gọi là bội của 22, nhưng dữ liệu không chứng được và câu này sai với truy vấn của chính script**
  Người dùng thấy gì: Tài liệu viết quá rộng rằng không có truy vấn nền nào lẫn vào, trong khi chỉ mới kiểm hai danh sách 10 dòng.
  Căn cứ: Chỉ là câu chữ khẳng định quá mức, không làm sai bảng số đo; chỉnh lại câu là xong.
  file: `docs/research/do-nen-hieu-nang-2610.md`
  severity: low
  Đề xuất: known-limits

- **Design doc mô tả cách đăng nhập và cửa sổ đo trái với script và tài liệu đã giao**
  Người dùng thấy gì: Tài liệu thiết kế mô tả sai cách đăng nhập khi đo và cửa sổ đo, dễ làm người đọc sau hiểu nhầm cơ chế.
  Căn cứ: Chỉ gây hiểu nhầm khi đọc, không đổi số đo và không mất dữ liệu; sửa chữ rẻ.
  file: `docs/superpowers/specs/2026-10-27-do-nen-hieu-nang-design.md`
  severity: low
  Đề xuất: known-limits

- **Hinh dang 4 (âm-tính-một-mình, không ghim thông điệp): chiều đỏ «ban sha sai» là phép hiển nhiên và thông điệp ghim là chuỗi in tay**
  Người dùng thấy gì: Phép kiểm bản sao lưu báo xanh đúng khi sha khớp, nhưng nhánh báo đỏ khi sao lưu lệch chưa được chứng minh là bắn thật.
  Căn cứ: Bản sao lưu hiện khớp nên chưa có hại; rủi ro chỉ khi sau này sao lưu lệch mà cảnh báo im lặng, thêm lúc nào cũng được.
  file: `_acceptance/do-nen-hieu-nang/probes/db.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hinh dang 6 (đo artefact không phải của cây đang kiểm): trang.sh dùng lại app/.next cũ khi BUILD_ID có sẵn**
  Người dùng thấy gì: Phép đo có thể chạy trên bản dựng cũ nhưng vẫn ghi mã phiên bản hiện tại, làm số đo bị gán nhầm.
  Căn cứ: Không ảnh hưởng người dùng cuối, chỉ làm nhãn số đo có thể sai; dựng lại rồi đo lại là xong.
  file: `_acceptance/do-nen-hieu-nang/probes/trang.sh`
  severity: low
  Đề xuất: known-limits

- **Hinh dang 4 (âm-tính-một-mình, có đường qua rỗng): kiểm băm ops-test qua khi tài khoản không tồn tại**
  Người dùng thấy gì: Phép kiểm «tài khoản thử không bị đụng» có thể báo xanh dù tài khoản không có, nên chưa chắc đã kiểm được gì trong trường hợp đó.
  Căn cứ: Chỉ xảy ra khi máy chưa có tài khoản thử, hậu quả là bằng chứng yếu chứ không mất dữ liệu; thêm đối chứng sau cũng được.
  file: `_acceptance/do-nen-hieu-nang/probes/trang.sh`
  severity: low
  Đề xuất: known-limits

- **Hinh dang 4 (âm-tính-một-mình): kiểm phạm vi chỉ có chiều 'không có tệp ngoài', không có đối chứng dương**
  Người dùng thấy gì: Phép kiểm phạm vi chưa được chứng minh sẽ báo đỏ khi có tệp lạ chen vào, dù logic rất đơn giản.
  Căn cứ: Logic quá đơn giản nên rủi ro thấp, và CI của dự án vẫn chặn PR đổi tệp ngoài phạm vi; thêm đối chứng tốn công hơn lợi ích.
  file: `_acceptance/do-nen-hieu-nang/probes/pham-vi.sh`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
