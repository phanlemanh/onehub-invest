---
schema_version: 1
feature: Danh bạ có toà · trục · căn cao tầng Ocean Park 1 và Grand Park dựng từ danh mục S08 và phát biểu toà/mã căn trên tin, trên khung chung có UPI neo toà; 3 dòng asset_nodes building chuyển sang toà; chủ đầu tư ghi ở cấp toà (Building.BuilderName)
slug: danh-ba-toa-truc-can
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [config, cli]
status: signed-off
design_doc: docs/superpowers/specs/2026-11-07-danh-ba-toa-truc-can-design.md
approved_by: Mạnh
approved_at: 2026-11-06T23:54:21Z
---

# Acceptance Contract: danh-ba-toa-truc-can

## Context

DB1 (ADR-0016 Đợt 1): dựng danh bạ vật thể toà · trục · căn cho chung cư cao tầng của Ocean Park 1 và Grand Park, khoá
mờ đúc một lần, UPI neo toà, hạt giống là danh mục S08 đã nối khu (DN1), phát biểu toà trên tin bổ sung bí danh. Đây là
chỗ để gắn tin của PL20 → GC2 → GC3; vòng này chưa gắn tin nào. Mạnh ký Cổng Đáng 07/11 «Build theo đề xuất».

Source input: `_acceptance/danh-ba-toa-truc-can/opportunity.md` (hàng DB1 của `docs/plan/lo-trinh.json`).

## Criteria

- AC-1: Given DB thử áp migration 001…082 từ đầu, When áp 082 lần hai và chạy ca danh bạ Người, ca ghi phát biểu tin và
  ca ghi phát biểu vật thể, Then lược đồ không đổi giữa hai lần áp; ba bảng `buildings`, `stacks`, `units` có khoá
  `bld_`/`stk_`/`unt_` + ULID, từ chối DELETE/TRUNCATE và từ chối đổi khoá, UPI, SubId; `registry_aliases` nhận
  `ma_nguon` và vẫn từ chối bí danh Người trùng; `field_assertions` nhận resource `Building`/`Stack`/`Unit` với khoá
  vật thể và từ chối khoá vật thể đi với `Property`; tập dòng đầu ra của ca danh bạ Người và của hàm phân xử tin giống
  hệt trước 082, kể cả sau khi đã ghi phát biểu vật thể.
- AC-2: Given ma trận mã căn tổng hợp viết trước, mỗi khuôn đã khai có ca dương và ca âm, When bộ tách mã S08 đọc từng
  mã, Then mã đúng khuôn ra đúng (toà, tầng, trục, mã khuôn); mã không khớp khuôn nào ra «không tách» kèm lý do có tên;
  không mã nào khớp hai khuôn.
- AC-3: Given DB thử có danh mục S08 cao tầng của hai khu (fixture tổng hợp, và bản chép chỉ đọc từ máy thu), When bộ
  dựng chạy, Then mỗi toà S08 của hai khu có đúng một khoá `bld_` với UPI `urn:onehub:upi:1:VN:<VN-HN|VN-SG>:<khoá toà>`
  và cha vùng là khu (hoặc phân khu); mỗi trục có một `stk_` thuộc đúng toà; mỗi mã căn tách được có một `unt_` với
  SubId `<khoá trục>:<tầng>`; bí danh S08 mang phạm vi dự án S08, nên hai dự án cùng khu có cùng mã toà, cùng mã căn
  ra hai khoá riêng; mọi dự án cao tầng đã nối có ít nhất một toà.
- AC-4: Given bộ dựng đã chạy một lần, When chạy lần hai trên cùng dữ liệu, Then lần hai đúc 0 khoá mới; số toà, trục,
  căn theo khu và tập khoá giống hệt lần một.
- AC-5: Given một toà có lưới trục × tầng mà chỉ một phần ô có mã S08, When bộ dựng chạy, Then chỉ ô có mã được đúc
  `unt_`; mỗi `unt_` có ít nhất một bí danh `ma_nguon`; ô không có bằng chứng không có khoá.
- AC-6: Given hai lần chụp S08, lần sau thiếu một mã và thêm một mã mới, When bộ dựng chạy sau lần chụp sau, Then căn
  của mã bị thiếu giữ nguyên khoá, trạng thái `active` và bí danh; mã mới được đúc khoá mới; không dòng nào bị xoá.
- AC-7: Given bản chép chỉ đọc danh mục S08 cao tầng của hai khu từ máy thu, When bộ dựng chạy trên DB thử, Then ít
  nhất 90% mã căn tách được toà · tầng · trục; mọi mã còn lại nằm trong sổ lý do theo khuôn; lệnh in số theo khu, không
  in mã S08 thật.
- AC-8: Given tin có khu xác định theo luật của Hỏi-3 và phát biểu toà của bộ đọc luật, When bộ dựng chạy, Then tên toà
  chuẩn hoá khớp đúng một toà của khu thành bí danh `ten` nguồn S0x của tin; khớp không toà hay từ hai toà trở lên chỉ
  vào sổ ứng viên kèm số người đăng, số nhóm; toà chỉ có từ tin xử lý theo lời Mạnh ở Hỏi-4 — theo khuyến nghị: không
  đúc, chỉ ghi ứng viên; tin không có khu không góp gì.
- AC-9: Given từ điển chủ đầu tư local đã được Mạnh duyệt (Hỏi-2), When bộ dựng chạy, Then mỗi toà có dòng từ điển nhận
  đúng một phát biểu `Building / builder_name` lớp `fact`, phương pháp `hitl`, bằng chứng mang băm tệp từ điển; toà
  không có dòng nhận 0 phát biểu; chạy lại không nhân phát biểu; không bảng vật thể nào có cột tên hay chủ đầu tư.
- AC-10: Given ba dòng `asset_nodes` `node_type = building` (phân khu của Grand Park), When 082 áp và bộ dựng chạy, Then
  ba dòng xử lý đúng theo lời Mạnh ở Hỏi-1 — theo khuyến nghị: ba dòng giữ nguyên ở họ Vùng, toà S08 thuộc phân khu
  có cha vùng trỏ đúng dòng phân khu, và `agent/src/enrich/run.ts` vẫn đọc được đúng ba dòng như trước.
- AC-11: Given lược đồ sau 082 và cây kho, When đọc danh sách bảng đồng bộ cloud và quét các tệp kho đang theo dõi,
  Then `buildings`, `stacks`, `units` không có trong `FILL` của `pipeline/sync-cloud.mjs`; nếu `registry_aliases` hay
  `field_assertions` có trong `FILL` thì bộ chọn dòng loại mọi bí danh `ma_nguon` nguồn S08 và mọi phát biểu resource
  `Building`/`Stack`/`Unit`; không tệp nào trong kho chứa mã căn S08 thật hay tên toà chỉ có từ S08 (đối chiếu với bản
  chép chỉ đọc).
- AC-12: Given toà đã đúc và khu đô thị (hoặc phân khu) của toà có `area_ids`, When bộ dựng chạy, Then toà thuộc khu có
  đúng một phường/xã (`areas.region_type = submarket`) nhận đúng một phát biểu `Building / area_id` lớp `inferred`,
  phương pháp `registry_inherit`, bằng chứng trỏ nút vùng; toà thuộc khu có từ hai phường trở lên hay không có phường
  nhận 0 phát biểu và một dòng sổ lý do «khu nhiều phường»; phát biểu này không ghi vào cột hay phát biểu nào của tin.

## Coverage

- Trục A · Cấp vật thể: toà | trục | căn `[thước CE: ADR-0016 §2]` → AC-3, AC-5
- Trục B · Nguồn bằng chứng: mã S08 | phát biểu tin | từ điển chủ đầu tư | `asset_nodes` cũ `[thước CE: ADR-0016 §3, §6; câu giao DB1]` → AC-2, AC-3, AC-8, AC-9, AC-10
- Trục C · Vòng đời khi dựng: đúc lần đầu | dựng lại | mã mới | mã biến mất | không tách | gộp·tách·nghỉ (Later) `[thước CE: ADR-0016 §3; spec 03/11 §4.2, §5; bat_khi DB1]` → AC-4, AC-5, AC-6, AC-7
- Trục D · Ranh giới dữ liệu: DB máy thu | cloud | kho công khai `[thước CE: AGENTS luật 5, 6; ADR-0016 §9]` → AC-11
- Lược đồ và không vỡ thứ đang có (danh bạ Người, phát biểu tin, hàm phân xử) → AC-1
- Phường của toà (suy từ vùng, để PL20 suy phường cho tin) → AC-12
- Chân ngành: RESO DD 2.1 resource `Building` + UPI `[NGÀNH: RESO DD 2.1]`; Beike Housing Dictionary (định danh căn bền
  kể cả không có tin) `[NGÀNH: Beike Housing Dictionary]`
- Quét đầy đủ: design doc §3.

## Đường đo

- Thước: dựng lại hai lần, số và khoá không đổi · số từ: bộ dựng in tập khoá hai lần trên DB thử · bảo đảm bởi: AC-4
- Thước: 0 căn không có bằng chứng · số từ: đếm `unt_` không có bí danh `ma_nguon` · bảo đảm bởi: AC-5
- Thước: mọi toà cao tầng S08 của hai khu có khoá toà và UPI · số từ: so tập mã toà tách được với `buildings` · bảo đảm bởi: AC-3
- Thước: ≥ 90% mã căn tách được (CHẾT < 70%) · số từ: tổng kết của bộ dựng trên bản chép chỉ đọc · bảo đảm bởi: AC-7
- Thước: ba dòng toà cũ xử lý theo Hỏi-1 · số từ: đọc `asset_nodes` và `buildings.region_node_id` · bảo đảm bởi: AC-10
  (chọn khuyến nghị ở Hỏi-1 là sửa vế «3 dòng toà cũ đã sang bảng toà, khoá cũ giữ làm bí danh» của ngưỡng SỐNG đã ký;
  câu sửa ghi vào opportunity.md cùng lượt duyệt Cổng Phạm vi)

## Out of scope

- Thấp tầng, nhà phố, đất (ADR-0016 Đợt 2); thửa (chung cư không cần thửa).
- Gắn tin vào toà/trục/căn — PL20.
- Mã căn đầy đủ từ PL13 — bổ sung sau (Q4 07/11).
- Khung toà đầy đủ: số tầng, tầng bỏ, danh sách trục do một sàn khai (spec 03/11 §5 bước 2).
- Sự kiện gộp · tách · nghỉ vật thể; bộ phân xử cột chuẩn cho vật thể; kế thừa `registry_inherit`.
- Kéo `asset_nodes` xuống trục, căn (ADR-0016 §10).
- Phường cấp toà cho khu có nhiều phường (Grand Park): cần toạ độ hay địa chỉ từng toà, S08 không có — hàng riêng.
- Kế thừa phường từ toà xuống tin và không đè phường đọc từ chữ bài — PL20.
- `properties` thành view trên danh bạ (Đợt 2); trang `/ops` xem danh bạ vật thể (DN3/DN4).
- Đồng bộ vật thể lên cloud; áp 082 và chạy bộ dựng trên DB máy thu (lời riêng của Mạnh sau Cổng Bằng chứng).

## Notes

- Migration 082 đã giữ cho DB1 (giám sát ghi sổ qua LL). Phép đo chạy trên DB thử (`db/db-thu.sh`); bản chép dữ liệu
  thật chỉ đọc từ máy thu.
- S08 chỉ nội bộ (AGENTS luật 5): từ điển chủ đầu tư, bảng khuôn theo dự án ở tệp gitignored; fixture test là mã tổng
  hợp.
- Vùng mã: `db/migrations/082_*`, `pipeline/lib/ma-can-s08*`, `pipeline/lib/danh-ba-vat-the*`, `pipeline/danh-ba-vat-the*`,
  `pipeline/scripts/danh-ba-vat-the*`, `pipeline/mappings.yaml`, `pipeline/sync-cloud.test.mjs`. Không chạm `agent/`,
  `pipeline/lib/eval-labels.mjs`, `label-*`, `transform-zalo.mjs`.
- Cỡ 12 tiêu chí (11 theo ghi_chu hàng, AC-12 theo Hỏi-5): khung chung, ba cấp vật thể và mở ràng buộc phát biểu phải giao cùng nhau mới có khoá dùng được (ghi_chu hàng DB1).
- Known limits — chọn ở Cổng Bằng chứng 2026-11-07:
  - Ngoài-1: Phép kiểm chống lộ tên toà chỉ có từ danh mục nội bộ có thể bỏ sót vài tên có phần riêng quá ngắn. Hôm nay chưa thấy tên nào bị lộ trong kho công khai.
  - Ngoài-2: Nếu sau này có tệp trong kho ghi tên toà nội bộ theo cách viết khác (chữ thường, khoảng trắng thay gạch dưới), phép kiểm vẫn báo an toàn. Hiện chưa có tệp nào như vậy.
  - Ngoài-3: Phép kiểm tên toà nội bộ có thể lặng lẽ thành vô nghĩa nếu danh sách tên cần quét rỗng mà vẫn báo xanh. Hôm nay danh sách có 5 tên nên vẫn hoạt động.
  - Ngoài-4: Trên trang chất lượng dữ liệu của Ops, tám dòng kiểm mới về toà, trục, căn sẽ hiện chữ chung «Kiểm khác (chưa diễn giải)» kèm tên bảng và cột tiếng Anh thay vì nhãn tiếng Việt dễ hiểu.
  - Ngoài-5: Nếu lệnh dựng danh bạ toà được gọi qua đường dẫn tắt (như cách máy chạy đêm đang gọi code), nó sẽ im lặng không làm gì mà vẫn báo thành công, nên danh bạ có thể không được cập nhật mà không ai hay. Đã sửa ở lượt chấm 2 (lối vào so bằng realpath, commit 948af5b1).
  - Ngoài-6: Nếu tên khu bị gõ sai hoặc đổi, lệnh dựng danh bạ vẫn báo xong với toàn số 0, người chạy dễ tưởng là không có toà nào thay vì nhận ra mình nhập sai.
  - Ngoài-7: Nếu ai đó trỏ nhầm lệnh dựng danh bạ vào cơ sở dữ liệu đám mây, lệnh vẫn chạy và ghi dữ liệu danh mục nội bộ lên đó.
  - Ngoài-8: Người hoặc trợ lý làm việc sau sẽ không biết lệnh dựng danh bạ toà và ba bảng mới chỉ nằm ở máy local, nên dễ dùng sai.
  - Ngoài-10: Gõ sai tên khu khi chạy lệnh dựng thì lệnh bỏ qua khu đó và vẫn báo xong, trông như không có gì mới.
  - Ngoài-11: Khi một khu có hơn mười nghìn mã căn, phép kiểm có thể báo đỏ dù danh bạ dựng đúng.
  - Ngoài-12: Khi phép kiểm tách mã báo đỏ, thông báo không nói khuôn nào bị hỏng, nên người sửa phải tự dò.
  - Ngoài-13: Phép kiểm tích hợp không tự soi số người đăng và số nhóm của ứng viên toà, nên lỗi ở đó chỉ lộ qua bộ test khác.
  - Ngoài-14: Ca khu không xác định được phường chưa được thử trên cơ sở dữ liệu thật của phép kiểm tích hợp, và việc tin không bị đổi cũng chưa được đo đầy đủ.
  - Ngoài-15: Phép kiểm trên dữ liệu thật chưa chứng minh được mọi toà của dự án đều có khoá, chỉ chứng minh mỗi dự án có ít nhất một toà.
  - Ngoài-16: Phép kiểm chưa tự phát hiện nếu toà hoặc trục bị mất dòng khi chụp lại danh mục.
  - Ngoài-17: Khi sửa từ điển chủ đầu tư, phép kiểm chưa xác nhận dấu vết tệp mới được ghi lại đúng.
  - Ngoài-18: Phép kiểm chống đồng bộ lên đám mây chưa chạy qua bộ chọn dòng thật, nên chưa chứng minh được thật sự không có dữ liệu toà lên đám mây nếu sau này đổi cấu hình.
  - Ngoài-19: Số toà, trục, căn của khu thứ hai chưa được đếm độc lập, chỉ dựa vào số bộ dựng tự báo.
