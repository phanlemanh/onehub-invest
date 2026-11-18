# PL20 `ghep-tin-vao-danh-muc` — gắn tin căn hộ S03 vào toà của Danh bạ

Ngày 18/11/2026 · dãy P4 · hạng **T3** (chạm `db/migrations/**`) · mốc MS3 «S03 tới toà».

## 1. Vấn đề

Hôm nay **0 tin S03 gắn toà** của Danh bạ, dù tin đã có dự án ở 97,5% (TG2). CG11 (hạng giá cấp toà) và mỏ neo «dự án B, tháp X,
tầng A: căn nào giá tốt nhất» đều cần toà. Hàng này gắn tin căn hộ Ocean Park 1 (OP1) và Grand Park (GP) vào toà, hoặc vào phân
khu, cụm khi bài chỉ nêu tới đó. Trục và căn là việc của PL36.

## 2. Bảng phủ ca (đếm trên DB máy thu, chỉ đọc, 18/11)

Đơn vị là tin S03 (`sale_offers`, 7.056 tin; căn hộ 6.371). Dự án lấy từ `offer_project`, toà từ cột `block_raw` của tin, so bằng
`chuanHoaTenToa` với tên toà trong `registry_aliases`.

| Khu | Kết quả so cột toà | Căn hộ | Loại khác | Ai đọc đầu ra này phía sau |
|---|---|---:|---:|---|
| OP1 | khớp đúng một toà | 1.013 | 155 | CG11 xếp hạng theo toà; DA14 mức «toà»; PL36 gắn tiếp trục |
| OP1 | khớp phân khu, cụm | 15 | 4 | DA14 mức «phân khu»; CG11 lùi về phân khu |
| OP1 | tên ngoài danh bạ | 161 | 25 | không gắn; danh sách tên cho việc lấp danh bạ |
| OP1 | không ghi toà | 379 | 72 | đọc chữ bài (dưới) |
| GP | khớp đúng một toà | 1.220 | 41 | như OP1 |
| GP | khớp phân khu, cụm | 543 | 27 | như OP1 |
| GP | mơ hồ nhiều toà | 82 | 2 | không gắn; chờ DA38 tách dự án con |
| GP | tên ngoài danh bạ | 62 | 16 | không gắn |
| GP | không ghi toà | 2.289 | 249 | đọc chữ bài (dưới) |
| Khu khác | có hoặc không chữ toà | 476 | 51 | ngoài phạm vi: danh bạ toà các dự án còn lại là lát L4 |
| Chưa có dự án | có hoặc không chữ toà | 131 | 43 | ngoài phạm vi: không biết dự án thì mã toà trùng giữa các dự án |

Tin căn hộ hai khu không có cột toà, xét chữ bài đầu: OP1 65 tin và GP 508 tin nêu đúng một toà của danh bạ.

**Trần gắn** (chưa trừ gắn sai): 2.233 tin vào toà (35,0% tin căn hộ S03), cộng 558 tin phân khu, cụm thành 2.791 (43,8%), cộng 573
tin đọc từ chữ bài thành 3.364 (52,8%).

Tin nhiều bài: 4.505 trong 5.776 tin căn hộ hai khu có từ hai bài; chỉ 9 tin (đều ở GP) có hai tên toà khác nhau giữa các bài.

Ô bỏ: loại khác căn hộ (ngoài câu giao); khu khác và chưa có dự án (lý do ở bảng).

**Lát này chỉ đọc cột toà** (khuyến nghị Hỏi-1). Trần theo cột là 43,8%, nên ngưỡng đề xuất 40% không phụ thuộc nguồn chữ bài. 573 tin chỉ nêu toà trong
chữ bài cần tập nhãn riêng để biết độ đúng, nên để hàng sau.

## 3. Thiết kế

**Một hàm gắn thuần** `pipeline/lib/ghep-tin-danh-muc.mjs`. Đầu vào: dự án của tin, cột toà, chữ bài, danh bạ của dự án. Thứ tự:

1. Tin không thuộc OP1 hay GP, hoặc không phải căn hộ: không gắn.
2. Cột toà khớp đúng một toà: gắn toà (`nguon: cot`).
3. Cột toà khớp nhiều toà: không gắn, lý do `mo-ho`. Không rơi xuống đọc chữ bài.
4. Cột toà khớp đúng một nút phân khu, cụm: gắn nút đó (`nguon: cot`).
5. Cột toà có giá trị nhưng ngoài danh bạ: không gắn, lý do `ngoai-danh-ba`.
6. Cột toà rỗng: không gắn, lý do `khong-cot`.

Tên chỉ so trong phạm vi dự án của tin, vì mã toà trùng giữa các dự án (S1, S2, BE1).

**Phát biểu trên từng bài** (`field_assertions`, resource `Property`, lớp `inferred`, phương pháp `e1_rule`, `rule_id =
'ghep-toa-danh-ba'`, `method_version = 'ghep-toa@1'`):

- Mức toà: trường mới `universal_property_id`, giá trị là `buildings.upi` (ADR-0016 §5, ADR-0013).
- Mức phân khu, cụm: trường đã có `subzone_node_id`, giá trị là id nút.
- Căn cứ: `{ nguon: 'cot', ten }`.

**Migration 117**, viết chồng lên 113 của DA40 và giữ đủ bốn trường của 113: thêm `universal_property_id` vào ràng buộc trường, trigger
chỉ nhận trường này ở `Property` và chỉ nhận UPI của toà đang hoạt động; view `offer_building` cho người đọc phía sau, theo khuôn
`offer_project`: một tin một dòng, chỉ đọc dòng của `rule_id = 'ghep-toa-danh-ba'`. Toà cùng phân khu chứa nó ra mức toà; hai toà khác nhau, toà với
phân khu không chứa nó, hai phân khu khác nhau đều là `xung_dot` và không tính là đã gắn.

**Chạy định kỳ**: bước gắn chạy cuối lượt nạp S03 trong `transform-zalo.mjs`, để tin mới có toà sau mỗi 15 phút. Bước gắn dùng giao dịch riêng sau khi
lượt nạp đã ghi: lỗi của nó chỉ in một dòng cảnh báo, không làm hỏng lượt nạp. Không tách thành bước riêng trong job vì tệp job thuộc làn thu. Chạy
lại không đổi gì; cột toà hay danh bạ đổi thì dòng cũ bị rút, dòng mới được chèn.

**Áp lên DB máy thu** theo hồ sơ năm thứ (lệnh áp, số chạy thử, sao lưu, cách lùi, lệnh kiểm), sau khi PR gộp và sau DA40.

## 4. Đo chất lượng

Tập test là lát `hai-khu-ghep` của PL35: 349 mục gắn được trên màn. Hôm nay **chưa có nhãn người**, nên điều kiện đạt của hàng phụ thuộc
buổi gắn nhãn. Luật gắn viết xong và khoá trước khi xem nhãn; không chỉnh luật theo nhãn của tập đóng băng.

Ngưỡng nhóm A: cận dưới Wilson từ 0,95. Cỡ mẫu tối thiểu trên các bài máy gắn: 73 bài nếu đúng hết, 110 nếu sai 1, 142 nếu sai 2. Ba
tầng có toà có 224 mục. Hai tầng không gắn có 53 và 72 mục, nên chấm riêng từng tầng không đạt được 0,95 dù đúng hết.

## 5. Ngoài phạm vi

Trục, căn và tầng suy từ mã căn (PL36) · danh bạ toà các dự án còn lại (lát L4) · tách dự án con để gỡ 82 tin mơ hồ (DA38) · sửa lỗi
nháp nhãn của PL35 (`P4-208`) · đưa toà lên cổng Invest hay cloud.

## 6. Rủi ro đã biết

- **DA40 chưa gộp**: PR này phải gộp sau DA40, nếu không migration 117 không áp được đúng thứ tự.
- **Hụt ngưỡng chất lượng**: tập test đã lộ nhãn thì không được chỉnh luật rồi chấm lại trên chính tập đó; lối ra là lát nhãn mới với seed khác (Hỏi-3).
- **Nháp nhãn thiếu ở 117 mục**, tập trung ở tầng `op1-truc`: buổi gắn nhãn lâu hơn, đáp án không bị ảnh hưởng.
