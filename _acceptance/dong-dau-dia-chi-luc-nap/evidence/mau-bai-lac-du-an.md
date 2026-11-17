# AC-10 — tỉ lệ bài lạc dự án (mẫu nhãn người)

Thước này kiểm chính **tiền đề** của hàng: «bối cảnh nhóm là mặc định cho địa chỉ của tin». Nếu bài trong một
nhóm chuyên một dự án lại hay nói về dự án khác, thì đóng dấu dự án của nhóm lên mọi tin là đóng dấu sai.

## Khai TRƯỚC khi gắn nhãn

Ba dòng này được máy ghi lúc rút mẫu, trước khi ai nhìn bài nào. Đổi chúng sau khi gắn nhãn là làm hỏng phép đo.

| | |
|---|---|
| Cỡ mẫu khai trước | **n = 100** |
| Hạt giống | `tg2-ac10-20261117` |
| Rút lúc | 2026-11-16T23:06:35Z |
| Kho rút từ | 112.313 bài của 13 nhóm mà sổ nhóm ghi đúng một dự án |
| Lệnh rút | `node pipeline/scripts/mau-bai-lac-du-an.mjs --rut --n 100 --seed tg2-ac10-20261117` |
| Lệnh tính | `node pipeline/scripts/mau-bai-lac-du-an.mjs --tinh <bảng đã điền>` |

Rút mẫu xác định theo hạt giống: cùng hạt giống cho cùng 100 bài ở mọi máy, nên mẫu kiểm lại được và không ai
chọn được bài dễ. Bài đọc qua `loadStgPosts` nên bài thử đã bị gạt.

## Ngưỡng

Hợp đồng đòi **cận TRÊN của khoảng Wilson 95% ≤ 10%**, không phải tỉ lệ thô ≤ 10%. Với n = 100 điều đó nghĩa là:

| số bài lạc | cận trên Wilson 95% | |
|---|---|---|
| 0 | 3,70% | đạt |
| 4 | 9,84% | đạt |
| 5 | 11,18% | **chưa đạt** |

Nên n = 100 cho phép **nhiều nhất 4 bài lạc**. Dùng Wilson chứ không dùng khoảng chuẩn vì mẫu nhỏ và tỉ lệ gần 0
— khoảng chuẩn cho cận dưới âm và cận trên hẹp giả, đúng hai chỗ phép đo này dễ bị đọc sai. Cỡ mẫu nhỏ bị phạt
đúng: 0 bài lạc trên 20 bài vẫn cho cận trên 16,11%, tức **không** đạt.

## Bảng gắn nhãn — nằm ngoài kho

Bảng 100 dòng kèm đầu bài ở **`research-local/mau-bai-lac-du-an.md`** (gitignored), không ở trong kho: kho này
công khai, còn chữ bài S03 có thể mang tên nguồn thật in sẵn trong bài, và tên nguồn thật là tầng A
(ADR-0007). Chỉ **số tổng hợp** ở dưới mới vào hồ sơ.

## Kết quả

**CHƯA CÓ — chờ người gắn nhãn.** Mẫu đã rút và khoá hạt giống; bước còn lại là người đọc 100 bài rồi đánh dấu
cột `lac`, sau đó chạy lệnh tính và dán vào đây: tỉ lệ, cả hai cận, cỡ mẫu thật, và một câu kết luận bối cảnh
nhóm đủ hay chưa đủ làm mặc định.

Cận trên vượt 10% là **chưa đạt**, và kết luận đúng khi ấy là **hàng đổi hướng** — không phải một ghi chú.
