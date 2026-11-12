# Bộ test app chung bỏ bốn ca đo theo tải — E4B-AC-3/4/7 và CGT-DC chỉ chạy riêng

Hàng `app-test-chap-chon-e4b-sap` (dãy P2). Phần mã test chập chờn đã gộp ở #393; tài liệu này lo phần còn lại: hai
ca đo thời gian thật mà lời đã ký buộc chạy dưới tải.

## Vì sao

Làn trước chữ ký của PL34 (lượt 3, 09/11 23:41–00:51 giờ VN) đỏ ở bộ test app chung (`cd app && npm test`, tám tệp
song song, DB của riêng lượt chép từ DB máy thu):

| Ca | Tệp | Trần đã ký | Đo |
|---|---|---|---|
| E4B-AC-3 | `app/tests/tin-rao-doi-chieu.test.tsx` | mới dưới 700 ms mỗi sort, «chạy riêng VÀ trong suite» (`e4b-danh-sach-tin-nhanh` AC-3) | chạy riêng đạt; trong suite vượt khi máy bận |
| CGT-DC | `app/tests/can-gia-tot-doi-chieu.test.tsx` | `can-gia-tot-sua-ba-loi` AC-7: «chạy một mình», máy giữ trần 600 giây | kho nay 1.935 tin P1 bán; một mình ≈ 450 giây; trong suite tám tệp quá trần ca |

Hai ca này đo thời gian thật của câu SQL trên DB thật. Dưới tải tám tệp song song, thời gian theo tải máy chứ không
theo mã, nên sửa mã test không làm chúng bền được — chỉ đổi điều kiện đo mới làm được. Đổi điều kiện của tiêu chí đã
ký là việc của người ký.

Hai căn cứ đã có:
- `e4b-danh-sach-tin-nhanh` Known limits Ngoài-1 (Mạnh, Cổng Bằng chứng 08/11): ba ca E4B-AC-3, E4B-AC-4, E4B-AC-7
  «chạy trong bộ kiểm chung … gỡ ba ca bằng một việc nhỏ sau khi gộp».
- `can-gia-tot-sua-ba-loi` AC-7 đã viết điều kiện đo là «chạy ca CGT-DC một mình».

## Cách làm

- `app/package.json` script `test` đặt biến môi trường `ONEHUB_SUITE_CHUNG=1` bằng `env` ngay sau `db-thu.sh … --chay` (giữ `npm test` mở đầu bằng `db-thu`, ca DT-AC-7 của `scripts/db-thu.test.mjs`).
- Một hàm nhỏ trong `app/tests/` trả lý do bỏ qua khi biến đó bật: «chạy riêng qua executor `<tên>`»; bốn ca dùng nó
  trong `skip:` (gộp với lý do CI sẵn có). Executor riêng `tir_doi_chieu` và `can_gia_tot_doi_chieu` không đặt biến
  nên bốn ca chạy thật ở đó.
- Ca «E4b đối chiếu DB máy thu» (AC-1, AC-2 của e4b — dưới 1000 ms «dưới tải suite») và ca bộ đếm CGT-DC (không
  chạm DB) VẪN chạy trong bộ chung.
- Không đổi một hằng trần nào: 700, 1000, `timeout` các ca giữ nguyên từng ký tự.

## Bảng thay lời (khi Mạnh duyệt)

| Tiêu chí đã ký | Lời cũ | Lời mới (AC-3 của hồ sơ này) |
|---|---|---|
| `e4b-danh-sach-tin-nhanh` AC-3, When | «… ở cả hai điều kiện: chạy riêng trên DB máy thu, và trong suite app (DB của riêng lượt, tám tệp song song)» | «… chạy riêng trên DB máy thu (executor `tir_doi_chieu`)» |
| `e4b-danh-sach-tin-nhanh` AC-3, Then | «bản mới dưới 700 ms ở cả bốn kiểu sắp, ở cả hai điều kiện» | «bản mới dưới 700 ms ở cả bốn kiểu sắp» |
| `can-gia-tot-sua-ba-loi` AC-7 | không đổi lời — đã là «một mình»; hồ sơ này chỉ làm cho bộ chung khớp lời đó | — |

Như tiền lệ `pl34-lich-dem-sau-buoc` thay lời `enrich-chay-sau-nap`/AC-6: không sửa hợp đồng đã ký, tiêu chí của hồ sơ
này mang lời mới.

## Lối khác đã cân

- Giữ trong suite, chấp nhận làn app đỏ khi máy bận rồi chạy lại: mỗi lượt làn ghim lại 40–80 phút, đỏ ngẫu nhiên chặn
  mọi hồ sơ T2 chạy suite app (PL34 lượt 3).
- Nới trần (1000 ms, 1.200 giây): cấm — người giao «không nới trần».
- Làm câu nhanh hơn (index 085 cho E4b; tăng tốc `getDeal` cho CGT-DC): đúng hướng nhưng là hàng sản phẩm riêng, T3 với
  085; không gỡ được đỏ theo tải trước khi PL34 ký.
