# Review findings: gs-ac-6-the-khong-tin-a (round 1)

## Trong hợp đồng

- AC-1: Đạt. Câu tập rời kho mới `roiKhoBen(ben)` đòi `jsonb_typeof(evidence-><bên>->'offer_id') = 'string'`, khớp `sidesOf`
  (`app/src/lib/ops/review-context.ts` dòng 121–131: bên tồn tại khi `offer_id` là chuỗi). Probe chạy thật trên DB máy thu
  (✔, skipped 0). Bản origin/main của cùng ca đỏ vì câu cũ tính thêm 60 id thẻ (216026, …) vào tập «Tin A rời kho».
- AC-2: Đạt. Ca CTE che `review_queue` và `sale_offers` bằng CTE, không đọc hay ghi bảng thật. Ca phủ bốn loại thẻ: danh bạ
  không có bên, Tin A rời, Tin B rời, `data_quality`. Ca có chiều đỏ của câu cũ ngay bên trong (`[1, 2]`) và tự kiểm việc dựng
  câu cũ bằng `assert.notEqual`.
- AC-3: Đạt. Nhánh chỉ đổi tệp test và hồ sơ, không tệp `app/src` nào đổi.
- Không nới khẳng định nào: các `assert.deepEqual` của probe giữ nguyên thông điệp và so sánh; hai chỗ bỏ qua (CI, tập rỗng)
  có từ trước, không thêm chỗ mới.
- Ghi chú nhỏ, không chặn: câu cũ được dựng bằng `replace` theo regex trên chuỗi SQL. Ca có `notEqual` canh nên đổi định dạng
  chuỗi sẽ làm ca đỏ chứ không để ca xanh giả.

## Ngoài hợp đồng — người quyết ở Gate 2

Không có mục nào.
