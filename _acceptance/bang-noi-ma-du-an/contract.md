---
schema_version: 1
feature: Người vận hành mở thẻ nối dự án trên Ops, thấy cặp mã nguồn ↔ dự án máy đề xuất kèm căn cứ, duyệt từng cặp hoặc cả loạt cùng căn cứ, và mỗi cặp đã duyệt thành một bí danh
slug: bang-noi-ma-du-an
owner: phanlemanh@gmail.com
risk_tier: T3      # hàng khai T3: quyền duyệt và dữ liệu nối; chạm db/migrations
surfaces: [ui, api, cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-13-bang-noi-ma-du-an-design.md
---

# Acceptance Contract: bang-noi-ma-du-an

## Context

Hàng DA3 (T3) của mốc «Định vị căn và thông tin dự án», đứng trên DA2 (trường dự án trên tin, #432) và DA30
(`stg_s08_project`, #440). Ba cơ chế bí danh dự án đang cùng tồn tại; `s08_project_links` (074) chỉ ghi từ tệp tay và
27 dự án của snapshot S08 07/11 chưa có dòng nối. Hàng này dựng một bảng nối chung có người duyệt, một khuôn chung
bản ghi nguồn cho mọi nguồn danh mục, bộ đề xuất cặp theo căn cứ §1.2, và thẻ duyệt trên `/ops/review`.

Căn cứ: `_acceptance/bang-noi-ma-du-an/opportunity.md` (Mạnh 09/11), `docs/architecture/mo-hinh-danh-ba-du-an.md`
§1.1–§1.2, §6; ROADMAP §3 mục 35, 40, 44, 45. Số đo nền 13/11 ở design doc mục 1.

## Acceptance Criteria

- **AC-1** Given DB thử chép lược đồ máy thu có 150 dòng `s08_project_links` (8 `noi`), When áp migration của hàng
  hai lần, Then bảng `project_links` có 150 dòng nguồn S08 cùng trạng thái, nút và lý do; view `s08_project_links` trả
  150 dòng, đúng 8 dòng `status = 'noi'`, cùng cột và cùng giá trị như trước migration (so từng dòng); lần áp thứ hai
  không đổi số dòng nào; `INSERT`, `UPDATE`, `DELETE` thường qua tên cũ (cách itest danh bạ vật thể đang làm) đi xuống `project_links`;
  `pipeline/noi-du-an-s08.mjs` ghi thẳng `project_links` và chạy lại trên tệp nối cũ cho cùng 8 dòng `noi`.
- **AC-2** Given migration đã áp, When chèn `registry_aliases` với ma trận viết trước (`object_key` `node:12` · `bld_<ULID>`
  · `node:abc` · `xyz_1`; `source` `S08` · `S15` · `S16` · `S00`; `kind` `ma_nha_nuoc` · `ma_nguon` · `la`), Then đúng
  các ô hợp lệ được nhận, ô sai bị CHECK từ chối, và `registry_events` nhận `node:<id>` cùng luật; `node pipeline/vocab.mjs
  --check-db` thoát 0 với `alias_kind` có `ma_nha_nuoc`.
- **AC-3** Given bản ghi `stg_s08_project` thật (177 dự án) và fixture `stg_s07_project` rút từ khuôn hợp đồng dữ liệu
  v9, When bộ chuyển của từng nguồn dựng khuôn chung, Then mỗi bản ghi ra đủ 14 trường của khuôn (trường không có ở
  nguồn là `null`); S08: tỉnh và xã suy từ điểm cho mọi dự án có điểm nằm trong vùng đã nạp (172/174 đo 13/11), điểm ngoài vùng
  có tỉnh `null` lý do `ngoai-vung`, 3 dự án không điểm có tỉnh `null` lý do `khong-diem`; ma trận rỗng
  giả viết trước (`""`, `"  "`, `"Đang cập nhật"`, `"đang cập nhật"`, `"--"`, `"-"`, `"0"`, `"N/A"`, `"0 m2"`, `"Vinhomes"`)
  về `null` đúng 8 ô đầu, giữ nguyên 2 ô cuối.
- **AC-4** Given ma trận căn cứ viết trước (K1–K5 × có/không đủ dữ liệu, cộng bốn ca «không bao giờ»: lệch tỉnh, chỉ
  theo điểm, hai nút cùng tên, nút chỉ có `area_ids` cấp tỉnh), When hàm đề xuất quyết một bản ghi, Then mỗi ô ra đúng
  một kết cục viết trước (`the-luat:K3`, `tung-cap:K4`, `chua-noi:<lý do>`…); bốn ca «không bao giờ» không bao giờ ra
  đề xuất nối.
- **AC-5** (cross-layer) Given DB thử chép từ DB máy thu, When chạy bộ đề xuất trên S08, Then mọi dự án của snapshot
  07/11 có đúng một dòng `project_links` (27 dự án mới hết thiếu); 8 dòng `noi` cũ giữ nguyên nút; dòng `noi`/`tu_choi`
  do người quyết không bị ghi đè khi chạy lại; mỗi đề xuất có đúng một thẻ `review_queue` hạng mục `project_link`;
  chạy lần hai không thêm thẻ trùng.
- **AC-6** (cross-layer) Given thẻ một cặp đề xuất K3, When vai `ops` gọi route duyệt «Nối», Then trong một giao dịch:
  dòng sang `noi` với `decided_by` là actor, đúng một bí danh `node:<id>` kind `ma_nguon` value `S08/<project_id>`, một
  dòng `ops_audit`; «Không phải» thiếu lý do → 400, kèm lý do → `tu_choi`, không bí danh; vai `viewer` → 403, không đổi
  dòng nào; bản sao route làm lần ghi bí danh ném lỗi → không dòng nào đổi.
- **AC-7** (cross-layer) Given 12 đề xuất K3 cùng nguồn S08, trong đó 1 cặp vai `ops` đã quyết «Không phải» trước, When
  vai `admin` duyệt thẻ luật rồi đảo luật, Then duyệt: một dòng `project_link_rules`, 11 cặp `noi` cùng `rule_id`, 11 bí
  danh, cặp đã từ chối giữ `tu_choi`, một giao dịch; đảo: một dòng nhật ký «đảo», 11 cặp về `de_xuat`, 11 bí danh có
  `retired_at` (không xoá dòng nào), mỗi cặp `de_xuat` có đúng một thẻ `project_link` đang mở; vai `ops` nối lại một cặp
  đã đảo → 200, một bí danh mới `retired_at` rỗng, bí danh cũ giữ dấu; vai `ops` gọi duyệt hay đảo luật → 403.
- **AC-8** (cross-layer) Given fixture S11 4 bản ghi cấp lô của Ocean Park 1 (tên pháp lý khác tên thương mại) theo
  khuôn hợp đồng dữ liệu v8, When người duyệt thẻ từng cặp chọn một toà có sẵn (hay phân khu có sẵn), Then dòng
  `project_links` cấp `lo_toa` trỏ `building_id` (hay nút phân khu), bí danh trỏ `bld_<ULID>` (hay `node:<id>`); không
  tạo nút hay toà mới.
- **AC-9** Given hàng duyệt dựng thật trong jsdom với fetch giả, When mở hạng mục «Nối dự án», Then thẻ cặp hiện hai
  cột nguồn ↔ nút và dòng căn cứ; bấm Nối thì không gọi route trong 5 giây và «Hoàn tác» huỷ được; «Để sau» không gọi route quyết, dòng giữ `de_xuat` và
  thẻ về cuối hàng; danh sách rỗng →
  «Không còn cặp nào chờ nối»; lỗi tải → Alert và «Thử lại»; vai `viewer` không thấy nút nào; vai `ops` không thấy nút «Duyệt cả loạt», vai `admin` thấy.
- **AC-10** (ui-observed) Given dev server trỏ DB thử chép từ DB máy thu sau khi chạy bộ đề xuất, cộng 12 đề xuất K3 mẫu nạp
  từ fixture của AC-7 (dữ liệu thật 13/11 chỉ ra 1 đề xuất K3 mới — không đủ dựng thẻ luật), đăng nhập tài khoản thử vai admin, When mở `/ops/review`, hạng mục «Nối dự án», nối một cặp, rồi mở thẻ luật K3 và duyệt, Then thẻ cặp có
  căn cứ đọc được; toast có Hoàn tác; thẻ luật có 5 cặp mẫu và tổng số; nhật ký luật có dòng mới và nút «Đảo luật».

## Coverage

Quét theo preset test-matrix (skill morphological-scan), năm trục — chi tiết ở design doc mục 4:
- Trục A — nguồn × cấp bản ghi: S08 dự án (thật) · S07 dự án (fixture, AC-3) · S11 lô/toà (fixture, AC-8). [CE: §1.1 + DATA-CONTRACT v8/v9]
- Trục B — căn cứ × kết cục: K1–K5 × thẻ luật/từng cặp/chờ + bốn «không bao giờ» (AC-4). [CE: §1.2]
- Trục C — vòng đời cặp: đề xuất → nối/từ chối/để sau; nối theo luật → đảo; hoàn tác 5 giây (AC-5, AC-6, AC-7, AC-9).
- Trục D — vai: viewer · ops · admin (AC-6, AC-7, AC-9). [CE: bảng quyền bốn vai]
- Trục E — tầng: migration (AC-1, AC-2) · hàm thuần (AC-3, AC-4) · DB thử (AC-5) · route (AC-6–AC-8) · màn (AC-9, AC-10).

## Đường đo

Ngưỡng của `opportunity.md`:
- «8 cặp S08 đã nối hiện trong bảng mới và view trả đúng 8 dòng» — AC-1 (so từng dòng trước/sau migration).
- «duyệt một cặp sinh đúng một bí danh node:<id>» — AC-6.
- «hoàn tác 5 giây khôi phục» — AC-9 (màn), AC-10 (nhìn).
- «thẻ luật duyệt loạt có nhật ký và đảo được» — AC-7.
- «registry_aliases.kind nhận thêm ma_nha_nuoc» — AC-2.
- «27 dự án S08 mới có trạng thái nối» (`bat_khi`) — AC-5.

## Out of scope

- Căn cứ K1, K2, K4 trên dữ liệu thật: cần mã số DN và toạ độ nút danh bạ — hàng làm giàu danh bạ. Hàm đề xuất có ô
  của chúng (AC-4) nhưng hôm nay không cặp nào đủ dữ liệu.
- Bộ chuyển chạy trên S07, S11 thật: chờ ZCode nạp `stg_s07_*`, chờ bảng S11 (DA24a). Hàng này đo bằng fixture.
- Nối tin rao vào nút (DA7, DA18) và đưa nút lên Invest (mục 44 Hỏi-1 — sau khi qua thẻ).
- Đưa `project_links` hay bí danh dự án lên cloud.
- Viết thẻ luật cho bản ghi cấp lô/toà (mục 45 Q5: đủ 20 mẫu mới viết).
- Áp migration lên DB máy thu thật: sau gộp, theo lời Mạnh.
- Duyệt thẻ nối dự án từ Ops ở cloud (Hỏi-3, máy khuyên làm sau): hàng này đặt thẻ ở Ops máy thu.
- Bộ chuyển S11: chưa có bảng `stg_*` phía ghi; AC-8 chỉ chứng đường duyệt cấp lô/toà trên fixture.

## Notes
