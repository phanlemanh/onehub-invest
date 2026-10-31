## Ngữ cảnh
- Sản phẩm: onehub-invest — danh bạ Người theo SĐT số gốc (SD3) · chân sản phẩm: `_acceptance/sdt-luu-goc-e164/review-findings.md` Ngoài-14/15/17 [SUY-TỪ-REPO: _acceptance/sdt-luu-goc-e164/review-findings.md] · chân ngành: RESO Member/Contact — SĐT là bí danh, không phải khoá [SUY-TỪ-REPO: ../onehub-invest-tri-thuc/wiki/chu-de/nguoi-va-sdt.md]

## Trục
- Lỗi danh bạ: số thuộc hai người | số lạ thừa | người thiếu | ánh xạ lệch khi chuyển | tên sai người | tên đã nghỉ | lộ số trên trang   [thước CE: ba finding Ngoài-14/15/17 + kịch bản lỗi của bộ dựng]
- Thời điểm: một lần khi chuyển 060 (DB thử) | mỗi đêm sau khi áp   [thước CE: kế hoạch triển khai SD3]
- Người đọc: dq_check_results | /ops/quality | /ops/people   [thước CE: bộ đọc thật trong app]

## Core (≤20%)
1. Mỗi số một người + số lạ + người thiếu, mỗi đêm (N6) — trụ của Ngoài-14, sống lâu sau 060.
2. Đúng ảnh và số người bằng nhau khi chuyển — phần Ngoài-14 chỉ có nghĩa ở lượt chuyển.
3. Tên đúng người khi chuyển — Ngoài-15.
4. Che số qua loader thật, ba vai thật, bộ quét 3+ — Ngoài-17.

## Later
- Tên trên tin gắn vào người theo SĐT trong bộ dựng (đổi hành vi sản phẩm, không phải độ chặt phép đo).
- Kiểm hằng đêm «tên đúng người» (vô nghĩa khi bộ dựng chưa gắn tên cho người theo SĐT).

## Never
- Kiểm hằng đêm «đúng ảnh tập số cũ» — ánh xạ cũ chỉ tồn tại trước 060.

## Cross-cutting áp mọi ô Core
- Đối chứng đỏ đi qua CÙNG hàm đo; detail ghi DB chỉ số đếm (dq_check_results lên cloud).
