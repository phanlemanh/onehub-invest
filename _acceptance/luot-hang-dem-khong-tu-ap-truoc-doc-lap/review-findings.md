# Review findings: luot-hang-dem-khong-tu-ap-truoc-doc-lap (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E6 hứa kiểm «thẻ chờ tăng đúng số tin có đề xuất trùng luật» nhưng ca test không kiểm vế này**
  Người dùng thấy gì: Bài kiểm chưa đếm thẻ chờ duyệt trước và sau lượt đêm. Nếu có đề xuất bị chuyển sang trạng thái chờ mà không lên thẻ thì bài kiểm vẫn báo xanh, người duyệt sẽ không thấy đề xuất đó.
  Căn cứ: Việc chặn tự áp vẫn được đo đúng, chỉ phần đếm thẻ chưa có số liệu; lỗi này không làm mất hay lộ dữ liệu, và thẻ thiếu có thể phát hiện qua câu đo sau lượt đêm đầu tiên.
  file: `_acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Probe AC-5 so route.ts/doc-toan-bo.ts với đầu origin/main (diff hai chấm), không so với điểm rẽ nhánh nên có thể đỏ giả**
  Người dùng thấy gì: Bước kiểm có thể báo đỏ nhầm rằng hai tệp bị đổi, chỉ vì có việc khác đã gộp vào trong lúc nhánh này chờ. Người nghiệm thu sẽ mất thời gian kiểm lại, sản phẩm không bị ảnh hưởng.
  Căn cứ: Hậu quả chỉ là báo đỏ giả cho đội nghiệm thu, người dùng cuối không thấy gì; báo giả dễ nhận ra và chạy lại sau khi cập nhật nhánh là xong.
  file: `_acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — lời hứa quan hệ «thẻ chờ tăng đúng số tin có đề xuất trùng luật» không có assert nào**
  Người dùng thấy gì: Bài kiểm ghi rộng hơn những gì nó thật sự đo: không so số thẻ với số tin có đề xuất, và chưa chạy ca có toà. Kết quả xanh vì vậy bảo đảm ít hơn những gì mô tả.
  Căn cứ: Việc không tự áp vẫn được đo, chỉ phần mô tả đo thừa; không ảnh hưởng dữ liệu người dùng, và các ca khác của hồ sơ đã phủ phần toà.
  file: `_acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — vế «enrich-run.ts khai chanTuApCanCu: true» đo bằng grep chuỗi trong mã nguồn, không đo hành vi lượt đêm**
  Người dùng thấy gì: Việc kiểm cờ chặn ở lượt đêm chỉ dò chữ trong tệp, nên có thể xanh dù cờ nằm sai chỗ. Nếu cờ thật sự mất thì mặc định vẫn là chặn tự áp.
  Căn cứ: Nếu cờ bị bỏ thì hệ thống vẫn rơi về chế độ an toàn là chặn, nên không có nguy cơ mất dữ liệu; sửa tốn công hơn so với rủi ro rất thấp.
  file: `_acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 4/4 lỗi rơi vào file không bộ đo nào phủ (_acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/evals.yaml, _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
