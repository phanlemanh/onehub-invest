# Kế hoạch: khoa-nguon-nghi-khi-ddl-sua

Hồ sơ `_acceptance/khoa-nguon-nghi-khi-ddl-sua/` · thiết kế `docs/superpowers/specs/2026-11-09-khoa-nguon-nghi-khi-ddl-sua-design.md`.

Mọi lệnh chạm DB chạy trên DB của riêng lượt (`db/db-thu.sh oneinvest_suite_<bộ> --chay`), không chạy trên DB chung.

## Task 1 — Ca KN- viết trước (phải đỏ trên mã cũ)

- Files: `pipeline/scripts/luoc-do-rieng.test.mjs`
- Việc: thêm phiên chặn ngoài 33033 (`chanNgoai33033`), hàm đo giữ-33033 có đối chứng dương, bốn ca `KN-AC-1`,
  `KN-AC-2`, `KN-AC-3`, `KN-AC-6` với thông điệp ghim như `evals.yaml`.
- Verify: `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kn --chay node --test --test-concurrency=1 --test-name-pattern=^KN- scripts/luoc-do-rieng.test.mjs`
  → trên mã cũ: KN-AC-1, KN-AC-2 đỏ với thông điệp ghim; KN-AC-6 xanh (mã cũ đã ném ngay lỗi khác).
- Phục vụ: E1, E2, E3, E7 · independent: false

## Task 2 — Sửa khoaNguon

- Files: `pipeline/lib/luoc-do-rieng.mjs`
- Việc: mọi lần NOWAIT thất bại vì 55P03 thì nghỉ 100 ms, nghỉ sau khi đã nhả 33033; lỗi khác ném ngay; sửa chú thích.
- Verify: lệnh Task 1 → 4/4 xanh; rồi cả tệp (`scripts/luoc-do-rieng.test.mjs`, không lọc) xanh.
- Phục vụ: E1–E3, E7 · independent: false

## Task 3 — Probe đột biến

- Files: `_acceptance/khoa-nguon-nghi-khi-ddl-sua/probes/dot-bien.mjs`
- Việc: đối chiếu danh sách tệp import thư viện với AC-5; chạy KN- trên bản thật (pass 4); bốn đột biến trên bản chép
  tạm `.dot-<pid>`, mỗi bản đỏ với thông điệp ghim; so băm tệp thật trước/sau; dọn bản chép tạm cả khi lỗi.
- Verify: `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kndb --chay node ../_acceptance/khoa-nguon-nghi-khi-ddl-sua/probes/dot-bien.mjs`
  → 'DOT BIEN OK'; lượt phá-thử: đổi một thông điệp mong đợi trong probe → probe đỏ có tên.
- Phục vụ: E4 · independent: false

## Task 4 — Hồi quy

- Verify: `kn_hoi_quy_pipe` và `kn_hoi_quy_app` (config) xanh.
- Phục vụ: E5, E6 · independent: false
