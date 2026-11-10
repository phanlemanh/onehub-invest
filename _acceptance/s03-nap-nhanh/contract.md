---
schema_version: 1
feature: Lượt nạp S03 mỗi 15 phút ban ngày (7:00–22:00) — nạp → transform → media → refresh, khoá bận thì bỏ lượt; lượt 00:00 giữ nguyên sáu bước
slug: s03-nap-nhanh
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: machine-cleared
veto_state: mo
veto_opened_at: 2026-11-10T09:40:00Z
approved_by:
approved_at:
---

# Acceptance Contract: s03-nap-nhanh

## Context

Nấc 1 «S03 lên nhanh» (Mạnh chốt 10/11): tin S03 hiện chỉ lên `sale_offers` một lần lúc 00:00. Nấc 1 thêm một lượt nạp
mỗi 15 phút ban ngày để tin lên trong ngày.

Đường đi:
- Lời giao claudedp-1011-3 (làn ZCode) → ZCode dựng `zcode/s03-nap-nhanh` @63b9d939 (cờ `--chi-nap` dừng ở stg).
- Liên làn MỞ LẠI: lượt nhanh phải chạy tiếp phần sau nạp, và thiếu test.
- 10/11 ZCode hết hạn mức tuần; Mạnh giao liên làn làm thay. Nhánh `feat/s03-nap-nhanh` chép 63b9d939 lên main (sau PL34,
  chuỗi đêm sáu bước) rồi sửa theo MỞ LẠI và theo lời giám sát cho bật nấc 1:
  - N1 đo trên DB thử chép DB chung: transform + media + refresh ≈ 76 giây/lượt, dưới trần 5 phút.
  - Chỉ 7–22h giờ VN; lượt 15′ chỉ chạy nạp → transform → media → refresh, KHÔNG enrich và KHÔNG đọc gộp (giữ ở lượt
    00:00 tới khi hàng s03-len-nhanh-nac-1 của N1 gộp `ENRICH_LIMIT=0` ban ngày + `lock_timeout`).
  - Lượt không chồng nhau (khoá nạp có sẵn).
- Review độc lập (tác tử sạch) ĐẠT, thêm hai sửa: lượt nhanh không gỡ khoá của PID còn sống dù khoá cũ >2h; cờ lạ thoát 2.

Source input: prompt — lời giao claudedp-1011-3, MỞ LẠI 1011-3, lời giám sát 10/11 cho bật nấc 1.

## Criteria

- AC-1: Given một snapshot S03 mới có manifest và khoá nạp rảnh, When chạy tệp bọc nạp S03 với `--luot-nhanh`, Then các bước chạy đúng thứ tự nạp → transform → media → refresh, KHÔNG có đọc gộp và làm giàu, thoát 0, state tiến tới mốc snapshot mới, khoá được nhả, và mọi bước thấy `S03_LUOT_NHANH=1`.
- AC-2: Given cùng cây, When chạy tệp bọc KHÔNG cờ (lượt 00:00), Then đủ sáu bước như trước (nạp, transform, media, refresh, đọc gộp, làm giàu), thoát 0, không in dòng lượt nhanh, `S03_LUOT_NHANH=0`; và khi khoá do lượt khác còn sống giữ thì lượt 00:00 CHỜ rồi thoát 1 khi bận quá trần (hành vi cũ), không bỏ lượt.
- AC-3: Given khoá nạp do một tiến trình còn sống giữ — vừa lấy hoặc đã cũ hơn 2 giờ, When chạy `--luot-nhanh`, Then in «bỏ lượt», thoát 0, không bước nào chạy, state không đổi, khoá của lượt kia còn nguyên. Ngược lại khi PID giữ khoá đã chết thì lượt nhanh dọn khoá và chạy bình thường.
- AC-4: Given `--luot-nhanh`, When bước nạp hỏng, Then thoát 1, state giữ ở mốc cũ, không bước sau nào chạy; When transform hỏng, Then thoát bằng mã của bước đó kèm dòng `JOB FAIL`, media và refresh vẫn chạy, vẫn không đọc gộp và làm giàu; khoá được nhả ở mọi ca.
- AC-5: Given một lượt nhanh đang chạy (đang ở bước transform, giữ khoá), When một lượt nhanh thứ hai khởi động, Then lượt sau bỏ lượt (thoát 0, không bước nào), lượt trước chạy trọn bốn bước, và một lượt kế sau đó chạy bình thường.
- AC-6: Given một cờ khác `--luot-nhanh` (vd `--chi-nap` của bản cũ), When chạy tệp bọc, Then thoát 2 kèm lỗi «cờ không biết», không lấy khoá, không bước nào, state không đổi.
- AC-7: Given plist `com.oneinvest.s03-nap-15phut`, When đọc lịch, Then có đúng 61 mốc mỗi 15 phút từ 7:00 tới 22:00, không mốc nào sau 22:00, gọi tệp bọc với `--luot-nhanh`, log riêng `pipeline/logs/s03-nap-15phut.log`, và plist hợp lệ (`plutil -lint`).
- AC-8: Given nhánh này, When chạy các bộ test tác vụ nạp có sẵn và kiểm cú pháp, Then tất cả xanh; và tệp đổi ngoài hồ sơ chỉ gồm tệp bọc nạp S03, plist mới, tệp test mới.

## Coverage

- Bỏ coverage-scan — vòng sửa một tệp bọc + một plist. Trục: lượt nhanh / lượt 00:00 (AC-1, AC-2); khoá sống mới, sống cũ, chết (AC-3); hỏng nạp / hỏng transform (AC-4); chồng lượt thật bằng hai tiến trình song song (AC-5); cờ lạ (AC-6); lịch (AC-7); hồi quy + phạm vi tệp (AC-8).

## Out of scope

- Bật plist (`launchctl bootstrap`): bước triển khai sau khi gộp, từ checkout chính, báo giám sát trước khi bật; không làm trong vòng này.
- `ENRICH_LIMIT=0` ban ngày và `lock_timeout` cho các bước làn Claude (hàng s03-len-nhanh-nac-1 của N1). Review ghi rủi ro lượt nhanh chạy song song với job S06 lúc 14:00 (cùng `UPDATE sale_offers` của refresh bait gap, không khoá chung) — xử ở hàng đó; ngày đầu bật đo log 14:00–16:00.
- Xoay vòng log `s03-nap-15phut.log` (61 lượt/ngày) — việc vận hành sau.
- Ba bộ kiểm nghiệm thu cũ chạy bản chép tệp bọc (`zc3_import_daily`, `au3_lock`, `snt_mo_coi`) đã đỏ sẵn trên main trước nhánh này (cùng số mục khi chạy trên bản main) — không thuộc vòng này.

## Notes

- Tên tệp bọc nạp S03 mang tên kênh thật như mọi tệp cũ của kho; test đọc tên đó từ plist, không tự gõ.
- Đột biến (review chạy trên bản chép, 10/11): quay về bản `--chi-nap`, `exit 0` thay `exit "$JOB_RC"`, bỏ khối thoát sớm, gỡ trap trước khi thoát, lượt nhanh quay về vòng chờ khoá, không export biến — mỗi đột biến làm đỏ ít nhất một ca.

## Known limits
