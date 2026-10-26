---
slug: che-do-thu-tren-ops
at: 2026-10-25T09:30:00Z
verdict: findings
p0: 0
p1: 5
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Ngưỡng CHẾT «còn một lối bật Bùng không hạn hoặc không phải admin» chỉ được đo trên lối set-mode; các action cũ (add/toggle) vẫn mở cho phiên ops và Bearer máy mà không AC nào chứng minh chúng không ghi được mode/burst_until | add nhận params tự do → Bearer máy tạo điểm Bùng hạn 2027 không qua admin, không audit; E1–E3 vẫn xanh | Với mỗi action cũ gửi kèm mode/burstUntil/params: params không có khoá chế độ, audit không đổi; đối chứng set-mode admin 200 | fixed: AC-3 thêm vế action cũ; E3 thêm ca CD-AC-3b gọi POST thật của route bằng Bearer với add và toggle mang khoá chế độ |
| P1 | evals | Quan hệ «không lần đổi nào thiếu audit» (d-5) chỉ được đo bằng đếm có mặt ở ca suôn sẻ; không ca nào ép INSERT audit hỏng | Bản cài UPDATE rồi auditOpsWrite (nền) vẫn qua E1; audit lỗi trên máy thu thì Bùng không vết duyệt | Ép INSERT ops_audit hỏng bằng CHECK: params giữ nguyên, lời gọi báo lỗi; gỡ CHECK thì thành công | fixed: AC-1 và AC-5 thêm vế rollback; E1 thêm CD-AC-1b, E5 thêm CD-AC-5b (CHECK trên ops_audit lược đồ tạm, có đối chứng gỡ CHECK) |
| P1 | design | Biên giờ VN/UTC chỉ ghim ở máy hạ; datCheDo và min/max ô ngày tính H theo đồng hồ/múi giờ thật | Bản tính ngày UTC qua E1/E2/E4 ban ngày; 06:30 sáng VN admin bật H+13 bị từ chối, H−1 lọt | datCheDo nhận now; E1/E2 chạy now = 23:30Z ngày H−1; ô ngày nhận H từ máy chủ, test chạy TZ=UTC | fixed: design cho datCheDo tham số { db, now } và truyền homNay từ máy chủ xuống hộp thoại; E1/E2 ghim now 23:30Z H−1, E7 ghim min/max theo homNay với TZ=UTC |
| P1 | evals | AC-7 có When đi qua backend nhưng thiếu eval cross-layer; fetch giả cố định 400 không kiểm thân request, kết thúc luồng suôn sẻ không ai đo | Hộp thoại gửi burst_until thay burstUntil hoặc không làm mới Badge; E7, E8 vẫn xanh | jsdom + fetch giả chuyển thân cho datCheDo thật trên lược đồ tạm; assert thân, params, Badge | fixed: thêm E11 (layer cross-layer, ca CD-AC-7b) và vế cross-layer trong AC-7 |
| P1 | evals | Ảnh hộp thoại E8 chụp ngoài đường che của ui-capture.sh trong khi hộp hiện tên điểm tầng A; CLI ở E5 có thể in 0 dòng và qua rỗng [buoc-chup-khong-in-ten-that#F1] [collections-khong-so-s02#F1] | Ảnh có tên nhóm thật vào evidence của kho công khai; CLI chạy nhầm lược đồ in 0 dòng vẫn xanh | Che [data-tier-a] trước khi chụp; CLI chạy trên điểm quá hạn mới, đếm đúng 1 dòng rồi mới assert không có tên | fixed: hộp thoại chỉ ghi mã nguồn + id (design ST-hop-chon, AC-7, E7 kiểm không có name/group_key); E8 chạy mask-tier-a.js và chỉ chụp khi mọi [data-tier-a] đã che; E5 thêm CD-AC-5c đếm đúng 1 dòng trên điểm viết trước riêng |
