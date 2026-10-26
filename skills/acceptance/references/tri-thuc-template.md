# Kho tri thức — khuôn (tầng tri thức theo LLM Wiki)

> Khuôn MỘT nguồn của kho tri thức: bên ghi (`/tri-thuc:ghi`, người) và bên đọc (`scripts/tri-thuc.mjs`, dòng
> «Nguồn:» của ô, bước thiết kế) cùng rút các khối marker dưới đây lúc chạy. Đổi một khối là đổi cả hai bên.
> Thiết kế: `docs/findings/2026-10-24-tang-tri-thuc-llm-wiki.md` (lượt cắt `tri-thuc-2410`, hàng TT1).
>
> Kho khai một lần trong `_acceptance/config.yaml`:
>
> ```yaml
> tri_thuc:
>   noi: docs/tri-thuc            # gốc tri thức trong kho
>   cong_khai: true               # tuỳ chọn — kho tiêu thụ công khai: raw không được nằm trong kho
>   kho:                          # tuỳ chọn — kho riêng đi kèm; có khối này thì gốc tri thức là kho riêng
>     ten: <tên>
>     duong: ../<tên>             # tương đối gốc checkout chính (cha của git-common-dir), không theo worktree
>     remote: <url>               # tuỳ chọn — để in lệnh clone khi máy chưa có bản
> ```
>
> Hình dạng gốc tri thức: `TRI-THUC.md` (luật riêng của kho), `raw/<YYYY-MM-DD>-<tên>/` (bất biến, mỗi thư mục một
> `nguon.md`), `wiki/nen/`, `wiki/chu-de/`, `wiki/dot/<đợt>.md`. Không commit `index.md` hay `log.md`: chỉ mục sinh lúc
> đọc, lịch sử là `git log`. Thư mục tri thức trong kho khai vào `risk_tiers.t1_skip_globs`.

## Trang wiki — frontmatter

Mọi tệp `.md` dưới `wiki/` mở bằng khối này. Khoá theo đúng thứ tự; `ma` rỗng (`[]`) với trang nền; `nguon` là đường
tương đối gốc tri thức tới tệp raw, ít nhất một.

<!-- <<<TRI-THUC-TRANG -->
```
---
loai: chu-de
ma: [A1, A2]
nguon: [raw/2026-10-24-vi-du/ghi-chu.md]
cap_nhat: 2026-10-24
---
```
<!-- TRI-THUC-TRANG>>> -->

Giá trị `loai`:

<!-- <<<TRI-THUC-LOAI -->
```
nen chu-de dot
```
<!-- TRI-THUC-LOAI>>> -->

## Raw — `raw/<YYYY-MM-DD>-<tên>/nguon.md`

Mỗi thư mục raw có đúng một `nguon.md`: frontmatter mô tả nguồn, thân liệt MỌI tệp khác trong thư mục (kể cả thư mục
con) kèm băm `git hash-object`. Raw bất biến: sửa nội dung là lỗi; nguồn mới là thư mục mới.

<!-- <<<TRI-THUC-RAW -->
```
---
loai: phien
goc: <phiên, artifact, issue hay đường tệp gốc>
luc: 2026-10-24
ai: <người ghi>
---

- `ghi-chu.md` 0000000000000000000000000000000000000000
```
<!-- TRI-THUC-RAW>>> -->

Dòng tệp của `nguon.md` (biểu thức bên đọc dùng):

<!-- <<<TRI-THUC-RAW-DONG -->
```
^- `([^`]+)` ([0-9a-f]{40})$
```
<!-- TRI-THUC-RAW-DONG>>> -->

## Năm loại nguồn — bên ghi `/tri-thuc:ghi`

Giá trị `loai` của `nguon.md`, mỗi dòng một loại kèm luật hình dạng bên ghi kiểm trước khi ghi: `goc-khong-rong` (gốc
không rỗng) · `goc-https` (gốc mở đầu `https://`) · `goc-url-hoac-issue` (URL `https://` hay `<chủ>/<kho>#<số>`) ·
`tep-ngoai-kho` (mọi tệp nằm ngoài kho tiêu thụ) · `tep-trong-kho` (mọi tệp được git theo dõi trong kho tiêu thụ).

<!-- <<<TRI-THUC-NGUON -->
```
phien goc-khong-rong
artifact goc-https
issue goc-url-hoac-issue
tep-may tep-ngoai-kho
tep-kho tep-trong-kho
```
<!-- TRI-THUC-NGUON>>> -->

## Đường trỏ ghim

Ghim theo băm nội dung, không theo sha commit (sha mất sau gộp squash; sha chưa đẩy thì máy khác không thấy). Có tiền tố
`<kho>:` → tệp ở kho riêng; không → tệp dưới gốc tri thức của kho.

<!-- <<<TRI-THUC-CON-TRO -->
```
^(?:([A-Za-z0-9._-]+):)?([^#\s]+)#([0-9a-f]{40})$
```
<!-- TRI-THUC-CON-TRO>>> -->

## `TRI-THUC.md` — mẫu luật của kho

<!-- <<<TRI-THUC-LUAT -->
```
# Tri thức của <kho>

Gốc tri thức theo khuôn của acceptance-gate-kit (skills/acceptance/references/tri-thuc-template.md).

- raw/<YYYY-MM-DD>-<tên>/ — bất biến; nguon.md liệt mọi tệp kèm băm git hash-object.
- wiki/nen/ — nền chung mọi vòng đọc. wiki/chu-de/ — chủ đề. wiki/dot/<đợt>.md — mã → trang.
- Không commit index.md hay log.md.

Không đưa vào: <điều kho cấm — ảnh có tên người, số điện thoại, dữ liệu khách hàng…>
```
<!-- TRI-THUC-LUAT>>> -->
