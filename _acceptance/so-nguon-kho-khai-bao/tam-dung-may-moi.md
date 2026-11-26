# NK1 tạm dừng, áp 122 ở máy mới (22/11 23:15Z)

Giám sát quyết định (sổ quyết định `d-20261122T231340Z-41`): chuyển bước áp 122 sang máy thu mới, sau buổi chuyển máy; bỏ hạn
05:00Z thứ Hai 23/11. NK1 tạm dừng tới khi giám sát nhắn «mở lại NK1».

Tại thời điểm dừng:

- Nhánh đã có bản sửa CI (`4805a1461`, `6f190ccaf`) và đã nhận main `f962afade`. Đầu nhánh trên PR #522 là `1c5b8e3b1`.
- Bằng chứng còn ghim ở `956208c19`, nên kiểm tra `gate` đỏ vì bằng chứng cũ. Đây là dự kiến.
- Bản sao job `scripts` của CI đã chạy trên máy và PASS (`ci-scripts.md`).

## Việc kế trên máy mới

1. Nhận main (đã có HT5, MH1). Gỡ xung đột ở `scripts/bao-cao-ngay*`, phần chồng với MH1.
2. Chạy `node scripts/ci-test-local.mjs --job scripts`; phải ra PASS.
3. Ghim lại MỘT lần (xin lượt chấm `s4`).
4. Trình Mạnh ký lại thẻ Cổng Bằng chứng. Đầu thẻ có khối «Khác gì so với bản đã ký 22/11», gồm bốn dòng:
   1. `scripts/so-nguon-kho.test.mjs`: bốn ca cần DB của riêng lượt được bỏ qua có tên khi chạy dưới CI.
   2. `ap122NeuThieu` chuyển vào try/finally ở `scripts/bao-cao-ngay.test.mjs` và `app/tests/ops-nhan-theo-context.test.tsx`.
   3. Thêm bốn mục vào `scripts/ci-bo-qua.json`.
   4. `probes/pham-vi.sh` thêm một tệp cho phép: `scripts/ci-bo-qua.json`.

   Khối kèm câu: «migration 122, lệnh áp, số chạy thử, sao lưu, cách lùi, lệnh kiểm sau: KHÔNG đổi».
5. Giám sát gộp PR mà KHÔNG pull checkout chính, rồi áp theo `ap-may-thu.md`.

## Soát `ap-may-thu.md` và các tệp nó gọi theo máy mới (chưa sửa hồ sơ đã ký)

Hai máy cùng người dùng `manhphan` và cùng đường dẫn, nên đường tuyệt đối vẫn đúng. Có sáu điểm cần kiểm trên máy mới trước bước 1:

| Chỗ | Gắn với gì | Cần kiểm trên máy mới |
|---|---|---|
| `sao-luu.sh`, `kiem-lui.sh`, bước 2 và cách lùi: `docker exec … one-invest-db` | Tên container. Tên này cố định ở `db/docker-compose.yml` (`container_name: one-invest-db`). | DB máy mới phải dựng bằng chính `db/docker-compose.yml`; dựng cách khác thì tên container lệch. |
| `tra-s09-s17.mjs`, `probes/tang-a.mjs`, `probes/may-thu.mjs`: DB mặc định `localhost:5433/oneinvest` | Cổng 5433 của compose. | Cổng 5433 trỏ đúng DB máy thu mới, và DB đó là bản chuyển từ máy cũ. |
| `tra-s09-s17.mjs`, `probes/tang-a.mjs`: tệp tên `/Users/manhphan/dev/onehub-invest/.acceptance-runs/dieu-phoi-dot0-cam-mau/tam/` | Thư mục đợt; git bỏ qua thư mục này. | Hai tệp `tam/s09-mien.txt`, `tam/s17-mien.txt` phải theo cây kho sang máy mới (chép nguyên cây) và giữ quyền 600. Chưa xoá ở máy nào tới khi áp xong trên máy mới (bước 6). |
| `sao-luu.sh`: `$HOME/onehub-backups/db` | Thư mục home. | Script tự tạo thư mục (`mkdir -p`), không cần làm gì. |
| Bước 1, «số mong đợi: 15 dòng» | Đếm 21/11 trên DB máy cũ. | Nếu DB máy mới là bản chuyển nguyên vẹn thì vẫn 15. Lệch thì dừng và báo. |
| Bước 5, số chạy thử: S09 quá hạn, S16 tươi với nhịp 192 | Đo 21/11. Tuổi nguồn tính theo giờ đồng hồ. | Chạy ở ngày muộn hơn thì S16 sẽ quá hạn từ khoảng 26/11 (`ap-may-thu.md` đã ghi). Số tuổi lệch theo ngày không phải lỗi bước áp; số hàng, mã và trạng thái vẫn phải khớp. |

Tệp tầng A ở máy cũ: hai tệp `tam/` trên máy cũ nằm trong danh sách tầng A giám sát xoá sáng thứ Ba, sau khi bản trên máy mới đã có.
