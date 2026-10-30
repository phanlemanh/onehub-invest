# loc-enrich-thu-ops-audit — nhật ký thao tác Ops không bị dấu enrich lấn

Căn cứ: mục Ngoài-4 của Cổng Bằng chứng `enrich-chay-sau-nap` (PR #201), Mạnh chọn «mở hợp đồng mới» 30/10
(`_acceptance/enrich-chay-sau-nap/decisions.jsonl`, dòng `d-20261030T082925Z-25`) · ô cơ hội
`_acceptance/loc-enrich-thu-ops-audit/opportunity.md`.

## Vấn đề

`GET /api/v1/ops/audit` (admin, quyền `audit.read`) trả 100 dòng `ops_audit` mới nhất, không lọc:

```sql
SELECT at::text, actor, action, env, detail FROM ops_audit ORDER BY at DESC LIMIT 100
```

Từ đêm 31/10, mỗi tin enrich đã thử ghi một dòng `action = 'enrich:thu'` (tối đa 50 dòng mỗi đêm, `ENRICH_LIMIT`). Dấu
này là sổ sách của máy (để không bốc lại tin trong 30 ngày), không phải một thao tác Ops. Sau một hai đêm, 100 dòng gần
nhất gần như toàn dấu máy, và thao tác của người (duyệt thẻ, hoàn tác, đổi chế độ thu, sửa sổ đơn vị…) bị đẩy ra ngoài.

Không trang nào trong app đọc API này (đã grep `ops/audit` trong `app/src`). Không chỗ nào khác trong app đọc
`ops_audit` theo kiểu «N dòng gần nhất» — các chỗ khác chỉ ghi.

## Thiết kế

### 1. Một hằng dấu máy, phía app

Tệp mới `app/src/lib/ops/audit-loc.ts`:

```ts
/** Action ops_audit là sổ sách của máy, không phải thao tác Ops — nhật ký thao tác không trả chúng. */
export const DAU_MAY = ["enrich:thu"] as const;
```

Danh sách đóng, một phần tử. Không lọc theo tiền tố: `enrich:revert`, `enrich:reconcile`, `enrich:retire` là thao tác có
nghĩa (hoàn tác, dọn) và vẫn hiện. Không lọc theo loại actor: đo `ops_audit` thật 30/10 (90 dòng từ 21/10), thao tác người
mang actor theo năm khuôn (`user:*`, `ops-user`, `usr_*`, `vis-ops-*`, `hitl`) nên «ẩn mọi actor không phải người» sẽ ẩn
thao tác người thật. Thao tác máy khác (bait-gap, transform, cắt chuyển) chỉ khoảng 40 dòng trong chín ngày, còn
`enrich:thu` tới 50 dòng mỗi đêm.

### 2. Câu đọc của route

```sql
SELECT at::text, actor, action, env, detail FROM ops_audit
WHERE action <> ALL ($1::text[]) ORDER BY at DESC LIMIT 100
```

với `$1 = DAU_MAY`. Giới hạn 100 áp lên dòng đã lọc, nên luôn trả đủ 100 thao tác khi bảng có đủ. Khuôn trả về
`{ rows: [{ at, actor, action, env, detail }] }` không đổi. Quyền (`kiemQuyen(req, "audit.read")`) không đổi một dòng.

### 3. Chống lệch giữa bên ghi và bên lọc

Chuỗi `'enrich:thu'` do agent ghi (`agent/src/enrich/run.ts`, câu `INSERT INTO ops_audit … 'enrich:thu'`). Agent và app
là hai gói npm riêng, app không import được mã agent. Một ca test đọc `run.ts`, rút chuỗi action trong câu INSERT
`ops_audit`, rồi khẳng định nó nằm trong `DAU_MAY`. Ai đổi tên dấu ở một bên thì test đỏ.

## Hạng rủi ro

Route nằm dưới `app/src/app/api/v1/ops/**`, thuộc `t3_paths`, nên máy suy hạng T3. Việc đổi chỉ là một điều kiện `WHERE`
trên một route chỉ đọc, và quyền không đổi (AC-4 đo bằng ma trận so với bản route cũ). Có tiền lệ «ngoại lệ T3 có tên»
(`che-do-thu-tren-ops`). Giữ T3 hay hạ xuống T2 có tên là câu hỏi cho người: **Hỏi-1**.

## Màn hiện nhật ký

Lời Mạnh ở Cổng 2 nói sửa ở «màn Ops», nhưng chưa màn nào hiện nhật ký thao tác. Vòng này chỉ lọc API — nguồn của mọi màn
sau này — hay thêm trang là câu hỏi cho người: **Hỏi-3**. Bản nháp theo khuyến nghị: chỉ lọc API.

## Xem lại dấu máy

Dấu vẫn nằm trong bảng `ops_audit`. Mỗi lượt enrich in dòng tổng kết vào log job `zalo-import-daily`. Có cần một cách xem
dấu qua API không (ví dụ `?kem_dau_may=1`) là câu hỏi cho người: **Hỏi-2**. Bản nháp theo khuyến nghị là không thêm.

## Đo

`app/tests/audit-loc.test.tsx` theo khuôn `labels.test.tsx`: lược đồ tạm có `ops_audit` cùng bảng phiên
(`luocDoPhienAdmin` trong `tests/helpers/phien-thu.ts`). Route `GET` gọi bằng Request thật với cookie phiên. Lược đồ
`public` không bị chạm. Mỗi dòng gieo mang khoá duy nhất `detail.seq` để so từng dòng. Chiều đỏ dùng bản route trước vòng —
fixture commit sẵn `app/tests/fixtures/audit-route-truoc-loc/route.ts.txt` chép từ 4cfd7cd1 (không gọi git lúc chạy: CI
clone nông), chép sang thư mục tạm với import `@/` trỏ về `src/` thật — hoặc bản đột biến của `audit-loc.ts`. Không đụng :5433 ngoài lược đồ tạm của chính ca.

## Ngoài phạm vi

- Dời dấu đã thử sang bảng riêng (cần migration và sửa làn enrich đã ký).
- Trang UI cho nhật ký thao tác (chưa có trang nào).
- Đổi cách enrich ghi dấu.
- Bỏ đặc tả UX và design-pass: hàng không chạm giao diện.
