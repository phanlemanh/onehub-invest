# Review findings: s06-thu-duoi-do (round 2)

## Trong hợp đồng

- **Hình dạng 3: quan hệ «tổng tin = tổng mục mới» chỉ được in ra, không được assert**
  file: `_acceptance/s06-thu-duoi-do/probes/phu-ca.mjs:103`
  severity: medium
  AC: AC-6
  source: measurement
  detail: Dòng 103 in `snapshot: nhật ký trỏ ${coSnap.length} · đọc lại được ${docDuoc} (sha256 khớp manifest) · tổng ${tongTin} tin = tổng mục mới ${Σ soMoi}`. Dấu «=» là chữ cố định trong template. Không có `ok(tongTin === Σ soMoi)`, cũng không có `ok(docDuoc === coSnap.length)`. Hai số này có lệch nhau thì probe vẫn in dấu «=», vẫn `PHU-CA OK`, vẫn thoát mã 0. Phép so theo từng lượt `soLuot` (dòng 64–71) chỉ so số tin của snapshot với số mục có cờ `x[3]===0`, chưa bao giờ so với trường `soMoi` của trang. Vì vậy việc `soMoi` khớp với nội dung snapshot (lời hứa AC-6: số tin = số mục mới) không có assert nào giữ. Eval E6 dò chuỗi 'tổng 1215 tin = tổng mục mới 1215', tức là đo chuỗi có mặt chứ không đo quan hệ giữa hai giá trị. Hai số 1215 trong expected chỉ giữ được quan hệ này khi người chấm đọc từng chữ số, bản thân probe không làm đỏ.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **laKhoChuan bị vượt qua bằng chữ hoa/thường trên APFS: --goc Collector vẫn ghi vào collector/snapshots**
  Người dùng thấy gì: Nếu ai đó cố tình gõ tên thư mục thu khác chữ hoa/thường, bộ thu đuôi vẫn ghi vào kho dữ liệu chính và lượt nạp hằng ngày có thể nạp nhầm bản nhỏ thay cho bản quét đủ.
  Căn cứ: Chỉ xảy ra khi người chạy tay gõ sai chủ ý, hợp đồng đã cấm chạy sống vào kho chuẩn, và hậu quả (nạp thiếu tin một ngày) sửa được bằng cách nạp lại.
  file: `pipeline/collect-s06-duoi.mjs`
  severity: medium
  Đề xuất: known-limits

- **laKhoChuan để lọt --goc viết khác hoa thường trên APFS (vd ../Collector), nên rào kho chuẩn vẫn hở**
  Người dùng thấy gì: Hàng rào chống ghi nhầm vào kho dữ liệu chính có thể bị lách khi gõ tên thư mục khác chữ hoa/thường, làm lượt nạp ngày nhận nhầm bản thu nhỏ.
  Căn cứ: Rủi ro chỉ có khi chạy tay sai quy định, chưa có lịch chạy tự động, và dữ liệu thật không mất, chỉ nạp thiếu và nạp lại được.
  file: `pipeline/collect-s06-duoi.mjs`
  severity: medium
  Đề xuất: known-limits

- **Tin bắt được trong lượt bị chặn bị tính là bỏ sót (hoặc bị loại khỏi mẫu số) khi tính tỉ lệ bắt được**
  Người dùng thấy gì: Khi một lượt thu bị nguồn chặn giữa chừng, con số tỉ lệ bắt được trong báo cáo có thể thấp hơn thực tế, dù tin vẫn được lưu đủ.
  Căn cứ: Chỉ làm lệch một con số báo cáo, không mất hay sai dữ liệu tin, và phép đo thật chưa gặp lần chặn nào.
  file: `pipeline/collect-s06-duoi.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: tuyên chặn cả lớp «fetch và socket ra ngoài» nhưng tự kiểm chỉ có một ca fetch**
  Người dùng thấy gì: Phép kiểm không gọi mạng chỉ được chứng minh bằng một ca gọi web; nếu đường kết nối kiểu khác bị hỏng bộ chặn thì có thể không ai biết.
  Căn cứ: Rủi ro thấp vì bộ thu hiện chỉ dùng đường gọi web đã được kiểm, và nếu có lọt thì chỉ là một lời gọi thừa khi chạy thử, không ảnh hưởng dữ liệu.
  file: `_acceptance/s06-thu-duoi-do/probes/khong-mang.mjs`
  severity: low
  Đề xuất: known-limits

- **Tệp mới hardcode tên miền thật của nguồn S06 (tầng A) trong kho công khai (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bộ thu mới ghi sẵn địa chỉ thật của nguồn S06 trong mã nằm ở kho công khai, nên ai đọc kho cũng thấy tên nguồn vốn phải giữ kín.
  Căn cứ: Tên nguồn đã lên kho công khai thì không thu hồi được, và quy tắc giữ kín tên nguồn đòi chặn tên mới. Sửa rẻ nhưng cần một việc riêng để đọc địa chỉ từ cấu hình trên máy thu.
  file: `pipeline/collect-s06-duoi.mjs`
  severity: medium
  Đề xuất: new-contract

- **Lượt hỏng DB giữa chừng làm mất số lời gọi nguồn trong nhật ký và báo cáo (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi DB đứt giữa một lượt thu, báo cáo đếm thiếu số lần đã gọi nguồn, nên số lời gọi mỗi phút trông thấp hơn thực tế. Tin thu được không bị mất.
  Căn cứ: Chỉ lệch con số báo cáo trong lượt gặp sự cố hiếm, không mất tin, và số đúng vẫn còn ở tệp trạng thái. Ghi lại để làn thu sửa ở lần sau.
  file: `pipeline/collect-s06-duoi.mjs`
  severity: medium
  Đề xuất: known-limits

- **docMoc và phienCuoi nuốt mọi lỗi đọc, kể cả tệp hỏng, rồi lặng lẽ làm lại từ đầu (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu tệp ghi nhớ tin đã thấy bị hỏng, bộ thu lặng lẽ quên hết và có thể đưa lại các tin cũ như tin mới, không có cảnh báo.
  Căn cứ: Chỉ xảy ra khi tệp bị hỏng giữa chừng, hậu quả là tin trùng chứ không mất tin, và bộ thu hiện chỉ chạy tay nên người chạy tự thử lại được.
  file: `pipeline/collect-s06-duoi.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6: đường dẫn hardcode, E6/E9 đo phép đo nằm trong worktree của tác giả, không phải cây đang kiểm (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phần kiểm số đo 24 giờ chỉ chạy được khi có thư mục dữ liệu của người làm ra nó. Máy khác hoặc sau khi dọn thư mục đó thì lượt kiểm dừng và báo thiếu dữ liệu.
  Căn cứ: Hợp đồng đã ghi rõ giới hạn này và lượt kiểm báo đỏ rõ ràng chứ không báo xanh giả. Người chấm tự khắc phục bằng cách chỉ đúng thư mục dữ liệu.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: dòng 'tổng N tin = tổng mục mới M' của E6 chỉ được in ra, quan hệ bằng nhau không được assert (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một dòng tổng trong báo cáo kiểm chỉ được in ra chứ không tự so sánh. Nếu hai số lệch nhau, lượt kiểm vẫn có thể báo đạt.
  Căn cứ: Dữ liệu đã ghim bằng băm và từng snapshot đã được so riêng, nên lệch ở tổng gần như không thể xảy ra. Công sửa lớn hơn rủi ro còn lại.
  file: `_acceptance/s06-thu-duoi-do/probes/phu-ca.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
