# Review findings: s02-map-listings-trang-ke (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Dòng log chạm trần nói «lượt ghi FAILED» nhưng scheduler vẫn ghi lượt là done**
  Người dùng thấy gì: Khi thu một thị trường quá lớn và chạm trần số trang, dòng nhật ký ghi «FAILED» nhưng lượt thu vẫn được ghi là xong. Người đọc nhật ký có thể hiểu nhầm là lượt hỏng toàn phần, còn dữ liệu thu được vẫn đúng.
  Căn cứ: Chỉ là lời ghi chưa chuẩn trong nhật ký, không mất hay sai dữ liệu, chỉ gây hiểu nhầm nhẹ và sửa chữ về sau rất rẻ.
  file: `collector/src/collectors/airdna-research.ts`
  severity: low
  Đề xuất: known-limits

- **Thư mục tạm của phép đo đột biến nằm trong collector/ mà không có trong .gitignore**
  Người dùng thấy gì: Nếu lượt chấm bị ngắt giữa chừng, thư mục tạm có thể nằm lại trong kho và bị đưa nhầm vào một lần commit. Người dùng cuối không bị ảnh hưởng, chỉ người làm kho có thể thấy rác.
  Căn cứ: Chỉ ảnh hưởng người phát triển, không động tới dữ liệu hay người dùng; dễ phát hiện và xoá tay, và chỉ xảy ra khi lượt chấm bị giết giữa chừng.
  file: `_acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert giá trị thay vì QUAN HỆ): ca AC-5 so số lời với hằng TRANG_MAP_TOIDA do chính mã xuất ra, không kiểm cận trên ≤ 11**
  Người dùng thấy gì: Nếu sau này ai đó nâng số trang tối đa mỗi thị trường lên rất cao, bộ test đơn vị vẫn báo xanh. Chỉ phép chấm riêng mới bắt được, nên lưu lượng thu có thể tăng ngoài ý muốn nếu bỏ qua phép chấm đó.
  Căn cứ: Có lớp kiểm độc lập khác đã bắt đúng lỗi này nên nguy cơ thấp; chỉ thiếu một lớp bảo vệ phụ, sửa sau rẻ.
  file: `collector/src/test/s02-bo-thu-cua-api.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên phủ ca nhưng không tách điểm ca): ca «nguồn trả TRANG MỚI mãi» dựng cùng bản giả với ca «LẶP trang đầu»**
  Người dùng thấy gì: Bộ test đơn vị không phân biệt được hai tình huống bất thường (nguồn lặp trang đầu và nguồn trả trang mới mãi), nên một cách dừng sai chỉ dựa trên phát hiện trang trùng có thể lọt qua. Phép chấm riêng vẫn kiểm riêng từng tình huống.
  Căn cứ: Hai tình huống đã được kiểm tách bạch ở phép chấm độc lập nên rủi ro thực tế thấp; việc chỉ là tăng độ chặt của test, sửa sau rẻ và không ảnh hưởng dữ liệu.
  file: `collector/src/test/s02-bo-thu-cua-api.test.ts`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
