# Bản phạm vi — tin-tuc-thoi-2411

Tin rao tới Invest gần thời gian thực. Thước đích Mạnh chốt 24/11 («Theo đề xuất»), đo từ lúc đăng tới lúc hiện trên Invest
theo ngày: S03 p50 ≤ 15′, p90 ≤ 60′; S06 p50 ≤ 30′, p90 ≤ 2 giờ. Thiết kế: `docs/research/tach-zcode-nhieu-phien-2411.md`.

<!-- <<<PHAM-VI-MA -->
```
dot: tin-tuc-thoi-2411
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/dot/tin-tuc-thoi-2411.md#3914441459c65e017c20bd1167635e62db3d2bb8

- `TT1` — lệnh đo độ trễ từ lúc đăng tới lúc hiện trên Invest theo nguồn và theo ngày (p50, p90), đỏ khi vượt thước đã chốt
- `TT2` — đọc gộp S03 chạy liên tục theo lô nhỏ 24/7, đứng trên đọc song song HT6
- `TT3` — transform phần mới theo lô 2–5′, 24/7 (bước nạp thuộc làn thu)
- `HT10` — cloud đẩy phần mới theo updated_at mỗi 1–2′, có trần thời gian
- `TT4` — người dùng Invest lưu một tìm kiếm và nhận báo khi có tin mới khớp; kênh báo là câu hỏi của Cổng Phạm vi
- `TT5` — tích hợp bộ thu đuôi S06 của làn thu (ZT)
- `TT6` — tích hợp lõi lịch thu đuôi của làn thu (ZV)
```
<!-- PHAM-VI-MA>>> -->
