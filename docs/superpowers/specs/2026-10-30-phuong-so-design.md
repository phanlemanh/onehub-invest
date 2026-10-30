# phuong-so — thiết kế

Hàng P3, T2. Mở theo lời Mạnh ở Cổng Bằng chứng `khoa-phuong-chung-phuong-so` ngày 30/10: «mở hợp đồng mới — gom với
«Phường 01», «P12», slug phuong-12 thành một hàng «phường số»». Ô cơ hội: `_acceptance/phuong-so/opportunity.md`.
Vùng: `app/src/lib/ops/review-can-cu.ts`, `agent/src/agents/judge-entity.ts`,
`app/tests/the-duyet-phuong-lech-gia.test.tsx`, `agent/tests/judge-nguong.test.ts`.

## 1. Hiện trạng (sau `khoa-phuong-chung-phuong-so`)

`khoaPhuong` bỏ MỘT tiền tố có dấu (`phường|xã|thị trấn` + khoảng trắng, hay `p.`) rồi slug hoá; `soPhuong` so hai khoá.
Bản agent (`judge-entity.ts`) chép nguyên văn hai hàm; test agent rút thân hai hàm từ tệp app và chạy cùng ma trận.

Với phường số, khoá chỉ còn số nên:

| Cặp | Nay | Muốn |
|---|---|---|
| «Phường 01» · «Phường 1» | Lệch (`01` ≠ `1`) | Khớp |
| «P12» · «Phường 12» | Lệch (`p12` ≠ `12`) | Khớp |
| `phuong-12` · «Phường 12» | Lệch (`phuong-12` ≠ `12`) | Khớp |
| «Xã 12» · «Phường 12» | Khớp (cùng `12`) | Lệch |
| «Thị trấn 12» · «Phường 12» | Khớp | Lệch |
| «12» · «Phường 12» | Khớp | Lệch |

## 2. Cách sửa

Thêm một nhánh đầu `khoaPhuong`, chỉ cho tên mà sau tiền tố CHỈ còn chữ số. Mẫu chạy trên chuỗi đã `normalize("NFC")`, `trim()`, `toLowerCase()` — nên «Phường 12» ghi dạng tổ hợp NFD cũng vào nhánh này:

```
^(?:(phường|phuong|p)|(xã|xa)|(thị trấn|thi[\s-]*tran))?[\s.-]*0*(\d+)$
```

Khoá = cấp + số đã bỏ số 0 đầu: `p-12` (phường, kể cả `P.12`, `P. 12`, `P12`, `phuong-12`, `phuong 12`), `x-12` (xã,
kể cả `xa-12`), `tt-12` (thị trấn, kể cả `thi-tran-12`), `12` (không ghi cấp). Khác cấp → khác khoá → Lệch. Tên còn chữ
(«Phương Liệt», «Bến Nghé», «12A») không khớp mẫu nên đi đường cũ từng byte — mọi ô chữ của ma trận cũ giữ nhãn.

`soPhuong` không đổi. Bản agent chép đúng hàm mới; test agent vẫn rút thân từ tệp app nên hai bản không trôi lệch.

Cặp mẫu: «Phường 0» → `p-0`; «012» → `12`; «Phường» trần không khớp mẫu (thiếu số) → đường cũ → khoá rỗng → Thiếu như cũ.

## 3. Rủi ro đã cân

- «Phường 12» quận 3 với «P.12» quận 10 vẫn Khớp — cùng lớp với hai chuỗi giống hệt, đã ngoài phạm vi từ vòng trước
  (thẻ không có hàng Quận).
- «12» trần với «Phường 12» thành Lệch: nguồn ghi số trần sẽ không ghép với nguồn ghi «Phường». Đây là lời giao («12»
  trần không Khớp «Phường 12»).
- DB local 30/10: 0 tin bán ghi phường có chữ số. Không thẻ nào đang hiện đổi nhãn.

## 4. Eval đã ký bị thay

Ba eval của hồ sơ trước đo đúng hành vi hàng này đổi (ô `phuong-12` Lệch, và đối chứng đỏ dựa trên khoá chỉ-số `12`
— khoá mới là `p-12` nên dòng khoá-chỉ-số cũ không còn bật). Khi hồ sơ này được ký, ba ô khai `status: not-run` kèm
`superseded_by`:

| Eval cũ | Đo gì | Thay bởi |
|---|---|---|
| khoa-phuong-chung-phuong-so/E1 | KP-AC-1: 6 cặp, ô «Phường 12» · `phuong-12` Lệch | phuong-so#AC-1 |
| khoa-phuong-chung-phuong-so/E2 | KP-AC-2: ma trận 21 cặp, ô `phuong-12` Lệch, đối chứng đỏ khoá-chỉ-số | phuong-so#AC-2 |
| khoa-phuong-chung-phuong-so/E3 | KP-AC-3: e2e yes/no, đối chứng đỏ khoá-chỉ-số | phuong-so#AC-3 |

Ca test cũ được thay bằng ca mới trong cùng tệp; ma trận mới giữ đủ các ô cũ (trừ ô `phuong-12` đổi nhãn).

## 5. Đường đo

Mọi thước là test, không cần DB:
- `app/tests/the-duyet-phuong-lech-gia.test.tsx` — ma trận phường số qua `soTruongGhepCan`. Đối chứng đỏ: bản chép tệp
  app bỏ dòng nhánh phường số của `khoaPhuong`.
- `agent/tests/judge-nguong.test.ts` — ma trận rút hàm từ tệp app, so với luật; đầu-cuối qua `apNguong`. Đối chứng đỏ:
  `khoaPhuong` của vòng trước nhúng nguyên văn, truyền qua tham số so phường; bản chép `judge-entity.ts` bỏ nhánh phường
  số (ghi tệp .ts tạm cạnh tests rồi nạp qua tsx).

## 6. Ngoài phạm vi

- Phường có chữ sau số («12A», «12 bis»).
- Phân biệt phường cùng số ở hai quận.
- «Phương 12» (gõ sai dấu tiền tố).
- Viết tắt cấp xã / thị trấn («TT.12», «X.12»): mẫu không nhận; chúng đi đường cũ.
- Chấm lại thẻ cũ trên DB `oneinvest`.
