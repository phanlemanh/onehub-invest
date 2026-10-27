# dong-chay-so-cu-may-thu — máy thu báo số dòng chảy cũ

Nguồn: Ngoài-2 của hồ sơ `dong-chay-len-cloud` (Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 27/10), ô cơ hội
`_acceptance/dong-chay-so-cu-may-thu/opportunity.md`. ADR-0014 (ngưỡng số cũ 45′, hằng `FACTS_STALE_MS`).

## Vấn đề

DF1 cho trang /ops/data-flow ở máy thu đọc `data_flow_snapshot` (600_data_flow.sql làm tươi mỗi lượt cloud-sync).
`localFacts` trả `fresh` cho mọi dòng tìm thấy, không so `computed_at` với ngưỡng. Bước `refresh-data-flow` gãy nhiều
lượt liền thì trang máy thu vẽ số của lần tính cuối như số hiện hành; cloud cùng lúc đã báo cũ.

## Thiết kế

- `app/src/lib/ops-facts.ts`: xuất `ageState(iso, now)` hiện dùng nội bộ — MỘT luật tươi/cũ cho cả hai nơi.
- `app/src/lib/data-flow-queries.ts`: `localFacts(q, window, now)` trả `ageState(<computed_at cũ nhất của bảng>, now)`
  (`fresh` ≤ 45′, `stale` > 45′) — cùng luật `measured_at` của khối cloud (DF1 AC-4); giờ trên trang là mốc cũ nhất; bảng vắng / chưa có dòng giữ nguyên `none` (giới hạn đã biết Ngoài-3 của DF1, không đổi ở vòng này).
- `app/src/components/ops/data-flow/data-flow-view.tsx`: nhánh máy thu giữ dòng «Số tính lúc …»; khi `stale` thêm Alert
  cảnh báo cùng khuôn `FactsStaleAlert` (variant `warning`, icon, tiêu đề + mô tả), đặt ở vùng trạng thái trước các
  vùng số. Chữ là Hỏi-1 (khuyến nghị: «Bước làm tươi số dòng chảy không chạy từ {giờ VN}» + «Số dưới đây là lần tính cuối
  — kiểm tác vụ đồng bộ ở máy thu.»; lối khác: nguyên chữ cloud). Vùng số vẫn hiện (số cũ, có cảnh báo) như trạng thái
  `stale` trên cloud (DF1 AC-7 «kèm số cũ»).
- Nhánh cloud không đổi.

Không có bảng, cột, migration hay đường dữ liệu mới. Đặc tả UX: một Alert trong vùng trạng thái sẵn có (bỏ, có tên).
