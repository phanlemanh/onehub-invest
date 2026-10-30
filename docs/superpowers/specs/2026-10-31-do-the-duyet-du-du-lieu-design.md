# Đo độ đủ dữ liệu của thẻ ghép căn chờ duyệt mỗi ngày (HD11)

Hồ sơ: `_acceptance/do-the-duyet-du-du-lieu/` · hàng HD11 của `docs/plan/lo-trinh.json` (T2, dãy P4, đợt 3 hàng duyệt) ·
Cổng Đáng `build` (Mạnh 30/10, «Các điều còn lại theo đề xuất», audit hàng duyệt §7). Căn cứ:
`docs/research/audit-hang-duyet-3010.md` §0 (H1, H3–H5, H7), §2.3, §3.1, §5.1 dòng `do-the-duyet-du-du-lieu`.

## Vấn đề

Audit 30/10 đo tay: 12/12 thẻ có bên A rời kho (H1), bên A 0 ảnh (H3, H4), vai Vận hành không thấy ảnh nào (H5), bên A
thiếu hệ thống 4 trường (H7). Cần số mỗi ngày để biết hàng duyệt có đáng duyệt, và để thấy các hàng sửa (TV13b, U1…) có
hiệu lực. Hôm nay có 7 thẻ `entity_match` chờ.

## Thiết kế

### 1. Bốn kiểm trên thẻ `entity_match` đang chờ (`review_queue.status = 'pending'`)

Mỗi thẻ có hai bên `evidence.offer_a.offer_id`, `evidence.offer_b.offer_id`. Thẻ không còn chờ không được đếm.

| Kiểm | Đo | Đối tượng | Đạt khi |
|---|---|---|---|
| `the-duyet:roi-kho` | Thẻ có ít nhất một bên mà `offer_id` không còn trong `sale_offers` (tin nghỉ hoặc khoá chết) | `entity_match` | 0 |
| `the-duyet:anh-ops` | Thẻ có ít nhất một bên không có dòng `media` nào mang `local_file` (vai Vận hành chỉ thấy ảnh đã tải) | `entity_match` | 0 |
| `the-duyet:anh-admin` | Thẻ có ít nhất một bên không có dòng `media` nào (quản trị viên thấy cả URL gốc) | `entity_match` | 0 |
| `the-duyet:do-day` | Mỗi bên, theo nguồn của bên: số bên có giá trị ở từng trường trong 10 trường của bảng so — giá, DT, giá/m², phường, loại hình (khác `unknown`), PN, WC, đường, toà, tầng — cộng «người đăng» (`seller_phone_hash` hoặc `seller_name` có giá trị) — đọc từ `sale_offers` hiện tại; bên rời kho tính là thiếu cả 11 | `S03`/`S05`/`S06` (nguồn có bên trong thẻ chờ) | chỉ báo (Hỏi-1) |

Không thẻ chờ nào → ba kiểm đầu ghi `tong=0` và đạt; `do-day` không ghi dòng nguồn nào.

### 2. Lệnh và ghi

`pipeline/do-the-duyet.mjs [--write]`, cùng khuôn `do-danh-ba-sdt.mjs` (SD5, Mạnh duyệt 31/10): đọc trong giao dịch chỉ
đọc; `--write` ghi `dq_check_results` theo ngày giờ máy thu (`Asia/Ho_Chi_Minh`), xoá dòng hôm nay cùng kiểm + đối tượng
rồi chèn, một giao dịch — chạy hai lần cùng ngày không nhân dòng. Ở `do-day`, dòng của nguồn không còn bên nào hôm nay bị
xoá theo cùng luật ngày. `detail` dòng `khoá=giá trị` chỉ số đếm (không offer_id, không chữ tin, không URL).

### 3. Nhịp chạy

Bước cuối `scripts/cloud-sync.sh`, sau `do-danh-ba-sdt` (cùng nhịp SD5 — Hỏi-3 đã duyệt 31/10).

### 4. Hiện trên `/ops/quality`

`app/src/lib/dq-labels.ts` diễn giải bốn kiểm (đối tượng `entity_match` → «Thẻ ghép căn chờ duyệt», nguồn `S0x` đã có);
`CONTEXT.md` thêm thuật ngữ. Ca ON12-AC-5 đòi mọi dòng kiểm được diễn giải.

## Ngoài phạm vi

Sửa các lỗi được đo (H1 thẻ khoá chết, H3 ảnh S05, H5 ảnh S06 cho vai Vận hành, H7/H8 bộ đọc) · thẻ `agent_output` · ngưỡng
đạt cho độ đầy.
