# S03 — bóc tin chữ thành dữ liệu có cấu trúc: framing, phân tích, đề xuất (30/10)

> Ngày 2026-10-30 · Trạng thái: **§8.6 Mạnh đã duyệt 30/10; bản cắt cuối §9 chờ Mạnh gật để cắt lượt** (bổ sung chiều 30/10: nguyên lý gốc, thử Kev/Qwen trên bài thật, trạng thái lộ trình — §8 thay §5–§6 ở chỗ khác nhau) · Làn: Claude (transform → canonical), một phần ZCode (danh mục, §5 B5).
> Cách làm: chỉ đọc — DB local :5433 (SELECT), chạy `parsePost` của `pipeline/transform-zalo.mjs` (HEAD `842ee484`) trên
> toàn bộ bài S03 thật đang có, không ghi DB, không sửa code. Số thô ở `research-local/s03-boc-tach-3010/` (gitignored).
> Đọc kèm: `docs/architecture/classification-enrich-review.md` (§0.2–§0.3, §7.0 đã chốt), ADR-0013,
> `docs/architecture/reso-khung-phan-loai.md`, `docs/research/anh-tin-rao-va-scorecard-truong-2910.md` (scorecard 29/10).
> Tên nhóm gọi theo mô tả (nhóm OCP1-Masteri, nhóm Grand Park căn hộ…), không chép tên thật; không chép SĐT, URL ảnh.

---

## 0. Kết luận một trang

Ví dụ Mạnh đưa (tin cho thuê studio toà «Hawaii H3») đi qua đường hiện tại thành **một tin thuê giá 6 tỷ**,
không toà, không dự án, không loại hình, không phường. Con số 6 tỷ do parser đọc được chuỗi `…6tY7…` **nằm trong URL ảnh**.
Bỏ URL đi thì nó lại không đọc được «7.000.000», vì số này không kèm đơn vị.

Ví dụ này không phải ca lẻ. Đo trên **21.934 bài S03 thật** (19–29/10):

| Chỗ hỏng | Số đo |
|---|---|
| **Cửa vào bỏ bài có số** — có giá, DT hoặc số PN nhưng không có chữ «bán/cho thuê» → bị loại ở bước 2 | **7.163 bài** (33%). Mẫu 40 bài: 27 tin rao thật, 12 là yêu cầu (bên mua hoặc thuê). Cận Wilson 95% cho tỉ lệ tin rao: 52–80%, tức **~3.700–5.700 tin rao bị bỏ**. Con số này **gần bằng toàn bộ** 5.605 bài đang lọt qua. |
| **Đọc nhầm bậc của giá** — «2.650 tỷ», «2400 tỷ thu về» thành 2.650 tỷ | 579 bài bán > 100 tỷ (16% số bài bán) |
| **Tiếng lóng giá** — «2ty450», «5tr5», «8tr5» | 737 + 1.519 bài, đọc hụt phần lẻ |
| **Nhầm ý định** — «không cho thuê», «đang cho thuê», «khai thác cho thuê» nằm trong tin bán → bị xếp vào thuê | 36/178 offer thuê (**20%**) có giá ≥ 1 tỷ |
| **Một bài nhiều căn** — bài tổng hợp «5 căn rẻ nhất», bài trộn cho thuê và bán | 736 bài có ≥ 3 cụm giá; mỗi bài vẫn thành một offer với một giá ngẫu nhiên |
| **Gộp nhầm** — khoá gom không có mã toà/căn | Offer lớn nhất gom 278 bài với 67 nội dung khác nhau (cùng người, cùng 7 triệu, cùng 2PN) |
| **Loại căn kiểu môi giới** — studio, «1N+1», «2PN+», «2N» | 1.250 bài studio + 1.828 bài viết tắt không có số PN; nhóm OCP1-Masteri chỉ 55/3.308 bài có PN |
| **Mã toà/căn có trong bài nhưng không có danh mục để nối** | 6.788 bài (31%) có mã dạng S10, BS8, PR2, LD2, BE1, GH3… Danh mục `asset_nodes`: 20 dự án, **3 toà, 0 phân khu**; OCP1 không có toà nào; `stg_s08_inventory` local 0 dòng |
| **Phường** — transform chỉ nạp phường Hà Nội | ~47% bài thuộc nhóm Grand Park (TP.HCM) → không bao giờ có phường; giải thích phường S03 = 1% ở scorecard 29/10 |
| **Loại hình / enrich** | 415/415 offer S03 `unknown`; `enrichment_proposals` **0 dòng** (sau dọn F6, E1/E2 chưa chạy lại); model local đang chạy |
| **Trường không có chỗ chứa** | Nội thất 6.208 bài (28%), hướng/view 3.615, «sẵn pass»/xem nhà 2.798, tầng 2.199, điều khoản HĐ/cọc 1.395. `field_assertions` chỉ nhận 5 trường |

**Framing một câu**: những gì Mạnh «nhìn là biết» thật ra gồm **ba loại tri thức khác nhau**: đọc trong chữ, tra danh mục,
và ngữ cảnh nhóm. Hệ thống hiện chỉ có một phần của loại đầu, và phần đó còn sai. «Enrich» ở đây **không phải để LLM đoán
kiến thức thế giới**. Enrich là **nối mã toà vào danh mục có bậc**, rồi kế thừa dự án, CĐT, phường, loại hình từ danh mục.

**Khuyến nghị**:
1. **Làm ngay B1** (T2, nhỏ, không phụ thuộc). Sửa bộ đọc số, ý định, URL và khoá gom. Riêng việc này đã sửa được phần lớn số
   sai đang lên `/ops`.
2. **B2–B4** mở cửa vào: tách bài, ghi Yêu cầu.
3. **B5–B7** (danh mục + trường + bộ đọc) đi theo các hàng PL10/PL11/PL13/PL18/PL20 đã có, với ba sửa câu giao.
4. Mọi ngưỡng tự áp vẫn đo trên tập nhãn (PL7/PL8, F3).

---

## 1. Framing — người đọc làm gì khi «nhìn là biết»

Tin ví dụ (đã bỏ SĐT và URL ảnh):

```
Cho thuê 🥰😍🥰
Mã căn: Hawaii H3.
Loại căn: studio
Nội thất: Full đồ
Giá thuê: 7.000.000
Bao phí: không
Hợp đồng 1 năm đóng 3 cọc 1
Đi xem: sẵn pass
Lh <SĐT>
<URL ảnh>
```

Mạnh đọc ra: KĐT Vinhomes Ocean Park 1 · chủ đầu tư Masterise · toà Hawaii H3 · loại hình căn hộ · loại căn studio · …
Tách theo **nguồn của từng điều biết**:

| Điều biết | Có trong chữ? | Thực ra đến từ | Bậc căn cứ (thang 3 lớp, PL15) |
|---|---|---|---|
| Cho thuê, studio, full đồ, 7 triệu/tháng, không bao phí, HĐ 1 năm, đóng 3 cọc 1, sẵn pass | Có | **Đọc** | quan sát có trích dẫn |
| Mã toà «Hawaii H3» | Có (một chuỗi) | **Đọc** ra chuỗi, rồi **nối** chuỗi vào một dòng danh mục | đọc: quan sát · nối: suy luận (tới khi đo) |
| Thuộc KĐT Ocean Park 1, phân khu nào | Không | **Danh mục**: toà → phân khu → KĐT | kế thừa bậc của dòng danh mục (F2: xác minh · suy ra mạnh · một lời khai) |
| Chủ đầu tư Masterise | Không | **Danh mục** — CĐT gắn ở cấp toà/phân khu (RESO `Building.BuilderName`); KĐT có CĐT khác | như trên |
| Loại hình căn hộ | Không ghi | **Suy ra**: «studio» + toà chung cư | suy luận |
| Phường | Không | **Danh mục**: dự án → `area_ids` | suy luận từ danh mục |
| Nhóm chuyên OCP1/Masteri | Không | **Ngữ cảnh nhóm** (sổ nhóm, PL12) | suy luận, chỉ phá hoà, không tự quyết (Q4/Q9 đã chốt) |

Từ đó ra năm việc. Mỗi việc là một tầng, sai theo kiểu riêng và đo riêng:

1. **Tách**: một bài là 0, 1 hay N mục rao? Mỗi mục là tin rao, Yêu cầu, hay không phải tin? (`listing_intent` đã có trong sổ.)
2. **Đọc**: rút trường từ chữ, chuẩn hoá số kiểu VN, mỗi giá trị kèm đoạn trích.
3. **Nối**: chuỗi mã toà/phân khu/dự án → dòng `asset_nodes`, có dùng ngữ cảnh nhóm để phân giải trùng mã.
4. **Suy ra** từ danh mục (đây mới là «enrich» thật): KĐT, CĐT, phường, loại hình — kèm bậc của dòng danh mục.
5. **Ghép**: tin → trục/căn (PL20). Việc này nằm ngoài phạm vi tài liệu, chỉ nêu để khớp thứ tự.

Hệ quả cho cách làm (khớp hiến pháp §1 luật 7 và ADR-0013):
- LLM **chỉ được dùng ở tầng 2** (đọc), chạy mù, có trích dẫn (PL18). Không dùng LLM để «nhớ» toà nào thuộc CĐT nào: tri thức
  đó phải nằm trong danh mục có nguồn, nếu không thì sai không ai bắt được.
- Tầng 3–4 là **tra cứu xác định**. Thiếu danh mục thì tầng 4 không có gì để làm, và đó đúng là tình trạng hiện nay.

---

## 2. Ví dụ đi qua đường hiện tại

| Trường | Người đọc | Hệ thống ghi (`sale_offers`, offer của bài này) | Vì sao |
|---|---|---|---|
| Ý định | cho thuê | `rent_lt` ✓ | |
| Giá | 7 triệu/tháng | **6.000.000.000** ✗ | regex «tỷ» khớp `6tY` trong URL ảnh (cờ `i`, `Y`≈`y`); bỏ URL thì «7.000.000» không đơn vị → null |
| Loại căn / PN | studio | null | regex chỉ nhận «N PN / phòng ngủ / BR» |
| Toà | Hawaii H3 | null | parser không đọc toà; `block_raw` chỉ có ở S06 |
| Dự án, CĐT | OCP1, Masterise | null | không có tầng nối; danh mục OCP1 không có toà |
| Loại hình | căn hộ | `unknown` | E1/E2 chưa chạy lại sau F6 (0 đề xuất) |
| Phường | (từ dự án) | null | |
| Nội thất, HĐ, cọc, phí, xem nhà | có | — | không có trường để chứa |
| Độ tin | — | `medium` | vì «có giá» |

Sai thì offer này vẫn lên `/ops`, và đi vào thước giá thuê của nhóm `unknown`.

---

## 3. Phân tích — số đo trên toàn bộ bài S03 thật

Tập: 21.934 bài có chữ, sau khi gạt bài thử (`loadStgPosts`), ngày đăng 19–29/10. Bài chỉ có ảnh không nằm trong tập (xem
scorecard 29/10 và PL28). Cách đếm: chạy `parsePost` trên chữ bài, một lần giữ nguyên, một lần đã bỏ URL.

### 3.1 Phễu

| Bậc | Bài | % |
|---|---|---|
| Bài có chữ | 21.934 | 100 |
| Nhận ra ý định (bán/thuê) | 6.898 | 31,4 |
| …và có giá → đi tiếp | 5.605 | 25,6 |
| **Không nhận ra ý định nhưng có giá/DT/PN → bị bỏ** | **7.163** | **32,7** |
| Offer S03 sau gom (415 offer, tổng 5.422 bài) | 415 | — |

Mẫu 40 bài (hạt cố định) trong 7.163 bài bị bỏ: **27 tin rao** (đa số tin thuê viết gọn kiểu «S10.03 2PN+ Full 10tr cọc 2»,
tin bán viết «Giá: 1,85 tỷ thu về» không có chữ «bán»), **12 Yêu cầu** («khách tìm thuê 2pn…»), 1 không rõ. Đếm bằng từ khoá
thì 1.224/7.163 bài có dạng Yêu cầu. Từ khoá bỏ sót nhiều, nên tỉ lệ từ mẫu (30%) đáng tin hơn.

### 3.2 Lỗi theo tầng

**Tầng 1 — tách và ý định**
- Regex «cho thuê» được kiểm **trước** «bán». 254 bài có cả hai cụm. Tin bán ghi «không cho thuê», «đang cho thuê», «khai thác
  cho thuê ngay» thì thành tin thuê. Hệ quả: 36/178 offer thuê có giá ≥ 1 tỷ. Các mẫu xem được đều là tin bán hoặc bài tổng hợp.
- Không nhận «chuyển nhượng», «sang nhượng», «giá chốt», «thu về» là bán: 489 bài.
- Bài tổng hợp nhiều căn: 736 bài có ≥ 3 cụm giá. Bài tổng hợp «5 căn rẻ nhất» theo loại, và bài trộn «CHO THUÊ: … BÁN: …»,
  đều thành một offer.
- Yêu cầu (bên mua/thuê) không được ghi ở đâu cả. Sổ đã có `listing_intent = inquiry` (vòng `wanted-thanh-inquiry`), nhưng
  chưa có cột và transform chưa ghi.

**Tầng 2 — đọc số**

| Dạng | Bài | Parser hiện ra |
|---|---|---|
| «2.650 tỷ», «6,950 tỷ», «2400 tỷ thu về» (môi giới viết triệu kèm chữ tỷ) | 579 bài bán ra > 100 tỷ | gấp 1.000 lần |
| «2ty450», «1ty650», «3ty2» | 737 | 2 tỷ (mất phần lẻ) |
| «5tr5», «8tr5», «4tr8» | 1.519 | 5 triệu |
| «36XX tỷ», «3.8x tỷ» (che số — F1) | 1.014 | đọc phần đầu, mất khoảng |
| «Giá: 4,000 (thu về)» — triệu, không đơn vị | 249 | null |
| «7.000.000» — đồng, không đơn vị | hiếm (ví dụ của Mạnh) | null |
| URL ảnh lẫn trong chữ bài | 11.613 bài có URL; **6** bài ra giá từ URL | giá rác |
| DT «64m», «43.2m» (không có «2») | 823 bài mất DT | null |

**Tầng 2 — đọc loại căn**: 1.250 bài «studio» và 1.828 bài «2N», «1N+1», «2PN+» không ra số PN. Loại căn của môi giới (studio,
1PN+, 2PN+1…) vừa là số PN vừa là cờ «+» (phòng đa năng). Nên ghi cả hai, đừng ép về một số.

**Tầng 2 — trường chưa có chỗ chứa** (bài có nhắc đến): nội thất 6.208 · hướng/view 3.615 · xem nhà/«sẵn pass» 2.798 · tầng
(cao/trung/số) 2.199 · điều khoản HĐ/cọc 1.395 · phí/bao phí 121 · «thu về/NET/bao thuế phí» (`price_basis`, F1 đo 42% ở OCP1).
Ngày vào ở («1/11 ở được», «20/11 in») gặp dày ở tin thuê, nhưng đợt này chưa đếm.
Khuôn «Nhãn: giá trị» như ví dụ chỉ chiếm **816 bài (3,7%)**. Bộ đọc riêng cho khuôn này đáng làm như một luật, nhưng không
phải lời giải chính.

**Tầng 3 — nối**
- 6.788 bài (31%) có mã dạng toà/căn. Mã hay gặp: S10, S5, S1, S2, BS8, S7, S6, S3, S20, BS10, PR2, E2, BE1, PR5, GH3, PR6,
  LD2, LD1, LD3, R1, ZR2, H2… Trong số đó có nhiễu: «T4» thường là «T4/2027 nhận nhà», «NTL18410» là mã nội bộ của môi giới.
  Vì vậy cần danh mục để nối, regex chung không đủ.
- Danh mục `asset_nodes`: 20 dự án, 3 toà (đều ở Grand Park), 0 phân khu. OCP1 không có toà nào. Dữ liệu S08 (danh mục bán
  hàng, vòng `import-s08` đã ký) **chưa có dòng nào ở local**.
- Trùng mã giữa các dự án: S1, S2… có ở cả OCP1 lẫn Grand Park. Một dự án TP.HCM khác lại khai `s7`, `s10` làm **bí danh dự
  án**, đè lên mã toà S7/S10 của Grand Park (569 bài có «S10»). E1 sẽ gán nhầm dự án nếu chạy.
- **Cần kiểm lại**: bí danh và `area_ids` của OCP1/OCP2/OCP3 đang trộn «Vũ Yên» (nghi nhầm sang dự án ở tỉnh khác). Đây là
  dòng seed, chưa có nguồn xác minh (bậc «một lời khai» theo F2).

**Tầng 4 — suy ra**
- Phường: `runTransformZalo` chỉ nạp phường `vn-hanoi`. Các nhóm Grand Park (căn hộ + nhà phố, 10.324 bài = 47%) và một phần nhóm
  tổng hợp là TP.HCM. `areas` có sẵn 167 phường `vn-hcmc`. Dự án trong danh mục đã mang `area_ids`, nên phường suy ra từ dự án
  được ngay khi nối xong.
- Loại hình: 415/415 `unknown`. Toà chung cư (danh mục) + «studio/PN» (đọc) đủ để suy ra «căn hộ» ở bậc suy luận.

**Gom repost (bước 4)**: khi thiếu phường và DT, khoá gom là `kind|?|giá|?|PN|người đăng`. Một môi giới rao nhiều căn 2PN cùng
giá 7 triệu sẽ bị gom thành một offer. Ba offer lớn nhất gom 278/233/170 bài với 67/65/57 nội dung khác nhau. Mã toà/căn phải
vào khoá.

### 3.3 Năm gốc

| Gốc | Biểu hiện |
|---|---|
| **G1. Parser coi mỗi bài là một căn, regex nào khớp trước thì thắng, đọc cả URL** | sai bậc giá, sai ý định, giá rác, bài nhiều căn thành một |
| **G2. Cửa vào cứng**: không có «bán/thuê» thì bỏ, không có giá thì bỏ, Yêu cầu bị vứt | 1/3 số bài có số bị loại, mất cả cung lẫn cầu |
| **G3. Không có danh mục toà cho các dự án đang thu** (OCP1, Grand Park), bí danh xung đột | 31% bài có mã toà nhưng không có gì để nối, tầng 4 trống |
| **G4. Thiếu trường đích**: `field_assertions` chỉ có 5 trường, `mappings.yaml` không có `UnitNumber`, `Furnished`, điều khoản thuê, `price_basis`, giá khoảng | đọc được cũng không có chỗ ghi |
| **G5. Không đo**: chưa có tập nhãn (PL7/PL8), bench C2 đo trên mock, enrich chưa chạy lại | không biết bộ đọc đúng bao nhiêu, nên chưa được tự áp (F3) |

---

## 4. Kiến trúc đích (khớp những gì đã chốt)

```
bài S03 (raw, bất biến)
 └─ T1 TÁCH        làm sạch (bỏ URL/SĐT khỏi chuỗi đọc số) → 0..N mục; mỗi mục: listing_intent (offer · inquiry · not_listing · unknown)
     └─ T2 ĐỌC     luật xác định trước (số VN, ý định có phủ định, loại căn, khuôn «Nhãn: giá trị»)
     │             + bộ đọc LLM local chạy mù cho phần còn lại (PL18) — chỉ tính khi trích dẫn có thật trong chữ
     │             → field_assertions (giá trị + bậc + rule_id/model + đoạn trích)  [PL15 đã có bảng]
     └─ T3 NỐI     chuỗi toà/phân khu/dự án → asset_nodes, phân giải trùng mã bằng dự án nhóm chuyên (suy luận, H5)
         └─ T4 SUY RA  KĐT · CĐT · phường (area_ids) · loại hình — kế thừa bậc dòng danh mục (F2)
             └─ phân xử (PL15) → cột canonical + provenance → /ops ; chỉ ô đã đo đạt F3 mới tự áp
```

Ví dụ của Mạnh khi đi qua đích:

| Tầng | Ra |
|---|---|
| T1 | 1 mục, `offer`, thuê; bỏ URL trước khi đọc số |
| T2 | giá 7.000.000/tháng (luật «số đồng ≥ 7 chữ số sau nhãn Giá»), `UnitNumber`/toà thô «Hawaii H3», loại căn studio (PN 0), `Furnished` = đầy đủ, phí không bao, HĐ 12 tháng, cọc 1 + đóng 3, xem nhà sẵn pass — mỗi giá trị kèm đoạn trích |
| T3 | «Hawaii H3» → dòng toà H3 thuộc phân khu chứa «Hawaii» của OCP1 — **chỉ khi danh mục có dòng đó**; nhóm OCP1-Masteri giúp chọn dự án nếu mã trùng |
| T4 | KĐT OCP1, CĐT (theo cấp toà/phân khu), phường từ `area_ids`, loại hình căn hộ — bậc suy luận |

---

## 5. Đề xuất

| Mã | Việc | Làn · tầng rủi ro | Quan hệ với lộ trình | Bật khi (đề xuất) |
|---|---|---|---|---|
| **B1** | **Sửa bộ đọc số + ý định của S03**: bỏ URL/SĐT khỏi chuỗi đọc số; chuẩn hoá giá VN («2.650 tỷ», «2400 tỷ thu về», «2ty450», «5tr5», «4,000 thu về», số đồng không đơn vị sau nhãn Giá); ý định có phủ định («không/đang/khai thác cho thuê» không làm tin thành thuê) và nhận «chuyển nhượng/thu về/giá chốt» là bán; DT «64m»; studio/«1N+1»/«2PN+» → PN + cờ «+»; khoá gom thêm mã toà/căn khi thiếu phường/DT. Mỗi luật có ca thử lấy từ bài thật (đã bỏ SĐT). | Claude · T2 | **Hàng mới**, đứng trước PL17 (PL17 lo việc ghi phát biểu có `rule_id`, không lo luật đúng). Không cần migration. | Nạp lại S03: 0 offer thuê ≥ 1 tỷ; 0 offer bán > 100 tỷ; 0 giá đọc từ URL; mọi ca thử xanh; không offer nào gom > 10 nội dung khác nhau |
| **B2** | **Cửa vào mềm + ghi Yêu cầu**: bài có số mà không rõ ý định không bị bỏ. Bài thành mục với `listing_intent` (offer/inquiry/unknown); Yêu cầu được ghi lại (bên mua, khớp mô hình đối xứng đã chốt 27/10) | Claude · T3 (cột `listing_intent`) | Dựa trên PL5 (cột `listing_intent`); bổ sung phạm vi cho PL5 hoặc hàng mới ngay sau PL5 | Mẫu 40 bài bị bỏ hôm nay: ≥ 25 vào thành offer, ≥ 10 thành Yêu cầu |
| **B3** | **Tách bài nhiều căn**: bài tổng hợp/bài trộn → N mục, khoá offer theo (post, thứ tự mục); bài chỉ ảnh gộp vào bài chữ (PL28) là chiều ngược của cùng tầng T1 | Claude · T2 | Hàng mới; chạm `offer-key.mjs` (PL14) nên phải giữ khoá dính | Bài tổng hợp 5 căn ra 5 offer với 5 giá; nạp lại hai lần không đổi `offer_id` |
| **B4** | **Phường theo thị trường của nhóm**: transform nạp phường theo thị trường của nhóm (sổ nhóm PL12), không cố định Hà Nội; phường suy từ dự án sau khi nối | Claude · T2 | Gộp vào B1 nếu chỉ đổi danh sách thị trường; phần «suy từ dự án» thuộc T4 (B5) | Bài nhóm Grand Park có ghi tên phường thì ra phường `vn-hcmc-*` |
| **B5** | **Danh mục toà cho dự án đang thu**: (a) **sửa câu giao PL10/PL11** để gồm cả Grand Park, ngoài OCP1 (47% bài S03 là Grand Park); (b) dựng ứng viên toà từ chính bài (đếm mã × môi giới độc lập, F2 «suy ra mạnh» — C1.5); (c) dọn bí danh xung đột (`s7`/`s10` của dự án khác), kiểm `area_ids` OCP1–3 với nguồn xác minh; (d) nạp S08 vào local (vòng `import-s08` đã ký nhưng 0 dòng) | (a)(d) ZCode thu + Claude nạp · (b)(c) Claude · T3 (PL11 có migration) | PL10, PL11 (sửa câu giao); C1.5 | Mọi mã toà xuất hiện ≥ 20 lần ở hai dự án đều có dòng danh mục kèm bậc; 0 bí danh dự án trùng mã toà |
| **B6** | **Mở rộng trường đọc**: thêm vào **câu giao PL13** (đang có `UnitNumber`, `BuildingName`, `SubdivisionName`, giá khoảng, `PriceBasis`) các trường thuê: `Furnished`, thời hạn HĐ (`LeaseTerm`), số tháng cọc/đóng, phí đã gồm, ngày vào ở, tình trạng xem nhà; loại căn + cờ «+». Khai trong `mappings.yaml` (RESO-first, ADR-0011/0013), mở `field_assertions_field_chk` bằng migration | Claude · T3 | PL13 (sửa câu giao), PL6 (sổ từ vựng sinh enum) | Trên tập nhãn lát: trường nhóm C đạt cận dưới 0,80; nhóm A/B theo F3 |
| **B7** | **Bộ đọc LLM local chạy mù + trích dẫn** cho phần luật không đọc được; ghi `ai_calls`; so với luật trên tập nhãn, ô nào thắng thì dùng ô đó | Claude · T2 | Chính là PL18 (+ NT6 chạy hết backlog); PL29 đã ký | Không prompt nào chứa đáp án E1; trích dẫn giả bị loại 100%; chi phí/độ trễ hiện ở `/ops` |
| **B8** | **Đo**: tập nhãn lát (PL7 màn gắn nhãn mù, PL8 tập mẫu, PL9 Wilson). Thêm **field-yield theo tầng** (bài → mục → trường đọc → nối → suy ra) vào scorecard (C2b ở báo cáo 29/10) | Claude · T2 | PL7, PL8, PL9; C2b | Scorecard hiện tỉ lệ từng tầng theo nhóm, theo ngày |

**Thứ tự đề xuất**: B1 (+B4 phần danh sách thị trường) làm ngay, vì không phụ thuộc gì và lấy lại phần lớn số sai → B8 (PL7/PL8)
song song, vì mọi ngưỡng tự áp đều chờ nó → B5 (danh mục) → B6 (PL13 mở rộng) → B7 (PL18) → B2/B3 sau PL5/PL14 → PL20 ghép căn.

**Không đề xuất**:
- Không dùng LLM để sinh tri thức dự án/CĐT. Không mở model cloud: M1 local mặc định đã chốt, và model local hiện đáp ứng.
- Không đọc ảnh bảng giá bằng model vision trước khi có số đo cho thấy cần (hiến pháp luật 11). Model local hỗ trợ ảnh,
  nhưng đó là việc của một đợt đo sau.
- Không làm bộ đọc chuyên cho khuôn «Nhãn: giá trị» thành đường chính: khuôn này chỉ chiếm 3,7%. Nó chỉ là một luật trong B1/B6.

---

## 6. Câu hỏi cho Mạnh

| Hỏi | Nội dung | Khuyến nghị |
|---|---|---|
| **Hỏi-1** | Duyệt **B1** (sửa số, ý định, URL, khoá gom, phường theo thị trường) làm ngay bằng `/feature-loop` T2, làn Claude? | Duyệt |
| **Hỏi-2** | Danh mục: mở rộng PL10/PL11 sang **Grand Park** (47% bài S03), hay giữ một lát OCP1 như đã chốt 26/10 (Hỏi-2 lát OCP1)? | Giữ OCP1 làm lát **đo**; thêm Grand Park vào **danh mục** (B5a). Việc thu danh mục rẻ, và thiếu nó thì một nửa số bài không nối được |
| **Hỏi-3** | Thêm trường thuê (nội thất, thời hạn HĐ, cọc/đóng, phí, ngày vào ở, xem nhà) vào PL13 — nhóm C, ngưỡng 0,80? | Đồng ý; trước hết là nội thất và ngày vào ở |
| **Hỏi-4** | Ghi Yêu cầu (~30% số bài đang bị bỏ) ngay khi có PL5 (B2), hay để sau? | Ngay sau PL5: tín hiệu cầu đang mất mỗi ngày, và raw vẫn giữ nên không mất hẳn |
| **Hỏi-5** | CĐT ghi ở cấp nào: KĐT hay toà/phân khu? Ví dụ OCP1 và phân khu Masteri có CĐT khác nhau | Ghi ở **toà** (`Building.BuilderName`, RESO DD 2.1), hiển thị cấp gần nhất; KĐT mang CĐT riêng của nó |

Duyệt xong: cắt B1/B3 (hàng mới) và sửa câu giao PL10/PL11/PL13 bằng `/acceptance-gate:cat-luot`, rồi mở `/feature-loop` cho B1.

---

## 7. Căn cứ đo (tái lập)

- Tập bài: `loadStgPosts(client, "zalo")` (đã gạt bài thử), cửa sổ 30 ngày, chữ không rỗng → 21.934 bài (posted_at 19–29/10).
- Bộ đọc: `parsePost` / `matchPhuong` của `pipeline/transform-zalo.mjs` @ `842ee484`, chạy y nguyên, không sửa.
- Offer: `sale_offers WHERE source = 'S03'` (415 dòng, chưa retire); `last_seen` mới nhất 28/10 16:51Z.
- Script và kết quả thô (có chữ bài gốc nên chỉ ở local): `research-local/s03-boc-tach-3010/do-out.json`, `do2-out.json`, `do3-out.txt`.
- Mẫu 40 bài bị bỏ: hạt LCG 42, phân loại tay (tin rao · Yêu cầu · không rõ); cận Wilson 95% cho 27/40 = 0,52–0,80.

---

## 8. Bổ sung 30/10 (chiều) — nguyên lý gốc: dùng model nào cho việc nào, và cái gì đã có trong lộ trình

> Mạnh hỏi: đừng sửa theo kiểu vá lỗi, hãy lùi về nguyên lý gốc. Kev/Jev đã dùng để phân loại, nhưng đã dùng để bóc tách
> chưa, và dùng có đúng cách chưa? Nếu Kev không làm được thì LLM nào đủ rẻ và hiệu quả (GLM-5.3 flash, DeepSeek v4.1
> flash)? Những việc này kiến trúc phân loại + enrich đã thiết kế tới đâu, để tránh làm lại?
> Trong kho chỉ có **Kev** (local, :8009) và **Jev** (bản tham chiếu hosted, chỉ dùng để so). Không có model nào tên
> «Rev». Mục này hiểu «Rev, Kev» là họ model quyết định Kev/Jev.

### 8.1 Nguyên lý gốc — bóc một bài là bốn loại phép tính khác nhau

Một bài phải thành các phát biểu (trường · giá trị · căn cứ · bậc). Theo **hình dạng đầu ra**, các phép tính chia thành bốn
loại, và mỗi loại hợp với một loại công cụ:

| Loại phép tính | Đầu ra | Ví dụ | Công cụ đúng bản chất | Vì sao |
|---|---|---|---|---|
| **Phân loại** | chọn một trong tập đóng, kèm xác suất | ý định (tin rao · Yêu cầu · không phải tin), bán/thuê, loại hình, nội thất, loại căn, bài nhiều căn? | **Model quyết định (Kev)** — câu hỏi `choice`/`noul` | Ra phân phối xác suất đã hiệu chuẩn (Brier), rẻ, local; bậc tin đọc thẳng từ xác suất |
| **Trích** | chuỗi hoặc số **nằm trong chữ** | giá, DT, mã toà, mã căn, ngày vào ở, điều khoản cọc | **Luật xác định** trước; phần luật không phủ được thì dùng **LLM sinh, có trích dẫn** | Mọi giá trị phải trỏ được về đoạn chữ. Luật thì kiểm được; LLM thì kiểm bằng trích dẫn |
| **Nối** | một dòng danh mục | «Hawaii H3» → toà nào | **Tra cứu** danh mục + luật phân giải; khi mờ thì Kev `choice` trên danh sách ứng viên **lấy từ danh mục** | Đáp án phải là một dòng có thật; model không được bịa dòng mới |
| **Suy ra** | thuộc tính kế thừa | KĐT, CĐT, phường, loại hình từ toà | **Không cần model**: đi theo cây danh mục | Tri thức nằm trong danh mục có nguồn, không nằm trong trí nhớ model |

Từ bảng này, ba điều về cách đang làm:

1. **Kev là đúng công cụ cho phân loại, nhưng đang hỏi sai câu và chưa được nối vào đường.**
   - Câu gate «có phải tin rao BĐS (bán/cho thuê/**tìm mua**)?» và câu `kind` «sale = rao bán **hoặc tìm mua**» gộp cung với
     cầu, nên không tách được Yêu cầu.
   - Điểm `meta.kev.p` chỉ nằm trong raw (PL4). `stg_zalo_posts` không có cột Kev. `transform-zalo` không đọc Kev.
   - Ý định bán/thuê vẫn do regex quyết. Đây chính là chỗ làm 7.163 bài bị bỏ và 20% tin bán bị xếp thành thuê (§3).
2. **Regex đang làm cả hai việc phân loại lẫn trích.** Nó chỉ hợp với việc trích, và ngay việc trích cũng còn hổng (§3.2).
3. **E2 (Qwen) đang làm sai kiểu**:
   - prompt bắt LLM tự khai «confidence 0–1» (không hiệu chuẩn) và không đòi trích dẫn;
   - prompt được mồi đáp án E1;
   - LLM được hỏi cả phân loại (`property_type`) — việc Kev làm rẻ hơn và có xác suất thật.

   PL18 đã nhận ra hai lỗi đầu. Lỗi thứ ba chưa có hàng nào ghi.

### 8.2 Thử ngay trên bài thật: Kev và Qwen local, mỗi bên làm đúng loại việc của mình

Mẫu gồm 61 bài: 40 bài đang bị bỏ (§3.1, hạt 42), 20 bài đang lọt (hạt 7) và tin ví dụ. Mỗi bài cho chạy qua hai đường:
- **Kev-4B** với 5 câu hỏi typed: ý định 3 lớp · bán/thuê · loại hình · nội thất · bài nhiều căn?
- **Qwen 27B local** (MTPLX, tắt suy nghĩ) đọc ra mảng căn. Mỗi giá trị kèm trích dẫn nguyên văn; giá chuẩn hoá về đồng;
  giá bị che chuyển thành khoảng.

Nhãn đúng do phiên này gắn tay. Số dưới đây **chỉ để định hướng**, chưa thay được tập nhãn mù của đội (PL7, F5).

| Đo | Kev-4B (choice) | Qwen 27B local (đọc có trích dẫn) | Regex hiện tại |
|---|---|---|---|
| Ý định đúng (offer · inquiry · not) | 46/61 = 75% (cận Wilson 0,63–0,85) | **58/61 = 95%** (0,87–0,98) | 21/61 — 40 bài bị bỏ đều có số |
| Nhận ra Yêu cầu (12 bài) | 3/12 | 10/12 | 0/12 |
| Bán/thuê đúng | 35/61 = 57% — bài viết đủ chữ 20/21, bài viết gọn 15/40 | **58/61 = 95%** | chỉ đúng trên bài có từ khoá |
| Bài nhiều căn tách thành nhiều mục | xác suất «nhiều căn» ≥ 0,9 ở 3/3 bài tổng hợp | tách đúng 3 căn, 10 căn, 2 căn; bài «1.165 căn» bị cắt ở 1.500 token | không tách |
| Giá chuẩn hoá | — | «4,000 thu về» → 4 tỷ; «8tr5», «4tr8», «3ty2», «7.000.000» đúng; giá che «2,3x tỷ» → khoảng 2,30–2,39 tỷ ở 4/5 bài, 1/5 chỉ ra một điểm | sai bậc hoặc mất phần lẻ (§3.2) |
| Mã toà/căn | — | ra được ở phần lớn bài (PR1, LD2xx13, BE4xx06, S10.03, «Hawaii H3»); sót BE2, BS8, GH1 ở 3 bài viết rất gọn | không đọc |
| Trường thuê | nội thất: nghiêng về «full» trên hầu hết bài | lấy được ngày vào ở, điều khoản cọc (gồm «1 năm đóng 3 cọc 1»), nội thất | không đọc |
| Trích dẫn có thật trong chữ | — | **304/305** — 1 trích dẫn giả bị bắt bằng phép so chuỗi | — |
| JSON hỏng | — | 2/61 (1 bài ngoặc thừa, 1 bài bị cắt vì quá dài) | — |
| Độ trễ | p50 0,8 s cho 5 câu (một câu ~0,1 s) | p50 6,2 s · p90 10,3 s · tối đa 41 s | ~0 |

Đọc bảng theo nguyên lý ở §8.1:
- **Kev hỏng ở đúng chỗ cần tri thức nghề.** «S7 2PN 7tr» là tin thuê vì 7 triệu chỉ có thể là tiền thuê tháng. Model 4B có
  đầu quyết định huấn luyện trên bộ câu hỏi chung không có tri thức đó, và cũng không phân biệt được «khách tìm…» với «sẵn
  căn…». Có hai cách sửa, đều đã nằm trong khung:
  - huấn luyện lại đầu quyết định trên nhãn BĐS VN — bản tổng quan model quyết định ghi train-head thêm khoảng 10 điểm;
  - nâng lên Kev-9B — chỉ đổi một cờ.

  Cả hai đều cần **tập nhãn** trước. Đến lúc đó Kev hợp vai **bộ lọc rẻ đầu đường**: «không phải tin», «nhiều căn», kèm xác
  suất hiệu chuẩn. Bán/thuê và Yêu cầu thì chưa giao cho Kev.
- **LLM local đọc tốt hơn hẳn khi bị ép trích dẫn.** Phép so trích dẫn với chữ là lưới an toàn rẻ. Nhưng cận dưới 0,87 vẫn
  **chưa đạt ngưỡng 0,95** của nhóm A (F3). Nghĩa là chưa được tự áp; muốn chứng minh cần ~150 nhãn, ≤ 2 lỗi.
- **Luật xác định vẫn cần.** Luật cho số không đổi giữa các lần chạy, gần như không tốn gì, và là lớp «parser» trong thang
  phân xử. Bài «Nhãn: giá trị» chuẩn thì luật đọc đủ mà không cần LLM.

### 8.3 Chọn LLM: GLM-5.3 flash, DeepSeek v4.1 flash hay local?

| Ứng viên | Chạy ở đâu | Điều đã biết | Ràng buộc |
|---|---|---|---|
| Qwen 27B (MTPLX :8000) | **local**, đang chạy | §8.2: 95% ý định/bán-thuê trên mẫu, 6 s/bài, 0 đồng | ~2.200 bài/ngày × 6 s ≈ 3,7 giờ máy/ngày nếu đọc mọi bài; chỉ đọc phần luật bỏ sót thì ít hơn nhiều |
| Kev-4B / Kev-9B (:8009) | **local** | §8.2: hợp lọc/định tuyến, yếu bán/thuê và Yêu cầu khi chưa huấn luyện lại | cần nhãn để huấn luyện lại đầu quyết định |
| GLM-5.3 (bản ZCode dùng) | **cloud** — ZCode gọi qua API của nhà cung cấp, gói coding plan; **không chạy ở máy** | chưa đo trên bài S03 | dữ liệu rời máy; dùng gói coding plan cho pipeline có thể nằm ngoài điều khoản gói — phải kiểm trước |
| DeepSeek v4.1 flash | **cloud** | chưa đo | dữ liệu rời máy và đi ra nhà cung cấp nước ngoài |

Những điều đã chốt, phải giữ:
- **M1 = local mặc định.** Model cloud chỉ dùng khi số đo cho thấy local không đủ (Mạnh 26/10, Hỏi-4 lát OCP1).
- **RV-M2** — gửi chữ bài/tiêu đề nhóm cho model cloud hay chỉ dùng local — còn chờ.
- Về SPL, chữ bài S03 không chứa tầng A (SĐT/tên người bán và tên nhóm là tầng C). Gửi cloud vẫn phải gạt tên nguồn và
  tên nhóm, và ghi mọi cuộc gọi vào `ai_calls` (PL29 đã ký).

**Khuyến nghị**:
- **Không chọn model bằng cảm nhận.** Hàng **PL30 `chon-model-theo-o` đã có**: «chạy nhiều model trên cùng tập nhãn, sinh
  bảng chọn model theo ô (rẻ nhất đạt ngưỡng và độ trễ)».
- Đưa cả bốn ứng viên vào PL30 khi có tập nhãn. Trên mẫu này, Qwen local đã đạt độ đúng cỡ cần. Lý do còn lại để xét cloud
  là **thông lượng và độ trễ** (p90 10 s), không phải chất lượng.
- Muốn đo GLM/DeepSeek trước PL30 thì phải xin Mạnh duyệt việc gửi mẫu bài ra ngoài (RV-M2) và kiểm điều khoản gói GLM.

Ước lượng tải để so giá khi đến PL30: ~2.200 bài/ngày × (~1.400 token vào + ~300 token ra) ≈ 3 triệu token vào và
0,7 triệu token ra mỗi ngày nếu đọc mọi bài. Bỏ bớt bài luật đã đủ thì tải giảm theo.

### 8.4 Kiến trúc phân loại + enrich đang ở giai đoạn nào (máy suy từ `_acceptance/`, 30/10)

| Khâu (§4) | Hàng | Trạng thái | Ghi chú |
|---|---|---|---|
| Nền dữ liệu | PL1, PL2 (bỏ dữ liệu thử) · PL14 (nạp lại không xoá) · PL15 (bảng phát biểu + phân xử 3 lớp) · PL6 (sổ từ vựng) · PL29 (sổ cuộc gọi AI) · PL32 | **đã ký** | `field_assertions` chạy thật, nhưng chỉ nhận 5 trường; S03 mới có `bedrooms` của parser |
| Kev thành nhãn | PL4 | **đã ký** | `meta.kev.p` nằm trong raw; stg chưa có cột |
| Kev → ý định tin | PL5 `meta-kev-thanh-phat-bieu` | chưa mở | câu giao chỉ dùng `meta.kev.p` (một câu gộp cung/cầu) → **cần sửa** (§8.5 S1) |
| Danh mục | PL10 (thu OCP1) **đã ký** · PL11 (trục/căn có bậc) chưa · S08 nạp local 0 dòng | dở | chưa có Grand Park (§5 B5) |
| Đọc | PL13 (mã căn, giá khoảng, price_basis) · PL17 (parser ghi phát biểu) · PL18 (E1/E2 theo lớp, E2 mù có trích dẫn) · PL28 (gộp tin chỉ ảnh) | **chưa mở cả bốn** | §8.2 cho thấy hướng PL18 đúng; thiếu tách nhiều căn, trường thuê, sửa số |
| Đo | PL7 (màn gắn nhãn mù) → PL8 (tập mẫu) → PL9 (Wilson) → PL30 (chọn model) → PL21 (tự áp theo số đo) | **chưa mở** | **nút cổ chai**: mọi ô tự áp và mọi lựa chọn model đều chờ chuỗi này |
| Ghép, bậc | PL16, PL20, PL24, PL25, PL27 | chưa mở | đứng sau Đọc + Đo |
| Enrich chạy lại | NT6 | chưa mở | `enrichment_proposals` 0 dòng từ sau F6 |
| Ngữ cảnh nhóm | PL12 (sổ nhóm) **đã ký** · ON20/ON21 chưa | dở | |

Tóm lại: **nền đã xong, ba khâu Đọc, Đo, Ghép chưa mở hàng nào.** Phần lớn việc ở §5 đã có chỗ trong các hàng này. Không cần
dựng kiến trúc mới, chỉ cần **sửa câu giao** những hàng đã có và **thêm đúng phần còn thiếu**.

### 8.5 Đề xuất sau khi lùi về nguyên lý gốc (thay §5 ở chỗ khác nhau)

**Không làm lại** (đã có hàng): PL5, PL7–PL9, PL11, PL13, PL17, PL18, PL20, PL28, PL30.

**Sửa câu giao (S) — để những hàng đó làm đúng loại việc:**

| Mã | Sửa | Vì sao (nguyên lý) |
|---|---|---|
| **S1 → PL5** | Ý định tin đến từ câu hỏi Kev **3 lớp** (tin rao · Yêu cầu · không phải tin) kèm xác suất, cộng câu bán/thuê, chứ không chỉ `meta.kev.p`. Sửa luôn câu gate «tin rao gồm cả tìm mua». Kev ở bậc suy luận; không phát biểu nào được tự áp trước PL9 | Phân loại → model quyết định. Câu hiện tại gộp cung với cầu, nên Yêu cầu không bao giờ tách ra được |
| **S2 → PL18** | E2 là **bộ đọc có trích dẫn, ra mảng căn** (tách nhiều căn ngay ở đầu ra). Bỏ «confidence» tự khai. Phân loại không hỏi LLM khi Kev/luật đã đủ; ai đọc ô nào do bảng PL30 quyết | Trích → LLM có kiểm. Bảng §8.2: 304/305 trích dẫn kiểm được, tách được bài nhiều căn |
| **S3 → PL13** | Thêm trường thuê (nội thất, điều khoản HĐ/cọc, ngày vào ở, phí) và loại căn có cờ «+»; mở rộng lát danh mục sang Grand Park (cùng PL10/PL11) | §3.2: 28% bài nói nội thất; 47% bài thuộc Grand Park |
| **S4 → PL30** | Ứng viên gồm Kev-4B/9B, Qwen local, GLM-5.3, DeepSeek flash. Hai ứng viên cloud chỉ chạy khi RV-M2 cho phép | §8.3 |

**Thêm mới (N) — phần không hàng nào có:**

| Mã | Việc | Làn · tầng |
|---|---|---|
| **N1** (= B1 thu hẹp) | **Cầm máu số liệu**: bỏ URL/SĐT trước khi đọc số; giá «X.YYY tỷ»/«XXXX tỷ thu về»; «2ty450», «5tr5»; DT «64m»; khoá gom có mã toà/căn. Không vá ý định bằng regex — việc đó chuyển sang PL5 (S1) | Claude · T2 · không migration |
| **N2** (= B3) | Khoá offer theo (post, thứ tự mục), để đầu ra nhiều căn của PL18 thành nhiều offer mà vẫn giữ khoá dính PL14 | Claude · T2, đi cùng PL18 |
| **N3** (= B4) | Phường theo thị trường của nhóm (sổ nhóm PL12) và theo `area_ids` của dự án sau khi nối | Claude · T2, gộp vào N1 được |

**Thứ tự** — chỉ một nguyên tắc: đo trước, tự áp sau.
1. **N1** ngay: nhỏ, không phụ thuộc, chặn số sai đang lên `/ops`.
2. **PL7 → PL8** ngay sau: đây là nút cổ chai thật. Mẫu 61 bài ở `research-local/` dùng làm bài tập dượt cho màn gắn nhãn,
   không dùng làm nhãn vàng.
3. **PL5 (S1) và PL18 (S2)** chạy ở bậc suy luận, ghi phát biểu nhưng không tự áp. Kèm N2.
4. **PL9 → PL30 (S4)**: chọn model theo ô, rồi PL21 mới được tự áp.
5. **PL10/PL11 (S3) → PL13 → PL20**: danh mục → đọc mã → ghép căn; enrich thật (dự án, CĐT, phường, loại hình) đi theo
   khâu này.

### 8.6 Câu hỏi cho Mạnh (gộp với §6; câu nào khác §6 thì câu ở đây thay)

| Hỏi | Nội dung | Khuyến nghị |
|---|---|---|
| **Hỏi-1′** | Duyệt **N1** (cầm máu số liệu, T2) thay cho B1 rộng — phần ý định chuyển sang PL5? | Duyệt |
| **Hỏi-2′** | Sửa câu giao **PL5, PL18, PL13, PL30** theo S1–S4? | Duyệt |
| **Hỏi-3′** | Mở **PL7 → PL8** (màn gắn nhãn + tập lát) ngay sau N1, và Mạnh cùng đội gắn ~200 bài S03 (F5 đã chốt việc gắn nhãn, chưa chốt lúc nào)? | Ngay sau N1 |
| **Hỏi-4′** | GLM-5.3 / DeepSeek flash: chỉ đưa vào PL30 khi có tập nhãn, hay cho đo sớm trên ~60 bài mẫu (gửi chữ bài ra ngoài — cần quyết RV-M2 và kiểm điều khoản gói GLM)? | Chờ PL30; Qwen local đã đạt độ đúng cỡ cần |
| Hỏi-2..5 của §6 | Lát danh mục Grand Park · trường thuê · Yêu cầu · CĐT ở cấp toà | giữ như §6 (Hỏi-3 và Hỏi-4 nay nằm trong S3 và S1) |

Căn cứ của §8.2: `research-local/s03-boc-tach-3010/thu-model.jsonl` (61 dòng: chữ bài đã bỏ URL, đáp án Kev, đầu ra Qwen,
độ trễ) và script trong scratchpad của phiên. Chỉ đọc DB, không ghi `ai_calls`, vì đây là lần dò ngoài đường chạy.

---

## 9. Bản cắt cuối (30/10): gộp lỗi ảnh (báo cáo 29/10) với bóc tách (§5, §8), đối chiếu lộ trình

> Mạnh duyệt §8.6 («Đồng ý») và yêu cầu: gộp các lỗi về ảnh; kiểm lộ trình hiện nay để tránh trùng; cắt gọn rồi đề xuất
> lại lần cuối.
> Lộ trình kiểm tại `origin/main` `83419002`: 133 hàng, 40 mục chờ, không đổi từ 29/10. Trạng thái suy từ `_acceptance/`.
> Mục này chỉ là **đề xuất**. Cắt thật (bản phạm vi + trang tri thức + hàng + răng phủ) chạy bằng
> `/acceptance-gate:cat-luot` sau khi Mạnh gật bảng này.

### 9.1 Ba điều đối chiếu làm đổi đề xuất cũ

1. **Mục chờ NH1** «media_files từ stg lên canonical theo RESO Media» (đợt `nen-tang-2310`) có điều kiện mở lại là «ZC4 giao
   xong và media_files S03 có dòng thật». Cả hai **đã đạt**: ZC4 đã ký, và `stg_zalo_posts.media_files` có hàng nghìn dòng.
   → A3 (loader riêng đọc ảnh S06 từ stg) **gộp vào NH1**. Một bảng media canonical cho cả S03 lẫn S06; `/ops/review`,
   `/ops/data-flow` và TV9 cùng đọc bảng đó. Không dựng loader thứ ba.
2. **Mục chờ PH3** «Chỉnh lại Kev trên tập nhãn G0» chính là việc huấn luyện lại đầu quyết định Kev ở §8.2. Giữ nguyên, mở
   lại khi PL7/PL8 có nhãn. Không cắt hàng mới cho Kev.
3. **A1** (tải ảnh S03 lỗi, làn ZCode) mới ở bước `GIAO claudedp-2910-10`, chưa có NHẬN. Lỗi vẫn còn: 29/10 là 27,8% entry.
   Lộ trình chưa có hàng nào cho việc này.

### 9.2 Bảng cắt — mỗi mã của §4 (29/10), §5 và §8 nằm ở đúng một chỗ

**Hàng mới (4)**

| Hàng đề xuất | Gánh mã | Câu giao (nháp) | Hạng · cỡ | Đứng trên | Vùng |
|---|---|---|---|---|---|
| **N1** `s03-cam-mau-so-lieu` | N1, N3, A4, B4 + khoá gom có mã toà | Transform S03 đọc số không lẫn URL/SĐT, chuẩn hoá giá VN («X.YYY tỷ», «2ty450», «5tr5», «4,000 thu về», số đồng không đơn vị), đọc DT «64m», gom repost theo mã toà/căn, ghi `seller_name` từ `sender_name`, nạp phường theo thị trường của nhóm. **Bật khi**: nạp lại S03 thì 0 offer thuê ≥ 1 tỷ, 0 offer bán > 100 tỷ, 0 giá đọc từ URL, không offer nào gom > 10 nội dung khác nhau, `seller_name` ≥ 95% | T2 · ~10 | — | `pipeline/transform-zalo.mjs`, `pipeline/lib/` |
| **NH1** `media-canonical-reso` (cắt từ mục chờ NH1) | NH1, A3 | Ảnh của tin S03 (`media_files`) và S06 (`images`) nằm ở một bảng media canonical theo RESO Media, nối với offer; `/ops/review` và `/ops/data-flow` ở máy thu đọc bảng này. **Bật khi**: offer S06 có ảnh trong stg thì thẻ hiện ≥ 1 ảnh; offer S03 có file local thì hiện ảnh; nạp lại hai lần không nhân dòng; sync cloud không đẩy URL ảnh (leak gate xanh) | T3 (migration) · ~10 | — (ZC4 đã ký) | `db/migrations/`, `pipeline/`, `app/src/lib/ops/` |
| **C2b** `scorecard-media-field-yield` | A6, B8 | Mỗi đêm scorecard ghi media-yield theo bậc (bài có ảnh → file → media canonical → offer có ảnh) và field-yield theo tầng (bài → mục → trường đọc → nối → suy ra) cho từng nguồn, cửa sổ 7/30 ngày | T2 · ~9 | C2 | `pipeline/` |
| **ZC-ảnh** (số do liên làn cấp) `s03-anh-tai-loi` | A1 | Collector S03 tải ảnh của tin chỉ-ảnh không còn lỗi http-500 hàng loạt, có thử lại hoặc backfill khi URL còn hạn. **Bật khi**: một ngày chạy thật, entry lỗi < 5% | T2 · làn **ZCode** | — | `collector/` |

**Sửa câu giao hàng đã có (7) — không cắt trùng**

| Hàng | Sửa | Gánh mã |
|---|---|---|
| **PL5** `meta-kev-thanh-phat-bieu` | Ý định tin lấy từ câu Kev **3 lớp** (tin rao · Yêu cầu · không phải tin) cộng câu bán/thuê, ở bậc suy luận, không chỉ `meta.kev.p`; sửa câu gate đang gộp «tìm mua» vào tin rao; bài Yêu cầu không bị bỏ | S1, B2 |
| **PL18** `e1-e2-theo-lop` | E2 là bộ đọc có trích dẫn, **ra mảng căn**; mỗi căn một offer với khoá (post, thứ tự mục) giữ khoá dính PL14; bỏ «confidence» tự khai; phân loại không hỏi LLM khi Kev/luật đủ. Cỡ lên ~12 — ghi lý do: tách nhiều căn không tách khỏi đầu ra của bộ đọc mà vẫn giữ nghĩa | S2, N2, B3, B7 |
| **PL13** `doc-ma-can-gia-khoang` | Thêm trường thuê (nội thất, điều khoản HĐ/cọc, ngày vào ở, phí đã gồm) và loại căn có cờ «+»; lát gồm cả Grand Park | S3, B6 |
| **PL11** `danh-muc-truc-can` | Danh mục có bậc cho **OCP1 và Grand Park**; dọn bí danh dự án trùng mã toà (`s7`/`s10`); đối chiếu `area_ids` OCP1–3 với nguồn xác minh; CĐT ghi ở cấp toà (`Building.BuilderName`) | B5b–c, Hỏi-5 |
| **PL28** `gop-tin-chi-anh-o-transform` | «liền trước» → **hai phía** trong 2 phút; bỏ `dung_tren` PL17 (gộp ảnh không cần phát biểu parser); bật khi offer S03 có ảnh từ ~31% lên ≥ 50% | A2 |
| **PL30** `chon-model-theo-o` | Ứng viên: Kev-4B/9B, Qwen 27B local, GLM-5.3, DeepSeek flash. Hai ứng viên cloud chỉ chạy khi RV-M2 cho gửi chữ bài ra ngoài | S4 |
| **TV9** `bai-goc-anh-len-cloud` | Ảnh thu nhỏ lấy từ bảng media canonical (thêm `dung_tren` NH1), phủ cả S06; S03 cần ZC-ảnh xong mới đủ ảnh | A5 |

**Hàng mới cho danh mục Grand Park — làn ZCode (1)**: **PL10b** `thu-danh-muc-grand-park` (gánh B5a). Cùng dáng với PL10 đã ký.
PL10 đã ký nên không sửa nó; PL11 (đã sửa) đứng trên cả PL10 lẫn PL10b.

**Giữ ở mục chờ (không cắt)**

| Mục | Vì sao |
|---|---|
| PH3 Kev chỉnh lại | Mở khi PL7/PL8 có nhãn (§9.1) |
| SH7 Kev-V media gate / đọc ảnh bằng model | Thông tin nằm trong ảnh (bảng giá ảnh) — luật 11 «đo trước khi build»; mở khi NH1 giao |
| **A7 mới** `properties-photos` | `resolve-properties` chép ảnh vào `properties.photos` và gắn offer S03 vào căn. Mở lại khi NH1 và PL24 giao |
| SH4 E5 học alias | Như cũ |

**Ra khỏi kho (việc người, không thành hàng)**:
- Mạnh và đội gắn ~200 bài S03 trên màn PL7 khi PL7 giao.
- Chạy nạp S08 vào DB local: vòng `import-s08` đã ký nhưng `stg_s08_inventory` local 0 dòng. Đây là bước triển khai, liên
  làn giao.
- Kiểm điều khoản gói GLM coding plan trước khi đưa GLM vào PL30.

### 9.3 Thứ tự chạy

```
ngay, song song theo vùng:  N1 ──► PL28′ (cùng transform-zalo, nối sau N1)
                            NH1 (T3) ──► TV9′ ──► TV10
                            PL7 ──► PL8 ──► PL9 ──► PL30′ ──► PL21     (PH3 mở khi có nhãn)
                            ZC-ảnh (ZCode)
sau đó:                     PL17 ──► PL5′ (T3) · PL18′ ──► NT6
                            C2 ──► C2b
                            PL10b (ZCode) ──► PL11′ (T3) ──► PL13′ ──► PL20
```

Ba việc mở được ngay mà không chờ gì: **N1**, **NH1**, **PL7**. Chúng không chung vùng mã, nên chạy song song được.

### 9.4 Cập nhật sau PR #186 (đợt `danh-ba-2910`, ADR-0016) — áp vào bảng §9.2 khi cắt

PR #186 vừa đổi lộ trình:
- PL11 và PL24 chuyển sang mục chờ, «không mở riêng»; phần của chúng giao cùng **DB1** (toà · trục · căn OCP1) và **DB2**
  (nhà phố/đất, `properties` thành view).
- DB1 là mục chờ, mở khi ZC8 giao và `stg_s08_inventory` ở máy thu có dòng OCP1.
- PL13 bỏ phụ thuộc PL11. Thêm DB2b `ho-nguoi-theo-nguon` (T3).

Bảng §9.2 đổi như sau:

| Chỗ trong §9.2 | Sau #186 |
|---|---|
| Sửa câu giao **PL11** (OCP1 + Grand Park, dọn bí danh trùng mã toà, đối chiếu `area_ids`, CĐT ở cấp toà) | Áp vào **mục chờ DB1** — ghi vào `cau_giao` của DB1 để lúc DB1 thành hàng có sẵn. Riêng phần Grand Park: thêm **mục chờ mới** «danh bạ toà Grand Park», mở khi PL10b giao, để DB1 không phình |
| PL11 đứng trên PL10 và PL10b | DB1 đứng trên ZC8/S08; Grand Park đứng trên PL10b |
| Mục chờ mới **A7** mở khi «NH1 và PL24 giao» | Mở khi **NH1 và DB2 giao** |
| **PL13′** chờ PL11 | PL13 nay chỉ đứng trên PL6 (đã ký) → **mở được ngay**, cùng N1, NH1, PL7. Phần nối mã toà vào danh bạ vẫn đứng sau DB1 (PL20) |
| A4 `seller_name` trong N1 | Giữ trong N1: chỉ là một cột chép từ `sender_name`. DB2b gắn người đăng vào danh bạ Người là việc khác, không trùng |
| «Ra khỏi kho: nạp S08 vào local» | Đây chính là điều kiện mở DB1 (ZC8 + dòng OCP1 ở máy thu) — giữ, liên làn giao |

Khi cắt lượt: cắt nhánh từ `origin/main` sau #186; sinh lại `LO-TRINH.html`/`PRODUCT-MAP.md` bằng
`scripts/product-map.mjs` của kho, không sửa tay.
