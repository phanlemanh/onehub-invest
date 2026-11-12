# Review findings: sao-luu-ma-hoa-b2 (round 1)

## Trong hợp đồng

- **Kiểm báo ok khi không so được tệp raw snapshot nào (không kiểm ngưỡng ≥50 tệp)**
  file: `scripts/lib/sao-luu-ngoai-may.mjs:325`
  severity: medium
  AC: AC-5
  source: bugs
  detail: `snap = ls.tep.filter((p) => p.startsWith(gocSnap))` rồi `chon = ... .slice(0, soTep)`, nhưng không có dòng nào kiểm `chon.length >= soTep` hay `> 0`. Hợp đồng AC-5 và spec §6 đòi «khôi phục ít nhất 50 tệp raw snapshot». Nếu đường đã lưu trong kho không khớp cfg.gocNguon (chạy và kiểm chạy từ hai gốc khác nhau, hay collector/snapshots vắng lúc chạy nên nguonSaoLuu bỏ qua nó) thì snap rỗng. Khi đó kiểm chỉ so các tệp dump và trả mã 0 «sha256 khớp hết». Đó là một lần thử khôi phục pass giả, không kiểm tệp raw nào.

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): E6 không dump qua db-sao-luu.sh**
  file: `scripts/sao-luu-ngoai-may.itest.mjs:59`
  severity: high
  AC: AC-6
  source: measurement
  detail: AC-6 hứa «DB thử nhỏ đã dump qua `db-sao-luu.sh`», nhưng itest tự viết một dump.sh (dòng 55-61): `pg_dump -Fc ${NGUON} > "$1/oneinvest.dump"` cộng psql DEM_SQL. Tên tệp `oneinvest.dump` được chọn tay cho khớp mặc định `dumpChinh` của bên đọc (kiemDb, lib dòng 55/393). Bộ ghi thật db-sao-luu.sh ghi bố cục khác hẳn: `<db>.dump` cho mọi DB, globals.sql, thong-tin.txt, manifest.sha256, đếm trong phiên REPEATABLE READ qua FIFO, và có luật riêng về thư mục đích (đích phải trống, phải ngoài kho). Chỉ câu DEM_SQL được rút từ bộ ghi; bố cục thư mục dump và đường gọi `lenhDump` mặc định (`bash scripts/db-sao-luu.sh`) không chạy qua chay→kiemDb ở ca nào. Ở test đơn vị cũng vậy: dump-gia viết tay `a.dump` và `public.t\t3`. Nếu db-sao-luu.sh đổi tên hay bố cục tệp, hoặc không chịu ghi vào thư mục dump tạm của chay, E6 vẫn xanh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bộ test chạy restic thật nằm trong glob CI scripts/*.test.mjs nhưng thiếu cách bỏ qua (không có mục trong ci-bo-qua.json, không skip khi máy thiếu restic)**
  Người dùng thấy gì: Khi kiểm tự động trên máy chủ GitHub không có công cụ sao lưu, các ca thử sao lưu sẽ đỏ dù công cụ không hỏng, làm chặn việc gộp.
  Căn cứ: Chỉ làm đỏ kiểm tự động chứ không ảnh hưởng dữ liệu hay người dùng, và sửa rẻ nhưng nằm ngoài các tiêu chí đã ký nên nên mở việc riêng.
  file: `scripts/sao-luu-ngoai-may.test.mjs`
  severity: high
  Đề xuất: new-contract

- **Công cụ đưa dump DB và collector/state (tầng A) ra B2 trong khi luật 6 trong AGENTS.md và ADR-0007 vẫn ghi tầng A «KHÔNG rời máy local»; chặn duy nhất là một tệp xác nhận**
  Người dùng thấy gì: Nếu ai đó tạo tệp xác nhận và cấu hình kho trước khi luật về dữ liệu nhạy cảm được sửa, bản sao lưu có dữ liệu tầng A sẽ được gửi ra ngoài máy dù luật còn cấm.
  Căn cứ: Dữ liệu đã mã hoá và khoá nằm ở máy, lượt gửi thật cần Mạnh tự tay bật nên rủi ro thấp; chỉ cần ghi rõ thứ tự gộp là đủ.
  file: `scripts/lib/sao-luu-ngoai-may.mjs`
  severity: medium
  Đề xuất: known-limits

- **restic backup exit 3 (snapshot đã tạo nhưng có tệp không đọc được) bị coi là lỗi: trạng thái lệch snapshot_id, kiểm và kiem-db hỏng tới lượt ok sau**
  Người dùng thấy gì: Nếu một tệp đổi hay biến mất đúng lúc sao lưu, bản sao lưu vẫn được tạo nhưng hệ thống ghi là lỗi, và lần thử khôi phục kế tiếp báo hỏng cho tới khi có một lượt sao lưu thành công khác.
  Căn cứ: Tự hết ở lượt chạy thành công sau, không mất dữ liệu; chỉ gây báo động giả tạm thời.
  file: `scripts/lib/sao-luu-ngoai-may.mjs`
  severity: medium
  Đề xuất: known-limits

- **Kết quả kiểm hằng tuần ghi vào kiem_cuoi nhưng không ai đọc: thử khôi phục thất bại vẫn im lặng**
  Người dùng thấy gì: Nếu lần thử khôi phục hằng tuần thất bại, bảng sức khoẻ vẫn hiện sao lưu ổn, nên có thể không ai biết bản sao lưu đã hỏng cho tới khi cần dùng.
  Căn cứ: Mất cảnh báo sớm về bản sao lưu hỏng nhưng không mất dữ liệu hiện có; thêm đọc kết quả này là một việc nhỏ riêng.
  file: `scripts/lib/sao-luu-ngoai-may.mjs`
  severity: low
  Đề xuất: new-contract

- **khoi-tao không chạy lại được sau khi restic init lỗi: mật khẩu đã vào Keychain và lần sau bị từ chối**
  Người dùng thấy gì: Nếu khởi tạo kho lỗi giữa chừng do mạng hay sai thùng, lần chạy lại bị từ chối và người vận hành phải tự xoá mục mật khẩu trong Keychain; mật khẩu còn có thể lộ thoáng qua trong danh sách tiến trình.
  Căn cứ: Người vận hành tự gỡ được bằng một thao tác tay, không mất dữ liệu, và chỉ xảy ra một lần lúc thiết lập.
  file: `scripts/lib/sao-luu-ngoai-may.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): C12 tự viết trang-thai.json thay vì lấy từ chay**
  Người dùng thấy gì: Nếu phần ghi trạng thái và phần cảnh báo quá hạn lệch nhau về tên khoá hay định dạng giờ, bộ thử vẫn xanh nên cảnh báo có thể im lặng.
  Căn cứ: Chỉ có nguy cơ lệch khi ai đó đổi định dạng sau này, không ảnh hưởng dữ liệu hôm nay, và có thể thêm ca nối sau.
  file: `scripts/check-freshness.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): khôi phục bằng mật khẩu sai chỉ kiểm mã khác 0**
  Người dùng thấy gì: Bài thử không chứng minh chắc rằng chính mật khẩu sai là thứ chặn khôi phục, nên một lỗi khác cũng làm bài thử xanh.
  Căn cứ: Chỉ giảm độ tin của một ca thử, hành vi mã hoá thật vẫn được các ca khác kiểm; sửa sau rẻ.
  file: `scripts/sao-luu-ngoai-may.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét cả lớp nhưng chỉ có điểm case): C15 hứa «từng từ của luật» mà ma trận thiếu**
  Người dùng thấy gì: Một vài loại tệp khoá hay chứng thực hiếm có thể bị loại nhầm hoặc giữ nhầm mà bộ thử không phát hiện.
  Căn cứ: Rủi ro chỉ ở vài tên tệp hiếm và đã có phần lớn tên chính được kiểm; bổ sung ca thử sau rất rẻ.
  file: `scripts/sao-luu-ngoai-may.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét cả lớp nhưng chỉ có điểm case): trục «lớp dẫn xuất» chỉ gài .cache**
  Người dùng thấy gì: Bộ thử chưa chứng minh thư mục sinh ra như node_modules hay dist bị bỏ qua đúng, hoặc raw trùng tên không bị cuốn theo.
  Căn cứ: Chỉ nguy cơ nhỏ là sao lưu thừa hoặc thiếu vài thư mục; không ảnh hưởng an toàn dữ liệu và bổ sung sau rẻ.
  file: `scripts/sao-luu-ngoai-may.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): C1 «không thư mục dump» không có đối chứng dương**
  Người dùng thấy gì: Bài thử không chứng minh bộ đếm thư mục tạm sẽ phát hiện được nếu công cụ đổi chỗ tạo thư mục, nên có thể xanh sai.
  Căn cứ: Hậu quả rất nhẹ vì chỉ liên quan độ nhạy của một phép đếm, công sức sửa lớn hơn lợi ích.
  file: `scripts/sao-luu-ngoai-may.test.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
