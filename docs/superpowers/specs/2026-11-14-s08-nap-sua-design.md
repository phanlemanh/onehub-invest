# s08-nap-sua — sửa hồi quy bộ nạp S08 khi DB thiếu migration 094

Hồ sơ: `_acceptance/s08-nap-sua/` · hạng T2 · làn máy thông · gốc: mục Ngoài-1 Cổng Bằng chứng của
`stg-du-an-s08` (Mạnh «mở hợp đồng mới», 13/11), giao ZCode sửa (1311-2), Claude đưa vào main.

## Vấn đề

`pipeline/import-airbnb.mjs` hoãn cả lượt nạp (ROLLBACK, không đánh dấu snapshot) khi DB chưa có bảng
`stg_s08_project` (migration 094). Điều kiện hoãn viết là `coS08DanhMuc` — đúng với MỌI snapshot của nguồn
`s08-danh-muc` — nên snapshot chỉ có căn (`inventory_unit`) cũng bị huỷ, dù phần căn không cần 094. Máy
thu chưa áp 094 thì mọi lượt thu S08 mất im lặng: căn không vào `stg_s08_inventory`, snapshot không được
đánh dấu để nạp lại.

## Cách sửa (ZCode, b4414c4f — đưa nguyên bằng cherry-pick)

Điều kiện hoãn đổi thành `coCatalogS08 && !coBang094`: chỉ snapshot CÓ item `project_catalog` mới hoãn;
snapshot chỉ căn đi đường nạp căn thường và được đánh dấu như trước #440. Test
`pipeline/tests/s08-danh-muc-nap.test.mjs` áp chính tệp `db/migrations/094_stg_s08_du_an.sql` (bỏ DDL chép
tay), chặn DB máy thu, thêm ca S08-3 đối chứng dương cho snapshot chỉ căn.

Phần Claude thêm: xếp tệp test vào nửa `a` của `pipeline/test-nua.json` (hợp hai nửa phải bằng tập
`npm test`, `scripts/chia-nua.test.mjs` canh), sửa một dòng chú thích đầu tệp test cho khớp, khai bốn
executor trong `_acceptance/config.yaml`.

## Ranh giới làn

Logic thu/nạp là làn ZCode. Hồ sơ này không viết lại logic; lỗi logic tìm thấy trong lượt chấm trả ZCode
qua liên làn (`tin MỞ LẠI`), không sửa ở đây.

## Giới hạn đã biết

Trên CI, `db-thu.sh` không có container nên chạy lệnh không kèm `DATABASE_URL`; tệp test tự bỏ qua. Ba ca
S08 chỉ được đo ở lượt chấm trên máy (DB thử riêng), không ở CI.
