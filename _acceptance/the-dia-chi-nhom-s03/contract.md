---
schema_version: 1
feature: Người vận hành mở sổ nhóm trên Ops và thấy mỗi nhóm S03 có bài một thẻ địa chỉ — máy dựng nháp dự án (một hay danh sách ngắn), phường và tỉnh, phân khu mặc định, bán hay thuê kèm số bài làm căn cứ — rồi nhận, sửa hay bác từng thẻ; sổ đếm đủ 27/27 nhóm có thẻ
slug: the-dia-chi-nhom-s03
owner: phanlemanh@gmail.com
risk_tier: T3      # chạm db/migrations và app/src/app/api/v1/ops (t3_paths)
surfaces: [cli, data, ui]
status: draft
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-16-the-dia-chi-nhom-s03-design.md
---

# Acceptance Contract: the-dia-chi-nhom-s03

## Context

Hàng TG1 (lát l01, mốc MS1). Cổng Đáng: Mạnh «build, giữ ngưỡng đề xuất» 15/11. ROADMAP §3 mục 51: thẻ địa chỉ của nhóm là mặc
định cho tin của nhóm; đóng dấu lên tin là TG2. Bảng phủ ca (`discovery/bang-phu-ca.md`, DB máy thu, khoá thật): 27 nhóm có
bài, 13 nhóm sổ ghi đúng một dự án, 14 thiếu (9 chưa ghi, 3 nhiều dự án, 2 chưa có trong sổ). Migration 108 (GS cấp). Thẻ chỉ ở
máy thu. Luật «Ai quyết gì»: chữ ký Cổng Bằng chứng kèm lời áp 108 khi hồ sơ áp đủ năm thứ (AC-9).

## Acceptance Criteria

- **AC-1** Given DB thử đã áp mọi migration tới 107, When áp `db/migrations/108_the_dia_chi_nhom.sql` hai lần, Then lần hai
  không lỗi và lược đồ không đổi; có bảng `group_address_cards` và `group_address_card_history`; trigger từ chối dự án không
  phải nút `project`, phân khu không phải `subzone`/`building`, phường không phải cấp phường, quá 3 dự án; `pipeline/sync-cloud.mjs`
  không nhắc hai bảng.
- **AC-2** Given ma trận viết trước các nhóm giả (sổ một dự án · nhãn một tên · nhãn hai tên đều đủ ngưỡng · tên dưới ngưỡng ·
  tên không khớp nút · một dự án có phường · hai dự án cùng phường · phường theo tin ≥ 60% · phân khu đủ và thiếu · bán 90% ·
  thuê 85% · cả hai · dưới 5 bài đọc), When gọi hàm dựng nháp, Then mỗi ô ra đúng giá trị viết trước và mỗi ô có giá trị mang
  nguồn căn cứ cùng số bài căn cứ; ô trống mang số bài đã đọc.
- **AC-3** Given DB thử có các nhóm giả của năm lớp (một dự án trong sổ · chưa ghi · nhiều dự án · chưa có trong sổ · trong sổ
  không bài), When chạy lệnh dựng nháp, Then mọi nhóm thật có bài có đúng một thẻ `nhap` (nhóm chưa có trong sổ có thẻ với
  `unit_code` NULL), nhóm không bài không có thẻ; chạy lần hai không đổi dòng nào và không thêm lịch sử; thẻ `da_duyet`, `bac`
  không bị đổi; `collection_units`, `field_assertions`, `sale_offer_records` không đổi.
- **AC-4** Given thẻ nháp, When người vai ops gọi `card-decide` nhận, sửa rồi bác, Then mỗi lần `version` tăng một, một dòng
  lịch sử mang người, giờ, bản trước, bản sau, và một dòng `ops_audit` cùng giao dịch; bác không lý do → 400; `version` lệch →
  409 không ghi gì; viewer → 403; tham chiếu sai → 400 nêu ô.
- **AC-5** Given lưới «Nhóm S03» trên `/ops/sources` ở máy thu, When người vai ops mở trang, Then đầu lưới có «Thẻ địa chỉ:
  x/27 nhóm có thẻ · n chờ duyệt», mỗi hàng có badge trạng thái thẻ, nhóm chưa có trong sổ hiện ở cuối lưới; hộp «Duyệt thẻ»
  hiện bốn ô kèm dòng căn cứ; nhận, sửa, bác trên màn đổi badge và bộ đếm (ảnh chụp từng bước).
- **AC-6** Given trang `/ops/sources` và mọi phản hồi của route `source-groups`, When đếm khoá nhóm thật của các thẻ trong HTML
  và thân phản hồi, Then số chỗ khớp là 0 (chỉ mã sổ, mã thẻ); đối chứng chèn một khoá vào chuỗi đếm thì ra ≥ 1; lược đồ không
  có bảng thẻ (như cloud) thì khu thẻ không vẽ và trang không lỗi.
- **AC-7** Given bản chép DB máy thu, When áp 108 rồi chạy lệnh dựng nháp, Then số nhóm có thẻ bằng số nhóm thật có bài đếm độc
  lập (mốc 15/11: 27), chia đúng năm lớp của bảng phủ ca; lệnh in thời gian chạy; DB máy thu không đổi.
- **AC-8** Given 13 nhóm sổ ghi đúng một dự án trên bản chép DB máy thu, When dựng nháp CHỈ từ nhãn (bỏ qua sổ), Then in số nhóm
  nháp trùng dự án của sổ; đạt khi từ 9/13 — phép đo chất lượng nháp trước buổi duyệt.
- **AC-9** Given thư mục `ap-may-thu/` của hồ sơ, Then có đủ năm tệp (README thứ tự bước, sao lưu ra `~/onehub-backups/db/`, số
  chạy thử, tệp lùi, lệnh kiểm sau); tệp lùi chạy thật trên DB thử: hai bảng mất, áp lại 108 được.
- **AC-10** (judgment) Given hộp duyệt thẻ, When người duyệt đọc một thẻ nháp, Then đọc được mỗi ô lấy từ đâu và bao nhiêu bài
  làm căn cứ mà không cần mở DB; `CONTEXT.md` có thuật ngữ «Thẻ địa chỉ nhóm» với nhãn, mã, định nghĩa.

## Out of scope

- Đóng dấu thẻ lên tin lúc nạp và tính lại tin cũ khi sửa thẻ (TG2).
- Tiêu đề chuẩn hoá, mô tả nhóm (ON19); sửa sổ từ cloud (ON20). RM2 (mục đích nhóm) gom vào ô bán/thuê của thẻ.
- Gọi model đọc thêm bài để tăng căn cứ.
- Đưa thẻ lên cloud (cần lời riêng).
- Ghi thẻ đã duyệt vào `collection_units.project_node_ids` (Hỏi-2).

## Coverage

- Trục lớp nhóm: sổ một dự án · chưa ghi · nhiều dự án · chưa có trong sổ · trong sổ không bài [thước CE: bảng phủ ca đếm trên
  DB máy thu, `discovery/bang-phu-ca.md`] — AC-3, AC-7.
- Trục ô của thẻ: dự án · phường + tỉnh · phân khu · bán/thuê, mỗi ô có / trống [thước CE: cau_giao TG1] — AC-2, AC-10.
- Trục hành động: dựng nháp · nhận · sửa · bác · mở lại thẻ đã duyệt [thước CE: cau_giao TG1 «nhận, sửa hay bác»] — AC-3, AC-4, AC-5.
- Trục mặt: máy thu · lược đồ không có bảng (cloud) · vai ops / viewer [thước CE: ADR-0007 tầng A, portals.md] — AC-4, AC-6.
- Trục áp: áp · chạy thử · lùi [thước CE: AGENTS.md «Ai quyết gì»] — AC-1, AC-7, AC-9.

## Đường đo

- Nhóm có thẻ / nhóm có bài (ngưỡng SỐNG 27/27): lệnh dựng nháp `--dem` đếm trên DB máy thu — AC-7.
- Tỉ lệ nháp nhận nguyên hoặc sửa một ô (ngưỡng ≥ 70%): đọc từ `group_address_card_history` sau buổi duyệt — AC-4 bảo đảm mỗi
  lần nhận/sửa ghi bản trước và bản sau.
- Thời gian buổi duyệt (≤ 2 giờ): `decided_at` đầu và cuối trong lịch sử — AC-4.

## Notes

- Ra khỏi kho: áp 108 lên DB máy thu đi cùng chữ ký Cổng Bằng chứng; buổi duyệt 14 thẻ là việc của Mạnh hoặc đội vận hành.
