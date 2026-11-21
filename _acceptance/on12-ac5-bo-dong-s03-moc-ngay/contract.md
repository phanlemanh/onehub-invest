---
schema_version: 1
feature: ca ON12-AC-5 bỏ đúng các dòng kiểm mà bảng chung bỏ (s03-moc-ngay của SM1) bằng một hằng chung với dqLatestSql — main thôi đỏ
slug: on12-ac5-bo-dong-s03-moc-ngay
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: machine-cleared
veto_state: mo
veto_opened_at: 2026-11-19T17:22:10Z
approved_by:
approved_at:
---

# Acceptance Contract: on12-ac5-bo-dong-s03-moc-ngay

## Context

Căn cứ: hàng `on12-ac5-bo-dong-s03-moc-ngay` của đợt dieu-phoi-dot0-cam-mau (U2, giám sát thêm 19/11 17:20Z, ưu tiên -300). Từ 16:41:51Z 19/11 DB
máy thu có dòng `s03-moc-ngay` (SM1, #492). Bảng chung /ops/quality đã bỏ dòng này (`dqLatestSql`), nhưng ca ON12-AC-5
chép tay điều kiện loại cũ (chỉ `do1-%`, `do3-%`) nên đọc thêm dòng ấy và đỏ «dòng kiểm chưa diễn giải» — main đỏ, chặn mọi
lượt chấm và ghim. Việc: một hằng điều kiện duy nhất cho bảng và ca; không thêm diễn giải cho dòng vốn không vẽ ở bảng ấy.

## Criteria

- AC-1: Given một DB thử `oneinvest_suite_*` có dòng `s03-moc-ngay` trong 7 ngày, When chạy ca ON12-AC-5 của nhánh, Then
  xanh; When chạy bản ca của origin/main trên CÙNG DB, Then đỏ «dòng kiểm chưa diễn giải» nêu `s03-moc-ngay` (đối chứng).
- AC-2: Given bản chép `dq-checks.ts` bỏ `s03-moc-ngay` khỏi hằng chung và bản chép ca trỏ vào nó, When chạy ca ON12-AC-5 trên
  cùng DB thử, Then đỏ «dòng kiểm chưa diễn giải» — chứng bảng và ca đọc MỘT hằng, sửa một chỗ là đủ.
- AC-3: Given nhánh so với merge-base của origin/main, When liệt kê tệp đổi, Then chỉ có `app/src/lib/dq-checks.ts`,
  `app/tests/ops-nhan-theo-context.test.tsx`, `app/src/lib/dq-labels.ts`, hồ sơ này, `_acceptance/config.yaml` và tệp máy
  sinh; ca không còn chép tay điều kiện loại; `dqLatestSql` ghép hằng chung.

## Coverage

- Bỏ coverage-scan (dòng sổ descope) — câu giao nêu đích danh một ca và cách sửa; trục: dòng mới có/không trên DB (AC-1),
  một nguồn điều kiện (AC-2), phạm vi (AC-3).

## Out of scope

- Thêm diễn giải `dqDetail` cho `s03-moc-ngay` — dòng không vẽ ở bảng chung, diễn giải nó là đo nhầm lời hứa.
- Đổi các ca khác đọc `dq_check_results` bằng câu riêng (nếu có) — không thuộc vụ main đỏ này.

## Notes

- Ngoài-1 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Sau khi thay đổi này được gộp, phép kiểm chứng đối chiếu bản cũ không chạy lại được nữa và báo đỏ giả dù tính năng vẫn đúng. Người dùng cuối không bị ảnh hưởng, chỉ người soát lại hồ sơ về sau mới gặp. — `_acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/doi-chung.sh`
- Ngoài-2 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Một dòng kiểm trong bộ nghiệm thu có thể báo xanh dù hằng bị xoá, nên nó không tự bắt được lỗi đó. Người dùng cuối không thấy gì khác, vì các phép kiểm chạy thật vẫn bắt được lỗi. — `_acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/pham-vi.sh`
- Ngoài-3 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Bộ nghiệm thu chỉ chứng minh phía ca kiểm đọc chung một điều kiện, còn phía bảng chất lượng dữ liệu chỉ được kiểm bằng so khớp chữ. Nếu sau này hai nơi lệch nhau, bảng có thể hiện khác ca kiểm mà không bị bắt ngay. — `_acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/doi-chung.sh`
- Ngoài-4 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Sau khi bản sửa được gộp, bước chứng minh «bản cũ từng đỏ» sẽ không còn đỏ nữa, nên chạy lại hồ sơ này trên nhánh chính sẽ báo thất bại dù mã không hỏng. Người dùng cuối không bị ảnh hưởng, chỉ người chấm lại hồ sơ gặp báo động giả. — `_acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/doi-chung.sh`
- Ngoài-5 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Trong một số môi trường chạy (máy CI hoặc DB khác DB chung) bước chấm này có thể treo mãi không kết thúc. Người dùng cuối không thấy gì, chỉ lượt chấm bị kẹt. — `_acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/doi-chung.sh`
- Ngoài-6 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Việc bảng chất lượng dữ liệu thật sự bỏ dòng mới chỉ được kiểm bằng việc đọc mã, chưa chạy thử trên dữ liệu. Nếu sau này có người sửa lệch, bảng có thể hiện thêm một dòng không cần thiết mà bước chấm không bắt được. — `_acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/pham-vi.sh`
