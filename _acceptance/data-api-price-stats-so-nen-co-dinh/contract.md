---
schema_version: 1
feature: Ca «PB2-AC-11 price-stats» so /v1/price-stats với route asset-stats cũ ở một commit CỐ ĐỊNH trước PB2 (75f32bd55) thay vì merge-base với origin/main, để ca không đỏ sẵn trên main sau khi PB2 đã gộp (PB9)
slug: data-api-price-stats-so-nen-co-dinh
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-27T23:28:09Z
approved_by:
approved_at:
---

# Acceptance Contract: data-api-price-stats-so-nen-co-dinh

## Context

PB2 (`data-api-hop-dong-reso-dd-2-1`, #578) đổi tên `/v1/asset-stats` thành `/v1/price-stats` và hứa «price-stats = asset-stats
cũ, cùng mã cùng thân». Ca `PB2-AC-11 price-stats` trong `data-api/test/listing-reso.test.ts` dựng route cũ từ
`asset-stats.ts` ở merge-base(HEAD, origin/main). Từ khi PB2 vào main (a80d389d9), merge-base của mọi nhánh mới đã chứa PB2,
nên «route cũ» là route 410 → «PB2 price-stats khác mã với asset-stats ở nền: 200 !== 410» (U2 đo trên main: 12 ca, 1 đỏ).
CI không chạy ca này nên main không đỏ, nhưng mọi làn ghim và S4 gọi bộ test data-api đều đỏ, kể cả PB7 vòng 2. Bất biến
«price-stats = asset-stats cũ» chỉ thuộc MỘT lần đổi (PB2), nên mốc so phải ghim vào commit cha của #578 trên main:
`75f32bd55c15442e5ab0d258b1f998e70aa2072b`. GS cấp mã PB9, 28/11.

## Criteria

- AC-1: Given cây sau hàng (dựng trên main a80d389d9, đã chứa PB2), When chạy `data-api/test/listing-reso.test.ts` trên DB
  thử có lược đồ thật, Then ca «PB2-AC-11 price-stats» xanh; nó đọc `data-api/src/routes/asset-stats.ts` ở commit cố định
  `75f32bd55c15442e5ab0d258b1f998e70aa2072b` (hằng trong test, in ra trong thông điệp mốc); tệp test không còn lời gọi
  `merge-base`; bản route ở mốc phải là route cũ đọc `market_asset_stats` (không phải bản 410), sai thì ca đỏ «PB2-AC-11 mốc
  so hỏng».
- AC-2: Given bản chép `data-api/` (ngoài kho git, `PB2_GIT_ROOT` trỏ về gốc kho), When chạy riêng ca AC-11 ở bốn ô — (goc)
  không đổi; (doi-ma) route price-stats trả mã khác cho truy vấn không có khu; (doi-than) route price-stats đổi một giá trị
  trong thân; (moc-sai) hằng mốc trỏ vào commit main a80d389d9 (asset-stats đã là 410) — Then ô goc xanh; ô doi-ma đỏ với
  «PB2 price-stats khác mã với asset-stats ở nền»; ô doi-than đỏ với «PB2 price-stats khác thân asset-stats ở nền»; ô moc-sai
  đỏ với «PB2-AC-11 mốc so hỏng».
- AC-3: Given nhánh sau hàng, When soát diff so origin/main, Then mọi tệp đổi nằm trong: `data-api/test/listing-reso.test.ts`,
  `_acceptance/data-api-price-stats-so-nen-co-dinh/**`, khoá `executors.*.dapi_psn*` của `_acceptance/config.yaml`,
  `PRODUCT-MAP.md`, `LO-TRINH.html`; không tệp nào dưới `data-api/src/**` đổi.

## Coverage

Bỏ quét không gian tiêu chí — xem dòng sổ `descope` «bỏ coverage-scan».

## Out of scope

- OOS-1: Không đổi route `/v1/price-stats` hay `/v1/asset-stats` (410) — hành vi PB2 đã ký giữ nguyên.
- OOS-2: Không đổi các ca khác của PB2 hay probe của hồ sơ PB2 (`pha.mjs` vẫn đặt `PB2_GIT_ROOT` như cũ).
- OOS-3: Clone nông không có commit mốc: ca đỏ với thông điệp nêu mốc — không tự tải commit.

## Notes

- Nhánh `fix/data-api-price-stats-so-nen` do U2 tạo từ main a80d389d9 (M5 không đẩy được nhánh mới từ main).
