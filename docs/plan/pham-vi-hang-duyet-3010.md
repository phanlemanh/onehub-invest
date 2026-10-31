# Bản phạm vi — Hàng duyệt ghép căn (30/10)

> Nguồn: `docs/research/audit-hang-duyet-3010.md` §5 và §7 (quyết định của Mạnh 30/10). Chưng cất ở trang tri thức
> `chu-de/hang-duyet-ghep-can.md`. Gộp trùng với `docs/research/audit-bang-nguoi-sdt-3010.md` (#216).
> Nguồn gọi bằng mã: S03 nhóm chat cộng đồng · S05 nhóm mạng xã hội · S06 rao vặt công khai.
>
> Ba đợt Mạnh duyệt (ghi ở `nhom` của hàng):
> - **Đợt 1** (`hang-duyet-dot1`): dãy P3 `HD1` → `HD2`, `HD3`, `HD4`; song song dãy P1 `HD5`.
> - **Đợt 2** (`hang-duyet-dot2`): dãy U1 tuần tự `HD6` → `HD7` → `HD8`.
> - **Đợt 3** (`hang-duyet-dot3`): `HD9`, `HD10`, `HD11`; làn ZCode `HD12` → `HD13`.
>
> Gộp trùng với #216: `nguoi-noi-theo-sdt` (HD13) gánh cả `gop-nguoi-sdt-tai-khoan`; `s06-thu-sdt` lấy tên
> `s06-sdt-theo-tin` của #216 (HD12). Dạng khoá SĐT chưa quyết — theo Hỏi-A #216. Bốn hàng còn lại của #216
> (`sellers-theo-danh-ba`, `boc-sdt-du-va-chon-ro`, `people-hien-so-goc`, `do-danh-ba-sdt`) không cắt ở đây.
>
> Việc của người, ra khỏi kho (liệt ở mô tả PR):
> - kiểm lượt đêm 31/10 sau sửa lỗi nạp NUL (H6, đã sửa ở main);
> - Mạnh quyết nạp lại credit S05 (điều kiện mở HD14);
> - Mạnh quyết dạng khoá SĐT (Hỏi-A #216, điều kiện mở Cổng Phạm vi của HD12, HD13).

<!-- <<<PHAM-VI-MA -->
```
dot: hang-duyet-3010
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/chu-de/hang-duyet-ghep-can.md#e02a9b3cd0d995c8c8045119584ea278658de6a1

- `HD1` — bộ đánh giá ghép căn ghi evidence đủ mười trường của bảng so
- `HD2` — luật loại trừ tất định theo đặc trưng nhà (số nhà, phòng ngủ, diện tích, ngang×dài, tầng, toạ độ)
- `HD3` — thẻ ghép căn có một bên rời kho tự rút khỏi hàng duyệt
- `HD4` — seller_ref S03/S05 theo người gửi, không còn hằng
- `HD5` — đặc trưng nhà S06 lên canonical qua phát biểu trường
- `HD6` — bảng so trên thẻ đọc giá trị sống, «chưa biết» không tính là lệch
- `HD7` — thẻ hiện người đăng của mỗi tin
- `HD8` — quyết xong tự sang thẻ kế
- `HD9` — quyết định chỉ ghi khi chạm đúng một ứng viên còn sống
- `HD10` — ảnh S06 đi qua máy chủ cho vai ops trên cloud
- `HD11` — scorecard đêm đo tỉ lệ thẻ chờ có đủ dữ liệu hai bên
- `HD12` — collector S06 thu SĐT người đăng theo tin, dạng khoá theo Hỏi-A #216 (làn ZCode)
- `HD13` — danh bạ Người gộp theo SĐT, cùng nguồn rồi khác nguồn
- `HD14` — tải lại ảnh S05 (chờ: S05 tạm không nạp credit)
- `HD15` — mô hình thị giác so ảnh cặp ghép căn (chờ: chưa đủ cặp có nhãn)
- `HD16` — proxy ảnh tin chỉ phục vụ jpeg/png/webp/gif, chặn SVG, mọi phản hồi ảnh mang nosniff + CSP sandbox (Ngoài-1+3 của HD10)
```
<!-- PHAM-VI-MA>>> -->
