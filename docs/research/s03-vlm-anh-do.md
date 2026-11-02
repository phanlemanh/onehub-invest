# Đo lô thật đọc ảnh tin S03 bằng Qwen

Lô thử của vòng `vlm-anh-tin-s03` (KC3), chạy 02/11/2026 trên DB local máy thu, bản prompt `vlm-s03-v1`, run id `vlm-anh-qwen-lo-that-1`.
Không ảnh nào rời máy. Nhãn nằm ở `silver_labels` local, không ghi canonical. Tin rao S03 chỉ được nêu bằng số, không có chữ bài.

## Kết quả chính

Qwen đọc được ảnh và điền thêm thông tin, nhưng gần như không đọc ra giá: 100 bài có 1 dòng có giá. Lô này chưa nói được độ đúng; độ đúng chỉ có khi chấm phiếu gắn tay ở Cổng Giá trị.

| Mục | Trước lô | Sau lô |
|---|---|---|
| Bài có nhãn ảnh Qwen | 0 | 100 |
| Bài có nhãn tốt (có giá hoặc loại hình) | 0 | 48 |
| Bài lấp đúng lý do thiếu của nó | 0 | 9 |

Tái lập cả ba dòng: `node pipeline/vlm-anh-s03.mjs --dem`. Số «trước» là 0 vì đây là lô đầu của bản prompt này.

## Số đo

Toàn bộ mục dưới lấy từ `node pipeline/vlm-anh-s03.mjs --dem` (số theo model Qwen, bản `vlm-s03-v1`), trừ phần thời gian.

**Tập đọc:** 2.406 bài. Thiếu giá 1.405, thiếu dấu hiệu 623, thiếu loại hình 1.538 (một bài có thể thiếu nhiều thứ). Số 02/11 lúc thiết kế là 2.392; khác do có dữ liệu mới.

**Bốn nhóm:** tốt 48, rỗng 51, lỗi 1, chưa đọc 2.306, cộng lại 2.406.

**Lấp đúng lý do:** 9 bài. Theo lý do: thiếu loại hình 8, thiếu dấu hiệu 5, thiếu giá 1.

**Lỗi:** JSON hỏng 0 trên 54 lần gọi (0%). `lo-url` 0. Lỗi gọi 1 (`AI_APICallError`). Giá trị ngoài sổ từ vựng 0.

**Dòng có từng trường (trên 100 dòng):**

| Trường | Số dòng |
|---|---|
| Giá | 1 |
| Loại hình | 48 |
| Dự án | 22 |
| Diện tích | 17 |
| Phòng ngủ | 14 |
| Mã căn | 10 |
| Toà | 8 |

10 dòng có xung đột: các ảnh của cùng bài trả giá trị khác nhau, nên trường đó để rỗng.

**Ảnh theo loại (53 ảnh đọc tốt):** nội thất 23, sơ đồ 22, QR hoặc quảng cáo 4, khác 3, bảng giá 1.

**Nhãn lộ nguồn:** 3 ảnh, dùng ở 7 bài. Đây là nhãn do model gắn, chưa ai kiểm; vòng này chỉ gắn nhãn và đếm, không chặn.

**Ảnh khác nhau so với lượt:** toàn tập 792 ảnh khác nhau trên 3.278 lượt (sau khi gộp trong bài và giữ tối đa 4 ảnh mỗi bài). Lô 100 bài chỉ cần 54 lần gọi nhờ dùng lại kết quả. 62/100 bài có ảnh ghép.

**Nhóm bài chỉ có ảnh dùng từ 10 bài:** 1.505 bài trong tập đọc. Trong lô: tốt 26, rỗng 36, lấp đúng 3.

## Thời gian

| Mục | Số | Lệnh |
|---|---|---|
| Thời gian thật của lô | 612 giây cho 54 lần gọi, trung bình 11,3 giây một lần | dòng cuối của lệnh chạy lô |
| Thời gian một lần gọi | trung vị 7,9 giây, lâu nhất 92 giây | truy vấn `ai_calls` theo `trace` dưới đây |
| Ảnh chưa đọc | 739 `sha256` | `--dem`, mục «chưa đọc» |
| Ước hết tập đọc | khoảng 2,3 giờ (739 × 11,3 giây) | tính từ hai dòng trên |

Lần thử tay 8 ảnh cùng ngày chỉ mất khoảng 2 giây mỗi ảnh. Chưa tìm hiểu vì sao lô chậm hơn, nên ước thời gian trên chỉ là mức đo được ở lần này.

```sql
SELECT count(*), percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms), max(latency_ms)
FROM ai_calls WHERE trace = 'vlm-anh-qwen-lo-that-1';
```

Lệnh chạy lô (lần chạy lại sẽ chọn 100 bài kế tiếp, không lặp lô này):

```bash
cd agent && npx tsx scripts/vlm-anh-run.ts --model qwen --limit 100
```

## Giới hạn của số đo

- Lô là 100 bài mới nhất, không phải mẫu ngẫu nhiên, nên tỉ lệ trên không suy ra được cho cả tập đọc.
- Số dòng có trường chỉ nói model có trả lời, không nói trả lời đúng. Độ đúng đo ở `--gold` trên phiếu gắn tay.
- Câu hỏi mới chạy thử trên 8 ảnh mẫu trước lô, chưa so với đáp án. Việc 1/100 dòng có giá có thể do ảnh ít khi ghi giá, hoặc do Qwen đọc kém; lô này không phân biệt được.
