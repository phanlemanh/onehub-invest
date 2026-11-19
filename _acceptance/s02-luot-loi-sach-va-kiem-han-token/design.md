# S02: lượt lỗi sạch và kiểm hạn token — thiết kế tích hợp

Hàng tích hợp làn thu (dãy P4, GS giao 20/11). Hai nhánh ZCode đã qua soát của liên làn (LL):

| Nhánh | Đỉnh | Việc |
|---|---|---|
| `zcode/s02-luot-loi-sach` | `0dc032fab` | (1711-1b) lượt thu ném lỗi giữ `.partial` ẩn, không sinh thư mục tên thật 0 items; (1711-1a) nhánh 401 sau refresh ghi dòng `AUTH FAIL [S02] <ISO>` trước khi ném |
| `zcode/s02-apptoken-het-han` | `b49971757` | (1911-5) `kiemAppToken` hàm thuần: token rỗng, hết hạn, thiếu exp thì ném trước mọi lời gọi API; còn hạn thì log số phút còn lại |

## Cách làm

Claude chỉ tích hợp (AGENTS «Phân làn»): gộp hai nhánh vào `feat/s02-luot-loi-sach-va-kiem-han-token` từ `origin/main`
(`8e01a548c`), không sửa logic thu. Hai nhánh cùng chạm tệp bộ thu S02 trong `collector/src/collectors/` ở hai vùng khác
nhau; git tự gộp, không xung đột. Lỗi logic phát hiện khi chấm → báo LL để `tin MỞ LẠI` cho ZCode.

## Người đọc phía sau (bảng phủ ca)

| Người đọc | Đọc gì | Sau thay đổi |
|---|---|---|
| script đêm S02 (`scripts/*-daily.sh`) | `collect` có `set -e`; dòng `SNAP=` chọn `ls -td snapshots/vn/vn__<nguồn>__*` | lượt hỏng làm `collect` thoát 1 → dừng trước transform; glob không khớp `.partial` |
| bước nạp và transform S02 trong `pipeline/` | thư mục bản thu được truyền tên | không nhận `.partial` (không ai truyền) |
| `scripts/*-daily.sh` khác, `nap-argmax` | bỏ thư mục bắt đầu bằng `.` (2510-8) | không đổi |
| `scripts/lib/freshness.mjs` (S02) | giờ thu trong bảng thị trường S02 của DB | không đọc thư mục bản thu — không đổi |
| Dòng `AUTH FAIL [S02]` | chưa có bộ đọc nào trong kho | thước độ tươi đọc dòng này là việc sau (ngoài phạm vi) |

## Đo

Không có UI. Bốn phép đo của hồ sơ nằm ở `_acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/`, mỗi phép có chiều đỏ
trên cùng fixture: `nguoi-doc.mjs` (--pha), `dot-bien-han.mjs` (bản đột biến), `noi-day.sh` (bốn bản chép: bỏ lời gọi kiểm hạn, cấy đường trả sớm, cấy lại dòng log cũ, bỏ dòng AUTH FAIL),
`vung.sh` (cấy tệp ngoài vùng). Bộ test collector (`config:executors.test.collector`) chạy toàn bộ.

## Giới hạn đã thấy, không sửa ở đây

- Lượt dừng vì token hết hạn (`kiemAppToken` ném) không ghi dòng `AUTH FAIL [S02]` — dòng chỉ có ở nhánh 401 sau
  refresh. Bộ đọc dòng này chưa có; khi dựng thước độ tươi theo dòng ấy thì hai đường phải chung một dấu. Báo LL.
- Ca `apptoken-exp.test.ts` ghim năm `2026-` trong regex: từ 01/01/2027 ca «hết hạn 1 giờ trước» đỏ giả. Báo LL.
- Ca `1711-1(a)` và AC-2 là phép đo tĩnh trên mã (dòng có mặt và đứng trước throw), không chạy nhánh 401. Hàm `call` không xuất ra nên không chạy hành vi được nếu không sửa mã thu.
