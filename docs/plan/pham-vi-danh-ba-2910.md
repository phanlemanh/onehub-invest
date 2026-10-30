# Bản phạm vi — Danh bạ vật thể và người, ba đợt code của ADR-0016 §10 (29/10)

> Nguồn: `docs/adr/0016-danh-ba-vat-the-va-nguoi.md` §10 (Mạnh duyệt ADR 27/10), chưng cất ở trang tri thức
> `chu-de/danh-ba-vat-the-nguoi.md`. Đợt 0 (chính ADR, T1 docs) đã giao; Đợt 3 (nối thửa ↔ toà nhà phố, cấp phòng, khu
> thị trường, gộp người liên nguồn) không cắt ở đây vì ADR ghi nó chờ nguồn số nhà/số thửa, câu hỏi sản phẩm hoặc SĐT
> S06 — chưa có điều kiện nào. Giao cắt theo «Duyệt cả 8» của Mạnh 29/10, hàng P3 `cat-luot-adr-0016`.
>
> - Đợt 1 **thay PL11**: không kéo `asset_nodes` xuống trục/căn.
> - Đợt 2 **thay PL24**: resolver mới thay `resolve-properties.mjs`.
> - PL11 và PL24 ra khỏi hàng, sang mục chờ điều kiện của đợt `phan-loai-2310`, giữ mã C1.5 và C3.2a.
>
> Nguồn gọi bằng mã S0x. Không có việc của người trong đợt này. Hai bước vận hành nằm ngoài kho:
> - nạp S08 thật (ZC8, làn ZCode);
> - xin số migration ở phiên điều phối liên làn.
>
> Cả hai là điều kiện mở hàng, không phải mã của đợt.

<!-- <<<PHAM-VI-MA -->
```
dot: danh-ba-2910
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/chu-de/danh-ba-vat-the-nguoi.md#61f240814989275036321358eb2c2afe51063444

- `DB2b` — Họ Người theo từng nguồn: parties + party_roles + bí danh tài khoản tại nguồn, vai người đăng có phát biểu, thay bảng sellers cũ; không gộp người liên nguồn
- `DB1` — khung chung (khoá mờ, trạng thái, bí danh, sự kiện, UPI neo toà) + toà · trục · căn Ocean Park 1 dựng từ danh mục S08 và phát biểu toà/mã căn trên tin; thay PL11
- `DB2` — nhà phố, đất thành vật thể tạm, gộp khi có bằng chứng; tin P1 và listing thuê ngắn hạn gắn vật thể; properties thành view; thay PL24
```
<!-- PHAM-VI-MA>>> -->
