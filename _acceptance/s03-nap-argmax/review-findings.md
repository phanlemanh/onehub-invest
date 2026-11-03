# Review findings: s03-nap-argmax (round 2)

## Trong hợp đồng

Không có finding nào map được vào AC.

Soát phần đổi từ vòng 1 (`git diff 8b037cf2 92ee45c4 -- scripts/`): khối 7 dòng giống hệt ở cả hai script, hai ca mới, mốc cắt khối so sánh dời về `TS_RE=`. Ba lệnh kiểm riêng cho phần đổi:
- Bốn đột biến trên bản sao (bỏ nhánh rỗng, đảo điều kiện lần đầu, lệch `TS_RE`, đưa lại `ls -1d`) đều có ca đỏ, kể cả lệch `TS_RE` mà vòng 1 không bắt.
- Chạy trọn bản sao từng script ở ROOT tạm có thư mục snapshot rỗng và state có mốc: thoát 3, state giữ từng byte, khoá đã gỡ, không bước nạp nào được gọi.
- Chạy cùng cây rỗng mà không có state: không thoát 3.

Ghi nhận mức thấp, không phải lỗi chức năng và không đổi verdict:
- Khi danh sách rỗng và chưa có state, `printf '%s\n' "$DS_DIR"` đưa một dòng trống vào vòng lọc, nên stderr in «bỏ qua thư mục TS không phải mốc thời gian:» với đường dẫn rỗng. Chỉ nhiễu log ở lần chạy đầu trên cây rỗng; vòng `for` ngay sau nhánh rỗng ở `zalo-import-daily.sh` dòng 90–95 và `apify-facebook-daily.sh` dòng 110–115. severity: low.
- `apify-facebook-daily.sh` chạy bước thu trước nhánh danh sách rỗng, nên nhánh thoát 3 xảy ra sau khi lượt thu đã chạy; không mất dữ liệu, chỉ là thứ tự cũ. severity: low.

## Ngoài hợp đồng — người quyết ở Gate 2

Không có finding nào.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
