# Bí danh viết tắt phân khu trong danh bạ — thiết kế

Hàng `bi-danh-viet-tat-phan-khu` (mã giữ chỗ DA51, dãy P2, sau DA46). Nguồn: GT5 `khoa-gom-hai-tang` Hỏi-1
(`d-20261119T152224Z-6`, Mạnh duyệt 20/11): bảng viết tắt phân khu vào danh bạ, GT5 chỉ đọc danh bạ.

## 1. Bài toán

Tin S03 ở Vinhomes Grand Park gọi phân khu bằng tên tắt: «ori» (The Origami), «rb» (The Rainbow), «bs» (The Beverly Solari),
«gh» (The Glory Heights). Danh bạ chưa có các tên này, nên bộ đọc phân khu của GT5 (`pipeline/lib/gom-tin-phan-khu.mjs` trên
`feat/khoa-gom-hai-tang`) không thấy phân khu ở 864 tin. GT5 đang tạm giữ bảng bốn tên trong probe; giữ bảng ấy trong mã là bản
sự thật thứ hai của danh bạ.

Hàng này đưa bốn tên tắt vào danh bạ qua một thẻ luật có băm, đảo được, và khai giao diện đọc. Phần GT5 bỏ bảng riêng là việc
của hàng GT5.

## 2. Bảng phủ ca (đếm trên DB máy thu, 20/11 01:30Z, chỉ đọc)

Lệnh: `node _acceptance/bi-danh-viet-tat-phan-khu/probes/bang-phu-ca.mjs`. Tập: 7.438 tin S03 đang sống có một dự án; 7.321 tin
thuộc dự án có nút phân khu. Luật khớp chép từ GT5: nút `subzone` con trực tiếp của dự án, tên + `aliases`, gập dấu, bỏ «the»,
khớp dài trước theo ranh giới từ.

### 2.1 Tên tắt × nút phân khu

| Tên tắt | Tên đích | Ứng viên (Grand Park, nút 16) | Nút đích | Đổi sau khi áp DA46 tối 20/11 | Ai đọc phía sau |
|---|---|---|---|---|---|
| ori | origami | 44 The Origami | 44 | không đổi | GT5 |
| rb | rainbow | 48 The Rainbow · 389 Rainbow (luật S16 số 2 đúc) | 48 | không đổi (DA46 không nối cặp này) | GT5 |
| bs | beverly solari | 387 The Beverly Solari (luật S16 số 2 đúc) | 387 | không đổi (DA46 không nối 387) | GT5 |
| gh | glory heights | 43 The Glory Heights · 388 Glory Heights (luật S16 số 2 đúc) | 43 | 388 nghỉ, thành con của 43 → ứng viên chỉ còn 43 | GT5 |

Không tên tắt nào khớp nút ở dự án khác. Nút nghỉ không bao giờ là đích; trước DA46, hai ứng viên cùng tên thì lấy nút không do
luật S16 đúc (cùng đích như sau DA46).

### 2.2 Token trong chữ tin

| Tên tắt | Tin chứa token (ranh giới từ) | Trong đó thuộc dự án có nút đích | Tin chỉ đọc được phân khu nhờ tên tắt |
|---|---:|---:|---:|
| ori | 431 | 431 | 416 |
| rb | 141 | 141 | 135 |
| bs | 384 | 384 | 352 |
| gh | 258 | 258 | 238 |

Soi ngữ cảnh (không ghi chữ bài): token đứng như tên phân khu («2pn bep rem rb 7tr2», «ban nhanh 2pn bs 2ty850»). Dính chữ số
(«bs1») không khớp vì ranh giới từ.

### 2.3 Số tin GT5 đọc được ít nhất một phân khu

| Kịch bản | Tin có phân khu | Tin mới có phân khu | Tin thêm phân khu thứ hai | Tin mất phân khu cũ |
|---|---:|---:|---:|---:|
| Hôm nay | 966 | — | — | — |
| Hôm nay + bí danh | 1.830 | 864 | 40 | 0 |
| Sau DA46 | 919 | — | — | — |
| Sau DA46 + bí danh | 1.786 | 867 | 37 | 0 |
| **Sau DA46, đo thật** (DA46 áp 15:06Z, luật 3; 7.744 tin) | 958 | — | — | — |
| **Sau DA46 đo thật + bí danh** | **1.843** | **885** | 37 | **0** |

**Đo thật sau DA46 (20/11 15:15Z, chỉ đọc trên DB máy thu):** bốn nút đích 44, 48, 387, 43 đều sống (không `meta.nghi`), con trực tiếp của dự án 16; thẻ gán đủ bốn, 0 không gán, băm `be14a012…76da4`. Số tin GT5 đọc được phân khu 958 → 1.843 (+885), tin chỉ đọc được nhờ từng tên ori 424 · rb 138 · bs 361 · gh 242, 0 tin mất phân khu cũ; token trong chữ ori 439 · rb 144 · bs 391 · gh 261. Nền 958 cao hơn dự kiến 919 vì tập tin nạp thêm từ 7.438 lên 7.744; mọi số vẫn trên sàn của AC-9 (tăng ≥ 800, ori 333 · rb 108 · bs 282 · gh 190). Lệnh: `_acceptance/bi-danh-viet-tat-phan-khu/probes/bang-phu-ca.mjs` và `--the`.

**Ô đổi sau khi áp DA46:** nền giảm 966 → 919 vì nút 382 The Beverly thành con của toà 23 nên rời từ điển phân khu (47 tin
mất tên «beverly»); không liên quan tên tắt. Mức giảm này chỉ nằm ở thước của GT5 (nhánh chưa gộp): trên `main` không bên đọc nào
khớp chữ tin với từ điển phân khu, và DB máy thu 20/11 có 0 thẻ địa chỉ nhóm, 0 phát biểu trỏ bảy nút sắp nghỉ của DA46 (đếm chỉ
đọc); ô số phân khu của trang Danh bạ Ops bỏ nút nghỉ là phần DA46 đã ký. Hàng này áp sau DA46, nên con số đích là cặp «Sau DA46». Số đo lại lúc áp, lệch
vì dữ liệu nạp thêm thì báo cạnh số chạy thử.

## 3. Lựa chọn

### 3.1 Ghi vào `asset_nodes.aliases`, không vào `registry_aliases`

`registry_aliases` có hai chỗ chết: cột `source` bắt buộc `S0x` (tên tắt do người chọn, không phải nguồn), và chỉ mục duy nhất
`(object_key, kind, value) WHERE kind = 'ten'` tính cả dòng đã nghỉ — đảo xong thì áp lại không chèn được cùng giá trị, mà trigger
chỉ-thêm cấm gỡ `retired_at`. `asset_nodes.aliases` là chỗ danh bạ giữ tên của nút; DA46 đã ghi vào đó qua thẻ luật kèm bản ghi
để đảo. GT5 đọc cả hai chỗ.

### 3.2 Thẻ luật theo khuôn DA32/DA46

Lệnh `pipeline/scripts/bi-danh-viet-tat-phan-khu.mjs`, lõi thuần `pipeline/lib/phan-khu-s16-bi-danh.mjs`:

- `--the <tệp>`: dựng thẻ, chỉ đọc. Mỗi tên tắt: nút đích (id, tên, dự án), số tin chứa token, hoặc «không gán» kèm lý do (không
  có nút · còn hơn một ứng viên). Dòng cuối `băm: <hex>`; băm phủ bảng tên tắt và đích.
- `--ap --bam <hex> --nguoi <tên>`: dựng lại thẻ trong giao dịch, băm lệch thì không ghi. Một dòng `project_link_rules`
  (`source 'S03'`, `can_cu 'S03-bi-danh-viet-tat-phan-khu'`). Mỗi nút đích: nối tên tắt vào cuối `aliases` (giữ thứ tự cũ), ghi
  `meta.bi_danh_viet_tat = {rule_id, them: [...]}` chỉ gồm tên chính lượt thêm. Áp lần hai không đổi gì.
- `--dao <rule_id> --nguoi <tên>`: gỡ đúng các tên trong `them` khỏi `aliases`, bỏ khoá meta, ghi `dao_by`/`dao_at`. `rule_id`
  không phải lượt bí danh (`can_cu` khác) → từ chối, không ghi (bài học DA46 Ngoài-5).
- `--kiem <rule_id>`: thoát 0 khi mọi tên của lượt nằm trên nút chưa nghỉ; thoát 1 nêu id nút khi thiếu tên hoặc nút đích đã nghỉ
  (ví dụ đảo luật S16 số 2 làm 387 nghỉ).
- `--do [--rule <id>]`: in số tin S03 đọc được phân khu qua danh bạ, có và không có tên của lượt (luật khớp như §2).

Không migration: chỉ ghi `asset_nodes` (cột có sẵn) và `project_link_rules`.

### 3.3 Giao diện đọc

Bên đọc lấy tên tắt từ `asset_nodes.aliases` của nút `subzone` con trực tiếp của dự án, đúng câu `SQL.tuDien` GT5 đang có.
Lõi khai `docTenPhanKhu(client)` trả `[{du_an, nut, name, aliases}]` theo đúng câu ấy, lọc nút nghỉ; GT5 chuyển sang hàm này trong
hàng của nó.

### 3.4 Với DA46

Thứ tự áp không quan trọng: DA46 dồn bí danh của 388 về 43 bằng cách nối thêm, đảo DA46 chỉ gỡ bí danh của nút mới, nên «gh» trên
43 còn nguyên. Đảo bí danh chỉ gỡ tên trong `them`, không gỡ bí danh DA46 dồn về.

### 3.5 Cloud

`asset_nodes` đã đồng bộ lên cloud mỗi đêm; tên tắt đi cùng. Không DDL cloud, không bảng mới. Bộ soát S16 của đường cloud vẫn
phải sạch (meta không mang mã khu thô).

## 4. Hồ sơ áp lên DB máy thu (năm thứ)

0. Trước khi áp: DA46 đã áp và `node pipeline/phan-khu-s16.mjs --kiem-noi <rule_id DA46>` thoát 0; thẻ bí danh dựng lúc ấy phải gán
   đúng 44, 48, 387, 43, và cả bốn nút không nằm trong bảy nút nghỉ của DA46 (382, 388, 391, 392, 394, 395, 397) — lệch thì dừng.
1. Lệnh áp: `node pipeline/scripts/bi-danh-viet-tat-phan-khu.mjs --the <tệp>` rồi `--ap --bam <băm> --nguoi Mạnh`, sau khi PR gộp,
   từ `main`, sau bước 0.
2. Số chạy thử: AC-9 trên bản chép DB máy thu (gán, số đo trước/sau, đảo).
3. Sao lưu trước: `pg_dump -t asset_nodes -t project_link_rules`.
4. Cách lùi: `--dao <rule_id> --nguoi <tên>`.
5. Lệnh kiểm sau: `--kiem <rule_id>` và `--do --rule <rule_id>` (tổng và từng tên tắt); sau lượt đồng bộ đêm đầu tiên, đếm
   bốn tên tắt trên `asset_nodes` ở cloud, so với máy thu — CHỈ ĐỌC, chạy sau lượt đêm; không gọi sync-cloud bằng tay để đẩy sớm.
   Kỳ vọng trên cloud: 4 nút (44, 48, 387, 43), mỗi nút mang đúng một tên tắt của lượt.

Độ đúng của từng lần khớp (tin «bs» có thật là Beverly Solari không) đo ở thước của GT5 (mẫu giữ riêng AC-9 của
`khoa-gom-hai-tang`); hàng này chỉ bảo đảm tên tắt nằm đúng nút và khớp được tin.

## 5. Ngoài phạm vi

- GT5 bỏ bảng viết tắt trong mã: hàng GT5 (`feat/khoa-gom-hai-tang`).
- Tên tắt khác chưa trong bảng của GT5 (ví dụ «be» cho The Beverly): cần đếm và người chọn, hàng sau.
- Bộ đọc GT5 lọc nút nghỉ: việc của GT5 (cùng lớp DA49).
- Trang Danh bạ Ops hiện tên tắt: trang đã đọc `aliases`, không cần sửa; không đo ở hàng này.

## Đặc tả UX

Bỏ: hàng không chạm giao diện (xem dòng `bỏ đặc-tả-UX` trong sổ quyết định).
