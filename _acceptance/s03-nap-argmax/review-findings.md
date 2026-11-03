# Review findings: s03-nap-argmax (round 3)

## Trong hợp đồng

Không có finding nào map được vào AC.

Phần đổi từ vòng 2: chỉ `scripts/nap-argmax.test.mjs` (thêm bốn ca chạy trọn script); ba tệp script không đổi từ `92ee45c4`. Soát bốn ca mới: ROOT, HOME và node giả đều nằm trong thư mục tạm, `PATH` chỉ `/usr/bin:/bin`, `DATABASE_URL` trỏ tên không tồn tại, không chạm `$HOME` thật, DB hay `collector/snapshots`. Khoá và state đọc lại sau khi script thoát, nên bắt được việc quên gỡ khoá. Hai đột biến (bỏ `trap`, đổi `exit 3` thành thoát 0) đều làm ca chạy trọn đỏ.

Ghi nhận mức thấp từ vòng 2, vẫn đúng, không đổi verdict:
- Khi danh sách rỗng và chưa có state, `printf '%s\n' "$DS_DIR"` đưa một dòng trống vào vòng lọc, nên stderr in «bỏ qua thư mục TS không phải mốc thời gian:» với đường dẫn rỗng. Chỉ nhiễu log ở lần chạy đầu trên cây rỗng; vòng `for` ngay sau nhánh rỗng ở `zalo-import-daily.sh` dòng 90–95 và `apify-facebook-daily.sh` dòng 110–115. severity: low.
- `apify-facebook-daily.sh` chạy bước thu trước nhánh danh sách rỗng, nên thoát 3 xảy ra sau khi lượt thu đã chạy; không mất dữ liệu, thứ tự cũ. severity: low.

## Ngoài hợp đồng — người quyết ở Gate 2

Không có finding nào.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
