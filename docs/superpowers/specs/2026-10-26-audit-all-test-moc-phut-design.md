# audit-all-test-moc-phut — ghim mốc phút trong hộp test audit-all

Hàng P4 của đợt dieu-phoi-dot0-cam-mau (giám sát thêm 26/10 ~06:25Z), test chập chờn thứ ba.

## Vấn đề

`scripts/audit-all.sh` in dòng tiêu đề ` AUDIT TOÀN DIỆN ONE INVEST — $(date '+%Y-%m-%d %H:%M')`. Hai ca của
`scripts/audit-all.test.mjs` chạy audit hai lượt rồi so đầu ra từng dòng:

- dòng 334 «ON16-AC-2 kết quả từ worktree trùng lần chạy ở checkout chính» — `deepEqual` mọi dòng;
- dòng 346 «ON16-AC-2 script main từ worktree → khác ở mục A1» — mọi dòng khác phải là A1 hoặc TỔNG KẾT.

Hộp test đặt `PATH=<bản giả>:/usr/bin:/bin`, nhưng chưa có bản giả `date`, nên dòng tiêu đề đọc đồng hồ thật. Hai lượt
vắt qua ranh giới phút thì dòng tiêu đề lệch và cả hai ca đỏ (CI #116, run 40278986279).

## Cách sửa

Thêm bản giả `date` vào `FAKES` của tệp test (cùng chỗ với docker/curl/launchctl/security):

- gọi đúng một đối số `+%Y-%m-%d %H:%M` → in mốc ghim `2026-10-23 09:00` (ngày của bản chụp launchctl);
- mọi lời gọi khác → `date` thật (`PATH=/usr/bin:/bin exec date "$@"`), để chỗ nào sau này cần giờ thật vẫn đúng;
- ghi `date <đối số>` vào nhật ký lời gọi như mọi bản giả.

Thêm một ca canh «dòng tiêu đề mang mốc ghim» — mọi lượt audit trong hộp có dòng tiêu đề đúng mốc ghim và bản giả
`date` được gọi. Không sửa `scripts/audit-all.sh`.

### Lối đã loại

- **Ghim bằng biến môi trường trong audit-all.sh** (`AUDIT_NOW`): phải sửa script sản phẩm; hàng chỉ có ranh giới
  `scripts/audit-all.test.mjs` và giám sát giao «không đổi hành vi audit-all».
- **Lọc dòng tiêu đề khi so**: hai ca vẫn đọc đồng hồ thật, và thước mù với mọi lệch thật ở dòng tiêu đề; mỗi phép so mới
  sau này phải nhớ lọc lại.

## Đo

- Đối chứng qua ranh giới phút (AC-2): bản sao tệp test chèn một `date` «nhảy phút» (mỗi lần gọi tăng một phút) vào PATH
  ngay sau thư mục bản giả. Bản của main 53e2b83b gọi tới nó → hai ca ON16-AC-2 đỏ, đầu ra nêu dòng «AUDIT TOÀN DIỆN»;
  bản sửa có `date` ghim đứng trước → xanh, `date` nhảy phút không được gọi lần nào.
- Lặp (AC-3): cả tệp 12 lần liên tiếp, 0 ca đỏ.
- Ca canh có cặp hai chiều (AC-1): gỡ bản giả `date` khỏi bản sao → ca canh đỏ với thông điệp ghim.
- Phạm vi (AC-4): diff chỉ có tệp test + hồ sơ + cấu hình + tệp máy sinh + dòng ghim lại của hồ sơ khác.

## Ảnh hưởng hồ sơ khác

`scripts/audit-all.test.mjs` nằm trong `paths` của `audit-all-noi-that` và `audit-all-doc-log-o-checkout`; PR này ghim
lại hai hồ sơ đó bằng làn máy (lượt `ghim-lai` của đợt).
