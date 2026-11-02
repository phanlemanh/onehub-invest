---
slug: s03-va-doc-tin
at: 2026-11-02T02:20:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design + contract | Ba lựa chọn chỉ người có không có dòng sổ: đổi khoá gom trên tin thật, S05 đổi theo không ngưỡng, parser đè toà của LLM. Hiệu lực sau gộp ghi lệch nhau. AC-9 không có trần | Gộp xong, lượt 00:00 chạy trước lượt đối chiếu; nhiều tin nghỉ, mọc, giá S05 đổi mà không ai biết đúng sai, E9 vẫn ĐẠT | Dòng sổ chỉ-người, `kho_dao` true; trần trong AC-9; E9 đỏ khi vượt hoặc thiếu số in | human-gate1: đo số thật, gửi Hỏi-1 (N1-9); thêm trần nghỉ, mọc, S05 và năm số in vào AC-9, E9; sửa Out of scope và design cho khớp |
| P0 | design (sổ căn cứ) | d-4 tới người xem mà `kho_dao` false, sai số ghi 2% trong khi có ca 5%; d-8 lối DB thử còn sống; d-9 gói ba lựa chọn dưới một câu trích; d-7, d-2 câu trích không quyết lựa chọn | Mạnh tưởng các lựa chọn đã có căn cứ, tin 1,89 tỷ hiện 1,8 tỷ như giá chính xác mà không được hỏi | Mọi dòng mục-tiêu có câu trích quyết đúng lựa chọn | human-gate1: d-4 thay bằng dòng chỉ-người, Hỏi-2 (N1-9), sai số đúng 5%. Fixed: d-8 thêm lượt đối chiếu trên DB thử, d-9 tách ba dòng, d-7, d-2 đổi căn cứ |
| P1 | contract + evals | Khoá gom, khoá dính, phân xử không có Then; «chỉ toà», «cùng toà» không có ca; E8 đo có mặt chứ không đúng cặp; không kiểm 8 câu ADR-0013; không eval «không migration» | Một tin phát biểu hai trục, bài đăng lại tách làm hai, `block_raw` LLM mất mà test xanh | Ca DB seed `offer_id` dính; 0 tin hai trục trên bài thật; ca parser khác LLM | Fixed: AC-8 và E8 viết lại đủ các Given; `repostKey` thêm trục ở cả nhánh đủ phường + DT (lỗi thật, gap-probe bắt đúng); thước `hai_truc`; 8 câu ở design; E9 đỏ khi có migration |
| P1 | contract + evals | Thước AC-9 không có định nghĩa mẫu số, họ, công tắc; không có đối chứng công tắc, không nhánh descope; tập không ghim | Sửa nhãn hoặc công tắc không tác dụng mà thước vẫn ĐẠT; đo tắt, ship bật | E9 in và ghim sha256, sha nền, công tắc, mẫu số; hợp đồng định nghĩa | Fixed: mục «Cách tính thước AC-9», «Nhánh bỏ giá không đơn vị»; sha256 ghim, lệch thì đỏ; thước `cong_tac_co_tac_dung`; ca ghim mặc định bật; đường suy qua `--git-common-dir` |
| P1 | contract + evals | Ma trận hụt so với luật: AC-4 danh sách mở, AC-2 thiếu dạng cũ, AC-5 thiếu «/th», «/năm», biên 1 tỷ, AC-6 thiếu chống dương; thước giá chỉ số ròng | «giá vốn» thành giá, «1,2 tỷ/năm» thành bán, bài vá bù bài hỏng | Danh sách đóng; thêm ca; số đúng thành sai có trần | Fixed: AC-4 đóng danh sách, mỗi từ một dòng; thêm các ca; sửa `THEO_THANG` nhận «/năm»; thước `dung_thanh_sai` ≤ 3 (đo 0). Ca «cắt lỗ 2,9 tỷ» giữ null có chủ ý, ghi ở AC-4 |
