# Thiết kế: chặn dò bí danh qua ô tìm với vai Người xem (che-tim-bi-danh-viewer)

Hồ sơ: `_acceptance/che-tim-bi-danh-viewer/` · hạng T2 · dãy U1 · nguồn: Ngoài-1 và Ngoài-3 của
`danh-ba-nguoi-tren-ops` — Mạnh chọn «mở hợp đồng mới» khi ký Cổng Bằng chứng 30/10
(`_acceptance/danh-ba-nguoi-tren-ops/decisions.jsonl` `d-20261030T154441Z-15`, `-17`).

## Vấn đề

`/ops/people` che giá trị bí danh (tên, tài khoản, SĐT băm) với vai Người xem, nhưng ô tìm `?q=` vẫn lọc trên giá trị
bí danh thô cho mọi vai. Viewer gõ dần «a», «ab»… rồi nhìn «m người khớp» và mã người trả về là dựng lại được giá trị đã
che — kể cả tên nguồn thật nằm trong tên một người bán S06.

## Cách làm

- `PeopleContent`: vai không xem được bí danh (`!xemNoiDungTin(user)`) thì bỏ `q` trước khi gọi `danhSachNguoi` — danh
  sách như khi không tìm. Lọc nguồn `?source=` và phân trang vẫn chạy.
- `PeopleView` nhận cờ `coTim`; `PeopleFilter` chỉ vẽ ô tìm và nút Tìm khi `coTim`. Viewer chỉ còn chọn nguồn.
- Chặn ở máy chủ là chốt thật; ẩn ô tìm chỉ để giao diện không mời viewer gõ thứ không có tác dụng.

## Phương án đã loại

- **Chỉ ẩn ô tìm** — viewer vẫn gõ tay `?q=` lên URL; không chặn được.
- **Cho viewer tìm theo mã người `pty_…`** — mã đã hiện sẵn trên trang, không cần ô tìm; thêm đường lọc mới ngoài phạm vi.

## Ngoài phạm vi

- Thay đổi quyền xem bí danh của vai Vận hành trở lên.
- Hiện số điện thoại gốc (câu hỏi riêng của Mạnh — hàng khác nếu mở).
