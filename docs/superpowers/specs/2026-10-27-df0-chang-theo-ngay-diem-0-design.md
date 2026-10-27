# «Chặng theo ngày» có điểm 0 cho ngày nguồn im — design (df0-chang-theo-ngay-diem-0)

Ngày 27/10/2026 · Hàng U2 2.3 của đợt dieu-phoi-dot0-cam-mau · Ngoài-8 của `ops-dong-chay-df0` (Mạnh chọn «mở hợp đồng
mới» ở Cổng Bằng chứng 26/10).

## Vấn đề

`StageTrendChart` (`app/src/components/ops/data-flow/stage-trend-chart.tsx`) lấy trục ngày từ chính các ngày CÓ số
(`[...byDay.keys()].sort().slice(-windowDays)`), dù chú thích trong tệp hứa «ngày trống vẫn có điểm 0 để trục liền».
Hệ quả:

- Ngày nguồn im biến mất khỏi trục — đường nối thẳng qua, trông như vẫn chạy đều.
- Khi thu ngừng vài ngày, `slice(-windowDays)` lấy các ngày CŨ HƠN cửa sổ để lấp đủ điểm (cửa sổ 7 ngày mà số im 3
  ngày cuối thì biểu đồ vẽ 4 ngày trong cửa sổ + 3 ngày trước cửa sổ), che đúng lúc cần thấy sự cố.
- Trên DB local, bảng bài S03 chỉ có từ 18/10: cửa sổ 30 ngày hiện chỉ vẽ 10 ngày, trục bắt đầu 18/10.

## Cách sửa

- Hàm thuần `dailySeries(days, nowMs, windowDays)` trong `app/src/components/ops/data-flow/stage-trend-data.ts`: sinh
  ĐÚNG `windowDays` khoá ngày giờ VN liên tiếp kết thúc ở ngày VN của `nowMs` (dùng `vnDayKey`), mỗi ngày cộng số bốn
  chặng của mọi nguồn, ngày không có số = 0. Số của ngày nằm ngoài cửa sổ bị bỏ.
- `StageTrendChart` nhận `nowMs` (mốc request mà `DataFlowView` đã có, cùng mốc `getDataFlow` dùng) và vẽ từ
  `dailySeries`. Trạng thái trống giữ nghĩa cũ: mọi điểm đều 0 → câu «Chưa có số theo ngày trong khoảng này.».
- Cửa sổ «Tất cả» vẫn vẽ 30 ngày gần nhất như trước (chuỗi ngày của `getDataFlow` chỉ quét 30 ngày).
- Không đổi kiểu biểu đồ, màu, ô số phía trên.

## Đo

- Tệp test `app/tests/df0-chang-theo-ngay.test.tsx` (thuần, không DB): ma trận viết trước các mẫu ngày (có lỗ giữa, im
  cuối cửa sổ, chỉ có số cũ hơn cửa sổ, nhiều nguồn cùng ngày, không có số), so TRỌN chuỗi khoá ngày và số từng chặng.
  Chiều đỏ: thuật toán cũ (ngày có số, sắp, cắt đuôi) chạy trên cùng ma trận → lệch, ca đỏ ghim tên mẫu.
- Ranh giới giờ VN: `nowMs` quanh nửa đêm VN (16:59Z / 17:00Z) → ngày cuối đổi đúng lúc 00:00 giờ VN.
- jsdom: `StageTrendChart` với mọi điểm 0 → câu trống; có một ngày có số → không còn câu trống.
- Đường dây: judgment trên `page.tsx` + `data-flow-view.tsx` + `stage-trend-chart.tsx` (một biến mốc của request đi vào cả getDataFlow lẫn biểu đồ).
- ui-check: trang thật ở máy thu, cửa sổ 30 ngày — trục bắt đầu 29 ngày trước hôm nay (30 điểm tính cả hôm nay); ngày có tooltip 0 ở cả bốn chặng thì đường sát trục.
- `chartDaysOf(window)`: 7 → 7, 30 ngày và «Tất cả» → 30; ca đo đi qua mọi giá trị cửa sổ mà `parseFlowWindow` nhận.
- Hỏi-1 (Cổng Phạm vi): mọi điểm 0 thì giữ câu trống (khuyến nghị — nguồn im đã được báo bằng nhãn «Im N ngày» ở khung Chất lượng) hay vẽ đường phẳng 0.

## Ngoài phạm vi

- Ô số phía trên của cửa sổ «Tất cả» cộng mọi ngày trong khi biểu đồ chỉ 30 ngày — giữ như cũ.
- Precompute chuỗi ngày ở `pipeline/sql` (DF1).
