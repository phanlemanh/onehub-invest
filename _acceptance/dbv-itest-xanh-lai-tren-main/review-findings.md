## Trong hợp đồng

- **Probe đối chứng vẫn xoá DB của tiến trình còn sống khi tên có dạng oneinvest_dbv_that_<pid> (cùng lỗi r1)**
  AC: AC-4
  file: `_acceptance/dbv-itest-xanh-lai-tren-main/probes/doi-chung.mjs:66`
  severity: high
  source: bugs
  detail: conSong() chỉ tách pid bằng /^oneinvest_dbv_(\d+)/. Tệp anh em pipeline/scripts/danh-ba-vat-the-that.itest.mjs (dòng 17) đặt tên DB thử là `oneinvest_dbv_that_${process.pid}`. Tên này cũng khớp `LIKE 'oneinvest_dbv_%'` của dsDb(), nhưng regex không lấy được pid. Khi đó Number(undefined) ra NaN, `!pid` đúng, nên conSong trả false. Nếu một lượt -that itest (lượt chấm song song hoặc phiên khác) tạo DB trong lúc probe đang chạy (probe chạy khá lâu vì dựng DB và áp đủ migration), DB đó bị tính là «sót», probe FAIL nhầm, rồi `DROP DATABASE IF EXISTS … WITH (FORCE)` xoá DB và cắt kết nối của tiến trình đang sống. Đây chính là lỗi BLOCKED r1 mà commit 1afd41f0 định sửa. Tự kiểm 'LUAT CON SONG HAI CHIEU OK' chỉ thử dạng oneinvest_dbv_<pid> nên không bắt được trường hợp này. Cách sửa: tách pid bằng /^oneinvest_dbv_(?:that_)?(\d+)/ hoặc lấy nhóm số đầu tiên. Không lấy được pid thì coi là DB của người khác (không tính, không xoá) chứ không coi là sót.
  rationale: AC-4 đòi DB mới của tiến trình còn sống (lượt chạy song song) không bị tính và probe không xoá; finding cho thấy DB tên dạng that_<pid> vẫn bị tính là sót và bị xoá.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

(không có mục nào)

## Chưa adversarial-verify (refuter chết)

(không có mục nào)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
