---
schema_version: 1
feature: Người vận hành mở trang một dự án trong Danh bạ Ops máy thu và thấy diện tích thông thuỷ, tim tường, phòng ngủ, WC, hướng, loại hình, giá chủ đầu tư của từng căn S16 (nguồn S16, mốc thu) cùng ô phủ của dự án — thuộc tính lưu theo trường RESO, đọc được theo khoá căn
slug: thuoc-tinh-can-s16
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, ui]
status: approved
approved_by: Mạnh
approved_at: 2026-11-18
design_doc: _acceptance/thuoc-tinh-can-s16/design.md
---

# Acceptance Contract: thuoc-tinh-can-s16

## Context

Hàng DA40 (đợt `thuoc-tinh-can-s16-1811`, dãy P1, T3 vì có migration). Lời Mạnh 18/11: «đưa bộ thuộc tính căn S16 (enrich từ
chủ đầu tư) vào pipeline» và «Tôi muốn dữ liệu được hiển thị trong danh bạ để tôi có thể kiểm tra». Hôm nay `units` chỉ có khoá;
không căn nào trong danh bạ có diện tích hay giá. Lượt thu S16 sáng 18/11 có thuộc tính cho 95.798 mã căn, khớp 100% mã của
`v_s16_can`; 84.820 mã có căn danh bạ (bảng phủ ca `_acceptance/thuoc-tinh-can-s16/bang-phu-ca.md`).

Hàng làm năm việc: migration 113 (bảng nạp stg, mở ba trường phát biểu, view phân xử căn, view giá chủ đầu tư); lõi thuần
nguồn → phát biểu; lệnh chạy thử / `--ghi`; lớp đọc + cột và ô phủ trên trang dự án Danh bạ; áp lên DB máy thu.

Thiết kế: `_acceptance/thuoc-tinh-can-s16/design.md` (phương án A: thuộc tính là phát biểu `field_assertions` resource `Unit`
theo ADR-0016 §3; giá chủ đầu tư đọc từ stg qua view theo ADR-0016 §7.1).

Phụ thuộc: snapshot `mngt-can-chi-tiet`, DATA-CONTRACT v14 và bộ nạp vào `stg_s16_can_chi_tiet` là làn thu (tin claudedp-1811-1).
Màn bám lớp đọc của DA36 (dãy N1). Mở trục trường cần `pipeline/mappings.yaml` (TG2 đang giữ). Ba chỗ này không chặn S3 phần
migration, lõi, lệnh; chặn AC-9, AC-10 (màn) và AC-11 (dữ liệu thật).

## Criteria

### AC-1 — Migration 113 áp hai lần, không đổi gì ngoài phần của nó
Given DB của riêng lượt đã áp 001…112,
When áp `db/migrations/113_*.sql` hai lần,
Then lần hai không lỗi và lược đồ không đổi (so bản chụp `information_schema` + định nghĩa view/trigger); có bảng
`stg_s16_can_chi_tiet`, hai view `v_unit_thuoc_tinh`, `v_s16_gia_cdt`, CHECK `field_assertions_field_chk` = tập của 096 cộng
đúng `living_area`, `building_area_total`, `direction_faces`; không migration cũ nào bị sửa (diff `db/migrations/` chỉ thêm 113);
`units`, `buildings`, `registry_aliases` không đổi định nghĩa.

### AC-2 — Bảng nạp giữ trường nguồn cần dùng, không có cột tài chính chủ căn
Given migration 113 đã áp,
When liệt kê cột `stg_s16_can_chi_tiet` và chèn thử dòng vi phạm,
Then bảng có các cột của thiết kế §4.1 (khoá có `snapshot_id` FK `airbnb_snapshots ON DELETE CASCADE`); KHÔNG có cột nào cho
giá mua, ngày mua, vốn đầu tư, khoản vay, tình trạng pháp lý/bàn giao/nội thất do chủ căn nhập; dòng `ma_can` rỗng, diện tích âm,
giá âm bị CHECK từ chối (23514); không cột hay tên bảng mang tên nguồn thật.

### AC-3 — Luật nguồn → phát biểu đúng trên ma trận viết trước
Given lõi thuần `pipeline/lib/thuoc-tinh-can-s16.mjs` và ma trận viết trước một assert mỗi ô: 12 mã loại hình (năm mã shophouse/
thương mại theo nhánh Mạnh chọn ở Hỏi-4) + UNDEF + mã lạ;
diện tích dương / 0 / thiếu; PN, WC dương / 0; hướng cao tầng ↔ thấp tầng (lấy ban công ↔ cửa); NE / N_E / NORTH / XX_YY hai mã /
XX_XX / OTHER / rỗng / mã lạ; dòng ở hai toà,
When gọi `phatBieuTuDong` và `gopKhoa`,
Then mỗi ô ra đúng danh sách `{field, value}` của thiết kế §5 (0 phát biểu cho 0, rỗng, OTHER, UNDEF, mã lạ — kèm lý do đếm được);
dòng trùng cùng toà gộp một; khoá ở hai toà → 0 phát biểu, lý do «mã nhiều toà»; không phát biểu tầng hay giá.

### AC-4 — Ghép căn chỉ qua bí danh S16 còn sống
Given DB của lượt có ba căn danh bạ mang bí danh `ma_nguon` S16, một bí danh đã nghỉ, và stg có dòng cho năm mã (ba có căn, một
bí danh nghỉ, một không có căn),
When chạy lệnh ở chế độ `--ghi`,
Then chỉ ba căn có phát biểu; mã bí danh nghỉ và mã không căn được đếm theo dự án ở dòng «chưa có căn danh bạ»; không ghép theo
tên hay số tầng; tầng nguồn khác `units.floor` được đếm, không phát biểu.

### AC-5 — Lệnh chạy thử in bảng phủ, `--ghi` ghi phát biểu đúng khuôn, chạy lại không đổi số
Given DB của lượt có stg và căn như AC-4,
When chạy lệnh không cờ, rồi `--ghi` hai lần,
Then lần chạy thử in bảng dự án × trường theo khuôn `bang-phu-ca.md` §1 và 0 dòng ghi; `--ghi` lần một chèn phát biểu
`resource_name='Unit'`, `method='source_field'`, `evidence_tier='fact'`, `observed_at` = mốc snapshot, `evidence.nguon='S16'`, số
dòng bằng tổng phát biểu của lần chạy thử; lần hai chèn 0; `evidence` không chứa mã căn, mã toà nguồn hay tên nguồn thật.

### AC-6 — Bộ phân xử căn chọn theo luật có tên
Given một căn có phát biểu fact hai lần thu với diện tích khác nhau, một phát biểu `registry_inherit`, một phát biểu đã rút, và hai
phát biểu hướng cùng lần thu,
When đọc `v_unit_thuoc_tinh`,
Then đúng một dòng cho căn; diện tích là của lần thu sau («lần thu sau thắng»); phát biểu kế thừa và phát biểu đã rút bị bỏ qua;
`direction_faces` là mảng hai mã; cột `nguon` = `{S16}` và `observed_at` = mốc lần thu thắng.

### AC-7 — Giá chủ đầu tư theo căn đọc từ stg, không thành phát biểu
Given stg có hai snapshot với giá khác nhau cho cùng mã, một mã giá 0, một mã ở hai toà,
When đọc `v_s16_gia_cdt` và đếm `field_assertions` sau `--ghi`,
Then căn lấy giá của snapshot mới nhất kèm giá/m² thông thuỷ; mã giá 0 và mã hai toà không có dòng; không có phát biểu nào mang
giá (trục trường không có mã giá).

### AC-8 — Thuộc tính và giá S16 không rời máy
Given danh sách đẩy `FILL` của `sync-cloud.mjs` và bộ soát `kiemBangDay`,
When kiểm danh sách thật và danh sách đã cấy `stg_s16_can_chi_tiet`, `field_assertions`, `v_unit_thuoc_tinh`, `v_s16_gia_cdt`,
Then danh sách thật không chứa bảng hay view nào trong bốn tên; danh sách cấy `stg_s16_can_chi_tiet` làm bộ soát trả đúng tên ấy
(đối chứng dương); `sync-cloud.mjs` không bị sửa ở hàng này.

### AC-9 — Lưới toà hiện thuộc tính từng căn kèm nguồn và mốc thu (cross-layer)
Given DB có phát biểu và giá cho căn của một dự án đã nối, và có căn chưa có thuộc tính,
When người vận hành mở `/ops/registry/[nodeId]` của dự án, mở một toà,
Then mỗi hàng căn có thuộc tính hiện thông thuỷ, tim tường (m²), PN, WC, hướng, loại hình (nhãn `CONTEXT.md`), giá chủ đầu tư
kèm giá/m², Badge `S16` và mốc thu; giá trị trên màn bằng giá trị `v_unit_thuoc_tinh` / `v_s16_gia_cdt` của đúng `unit_key`;
căn chưa có thuộc tính hiện «Chưa có thuộc tính»; trang có Skeleton khi tải và lỗi nội tuyến kèm «Thử lại»; không chữ nào mang tên
nguồn thật.

### AC-10 — Ô phủ theo dự án để soi chỗ thiếu (cross-layer)
Given DB như AC-9, một dự án đã nối có mã S16 có thuộc tính mà chưa có căn danh bạ, và một dự án không có toà S16,
When mở trang dự án,
Then ô phủ hiện «X / Y căn có thuộc tính», «Z căn có giá chủ đầu tư» và, khi có, «N căn S16 có thuộc tính chưa vào danh bạ»; X, Y,
Z, N bằng lệnh đếm độc lập (SQL viết riêng trong eval, không import lớp đọc); tập dự án S16 của nút lấy qua bí danh S16 của toà
thuộc nút (thiết kế §7); số tính ở SQL, React chỉ hiện; dự án không có toà S16 hiện «Chưa có nguồn thuộc tính căn».

### AC-11 — Ô trên màn đổi trên dữ liệu thật của DB máy thu
Given PR đã gộp, bộ nạp của làn thu đã nạp snapshot `mngt-can-chi-tiet` vào stg trên DB máy thu, và `ap-may-thu.md` có đủ năm thứ
(lệnh áp, số chạy thử, sao lưu trước, cách lùi, lệnh kiểm sau),
When áp 113, chạy lệnh `--ghi` từ `main`, rồi mở trang dự án grand-park, smart-city, ocean-park-3 trên Ops máy thu,
Then số thật bằng số chạy thử từng ô, và khi snapshot là lượt thu 18/11 thì cả hai bằng số khoá trong `bang-phu-ca.md` §1 (đếm
từ tệp thu gốc, độc lập với bộ nạp): căn danh bạ có thuộc tính 0 → 84.820 / 111.329, có giá 0 → 11.852; grand-park 37.589 / 37.997,
smart-city 2.546 / 22.119, ocean-park-3 2.797 / 4.599 kèm 820 chưa vào danh bạ; lệch thì dừng, báo, không tự sửa cho khớp; ảnh
chụp ba trang nằm trong evidence.

## Coverage

Quét hình thái (làm tay trên số thật, không qua skill — bảng phủ ca chính là ma trận): trục **trường** (thông thuỷ, tim tường, PN,
WC, hướng, loại hình, giá, tầng, kiểu căn, trường chủ căn) × **giá trị nguồn** (có / 0 / rỗng / mã lạ / hai mã) × **nối** (căn
danh bạ / bí danh nghỉ / chưa căn / mã hai toà) × **số lần thu** (một / hai snapshot) × **đầu ra** (stg, phát biểu, view phân xử,
view giá, màn, cloud). Core → AC-1…AC-11; ô bỏ ghi ở «Out of scope» và bảng phủ ca §2 («ngoài phạm vi, vì»). Thước CE: mỗi ô
của bảng phủ ca §1 có số đếm từ DB máy thu; AC-11 so lại từng ô.

## Out of scope

- Suy PN/WC từ kiểu căn (`houseStyle`) — chữ mơ hồ, lớp `inferred`; hàng sau nếu cần.
- Kế thừa thuộc tính xuống tin rao (`registry_inherit`, ADR-0016 §7) — hàng sau; khi đó hỏi lại chuyện lên cloud.
- Đặt giá chủ đầu tư cạnh giá tin rao (DA41).
- Lượt thu bù năm dự án 0% và smart-city 11,5% (TC4, làn thu).
- Đưa căn của bốn dự án S16 chưa nối (royal-island, global-gate, hai-van-bay, happy-home-trang-cat) vào danh bạ (DA3/DA18).
- Giá chủ đầu tư S16 lên cổng Invest hay cloud (Hỏi-1 — bản này không đẩy gì).
- Trường tài chính và tình trạng do chủ căn nhập; tầng theo nguồn (tầng của căn giữ ở `units.floor`).

## Notes

- Tên dự án trong hồ sơ là tên ngắn (bỏ tiền tố thương hiệu của slug nguồn).
- Giới hạn đo đã biết từ S1: bộ ghi thật của `stg_s16_can_chi_tiet` là bộ nạp của làn thu (chưa có); ca DB (E1–E7) dựng dòng stg
  theo khuôn migration 113, nên chỗ ánh xạ sai của bộ nạp chỉ bị bắt ở E13 (so với số khoá từ tệp thu gốc).
- Known limits: (trống tới S4)
