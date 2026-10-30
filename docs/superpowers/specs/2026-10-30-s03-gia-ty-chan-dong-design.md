# s03-gia-ty-chan-dong — giá tỷ chẵn viết bằng đồng không bị bước gạt SĐT nuốt

Hồ sơ: `_acceptance/s03-gia-ty-chan-dong/` · hàng phát sinh từ Ngoài-8 (vòng 3) của `s03-cam-mau-so-lieu` (N1, PR #189) ·
hạng T2 · không migration.

## Vấn đề

N1 đọc số trên chữ đã gạt URL và SĐT (`gatSo` trong `pipeline/transform-zalo.mjs`). Regex SĐT dùng chung
`PHONE_RE = /(?<!\d)(?:\+84|0)(?:[.\-\s]?\d){8,10}(?!\d)/g` chỉ cấm bắt đầu ngay sau một chữ số. Với «3.000.000.000»,
vị trí số 0 ngay sau dấu chấm đầu tiên qua được điều kiện đó, và «000.000.000» đủ 9 chữ số nên bị coi là SĐT rồi thay
bằng dấu cách. Chữ còn lại chỉ là «3.», nên luật giá đồng `GIA_DONG` không đọc được gì: giá ra null.

| Chữ | Trước sửa |
|---|---|
| «Bán nhà giá 3.000.000.000 đ» | null |
| «Bán 15.000.000.000» | null |
| «Bán căn 2.000.000.000đ» | null |
| «Bán căn 4.200.000.000» | 4,2 tỷ (đúng — nhóm sau dấu chấm đầu không bắt đầu bằng 0) |

Đo 30/10 trên 21.934 bài S03 thật (chỉ đọc): 150 bài có giá viết bằng đồng, **0 bài** mất giá vì lỗi này. Lỗi có thật
trên chữ thử nhưng chưa chạm dữ liệu thật hôm nay — vòng này phòng trước, giá trị chủ yếu là chặn lỗi khi môi giới
viết kiểu này.

## Cách sửa

Giữ nguyên `PHONE_RE` và `extractPhones` (danh sách SĐT người bán không đổi). Chỉ trong `gatSo`, một khớp SĐT bị BỎ
QUA (không gạt) khi cả hai điều kiện đúng:

1. ký tự ngay trước khớp là dấu chấm hay phẩy, và trước nó nữa là một chữ số («3**.**000…»);
2. khớp có dạng đuôi nhóm nghìn: các nhóm đúng 3 chữ số nối bằng CÙNG dấu ấy («000.000.000», «000,000,000»).

Hệ quả:

- Đuôi nhóm nghìn của số tiền («3.|000.000.000») không còn bị gạt, `GIA_DONG` đọc được 3 tỷ.
- SĐT nối SĐT («0901234567,0912345678», «0901234567.0912 345 678») vẫn bị gạt cả hai số, vì số thứ hai không có dạng
  nhóm 3 chữ số; SĐT sau «50m2,» cũng vậy. Nhánh «678 T.Lan» đọc thành 678 tỷ — lớp lỗi N1 đã chặn — không mở lại.
- SĐT sau dấu chấm câu («liên hệ.0901 234 567») vẫn bị gạt (ký tự trước dấu chấm là chữ).

Lối đã loại: (a) thêm điều kiện vào `PHONE_RE` dùng chung — số thứ hai của SĐT nối SĐT không còn bị gạt (và mất khỏi
danh sách SĐT); (b) regex riêng cho `gatSo` với cùng điều kiện — vẫn để SĐT nối SĐT lọt vào bước đọc số; cả hai chạm
điều kiện CHẾT của ô cơ hội («một SĐT lọt vào bước đọc số»). (c) đọc giá đồng trước rồi mới gạt — đổi thứ tự của mọi
luật đọc số, phải dựng lại toàn ma trận N1 cho một lỗi chưa có bài thật nào.

Không đổi luật giá, luật diện tích, chốt khoảng giá, khoá gom. Giá đồng mới đọc được vẫn đi qua chốt khoảng giá của N1
(tin bán trên 100 tỷ, tin thuê từ 1 tỷ không thành offer).

## Đo

- Ca thử thuần mới `pipeline/scripts/gia-ty-chan-dong.test.mjs` (chạy trong `npm test` của pipeline): ma trận giá tỷ
  chẵn viết bằng đồng, ma trận SĐT sau dấu câu, SĐT trích ra, chốt khoảng; mỗi ma trận có ca đỏ trên bản sao đột biến.
- Không lùi trên dữ liệu thật: chạy lại phép đo N1 `do-cam-mau-s03.mjs` trên DB thử (bảy thước vẫn ĐẠT) qua executor
  `cam_mau_s03_that` có sẵn; và `pipeline/scripts/so-gia-ty-chan-dong.mjs` so đầu ra `parsePost` của bản nền ghim
  (`ecaf5ff0`) với bản cây trên toàn bộ bài S03 thật (chỉ đọc): số bài đổi giá, số bài đổi danh sách SĐT, kèm mã bài —
  mỗi bài đổi phải thuộc dạng giá tỷ chẵn viết bằng đồng, ngoài dạng đó là 0.

## Không làm

Giá tỷ chẵn viết nhóm nghìn bằng dấu cách («3 000 000 000 đ») — `GIA_DONG` chỉ đọc nhóm bằng dấu chấm; ngưỡng của ô cơ
hội áp cho dạng nhóm bằng dấu chấm.

Hai lỗi giá khác N1 đã ghi Known limits («7.000.000/mỗi tháng» mất giá; tin có cả tổng giá lẫn đơn giá bằng đồng mất
tổng giá) — khác gốc, giữ nguyên ở Known limits của N1. Đổi cách làm luật giá (bỏ vá regex) là việc riêng.
