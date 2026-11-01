# n1-dem-nguoi-tach — thiết kế

Hồ sơ: `_acceptance/n1-dem-nguoi-tach/`. Gốc: Ngoài-2 của nguoi-noi-theo-sdt (HD13), Mạnh chọn «mở hợp đồng mới» 31/10.

## Vấn đề

Kiểm N1 (`pipeline/do-danh-ba-sdt.mjs`, `tinhSo`) đếm cặp (SĐT, người gửi) một–một trên tin sống mà người theo SĐT chưa
`merged`. Lệnh tách của HD13 đặt người theo SĐT về `split` và `chonGop` không bao giờ gộp lại người ấy, nên cặp vẫn
một–một mà không bao giờ về `merged` — N1 đỏ vĩnh viễn từ lần tách đầu.

## Thiết kế

- `tinhSo` nhận thêm `daTach` (Set party_key ở trạng thái `split`, mặc định rỗng). Vế lọc «chưa gộp» thành: có người theo
  SĐT, không trong `daGop`, không trong `daTach`. `n1.tong` giữ nghĩa cũ (mọi cặp một–một).
- `docDuLieu` đọc thêm `SELECT party_key FROM parties WHERE status = 'split'` trong cùng giao dịch chỉ đọc, trả `daTach`.
- Khuôn detail `so=… tong=…` không đổi — `app/src/lib/dq-labels.ts` đọc đúng mẫu này; số cặp đã tách không lên dòng ghi.
- Số cặp đã tách mỗi nguồn (`n1Tach` trong kết quả, ngoài đối tượng `n1` để detail không đổi) in ra stdout bước đêm qua
  `inBang(kq)`: `danh-ba-sdt:n1 <nguồn> cap_da_tach=<k>` — không ghi `dq_check_results` (gap-probe P0).
- Thước `scripts/nap-lai-nguoi.mjs` không truyền `daTach` → kết quả như cũ.

## Test

Thêm vào `pipeline/do-danh-ba-sdt.test.mjs` (bộ chạy `ddb_pipeline`): ma trận split/active/merged, đối chứng hai chiều bằng
bản chép (bỏ vế split → «N1 DEM CA NGUOI DA TACH»; vế nuốt active → «N1 NUOT NGUOI CHUA GOP»), mặc định khi không truyền,
`docDuLieu` với client giả, đường đêm đầu-cuối tới `veDong`, chuỗi ba lượt active → merged → split.

## Ngoài phạm vi

Nhãn ops cho số cặp đã tách; trạng thái `retired`; thước nap-lai-nguoi truyền `daTach`.
