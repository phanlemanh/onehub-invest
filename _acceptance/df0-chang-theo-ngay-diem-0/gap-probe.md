---
slug: df0-chang-theo-ngay-diem-0
at: 2026-10-26T23:33:56Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Căn cứ d-2/d-3 không quyết mốc kết thúc của trục: câu trích chỉ quyết lấp lỗ bằng 0, lối «lấp 0 tới ngày cuối có số» cũng khớp; d-3 không loại lối đó | Bản cài lấp tới ngày cuối có số thoả câu trích mà vẫn che ba ngày im cuối; Cổng 1 duyệt mốc chưa ai chọn | Trích dòng Ngoài-8 nếu nêu ngày im cuối cửa sổ, hoặc loi_chet loại đích danh lối đó, hoặc câu hỏi người | fixed: dòng S1 mới thay d-2, căn cứ trích nguyên văn «Người dùng thấy gì» của Ngoài-8 trong review-findings của ops-dong-chay-df0 («vẫn vẽ đủ điểm bằng các ngày cũ hơn … che mất việc nguồn đã im») — chỉ trục kết thúc ở hôm nay hết lỗi đó |
| P0 | design | d-4 (giữ câu trống khi mọi điểm 0) ghi máy quyết theo một-lối, không loại lối «vẽ đường phẳng 0»; cách trình bày lúc nguồn im trọn cửa sổ là việc chỉ người có | Thu ngừng 8 ngày, cửa sổ 7 ngày: người vận hành thấy câu trống thay vì đường 0; E2/E5 khoá hành vi người chưa chọn | Loi_chet thật, hoặc câu hỏi người ở Cổng 1 | human-gate1: Hỏi-1 (dòng S1 mới thay d-4, khuyến nghị giữ câu trống vì nhãn «Im N ngày» ở khung Chất lượng đã báo nguồn im; lối khác vẽ đường phẳng 0) |
| P1 | contract + evals | Cửa sổ «Tất cả» → số ngày biểu đồ không AC nào đo; AC-4 chỉ thử 7 và 30 | window=all làm windowDays undefined/null → 0 điểm hoặc treo trang, E1–E7 vẫn xanh | AC + ca đi qua mọi giá trị cửa sổ rút từ code | fixed: thêm AC-8 + E8 — chartDaysOf(window) qua mọi giá trị parseFlowWindow nhận (+ một giá trị lạ), bảng {7d: 7, 30d: 30, all: 30}; đột biến null cho 'all' đỏ |
| P1 | evals | E7 ghim cổng/đường worktree mâu thuẫn (app-3461 vs :3462); «đoạn 0 trước ngày có bài đầu tiên» phụ thuộc trạng thái DB và chỉ bài S03 | Người chấm mở nhầm cổng hoặc trúng dev server khác; nguồn khác có số mỗi ngày thì không có đoạn 0, E7 đỏ oan | Bước lấy cổng từ cấu hình thật; expected so với ngày tooltip 0 quan sát được, không có thì ghi rõ | fixed: E7 bỏ đường worktree viết cứng, đọc cổng thật (preview_list, thử 3461 rồi 3462, chỉ nhận trang có khung); expected chấm nhãn đầu/cuối trục và ngày có tooltip 0 quan sát được, không có ngày im thì ghi rõ; design sửa «29 ngày trước» |
| P2 | evals | Vế «cùng mốc getDataFlow» của AC-6 cần page.tsx, ngoài inputs của E6 | page.tsx gọi Date.now() hai lần; E6 vẫn PASS | Thêm page.tsx vào inputs, hỏi một biến mốc | fixed: E6 thêm page.tsx, câu hỏi «đúng một biến mốc request truyền cho cả getDataFlow lẫn DataFlowView»; AC-6 sửa theo |
