# PB6 — data-api Property (danh bạ nhà): kế hoạch thi công

Hồ sơ: `_acceptance/data-api-property-danh-ba-nha/` (Cổng Phạm vi Mạnh ký 27/11, theo khuyến nghị cả ba câu: thuộc tính +
số tin · chỉ tra từng căn, liệt kê toà · S16 mở ở dạng tra từng căn). Hạng T2 — không Cổng 1.5. M5 không tự chấm S4: xong S3
báo GS sha.

## Số đo trên DB M5 (27/11, chỉ đọc) — chọn đường đọc

| Câu | Thời gian | Quyết |
|---|---|---|
| `v_unit_thuoc_tinh WHERE unit_key = $1` | 864 ms (view tính cả bảng rồi mới lọc) | KHÔNG dùng view |
| `field_assertions` một căn, `DISTINCT ON (field)` cùng luật thắng của view | 1,3 ms (chỉ mục `subject_key, field`) | dùng |
| tra căn theo bí danh `ma_nguon` trong một toà | 22 ms | dùng, luôn lọc theo toà trong SQL |
| đếm tin `active` gắn toà qua view `offer_building` | 501 ms mỗi lần gọi (view đệ quy trên mọi tin S03) | KHÔNG gọi lúc request: một câu gom mọi toà, giữ bản đồ trong bộ nhớ, làm tươi 10 phút (luật 10, `data-api/CLAUDE.md`: không tính số nặng lúc request) |
| toà lớn nhất | 2 340 căn | không đường nào trả mảng căn (AC-4) |

## Task

| # | Việc | Tệp | Kiểm từng task | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | Tệp hợp đồng khoá: `BUILDING_KEYS`, `UNIT_KEYS`, `LOOKUP_EXTRA`, mỗi khoá ghi resource DD 2.1 hay `extension` + lý do | `data-api/src/contract/property.ts` | typecheck | E1, E2, E11 | false |
| 2 | Route Property: kiểm danh bạ có mặt (`to_regclass`) → 503; `GET /:upi`, `GET /:upi/units/:unitKey`, `GET /lookup`, `GET /?project=`; gộp → 404 `MERGED`; bản đồ số tin trong bộ nhớ; tên toà theo thứ tự S09 → S08 → S16 → S03; gập chữ ở JS; từ chối mã nguồn làm đầu vào | `data-api/src/routes/properties.ts`, `data-api/src/app.ts` | typecheck + gọi tay trên DB M5 (chỉ đọc) | E1–E7, E10 | false |
| 3 | Bộ xử lý lỗi không lọt chữ SQL: 5xx trả thông điệp chung, chi tiết chỉ vào log | `data-api/src/middleware/error-handler.ts` | typecheck + test AC-10 | E10 | false |
| 4 | `/openapi.json` sinh schema toà, căn từ tệp hợp đồng; README mục «Property — danh bạ nhà»; CLAUDE.md luật khoá Property | `data-api/src/app.ts`, `data-api/README.md`, `data-api/CLAUDE.md` | typecheck | E11 | false |
| 5 | `pipeline/mappings.yaml`: mục Property trong `api_extensions` (5 extension, đủ sáu điều kiện) + bảng đổi loại căn | `pipeline/mappings.yaml` | probe E8, E11 | E8, E11 | false |
| 6 | Test DB thử: cấy dự án, phân khu, 2 toà, 3 căn, bí danh, phát biểu, chuỗi canh; ca AC-1…AC-7, AC-10 | `data-api/test/properties.test.ts` | `bash db/db-thu.sh oneinvest_suite_dapi_prop --chay sh -c 'cd data-api && node --import tsx --test test/properties.test.ts'` | E1–E7, E10 | false |
| 7 | Ca PB6 trong `dong-ba-route.test.ts` (đường Property không đọc `stg_*`, bảng S02) | `data-api/test/dong-ba-route.test.ts` | cùng lệnh, tệp đó | E11 | false |
| 8 | Probe: đổi loại căn (E8), ba đột biến (E9), đối chiếu DD + ranh giới (E11); khoá lệnh `dapi_prop*` | `_acceptance/data-api-property-danh-ba-nha/probes/*`, `_acceptance/config.yaml` | chạy từng probe, mỗi probe có chiều đỏ | E8, E9, E11 | false |

Thứ tự: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 (tuần tự; các task chạm chung route và tệp hợp đồng).

## Quyết định nạp từ số đo

- Không dùng `v_unit_thuoc_tinh` và `offer_building` lúc request (số đo trên). Luật chọn giá trị thắng chép từ view
  (bậc `fact` > `observed` > khác, rồi `observed_at` mới nhất, rồi `id`); test so kết quả với view trên căn cấy.
- `activeListingCount` đọc từ bản đồ trong bộ nhớ (một câu gom, làm tươi 10 phút) — số có thể trễ tới 10 phút; README ghi.
