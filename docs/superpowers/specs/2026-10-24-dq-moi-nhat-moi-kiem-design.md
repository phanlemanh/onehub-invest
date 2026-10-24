# Thiết kế — dq-moi-nhat-moi-kiem (ON9)

Căn cứ: `docs/plan/lo-trinh.json` ON9 · `docs/plan/pham-vi-ops-noi-that-2410.md` OPS-10.

## Vấn đề

Bảng «Kiểm chất lượng (7 ngày)» trên `/ops/quality` lấy `dq_check_results ORDER BY checked_at DESC LIMIT 20`. Trên DB local
24/10 có 18 loại kết quả kiểm trong 7 ngày, nhưng `truthful-coverage` có ~100 dòng mới nhất nên 20 dòng đầu toàn là nó:
các kiểm khác (enum-vocab, freshness, adr-drift…) không hiện, header «20 kiểm» là số dòng LIMIT. Dòng
`truthful-coverage … coverage=0.00%` mang badge xanh «Đạt» vì «pass» của kiểm này nghĩa là *có số tham chiếu tươi*
(`pipeline/dq-truthful-coverage.mjs`), không phải độ phủ đạt.

## Cách làm

1. **Bản mới nhất theo từng (kiểm, đối tượng).** Câu SQL mới trong `app/src/lib/dq-checks.ts`:
   `SELECT DISTINCT ON (check_name, entity) … WHERE checked_at > now() - interval '7 days'
   ORDER BY check_name, entity, checked_at DESC` — không LIMIT (số cặp nhỏ: ~30). Hàm `dqLatestSql()` export để test chạy
   đúng câu này. Trang lấy dữ liệu bảng QUA MỘT hàm `loadDqChecks(db)` (nhận `pool` ở trang, client giao dịch ở test) trả
   `{ rows, stats }`; `page.tsx` không còn câu SQL `dq_check_results` nào của riêng nó.
2. **Đếm đúng.** Header ghi hai mục `<số loại kiểm> kiểm` và `<số dòng> đối tượng` (loại kiểm = `check_name` khác nhau;
   «đối tượng» là chữ cột «Đối tượng» của chính bảng này, có từ trước vòng).
3. **Nhãn kết quả theo từng kiểm** (Hỏi-1 — chữ và màu của kiểm độ phủ tham chiếu do Mạnh chốt ở Cổng Phạm vi; dưới là
   khuyến nghị). Hàm thuần `dqResult(checkName, status)` → `{label, variant}`; `DqChecksTable` lấy CẢ chữ lẫn màu từ hàm
   này:
   - `truthful-coverage`: `pass` → «Có số tham chiếu» (`info-light`), `fail` → «Thiếu số tham chiếu» (`warning-light`),
     `warn` → «Cảnh báo», `skip` → «Bỏ qua», lạ → chữ gốc — kiểm này đo có số tham chiếu, không đo độ phủ, nên không trạng
     thái nào của nó mang «Đạt» hay màu xanh lá;
   - mọi kiểm khác: `pass` → «Đạt» (`success-light`), `warn` → «Cảnh báo» (`warning-light`), `fail` → «Không đạt»
     (`destructive-light`), `skip` → «Bỏ qua» (`outline`); trạng thái lạ → chữ gốc, `destructive-light`.
   Không đổi tên kiểm hay trạng thái trong pipeline: 7 ngày dòng cũ vẫn mang tên cũ, đổi ở app phủ cả dòng cũ.
4. **Mô tả bảng** đổi thành «Bản mới nhất của mỗi kiểm theo từng đối tượng, trong 7 ngày».
5. **Từ điển**: `CONTEXT.md` thêm «Kiểm chất lượng» và nhãn «Có số tham chiếu».

## Phép đo

- App `npm test`: `dqLatestSql()` / `loadDqChecks()` chạy trên fixture trong BEGIN…ROLLBACK (khuôn ON11); vẽ
  `DqChecksTable` trong jsdom, so class badge với Badge `success-light` vẽ đối chiếu.
- Dữ liệu thật: `scripts/dq-moi-nhat-do.mjs` (chạy bằng tsx của app, import thẳng `loadDqChecks`, `dqResult`) trên DB local,
  chỉ đọc — in số loại kiểm, số dòng, kiểm mỗi cặp một dòng, đòi có ≥ 1 dòng `truthful-coverage` (0 dòng → exit 1) và không
  dòng nào của nó mang «Đạt» hay `success-light`.

## Không làm

- Diễn giải cột «Chi tiết» sang tiếng Việt (ON12); vùng «Hiệu chuẩn» (ON10); độ phủ/độ tươi đọc facts trên cloud (AU12).
- Đổi tên hay ý nghĩa kiểm `truthful-coverage` trong pipeline (chung tệp với NT7).
