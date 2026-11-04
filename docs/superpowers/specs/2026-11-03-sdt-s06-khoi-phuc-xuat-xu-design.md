# Khôi phục xuất xứ số S06 từ stg — thiết kế (03/11/2026)

Hồ sơ: `_acceptance/sdt-s06-khoi-phuc-xuat-xu/`. Mở từ mục Ngoài-5 của `_acceptance/sdt-s06-ghep-tai-khoan/` (Mạnh chọn «mở hợp đồng mới» 03/11).
Hạng T2: chỉ đổi `pipeline/gan-sdt-s06.mjs`, một dòng log ở `pipeline/transform-chotot.mjs`, test và tài liệu; không migration, không ghi thật.

## Vì sao

Bộ gán phân biệt số trực tiếp, số ghép và số không rõ gốc chỉ bằng khoá `field_provenance.seller_phone`. `resolve_offer_fields` dựng lại
`field_provenance` và chỉ 068 mới giữ khoá này. Khi một migration sau chép cả hàm từ bản chưa có phần giữ:

1. Lượt phân xử kế xoá khoá của mọi tin nó chạm. Bộ gán thấy mất phần giữ nên dừng, in `CHUA-AP-068`, không ném lỗi.
2. Người áp lại 068. Hàm giữ khoá trở lại, nhưng khoá đã mất không về.
3. Từ đó số trên tin đều xếp lớp «không rõ gốc», mà lớp này không bao giờ bị rút. Tin chuyển sang ẩn số vẫn giữ số ghép, trái luật «tin ẩn số
   không nhận số ghép» (AC-3, Hỏi-1 của hồ sơ gốc). Bất biến `an_so_bi_ghep` đếm theo chính khoá đó nên báo 0.

Rủi ro là thật: có nhánh từng chép cả hàm (`pipeline/scripts/fixtures/067_tang_huong_tin.ban-sao.sql`), và ghi chú của 069 báo trước SV2 sẽ
chép cả hàm từ số 070 trở đi.

## Số đo (chỉ đọc, DB local, 03/11)

| Đo | Kết quả |
|---|---|
| Hàm đang chạy có phần giữ 068 | chưa (068, 069 chưa áp ở DB này) |
| Tin S06 có số / có khoá / có số mà không khoá | 0 / 0 / 0 |
| Dòng stg S06 có số | 1.328 |
| Chỗ ngoài bộ gán ghi `seller_phone` cho tin S06 | không có (`transform-zalo`, `transform-fb` là nguồn khác) |
| Đường gọi hàm phân xử | `runTransformChotot`; `writeOffers` (S03, S05); `resolve_offer_fields(NULL)` ở `phat-bieu-cat-chuyen`, `dung-lai-canonical`, `phat-bieu-chay-that`; `apply_enrichment`, `revert_enrichment` (bac-du-lieu, duyệt ở `/ops/review`) |
| Đề xuất enrich trên tin S06 | 0 hôm nay, không có gì chặn về sau |
| Importer còn xoá số ở stg không | không: `pipeline/import-chotot.mjs` trong main giữ các khoá người bán khi lượt thu không mang số |

Chưa có dữ liệu nào mất. Việc này là chặn trước lần ghi thật đầu tiên.

## Hai hướng

| | A. Kiểm phần giữ trước `resolveOffers` trong transform | B. Khôi phục xuất xứ từ stg (khuyên) |
|---|---|---|
| Làm gì | Hàm mất phần giữ mà còn tin mang khoá thì transform dừng với lỗi có tên | Số trên tin không còn khoá mà khớp stg thì dựng lại xuất xứ, rồi các luật sẵn có chạy |
| Phủ đường làm mất khoá | chỉ transform; ba lệnh `resolve_offer_fields(NULL)` và hai hàm enrich vẫn xoá | mọi đường, vì sửa kết quả chứ không canh từng đường |
| Khoá đã mất trước khi có thay đổi này | không cứu | cứu |
| Giữ đúng lớp gốc | đúng tuyệt đối trên đường nó canh | đúng khi stg còn số; xem giới hạn dưới |
| Vận hành | job S06 đỏ khi hàm bị ghi đè, trái AC-6 hồ sơ gốc («không ném lỗi») nên phải sửa hợp đồng đã ký | job không đổi, thêm số đếm trong log |
| Cỡ | vài dòng, cộng ngoại lệ AC-6 | hai nhánh CASE, một cột trong CTE, hai số đếm |

Máy khuyên B. Lý do chính: A để hở đúng kiểu lỗi đang sửa, tức xoá im lặng qua một đường không ai canh. B không phụ thuộc việc biết hết các đường.
Lý do trước đây B yếu (importer xoá số ở stg) đã hết từ khi importer giữ khoá người bán.

Lối thứ ba, chưa chết mà đắt: cột `seller_phone_provenance` riêng, hàm phân xử không chạm được nên hết cả bốn giới hạn dưới. Đây là lúc rẻ nhất vì chưa tin nào có số. Giá: migration T3 chạm view `sale_offers` đang được #294 sửa, đổi mọi bên đọc khoá, trước mốc 05/11, trong khi chưa có sự cố thật. Máy khuyên để sau; Mạnh quyết ở Hỏi-2.

## Thiết kế (hướng B)

Chỉ đổi cách xếp lớp trong `SQL_GAN`, bảng luật L1–L9 giữ nguyên. Tin **không còn khoá** `seller_phone` (khác với có khoá mà `rule_id` lạ):

- số trên tin bằng số riêng hợp lệ của chính nó → lớp `truc_tiep`;
- số trên tin nằm trong tập số hợp lệ của tài khoản → lớp `ghep`;
- còn lại → `khong_ro`, như cũ.

Lớp đã xếp đi tiếp qua đúng các dòng luật: L1 ghi lại xuất xứ trực tiếp; L5 ghi lại xuất xứ ghép, `tu_tin` tính bằng đúng công thức cũ; L3 rút khi ẩn số; L7 rút khi
tài khoản từ hai số. CTE `tk_so` thêm `array_agg(DISTINCT so)`. Kết quả thêm `khoi_phuc` (số tin được dựng lại lớp) và `khong_ro` (số tin còn lại không rõ gốc).

Câu lệnh chỉ chạy khi hàm có phần giữ: `ganSdtS06` vẫn dừng ở `CHUA-AP-068`, nên không có vòng ghi rồi lại mất.

Log của `runTransformChotot` và dòng gán của `--thu` thêm hai số đếm, dựng bằng một hàm chung `dongGan`. `an_so_bi_ghep` giữ nguyên định nghĩa; thước mới
của hồ sơ đọc thẳng `seller_phone`, không qua khoá.

Tương tác với #294 (nhánh `claude/sdt-s06-danh-ba`, chưa gộp): nhánh đó thêm `$1` và một dòng ở CTE `quyet`, thêm `nap070`; thay đổi này không đụng các dòng đó. Tin không ẩn được dựng lại
lớp `ghep` khi view chưa có nhãn 070 thì rơi vào nhánh `giu` của #294, nên không mất số, xuất xứ dựng lại ở lượt sau khi có 070. Tin ẩn số vẫn bị rút, vì dòng của #294 đứng sau hai nhánh ẩn số.

## Giới hạn

Bốn giới hạn G1–G4 nằm ở hợp đồng. Nặng nhất là G1: tin nguồn đổi số trong lúc hàm bị ghi đè thì số cũ không khớp stg, tin ẩn số vẫn giữ. Ở đường transform, hướng A không dính G1; nếu Mạnh chọn B thì AC-10 đo và gọi tên giới hạn này.

## Kiểm

Chuỗi đúng thứ tự trên lược đồ tạm, qua hàm thật: 068 → phần `resolve_offer_fields` trích từ tệp migration 061 đã commit, đóng vai migration chép cả hàm → `runTransformChotot` → áp lại 068 từ tệp migration thật → `runTransformChotot`. Kiểm số trên cột, không qua khoá. Ma trận
26 ô viết tay cho tin mất khoá; chiều đỏ bằng đột biến bỏ từng nhánh CASE, ghim thông điệp. Mọi số trong test là số bịa, tất cả trong `BEGIN … ROLLBACK`.
