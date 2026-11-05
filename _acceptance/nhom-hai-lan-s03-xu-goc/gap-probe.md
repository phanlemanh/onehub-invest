---
slug: nhom-hai-lan-s03-xu-goc
at: 2026-11-05T04:46:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Đổi transform ghi máy quyết, `kho_dao` false, trong khi đó là đường lên cổng; 74 bài đổi giá trị suy không nêu ở Context | Mạnh ký mà không biết mình duyệt đổi đường dữ liệu cổng | Dòng thành câu hỏi, Context ghi số | fixed: thành Hỏi-2 có hai lối khác, Context ghi 2 nhóm, 74 bài |
| P0 | contract | Dòng gộp và ghi sổ ghi nguồn mục tiêu, `kho_dao` false; Hỏi-1 không tách chọn lối với cho phép chạy; không có ngày, nơi chạy, bước sao lưu | Mạnh trả Hỏi-1 tưởng chỉ chọn lối, máy coi là lời cho phép | Câu hỏi, Notes ghi đủ | fixed: Hỏi-3 `kho_dao` true; Notes: Hỏi-1 chỉ chọn lối, sớm nhất 06/11, DB local, không cloud, lối B xuất dòng trước |
| P1 | evals | Không ghim đường mặc định của lệnh thật, fixture tự dựng dạng tiền tố, tin thêm không có ngưỡng, hai vế cổng không có chiều đỏ | Mặc định để nguyên văn vẫn xanh vì đáp án đúng là 0 tin đổi | Lệnh mặc định, đếm độc lập, mồi từ dòng thật, ca đỏ ghim | fixed ở AC-4, E1, E4. Tag cross-layer: rejected, xem dòng sổ riêng |
| P1 | contract | «Hiệu lực» chưa định nghĩa, ca `paused` và đại diện đã gỡ chưa có AC, lý do và trạng thái cũ chưa ghim, tiêm lỗi có thể không nổ | Sync đổi dòng phụ sang `paused` trước ngày chạy, lệnh bỏ sót, E5 vẫn xanh | Định nghĩa, ca `paused`, hoàn lại đúng băm, xác nhận lỗi nổ | fixed ở AC-5, AC-6, AC-7. Công tắc: rejected, đã có eval ở `cong-tac-khong-ha-nhom-go` |
| P1 | evals | Chỉ quét khoá, đầu ra không có đối chứng và số byte, tệp chưa commit không nêu, hai DB thử | Tên đơn vị lọt vào báo cáo, bước bắt đầu ra hỏng vẫn xanh | Quét thêm tên, mồi đỏ, số lệnh và byte, tệp chưa commit, khoá hai DB | fixed ở AC-10, E10 |
