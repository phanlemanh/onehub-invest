# Nhãn trạng thái nguồn «Chưa thu» (draft) — design

Hàng `nhan-trang-thai-nguon-draft` (đợt dot0-cam-mau, dãy N1). T2.

## Vấn đề

Migration 047 cho `source_registry.status` năm giá trị (`draft · active · paused · retired · completed`), nhưng bảng nhãn
`app/src/lib/source-status-labels.ts` chỉ có bốn — thiếu `draft`. Từ 09/11 DB local có S07, S12–S15 ở `draft`, nên:
- `/ops/sources` hiện «Giá trị khác» cho các mã ấy;
- ca `ON12-AC-7 mọi giá trị đang có trên DB local có nhãn` (app/tests/ops-nhan-theo-context.test.tsx) đỏ — suite
  `cd app && npm test` đỏ cho MỌI dãy chấm trên máy này (lượt chấm vòng 3 của s03-len-nhanh-nac-1 REJECT vì đúng ca này).

Ca ON12-AC-7 chỉ đỏ khi dữ liệu đã lệch; không có phép đo nào bắt «CHECK có giá trị mà bảng nhãn không có» trước khi dữ liệu tới.

## Thiết kế

1. Thêm `draft: "Chưa thu"` vào bảng nhãn; xuất bảng thành `NHAN_TRANG_THAI_NGUON` để test so cặp.
   «Chưa thu» — mã đã đăng ký trong danh mục nhưng chưa thu (nghĩa do GS giao). Ngắn, cùng giọng với «Đang dùng»,
   «Tạm dừng»; tránh «Nháp» (nghe như bản viết dở, không nói việc thu).
2. Ca kiểm thuần mới `app/tests/source-status-labels.test.tsx`, không chạm DB:
   - đọc mọi `db/migrations/NNN_*.sql` theo thứ tự, lấy lần đặt CHECK `source_registry_status_chk` CUỐI CÙNG, ghim tập
     năm giá trị (chống bộ đọc sai khuôn ra mảng rỗng), và đòi mọi giá trị có nhãn;
   - đối chứng: chuỗi migration nối thêm một lần đặt CHECK có `archived` → đỏ, thông điệp gọi tên `archived`.
3. Một khối thuật ngữ «Trạng thái mã nguồn» trong CONTEXT.md (luật đặt tên: nhãn mới đi cùng thuật ngữ trong cùng
   commit) liệt năm cặp `code` «nhãn»; test so khối ấy với bảng nhãn từng cặp, kèm đối chứng lệch một nhãn.
   GS chỉ cho sửa đúng một khối này trong CONTEXT.md (U1 đang thêm thuật ngữ ở dãy khác).

Không đụng `ops-labels.ts`, không thêm migration, không đổi giao diện ngoài chữ nhãn.

## Ngoài phạm vi

- `source_groups.status` cùng năm giá trị nhưng không có bảng nhãn hiển thị — không thuộc hàng này.
- Chuyển bảng nhãn trạng thái nguồn vào sổ vocab máy sinh (`pipeline/mappings.yaml`).

## Hệ quả với `vocab --lint` (phát hiện ở đường nền)

Bộ lint coi một bảng là viết tay trục X khi có từ hai mã của X và số mã ấy chiếm ít nhất nửa số khoá. Bảng cũ (bốn khoá,
`active`/`retired` trùng chữ `registry_status`) đạt ngưỡng nên có ngoại lệ có tên trong `enums_lint_allow`. Thêm `draft`
thành năm khoá → hai trên năm, dưới nửa → lint không còn bắt, ngoại lệ thành thừa và ca `VL-AC-5` (allowStale) đỏ.
Gỡ dòng ngoại lệ trong `pipeline/mappings.yaml` và trong danh sách ghim `NGOAI_LE` của `pipeline/scripts/vocab-lint.test.mjs`
(hai tệp khai thêm vào vùng của hàng).
