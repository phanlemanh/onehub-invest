# cong-tac-gop-nguoi-dem — công tắc cho bước gộp Người theo SĐT trong job đêm

Ngày: 2026-10-31 · Hàng: `cong-tac-gop-nguoi-dem` (Ngoài-1 của HD13 `nguoi-noi-theo-sdt`, Mạnh chọn «mở hợp đồng mới»
ở Cổng Bằng chứng 31/10) · Hạng: T2 · Dãy P3.

## Vấn đề

HD13 (PR #250) cho bộ dựng danh bạ `dungNguoi` gộp người theo SĐT vào người theo tài khoản cùng nguồn khi nối một–một.
Job đêm gọi `buocDem` (refresh-bait-gap) → `dungNguoi` rồi COMMIT ngay khi DB có bảng `parties`. DB máy thu đã áp 055 và
060, nên gộp #250 vào main là lượt đêm kế tiếp tự gộp ~195 người trên dữ liệu thật — trái OOS-5 của HD13 («chạy gộp trên
dữ liệu thật ngoài giao dịch ROLLBACK là bước triển khai riêng, Mạnh duyệt»).

## Thiết kế

**Công tắc là một dòng `ops_audit`** (cùng nếp cổng `phat-bieu:cat-chuyen` của PL15): `action = 'danh-ba:gop-sdt'`,
`detail = {"bat": true|false, "ly_do": "…"}`, `actor = 'dung-nguoi'`, `env = 'local'`. Dòng mới nhất (id lớn nhất)
thắng; không có dòng nào (hoặc DB chưa có bảng `ops_audit`) → **tắt**. Bảng chỉ-thêm nên lịch sử bật/tắt còn nguyên
(ai, lúc nào, vì sao).

**Bộ dựng** `dungNguoi(c, { gop })`:
- `gop` không truyền → đọc công tắc (`congTacGop(c)`); truyền `true`/`false` → dùng giá trị đó (thước, đối chứng).
- Tắt: vẫn tính `chonGop` (để báo số cặp chờ), nhưng KHÔNG ghi `parties` merged, KHÔNG ghi sự kiện `gop`, vai không
  ánh xạ theo cặp mới. Người đã gộp từ trước (khi công tắc từng bật) giữ nguyên — tắt không tách lại ai; vai vẫn ánh
  theo `merged_into` sẵn có.
- Trả thêm `cong_tac_gop: "bat"|"tat"` và `gop_cho` (số cặp đủ luật mà chưa gộp vì công tắc tắt; 0 khi bật). Dòng in
  thêm «· công tắc gộp tắt (chờ N)» khi tắt.
- `tachNguoi` không đổi: tách luôn chạy được; lượt dựng sau tách theo công tắc.

**CLI** `dung-nguoi.mjs --cong-tac-gop bat|tat --ly-do «…»`: chèn đúng một dòng `ops_audit` rồi COMMIT (`--thu` →
ROLLBACK), không chạy bộ dựng. Giá trị khác `bat`/`tat`, thiếu `--ly-do`, hay đi cùng `--tach` → thoát 2 trước khi mở
kết nối DB. Bật trên DB máy thu là lệnh Mạnh gõ — vòng này không chạy nó trên `oneinvest`.

**Thước dữ liệu thật** `nap-lai-nguoi.mjs`: lượt 0 với công tắc tắt (mặc định của DB thử chép máy thu) → gộp 0,
`gop_cho` = N1 chưa gộp đếm độc lập; rồi bật công tắc trong giao dịch → lượt 1 gộp N1 như HD13. Cả giao dịch ROLLBACK.

**Itest** `danh-ba-nguoi.itest.mjs`: các ca HD13 E3–E7, E9 bật công tắc trong giao dịch thử (`batCongTac(db)`); ca mới
đo chiều tắt, dòng mới nhất thắng, CLI ghi công tắc.

## Không làm

- Không migration (ops_audit có sẵn). Không đổi `do-danh-ba-sdt.mjs` (Ngoài-2 là hàng `n1-dem-nguoi-tach`).
- Không bật công tắc trên DB máy thu. Không giao diện `/ops` để bật (lệnh CLI là đủ cho một người vận hành).
- Không tách lại người đã gộp khi tắt.

## Đặt nhánh

Nhánh đặt trên đỉnh #250 (code gộp chỉ có ở đó; trên main công tắc không có gì để chặn và không đo được chiều tắt).
PR công tắc mang luôn commit của #250; gộp nó là #250 vào main cùng lúc với công tắc tắt mặc định.
