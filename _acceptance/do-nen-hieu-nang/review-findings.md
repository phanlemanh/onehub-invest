# Review findings: do-nen-hieu-nang (round 3)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Đã bỏ theo dõi s4-args*.json nhưng không gitignore: lần `git add -A` sau sẽ commit lại và E5 lại đỏ**
  Người dùng thấy gì: Ba tệp tham số của vòng soát vẫn nằm trên đĩa và chưa được chặn khỏi git. Nếu ai đó lỡ commit toàn bộ thư mục, các đường dẫn chứa tên nguồn thật có thể lọt lên nhánh, và cổng kiểm sẽ báo đỏ trở lại.
  Căn cứ: Chưa có gì bị lộ, và nếu lỡ commit thì cổng kiểm tên nguồn thật sẽ chặn trước khi gộp, nên hậu quả nhẹ và tự phát hiện được; ghi lại để người làm sau biết là đủ.
  file: `_acceptance/do-nen-hieu-nang/s4-args.json`
  severity: medium
  Đề xuất: known-limits

- **do.mjs tạo tài khoản admin và reset pg_stat_statements mà không qua rào chỉ-DB-local của dev-ops-account (r1)**
  Người dùng thấy gì: Nếu máy đang trỏ nhầm vào cơ sở dữ liệu thật trên cloud, lệnh đo sẽ tạo một tài khoản quản trị thử và xoá bộ đếm thống kê ở đó.
  Căn cứ: Hậu quả nặng nếu xảy ra vì ghi nhầm vào dữ liệu thật, dù chỉ khi người chạy tự đặt sai biến môi trường; sửa rẻ nhưng nằm ngoài phạm vi hàng đo này nên cần một việc riêng.
  file: `scripts/do-nen-hieu-nang/do.mjs`
  severity: high
  Đề xuất: new-contract

- **CREATE EXTENSION pg_stat_statements chạy từ script trên DB dùng chung, ngoài migration (r1)**
  Người dùng thấy gì: Một cơ sở dữ liệu dựng mới từ các bản migration sẽ chưa có bộ đếm thống kê truy vấn cho đến khi chạy lệnh đo hoặc bật tay.
  Căn cứ: Hậu quả nhẹ: chỉ ảnh hưởng máy dựng mới và người chạy thấy ngay là thiếu, tự bật lại được; ghi vào giới hạn đã biết là đủ.
  file: `scripts/do-nen-hieu-nang/do.mjs`
  severity: medium
  Đề xuất: known-limits

- **Design doc và tài liệu nghiên cứu mô tả cách làm cũ, không khớp code và trạng thái đã chốt (r1)**
  Người dùng thấy gì: Người đọc tài liệu thiết kế sẽ hiểu sai cách đăng nhập khi đo và tưởng việc chọn thước đo còn chờ Mạnh quyết, dù đã chốt ngày 29/10.
  Căn cứ: Chỉ gây hiểu nhầm khi đọc, không mất dữ liệu và không đổi số đo; sửa vài dòng chữ bất cứ lúc nào.
  file: `docs/superpowers/specs/2026-10-27-do-nen-hieu-nang-design.md`
  severity: low
  Đề xuất: known-limits

- **Lỗi của next start bị nuốt: svLog gom nhưng không bao giờ in, và không kiểm tiến trình con còn sống hay đúng là server vừa spawn (r1)**
  Người dùng thấy gì: Khi máy chủ thử không khởi động được, người chạy chỉ thấy thông báo chung chung và có thể đo nhầm trên một máy chủ cũ còn sót lại.
  Căn cứ: Hiếm gặp và người chạy thử lại được sau khi tắt tiến trình cũ; số đo sai nếu xảy ra nhưng không làm mất dữ liệu.
  file: `scripts/do-nen-hieu-nang/do.mjs`
  severity: medium
  Đề xuất: known-limits

- **Đầu dò AC-2 dùng lại mọi bản build có sẵn, kể cả bản cũ, nên khi app/src đổi vẫn đo build lỗi thời (r1)**
  Người dùng thấy gì: Chạy lại phép đo sau khi mã ứng dụng đổi vẫn có thể đo bản dựng cũ mà vẫn báo xanh.
  Căn cứ: Người dùng cuối không bị ảnh hưởng, chỉ làm số đo có thể cũ; xoá bản dựng rồi chạy lại là khắc phục được.
  file: `_acceptance/do-nen-hieu-nang/probes/trang.sh`
  severity: low
  Đề xuất: known-limits

- **Cột «byte»/«HTML (KB)» thật ra đếm đơn vị UTF-16, không phải byte (r1)**
  Người dùng thấy gì: Cột dung lượng trang trong báo cáo hơi thấp hơn thực tế vì trang tiếng Việt có nhiều ký tự chiếm nhiều byte.
  Căn cứ: Chỉ lệch số phụ, không ảnh hưởng thước đo chính là thời gian tải; sửa một dòng bất cứ lúc nào.
  file: `scripts/do-nen-hieu-nang/do.mjs`
  severity: low
  Đề xuất: known-limits

- **Tài liệu khẳng định «mọi truy vấn» có số gọi là bội của 22, nhưng dữ liệu không chứng được và câu này sai với truy vấn của chính script (r1)**
  Người dùng thấy gì: Tài liệu viết quá rộng rằng không có truy vấn nền nào lẫn vào, trong khi chỉ mới kiểm hai danh sách 10 dòng.
  Căn cứ: Chỉ là câu chữ khẳng định quá mức, không làm sai bảng số đo; chỉnh lại câu là xong.
  file: `docs/research/do-nen-hieu-nang-2610.md`
  severity: low
  Đề xuất: known-limits

- **Design doc mô tả cách đăng nhập và cửa sổ đo trái với script và tài liệu đã giao (r1)**
  Người dùng thấy gì: Tài liệu thiết kế mô tả sai cách đăng nhập khi đo và cửa sổ đo, dễ làm người đọc sau hiểu nhầm cơ chế.
  Căn cứ: Chỉ gây hiểu nhầm khi đọc, không đổi số đo và không mất dữ liệu; sửa chữ rẻ.
  file: `docs/superpowers/specs/2026-10-27-do-nen-hieu-nang-design.md`
  severity: low
  Đề xuất: known-limits

- **Hinh dang 4 (âm-tính-một-mình, không ghim thông điệp): chiều đỏ «ban sha sai» là phép hiển nhiên và thông điệp ghim là chuỗi in tay (r1)**
  Người dùng thấy gì: Phép kiểm bản sao lưu báo xanh đúng khi sha khớp, nhưng nhánh báo đỏ khi sao lưu lệch chưa được chứng minh là bắn thật.
  Căn cứ: Bản sao lưu hiện khớp nên chưa có hại; rủi ro chỉ khi sau này sao lưu lệch mà cảnh báo im lặng, thêm lúc nào cũng được.
  file: `_acceptance/do-nen-hieu-nang/probes/db.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hinh dang 6 (đo artefact không phải của cây đang kiểm): trang.sh dùng lại app/.next cũ khi BUILD_ID có sẵn (r1)**
  Người dùng thấy gì: Phép đo có thể chạy trên bản dựng cũ nhưng vẫn ghi mã phiên bản hiện tại, làm số đo bị gán nhầm.
  Căn cứ: Không ảnh hưởng người dùng cuối, chỉ làm nhãn số đo có thể sai; dựng lại rồi đo lại là xong.
  file: `_acceptance/do-nen-hieu-nang/probes/trang.sh`
  severity: low
  Đề xuất: known-limits

- **Hinh dang 4 (âm-tính-một-mình, có đường qua rỗng): kiểm băm ops-test qua khi tài khoản không tồn tại (r1)**
  Người dùng thấy gì: Phép kiểm «tài khoản thử không bị đụng» có thể báo xanh dù tài khoản không có, nên chưa chắc đã kiểm được gì trong trường hợp đó.
  Căn cứ: Chỉ xảy ra khi máy chưa có tài khoản thử, hậu quả là bằng chứng yếu chứ không mất dữ liệu; thêm đối chứng sau cũng được.
  file: `_acceptance/do-nen-hieu-nang/probes/trang.sh`
  severity: low
  Đề xuất: known-limits

- **Hinh dang 4 (âm-tính-một-mình): kiểm phạm vi chỉ có chiều 'không có tệp ngoài', không có đối chứng dương (r1)**
  Người dùng thấy gì: Phép kiểm phạm vi chưa được chứng minh sẽ báo đỏ khi có tệp lạ chen vào, dù logic rất đơn giản.
  Căn cứ: Logic quá đơn giản nên rủi ro thấp, và CI của dự án vẫn chặn PR đổi tệp ngoài phạm vi; thêm đối chứng tốn công hơn lợi ích.
  file: `_acceptance/do-nen-hieu-nang/probes/pham-vi.sh`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
