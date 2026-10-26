# so-nhom-mot-noi — thiết kế (PL12)

Căn cứ: hàng PL12 của `docs/plan/lo-trinh.json` (sửa 25/10: sổ đơn vị thu của đợt `tu-van-hanh-2510`); review phân loại
§0.3 F1 (`SN`: một sổ nhóm cho mọi nguồn, mỗi nhóm khai dự án nhóm chuyên); `docs/research/ops-tu-van-hanh-nguon-saas.md`
§3.2 (`collection_units`), §4.8 #7 (mã `S03-N012`); ADR-0015; TV2a `vong-doi-nguon` (#129, vòng đời 047).
Thuật ngữ: CONTEXT.md «Đơn vị thu» (`collection_unit`). Hồ sơ: `_acceptance/so-nhom-mot-noi/`.

## Vấn đề

Đơn vị thu nằm ở ba chỗ, ba khuôn: nhóm S05 và vùng S06 ở bảng `source_groups`; nhóm S03 ở cấu hình gateway (tệp cấu
hình trên máy thu, chỉ có id nhóm và cờ bật); market S02 ở `airdna_markets`. Không đơn vị nào có mã ổn định, thị trường
hay dự án nhóm chuyên. TV11 (độ phủ thị trường), ON19/ON20 (tiêu đề, mô tả), TV5/TV6 (lệnh `unit.*`) đều đứng trên một
sổ chung.

## Quyết định chính

**Một bảng, không bảng thứ hai.** `source_groups` đổi tên thành `collection_units` (giữ nguyên dòng, id, trigger và
CHECK của 047). Tên cũ thành một view tương thích, chỉ gồm S05 và S06:

```
CREATE VIEW source_groups AS SELECT <đúng các cột cũ + status, reason, resume_when> FROM collection_units
  WHERE source_code IN ('S05', 'S06');
```

View một bảng có lọc đơn giản thì PostgreSQL cho ghi xuyên qua (auto-updatable): `INSERT/UPDATE/DELETE` và `SELECT … FOR
UPDATE` vào `source_groups` chạy y như hôm nay, trigger của 047 vẫn chạy trên bảng gốc. Script thu của làn ZCode, route
`source-groups`, `che-do-thu`, `ha-bung-het-han` không phải sửa. Lối khác — bảng mới song song đồng bộ hai chiều — là
hai nguồn sự thật (đúng G2 của tài liệu nguồn).

**Cột mới trên `collection_units`** (migration số do phiên liên làn cấp):

| cột | kiểu | luật |
|---|---|---|
| `unit_code` | text UNIQUE NOT NULL | `^S0[0-9]-[NVM][0-9]{3}$`; máy sinh lúc chèn (trigger), theo cặp (nguồn, loại) tăng dần; không bao giờ cấp lại kể cả khi đơn vị `retired`; không sửa được sau khi cấp |
| `unit_type` | text NOT NULL CHECK | `nhom` (N) · `vung` (V) · `market` (M); dòng cũ: S05 → `nhom`, S06 → `vung` |
| `original_name` | text | tên như nguồn hiện (tầng C — tên nhóm); dòng cũ chép từ `name` |
| `market_codes` | text[] NOT NULL DEFAULT '{}' | mỗi phần tử là `areas.id` có `region_type = 'market'` (trigger kiểm, sai thì từ chối) |
| `project_node_ids` | bigint[] NOT NULL DEFAULT '{}' | mỗi phần tử là `asset_nodes.id` có `node_type = 'project'` (khu đô thị) — «dự án nhóm chuyên» |

Không thêm `display_title`/`description` ở đây: đó là ON19. Cột `name` cũ giữ nguyên (view còn đọc nó).

**Bộ đếm mã**: bảng nhỏ `collection_unit_seq (source_code, unit_type, last int)`, khoá dòng `FOR UPDATE` trong trigger
chèn; backfill dòng cũ theo thứ tự `id`. Xoá dòng (route `delete` cũ) không trả số về bộ đếm.

## Đưa S03 và S02 vào sổ — script đồng bộ chỉ đọc nguồn

`pipeline/sync-don-vi.mjs` (chạy tay hoặc từ job local; không chạy ở cloud):

- **S03**: đọc cấu hình gateway CHỈ ĐỌC qua hàm sẵn có `effectiveEnabledGroups` (bản .mjs tương đương bên máy thu), lấy
  id nhóm và cờ bật; tên nhóm lấy từ bộ nhớ đệm danh bạ nhóm nếu có. Upsert `unit_type = 'nhom'`, `unit_key = id nhóm`;
  bật ở gateway → `active`, có trong cấu hình nhưng tắt → `paused` lý do «tắt ở gateway». Không ghi một byte nào vào
  cấu hình gateway (luật 8; ca thử băm tệp trước/sau). Nhóm biến khỏi cấu hình → `retired`, không xoá dòng.
- **S02**: đọc `airdna_markets` (43 market); upsert `unit_type = 'market'`, `unit_key = airdna_id`; `market_codes` lấy từ
  `area_sources` (nguồn S02) khi có ánh xạ.
- Chạy lại hai lần không đổi gì. Script không in id nhóm S03 hay tên nguồn thật ra stdout.

Trạng thái S03 trong sổ là **bản soi** của gateway: đổi trạng thái S03 trên sổ không bật/tắt gì ở gateway (việc của
TV6 qua bộ áp). Sổ ghi rõ điều đó cho người xem.

## Trang `/ops/sources` (máy thu, admin)

Lưới hiện có thêm một khu «Sổ đơn vị thu»: mỗi dòng một đơn vị của mọi nguồn — mã đơn vị, nguồn (nhãn nguồn), tên gốc,
thị trường, dự án, trạng thái. Admin sửa thị trường và dự án qua một hộp thoại (action `set-meta` của route
`source-groups`, chỉ phiên admin, ghi `ops_audit` cùng giao dịch). Tên nhóm là tầng C; khoá nhóm (URL S05, id nhóm S03)
không hiện. Chi tiết UX ở mục Đặc tả UX dưới.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: admin mở `/ops/sources` → khu «Sổ đơn vị thu» → chọn tab nguồn → bấm «Khai thị trường, dự án» ở một dòng → chọn thị trường và khu đô thị → Lưu → dòng hiện thị trường, dự án mới (điểm ra: ở lại lưới).
- Biên: nguồn chưa có đơn vị nào (S02 trước khi chạy script đồng bộ) → trạng thái trống; đơn vị S03 có trạng thái là bản soi gateway → nhãn phụ «theo gateway»; người không phải admin không thấy trang (cổng `/ops/sources` hiện có).
- Lỗi & quay lại: Lưu lỗi (403, mã thị trường sai) → chữ lỗi hiện ngay trong hộp, hộp không đóng; Huỷ đóng hộp, dòng không đổi.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Khu «Sổ đơn vị thu» trên `/ops/sources` | Xem mọi đơn vị thu của mọi nguồn ở một chỗ | Thanh bên Ops → Nguồn / ở lại trang |
| Hộp «Khai thị trường, dự án» | Gắn thị trường và khu đô thị cho một đơn vị | Nút ở dòng / đóng về lưới |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-so-loading | Khu sổ | Skeleton của lưới (trang tải phía máy chủ, chỉ khi chuyển tab) | chờ |
| ST-so-empty | Khu sổ | `Empty` (`ui/empty`): «Chưa có đơn vị nào» · «Chạy đồng bộ sổ ở máy thu để đưa đơn vị của nguồn này vào.» · một hành động sao chép lệnh | chạy `node pipeline/sync-don-vi.mjs` |
| ST-so-error | Khu sổ | `states/region-error.tsx`: «Không đọc được sổ đơn vị thu» + Thử lại | Thử lại |
| ST-so-ok | Khu sổ | Lưới: mã đơn vị · nguồn · tên gốc · thị trường · dự án · trạng thái (Badge) | bấm khai |
| ST-hop-luu | Hộp khai | Nút Lưu khoá trong lúc gửi | chờ |
| ST-hop-loi | Hộp khai | Chữ lỗi máy chủ trong hộp | sửa rồi Lưu lại, hoặc Huỷ |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Thị trường chọn từ danh sách 34 thị trường (tên tiếng Việt), nhiều lựa chọn; khu đô thị chọn từ node `project` của `asset_nodes`, nhiều lựa chọn.
- Không hiện khoá nhóm (URL S05, id nhóm S03) ở bất kỳ ô nào; tên gốc là tầng C.
- Trạng thái chỉ đọc trong khu này (đổi trạng thái là việc của công tắc hiện có cho S05/S06 và của TV6 cho S03).

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `StatusGrid` (collections) | dùng | lưới có tab theo nguồn đã dùng trên trang này |
| `Badge` (reui) | dùng | trạng thái vòng đời theo biến thể `-light` |
| `Dialog` + nút | ghép | cùng khuôn `ModeDialog` của C7 |
| `ui/combobox` (chọn nhiều) | dùng | chọn thị trường và khu đô thị; catalog onehub-ui không có mẫu chọn nhiều riêng |
| `ui/empty`, `states/region-error.tsx` | dùng | trạng thái trống và lỗi vùng theo bảng «Một loại UI, một cách làm» |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: luồng hiển nhiên — lưới đơn vị là danh sách, hộp khai là chi tiết sửa một dòng; cùng khuôn với lưới nhóm thu và hộp «Chế độ thu» đang có trên trang.
<!-- UX-SPEC-TEMPLATE>>> -->

## Ngoài phạm vi

- Lên cloud: sổ chưa vào `CLOUD_ALLOW`; đưa lên đi cùng TV4/TV11 (lệnh, độ phủ).
- Tiêu đề chuẩn, mô tả nhóm (ON19), màn sửa trên cloud (ON20), lệnh `unit.*` (TV5/TV6).
- Bật/tắt nhóm S03 từ sổ (TV6).
