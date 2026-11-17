---
slug: nhan-du-an-thay-khu-do-thi-ops
at: 2026-11-17T06:31:33Z
verdict: findings
p0: 1
p1: 2
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ bỏ quét phủ trích «Ngoài-2: mở hợp đồng mới», câu ấy không quyết việc bỏ quét; chữ hiển thị ngoài app/src (nhãn từ DB, seed migration) không được đếm. | Màn Ops hiện nhãn đọc từ DB còn «Khu đô thị», lưới app/src vẫn xanh, cổng ký sai. | Bảng phủ đếm thật kèm cột ai đọc phía sau. | fixed: dòng sổ d-…-9 thay d-…-5 (lối duy nhất là đếm thật); mục Coverage thêm bảng phủ đếm từ main 5508f620 — app/src 18·8 trong phạm vi; db/migrations 6·3 chỉ chú thích và một câu RAISE EXCEPTION của 048 (migration bất biến, đổi cần migration mới T3 — ghi Out of scope); pipeline mã chạy 3·3 chỉ chú thích; data-api/src và pipeline/sql 0 |
| P1 | evals | AC-1 chỉ khẳng định âm tính; khẳng định dương «ghi Dự án» chỉ đo ở bốn test jsdom, lam-giau-bang và lib/so-don-vi không có ca. | Xoá chữ hoặc ghi «Du an» không dấu, AC-1 và E2 vẫn xanh. | Ma trận dương tệp × chuỗi mới. | fixed: thêm ca NDT-AC-2 (eval E6) — ma trận viết trước tệp × chuỗi hiển thị mới, mỗi ô một khẳng định có mặt, chiều đỏ trên bản chép đổi «Dự án» thành «Du an». lam-giau-bang chỉ có dòng chú thích (lát lấy nhãn từ lib/do-hang-ngay.ts, đã ở ma trận); lib/so-don-vi.ts cũng chỉ là chú thích — AC-1 phủ |
| P1 | evals | Lời hứa «khoá, id cột, giá trị chọn không đổi» và «không ca nào bị xoá» không có eval. | Bỏ đè TRUONG_DO_DUNG làm đổi khoá; hoặc xoá một ca test đang đỏ thay vì đổi chữ. | So tập khoá; đếm số ca trước sau. | fixed một phần: khoá projects, du_an, ma-trung-du-an và khoá project của FIELD_LABEL vào ma trận NDT-AC-2. rejected phần đếm ca: phép so với main mất nghĩa ngay khi PR gộp; bỏ lời «không ca nào bị xoá» khỏi E2 thay vì giữ một lời hứa không thước — diff của PR đọc được |
| P2 | evals | Không có đối chứng dương trên cây thật cho lưới quét. | Regex không khớp chữ có sẵn (dạng Unicode khác), lưới xanh rỗng. | Chạy lưới trên bản main, phải ra 18 vi phạm. | fixed: E1 thêm đối chứng dương — cùng hàm quét trên git show 5508f620 của tám tệp phải ra đúng 18 vi phạm ở 8 tệp |
| P2 | evals | Đối chứng của E4 chỉ phủ mất «công khai»; vế «tầng A» và phạm vi khối S08 không có đối chứng. | Khối S08 mất câu tầng A mà probe xanh; hoặc «công khai» ở khối khác giữ probe xanh. | Hai đối chứng thêm, mỗi cái một thông điệp. | fixed: E4 thêm hai đối chứng ghim «doi chung: mappings mat cau tang A bi bat» và «doi chung: cong khai o khoi khac khong tinh» |
