# Kế hoạch HT30 — dòng «ca dữ liệu thật» nêu lần đỏ mới nhất

| # | Việc | Tệp | Kiểm từng việc | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | Test viết trước: ma trận trạng thái sổ (ca HT30-AC-1…4, tên ca 1·3·4, dòng hỏng, thiếu ca_do, duongSo ngoài kho) + chiều đỏ bản sao | scripts/pipeline-that-hang-ngay.test.mjs | ca mới đỏ trên mã cũ | E1–E4 | false |
| 2 | dongDuLieuThat đọc dòng cuối + dòng xanh cuối, nhánh đỏ mới hơn / chỉ đỏ / không đọc được; duongSo trả null khi git lỗi | scripts/suite-neu-doi.mjs | `node --test scripts/pipeline-that-hang-ngay.test.mjs` xanh; ca S4V-AC-2/3/5/6, HT9-E4/E5 của suite-neu-doi.test.mjs xanh | E1–E4 | false |
