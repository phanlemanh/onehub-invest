---
schema_version: 1
slug: danh-ba-toa-truc-can
feature: Danh bạ có toà · trục · căn cao tầng Ocean Park 1 và Grand Park dựng từ danh mục S08 và phát biểu toà/mã căn trên tin, trên khung chung có UPI neo toà; 3 dòng asset_nodes building chuyển sang toà; chủ đầu tư ghi ở cấp toà (Building.BuilderName)
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # Mạnh 07/11 «Build theo đề xuất» (qua giám sát)
decided_by: Mạnh 07/11 «Build theo đề xuất» — trả lời câu giám sát trình «Cổng Đáng DB1: build theo ngưỡng đề xuất?»
decided_at: 2026-11-06T22:01:20Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DB1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng DB1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/danh-ba-nha.md#b66f4e4c2d0531d41fd8d22ba7e7a1c74c771f11` · `onehub-invest-tri-thuc:wiki/chu-de/gan-can-s03.md#6c0cf105d554e17be3322218d457f5e33e85bc97` · `onehub-invest-tri-thuc:wiki/chu-de/lam-giau-nguoi-cho-danh-ba-nha.md#19dc1546ae9a9263e8f6dfe5095668361b510bb8` · `onehub-invest-tri-thuc:wiki/chu-de/mo-hinh-pipeline-mot-can-nha.md#ab7adc9c9461ebc62192c4f0fb261985a20f0907` — chưa có trang: trang đợt danh-ba-2910
Mốc: Việc đầu tiên sau 05/11: tin căn hộ S03 gắn được toà hoặc trục, diện tích suy ra hiện có nhãn, bắt đầu từ Ocean Park — chưa có ngày.

Danh bạ có toà · trục · căn cao tầng Ocean Park 1 và Grand Park dựng từ danh mục S08 và phát biểu toà/mã căn trên tin, trên khung chung có UPI neo toà; 3 dòng asset_nodes building chuyển sang toà; chủ đầu tư ghi ở cấp toà (Building.BuilderName)

Vì sao: ADR-0016 Đợt 1, điều kiện mở đã đạt (S08 có dòng Ocean Park 1). Mạnh 03/11: đây là định danh nhà, khoá chính để làm giàu, gồm cả căn off-market.

**Ai gặp, ở khâu nào** (đo trên DB máy thu, chỉ đọc, 07/11):
- Đội gắn nhãn và các hàng gắn căn S03 (PL20 → GC2 → GC3, DO2) không có chỗ để gắn. Danh mục hiện chỉ có 20 khu đô thị và
  3 toà (`asset_nodes`, cả 3 toà thuộc khu Grand Park). Chưa có bảng toà, trục, căn.
- Tin S03 chưa gắn căn nào: 3.117 tin ở B0, 1.568 tin ở B1 (tài liệu mô hình pipeline, 07/11).
- Vật liệu dựng đã có mà chưa dùng:
  - danh mục S08 của lát (DN1 đã nối 8 dự án vào hai khu): Ocean Park 1 có 3 dự án cao tầng, 332 mã căn khác nhau;
    Grand Park có 3 dự án cao tầng, 1.418 mã căn; mỗi dự án có 2 lần chụp;
  - phát biểu của bộ đọc luật trên tin: 22.313 phát biểu toà (`block_raw`), 5.851 phát biểu mã căn (`unit_number`);
  - khung chung của họ Người (`registry_aliases`, `registry_events`) đã có từ DB2b.
- Khó: mã căn S08 có nhiều khuôn khác nhau giữa các dự án (dạng `<toà>-<tầng>-<trục>`, `<toà>.<tầng>.<trục>`,
  `<toà><tầng>.<trục>`, chữ số dính liền không dấu phân cách…), nên tách toà · tầng · trục không làm được bằng một luật
  chung. Mã thật chỉ ở máy thu (luật 5).

Căn cứ đã chốt: tài liệu `docs/architecture/mo-hinh-pipeline-mot-can-nha.md` (Mạnh duyệt 07/11) §2.1, §2.2 và Q4 — lượt đầu
DB1 dựng khung toà/trục từ S08 + phát biểu toà, trục của bộ đọc luật, không chờ PL13; ADR-0016 §2–§6, §9, §10;
ADR-0013; spec `docs/superpowers/specs/2026-11-03-danh-ba-xac-nhan-toan-quoc-design.md` §5 (khung toà trước, căn sau).

## Giả định chốt sinh tử

| # | Giả định | Nếu sai thì | Phép thử rẻ nhất | Trạng thái |
|---|---|---|---|---|
| 1 | Mã căn S08 cao tầng của hai khu tách được toà · tầng · trục bằng luật xác định, mỗi khuôn mã một luật có tên | Phải nhập bảng tay theo dự án — đổi khuôn, timebox vỡ | Chạy bộ tách trên 1.750 mã, đếm % tách được và số khuôn | Chưa thử |
| 2 | Tên toà trong tin khớp được toà S08 qua bảng bí danh | Khung toà không ai trỏ vào; PL20 gắn được rất ít | Đếm phát biểu `block_raw` của tin hai khu khớp bí danh toà | Chưa thử |
| 3 | Dựng tất định: khoá đúc một lần, dựng lại theo bí danh ra cùng khoá | Mỗi lần dựng sinh khoá mới, tin đã gắn mất chỗ | Dựng hai lần trên DB thử, so số và khoá | Chưa thử |
| 4 | Dùng chung khung `registry_aliases`, `registry_events` với họ Người không làm vỡ danh bạ Người | Trang `/ops/people` lệch, phải tách bảng | Chạy ca đối chiếu danh bạ Người sau migration trên DB thử | Chưa thử |

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: Danh bạ toà · trục · căn cao tầng của Ocean Park 1 và Grand Park dựng từ S08 và phát biểu trên tin có ổn định qua nhiều lần dựng, đủ toà cho các hàng gắn căn, và không đúc căn không có bằng chứng không?
- Kết quả nào là SỐNG: [SUPERSEDED 2026-11-07 — Mạnh duyệt Cổng Phạm vi «duyệt», nhận Hỏi-1: ba dòng `asset_nodes` building là phân khu, giữ ở họ Vùng, toà S08 con trỏ cha phân khu; vế «3 dòng toà cũ đã sang bảng toà, khoá cũ giữ làm bí danh» thay bằng «3 dòng phân khu giữ nguyên, toà của chúng trỏ đúng phân khu» (AC-10)] Bản gốc: Dựng lại hai lần trên DB thử: số toà, trục, căn và khoá không đổi; 0 căn không có bằng chứng (mỗi khoá căn trỏ ít nhất một mã S08 hoặc phát biểu trên tin); mọi toà cao tầng của hai khu trong S08 có khoá toà và UPI; ít nhất 90% mã căn S08 cao tầng của hai khu tách được toà · tầng · trục, phần còn lại nằm trong sổ lý do; 3 dòng toà cũ ở `asset_nodes` đã sang bảng toà, khoá cũ giữ làm bí danh
- Kết quả nào là CHẾT: Dựng lần hai đổi số hay khoá; hoặc có căn đúc không bằng chứng; hoặc dưới 70% mã căn S08 tách được toà · tầng · trục (phải đổi sang nhập bảng tay)
- Timebox: một vòng T3, tối đa 3 lượt chấm; áp migration 082 lên DB máy thu là lời riêng của Mạnh sau Cổng Bằng chứng

## Kết quả prototype

Không dựng prototype — vòng đi thẳng từ hàng lộ trình; số đo nằm ở lượt chấm S4.

## Nguồn ngoài & phạm vi kế thừa

| Món vật liệu | Nguồn (đường dẫn/tên gói) | Phân loại | Kế thừa? | Người ký |
|---|---|---|---|---|
| Danh mục căn S08 (chỉ nội bộ, luật 5) | `stg_s08_inventory` ở DB máy thu | triết-lý/logic | có — làm hạt giống khung toà, trục, căn; không tái xuất nguyên văn | |
| RESO Data Dictionary 2.1, resource `Building` (`BuildingKey`, `BuildingName`, `BuilderName`) | `docs/research/reso-standards.md`, ADR-0013, ADR-0016 | triết-lý/logic | có | |

## Cổng 0

- **decision = build** Căn cứ: Mạnh 07/11 «Build theo đề xuất». Khuyến nghị đã trình: build — hàng nằm trên đường tới hạn tới căn S03 đầu tiên ở B2 (DB1 → PL20 → GC2 → GC3); Mạnh duyệt Q4 07/11 cho DB1 bắt đầu ngay, không chờ PL13.
- **disposition = —** Căn cứ: không có prototype.
- **Ngưỡng UAT chốt cùng lúc ký:** ba dòng SỐNG / CHẾT / Timebox ở trên, đã gỡ tiền tố theo lời Mạnh.

## Thước đo thành công → ứng viên criterion

- Dựng lại hai lần cho cùng số toà, trục, căn và cùng khoá → AC dựng tất định.
- 0 căn không có bằng chứng; ô khung chưa có bằng chứng không đúc khoá → AC không đúc căn rác.
- % mã căn S08 tách được toà · tầng · trục, kèm sổ lý do cho phần không tách → AC bộ tách mã có tên khuôn.
- Mọi toà có khoá `bld_` và UPI `urn:onehub:upi:1:VN:<tỉnh>:<khoá toà>` đúc một lần → AC UPI neo toà.
- 3 dòng toà cũ sang bảng toà, khoá cũ thành bí danh → AC chuyển `asset_nodes`.
- Chủ đầu tư là phát biểu cấp toà (`Building.BuilderName`), không cột viết tay → AC thuộc tính là phát biểu.
- Vật thể chỉ có từ S08 không rời máy thu → AC SPL/S08.

## Out of scope từ khám phá

- Thấp tầng, nhà phố, đất (ADR-0016 Đợt 2; spec §5: lát đầu chỉ làm cao tầng).
- Gắn tin vào toà/trục/căn — hàng PL20.
- Mã căn đầy đủ từ PL13 — bổ sung sau (Q4 07/11).
- Kéo `asset_nodes` xuống trục, căn — ADR-0016 §10 cấm.
- `properties` thành view trên danh bạ — Đợt 2.
- Đồng bộ lên cloud vật thể chỉ có từ S08 — ở lại máy thu (ADR-0016 §9).
- Áp 082 lên DB máy thu — lời riêng của Mạnh sau Cổng Bằng chứng.
