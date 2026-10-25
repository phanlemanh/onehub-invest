# Thu thập theo «vết dầu loang»: bùng một điểm rồi loang, đầy kho thì duy trì (25/10/2026)

- **Người nêu ý**: Mạnh, 25/10, gồm hai ý:
  1. Tăng tốc theo vết dầu loang: bùng lên tại một điểm trong thời gian ngắn, rồi loang ra nơi khác.
  2. Thu lần đầu khác vận hành duy trì. Giai đoạn đầu mà giữ tốc độ duy trì thì không bao giờ về đích; kho đầy rồi thì nên duy trì.
- **Người soạn**: phiên Claude đánh giá observability (nối tiếp `docs/plan/danh-gia-observability-s05-2510.md`).
- **Đầu ra**: framing → phân tích bằng số đo → mô hình hoàn chỉnh → đề xuất giao ZCode, kèm bảng câu hỏi cho Mạnh (§6).
- Tài liệu công khai: chỉ dùng mã nguồn `S0x`. Số đo lấy ngày 25/10 trên DB local :5433 (chỉ đọc) và manifest
  snapshot trên đĩa (chỉ đọc).

## 0. Kết luận một đoạn

Ý của Mạnh đúng, và một nửa đã có sẵn trong kho:
- S02 đã làm đúng mẫu «bùng rồi duy trì»: 12 thị trường/đêm cho vòng đầu, rồi hạ về 7/đêm.
- S01 có kế hoạch «backfill → steady state» từ 21/10 (`docs/research/coverage-expansion-plan.md`).

Cái còn thiếu là ba thứ, chưa nguồn nào có:
1. **Chế độ thu là một trạng thái tường minh** cho từng cặp (nguồn × thị trường): `CHỜ` / `BÙNG` / `DUY TRÌ`.
2. **Điều kiện chuyển đo được bằng máy.**
3. **Ngân sách bùng dồn vào một điểm**, thay vì rải đều.

Số đo cho thấy hai đòn bẩy rẻ nhất:
- **S06 đang rải sai chỗ.** Hà Nội thu thừa (95–97% tin mỗi lượt đã thấy hôm trước). TP.HCM thì cửa sổ chỉ với tới 5 ngày tin.
  Dời ngân sách request từ Hà Nội sang TP.HCM là bùng được mà gần như không tăng tổng tải.
- **S01 không thiếu chiến lược mà thiếu thực thi.** Kế hoạch 21/10 hẹn 1.000 PDP/đêm từ 27/10; thực đo 25/10 là khoảng 38 PDP/ngày,
  vì chế độ worklist (ZC5) chưa triển khai.

Mốc chuyển 70–80% Mạnh nêu là đúng tinh thần, nhưng phải đo trên **mẫu số đạt được** («phần còn sống», «phường có cầu»).
Đo trên mẫu số thô thì có chỗ không bao giờ tới 70%: Hà Nội có 73/171 phường chưa từng có tin S06.

## 1. Framing

### 1.1 Câu hỏi

Làm sao để từng thị trường về đích dữ liệu nhanh nhất mà không vượt luật thu (CCP, ADR-0007), không đội chi phí, rồi giữ kho
tươi với chi phí thấp nhất?

### 1.2 Khái niệm

| Khái niệm | Định nghĩa |
|---|---|
| **Điểm (đơn vị loang)** | Một cặp (nguồn `S0x` × thị trường), vd (S06, vn-hcmc). Mức tinh hơn (quận/phường) chỉ khi nguồn lọc được theo đó |
| **Kho** | Phần dữ liệu của điểm mà sản phẩm cần. Mỗi nguồn đo khác nhau (§2) |
| **CHỜ** | Chưa thu, hoặc chưa đủ điều kiện tiên quyết (vd thị trường chưa có phường trong `areas`) |
| **BÙNG** | Dồn ngân sách thu vào điểm này để lấp kho: đi sâu hơn (trang cũ, worklist), không chỉ theo dòng tin mới |
| **DUY TRÌ** | Chỉ theo **dòng chảy**: tin mới + làm tươi phần đã có, với chi phí nhỏ nhất giữ đúng SLO độ tươi |
| **Loang** | Điểm kế tiếp được BÙNG khi điểm trước sang DUY TRÌ. Ngân sách bùng = ngân sách tổng − tải duy trì của các điểm đã đầy |

### 1.3 Ràng buộc không đổi

- **CCP** (ADR-0007 §2): nhịp người, trần volume/ngày, cửa sổ giờ, một identity một nguồn, lỗi thì lùi + báo (circuit breaker).
  BÙNG là đi sâu hơn trong trần, **không** phải vượt trần hay xoay identity.
- **Trần gọi S02** (ADR-0009) và **S02/S08 chỉ hiệu chuẩn nội bộ** (luật 5). S08: tối đa một lần mỗi tuần (Mạnh duyệt 24/10).
  → **S08 không có chế độ BÙNG** trừ khi Mạnh đổi chính sách.
- **An toàn S03** (luật 8): thêm nhóm theo quy trình nhóm mới (ON24); không có «bùng» kiểu tăng tốc độ đọc.
- **Độ tươi tính bằng phút** (FRAMING D4): BÙNG không được làm chậm lượt duy trì. Mỗi lượt chạy phần duy trì trước, rồi mới đến
  phần bùng.

### 1.4 Nguyên tắc ra quyết định

- **Tăng tải thì người duyệt, giảm tải thì máy tự làm.** Bật BÙNG (tăng volume, tăng rủi ro chặn) cần Mạnh duyệt. Chuyển BÙNG →
  DUY TRÌ khi đạt kho, bão hoà hoặc vấp rào CCP do máy tự làm, kèm ghi audit.
- **BÙNG có hạn.** Mỗi đợt có trần số đêm. Hết hạn mà chưa đạt thì tự về DUY TRÌ và đưa ra xem lại; không để «bùng mãi» thành chữ
  ký hành vi.
- **Đo trước khi build** (luật 11): chỉ số chế độ dựa trên probe + scorecard đã chốt; không dựng hạ tầng mới.

## 2. Phân tích theo nguồn (số đo 25/10)

### 2.1 S06 — tin rao mua bán/thuê (thước giá P2)

Collector đọc feed mới-nhất-trước: 4 feed (bán/thuê × nhà đất/căn hộ), mỗi feed 25 trang × 50 tin. Mỗi lượt có ≈ 4.200–4.500 tin
khác nhau mỗi thị trường, tức chạm trần trang ở mọi feed.

| Thị trường | Tin/lượt | Mới hẳn so lượt trước | Cửa sổ thu (tin cũ nhất → mới nhất) | Đọc |
|---|---|---|---|---|
| Hà Nội | 4.209–4.268 | 140–429 (3–10%) | ≈ 25 ngày | **Thừa sâu cho dòng chảy**: 90–97% request mỗi đêm chỉ thấy lại tin cũ |
| TP.HCM | 4.397–4.519 | 2.155–2.518 (≈ 50%) | ≈ 5 ngày | **Thiếu sâu**: dòng tin gấp ~10 lần Hà Nội, chỉ theo kịp dòng, không bao giờ thấy kho |

Ruler (thước giá phường, N ≥ 5) hôm nay: Hà Nội 64/171 (37%), TP.HCM 95/167 (57%). Trần ruler theo **số phường từng có tin S06**:
Hà Nội 98/171 (57%), TP.HCM 99/167 (59%).
- Hà Nội: 73 phường chưa từng có tin S06 dù cửa sổ đã 25 ngày; 30 phường có 1–4 tin. Đi sâu thêm thì có thể lên khoảng 50%,
  **khó lên 70% phường** bằng S06.
- TP.HCM: 68 phường chưa có tin, nhưng cửa sổ mới 5 ngày. Đây là chỗ đi sâu cho kết quả lớn nhất.

**Kho S06 nên đo bằng gì**: «cửa sổ thu ≥ 45 ngày». Lý do: «Căn giá tốt» chỉ xét tin 45 ngày gần nhất, nên tin cũ hơn không đổi
sản phẩm. Thêm hai điều kiện: «ruler trên phường có cầu ≥ 70%» và điều kiện bão hoà (§3).

**Ước lượng ngân sách** (cận trên vì «mới hẳn» gồm cả tin đẩy lại):
- Đưa TP.HCM từ 5 lên 45 ngày cho **hai feed bán** cần cỡ ≤ 1.000 request một lần, chia ~5 đêm ≈ +200 request/đêm.
- Hạ Hà Nội về mức duy trì (≈ 5 trang/feed, gấp 2 dòng chảy) bớt ≈ 80 request/đêm.
- Hôm nay tổng là 200 request/đêm (2 thị trường × 4 feed × 25 trang).

Chưa biết: feed cho đi sâu tối đa bao nhiêu trang, có lọc được theo quận không → ZCode đo (V1).

### 2.2 S01 — listing lưu trú ngắn hạn tự thu (G3)

| Số | Giá trị |
|---|---|
| Listing tự thu | 508 (HN 267, HCMC 241, ĐN 0) |
| Khớp được với universe S02 | 270 → coverage mức listing 0,74% (HN 143/13.052, HCMC 127/15.066) |
| Nhịp 7 ngày qua | 269 PDP nạp ≈ 38/ngày; `listings` mới nhất 23/10 |
| Kế hoạch 21/10 | worklist 800–1.000 PDP/đêm từ tuần 27/10; steady state PDP 28 ngày/listing |

**Toán tải duy trì** (giả định PDP hữu ích = 85% số thử; chỉ số thật đo ở V1). Kho mục tiêu 70% phần còn sống ≈ 8.500 listing/thị trường.
Duy trì bằng làm tươi 28 ngày tốn ≈ 300 PDP/đêm cho mỗi thị trường đã đầy.

| Cap PDP/đêm | Bùng HN | Bùng HCMC (sau HN, trừ tải duy trì HN) | Bùng ĐN | Sau 3 thị trường |
|---|---|---|---|---|
| 600 (hiện tại) | ≈ 16 đêm | ≈ 34 đêm | **không còn ngân sách** (600 − 2×300 = 0) | không duy trì nổi 3 thị trường |
| 1.200 (B5, cần 1 tuần xanh) | ≈ 8 đêm | ≈ 11 đêm | ≈ 15 đêm | ≈ 900/đêm cho duy trì, còn ≈ 300 dự phòng |

Hệ quả:
- Với cap 600, «loang» sang thị trường thứ ba chỉ có được nếu **chế độ duy trì rẻ hơn**: làm tươi thưa hơn, hoặc chỉ lịch thay vì
  cả PDP. Đây đúng là ý 2 của Mạnh.
- CCP §2.2 («lịch 60 đêm gần 2×/tuần») viết cho quy mô vài trăm listing; ở quy mô 8.500 listing/thị trường phải định lại nhịp
  duy trì bằng số (V1).
- **Bùng một thị trường một lúc** (dồn đủ cap) nhanh hơn rải đều: thị trường đầu đạt đích sau ~1–2 tuần thay vì cả ba cùng lẹt
  đẹt ~6 tuần. Sản phẩm (G3, hiệu chuẩn) có một thị trường dùng được sớm.
- Nút thắt hôm nay không phải chiến lược mà là ZC5 (worklist) + Z2c (triển khai chạy đêm). Mọi con số trên chỉ thành thật sau đó.

### 2.3 Các nguồn khác

| Nguồn | Áp dụng | Ghi chú |
|---|---|---|
| S02 | Đã làm đúng mẫu: vòng đầu 12 thị trường/đêm → duy trì 7/đêm (B4 chờ 43/43 ≤ 8 ngày) | Tiền lệ để dựng chế độ cho nguồn khác |
| S03 | Không bùng tốc độ. «Loang» = thêm nhóm theo khu vực, qua quy trình nhóm mới | Kho = nhóm, không phải tin; an toàn trước tốc độ |
| S05 | Đang ở phương án B (2 lượt/tuần, đo tới 7/12) | Bùng là quyết định tiền, Mạnh quyết 7/12 bằng ba số đã chốt |
| S08 | Không bùng (≤ 1 lần/tuần, chỉ nội bộ) | Mở rộng 3 → 171 dự án đã duyệt; vẫn theo nhịp tuần |

### 2.4 Điều kiện tiên quyết cho điểm mới

Đà Nẵng (thị trường lưu trú lớn thứ ba) **chưa có phường trong `areas`**: 338 phường hiện có đều thuộc HN và HCMC. Ruler, thước giá
và mọi số theo phường ở ĐN đều không có cho tới khi nạp ranh giới phường. Đây là trạng thái CHỜ, không phải BÙNG.

## 3. Mô hình hoàn chỉnh — chế độ thu theo điểm

### 3.1 Trạng thái và điều kiện chuyển

```
CHỜ ──(đủ tiên quyết + Mạnh duyệt bật)──▶ BÙNG ──(đạt kho | bão hoà | hết hạn | vấp rào CCP)──▶ DUY TRÌ
                                            ▲                                                   │
                                            └────────(kho sụt > 10 điểm | nguồn đổi | Mạnh duyệt)┘
```

| Chuyển | Điều kiện (đề xuất, chờ Mạnh — Hỏi-1) | Ai |
|---|---|---|
| CHỜ → BÙNG | Đủ tiên quyết (phường trong `areas`, collector hỗ trợ thị trường) + điểm đứng đầu thứ tự loang | **Mạnh duyệt** |
| BÙNG → DUY TRÌ: đạt kho | S01: listing khớp ≥ **70% phần còn sống** của universe (universe trừ listing đã xác minh rút). S06: cửa sổ thu ≥ **45 ngày** ở feed bán **và** ruler ≥ **70% phường có cầu** | máy |
| BÙNG → DUY TRÌ: bão hoà | 3 lượt bùng liền mà phần mới hẳn < **5%** số thu (kho đã cạn trước khi tới đích) → ghi «trần nguồn» | máy |
| BÙNG → DUY TRÌ: hết hạn | quá **14 đêm** bùng mà chưa đạt → tự về duy trì, đưa ra xem lại | máy |
| BÙNG → DUY TRÌ: rào CCP | bị chặn / captcha / smoke đỏ 2 đêm / lỗi credit → về duy trì ngay + circuit breaker hiện có | máy |
| DUY TRÌ → BÙNG | kho sụt > 10 điểm (churn), nguồn đổi giao diện làm mất phần, hoặc Mạnh muốn đẩy mốc «tốt» | **Mạnh duyệt** |

«Phường có cầu» = phường có ít nhất một tin (mọi nguồn) trong 90 ngày. Mẫu số này loại phường không có giao dịch, để 70% là mốc
tới được. Ngưỡng 50% phường đã ký (Hỏi-1 phiên trước) vẫn là đèn «đủ dùng»; 70% phường có cầu là mốc **chuyển chế độ**. Hai mốc
không mâu thuẫn: một cái nói «dùng được chưa», một cái nói «còn đáng bùng không».

### 3.2 Thứ tự loang

Đề xuất (Hỏi-2): **một thành phố bùng cho mọi nguồn cùng lúc**, chứ không mỗi nguồn một thứ tự riêng. Lý do: sản phẩm có giá trị
khi một thị trường đủ cả thước giá (S06), tin P1 (S03/S05) và lưu trú (S01), tức Deals và G3 cùng chạy.

| Đợt | Điểm | Vì sao |
|---|---|---|
| 1 | **TP.HCM**: S06 đi sâu, S01 dồn cap | S06 dòng tin lớn nhất mà sâu nhất chỉ 5 ngày; ruler 57% đi sâu là lên; 7/7 tin «Căn giá tốt» hiện có từ HCMC; universe S01 lớn nhất (15k) |
| 2 | **Hà Nội**: S06 đi sâu 25 → 45 ngày, S01 | S06 đã có 25 ngày, phần còn thiếu nhỏ hơn; S01 tương đương HCMC |
| 3 | **Đà Nẵng** | CHỜ cho tới khi có phường trong `areas` + S06 thêm vùng + đủ ngân sách S01 (§2.2) |

### 3.3 Đo lường hiệu quả (bổ sung scorecard đã chốt)

Bốn chỉ số thêm vào scorecard. Không dựng gì mới: lấy từ probe đĩa (G4) và hàng scorecard C2, ghi cùng `dq_check_results`.

| Chỉ số | Định nghĩa | Lấy từ |
|---|---|---|
| ⑦ Chế độ | `CHỜ` / `BÙNG` / `DUY TRÌ` của điểm + ngày vào chế độ + hạn bùng | `source_groups.params` |
| ⑧ Phần mới mỗi lượt | tin mới hẳn so lượt trước ÷ tin thu — đo bão hoà | probe G4 (đĩa) |
| ⑨ Độ sâu cửa sổ | tuổi tin cũ nhất trong lượt (S06); số worklist còn lại (S01) | probe G4 |
| ⑩ Hiệu suất | request ÷ đơn vị kho mới (tin mới hẳn, listing khớp mới) + ETA tới mốc kho theo nhịp 7 ngày | probe + scorecard |

Chỉ số nào suy từ S02 (coverage S01, ETA S01) chỉ hiện ở `/ops/quality` (luật 5). `/ops/sources` và `/ops/collections` chỉ hiện
nhãn chế độ.

### 3.4 Chỗ sống của chế độ

`source_groups.params` (jsonb, đã có, đã quản trị trên `/ops/sources`, collector S05/S06 đã đọc). Khoá đề xuất:
- `mode`: `cho` | `bung` | `duy_tri`;
- `burst_until`: ngày hết hạn bùng;
- `burst_budget`: số trang/feed, hoặc PDP/đêm;
- `maintain_budget`: mức duy trì.

Không cần migration. S01 chưa có dòng trong `source_groups` → thêm một dòng mỗi thị trường, hoặc ZCode đề xuất cách khác ở V1.
Máy đổi `mode` về `duy_tri` thì ghi `ops_audit`.

## 4. Đề xuất cho ZCode (gửi qua phiên liên làn sau khi Mạnh trả lời §6)

Mỗi vòng một nhánh cắt từ `origin/main`. Xếp **song song** với các vòng đã giao (G1–G5 observability, 2410-23, ZC7, 2510-8/9, S08),
không thay thế.

| Vòng | Loại | Nội dung | Đứng sau | Đầu ra |
|---|---|---|---|---|
| **V1** | HỎI / đo, không code tính năng | Đo trần thật của từng nguồn: (S06) feed cho đi sâu tối đa bao nhiêu trang, có lọc theo quận/khu vực không, request/đêm còn trong CCP; (S01) tỉ lệ rút thật của worklist, request/PDP, trần đêm trong cửa sổ giờ; đề xuất nhịp DUY TRÌ rẻ nhất giữ SLO cho S01 (PDP vs chỉ lịch) | — (chạy ngay, đo trên bản chép) | `BÁO` một bảng số + đề xuất `params` cho từng nguồn |
| **V2** | code | `zcode/che-do-thu-s06`: collector S06 đọc `mode` / `burst_budget` / `maintain_budget` từ `source_groups.params`; mỗi lượt chạy duy trì trước, bùng sau; bùng chỉ ở feed bán; tự hạ về duy trì khi vấp rào CCP | V1, AU3 (đã merge) | PR T2 + GIAO triển khai đợt 1 HCMC |
| **V3** | sửa vòng đã có | **Gộp vào ZC5 / Z2c**, không mở hàng mới: worklist S01 ưu tiên đúng một thị trường đang `bung`, phần còn lại cho duy trì; tham số nhịp duy trì theo V1 | ZC5 merge | sha bổ sung cho ZC5 |
| **V4** | sửa vòng đã có | **Gộp vào G4** (`zcode/collect-probe`, 2510-16): probe thêm chỉ số ⑧ phần mới hẳn so lượt trước, ⑨ tuổi tin cũ nhất mỗi lượt | như G4 | như G4 |
| **V5** | triển khai | Đợt bùng 1 (TP.HCM) theo checklist: Mạnh duyệt bật → ZCode bật `mode=bung` có hạn → kiểm hai phía mỗi sáng (watchdog/CCP xanh, snapshot mới, phần mới hẳn, độ sâu) → máy hạ khi đạt | V2 merge, C7 (dưới) merge | `tin XONG` kèm bảng 14 đêm |

**Hàng làn Claude đề xuất cho phiên giám sát**:
- **C2 mở rộng**: thêm ⑦–⑩ và «ruler trên phường có cầu». Không thêm hàng; cập nhật tiêu chí của `scorecard-thu-thap`.
- **C7 `che-do-thu-tren-ops`** (T2): `/ops/sources` hiện và đổi `mode` của từng điểm (admin). Bật `bung` bắt buộc nhập hạn. Máy
  hạ thì ghi `ops_audit`.
- **C8 `phuong-da-nang`** (T2/T3, CHỜ Mạnh mở ĐN): nạp ranh giới phường Đà Nẵng vào `areas` + `reassign-areas` + 300/400. Phần thu
  ranh giới S04 nếu cần là làn ZCode.

## 5. Rủi ro

| Rủi ro | Chặn bằng |
|---|---|
| Bùng làm lộ chữ ký hành vi, bị chặn | Trần CCP giữ nguyên, bùng có hạn 14 đêm, tự hạ khi vấp rào; một điểm một lúc |
| Bùng làm chậm tin mới (D4) | Duy trì chạy trước bùng trong cùng lượt; scorecard ① tươi vẫn là đèn đỏ riêng |
| Kho «đầy» theo mẫu số sai nên bùng mãi | Mẫu số đạt được (phần còn sống, phường có cầu) + điều kiện bão hoà |
| Tải duy trì nuốt hết ngân sách, không loang được | Toán §2.2 hiện trên scorecard (⑩); quyết nâng cap (B5) hay giãn nhịp duy trì bằng số, không bằng cảm giác |
| Hai phía đọc chế độ lệch nhau | Một chỗ sống (`source_groups.params`), collector chỉ đọc, đổi qua `/ops/sources` hoặc máy hạ có audit |

## 6. Câu hỏi cho Mạnh

| # | Câu hỏi | Khuyến nghị | Trả lời gõ sẵn |
|---|---|---|---|
| Hỏi-1 | Mốc chuyển BÙNG → DUY TRÌ: S01 **70% phần còn sống** (không phải 80%: trần tìm ~70% và có listing đã rút); S06 **cửa sổ ≥ 45 ngày + ruler ≥ 70% phường có cầu**; cộng điều kiện bão hoà (<5% mới, 3 lượt) và hạn 14 đêm | Đồng ý các mốc này; 80% chỉ làm vạch tham chiếu | `Hỏi-1: đồng ý mốc 70% trên mẫu số đạt được` |
| Hỏi-2 | Thứ tự loang: **một thành phố cho mọi nguồn** — TP.HCM trước, Hà Nội sau, Đà Nẵng chờ phường — hay mỗi nguồn một thứ tự riêng (S01 theo kế hoạch cũ HN → HCMC → ĐN)? | Một thành phố cho mọi nguồn, TP.HCM trước | `Hỏi-2: TP.HCM trước cho mọi nguồn` |
| Hỏi-3 | Ai bật BÙNG: Mạnh duyệt từng lần bật (tăng tải), máy tự hạ về DUY TRÌ (giảm tải) có audit? | Đồng ý | `Hỏi-3: tôi duyệt bật, máy tự hạ` |
| Hỏi-4 | Đà Nẵng: mở ngay việc nạp phường (C8) để sẵn cho đợt 3, hay để CHỜ tới khi TP.HCM và Hà Nội sang DUY TRÌ? | Để CHỜ — đo trước khi build; ĐN cần cả ngân sách S01 mà §2.2 cho thấy chưa có ở cap 600 | `Hỏi-4: ĐN chờ tới sau đợt 2` |

**Mạnh trả lời 25/10 (qua phiên giám sát): «Hỏi-1..4: theo khuyến nghị».** Hệ quả:
- Hỏi-1: mốc chuyển BÙNG → DUY TRÌ như §3.1. S01: 70% phần còn sống. S06: cửa sổ ≥ 45 ngày và ruler ≥ 70% phường có cầu.
  Thêm điều kiện bão hoà (< 5% tin mới, 3 lượt liền) và hạn 14 đêm. Mốc 80% chỉ là vạch tham chiếu.
- Hỏi-2: một thành phố cho mọi nguồn. Đợt 1 TP.HCM, đợt 2 Hà Nội, Đà Nẵng CHỜ.
- Hỏi-3: Mạnh duyệt từng lần bật BÙNG; máy tự hạ về DUY TRÌ, có ghi `ops_audit`.
- Hỏi-4: C8 (phường Đà Nẵng) để CHỜ tới sau đợt 2.

Phiên giám sát xếp hàng làn Claude: C7 `che-do-thu-tren-ops` vào dãy P4; chỉ số ⑦–⑩ ghi vào tiêu chí C2 khi hàng đó mở;
C8 CHỜ.
