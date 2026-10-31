---
slug: resolve-thu-lai-deadlock
at: 2026-10-31T10:05:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ d-20261031T092612Z-2 ghi nguồn mục-tiêu nhưng trích tiền lệ của hồ sơ khác; câu trích thử lại cả 53300/57P03, trái lựa chọn chỉ 40P01, và không quyết nhịp chờ. | Người ký tưởng chính sách thử lại đã có gốc mục tiêu; E3 đo 53300/40001 ném ngay trong khi tiền lệ thử lại chúng. | Dòng sổ mới supersedes, tách mã và trần, hoặc đưa thành câu hỏi. | fixed: d-20261031T092927Z-5 (chỉ 40P01, trích ô cơ hội đã ký) và d-20261031T092927Z-6 (3 lần chờ tăng dần, trích tiền lệ chỉ cho dáng trần) thay d-2. |
| P0 | contract | Dòng descope sync-cloud d-20261031T092612Z-3 trích câu ô cơ hội không nói gì về sync-cloud; ô cơ hội còn dẫn cloud-sync.log làm lý do. | Cổng 1 duyệt OOS-1 dựa trên trích dẫn không quyết điều đó. | Dòng sổ mới trích đúng quyết định P3-134; ô cơ hội ghi rõ phạm vi sync-cloud. | fixed: ô cơ hội thêm dòng «Phạm vi sync-cloud: giám sát duyệt P3-134…»; d-20261031T092927Z-7 trích nguyên văn dòng đó, thay d-3. |
| P1 | evals | E7 đo «mọi câu qua bộ thử lại» bằng chuỗi c.query vắng mặt; bộ rút chưa có đối chứng dương. | Còn một câu gọi client.query thẳng mà E7 vẫn xanh; bộ rút trả tập rỗng cả hai phía mà vẫn bằng nhau. | Spy đếm câu tới client gốc so với câu qua boc; ghim số phần tử tập base. | fixed: E5 thêm spy (câu tới client gốc = câu boc gửi, lượt sạch > 0); E7 rút mọi template literal trừ chuỗi in, ghim tập base đúng 9 phần tử kèm hai phần tử biết trước. |
| P1 | evals | Không eval nào chạy điểm vào CLI thật; giá trị mặc định main truyền cho boc không được ghim. | main gọi chayResolve với lan mặc định 0 hay hàm chờ no-op; mọi ca tiêm vẫn xanh, launchd vẫn thoát 1. | Ca CLI trên DB thử với deadlock thật + ô lỗi khác thoát 1; ca unit ghim mặc định. | fixed: thêm AC-9/E9 spawn node pipeline/resolve-properties.mjs (deadlock thật → exit 0 + dòng thử lại; lỗi 42P10 → exit 1, không thử lại); E2 ghim MAC_DINH {lan: 3, nhip: [500,1000,2000]} và đường chỉ tiêm hàm chờ. |
| P2 | evals | View sale_offers trong itest viết tay, không rút từ migration 044. | View đồ chơi khác dáng view thật, vòng chờ không cùng dáng log 30/10. | Dựng view bằng câu CREATE VIEW rút từ tệp 044; assert pg_get_viewdef. | fixed: E5 dựng view bằng câu rút từ db/migrations/044_nap_lai_khong_xoa.sql và kiểm pg_get_viewdef; property_offers có khoá ngoại tới sale_offer_records như 044. |
