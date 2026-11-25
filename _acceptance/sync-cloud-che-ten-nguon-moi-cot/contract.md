---
schema_version: 1
feature: Đường lên cloud che tên nguồn ở mọi cột của mọi bảng đẩy lên và soát mọi bảng trước khi gửi — một ô bẩn không còn làm đứng cloud
slug: sync-cloud-che-ten-nguon-moi-cot
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: draft
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-25-sync-cloud-che-ten-nguon-moi-cot-design.md
---

# Acceptance Contract: sync-cloud-che-ten-nguon-moi-cot

## Context

Đo chỉ đọc 25/11: cloud đang giữ 3.743 ô mang tên nguồn thật ở 8 bảng.cột, vì đường lên cloud chỉ che hai cột người bán và chỉ soát
ba bảng. Cùng ngày một ô S06 ở `sale_offers.street_raw` làm bộ chặn dừng 17 lượt liên tiếp, cloud đứng số từ 22:57Z 24/11. Hàng này
che tên nguồn ở mọi cột đi lên bằng hàm dùng chung của HT18 và mở bộ chặn ra mọi bảng.

## Criteria

- AC-1: Given dòng đọc từ máy thu của mọi bảng FILL, When lượt sync chạy, Then mọi ô text/json/mảng mang tên nguồn được che trước khi
  stage bằng `pipeline/lib/che-ten-nguon-gia-tri.mjs`: chữ tự do → mã S0x, URL đứng riêng → NULL, phần tử URL trong mảng bị bỏ, khoá
  và giá trị json → mã; ô không trúng giữ nguyên từng byte (kể cả số thập phân jsonb); lượt in số ô che theo bảng.cột, không giá trị.
- AC-2: Given payload sau che, When soát, Then bộ chặn soát mọi bảng FILL (không chỉ ba bảng người bán); cấy một tên nguồn vào một bảng
  ngoài `CLOUD_ALLOW` mà bỏ bước che (lối thử) thì lượt dừng ở pha scan, nêu bảng.cột, không dòng nào rời máy.
- AC-3: Given đúng ô `sale_offers.street_raw` kiểu đã chặn 24–25/11 (một ô chữ S06), When sync, Then ô được che thành mã và lượt đi qua
  pha scan; chiều đỏ: bỏ bước che thì lượt dừng như 24/11.
- AC-4: Given trang Ops đọc `dq_check_results.detail` qua `do-hang-ngay.ts`, When detail mang tên nguồn (máy thu), Then giá trị hiện ra
  đã che như `dq-checks.ts`; cấy tên nguồn vào detail thì đầu ra không chứa nó.
- AC-5: Given máy thu thật, When chạy lượt sync khô (đọc + che + soát, không gửi), Then số ô che theo bảng.cột bằng số đếm của
  `scripts/do-ten-nguon-cloud.mjs` phía máy thu, bộ chặn ra 0, thời gian lượt không quá 1,5 lần lượt trước khi có che.
- AC-6: Given lệnh đo `scripts/do-ten-nguon-cloud.mjs`, When chạy, Then nó chỉ gửi SELECT khoá chính + cột lên cloud trong giao dịch
  chỉ đọc (không mẫu nào chứa tên nguồn), đếm tại máy, in bảng.cột · ô cloud · ô máy thu, không ghi đĩa giá trị; ca kiểm lời gọi
  ghi lại mọi câu SQL gửi đi và không câu nào chứa token tên nguồn.
- AC-7: Given hồ sơ áp, When Mạnh cho lời áp, Then sau lượt sync đầu tiên của mã mới, lệnh đo trên cloud ra 0 ô ở mọi bảng.cột, cloud
  cập nhật lại (lần tráo mới trong sync_stage.swaps) và số dòng cloud đuổi kịp máy thu.

## Coverage

- Che: mọi kiểu ô (chữ, URL đứng riêng, mảng URL, json) → AC-1; ô gây sự cố 24/11 → AC-3
- Soát: mọi bảng FILL, fail-closed → AC-2
- Bên đọc: Ops do-hang-ngay → AC-4; Invest thẻ tin, data-api — giá trị đã che từ nguồn (AC-1)
- Đo: máy thu (khô) → AC-5; cloud chỉ đọc không mẫu → AC-6; sau áp → AC-7

## Out of scope

- Tên cột `airdna_id`, `airdna_market_id`, `airdna_sub_id` trên cloud: ngoài phạm vi, vì tên này kho công khai đã tự in ở AGENTS.md
  luật 5; đổi tên cột là DDL cloud + migration + mọi bên đọc → nợ dọn tên nguồn (GS 25/11).
- `listingUrl` của data-api `/v1/listings/:id`: việc của M5 với data-api; hàng này chỉ lo giá trị không lên cloud.
- Ô S06 đang chặn sync: GS xin lời Mạnh đặt NULL; sửa bền ở transform là PL39 (P4).
- Sửa transform để tên nguồn không vào bảng canonical: hàng khác.

## Notes

- Dọn 3.743 ô đã ở cloud = lượt sync đầu tiên của mã mới (thay trọn bảng) = GHI CLOUD, cần lời riêng của Mạnh ở bước áp.
