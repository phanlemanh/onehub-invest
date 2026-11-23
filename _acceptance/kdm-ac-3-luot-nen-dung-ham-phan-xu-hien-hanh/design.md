# HT5 — lượt nền KDM-AC-3 dùng bộ phân xử hiện hành

Hàng HT5 (GS cắt 22/11, dãy P3). Ca `KDM-AC-3 ba chiều trên cùng DB` (`scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`) đỏ trên main
f962afade với DB thử chép dữ liệu máy: «FAIL lượt nền: 7951 tin có phường hợp lệ ở DB thật bị gỡ hay đổi khu vực», kèm hai dòng
«CHUA-AP-068» của bộ gán SĐT. Lượt chấm MH1 vòng 1 vấp đúng ca này (E9d).

## Gốc lỗi (đo 22/11 trên bản chép `db/db-thu.sh`, mọi lượt trong giao dịch rồi ROLLBACK)

- Bản mẫu DB thử, bản chép của lượt và DB máy thu (chỉ đọc) có cùng `resolve_offer_fields` (md5 43a6d7e1…, có phần giữ khoá
  `seller_phone` của 068 và lời gọi `resolve_offer_area_du_an` của 099). Hạ tầng DB thử không lỗi.
- `kiem-tin-rao-gan-khu-vuc.mjs --thu` gọi `napPhatBieu` (`pipeline/lib/nap-045.mjs`) trước lượt nền. Hàm này nạp lại thân
  `resolve_offer_fields` của 045 rồi vá lại 059/063/066, 061 + 069, 095 — nhưng KHÔNG áp lại 068 và 099. Hai migration này không
  chép thân hàm mà đọc định nghĩa đang chạy rồi chèn cạnh mốc; 099 tự ghi «migration sau ghi đè resolve_offer_fields thì áp lại
  099 (cùng 068)». Đo từng bước: sau `napPhatBieu` hàm thành md5 f60a7d0e… (mất 068), ba transform không đổi hàm, ROLLBACK trả lại.
- Phép thử: lượt nền với `napPhatBieu` như cũ → 7.951 tin đổi khu vực; `napPhatBieu` rồi áp lại 068 + 099 → 0 tin. Vậy lượt
  `--thu` đang chạy transform với bộ phân xử cũ hơn DB, không biết phường suy từ dự án (DA45) → gỡ đúng các tin DA45 đã gắn.
- Đường ống thật không dính: `napPhatBieu` chỉ có ở test, thước và `phat-bieu-cat-chuyen.mjs --thu` (ROLLBACK); không job nào gọi.

## Cách sửa

- `napPhatBieu` đọc phần chèn DB đang có TRƯỚC khi nạp lại (068: `daCoPhanGiu068`; 099: thân bộ phân xử có lời gọi
  `resolve_offer_area_du_an`; bản `resolve_offer_area_du_an` đang chạy), rồi sau 095 áp lại 068, rồi 099, rồi trả lại đúng bản
  `resolve_offer_area_du_an` DB đang có (bản 102 nếu đã áp — 102 ghi «áp lại 099 sau 102 thì phải áp lại 102»). Chỉ áp lại thứ DB
  đã có: bộ phân xử sau nạp bằng đúng bản DB đang chạy. Đo: md5 hai hàm trước và sau `napPhatBieu` bằng nhau.
- `CHUOI_PHAN_XU` (045, 059, 061, 069, 095, 068, 099) khai mọi migration định nghĩa hay chèn vào `resolve_offer_fields`; ca canh
  quét `db/migrations` (`FUNCTION resolve_offer_fields` hay `to_regprocedure('resolve_offer_fields`) và đỏ gọi tên tệp thiếu.
- Thước `kiem-tin-rao-gan-khu-vuc.mjs` thêm `--phan-xu` (md5 hai hàm trước/sau `napPhatBieu`, ROLLBACK) và chiều đỏ
  `--pha bo-099` (`napPhatBieu` bỏ áp lại 099 — tuỳ chọn `boQuaChen` chỉ cho chiều đỏ).
- Ca HT5-AC-3 cần tin thật đã nhận phường DA45 → khai trong `scripts/ci-bo-qua.json` (DB trống của CI không có tin để gỡ).

## Không làm

- Không đổi migration, transform hay bộ phân xử thật; không chạm DB máy thu.
- Không đổi các bộ nạp khác (`napDacTrung`, `nap068` riêng): chúng không nạp lại thân 045.
- Phép đo AC-9 của PX1 (`nap-dvhc-do.mjs`) và các thước khác gọi `napPhatBieu` hưởng bản sửa mà không đổi mã; số của chúng có thể
  đổi theo (đúng hơn) — xem soát `phat-bieu-cat-chuyen --thu` trong hồ sơ.
