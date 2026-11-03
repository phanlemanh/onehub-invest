# Xu hướng giá theo phường · dự án · toà — bù quá khứ bằng chỉ số tổng hợp công khai

Ngày: 2026-11-03 · Trạng thái: **đề xuất, chờ Mạnh đọc** · Loại: căn cứ (ROADMAP §0), đầu vào cho lượt cắt sau; không
thêm hàng vào lộ trình. Nối tiếp `market-selection-synthesis-proposal.md` (bài học B6, năng lực N2, tính năng T5).
Nguồn gọi bằng mã (ADR-0007 sửa đổi 26/10): **S06** rao vặt công khai · **S07** cổng rao · **S08** danh mục dự án.

Câu hỏi của Mạnh: làm được **xu hướng tăng/giảm giá và trung vị ở mỗi phường, dự án, toà** như trang tham khảo giá của
S06 và trang dự án của S07 không; và dùng chính các chỉ số tổng hợp đó **bù phần quá khứ** OneHub chưa có, để có bộ chỉ
số kiểu BiggerPockets ở từng cấp.

**Ký hiệu:** **QS** quan sát trực tiếp 03/11 bằng ego-browser (chỉ đọc chữ và chụp màn hình, không gọi API) · **TL**
đọc từ migration và tài liệu của kho · **SL** suy luận. Bằng chứng thô: `research-local/gia-tham-khao-2026-11-03/`
(không commit). Máy viết tài liệu này không phải máy thu (không có DB OneHub), nên phần dữ liệu nội bộ dựa trên TL.

---

## 0. Kết luận

1. **Làm được, và nên làm theo ba cấp: phường · dự án/phân khu · toà.**
   - S06 cho chuỗi **12 tháng** theo tỉnh và quận/huyện, tách theo loại và loại con. Một lần đọc bù được ngay 12 tháng
     quá khứ ở cấp quận.
   - S07 cho giá/m² **theo dự án và từng phân khu con**, kèm mức thay đổi một năm, số tin đang rao và lượt xem 7 ngày.
   - Toà thì cả hai đều không có. OneHub đi tới toà nhờ danh bạ toà · trục · căn (DB1, DBG) và tin có mã căn.
2. **Không được chép nguyên chỉ số của nguồn.** Ở cùng khu căn hộ Gia Lâm (phần lớn là Ocean Park): S06 ghi **−0,9%** so
   với cùng kỳ năm trước, S07 ghi **−16,2%** cho dự án trong một năm. Ngay trên một trang S06 còn có hai con số «trung
   bình» mâu thuẫn (QS). Chỉ số tổng hợp công khai lệch nhau vì định nghĩa, cơ cấu mẫu và giá rao.
   → Dùng chúng làm **dải tham chiếu và kiểm chiều đi**, hiệu chỉnh về thang của OneHub, ghi rõ trên từng điểm dữ liệu.
3. **Chuỗi nên ghép hai đoạn:** quá khứ = tham chiếu đã hiệu chỉnh; từ nay = tự đo. Điểm nối đánh dấu, dải bất định =
   độ lệch giữa các nguồn. Đây là cách duy nhất có «tăng giá năm» ở cấp phường/dự án **trước cuối 2027**.
4. **Lõi dài hạn vẫn là chỉ số của chính OneHub trên cùng một căn** — thứ không nguồn tham chiếu nào có.
   - Sổ lịch sử theo RESO (`history_transactional`, 059) ghi tin mới, đổi giá, gỡ, đã cọc, đã bán theo căn.
   - Từ đó tính được **chỉ số giá lặp lại** (cùng căn, hai thời điểm), loại được sai lệch do cơ cấu mẫu: đúng nguyên
     nhân làm S06 và S07 lệch nhau.
5. **Cần một quyết định chính sách trước khi thu:** dùng chỉ số tổng hợp của S06/S07 thế nào — chỉ hiệu chuẩn nội bộ,
   hay được hiện trên cổng dưới dạng chuỗi đã hiệu chỉnh có nhãn (§7). S08 đã có tiền lệ «chỉ nội bộ, không tái xuất
   nguyên văn».

---

## 1. Hai nguồn tham chiếu — quan sát 03/11

### 1.1 S06 — trang tham khảo giá (QS)

| Khía cạnh | Quan sát |
|---|---|
| Phạm vi | Trang chủ: «Chi tiết đến từng phường / huyện 5 thành phố lớn»; danh sách khu vực thấy được theo **quận/huyện cũ** (Ba Đình, Nam Từ Liêm, Thủ Đức, Quận 1…). Chưa thấy trang cấp phường — chưa xác minh |
| Loại | Căn hộ/chung cư · Nhà ở · Đất; loại con: căn hộ **đã / chưa bàn giao**; nhà **mặt phố / ngõ hẻm** |
| Chỉ số | «Giá trung bình tháng» (tr/m²), **so tháng trước**, **so cùng kỳ năm trước**, **khoảng giá phổ biến** (ba mốc thấp · giữa · cao), **số tin** đứng sau mỗi ô |
| Thời gian | Biểu đồ **12 tháng** (T10/2025–T9/2026); tiêu đề ghi tháng 10/2026 → cập nhật hằng tháng, trễ khoảng một tháng |
| Mới | Chế độ **tham khảo giá theo đường** (hộp thông báo trên trang) |
| Phương pháp | «Số liệu được tính dựa trên giá thực tế các bất động sản được đăng bán» → **giá rao**, không phải giá giao dịch |
| Mâu thuẫn | Trang nhà ở Nam Từ Liêm: ô đầu trang ghi một mức «giá trung bình», đoạn văn bên dưới ghi «trung bình» thấp hơn hơn hai lần — hai định nghĩa hoặc hai thời điểm khác nhau, không ghi rõ |

### 1.2 S07 — trang dự án (QS)

| Khía cạnh | Quan sát |
|---|---|
| Đơn vị | **Dự án** và **dự án con / phân khu** (Ocean Park: The Pavilion, The Senique, Masteri Waterfront, Zenpark, Sapphire…); mỗi ghim trên bản đồ một mức giá/m² |
| Chỉ số | Khoảng giá/m² của dự án; giá/m² từng phân khu; **«Giá tại dự án này đã giảm/tăng X% trong vòng 1 năm qua»**; số tin đang rao; **lượt xem dự án trong 7 ngày** (tín hiệu cầu) |
| Hồ sơ dự án | Diện tích, số toà, chủ đầu tư, pháp lý, mặt bằng, phân khu, vị trí, ước tính khoản vay |
| Chuỗi theo tháng | **Chưa thấy trên web** (trang danh sách và trang chi tiết dự án); có thể nằm trong app — chưa xác minh |
| Lời khai giá cũ trong tin | Tin rao ghi «năm ngoái mua 4,8 tỷ giờ bán 4,3 tỷ» — **giá giao dịch quá khứ do người bán tự khai** |

### 1.3 Hai nguồn, cùng khu, khác xa (QS + SL)

| | S06 — căn hộ huyện Gia Lâm | S07 — dự án Ocean Park |
|---|---|---|
| Thay đổi một năm | **−0,9%** | **−16,2%** |
| Mức giá/m² | ~61,6 tr (giá trung bình tháng 10) | ~55,4 tr (ghim dự án); khoảng 46,1–71,2 tr |

Phần lớn căn hộ rao ở Gia Lâm thuộc Ocean Park, nên hai con số lẽ ra phải gần nhau. Các nguyên nhân khả dĩ (SL):
- **Cơ cấu mẫu đổi**: phân khu mới giá cao vào rổ, phân khu cũ ra rổ.
- **Định nghĩa khác nhau**: trung bình hay trung vị; theo tin hay theo dự án.
- **Cửa sổ thời gian khác nhau**: tháng hay «1 năm qua» trượt.
- **Giá rao bị kéo bởi tin mồi**: tiêu đề «giảm tới 800 triệu/căn», «cắt lỗ sâu» trên chính trang S07.

Hệ quả: **không nguồn nào là sự thật**; chỉ dùng được như dải tham chiếu có kiểm.

---

## 2. OneHub đang có gì cho «quá khứ» và «từ nay» (TL)

| Thứ | Ở đâu | Cho được gì | Giới hạn |
|---|---|---|---|
| Thước phường × loại | `pipeline/sql/500_asset_stats.sql` → `market_asset_stats` | Trung vị, p25/p75 giá/m², tiền thuê theo phường | **TRUNCATE mỗi lượt** — không giữ lịch sử |
| Bản ghi tin không xoá | `sale_offer_records` (044, PL14) | Tin nghỉ vẫn giữ, có `retired_at` | Bắt đầu từ ~26/10/2026 |
| Sổ lịch sử theo RESO | `history_transactional` + view `property_price_history` (059, PL19) | Tin mới · đổi giá · gỡ · chào lại · đã cọc · đã bán, gom theo căn | Từ ~30/10/2026; **chỉ ở máy thu** (không sync cloud ở vòng 059) |
| Lịch sử giá theo căn | `properties.price_history` (031) | Giá các tin của một căn qua thời gian | Phụ thuộc chất lượng gắn căn (DB2) |
| Danh bạ toà · trục · căn | DB1 (Ocean Park 1), DBG (Grand Park) | Đi tới cấp toà | Đang dựng |
| Danh mục dự án S08 | `stg_s08_inventory` | Giá mở bán gốc của chủ đầu tư — mốc quá khứ xa | Chỉ nội bộ (luật cạnh luật 5); collector chưa có |

**Kết luận phần 2:** từ nay OneHub tự đo được tốt hơn cả S06 lẫn S07 (cùng căn, có trạng thái đã cọc / đã bán). Thiếu duy
nhất là **quá khứ trước tháng 10/2026** — đúng chỗ chỉ số tổng hợp công khai bù được.

---

## 3. Bộ chỉ số đề xuất ở mỗi cấp

### 3.1 Từ BiggerPockets sang ba cấp của Việt Nam

| Chỉ số kiểu BP | Phiên bản OneHub | Phường | Dự án/phân khu | Toà | Có từ khi nào |
|---|---|---|---|---|---|
| Appreciation (giá tăng năm) | Δ giá/m² trung vị 12 tháng, theo loại | ✓ | ✓ | ✓ khi đủ mẫu | **Ngay** bằng chuỗi ghép; tự đo thuần từ ~11/2027 |
| — (BP không có) | Δ 1 tháng, 3 tháng | ✓ | ✓ | ✓ | Tự đo từ ~12/2026 – 02/2027 |
| Median price | Trung vị + p25/p75 giá/m² và giá căn | ✓ | ✓ | ✓ | Đã có ở phường; dự án/toà theo DB1 |
| Rent growth | Δ tiền thuê 12 tháng | ✓ | ✓ | thưa | Chuỗi ghép nếu S06 có trang tham khảo giá thuê — chưa kiểm |
| Rent-to-Price | Lợi suất thuê thô %/năm | ✓ | ✓ | ✓ khi có tin thuê cùng toà | Đã có ở phường |
| — (BP không có) | **Chỉ số giá lặp lại**: cùng căn, hai thời điểm | gộp lên | gộp lên | ✓ | Khi đủ cặp — tháng đầu 2027 (SL) |
| — | **Nhiệt độ**: thời gian rao trung vị, % tin giảm giá, % gỡ / đã cọc / đã bán trong 30 ngày | ✓ | ✓ | ✓ | Sau 8 tuần sổ lịch sử |
| — | **Lượt quan tâm**: lượt xem dự án 7 ngày (S07) | — | ✓ | — | Khi thu (§6); chỉ nội bộ tới khi có chính sách |
| Affordability | Giá căn trung vị / thu nhập hộ năm | tỉnh | — | — | Cần số thu nhập theo tỉnh mới (ledger BP L4) |

### 3.2 Mượn mẫu theo cây: toà → phân khu → dự án → phường

- Toà thiếu mẫu thì **mượn** phân khu, rồi dự án, rồi phường; luôn hiện **mức nào đang được dùng** và n thật.
- Không nội suy âm thầm. Ô không đủ mẫu ở mọi mức thì ghi «chưa đủ mẫu» (N1).

### 3.3 Mỗi điểm dữ liệu mang nhãn gốc

| Nhãn (tầng C trên cổng) | Nghĩa |
|---|---|
| **Tự đo** | Tính từ tin OneHub thu, có n và ngày |
| **Hiệu chỉnh từ chỉ số công khai** | Điểm quá khứ dựng từ tham chiếu S06/S07, đã đưa về thang OneHub (§4); kèm dải bất định |
| **Chưa đủ mẫu** | Không hiện số |

---

## 4. Cách ghép chuỗi (bù quá khứ)

1. **Bảng nối khu vực.**
   - S06 dùng quận/huyện cũ; S07 dùng dự án/phân khu theo tên riêng; OneHub dùng phường sau sáp nhập và danh bạ toà.
   - Cần bảng nối:
     - quận cũ → các phường mới (đã có crosswalk ALIAS 2025);
     - dự án/phân khu S07 → `asset_nodes` / danh bạ toà, qua bí danh dự án.
2. **Cửa sổ chồng lấp.** Thu tham chiếu hằng tháng **cùng lúc** với tự đo. Trong các tháng có cả hai, tính hệ số đưa tham
   chiếu về thang OneHub theo từng (khu × loại) — tỉ số trung vị, hoặc chênh trên log giá.
3. **Dựng lùi.** Áp hệ số cho các tháng chỉ có tham chiếu. Ghi phương pháp, hệ số, n của cửa sổ chồng lấp vào bảng
   «nguồn gốc điểm».
4. **Dải bất định.**
   - Có hai nguồn cùng khu: dải = khoảng giữa hai nguồn đã hiệu chỉnh.
   - Chỉ một nguồn: dải mặc định rộng.
   - Đảo chiều giữa hai nguồn (như Gia Lâm) → **hiện «nguồn bất đồng», không hiện số Δ**.
5. **Kiểm chiều** (không cần chồng lấp dài): dấu của Δ 12 tháng ở hai nguồn và ở tự đo phải cùng chiều mới hiện mũi tên
   tăng/giảm. Đây là luật xác định, không phải LLM (hiến pháp #2).
6. **Lời khai giá cũ trong tin** («năm ngoái mua 4,8 tỷ»):
   - Trích bằng bộ đọc thành phát biểu lớp `inferred`, kèm trích dẫn.
   - **Không** trộn vào trung vị; chỉ dùng làm bằng chứng phụ cho chỉ số lặp lại khi gắn được căn.
   - Đường ghi đi qua `field_assertions`, đúng luật LLM ngoài đường dữ liệu.

---

## 5. Trên cổng: người dùng thấy gì

- **Trang phường / dự án / toà** (mở rộng T3, T6 của bản tổng hợp):
  - biểu đồ giá/m² trung vị theo tháng, đoạn hiệu chỉnh vẽ nét đứt, có dải;
  - Δ 1 · 3 · 12 tháng với mũi tên chỉ khi các nguồn cùng chiều;
  - khoảng p25–p75; số tin; ngày dữ liệu; nhãn gốc.
- **Bản đồ** (T2): tô màu theo Δ 12 tháng; ô «nguồn bất đồng» kẻ sọc thay vì tô màu.
- **So sánh A hay B** (T4): hai phường, hai dự án hoặc hai toà trên cùng biểu đồ.
- **Nhiệt độ** (T5): thời gian rao, % giảm giá, % đã cọc/đã bán — riêng OneHub có vì giữ trạng thái tin.

---

## 6. Ai làm gì (theo phân làn)

| Bước | Việc | Làn |
|---|---|---|
| 0 | Giữ lịch sử thước theo tuần (không còn TRUNCATE mất lịch sử) — N2 | Claude (pipeline SQL + migration) |
| 1 | Thu tham chiếu S06 hằng tháng: 5 thành phố × loại × quận/huyện (một lần đọc = 12 tháng); thu S07 trang dự án cho dự án có trong danh bạ (Ocean Park, Grand Park trước); bảng `stg_*` mới, tăng `schemaVersion` của DATA-CONTRACT | ZCode đề xuất hợp đồng; Claude viết migration (AGENTS «Chỗ giáp ranh») |
| 2 | Bảng nối khu vực; chuỗi ghép; dải bất định; kiểm chiều; so nguồn ở `/ops/quality` | Claude |
| 3 | Biểu đồ trên trang phường/dự án/toà; tô màu Δ trên bản đồ | Claude (UI8/UI9 + mới) |

- **Nhịp thu:** S06 cập nhật tháng → đọc **một lần mỗi tháng** mỗi trang; S07 một lần mỗi tuần mỗi dự án — tải rất thấp.
- **Trước khi thu:** kiểm điều khoản sử dụng và robots của từng nguồn — chưa kiểm.

---

## 7. Quyết định cần Mạnh

**Chính sách dùng chỉ số tổng hợp của S06/S07.** Ba lựa chọn:

| Lựa chọn | Nghĩa | Ưu | Nhược |
|---|---|---|---|
| **A — Chỉ nội bộ** (như S08) | Chỉ hiệu chuẩn, kiểm chiều ở `/ops`; cổng chỉ hiện tự đo | An toàn nhất | Không có «tăng giá năm» trên cổng trước ~11/2027 |
| **B — Hiện chuỗi đã hiệu chỉnh có nhãn** (khuyến nghị) | Cổng hiện chuỗi ghép; đoạn quá khứ nhãn «hiệu chỉnh từ chỉ số công khai», không chép nguyên văn chuỗi nguồn, không ghi tên nguồn | Có xu hướng ngay; vẫn tầng C | Cần kiểm điều khoản từng nguồn |
| C — Hiện nguyên chỉ số nguồn kèm tên | Như trang tổng hợp | Nhanh | Trái luật tên nguồn (tầng A); phụ thuộc định nghĩa của người khác; lặp lỗi «hai nguồn khác xa» |

Khuyến nghị **B**, điều kiện: điều khoản sử dụng không cấm, và đoạn hiệu chỉnh luôn mang dải bất định.

## 8. Thước đo

| Thước đo | Đích gợi ý |
|---|---|
| Tỉ lệ phường HN (căn hộ) có chuỗi ≥ 12 tháng (ghép hoặc tự đo) | ≥ 80% sau khi thu tham chiếu tháng đầu |
| Tỉ lệ dự án trong danh bạ có chuỗi ≥ 12 tháng | 100% dự án đã có danh bạ |
| Tỉ lệ điểm «nguồn bất đồng» | Theo dõi, không đặt đích — đây là tín hiệu thật |
| Độ lệch hiệu chỉnh trong cửa sổ chồng lấp (trung vị \|log tham chiếu − log tự đo\|) | Giảm dần theo tháng |
| Tỉ lệ điểm trên cổng có nhãn gốc + n + ngày | 100% (bất biến, test) |

## 9. Nguồn

- Quan sát 03/11 (QS): trang tham khảo giá S06 (trang chủ, nhà ở Nam Từ Liêm, căn hộ Nam Từ Liêm, căn hộ Gia Lâm); trang
  danh sách và trang chi tiết dự án Ocean Park trên S07 — chữ và ảnh ở `research-local/gia-tham-khao-2026-11-03/`
  (đường dẫn gốc trong tệp chữ, không commit).
- Kho (TL): `pipeline/sql/500_asset_stats.sql` · `db/migrations/031_property_master.sql` ·
  `db/migrations/059_thoi_gian_hieu_luc.sql` · AGENTS.md (luật 5, cạnh luật 5 về S08; «Chỗ giáp ranh»; ADR-0007 sửa đổi
  26/10) · `docs/plan/lo-trinh.json` (DB1, DBG, DB2, UI8, UI9).
- Bài liên quan: `market-selection-synthesis-proposal.md` · `biggerpockets-market-finder-product-analysis.md` ·
  `s02-vietnam-market-explorer-product-analysis.md`.
