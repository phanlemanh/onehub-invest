# cong-tac-test-ghim-ban-cu — thiết kế

Căn cứ: Ngoài-1/3/4 của `_acceptance/cong-tac-khong-ha-nhom-go/review-findings.md` (Mạnh: «mở hợp đồng mới»); ô cơ hội
`_acceptance/cong-tac-test-ghim-ban-cu/opportunity.md` (giám sát, P1-31).

## Vấn đề

`chepRouteCu()` trong `app/tests/cong-tac-nhom-go.test.tsx` chạy `git show origin/main:<route>` lúc test chạy và ghi bản
ấy vào `app/src/app/api/v1/ops/source-groups/.route-cu-<pid>.ts`. Sau khi #142 gộp, `origin/main` là route mới: CT-AC-1
(«route cũ phải đỏ ở retired+tắt») và CT-AC-2 («route cũ phải hồi sinh nhóm đã gỡ») đỏ mãi.

## Quyết định

- **Ghim bản route trước sửa thành tệp fixture viết sẵn**: `app/tests/fixtures/source-groups-route.truoc-cong-tac.ts.txt`
  = nguyên văn `git show 8fc9603d:app/src/app/api/v1/ops/source-groups/route.ts` (8fc9603d là gốc của #142 — main sau
  PL12). Cùng lệ `pipeline/scripts/vocab-lint.test.mjs` (fixture `dq-enum-vocab.truoc-pl6.mjs.txt`,
  hồ sơ `so-tu-vung-mot-nguon`): không suy từ merge-base hay `origin/main`, và không gọi git lúc chạy (gãy khi clone nông). Đuôi `.txt` để tsc, lint không quét tệp fixture.
- **Bản chép tạm giữ chỗ cũ** (cạnh route, xoá trong `finally`): đo 26/10 — `tsc --noEmit` bỏ qua tệp chấm-đầu ở mọi
  thư mục của `app/`, eslint quét mọi chỗ — dời sang `app/tests` không giảm gì (gap-probe).
- Không đổi gì khác của ca thử: bảng 10 ô, chuỗi đồng thời, AC-5 giữ nguyên.

## Ngoài phạm vi

- Ngoài-2 (chữ expected của E1) và Ngoài-5 (đối chứng nhánh đồng thời): đã ghi Known limits ở hồ sơ #142.
- Một bộ quét kho bắt mọi test đọc `origin/main` lúc chạy (đáng có, nhưng là việc khác).
