# PL42 — Bài tìm viết tắt không thành tin rao thuê (`yeu-cau-khong-thanh-tin-thue`)

## Vấn đề

Phiên kiểm Inquiry 26/11: bài người tìm căn viết tắt («Tìm 1pn full 8tr», «Em tìm căn studio giá tầm 5tr») lọt thành tin rao
thuê S03, ngân sách của khách thành giá rao. Đếm DB máy thu 26/11 (nhãn Haiku hợp lệ mới nhất, chỉ đọc): **264 tin** S03
(rent_lt 248, sale 16) chứa bài Haiku nhận `inquiry` mà nhãn ghi trong 14 ngày 12–26/11; toàn bộ 322 tin. Trong 1.165 tin
thuê S03 nhãn «giá tốt», **51 tin** là tin rò theo cùng định nghĩa 14 ngày (70 nếu tính mọi nhãn) — kéo lệch hạng giá tốt bên thuê, đường găng của đợt.

Gốc: `YEU_CAU` (transform-zalo) chỉ bắt «tìm + mua|thuê|căn|nhà|phòng»; bài không khớp đi tiếp `suyLoai`, thấy «tr» → rent_lt
(nguồn `don-vi-gia`). Đo 188 bài rò theo ngày đăng 14 ngày: 177 rò qua `suyLoai`, 11 qua chữ bài (parsePost bắt «thuê dài hạn»
trong «cần thuê dài hạn»; 9 trong số đó `laYeuCau` đã đúng nhưng chữ bài thắng).

## Bảng phủ ca (bài trong tin S03 đăng 12–26/11, nhãn Haiku hợp lệ mới nhất; số bài khớp mẫu)

| Cách viết | Bài nhãn inquiry | Bài nhãn offer | Giữ? |
|---|---:|---:|---|
| «tìm (gấp/thuê) + N PN/N n/N WC» | 110 | 2 | giữ |
| «tìm (gấp) studio» | 12 | 0 | giữ |
| «tìm gấp» | 21 | 0 | giữ |
| «tim thue/mua» không dấu | 2 | 0 | giữ |
| «cần + studio/N PN» | 8 | 0 | giữ |
| câu xin gửi căn «ac/anh chị/ai (nào) có gửi/nhắn em» | 26 | 1 | giữ |
| «khách e cọc hụt/chốt» | 3 | 0 | giữ |
| «em/mình/e (đang) tìm» | 18 | 0 | giữ |
| «khách thuê/mua» | 16 | 230 | **bỏ** — phần lớn là tin rao «khách thuê cọc…» |
| không mẫu nào (có giá · không giá) | 24 · 5 | — | ngoài phạm vi → GT8 hoặc nhãn model |

Có giá / không giá: mẫu giữ áp như nhau (luật Yêu cầu chạy trước cửa giá của `suyLoai`).

Thử luật mới (hợp các mẫu giữ) trên toàn bộ 9.495 tin S03 đang sống: rút trọn 178 tin (175 có bài nhãn inquiry, 2 nhãn offer, 1
chưa nhãn); 52 tin chỉ mất bài Yêu cầu, giữ bài rao. Mẫu soi tay 25 bài bị rút ở tin có nhãn offer: đều là câu tìm căn
(«Tìm 2pn 7tr5 ko kén khu, ac có gửi em với ạ») — tin mang nhãn offer vì bài khác trong tin.

Ô bỏ (ngoài phạm vi, vì): rổ hàng và quảng cáo (GT8 — hàng riêng); bài tìm không khớp mẫu nào (29 bài 14 ngày — viết quá tự do,
mở luật thêm phải đo precision riêng; nhãn model ở YC0 giữ chúng ở ngăn chờ duyệt); S05.

## Thiết kế

1. **Mở `YEU_CAU`** bằng các mẫu «giữ» ở bảng trên — luật xác định, không đọc nhãn model (luật 7). Viết tắt «N n» kết bằng
   lookahead chữ có dấu như `DAU_HIEU_BDS` (không `\b` ASCII).
2. **Chữ bài không thắng Yêu cầu:** trong `suyLoai`, bài mà parsePost chỉ ra `rent_lt` vì cụm «thuê dài hạn» đứng sau «cần/tìm»
   (tức chính câu tìm) thì xét luật Yêu cầu trước — sửa ở bộ bắt cụm thuê của parsePost: «thuê dài hạn» không tính khi ngay
   trước là «cần|tìm».
3. **Dọn tin đã lọt bằng đúng đường transform:** lượt transform-zalo sau gộp dựng lại tin; tin chỉ còn bài Yêu cầu thì nghỉ theo
   luật nghỉ hiện có (PL14), tin còn bài rao thì bỏ bài Yêu cầu khỏi `post_ids`. Không sửa tay DB.
4. **Hồi quy hai chiều**: ma trận câu tìm (mỗi mẫu giữ một dòng, có và không giá) → Yêu cầu; ma trận tin rao đối chứng («khách
   thuê cọc», «đã có khách», «cho thuê … ac có nhu cầu ib em», «nhận ký gửi», «tìm khách thuê») → vẫn tin.

## Số thử (mô phỏng luật mới trên DB máy thu 26/11, chỉ đọc: bỏ khỏi mỗi tin các bài luật mới nhận, tin không còn bài là tin rút)

| Ô | Trước | Sau (thử) | Ngưỡng hợp đồng |
|---|---:|---:|---:|
| Tin S03 chứa bài nhãn inquiry (nhãn 12–26/11) | 264 | 76 | ≤ 85 |
| Tin thuê «giá tốt» trong số đó | 51 | 13 | ≤ 16 |
| Tin thuê «giá tốt» mất hẳn (tin rút trọn) | — | 36 | in, không ngưỡng |
| Tin rút trọn mà bài mang nhãn offer hay chưa nhãn | — | 3 | ≤ 10, chấm tay |

76 tin còn rò là bài tìm viết tự do không khớp mẫu nào hay tin gom với bài rao — chuyển GT8; YC0 giữ bài ấy ở ngăn chờ duyệt.
Số tin thuê «giá tốt» trên màn sau lượt đêm: 1.165 trừ 36 tin rút, rồi bước 420 xếp lại nhóm — số chính xác đo ở AC-5.

## Ô trên màn đổi và lệnh đo

- `/ops/data-flow` dòng S03: nhánh «Đọc thành Yêu cầu» tăng và «Đọc thành tin rao» (thuê) giảm đúng bằng số tin rút.
- Tin thuê S03 nhãn «giá tốt»: 1.165 → số đo sau lượt (in ở AC-5).
- Lệnh đo: `node pipeline/scripts/do-yeu-cau-lot-tin.mjs` (bản chép: `--kiem`).

## Hiệu lực trên DB máy thu

Không có lượt chạy riêng: lượt đêm `scripts/zalo-import-daily.sh` đã chạy `transform-zalo` rồi `xep-hang-gia` (420), nên luật mới
có hiệu lực ở lượt đêm đầu tiên sau gộp; tin rò nghỉ theo luật nghỉ hiện có (PL14), không sửa tay DB. Lùi: revert PR, lượt đêm
kế dựng lại tin cũ cùng khoá. Kiểm sau lượt đêm: `node pipeline/scripts/do-yeu-cau-lot-tin.mjs`.
