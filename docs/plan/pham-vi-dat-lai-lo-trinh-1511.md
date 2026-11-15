# Bản phạm vi — Đặt lại lộ trình 15/11: S03 làm lõi, sáu mốc, mười một lát

> Nguồn: phiên rà soát 15/11 đọc toàn bộ lộ trình (312 hàng, 75 mã chờ điều kiện, 10 mốc), việc nợ ngoài lộ trình và việc làn
> thu, rồi trình chủ kho hai lần trong ngày (khung mục tiêu, bản lộ trình cũ ↔ mới); chủ kho «Chốt» cùng ngày. Tóm ở kho tri
> thức riêng, trang `wiki/dot/dat-lai-lo-trinh-1511.md`. Quyết định: ROADMAP §3 mục 51 (S03 làm lõi, bối cảnh nhóm là mặc
> định), mục 52 (bỏ Kev), mục 53 (đặt lại lộ trình). Nguồn gọi bằng mã.
>
> **Mục tiêu**: chọn một dự án, xuống tới toà và tầng, và thấy căn hộ nào giá tốt nhất theo tin S03, đặt cạnh mặt bằng S06.
> **Thước**: tỉ lệ tin S03 đang rao có địa chỉ tới dự án, tới toà, và có hạng giá ở cấp đó trên màn. Sáu mốc MS1–MS5 và MSV,
> mỗi mốc một con số trên màn; mười một lát là giá trị `nhom` của hàng (`l01-…` tới `l11-…`); việc nền ở `nen-giu-nha`.
>
> **Bản này chỉ mang mã của việc MỚI** (mục tiêu cần mà lộ trình chưa có, và việc nợ ngoài lộ trình). Phần xếp lại hàng có sẵn
> làm trong cùng PR, không mang mã của bản này: 72 hàng giữ đổi `nhom` theo lát; 61 hàng hoãn và 8 hàng gộp chuyển thành mục
> chờ điều kiện; 5 hàng và 16 mã chờ bị bác vào `da_bac`; 29 hàng nền đổi `nhom`; mười mốc cũ thay bằng sáu mốc mới; hàng
> phải sửa lời mang ghi chú «Đặt lại lộ trình 15/11». Hàng đã xong không đổi.
>
> **Không vào bản phạm vi** (việc của người hay việc vận hành — liệt «Ra khỏi kho» ở mô tả PR): đội vận hành duyệt thẻ địa chỉ
> nhóm; lời áp lên DB máy thu sau mỗi lần gộp; khởi động lại gateway và gỡ plist khi gỡ Kev; nạp ví cổng model; đăng nhập
> lại S02; phiên nghiệm thu gom cho các hàng đang chờ; dọn DB thử và worktree cũ; quyết định về model đọc ảnh.

<!-- <<<PHAM-VI-MA -->
```
dot: dat-lai-lo-trinh-1511
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/dot/dat-lai-lo-trinh-1511.md#b00cddc4283afe255830157060caff31141d3f18

- `R1` — một nguồn «dự án của tin» cho mọi nguồn và nối ô Định vị (việc đang chạy, chưa có hàng)
- `R2` — thẻ địa chỉ cho mọi nhóm S03: máy dựng nháp, người vận hành nhận, sửa hay bác
- `R3` — đóng dấu dự án, phường, phân khu, bán hay thuê từ thẻ nhóm lên tin S03 ở lượt nạp
- `R4` — độ lệch giá S03 so mặt bằng S06 cùng dự án, hiện cạnh hạng của tin
- `R5` — danh bạ toà, trục cho dự án của nhóm S03 chưa có toà
- `R6` — gỡ Kev khỏi hook nhận tin S03 và mọi chỗ nhắc Kev
- `R7` — đường gọi model thẳng nhà cung cấp song song cổng model (việc đang chạy, chưa có hàng)
- `R8` — sổ số mốc trên màn theo ngày, thước đầu-cuối của các mốc
- `R9` — sửa bước bóc số nhà của bộ tách ô đường và dời probe dữ liệu thật (việc đang chạy, chưa có hàng)
- `R10` — đọc m² của bài thuê S03 mà chữ có ghi nhưng bộ đọc bỏ sót
- `N1` — migration chỉ tạo view hay hàm được xếp T2
- `N2` — cổng Ops ở máy thu chạy cố định dưới launchd
- `N3` — các ca kiểm đang đỏ trong sổ giám sát xanh lại hoặc khai bỏ có tên
- `N4` — suite của app không còn ca đọc dữ liệu thật; bản chép DB của lượt không mang bảng dẫn xuất
- `N5` — preview của worktree chạy được khi node_modules là symlink
- `N6` — bộ kiểm tự khởi động DB và lệnh sao lưu DB chạy đúng
- `N7` — tệp test có lệnh phá chỉ chạy trên DB của suite; trả nợ itest của DV1
- `N8` — vá hook của kho: hai mục ngoài hợp đồng còn treo và lỗ symlink
- `N9` — đo độ trễ của cột tin nghỉ
- `N10` — thước của phiên nghiệm thu S03 lên cổng sửa theo trạng thái đã áp
- `N11` — S01 thu theo danh sách ID lấy từ S02, đo thử 100 căn
```
<!-- PHAM-VI-MA>>> -->
