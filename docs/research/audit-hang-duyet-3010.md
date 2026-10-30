# Audit hàng duyệt Ops — thẻ ghép căn Tin A ↔ Tin B (30/10/2026)

- **Câu hỏi của Mạnh** (tự duyệt `/ops/review` chiều 30/10): (1) Tin A không có ảnh, Tin B có; (2) Tin A bóc tách kém
  hơn Tin B; (3) duyệt xong một thẻ nên tự chuyển sang thẻ kế.
- **Cách đo**: DB máy thu :5433, mọi truy vấn chạy trong phiên `default_transaction_read_only=on`, đo lúc 15:40–15:47Z
  30/10. Đọc mã tại `main` `14f5851d` (sau #208, #209). Không sửa mã, không ghi DB, không áp migration. SQL đầy đủ ở §6;
  bản chạy được để ở `research-local/audit-hang-duyet-3010/` (gitignored).
- Tài liệu chỉ gọi nguồn bằng mã `S0x` (ADR-0007). Không chép văn bản tin, SĐT, URL ảnh hay tên miền CDN.
- Không mở trình duyệt: hàng duyệt local lúc đo **không còn thẻ chờ** nào để bấm thử (§1), và hành vi UI đọc được
  trọn vẹn từ mã (§4).
- Đọc kèm: `anh-tin-rao-va-scorecard-truong-2910.md` (phễu ảnh theo nguồn), `s03-boc-tach-cau-truc-3010.md` (§9 bản cắt bộ
  đọc S03), `enrich-ngung-2610.md` (vì sao `enrichment_proposals` rỗng). Tài liệu này không lặp các phần đó. Nó nối các
  phần đó vào **thẻ duyệt**, rồi bổ sung những gì chỉ thấy được ở thẻ.

Mức nặng: **Cao** = thẻ dẫn người duyệt tới quyết định sai, hoặc quyết định không tới đâu · **Trung** = thẻ thiếu căn cứ
mà nguồn có · **Thấp** = khó chịu nhưng không đổi quyết định.

---

## 0. Kết luận một trang

Cả ba nhận xét đều đúng. Hai nhận xét đầu chung một gốc lớn: **12/12 thẻ Mạnh duyệt hôm nay có Tin A là offer S05 không
còn trong kho**. Khoá S05 đã đổi theo PL14 (khoá dính) sau khi thẻ được sinh ngày 22/10. Thẻ trỏ tới khoá chết nên không
có ảnh, không có toàn văn, không có căn cứ. Bảng so vẫn hiện số của bộ đọc cũ, chụp lúc sinh thẻ. Nặng hơn cả: **11 quyết
định hôm nay khớp 0 dòng `property_candidates`**. Chúng chỉ nằm ở `review_queue` và không đổi gì ở bước ghép căn.

Bỏ khoá chết ra thì các lỗi bên dưới vẫn còn, và lô thẻ kế tiếp sẽ gặp lại:

| # | Phát hiện | Số đo | Nặng | Đúng hay lỗi | Làn · dãy |
|---|---|---|---|---|---|
| H1 | Thẻ trỏ tới offer S05 đã đổi khoá (PL14) | Bên A: 9 offer khác nhau, **0/9** còn trong `sale_offer_records` → 0 dòng media, 0 toàn văn, 0 căn cứ | **Cao** | Lỗi | Claude · P3 + U1 |
| H2 | Quyết định trên thẻ khoá chết không tới ứng viên | 11 quyết định 30/10 → **0** dòng `property_candidates` đổi trạng thái (bảng chỉ còn 8 dòng `needs_llm`/`pending`) | **Cao** | Lỗi | Claude · P3 |
| H3 | S05 không có ảnh nào xem được | 0/100 bài S05 có `media_files` (bộ thu không tải ảnh). 85 dòng `media` chỉ có URL gốc, **85/85 hết hạn từ 25/10**. Bộ thu S05 ngừng từ 21/10 | **Cao** | Lỗi thu (43/100 bài có ảnh ở nguồn) | ZCode · liên làn |
| H4 | Lô thẻ kế tiếp lặp lại H3 | 8 ứng viên tạo 29/10, đều S05 ↔ S06, bên A **0/8** có dòng media; bên B 8/8 | **Cao** | Lỗi (H3) | — |
| H5 | Ảnh S06 chỉ có URL gốc; vai Vận hành không thấy ảnh nào | 182.852 dòng `media` S06, **0** file local. Vai `ops` nhận 0 ảnh ở cả hai bên, vai `admin` thấy ảnh bên B | Trung | Đúng thiết kế #208, nhưng hàng duyệt không giao được cho vai `ops` | Claude · U1 (T3) |
| H6 | Chuỗi nạp đêm S03/S05 gãy | `import-airbnb.mjs` lỗi `22021` (byte `0x00`) ở snapshot 29/10 04:27Z, giữ state rồi dừng chuỗi. `transform-zalo`, `transform-media`, `enrich-run` đều không chạy | **Cao** | Lỗi | ZCode · liên làn |
| H7 | Bên A thiếu hệ thống 4 trường | Trên 12 thẻ, bên A/bên B: loại hình biết **0**/12 · PN 5/12 · WC **0**/10 · đường **0**/12 | **Cao** | Bộ đọc vắng (§3.3) | Claude · P2 (+P1) |
| H8 | Thẻ do `judge-run` (PL25) sinh thiếu 4 hàng ở **cả hai** bên | `evidenceThe` ghi 8 khoá; bảng so có 10 hàng → đường, toà, tầng, WC luôn «Thiếu», kể cả khi S06 có | **Cao** | Lỗi | Claude · P3 |
| H9 | «Chưa rõ» hiện như một giá trị, so ra «Lệch» | 12/12 thẻ: loại hình A = `unknown` ↔ B = `house` → nhãn **Lệch** thay vì **Thiếu** | Trung | Lỗi | Claude · U1 |
| H10 | Bảng so đọc số chụp lúc sinh thẻ, không đọc kho | Thẻ 22/10 hiện số của bộ đọc 22/10; thẻ không biết tin đã đổi hay đã nghỉ | Trung | Lỗi thiết kế | Claude · U1 |
| H11 | PN viết kiểu môi giới bị bỏ sót | S03 thiếu PN 184/371: 86 bài «3N», 48 «studio», 13 «3 ngủ»; **0** bài viết «PN» đúng dạng mà vẫn thiếu | Trung | Bộ đọc yếu | Claude · P1 |
| H12 | S03 không vào được hàng duyệt | S03 có phường 29/371 (8%) → 20 tin đủ điều kiện Stage B → **0 cặp** | Trung | Bộ đọc + danh mục | Claude · P1 |
| H13 | Duyệt xong, sheet đứng nguyên ở thẻ vừa quyết | Phải đóng sheet rồi bấm hàng kế. 11 thẻ mất 10′15″, trung vị **52″/thẻ**, đi đúng thứ tự trên xuống | Trung | Thiếu tính năng | Claude · U1 |

---

## 1. Hàng duyệt lúc đo

| Đo | Số |
|---|---|
| `review_queue` | `entity_match`: 1 approved + 11 rejected · `agent_output`: 4 rejected · **0 pending** |
| Thẻ ghép căn | 12 thẻ, đều sinh 22/10 08:59Z (seed 029/030), **không thẻ nào có `evidence.cham`** (chưa qua `judge-run` PL25) |
| Nguồn hai bên | 12/12: **Tin A = S05, Tin B = S06** |
| Quyết định hôm nay | 11 thẻ, 15:25:58Z → 15:36:13Z, vai `admin` (11/11) |
| `property_candidates` | 7 `needs_llm` + 1 `pending`, đều tạo 29/10, đều S05 ↔ S06; **chưa có thẻ** (`judge-run` không có lịch — TV13b) |

Hàng duyệt hôm nay là hàng **S05 ↔ S06**, vì Stage B (`pipeline/resolve-properties.mjs:90–125`) chỉ ghép P1 có phường
với S06, và S03 gần như không có phường (H12). Vì vậy, «Tin A» trong ba nhận xét của Mạnh chính là S05.

---

## 2. Nhận xét 1 — Tin A không có ảnh

### 2.1 Phễu ảnh theo tầng × nguồn

| Tầng | S03 | S05 (Tin A) | S06 (Tin B) | Căn cứ |
|---|---|---|---|---|
| Nguồn có ảnh | 17.576/34.351 bài có `media` | **43/100** bài có `media` | 99,9% tin có ảnh (báo cáo 29/10) | `stg_zalo_posts.media` |
| Thu: tải file vào snapshot | 13.293 bài có `media_files`; ~1/3 entry lỗi `http-500` từ 27/10 (ZC9) | **0/100** bài có `media_files` | Không tải (ảnh nằm trong `stg_chotot_ads`) | `stg_zalo_posts.media_files` |
| Thu: còn chạy không | Có (bài mới nhất 30/10), nhưng chuỗi nạp gãy từ 29/10 (H6) | **Ngừng từ 21/10** (402 hết credit, TV15) | Có | `max(captured_at)` |
| Canonical `media` (053, NH1) | 2.558 dòng, 1.165 có `local_file`, 422/885 offer | 85 dòng, **0** `local_file`, 19/28 offer | 182.852 dòng, **0** `local_file`, 27.702/27.733 offer | `media` theo `originating_system_name` |
| URL gốc còn hạn | Có hạn (host có chữ ký) | **85/85 hết hạn** (`oe=` ≤ 25/10) | Không ghi hạn | §6 Q4 |
| Nối offer ↔ thẻ | — (S03 không có thẻ) | **0/9** offer của thẻ còn trong kho (H1) | 12/12 | §6 Q2 |
| API `/api/zalo-media` (#208) | Chỉ phục vụ file local, vai `ops` trở lên | — (không có file) | — (không có file) | `app/src/app/api/zalo-media/route.ts` |
| Thẻ: vai `admin` | — | 0 ảnh | Ảnh URL gốc | `app/src/lib/ops/review-media.ts:188–224` |
| Thẻ: vai `ops` | — | 0 ảnh | **0 ảnh**, chỉ số «ảnh chỉ có URL gốc» (`chiGoc`) | như trên |

### 2.2 Phát hiện

**H1 — thẻ trỏ tới khoá chết (Cao, lỗi).** 12 thẻ sinh 22/10 08:59Z. Sau đó PL14 «khoá dính» (`8a6e73c5`,
`pipeline/lib/offer-key.mjs`) đổi cách băm `offer_id` của S05 sang `S05|<post neo>`. Hệ quả: 9/9 offer bên A không còn
trong `sale_offer_records`, kể cả dạng đã nghỉ. Ba bên đọc của thẻ đều khoá theo `offer_id`, nên cả ba trả rỗng:
- `loadOfferMedia` → không có dòng `media` → 0 ảnh (`review-media.ts:145`);
- `loadReviewContext` → không có dòng `sale_offers` → không có toàn văn, căn cứ ghi «Chưa ghi căn cứ»
  (`review-context.ts:66–86`). Thẻ lùi về đoạn 300 ký tự trong `evidence.offer_a.text`;
- `judge-run` → `queryPair` trả `null` → `dem.loi++`, thẻ treo, không đóng, không báo (`agent/scripts/judge-run.ts:141–144`).

Sổ trạng thái ghi «11 thẻ cũ trỏ tới offer S05 đã mất». Số đúng là **12** (thẻ #13 đã quyết từ 22/10). Cả 12 giờ đã quyết,
nhưng cơ chế còn nguyên: lần đổi khoá kế tiếp, hay tin nghỉ, sẽ lại để thẻ trỏ vào hư không mà không ai biết.

**H2 — quyết định không tới đâu (Cao, lỗi).** Route quyết định cập nhật `property_candidates` theo cặp khoá trong
`item_id` (`app/src/app/api/v1/ops/review/[id]/decide/route.ts:98–110`). Khoá A đã chết nên câu `UPDATE` khớp 0 dòng.
Bảng `property_candidates` lúc đo không có dòng `merged` hay `rejected` nào. Thẻ #23 «Cùng căn» Mạnh duyệt hôm nay cũng
không gộp được gì. Route không kiểm số dòng bị đổi, nên người duyệt không biết.

**H3 — S05 không có ảnh xem được (Cao, lỗi thu).** Nguồn S05 **có ảnh** (43% bài). Nhưng bộ thu S05 chỉ ghi URL gốc, không
tải file vào snapshot. URL có chữ ký hết hạn sau vài ngày (`oe=` của cả 85 dòng là 25/10). Bộ thu S05 ngừng từ 21/10 (402,
xem TV15), nên cũng không có URL mới thay thế. **Kể cả khi khoá đúng**, Tin A vẫn 0 ảnh với vai `ops`, và ảnh hỏng với vai
`admin`. Đây là việc làn ZCode (collector S05), cùng dáng với ZC1/ZC4 đã làm cho S03.

**H4 — lô kế tiếp lặp lại (Cao).** 8 ứng viên tạo 29/10 có khoá đúng, nhưng bên A **0/8** có dòng `media`, vì 23 offer S05
đang sống đều lấy từ bài thu ≤ 21/10. Khi `judge-run` sinh thẻ cho 8 cặp này (TV13b), Mạnh sẽ lại thấy «A không ảnh».

**H5 — ảnh S06 chỉ có URL gốc (Trung, đúng thiết kế nhưng chặn giao việc).** #208 / PL3 chỉ đưa ảnh **đã tải** tới vai
Vận hành. URL gốc mang tên miền nguồn thật (tầng A) nên chỉ tới `admin`. S06 không có file local nào. Vì thế người vận
hành (vai `ops`) mở thẻ sẽ thấy **cả hai bên 0 ảnh**. Hôm nay Mạnh duyệt bằng vai `admin` nên thấy ảnh bên B, và cảm giác
«B có, A không» là đúng với vai đó. Muốn giao hàng duyệt cho vai `ops`, ảnh S06 phải tới thẻ **mà không lộ URL gốc**: hoặc
máy chủ tự lấy ảnh rồi trả qua `/api/zalo-media`, hoặc tải ảnh thu nhỏ về máy thu (cùng đường với TV9).

**H6 — chuỗi nạp đêm gãy (Cao, vận hành).** `pipeline/logs/zalo-import.log` ở checkout chính dừng ở: nạp snapshot
`…__2026-10-29T042737822` lỗi `invalid byte sequence for encoding "UTF8": 0x00` (`import-airbnb.mjs:178`, tham số `$6`), «giữ
state, dừng chuỗi». Lần ghi log cuối là 30/10 00:00 (giờ máy). Theo `scripts/zalo-import-daily.sh:105–117`, khi nạp lỗi thì
`transform-zalo`, `transform-media` và bước `enrich-run` (vừa nối vào chuỗi hôm nay, `fc9483eb`) đều không chạy. Ảnh S03
mới không vào bảng `media`, và enrich vẫn chưa chạy lần nào. `import-*` thuộc làn ZCode.

### 2.3 Đếm theo yêu cầu: thẻ chờ có một bên thiếu ảnh

| Tập | Thẻ / cặp | Bên A (S05) có ≥ 1 dòng media | Bên B (S06) có ≥ 1 dòng media | Có file local (vai `ops` thấy) |
|---|---|---|---|---|
| Thẻ đang chờ | **0** (12 thẻ đã quyết) | — | — | — |
| 12 thẻ vừa quyết | 12 | **0/12** (khoá chết) | 12/12 | 0/12 ở cả hai bên |
| 8 ứng viên sắp thành thẻ | 8 | **0/8** | 8/8 | 0/8 ở cả hai bên |

Theo nguồn: **S05 thiếu 100%** (lỗi thu + hết hạn + khoá chết). **S06 có 100%** dòng URL, nhưng 0% file local. S03 chưa vào
hàng duyệt (H12).

---

## 3. Nhận xét 2 — Tin A bóc tách kém hơn Tin B

### 3.1 Trên 12 thẻ (giá trị trong `evidence`, chụp lúc sinh thẻ)

| Trường | Tin A (S05) | Tin B (S06) | Ghi chú |
|---|---|---|---|
| Giá · DT · giá/m² | 12 · 12 · 12 | 12 · 12 · 12 | Đủ: Stage B chỉ ghép tin đã có ba số này |
| Phường | 12 (slug) | 12 («Phường X») | So bằng `khoaPhuong`, khớp đúng |
| Loại hình | 12 = **`unknown`** | 12 = `house` | Hiện «Chưa rõ ↔ Nhà riêng · **Lệch**» (H9) |
| Phòng ngủ | **5** | 12 | |
| WC | **0** | 10 | |
| Đường | **0** | 12 | Mạnh vẫn ghi «đường khác» ở 5/11 lý do, tức là tự đọc đường từ đoạn trích 300 ký tự |
| Toà · tầng | 0 · 0 | 0 · 0 | Nhà riêng, không áp dụng |
| Chữ | 300 ký tự (`text`) | tiêu đề (`subject`) | Toàn văn bên A không tải được (H1) |

### 3.2 Trên kho, theo nguồn và bộ đọc (`sale_offers`, `kind='sale'`)

| Nguồn · bộ đọc | n | Giá | DT | Phường | PN | WC | Loại hình biết | Đường | Toà | Tầng |
|---|---|---|---|---|---|---|---|---|---|---|
| S03 · `parsePost` (P1, regex) | 371 | 96% | 60% | **8%** | 50% | **0%** | **0%** | **0%** | **0%** | **0%** |
| S05 · `parsePost` (dùng chung) | 23 | 96% | 91% | 48% | 35% | **0%** | **0%** | **0%** | **0%** | **0%** |
| S06 · cột có cấu trúc của nguồn | 11.849 | 100% | 100% | 100% | 85% | 23% | 100% | 33% | 3% | 4% |

`field_provenance` của S03/S05 chỉ có một trường: `bedrooms` (195 phát biểu `observed · parser`). Bốn trường còn lại chưa
có phát biểu nào.

### 3.3 Tin gốc thiếu hay bộ đọc yếu?

Dò từ khoá trong toàn văn bài mới nhất của mỗi offer (§6 Q6–Q7):

| Trường trống | S03 | S05 | Kết luận |
|---|---|---|---|
| Loại hình (`unknown` 100%) | 152/371 có từ loại hình rõ; 323/371 có tín hiệu căn hộ dự án (PN, toà, studio, tên dự án) | 20/23 | **Bộ đọc vắng**. `parsePost` không có nhánh loại hình (`pipeline/transform-zalo.mjs:136–200`) |
| WC (0%) | 69/371 có «WC/vệ sinh» | 9/23 | **Bộ đọc vắng** |
| Đường (0%) | 12/371 | 6/23 | **Bộ đọc vắng**. Tin S03 là căn hộ dự án, phần lớn không ghi đường. S05 là nhà riêng, có ghi |
| Toà (0%) | 43/371 có «toà/tòa/block + mã» | 7/23 | **Bộ đọc có mà không ghi**: `maToaCan` đọc mã toà/căn (`transform-zalo.mjs:191`) nhưng chỉ dùng làm khoá gom, không thành phát biểu `block_raw` |
| PN (S03 thiếu 184) | 86 «3N» · 48 «studio» · 13 «3 ngủ»; 0 bài «PN» đúng dạng mà vẫn thiếu | 3 «ngủ» | **Bộ đọc yếu**: regex chỉ nhận `PN \| phòng ngủ \| BR` (`transform-zalo.mjs:185`) |
| Phường (S03 thiếu 342) | Chỉ 9 có chữ «phường/quận»; 66 có tên dự án/KĐT | 3/12 | **Tin gốc không ghi phường**. Phải suy từ danh mục dự án → phường (PL11/PL20) và thị trường của nhóm (N1) |
| DT (S03 thiếu 149) | 0 có dạng «…m» | 0/2 | **Tin gốc thiếu** (bài liệt kê nhiều căn, không ghi DT) |

Theo thiết kế PL15 (migration 045), năm cột phân loại chỉ có giá trị qua **phát biểu + phân xử**. Bộ đọc P1 hiện chỉ phát
biểu `bedrooms`. `property_type`, `bathrooms`, `street_raw`, `block_raw` dựa hết vào enrich: E1 là luật, E2 là LLM, rồi tới
đề xuất → thẻ `agent_output` → người duyệt. Nhưng:
- `enrichment_proposals` = **0 dòng** (chi tiết ở `enrich-ngung-2610.md`: chưa bao giờ chạy theo lịch);
- bước `enrich-run` mới nối vào chuỗi đêm hôm nay (`fc9483eb`), và chuỗi đó đang gãy (H6).

**Luật 7 (LLM-off-data-path) nói gì về cách sửa.** Phần đọc được bằng luật tất định (từ khoá loại hình, «3N», «studio» =
0 PN theo RESO `BedroomsTotal`, «2WC», mã toà từ `maToaCan`) nên ghi thẳng thành phát biểu của bộ đọc
(`observed · parser`), không qua LLM. Đó là việc của P1 (bộ đọc) và E1 (P2). Phần cần hiểu ngữ cảnh (đường trong câu tự do,
loại hình khi bài không nói rõ) để E2 đề xuất, kèm trích dẫn, và người duyệt quyết. LLM không ghi thẳng vào canonical.

### 3.4 Phát hiện ở chính thẻ

**H8 — `judge-run` ghi thiếu trường (Cao, lỗi).** PL25 vừa gộp (#209). `evidenceThe` chỉ ghi 8 khoá: `offer_id, source,
price_vnd, area_m2, price_perm2, bedrooms, phuong, property_type` (`agent/scripts/judge-run.ts:89–104`). `queryPair` cũng
không chọn `street_raw, block_raw, floor_raw, bathrooms` (`agent/src/tools/native.ts:43–53`). Bảng so của thẻ có 10 hàng
(`TRUONG_GHEP_CAN`, `review-can-cu.ts:71–82`). Mọi thẻ `judge-run` sinh ra vì thế sẽ hiện Đường/Toà/Tầng/WC = «Thiếu» ở
**cả hai bên**. 12 thẻ cũ có các khoá này vì do seed 029/030 sinh. Với lô 8 cặp kế tiếp, người duyệt sẽ mất luôn đường
của S06, đúng trường Mạnh dùng nhiều nhất trong lý do hôm nay.

**H9 — «Chưa rõ» so ra «Lệch» (Trung, lỗi).** `soGiaTri` coi `unknown` là một giá trị (`review-can-cu.ts:100–103`), nên
«Chưa rõ ↔ Nhà riêng» thành **Lệch**. Đây là tín hiệu giả, nghiêng về «Khác căn». Đúng ra phải là **Thiếu**.

**H10 — bảng so đọc số chụp lúc sinh thẻ (Trung).** `soTruongGhepCan(ev.offer_a, ev.offer_b, …)` đọc `evidence`
(`review-card.tsx`, `EntityMatchCard`), không đọc kho. `loadReviewContext` đã đọc `sale_offers` cho mỗi bên, nhưng chỉ
lấy `field_provenance` và toàn văn. Thẻ vì thế không thấy tin đã được bóc lại hay đã nghỉ, và hiện số cũ cạnh căn cứ mới.

**H11 — PN dạng môi giới (Trung, P1).** 147 offer S03 có PN trong bài mà bộ đọc bỏ qua. PL13 đã có «loại căn có cờ «+»»,
nhưng chưa nêu «3N», «3 ngủ», «studio».

**H12 — S03 không vào hàng duyệt (Trung).** Stage B đòi `area_id`. S03 chỉ có 29/371 offer có phường, 20 offer đủ điều kiện
→ 0 cặp. Hàng duyệt sẽ chỉ có S05 cho tới khi phường S03 được suy từ dự án hoặc nhóm (N1, PL11/PL20). Khi đó S05 lại đang
ngừng thu.

---

## 4. Nhận xét 3 — tự chuyển sang thẻ kế

### 4.1 Hành vi bây giờ

| Bước | Mã | Hành vi |
|---|---|---|
| Mở | `review-queue.tsx` (`onRowClick` / nút tên thẻ → `setOpenId`) | DataGrid lọc «Chờ duyệt», mới nhất trước (`filterReviewItems`, `review-queue.ts:126–130`); bấm hàng thì mở Sheet bên phải |
| Quyết | `review-card.tsx` `useDecide` | Ô «Lý do» bắt buộc (PL3). POST `/api/v1/ops/review/{id}/decide`. Thành công thì đặt dòng «Đã duyệt…» rồi gọi `router.refresh()` |
| Sau khi quyết | `review-queue.tsx:58–60` (ghi chú cố ý) | Thẻ đang mở đọc từ `items`, không từ `rows`. Sheet **giữ nguyên** thẻ vừa quyết (DoneState) cho tới khi người đóng |
| Thẻ kế | — | Người bấm X hoặc Esc, tìm hàng kế trong bảng, bấm mở. Không có nút Trước/Sau, không biết đang ở thẻ thứ mấy trên bao nhiêu |
| Lỗi | `useDecide` | Giữ thẻ và lý do, hiện «Lỗi: …» (409 khi thẻ đã quyết) |

Nhịp thật hôm nay (`decided_at`): 11 thẻ theo đúng thứ tự trên xuống (#24 → #14), khoảng cách 30–128″, trung vị 52″. Mỗi
thẻ mất thêm một lần đóng, một lần tìm, một lần bấm.

### 4.2 Đề xuất (khớp ReUI và `onehub-ui`)

1. **Quyết xong thì sang thẻ kế.** Trước `router.refresh()`, tính `nextPendingId(rows, id)`: thẻ kế theo đúng thứ tự và bộ
   lọc đang thấy, bỏ thẻ vừa quyết, hết thì quay về đầu. Đặt `openId` sang thẻ đó. Nếu thẻ kế nằm trang khác của
   DataGrid thì đổi `pageIndex` theo. Sheet giữ nguyên, nội dung đổi theo `key={item.id}` đang có, nên ô «Lý do» tự rỗng.
   Không thêm hiệu ứng nào: Sheet không đóng/mở lại, không có entrance mới (luật ReUI 4).
2. **Báo bằng toast `sonner`** (đã cài, `Toaster` ở `providers.tsx`). Tiêu đề ≤ 4 chữ (`copy-vi.md`): «Đã duyệt #23»,
   «Đã từ chối #23», «Đã hoãn #23». Toast có một hành động «Xem lại» để mở lại thẻ vừa quyết ở DoneState. **Không có
   «Hoàn tác»**, vì route trả 409 khi thẻ đã quyết và trả lại hàng loạt là việc của UI12.
3. **Hết thẻ chờ**: đóng Sheet, toast «Hết thẻ chờ». Bảng rơi về trạng thái rỗng đã có, với nút «Xem thẻ đã quyết».
4. **Vị trí và đi tay**: đầu Sheet thêm «3/12 thẻ chờ» (`text-xs`, `tabular-nums`) và hai nút
   `Button variant="ghost" size="icon-sm"` (`ChevronLeftIcon`/`ChevronRightIcon`, `aria-label` «Thẻ trước»/«Thẻ sau»), đặt
   cạnh nút Đóng hiện có. Chỉ dùng thành phần đã cài, không chỉnh kích thước hay khoảng cách của chúng.
5. **Tiêu điểm**: sang thẻ mới thì đưa focus về ô «Lý do», để duyệt liền bằng bàn phím. Toast của `sonner` đã có
   `aria-live`.
6. **Không làm**: không tự chuyển khi quyết lỗi; không duyệt hàng loạt (GD10); không chèn phím tắt riêng ở hàng này (cần
   khảo sát xung đột với ⌘K của vỏ Ops trước).

Ranh giới tệp: `app/src/components/ops/review/review-queue.tsx`, `review-detail-sheet.tsx`, `app/src/components/ops/review-card.tsx`
(nhận `onDecided`), và `app/src/lib/ops/review-queue.ts` (hàm thuần `nextPendingId` + test). Không đổi API, không đổi DB →
**T2**. Eval UI: quyết thẻ giữa → Sheet hiện thẻ kế; quyết thẻ cuối → Sheet đóng, bảng rỗng; quyết lỗi → giữ thẻ và lý do;
màn 390px.

---

## 5. Hàng sửa đề xuất

Mọi hàng dưới đây **chưa cắt**. Cắt thật đi qua `/acceptance-gate:cat-luot` sau khi Mạnh duyệt Cổng Đáng. Tầng theo
`_acceptance/config.yaml` (`app/src/app/api/v1/ops/**` là T3).

### 5.1 Hàng mới

| Slug | Câu giao (nháp) | Ranh giới tệp | Tầng | Dãy | Gánh |
|---|---|---|---|---|---|
| `the-ghep-can-tin-roi-kho` | Thẻ ghép căn có một bên không còn trong `sale_offer_records`, hoặc đã nghỉ, được `judge-run` đóng bằng luật tất định, ghi `ops_audit` với lý do «tin rời kho» và đếm riêng, không còn treo ở `loi`. **Bật khi**: chạy trên bản chép 12 thẻ 22/10 thì 12/12 đóng có lý do; thẻ có cả hai bên sống thì không đổi | `agent/scripts/judge-run.ts`, `agent/tests/judge-run.test.ts` | T2 | **P3** | H1 |
| `quyet-dinh-phai-cham-ung-vien` | Route quyết định thẻ ghép căn từ chối ghi (422, có thông điệp) khi cặp không khớp dòng `property_candidates` nào, để không còn quyết định «rơi vào hư không». **Bật khi**: quyết trên thẻ có khoá chết thì 422 và thẻ vẫn chờ; thẻ sống thì đổi đúng 1 dòng ứng viên | `app/src/app/api/v1/ops/review/[id]/decide/route.ts` + test | **T3** | **P3** | H2 |
| `judge-evidence-du-truong` | `queryPair` và `evidenceThe` ghi đủ 10 trường của bảng so (thêm `street_raw`, `block_raw`, `floor_raw`, `bathrooms`), để thẻ do PL25 sinh không «Thiếu» ở trường mà nguồn có. **Bật khi**: thẻ sinh cho 8 cặp 29/10 có Đường bên S06 8/8 | `agent/src/tools/native.ts`, `agent/scripts/judge-run.ts`, test | T2 | **P3** | H8 |
| `the-so-doc-gia-tri-song` | Bảng so của thẻ đọc giá trị hiện tại của tin từ `sale_offers` (cùng truy vấn `loadReviewContext`), `evidence` chỉ để đối chiếu «lúc chấm». `unknown` tính là Thiếu. Bên đã rời kho hiện Alert «Tin A không còn trong kho» và khoá nút quyết. **Bật khi**: 12 thẻ cũ hiện Alert ở bên A; loại hình «Chưa rõ ↔ Nhà riêng» ra **Thiếu** | `app/src/lib/ops/review-context.ts`, `app/src/lib/ops/review-can-cu.ts`, `app/src/components/ops/review-card.tsx`, test | T2 | **U1** | H9, H10, hiển thị H1 |
| `the-duyet-tu-sang-the-ke` | Duyệt xong một thẻ, Sheet tự mở thẻ chờ kế theo thứ tự và bộ lọc đang thấy, toast báo kèm «Xem lại»; đầu Sheet có vị trí «n/N» và nút Trước/Sau; hết thẻ thì đóng Sheet (§4.2). **Bật khi**: 3 eval UI ở §4.2 xanh, màn 390px | `app/src/components/ops/review/review-queue.tsx`, `review-detail-sheet.tsx`, `app/src/components/ops/review-card.tsx`, `app/src/lib/ops/review-queue.ts` | T2 | **U1** | H13 |
| `anh-goc-qua-may-chu` | Vai Vận hành xem được ảnh tin chỉ có URL gốc (S06, S05 khi còn hạn) qua `/api/zalo-media`, theo `media_key`. Máy chủ tự lấy ảnh, trình duyệt không bao giờ nhận URL hay tên miền gốc. Chỉ máy thu. Có trần kích thước và thời gian chờ. **Bật khi**: vai `ops` mở thẻ S06 thấy ≥ 1 ảnh; HTML và JSON của trang không chứa tên miền nguồn (leak gate xanh); `media_key` lạ trả 404 | `app/src/app/api/zalo-media/route.ts`, `app/src/lib/ops/zalo-media.ts`, `app/src/lib/ops/review-media.ts` | **T3** (tầng A) | **U1** | H5 |
| `do-the-duyet-du-du-lieu` | Mỗi đêm đo hàng duyệt: số thẻ chờ có bên rời kho; có bên 0 ảnh xem được, tách theo vai `ops`/`admin`; độ đầy 10 trường mỗi bên theo nguồn. Ghi `dq_check_results`, hiện ở `/ops/quality`. **Bật khi**: chạy trên DB 30/10 ra đúng các số ở §2.3 và §3.1 | `pipeline/` (bộ đo DQ), `pipeline/sql/450_*` | T2 | **P4** | đo H1, H3–H5, H7 |

### 5.2 Sửa câu giao hàng đã có (không cắt trùng)

| Hàng | Sửa | Gánh |
|---|---|---|
| **PL13** `doc-ma-can-gia-khoang` (P1) | Thêm PN dạng «3N», «3 ngủ», «studio» (= 0 PN, RESO `BedroomsTotal`) và WC «2WC/2VS». Ghi mã toà từ `maToaCan` thành phát biểu `block_raw`, không chỉ dùng làm khoá gom. **Bật khi**: S03 thiếu PN từ 184 xuống ≤ 40; `block_raw` S03 > 0 | H11, toà ở §3.3 |
| **PL18** `e1-e2-theo-lop` (P2) | E1 phát biểu `property_type` từ từ khoá rõ (căn hộ/chung cư/studio/PN + toà → apartment; nhà phố/nhà riêng/n tầng → house; đất/lô đất → land) ở lớp parser. LLM chỉ đề xuất khi luật không đủ | H7 |
| **NT6** `enrich-backlog-ben` (P2) | Thêm vào điều kiện bật: sau một lượt toàn backlog, `property_type ≠ unknown` của S03/S05 trong `sale_offers` ≥ 60% (hôm nay 0%) | H7 |
| **TV13b** `sinh-the-ghep-can` (P3) | Đặt **sau** `judge-evidence-du-truong` và `the-ghep-can-tin-roi-kho`, để thẻ sinh định kỳ không mang H8 và tự dọn thẻ khoá chết | H4, H8 |
| **TV9** `bai-goc-anh-len-cloud` | Đường ảnh cloud dùng lại bộ lấy ảnh của `anh-goc-qua-may-chu` (một đường cho cả máy thu lẫn ảnh thu nhỏ) | H5 |

### 5.3 Liên làn — ZCode (giao qua phiên điều phối liên làn)

| Việc | Câu giao (nháp) | Tầng | Gánh |
|---|---|---|---|
| `import-bo-byte-nul` | `import-airbnb.mjs` nạp được bài có byte `0x00` (gạt NUL trước khi ghi, ghi đếm), và chuỗi `zalo-import-daily` chạy lại từ state 29/10 04:26Z. **Kiểm**: một đêm chạy thật qua cả `transform-media` và `enrich-run` | T2 | H6 |
| `s05-tai-anh` | Bộ thu S05 tải ảnh vào snapshot (`media_files`, DATA-CONTRACT v2) như S03. **Mở khi** S05 thu lại (TV15/credit). Không làm thì mọi thẻ S05 mãi 0 ảnh | T2 | H3, H4 |
| ZC9 `s03-anh-tai-loi` | Giữ nguyên. Ảnh hưởng thẻ duyệt khi S03 vào hàng (H12) | — | — |

### 5.4 Ra khỏi kho (việc người)

- 11 quyết định ngày 30/10 nằm trong `review_queue.decision_note` nhưng không tới ứng viên (H2). Mạnh chọn: (a) bỏ, vì
  12 cặp này là khoá cũ và Stage B sinh lại cặp theo khoá mới; hoặc (b) giữ làm nhãn đo cho PL7/PL8 (nhãn của **cặp tin**
  theo bài neo, không theo khoá). Cách (b) cần thêm một bước nối bài neo → khoá mới, và chỉ đáng làm khi PL7 cần nhãn.
- Nạp lại credit S05 hay dừng hẳn S05 (TV15). Hàng duyệt hiện chỉ có S05. Nếu S05 dừng hẳn thì hàng duyệt cạn cho tới khi
  H12 được sửa.

### 5.5 Thứ tự chạy gợi ý

1. ZCode `import-bo-byte-nul`: mở lại chuỗi đêm, kéo theo transform + enrich.
2. P3 `judge-evidence-du-truong` + `the-ghep-can-tin-roi-kho`, rồi TV13b. Phải xong trước lô thẻ kế tiếp.
3. U1 `the-so-doc-gia-tri-song` → `the-duyet-tu-sang-the-ke`. Cùng tệp `review-card.tsx`, nên chạy **nối tiếp**, không
   song song.
4. P3 `quyet-dinh-phai-cham-ung-vien` (T3), U1 `anh-goc-qua-may-chu` (T3).
5. P1/P2 sửa câu giao PL13/PL18/NT6; P4 `do-the-duyet-du-du-lieu`.

---

## 6. Căn cứ đo (tái lập)

Mọi câu chạy với `PGOPTIONS='-c default_transaction_read_only=on'`. `<agent S05>` là `agent_id` của bộ thu S05 trong
`stg_zalo_posts` (tên thật không chép ở đây).

```sql
-- Q1 hàng duyệt và nguồn hai bên
SELECT id, status, created_at, decided_at,
       evidence->'offer_a'->>'source' sa, evidence->'offer_b'->>'source' sb, evidence ? 'cham' cham
FROM review_queue WHERE item_type = 'entity_match' ORDER BY id;

-- Q2 bên nào còn trong kho, có dòng media, có file local
WITH s AS (SELECT id, side, evidence->side->>'offer_id' oid FROM review_queue,
           unnest(array['offer_a','offer_b']) side WHERE item_type = 'entity_match')
SELECT side, count(*), count(DISTINCT oid),
       count(r.offer_id) con_trong_records,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM media m WHERE m.resource_record_key = s.oid)) co_media,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM media m WHERE m.resource_record_key = s.oid AND m.local_file IS NOT NULL)) co_local
FROM s LEFT JOIN sale_offer_records r ON r.offer_id = s.oid GROUP BY side;

-- Q3 media theo nguồn; bài S05/S03 có ảnh và file
SELECT originating_system_name, count(*), count(local_file), count(DISTINCT resource_record_key) FROM media GROUP BY 1;
SELECT CASE WHEN agent_id = '<agent S05>' THEN 'S05' ELSE 'S03' END src, count(*),
       count(*) FILTER (WHERE jsonb_typeof(media) = 'array' AND jsonb_array_length(media) > 0) co_media,
       count(*) FILTER (WHERE jsonb_typeof(media_files) = 'array' AND jsonb_array_length(media_files) > 0) co_files,
       max(captured_at)::date
FROM stg_zalo_posts GROUP BY 1;

-- Q4 hạn URL gốc S05 (tham số oe= là giờ hết hạn, hệ 16)
WITH m AS (SELECT substring(media_url FROM '[?&]oe=([0-9A-Fa-f]{6,16})') oe FROM media WHERE originating_system_name = 'S05')
SELECT count(*), count(*) FILTER (WHERE to_timestamp(('x' || lpad(oe, 16, '0'))::bit(64)::bigint) < now()) het_han,
       max(to_timestamp(('x' || lpad(oe, 16, '0'))::bit(64)::bigint))::date FROM m;

-- Q5 ứng viên sắp thành thẻ và ảnh hai bên
SELECT pc.id, oa.source, ob.source, pc.status, pc.created_at::date,
       (SELECT count(*) FROM media m WHERE m.resource_record_key = pc.offer_a) media_a,
       (SELECT count(*) FROM media m WHERE m.resource_record_key = pc.offer_b) media_b
FROM property_candidates pc JOIN sale_offers oa ON oa.offer_id = pc.offer_a
LEFT JOIN sale_offers ob ON ob.offer_id = pc.offer_b WHERE pc.status IN ('needs_llm','pending');

-- Q6 độ đầy trường theo nguồn
SELECT source, count(*), count(price_vnd), count(area_m2), count(nullif(phuong_raw,'')), count(bedrooms), count(bathrooms),
       count(*) FILTER (WHERE property_type IS NOT NULL AND property_type <> 'unknown'),
       count(nullif(street_raw,'')), count(nullif(block_raw,'')), count(nullif(floor_raw,''))
FROM sale_offers WHERE kind = 'sale' GROUP BY 1;

-- Q7 tín hiệu trong toàn văn của ô trống (S03/S05) — biểu thức đầy đủ ở research-local/audit-hang-duyet-3010/q2.sql, q3.sql
WITH t AS (SELECT o.source, o.bedrooms, lower(z.text) tx FROM sale_offers o
  LEFT JOIN LATERAL (SELECT p.text FROM stg_zalo_posts p WHERE p.post_id = ANY (o.post_ids)
                     ORDER BY p.captured_at DESC NULLS LAST LIMIT 1) z ON TRUE
  WHERE o.kind = 'sale' AND o.source IN ('S03','S05') AND o.bedrooms IS NULL)
SELECT source, count(*),
       count(*) FILTER (WHERE tx ~ '\d\s*(pn|phòng ngủ|br)') dang_pn,
       count(*) FILTER (WHERE tx ~ '\d\s*n\M' AND tx !~ '\d\s*(pn|phòng ngủ|br)') dang_n,
       count(*) FILTER (WHERE tx ~ '(studio|\mstu\M)' AND tx !~ '\d\s*(pn|phòng ngủ|br)') dang_studio
FROM t GROUP BY 1;

-- Q8 phát biểu đang có của S03/S05
SELECT source, k, v->>'tier', v->>'method', count(*) FROM sale_offers, jsonb_each(field_provenance) e(k, v)
WHERE source IN ('S03','S05') AND kind = 'sale' GROUP BY 1, 2, 3, 4;
```

Ngoài DB: `pipeline/logs/zalo-import.log` ở checkout chính (dòng «nạp fail tại …2026-10-29T042737822»);
`git log -S'job_run zalo-import-daily enrich-run' -- scripts/zalo-import-daily.sh` → `fc9483eb` (30/10).
