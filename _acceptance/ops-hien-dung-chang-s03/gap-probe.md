---
slug: ops-hien-dung-chang-s03
at: 2026-11-27T18:20:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-20261127T180851Z-5 ghi một-lối, nhưng lối «cả hai chuỗi đếm trên sale_offer_records» vẫn sống và giữ được bất biến; đếm cả tin đã nghỉ hay không là nghĩa sản phẩm, chỉ người quyết | Mạnh xem hai hôm liền thấy cột ngày 21/11 nhỏ đi vì tin nghỉ rơi khỏi sale_offers, lại nghi số sai; người duyệt không được hỏi | Dòng sổ chi-nguoi thay d-5 thành Hỏi-2 kèm cặp số đo thật 21–27/11 | fixed: ghi dòng chi-nguoi supersedes d-5 (Hỏi-2) kèm số đo máy thu 28/11 — chênh 3–13 tin/ngày (~1%); E4 thêm ô tin đã nghỉ và đột biến sale_offer_records |
| P1 | evals | E8 dặn chạy 600 của nhánh trên DB local :5433 — trên Mac mini đó là DB chung của máy thu | Người chấm ghi data_flow_snapshot và dòng số mốc hôm nay từ mã chưa ký lên DB thật, trái luật áp sau khi gộp | Dev server trỏ DB của riêng lượt; probe dừng nếu chuỗi kết nối là DB chung | fixed: E8 trỏ DB của riêng lượt (bản chép của E3), cấm 600 nhánh lên DB chung; E3 probe dừng khi chuỗi kết nối là oneinvest; AC-3 ghi rõ |
| P1 | evals | Trạng thái ST-luong7-s03-khoi-cu (bản tin cũ, tooltip «—») không eval nào nhìn | Tooltip in 0 hay NaN cho null, Mạnh thấy «tin có bài hôm đó: 0» trên cloud ngay sau gộp, E1–E8 vẫn xanh | Ca kiểm hàm định dạng tooltip với null in đúng «—» | fixed: E7 thêm ca hàm định dạng tooltip nhận null in «—», chú giải đủ ba nhãn, chiều đỏ khi in số; AC-7 thêm vế này |
| P1 | evals | E2, E4 tuyên ma trận viết trước mà không ghi giá trị từng ô; ô bài thử của E4 không có điều kiện SQL tương ứng; ngày không bài, mã căn xx chưa nói | Người viết mã đặt assert theo kết quả mã trả, người duyệt ký ma trận không biết ô đáng bằng bao nhiêu | Bảng ô → giá trị viết trước trong expected | fixed: E2 sáu ô có giá trị (xx tính là ghi toà theo đoạn LOCATED_PENDING), E4 bảy ô có giá trị; bỏ ô bài thử (tin chỉ dựng từ bài transform đọc, đã gạt bài thử), thay bằng bài không thuộc tin; ngày không bài = 0 có khoá |
| P1 | contract | Dòng «tin có bài hôm đó» của Đường đo không có lệnh đo trên dữ liệu thật; E4 dùng fixture tự đặt first_seen | Trên máy thu first_seen lệch ngày VN, có ngày tin mới vượt tin có bài, E4 vẫn xanh | probes/may-thu.sh in bảy ngày luong7 trên bản chép thật, ngày nào vượt thì thoát khác 0 | fixed: E3 và AC-3 thêm bảy dòng luong7() trên bản chép thật, mọi ngày tin rao mới ≤ tin có bài; Đường đo trỏ AC-3 |
