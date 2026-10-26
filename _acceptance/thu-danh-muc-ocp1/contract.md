---
schema_version: 1
feature: collector S08 thu danh mục quỹ căn (gồm OCP1) vào raw — chỉ đọc, cấu hình nguồn ở máy local, không lộ nguồn trong kho công khai
slug: thu-danh-muc-ocp1
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-26T13:46:32Z
approved_by:
approved_at:
---

# Acceptance Contract: thu-danh-muc-ocp1

## Context

PL10 (lộ trình): căn gốc căn hộ là dòng danh mục; Mạnh chốt 23/10 thêm nguồn danh mục cần đăng nhập S08, duyệt 24/10 chính
sách S08 (chỉ đọc, ≤1 lần/tuần, chỉ nội bộ, không tái xuất nguyên văn; `stg_s08_inventory` chỉ local) và mở rộng thu toàn
danh mục. ZCode làm ở lời giao claudedp-2310-12 → 2410-19 → 2610-10. Bản đầu bị chặn vì fixture là dữ liệu API thật; bản v2
`zcode/s08-danh-muc-v2` @ 61981ded (một commit từ main 432d7ca, chưa từng push) dùng fixture giả, đưa đường dẫn API và danh sách
khu đô thị ra cấu hình local, nâng DATA-CONTRACT lên schemaVersion 4 (thêm kind `inventory_unit`). Nhánh nghiệm thu gộp main mới nhất
và nâng thước kev-nhan theo v4. Importer (ZC8) nghiệm thu ở hồ sơ `import-s08` cùng nhánh.

Đo trên máy 26/10: asset_nodes có 3 nút khu đô thị Ocean Park, CHƯA có nút toà; điều kiện bật của PL10 «mọi toà OCP1 trong
asset_nodes có danh sách trục» vì vậy rỗng nghĩa. S08 trả mã căn từng căn (cao tầng không có trường trục riêng — trục suy từ
mã căn). Hợp đồng này đo «raw có danh sách căn OCP1»; dựng toà/trục/căn vào asset_nodes là PL11.

Source input: lộ trình PL10 + lời giao 2610-10 (phiên điều phối liên làn, 26/10/2026)

## Criteria

- AC-1: Given trang API giả (fixture giả), When chuyển thành item raw, Then mỗi căn có mã thành một item `inventory_unit` mang sourceId = sha256(S08|khu đô thị|mã căn) và payload nguyên vẹn; bản ghi thiếu mã căn bị bỏ.
- AC-2: Given chi tiết hoặc danh mục khu đô thị có khoá liên hệ lồng ở mọi độ sâu, When thu, Then raw không còn khoá đó.
- AC-3: Given thiếu bất kỳ cấu hình local nào (gốc API, một trong ba endpoint, danh sách khu đô thị), When chạy collector, Then nó ném lỗi rõ và không có lời gọi mạng nào; đủ cấu hình thì có lời gọi và có căn.
- AC-4: Given API trả 401 hoặc mã lỗi, When đọc trang, Then ném lỗi rõ.
- AC-5: Given nhánh so với main, When soát mọi dòng thêm bằng bộ mẫu local sinh từ dữ liệu thật và bản code cũ, Then không có tên/mã khu đô thị, mã căn, đường dẫn API hay URL tên miền ngoài nào; mọi project_id trong fixture là id giả.
- AC-6: Given DATA-CONTRACT schemaVersion 4, When chạy thước kev-nhan, Then manifest khai ≥3 kèm meta.kev nguyên vẹn, importer nhận v1–v4 và chặn v5, tài liệu khai đúng phiên bản.
- AC-7: Given snapshot S08 thật trên máy (local, không commit), When đọc lại, Then sha256 khớp manifest, có danh sách căn cho ≥1 khu đô thị cao tầng Ocean Park, mã căn không trùng trong khu đô thị, sourceId không trùng, không khoá liên hệ nào trong payload — chỉ in số đếm.
- AC-8: Given nhánh, When chạy bộ test collector và pipeline trên build sạch, Then tất cả xanh.
- AC-9: Given nhánh so với main, When liệt kê tệp đổi, Then chỉ có tệp của lời giao 2610-10, thước kev-nhan, bộ kiểm và hai hồ sơ.

## Coverage

- Bỏ coverage-scan — collector mới một nguồn; trục: chuyển item, lọc liên hệ, cấu hình thiếu (5 khoá), lỗi API, lộ nguồn, phiên bản hợp đồng dữ liệu, dữ liệu thật, hồi quy, phạm vi.

## Out of scope

- Dựng toà, trục, căn của OCP1 vào asset_nodes và bậc nguồn: PL11 (T3, làn Claude).
- Lịch thu hằng tuần (plist/launchd) và cài cấu hình local trên máy thu: việc triển khai riêng sau merge; hiện thu tay.
- Đưa dữ liệu S08 lên cloud hay cổng Invest: cấm theo luật 5 (AGENTS.md).
- Chú thích migration 040 trên main có một tên endpoint: migration đã commit không sửa được (luật 2), đã công khai từ trước.
