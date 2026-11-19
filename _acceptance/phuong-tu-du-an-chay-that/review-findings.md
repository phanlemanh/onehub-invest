# Review findings: phuong-tu-du-an-chay-that (round 1)

## Trong hợp đồng

- **Ô «nhiều dự án» của ma trận AC-5 đạt mà không có tin nào (0 tin), trong khi ma-tran-o.json ghi 4 và 8 tin lúc đo**
  file: `_acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.mjs:139`
  severity: medium
  AC: AC-5
  source: conventions
  detail: Chế độ `ma-tran` chấm từng ô bằng `kt(lech.length === 0, ...)`, nên ô có 0 tin vẫn tự đạt. so-chay-thu.md ghi hai ô `tinh-nhieuduan-theco` và `trong-nhieuduan-theco` đều là 0 tin, «chưa đo trên dữ liệu thật». Trong khi đó ma-tran-o.json ghi so_luc_do 4 và 8, và gap-probe/card-plain khẳng định nhóm nhiều dự án «đã viết trước ma trận» để có phép đo riêng. Nghĩa là AC-5 cho hai ô này đạt mà thực ra không đo gì. Hai số còn lệch nhau theo cách phân loại: ma trận đếm lúc soát là 4/8, còn probe đếm qua count(DISTINCT fa.value) ra 0. Theo luật bảng phủ ca (AGENTS «số trong ô đếm từ DB máy thu»; ô bỏ thì ghi «ngoài phạm vi, vì»), ô 0 tin phải hoặc làm probe đỏ / bắt buộc có ca fixture riêng, hoặc được khai ngoài phạm vi. Không nên để đạt âm thầm. Ngoài ra, phần expected của E5 trong evals.yaml vẫn ghi «20 tin lệch thẻ», «10 tin đổi tỉnh», trong khi số đo hiện là 19 và 9.

- **Hình dạng 5 (quét lớp, đếm assert giả): «số assert bằng số ô» là phép so tự đúng**
  file: `_acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.mjs:141`
  severity: high
  AC: AC-5
  source: measurement
  detail: Ở chế độ ma-tran, `soAssert += 1` chạy đúng một lần trong mỗi vòng `for (const o of M)`, rồi `kt(soAssert === M.length, ...)`. Phép so này luôn đúng, kể cả khi ma trận thiếu ô hay probe phân ô sai. E5 hứa «Số assert bằng số ô của ma-tran-o.json» (mẫu P105), nhưng ở đây số assert được sinh ra từ chính danh sách ô, không đếm độc lập. Probe cũng không đối chiếu tổng số tin phân vào 13 ô với tổng tin S03 (7.724), nên không chứng minh ma trận phủ hết lớp.

- **Hình dạng 4/5 (âm tính một mình, phủ lớp bằng điểm-case): ô rỗng tự xanh, tin ngoài 13 ô không được kiểm**
  file: `_acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.mjs:139`
  severity: high
  AC: AC-5
  source: measurement
  detail: `kt(lech.length === 0, ...)` chỉ kiểm rằng không có tin lệch. Probe không kiểm số tin trong ô (`tin.length`) với `so_luc_do`, cũng không đòi `> 0`. Nếu SQL_O phân ô sai, ô rỗng và vẫn xanh. AC-5 hứa «0 tin vốn có cột cấp phường bị đổi», nhưng không có phép kiểm chung nào trên mọi tin `o_cot = 'phuong'`. Probe chỉ kiểm qua hai ô `phuong-motphuong-khongthe` và `phuong-khongduan-khongthe`. Tin cột phường rơi vào tổ hợp không có trong ma-tran-o.json (ví dụ thẻ «trung», «co», dự án «nhieu») sẽ không bị lọc vào ô nào, nên đổi cột cũng không đỏ.

- **Hình dạng 3 (đo một con số trong khi lời hứa là quan hệ): AC-3 «0 chèn, 0 rút, 0 phân xử» chỉ đo bằng số dòng sống ròng**
  file: `_acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.mjs:92`
  severity: high
  AC: AC-3
  source: measurement
  detail: Ở chế độ chay-lai, probe dùng `kt(await soSong() === n1, ...)` để chứng minh lần hai không chèn, không rút. Nhưng rút 1 rồi chèn 1 vẫn cho số ròng bằng n1. Kết quả JSON `kq` được parse nhưng bị bỏ (`void kq;`, dòng 99). Ở chế độ --json, lệnh chỉ log `dem`, không log `chen/rut/tin`, nên 0 chèn, 0 rút, 0 tin phân xử lại không được đo. Lời hứa «mọi tin đã nhận phường vẫn giữ phường» cũng chỉ đo bằng tổng đếm `p2.co >= p1.co` (dòng 94), không so theo từng tin. Tin A mất phường trong khi tin B nhận phường vẫn xanh.

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): AC-6 kiểm sao-luu.sh, kiem-sau.sql bằng cách xem tệp có rỗng không**
  file: `_acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.mjs:151`
  severity: medium
  AC: AC-6
  source: measurement
  detail: AC-6 ghi «When chạy trên DB thử theo thứ tự sao lưu, áp, kiểm sau, lùi». Probe ap-lui chỉ `readFileSync(...).trim().length > 0` cho README.md, sao-luu.sh, kiem-sau.sql, so-chay-thu.md. sao-luu.sh và kiem-sau.sql không bao giờ được chạy. Probe chỉ thực thi lui.sql. Vì vậy một sao-luu.sh hỏng (ví dụ sai tên container, sai cột) vẫn xanh. Phần hứa «hồ sơ lùi kê lệnh chạy lại hạng giá và lệnh kiểm bản cloud» cũng không có assert nào.

- **Hình dạng 4 (âm tính một mình): danh sách tin đổi tỉnh trong so-chay-thu.md xanh khi tập rỗng**
  file: `_acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.mjs:146`
  severity: medium
  AC: AC-5
  source: measurement
  detail: `kt(thieu.length === 0, ...)` với `thieu = doiTinh.filter((x) => !sct.includes(x.offer_id))`. Probe không đối chứng dương rằng `doiTinh.length` bằng 10 (con số AC-5 nêu) hay ít nhất > 0. Nếu SQL_O hoặc điều kiện `sau.get(x.offer_id) === x.p` không bắt được tin nào, phép kiểm vẫn xanh. Ngoài ra `sct.includes(offer_id)` chỉ là chuỗi có mặt ở bất kỳ đâu trong tệp, không kiểm cặp tỉnh cũ → tỉnh mới đi kèm.

- **Hình dạng 3 (chuỗi có mặt thay cho số khớp phép đo): AC-7 chỉ dò dòng «- Khoá: \S» trong so-chay-thu.md**
  file: `_acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.mjs:226`
  severity: low
  AC: AC-7
  source: measurement
  detail: Probe tính `p0/p1/w0/w1` và `r1.giay` nhưng chỉ in ra (dòng 221-222), không so với số ghi trong so-chay-thu.md. Phép kiểm `new RegExp(`^- ${k}: \S`, "m")` xanh với bất kỳ chữ nào sau dấu hai chấm (ví dụ «chưa đo»), nên «thiếu một số thì eval đỏ» không được bảo đảm. Probe cũng không kiểm được quan hệ giữa số ghi trong tệp và số đo trên DB thử.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chốt --noi-tiep đọc ngoài giao dịch, không khoá: lui.sql chạy xen lượt nạp 15′ bị ghi đè lặng lẽ và chuỗi tiếp tục ghi**
  Người dùng thấy gì: Nếu phải lùi việc gán phường đúng lúc lượt nạp tự động đang chạy, lần lùi có thể bị ghi đè mà không báo lỗi và phường lại được gán lại cho các tin.
  Căn cứ: Chỉ xảy ra khi lùi trùng đúng lúc nạp tự động, hiếm gặp, và dặn dừng lượt nạp trước khi lùi là đủ để tránh; dữ liệu gốc không mất.
  file: `pipeline/scripts/phuong-tu-du-an.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
