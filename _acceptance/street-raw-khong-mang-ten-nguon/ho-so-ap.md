# Hồ sơ áp PL39 street-raw-khong-mang-ten-nguon lên DB máy thu

Không migration, không lượt ghi tay. Luật nằm trong `pipeline/transform-chotot.mjs`; sau khi PR gộp và checkout chính `git pull
--ff-only origin main`, lượt `chotot-daily` kế tiếp (bước `transform-chotot`) tự áp. Không lên cloud trực tiếp: cloud nhận kết quả
qua lượt `cloud-sync` kế tiếp như mọi ngày.

## 1. Lệnh áp

Không có lệnh riêng. Lượt đêm `scripts/chotot-daily.sh` chạy `node pipeline/transform-chotot.mjs` từ checkout chính.

## 2. Số chạy thử (bản chép DB máy thu 25/11, `probes/ban-chep.sh`, lượt 4)

- DB máy thu 25/11 sau khi GS gỡ tay ô sự cố (09:13Z): 0 ô, 0 phát biểu sống đường/toà S06 trúng bộ dò (`probes/s1/quet.mjs`,
  `probes/s1/phat-bieu.mjs`). Lượt đêm đầu tiên vì thế kỳ vọng dòng log «ô chữ mang tên nguồn: bỏ ghi street_raw 0 · block_raw 0 ·
  phuong_raw 0 · district_raw 0 · rút 0 chủ thể (trần 50)», trừ khi nguồn trả tin mới mang tên.
- Trên bản chép có cấy: bỏ ghi street_raw 2 · block_raw 2 · phuong_raw 1 · district_raw 1 · rút 2 chủ thể; 3 ô tin có sẵn đổi
  (2 về NULL, 1 về phát biểu sạch); bộ soát sync-cloud qua ba bảng.

## 3. Sao lưu trước khi áp

Không cần bản sao lưu riêng: luật không xoá dòng; phát biểu rút giữ nguyên dòng (`retracted_at`, `retract_reason = 'mang-ten-nguon'`).
Bản sao lưu đêm thường lệ của máy thu vẫn chạy.

## 4. Cách lùi

Revert commit của PR rồi `git pull` ở checkout chính. Phát biểu đã rút vì luật lấy lại được bằng một câu có lời riêng (đổi dữ liệu):
`UPDATE field_assertions SET retracted_at = NULL, retract_reason = NULL WHERE retract_reason = 'mang-ten-nguon' AND …`, rồi
`SELECT resolve_offer_fields(<các tin>)`. Lùi như vậy thì tên nguồn quay lại cột và sync-cloud dừng lại — chỉ làm khi luật che nhầm.

## 5. Lệnh kiểm sau khi áp

- Log lượt `chotot-daily` (bước transform-chotot) có dòng «ô chữ mang tên nguồn: bỏ ghi … · rút … chủ thể (trần 50)».
- Lượt `cloud-sync` kế tiếp in «sync xong», không còn «giá trị mang định danh nguồn (tầng A)».
- `DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest node _acceptance/street-raw-khong-mang-ten-nguon/probes/s1/quet.mjs`
  → `o_trung` chỉ còn ô `seller_name` (sync đã che khi gửi).

Áp xong báo số thật cạnh số chạy thử. Lệch thì dừng và báo, không tự sửa cho khớp.
