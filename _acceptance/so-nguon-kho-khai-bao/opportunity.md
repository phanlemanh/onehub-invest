---
schema_version: 1
slug: so-nguon-kho-khai-bao
feature: Người vận hành chạy lệnh đo độ tươi và mở trang Thu thập thì thấy S16 hết «chưa khai SLO», S09 hiện thành một nguồn, S01 chỉ đo thị trường có lịch và S11 ở trạng thái tạm dừng
owner: phanlemanh@gmail.com
stage: decided                # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh 21/11 trả lời ở phiên U2, nguyên văn «Cổng Đáng NK1 so-nguon-kho-khai-bao: làm» — làm với ngưỡng và hạn U2 đề xuất
decided_at: 2026-11-21T06:50:47Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: NK1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng NK1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/sau-soat-nguon-2011.md#571f282c4201f107330fa3a28e4f7de283ad776f` — chưa có trang: mã NK1
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành chạy lệnh đo độ tươi và mở trang Thu thập thì thấy S16 hết «chưa khai SLO», S09 hiện thành một nguồn, S01 chỉ đo thị trường có lịch và S11 ở trạng thái tạm dừng

Vì sao: Soát 20/11: nguồn kho «mờ» vì sổ nguồn không khai họ nguồn, nhịp, bảng nạp; S09 và S17 không có dòng nên vô hình với cả thước lẫn bộ quét tên nguồn. Lát A của ROADMAP §3 mục 58.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Trên DB máy thu sau khi áp migration 122: `node scripts/check-freshness.mjs` hết dòng «S16 chưa khai SLO», hết hàng S01 của thị trường không có lịch, hết «S11 chưa có dữ liệu», có hàng S09; sổ nguồn có dòng S09 và S17 với tên thật điền trên máy thu, bộ soát tầng A của đường đẩy Ops nhận cả hai tên trước lượt đẩy kế; app và CLI đọc cùng một nhịp từ sổ» chưa?
- Kết quả nào là SỐNG: [đề xuất] Trên DB máy thu sau khi áp migration 122: `node scripts/check-freshness.mjs` hết dòng «S16 chưa khai SLO», hết hàng S01 của thị trường không có lịch, hết «S11 chưa có dữ liệu», có hàng S09; sổ nguồn có dòng S09 và S17 với tên thật điền trên máy thu, bộ soát tầng A của đường đẩy Ops nhận cả hai tên trước lượt đẩy kế; app và CLI đọc cùng một nhịp từ sổ
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Trên DB máy thu sau khi áp migration 122: `node scripts/check-freshness.mjs` hết dòng «S16 chưa khai SLO», hết hàng S01 của thị trường không có lịch, hết «S11 chưa có dữ liệu», có hàng S09; sổ nguồn có dòng S09 và S17 với tên thật điền trên máy thu, bộ soát tầng A của đường đẩy Ops nhận cả hai tên trước lượt đẩy kế; app và CLI đọc cùng một nhịp từ sổ» khi hết timebox
- Timebox: [đề xuất] gộp PR và áp migration 122 lên DB máy thu trong ba ngày làm việc sau khi duyệt, tức trước 26/11 (tính cả tối 23/11 chuyển máy); quá hạn mà chưa đạt thì dừng và báo giám sát.
