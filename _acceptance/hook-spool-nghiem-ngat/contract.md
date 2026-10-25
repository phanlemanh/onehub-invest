---
schema_version: 1
feature: ZC6 nối tiếp — hook Zalo giữ tin lại hàng đợi khi khoá collector sai (401/403/404) và có trần thời gian cho cả lượt xả
slug: hook-spool-nghiem-ngat
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: verified
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: hook-spool-nghiem-ngat

## Context

Ở Cổng Bằng chứng của `hook-zalo-spool` (ZC6, PR #76, 25/10) Mạnh ký và tách hai lỗi ngoài hợp đồng thành việc riêng,
PHẢI xong trước khi cài hook lên máy thật: (Ngoài-1) collector trả 401/403/404 — vd khoá agent sai sau khi xoay — thì
hook đẩy tin sang `spool/rejected/` vĩnh viễn, sửa khoá xong không tự gửi lại; (Ngoài-2) collector chậm mà vẫn trả lời
(gần 8 giây mỗi yêu cầu) làm một lượt hook kéo tới vài phút, gateway Zalo chờ theo. Lời giao `claudedp-2410-23`; ZCode
XONG ở nhánh `zcode/hook-spool-nghiem-ngat` @ 02d4834 (chỉ đổi `collector/openclaw/handler.js` + test).

Hạng T3 vì chạm `collector/openclaw/**` (an toàn Zalo).

## Criteria

- AC-1: Given spool có tin và collector trả 401, 403 hoặc 404 cho mọi yêu cầu, When hai lượt hook chạy, Then không tệp nào sang `rejected/`, mọi tin cũ còn trong spool, và không có dòng `spool-rejected <mã>`.
- AC-2: Given các tin đã bị giữ vì 401/403/404, When collector trả 202 trở lại (khoá đã sửa), Then lượt hook kế gửi lại mọi tin đó và spool rỗng.
- AC-3: Given một lượt xả có tệp bị giữ vì 4xx tạm thời, When lượt kết thúc — kể cả khi dừng giữa chừng vì collector treo — Then log có đúng MỘT dòng `spool-held <mã>` cho mỗi mã trong lượt đó.
- AC-4: Given collector trả 400, 413 hoặc 422 cho một tệp spool, When xả, Then tệp đó sang `rejected/` kèm log `spool-rejected <mã>`, tệp sau vẫn được gửi, và không có dòng `spool-held` cho mã đó.
- AC-5: Given collector trả 4xx khác (vd 409, 410), When xả, Then tin ở lại spool kèm một dòng `spool-held <mã>`; còn 408, 429, 5xx thì tin ở lại spool, KHÔNG sang `rejected/`, và được xả hết khi collector lành.
- AC-6: Given spool có 20 tệp và collector trả lời chậm 3 giây mỗi yêu cầu, When một lượt hook chạy, Then lượt đó kết thúc dưới 20 giây và còn tệp chờ lượt sau; qua vài lượt mọi tin tới collector đúng một lần, spool rỗng.
- AC-7: Given biến `ONEINVEST_HOOK_DRAIN_BUDGET_MS=2000`, When lượt xả chạy với collector chậm 1,5 giây mỗi yêu cầu, Then lượt chỉ xả 1–3 tệp và kết thúc dưới 10 giây.
- AC-8: Given handler mới, When chạy lại toàn bộ eval của ZC6 (spool-replay, reject-4xx, hang-stop, cap-50, kev-hang, self-contained), Then tất cả vẫn đạt.
- AC-9: Given lớp L1 của bộ canh Zalo, When grep handler mới và chạy `node --check` trên nó, Then không khớp API gửi tin nào, cú pháp sạch, bộ canh vẫn trỏ đúng tệp handler.
- AC-10: Given nhánh đã gộp `origin/main`, When chạy toàn bộ test collector trên bản build sạch, Then tất cả xanh.

## Coverage

- Bỏ coverage-scan: phạm vi là đúng hai mục Ngoài-1 + Ngoài-2 của ZC6. Các trục:
  - mã trả lời của collector: 202 / 400·413·422 / 401·403·404 / 4xx khác / 408·429 / 5xx / treo / chậm;
  - số lượt: một lượt / nhiều lượt (gửi lại sau khi sửa);
  - trần: mặc định / đặt qua biến môi trường;
  - hồi quy ZC6; an toàn Zalo L1.

## Out of scope

- Cài bản này vào `~/.openclaw` và restart gateway — lời GIAO triển khai riêng theo `docs/ops/runbook-openclaw-hook.md`, sau merge.
- ZC4 (collector :9210 chạy bằng launchd) — vòng riêng, đứng sau 2510-8.
- Lỗi khoá sai làm MỌI tệp trong lượt đều gọi collector một lần (không dừng ở 401 đầu) — số yêu cầu bị chặn bởi trần thời gian, chấp nhận.
- Một yêu cầu đang dở khi chạm trần vẫn chờ hết timeout của nó (≤ 8 giây) — trần kiểm trước mỗi tệp.
- Hai mục Known limits của ZC6 (quyền đọc tệp spool; tệp JSON null) giữ nguyên.

## Notes

- Hợp đồng dựng SAU khi ZCode code xong (`gate1_skipped: true`), từ lời giao 2410-23 — có trước khi code. Phiên điều phối liên làn dựng hồ sơ, không viết code sản phẩm.
- Harness `scripts/hook-spool-nghiem-ngat/acceptance.mjs`: cùng hộp cát với ZC6 (handler chép ra thư mục tạm, HOME giả, collector và Kev giả trên cổng ngẫu nhiên); collector giả thêm chế độ trả lời chậm và treo theo từng yêu cầu. Không chạm `~/.openclaw`, :9210, :8009, gateway hay launchctl.
- Kiểm harness biết đỏ (trước verify): trên handler của `origin/main` đỏ ở auth-held, tam-thoi, budget, budget-env, held-then-hang; reject-perm xanh ở cả hai (hành vi 400/413/422 không đổi — đúng ý).
