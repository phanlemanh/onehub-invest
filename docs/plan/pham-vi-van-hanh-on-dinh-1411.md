# Bản phạm vi — Vận hành ổn định sau sự cố S03 đứt 34 giờ (14/11)

> Nguồn: tài liệu `docs/ops/de-xuat-van-hanh-on-dinh-1411.md` (§5 hàng việc, §7 việc cần Mạnh quyết) và sáu quyết định Mạnh
> trả lời «Theo khuyến nghị» ngày 14/11 tại phiên điều phối liên làn, ghi ở ROADMAP §3 mục 49; tóm ở kho tri thức riêng, trang
> `wiki/dot/van-hanh-on-dinh-1411.md`. Nguồn gọi bằng mã.
>
> **Thước của đợt**: thời gian từ lúc kênh S03 rơi tới lúc có người được báo (13/11: không ai được báo trong 34 giờ) — đích
> ≤ 35′ qua bộ đẩy, ≤ 90′ qua dead-man khi máy thu chết. Mốc VHM1, thứ tự làm: D1 → D5 → D4 → D2 → D6 → R1 → D8 → O1. Làn thu
> làm song song theo thứ tự D3 → P1 → P3.
>
> **Không vào bản phạm vi** (việc của người — liệt «Ra khỏi kho» ở mô tả PR): P2 quy ước tài khoản thu chỉ gateway dùng và câu
> H1 còn mở; đăng nhập lại S02 (401 từ 13/11); tạo và cất token chỉ-đọc của D2 theo quy trình secret. Phần «Claude điều kiện
> D1» của D7 nằm trong D1 (bộ đẩy đọc dòng chuẩn); mã D7 gánh ở hàng dòng chuẩn của làn thu.

<!-- <<<PHAM-VI-MA -->
```
dot: van-hanh-on-dinh-1411
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/dot/van-hanh-on-dinh-1411.md#eb303dba3f2a1fe94c9b060c3c89011e9284103f

- `D1` — bộ đẩy cảnh báo tới Mạnh ngoài nhóm chat: danh sách điều kiện có tên, khử trùng, nhắc 6 giờ, tự đóng; kênh issue kho riêng tư qua tier-a-guard
- `D2` — dead-man từ cloud: GitHub Actions lịch 30′ đọc mốc facts và health qua route ops chỉ-đọc, mở issue khi facts cũ hay S03 đứt > 60′
- `D3` — L6(d) «DOWN kéo dài» thay chỗ mù của L6(c), heartbeat ghi lý do session hay stopped (làn thu)
- `D4` — Ops cloud hiện đúng S03 từ health trong facts, attention list cloud có «Kênh S03 đứt»
- `D5` — khối liveness tách khỏi SLO độ tươi (SLO 72 giờ của S03 giữ nguyên), check-freshness in thêm một dòng
- `D6` — dọn báo động giả kinh niên: bước đo/đọc model lỗi thành WARN, S10/S11 «chưa thu», S01 «tạm dừng»
- `D7` — dòng chuẩn AUTH FAIL [S0x] khi xác thực nguồn hỏng (làn thu; điều kiện D1 đọc dòng này)
- `D8` — khoá tư vấn chung cho các bước ghi properties, hết deadlock resolve-properties
- `P1` — watchdog tự khởi động lại gateway khi bộ hẹn treo: trần 1 lần mỗi 6 giờ, lockdown xanh, không lượt agent dở (làn thu)
- `P3` — vá gốc bộ hẹn khởi động lại của kênh S03, cài vào runtime gateway theo runtime-map (làn thu)
- `R1` — kiểm sau đăng nhập trên /ops/sources: «bài mới đầu tiên lúc …», nhắc khi 10′ không có bài
- `O1` — RAM và swap vào facts, ngưỡng D1 khi swap > 90% kéo dài
```
<!-- PHAM-VI-MA>>> -->
