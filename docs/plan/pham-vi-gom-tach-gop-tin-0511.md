# Bản phạm vi — Gom, tách, gộp tin S03 (05/11)

> Nguồn: khảo sát trên DB máy thu ngày 05/11, chỉ đọc. Mạnh duyệt «Theo khuyến nghị» cả bốn câu cùng ngày. Bản nháp kèm số đo đầy đủ
> ở máy thu, không vào kho. Nguồn gọi bằng mã: S03 nhóm cộng đồng.
>
> **Kết luận.** S03 thiếu một đơn vị «bài đăng» thật giữa sự kiện thô và tin: hệ thống đi thẳng từ từng sự kiện sang tin rồi vá ảnh vào
> sau. Bốn việc, theo thứ tự: khử trùng ảnh, tách bài nhiều căn, lớp bài đăng dùng chung, kiểm định gộp trùng.
>
> **Số đo 05/11, chỉ các tỉ lệ cần cho quyết định.** Trong nhóm tin nhiều ảnh nhất, 82% ảnh là ảnh trùng, vì đăng lại mỗi lần có một URL
> mới mà bảng `media` chỉ khử theo URL; trần 12 ảnh vì thế dễ bị ảnh trùng lấp hết. Đọc S03 sai nặng 4/30 bài, đều là bài nhiều căn,
> khoảng tin cậy 5,3–29,7%. Đọc tay 30 cụm ghép ảnh theo thời gian: 16 đúng, 2 sai, 2 không phán được, 10 không có ảnh để xem; mẫu nhỏ, chỉ
> định hướng. Chưa đo được: tỉ lệ bài nhiều căn, tỉ lệ gộp trùng sai, tỉ lệ ảnh rơi ở khâu thu.
>
> **Quyết định của Mạnh, 05/11.**
>
> | Câu | Chốt |
> |---|---|
> | Làm khử trùng ảnh ngay không | Làm ngay, `GT1` |
> | Lớp bài đăng lưu bảng riêng hay tính lại mỗi lần | Quyết sau khi có câu trả lời của ZCode về mã album và nhóm nhãn đầu tiên |
> | Thứ tự so với `GCQ1` | `PL18` đứng trước `GCQ1`, vì bài nhiều căn là chỗ sai nặng đã đo; `GT2`, `GT4` đứng sau |
> | Thu Nhật ký của S03 | Chưa mở, hỏi ZCode về khả năng trước |
>
> **Hàng có sẵn, không gánh lại:** `PL18` (`e1-e2-theo-lop`, bộ đọc ra mảng căn) chính là việc tách bài nhiều căn. Lượt này chỉ đổi thứ tự:
> `GCQ1` đứng trên `PL18`, `PL18` đứng trên `GC0` vì cần nhãn `multi_unit`. `PL18` là T2 cho bộ đọc; phần ghi vào tin là T3, chốt ở Cổng Phạm vi của hàng.
> `GC0`, `GCQ1`, `GCQ2`, `DB1`, `PL13`, `PL20`, `GC2`, `GC3` giữ nguyên trong chuỗi gắn căn.
>
> **Ngoài phạm vi:** sửa hook và `collector/` (làn ZCode) · sinh lại lát `s03-theo-nhom`, chờ kết quả đo khâu thu.

<!-- <<<PHAM-VI-MA -->
```
dot: gom-tach-gop-0511
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/chu-de/gom-tach-gop-tin-s03.md#e155973f65b396dce340affaafc41eb2962b0c02

- `GT1` — khử trùng ảnh trong một tin theo băm tệp đã có, rồi mới áp trần 12 ảnh
- `GT2` — một lớp «bài đăng» dùng chung quyết định sự kiện nào thuộc một lần đăng
- `GT4` — kiểm định khoá gộp trùng bằng nhãn, chỉ sửa khi đo ra sai
- `GTH1` — thu Nhật ký của S03
- `GTH2` — thu lại các bài chỉ có ảnh đã thu thiếu mã album
```
<!-- PHAM-VI-MA>>> -->
