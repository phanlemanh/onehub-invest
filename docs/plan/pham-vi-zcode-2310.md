# Bản phạm vi — làn ZCode đang mở và kế tiếp (23/10)

> Nguồn: phiên điều phối liên làn (bảng nhánh + slug 23/10), BOARD `~/dev/onehub-coord/BOARD.md`, kênh issue #9,
> khảo sát «nền & vận hành» + «tồn đọng & hậu kỳ» lượt cắt chung 23/10. Slug hàng = slug hồ sơ ZCode đã có hoặc đã
> đặt trước, để trang lộ trình tự suy trạng thái «đang làm» khi hồ sơ có mặt. Kev thành nhãn đã là PL4
> (`kev-thanh-nhan`), gộp tin ảnh ở transform là PL28 — không cắt lại. N1 (tải ảnh Zalo) đã merge 605a837; phần
> còn lại của N1 nằm trong `VH8`. Lời giao cho ZCode vẫn đi qua phiên điều phối liên làn, mỗi lời giao ghi mã hàng.
> Việc triển khai sau merge (cài plist collector API, job airbnb nightly, hook Kev vào ~/.openclaw) là việc vận hành —
> ở «Ra khỏi kho» của PR và `docs/plan/BOI-CANH.md` §5.

<!-- <<<PHAM-VI-MA -->
```
dot: zcode-2310
dang: lan-va
nguon: onehub-invest-tri-thuc:wiki/dot/zcode-2310.md#10bd301ebaa60dee6d6d9cfe09f20459220ccaa8

- `L20` — tin chỉ có ảnh không trùng sourceId, tin sau không bị bỏ lúc ingest
- `VH7` — collector tắt êm: huỷ tải ảnh theo hạn, flush định kỳ có hạn chót, exit khác 0 khi mất tin, đóng kết nối rỗi
- `VH9` — watchdog Zalo L4a cảnh báo drop-no-mention bất thường, L4b không sót log đầu ngày, phục hồi sau DB sập phía collector
- `VH8` — collector API :9210 và Kev :8009 chạy dưới launchd KeepAlive có plist và script cài trong repo; media_files S03 có dòng thật (N1 thật)
- `VH11` — airbnb-worklist (Task 1/2/3/5/7) vào main, job nightly thay job tuần, ADR-0007 CCP theo CONDUCT_WINDOW
- `TD16` — discovery sharding 65 query cấp quận
- `TD17` — lịch sử LTM AirDNA theo market
```
<!-- PHAM-VI-MA>>> -->
