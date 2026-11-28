---
schema_version: 1
feature: Probe «bản cũ / chiều đỏ» của năm hồ sơ data-api đã gộp (PB2, HT19, PB3, HT20) đo trên mốc commit CỐ ĐỊNH của chính hàng ấy thay vì merge-base với origin/main, để chúng không đỏ sẵn trên main sau khi hàng đã gộp (PB11)
slug: data-api-probe-ban-cu-moc-co-dinh
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: verified
veto_state: mo
veto_opened_at: 2026-11-28T03:38:44Z
approved_by:
approved_at:
---

# Acceptance Contract: data-api-probe-ban-cu-moc-co-dinh

> GS cấp mã PB11 từ OOS-4 của PB8 (28/11); nhánh `fix/data-api-probe-ban-cu-moc-co-dinh` do U2 tạo từ main 5013d45c0.

## Context

Năm probe chiều đỏ của các hồ sơ data-api đã ký lấy «bản cũ» bằng `git merge-base HEAD origin/main`. Khi hàng còn trên nhánh,
merge-base là bản trước hàng — đúng. Sau khi hàng gộp, merge-base của mọi nhánh mới đã CHỨA hàng, nên «bản cũ» = bản mới và
ô chiều đỏ thôi đỏ → probe báo sai. Cùng dạng PB9 (ca `PB2-AC-11`, đã sửa ở `c60c50f74`).

**Đo S1 trên main 5013d45c0 (28/11, M5, đúng lệnh executor trong `_acceptance/config.yaml`):**

| Probe (eval) | Hồ sơ | Hôm nay trên main | Ghim mốc = cha của lần gộp trên main (thử, không commit) |
|---|---|---|---|
| `luoc-do-mau.mjs` (PB2 E9) | data-api-hop-dong-reso-dd-2-1 | thoát 1 — «1 ô sai» (ô bản cũ) | mốc `75f32bd55` → thoát 0, «13 đường đúng mã; bản cũ đỏ» |
| `pha.mjs` (PB2 E6) | data-api-hop-dong-reso-dd-2-1 | thoát 1 — «3 ô sai» | mốc `75f32bd55` → thoát 0, «đủ 4 ô» |
| `pha.mjs` (HT19) | data-api-dong-ba-route-lo | thoát 1 — «3 ô sai» | mốc `0d4d81163` → thoát 1, «2 ô sai» (xem dưới) |
| `pha.mjs` (PB3) | data-api-dong-khi-thieu-khoa | thoát 1 — «thước không đỏ ở toàn bộ» | mốc `816796cf3` → thoát 0 |
| `ban-cu.mjs` (HT20) | data-api-markets-khong-doc-s02 | thoát 1 — «1 ô sai» | mốc `e83b5a91d` → thoát 0, «đủ 2 ô» |

Con số của hàng: số probe chiều đỏ data-api đỏ sẵn trên main **5 → 0**.

HT19 không xanh chỉ bằng đổi mốc: PB2 đã gộp `/v1/deals` vào `/v1/listings` và đổi hình phần tử, nên đặt route cũ (ở mốc HT19)
vào cây HÔM NAY thì ô `deals-cu` xanh hết (test hôm nay không còn đi qua `deals.ts`), ô `listings-cu` hỏng nhập (route cũ thiếu
hằng `KIND` mà `app.ts` hôm nay cần). Ô chiều đỏ của HT19 phải đo trên CẶP commit cố định của chính nó: cây ở commit gộp HT19
`b013b4428` (test và route của lúc ký) với route cũ ở mốc `0d4d81163` — như `aer-ac2-so-cap-co-dinh`.

## Criteria

- AC-1: Given cây sau hàng dựng trên main đã chứa cả năm hàng, When chạy năm probe bằng đúng lệnh executor của chúng
  (`dapi_reso_luoc_do`, `dapi_reso_pha`, `dapi_drl_pha`, `dapi_khoa_pha`, `dapi_mk_cu`), Then cả năm thoát 0; mỗi probe lấy
  «bản cũ» từ hằng sha 40 ký tự `MOC` — commit cha của lần gộp hàng ấy trên main (PB2 `75f32bd55…`, HT19 `0d4d81163…`, PB3
  `816796cf3…`, HT20 `e83b5a91d…`).
- AC-2: Given probe HT19, When chạy, Then cây `data-api/` của mọi ô dựng ở thư mục tạm từ commit gộp HT19 `b013b4428` (git
  archive, không ghi vào cây nguồn), ba ô bản cũ thay route ở mốc `0d4d81163`; ô gốc xanh năm ca DRL; mỗi ô cũ đỏ đúng ca của
  mình ở cả lớp JSON và SQL với thông điệp ghim của hồ sơ HT19, ca khác xanh — «pha: đủ 4 ô».
- AC-3: Given mỗi probe trong năm, When chạy với `PB11_MOC_THU` = HEAD (một mốc đã chứa lần gộp của hàng), Then thoát 2 với
  «<tên>: mốc so hỏng: <sha> đã chứa lần gộp <sha của lần gộp hàng> của hàng» trước mọi việc nặng — năm ô.
- AC-4: Given nhánh sau hàng, When soát diff so origin/main, Then chỉ đổi năm tệp probe kể trên, `decisions.jsonl` của bốn hồ
  sơ ấy, `_acceptance/data-api-probe-ban-cu-moc-co-dinh/**`, khoá `executors.*.dapi_pbm*`, `PRODUCT-MAP.md`, `LO-TRINH.html`;
  không probe nào trong năm còn chọn bản cũ bằng `merge-base` với HEAD; mỗi hồ sơ bị chạm có một dòng sổ «mốc so cố định sau
  gộp, hành vi đo không đổi» (GS phán 28/11: ghi ngay trên nhánh PB11).

## Coverage

Năm probe × (mốc cố định · đột biến mốc). HT19 thêm trục «cây tạm ở commit gộp».

## Out of scope

- OOS-1: Probe phạm vi (`pham-vi.mjs` các hồ sơ) dùng merge-base để lấy diff của CHÍNH nhánh — đúng nghĩa, không đổi.
- OOS-2: Probe dùng merge-base ngoài data-api (30+ tệp) — GS ghi nợ hàng HT43 «soát probe dùng merge-base động».
- OOS-3: `do-db.mjs` của PB7 (Ngoài-12 trên thẻ PB7, chờ Mạnh định đoạt) — không gộp vào đây trước khi Mạnh ký PB7.

## Notes

- Sửa probe của bốn hồ sơ đã ký làm bằng chứng của chúng thành cũ: phiên chấm M5 ghim lại từng hồ sơ (PB2, HT19, PB3, HT20) trên
  nhánh PB11 trước khi gộp (GS phán 28/11).
