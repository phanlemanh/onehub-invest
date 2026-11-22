# Gộp nút phân khu trùng bằng mã căn S16 — thiết kế

Hàng `gop-nut-trung-ma-can-s16` (DA53, dãy P2, GS cắt 21/11), nối tiếp DA46 (`noi-phan-khu-trung-s16`, lượt nối 3) và DA51
(`bi-danh-viet-tat-phan-khu`, lượt 4). Đề xuất gốc: thư mục ghi chú chung của đợt, `P2-de-xuat-gop-nut-48-389.md`.

## 1. Bài toán

Grand Park có hai nút phân khu cho The Rainbow:

- **48 «The Rainbow»:** danh bạ gốc. Mang khu S16 «The Rainbow» (17 toà, 10.550 căn) và bốn phân khu con S1, S2, S3, S5.
- **389 «Rainbow»:** luật S16 số 2 đúc ra. Mang khu S16 «Rainbow» (1 toà, 16 căn).

DA46 không nối cặp này vì chỉ nhận bằng chứng toà S09; thẻ nối ghi 389 là «chỉ gần tên, không có bằng chứng toà». Cả 16 mã căn của
khu «Rainbow» đều mang tiền tố một toà của khu The Rainbow (S1.01, S1.02, S1.06, S2.05, S3.02, S3.03, S5.03), và 8 mã trùng hẳn với mã
căn trong khu The Rainbow. Khu «Rainbow» là danh sách thứ hai của chính The Rainbow.

Hệ quả hôm nay: bộ đọc theo id nút thấy hai nút cho chữ «Rainbow». Bộ gắn toà của PL20 rơi vào «chữ và model chỉ ra hai nút khác
nhau» ở 116 tin. Danh bạ Ops đếm thừa một phân khu ở Grand Park.

Hàng này thêm loại bằng chứng «mã căn S16» vào bước chọn cặp nối của DA46 và dùng lại máy nối, đảo, kiểm đã ký.

## 2. Bảng phủ ca (DB máy thu và bản chép `oneinvest_p2_gnt`, 21/11 khoảng 10:40Z)

Lệnh: `_acceptance/gop-nut-trung-ma-can-s16/probes/quet-ma-can.mjs` (chỉ đọc, DB máy thu), `probes/do-ben-doc.mjs` và
`probes/do-p4.mjs` (bản chép, gộp trong giao dịch rồi lùi).

### 2.1 Bằng chứng mã căn trên toàn danh bạ

Quét 44 nút do luật S16 đúc còn sống. Mỗi nút so với mọi nút phân khu khác cùng dự án mà không do luật đúc và chưa nghỉ. «Trùng» là
mã căn có ở cả hai khu; «mang tiền tố» là mã căn bắt đầu bằng tên một toà của khu nút kia, ngay sau là dấu chấm, hoặc tên toà có
dấu chấm và ngay sau là chữ số (toà «S1» không nhận mã «S10.01»).

| Nút luật | Mã căn | Ứng viên | Trùng | Mang tiền tố | Phán theo ngưỡng §3.1 | Ai đọc phía sau |
|---|---:|---|---:|---:|---|---|
| 389 Rainbow | 16 | 48 The Rainbow | 8 | 16 | nối | PL20, GT5, danh bạ Ops, `v_toa_nut_vung`, cloud |
| 398 Sapphire 2 | 19 | 42 S2 | 0 | 19 | cần người chọn | như trên |
| 396 Parking zone | 202 | 30 The Pavilion | 0 | 36 | không nối (dưới ngưỡng) | — |
| 41 nút còn lại | — | không ứng viên | 0 | 0 | không nối | — |

Năm ca DA46 để ngỏ:
- 398/392 nằm ở dòng 398 ở trên.
- 406/411, 409/412, 419/421 là cặp hai nút cùng do luật đúc. Bằng chứng mã căn chỉ so với nút không do luật đúc, nên ba cặp này không
  vào thẻ và ngoài phạm vi.
- 387: không có ứng viên.

### 2.2 Bên đọc, trước → sau khi gộp 389 vào 48

| Bên đọc | Ô | Trước | Sau |
|---|---|---:|---:|
| `docTenPhanKhu` (GT5) | nút phân khu Grand Park | 13 | 12 |
| `docTenPhanKhu` | nút mang tên «rainbow» | 48, 389 | 48 |
| `v_toa_nut_vung` | toà ở 48 · 389 | 17 · 1 | 18 · 0 |
| `asset_nodes` (danh bạ Ops) | phân khu còn sống · ở Grand Park | 75 · 13 | 74 · 12 |
| GT5 `doBiDanh` | tin đọc được phân khu (7.945 tin) | 1.882 | 1.882 |
| PL20 bộ gắn (sha e27d1e690, 7.511 tin) | tin gắn toà hay vùng | 3.962 | 4.063 (+101) |
| PL20 | ô «chữ và model khác nút» | 116 | 13 |
| PL20 | tin xung đột | 21 | 23 |
| PL20 | bài «nhiều vùng» (`chu-nhieu-vung` + `model-nhieu-vung`) | 1.409 | 1.409 |

**Đo lại số P4 báo:** «+101 tin gắn được, xung đột 21 → 23» khớp. «Khoảng 800 lượt bài nhiều vùng do cặp 48/389» không khớp:
- Số bài mang lý do nhiều vùng của bộ đọc PL20 không đổi khi gộp (1.409 cả trước lẫn sau).
- Phần đổi nằm ở ô «chữ và model khác nút»: 116 → 13.
- GT5 khoá theo tên đã bỏ «the», nên 48 và 389 vốn cùng khoá; số của GT5 không đổi.

Vì vậy thước xong của hàng là số tin PL20 gắn được và ô «chữ và model khác nút», không phải số bài nhiều vùng.

## 3. Lựa chọn

### 3.1 Loại bằng chứng thứ hai trong `keHoachNoi`

Với nút luật không qua được bằng chứng S09, xét bằng chứng mã căn. S09 đã chỉ ra nút giữ thì mã căn không đổi được kết quả.

- **Nối** khi đủ cả ba điều kiện:
  - mọi mã căn của khu nút luật mang tiền tố một toà thuộc khu của đúng một nút ứng viên;
  - ít nhất 3 mã trùng hẳn với mã căn trong khu của nút ấy;
  - nút ứng viên cùng dự án, không do luật đúc, chưa nghỉ.
- **Cần người chọn:** mọi mã mang tiền tố của đúng một ứng viên nhưng dưới 3 mã trùng hẳn, hoặc mọi mã khớp từ hai ứng viên trở lên
  (kể cả cha và con). Thẻ liệt, lượt nối không nối.
- **Không nối:** các ca còn lại. Có ứng viên một phần thì ghi lý do «dưới ngưỡng mã căn».

Ngưỡng 3 mã trùng theo đúng con số «ít nhất 3 toà chung» Mạnh chốt cho bằng chứng S09 ở Cổng Phạm vi DA46. Đây là loại căn cứ mới nên
lên thẻ thành Hỏi-1.

### 3.2 Dùng lại máy nối của DA46

`apNoi` / `daoNoi` / `kiemNoi` không đổi luật ghi. Cặp có căn cứ mã căn đi đúng đường của cặp S09:
- nút luật mang `meta.nghi`, cha thành nút giữ lại;
- khoá khu chuyển sang `s16_khu_ids` của nút giữ;
- bí danh nối vào cuối `aliases` của nút giữ;
- bản ghi `noi_goc` dùng để đảo.

Thẻ thêm cột «căn cứ» (`toa-s09` · `ma-can-s16`) và số mã trùng / mang tiền tố / tổng. Thẻ không in mã khu, toà, căn thô. Băm phủ cả
loại căn cứ, nên một lượt nối mới mang băm mới. Lượt 3 của DA46 không bị chạm.

### 3.3 Không migration

Chỉ ghi `asset_nodes` (cột có sẵn) và `project_link_rules`, như DA46.

## 4. Hồ sơ áp lên DB máy thu (năm thứ)

0. **Trước khi áp:**
   - PL20 (`ghep-tin-vao-danh-muc`) đã qua Cổng Bằng chứng, để đầu ra đóng băng của P4 không đổi dưới chân nó.
   - `--kiem-noi 3` (DA46) và `--kiem 4` (DA51) thoát 0.
   - Thẻ nối dựng lúc ấy gán đúng 389 → 48 bằng mã căn, 398 → 42 ở mục cần người. Lệch thì dừng.
1. **Lệnh áp:** `node pipeline/phan-khu-s16.mjs --the-noi <tệp>` rồi `--noi --bam <băm> --nguoi Mạnh`. Chạy sau khi PR gộp, từ `main`.
2. **Số chạy thử:** AC-8 trên bản chép DB máy thu (§2.2); bộ gắn PL20 ghim sha e27d1e690, đo trước và sau trên cùng sha.
3. **Sao lưu trước:** `pg_dump -t asset_nodes -t project_link_rules`.
4. **Cách lùi:** `--dao-noi <rule_id> --nguoi <tên>`.
5. **Lệnh kiểm sau:**
   - `--kiem-noi <rule_id>`, `--kiem-noi 3`, `--kiem 4`.
   - Đo các ô §2.2 bằng `probes/do-ben-doc.mjs` và `probes/do-p4.mjs` trên bản chép mới.
   - Sau lượt đồng bộ đêm đầu tiên: đếm chỉ đọc `asset_nodes` trên cloud, 389 mang `meta.nghi` và có cha là 48. Không gọi sync-cloud
     bằng tay.

## 5. Ngoài phạm vi

- **Nối 398 → 42:** thẻ đưa ra cho người. Muốn nối thì làm ở hàng sau, có lời người.
- **Cặp hai nút cùng do luật đúc** (406/411, 409/412, 419/421): bằng chứng mã căn không so nút luật với nút luật; cần bước gộp riêng.
- **Bước gom tin lẫn phân khu** (P4 ghi ít nhất 25 tin): việc của bước gom.
- **Sửa bộ gắn PL20 hay GT5:** hàng này chỉ sửa danh bạ.

## Đặc tả UX

Bỏ: hàng không chạm giao diện (xem dòng `bỏ đặc-tả-UX` trong sổ quyết định).
