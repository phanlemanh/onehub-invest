---
schema_version: 1
feature: Ca đối chứng ZL-AC-3 của bộ test job Zalo đúng ở mọi thế cây — main sau gộp, nhánh đổi phần nạp, nhánh đổi phần khác của tệp bọc — nên bộ scripts xanh trên main và mọi PR không còn đỏ job scripts
slug: zl-ac-3-doi-chung-dung-tren-main
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-22-zl-ac-3-doi-chung-dung-tren-main-design.md
approved_by:
approved_at:
---

# Acceptance Contract: zl-ac-3-doi-chung-dung-tren-main

## Context

Hàng HT2 (GS giao gấp 22/11). Sau khi #519 gộp (main e78ff0db9), `node --test scripts/zalo-import-job-lan.test.mjs` đỏ ở
ZL-AC-3, và CI (`ci-test.yml` dòng 160) chạy `node --test scripts/*.test.mjs`, nên mọi PR đỏ job `scripts`. ZL-AC-3 chạy
bản test cũ 12b8942 trên tệp bọc HIỆN TẠI. Tệp bọc sau #519 có rào «node thật» và khối FAILED đổi hình, nên bản cũ đỏ vì
những lý do khác (sáu ca ZJ thoát 1 vì «TRẦN THỜI GIAN TẮT»; ZJ-AC-5 đỏ vì «không thấy khối FAILED»). Kết quả còn phụ
thuộc merge-base của nhánh đang chạy.

## Acceptance Criteria

- **AC-1** Given cây tạm cắt tại 12b8942 cộng một commit mô phỏng sửa phần nạp của tệp bọc, When chạy bản test job Zalo
  của chính commit ấy, Then nó đỏ với «ZJ-AC-5 phần nạp của tệp bọc đã đổi» và đỏ ĐÚNG một ca (`ℹ fail 1`). Đối chứng
  dương cùng cây: commit mô phỏng chỉ sửa phần SAU phần nạp → bản test ấy xanh trọn, ZJ-AC-5 chạy và xanh, 0 ca bỏ qua.
- **AC-2** Given ba thế của cây, mỗi thế là bản clone tạm tại đầu nhánh — (i) `origin/main` = HEAD (merge-base = HEAD,
  như main sau gộp), (ii) HEAD + commit sửa phần nạp, (iii) HEAD + commit sửa phần sau phần nạp — When chạy
  `node --test scripts/zalo-import-job-lan.test.mjs`, Then thoát 0 ở cả ba thế, mỗi thế 5 ca qua, 0 đỏ.
- **AC-3** Given cùng ba thế, When chạy bản test có đối chứng bị phá (mô phỏng không sửa phần nạp), Then đỏ ở cả ba thế
  với thông điệp ghim «ZL-AC-3 bản cũ không đỏ».
- **AC-4** Given thế (i) và môi trường như CI (env -i, `CI=true`, HOME tạm không có `~/.local/node-v24.21.0`, PATH chỉ
  có node, DB thử), When chạy đúng bước test của job `scripts` (`NODE_OPTIONS="$(node scripts/lib/ci-can-du-lieu.mjs
  scripts)" node --test scripts/*.test.mjs`), Then thoát 0.
- **AC-5** Given diff của nhánh so với main, Then chỉ đổi `scripts/zalo-import-job-lan.test.mjs`, tệp của hồ sơ này và
  `_acceptance/config.yaml`; `scripts/zalo-import-daily.sh` và các ca ZL-AC-1, ZL-AC-2, ZL-AC-4 giữ nguyên từng byte.

## Out of scope

- Sửa `scripts/zalo-import-daily.sh` hay đổi phép so của ca nào khác (ZL-AC-1, 2, 4; bộ ZJ hiện tại).
- Thêm bước CI chạy bộ scripts ở thế «sau gộp» (đề xuất trong mục «Vì sao lọt», hàng riêng).

## Coverage

- Trục thế cây: main sau gộp · nhánh đổi phần nạp · nhánh đổi phần khác [thước CE: câu giao GS 22/11 + đo P3 trên MH1]
  — AC-2, AC-3.
- Trục lý do đỏ của bản cũ: phần nạp đổi (đúng) · rào node · khối FAILED đổi hình (sai) [thước CE: nhật ký P3] — AC-1.
- Trục môi trường: máy dev · như CI [thước CE: ci-test.yml job scripts] — AC-2, AC-4.

## Đường đo

Hàng nền (test): miễn «số trên màn đổi». Thước thay: bộ `scripts/*.test.mjs` xanh trên main — AC-4 đo ở thế main.

## Vì sao lọt

- Ca cũ phụ thuộc merge-base. Đo 22/11: trên đầu nhánh s03-tran (92d5aaed4) với merge-base 9a8c06a16 (trước #519), bản
  trước sửa XANH 4/4. Lượt chấm r3 (E8d) và CI của #519 đều chạy ở thế ấy, nên không thấy đỏ. Chỉ sau khi gộp, merge-base
  của mọi cây mới là e78ff0db9 và ca đỏ.
- Ca cũ chỉ đòi «có đỏ» và «có dòng ZJ-AC-5», không đòi «chỉ đỏ vì ZJ-AC-5». Trên nhánh s03-tran, bản cũ đã đỏ thêm vì
  rào node, nhưng ca vẫn qua.
- Đề xuất phép kiểm (hàng riêng, không làm ở đây): CI job `scripts` chạy thêm một lượt ở thế «sau gộp» — checkout bản gộp
  thử của PR vào main (`refs/pull/<n>/merge`, chính là cái `actions/checkout` mặc định của sự kiện pull_request) VÀ đặt
  `origin/main` = HEAD của bản gộp đó, để mọi phép so merge-base chạy như trên main sau khi gộp.

## Notes
