# Bảng người bán thêm dòng cho SĐT mới — thiết kế (SD1, `sellers-them-dong-lai`)

Hàng SD1 của lộ trình (`docs/plan/lo-trinh.json`), Hỏi-C bước 1 của audit bảng Người theo trục SĐT
(`docs/research/audit-bang-nguoi-sdt-3010.md` §0 N3, §6 hàng `sellers-them-dong-lai`), Mạnh duyệt 30/10.

## Vấn đề

Từ commit `907f4bd4` (21/10), transform thôi `INSERT INTO sellers`. `refresh-bait-gap.mjs` (bước 3) chỉ `UPDATE`
dòng đã có, bước 4 xoá dòng mồ côi. SĐT mới xuất hiện trên tin không bao giờ có dòng: bảng đứng ở 19 dòng trong khi
`sale_offers` có 208 SĐT khác nhau (đo 31/10; audit 30/10 ghi 161). Chip môi giới ở `/ops/deals` (`dealsSql` nối
`LEFT JOIN sellers`) thiếu trên phần lớn tin có SĐT. Phép đối chiếu AC-8 của DB2b (`sellersThieuNguoi`) chỉ nhìn 19
dòng nên luôn xanh.

## Cách làm

1. **Bước 3 của `refreshBaitGap` thành upsert một câu**: cùng CTE tổng hợp theo `seller_phone_hash` như hôm nay, rồi
   `INSERT INTO sellers (...) SELECT ... ON CONFLICT (phone_hash) DO UPDATE` — cột tổng hợp (`n_ads`, `sources`,
   `first_seen`, `last_seen`, `flags`) GHI ĐÈ bằng số tính lại từ tin (script vẫn là chủ duy nhất, không cộng dồn — lỗi
   cũ `907f4bd4` sửa); `name` giữ tên đã có (`COALESCE(sellers.name, EXCLUDED.name)`), dòng mới lấy tên từ tin.
   `RETURNING (xmax = 0)` tách số thêm và số cập nhật; bước in một dòng «thêm X, cập nhật Y», kết quả trả thêm
   `sellersInserted`.
2. **Bước 4 (xoá mồ côi + audit `bait-gap:sellers-orphan`) giữ nguyên.** Sau bước 3 + 4, tập dòng `sellers` bằng đúng
   tập SĐT trên `sale_offers`.
3. **`sellersThieuNguoi` đối chiếu trên tập (SĐT, nguồn) của `sale_offers` HỢP với `sellers`** — không còn phụ thuộc
   bảng `sellers` đủ dòng; giữ phần `sellers` để ca AC-8 đã ký của DB2b đo nguyên như cũ.

Không đổi: luồng cloud (`sync-cloud.mjs` đã đưa `sellers` lên với `phone_hash` + cột tổng hợp, `name` ở lại máy —
quyết định `cloud-sync-atomic#d-20261023T022344Z-17`), luật hiện chip (`deal-card.tsx`: chip khi người bán có hơn một
tin), migration (bảng 022 đủ cột).

## Phép đo

- Test fixture trong `pipeline/scripts/bait-gap-sellers.test.mjs` (BEGIN…ROLLBACK trên :5433, chạy cả CI vì chỉ cần
  lược đồ): ma trận SĐT viết trước, mỗi ca có chiều đỏ bằng bản đột biến của `refresh-bait-gap.mjs` chép tạm cạnh tệp
  thật (bỏ lệnh thêm dòng · cộng dồn `n_ads` · ghi đè tên).
- Probe DB máy thu (bỏ qua có lý do dưới CI): chạy bước trên dữ liệu thật trong ROLLBACK, số dòng = số SĐT, lượt hai
  không đổi; `dealsSql` của app sau bước: mọi tin có SĐT có số tin người bán.

## Ngoài phạm vi

- `sellers` thành view trên danh bạ, khoá SĐT dạng `+84…` — Hỏi-C bước 2, hàng SD3 `sdt-luu-goc-e164`.
- Đo trục SĐT hằng đêm trên `/ops/quality` — hàng `do-danh-ba-sdt`.
- Đổi luật hiện chip (một tin vẫn không hiện chip).

## Đặc tả UX

Không chạm giao diện: chip ở `/ops/deals` đọc dữ liệu đã có; số dòng sửa ở pipeline (dòng sổ «bỏ đặc-tả-UX»).
