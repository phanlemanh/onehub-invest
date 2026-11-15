---
slug: goi-thang-anthropic
at: 2026-11-15T08:30:00Z
verdict: findings
p0: 1
p1: 4
p2: 7
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract AC-5, AC-6; thiết kế §8; loi-nha-cung-cap.ts | Hết credit, API Anthropic thường trả 400 `invalid_request_error` kèm câu «credit balance is too low», chứ không chỉ 402 `billing_error`. Ca 400 này rơi vào lớp `khac`. | Khi 200 USD cạn, lượt không dừng sớm, đêm nào cũng bắn hàng nghìn lời hỏng — đúng sự cố 12–14/11 lặp lại trên đường mới. | Thêm ca 400 «credit balance» vào AC-5/AC-6. | fixed: `phanLoaiLoi` xếp 400 kèm câu «credit balance is too low» vào lớp `het-tien`, kiểu ghi `credit_balance`. Câu chỉ dùng để so mẫu, không chép vào sổ. Có ca test cho cả agent và pipeline (GTA-AC-5, GTA-AC-8). AC-5 ghi thêm dòng này. |
| P1 | Điểm xong | Không có cách đo phần dư sau chạy bù. Số nền đo lúc 06:2xZ sẽ trôi theo thời gian. Bài lỗi 429/5xx của ngày cũ không được bước đêm vớt lại. | Lần chạy bù còn dư vài chục bài, luật «lệch thì dừng» làm đường găng kẹt. | Đo `can_goi` ngay trước khi chạy bù; có SQL đếm phần dư theo lớp lỗi; có cách vớt. | fixed: Điểm xong đổi lại: đo `--thu` ngay trước khi chạy, chạy bù lặp tới khi `can_goi` không giảm nữa. Thêm SQL đếm phần dư theo `ai_calls.loi` của ngày chạy bù, và ngưỡng dư chấp nhận: chỉ JSON hỏng và 4xx của bài lẻ, không có `het-tien`/`khoa`. |
| P1 | thiết kế / decisions | Đường thẳng không có cờ `zeroDataRetention` như đường Gateway. | Nội dung bài nằm lại phía nhà cung cấp theo hạn lưu mặc định của API mà Mạnh chưa được trình. | Ghi rủi ro, trình Mạnh ở cổng. | fixed: thêm dòng sổ Hỏi-1 (câu chỉ người quyết). Thiết kế thêm §10 «Tư thế dữ liệu». Cổng Phạm vi dừng chờ Mạnh, không đi làn V. |
| P1 | AC-4 / cham-lenh.ts | `cham` gọi `hoiGop` không truyền `duong`; `hoiGop` mặc định rơi về `gateway`. | Lệnh chấm qua được bước kiểm khoá anthropic nhưng lại gọi Gateway. | Bắt buộc truyền `duong`. | fixed: `duong` thành tham số bắt buộc của `hoiGop` (TypeScript chặn lúc biên dịch). `cham` truyền `n.duong` và dừng sớm ở lớp dừng. |
| P1 | AC-8 / label-nhap-ghep.mjs | Không kiểm thân lời gọi của PL35 (temperature). | Bản PL35 gửi `temperature`, Haiku 5.5 trả 400, PL35 hỏng. | Kiểm thân lời gọi. | fixed: đường anthropic của PL35 không gửi `temperature`, `thinking`. GTA-AC-8 kiểm `max_tokens` 600, `system`, nội dung, khoá. (`temperature: 0` mà phiên phản biện thấy nằm ở đường Gateway cũ, giữ nguyên.) |
| P2 | decisions d-3 | `npm ci` sau gộp chỉ ghi bằng chữ. | Gộp xong mà chưa `npm ci` thì bước đêm chết với `ERR_MODULE_NOT_FOUND`. | Có lệnh kiểm. | fixed: Điểm xong và mô tả PR ghi bước triển khai kèm lệnh kiểm `node -e "require.resolve('@anthropic-ai/sdk')"` chạy trong `agent/` của checkout chính. |
| P2 | Điểm xong | Không ước thời gian chạy; có thể chồng với bước đêm. | Lượt bù chồng bước đêm, gọi trùng một bài. | Ghi giờ chạy. | fixed: chạy bù khi xa 00:00 giờ VN, xong trước 16:30Z. Hai ngày lớn thì chạy lần lượt. |
| P2 | AC-6 | Không nói dòng `{"pl34": …}` còn in khi thoát 4 hay không. | Mất số `con_lai` đúng đêm hết tiền. | Ghi rõ. | fixed: lệnh luôn in dòng `pl34` trước khi thoát. Tóm tắt có thêm `dung` và `loi_dung`. GTA-AC-6 kiểm `tomTat.dung` và `con_lai`. |
| P2 | doc-gop-hang-ngay.sh | Thoát 1 (khoá sai) và thoát 5 vẫn chạy bước hôm kia; chú thích còn ghi bộ mã cũ. | Thêm một dòng `JOB FAIL` thừa. | Quyết rõ cách xử. | fixed: thoát 5 cũng bỏ bước hôm kia, có dòng `thieu-khoa`. Thoát 1 giữ nguyên hành vi (vì không tách được với ca «mọi lời gọi hỏng»). Chú thích ghi đủ bộ mã 0–5. |
| P2 | thiết kế §6 | Đường thẳng dùng nhiệt độ mặc định, đường Gateway gửi `temperature: 0`. Câu «giống Gateway» vì thế không đúng. | Chuỗi đo DO1 gộp nhãn trước và sau đổi đường như cùng một cách đọc. | Ghi rõ. | fixed: sửa câu ở thiết kế §6. Thêm dòng sổ ghi đổi lấy mẫu. `probabilities.duong` cho phép tách sau; tách bộ đo DO1 theo đường là ngoài phạm vi. |
| P2 | AC-8 | PL35 không ghi `ai_calls`; mã thoát khi hết tiền chưa nêu. | Hết tiền ở PL35 không có mã riêng. | Ghi rõ. | fixed: `label-nhap-ghep` thoát 4 kèm dòng `JOB FAIL [label-nhap-ghep] het-tien`. PL35 không ghi `ai_calls` (hiện trạng, ngoài phạm vi), ghi ở Out of scope. |
| P2 | AC-6 / E6 | «Lời gọi» không phân biệt lời gọi `hoiGop` với yêu cầu HTTP. | Số đếm phụ thuộc cách hiểu. | Ghi rõ. | fixed: AC-6 ghi ca 429 là 3 lời `hoiGop` và 9 yêu cầu HTTP (`maxRetries` 2, `retry-after-ms: 0`). GTA-AC-6 kiểm cả hai số. |
