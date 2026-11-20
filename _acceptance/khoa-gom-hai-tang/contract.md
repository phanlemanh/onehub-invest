---
schema_version: 1
feature: "Bộ đọc S03 gom bài thành tin theo hai tầng: bài cùng người, cùng chữ chuẩn hoá thành một bản chữ; các bản chữ chỉ gộp khi khớp người, loại, số phòng, diện tích, phân khu và mã toà/căn; bộ tìm mã nhận chữ thường và 1–4 chữ số"
slug: khoa-gom-hai-tang
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, data]
status: approved
approved_by: Mạnh
approved_at: 2026-11-20
design_doc: docs/superpowers/specs/2026-11-19-khoa-gom-hai-tang-design.md
---

# Acceptance Contract: khoa-gom-hai-tang

## Context

Hàng GT5 của mốc MS4 «Một căn là một dòng». Cổng Đáng: Mạnh «Làm cả năm» (18/11 23:13Z). Quyết định nền ROADMAP §3 mục 41: hai môi
giới cùng căn là hai tin (Q1), đổi giá là GT6 (Q2), rổ và quảng cáo là GT8 (Q3), model không vào khoá gom (Q4). Hạng T3 theo lộ trình:
thành phần tin và `offer_id` đổi. Máy suy theo `t3_paths` ra T2 vì hàng không có migration; giữ T3 của lộ trình. Số đếm: bảng phủ ca
`discovery/bang-phu-ca.md`, DB máy thu ngày 19/11, 7.307 tin S03 đang sống.

## Acceptance Criteria

- **AC-1** (công tắc) Given bản chép DB máy thu, When chạy bước gom với công tắc `ops_audit` `gom-tin:hai-tang` vắng hoặc dòng mới nhất
  `detail.bat = false`, Then thành phần tin (băm tập `post_ids` mỗi `offer_id`) giống hệt đường chuẩn chạy từ sha `main` (ghi trong báo cáo) trên cùng bản chép; When dòng mới nhất `bat = true`,
  Then dùng khoá hai tầng. Chiều đỏ: bản đột biến đọc công tắc theo dòng cũ nhất, và bản đột biến cho bộ tìm mã mới chạy cả khi tắt, mỗi bản làm ca đỏ, thông điệp
  ghim mã dòng công tắc hay `offer_id` lệch.
- **AC-2** (tầng một — bản chữ) Given ma trận bài: cùng người cùng chữ chuẩn hoá · cùng người khác SĐT, URL trong chữ · cùng người chữ khác ·
  khác người cùng chữ · không `sender_id` có SĐT · không `sender_id` không SĐT, When dựng bản chữ, Then ra một · một · hai · hai · theo SĐT ·
  mỗi bài một bản chữ riêng, một assert mỗi ô.
- **AC-3** (tầng hai — khoá có người) Given hai bản chữ khác nhau ở đúng một trường trong người · loại · giá · số phòng · diện tích · tập
  phân khu · tập mã, cả ở nhánh đủ phường và diện tích, When gom, Then mỗi ô ra hai tin; hai bản chữ khớp đủ bảy trường ra một tin. Chiều đỏ:
  bỏ người khỏi nhánh đủ phường và diện tích (khoá cũ) thì ô khác người đỏ, thông điệp ghim tên trường.
- **AC-4** (bản chữ thiếu trường) Given bản chữ thiếu số phòng, diện tích, phân khu hay mã, When gom, Then nhập vào tin cùng người khi trong
  cửa sổ 7 ngày có đúng một tin ứng viên khớp mọi trường nó có và chữ giống từ 0,3; không ứng viên, từ hai ứng viên, ngoài cửa sổ, chữ giống
  dưới ngưỡng thì thành tin riêng; bản chữ thiếu trường không nối hai tin đầy đủ thành một (không bắc cầu). Bản chữ cùng người, cùng loại,
  cùng giá, thiếu ĐÚNG cùng các trường, các trường có mặt bằng nhau, có cặp bài trong 7 ngày và chữ giống từ 0,3 thì chung tin (Hỏi-6 lối
  B); khác tập trường thiếu, khác một trường có mặt, ngoài cửa sổ, dưới ngưỡng, không người đăng thì tin riêng. Một assert mỗi ô.
- **AC-5** (phân khu không bao giờ chung tin, cross-layer) Given tập phân khu đọc từ chữ bài theo tên, bí danh của nút con dự án trong danh
  bạ và bảng viết tắt chốt ở Cổng Phạm vi, When hai bản chữ có tập phân khu khác nhau và cả hai không rỗng, Then không chung tin ở mọi nhánh
  khoá. Danh sách `offer_id` của 12 tin khác phân khu theo tên danh bạ và 160 tin theo viết tắt được đóng băng có băm trước khi viết mã; trên
  bản chép DB máy thu với công tắc bật, mỗi tin trong danh sách tách thành ít nhất hai tin, một assert mỗi tin, và lệnh đỏ khi bộ đọc trả
  tập phân khu rỗng cho bài nào trong danh sách (thông điệp ghim chữ viết tắt). Chiều đỏ: cấy một tin hai phân khu vào bản sao thì lệnh thoát 1, thông điệp ghim `offer_id`.
- **AC-6** (bộ tìm mã) Given ma trận viết trước: chữ hoa · chữ thường · 1, 2, 3, 4 chữ số · đuôi `.03`, `-1203`, `xx13` · mã tin môi giới 2–4
  chữ và 4–6 số · nhiễu `t<số>`, `m2`, `pn`, `wc`, `coc`, `ocp`, `gd`, `x<số>`, When đọc mã, Then ô mã ra đúng mã viết hoa, ô nhiễu ra rỗng, một
  assert mỗi ô; hai cách viết hoa thường của một mã chung tin. Chiều đỏ: bỏ danh sách nhiễu thì ô nhiễu đỏ, thông điệp ghim chuỗi.
- **AC-7** (`offer_id` có đường nối, cross-layer) Given bản chép DB máy thu, When bật công tắc và chạy lượt nạp, Then tin mới thừa kế `offer_id`
  của tin cũ có nhiều bài chung nhất (PL14); tin cũ không còn bài nào nghỉ với `superseded_by` trỏ tin nhận nhiều bài của nó nhất; lệnh kiểm in
  0 `offer_id` cũ không có đường nối và xuất bảng đổi theo bài (`post_id`, `offer_id` cũ, `offer_id` mới). Tắt công tắc lại thì tin quay về
  khoá cũ, cũng không mất đường nối. Chiều đỏ: xoá `superseded_by` của một tin nghỉ ở bản sao thì lệnh thoát 1, thông điệp ghim `offer_id`.
- **AC-8** (dạng bài) Given bài có nhãn dạng bài của GT8 khác `mot_can`, When gom với công tắc bật, Then bài đó không gộp với bài khác; bài không
  có nhãn hoặc nhãn `mot_can` gom như AC-2 tới AC-6. Model không vào khoá: khoá chỉ đọc chữ bài, người đăng, danh bạ.
- **AC-9** (chất lượng) Given thước nền 120 nhãn audit 09–10/11 và mẫu giữ riêng chốt ở Cổng Phạm vi, When chạy khoá mới, Then
  gộp nhầm (đơn vị: tin nhiều bản chữ có nhãn cùng hoặc khác căn, ước lượng điểm, n từ 60) dưới **5%** trên **mẫu giữ riêng ba**, nhóm
  cùng căn (nhãn đồng thuận hai model) bị tách thành từ hai tin **≤ 35%** trên mẫu ba, tách nhầm trên 40 cặp không tăng so với khoá cũ.
  Mẫu ba tách rời mẫu một và hai, đóng băng có băm trước khi chấm, chấm một lần; số của mẫu một và hai là số đã nhìn (Hỏi-6). Lệnh in số trước, sau, cận
  Wilson 95% của từng thước, tính lại từ nhãn thô và đỏ khi số lệch báo cáo, khi n dưới 60, hay khi ca bị loại vì nhãn
  bất đồng vượt 20% mẫu (lệnh in số ca bị loại). Hụt ngưỡng: không chỉnh luật rồi chấm lại trên mẫu giữ riêng.
  Mẫu giữ riêng dựng bằng model ngoài ba model được nhận nguyên văn (luật 6) thì mọi bài gửi đi qua `pipeline/lib/mask-source-names.mjs` trước:
  lệnh kiểm quét toàn bộ payload đã gửi, in 0 tên nguồn thật, và đỏ khi cấy một tên nguồn vào một payload. Không gọi model nào cho mẫu này
  trước lời Mạnh ở Hỏi-2.
- **AC-10** (không phá lượt nạp, chạy thử) Given bản chép DB máy thu, When chạy lượt nạp S03 với công tắc bật hai lần, Then lượt hai không đổi
  thành phần tin nào; lệnh in số tin trước và sau, tách theo khu, số tin chạm lát `hai-khu-ghep-b` và tệp đóng băng của PL20, thời gian bước
  gom; không tệp snapshot nào đổi; bài thử bị loại như cũ. Phát lại bản chép theo từng lát ngày ra cùng thành phần tin cuối với một lượt nạp
  toàn bộ; mọi `offer_id` đổi giữa các lát còn đường nối (AC-7), lệnh in số lần lật.

## Coverage

Trục và ô lấy từ bảng phủ ca `discovery/bang-phu-ca.md`, số đếm thật trên DB máy thu ngày 19/11.

- **Trục số bản chữ của tin**: 1 bản (5.914) · 2–3 (1.067) · 4–9 (254) · từ 10 (72) — AC-1, AC-9, AC-10.
- **Trục nhánh khoá**: đủ phường và diện tích (2.590) · thiếu một trong hai (4.717) — AC-3.
- **Trục người đăng**: `sender_id` · chỉ SĐT · không cả hai · hai người trong một tin (6) — AC-2, AC-3.
- **Trục mã**: bộ cũ đọc được (3.896) · bộ mới đọc được (4.582) · khác mã chỉ bộ mới thấy (79) · nhiễu — AC-6.
- **Trục phân khu**: khác theo tên danh bạ (12) · khác theo viết tắt (160) · một bên rỗng · cùng — AC-5, AC-4.
- **Trục trường thiếu**: thiếu số phòng · diện tích · phân khu · mã; một, không, nhiều ứng viên; trong, ngoài cửa sổ — AC-4.
- **Trục `offer_id`**: giữ · tách · nghỉ · bật rồi tắt — AC-7.
- **Trục dạng bài**: vắng · `mot_can` · khác — AC-8.
- **Trục công tắc**: vắng · tắt · bật · bật hai lần — AC-1, AC-10.
- **Ô bỏ**: dự án chưa có nút phân khu (104/7.086 tin) chỉ có tập phân khu từ bảng viết tắt, vì GT5 chỉ đọc danh bạ; khác nội thất, khác giá
  nhỏ không tách (chờ Hỏi-3, GT6).

## Đường đo

| Thước | Số từ đâu | AC bảo đảm |
|---|---|---|
| Gộp nhầm ở tin nhiều bản chữ dưới 5% | nhãn mẫu giữ riêng + đầu ra khoá mới, cận Wilson | AC-9 |
| Tách nhầm không tăng | 40 cặp audit, khoá cũ so khoá mới | AC-9 |
| Hai bản chữ khác phân khu không chung tin | lệnh kiểm trên bản chép, công tắc bật | AC-5 |
| Mọi `offer_id` cũ có đường nối | lệnh kiểm `superseded_by` + bảng đổi theo bài | AC-7 |

## Out of scope

- Tách rổ hàng thành từng căn (PL18) và gắn nhãn dạng bài (GT8): GT5 chỉ đọc nhãn.
- Đổi giá cùng căn thành một tin (GT6); hai môi giới cùng căn nối ở bậc Gắn căn (Q1).
- Màn xem tin gồm bài nào (GT7) và thước Haiku hằng tuần (GT4).
- Sửa danh bạ hay thêm bí danh vào danh bạ: GT5 chỉ đọc.
- Bật công tắc trên máy thu: chỉ sau khi PL20 chấm AC-8 và GT8 đã gộp, theo hồ sơ áp riêng.

## Notes

- Lệnh đo nằm ở `_acceptance/khoa-gom-hai-tang/probes/*.sh`: `_acceptance/config.yaml` là tệp bảo vệ, không sửa.
- PL18, SV2, GT6, GT8 cùng sửa `pipeline/transform-zalo.mjs`: làm tuần tự; GT8 gộp trước GT5.
- Không migration: công tắc là dòng `ops_audit`, `superseded_by` đã có (migration 044).
