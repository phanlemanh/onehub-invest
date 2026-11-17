# Bản phạm vi — Chuẩn hoá và định danh: giá trị đã chuẩn, quan hệ tin → vật thể thì chưa (17/11)

> Nguồn: phân tích chỉ đọc 17/11 trên DB máy thu và mã (phiên phân tích, giao từ phiên giám sát), tự soát lại một lượt cùng
> ngày; tóm ở kho tri thức riêng, trang `wiki/dot/chuan-hoa-1711.md`. Câu của Mạnh được kiểm: «nhiều nguồn nên dữ liệu không
> chuẩn hoá, lưu và mapping khó». Nguồn gọi bằng mã. Tên dự án là thông tin công khai (ROADMAP §3 mục 38).
>
> **Kết luận**: giả định đúng một nửa. Giá trị và danh mục đã chuẩn, máy ép được; chỗ thô là **quan hệ** — tin chưa nối được tới
> toà, tầng, căn của danh bạ, và một phần vị trí gán sai. Gần như mọi lỗ đã có hàng trong mốc MS1–MS5; giám sát chốt **không mở
> mặt trận chuẩn hoá riêng**, đi đường găng TG1 → TG2 → DA33, DA36–DA38 → PL20 → CG11, cắt một hàng mới và chỉnh năm hàng có sẵn.

## Bảng tổng theo loại đối tượng (đo 17/11, DB máy thu)

| Đối tượng | Mã chuẩn | Máy chặn trùng | Mức lệch đo được | Ảnh hưởng |
|---|---|---|---|---|
| Dự án, phân khu | Có (`asset_nodes`) | Mã có, tên không | 0/344 dự án có cha; 5 cặp nút dự án trùng cùng phường (S06 hai mã một dự án) | Cao |
| Toà | Có (ULID, UPI) | Có | Tin khớp đúng một toà theo tên: OP1 815/954, GP 1.168/1.852; GP trượt vì tin nêu cụm (586) và tên toà trùng giữa hai dự án con (78) | Cao — đích «tháp X» |
| Trục, tầng | Có (`stacks`, `units.floor`) | Có | 876 tin bán S03 đủ dự án + toà + giá + m²: 18% có tầng hoặc dải, 36% người bán che tầng | Cao — giới hạn dữ liệu, không phải chuẩn hoá |
| Căn | Hai hệ chưa nối (danh bạ căn và căn theo cụm tin S06) | Có | Căn theo cụm: 100% một nguồn, 0 có dự án; tin đã gắn giữ căn khi đổi giá | Cao — hướng đã chốt: danh bạ + gắn căn (MS4) |
| Khu vực hành chính | Có (`areas`, mã hành chính) | Có | S06: 2.743 tin của Bình Phước, Đồng Nai, Tây Ninh cũ nằm trong vùng thu gộp «Bình Dương» → 610 tin vào phường HCM trùng tên, 2.133 không phường; S03: 95% tin chỉ ở cấp thành phố (TG1, TG2) | Cao |
| Toạ độ | Không phải khoá | — | 41% tin S06 dùng chung điểm với >50 tin; điểm căn hộ là tâm dự án (hợp lệ), phần còn lại là tâm phường, đường | Vừa — nhà phố |
| Diện tích | — | — | Tin bán S03 thiếu m² 29,7% (GC2 bù dải) | Cao với S03 |
| Ảnh | Có | Băm nội dung chỉ ở bảng nạp S03 | 77% ảnh S03 có băm; 62% ảnh lặp ở >1 bài; chưa dùng để gom | Vừa |
| Tin rao | Có (khoá băm theo nguồn) | Theo quy ước | Trong S06: 2.662 tin trùng cùng người, giá, m², toạ độ | Vừa |
| Hướng, nội thất, pháp lý | Hướng, nội thất có từ vựng RESO; pháp lý không | Không | S06 trả mã sẵn: hướng 15,5%, nội thất 47%, pháp lý 46% tin; chưa vào tin | Vừa |
| Người bán | Có | Có (trong từng nguồn) | SĐT lưu đúng dạng quốc tế 100%; thiếu SĐT 23–30% | Thấp |
| Loại nhà, trạng thái, enum | Có (`ref_lookup`) | Có (CHECK) | 0 giá trị ngoài từ vựng | Thấp |
| Thời gian, bản thu | Có | Có | Không lệch đáng kể | Thấp |

Chuẩn hoá chữ (bỏ dấu, SĐT, đọc giá) bị viết lại ở nhiều tệp với luật khác nhau, nhưng lợi ích đo được của việc thống nhất nhỏ
(thêm 39 tin khớp toà) — làm khi chạm các tệp đó, không mở hàng riêng.

## Chỉnh hàng có sẵn trong lượt cắt này (không tạo hàng mới)

- **PL20**: cụm (S1–S10 ở Grand Park…) là mức gắn hợp lệ như phân khu; một hàm tên toà cho cả đọc tin và danh bạ.
- **CG11**: số đo tầng 17/11 làm căn cứ cho «tầng là bộ lọc theo dải» (ROADMAP §3 mục 42 đã chốt — không hỏi lại).
- **CG12**: thêm pháp lý của tin S06 vào hướng, view, nội thất; lưu và lọc, không chia nhóm so.
- **DA39**: gộp năm cặp nút dự án trùng cùng phường.
- **GT2, GT5**: dùng băm nội dung ảnh có sẵn ở bảng nạp S03 làm tín hiệu ghép, gom trước khi nghĩ tới băm cảm nhận (luật 11).

**Không vào bản phạm vi** (việc của người — liệt «Ra khỏi kho» ở mô tả PR): không có.

<!-- <<<PHAM-VI-MA -->
```
dot: chuan-hoa-1711
dang: lan-va
nguon: onehub-invest-tri-thuc:wiki/dot/chuan-hoa-1711.md#e9a336daa78ec9556018d5060688ed079f9733b6

- `CH1` — tin S06 lấy tỉnh từ mã tỉnh thật của bảng nạp thay vì vùng thu gộp; tin tỉnh khác không vào phường trùng tên của HCM
```
<!-- PHAM-VI-MA>>> -->
