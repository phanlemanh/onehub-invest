# Nhãn giá và lưu lỗi mạng — thiết kế (`nhan-gia-va-luu-loi-mang`, sửa Ngoài-3/5/7 của PL7)

Ngày 2026-10-30 · T2 (chạm `app/src/lib/labels-normalize.ts`, `app/src/components/ops/labels/label-form.tsx`, test — không
đường T3) · Cổng Đáng `build`: Mạnh 30/10 «P4 làm cả hai: nhan-gia-va-luu-loi-mang trước, rồi PL8» (`opportunity.md`).

## Bài toán

Ba hạn chế đã biết của màn gắn nhãn mù (`_acceptance/man-gan-nhan-mu/review-findings.md`):

- **Ngoài-3** — route nhận `unit` bất kỳ; khác `"ty"` là bị tính như triệu, vắng thì ngầm `"ty"`. Gửi «tỷ» có dấu → lưu thấp
  1000 lần, không lỗi.
- **Ngoài-7** — bộ đọc số coi `.` luôn là dấu thập phân; «4.350 triệu» (thói quen Việt: dấu chấm ngăn nghìn) → 4,35 triệu,
  lưu thấp 1000 lần, không lỗi. Diện tích dùng chung bộ đọc nên «1.200 m²» cũng vậy.
- **Ngoài-5** — `luu()` không bắt lỗi `fetch`: mất mạng thì không thông báo, người gắn có thể tưởng đã lưu.

Nhãn là đáp án chuẩn để chấm máy (PL9): sai lặng lẽ đắt hơn lỗi ồn. Tri thức sàn thiết kế «verification-honesty» nói đúng
điều này — một kết quả sai mang dáng thành công đắt hơn một lần từ chối; bộ chuẩn hoá phải TỪ CHỐI chỗ nó không chắc.

## Thay đổi

1. **Đơn vị giá đóng** (`labels-normalize.ts`): `unit` phải đúng `"ty"` hoặc `"trieu"`; vắng hay khác → lỗi theo trường
   «Đơn vị giá không hợp lệ — chọn tỷ hoặc triệu», không ghi gì. Biểu mẫu luôn gửi một trong hai nên người gắn không gặp.
2. **Dấu ngăn nghìn bị từ chối** (Hỏi-1 dấu chấm, Hỏi-2 dấu phẩy): ở ô giá và diện tích, số có MỘT dấu `.` hoặc `,` theo
   sau đúng ba chữ số (`4.350`, `1.200`, `4,350`) là mơ hồ (ngăn nghìn hay thập phân) → lỗi theo trường «Dấu ngăn nghìn
   không được nhận — gõ 4350 hoặc 4,35». Số có hơn một dấu (`4.350.000`, `1.200,5`) vẫn bị lỗi «phải là số» như cũ (bộ đọc
   chỉ nhận một dấu). Một dấu theo sau 1–2 hay ≥ 4 chữ số là thập phân (`3.5`, `3.85`, `64,5`, `4.3500`). Khứ hồi cũ giữ
   nguyên: «4,35 tỷ» = «4350 triệu».
3. **Lỗi mạng khi Lưu** (`label-form.tsx`): lời gọi lưu tách thành hàm thuần `guiNhan(fetchFn, body)` trả một trong năm kết
   cục (`da-luu`, `loi-truong`, `da-co-nguoi`, `loi-may-chu`, `mat-ket-noi`). `mat-ket-noi` → Alert lỗi ngay trong khung
   biểu mẫu «Không chắc đã lưu — mất kết nối tới máy thu. Chữ đã gõ còn nguyên.» kèm nút «Lưu lại»; không tải trang, chữ đã
   gõ giữ nguyên (lỗi mạng có thể xảy ra SAU khi máy thu đã ghi — nên không khẳng định «chưa lưu»). Route trả 409 với chữ
   lỗi «Anh đã gắn tin này» (hằng `DA_GAN_CUA_TOI` đặt ở `labels-normalize.ts`, `labels-queries.ts` dùng lại) → kết cục
   `da-luu` (lượt trước đã vào) → sang tin kế; 409 vì người khác vẫn là `da-co-nguoi`.

## Ngoài vòng

Ngoài-4 (ô sai kiểu → 500), Ngoài-6 (lấy mẫu bổ sung), Ngoài-1/2/8/9/10 (phép đo) — Mạnh chọn đúng 3/5/7 cho hàng này.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng
- Suôn sẻ: không đổi — điền chín ô → «Lưu và sang tin kế» → tin kế.
- Biên: gõ «4.350» ở ô giá hay diện tích → bấm Lưu → lỗi dưới ô, không lưu.
- Lỗi & quay lại: mất mạng khi Lưu → Alert trong khung biểu mẫu + «Lưu lại»; nối lại → bấm «Lưu lại» → tin kế.

### 2. Kiểm kê màn
| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| `/ops/labels` Gắn nhãn | gắn chín trường lõi cho một tin (không đổi) | như PL7 |

### 3. Bảng trạng thái
<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-labels-dot-nghin | Gắn nhãn | dưới ô giá/diện tích: «Dấu ngăn nghìn không được nhận — gõ 4350 hoặc 4,35» | sửa ô, Lưu lại |
| ST-labels-mat-ket-noi | Gắn nhãn | Alert lỗi trong khung biểu mẫu: «Không chắc đã lưu — mất kết nối tới máy thu. Chữ đã gõ còn nguyên.» + nút «Lưu lại» | bấm «Lưu lại» khi có mạng; lượt trước đã vào thì sang tin kế |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi
- Alert mất ngay khi lượt lưu kế thành công (trang tải tin kế) hoặc trả lỗi theo trường.

### 5. Xuất xứ component
| Component | Nấc | Vì sao |
|---|---|---|
| Alert, AlertAction (`components/reui/alert`) | dùng | lỗi tại chỗ có Thử lại — khuôn RegionError của kho |
| Button (`components/ui/button`) | dùng | nút «Lưu lại» |

### 6. Khuôn IA đã chọn + căn cứ
Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: giữ khuôn của màn PL7; vòng này không đổi cấu trúc.
<!-- UX-SPEC-TEMPLATE>>> -->
