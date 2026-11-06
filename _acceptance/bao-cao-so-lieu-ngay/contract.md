---
schema_version: 1
feature: Báo cáo số liệu hằng ngày theo bảng mục tiêu — lệnh gom số chỉ đọc, so hôm qua và so đích, gợi ý kiến nghị
slug: bao-cao-so-lieu-ngay
owner: phanlemanh@gmail.com
risk_tier: T1      # lệnh ops chỉ đọc mới ở scripts/ + cấu hình đích + gộp nhãn thành phố trong định nghĩa độ tươi (hai bản chép); không đổi lược đồ, dữ liệu, quyền hay cổng
surfaces: [script]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: bao-cao-so-lieu-ngay

## Context

Mạnh giao 07/11: «dựa trên mục đích, tầm nhìn và mô hình hiện nay đề xuất mục tiêu và lập lịch kiểm tra báo cáo số liệu
hàng ngày từ đó kiến nghị hành động cho cả tôi và phiên điều phối». Giám sát đợt `dot0-cam-mau` mở phiên báo cáo ngày.

Thay đổi:
- `scripts/bao-cao-ngay.mjs`: gom số trong một giao dịch `READ ONLY` rồi `ROLLBACK`. Số đọc lại từ chỗ đã có:
  `data_level_snapshot`, `data_flow_snapshot`, `dq_check_results`, `silver_labels`, `ai_calls`/`ai_model_prices`,
  `review_queue`, `eval_labels`, độ tươi qua `scripts/lib/freshness.mjs`, mốc GCM1 qua `lo-trinh.json` + `_acceptance/`.
  Cờ `--audit` lấy dòng tổng kết của `audit-all.sh`. Lệnh in markdown hoặc JSON và lưu ảnh chụp số của ngày vào
  `state/bao-cao-ngay/` (gitignored) của checkout chính.
- `scripts/lib/bao-cao-ngay.mjs`: phần thuần — chấm đạt/vàng/đỏ, so hôm qua, ô nghi tụt bậc, gợi ý kiến nghị tách «cho
  Mạnh» và «cho điều phối», dựng markdown.
- `scripts/bao-cao-ngay/muc-tieu.json`: đích, hạn, ngưỡng đỏ. Trạng thái `de-xuat` cho tới khi Mạnh duyệt; thước đo vẫn
  sống ở FRAMING §5.
- Lịch: tác vụ hẹn giờ của app, 07:45 mỗi ngày, ngoài kho (không dựng infra mới).
- Mạnh duyệt bảng mục tiêu 07/11 «Theo khuyến nghị»: `trang_thai: da-duyet`.
- Sửa sau khi liên lạc soát báo cáo ngày đầu (07/11):
  - `scripts/lib/freshness.mjs` + bản chép `app/src/lib/freshness.ts`: `gopThanhPho()` gộp nhãn `vn-<tp>` vào `<tp>`, lấy
    lần thu mới nhất. Một bản thu lẻ dán `vn-hcmc` ngày 02/11 từng làm ra ô «S06/vn-hcmc quá hạn 109 giờ» giả. Đây là một
    phần phép đo của ON17, không đóng ON17 (tiêu chí S03/S05 theo lần thu vẫn mở).
  - Báo cáo chỉ so lượng S06 theo ngày đã thu trọn, tức lần thu cuối đã qua 00:00 giờ VN ngày sau. Trước đó con số «S06 nhận
    1.249 tin ngày 06/11» là đếm khi lượt thu cuối mới chạy lúc 14:05 cùng ngày.
  - `da_biet` trong `muc-tieu.json`: ô liên lạc đã nhận và đang xử lý (S01/vn, tới 14/11) được tách khỏi số tính đỏ và hiện
    ở mục «Đã biết».

## Cắt / hoãn

- Không thay DO1–DO3. Dòng chuyển bậc từng đơn vị, mẫu soát cuốn chiếu và lát theo dự án/toà thật là việc của các hàng đó.
  Lệnh này chỉ đọc số đếm và ghi rõ chỗ còn chờ hàng.
- Không đo lại độ tươi hay lượng thu của làn liên lạc; chỉ đọc qua lib freshness và các bảng có sẵn.
- Không lên cloud, không trang /ops.

## Acceptance Criteria

- AC-1: chỉ đọc. Mọi truy vấn chạy trong `BEGIN READ ONLY … ROLLBACK`, không có câu ghi; sau `gom()` phiên DB không còn
  giao dịch mở (`scripts/bao-cao-ngay.test.mjs`, ca «bất biến của CLI» và «gom() trên DB local»).
- AC-2: SPL. Mã lệnh không đọc tên nguồn thật, không gọi model; ô độ tươi chỉ mang mã `S0x`.
- AC-3: chấm đúng. Hướng tăng/giảm, ngưỡng đỏ, chỉ số không đích, số thiếu; so hôm qua đánh dấu đi ngược hướng tốt.
- AC-4: ô bậc co lại vì tin được gắn vào căn không bị gọi là tụt. Chỉ gọi «nghi tụt» khi bậc dưới tăng tương ứng.
- AC-5: gợi ý cho Mạnh chỉ gồm cổng, tiền, quyết định chưa chốt. Độ tươi, thẻ duyệt, DQ đỏ đi phần điều phối.
- AC-6: chạy trên DB máy thu 07/11 ra báo cáo đủ phần, khoảng 1 giây; kèm `--audit` khoảng 40 giây.
- AC-7: hai bản chép độ tươi cùng gộp `vn-hcmc` vào `hcmc`, nhãn quốc gia `vn` giữ nguyên (`scripts/freshness-parity.test.mjs`).
  Trên DB máy thu, `check-freshness` chỉ còn S01/vn quá hạn.
- AC-8: ô đã biết còn hạn không tính đỏ, hết hạn thì tính lại; ngày S06 chưa thu trọn không được dùng để so.

## Kiểm

`node --test scripts/bao-cao-ngay.test.mjs scripts/freshness-parity.test.mjs` — 24/24 đạt; `check-freshness`, `s05-slo`, `job-exit` xanh; `app` tsc sạch.
