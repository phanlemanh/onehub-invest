## Trong hợp đồng

- **PTD-AC-5 tự bỏ qua (t.skip) khi không mồi được OSM, và catch nuốt mọi lỗi kết nối/truy vấn thành «bỏ qua»**
  AC: AC-5
  file: `pipeline/scripts/phuong-tu-du-an.test.mjs:298`
  severity: medium
  source: bugs
  detail: moiOsm() đọc stg_osm_boundaries từ DB dùng chung `${MAY_CHU}/oneinvest`. Bất kỳ lỗi nào (sai xác thực, thiếu bảng, DB không chạy) đều rơi vào `catch { return null; }`. Khi trả null, cả ca PTD-AC-5 lẫn ca chiều đỏ của nó đều gọi `t.skip(...)`, và lời ghi chú trong test cũng nói CI dựng DB từ migration nên không có dòng OSM. Hệ quả: trên CI (hoặc máy chưa nạp OSM Hà Nội), AC-5 (giữ phường suy ra qua lượt nạp S03 và reassign-areas) không bao giờ chạy, mà npm test vẫn thoát 0. Trong khi đó evals.yaml E5 yêu cầu «ca PTD-AC-5 chạy chuỗi thật», và E9 chỉ kiểm exit 0, nên cổng có thể xanh mà AC-5 chưa được kiểm. Cách sửa: mồi một ranh giới tổng hợp ngay trong DB thử (không phụ thuộc DB máy), hoặc cho ca thất bại thay vì skip khi thiếu mồi; tối thiểu là chỉ coi «0 dòng» là skip và ném lại lỗi kết nối hay truy vấn.
  rationale: AC-5 đòi chạy chuỗi thật qua reassign-areas và kiểm tin W1 giữ nguyên; khi test tự bỏ qua mà vẫn thoát 0 thì AC-5 không được kiểm.

- **Hình dạng 6 (hardcode ROOT/môi trường tác giả): phép đo AC-5 lấy ranh giới OSM từ DB `oneinvest` của máy tác giả nên ở CI tự bỏ qua**
  AC: AC-5
  file: `pipeline/scripts/phuong-tu-du-an.test.mjs:299`
  severity: medium
  source: measurement
  detail: `moiOsm()` (dòng 299-308) mở kết nối cố định tới `${MAY_CHU}/oneinvest`, là DB vận hành của máy tác giả, không phải DB thử của lượt. Hàm đọc `stg_osm_boundaries` của Hà Nội ở đó, gặp lỗi hoặc không có dòng thì trả `null`. Cả ca xanh (dòng 339-343) lẫn ca chiều đỏ (dòng 344-350) đều gọi `if (!osm) return t.skip(...)`. CI có tạo DB `oneinvest` (ci-test.yml dòng 21), nhưng DB ấy dựng từ migration nên `stg_osm_boundaries` rỗng. Vì vậy E5 («ca PTD-AC-5 chạy chuỗi thật ... reassign-areas») trên CI và trên mọi cây không có dữ liệu thu thật chỉ ra skip, không bao giờ đỏ. Ca chiều đỏ «PTD-AC-5 S03 chạy lại xoá phường kế thừa» cũng bị skip theo. Phép đo vì thế đo dữ liệu trên máy tác giả, không đo cây đang được kiểm. Đầu vào ranh giới cần dựng trong DB thử của lượt, không đọc từ DB `oneinvest`.
  rationale: Cùng gốc với finding trên: phép đo AC-5 phụ thuộc dữ liệu ranh giới trên DB máy tác giả nên trên CI không chạy, AC-5 không được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **offers_changed đếm trùng tin khi cả UPDATE chính lẫn resolve_offer_area_du_an cùng đổi một tin**
  Người dùng thấy gì: Con số «đổi N» mà người vận hành thấy sau mỗi lượt xử lý tin có thể lớn hơn số tin thật sự đổi. Dữ liệu tin và phường không bị sai.
  Căn cứ: Chỉ lệch một con số hiển thị, không mất hay sai dữ liệu, người vận hành tự đối chiếu được bằng cách đếm lại, nên ghi hạn chế đã biết là đủ.
  file: `db/migrations/099_phuong_tu_du_an.sql`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
