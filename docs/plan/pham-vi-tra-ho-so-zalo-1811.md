# Bản phạm vi — tra hồ sơ Zalo từ SĐT người bán (18/11)

Lời Mạnh ở phiên điều phối liên làn, 18/11 04:11Z, ba câu riêng (nguyên văn ở ROADMAP §3 mục 55 và sửa đổi ADR-0007 ngày
18/11). Trang tri thức của đợt ở kho tri thức riêng. Làn thu đề xuất ở tin BÁO zcode-1811-2: dịch vụ tra cứu độc lập trên máy
thu, một tài khoản Zalo riêng chỉ tra không chat; 13.730 SĐT người bán distinct trên tin rao.

Việc của làn thu đi kèm, không thành hàng: lớp kiểm lockdown cho tài khoản tra cùng đoạn runtime-map (tin claudedp-1811-10,
chỉ nháp, chưa cài); client và job tra theo nhịp; bộ nạp stg theo DATA-CONTRACT mới. Không lượt tra thật nào trước khi lớp kiểm
lockdown chạy trên máy thu và runtime-map đã ghi.

<!-- <<<PHAM-VI-MA -->
```
dot: tra-ho-so-zalo-1811
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/dot/tra-ho-so-zalo-1811.md#1cfad74fe003806b00da262bad69ea7ca17f2aa5

- `Z1` — kết quả tra hồ sơ Zalo của SĐT người bán nạp vào stg qua migration 116, nối vào danh bạ Người theo SĐT E.164 bằng phát biểu có căn cứ; ngày sinh, giới tính chỉ ở máy thu
- `Z2` — API service tra hồ sơ Zalo theo SĐT cho các ứng dụng họ onehub
```
<!-- PHAM-VI-MA>>> -->
