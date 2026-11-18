# PL20 `ghep-tin-vao-danh-muc` — gắn tin căn hộ S03 vào toà của Danh bạ

Ngày 18/11/2026 · dãy P4 · hạng **T3** (chạm `db/migrations/**`) · mốc MS3 «S03 tới toà». Bản 3: Mạnh không nhận ngưỡng 40% và chốt «Làm cả hai đợt»; luật được siết sau phản
biện độc lập. Số rà soát ban đầu ở `_acceptance/ghep-tin-vao-danh-muc/phan-tich-do-phu-1811.md`.

## 1. Vấn đề

Hôm nay **0 tin S03 gắn toà** của Danh bạ, dù tin đã có dự án ở 97,5% (TG2). CG11 (hạng giá cấp toà) và mỏ neo «dự án B, tháp X,
tầng A: căn nào giá tốt nhất» đều cần toà. Hàng này gắn tin căn hộ Ocean Park 1 (OP1) và Grand Park (GP) vào toà, hoặc vào phân
khu, cụm (gọi chung là vùng) khi bài chỉ nêu tới đó. Trục và căn là việc của PL36. Đích của MS3: **từ 50% tin căn hộ S03**.

## 2. Bảng phủ ca (đếm trên DB máy thu, chỉ đọc, 18/11)

Mẫu số **6.446 tin căn hộ S03** (bán 2.389). Xét từng bài của tin rồi gộp lên tin, đúng cách phát biểu sẽ được ghi. Chỉ tính OP1, GP.

| Bậc | Nguồn gắn | Thêm | Luỹ kế | Tỉ lệ | Ai đọc đầu ra này phía sau |
|---|---|---:|---:|---:|---|
| A | Ô tên toà khớp đúng danh bạ | 2.713 | 2.713 | 42,1% | CG11 xếp hạng theo toà; DA14; PL36 gắn tiếp trục |
| B | Ô tên toà sau chuẩn hoá cách viết | 57 | 2.770 | 43,0% | như A |
| C | Toà: luật đọc chữ và model cùng kết quả | 37 | 2.807 | 43,5% | như A |
| F | Vùng: luật đọc chữ và model cùng kết quả | 138 | 2.945 | 45,7% | CG11 lùi về phân khu; DA14 mức «phân khu» |
| D | Toà: chỉ model đọc ra, tên toà nằm trong đoạn trích | 21 | 2.966 | 46,0% | như A |
| G | Vùng: chỉ model đọc ra, tên vùng nằm trong đoạn trích | 23 | 2.989 | **46,4%** | như F |

Sau đợt 1: 2.276 tin tới toà (35,3%), 713 tin tới vùng (11,1%), tin bán 50,8%, 20 tin xung đột (0,67% số đã gắn).

Phần chưa gắn (3.437 tin):

| Lý do | Số tin | Xử lý |
|---|---:|---|
| Chưa có bản đọc của model, chữ bài không nêu toà | 1.535 | đợt 2 đọc bù |
| Thuộc dự án khác OP1, GP | 477 | ngoài phạm vi, chưa có tập nhãn cho các dự án này |
| Luật đọc được vùng, model chưa đọc | 344 | đợt 2 đọc bù |
| Bài nêu nhiều toà | 311 | không gắn: không biết tin nói về toà nào |
| Luật đọc được toà, model chưa đọc | 221 | đợt 2 đọc bù |
| Ô tên toà ngoài danh bạ | 160 | không gắn; danh sách tên cho việc lấp danh bạ |
| Chưa có dự án | 136 | không gắn: mã toà trùng giữa các dự án |
| Model đã đọc, không thấy toà | 135 | không gắn |
| Bài rao nhiều căn | 47 | không gắn |
| Đoạn trích của model không chứa tên được gắn | 33 | không gắn |
| Các lý do khác | 38 | không gắn |

**Đợt 2** đọc bù 1.724 tin OP1, GP chưa gắn và chưa có bản đọc `dg3-s03-v3`, mỗi tin một bài, khoảng 2,5 USD (p95 3,3 USD). Tỉ lệ đo trên tin đã đọc: model xác nhận 90% với toà, 96% với vùng; 21% số bài
luật không đọc ra gì có tên trong đoạn trích. Ước tính sau đợt 2:

| Nguồn được bật | Độ phủ ước tính |
|---|---:|
| A, B, C, F, D, G | **53,8–57,2%** |
| A, B, C, F (nhóm model một mình bị tắt) | 51,1–52,4% |
| A, B (cả hai nhóm dùng chữ và model bị tắt) | 43,0% |

## 3. Thiết kế

**Một hàm gắn thuần** `pipeline/lib/ghep-tin-danh-muc.mjs`, xét từng bài. Đầu vào: dự án của tin, ô tên toà của bài, chữ bài, bản đọc của model, danh bạ của
dự án. Dừng ở bậc đầu tiên có kết quả:

1. Tin không thuộc OP1 hay GP, hoặc không phải căn hộ: không gắn.
2. Chữ bài nêu từ hai toà trở lên: không gắn, lý do `chu-nhieu-toa`. Model báo bài rao nhiều căn: không gắn, lý do `bai-nhieu-can`. Luật này đứng trước mọi nguồn, kể cả ô tên toà.
3. Ô tên toà khớp đúng một toà hay một vùng: gắn (A); khớp sau chuẩn hoá cách viết: gắn (B).
4. Ô tên toà khớp nhiều nơi: không gắn, lý do `mo-ho`. Ô có giá trị ngoài danh bạ: không gắn, lý do `ngoai-danh-ba`. Hai ca này không rơi xuống bậc sau.
5. Luật đọc được một toà: model cùng kết quả thì gắn (C); model khác thì không gắn, lý do `chu-model-khac`; model chưa đọc hoặc không nói thì không gắn, lý do `chi-luat`.
6. Luật không đọc được toà, model nêu đúng một toà và tên toà nằm trong đoạn trích: gắn (D); tên không nằm trong đoạn trích: không gắn, lý do `trich-khong-co-ten`.
7. Mức vùng làm như bước 5–6: nhiều vùng không gắn, luật và model cùng kết quả gắn (F), model một mình có tên trong đoạn trích gắn (G).

**Bản đọc của model chỉ được tính** khi ô đó có căn cứ `chu_bai` và đoạn trích đã kiểm có trong bài (`trich_ok`), theo tiền lệ `du-an-ten-bai` (Cổng Phạm vi 13/11,
Hỏi-4). Căn cứ «kiến thức nghề», «ngữ cảnh nhóm», «ảnh» không được tính. **Luật 7 giữ nguyên**: model chỉ trích; luật xác định kiểm đoạn trích có trong bài, tên hay bí danh của nút nằm trong đoạn trích, và tên
khớp đúng một nút của dự án, rồi mới gắn.

Tên chỉ so trong phạm vi dự án của tin, vì mã toà trùng giữa các dự án (S1, S2, BE1).

**Phát biểu trên từng bài** (`field_assertions`, resource `Property`, lớp `inferred`). Mỗi nhóm nguồn một `rule_id` để tắt riêng được:

| Bậc | `rule_id` | `method` | Căn cứ ghi kèm |
|---|---|---|---|
| A | `ghep-toa-cot` | `e1_rule` | `{ nguon: 'cot', ten }` |
| B | `ghep-toa-cot-chuan` | `e1_rule` | `{ nguon: 'cot', ten, ten_chuan }` |
| C, F | `ghep-toa-chu-model` | `e1_rule` | `{ nguon: 'chu-model', ten, label_id, trich }` |
| D, G | `ghep-toa-model` | `e2_llm` | `{ nguon: 'model', ten, label_id, model, trich }` |

Mức toà ghi trường mới `universal_property_id`, giá trị là `buildings.upi` (ADR-0016 §5, ADR-0013). Mức vùng ghi trường đã có `subzone_node_id`. `method_version = 'ghep-toa@1'`.
Tắt một nguồn là bỏ `rule_id` đó khỏi danh sách nguồn bật trong mã; lượt kế rút hết dòng của nguồn đó.

**Migration 117**, viết chồng lên 113 của DA40 và giữ đủ bốn trường của 113: thêm `universal_property_id` vào ràng buộc trường, trigger
chỉ nhận trường này ở `Property` và chỉ nhận UPI của toà đang hoạt động; view `offer_building` cho người đọc phía sau, theo khuôn
`offer_project`: một tin một dòng, chỉ đọc dòng của bốn `rule_id` trên. Toà cùng vùng chứa nó ra mức toà; hai toà khác nhau, toà với
vùng không chứa nó, hai vùng không lồng nhau đều là `xung_dot` và không tính là đã gắn.

**Chạy định kỳ**: bước gắn chạy cuối lượt nạp S03 trong `transform-zalo.mjs`, để tin mới có toà sau mỗi 15 phút. Bước gắn dùng giao dịch riêng sau khi
lượt nạp đã ghi: lỗi của nó chỉ in một dòng `JOB WARN [ghep-toa]`, không làm hỏng lượt nạp. Không tách thành bước riêng trong job vì tệp job thuộc làn thu. Chạy
lại không đổi gì; ô tên toà, danh bạ hay bản đọc đổi thì dòng cũ bị rút, dòng mới được chèn. Bản đọc hằng ngày của PL34 tự đi vào lượt gắn kế tiếp.

**Đọc bù của đợt 2** dùng lệnh có sẵn `agent/scripts/doc-gop-s03.ts chay --post`, không viết đường gọi model mới. Script mới của hàng lập danh sách bài: tin OP1, GP chưa gắn
và chưa có bản đọc `dg3-s03-v3`, mỗi tin một bài chữ dài nhất, bỏ bài thử; danh sách được đóng băng có băm trước khi đọc. Trần **5 USD**; lệnh tự dừng khi chạm trần, chạy lại không gọi lại bài đã đọc.

**Áp lên DB máy thu** theo hồ sơ năm thứ (lệnh áp, số chạy thử, sao lưu, cách lùi, lệnh kiểm), sau khi PR gộp và sau DA40.

## 4. Đo chất lượng

Chấm ba nhóm riêng trên lát nhãn mới `hai-khu-ghep-b`. Mỗi nhóm cận dưới Wilson từ **0,95**, tối thiểu **110 bài máy gắn** (chịu được 1 bài sai). Mỗi nhóm rút ngẫu nhiên theo hạt giống, mỗi tin một bài, từ chính các tin máy
gắn sau lượt đọc bù.

| Nhóm | Nguồn | Tin máy gắn (sau đợt 2, ước) | Khi hụt ngưỡng hoặc chưa chấm |
|---|---|---:|---|
| N1 | A, B | khoảng 2.770 | hàng không đạt |
| N2 | C, F | 520–610 | tắt C, F; độ phủ 43,0%, MS3 chưa đạt |
| N3 | D, G | 180–310 | tắt D, G; độ phủ vẫn ước 51,1–52,4% |

- **Không dùng lát `hai-khu-ghep` của PL35 để chấm**: lát này chia đều theo tầng, nên trong 159 mục máy gắn chỉ 13% thuộc GP, trong khi GP chiếm 63% số tin máy gắn. Lát vẫn giữ cho PL36.
- **Người gắn không thấy đáp án của máy**: lát mới không điền nháp, và nhóm trên màn mang mã trung tính.
- **Đóng băng đầu ra máy**: lúc rút mẫu, ghi lại bài, nút được gắn, nguồn và băm. Lúc chấm, chạy lại mã cuối trên đúng các bài đó; đầu ra khác bản đóng băng thì chấm đỏ.
- **Quy nhãn về nút**: tên người gắn được quy về nút danh bạ của dự án bằng cùng bảng tên. Máy gắn toà đúng khi người ghi đúng toà đó; máy gắn vùng đúng khi người ghi đúng vùng đó, một vùng con của nó, hoặc một toà nằm trong nó. Không quy được hoặc người ghi «không nêu» thì tính máy sai.
- **Dừng sớm**: một nhóm gặp lỗi thứ hai là đã hụt ngưỡng, dừng gắn nhãn nhóm đó.

Tổng tối đa **330 bài**, khoảng 16 giờ 30 phút theo nhịp 3 phút mỗi bài đo được trên 38 lượt của một lát khác. Màn gắn nhãn hiện đòi đủ 17 ô cho mỗi bài, dù phép chấm chỉ đọc ô Toà và ô Phân khu. Thứ tự gắn: N1, N2, rồi N3.

## 5. Thứ tự thực hiện

1. Mạnh ký Cổng Phạm vi.
2. DA40 gộp; viết mã, khoá luật.
3. Đóng băng danh sách đọc bù; giám sát chạy đọc bù trên DB máy thu (chỉ ghi `silver_labels`, `ai_calls`).
4. Giám sát nạp lát `hai-khu-ghep-b` vào `eval_label_items` trên DB máy thu, kèm đầu ra máy đóng băng.
5. Gắn nhãn trên `/ops/labels`.
6. Chép DB máy thu, đo độ phủ và chấm chất lượng.
7. Cổng Bằng chứng, gộp PR, áp 117, ghi phát biểu.

Bước 3, 4 ghi lên DB máy thu trước khi PR gộp; chữ ký Cổng Phạm vi phủ đúng hai lượt ghi này.

## 6. Ngoài phạm vi

Trục, căn và tầng suy từ mã căn (PL36) · các dự án ngoài OP1, GP (chưa có tập nhãn) · lấp tên toà thiếu trong danh bạ (160 tin) · tách dự án con (DA38) · sửa lỗi
nháp nhãn của PL35 (`P4-208`) · đưa toà lên cổng Invest hay cloud.

## 7. Rủi ro đã biết

- **Đợt 1 một mình chưa tới 50%** (46,4%), nên đích MS3 phụ thuộc lượt đọc bù.
- **Số của đợt 2 là ước tính** từ tỉ lệ trên tin đã đọc; các tin đã đọc có thể khác các tin chưa đọc.
- **Chỉ khoảng 35% tin tới đúng toà**, phần còn lại của số đã gắn dừng ở vùng; xếp hạng giá theo toà chỉ dùng được phần tới toà.
- **N1 hoặc N2 hụt ngưỡng thì MS3 chưa đạt**; 110 bài chỉ chịu được 1 bài sai, nên nhóm có độ đúng thật 98% vẫn dễ hụt.
- **DA40 chưa gộp**: PR này phải gộp sau DA40, nếu không migration 117 không áp được đúng thứ tự. Số migration do giám sát giữ.
- **Hụt ngưỡng chất lượng**: tập đã lộ nhãn thì không được chỉnh luật rồi chấm lại trên chính tập đó.
