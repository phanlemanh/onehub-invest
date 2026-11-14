# DA32 — Mã dự án S06 thành nút (ma-du-an-s06-thanh-nut) — thiết kế

Hàng DA32 của `docs/plan/lo-trinh.json` (T3, mốc MN1, đứng trên DA2). Lát mỏng của DA3 theo QĐ5 ngày 14/11 (ROADMAP §3
mục 48); thẻ luật theo nguồn đúng Hỏi-1 mục 44 (Mạnh duyệt 11/11). Ô cơ hội: `_acceptance/ma-du-an-s06-thanh-nut/opportunity.md`
(Cổng Đáng: build, giám sát ghi hộ lời Mạnh). DA3 lát đầy đủ (`bang-noi-ma-du-an`) đứng sau và dựng tiếp trên bảng của hàng này.

## 1. Đang có gì (đo chỉ đọc trên DB máy thu, 14/11)

- Tin S06 mang mã dự án nguồn ở `stg_chotot_ads.payload->>'projectid'` (nối 1:1 với `sale_offer_records` qua
  `originating_system_key`). Tin căn hộ đang rao: 31.136; có mã: 14.638; **1.250 mã**.
- **Phạm vi hàng = mã có từ 10 tin căn hộ đang rao: 344 mã, 11.941 tin.** Số 268 mã / 11.045 tin trong lời hàng là định nghĩa
  khác (mã có nhóm bán hoặc thuê từ 10 tin CÓ giá/m² — thước «giá tốt» của CG10), đo cùng ngày bởi phiên phân tích. Hàng này
  theo đúng chữ của `bat_khi` («từ 10 tin căn hộ đang rao»).
- Mã sạch: mỗi mã một tên, một mã dự án con (`project_oid`), một tỉnh (trừ mã giả `1`). Tin S06 căn hộ đều đã có `area_id`
  cấp xã (`areas.region_type = 'submarket'`, 30.945/30.945 tin có khu).
- Mã giả: `projectid = 1` tên rỗng, 557 tin rải 5 tỉnh — mã «không dự án» của nguồn. Thêm 4 mã mới chưa có tên trong payload.
- Danh bạ: 20 nút `project` nhập tay (đều có `area_ids`), 3 nút `building`. `asset_nodes` **không có cột `catalog_tier`**, không
  có toạ độ. `registry_aliases.object_key` chỉ nhận `pty|prc|bld|stk|unt_<ULID>` (055 → 082), nên chưa gắn bí danh vào nút dự án
  được.
- 17 mã có tên chứa tên hay bí danh (≥8 ký tự) của đúng một nút có sẵn cùng tỉnh (Vinhomes Grand Park 395 tin, Celadon City 283,
  Vinhomes Central Park 158, …; năm mã phân khu «<con> – Vinhomes Grand Park»). Không mã nào chạm hai nút.
- Bẫy đo được: so tên không xét tỉnh thì «Sunrise Riverside» (TP.HCM) chạm bí danh «riverside» của Vinhomes Riverside (Hà Nội).

| Lớp (mã ≥10 tin) | Mã | Tin | Kết cục |
|---|---|---|---|
| Tên rỗng (gồm mã `1`) | 5 | 623 | `chua_noi`, lý do `khong-ten` |
| Lệch tỉnh (>1 tỉnh, ngoài mã rỗng) | 0 | 0 | `chua_noi`, lý do `lech-tinh` |
| Chạm đúng một nút có sẵn cùng tỉnh | 17 | 1.366 | `noi` vào nút có sẵn |
| Chạm từ hai nút cùng tỉnh | 0 | 0 | `chua_noi`, lý do `nhieu-ung-vien` |
| Còn lại | 322 | 9.952 | đúc nút ứng viên, `noi` vào nút ấy |

(322 gồm 6 mã điểm tản >2 km, 202 tin: nút không có toạ độ nên không ảnh hưởng nút; mẫu vẫn gắn cờ để Mạnh nhìn.)

## 2. Chọn hướng

**Một lệnh `pipeline/noi-du-an-s06.mjs`, ba chế độ, luật xác định (không model — luật 7):**

1. `--the <tệp>` — đọc DB, phân lớp mọi mã ≥10 tin, ghi **thẻ luật** ra tệp Markdown: tổng theo lớp, bảng mẫu (10 mã đúc lớn nhất,
   10 mã giữa, 5 mã sát ngưỡng, MỌI mã nối nút có sẵn, MỌI mã từ chối, mọi mã điểm tản) chỉ mang tên dự án, tỉnh, xã, số tin —
   không mã nguồn (hồ sơ nằm trên kho công khai) — và dòng cuối `băm: <sha256>` của danh sách kết cục chuẩn hoá (mã → kết cục, sắp
   theo mã; giữ ở máy thu). Đổi kết cục một mã thì băm đổi, nên băm ràng đúng tập mã người đã xem. Không ghi DB.
2. `--ap --bam <sha256> --nguoi <tên>` — dựng lại thẻ trên dữ liệu hiện tại; băm khác băm khai → từ chối, 0 dòng đổi (dữ liệu đã
   trôi so với mẫu người xem). Khớp → MỘT giao dịch: một dòng `project_link_rules` (nguồn S06, căn cứ `S06-ma-nguon`, băm mẫu,
   số mã, người, lúc); nút ứng viên cho mã lớp «còn lại»; bí danh mỗi mã nối; trạng thái mọi mã trong `project_links`.
3. `--dao <rule_id> --nguoi <tên>` — một giao dịch: bí danh của luật đặt `retired_at`, `project_links` của luật về `chua_noi`
   lý do `dao-luat`, dòng luật ghi `dao_at`, `dao_by`. Nút ứng viên đã đúc giữ nguyên (khoá ngoài, rào chỉ-thêm của danh bạ);
   áp lại dùng lại đúng nút ấy (tra theo `project_links.asset_node_id` của mã — dòng `chua_noi` lý do `dao-luat` giữ nút cũ).

Hàm thuần `pipeline/lib/noi-du-an-s06-lop.mjs` giữ phân lớp và dựng thẻ (test không DB); lệnh chỉ đọc/ghi DB.

**Phân lớp chỉ so với nút KHÔNG do luật S06 đúc** (`catalog_tier <> 'mot_loi_khai'`): nút ứng viên lần áp trước không phải
«nút có sẵn» của lần dựng sau, nên mã tên lồng nhau («Sunrise Riverside» / «Sunrise Riverside Tower») không chuyển sang
`nhieu-ung-vien` khi chạy lại (phản biện F1). Mã đã có dòng `project_links` trỏ một nút thì giữ đúng nút ấy.

**Nút ứng viên:** `asset_nodes` `node_type='project'`, `name` = tên S06, `slug` = `slugifyName(tên)` (trùng thì thêm `-2`, `-3`…;
không mang mã nguồn), `aliases` = [tên viết thường], `area_ids` = xã có nhiều tin nhất của mã (luôn có, mọi tin S06 căn hộ đều có
xã), `catalog_tier = 'mot_loi_khai'` (thấp nhất), `meta = {nguon:'S06', rule_id}` — không mã nguồn. Nút chỉ sinh ra lúc áp, nên
«chưa qua thẻ luật» ⇔ «chưa có nút».

**Nút ứng viên đi tới đâu sau khi áp (đo 14/11):** `asset_nodes` nằm trong danh sách sync nguyên bảng của
`pipeline/sync-cloud.mjs`, và có sáu bên đọc nút `project`. Hai bên khớp TÊN để gán dự án cho tin khác nguồn —
`pipeline/lib/du-an-tren-tin-s03.mjs` (dự án trên tin S03) và `agent/src/agents/context-resolver.ts` (tên nhóm → dự án). Để 322 tên
S06 không tự gán dự án cho tin S03 (chưa ai duyệt cặp khác nguồn), hai bên này thêm điều kiện `catalog_tier <> 'mot_loi_khai'`
(Hỏi-3). Các bên còn lại (danh mục khai đơn vị trên Ops, phường từ dự án, sync cloud, S10) thấy nút như nút thường. Mã nguồn chỉ
nằm ở `registry_aliases` và `project_links` — hai bảng không sync.

**Bí danh:** `registry_aliases(object_key 'node:<id>', source 'S06', kind 'ma_nguon', value 'du_an/<mã>')` — giá trị mang phạm vi
(`du_an/`) đúng khuôn 082 («phạm vi nằm trong giá trị»), nên chỉ mục duy nhất `ma_nguon` (082) bảo đảm một mã một nút đang hiệu lực.
Bí danh không có cột `rule_id`: bí danh thuộc luật nào đọc qua `project_links.rule_id` ⨝ `value = 'du_an/' || source_project_id`
(phản biện F2) — không thêm cột vào bảng bí danh dùng chung.

**Đọc dự án của tin:** view `s06_offer_project` (migration 100): tin S06 đang rao ⨝ mã nguồn ⨝ bí danh còn hiệu lực ⨝ nút. Đây là
đường tin «đọc được dự án qua bí danh»; DS2 (ghi dự án lên tin) đọc view này.

**Migration `db/migrations/100_ma_du_an_s06_nut.sql`** (số 100 dành cho dãy P4, GS quyết 14/11):
- `asset_nodes.catalog_tier text NOT NULL DEFAULT 'xac_minh'` CHECK ba giá trị của 082; 20 nút có sẵn nhận `xac_minh` (Hỏi-2).
- `registry_aliases` và `registry_events`: CHECK `object_key` thêm `node:[0-9]+` (cùng cách DA3 lát đầy đủ định làm; DA3 chỉ còn
  thêm nguồn S10–S15 và kind `ma_nha_nuoc`).
- Bảng `project_link_rules` (id, source, can_cu, mau_bam, so_ma, decided_by, decided_at, dao_by, dao_at).
- Bảng `project_links` theo khuôn DA3 (§2 thiết kế DA3) nhưng chỉ các cột lát mỏng cần: `source`, `source_project_id`,
  `asset_node_id`, `status` (`noi|chua_noi`), `can_cu`, `ly_do`, `rule_id`, `updated_at`; khoá `(source, source_project_id)`; CHECK
  `noi` phải có nút, `chua_noi` phải có lý do. DA3 lát đầy đủ thêm cột (`level`, `building_id`, `de_xuat`, `tu_choi`…) bằng ALTER và
  chép 150 dòng S08 vào — không đổi tên bảng này.
- View `s06_offer_project`. Không sync cloud (bảng mới không vào FILL của `pipeline/sync-cloud.mjs`).
- Idempotent (`IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS` rồi thêm). Áp lên DB máy thu sau gộp là lời riêng của Mạnh.

## 3. Thẻ luật và người xem mẫu

Mạnh xem thẻ ở Cổng Phạm vi (bản dựng trên dữ liệu 14/11, kèm ở hồ sơ dạng bảng không mã nguồn) và ở Cổng Bằng chứng (bản lệnh
`--the` sinh trên bản chép DB máy thu, băm in trên thẻ). Sau gộp, lời áp của Mạnh có dạng «Áp thẻ luật S06 <băm>»; máy chạy
`--ap --bam <băm>` lên DB máy thu. Băm lệch (tin mới đổi tổng) → dựng thẻ mới, trình lại băm mới, không áp mù.

## 4. Không gian đã quét (morphological-scan, preset test-matrix)

- Trục A — lớp mã: tên rỗng · lệch tỉnh · chạm 1 nút cùng tỉnh · chạm ≥2 nút · chạm nút khác tỉnh (bẫy Riverside) · còn lại
  (kể cả điểm tản). [CE: phép đo §1 trên toàn bộ 344 mã — đủ]
- Trục B — vòng đời luật: dựng thẻ · áp băm khớp · áp băm lệch · chạy lại · đảo · áp lại sau đảo. [CE: mục 44 Hỏi-1 + thẻ luật
  DA3 §2 — đủ]
- Trục C — bất biến dữ liệu: một mã một nút · không lệch tỉnh · nút ứng viên tier thấp nhất + có xã · bí danh không đổi khi chạy lại ·
  tin đọc dự án khớp đếm độc lập. [CE: `bat_khi` của hàng — đủ]
- Trục D — tầng: migration · hàm thuần · lệnh trên DB thử fixture · lệnh trên DB thử chép DB máy thu.
- Later: mã dưới 10 tin (906 mã, 2.697 tin) — chạy cùng lệnh khi hạ ngưỡng; phân khu thật cho mã «<con> – <cha>» (K5, DA3 lát đầy
  đủ); thẻ từng cặp trên `/ops/review` (DA3). Never: tự gộp hai mã S06 cùng tên thành một nút; nối theo tên khác tỉnh.

## 5. Hạng rủi ro, đường lùi, RESO-first, luật bất biến

- **T3** (hàng khai; chạm `db/migrations` và tạo nút danh bạ): sau Cổng Phạm vi có Cổng 1.5 duyệt kế hoạch.
- **Đường lùi:** đảo luật (`--dao`) gỡ mọi bí danh của luật trong một giao dịch; nút ứng viên ở lại với tier `mot_loi_khai`,
  không bí danh, không tin. Lùi lược đồ = migration mới bỏ view, hai bảng; cột `catalog_tier` và CHECK nới không cần lùi.
- **RESO-first (ADR-0011, ADR-0013):** không thêm field RESO mới. `catalog_tier` đã có trong sổ từ vựng (082). Mã dự án nguồn là
  bí danh (`ma_nguon`), không thay khoá nút.
- **SPL (luật 6):** mã S06 và tên nguồn không rời máy thu qua hàng này (không sync cloud). Mẫu trong hồ sơ công khai chỉ mang tên
  dự án (thông tin dự án công khai, mục 38), không mang mã nguồn.
- **LLM-off-data-path (luật 7):** luật xác định, người duyệt băm mẫu trước khi ghi.

## Đặc tả UX

Bỏ — hàng không chạm giao diện (vùng hàng: `db/migrations`, `pipeline/noi-du-an-s06.mjs`); thẻ luật là tệp Markdown đọc ở cổng.
Thẻ duyệt trên `/ops/review` thuộc DA3 lát đầy đủ.
