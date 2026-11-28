# Kế hoạch PB7 — data-api-tin-hien-thi

Hợp đồng: `_acceptance/data-api-tin-hien-thi/contract.md` (Mạnh duyệt 27/11; Hỏi-1 theo khuyến nghị: chỉ ẩn nguồn).
Tệp ngoài vùng M5: GS cho sửa đúng danh sách AC-9 (sổ d-…-8). Gộp sau PB2.

| # | Việc | Tệp | Kiểm từng việc | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | Sổ: khoá `nguon_khong_hien_thi` (S02, S08, mỗi mục `can_cu`); bộ sinh đọc khoá, kiểm khuôn, sinh `SOURCE_HIDDEN` ở ba đích cũ + đích mới `data-api/src/contract/vocab.generated.ts` | `pipeline/mappings.yaml`, `pipeline/lib/vocab-core.mjs`, bốn tệp sinh | `node pipeline/vocab.mjs --write && --check`; `config:executors.test.vocab` | E1, E8 | false |
| 2 | App: `OFFER_HIDDEN_SOURCES` = `SOURCE_HIDDEN` của tệp sinh | `app/src/lib/offers-filters.ts` | `cd app && npx tsc --noEmit` | E2, E9 | false (sau 1) |
| 3 | data-api: điều kiện nguồn ở nhánh `sale_offers` của `tapGhep`, dựng từ `SOURCE_HIDDEN` | `data-api/src/routes/listings.ts` | `npm run typecheck` | E3–E6 | false (sau 1) |
| 4 | `do-s03-len-cong.mjs` nhập `SOURCE_HIDDEN` từ `pipeline/lib/vocab.generated.mjs`, in «nguồn ẩn: …», danh sách rỗng thì dừng | `pipeline/scripts/do-s03-len-cong.mjs` | `config:executors.script.s03_len_cong_ben_doc` | E10 | false (sau 1) |
| 5 | Test data-api ma trận ô + test sổ từ vựng ca mới | `data-api/test/tin-hien-thi.test.ts`, `pipeline/scripts/vocab.test.mjs` | `config:executors.test.dapi_an`, `.vocab` | E3–E5, E8 | false |
| 6 | Bốn probe: nguon-chung, pha, do-db, pham-vi — mỗi probe có chiều đỏ cùng lượt | `_acceptance/data-api-tin-hien-thi/probes/*` | chạy từng probe | E1, E2, E6, E7, E10, E11 | false |
