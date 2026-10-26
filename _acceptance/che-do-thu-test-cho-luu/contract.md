---
schema_version: 1
feature: Ca CD-AC-7b chờ request lưu ghi xong rồi mới đọc params, hết chập chờn trên CI
slug: che-do-thu-test-cho-luu
owner: phanlemanh@gmail.com
risk_tier: T1      # chỉ sửa một ca test; không đổi hành vi /ops/sources, dữ liệu, quyền hay luồng
surfaces: [test]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: che-do-thu-test-cho-luu

## Context

Căn cứ: hàng `che-do-thu-test-cho-luu` của đợt dieu-phoi-dot0-cam-mau (giám sát thêm 26/10 ~07:55Z, chuyển P4 → U2 ~14:55Z,
uu 2.05). Ca «CD-AC-7b hộp thoại → datCheDo thật» của `app/tests/che-do-thu.test.tsx` bấm Lưu rồi chỉ chờ một nhịp 20ms
trước khi đọc `params(9)`. Request lưu ghi DB thật qua `datCheDo`; trên CI nó có khi lâu hơn nhịp đó, nên ca đọc params cũ
và đỏ chập chờn: CI #116 (run 40287531999) ở lần Lưu thứ hai, run 40339147647 và 40338531121 ở lần Lưu thứ nhất. Hai lượt
ghim lại `ci-test-module` (E8, nhánh thăm dò) đỏ vì ca này, chặn hàng `ci-bo-qua-df-ac-3`.

Hồ sơ có mặt vì PR chạm `app/tests/` (ngoài `t1_skip_globs`). Tệp test nằm trong `paths` của hồ sơ `che-do-thu-tren-ops`,
nên PR kèm một dòng sổ ở đó và ghim lại bằng chứng của nó.

## Criteria

- AC-1: Given `render()` của tệp test, When `fetch` giả được gọi, Then promise của request được giữ lại và `luuXong()` chờ hết các request đang bay rồi chờ tới khi hộp thoại đóng (tối đa ~2 giây).
- AC-2: Given CD-AC-7b, When bấm Lưu (Bùng rồi Duy trì), Then ca gọi `luuXong()` trước khi đọc `params(9)`; các assert của ca giữ nguyên.
- AC-3: Given request lưu trễ 300ms (thử nghiệm cục bộ, không commit), When chạy CD-AC-7b, Then bản cũ đỏ đúng như CI («Expected values to be strictly deep-equal»), bản sửa xanh.
- AC-4: Given `app/src/**`, When so với main, Then không đổi tệp nào (hành vi /ops/sources giữ nguyên); các ca khác của tệp test không đổi.

Kiểm: `cd app && node --import tsx --test tests/che-do-thu.test.tsx` (12/12) · `npx next typegen && npx tsc --noEmit`.

## Out of scope

- OOS-1: Các ca khác của `che-do-thu.test.tsx` (P1 đang làm `cong-tac-khong-ha-nhom-go` trên cùng tệp) — chỉ sửa đúng CD-AC-7b.
- OOS-2: Đổi `press()` dùng chung cho mọi ca.

## Notes

- Đo 26/10 trên máy: bản thường 12/12 xanh; thử trễ 300ms — bản cũ `pass 0 · fail 1`, bản sửa `pass 1 · fail 0`.
