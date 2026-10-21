# Pipeline đầu tư 4 giai đoạn — north star dữ liệu & phân vai nguồn thu

Ngày: 2026-10-20 · Trạng thái: **ĐÃ DUYỆT + P1a/P1b ĐÃ THỰC HIỆN 2026-10-21**
(survey Chợ Tốt/Batdongsan: `chotot-batdongsan-survey.md`)
Nguồn ý: user (domain truth) — đối chiếu `chotot-batdongsan-survey.md` + code hiện tại.

## 1. FRAMING — xác định lại vấn đề

Ý sơ khởi của user có 3 mệnh đề:

1. **Zalo là nguồn giá tốt nhất** — tin giao dịch nội bộ; tin càng public thì
   môi giới càng "mở phễu" → giá rao công khai có xu hướng THẤP hơn thực tế.
2. **Số điện thoại là bắt buộc** — phục vụ nhiều mục đích, không chỉ liên hệ.
3. Sản phẩm phục vụ **pipeline đầu tư 4 giai đoạn**:
   (1) Thị trường nào phù hợp (dòng tiền ngắn hạn / dài hạn / tăng giá / lai)
   → (2) Ở thị trường đó, deal nào tốt → (3) Chi phí, vốn, dòng tiền
   → (4) Khai thác sau mua.

**Hai hệ quả đảo ngược kết luận của khảo sát trước** (`chotot-batdongsan-survey.md` mục 4):

| Kết luận cũ | SAI ở đâu |
|---|---|
| "Giá trị biên Zalo giảm mạnh — lockdown không còn nghẽn" | Ngược đời: nguồn công khai là **vải/thước đo** (độ phủ, median), Zalo là **tín hiệu giá thật**. Hai tầng BỔ SUNG nhau, không thay thế. Zalo quay lại ưu tiên cao nhất. |
| "Chợ Tốt tương đương Zalo về contact" | SAI: Chợ Tốt `phone=null` (phải reveal per-ad), còn Zalo/FB **SĐT nằm sẵn trong text** — miễn phí extract. Và grounding code: `transform-zalo.mjs` `parsePost()` hiện KHÔNG extract SĐT (chỉ kind/price/area/PN/phường) → SĐT là **lỗ hổng thật của chính pipeline Zalo**, không phải việc "sau này làm". |

Câu hỏi phân tích đúng: **mỗi nguồn đóng vai gì trong 4 giai đoạn**, và kiến trúc
nào kết hợp *vải công khai (thước) + tín hiệu riêng (signal) + SĐT (join + hành động)*?

## 2. PHÂN TÍCH

### 2.1 Bậc độ tin cậy giá — hình thức hóa "phễu môi giới"

| Bậc | Nghĩa | Nguồn | Đặc tính lệch |
|---|---|---|---|
| **P0** | Giá giao dịch THỰC (đã chốt) | tin "đã bán" trong nhóm, người trong cuộc | hiếm, trễ |
| **P1** | Giá rao NỘI BỘ (khép) | **Zalo nhóm** | sát giao dịch, ít tẩy xóa marketing; kèm SĐT |
| **P2** | Giá rao CÔNG KHAI | Chợ Tốt, Batdongsan, FB page | bait bias (giá câu thấp hơn thực) + tin treo lâu (stale) |

Điểm mấu chốt: **P1 không tự đo được "deal tốt" nếu thiếu P2 làm thước.**
Discount chỉ có nghĩa khi = giá P1 so với median P2 cùng phường/loại hình.
Nguồn công khai đóng 3 vai không thể thay thế: (a) vải độ phủ rộng,
(b) thước median giá/m², (c) tín hiệu cung (volume tồn kho theo thời gian).
Tương tự, P2 tự nó cũng vô dụng cho deal-hunting vì bait bias — cần P1 làm
tín hiệu và SĐT để xác minh.

**Kiểm chứng được bằng dữ liệu**: cùng một căn do cùng một môi giới đăng cả
nơi công khai lẫn nhóm nội bộ → gap P2−P1 đo được khi có SĐT làm join key
(mục 2.2). Claim "phễu môi giới" từ trực giác thành chỉ số đo được
(`bait_gap_pct` theo broker / phường / loại hình).

### 2.2 SĐT — 4 vai trò (nhiều hơn "liên hệ")

1. **Hành động** (giai đoạn 2): gọi xác minh deal thật hay giá câu, thương lượng.
2. **Entity join key**: SĐT nối cùng người bán — cùng căn — across
   Chợ Tốt/Zalo/FB → đo bait gap, dedupe căn thật, dựng lịch sử giá 1 căn.
3. **Công cụ thu ground-truth** (giai đoạn 1, 3, 4): gọi môi giới hỏi giá thuê
   thực, occupancy, chi phí quản lý → **tự xây dữ liệu hiệu chuẩn chất lượng
   AirDNA bằng cuộc gọi** — đây là cách bù cho việc không thể scrape AirDNA.
4. **Broker scoring**: SĐT → hồ sơ môi giới (số tin, nơi đăng, median bait gap,
   tỉ lệ deal thật) → ưu tiên broker sạch, cảnh báo broker câu giá.

Trạng thái thu SĐT theo nguồn:

| Nguồn | SĐT | Chi phí lấy |
|---|---|---|
| Zalo | trong text tin | parser + regex VN (còn thiếu — làm ngay) |
| Facebook | trong text tin/comment | parser text (giống Zalo) |
| Chợ Tốt | `phone=null` list API | reveal per-ad (giới hạn top-deals) |
| Batdongsan | masked "0973 034 ***" | gần như vô dụng, phải mở detail |

→ Về SĐT, **Zalo + Facebook là nguồn chính; Chợ Tốt/BDS chỉ bù chọn lọc.**

**Nguyên tắc PII (kế thừa stg_zalo_posts)**: SĐT thô chỉ ở máy local;
cloud chỉ nhận `seller_phone_hash` + aggregate. Bảng `sellers` local-only.

### 2.3 Ma trận nguồn × 4 giai đoạn

| Giai đoạn | Cần dữ liệu gì | Nguồn phục vụ |
|---|---|---|
| **1. Chọn thị trường** | doanh thu STR (ADR, occupancy) | AirDNA, Airbnb |
| | giá thuê LTR theo phường | vải thuê công khai (Chợ Tốt/BDS mục thuê — cần verify tham số) |
| | trend giá bán (tăng giá) | vải bán công khai chuỗi ngày (Chợ Tốt snapshot hằng ngày) |
| **2. Chọn deal** | giá P1 + SĐT + tín hiệu gấp | **Zalo ★**, Facebook |
| | thước median P2 + độ phủ bù | Chợ Tốt, (pilot) Batdongsan |
| **3. Chi phí/vốn/dòng tiền** | giá mua (từ deal) + doanh thu STR + giá thuê LTR + chi phí | tổ hợp trên + **calculator chưa tồn tại (product gap)** |
| **4. Khai thác sau mua** | comps định giá theo mùa, chiến lược giá đêm | Airbnb (live pricing), AirDNA seasonality — **product gap** |

Mỗi chiến lược đầu tư ở giai đoạn 1 cần một CẶP dữ liệu riêng:

| Chiến lược | Cặp dữ liệu quyết định |
|---|---|
| Dòng tiền ngắn hạn (STR) | giá mua (P1/P2) × doanh thu STR (AirDNA) |
| Dòng tiền dài hạn (LTR) | giá mua × giá thuê LTR (vải thuê) |
| Tăng giá | trend giá bán phường/quận (vải bán theo thời gian) |
| Lai (STR + chờ tăng) | cả hai cặp trên |

→ Vải công khai không chỉ là thước cho Deals; nó là **nền của giai đoạn 1**
(trend) và **3** (giá thuê LTR). Zalo là nền của giai đoạn 2.

### 2.4 Ràng buộc an toàn Zalo (vẫn đứng, không thỏa hiệp)

Sự cố reply-vào-nhóm: tầng thu (hook read-only) chưa từng phụ thuộc agent
bindings — thứ nguy hiểm là đường REPLY. Khởi động lại Zalo pipe **bắt buộc**
qua Phương án B lockdown 5 lớp (đã thiết kế, chưa duyệt). Giờ có lý do kinh
tế mạnh để đầu tư làm lockdown sớm: Zalo là nguồn số 1, không phải "nice to have".

### 2.5 Product gaps nhìn từ 4 giai đoạn

- Giai đoạn 1: có (Market Insights) nhưng thiếu trend giá bán + giá thuê LTR.
- Giai đoạn 2: Deals v1 có — thiếu SĐT extract, price_tier, thước từ vải công khai.
- Giai đoạn 3: **chưa tồn tại** — calculator vốn/dòng tiền (mua + nội thất +
  lãi vay + doanh thu STR/LTR → cashflow, break-even).
- Giai đoạn 4: **chưa tồn tại** — khai thác sau mua (định giá đêm theo comps/mùa).

→ 4 giai đoạn là **north star của cả roadmap sản phẩm**, không chỉ của nguồn thu.

## 3. HOÀN THIỆN — kiến trúc "Vải công khai + Tín hiệu riêng + Khoá SĐT"

Unified Collector Contract giữ nguyên phần đã đúng; mở rộng 3 điểm:

```
VẢI CÔNG KHAI (P2 — thước + trend)        TÍN HIỆU RIÊNG (P1 — deal thật)
  S06 Chợ Tốt  (bán + thuê, daily)           S03 Zalo  ★ (lockdown B rồi mở)
  S07 Batdongsan (pilot)                     S05 Facebook (Apify)
  (S02 AirDNA/S01 Airbnb — riêng tầng thuê)  (P0: tin "đã bán" tag khi gặp)
        │                                          │
        └──────────► sale_offers (mở rộng) ◄───────┘
          price_tier: P0|P1|P2          seller_phone (local-only)
          price_vnd, price_per_m2       seller_phone_hash (sync cloud)
          district/ward + osm crosswalk bait_gap_pct (derived, khi join SĐT)
                      │
        ┌─────────────┼──────────────────┐
   sellers registry   Deals v2           G3 Calculator (mới)
   (local, keyed      (thước P2 ×         giá mua×STR/LTR →
    phone_hash:       signal P1,          cashflow, break-even,
    broker score,     broker score,       ROE theo vốn vay
    bait gap)         SĐT gọi ngay)
```

Thay đổi cụ thể so với contract cũ:

1. `sale_offers` thêm: `price_tier`, `seller_phone` (local), `seller_phone_hash`,
   `seller_ref` (account_id Chợ Tốt / SĐT), `bait_gap_pct` (derive sau).
2. **Bảng `sellers` mới (local-only)**: phone_hash → {tên, nguồn đăng, số tin,
   median bait_gap, flags}. Nền của broker scoring.
3. **Parser Zalo/FB thêm regex SĐT VN** (`0xxxxxxxxx`, `0xxx.xxx.xxx`, `+84…`)
   — lỗ hổng hôm nay, sửa trong cùng PR transform.
4. **Deals v2**: median từ vải Chợ Tốt (rộng) thay vì chỉ market_asset_stats;
   hiển thị gap P1↔P2 khi cùng broker; nút "gọi" (SĐT local-only).
5. **Thuế dữ liệu mới từ Chợ Tốt**: mục CHO THUÊ (verify tham số cg/st thuê
   trong pilot) → giá thuê LTR theo phường cho giai đoạn 1 và 3.

## 4. ĐỀ XUẤT — lộ trình sắp lại ưu tiên

| # | Việc | Giai đoạn phục vụ | Ghi chú |
|---|---|---|---|
| **P1a** | Chợ Tốt fabric: adapter + S06 + transform → sale_offers (P2) + **cả mục thuê** | 1,2,3 | thước đo + trend; không reveal-phone hàng loạt |
| **P1b** | **Zalo: Phương án B lockdown + mở lại pipe + parser SĐT** | 2 ★ | nguồn số 1 theo user; read-only đảm bảo 5 lớp |
| **P2** | Facebook transform → sale_offers (P1) + SĐT từ text | 2 | tái dùng parser Zalo |
| **P3** | Batdongsan pilot (đổi mục đích: `legal_status`/`direction` cho giai đoạn 2-3, KHÔNG kỳ vọng SĐT) | 2,3 | $3,2 một lần |
| **P4** | `sellers` registry + Deals v2 (join SĐT, bait gap, broker score) | 2 | đỉnh của giá trị data |
| **P5** | G3 Calculator vốn/dòng tiền (STR × LTR × vay) | 3 | sản phẩm mới |
| **P6** | G4 Khai thác sau mua (comps giá đêm theo mùa) | 4 | sản phẩm mới |

Thứ tự P1a∥P1b chạy song song được (hai adapter độc lập, cùng đích sale_offers).

## 5. Cần user quyết

1. Duyệt khung **4 giai đoạn làm north star** cho roadmap (doc này graduate vào
   `docs/architecture/` khi duyệt).
2. Duyệt **P1b = thực hiện Phương án B lockdown** để mở lại Zalo (an toàn 5 lớp
   — tách thu/thu hồi, chặn reply ở nhiều tầng, kill-switch).
3. Chấp thuận nguyên tắc **PII SĐT: local-only, cloud chỉ hash + aggregate**
   (kế thừa tiền lệ stg_zalo_posts).
