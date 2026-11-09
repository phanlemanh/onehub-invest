---
schema_version: 1
feature: Chặng «Bài nhận → Đọc được» của S03 trên /ops/data-flow tính trên bài cần đọc — ảnh đã ghép vào tin rời mẫu số, bài Yêu cầu là đầu ra ngang tin rao và cùng tính vào «Đọc được»
slug: bai-nhan-tru-bai-chi-anh
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: verified
design_doc: docs/superpowers/specs/2026-11-09-bai-nhan-tru-bai-chi-anh-design.md
approved_by: Mạnh
approved_at: 2026-11-09
---

# Acceptance Contract: bai-nhan-tru-bai-chi-anh

## Context

Hàng DF6 của `docs/plan/lo-trinh.json` (đợt `s03-ket-0911`), ô Cổng Đáng `build` (Mạnh duyệt 09/11 qua phiên DA truy
kẹt S03). Đo 09/11: 43.948 / 110.368 bài nhận S03 là tin nhắn chỉ có ảnh, 24.054 trong số đó PL28 đã ghép vào tin; bài
Yêu cầu bị loại đúng nhưng hiện như rơi. Nhánh từng bài tính bằng chính hàm của transform (`laChiAnh`, `baiAnhCuaTin`,
`parsePost`, `laYeuCau`) ở `pipeline/lib/nhanh-bai-s03.mjs`, nạp bảng tạm cho `600_data_flow.sql` qua bộ chạy
`refresh-data-flow.mjs`. Thiết kế: `design_doc`.

Source input: hàng DF6 + ô `opportunity.md` + ghi chú số đo `s03-ket-truong-loi-va-anh-20261109.md`.

## Criteria

- **AC-1** (cross-layer) — Given DB có bài S03 đủ năm loại (bài thành tin; bài chỉ-ảnh cách bài chữ của một tin dưới
  2 phút cùng người, cùng nhóm; bài chỉ-ảnh không có bài chữ gần, hay bài chữ gần không thành tin; bài Yêu cầu «cần
  mua/thuê/tìm» không ghi bán/cho thuê; bài chat), When bước làm tươi chạy qua `refresh-data-flow.mjs`, Then dòng S03 của
  `data_flow_snapshot` ở cả ba cửa sổ có `imageMerged`, `inquiry`, `imageUnmerged` bằng đúng số bài của từng loại mà
  fixture dựng, và bằng số mà chính `baiAnhCuaTin`, `laChiAnh`, `parsePost` + `laYeuCau` trả trên cùng dữ liệu.
- **AC-2** — Given cùng dữ liệu, When làm tươi, Then với mọi cửa sổ và mọi nguồn: `received = readable + imageMerged +
  inquiry + imageUnmerged + phần còn lại` với phần còn lại ≥ 0; bài thành tin không bao giờ rơi vào ba nhánh mới kể cả
  khi bộ đọc hiện tại xếp nó là Yêu cầu hay chỉ-ảnh; tổng `days[]` S03 trong 30 ngày khớp dòng cửa sổ 30 ngày cho từng
  nhánh; tổng các nhóm thu S03 khớp dòng nguồn.
- **AC-3** — Given cùng DB, When so khối `facts` do 600 trước DF6 (bản `origin/main`) và sau DF6 sinh ra, Then mọi số
  của S05, S06, `shortStay`, `mix`, `enrichPending` và mọi khoá cũ của S03 giống hệt; khác biệt duy nhất là ba khoá
  mới; S05, S06 có ba khoá bằng 0.
- **AC-4** — Given 600 chạy không qua bộ chạy (bảng tạm vắng hay rỗng, cờ `oneinvest.flow_branch` tắt), When làm tươi,
  Then 600 không lỗi, ba khoá nhánh là `null` ở mọi nguồn, ngày, nhóm, mọi số khác giống khi chạy qua bộ chạy; trang đọc
  khối ấy vẽ Sankey như trước DF6 (không cột «Bài cần đọc») kèm dòng «Chưa tách bài chỉ-ảnh và Yêu cầu — có ở lượt làm
  tươi kế», tỉ lệ «Đọc được» chia cho bài nhận.
- **AC-5** (cross-layer) — Given khối có nhánh, When mở `/ops/data-flow` (máy thu, vai ops) chọn S03, Then Sankey có các
  nút «Ảnh đã ghép vào tin», «Bài cần đọc», «Đọc thành tin rao», «Đọc thành Yêu cầu», «Ảnh chưa ghép», «Không đọc được» với
  đúng số của khối; «Bài nhận» chảy vào «Ảnh đã ghép vào tin» + «Bài cần đọc»; «Bài cần đọc» chảy vào «Đọc thành tin rao» +
  «Đọc thành Yêu cầu» + «Ảnh chưa ghép» + «Không đọc được»; tổng vào bằng tổng ra ở mọi nút giữa; «Đọc thành tin rao» và «Đọc
  thành Yêu cầu» đều ghi tên cạnh thanh, nút Yêu cầu mang màu chặng «Yêu cầu» (không phải màu rơi hay gộp); chú thích cột
  «Đọc được» ghi số `readable + inquiry` và tỉ lệ `(readable + inquiry) / (received − imageMerged)`; «Tỉ lệ bước» khi rê
  chuột của mỗi đầu ra là số của nó trên «Bài cần đọc»; gợi ý «Không đọc được» không còn chữ «hỏi mua».
- **AC-6** — Given khối có nhánh, When đọc lưới «Chất lượng từng chặng», Then ô «Đọc được» của S03 và của từng nhóm thu
  S03 ghi `readable + inquiry` và % trên `received − imageMerged`, và nhãn «Kẹt · đọc» / «Theo dõi · đọc» xét cùng tỉ lệ ấy
  (ngưỡng 30% / 60% giữ nguyên); hàng S05, S06, S01 giữ số và nhãn như trước.
- **AC-7** — Given khối có nhánh, When đọc «Chặng theo ngày», Then ô «Đọc được» ghi tổng `readable + inquiry` và % trên bài
  cần đọc của cửa sổ, đường «Đọc được» theo ngày vẽ `readable + inquiry` của từng ngày; ô «Tin rao mới» ghi % trên bài đọc
  thành tin rao; đường «Bài nhận», «Tin rao mới», «Gắn căn» giữ số như trước.
- **AC-8** (cross-layer) — Given máy thu làm tươi rồi push-ops-facts chở khối `dataFlow` lên cloud, When mở
  `/ops/data-flow` trên bản cloud, Then ba khoá nhánh có mặt trong khối cloud với cùng số, Sankey, lưới và ô tỉ lệ trên
  cloud giống máy thu; khối cloud đời trước (thiếu khoá) đi đúng đường của AC-4.
- **AC-9** — Given bộ thử dòng chảy có sẵn (`app/tests/ops-dong-chay.test.tsx`, `dong-chay-cloud.test.tsx`,
  `df0-*.test.tsx`), When chạy trên mã đã sửa, Then mọi ca vẫn xanh.

## Coverage

Bỏ quét hình thái bằng dòng sổ descope «bỏ coverage-scan — …»: phạm vi là một phép đếm đã gọi tên trên một trang có sẵn.
Trục tự kê để người soát:

| Trục | Giá trị | AC |
|---|---|---|
| Loại bài S03 | thành tin · ảnh đã ghép · ảnh chưa ghép (không bài chữ gần / bài chữ gần không thành tin) · Yêu cầu · chat | AC-1, AC-2 |
| Bài lệch giữa tin cũ và bộ đọc mới | bài thành tin mà bộ đọc nay xếp Yêu cầu / chỉ-ảnh | AC-2 |
| Nguồn | S03 · S05 · S06 (+ S01 ở lưới) | AC-1, AC-3, AC-6 |
| Lát | cửa sổ 7d / 30d / all · ngày · nhóm thu | AC-1, AC-2 |
| Đường chạy 600 | qua bộ chạy · chạy trần | AC-1, AC-4 |
| Mặt đọc | Sankey · lưới nguồn · lưới nhóm · Chặng theo ngày | AC-5, AC-6, AC-7 |
| Nơi xem | máy thu · cloud (khối mới / đời trước) | AC-5, AC-8, AC-4 |
| Hồi quy | bộ thử dòng chảy có sẵn | AC-9 |

## Đường đo

Ô cơ hội khai ngưỡng («Số bài chỉ-ảnh bị bỏ khỏi mẫu số khớp đếm SQL độc lập; tổng các nhánh bằng số bài nhận; S06 và S05
không đổi số; nhánh Yêu cầu khớp số bài Yêu cầu»):

- Ảnh bỏ khỏi mẫu số khớp đếm độc lập — số từ `imageMerged` của khối, đối chiếu đếm SQL độc lập ảnh đã ghép (luật PL28 viết lại bằng SQL) và đếm SQL bài chỉ-ảnh chưa thành tin trên DB máy thu (E10) · AC-1
- Tổng nhánh = bài nhận — số từ bất biến received ≥ readable + ba nhánh trên khối mọi cửa sổ, ngày, nhóm (E2, E10) · AC-2
- S05, S06 không đổi — số từ so khối của 600 bản merge-base và bản mới trên cùng DB (E3, E10) · AC-3
- Nhánh Yêu cầu khớp số bài Yêu cầu — số từ `inquiry` đối chiếu bài có `suyLoai` → `yeu-cau` chưa thành tin (E1, E10) · AC-1
- Tỉ lệ «Đọc được» của S03 = (tin rao + Yêu cầu) / bài cần đọc (Hỏi-2 Mạnh chốt 09/11; Hỏi-1 mẫu số chờ chốt) — số từ Sankey, lưới chất lượng, ô Chặng theo ngày (E5, E6, E7, E11) · AC-5, AC-6, AC-7

## Out of scope

- GT0 (mã album S03) và đổi cửa sổ ghép 2 phút của PL28 — DF6 chỉ đếm theo bộ ghép hiện có.
- DF5 (chỉ nhận phường thật trong trường lõi) và NH2 (ảnh hết hạn) — hàng riêng, đi sau vì cùng tệp 600.
- Đọc nhánh Yêu cầu từ bảng `inquiry_records` (migration 058 chưa áp) — DF6 dùng hàm của transform.
- Đổi ngưỡng «Kẹt/Theo dõi» (30% / 60%) hay mẫu số của S05, S06.

## Notes

- Không route mới, không migration; `push-ops-facts` không đổi (chở nguyên `facts`).
- Kỳ vọng số (đo 09/11 trên DB thử chép máy thu): S03 «Đọc được» = (47.392 tin rao + 11.377 Yêu cầu) / 86.316 bài cần
  đọc = 68,1%; trước DF6 là 42,9% (tin rao / bài nhận). Hỏi-2 đã chốt ở Cổng Phạm vi: Yêu cầu là đầu ra ngang tin rao
  (sổ `d-20261109T005328Z-11`). Hỏi-1 (ảnh chưa ghép có ở mẫu số không) còn chờ: bỏ → (58.769 / 66.422) = 88,5%.
- Bước làm tươi cloud-sync (15 phút) dài thêm ~6–16 giây (tính nhánh bằng hàm transform trên ~110 nghìn bài).
