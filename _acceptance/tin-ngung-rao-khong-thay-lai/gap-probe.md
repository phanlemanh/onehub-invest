---
slug: tin-ngung-rao-khong-thay-lai
at: 2026-11-08T16:10:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract (sổ d-20261108T155925Z-5) | Dòng sổ ghi máy quyết dùng `withdrawn` «Đã gỡ» cho ngừng rao. Câu trích chỉ cho thấy trục đã có `withdrawn`, không quyết rằng ngừng rao (Q4) phải trùng nhãn với gỡ ở nguồn. CONTEXT.md cũng chưa có thuật ngữ «Ngừng rao». | Mạnh duyệt mà không biết tin không thấy lại hiện y như tin nguồn gỡ. Muốn tách về sau phải đổi CHECK của 044/059 trên dữ liệu thật. | Dòng sổ chi-nguoi (Hỏi-4). AC-7, E7 thêm ô thuật ngữ «Ngừng rao» trong CONTEXT.md. | fixed: d-20261108T160325Z-13 thay d-5 thành Hỏi-4 (chi-nguoi); AC-7, E7 đòi mục thuật ngữ «Ngừng rao» có withdrawn, khong-thay-lai, _Avoid_ |
| P0 | contract (sổ d-20261108T155925Z-3), evals E2 | Mốc thu S03 chốt theo cả nguồn. Lối chết không loại phương án mốc theo nhóm. Fixture E2 chỉ có ca cả nguồn ngừng thu. | Một nhóm S03 bị bỏ khỏi danh sách thu trong khi nhóm khác vẫn thu: max(last_seen) vẫn tiến, nên sau N ngày mọi tin của nhóm ngừng rao oan mà E2 vẫn xanh. | Dòng sổ thay d-3. E2 thêm ca hai nhóm (X ngừng, Y đang thu) kèm đối chứng dương. | fixed: đo 08/11 có 16/41 nhóm im quá 7 ngày, 5.065/5.065 tin S03 nối được nhóm. d-20261108T160325Z-12 chốt mốc S03 theo nhóm (stg_zalo_posts); AC-2, E2 có nhóm X, Y, tin X1 và chiều đỏ «TNR-AC-2 nhóm ngừng thu bị ngừng rao» |
| P1 | design, contract (AC-1), evals E1 | Tin S06 không có dòng stg thì lần thấy cuối rơi về ngày đăng. | Khi áp, tin S06 đăng trước 18/10 mà thiếu dòng stg ngừng rao ngay. | Đếm tin S06 thiếu dòng stg. AC-1, E1 thêm ô thiếu dòng stg. | fixed: đo 08/11 có 0/74.581 tin thiếu dòng stg. Luật bỏ qua tin thiếu dòng stg (AC-1); E1 thêm tin E với chiều đỏ «TNR-AC-1 tin thiếu dòng stg bị ngừng rao» |
| P1 | contract (Hỏi-2), design | Hỏi-2 chỉ đưa số của S06, chưa có số S03, S05 và nghĩa «không thấy lại» của S03. | Mạnh duyệt một N chung mà không biết bao nhiêu tin S03 đổi. | Bảng nguồn × N (14, 21) và câu nêu nghĩa cho S03. Thêm lối «S03 chưa có N». | fixed: d-20261108T160325Z-14 thay Hỏi-2 kèm bảng (N=21: 0/0/0; N=14: S06 6.693, S03 451, S05 0), nghĩa S03, và lối «S03 chưa có N» |
| P1 | evals E8 | E8 chỉ chạy `--thu`, không chạy chế độ thường mà cloud-sync dùng; chưa so dòng đếm của 059 từng chữ. | Kiểm to_regproc chỉ nằm ở nhánh `--thu`; sau gộp mọi lượt cloud-sync đỏ. | E8 thêm ca chế độ thường chưa áp, so từng chữ với lệnh nhánh chính, kèm chiều đỏ. | fixed: AC-8, E8 có ca (i) không cờ, so stdout với bản origin/main của lệnh trên cùng DB, chiều đỏ «TNR-AC-8 chế độ thường chưa áp mà lỗi» |
