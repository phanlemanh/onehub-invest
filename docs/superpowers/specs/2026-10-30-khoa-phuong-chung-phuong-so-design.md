# khoa-phuong-chung-phuong-so — thiết kế

Hàng P3, T2. Mở theo lời Mạnh ở Cổng Phạm vi `judge-giu-quyet-dinh-nguoi` ngày 30/10: «mở hàng riêng dạy khoá phường
chung coi «P.12» = «Phường 12» cho cả thẻ lẫn luật». Ô cơ hội: `_acceptance/khoa-phuong-chung-phuong-so/opportunity.md`.
Vùng: `app/src/lib/ops/review-can-cu.ts`, `agent/src/agents/judge-entity.ts`,
`app/tests/the-duyet-phuong-lech-gia.test.tsx`, `agent/tests/judge-nguong.test.ts`.

## 1. Hiện trạng

Thẻ duyệt ghép căn so hàng Phường bằng `soPhuong` trong `app/src/lib/ops/review-can-cu.ts`:
1. `khoaPhuong` bỏ MỘT tiền tố hành chính (`phường|xã|thị trấn` + khoảng trắng hoặc hết chuỗi, hay `p.`) trên chuỗi còn
   dấu, rồi slug hoá.
2. Khoá rỗng → Thiếu.
3. Khoá chỉ có số → so chuỗi gốc (`soGiaTri`: trim, chữ thường). Đây là dòng làm «Phường 12» với «P.12» thành Lệch.
4. Còn lại: hai khoá bằng nhau → Khớp, khác → Lệch.

Luật chấm (`agent/src/agents/judge-entity.ts`) chép nguyên văn `khoaPhuong` và `soPhuong` từ app từ hàng
`judge-giu-quyet-dinh-nguoi`; test `agent/tests/judge-nguong.test.ts` rút thân hai hàm từ tệp app và chạy cùng ma trận
qua cả hai bản, nên hai bản không trôi lệch.

Bước 3 có từ hàng `the-duyet-phuong-lech-gia` (TPL-AC-3), với lý do «Phường 12» của hai quận khác nhau cùng khoá.
Nhưng hai chuỗi giống hệt («Phường 12» với «Phường 12») vẫn Khớp ngay từ trước vòng đó. Vậy bước 3 không chặn được ca
hai quận; nó chỉ chặn cùng một phường số ghi theo hai kiểu.

## 2. Cách sửa

Bỏ bước 3 ở cả hai bản: khoá chỉ có số so như mọi khoá khác.

| Cặp | Trước | Sau |
|---|---|---|
| «Phường 12» · «P.12» | Lệch | Khớp |
| «Phường 12» · «P. 12» | Lệch | Khớp |
| «Phường 12» · « phường 12 » | Khớp | Khớp |
| «Phường 12» · «Phường 21» | Lệch | Lệch |
| «Phường 1» · «Phường 12» | Lệch | Lệch |
| «Phường 12» · `phuong-12` | Lệch | Lệch (slug không mang tiền tố có dấu nên khoá là `phuong-12`) |

Trong luật chấm, `soPhuong` ra `khop` thì là «cùng phường». Hai tin số đo khớp, cùng loại, ghi «Phường 12» với «P.12»
nay ra `yes` thay vì `no`.

`soGiaTri` vẫn dùng cho chín hàng còn lại của thẻ. Ở agent, `soGiaTri` chỉ còn phục vụ bước 3 nên bỏ theo.

**Không đổi:** tiền tố nào được bỏ; cách slug hoá; ca Thiếu; chín hàng khác của thẻ; mọi ô chữ của ma trận phường.

## 3. Rủi ro đã cân

- «Phường 12» quận 3 với «P.12» quận 10 nay Khớp. Ca này cùng lớp với «Phường 12» quận 3 với «Phường 12» quận 10, vốn
  đã Khớp trước vòng. Thẻ không có hàng Quận, nên phân biệt hai quận là việc khác (ngoài phạm vi).
- DB local 30/10: 0 trong 28 646 tin bán ghi phường có chữ số (dữ liệu Hà Nội). Việc này phòng trước cho nguồn có
  phường số. Không có thẻ nào đang hiện đổi nhãn.

## 4. Eval đã ký bị thay

Hai eval đã ký đo đúng hành vi mà hàng này đổi. Giữ nguyên thì đỏ; khai không-chạy trần thì luật hai vế chặn. Khi hồ
sơ này được ký, hai ô ấy khai `status: not-run` kèm `superseded_by` trỏ tiêu chí đo lại:

| Eval cũ | Đo gì | Thay bởi |
|---|---|---|
| the-duyet-phuong-lech-gia/E3 | TPL-AC-3: khoá chỉ số so chuỗi gốc, «Phường 12» · «P.12» Lệch | khoa-phuong-chung-phuong-so#AC-1 |
| judge-giu-quyet-dinh-nguoi/E4 | AC-4: ma trận 18 cặp, ô 14 «Phường 12» · «P.12» Lệch | khoa-phuong-chung-phuong-so#AC-2 |

Ca test cũ được thay bằng ca mới trong cùng tệp. Ma trận của AC-2 giữ đủ 17 ô cũ không đổi nhãn, nên không mất độ phủ.

## 5. Đường đo

Mọi thước là test, không cần DB:
- `app/tests/the-duyet-phuong-lech-gia.test.tsx` — ma trận phường số qua `soTruongGhepCan`. Đối chứng đỏ: bản chép tệp
  app có chèn lại bước 3.
- `agent/tests/judge-nguong.test.ts` — ma trận phường rút hàm từ tệp app, so với luật; ca đầu-cuối qua `apNguong`. Đối
  chứng đỏ: `soPhuong` có bước 3, nhúng nguyên văn, truyền qua tham số so phường của `apNguong`.

## 6. Ngoài phạm vi

- Số 0 đầu («Phường 01» với «Phường 1»).
- «P12» không dấu chấm.
- Slug `phuong-12` coi là «Phường 12».
- Phân biệt phường cùng số ở hai quận.
- Chấm lại thẻ cũ trên DB `oneinvest`.
