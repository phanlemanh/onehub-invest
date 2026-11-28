# PB10 — /v1/listings đóng khi sổ nguồn ẩn rỗng hay không đọc được (design)

Hồ sơ: `_acceptance/data-api-nguon-an-dong-khi-so-rong/` · hàng lộ trình PB10 (đợt quan-ly-khach-api-2811) · từ Ngoài-2 của PB7
(Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng PB7, 28/11) cộng ô «không lọc» của PB7 AC-3 mà PB7 phải đo tay.

## 1. Vấn đề

`data-api/src/routes/listings.ts` dựng điều kiện nguồn từ hằng sinh `SOURCE_HIDDEN`
(`data-api/src/contract/vocab.generated.ts`, máy sinh từ `nguon_khong_hien_thi` của `pipeline/mappings.yaml`):

```ts
const NGUON_HIEN = `o.source <> ALL(ARRAY[${SOURCE_HIDDEN.map(...)}]::text[])`;
```

Sổ mất khoá (bộ sinh trả mảng rỗng) hay hằng sinh thành `[]` → `o.source <> ALL(ARRAY[]::text[])` đúng với MỌI dòng → tin S02,
S08 ra API công khai mà không báo lỗi gì (fail-open). Hôm nay bảng `sale_offers` của máy có 0 dòng S02, 0 dòng S08 (đo 28/11
trên DB M5) — lỗ tiềm ẩn, nhưng lộ thật khi sổ hỏng VÀ có dòng nguồn ẩn.

## 2. Phương án

1. **Bộ kiểm sổ** `data-api/src/lib/nguon-an.ts`: `kiemNguonAn(ds)` → danh sách đã kiểm, hoặc `null` khi sổ không dùng được:
   không phải mảng · rỗng · phần tử không khớp `^S\d{2}$` (kể cả chuỗi rỗng, có khoảng trắng) · trùng. Không viết tay mã nguồn nào
   (luật PB7 AC-2).
2. **Route dựng bằng hàm** `taoListingsRoute(ds)` trong `listings.ts`; `listingsRoute = taoListingsRoute(SOURCE_HIDDEN)` giữ nguyên
   chỗ nhập của `app.ts`. Hàm kiểm sổ MỘT lần lúc dựng; `null` → mọi đường của route (danh sách mọi `kind`, căn giá tốt, chi tiết)
   trả `503 {"error":{"code":"HIDDEN_SOURCES_NOT_CONFIGURED","message":…}}` TRƯỚC khi chạm DB. Điều kiện nguồn của tập ghép nhận
   danh sách đã kiểm làm tham số thay vì đọc hằng module.
   - 503 có mã riêng hay 200 rỗng là lời hứa với khách API (vào `/openapi.json`, README, lên kho công khai) → **Hỏi-1 cho Mạnh**
     ở Cổng Phạm vi. Máy khuyên 503: cùng lệ `AUTH_NOT_CONFIGURED` của `src/middleware/auth.ts`, và 200 rỗng giấu lỗi cấu hình như
     một thị trường không có tin. Lối 200 rỗng: khách không biết có lỗi, phía vận hành phải tự phát hiện.
   - Vì sao đóng cả thuê ngắn hạn (bảng `listings` không có cột nguồn): câu giao của hàng là «/v1/listings đóng»; sổ hỏng là lỗi
     cấu hình của cả tài nguyên, mở riêng một nhánh là đoán thay người vận hành.
3. **Vì sao hàm dựng, không lối khác:** đo sổ hỏng cần đổi danh sách mà route thấy. (a) Sửa tệp sinh trong cây khi test chạy — cấm
   (lưới khác quét `src/` song song; PB7 vòng 2 REJECT E8). (b) Chép cây rồi đổi tệp sinh — hành vi đóng chỉ đo được ở probe, không
   nằm trong bộ test hồi quy `test/*.test.ts` mà mọi lượt chấm data-api chạy. (c) `mock.module` của `node:test` — node 24.21 của máy
   không có nếu thiếu cờ `--experimental-test-module-mocks`, mà chín executor test data-api của các hồ sơ đã ký (`dapi_drl`, `dapi_reso`,
   `dapi_khoa`, `dapi_khoa_toan`, `dapi_prop`, `dapi_smp`, `dapi_psn`, `dapi_mk`, `dapi_an`) không có cờ đó. Còn lại hàm dựng.
4. **Test dựng route với sổ hỏng trên DB thật** (`data-api/test/nguon-an-dong.test.ts`): `new Hono().route("/v1/listings",
   taoListingsRoute(<trạng thái>))`, cấy tin S02/S08/S06/ngắn hạn, gọi ma trận viết trước; bộ ghi SQL đếm câu đọc bảng tin.
5. **Ô «không lọc» của PB7**: thêm phần tử `không lọc` vào `LOC` của `data-api/test/tin-hien-thi.test.ts`; tin cấy mang khoá xếp
   đầu theo `listingKey` để đường không lọc khu (trang đầu của cả kho) phải thấy chúng nếu lọt.
6. **Chiều đỏ** bằng probe `pha.mjs` trên bản chép `data-api/` ở thư mục tạm (không ghi cây nguồn — CHUNG điểm 16, bài học PL36):
   bỏ chốt đóng · bộ kiểm luôn nhận · bỏ điều kiện nguồn (ô không lọc).

## 3. Bảng phủ ca

Số tin trên DB M5 (bản chép máy thu 26/11, đo 28/11): `sale_offers` S06 60.548 bán / 80.702 thuê dài · S03 3.790 / 5.694 ·
S05 25 / 5 · **S02 0 · S08 0**; `listings` (thuê ngắn hạn, S01) 989; `offer_price_rank` 150.764 dòng. Hai nguồn ẩn không có dòng
nào nên ô nguồn ẩn dùng tin cấy (đủ trường), không fixture viết tay cho phần còn lại — ô đối chứng là tin S06 cấy cạnh dữ liệu thật.

| Chiều | Giá trị | Ai đọc đầu ra phía sau |
|---|---|---|
| Trạng thái sổ | hợp lệ `[S02, S08]` · rỗng · phần tử rỗng · sai khuôn `S2` · có khoảng trắng · trùng · undefined · null · chuỗi không phải mảng | khách API (mã 503 thay vì tin lọt) |
| Đường | không kind · sale · rent_lt · rent_st · `minBelowMedianPct=0` (nhánh bảng hạng — DB có 150.764 dòng) · `minBelowMedianPct=0&project` · chi tiết S02 · chi tiết S06 · chi tiết ngắn hạn | khách API |
| Bộ lọc | không lọc · area · market+bedroomsTotal · limit/offset | khách API |
| Route khác khi sổ hỏng | /health · markets · price-stats · coverage · properties | khách API (không lan) |
| Ô bỏ | nhánh thước CG8 khi sổ hỏng — ngoài phạm vi: chốt đóng chạy trước mọi nhánh, PB7 AC-4 đã đo CG8 khi sổ hợp lệ | — |

## 4. Không làm

- Không đổi bộ sinh sổ (`pipeline/lib/vocab-core.mjs`) để từ chối sổ rỗng lúc sinh — ngoài ranh giới GS giao (data-api/**); chốt ở
  data-api là lớp cuối, đóng cả khi tệp sinh bị sửa tay.
- Không đổi `/health` (vẫn 200 khi sổ hỏng) — mã 503 của chính `/v1/listings` đủ cho khách; đưa sổ vào health là quyết định vận hành.
- Không có ô nào trên màn Invest đổi: hàng nền API.
