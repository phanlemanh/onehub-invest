# sua-xa-bo-nut-ung-vien — lệnh sửa mã xã bỏ qua nút dự án ứng viên (thiết kế)

Việc Ngoài-1 của DA32 `ma-du-an-s06-thanh-nut`: Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 14/11
(`_acceptance/ma-du-an-s06-thanh-nut/decisions.jsonl`, dòng `Ngoài-1`). GS thêm hàng vào dãy P4, hạng T2, đi trước lời
«Áp thẻ luật S06 <băm>» vì phải gộp trước khi thẻ luật áp lên DB máy thu.

## 1. Lỗi

`suaXaNut` (`pipeline/danh-ba-vat-the.mjs`, lệnh `--sua-xa` của DV1 `nut-du-an-tro-xa-moi`) đọc MỌI nút `project`, rồi
`kiemTepXa` (`pipeline/lib/danh-ba-vat-the.mjs`) đòi mỗi slug có một mục trong `pipeline/data/xa-nut-du-an.json` — thiếu là
lỗi `thiếu nút <slug>`, `suaXaNut` ném `LoiGoi`, không ghi gì. Thẻ luật S06 (DA32) đúc khoảng 320 nút `project` mang
`catalog_tier = 'mot_loi_khai'`; các nút này không có mục trong tệp xã (xã của chúng lấy từ tin S06 lúc đúc). Áp thẻ xong
thì `--sua-xa` hỏng hẳn: mã xã của 20 dự án có sẵn và phường kế thừa của toà ngừng cập nhật.

## 2. Sửa

Đúng một điều kiện ở câu đọc nút trong `suaXaNut`: bỏ nút `mot_loi_khai`, viết qua `to_jsonb` như hai bên đọc của DA32 để
câu chạy được cả trên DB chưa áp migration 100 (chưa có cột):

```sql
SELECT id::int AS id, slug, area_ids FROM asset_nodes n
 WHERE node_type = 'project' AND (to_jsonb(n) ->> 'catalog_tier') IS DISTINCT FROM 'mot_loi_khai' ORDER BY slug
```

`kiemTepXa`, tệp xã và phần còn lại của tệp giữ nguyên: nút xác minh thiếu mục vẫn là lỗi (luật DV1 không nới). Diff hẹp có
chủ ý: DA33 (P3) đang sửa cùng hai tệp, nhận main sau hàng này.

Nút ứng viên không được `--sua-xa` đụng tới: `area_ids` của nó là xã nhiều tin nhất lúc đúc (DA32 AC-4). Khi một nút ứng
viên được nâng hạng (`xac_minh`) thì nó phải có mục trong tệp xã như mọi nút khác — đúng luật DV1.

## 3. Đo

Test mới ở tệp riêng `pipeline/scripts/sua-xa-ung-vien.itest.mjs` (không chạm itest DV1 hay tệp của DA33), trên DB của
riêng lượt chép máy thu: áp 100, chèn một nút ứng viên, chạy `suaXaNut` thật. Chiều đỏ: bản sao `danh-ba-vat-the.mjs` bỏ
điều kiện lọc (chép ra tệp tạm, import tuyệt đối — cùng khuôn `resolve-properties-khoa-gop.itest.mjs`) phải ném `LoiGoi`
gọi tên slug nút ứng viên. Hồi quy: các ca DV1 hiện có (`dv1_db`) chạy không sửa trên DB chưa áp 100.

## 4. Không gian đã quét

- Trục A — hạng nút × có mục trong tệp: xác minh có mục (sửa như cũ) · xác minh thiếu mục (vẫn lỗi) · ứng viên không mục
  (bỏ qua) · ứng viên có mục (bỏ qua — không xảy ra hôm nay). [CE: luật DV1 + DA32 Hỏi-3]
- Trục B — lược đồ: DB chưa áp 100 · đã áp 100. [CE: thứ tự gộp trước, áp sau]
- Never: nới `kiemTepXa` cho nút xác minh; sinh mục tệp xã cho nút ứng viên.

## Đặc tả UX

Bỏ — không chạm giao diện.
