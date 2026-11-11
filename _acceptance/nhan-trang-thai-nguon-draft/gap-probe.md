---
slug: nhan-trang-thai-nguon-draft
at: 2026-11-11T06:10:00Z
verdict: findings
p0: 1
p1: 1
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Hợp đồng khai surfaces ui nhưng không eval nào đo chỗ người nhìn; lời bỏ ui-observed dựa vào một ca render RegistryTable mà không eval nào ghim | Ô trạng thái RegistryTable tra nhãn qua đường khác thì /ops/sources vẫn hiện Giá trị khác cho mã draft trong khi E1–E4 xanh | Thêm AC và eval render RegistryTable với dòng draft: HTML có Chưa thu, không có Giá trị khác; đối chứng dòng active; chiều đỏ bỏ dòng draft | fixed: thêm AC-5 và E5 (ca SL-AC-5 render RegistryTable, đỏ khi bỏ nhãn draft — đã đo); dòng sổ bỏ ui-observed ghi lại mang supersedes |
| P1 | evals | E2 không chứng bộ đọc lấy đúng CHECK của source_registry thay vì source_groups_status_chk cùng năm giá trị | Bộ đọc khớp lỏng _status_chk vẫn qua E2; migration chỉ đổi source_groups làm ca đỏ oan hoặc che giá trị thiếu nhãn của source_registry | Đối chứng (a) nối source_groups_status_chk có archived vẫn xanh; (b) source_registry thêm archived rồi source_groups đặt lại vẫn đỏ gọi tên archived | fixed: thêm ca SL-AC-2 đối chứng source_groups (a) và (b); AC-2 và E2 ghi thêm |
| P2 | evals | Bốn eval chung một lệnh suite, expected mở bằng exit 0 nên không quy về từng ca; chiều đỏ E1 không có lệnh chạy | Tệp test lọt khỏi glob hoặc ca bị skip mà suite vẫn exit 0 | Ghim dòng ok của từng ca SL-AC trong output, không skip; khai lệnh đột biến cho chiều đỏ E1 | fixed: expected E1, E2, E3, E5 ghim dòng ✔ từng ca và không skip; chiều đỏ E1, E2, E5 đã chạy phá thử ở S1 (bỏ dòng draft, chạy riêng tệp test) |
| P2 | evals | E4 đòi log ON12-AC-7 liệt draft, phụ thuộc DB local còn mã draft lúc chép | Mã S07, S12–S15 chuyển active trước lượt chấm thì E4 không thoả dù tính năng đúng | E4 ghi tập trạng thái thực tế; không còn draft thì báo thay vì đỏ | fixed: E4 expected ghi tập thực tế, không còn draft thì báo cáo nói rõ AC-4 chỉ chứng suite xanh và nhãn draft dựa vào E1, E2, E5 |
