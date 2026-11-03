# Bản phạm vi — Căn giá tốt dùng được trong vận hành (03/11)

> Nguồn: phiên nghiệm thu `people-hien-so-goc` ngày 03/11, verdict `iterate`, Mạnh chấm 3 («Không sử dụng được»; PR #282).
> Mạnh bổ sung: đội vận hành liên hệ người bán trước để bảo đảm thông tin đã xác minh cho nhà đầu tư trên cổng Invest.
> Nguồn gọi bằng mã: S03, S05 nhóm cộng đồng · S06 rao vặt công khai.
>
> **Số đo 03/11 (DB máy thu, chỉ đọc).** Tin bán P1 đang sống 1.277 → gắn được phường 44 → có thước và số giảm 33 → giảm từ
> 5% là 7 → qua trần 50% còn **4 căn trên trang**. 1.233 tin không có phường; 793 trong đó có mã toà (`PR6`, `LD3`), nhưng tin
> S06 chỉ 382 tin có mã toà, nên chưa dựng được thước theo toà. Tin bán S06 so với thước phường × loại của chính nó (358 thước,
> `property_type` đủ 100%): 6.494 tin giảm 5–50%, 2.139 tin giảm 20–35%, nhưng 0 tin có SĐT. Tin thuê chưa có số giảm nào.
>
> Không làm trùng: `PL26` giữ việc đổi thước cho tin P1; `UI10` giữ khung trang và bảng; `TR1` giữ đường đưa tin và người bán
> lên Invest; `AC1` giữ ảnh công khai. Các hàng dưới đứng trên chúng, không gánh lại mã của chúng. `UI10` bỏ `dung_tren` `PL26`
> (bảng không cần thước mới, lịch tự xếp nối tiếp vì chung vùng; `PL26` còn chờ `PL21` chưa mở) và sửa câu giao lỗi thời.
>
> Việc của người, ra khỏi kho (liệt ở mô tả PR): đội vận hành gọi người bán thật; ZCode và Mạnh thu SĐT S06; phiên nghiệm thu.

<!-- <<<PHAM-VI-MA -->
```
dot: can-gia-tot-0311
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52, onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9, onehub-invest-tri-thuc:wiki/chu-de/nguoi-va-sdt.md#829234f6062a7e911b8cf66d79cdddbf88551945

- `CG1` — vai Vận hành biết căn nào, ở đâu, ảnh gì, vì sao giá tốt bằng chỉ số và so với ngưỡng
- `CG2` — tin bán S06 có số giảm theo thước phường × loại và vào danh sách, đủ căn để chọn
- `CG3` — lọc theo khu vực, loại hình, toà hoặc dự án, đường; bảng xếp hạng
- `CG4` — tin cho thuê có thước thuê, số giảm và ô Mua bán | Cho thuê
- `CG5` — ghi kết quả gọi xác minh với người bán
- `CG6` — gắn nhãn giá tốt và lý do, chọn và sắp căn đưa lên
- `CG7` — cổng Invest làm nổi bật căn đã chọn kèm nhãn, lý do, chỉ số và dấu đã xác minh
- `CGP1` — tin S03 không có phường so với thước theo toà hoặc dự án
- `CGP2` — nhãn của đội vận hành làm chỉ dẫn cho AI
```
<!-- PHAM-VI-MA>>> -->
