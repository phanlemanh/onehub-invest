---
slug: doc-gop-hang-ngay
at: 2026-11-07T23:52:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

# Gap-probe — doc-gop-hang-ngay

Phản biện context sạch (tác tử chấm-đọc), đọc đúng design doc, contract, evals, sổ quyết định và tệp bài học (advisory, không
finding nào dựa trên bài học).

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design (sổ d-20261107T231918Z-4) | Luật «đã đọc theo text_hash bất kể post_id» ghi một-lối mà lối dò theo post_id vẫn sống; khoá không tính ảnh | Bài đăng lại ngày sau không có nhãn dưới post_id của nó; mẫu soát DO1 dò theo post_id tự gọi lại; bài cùng chú thích khác ảnh bị coi đã đọc | Đổi d-4 thành câu hỏi hoặc dòng supersedes; AC-1 nói rõ bộ đọc theo post_id | fixed: dòng sổ mới supersedes d-4 lấy lại luật của chay PL30 (cùng post_id, text_hash, model, prompt) — căn cứ chay.ts, vẫn dưới trần; AC-1 thêm R (đã đọc cùng post_id) và X (cùng chữ post khác → được gọi), AC-3 thêm ca đăng lại D+1 |
| P1 | evals (E1, E3) | Nhãn «đã đọc» do test tự chèn, không đi vòng writer thật; E3 không phân biệt dò post_id với text_hash | Writer băm khác bộ dò, E1/E3 vẫn xanh | Ca đăng lại ghi qua chayLuot thật, chiều đỏ ghim | fixed: nhãn của R và X ghi bằng chayLuot thật; E3 thêm 'PL34-AC-3-DANG-LAI' + chiều đỏ 'DANG LAI KHONG CO NHAN'; E1 thêm chiều đỏ 'BAI DANG LAI BI BO' |
| P1 | contract (AC-1, AC-3) | Không fixture hai bài cùng text_hash khác ảnh | Bài chỉ ảnh chữ rỗng hay chú thích ngắn trùng bị bỏ mãi | Thêm fixture, chiều đỏ | fixed: theo luật post_id mới, bài khác ngày luôn được đọc dưới post_id của nó; dữ liệu thật 08/11 có 0/2.950 bài chỉ ảnh chữ rỗng (chữ là URL ảnh). Phần còn lại — hai bài CÙNG ngày cùng chú thích khác ảnh bị khuTrung (luật GN2) gộp — ghi Notes giới hạn đã biết |
| P1 | contract (AC-4) + evals (E4) | Trần trừ theo ước, chưa đo ca tiền thật lớn hơn ước; Notes hứa «không bao giờ vượt trần» | Ước thấp phần ảnh, một đêm chi thật vượt 20 USD mà E4 xanh | Ca tiền thật 0,03 > ước 0,01, chiều đỏ | fixed: AC-4 ước = max(công thức, tiền thật lớn nhất đã gặp) cộng tiền thật đã chi; E4 thêm 'PL34-AC-4-DAT' + chiều đỏ 'CHI THAT VUOT TRAN'; Notes bỏ «không bao giờ», ghi biên vượt tối đa một lời gọi; bỏ câu «Gateway không tính tiền lời gọi hỏng», ghi là chưa đo |
| P2 | evals (E7) | Không ghim thông điệp từng ca, không chứng không chạm DB trước khi kiểm | Mã in nguyên argv hay lỗi kết nối vẫn xanh | Ghim từng ca + không 'ECONNREFUSED' | fixed: E7 ghim thông điệp từng ca (NGAY SAI KHUON, TRAN SAI, co khong nhan…) và assert stderr không chứa 'ECONNREFUSED' |
