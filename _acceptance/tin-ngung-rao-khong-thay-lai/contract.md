---
schema_version: 1
feature: Tin không thấy lại ở nguồn quá N ngày (nguồn vẫn đang thu) chuyển sang ngừng rao, giữ lại làm lịch sử; thấy lại thì về đang rao
slug: tin-ngung-rao-khong-thay-lai
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: approved
design_doc: docs/superpowers/specs/2026-11-08-tin-ngung-rao-khong-thay-lai-design.md
approved_by: Mạnh
approved_at: 2026-11-09
---

# Acceptance Contract: tin-ngung-rao-khong-thay-lai

## Context

Ngày 08/11 Mạnh chốt Q4: tin không xoá khi hết rao, mà đi theo vòng đang rao → ngừng rao → rút; Invest chỉ hiện tin
đang rao. Hiện chưa có tin nào ngừng rao: `sale_offer_records` có 79.815 tin `active` và 304 tin `unknown`. Lý do là
PL19 (059) chỉ đổi trạng thái theo bằng chứng nguồn. Ngoài ra `last_seen` của S06 là ngày đăng tin chứ không phải lần
thấy cuối: 74.581/74.581 tin S06 có `last_seen = first_seen`. Vòng này thêm luật «không thấy lại sau N ngày → ngừng
rao» vào PL19 (migration 085, giám sát cấp ở P3-165). Luật đo lần thấy cuối thật (S06 đọc `stg_chotot_ads.captured_at`)
tới mốc thu mới nhất của nguồn. Vòng này cũng sửa chỗ hàm ghi bằng chứng của 059 dội mọi phát biểu ngừng rao về
«đang chào».

Source input: tin giao của giám sát 08/11 (V6 trong `tong-hop-gan-can-quyet-dinh-20261108.md`, Q4); V11 (lời Mạnh
«Tên, SDT người bán vào trong danh bạ giữ») do giám sát chuyển.

## Criteria

- AC-1: Given tin S06 sống mà `stg_chotot_ads.captured_at` của nó tụt sau lần quét mới nhất của cùng `region_v2 ×
  ad_type` hơn N ngày, When chạy `pipeline/trang-thai-chao.mjs`, Then tin có `offer_status = withdrawn`, thắng bởi
  một phát biểu `inferred`/`e1_rule`, `rule_id 'khong-thay-lai:<offer_id>'`, `observed_at` = lần thấy cuối + N, evidence
  ghi `n_ngay`, `lan_thay_cuoi`, `moc_thu`. Given tin S06 có `last_seen` (ngày đăng) cũ hơn N ngày nhưng mới được quét
  lại, Then tin vẫn `active`. Given tin S06 không có dòng `stg_chotot_ads` (đo 08/11: 0 tin), Then luật bỏ qua tin ấy —
  không có lần thấy lại để đo, không lấy ngày đăng thay.
- AC-2: Given tin S03 sống, When chạy lệnh, Then tin chỉ ngừng rao khi mốc thu của tin — bài mới nhất
  (`stg_zalo_posts.posted_at`) của các nhóm mà tin đã đăng — trừ `last_seen` của tin lớn hơn N ngày; tin S05 đo tới
  `max(last_seen)` của tin sống S05. Given một nhóm S03 ngừng thu trong khi nhóm khác vẫn thu (đo 08/11: 16/41 nhóm im
  quá 7 ngày), hoặc cả nguồn ngừng thu (S05), Then không tin nào của nhóm hay nguồn ấy ngừng rao vì việc ngừng thu.
- AC-3: Given một DB đã chạy lệnh một lần, When chạy lại hai lần liên tiếp mà dữ liệu không đổi, Then lần chạy sau
  0 phát biểu mới và 0 rút ở cả bước bằng chứng nguồn lẫn bước luật, mọi tin giữ nguyên trạng thái, và phát biểu
  `active` của tin ngừng rao không bị rút với lý do `quay-lai`.
- AC-4: Given tin đã ngừng rao theo luật, When tin được thấy lại (S06: `captured_at` mới; S03: `last_seen` mới) rồi
  chạy lệnh, Then phát biểu ngừng rao bị rút với lý do `thay-lai`, tin về `active`, và `history_transactional` có đúng
  hai dòng `withdrawn` rồi `back_on_market` cho tin ấy.
- AC-5: Given mọi tin bị luật đổi sang ngừng rao, When so trước và sau lệnh, Then không dòng `sale_offer_records` nào bị
  xoá hay đổi `retired_at`, `retired_reason`, `seller_name`, `seller_phone`, `seller_ref`; tin vẫn nằm trong view
  `sale_offers`.
- AC-6: Given tin đã nghỉ (`retired_at` khác NULL, mọi lý do), tin có phát biểu `withdrawn` từ nguồn (`het-trong-luot`),
  hoặc tin của nguồn không có N, When chạy lệnh, Then luật không ghi phát biểu nào cho các tin ấy và trạng thái của
  chúng không đổi so với 059.
- AC-7: Given N khai ở đúng một hàm `ngung_rao_sau_ngay(source)` với giá trị đã duyệt ở Cổng Phạm vi, When tin tụt
  đúng N ngày, Then tin còn `active`; tụt N ngày + 1 giây thì ngừng rao. `CONTEXT.md` mục «Trạng thái chào» nói luật
  mới (không thấy lại quá N ngày khi nguồn vẫn thu là bằng chứng suy luận ngừng rao), nêu giá trị N, và không còn câu
  «quá cửa sổ không đổi»; `CONTEXT.md` có thuật ngữ «Ngừng rao» (nhãn, code, định nghĩa, _Avoid_) ánh xạ vào
  `withdrawn` kèm `rule_id khong-thay-lai` (Hỏi-4).
- AC-8: Given DB chưa áp 085, When chạy `pipeline/trang-thai-chao.mjs` ở chế độ thường (đường cloud-sync) và với `--thu`,
  Then lệnh thoát 0, in dòng đếm của 059 khớp từng chữ với bản lệnh của nhánh chính trên cùng DB, cộng một dòng chứa
  «chưa áp 085», không ghi phát biểu luật nào. Given DB đã áp 085, Then dòng in thêm số tin ngừng rao
  theo nguồn, số phát biểu luật mới và số rút. `--thu` chạy cả chuỗi rồi ROLLBACK: số dòng `field_assertions` và
  trạng thái mọi tin trước = sau.
- AC-9: Given migration 085, When áp hai lần liên tiếp trên DB thử đã có 059, Then không lỗi, và bộ itest PL19
  `pipeline/scripts/trang-thai-chao.itest.mjs` vẫn xanh trên DB có 085 (chuyển trạng thái 059: gỡ trong lượt, quay lại,
  đổi khoá).
- AC-10: Given một DB thử chép từ máy thu (`db/db-thu.sh`) đã áp 085, When chạy `trang-thai-chao.mjs --thu`, Then số tin
  ngừng rao theo nguồn mà lệnh in bằng số đếm độc lập bằng một câu SQL viết riêng trong phép đo (cùng N, cùng mốc), và
  DB thử không đổi.

## Coverage

Quét không gian (morphological-scan, preset risk-premortem + entity-feature, inline):

- Trục A — nguồn: S03 | S05 | S06 | nguồn không có N. [CE: `sale_offer_records.source` đo 08/11]
- Trục B — diễn biến của tin: còn thấy | tụt ≤ N | tụt > N | thấy lại sau khi ngừng | nguồn ngừng thu | tin đã nghỉ
  | đã có `withdrawn` nguồn. [CE: các chuyển của 059 §5 + Q4]
- Trục C — lớp chịu ảnh hưởng: phát biểu | phân xử | lịch sử | dòng tin và người bán | lệnh và lịch chạy.
  [CE: 059, 045 rào chỉ-thêm, `scripts/cloud-sync.sh:22`]
- Core → AC: S06 tụt > N (AC-1) · S03/S05 và nguồn ngừng thu (AC-2) · chạy lại không dội (AC-3) · thấy lại (AC-4) ·
  dòng tin và người bán không đổi (AC-5) · tin nghỉ, nguồn không có N (AC-6) · biên N (AC-7) · chưa áp 085 và `--thu`
  (AC-8) · 059 không vỡ (AC-9) · số trên dữ liệu thật (AC-10).
- Later: tin lọc khỏi Invest (Hỏi-1) · nhịp quét lại của S06 khi bảng stg có hơn 21 ngày lịch sử.
- Never: xoá tin; nghỉ (`retired_at`) tin vì không thấy lại — đó là «rút» của Q4, không phải ngừng rao.

## Out of scope

- Lọc tin ngừng rao khỏi Invest và API công khai: đưa `offer_status` lên cloud qua `CLOUD_ALLOW` rồi lọc ở cổng, hoặc
  lọc khi đẩy (Hỏi-1 khuyên cách thứ nhất, ở một hàng riêng).
- Sửa nghĩa `last_seen` của S06 trong `transform-chotot.mjs` (đang là ngày đăng tin). Vòng này đọc lần thấy cuối thẳng
  từ `stg_chotot_ads`.
- Thêm giá trị «hết hạn» hay «ngừng rao» vào trục `offer_status`. Ngừng rao là `withdrawn`, bằng chứng nằm ở phát biểu.
- Áp 085 lên DB máy thu hay cloud: đó là lời riêng của Mạnh sau gộp, kèm `pg_dump` trước.
- Bước thu và nhịp quét lại của ZCode.

## Notes

- Hỏi-1 (người): Invest chỉ hiện tin đang rao. Hiện log sync-cloud báo «cột chưa duyệt lên cloud, ở lại máy:
  sale_offers.offer_status», nên Q4 chưa có hiệu lực trên Invest. Có hai cách, cả hai là đường dữ liệu lên cloud (T3):
  (a) đưa `offer_status` vào `CLOUD_ALLOW` của `pipeline/sync-cloud.mjs` (kèm cột trên Supabase), rồi truy vấn cổng và
  API lọc `active`; (b) lọc khi đẩy: không đẩy tin `withdrawn` và gỡ tin đã có trên cloud. Khuyên làm (a) ở một hàng
  riêng sau khi 085 đã áp và số ngừng rao đã đo. Lý do: tin vẫn ở cloud cho Ops và lịch sử, thấy lại thì tự hiện lại.
  Cách (b) phải xoá dòng trên cloud, và tin thấy lại phải đẩy lại.
- Hỏi-2 (người): N = 21 ngày cho S03, S05, S06. Số tin sẽ đổi ngay khi áp (đo 08/11, tới mốc thu của nguồn):

  | N | S06 | S03 (theo nhóm) | S05 |
  |---|---|---|---|
  | 21 ngày | 0 | 0 | 0 |
  | 14 ngày | 6.693 | 451 | 0 |

  Với S03, «không thấy lại» là bài không được đăng lại trong một nhóm còn đang thu, không phải bài đã biến mất. Lối
  khác: 14 ngày, hoặc S03 chưa có N (luật không áp) cho tới khi có tín hiệu bài còn hay mất.
- Hỏi-4 (người): ngừng rao dùng giá trị `withdrawn` có sẵn, nhãn «Đã gỡ», phân biệt với gỡ ở nguồn bằng phát biểu
  (`rule_id khong-thay-lai`, lớp suy luận); `CONTEXT.md` thêm thuật ngữ «Ngừng rao». Lối khác là thêm giá trị riêng vào
  trục ngay trong 085, giá là đổi CHECK của 044/059, từ vựng và trigger lịch sử.
- Hỏi-3 (người, lời Mạnh qua giám sát): tin ngừng rao không xoá hay che tên, SĐT người bán. Chúng giữ lâu dài trong danh
  bạ Người (Ops) và rời Invest theo tin khi việc lọc của Hỏi-1 xong.
