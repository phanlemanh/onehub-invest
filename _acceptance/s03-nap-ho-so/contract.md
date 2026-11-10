---
schema_version: 1
feature: Tác vụ nạp S03 nạp thêm snapshot hồ sơ người bán (s03-ho-so) vào stg_s03_ho_so với con trỏ riêng; thiếu 080 thì giữ con trỏ để nạp lại đủ
slug: s03-nap-ho-so
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-10T10:20:00Z
approved_by:
approved_at:
---

# Acceptance Contract: s03-nap-ho-so

## Context

Hồ sơ `link-nguoi-ban-s03` (PR #402, gộp 10/11) cho bộ tra hồ sơ người bán S03 gửi kết quả về collector API; API ghi
snapshot nguồn `s03-ho-so`. Bước ghi link hồ sơ trong `refresh-bait-gap` đọc `stg_s03_ho_so_moi_nhat`. Nhưng không tác
vụ nào nạp snapshot `s03-ho-so` vào `stg_s03_ho_so`, nên bảng luôn rỗng (Ngoài-1, Ngoài-5). Ngoài-6: importer gặp DB
thiếu 080 thì in `CHUA-AP-080` và thoát 0 mà không nạp; nếu tệp bọc đẩy con trỏ qua snapshot đó thì hồ sơ mất vĩnh viễn.

Mạnh ký Cổng Bằng chứng link-nguoi-ban-s03 (10/11 06:58Z), chọn «mở hợp đồng mới» cho Ngoài-1/5/6. Giám sát giao qua
liên làn: claudedp-1011-12 (làn ZCode, phần thu/nạp). ZCode hết hạn mức tuần; liên làn làm thay. 080 đã áp lên DB máy
thu (Mạnh «Có, áp 080»).

Nhánh `feat/s03-nap-ho-so` dựng trên `feat/s03-nap-nhanh` (PR #404, cùng sửa tệp bọc nạp S03) — gộp sau #404.

Source input: prompt — lời giám sát 10/11 («GIAO ZCode bước nạp s03-ho-so theo lịch… lưu ý Ngoài-6: thứ tự nạp sai làm
mất dữ liệu khó nhận — test thứ tự kèm theo»).

## Criteria

- AC-1: Given một snapshot hồ sơ mới có manifest và DB đã có 080, When tác vụ nạp S03 chạy lượt 00:00, Then snapshot hồ sơ được nạp, con trỏ hồ sơ `pipeline/logs/s03-ho-so.state` tiến tới mốc của nó, bước nạp hồ sơ đứng TRƯỚC transform (để refresh ghi link hồ sơ), chuỗi tin chạy đủ, thoát 0.
- AC-2: Given hai snapshot hồ sơ và DB thiếu 080 (importer in `CHUA-AP-080`, thoát 0), When tác vụ chạy, Then con trỏ hồ sơ GIỮ nguyên, vòng hồ sơ dừng ở snapshot đầu, có dòng `JOB FAIL … bước nap-ho-so mã 4`, chuỗi tin vẫn chạy; When áp 080 rồi chạy lại, Then cả hai snapshot được nạp; When chạy lần ba, Then không nạp lại snapshot nào (không trùng).
- AC-3: Given một snapshot hồ sơ có mốc CŨ hơn con trỏ tin, When tác vụ chạy, Then snapshot hồ sơ vẫn được nạp, và vòng hồ sơ không đổi giá trị con trỏ tin.
- AC-4: Given nạp một snapshot hồ sơ hỏng, When tác vụ chạy, Then con trỏ hồ sơ giữ nguyên, có `JOB FAIL … bước nap-ho-so mã 1`, chuỗi tin vẫn chạy và khoá nạp được nhả.
- AC-5: Given lượt nhanh (`--luot-nhanh`), When có snapshot hồ sơ mới, Then nó cũng được nạp, và lượt nhanh vẫn không chạy đọc gộp và làm giàu.
- AC-6: Given không có snapshot hồ sơ nào, hoặc chỉ có thư mục đang ghi (`.…partial`), When tác vụ chạy, Then không gọi nạp hồ sơ nào và thoát 0.
- AC-7: Given nhánh này, When chạy các bộ test tác vụ nạp có sẵn (gồm lượt nhanh của #404), Then tất cả xanh; tệp đổi ngoài hồ sơ chỉ gồm tệp bọc nạp S03, plist lượt nhanh, hai tệp test lượt nhanh và hồ sơ.

## Coverage

- Bỏ coverage-scan — vòng thêm một vòng nạp vào tệp bọc. Trục: nạp đúng chỗ (AC-1); thứ tự khi thiếu 080 + nạp lại đủ + không trùng (AC-2); con trỏ riêng (AC-3); hỏng không chặn chuỗi tin (AC-4); lượt nhanh (AC-5); không có gì để nạp (AC-6); hồi quy + phạm vi (AC-7).

## Out of scope

- Triển khai bộ tra hồ sơ trên gateway (`S03_LOOKUP_DIR`, lời giao triển khai link-nguoi-ban sau gộp) — việc riêng, báo giám sát trước khi đụng gateway. Trước khi triển khai, máy thu chưa có snapshot hồ sơ nào nên lượt nạp thật nạp 0 dòng.
- Sửa importer (`coBangHoSo` nuốt lỗi dò bảng — Ngoài-7 ghi Known limits của link-nguoi-ban-s03): tệp bọc bắt `CHUA-AP-080` ở đầu ra, không đổi importer.
- Chống trùng ở mức DB: importer đã `ON CONFLICT (source_id) DO NOTHING`; vòng này chỉ bảo đảm con trỏ không nạp lại.
- Transform phía sau `stg_s03_ho_so` (bước ghi link hồ sơ có sẵn từ #402).

## Notes

- Đột biến (liên làn chạy 10/11, mỗi đột biến làm đỏ ít nhất một ca): bỏ kiểm `CHUA-AP-080` → đỏ 1; dùng chung con trỏ tin → đỏ 6; bỏ gán `JOB_RC` → đỏ 2.

## Known limits
