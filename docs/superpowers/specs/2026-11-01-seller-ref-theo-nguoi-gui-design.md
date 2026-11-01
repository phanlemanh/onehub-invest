# seller_ref S03/S05 theo người gửi bài — thiết kế

Hàng HD4 (`docs/plan/lo-trinh.json`), dãy P3. Căn cứ: `docs/research/audit-hang-duyet-3010.md` §3b, H15.

## Vấn đề

`transform-zalo.mjs` (S03) và `transform-fb.mjs` (S05) ghi `seller_ref = post.author_hash` của bài đầu tiên gom vào
tin. `author_hash` là mã của agent thu, không phải người đăng: hôm nay S03 có 1 giá trị cho mọi tin, S05 cũng 1. Danh
tính thật nằm ở `stg_zalo_posts.sender_id` (S03: 887 giá trị · S05: 29). «Tin cùng người đăng» theo `seller_ref` vì
thế trả về cả nguồn.

## Thiết kế

1. **Một hàm chọn người gửi của tin** — `chonNguoiGuiTin(bai)` trong `pipeline/transform-zalo.mjs`, cạnh `chonSdtTin`;
   `transform-fb.mjs` nhập cùng hàm (như đang nhập `chonSdtTin`).
   - Đầu vào: các bài của tin `{ post_id, posted_at, sender_id }`.
   - Thứ tự neo: `posted_at` sớm nhất, hoà thì `post_id` nhỏ nhất — cùng thứ tự neo của `chonSdtTin`.
   - Trả `sender_id` (đã trim) của bài đầu tiên theo thứ tự neo có `sender_id` khác rỗng; không bài nào có → `null`.
   - `seller_phone` giữ luật «nhiều bài nhất» của `chonSdtTin`; ở tin nhiều người gửi hai cột có thể thuộc hai người
     (OOS-5). Tin S03 gom theo người gửi (`repostKey`) nên ca này chủ yếu ở S05.
2. **Hai transform** ghi `seller_ref: chonNguoiGuiTin(o.posts)`; `o.posts` mang thêm `sender_id`. Bỏ `authorHash`
   khỏi đối tượng tin — không còn đường nào đưa mã agent thu vào `seller_ref`.
3. **Không rơi về `author_hash`**: tin không có người gửi nào → `seller_ref` NULL. Giá trị hằng chính là lỗi H15.
4. **`sync-cloud.mjs` không đổi.** Che hiện có (`SELLER_REF_EXPR`) giữ đuôi số: `sender_id` S03 toàn số (46.174/46.174
   bài có người gửi) → cloud nhận `S03:<số>`; leak gate (`SELLER_REF_RE`) vẫn khớp. `sender_id` S05 có 7/44 bài đuôi
   không phải số → cloud NULL. Đổi cách che là T3 và nằm ngoài vùng hàng (OOS-1).
5. **Bên đọc khác**: `pipeline/lib/danh-ba-nguoi.mjs` (`rutDinhDanh`) chỉ đọc `seller_ref` cho S06; S03/S05 đọc người
   gửi theo `post_ids` → không đổi (AC-6 khoá điều này). App, agent, data-api không đọc cột này (chỉ sổ từ vựng sinh).
6. **Ghi đè giá trị cũ**: `writeOffers` upsert `seller_ref = EXCLUDED.seller_ref` → lượt nạp đêm kế tự thay hằng
   bằng người gửi; không cần migration.

## Đo

- Ca thuần `pipeline/scripts/seller-ref.test.mjs` (CI, `executors.test.pipeline`): hàm chọn + ma trận + đối chứng
  bản sao; `rutDinhDanh` không phụ thuộc `seller_ref` S03/S05.
- Ca DB `pipeline/scripts/seller-ref.itest.mjs` + thước `pipeline/scripts/do-seller-ref.mjs` (executor
  `executors.test.seller_ref_that`, giám sát duyệt P3-141): DB thử `oneinvest_p3_sref`, BEGIN…ROLLBACK, không ghi
  `oneinvest`. Thước chạy transform của cây và transform của commit nền `ed0ff2cd` trên cùng bản chép dữ liệu thật:
  bản cây phải đạt «Bật khi», bản nền phải trượt.

## Đặc tả UX

Không chạm UI (xem sổ: bỏ đặc-tả-UX).
