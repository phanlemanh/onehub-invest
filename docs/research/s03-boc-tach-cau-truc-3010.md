# S03 — bóc tin chữ thành dữ liệu có cấu trúc: framing, phân tích, đề xuất (30/10)

> Ngày 2026-10-30 · Trạng thái: **chờ Mạnh duyệt §6** · Làn: Claude (transform → canonical), một phần ZCode (danh mục, §5 B5).
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
