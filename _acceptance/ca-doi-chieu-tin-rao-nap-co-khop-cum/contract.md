---
schema_version: 1
feature: ca E4b đối chiếu tin rao nạp danh sách che qua hàm chung có cờ khớp nguyên cụm — main thôi đỏ sau khi áp che-ten
slug: ca-doi-chieu-tin-rao-nap-co-khop-cum
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-20T07:03:09Z
approved_by:
approved_at:
---

# Acceptance Contract: ca-doi-chieu-tin-rao-nap-co-khop-cum

## Context

Căn cứ: hàng `ca-doi-chieu-tin-rao-nap-co-khop-cum` của đợt dieu-phoi-dot0-cam-mau (U1, giám sát giao 20/11 07:05Z, ưu tiên
-310). Từ 04:52Z 20/11 dòng S16 của `source_registry` trên DB máy thu khai `match_whole = true` (che-ten, #499). Ca E4b
(`app/tests/tin-rao-doi-chieu.test.tsx`) tự dựng token TRẦN từ `source_registry` (mọi mục `wholeOnly = false`) rồi đưa vào
`maskedSourceExpr` và `guardValues`; còn sản phẩm — `getPublicOffers` của app và `sync-cloud` — nạp qua hàm chung
`docSourceNameEntries` mang cờ. Thước coi tên người bán chứa TỪ ĐẦU của tên S16 là định danh, sản phẩm (đúng theo lối B đã
ký) không che → ca đỏ «tên mang định danh nguồn lọt ra API», chặn suite `app_ui` của mọi dãy. Việc: thước nạp danh sách che
qua đúng hàm chung của sản phẩm; thêm ca đỏ-khi-phá trên DB thử. Hai đường sản phẩm (sync-cloud, offers-public) đã nạp cùng
hàm chung — không có lệch sản phẩm, không phải lỗi tầng A.

## Criteria

- AC-1: Given DB máy thu sau khi áp che-ten (có ít nhất một dòng `source_registry` khai `match_whole = true` với tên nhiều từ),
  When chạy ca E4b của nhánh (chỉ đọc), Then xanh và log có dòng «tin mang định danh đã đọc lại N»; probe chỉ in số đếm,
  không in tên nguồn.
- AC-2: Given DB thử `oneinvest_suite_*` có nguồn giả S90 tên hai từ khai khớp nguyên cụm, When cấy tên đủ hai từ vào
  `seller_name` của một tin đang hiện, Then API (`getPublicOffers`) trả `sellerName = null` và thước của ca bắt tin đó; When
  cấy chỉ từ đầu, Then API trả nguyên tên và thước KHÔNG coi là định danh; cùng fixture, thước token trần (cách dựng cũ) coi
  từ đầu là định danh (đối chứng dương của lệch).
- AC-3: Given bản sao ca test mà hàm nạp danh sách che trả lại token trần (bỏ cờ), When chạy ca AC-2 trên cùng DB thử, Then đỏ
  với thông điệp ghim «thước coi tên chỉ mang từ đầu là định danh».
- AC-4: Given nhánh so với merge-base của origin/main, When liệt kê tệp đổi, Then chỉ có `app/tests/tin-rao-doi-chieu.test.tsx`,
  hồ sơ này, `_acceptance/config.yaml` và tệp máy sinh; ca không còn câu tự đọc `real_name`/`source_ids` từ `source_registry`
  và gọi `docSourceNameEntries`.

## Coverage

- Bỏ coverage-scan (dòng sổ descope) — giám sát nêu sẵn ca, nguyên nhân và cách sửa; trục: DB thật sau áp (AC-1), hai giá trị
  cấy đủ cụm/chỉ từ đầu trên fixture (AC-2), phá về token trần (AC-3), phạm vi + nguồn danh sách che (AC-4).

## Out of scope

- Năm chỗ khác còn tự dựng token trần từ `source_registry`: `pipeline/scripts/sync-nguoi-ban-that.itest.mjs` (che và soát
  cùng token trần nên tự nhất quán), `pipeline/scripts/so-nhom.itest.mjs`, `pipeline/scripts/vong-doi-local.itest.mjs`,
  `app/tests/coverage-cloud-got-tang-a.test.tsx`, `scripts/link-nguoi-ban-s03/ten-nguon.mjs` (bốn chỗ này là bộ soát tệp hay
  giá trị, token trần chỉ làm chúng chặt hơn — đỏ giả có thể, rò thì không). Ngoài vùng của hàng; báo giám sát.
- Đổi trần thời gian 1000 ms của E4b hay biên 700 ms — không thuộc vụ main đỏ này.

## Notes

- Không sửa mã sản phẩm: `getPublicOffers` và `sync-cloud` đã đọc qua hàm chung từ che-ten.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-20:
  - Ngoài-1: phép kiểm phạm vi dò từng dòng, câu đọc sổ nguồn viết xuống nhiều dòng có thể lọt.
  - Ngoài-2: E1 trên máy thu vẫn xanh khi không có tin nào mang tên trùng đủ cụm.
  - Ngoài-3: bước soát đầu ra `guardValues` chưa có phép thử chứng minh nó bắt được tên đủ cụm (lượt 2).
  - Ngoài-4: cùng chỗ thiếu đối chứng dương cho `guardValues`, ghi ở lượt 1.
  - Mù-1: bộ test pipeline_b (E5c, AC-4) không chạy xong ở cả ba lượt chấm; hàng gộp khi pipeline_b chưa xanh.
