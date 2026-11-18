---
schema_version: 1
feature: Tin căn hộ S03 của Ocean Park 1 và Grand Park được gắn vào toà của Danh bạ, hoặc phân khu, cụm khi bài chỉ nêu tới đó, bằng một phát biểu trường toà có căn cứ; người đọc phía sau lấy toà của tin từ một view
slug: ghep-tin-vao-danh-muc
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, data]
status: draft
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-18-ghep-tin-vao-danh-muc-design.md
---

# Acceptance Contract: ghep-tin-vao-danh-muc

## Context

Hàng PL20, nhịp toà của mốc MS3. Hôm nay 0 tin S03 gắn toà. Cổng Đáng: Mạnh «Làm cả ba» 12/11; phạm vi trục, căn trong
`opportunity.md` đã chuyển sang PL36 ngày 14/11, phạm vi mới chốt ở Cổng Phạm vi này. Hạng T3 vì có migration 117. Mọi số đo:
design doc §2, đếm trên DB máy thu ngày 18/11.

## Acceptance Criteria

- **AC-1** (ma trận cột toà) Given ma trận viết trước gồm khớp một toà · khớp nhiều toà · khớp một nút phân khu, cụm · tên ngoài danh
  bạ, When chạy hàm gắn, Then ra đúng toà · không gắn lý do `mo-ho` · đúng nút · không gắn lý do `ngoai-danh-ba`, một assert mỗi ô.
  Chiều đỏ: cho ô `mo-ho` chọn toà đầu tiên thì ca đỏ, thông điệp ghim tên ô.
- **AC-2** (đúng dự án) Given mã toà trùng giữa hai dự án (S1 ở OP1 và GP) và tin thuộc khu khác, tin chưa có dự án, tin không phải căn
  hộ, When chạy hàm gắn, Then mã chỉ khớp toà của dự án của tin, và ba loại tin còn lại sinh 0 phát biểu.
- **AC-3** (chỉ đọc cột toà, theo khuyến nghị Hỏi-1) Given tin có cột toà rỗng hoặc ngoài danh bạ mà chữ bài nêu tên một toà của danh bạ,
  When chạy hàm gắn, Then không gắn và ghi lý do `khong-cot` hoặc `ngoai-danh-ba`. Chiều đỏ: bản đột biến đọc chữ bài thì ca đỏ, thông điệp
  ghim mã bài.
- **AC-4** (khuôn phát biểu, cross-layer) Given migration 117 áp trên bản chép đã có 113, When ghi phát biểu, Then mức toà ghi
  `universal_property_id` = `buildings.upi`, mức phân khu, cụm ghi `subzone_node_id`, cùng `rule_id = 'ghep-toa-danh-ba'`, lớp `inferred`,
  phương pháp `e1_rule`, có căn cứ; bốn trường của 113 vẫn ghi được. Chiều đỏ: giá trị không phải UPI của toà đang hoạt động, hoặc
  trường này trên resource khác `Property`, thì DB từ chối.
- **AC-5** (0 tin gắn hai nơi, cross-layer) Given ma trận tin nhiều bài: hai toà khác nhau · toà và phân khu chứa nó · toà và phân khu không
  chứa nó · hai phân khu khác nhau, When đọc `offer_building`, Then ô thứ hai ra mức toà, ba ô còn lại ra `status = 'xung_dot'`, không có nơi
  gắn và không được tính là đã gắn; view chỉ đọc dòng của `rule_id = 'ghep-toa-danh-ba'`. Trên bản chép DB máy thu, lệnh in số tin `xung_dot` và
  số này không vượt **1%** số tin đã gắn (đo trước: 9 tin nhiều bài ghi hai tên toà).
- **AC-6** (chạy lại, đổi dữ liệu) Given đã chạy một lượt, When chạy lại không đổi gì, Then 0 chèn, 0 rút; When cột toà đổi sang toà khác, cột
  về rỗng, tin đổi dự án, toà bị gộp hoặc ngừng hoạt động, Then dòng cũ bị rút, chỉ chèn dòng mới khi còn gắn được, bài có nhiều nhất một dòng sống.
- **AC-7** (không phá lượt nạp) Given bản chép DB máy thu, When chạy lượt nạp có bước gắn, Then `offer_project` không đổi ở tin nào, không tệp
  snapshot nào đổi (gốc snapshot lấy từ cấu hình, số tệp lớn hơn 0), bài thử bị loại qua `loadStgPosts`, bước gắn chạy trong giao dịch riêng
  sau khi lượt nạp đã ghi và xong trong **60 giây**. Thiếu migration 117, hoặc bước gắn lỗi khi ghi: in đúng một dòng, số bài nạp bằng đối chứng
  không có bước gắn, lượt nạp vẫn thoát 0.
- **AC-8** (số trên màn) Given bản chép DB máy thu, When chạy bước gắn, Then số tin căn hộ S03 gắn được toà, phân khu, cụm đổi từ 0 lên đạt
  **ngưỡng chốt ở Cổng Phạm vi (đề xuất 40%, trần đo được 43,8%)**, và lệch không quá **0,5%** so với phép đếm độc lập đi thẳng từ `block_raw`
  và tên trong danh bạ, không gọi hàm gắn; cấy dòng của `rule_id` khác thì tử số không đổi. Lệnh in tử số, mẫu số, tách theo khu và mức gắn.
- **AC-9** (chất lượng) Given luật gắn đã commit trước nhãn người đầu tiên của lát `hai-khu-ghep`, cỡ mẫu **chốt ở Cổng Phạm vi (đề xuất 110
  bài máy gắn)** trước buổi gắn nhãn, và tập đóng băng có băm, When chấm các bài máy gắn, Then cận dưới Wilson 95% của độ đúng từ **0,95** trên
  tập gộp; lệnh tính lại từ nhãn thô và đỏ khi số lệch báo cáo, khi commit luật muộn hơn nhãn đầu tiên, hoặc khi chưa đủ cỡ mẫu. Báo cáo tách
  riêng mức toà với mức phân khu, cụm, và theo khu. Hụt ngưỡng: không chỉnh luật rồi chấm lại trên tập này; lối ra theo Hỏi-3.

## Coverage

Trục và ô lấy từ bảng phủ ca của design doc §2, số đếm thật trên DB máy thu.

- **Trục khu**: OP1 · GP · khu khác · chưa có dự án (AC-1, AC-2).
- **Trục cột toà**: một toà · nhiều toà · phân khu, cụm · ngoài danh bạ · rỗng (AC-1, AC-3).
- **Trục chữ bài khi cột rỗng**: có nêu toà · không nêu, đều không gắn ở lát này (AC-3).
- **Trục loại nhà**: căn hộ · loại khác (AC-2).
- **Trục nhiều bài trên một tin**: cùng toà · hai toà · toà và phân khu chứa nó · toà và phân khu khác · hai phân khu (AC-5).
- **Trục lượt chạy**: lần đầu · chạy lại · dữ liệu đổi · thiếu migration · lỗi khi ghi (AC-6, AC-7).
- **Ô bỏ**: khu khác và chưa có dự án không gắn, vì danh bạ toà các dự án còn lại thuộc lát L4; 573 tin chỉ nêu toà trong chữ bài chờ Hỏi-1.

## Đường đo

| Thước | Số từ đâu | AC bảo đảm |
|---|---|---|
| Tin căn hộ S03 gắn toà, phân khu, cụm | `offer_building` trên mẫu số tin căn hộ S03 | AC-8 |
| 0 tin gắn hai toà | `offer_building` đếm `status = 'xung_dot'` tách khỏi số đã gắn | AC-5 |
| Cận dưới Wilson của gắn toà | tập đóng băng lát `hai-khu-ghep` | AC-9 |
| Chạy lại không đổi | số chèn, số rút của lượt thứ hai | AC-6 |

## Out of scope

- Gắn trục, căn và suy tầng từ mã căn (PL36).
- Danh bạ toà của các dự án ngoài OP1, GP (lát L4); tách dự án con để gỡ tin mơ hồ (DA38).
- Sửa lỗi nháp nhãn của PL35 (`P4-208`).
- Đọc toà từ chữ bài (theo khuyến nghị Hỏi-1, để hàng sau khi có tập nhãn riêng cho nguồn này).
- Đưa toà của tin lên cloud hay cổng Invest.

## Notes

- Lệnh đo của các eval nằm ở `_acceptance/ghep-tin-vao-danh-muc/probes/*.sh`; `_acceptance/config.yaml` là tệp bảo vệ, không sửa (P4-209).
- PR gộp SAU DA40 (migration 113). Chạm `pipeline/mappings.yaml`, ba tệp vocab và `CONTEXT.md` chỉ sau khi DA40 vào main.
- AC-9 chỉ đo được sau buổi gắn nhãn người trên `/ops/labels`.
- Giới hạn của AC-9: màn gắn nhãn điền sẵn nháp của model (nếp Mạnh chốt 06/11), nên người gắn có thể bị nháp dẫn dắt; nháp độc lập với bộ gắn của
  hàng này (PL35 AC-7), và 117 mục không có nháp được gắn từ ô trống.
- Ngưỡng UAT trong `opportunity.md` còn ghi «gắn trục» theo phạm vi cũ; ngưỡng mới chốt ở Hỏi-3.
