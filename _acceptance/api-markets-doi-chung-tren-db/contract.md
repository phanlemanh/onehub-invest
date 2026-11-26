---
schema_version: 1
feature: Test /api/v1/markets chứng khoá phụ «bằng nhau thì theo tên» bằng đối chứng chạy trên DB và soát văn bản SQL của route
slug: api-markets-doi-chung-tren-db
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: machine-cleared
design_doc: docs/superpowers/specs/2026-11-25-api-markets-doi-chung-tren-db-design.md
veto_state: mo
veto_opened_at: 2026-11-25T19:40:00Z
---

# Acceptance Contract: api-markets-doi-chung-tren-db

## Context

HT28, giám sát cắt 25/11 sau khi Mạnh ký HT23 (lối b): hai finding trong hợp đồng của HT23 về đối chứng khoá phụ AC-2
(chạy bằng mô hình JS, không trên DB) chuyển thành hàng này. Vùng: `app/tests/api-markets-khong-s02.test.tsx`,
`_acceptance/api-markets-doi-chung-tren-db/**`. Route `/api/v1/markets` không đổi.

## Criteria

### AC-1 — Đối chứng khoá phụ chạy trên DB bằng SQL thật của route
Given DB thử có bốn thị trường mã quốc gia `zz` (hai cặp bằng số tin: Alpha/Beta 3 tin, Aaa/Gamma 1 tin),
When test rút câu SQL trong `pool.query(` của `app/src/app/api/v1/markets/route.ts` và chạy nó trên DB thử,
Then kết quả là Alpha, Beta, Aaa, Gamma; và cùng câu ấy với khoá phụ đổi thành `m.name DESC` cho Beta, Alpha, Gamma,
Aaa — khác thứ tự mong. Chiều đỏ: bản đổi khoá phụ phải khác `MONG`, nếu bằng thì test đỏ với thông điệp ghim
«tập thử không có cặp bằng số tin do khoá phụ quyết».

### AC-2 — Soát văn bản: route mất khoá phụ thì đỏ tất định
Given hàm `coKhoaPhuTheoTen(sql)` chỉ đọc mệnh đề `ORDER BY` (không tính `m.name` ở SELECT),
When gọi với (a) SQL rút từ route, (b) bản chỉ sửa trong `ORDER BY` bỏ `, m.name` mà SELECT vẫn còn `m.name`,
(c) bản khoá phụ `m.name DESC`,
Then (a) `true`; (b), (c) `false`; ca test khẳng định (a) với thông điệp ghim «route mất khoá phụ rồi tên», và khẳng
định bản (b) vẫn chứa `m.name` ngoài `ORDER BY`. Đối chứng âm chạy trong cùng ca, không phụ thuộc thứ tự vật lý của DB.

### AC-3 — Gỡ đối chứng mô hình JS, chú thích đúng
Given tệp test sau sửa,
When đọc nó,
Then không còn `theoChen`, cụm «sort ổn định» hay «giữ thứ tự chèn»; chú thích thứ tự chèn ngược tên có nguyên cụm
«chiều đỏ tất định nằm ở HT28-AC-2». Chiều đỏ: bản tệp ở 04b9ddc3b có `theoChen`.

### AC-4 — Không hồi quy
Given nhánh sau sửa,
When chạy tệp test qua `db/db-thu.sh` và bộ test app (`app_ui`),
Then HT23-AC-1, HT23-AC-2 và các ca mới xanh; bộ test app xanh. Route không đổi một byte.

## Coverage

Bỏ coverage-scan — xem sổ quyết định dòng «bỏ coverage-scan»: hàng một chiều (độ chắc của một phép đối chứng), bốn
tiêu chí phủ hai chiều của đúng hai finding HT23.

## Out of scope

- Đổi route để xuất hằng SQL (đọc văn bản tệp route là đủ, không đổi mã sản phẩm).
- Sửa các test khác dùng tên DB dự phòng «…_khong_dung».
- Đổi tiêu chí hay hồ sơ đã ký của HT23.

## Notes

- Sau áp HT23 (GS đo prod 2026-11-25 18:11:28Z, sau gộp 04b9ddc3b): `/api/v1/markets?country=vn&limit=5` trả 5 dòng,
  0 khoá `marketScore`, xếp theo số tin rồi tên.
- Ngoài-1 (máy định tuyến 2026-11-26, đề xuất S4 known-limits): Hai bước kiểm tự động mới viết lệch cách các bước kiểm cũ vẫn viết. Trên máy chạy kiểm khác loại vỏ lệnh, chúng có thể báo đỏ dù kiểm thử vẫn xanh. Hiện chưa gây hại vì bước kiểm này chưa chạy trên máy chủ. — `_acceptance/config.yaml`
