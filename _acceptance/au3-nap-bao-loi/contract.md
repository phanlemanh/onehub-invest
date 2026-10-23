---
schema_version: 1
feature: AU3 phần nạp — job Chợ Tốt và Facebook báo lỗi rõ khi nạp hỏng, không nhảy qua snapshot lỗi
slug: au3-nap-bao-loi
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: au3-nap-bao-loi

## Context

Đêm 22/10, DB local chết, nhưng hai job hằng ngày vẫn thoát 0. `chotot-daily.sh` gọi import trần, nên lỗi import trôi qua và transform vẫn chạy trên dữ liệu thiếu. `apify-facebook-daily.sh` dùng `|| true`, và state vẫn nhảy qua snapshot hỏng, nên snapshot đó không bao giờ được nạp lại.

Phần làn Claude của AU3 (`job-bao-loi-that`, `scripts/lib/job-step.sh`) đã có trên main. Phần nạp thuộc làn ZCode, nay được sửa:
- retry ECONNREFUSED 5 lần, mỗi lần cách 20s;
- lỗi khác thì không retry;
- nạp hỏng thì dừng trước transform và exit khác 0;
- riêng apify: state giữ ở snapshot thành công cuối.

Gắn phụ hàng AU3 của lộ trình (`docs/plan/lo-trinh.json`, slug `job-bao-loi-that`).

Source input: prompt (brief phiên điều phối liên làn local_5d0e32a0…, 23/10/2026). Nhánh `zcode/au3-nap-bao-loi` @ e68e374 (claudedp-2310-8), đã qua review điều phối.

## Criteria

- AC-1: Given DB không tới được (cổng không ai nghe), When `chotot-daily.sh` hoặc `apify-facebook-daily.sh` tới bước nạp, Then lỗi thật của bước import được nhận là ECONNREFUSED, được thử 5 lần (chờ 20s giữa các lần), rồi job exit khác 0 và KHÔNG chạy transform hay các bước sau.
- AC-2: Given `apify-facebook-daily.sh` có nhiều snapshot mới hơn state và một snapshot ở giữa nạp lỗi, When chạy lượt 1 rồi lượt 2 khi DB đã lành, Then:
  - lượt 1: state giữ ở snapshot thành công cuối, các snapshot sau không nạp, exit khác 0;
  - lượt 2: nạp lại đúng snapshot lỗi rồi các snapshot sau, không nạp lại snapshot đã thành công, state tới snapshot cuối;
  - snapshot cũ hơn state không bao giờ nạp lại.
- AC-3: Given bước import hỏng vì lỗi không phải ECONNREFUSED, When job chạy, Then import chỉ thử 1 lần, không chờ, job exit khác 0 và không transform; còn ECONNREFUSED tạm thời (DB lên lại sau vài lần) thì job đi tiếp và exit 0.
- AC-4: Given DB sống, When job chạy, Then hành vi như cũ:
  - chotot chỉ nạp snapshot mới nhất mỗi thị trường;
  - đủ các bước job-step của làn Claude (chotot: transform → refresh → resolve; apify: transform-fb → refresh);
  - một bước job-step hỏng thì các bước sau vẫn chạy, và job exit bằng mã của bước hỏng đầu tiên kèm dòng `JOB FAIL`.

## Coverage

- Bỏ coverage-scan: 4 AC theo brief. Các trục:
  - job: chotot / apify;
  - DB: chết thật / ECONNREFUSED tạm / lỗi khác / sống;
  - vị trí lỗi: snapshot đầu / giữa;
  - lượt: 1 / 2;
  - job-step: lành / một bước hỏng.

## Out of scope

- Gọi `collect-chotot.mjs` hay Apify thật (mạng, API trả phí): eval chạy từ bước import trở đi; bước thu là bản giả trong bản chép.
- Phần làn Claude của AU3 (`job-step.sh`, `job-bao-loi-that`): đã nghiệm thu riêng; ở đây chỉ kiểm nó vẫn được gọi như cũ.
- Cảnh báo watchdog khi DB sập (L5b): đã có ở ZC3.
- Chạy job thật dưới launchd.

## Notes

- Eval chạy BẢN CHÉP hai script cùng `scripts/lib/job-step.sh` thật trong thư mục tạm, với HOME giả (không đọc khoá `~/.openclaw`).
- `sleep` là stub đứng đầu PATH, THAY cho việc sửa số `20` trong script: stub ghi lại đúng đối số `20`, chuỗi không phải chờ.
- Ca DB chết dùng `import-chotot.mjs` / `import-airbnb.mjs` THẬT trỏ cổng không ai nghe, để chứng minh lệnh grep `ECONNREFUSED` khớp đúng thông báo lỗi thật. Không ghi DB.
- Hợp đồng dựng SAU khi code xong (ZCode) nên `gate1_skipped: true`.
