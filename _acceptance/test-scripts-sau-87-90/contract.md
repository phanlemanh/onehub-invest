---
schema_version: 1
feature: hai bộ test scripts/ theo khuôn tên snapshot và captured_at = giờ thu sau #87/#90
slug: test-scripts-sau-87-90
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-25T06:25:01Z
approved_by:
approved_at:
---

# Acceptance Contract: test-scripts-sau-87-90

## Context

Trên main 257de57 hai bộ test ở `scripts/` đỏ sẵn, chặn mọi vòng dùng chúng (P4
`transform-zalo-boc-job-run` chạy `job-exit.test.mjs`). Gốc là ảnh mẫu dữ liệu tụt sau ba thay đổi đã merge:
#87 `giu-captured-at` (captured_at = giờ thu), #90 `importer-bo-qua-du-lieu-thu` (importer bỏ qua thư mục sai
khuôn `<city>__<nguồn>__<mốc>` và manifest.source lạ), #89 AU3 (tệp bọc apify lọc mốc theo TS_RE có gạch ngang),
cộng `push-ops-facts.mjs` nay import `../scripts/lib/`. Vòng này chỉ sửa test; mã sản phẩm không đổi.

Source input: tin của phiên giám sát đợt dieu-phoi-dot0-cam-mau (2026-10-25) — «sửa test theo ngữ nghĩa mới, hoặc
nếu importer S06 thật sự để null thì sửa importer». Đã soát: importer không để null, nó bỏ qua ảnh mẫu sai khuôn.

## Criteria

- AC-1: Given DB local :5433 chạy, When chạy `node --test scripts/check-freshness.test.mjs`, Then mọi ca xanh, 0 ca bị bỏ qua, gồm hai ca GT-AC-1 chạy importer S06 thật.
- AC-2: Given GT-AC-1 nạp lại một snapshot S06 thu 40 giờ trước, When đọc `stg_chotot_ads.captured_at`, Then test khẳng định nó bằng finishedAt của snapshot (giờ thu), không phải giờ nạp; và một bản importer ghi `now()` làm captured_at thì GT-AC-1 ĐỎ, thông điệp nêu captured_at = finishedAt.
- AC-3: Given bản sửa, When chạy `node --test scripts/job-exit.test.mjs`, Then 57/57 ca xanh, 0 bỏ qua, gồm AC-2/AC-3 của apify-facebook-daily và ca đột biến push-ops-facts viết cứng :5433.
- AC-4: Given ảnh mẫu snapshot zalo-agent đúng khuôn mốc của tệp bọc, When tệp bọc apify không còn gọi import-airbnb, Then ca AC-2 «mọi bước lành» ĐỎ vì dãy lời gọi lệch (ảnh mẫu thật sự được tệp bọc nhìn thấy).
- AC-5: Given ca «DB tắt hẳn» của apify khiến tệp bọc thử nạp lại 5 lần, When chạy cả bộ job-exit, Then bộ chạy xong dưới 60 giây — KHÔNG chờ thật 5×20 giây.
- AC-6: Given nhánh so với main, When liệt kê tệp đổi, Then chỉ có hai tệp test, hồ sơ này, `_acceptance/config.yaml` và tệp máy sinh — KHÔNG tệp mã sản phẩm, importer hay tệp bọc nào.
- AC-7: Given ca AC-7 cũ của check-freshness (soát lộ tên/mã nguồn), When chạy bộ, Then nó vẫn đo bằng mã canh `IDS` và vẫn xanh — mã ống `chotot-ads` chỉ dùng trong GT-AC-1.

## Coverage

- Bỏ coverage-scan — vòng hẹp sửa ảnh mẫu test; trục rủi ro liệt kê thẳng: xanh thật không bỏ qua (AC-1, AC-3), test còn
  răng sau khi sửa (AC-2, AC-4 bằng bản đột biến), không giấu chậm (AC-5), không lén sửa mã (AC-6), không nới soát lộ (AC-7).

## Out of scope

- Sửa importer, tệp bọc daily, `freshness.mjs` hay `push-ops-facts.mjs` — mã sản phẩm đúng, chỉ test tụt.
- Đổi mốc ảnh mẫu chotot-daily / airdna-daily (`20261023T000000`) — hai tệp bọc đó chưa lọc theo TS_RE, ca của chúng xanh.
- Câu chú thích đầu `scripts/lib/freshness.mjs` còn nói importer ghi `now()` — văn bản, để vòng sau của freshness.

## Notes

- Hồ sơ dựng sau khi sửa (lưới trước-merge chặn vì `scripts/*.test.mjs` không thuộc T1). Tiêu chí lấy từ tin của
  phiên giám sát, có trước khi sửa. Probe ở `_acceptance/test-scripts-sau-87-90/probes/`; đột biến chạy trên bản chép
  trong thư mục tạm.
