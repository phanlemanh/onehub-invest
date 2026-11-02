# Lưu tầng và hướng của tin S03 (SV2)

Hàng `s03-luu-tang-huong`, T3, migration 067. Đứng trên SV1 (đã gộp). Căn cứ: `docs/research/s03-audit-trich-xuat-0211.md` §10.
Việc này chỉ đọc và lưu, không ghép căn (PL20), không đổi khoá gom. Hướng không lên cloud. Tầng theo cột `floor_raw` đã có trong sync tới `/ops/**` ở cloud, không tới Invest (câu hỏi ở thẻ).

## Vì sao cần migration

- Hiện `floor_raw` không nằm trong trục `assertion_field`, bộ phân xử không dựng cột này, và S03 không có dòng nào.
- Chưa có chỗ lưu hướng. `DirectionFaces` là hướng lối vào chính của toà nhà, chọn một giá trị (đã tra DD 2.1). S03 chủ yếu nói ban
  công hoặc không nói, và có bài ghi hai hướng, nên không hợp.

## Hai trường

| Trường | Cột `sale_offer_records` | Giá trị | RESO |
|---|---|---|---|
| Tầng | `floor_raw` (có từ 030) | số `12`, hoặc khoảng `tầng thấp`, `tầng trung`, `tầng cao` | Số ứng với `UnitFloorLocation` (DD 2.1, chuỗi, không danh sách giá trị). Khoảng là giá trị riêng của VN |
| Hướng | `unit_facing` (mới) | `<của cái gì>:<hướng>[,<hướng>]`, vd `balcony:southeast`, `unspecified:northeast,southeast` | Không có tương đương: extension, khai đủ 6 điều kiện ADR-0011 |

**Hướng là một trường kèm nhãn** (Mạnh chốt 02/11). Nhãn: `balcony` · `door` · `unspecified`. Tám hướng, chữ thường. Bộ ghi sắp xếp và bỏ trùng các
hướng, để hai bài cùng hướng ra đúng một giá trị. Cả hai trường đi qua phát biểu như các trường khác; cột do `resolve_offer_fields` dựng.

**Khoảng tầng chuẩn hoá về ba chữ có dấu (câu hỏi ở thẻ).** «tầng trung», «trung tầng» mà giữ nguyên thì thành hai giá trị của một tin, và phân xử báo bất đồng giả. Chữ gốc vẫn còn ở bài. Giữ chữ có dấu vì thẻ ghép căn và bộ chấm đã đọc «tầng cao» là thiếu số, và thẻ hiện nguyên chữ nên giao diện không phải đổi.

## Không làm mất tầng của S06

747 tin S06 đang có `floor_raw` số, từ 030, không có phát biểu. Bản phân xử mới dựng `floor_raw` từ phát biểu nên sẽ xoá các giá trị này. 067 ghi chúng
thành phát biểu `legacy` đúng khuôn cắt chuyển PL15 (mỗi dòng gắn `offer_id` của chính nó, chỉ đỡ tin đã sinh ra nó), trước khi đổi hàm.

## Bộ đọc

Hàm mới trong `pipeline/transform-zalo.mjs`, chuyển từ bộ đọc nháp của audit, không có LLM:

- **Hướng có từ dẫn:** «hướng», «ban công», «BC» + tên hoặc viết tắt, nhiều hướng nối bằng `-`, `/`, `,`, `&`, `+`, «và». Từ dẫn cho nhãn: «ban công», «BC» ra `balcony`; «hướng cửa», «cửa chính» ra `door`; còn lại `unspecified`.
- **Hướng không từ dẫn:** chỉ tên đủ hai chữ («Đông Nam»), không viết tắt, bỏ khi đứng sau «phường», «xã», «khu», «cổng», «phía» và các từ chỉ nơi chốn.
- **Số tầng:** «tầng 12», «lầu 5»; không khi là «tầng 2-3», «tầng 1 và 2»; «5 tầng» là số tầng của nhà (`stories`), không đọc. Không có trong chữ thì lấy từ mã căn dạng toà + tầng + trục.
- **Khoảng tầng:** «tầng cao», «tầng trung», «tầng thấp», «trung tầng», «tầng vừa» (ra `tầng trung`), «tầng trung cao» (ra `tầng cao`). Có số thì số thắng.
- **Bài nhiều mã** (cùng luật với trục ở SV1, câu hỏi ở thẻ): để trống tầng và hướng, chờ PL18.

Phát biểu `transform-zalo@sv2`, lớp quan sát, phương pháp parser, mỗi bài một dòng. Không đưa vào khoá gom, nên `offer_id` không đổi vì việc này.

## ADR-0011, sáu điều kiện cho `unit_facing`

1. Tra cứu: `dd_field: null`, ghi ngày tra và kết quả trong `pipeline/mappings.yaml`.
2. Lý do VN: hướng ban công là tiêu chí mua căn hộ ở VN, môi giới ghi nhiều hướng; RESO chỉ có hướng lối vào toà nhà.
3. Migration 067.
4. Ràng buộc: CHECK khuôn trên cột, trigger cùng khuôn trên phát biểu, hai trục sổ từ vựng `unit_facing_of`, `facing_direction`.
5. Khai trong `pipeline/mappings.yaml`.
6. DQ: dòng `s03-unit-facing-fill` trong `pipeline/sql/450_dq_checks.sql`: `skip` khi chưa có phát biểu, `fail` khi có mà dưới 5% tin S03 có hướng.

## Thứ tự triển khai

Mã mới chạy trên DB chưa áp 067: CHECK sẽ chặn nên transform kiểm trước; chưa có 067 thì in cảnh báo, bỏ hai trường, phần còn lại chạy như cũ (AC-10). Lượt đêm không đổ vì thứ tự gộp. Áp 067 vào DB local do giám sát xếp, rồi nạp lại S03.
Cloud: không áp, không đổi `sync-cloud`. Giao diện không đổi (AC-11). Dòng DQ `skip` khi S03 chưa có phát biểu, nên không đỏ trong lúc chờ nạp lại.

## Ma trận viết trước (đáp án)

Câu do người viết, không lấy từ bài thật.

| Chữ | Hướng | Tầng |
|---|---|---|
| hướng Đông Nam | unspecified:southeast | |
| Hướng: ĐN - TN | unspecified:southeast,southwest | |
| hướng TB | unspecified:northwest | |
| ban công Tây Bắc | balcony:northwest | |
| BC Đông & Nam | balcony:east,south | |
| BC đông + tây | balcony:east,west | |
| ban công Đông và Bắc | balcony:east,north | |
| hướng cửa Bắc | door:north | |
| cửa chính Tây Nam | door:southwest | |
| Toà X1, 30m2, Đông Nam | unspecified:southeast | |
| phường Tây Nam | null | |
| khu Đông Nam, phía Tây Bắc | null | |
| hướng dẫn thủ tục, hướng tới khách thuê | null | |
| tầng 12 | | 12 |
| lầu 5 | | 5 |
| Tầng: 7 | | 7 |
| S1.12.08 | | 12 |
| GH3-1203 | | 12 |
| PR6xx20 | | null |
| tầng cao | | tầng cao |
| tầng trung, trung tầng, tầng vừa | | tầng trung |
| tầng thấp | | tầng thấp |
| tầng trung cao | | tầng cao |
| tầng 15, tầng cao | | 15 |
| nhà 5 tầng; 3 tầng | | null |
| tầng 2-3; tầng 1 và 2 | | null |
| S1.12.08 và S2.05.01 hướng Đông, tầng cao | null | null |

## Giới hạn đã biết trước

- Hai bài của một tin khác nhãn («Đông Nam» và «ban công Đông Nam») là hai giá trị: phân xử chọn theo số bài và báo `conflict`, không gộp.
- Bài ghi cả ban công và cửa chỉ lấy cụm đầu.
- Tầng trong mã kiểu «S801» không đọc (audit: chưa kiểm cách tách).
- Suy hướng từ trục, từ S08: không làm (audit §10: lấp được ít, chưa có bằng chứng độc lập).
