---
schema_version: 1
feature: Ca DO1-AC-9 của do-hang-ngay.test.mjs xanh lại sau khi sổ nguồn có dòng S09 (122, NK1)
slug: do1-ac9-xanh-lai-sau-so-nguon-122
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-26T06:36:40Z
approved_by:
approved_at:
---

# Acceptance Contract: do1-ac9-xanh-lai-sau-so-nguon-122

## Context

Suite `pipeline_that` đỏ sẵn trên main 6286dd29a ở đúng một ca: «DO1-AC-9 detail các dòng do1-* qua bộ ghi không mang …
tên nguồn» (`pipeline/scripts/do-hang-ngay.test.mjs`). Ca chèn tên giả `TEN_THAT_V` vào sổ bằng
`INSERT … VALUES ('S09', …) ON CONFLICT DO NOTHING`, tức là dựa vào việc sổ chưa có S09. Từ khi NK1 áp 122 (26/11), sổ máy
thu và bản chép của mọi lượt chấm đều có dòng S09 thật, nên câu chèn không làm gì. Tên giả không vào sổ, và bộ soát không chặn
chuỗi giả: ca đỏ «Missing expected rejection: không chặn TEN_THAT_V». Đo 26/11 trên bản chép đã có 122. DA42 bị REJECT
vòng 1 một phần vì ca này; mọi hàng kích `pipeline_that` đều dính. GS giao hàng gấp, chỉ sửa tệp test.

## Criteria

- AC-1: Given DB của riêng lượt chép từ máy thu đã áp 122 (sổ có dòng S09), When chạy riêng ca «DO1-AC-9 detail …» của bản
  sửa, Then ca qua: tests 1, pass 1, fail 0, skipped 0.
- AC-2: Given cùng DB đó, When chạy ca này bằng bản tệp test ở origin/main, Then ca đỏ với thông điệp «không chặn TEN_THAT_V»
  (lặp lại lỗi trên main). When chạy bản sửa với bộ soát tên nguồn của `do-hang-ngay.mjs` bị gỡ trên bản chép, Then ca đỏ với
  cùng thông điệp: ca vẫn đo bộ soát thật.
- AC-3: Given DB của riêng lượt đã xoá dòng S09 khỏi sổ, When chạy bản sửa, Then ca qua (tests 1, pass 1, skipped 0). Bản sửa
  xanh cả khi sổ có lẫn không có dòng S09.
- AC-4: Given nhánh so với merge-base origin/main, When liệt tệp đổi, Then ngoài hồ sơ này, `_acceptance/config.yaml` và bản
  đồ máy sinh chỉ có `pipeline/scripts/do-hang-ngay.test.mjs`. Trong tệp đó chỉ đúng một dòng mã đổi: câu chèn S09 chuyển
  từ `ON CONFLICT DO NOTHING` sang `ON CONFLICT (code) DO UPDATE SET real_name = EXCLUDED.real_name`, trong giao dịch của
  ca (lùi khi ca xong). Mọi dòng khác thêm vào chỉ là chú thích, không assert nào đổi.

## Coverage

Bỏ quét không gian (dòng `descope` trong sổ). Nguyên nhân đỏ đã gọi tên bằng phép đo; trục cần phủ là trạng thái sổ:

- Trục sổ: có S09 (máy thu sau 122) → AC-1 · không có S09 (DB trước 122, DB trống từ migration trước 122) → AC-3
- Trục còn đo thật: bản main đỏ, gỡ bộ soát đỏ → AC-2
- Trục không nới thước: một dòng mã, không assert đổi → AC-4

Rà các tệp test khác chèn S09/S17 vào sổ: `pipeline/scripts/do-lam-giau.test.mjs` và `agent/tests/doc-gop-s03-db.itest.ts`
đã dùng `ON CONFLICT (code) DO UPDATE`; không tệp nào khác chèn S09 hay S17. Các tệp còn lại chèn mã khác (S05, S06, S07,
S90–S99, S0X…) hoặc khôi phục sổ từ bản sao.

## Out of scope

- Sửa `pipeline/lib/do-hang-ngay.mjs` hay bộ soát: bộ soát đúng; chỉ dữ liệu của ca sai.
- Dọn các tệp test chèn mã nguồn thật khác vào sổ (S05, S06, S07): không đỏ hôm nay, không thuộc hàng gấp này.

## Notes

- Ca chạy khoảng 6 phút trên Mac mini (đo 26/11: 353 s). Probe đối chứng chạy ca ba lần nữa, nên E2 khai `long_running`.
