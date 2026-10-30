# Thiết kế: hàng Phường của bảng so ghép căn so theo tên chuẩn (the-duyet-phuong-lech-gia)

Hồ sơ: `_acceptance/the-duyet-phuong-lech-gia/` · hạng T2 · dãy U1 · nguồn: mục Ngoài-1 của PL3 (the-duyet-du-can-cu),
Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 30/10 (`_acceptance/the-duyet-du-can-cu/decisions.jsonl`
`d-20261030T071529Z-26`).

## Vấn đề

Bảng so mười trường của thẻ ghép căn (`soTruongGhepCan` trong `app/src/lib/ops/review-can-cu.ts`) so mọi trường bằng
một khoá chung: chuỗi cắt khoảng trắng, chữ thường. Trường Phường lấy từ `evidence.offer_a.phuong` /
`evidence.offer_b.phuong` — chuỗi tự do mỗi nguồn ghi một kiểu. Đo trên DB máy thu 30/10: cả 12 thẻ ghép căn (11 chờ,
1 đã quyết) đều là cặp S05 ↔ S06, bên S05 ghi slug (`binh-thanh`), bên S06 ghi tên đủ (`Phường Bình Thạnh`). Năm cặp
khác nhau, cả năm đều cùng một phường mà bảng báo «Lệch». Người duyệt bị đẩy về phía «Khác căn» bằng một tín hiệu sai.

## Cách làm

Một hàm thuần `khoaPhuong(v)` trong `review-can-cu.ts` đưa tên phường về khoá chuẩn:

1. Bỏ đúng một tiền tố hành chính ở đầu chuỗi **còn dấu** (NFC, không phân biệt hoa thường): «Phường », «Xã », «Thị
   trấn », «P.» (có hay không dấu cách sau). Bỏ trên chuỗi còn dấu vì sau khi bỏ dấu «Phường» và «Phương» cùng thành
   `phuong`: bảng `areas` có «Phương Liệt» (`vn-hanoi-phuong-liet`) và «Phượng Dực» — bỏ tiền tố sau khi bỏ dấu sẽ
   ăn mất chữ đầu của chúng (gap-probe P1, đo 30/10). Slug của nguồn (`phuong-liet`) không bao giờ mang tiền tố: đuôi
   mã area là slug của tên phường không tiền tố (304/304 phường, đo 30/10).
2. Bỏ dấu tiếng Việt theo đúng cách `slugifyName()` của app (`app/src/lib/queries.ts`: NFD, bỏ dấu, `đ→d`, chữ thường,
   mọi dãy không phải chữ/số thành `-`, cắt `-` hai đầu) — cùng cách sinh đuôi mã phường.

`soTruongGhepCan` dùng `khoaPhuong` cho riêng hàng Phường; chín hàng còn lại giữ khoá cũ. Ô giá trị Tin A / Tin B vẫn
hiện nguyên chuỗi của nguồn — chỉ nhãn So đổi.

**Khoá rỗng là Thiếu.** Chuỗi gốc chỉ có tiền tố («P.», «Phường», «-») cho khoá rỗng: không có tên phường nào để so, nên
hàng ra «Thiếu» — không bao giờ Khớp vì hai bên cùng rỗng (gap-probe P2).

**Khoá chỉ toàn số giữ cách so trước vòng.** «Phường 12» của hai quận khác nhau cho cùng khoá `12`. Khi khoá chuẩn của
một bên chỉ có số, hàng Phường so đúng như trước vòng (chuỗi gốc cắt khoảng trắng, chữ thường) — khoá số không làm hai
chuỗi gốc khác nhau thành Khớp. Vòng này chỉ sửa Lệch giả (câu ký Ngoài-1); hai chuỗi «Phường 12» giống hệt vốn đã Khớp
trước vòng và giữ nguyên (OOS-5). Bảng `areas` hiện có 0 phường tên số.

## Phương án đã loại

- **So theo `area_id` của tin** (đọc `sale_offers.area_id` lúc mở trang, hoặc ghi `area_id` vào evidence thẻ): vùng
  giám sát giao cho hàng này chỉ là `review-can-cu.ts` + test (`hang-viec.json`, `ranh_gioi`), bên sinh thẻ nằm ở
  `agent/`; và hôm nay phía S05 của cả 11 thẻ chờ trỏ vào `offer_id` không còn trong `sale_offer_records` (đo 30/10) —
  tra theo tin sẽ ra «Thiếu» cho đúng những thẻ đang cần sửa. Đường này mở lại khi bên sinh thẻ ghi `area_id` (Later).
- **Tra bảng `areas` lúc dựng bảng**: bắt hàm thuần cần DB (bảng so đang dựng không DB, test bằng jsdom). Bảng `areas`
  được dùng làm **thước** (probe chỉ đọc), không làm đường chạy.

## Đặc tả UX

Không đổi bố cục, thành phần hay chữ nào của sheet: hàng Phường của bảng so (`review-compare.tsx`) nhận nhãn So khác
(«Khớp» thay «Lệch» khi cùng phường). Badge, thứ tự cột, chữ «Chưa ghi căn cứ — đọc từ tin» giữ nguyên.

## Ngoài phạm vi

- Tên phường kèm quận («Phường 12, Quận 3») hay kèm thành phố: khoá chuẩn khác nhau → vẫn Lệch (chiều an toàn).
- Hai thị trường có phường trùng tên: thẻ ghép căn chỉ ghép trong một thị trường, không xét.
- Sửa evidence cũ của thẻ, hay ghi `area_id` vào evidence thẻ mới (bên sinh thẻ ở `agent/`).
- Nối lại khoá tin S05 bị trôi của các thẻ chờ (báo giám sát 30/10, việc riêng).
- Hai chuỗi phường số giống hệt ở hai quận khác nhau: Khớp như trước vòng.
