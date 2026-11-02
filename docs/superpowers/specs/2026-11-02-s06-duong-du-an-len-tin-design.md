# Đường của tin S06 đi tới tin và căn — thiết kế (hàng DS1)

Việc 6 của `docs/plan/ra-mat-0511-so-luong-chat-luong.md`, mốc 04/11, cắt được theo §4 mục 4.

## Đo 02/11 trên máy thu (chỉ đọc)

| Trường | Thô (`stg_chotot_ads`, tin có giá + diện tích) | Tin | Căn |
|---|---|---|---|
| Đường | 47.613/48.499 (98,2%) ở `payload.street_name` | 8.219 (16,9%), toàn bộ `method = legacy` | 7.876/44.447 (17,7%) |
| Dự án | tên 8.474 (17,5%), mã 9.220 (19,0%), 1.135 mã khác nhau | không có cột | `project_node` 0; `asset_nodes` chỉ 20 dự án |

**Vì sao đường rơi.** `runTransformChotot` không đọc `street_name`. 8.219 giá trị đang có là lịch sử trước khi cắt chuyển sang
phát biểu (045), không tin mới nào thêm được. Căn: `properties.street` chỉ được ghi khi áp đề xuất (`apply_enrichment`, 066);
Stage A của `resolve-properties.mjs` không đụng ô này.

**Vì sao dự án không đi cùng vòng này được rẻ.** Trường phát biểu bị khoá bởi CHECK `field_assertions_field_chk`, tin không có cột
dự án, và cột mới không tự lên cloud (`CLOUD_ALLOW`). Nên dự án cần migration và sửa `sync-cloud.mjs`, cả hai thuộc `t3_paths`. Ghi chú
của hàng đã nói «cần migration thì thành T3». Trước 05/11 chưa màn nào đọc dự án của tin.

## Lựa chọn

**Đường đi qua phát biểu, không ghi thẳng cột.** Thêm vào `docDacTrungS06` một phát biểu `street_raw` với `rule_id = payload.street_name`,
lớp `fact`, phương pháp `source_field`. Bộ phân xử dựng cột như mọi trường khác (ADR-0013 câu 4). `source_field` xếp trên `legacy`
nên 8.219 giá trị cũ tự được thay; dòng `legacy` giữ nguyên làm lịch sử. Tin nguồn bỏ trống vẫn giữ `legacy` nếu có.

**Nguồn bỏ trống.** `replaceOwn` chỉ rút khi lượt có giá trị mới cho cùng trường, nên transform gọi thêm `retractRule` cho tin không còn đọc ra
đường; bộ phân xử trả cột về `legacy` hoặc NULL (AC-4). Câu SQL của căn nằm ở `pipeline/lib/duong-can.mjs` vì `thu-lai-deadlock.test.mjs` ghim chữ SQL của `resolve-properties.mjs`.

**Chuẩn hoá tối thiểu.** NFC, cắt đầu cuối, gộp khoảng trắng (cùng luật `street_raw` ở `agent/src/enrich/route.ts`). Giữ tiền tố
«Đường», số nhà và phần sau dấu phẩy, vì `khoaDuong` đã xử các dạng này khi so. Bỏ đúng một lớp không phải đường, không phân biệt hoa thường,
neo đầu chuỗi: mở đầu bằng Phường, Quận, Huyện, Thị trấn, Thị xã, `P.`, `Q.`; hoặc mở đầu bằng Xã, TP, Thành phố, Tỉnh và có dấu phẩy, để giữ
«Xã Đàn», «Tỉnh lộ 10». Đo sơ 148 tin; AC-7 in số thật theo từng tiền tố. Giữ chúng thì «Phường Hòa Quý, Quận Ngũ Hành Sơn, Đà Nẵng» thành tên
đường và thẻ ghép căn báo «khác đường». Chuỗi có dãy số dài (41 tin, nghi SĐT) vẫn giữ: SĐT người bán là tầng C.

**Căn điền ô trống ở Stage A.** Cuối Stage A của `resolve-properties.mjs`, một câu `UPDATE` điền `properties.street` khi ô đang trống, lấy
từ tin còn sống của căn có đường và thấy gần nhất (`last_seen` lớn nhất, hoà thì `offer_id` nhỏ nhất), ghi một mục `enrichment_log`
(`src: resolve-properties`, kèm giá trị). Không đè giá trị có sẵn, cùng nếp `COALESCE(p.street, …)` của 066. Lệnh `--hoan-tac-duong` đọc log trả đúng các ô đã điền về trống.

Đây là `UPDATE` ngoài bộ phân xử, cùng lớp với chuỗi cập nhật căn của 066: bộ phân xử chỉ ghi bản ghi tin, ADR-0013 câu 4 nói về field chuẩn của tin. Lối sạch hơn là đưa vào hàm SQL, nhưng đổi hàm cần migration nên thành T3. Vì thế đây là câu hỏi cho Mạnh (Hỏi-2).

**Không migration, không sửa `sync-cloud.mjs`.** `street_raw` và `properties.street` đã có trong danh sách lên cloud nên giá trị mới tự đi
theo lượt đồng bộ kế; vòng này không mở đường mới. Đo 02/11: 0 giá trị `street_name` chứa tên nguồn thật. Lượt đồng bộ đầu tiên sau khi
gộp sẽ chở khoảng 39.000 tin đổi đường.

**Câu hỏi cho Mạnh (Hỏi-1).** Máy khuyên tách dự án thành hàng T3 riêng, chạy sau đường. Lối khác: gộp thành một vòng T3; giá là thêm cổng
kế hoạch, migration phải qua duyệt áp và mốc 04/11 của đường bị kéo theo. Tách thì giám sát thêm hàng T3 vào lộ trình trước Cổng Bằng chứng, để dự án không mất dấu.

**Câu hỏi cho Mạnh (Hỏi-2).** Máy khuyên căn nhận đường ở Stage A, không migration, có lệnh hoàn tác. Lối khác: đưa vào hàm SQL; sạch hơn nhưng thành T3 và trễ mốc.

## Ảnh hưởng phía sau

- Thẻ ghép căn và `judge-entity`: «khác đường» làm `same_house = no`. Hôm nay tin S03 và S05 chưa có đường nên cặp khác nguồn ra Thiếu;
  cặp S06 × S06 có thể đổi kết quả nếu hai tin thật sự khác đường. Dạng «Đường X» với «X» phải Khớp, đo ở ma trận và trên DB thật.
- Enrich: `agent/src/enrich/run.ts` chọn tin `street_raw IS NULL`; tin S06 có đường rơi khỏi tập, là đúng ý.
- `do-the-duyet`, `/ops/review`: thấy thêm đường, không đổi mã.

## Rollout

Gộp → job `chotot-daily` kế chạy transform (đọc toàn bộ `stg`) rồi `resolve-properties` → tin và căn có đường, không cần chạy tay. Sau job
đầu tiên đo `do-duong-s06 --chi-doc` trên DB máy thu; sau lượt đồng bộ đối chiếu số đường trên cloud. `/vn/**` hôm nay không đọc đường, nên giá trị
mới chỉ hiện ở Ops. Hoàn tác: gỡ mã, rút các phát biểu có `rule_id = payload.street_name` rồi phân xử lại (gỡ mã thôi thì phát biểu vẫn sống, `replaceOwn`
chỉ thay khi lượt có giá trị mới), và `resolve-properties --hoan-tac-duong` cho căn.

## Giới hạn

- Giá trị là chữ nguồn, chưa chuẩn hoá về danh mục đường: «Đường Quang Trung» và «Quang Trung» là hai chuỗi, tuy so ra Khớp.
- Tin mà địa chỉ không có tên đường (~1,8%) vẫn trống.
