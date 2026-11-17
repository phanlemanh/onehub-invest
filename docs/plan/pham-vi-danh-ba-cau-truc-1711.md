# Bản phạm vi — Cấu trúc danh bạ: cây Dự án → Phân khu → Toà, S16 thắng về cấu trúc (17/11)

> Nguồn: phân tích chỉ đọc 17/11 trên DB máy thu và mã dựng danh bạ (phiên phân tích), ba câu Q-A, Q-B, Q-C Mạnh duyệt «Theo
> khuyến nghị cả ba câu» cùng ngày, ghi ở ROADMAP §3 mục 54 và `docs/architecture/mo-hinh-danh-ba-du-an.md` §1.3, §1.3a; tóm ở kho
> tri thức riêng, trang `wiki/dot/danh-ba-cau-truc-1711.md`. Nguồn gọi bằng mã; S16 là danh mục do một chủ đầu tư tự công bố.
>
> **Thước của đợt**: số toà treo thẳng dưới dự án mà dự án có phân khu (17/11 trên `/ops/registry`: 54 / 198; theo phân khu hiệu
> lực: 14), số dự án có cha (0 / 344), số mã nguồn chưa nối (524: S06 8, S08 172, S09 344).
>
> **Thứ tự giám sát chốt 17/11**: hàng nạp S16 (DA33) đi tiếp nguyên hành vi đã ký (lệch → thẻ, toà treo dưới dự án) tới Cổng Bằng
> chứng và áp; `CT2` dựng trên dữ liệu DA33. `CT1` giao dãy N1 từ trước khi cắt.
>
> **Không vào bản phạm vi** (việc của người — liệt «Ra khỏi kho» ở mô tả PR): Mạnh xem mẫu ba thẻ luật mới (dự án con theo hậu tố,
> phân khu S16, nút ứng viên S08/S09); lời áp lên DB máy thu đi theo chữ ký Cổng Bằng chứng từng hàng.

<!-- <<<PHAM-VI-MA -->
```
dot: danh-ba-cau-truc-1711
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/dot/danh-ba-cau-truc-1711.md#a946caece1e1bcd3b2620aafb1068390fc5d0e39

- `CT1` — trang Danh bạ trên Ops xếp toà theo phân khu hiệu lực (view v_toa_nut_vung), không theo cột gốc
- `CT2` — ở dự án có S16, S16 thắng về cấu trúc: phân khu từ danh sách khu S16, toà S16 về phân khu, lệch cấu trúc thành bí danh và số đếm, thẻ lệch thừa cho nghỉ (Q-B, Q-C)
- `CT3` — dự án S08 có hậu tố khu thành dự án con có cha qua thẻ luật; dự án con đang thiếu cha có cha (Q-A)
- `CT4` — mã dự án S08, S09 chưa khớp nút thành nút ứng viên qua thẻ luật theo nguồn, Hà Nội trước, kèm bảng nối dự án S09
```
<!-- PHAM-VI-MA>>> -->
