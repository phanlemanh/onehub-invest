# Gắn căn = nhận diện duy nhất — thiết kế (hàng `gan-can-dinh-danh-duy-nhat`)

Ngày 08/11/2026 · dãy N1 · nguồn: lời giao của giám sát và bản tổng hợp quyết định 08/11 (thư mục ghi chú giám sát:
`tong-hop-gan-can-quyet-dinh-20261108.md` mục B Q1–Q2, mục C V2, V3, V5; bản áp `framing-34-viet-lai-20261108.md`; số đo
`chi-so-gan-can-dataflow-20261108.md`). Mạnh: «Đồng ý và viết lại Framing»; «Đồng ý đổi» cho câu «Đổi tên bậc B2 thành
"Định vị" và không tính 67.688 cụm S06 tự dựng là B2 nữa».

## 1. Vì sao

Cột «Gắn căn» trên `/ops/data-flow` đếm tin có ít nhất một dòng `property_offers`. Người ghi `property_offers` duy
nhất là Stage A của `resolve-properties` (chỉ S06), và Stage A cho MỖI tin S06 một cụm (khoá lưới 55 m × loại × DT ×
giá). Số S06 gần 100% theo cấu tạo (74.557/74.581), không bao giờ đỏ; S03 0/4.885 dù 53% tin S03 ghi toà. Chú thích
«Thiếu phường hoặc toạ độ để ghép căn» sai với S03 (4.672 tin có phường vẫn 0).

Mạnh chốt 08/11 (Q1): «gắn được căn là đã nhận diện duy nhất, thực tế nó giống như mà có số nhà, có mã căn»; tin, gom
tin, gom cụm vẫn có nghĩa riêng. Thang mới (Q2): B0 Có lời khai · B1 Tin (gồm gom trùng) · B2 Định vị (dự án/toà/trục) ·
B3 Gắn căn · B4 Làm giàu · B5 Sống; gom cụm không là bậc. FRAMING mới: «Mã có trong chữ của tin là điều kiện cần; chỉ
tính khi mã khớp một căn có thật trong danh bạ»; B2 là «tin gắn vào dự án, toà hoặc trục có trong danh bạ, kèm bằng chứng».

## 2. Phạm vi vòng này · không làm · phản mục tiêu

Làm (V2, V3, V5 của bản tổng hợp):
1. `docs/product/FRAMING.md`: thay bảng §3.4 và các gạch sau nó bằng bản áp, sửa năm dòng nhắc thang cũ, thêm dòng nhật ký.
2. `CONTEXT.md`: ba thuật ngữ «Gắn căn», «Định vị», «Gom cụm» đủ nhãn · code · slug · định nghĩa · _Avoid_; sửa «Căn
   nhà» (cụm S06 không phải căn đã gắn); sửa «Dòng chảy dữ liệu» theo thang mới.
3. `/ops/data-flow`: lưới thay cột «Gắn căn» bằng ba cột Gom cụm · Định vị · Gắn căn, mỗi cột là phần trăm trên Tin rao;
   Sankey, biểu đồ «Chặng theo ngày», ngăn chi tiết tin dùng cùng định nghĩa; chú thích nhánh rơi nói lý do thật.

Không làm:
- V4 — bậc dữ liệu chạy hằng ngày (`610_data_level.sql`, `do-hang-ngay` của DO1, `lib/data-level.ts`, nhãn B0–B5 trong
  `mappings.yaml` + `ref_lookup` cần migration, khối bậc ở ngăn tin, ngày đổi thang trên `/ops/quality`): hàng riêng, đã
  báo giám sát. Tới khi hàng đó gộp, FRAMING đã nói cụm S06 về B1 mà số bậc hằng ngày và khối bậc ở ngăn tin còn hiện
  «B2 · Gắn căn».
- Bộ gắn tin vào nút danh bạ (bảng nối tin → nút, V9): chuỗi GC0–GC3; hàng này chỉ đo và để sẵn chỗ đọc.
- Sửa khoá cụm Stage A, đóng băng Stage B (V7), cờ S06 «0»/«1» (V8), trạng thái ngừng rao (V6), tài liệu mô hình (V10).

Phản mục tiêu: một thước lại tự đúng theo cấu tạo; chữ trên tin (toà, mã căn) đếm thành Định vị hay Gắn căn khi chưa khớp
danh bạ; số cũ của cloud hiện dưới nhãn mới.

## 3. Định nghĩa đếm (đơn vị: tin rao sống S03/S05/S06, cửa sổ theo `first_seen`)

| Cột | Khoá `facts` | Tin được đếm khi |
|---|---|---|
| Gom cụm | `clustered` | tin nằm trong một cụm `properties` có từ hai tin sống trở lên |
| Định vị | `located` | tin gắn vào một nút dự án, toà hoặc trục của danh bạ — chưa có bảng nối nên 0 |
| Gắn căn | `unitLinked` | tin khớp đúng một nút căn của danh bạ bằng định danh duy nhất — chưa có bảng nối nên 0 |
| chờ khớp (ghi chú) | `locatedPending` | tin ghi toà (`block_raw` khác rỗng) hoặc trục (mã căn che tầng `…xx…`) mà chưa Định vị |
| chờ khớp (ghi chú) | `uniqueIdPending` | tin mang định danh duy nhất mà chưa Gắn căn: toà + mã căn đầy đủ (không che tầng, không phải «0», «1»), hoặc số nhà (không phải «0», «1») + đường + phường |

Hai cột danh bạ đọc từ hai CTE rỗng có chú thích («chưa có bảng nối tin → nút danh bạ, V9»): chỗ duy nhất phải đổi khi
bộ gắn ra đời. Ba cột độc lập, không lồng nhau. Sankey chia «Tin rao mới» theo mức SÂU NHẤT, loại trừ nhau: Gắn căn ›
Định vị › Gom cụm › «Chưa định vị» (khoá `deepest`), để dòng bảo toàn.

Số đo DB chung 08/11 (cả thời gian): S06 74.581 tin — gom cụm 14.633 (19,6%), ghi toà/trục 549, đủ định danh 16.283;
S03 5.065 — gom cụm 0, ghi toà/trục 2.671 (52,7%), đủ định danh 156; S05 30 — ghi toà 1. Định vị, Gắn căn 0 mọi nguồn.

## 4. Cách làm (phần đã quyết)

- `pipeline/sql/600_data_flow.sql`: `offers_daily` thay `linked` bằng `clustered`, `located`, `unit_linked`,
  `located_pending`, `unique_id_pending`, `deep_located`, `deep_clustered`. Cỡ cụm tính trên mọi tin sống (không theo cửa
  sổ). `sources[]` mang `clustered`, `located`, `unitLinked`, `locatedPending`, `uniqueIdPending`,
  `deepest {unitLinked, located, clustered}`; `days[]` mang `unitLinked` thay `linked`. Khoá `linked` bỏ khỏi `facts`.
- `push-ops-facts.mjs` không đổi (chở nguyên `facts`). Khối cloud đời trước (thiếu khoá mới, tới lượt làm tươi kế, ≤15′)
  hiện «—» kèm một dòng báo, không hiện số cũ.
- App: `data-flow-queries.ts` (kiểu; bản ghi tin thêm `identification` — mức sâu nhất, đọc `unit_number` qua `to_jsonb`
  vì cloud không có cột đó), `flow-sankey-data.ts`, `quality-rows.ts`, `quality-grid.tsx`, `stage-trend-*`,
  `stage-face.tsx`, `record-sheet.tsx`, `flow-journey.tsx`. Khối bậc (`LevelGate`, `levelOf`) không đổi ở vòng này.
- Luật nút thắt (`NUT_THAT_CHECKS`): theo Hỏi-1 (khuyến nghị: bỏ kiểm «gắn căn» tới khi có bộ gắn).

## 5. Đặc tả UX

<!-- ux-spec: khung đã có; vòng đổi số và nhãn trên khuôn sẵn, không thêm màn -->
- Màn: `/ops/data-flow` (Ops, bắt buộc đăng nhập), khuôn sẵn: Sankey `@reui/chart-49` chuyển thể, lưới `data-grid`,
  biểu đồ chặng theo ngày, ngăn chi tiết tin.
- Lưới: ba cột mới đứng đúng chỗ cột «Gắn căn» cũ, cùng ô `StageCell` (số / phần trăm trên Tin rao); ô Định vị và Gắn
  căn thêm dòng phụ «N chờ khớp» khi `locatedPending` / `uniqueIdPending` > 0; hàng nhóm thu và S01 hiện «—».
- Sankey: cột cuối các nút xếp trên xuống Gắn căn · Định vị · Gom cụm · Chưa định vị; nút 0 bị bỏ như cũ; tiêu đề cột
  «Gắn căn» là số đích (`focal`); gợi ý nút «Chưa định vị» nói số tin ghi toà/trục và số tin đủ định danh đang chờ khớp
  danh bạ.
- Ngăn tin: dòng «Căn» (Đã gắn/Chưa gắn) đổi thành «Mức nhận diện» (Gắn căn · Định vị · Gom cụm · Chưa định vị) kèm
  «ghi toà/trục, chờ khớp» khi có.
- Trạng thái: rỗng/đang tải/lỗi giữ khung trang; khối cloud thiếu khoá mới → ô «—» và một dòng «Số mức nhận diện có ở
  lượt làm tươi kế».

## 6. Để thợ quyết

Tên biến, màu hai nút mới theo bảng màu dữ liệu (`onehub-ui/data-color.md`), câu chữ ghi chú trong khuôn trên.
