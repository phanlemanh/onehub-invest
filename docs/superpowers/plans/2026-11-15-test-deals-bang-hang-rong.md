# test-deals-bang-hang-rong — kế hoạch

> Hotfix T2 do giám sát giao 15/11. Hợp đồng: `_acceptance/test-deals-bang-hang-rong/contract.md`.

**Goal:** các ca `/ops/deals` cũ xanh trên DB của lượt chép máy thu đã có dòng `offer_price_rank`.

### Task 1: tiền đề «chưa có hạng» trong giao dịch của ca (independent: false)

**Files:** `pipeline/scripts/can-gia-cung-loai-fixture.itest.mjs` (withTx chép rỗng `offer_price_rank` qua `neuLaBang`, cờ
`boBangHang` cho ca đối chứng) · `app/tests/can-gia-tot-biet-can.test.tsx` (withTx chép rỗng `offer_price_rank`) ·
`app/tests/can-gia-cung-loai-db.test.tsx` (ca CG8-TIEN-DE hai chiều).

**Phục vụ:** E1, E2.

**Verify:** `config:executors.script.hf_deals` (hai tệp) rồi `cd app && npm test` — thoát 0 trên DB của lượt chép máy thu.
