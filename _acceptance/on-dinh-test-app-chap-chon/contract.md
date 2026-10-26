---
schema_version: 1
feature: hai test app chập chờn thành tất định — ON22-AC-5 (lớp hạ tầng đo trực tiếp máy) và listings-browse (ngăn lọc đóng theo nhịp hẹn giờ, assert inspect phần tử jsdom treo tiến trình)
slug: on-dinh-test-app-chap-chon
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: verified
veto_state: mo
veto_opened_at: 2026-10-26T04:24:35Z
approved_by:
approved_at:
---

# Acceptance Contract: on-dinh-test-app-chap-chon

## Context

Hàng do giám sát đợt dot0-cam-mau thêm 26/10, chặn ghim lại AU11 (#116). Trên main, hai test app chập chờn:
1. `app/tests/ops-facts-so-tong-hop.test.tsx` ca «ON22-AC-5 ma trận cây log» đỏ không cố định, nhãn lệch đổi theo lượt. Gốc: ba
   lớp «Hạ tầng» của khối lockdown là ảnh chụp tức thời của máy (`pgrep -f openclaw`, cổng :8009, :9210). Phía app
   (`getLockdownStatus`) và phía bên ghi (`readLockdown` trong push-ops-facts) đo ở hai thời điểm khác nhau; `pgrep -f` còn
   khớp mọi tiến trình có chữ «openclaw» trong dòng lệnh, kể cả tiến trình của tệp test chạy song song.
2. `app/tests/listings-browse.test.tsx` chết cả tệp sau LB-AC-3 (đo local 4/6 lần). Gốc: ngăn Bộ lọc của Base UI đóng qua nhịp
   hẹn giờ (requestAnimationFrame giả bằng setTimeout 0), có lúc chạy SAU act của cú bấm «Xem». Khi đó
   `assert.equal(document.querySelector('[role="dialog"]'), null)` đỏ và assert inspect cả cây jsdom, chặn tiến trình
   khoảng 150 giây, nên tệp chết mà không ca nào báo.

Vòng này chỉ sửa hai tệp test, không đổi hành vi sản phẩm.

## Criteria

- AC-1: Given DB local :5433, When chạy trọn `app/tests/ops-facts-so-tong-hop.test.tsx` 12 lần liên tiếp, Then cả 12 lần 0 ca đỏ.
- AC-2: Given một `pgrep` giả đặt đầu PATH luân phiên trả có/không mỗi lần gọi (mô phỏng tiến trình bật tắt giữa hai lần đo),
  When chạy ca «ON22-AC-5 ma trận» ba lần, Then bản sửa xanh cả ba; đối chứng: bản tệp test của main aa928f3 đỏ ít nhất
  một lần trong ba; năm lớp L1–L4b vẫn được so khớp từng giá trị.
- AC-3: Given jsdom, When chạy trọn `app/tests/listings-browse.test.tsx` 12 lần, Then cả 12 lần 11/11 ca xanh và không lần nào
  vượt 60 giây; câu kiểm «ngăn phải đóng sau khi áp» vẫn đòi hộp thoại đóng (chờ có giới hạn 50 nhịp, rồi so boolean).
- AC-4: Given nhánh so với merge-base của origin/main, When liệt kê tệp đổi, Then ngoài hai tệp test chỉ có hồ sơ này,
  `_acceptance/config.yaml` và tệp máy sinh; không tệp nào dưới `app/src`, `pipeline`, `scripts` (trừ hồ sơ) bị đổi.

## Coverage

- Bỏ coverage-scan — vòng sửa hai test; trục: lặp xanh (AC-1, AC-3), đối chứng chập chờn tất định (AC-2), không sửa sản phẩm (AC-4).

## Out of scope

- Cho `getLockdownStatus` nhận hàm đo giả (đổi mã sản phẩm) — không làm.
- Làm `pgrep -f openclaw` chặt hơn để không khớp tiến trình lạ — việc sản phẩm riêng.

## Notes
