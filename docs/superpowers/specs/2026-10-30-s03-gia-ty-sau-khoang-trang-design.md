# s03-gia-ty-sau-khoang-trang — giá tỷ viết bằng đồng không bị nuốt khi sau giá là khoảng trắng + số ngắn

Hồ sơ: `_acceptance/s03-gia-ty-sau-khoang-trang/` · hàng phát sinh từ Ngoài-3 của `s03-gia-ty-chan-dong` (PR #191) ·
hạng T2 · không migration.

## Vấn đề

`s03-gia-ty-chan-dong` dạy `gatSo` (bước gạt SĐT trước khi đọc số, `pipeline/transform-zalo.mjs`) bỏ qua một khớp SĐT
là đuôi nhóm nghìn của số tiền: khớp đứng ngay sau «chữ số + dấu chấm/phẩy» và CHỈ gồm các nhóm 3 chữ số nối bằng
cùng dấu («3.|000.000.000»). Nhưng `PHONE_RE` cho phép một ký tự cách (`[.\-\s]`) giữa hai chữ số và ăn tới 11 chữ số.
Khi ngay sau giá là một ký tự cách rồi một số 1–2 chữ số, khớp kéo dài sang số đó:

| Chữ | Khớp SĐT | Trước sửa |
|---|---|---|
| «Bán nhà 3.000.000.000\n50m2» | «000.000.000\n50» (11 số) | giá null, diện tích null |
| «Bán 2.000.000.000 2PN» | «000.000.000 2» (10 số) | giá null |
| «Bán căn 1.050.000.000\n60m2» | «050.000.000\n60» | giá null |
| «Bán nhà 3.000.000.000 50m2» | «000.000.000 50» | giá null |
| «Bán căn 3.000.000.000 đ, 50m2» | «000.000.000» (sau là «đ») | 3 tỷ (đúng — vòng trước) |
| «Bán căn 3.000.000.000-3.500.000.000» | «000.000.000-3» | giá null (gạch — ngoài vòng) |

Khớp không còn là đuôi nhóm nghìn thuần nên bị gạt: mất giá, và mất luôn số đứng sau (diện tích, số phòng). Đo 30/10
trên bài S03 thật: 0 bài đang dính. Vòng này phòng trước.

## Cách sửa

Giữ nguyên `PHONE_RE`, `extractPhones` và hai điều kiện của vòng trước. Thêm vào `laDuoiNhomNghin` đúng một nhánh: khớp
cũng được nhận là đuôi nhóm nghìn khi nó là **các nhóm 3 chữ số nối bằng cùng dấu, nhóm cuối là «000», rồi một khoảng
trắng (kể cả xuống dòng) và 1–2 chữ số**, VỚI điều kiện thân số tiền trước dấu (1–3 chữ số) không dính chữ cái hay dấu
chấm/phẩy phía trước («Bán 3.|…» được, «50m2.|…» không). Khi đó cả khớp được giữ nguyên (không gạt), nên luật giá đồng đọc
được giá và số đứng sau còn nguyên cho luật diện tích/phòng.

Ba điều kiện của nhánh và vì sao:

1. **Khoảng trắng/xuống dòng** — đúng dạng ô cơ hội đã đặt ngưỡng. Gạch («3.000.000.000-3.500.000.000», khớp thật
   «000.000.000-3») và dấu chấm («…000.2PN») giữ như trước vòng (Out of scope).
2. **Nhóm cuối «000»** — giá viết bằng đồng tròn tới nghìn đồng. SĐT 3-3-3 kèm đuôi đứng sau «số + dấu chấm» («LH
   2.098.765.432 1») có nhóm cuối khác «000», nên vẫn bị gạt.
3. **Thân số tiền không dính chữ** — SĐT nhóm cuối «000» đứng sau «50m2.» («50m2.098.765.000 1») vẫn bị gạt.

Thử bản nháp chỉ có điều kiện 1 (chưa có 2, 3): «Cho thuê 9tr 50m2.098.765.432 1 T.Lan» đọc ra giá thuê 1 tỷ và chốt
khoảng giá bỏ luôn tin — đó là lý do có hai điều kiện sau.

Phần dư: SĐT viết 3-3-3 có nhóm cuối «000», đứng sau một số đứng riêng và dấu chấm, kèm khoảng trắng + 1–2 chữ số. Dạng này
hẹp hơn SĐT 3-3-3 thuần đứng sau «chữ số + dấu chấm» («LH 2.098.765.432») mà khuôn vòng trước đã ký vẫn giữ lại.

SĐT viết liền, 4-3-3 (nhóm đầu 4 chữ số), 3-3-4 (khúc cuối 4 chữ số liền, không có dấu cách trước 1–2 chữ số), SĐT sau dấu
câu, SĐT nối SĐT — không khớp dạng của nhánh — vẫn bị gạt như vòng trước. Phần đuôi tối đa 2 chữ số tự nó không thể là SĐT.

Lối đã loại:
- (a) Sửa `PHONE_RE` (cấm khoảng trắng trước 1–2 chữ số cuối): đổi danh sách SĐT người bán (`extractPhones` dùng chung
  regex) — trái khuôn vòng trước đã ký (giữ nguyên `PHONE_RE` và `extractPhones`).
- (b) Cắt khớp: giữ phần nhóm nghìn, gạt phần đuôi — đuôi không phải SĐT, gạt nó làm mất diện tích «50m2».
- (c) Điều kiện theo chữ đứng sau đuôi (m2, PN, tầng…): đuôi theo sau bởi đủ loại chữ, không liệt kê đủ được; ba điều
  kiện trên không phụ thuộc chữ đứng sau.

Không đổi luật giá, luật diện tích, chốt khoảng giá, khoá gom. Giá mới đọc được vẫn qua chốt khoảng giá của N1.

## Đo

- Ca thử thuần mới `pipeline/scripts/gia-ty-sau-khoang-trang.test.mjs` (trong `npm test` của pipeline): ma trận giá +
  khoảng trắng + 1–2 chữ số, ma trận SĐT (mỗi điều kiện của nhánh một dòng chỉ nó chặn), SĐT trích ra so với bản nền ghim
  `ec899d03` (git show — CI checkout `fetch-depth: 0`), chốt khoảng; mỗi ma trận có ca đỏ trên bản sao đột biến.
- Không lùi: ma trận `gia-ty-chan-dong.test.mjs` và N1 vẫn xanh; phép đo N1 `do-cam-mau-s03.mjs` trên DB thử (executor
  `cam_mau_s03_that` có sẵn).
- Dữ liệu thật: `pipeline/scripts/so-gia-ty-sau-khoang-trang.mjs` so TOÀN BỘ đầu ra `parsePost` (mọi trường) của bản
  nền ghim `ec899d03` với bản cây trên mọi bài S03 thật (chỉ đọc). Đạt khi: đã so ít nhất một bài (DB rỗng hay trỏ nhầm
  là TRƯỢT); 0 bài đổi danh sách SĐT; mọi bài đổi đầu ra đều chứa dạng «số tiền nhóm nghìn + khoảng trắng + 1–2 chữ số»
  VÀ giá mới của bài bằng đúng giá trị số tiền ấy VÀ mọi trường khác bị đổi chỉ đổi từ null sang đúng số đuôi (quan hệ,
  không chỉ có mặt). Lượt đối chứng luôn chạy: bản sao bỏ điều
  kiện nhóm cuối «000», trên cùng bộ bài cộng bài tổng hợp «Cho thuê 9tr LH 2.098.765.432 1 T.Lan» — phải TRƯỢT và gọi
  tên bài tổng hợp. (Rút ba giới hạn đã ghi ở Known limits của vòng trước: so một phần trường, đạt suông khi DB rỗng,
  nhãn chỉ kiểm có mặt.)

## Không làm

- Giá nhóm nghìn bằng dấu cách («3 000 000 000 đ») — như vòng trước.
- Hai lỗi giá N1 đã ghi Known limits («/mỗi tháng»; tổng giá + đơn giá bằng đồng).
- Đổi cách làm luật giá (bỏ vá regex), nạp lại S03 thật (bước triển khai sau gộp).
