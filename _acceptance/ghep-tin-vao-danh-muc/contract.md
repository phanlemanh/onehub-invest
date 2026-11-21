---
schema_version: 1
feature: Tin căn hộ S03 của Ocean Park 1 và Grand Park được gắn vào toà của Danh bạ, hoặc phân khu, cụm khi bài chỉ nêu tới đó, từ ô tên toà, chữ bài và bản đọc của model, mỗi nhóm nguồn có căn cứ và tắt riêng được; người đọc phía sau lấy toà của tin từ một view
slug: ghep-tin-vao-danh-muc
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, data]
status: approved
approved_by: Mạnh
approved_at: 2026-11-18
design_doc: docs/superpowers/specs/2026-11-18-ghep-tin-vao-danh-muc-design.md
---

# Acceptance Contract: ghep-tin-vao-danh-muc

## Context

Hàng PL20, nhịp toà của mốc MS3. Hôm nay 0 tin S03 gắn toà. Cổng Đáng: Mạnh «Làm cả ba» 12/11; phạm vi trục, căn trong
`opportunity.md` đã chuyển sang PL36 ngày 14/11. Ở Cổng Phạm vi ngày 18/11 Mạnh không nhận ngưỡng 40% và chốt «Làm cả hai đợt»: đợt 1 gắn từ dữ liệu sẵn có, đợt 2 cho
model đọc bù. Hạng T3 vì có migration 117. Mọi số đo: design doc §2, đếm trên DB máy thu ngày 18/11.

## Acceptance Criteria

- **AC-1** (ma trận ô tên toà) Given ma trận viết trước gồm khớp đúng một toà · khớp sau chuẩn hoá cách viết · khớp nhiều toà · khớp một vùng · tên ngoài danh
  bạ · ô khớp một toà nhưng chữ bài nêu hai toà · ô khớp một toà nhưng model báo bài rao nhiều căn, When chạy hàm gắn, Then ra đúng toà nguồn A · đúng toà nguồn B · không gắn `mo-ho` · đúng vùng · không gắn `ngoai-danh-ba` · không gắn `chu-nhieu-toa` ·
  không gắn `bai-nhieu-can`, một assert mỗi ô; `mo-ho` và `ngoai-danh-ba` không rơi xuống đọc chữ bài. Chiều đỏ: cho ô `mo-ho` chọn toà đầu tiên thì ca đỏ, thông điệp ghim tên ô.
- **AC-2** (đúng dự án) Given mã toà trùng giữa hai dự án (S1 ở OP1 và GP) và tin thuộc khu khác, tin chưa có dự án, tin không phải căn
  hộ, When chạy hàm gắn, Then mã chỉ khớp toà của dự án của tin, và ba loại tin còn lại sinh 0 phát biểu.
- **AC-3** (chữ bài và bản đọc của model) Given ô tên toà rỗng và ma trận luật đọc chữ × bản đọc: cùng một toà · khác toà · luật đọc được, model chưa đọc · luật không đọc được, model
  nêu một toà có tên trong đoạn trích · model nêu một toà nhưng tên không nằm trong đoạn trích · cùng một vùng · model một mình nêu một vùng có tên trong đoạn trích, When chạy hàm gắn, Then ra nguồn C · không gắn `chu-model-khac` · không gắn `chi-luat` · nguồn D ·
  không gắn `trich-khong-co-ten` · nguồn F · nguồn G. Bản đọc có căn cứ khác `chu_bai` hoặc đoạn trích chưa kiểm thì coi như model chưa đọc. Chiều đỏ: bản đột biến nhận căn cứ «kiến thức nghề» hoặc bỏ phép kiểm tên trong đoạn trích thì ca đỏ,
  thông điệp ghim mã bài.
- **AC-4** (khuôn phát biểu, cross-layer) Given migration 117 áp trên bản chép đã có 113, When ghi phát biểu, Then mức toà ghi
  `universal_property_id` = `buildings.upi`, mức vùng ghi `subzone_node_id`, lớp `inferred`, đúng cặp `rule_id` và phương pháp của từng nguồn theo design doc §3, có căn cứ; dòng dùng bản đọc của model
  mang `label_id` và đoạn trích; bốn trường của 113 vẫn ghi được. Chiều đỏ: giá trị không phải UPI của toà đang hoạt động, hoặc trường này trên resource khác `Property`, thì DB từ chối.
- **AC-5** (0 tin gắn hai nơi, cross-layer) Given ma trận tin nhiều bài: hai toà khác nhau · toà và vùng chứa nó · toà và vùng không
  chứa nó · hai vùng không lồng nhau · hai nguồn cùng một toà, When đọc `offer_building`, Then ô thứ hai và ô thứ năm ra mức toà, ba ô còn lại ra `status = 'xung_dot'`, không có nơi
  gắn và không được tính là đã gắn; view chỉ đọc dòng của bốn `rule_id` của hàng. Trên bản chép DB máy thu, lệnh in số tin `xung_dot` và số này không vượt **1%** số tin đã gắn (đo trước: 0,67%).
- **AC-6** (chạy lại, đổi dữ liệu, tắt nguồn) Given đã chạy một lượt, When chạy lại không đổi gì, Then 0 chèn, 0 rút; When ô tên toà đổi sang toà khác, ô về rỗng, tin đổi dự án, toà bị gộp hoặc ngừng hoạt
  động, bản đọc mới của model tới, Then dòng cũ bị rút, chỉ chèn dòng mới khi còn gắn được, bài có nhiều nhất một dòng sống mỗi trường; When tắt một nguồn, Then lượt kế rút hết dòng của đúng nguồn đó, dòng của nguồn khác không đổi.
- **AC-7** (không phá lượt nạp) Given bản chép DB máy thu, When chạy lượt nạp có bước gắn, Then `offer_project` không đổi ở tin nào, không tệp
  snapshot nào đổi (gốc snapshot lấy từ cấu hình, số tệp lớn hơn 0), bài thử bị loại qua `loadStgPosts`, bước gắn chạy trong giao dịch riêng
  sau khi lượt nạp đã ghi và xong trong **60 giây**. Thiếu migration 117, hoặc bước gắn lỗi khi ghi: in đúng một dòng `JOB WARN [ghep-toa]`, số bài nạp bằng đối chứng
  không có bước gắn, lượt nạp vẫn thoát 0.
- **AC-8** (số trên màn) Given bản chép DB máy thu sau hai lượt đọc bù, với nguồn A, B, C, F đang bật, When chạy bước gắn, Then số tin căn hộ S03 gắn được toà, phân khu, cụm đổi từ 0 lên **từ 50%** mẫu số toàn bộ tin căn hộ S03 (đích của MS3; đo sau lượt đọc bù đầu với D, G tắt: 49,2%; ước sau lượt đọc thêm: 51,8%), và lệch không quá **0,5% tử số** so với phép đếm độc lập: bản viết lại luật từ design doc §3 do một tác tử khác viết, không nhập hàm gắn; cấy dòng của `rule_id` khác thì tử số không đổi. Lệnh in tử số, mẫu số,
  tách theo khu, mức gắn, nguồn, và số trước, sau từng lượt đọc bù.
- **AC-9** (chất lượng) Given đầu ra máy đã đóng băng có băm lúc rút mẫu (bài, nút, nguồn), lát `hai-khu-ghep-b` không điền nháp, When chấm hai nhóm rút ngẫu nhiên theo tin từ chính các tin máy gắn sau hai lượt đọc bù: **N1** nguồn A, B · **N2** nguồn C, F, mỗi nhóm **110 bài**, Then cận dưới Wilson 95% của độ đúng từ **0,95** ở **từng nhóm**, với luật quy nhãn người về nút theo design doc §4;
  lệnh tính lại từ nhãn thô và đỏ khi số lệch báo cáo, khi đầu ra của mã cuối khác bản đóng băng trên bài nào trong mẫu, hoặc khi chưa đủ cỡ mẫu. N1, N2 phải đạt. Nguồn D, G (chỉ có model) **tắt** ở hàng này theo lựa chọn của Mạnh ngày 18/11. Báo cáo tách riêng từng nguồn, mức toà với mức vùng, và theo khu. Hụt ngưỡng: không chỉnh luật rồi chấm lại trên tập này; lối ra theo câu hỏi đã chốt ở Cổng Phạm vi.
- **AC-10** (đọc bù của đợt 2) Given DB máy thu, When lập danh sách, Then **lượt 1** gồm đúng các tin OP1, GP chưa gắn và chưa có bản đọc `dg3-s03-v3`, mỗi tin một bài; **lượt 2** gồm các tin OP1, GP chưa gắn có bài mà luật đọc ra toà hay vùng nhưng chính bài đó chưa có bản đọc, mỗi tin một bài; không bài thử; mỗi danh sách được đóng băng có băm trước lời gọi đầu. When chạy đọc bù trên DB máy thu, Then tổng tiền thật của hai lượt cộng từ `silver_labels` theo `run_id` không vượt **5 USD**, mọi dòng mang `run_id` đó thuộc đúng danh sách đóng băng, chạy lại không gọi lại bài đã đọc. Chiều đỏ: cấy một bài thử hoặc một tin đã gắn vào danh sách thì lệnh kiểm thoát 1, thông điệp ghim mã bài.

## Coverage

Trục và ô lấy từ bảng phủ ca của design doc §2, số đếm thật trên DB máy thu.

- **Trục khu**: OP1 · GP · khu khác · chưa có dự án (AC-1, AC-2).
- **Trục ô tên toà**: khớp đúng · khớp sau chuẩn hoá · nhiều toà · vùng · ngoài danh bạ · rỗng (AC-1, AC-3).
- **Trục bài nhiều căn, nhiều toà**: chữ nêu hai toà · model báo nhiều căn · bài một căn (AC-1).
- **Trục chữ bài × bản đọc của model**: cùng kết quả · khác kết quả · chỉ luật · chỉ model có tên trong đoạn trích · chỉ model không có tên · căn cứ không được nhận (AC-3).
- **Trục loại nhà**: căn hộ · loại khác (AC-2).
- **Trục nhiều bài trên một tin**: cùng toà · hai toà · toà và vùng chứa nó · toà và vùng khác · hai vùng · hai nguồn cùng toà (AC-5).
- **Trục lượt chạy**: lần đầu · chạy lại · dữ liệu đổi · bản đọc mới · tắt nguồn · thiếu migration · lỗi khi ghi (AC-6, AC-7).
- **Trục đọc bù**: tin cần đọc · tin đã gắn · tin đã đọc · bài thử · chạm trần tiền · chạy lại (AC-10).
- **Ô bỏ**: nguồn D, G viết sẵn và có test nhưng tắt, vì chỉ có 81 tin, không đủ cỡ mẫu 110 bài; dự án khác OP1, GP và tin chưa có dự án không gắn, vì chưa có tập nhãn cho các dự án này; tin chỉ có luật đọc chữ mà model chưa xác nhận không gắn, vì hai bên chỉ đồng ý 83–91% trên nhóm tin khó.

## Đường đo

| Thước | Số từ đâu | AC bảo đảm |
|---|---|---|
| Tin căn hộ S03 gắn toà, phân khu, cụm | `offer_building` trên mẫu số tin căn hộ S03 | AC-8 |
| 0 tin gắn hai toà | `offer_building` đếm `status = 'xung_dot'` tách khỏi số đã gắn | AC-5 |
| Cận dưới Wilson của từng nhóm nguồn | đầu ra đóng băng và nhãn người của lát `hai-khu-ghep-b` | AC-9 |
| Chạy lại không đổi | số chèn, số rút của lượt thứ hai | AC-6 |
| Tiền đọc bù | `silver_labels.cost_usd` theo `run_id` | AC-10 |

## Out of scope

- Gắn trục, căn và suy tầng từ mã căn (PL36).
- Gắn tin của các dự án ngoài OP1, GP; tách dự án con để gỡ tin mơ hồ (DA38).
- Lấp tên toà còn thiếu trong danh bạ (160 tin có ô tên toà ngoài danh bạ).
- Sửa lỗi nháp nhãn của PL35 (`P4-208`).
- Đưa toà của tin lên cloud hay cổng Invest.

## Notes

- Lệnh đo của các eval nằm ở `_acceptance/ghep-tin-vao-danh-muc/probes/*.sh`; `_acceptance/config.yaml` là tệp bảo vệ, không sửa (P4-209).
- PR gộp SAU DA40 (migration 113). Chạm `pipeline/mappings.yaml`, ba tệp vocab và `CONTEXT.md` chỉ sau khi DA40 vào main. Số migration do giám sát giữ.
- AC-8, AC-9 chỉ đo được sau lượt đọc bù và buổi gắn nhãn người trên `/ops/labels`: 220 bài, khoảng 11 giờ theo nhịp 3 phút mỗi bài trên màn 17 ô hiện tại. Một nhóm gặp lỗi thứ hai thì dừng gắn nhãn nhóm đó.
- Các lượt ghi lên DB máy thu trước khi PR gộp, do giám sát chạy, chữ ký Cổng Phạm vi và lời chọn phương án 1 của Mạnh phủ đúng các lượt này: hai lượt đọc bù (`silver_labels`, `ai_calls`, tổng trần 5 USD) và nạp lát `hai-khu-ghep-b` (`eval_label_items`).
- Lộ trình ghi «tập test đóng băng của PL35»; hàng này chấm trên lát mới vì lát PL35 chia đều theo tầng, trong 159 mục máy gắn chỉ 13% thuộc Grand Park, trong khi Grand Park chiếm 63% số tin máy gắn.
- Ngưỡng UAT trong `opportunity.md` còn ghi «gắn trục» theo phạm vi cũ; ngưỡng mới chốt ở Cổng Phạm vi.
- **Cách gắn lát `hai-khu-ghep-b` đổi giữa chừng (giới hạn đã biết của AC-9).** Theo lời Mạnh ở phiên gắn nhãn (21:17:58Z «Vậy em ghi đúng thử anh nhìn», 21:23:04Z «Bạn điền sẵn tôi kiểm tra», 20/11), từ thẻ #12223 trợ lý gắn nhãn đọc chữ bài, ảnh, danh bạ và thẻ địa chỉ nhóm rồi gõ ô Toà và ô Phân khu vào biểu mẫu; Mạnh kiểm và tự bấm lưu. Trợ lý không đọc tệp đóng băng, cột `ghep` hay đầu ra đường ống; cột `draft` trong DB vẫn rỗng; mỗi thẻ có dòng «đề xuất / Mạnh lưu / Mạnh sửa» ở `research-local/gan-nhan-nhap-hai-khu-ghep-b.csv`. Hệ quả: «không điền nháp» vẫn đúng ở DB, nhưng nhãn từ thẻ ấy là người duyệt nháp của trợ lý chứ không phải người gắn độc lập; nhóm n2 (nguồn C, F đọc chữ bài bằng model) có rủi ro trợ lý và bộ đọc sai cùng hướng. Khâu chấm in thêm tỉ lệ thẻ «Mạnh sửa» theo nhóm; mục này lên Cổng Bằng chứng để Mạnh định tuyến.
  - Mạnh đã chọn không có mẫu gắn độc lập: hỏi «chừa 1 trong 5 thẻ n2 gắn không nháp», Mạnh trả lời ở phiên gắn nhãn lúc 2026-11-20T23:59:18Z, nguyên văn «Không, như n1». Cả hai nhóm n1, n2 đều là «người duyệt nháp của trợ lý»; Mạnh biết giới hạn này và chọn nó. Thẻ Cổng Bằng chứng đưa nguyên như vậy, không đề xuất lại mẫu mù.
  - Nhóm n2 đổi tiếp sang «trợ lý gắn, Mạnh duyệt theo lô». Lời Mạnh ở phiên gắn nhãn: 00:07:58Z 21/11 «…ở những nhãn bạn tỷ lệ tin cậy cao bạn có thể gắn sẵn tất cả. Những nhãn sự chắc chắn bạn không cao tôi sẽ hỗ trợ bạn…», và 00:08:56Z «Duyệt theo lô». Trợ lý gắn các thẻ nó chắc chắn, Mạnh duyệt mỗi lô 10 thẻ; thẻ không chắc thì Mạnh quyết từng thẻ. Trợ lý đã bấm Lưu một số thẻ TRƯỚC khi có lời duyệt lô (ít nhất #12209–#12212, lúc 00:10:17–00:10:35Z); GS đã yêu cầu quay về «duyệt lô trước rồi mới lưu». Nhãn n2 vì thế độc lập yếu hơn n1, và đúng ở nhóm mà máy đọc chữ bài bằng model. Khâu chấm tách số n2 theo ba loại thẻ: Mạnh quyết từng thẻ · duyệt lô trước khi lưu · lưu trước, duyệt hồi tố. Cột phân loại lấy từ sổ của phiên gắn nhãn và `eval_labels.labeled_at`. Cổng Bằng chứng có một mục để Mạnh định tuyến: AC-9 nhóm n2 được tính là bằng chứng người, hay phải ghi là bằng chứng của model lớn có người duyệt.
