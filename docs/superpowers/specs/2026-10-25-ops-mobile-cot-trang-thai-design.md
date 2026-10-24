# Cột trạng thái trên điện thoại (ON13 · `ops-mobile-cot-trang-thai`) — thiết kế

Hàng ON13 (`docs/plan/lo-trinh.json`, đợt `ops-noi-that-2410`, nhóm `ops-khung`, hạng T2). Câu giao: «Người trực mở bảng
Ops trên điện thoại 390px thấy cột Trạng thái ngay sau cột tên, không phải cuộn ngang mới thấy Hỏng hay Ổn». Ngưỡng:
«Ở 390px, cột Trạng thái của 6 bảng nằm trong khung nhìn khi chưa cuộn ngang». Gốc OPS-18 (G6). Ghi chú hàng: dùng
cách của data-grid (ReUI), không tự vẽ.

## 1. Hiện trạng (đo thật 25/10, main 4af4dd8, Chromium 390×844, phiên admin tạm, DB local)

`table-fixed`, bề rộng cột = `size` của định nghĩa cột (SSR in ra `<colgroup>`). Khung cuộn ngang: `StatusGrid` 21–369px
(348px), `InsightGrid` 37–353px (316px).

| Bảng (trang) | Cột tên | Cột trạng thái | Vị trí hiện tại (px) | Trong khung? |
|---|---|---|---|---|
| Sức khoẻ nguồn (Thu thập, StatusGrid) | Nguồn 200 | Trạng thái 120 | 221–341 | có |
| Khoá an toàn & hạ tầng thu (Thu thập, StatusGrid) | Lớp 120 | Trạng thái 150 (cột 3) | 561–711 | không |
| Nhóm S03 (Thu thập, InsightGrid) | Nhóm 260 | Trạng thái 200 | 297–497 | không |
| Máy móc (Thu thập, StatusGrid) | Tác vụ 280 | Trạng thái 140 (cột 3) | 481–621 | không |
| Kiểm chất lượng (Chất lượng, InsightGrid) | Kiểm 200 | Kết quả 120 (cột 3) | 397–517 | không |
| Độ phủ trung thực (Chất lượng, InsightGrid) | Thị trường 180 | Độ phủ trung thực 150 (cột 5) | 627–777 | không |

## 2. Thiết kế

1. **Thứ tự cột**: cột trạng thái đứng ngay sau cột tên ở cả 6 bảng (đổi thứ tự trong định nghĩa cột — data-grid dựng theo
   thứ tự đó; không thêm component).
2. **Bề rộng**: `size` của cột tên + cột trạng thái ≤ ngân sách khung ở 390px (StatusGrid 348px, InsightGrid 316px):

   | Bảng | Cột tên | Cột trạng thái | Tổng | Ngân sách |
   |---|---|---|---|---|
   | Sức khoẻ nguồn | 200 | 120 | 320 | 348 |
   | Khoá an toàn | 120 | 150 | 270 | 348 |
   | Nhóm S03 | 160 | 150 | 310 | 316 |
   | Máy móc | 200 | 140 | 340 | 348 |
   | Kiểm chất lượng | 190 | 120 | 310 | 316 |
   | Độ phủ trung thực | 160 | 150 | 310 | 316 |

   Ở desktop bảng `w-full` dàn đều phần thừa nên cột không hẹp đi rõ. Ô tên dài xuống dòng — kể cả ô Nhóm S03, bỏ `truncate`
   (Hỏi-1, lối khuyến nghị: trên cảm ứng `title` không hiện, hai nhóm cùng tiền tố bị cắt giống nhau thì không phân biệt
   được nhóm nào hỏng).
   Nhãn trạng thái Nhóm S03 «Im N ngày — kiểm tra bị mời ra hoặc đổi tên» rút còn «Im N ngày» để vừa ô 150px; lời dặn
   «kiểm tra bị mời ra hoặc đổi tên» đã có ở chú thích dưới bảng.
3. **Không ghim cột** (column pinning): đặt đúng thứ tự + bề rộng là đủ cho ngưỡng «khi chưa cuộn ngang»; ghim làm hai cột
   dính khi cuộn — đẹp hơn nhưng thêm cấu hình bảng chung (`InsightGrid`, `StatusGrid`) cho mọi bảng Ops; để vòng sau nếu cần.

## 3. Phép đo

1. **Tĩnh trên SSR** (`app/tests/ops-mobile-cot-trang-thai.test.tsx`): render từng bảng với dữ liệu mẫu, đọc thứ tự
   `<th data-col-id>` và `<col style="width:…">` → cột trạng thái ở vị trí ngay sau cột tên; tổng hai cột ≤ ngân sách.
   Chiều đỏ: bản sao định nghĩa cột với cột tên 400px / trạng thái đứng cuối → thước báo đúng bảng.
2. **Trang chạy thật** (`scripts/smoke-ops-mobile.mjs`): app dev từ worktree (tự bật `next dev`), phiên admin tạm (tạo/xoá
   cùng lượt), Chromium không giao diện (`playwright-core`) ở 390×844: với mỗi bảng (tìm theo tiêu đề), `scrollLeft = 0`,
   mép phải `<th>` cột trạng thái và ô trạng thái hàng đầu ≤ mép phải khung cuộn, đứng ngay sau cột tên; chụp ảnh từng
   trang vào `.acceptance-runs/ops-mobile-cot-trang-thai/`. Chiều đỏ: chèn CSS làm cột đầu của một bảng rộng 400px →
   smoke báo đúng bảng. Mọi hàng trang đầu: nhãn trạng thái trọn trong ô; ô tên Nhóm không bị cắt; trang không cuộn ngang;
   mỗi bảng ≥ 1 hàng (0 hàng → thoát có tên). Ở 1280px: tập `data-col-id` mỗi bảng bằng tập gốc ghim trước từ 4af4dd8
   (Sức khoẻ nguồn: code, state, last, fresh, n24, stg, offers · Khoá an toàn: layer, desc, state · Nhóm S03: name, status,
   seen, passed, accepted, owner, real7, mock7 · Máy móc: label, schedule, alive, last, line · Kiểm chất lượng: check,
   entity, status, detail, at · Độ phủ trung thực: name, our, airdna, universe, ratio, history, captured).

## 5. Hỏi

- **Hỏi-1 — ô tên Nhóm S03 ở 160px.** Khuyến nghị: bỏ `truncate`, tên xuống dòng (đọc đủ trên cảm ứng). Lối khác: giữ cắt
  một dòng + `title` — bảng gọn hơn nhưng hai nhóm cùng tiền tố không phân biệt được trên điện thoại.

## 4. Ngoài phạm vi

- Bảng khác trên Ops (Luồng 7 ngày, Hiệu chuẩn từng thị trường, Thị trường S02 toàn quốc, danh mục nguồn, nhóm Zalo).
- Khổ nhỏ hơn 390px; giao diện thẻ thay bảng trên điện thoại.
- Ghim cột khi cuộn ngang.
