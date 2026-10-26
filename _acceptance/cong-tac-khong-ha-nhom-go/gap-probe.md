---
slug: cong-tac-khong-ha-nhom-go
at: 2026-10-26T14:05:00Z
verdict: findings
p0: 3
p1: 1
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | câu trích của lựa chọn 409 khi tắt không quyết giữa 409 và 200 kèm câu báo; lệch ma trận TV2a mà design ghi là theo đúng | Mạnh ký vì tưởng chỉ áp lại luật TV2a; người vận hành gặp lỗi đỏ chưa ai chọn | dòng sổ thay + câu Hỏi trên thẻ | human-gate1: Hỏi-1 (khuyên 409); tiêu đề design nêu đích danh hai ô lệch |
| P0 | design, evals | lời hứa báo rõ trên lưới không có gì đo; căn cứ bỏ đặc tả UX lập luận vòng | lưới không hoàn công tắc hay không hiện chữ lỗi mà E1–E5 vẫn xanh | ca thử component với 409 giả | fixed: AC-5 + E6 (jsdom, đối chứng 200); dòng sổ thay căn cứ trỏ đường xử lý 4xx của lưới |
| P0 | design | căn cứ một-lối của việc không chặn ở DB sai tiền đề (trigger vẫn chặn được kiểu ghi của công tắc) | Mạnh duyệt descope trên tiền đề sai | đổi căn cứ sang câu phạm vi | fixed: dòng sổ thay, căn cứ mục tiêu trích câu phạm vi giám sát chốt |
| P1 | contract | vế Then của AC-4 sai ở hai ô tắt retired/completed | người chấm đọc AC-4 theo chữ thì fail | viết lại vế Then | fixed: AC-4 nêu đích danh hai ô; E4 thêm ca ô tắt retired/completed |
| P2 | evals | đối chứng hồi sinh ở nhánh đồng thời không tất định | đối chứng chập chờn | giới hạn đối chứng vào nhánh nối tiếp | fixed: E2 ghi rõ đối chứng chỉ nhánh nối tiếp; E3, E4 thêm layer backend-effect |
