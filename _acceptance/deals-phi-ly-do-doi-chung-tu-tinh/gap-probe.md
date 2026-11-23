---
slug: deals-phi-ly-do-doi-chung-tu-tinh
at: 2026-11-19T08:36:33Z
verdict: findings
p0: 1
p1: 1
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Đối chứng sửa tin đầu thật trên chính lượt đo chính, nên kiểm «đầu danh sách ≤ 35%» và «5 tin đầu» đọc danh sách đã mất tin đầu; sổ ghi một lối mà chưa xét lối tin tổng hợp | Chỉ một tin ≤ 35% trong DB: đối chứng loại nó, đếm toàn DB ra 0, kiểm rơi vào lối thoát và báo xanh với nghĩa khác | Tách đối chứng vào SAVEPOINT rồi lùi; ca DPD-AC-6 một tin ≤ 35% | fixed: design §Cách làm dùng SAVEPOINT doi_chung; thêm AC-6/E6; dòng sổ mới supersedes dòng 2 ghi lối tin tổng hợp và lý do bỏ |
| P1 | contract | «DB không đổi» chỉ băm offer_id:bait_gap_pct, không phủ area_m2 mà đối chứng ghi, không phủ dòng audit | Đối chứng lỡ commit ngoài giao dịch: tin thật mất diện tích, audit có dòng giả, băm vẫn xanh | Băm thêm area_m2, đếm dòng audit bait-gap:loai-phi-ly trước/sau | fixed: AC-4 và E4 đòi băm offer_id:bait_gap_pct:area_m2 + số dòng audit; chiều đỏ trong test cho phần chạy trực tiếp: deferred — phần ấy chạy trên DB thật, E4 đo nó |
| P2 | evals | Bước đêm hỏng của E2 là bản chép tay bước 1–2, không chứng nó tính số giảm như bên ghi thật | Bên ghi thật tính khác bản chép, nhánh phá trong test đỏ còn trên DB thật thì không | Dùng refreshBaitGap thật qua client bọc bỏ đúng hai câu ghi của luật | fixed: E2 dùng refreshBaitGap thật qua client bọc, ghim chặn đúng 2 câu |
