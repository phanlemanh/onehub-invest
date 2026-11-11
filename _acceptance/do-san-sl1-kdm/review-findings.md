# Review findings: do-san-sl1-kdm (round 2)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Tên ca và chú thích đầu tệp vẫn ghi «trên cùng DB» trong khi ba lượt --thu nay chạy trên ba DB chép riêng**
  Người dùng thấy gì: Tên một ca kiểm tra còn ghi «cùng một DB» trong khi thực tế mỗi lượt chạy trên bản chép riêng. Chỉ gây hiểu nhầm cho người đọc, kết quả kiểm tra vẫn đúng.
  Căn cứ: Hậu quả nhẹ, chỉ sai chữ mô tả, không mất hay lộ dữ liệu; sửa đổi tên còn phải đổi cả danh sách bỏ qua của CI nên để lần chạm sau.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`
  severity: low
  Đề xuất: known-limits

- **E3 paths không khai db/db-thu.sh (và pipeline/lib/osm.mjs) dù ca KDM-AC-3 nay chạy hẳn qua db-thu.sh --chay và thước dùng khuVucKhopTen**
  Người dùng thấy gì: Nếu sau này chỉ có script dựng DB riêng hay hàm khớp tên bị sửa, kết quả xanh cũ của bước kiểm này có thể được giữ lại mà không chạy lại. Người dùng cuối không thấy ảnh hưởng trực tiếp.
  Căn cứ: Rủi ro chỉ nằm ở quy trình nghiệm thu, không chạm dữ liệu người dùng, và sẽ lộ khi bước kiểm khác chạy lại; sửa rẻ nhưng không cấp bách.
  file: `_acceptance/do-san-sl1-kdm/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc, không round-trip với bên ghi): KDM-PX1 tự gắn area_id cho tin rồi so thước với chính hàm khuVucKhopTen mà thước gọi**
  Người dùng thấy gì: Ca kiểm tra này chưa chứng minh được việc bên ghi thật sự gắn tin vào loại khu vực lạ; nó chỉ chứng minh thước dùng cùng luật. Phần đo trên dữ liệu thật vẫn bắt được lỗi đó.
  Căn cứ: Hậu quả nhẹ vì các phép đo khác đã phủ đầu ra thật của bên ghi; chỉ là lời khai «round-trip» hơi quá, không làm mất hay lộ dữ liệu.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Test KDM-PX1 ghi vào DB theo DATABASE_URL mà không chặn host khác localhost như thước (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ai đó chạy kiểm thử khi đang trỏ vào hệ thống thật, phép thử có thể mở giao dịch tạm trên đó. Dữ liệu thật không bị đổi vì mọi thứ được hoàn lại, nhưng vẫn là rủi ro không đáng có.
  Căn cứ: Hậu quả nhẹ vì mọi thay đổi được hoàn lại và chỉ xảy ra khi cấu hình môi trường sai; sửa sau rẻ và không mất dữ liệu.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chiều đỏ chỉ có một điểm): tự kiểm đỏ của probe AC-4 chỉ thử câu ghi ở dòng 2, trước mọi BEGIN (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép tự kiểm của công cụ canh việc ghi nhầm vào dữ liệu dùng chung chỉ thử một kiểu vi phạm, nên có thể bỏ sót các kiểu khác. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Chỉ làm yếu một lớp kiểm tra nội bộ, không động đến dữ liệu hay người dùng; bổ sung ca thử sau rất rẻ.
  file: `_acceptance/do-san-sl1-kdm/probes/khong-db-chung.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (khai trục ma trận nhưng chỉ đo một điểm): trục «DB chưa áp 084» gán cho AC-1 nhưng không có eval nào chạy nhánh coMa=false (r1 · tệp đã đổi)**
  Người dùng thấy gì: Trường hợp cơ sở dữ liệu chưa cập nhật bản mới chưa có phép thử riêng, nên nếu sai thì chưa ai biết. Chỉ gặp ở máy chưa cập nhật.
  Căn cứ: Ít xảy ra vì mọi máy đang dùng đã cập nhật; không mất dữ liệu, và thêm phép thử sau không tốn nhiều.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
