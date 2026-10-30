# nhan-dq-media-local-file — nhãn tiếng Việt cho dòng kiểm ảnh tin

> Sửa gấp do giám sát giao (30/10): main sau PR #192 (NH1 `media-canonical-reso`) làm đỏ ca ON12-AC-5
> (`app/tests/ops-nhan-theo-context.test.tsx` «dòng kiểm chưa diễn giải») trên mọi máy có bảng `media` ở :5433, chặn
> P1 ghim lại PR #193.

## Vấn đề

`pipeline/transform-media.mjs` ghi mỗi lượt một dòng `dq_check_results` cho từng nguồn:
`check_name = 'media:local-file'`, `entity = 'S03' | 'S05' | 'S06'`, `detail = 'rows=<n> local=<k> offers_with_media=<m>'`.
`app/src/lib/dq-labels.ts` chưa biết cả ba phần, nên bảng «Kiểm chất lượng» ở `/ops/quality` hiện «Kiểm khác (chưa diễn
giải)», «Đối tượng khác (chưa diễn giải)», «(chưa diễn giải)» cho các dòng này, và ca ON12-AC-5 (soi trọn mọi dòng 7
ngày trên DB máy thu) đỏ.

## Thiết kế

Theo đúng nếp của `dq-labels.ts` (đọc khuôn của bên ghi, khuôn lạ giữ `known: false`):

- `TEN_KIEM["media:local-file"] = "Ảnh tin đã tải"`.
- Đối tượng mã nguồn trần `^S0\d$` → «Nguồn S0x». Đặt trước nhánh mã thị trường; mã sai khuôn (vd `S0X`) vẫn là đối tượng
  lạ.
- Chi tiết `^rows=(\d+) local=(\d+) offers_with_media=(\d+)$` → «n ảnh · k đã tải · m tin có ảnh», số nguyên có dấu chấm
  nghìn như các khuôn khác. Thiếu một trường thì vẫn là khuôn lạ.
- `CONTEXT.md` thêm thuật ngữ «Ảnh tin» (nhãn, `Code`: `media`, kiểm `media:local-file`, RESO `Media`), vì nhãn UI mới phải
  có thuật ngữ cùng commit (AGENTS.md › Quy ước).

Không sửa bên ghi: dòng đã ghi không đổi theo bên ghi mới (đầu tệp `dq-labels.ts`).

## Ngoài phạm vi

- Đổi khuôn `detail` của `transform-media.mjs` sang câu tiếng Việt ngay ở bên ghi.
- Ngưỡng cảnh báo cho tỉ lệ ảnh đã tải (C2b media-yield).
