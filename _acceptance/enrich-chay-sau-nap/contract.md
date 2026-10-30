---
schema_version: 1
feature: Enrich chạy mỗi đêm sau lượt nạp S03/S05 — mỗi tin một giao dịch ngắn, ghi đề xuất và áp luật xác định, lỗi LLM có đếm, dòng tổng kết đếm đúng, không bốc lại tin đã thử
slug: enrich-chay-sau-nap
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-10-30
design_doc: docs/superpowers/specs/2026-10-30-enrich-chay-sau-nap-design.md
---

# Acceptance Contract: enrich-chay-sau-nap

## Context

Căn cứ: điều tra `docs/research/enrich-ngung-2610.md` (PR #196) — Enrich chưa từng có lịch, bảng đề xuất chỉ có lượt thử
tay 23/10. Ô cơ hội `opportunity.md` (Cổng Đáng build, Mạnh 30/10): làm ngay, hàng tự mang phần giao dịch ngắn mỗi tin
của TD9 (`docs/plan/pham-vi-nen-tang-2310.md`). Bước mới nằm trong khối làn Claude của `scripts/zalo-import-daily.sh`.
Mọi phép đo ghi thật chạy trên DB thử `oneinvest_u2_enrich`; không chạy enrich thật lên :5433 trước khi gộp.

## Criteria

- AC-1 (cross-layer): Given CLI `enrich-run` thật trên DB thử với `--offers` ba tin cần LLM và máy chủ LLM giả kiểu OpenAI, When máy chủ giả nhận lời gọi cho mỗi tin, Then phiên DB `application_name = 'enrich-run'` không có giao dịch mở (`xact_start IS NULL`) ở mọi lời gọi, và từ lời gọi thứ hai trở đi đề xuất của tin trước đã đọc được từ một phiên khác.
- AC-2 (cross-layer): Given lượt ba tin mà tin thứ hai ghi hỏng giữa chừng (lỗi DB sau khi đã chèn một đề xuất) — ở mức hàm (`runEnrich`, giao dịch SAVEPOINT) và ở mức CLI thật trên DB thử (giao dịch BEGIN/ROLLBACK, lỗi do trigger theo offer_id), When lượt chạy, Then tin hai không còn đề xuất, thẻ, phát biểu hay dòng `enrich:thu` nào của lượt; tin một và ba ghi đủ và đọc được từ phiên khác; bộ đếm `loiGhi` gọi tên tin hai; CLI thoát 2.
- AC-3: Given ma trận viết trước «LLM hỏng» (lời gọi ném lỗi + câu trả lời không đọc được) × trạng thái ghi (lành · một tin ghi hỏng) — hàng LLM: không gọi (0/0) · sống (0/n) · hỏng dưới một nửa (1/3) · hỏng từ một nửa (2/3) · lỗi hết (3/3) · không đọc được hết (3/3), When lượt chạy, Then dòng tổng kết ghi đúng «LLM hỏng m/n (lỗi a · không đọc được b)»; mã thoát theo Hỏi-1 (Mạnh duyệt 30/10: hỏng từ một nửa số lời gọi, n ≥ 1 → 3; hỏng dưới một nửa → 0 kèm một dòng «⚠ LLM hỏng m/n»; còn lại 0), và có tin ghi hỏng thì luôn thoát 2 (lỗi ghi không bị LLM che); ở các hàng thoát 3, đề xuất E1 của lượt vẫn đã ghi.
- AC-4: Given một lượt rồi lượt thứ hai trên cùng các tin, When mỗi lượt xong, Then số «đề xuất mới», «đã áp», «chờ duyệt» trong dòng tổng kết bằng đúng số dòng thật của `run_id` lượt đó trong `enrichment_proposals` (theo trạng thái); lượt hai in 0 đề xuất mới. Số «đã áp» là số đề xuất `applied` của lượt — giá trị E1/có căn cứ được áp lên tin thật theo luật xác định (Hỏi-2).
- AC-5: Given bộ test agent sẵn có (enrich-db, enrich-guard, enrich-apply, enrich-revert, enrich-route…), When `runEnrich` chạy qua đường giao dịch mỗi tin, Then cả bộ xanh không sửa ca cũ, và `run.ts` vẫn không có câu UPDATE nào lên `sale_offers` hay `properties`.
- AC-6: Given `zalo-import-daily.sh` với `node` giả và một snapshot mới, When job chạy lành, Then dãy bước là import-airbnb · transform-zalo · transform-media · refresh-bait-gap · enrich-run; enrich-run chạy trong thư mục `agent/` với `LIMIT` = `ENRICH_LIMIT` khi có, ngược lại 50; khi nạp hỏng (job thoát 1 trước các bước) thì enrich-run không chạy.
- AC-7: Given bước enrich-run thoát n ≠ 0, When job kết thúc, Then stderr có đúng một dòng `JOB FAIL [zalo-import-daily] bước enrich-run mã n`; job thoát n khi các bước trước lành; khi một bước trước hỏng thì enrich-run vẫn chạy và job thoát bằng mã của bước hỏng đầu tiên.
- AC-8: Given job đang ở bước enrich-run, When một job nạp khác thử lấy khoá `pipeline/logs/apify-daily.state.lock`, Then lấy được ngay (khoá đã nhả trước bước enrich), và sau khi job zalo thoát thì khoá job khác đang giữ vẫn còn nguyên.
- AC-9: Given hai lượt CLI liên tiếp không `--offers` (LIMIT k) trên DB thử, When lượt hai bốc tin, Then lượt hai không bốc tin nào lượt một đã thử xong (mỗi tin thử xong có đúng một dòng `ops_audit` action `enrich:thu` trong giao dịch của tin); tin mà lời gọi LLM ném lỗi thì không ghi `enrich:thu` nên lượt sau bốc lại được; tin «hoãn» (đề xuất chờ mà thẻ không còn pending) vẫn đi trước bất kể dấu đã thử; cửa sổ không bốc lại 30 ngày (Hỏi-3, Mạnh duyệt 30/10).

## Coverage

Quét tay tám trục (dòng sổ «bỏ coverage-scan»), mỗi ô một AC:

| Trục | Giá trị | AC |
|---|---|---|
| Ranh giới giao dịch | LLM ngoài giao dịch · ghi trong giao dịch của tin · tin ghi hỏng | AC-1, AC-2 |
| LLM | không gọi · sống · hỏng dưới nửa · hỏng từ nửa · lỗi hết · không đọc được hết | AC-3 |
| LLM × ghi | mỗi hàng LLM × (lành · một tin ghi hỏng) — mã 2 thắng mã 3 | AC-3 |
| Bốc tin mỗi đêm | chưa thử · đã thử trong cửa sổ · thử mà LLM lỗi · tin hoãn | AC-9 |
| Áp giá trị | E1 direct · có căn cứ · chờ duyệt | AC-4 (Hỏi-2) |
| Bộ đếm | lượt đầu · lượt chạy lại (trùng) | AC-4 |
| Job | lành · nạp hỏng · bước trước hỏng · enrich hỏng · khoá bị lấy trong lúc enrich | AC-6, AC-7, AC-8 |
| Hành vi cũ | đề xuất/áp/thẻ/hoàn tác/không UPDATE thẳng | AC-5 |

## Đường đo

| Ngưỡng (opportunity.md) | Đo bằng |
|---|---|
| Mỗi đêm có một lượt enrich-run | Log job `zalo-import-daily` có dòng tổng kết enrich; AC-6 bảo đảm bước có trong job |
| Đề xuất mới vào bảng | `enrichment_proposals` theo `run_id` mỗi đêm; AC-4 bảo đảm dòng tổng kết khớp bảng; AC-9 bảo đảm đêm sau không bốc lại tin đã thử (đề xuất mới không về 0 vì bốc trùng) |
| Lỗi LLM nằm trong dòng tổng kết | Dòng «LLM hỏng m/n» trong log job; AC-3 |
| Không thẻ nào bị treo bởi giao dịch dài | AC-1 (không giao dịch mở lúc gọi LLM) |
| Job đỏ có tên khi enrich hỏng | Dòng `JOB FAIL … enrich-run`; AC-7 |

## Out of scope

- Chạy hết backlog một lượt và phát biểu bộ đọc mới cho tin S03 mất đề xuất trước 039 (TD8) — thuộc NT6 `enrich-backlog-ben`.
- Khoá chống hai lượt enrich chồng nhau — unique index + giao dịch mỗi tin đã giữ dữ liệu đúng.
- Hiển thị mới trên `/ops` — `/ops/data-flow` đã đếm đề xuất chờ.
- Plist launchd riêng cho enrich (làn ZCode) và mọi dòng của bước thu/nạp.
- Triển khai lên máy thu (job thật chạy bản mới sau gộp) — bước sau gộp, giám sát giao.
