---
schema_version: 1
feature: CI bỏ qua ca «DF-AC-3 DB thật» cần tin rao thật ở DB local (chỉ chạy ở máy thu)
slug: ci-bo-qua-df-ac-3
owner: phanlemanh@gmail.com
risk_tier: T1      # khai một ca test vào danh sách bỏ qua CI + bài kiểm hai chiều; không đổi dữ liệu, quyền hay luồng
surfaces: [ci]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: ci-bo-qua-df-ac-3

## Context

Căn cứ: Ngoài-1 của `ops-dong-chay-df0` — Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 26/10
(`_acceptance/ops-dong-chay-df0/decisions.jsonl`, dòng `Ngoài-1: mở hợp đồng mới`). Hàng U2 2.1 của đợt
dieu-phoi-dot0-cam-mau, merge CẶP liền sau #136.

Ca «DF-AC-3 DB thật — đủ trường lõi theo nguồn = levelOf» của `app/tests/ops-dong-chay.test.tsx` có đối chứng đòi
`sale_offers` có tin. DB của CI dựng từ migration nên rỗng → job `ci-test/app` đỏ (run 40326301837, đúng một ca:
«đối chứng: DB thật phải có tin để so»). Merge #136 mà thiếu mục này thì job app đỏ trên main và mọi PR sau.

Hồ sơ có mặt vì PR chạm `scripts/` (ngoài `t1_skip_globs`). Danh sách bỏ qua thuộc AC-4 của `ci-test-module` (AU11),
nên PR kèm một dòng sổ trong hồ sơ đó và ghim lại bằng chứng của nó.

## Criteria

- AC-1: Given `scripts/ci-bo-qua.json`, When đọc mục module `app`, Then có mục `tep: app/tests/ops-dong-chay.test.tsx`, `ca` trùng nguyên văn tên test «DF-AC-3 DB thật — đủ trường lõi theo nguồn = levelOf», kèm `ly_do`; `loiDanhSach` trả rỗng.
- AC-2: Given CI=true và NODE_OPTIONS do `scripts/lib/ci-can-du-lieu.mjs` sinh, When chạy một tệp test cùng hình (ca lồng trong `describe("DF-AC-3 SQL khớp levelOf")`, đỏ khi thiếu dữ liệu), Then ca bị lọc và exit 0.
- AC-3: Given không CI, When chạy cùng tệp, Then ca vẫn chạy và đỏ «thiếu dữ liệu thật» (máy thu vẫn đo ca thật).
- AC-4: Given CI=true nhưng danh sách thiếu mục DF-AC-3, When chạy cùng tệp, Then exit ≠ 0 (chiều đỏ: đúng trạng thái trước bản sửa).

Kiểm: `node --test scripts/ci-bo-qua-df-ac-3.test.mjs` (AC-1…AC-4) và `node --test --test-name-pattern='AU11-AC-4' scripts/ci-test-module.test.mjs`.

## Out of scope

- OOS-1: Cho CI có tin rao để chạy được ca DF-AC-3 (fixture tin cho DB CI) — không làm; ca này bản chất là đối chứng trên dữ liệu thật.
- OOS-2: Các mục Ngoài khác của DF0 (Ngoài-4/5/7/8) — hàng riêng.

## Notes

- Không đổi `app/tests/ops-dong-chay.test.tsx`, nên bằng chứng đã ký của `ops-dong-chay-df0` không bị chạm.
