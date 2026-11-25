# Đẩy bản chép đã lọc sang M5 — thiết kế (HT25)

Hàng HT25 `day-ban-chep-sang-may-phat-trien`, dãy P2, T3, GS cắt 25/11 sau lời Mạnh không chép tay được. Đầu vào: bản chép đã lọc của
HT18 (`scripts/ban-chep-da-loc.mjs`, bộ soát tầng A trên DB đích, tệp dump + `ke.json`).

## 1. Lời người và luật đã chốt

- Mạnh 25/11: «Tôi không tự làm được hãy phân tích và mô hình để tự động hoá được» · «Vì đều là mạng nội bộ nên không vấn đề gì
  cũng chỉ là tôi ngồi ở 2 máy thôi» · «Cho máy làm trọn» (phủ: địa chỉ cố định cầu Thunderbolt hai máy, cài khoá ép lệnh lên M5,
  lượt đẩy đầu + kiểm Invest trên M5, năm chỗ ghi tài liệu; KHÔNG phủ plist hằng đêm) · «Hiện nay không có việc gì sao không setup
  trước hết luôn?». GS đối chiếu ba lời đầu là người gõ.
- Năm rào của GS (rào, không phải cách làm): (1) cổng rời máy ở Mac mini — băm tệp đã soát = băm tệp đẩy; (2) một chiều, khoá chỉ
  chạy lệnh nhận, không shell, không chuyển cổng, M5 không có khoá vào Mac mini; (3) M5 không nhận từ điển, `.env`, raw snapshot,
  cấy một dòng tầng A thì lượt đỏ trước khi rời máy; (4) lùi được, đếm lệch thì không đổi tên; (5) chỉ theo lệnh, plist là hàng sau.
- GS: không thêm mã hoá hay VPN ngoài SSH có sẵn; ba cổng T3 vẫn trình (lời Mạnh phủ việc áp, không thay chữ ký); ADR-0019.

## 2. Bảng phủ ca (đo 25/11 trên Mac mini)

| Chiều | Giá trị | Số đo | Ai đọc phía sau |
|---|---|---|---|
| Đường truyền | cầu Thunderbolt `bridge0`, liên kết 80 Gb/s | SSH qua cầu vào M5 được; 1 GB qua SSH 0,82 s | lệnh đẩy |
| Địa chỉ | tự cấp dải link-local (đổi khi rút cáp) | `<địa chỉ cầu Mac mini>`, `<địa chỉ cầu M5>` (ghi ở cấu hình riêng máy) | lệnh đẩy → đặt cố định (AC-9) |
| Tệp đẩy | dump + `ke.json` của HT18 | ~51 MB, 23 bảng, ~1,016 triệu dòng | bước nhận M5 |
| DB trên M5 | container `one-invest-db` (colima), cổng 5433 không ổn định | nạp bằng `docker exec … pg_restore` | app + data-api M5 |
| Khoá | `<khoá dựng máy>` (đủ quyền shell) | đang dùng cho dựng máy | thay bằng khoá ép lệnh cho việc đẩy |
| Lịch | theo lệnh | — | plist: ngoài phạm vi (lời riêng) |

## 3. Luồng

```
Mac mini                                               M5
1. chép + soát (HT18) → dump + ke.json, ghim sha256
2. so sha256 tệp = ke.json; danh sách tệp đúng 2
3. ssh qua địa chỉ cầu, khoá ép lệnh,     ──────────▶  4. nhan-ban-chep.sh (command= ép):
   tệp đi qua stdin của lệnh con `nhan`
                                                          nhận vào thư mục đến (.part → đổi tên)
                                                          so sha256 · --kiem --khong-tu-dien
                                                          pg_restore vào oneinvest_moi · đếm = ke.json
                                                          oneinvest → oneinvest_cu, oneinvest_moi → oneinvest
5. ghi sổ, in một dòng kết quả       ◀──────────────      trả mã (0 xanh; khác 0: DB đang chạy nguyên)
```

Cách truyền duy nhất: luồng stdin vào lệnh con `nhan` (không scp, không sftp — dưới `command=` chúng bị ép về bước nhận và bước nhận
từ chối). Lệnh đẩy gọi ssh với `-i <khoá đẩy> -o IdentitiesOnly=yes -o IdentityAgent=none` để không bao giờ xác thực bằng khoá dựng máy.
Bước nhận chỉ chạy khi có `SSH_ORIGINAL_COMMAND` (đi qua `command=`), chỉ nhận lệnh con trong danh sách đóng, từ chối mọi ký tự ngoài
`[a-z0-9-]`. Tên container và tên DB chạy đọc từ biến của lượt (mặc định trên M5: `one-invest-db`, `oneinvest`); bước nhận đọc vai máy
từ `~/.config/onehub/hai-may.env` và từ chối khi vai là máy thu, trừ DB tên `oneinvest_suite_*` của lượt test.

Lệnh: `node scripts/day-ban-chep.mjs` (Mac mini). Bước nhận: `scripts/nhan-ban-chep.sh` (chép sang M5 một lần lúc cài; khoá ép lệnh
chỉ gọi được nó, có các lệnh con `nhan`, `lui`, `trang-thai`). Cấu hình riêng máy (địa chỉ cầu, đường khoá, người dùng M5) ở
`~/.config/onehub/hai-may.env` của Mac mini và `CLAUDE.local.md` — không vào kho công khai.

## 4. Tài liệu (điều kiện xong)

ADR-0019 (mô hình + lối đã bỏ) · AGENTS.md mục «Hai máy» · `docs/ops/hai-may.md` (đẩy, kiểm sau, lùi, thu hồi khoá, rút cáp) trỏ từ
`docs/ops/runtime-map.md` · ROADMAP §3 mục 64 (commit riêng, cuối, sau khi lấy main, báo GS trước khi đẩy) · `CLAUDE.local.md`.

## 5. Việc của người

Mạnh gõ mật khẩu quản trị cho lệnh đặt địa chỉ cầu trên hai máy (máy in sẵn lệnh). Ký ba cổng.
