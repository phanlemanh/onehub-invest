---
slug: kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh
at: 2026-11-22T12:10:00Z
verdict: findings
p0: 0
p1: 1
p2: 4
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | Chiều đỏ của AC-2 chỉ làm lệch resolve_offer_fields; nửa so resolve_offer_area_du_an (bước trả lại bản đang chạy, vì 102) chưa có chiều đỏ | Bước trả lại bị bỏ hay đọc sai thời điểm, hàm DA45 rơi về bản 099 chưa vá mà E2 vẫn xanh | Chiều đỏ --pha bo-tra-du-an đỏ đúng resolve_offer_area_du_an và chỉ hàm ấy | fixed: thêm boQuaChen "tra-du-an", --pha bo-tra-du-an, ca HT5-AC-2 đòi FAIL gọi đúng resolve_offer_area_du_an; AC-2 và E2 ghi lại |
| P2 | contract | Không AC nào đo nhánh DB chưa có 068 hay 099 (luật chỉ áp lại thứ DB đã có) | Hàm dò luôn trả true, DB thử cũ bị cấy thêm 099 mà E2 vẫn xanh trên DB đủ | Trong giao dịch dựng trạng thái chưa có phần chèn, napPhatBieu phải giữ md5 và thân không có lời gọi resolve_offer_area_du_an | fixed: --phan-xu thêm bước «DB chưa có phần chèn 068, 099» (dựng bằng napPhatBieu bỏ hai bước), ca HT5-AC-2 đòi dòng ok tương ứng; AC-2 ghi lại |
| P2 | evals | Đối chứng dương của AC-1 lấy từ chính mẫu quét, không ma trận viết trước; 063, 066 không được giải thích | Migration mới viết FUNCTION public.resolve_offer_fields hay ::regprocedure lọt bộ quét | Bảng viết trước mọi tệp có chữ resolve_offer_fields, xếp loại, so với quét rộng | fixed: BANG_PHAN_XU 11 tệp viết tay (063/066 gọi, 096/102 nhắc — có chú thích vì sao ngoài chuỗi), quét rộng không phân biệt hoa thường, bộ phân loại nhận public. và ::regprocedure; chiều đỏ 998 + 999 |
| P2 | contract | Soát phat-bieu-cat-chuyen --thu (GS dặn) không có AC hay eval, Notes trống | Số của thước này đổi lặng lẽ, Cổng Bằng chứng ký thiếu số trước/sau | Eval chạy hai bản, ghi số, dòng lệch có lý do | fixed: AC-7 + E7, probe probes/so-cat-chuyen.mjs (--chay ghi so-cat-chuyen.md, --kiem đòi mọi dòng lệch có lý do; chiều đỏ --bo-ly-do, --cay-lech) |
| P2 | design (sổ S1) | Câu trích của d-2, d-3 không loại được phương án còn lại | Người duyệt hiểu sai lý do chọn | Mỗi căn cứ phải loại được phương án kia | fixed: hai dòng sổ mới mang supersedes, căn cứ mot-loi nêu lối chết; can-cu-s1: câu hỏi 0 · đỏ 0 |
