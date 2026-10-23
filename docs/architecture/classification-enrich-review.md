# Review kiến trúc phân loại + enrich — từ lúc tin vào tới lúc thành căn nhà

> Ngày 2026-10-23 · Trạng thái: **chờ Mạnh duyệt** — cái gì đã chốt, cái gì còn chờ: **§7.0**. Đối chiếu audit 23/10: §7.1
> Khung RESO cụ thể (field, resource, extension, quyết định R1–R5): `docs/architecture/reso-khung-phan-loai.md`. · Phạm vi: Kev-4B gate →
> parser `transform-*` → E1/E2/định tuyến → `/ops/review` → `resolve-properties`.
> Cách làm: chỉ đọc code (HEAD `b446637`, đã gồm PR #14, #16, #21), DB local :5433 (SELECT) và log.
> Không sửa code, không ghi DB. Bản xem trên điện thoại (riêng tư): https://claude.ai/artifact/RSzE1VKhUjbw7jVMyorGHd
>
> **Khung**: `docs/product/FRAMING.md` (Mạnh duyệt 23/10) — §0.1 đối chiếu review với khung đó.
> **Rà soát nguyên lý gốc §0.2 (23/10) sửa một phần §3–§5**: thang căn cứ còn 3 lớp, ghép căn là một phát biểu,
> thêm thời gian (L18), kế hoạch đổi sang lát dọc, quyết định còn 7 câu (§0.2 F); sự thật 8 «dữ liệu là nỗ lực liên tục, có cấp bậc» (Mạnh). Khi lệch, §0.2 thắng.
> **§0.3 (23/10)**: 1.020/1.102 tin S03 là dữ liệu giả `zalo-mock` (L19) — số S03 ở §0–§2 đọc kèm bảng đính chính;
> trả lời F1–F6: lát đầu Vinhomes Ocean Park 1, ngưỡng theo cận dưới Wilson, độ tươi p50 ≤ 10′, thứ tự dọn tồn đọng.
> **§0.4 (23/10)**: lớp model — chọn model theo số đo qua AI Gateway, sổ chi phí, trợ lý nhà đầu tư tách sổ; M1–M4.
> Đọc nhanh: §0 tóm tắt → §0.1 → **§0.2** → **§0.3** → **§0.4** → §4 quyết định → §5 việc. §1–§3 là căn cứ.

---

## 0. Tóm tắt một trang

**Câu trả lời ngắn**: các lỗi ngày 23/10 không phải năm lỗi rời. Chúng cùng ba gốc:

1. **Không có chỗ nào lưu «ai đã nói gì về tin này, dựa vào đâu».** Mỗi tầng (Kev, parser, E1, LLM,
   người) ghi thẳng một giá trị vào cột canonical hoặc vứt tin đi, rồi tầng sau đè hoặc nhường theo
   thứ tự chạy («fill-gap»: ai ghi trước thắng). Vì vậy không có thứ bậc căn cứ, xung đột chỉ thấy được
   ở đúng một cặp (E1↔LLM) mà PR #14 vá, và thẻ duyệt không có gì để hiện ngoài «AI tự tin %».
2. **Định danh gắn vào nội dung có thể đổi.** `offer_id` của P1 là băm `kind|phường|giá|DT|PN`;
   `properties.stable_key` chứa giá và loại. Sửa giá, sửa parser → id mới → mọi thứ treo vào id cũ
   (đề xuất, quyết định ghép căn, thẻ duyệt) bị CASCADE xoá hoặc mồ côi. 039 cứu được đề xuất enrich;
   quyết định ghép căn của người **đã thực sự mất** (§2 L03).
3. **Không có tập nhãn ở tầng nào.** Mọi con số đang dùng là độ phủ hoặc đo trên dữ liệu giả
   (Kev «recall 100%» trên mock, parser «F1 0,966» trên mock tự sinh, E1 «73%» là độ phủ, judge
   đếm `yes` là pass). Nên không ai biết luật nào đúng bao nhiêu — và luật vẫn được tự áp.

**Năm con số nên biết** (DB local + log, 23/10):

| Số | Nghĩa |
|---|---|
| **~70%** tin Zalo bị Kev-4B bỏ **trước khi có raw snapshot** (skip 1.270 / post 549, log hook tới 23/10) | Trong mẫu soát được, gần như mọi tin bị bỏ là tin rao thật (p 0,5–0,69). Không phục hồi được. **Đã quyết 23/10: Kev thành nhãn, không lọc** (Q1). |
| **1.102/1.102** tin S03 (⚠ 1.020 là tin giả `zalo-mock` — §0.3; 82 tin thật cũng 100%) và **114/118** tin S05 có `property_type = unknown` | Parser P1 không phân loại; đề xuất enrich S03 mất sạch 23/10. |
| **0** tin P1 (S03/S05) nào nằm trong `properties` | «Một Căn Nhà» thực chất chỉ gồm S06 (trái hiến pháp §1.7). |
| **«Căn giá tốt» so giá/m² với trung vị cả phường, không tách loại hình** | `refresh-bait-gap.mjs` dùng `v_ruler_p2_area` — CONTEXT.md định nghĩa «phường × loại hình». Đây là hệ quả sản phẩm trực tiếp của việc P1 không có loại. |
| **12** chỗ tự khai từ vựng loại BĐS; **0** tập nhãn tin thật | Không có một taxonomy; không đo được độ chính xác. |

**Kiến trúc đích, một câu**: mọi tầng chỉ **phát biểu** (assertion: giá trị + bậc căn cứ + luật/model +
đoạn trích), lưu append-only theo **khoá bất biến của tin gốc**; một **bộ phân xử xác định** đọc các
phát biểu theo thứ bậc căn cứ để dựng cột canonical (kèm nguồn gốc) sau mỗi lượt nạp; chỉ những ô
(luật × field × nguồn) **đã đo trên tập nhãn** đạt ngưỡng mới được tự áp, còn lại lên thẻ duyệt hiện
đủ căn cứ; quyết định của người là phát biểu bậc cao nhất và sống qua mọi lượt nạp.

**Khuyến nghị thứ tự**: **đo trước, xây sau** — giữ trọn raw (Kev không bỏ tin — Mạnh đã chốt 23/10) + một taxonomy + tập
nhãn + số đo nền, rồi mới làm lớp phát biểu/phân xử và thẻ duyệt v2 (§5).

---

## 0.1 Đối chiếu với FRAMING (23/10)

FRAMING đặt mục đích trước cách làm: một **mạng lưới listing đủ tin cậy**, gom tin của môi giới (gom vào,
OneHub Invest hiển thị), **căn gốc** (số nhà / mã căn) là bản ghi duy nhất, trường dữ liệu là phần làm giàu.
Phân loại và enrich chỉ có mặt để mỗi tin **ghép đúng căn** và **so đúng nhóm**. Những gì đổi trong review:

| FRAMING | Review đổi gì |
|---|---|
| **D1** dùng/mua danh mục dự án · toà · mã căn | Căn gốc của căn hộ = một dòng danh mục. Phân loại có thêm việc lõi: **trích mã căn / toà / dự án** từ tin và ghép vào dòng đó (RESO `UnitNumber`, `ComplexName`, `SubdivisionName`). Stage A «ô lưới + giá» chỉ còn cho nhà phố. Việc mới Z1.2, C1.5, C1.6, C2.7 |
| **D3** căn hộ trước; môi giới giữ mã căn | Mã căn thành trường lõi trong tập nhãn G1; nhà phố sống với «suy ra» |
| **D4** P1 công khai, trao đổi tức thời | P1 là danh sách chính. Độ tươi tính bằng phút → việc mới C2.6 (đường theo từng tin, thay lô 00:00). Q5 thêm vế: giá trị dưới ngưỡng **vẫn hiện**, gắn «suy ra / chưa xác minh», không chờ thẻ. «Căn giá tốt» lên công khai nên Q10 càng gấp |
| **D5** thuê người được, nhưng model phải gánh tối đa | Q6: người gắn nhãn có thể là người thuê theo hướng dẫn gắn nhãn. Mỗi nhãn, mỗi quyết định duyệt là dữ liệu đo/dạy model; thước đo «tỉ lệ máy tự quyết đạt ngưỡng» phải tăng theo tuần |
| Khoá của sự thật là **căn**, khoá của bằng chứng là **id gốc tin** | Q2 tinh lại: phát biểu **thuộc căn** (loại, DT, tầng, phòng, mã căn) treo vào căn khi đã ghép; phát biểu **thuộc tin** (giá, kind, người đăng, hiệu lực) treo vào id gốc tin |
| «Tin cậy» sáu chiều, có «nói rõ độ chắc» | Provenance (§3.4) là thứ hiển thị ra cổng Invest: «đã xác minh · suy ra · chưa biết» |

Phần lõi của review không đổi: raw giữ trọn, phát biểu kèm căn cứ, khoá bất biến, đo trước khi xây.

## 0.2 Rà soát theo nguyên lý gốc (first principles, 23/10)

> Cách làm: bỏ hết tên thành phần đang có (Kev, parser, E1, E2, judge, Stage A/B, thẻ duyệt), hỏi «điều gì
> **luôn đúng** về bài toán dù xây bằng gì», dựng lại từ đó, rồi soi review §1–§5 xem phần nào bắt nguồn từ
> sự thật nền và phần nào chỉ bắt nguồn từ hiện trạng. Mục này **sửa** một số chỗ của §3–§5 (ghi rõ ở D).

### A. Tám sự thật nền (bảy dựng từ bài toán, một do Mạnh bổ sung)

1. **Tin đăng là lời khai, không phải sự thật.** Một người, ở một thời điểm, qua một kênh, nói điều gì đó về
   một căn và một lời chào bán/thuê. Lời khai có thể sai, cũ, trùng, hoặc cố ý giấu (số nhà).
2. **Căn nhà tồn tại độc lập với tin.** Thuộc tính vật lý của căn (loại, diện tích, tầng, mã căn) gần như
   không đổi; thuộc tính của lời chào (giá, bán/thuê, còn hay hết) thay đổi theo thời gian và theo người đăng.
3. **Ta không bao giờ biết sự thật trực tiếp — chỉ có niềm tin dựa trên bằng chứng.** Mỗi giá trị hệ thống
   giữ là một niềm tin; niềm tin chỉ đáng tin bằng đúng độ tin của bằng chứng sau nó.
4. **Độ tin của một cách đọc bằng chứng chỉ biết được bằng cách đo nó với sự thật đã biết.** Không có đường
   tắt: độ tự tin tự khai của model, thứ tự luật, cảm giác «hợp lý» đều không phải số đo.
5. **Sự thật đã biết chỉ đến từ bốn chỗ**: danh mục có thẩm quyền (chủ đầu tư, địa chính — D1), trường có
   cấu trúc của nguồn, người có quyền xác nhận (môi giới/chủ căn, người vận hành), và người đọc bằng chứng
   rồi phán (nhãn). Mọi thứ khác là suy luận.
6. **Thông tin mục theo thời gian.** Lời chào hết hạn, giá đổi, căn được bán. Niềm tin về lời chào luôn kèm
   thời điểm, và độ tươi là một phần của độ tin (D4).
7. **Quyết định đầu tư cần so sánh được**: cùng nhóm (vị trí × loại × bán/thuê × cách tính diện tích) và
   không đếm một căn hai lần. Sai nhóm hoặc đếm trùng thì con số đúng từng ô vẫn đánh lừa.

8. **Dữ liệu tin cậy là nỗ lực liên tục, có cấp bậc** (Mạnh bổ sung 23/10). Không trắng đen: mỗi căn, mỗi trường
   đứng ở một bậc, đi lên nhờ nỗ lực (đọc, gắn căn, đo, xác minh, giữ tươi) và **tụt khi ngừng** (thời gian, danh
   mục cũ, model trôi). Đích đến nói bằng bậc. Thang bậc: FRAMING §3.4 (căn B0–B5, phân khúc N0–N4).

### B. Tám thành phần cơ bản (suy ra từ A1–A7; A8 cho thang bậc đo trên chúng)

| # | Thành phần | Là gì | Bất biến phải giữ | Từ sự thật |
|---|---|---|---|---|
| **T1** | **Bằng chứng** | Lời khai nguyên văn + ai/khi nào/kênh nào + ảnh | Đầy đủ (không lọc trước khi ghi), bất biến, có khoá gốc | 1 |
| **T2** | **Từ vựng** | Tập giá trị chung cho mọi trường (RESO-first) | Một nguồn duy nhất; mọi bộ đọc dùng chung | 7 |
| **T3** | **Diễn giải** | Bất kỳ bộ đọc nào biến bằng chứng thành *phát biểu* `(chủ thể, trường, giá trị, đoạn trích, phương pháp@phiên bản, thời điểm)` | Không ghi đè; luôn chỉ ra được đoạn bằng chứng | 1, 3 |
| **T4** | **Định danh** | Hai câu hỏi khác nhau: *tin nào* (khoá gốc nguồn) và *căn nào* (căn gốc trong danh mục / căn suy ra) | Khoá không suy từ nội dung đổi được; «tin X nói về căn Y» là **một phát biểu** như mọi phát biểu khác | 2, 7 |
| **T5** | **Thời gian** | Mỗi phát biểu có thời điểm quan sát; lời chào có trạng thái hiệu lực | Niềm tin về lời chào luôn trả lời được «tính đến lúc nào» | 6 |
| **T6** | **Đo** | Nhãn sự thật + độ tin đo được của từng (phương pháp × trường × nguồn) | Là **gốc duy nhất** của mọi con số «độ tin»; tập test đóng băng | 4, 5 |
| **T7** | **Phân xử** | Hàm xác định gom các phát biểu → một niềm tin + độ chắc + nguồn gốc | Thuần, chạy lại ra cùng kết quả; độ chắc = suy từ T6, không từ model | 3, 4 |
| **T8** | **Người** | Người có quyền phán thêm phát biểu bậc cao nhất; phán của người cũng là nhãn cho T6 | Không mất qua nạp lại; mỗi lần phán đủ bằng chứng để phán đúng | 5 |

Đầu ra (không phải thành phần, là phép chiếu): **niềm tin + độ chắc + thời điểm + bậc** (sự thật 8) hiển thị cho
môi giới và nhà đầu tư. Bậc của căn là hàm của các thành phần: B1 cần T2+T3, B2 cần T4, B3 cần T6, B4 cần nguồn
sự thật (T8 hoặc danh mục), B5 cần T5. Ba nhãn độ chắc của FRAMING suy thẳng ra: *đã xác minh* = phát biểu thắng đến từ một trong bốn
nguồn sự thật (A5); *suy ra* = máy, từ ô đã đo đạt ngưỡng; *chưa biết* = còn lại.

```
             T2 Từ vựng ─────────────── dùng chung ───────────────┐
                                                                  ▼
T1 Bằng chứng ──► T3 Diễn giải ──► phát biểu ──► T7 Phân xử ──► niềm tin + độ chắc + thời điểm ──► hiển thị
   (khoá tin)        (mọi bộ đọc)     ▲   ▲            ▲                 │
                                      │   │            │                 ▼
                     T4 Định danh ────┘   │      T6 Đo (nhãn) ◄──── T8 Người (phán = phát biểu + nhãn)
                     «tin X ↔ căn Y»      │
                     T5 Thời gian ────────┘  (mọi phát biểu có thời điểm; lời chào có hiệu lực)
```

### C. Kiểm chứng: mỗi lỗi rơi vào một thành phần bị thiếu (L11 chạm hai)

| Thành phần | Lỗi trong sổ (§2) | Nhận xét |
|---|---|---|
| T1 Bằng chứng | L06 (Kev bỏ tin), L13 (Chợ Tốt không đưa trường stg sang), DELETE listing Airbnb, L19 (tin giả), L20 (tin ảnh trùng khoá) | L06 đã quyết sửa (Kev thành nhãn) |
| T2 Từ vựng | L07, L08, L09 | |
| T3 Diễn giải | L12 (không nguồn gốc), L15 (audit thủng), L16, L17 | Parser, E1, E2, Kev, judge là **cùng một loại thứ** — review cũ vẫn tách theo tên |
| T4 Định danh | L03 (băm nội dung), L11 (P1 không thành căn) | Ghép căn (Stage A/B, judge, «Cùng căn») là diễn giải + phân xử trên trường «căn» |
| T5 Thời gian | **— không lỗi nào được ghi —** | Không phải vì ổn, mà vì **không có cơ chế nào để hỏng**: không cột hiệu lực; 940/1.102 tin S03 đã quá 3 ngày không thấy lại vẫn là tin rao. → lỗi mới **L18** |
| T6 Đo | L05 (không nhãn), L14 (judge-eval đếm yes) | |
| T7 Phân xử | L01 (ngữ cảnh thắng quan sát), L02 (chỉ cặp E1↔LLM, chứng thực vòng tròn), L10 (so sai nhóm) | |
| T8 Người | L04 (thẻ thiếu căn cứ), L11 («Cùng căn» không hiệu lực), 639/644 chưa hoàn tác | |

Bộ tám thành phần phủ đủ 17 lỗi và chỉ ra một lỗ mà sổ lỗi bỏ sót (T5).

**L18 · Không có mô hình thời gian / hiệu lực** — Nặng · vi phạm FRAMING «tin cậy» chiều 4 (còn hiệu lực), D4
- `sale_offers` không có cột trạng thái; chỉ `first_seen/last_seen`. 940/1.102 tin S03 và 3.073/11.395 tin S06
  có `last_seen` quá 3 ngày, không phân biệt «hết hạn», «đã bán», hay «chỉ là nguồn chưa quét lại».
- Không giữ lịch sử giá theo căn (`price_vnd` ghi đè; tin sửa giá thành offer mới) → không làm được «giá cùng
  một căn qua thời gian» mà FRAMING câu 1 cần.
- Tin «đã bán / đã cọc» trong nhóm là bằng chứng hiệu lực nhưng không bộ đọc nào bắt.

### D. Review cũ sửa gì

| # | Review cũ | Từ nguyên lý gốc | Sửa |
|---|---|---|---|
| D-1 | §3.3 thang **H0–H5 cố định** (luật > LLM > ảnh > ngữ cảnh) | A4: thứ tự chỉ biết sau khi đo. Thang cố định là một giả định, chính kiểu giả định đã sinh d-9 «E1 thắng LLM» | Còn **3 lớp**: *sự thật* (4 nguồn A5) › *quan sát có trích dẫn* (luật hoặc LLM chỉ ra đoạn trong tin/ảnh) › *suy luận* (ngữ cảnh, không trích dẫn). **Trong lớp, thứ tự do T6 quyết**; thang H cũ chỉ là thứ tự tạm khi ô chưa đo, và ô chưa đo không được tự áp |
| D-2 | Kev, parser, E1, E2, judge là **5 thành phần**, mỗi cái một việc sửa | T3: chúng là một loại — bộ diễn giải | Một hợp đồng phát biểu chung; thêm/bỏ một bộ đọc không đổi kiến trúc. Việc sửa từng bộ đọc chỉ là việc nâng số đo của ô đó |
| D-3 | Ghép căn (C2.7, C3.2) là **luồng riêng** bên cạnh phân loại | T4: «tin X nói về căn Y» là một phát biểu trên trường `căn` | Khớp mã căn với danh mục = quan sát có trích dẫn; khớp toạ độ/giá/diện tích = suy luận; «Cùng căn» của người = sự thật. Cùng bảng phát biểu, cùng bộ phân xử, cùng thẻ duyệt, cùng tập đo (G3) |
| D-4 | Không có thời gian | T5 | Thêm `observed_at` cho mọi phát biểu; trường `offer_status` (đang chào / hết hạn / đã bán) là một trường được diễn giải + phân xử như mọi trường; lịch sử giá giữ theo căn. Việc mới **C2.8** |
| D-5 | Độ chắc hiển thị (C3.5) là một việc UI | Đầu ra = niềm tin + độ chắc, độ chắc suy từ T6 | Độ chắc là **đầu ra của bộ phân xử**, không phải lớp trang trí; C3.5 chỉ còn là hiển thị cột đã có |
| D-6 | §5 chia **đợt ngang** (đo mọi nguồn → nền bền mọi nguồn → người) | North star chỉ đo được khi cả 8 thành phần chạy cho một nhóm; làm ngang thì 4–6 tuần không có số north star nào | **Lát dọc đầu tiên** (E) chạy đủ T1–T8 cho một nhóm hẹp, rồi mới mở rộng ngang |
| D-7 | 12 câu hỏi Q1–Q12 | Nhiều câu tự trả lời được từ nguyên lý | Xem F: còn 6 câu thật sự cần Mạnh |

Phần review cũ **giữ nguyên**: raw đầy đủ (Q1 đã chốt), phát biểu append-only + bộ phân xử (§3.4 = T3+T7),
khoá bất biến (= T4), tập nhãn trước khi tự áp (= T6), thẻ duyệt đủ căn cứ (= T8), một taxonomy (= T2).

### E. Lát dọc đầu tiên

**Định nghĩa**: căn hộ, bán và cho thuê, ở **2–3 dự án có danh mục mã căn** (D1, D3), từ các nhóm Zalo/FB
chuyên về chính các dự án đó, chạy đủ T1–T8, hiển thị trên OneHub Invest với độ chắc.

**Vì sao phải chọn nhóm có chủ đích** (số đo 23/10 trên DB local): trong 1.102 tin S03 hiện có, chỉ 293 tin có
chữ chỉ căn hộ, **10 tin** nhắc tên một trong 20 dự án đang có ở `asset_nodes`, 34 tin có chuỗi giống mã căn.
Nghĩa là các nhóm đang thu chủ yếu không phải nhóm dự án — lát dọc cần nguồn tin đúng chỗ có danh mục, không
thể chờ tin hiện có tự rơi vào.

**Xong khi** (thước đo của lát):
1. North star của lát có số: **phân bố căn theo bậc B0–B5**, và tỉ lệ căn của lát đạt bậc đích B5 (căn hộ có danh mục).
   Phân khúc của lát đạt **bậc năng lực N2** (đo được) trước khi đòi N3.
2. Độ đúng của ghép tin → căn (theo mã căn) và của trường lõi (loại, bán/thuê, giá, diện tích, mã căn) đo trên
   tập test của lát.
3. Độ tươi p50/p95 từ lúc đăng tới lúc hiển thị (D4).
4. Bất biến xanh: nạp lại không mất quyết định người; không giá trị nào thiếu nguồn gốc.
5. Tỉ lệ máy tự quyết ở ngưỡng (D5) có điểm xuất phát.
6. **Nhịp nỗ lực** của lát được viết ra và chạy (sự thật 8): gắn nhãn định kỳ, đo lại, làm mới danh mục, quét hiệu
   lực — kèm số công/tuần để giữ bậc.

**Việc của lát** (ánh xạ mã việc §5; thứ tự):
1. Chọn dự án + nhóm (Mạnh) · thu danh mục mã căn của các dự án đó (**Z1.2**) · nhóm mới vào hook (ZCode).
2. Từ vựng tối thiểu cho lát (**C1.2** thu hẹp: `listing_intent`, `kind`, `property_type`, `offer_status`, mã căn).
3. Bảng phát biểu + bộ phân xử + khoá tin + trường `căn` + `observed_at` (**C2.1** + **C2.8**, chỉ cho lát).
4. Bộ đọc: parser + luật mã căn + LLM có trích dẫn; Kev thành phát biểu `listing_intent` (**C1.1**, **C1.6**, **C2.2**, **C2.4**).
5. Nhãn cho lát (**C1.3** + **M1** chỉ trên tin của lát, ~200 tin + ~100 cặp) → số nền (**C1.4**).
6. Tự áp theo số đo + độ chắc (**C2.5**) · thẻ duyệt cho ca dưới ngưỡng (**C3.1** rút gọn) · đường theo từng tin (**C2.6**).
7. Hiển thị trên Invest với độ chắc (**C3.5**).

Sau lát: mở rộng ngang theo thứ tự đo được — thêm dự án có danh mục → nhà phố (chỉ «suy ra») → Chợ Tốt
qua cùng hợp đồng phát biểu → thước phường × loại cho «Căn giá tốt» (C3.3). Đợt 0 (§5) vẫn làm ngay, song song.

### F. Quyết định còn lại sau khi rút gọn

**Đề xuất trả lời từ nguyên lý — chờ Mạnh xác nhận** (chưa phải quyết định): Q2 (= T4: khoá tin + phát biểu `căn`), Q3 (= T3+T7), Q4 (tên
nhóm = suy luận, không tự quyết — D-1), Q5 (= T6: tự áp chỉ ô đã đo), Q9 (độ chắc suy từ đo; confidence tự khai
không hiện), Q11 (= lát dọc, đo trong lát). Q1 đã chốt.

**Còn cần Mạnh** (xếp theo mức chặn lát dọc) — *Mạnh trả lời 23/10, phân tích và đề xuất ở §0.3*:

| # | Câu | Vì sao chỉ Mạnh trả lời được |
|---|---|---|
| F1 | **Lát đầu: dự án nào, nhóm nào?** (2–3 dự án có danh mục mã căn + nhóm chuyên dự án đó) | Chọn thị trường và quan hệ nhóm là quyết định kinh doanh |
| F2 | **Nguồn danh mục** cho các dự án đó: mua, thu, hay lấy từ môi giới quen | Chi phí + quan hệ |
| F3 | **Ngưỡng**: bao nhiêu % đúng trên tập test thì máy được tự áp (đề xuất 0,95) và một căn được đếm «suy ra» | Đánh đổi tốc độ ↔ rủi ro hiển thị sai |
| F4 | **Độ tươi mục tiêu** (phút) cho lát | Đổi kiến trúc nhịp nạp |
| F5 | **Ai gắn nhãn lát đầu** (~200 tin + ~100 cặp): Mạnh hay người thuê | Giờ công, D5 |
| F7 | **Công giữ bậc**: bao nhiêu giờ công/tuần cho nhịp giữ bậc? (Thang B0–B5, N0–N4 và bậc đích — căn hộ có danh mục B5, nhà phố B3, Chợ Tốt B3 — **Mạnh đã duyệt 23/10**) | Ngân sách nỗ lực liên tục (sự thật 8) |
| F6 | **Dọn tồn đọng** (Q12 cũ): hoàn tác 639/644, đóng thẻ 159/161, áp lại quyết định ghép căn `ops_audit` 4 | Ghi DB, khó đảo |

Q7 (subtype), Q8 (tìm mua/thuê), Q10 (thước «Căn giá tốt» tạm) không chặn lát dọc — để sau lát.

## 0.3 Trả lời F1–F6 + đính chính số liệu (23/10)

### Đính chính: 93% tin S03 trong `sale_offers` là dữ liệu giả

Khi đo cho F1 (DB local, SELECT): **1.020/1.102 tin S03 sinh từ snapshot `zalo-mock`** (bộ sinh tin giả của
collector, `snapshot_id` dạng `hanoi__zalo-mock__2026-10-18…`, nhóm «Chung cư Hà Nội», «Môi giới Miền Bắc»,
«BĐS Hà Nội» — 1.260 post trong `stg_zalo_posts`). Chỉ **82 tin S03 là thật** (từ hook OpenClaw, 367 post).

Số trong §0–§2 có S03 phải đọc lại:

| Chỗ | Số cũ | Số thật (bỏ mock) |
|---|---|---|
| §0, L09 «1.102/1.102 tin S03 không có loại» | 1.102 | **82 tin thật**, cũng 100% `unknown` — kết luận giữ, quy mô nhỏ hơn |
| L05 «50,3%» | 819/1.628 post | Phần lớn mẫu là mock (tin mock viết đúng khuôn regex). Trên tin thật: **5/81 high (6%)**, 76 medium — tin nhóm dự án gần như không ghi phường |
| L10 «155 tin S03 mang `bait_gap_pct`» | 155 | **153 là tin giả**, 2 là tin thật → «Căn giá tốt» S03 hôm nay gần như toàn tin giả |
| L18 «940/1.102 tin S03 quá 3 ngày» | 940 | 2/81 tin thật — mock là lô một lần ngày 18/10 |
| §0.2 E «10/1.102 tin nhắc dự án» | 10 | Đo trên tin thật: xem F1 bên dưới (nhóm dự án chiếm 87%) |
| ROADMAP §2.5 «1.195 P1», «1.043 sellers» | — | Gồm tin và người bán giả |

**L19 · Dữ liệu giả lẫn vào bảng canonical** — Nặng · N1, FRAMING «tin cậy» chiều 1 (có thật), phản mục tiêu
«trình bày suy đoán như sự thật»
- Snapshot `zalo-mock` đi qua importer → `stg_zalo_posts` → transform-zalo → `sale_offers` S03 → `bait_gap_pct`,
  `sellers` (SĐT giả), Deals. Không cột nào đánh dấu dữ liệu thử.
- `sync-cloud` FILL có `sale_offers` → tin giả đã lên cloud. **Audit 23/10 xác nhận** (`docs/audit/2026-10-23-hien-trang-va-lo-trinh.md`
  P7, P15): cloud có 1.020 tin S03 mock, 153 mang `bait_gap`; `/api/v1/deals` **công khai** trả 30 deal, 29 là tin mock.
- Cũng là gốc của số «parser F1 0,966»: bộ đo và dữ liệu cùng là mock.

### F1 — Lát đầu: Vinhomes Ocean Park 1

Dữ liệu thật hiện có (367 post hook Zalo, 18–23/10):

| Nhóm | Post | Nội dung |
|---|---|---|
| Duy Ka Masteri | 179 | Phần lớn toà Ocean Park 1 (LD, PR, S, BE, Masteri Waterfront, Senique) |
| CHUYỂN NHƯỢNG OCP1-F1 CĐT BÁN MỚI | 142 | Ocean Park 1 |
| 6 nhóm khác (Grand Park N1, Smart City, Vin 1,2,3, Yeshomes…) | 46 | rải rác |

**Đề xuất: lát đầu = một dự án, Vinhomes Ocean Park 1** — 321/367 post thật (87%) thuộc về nó, `asset_nodes` đã có
node dự án. Thêm Grand Park / Smart City khi lượng tin đủ (hiện < 10 post mỗi nhóm).

Ba điều đo được từ tin thật của lát, đổi cách làm:
1. **Môi giới che một phần mã căn**: «LD2xx11_2N_64m2», «PR5 tầng trung», «S1 tầng trung» — có toà và trục căn,
   **giấu tầng**. Gắn căn vì thế thường dừng ở **trục căn** (toà + trục, cùng DT + số PN), chưa tới căn. Đề xuất
   thêm mức «gắn trục» trong B2 (gắn căn): trục là bản ghi gốc tạm cho đến khi biết tầng.
2. **Số bị che**: 191/367 post (52%) có số dạng «36XX tỷ», «3.8x tỷ», «1750 thu về». Giá phải là **khoảng**, không
   phải một số — đúng tinh thần sự thật 8 (không trắng đen). Từ vựng cần kiểu giá trị khoảng.
3. **Nghĩa của giá**: 155/367 post ghi «thu về», «NET», «đã bao gồm 5%». Cần trường `price_basis` (giá chủ nhận ·
   giá gồm phí) — không có thì so thước sai dù số đúng.

Ghi chú: nhóm Zalo (S03) đang khai ở một sổ riêng (`zalo.group.toggle` trong `ops_audit`), nhóm FB/Chợ Tốt ở
`source_groups` (7 dòng, 0 dòng S03). Đề xuất một sổ nhóm duy nhất, mỗi nhóm khai thêm **dự án nó chuyên** — đó là
ngữ cảnh do người khai, mạnh hơn đoán từ tên nhóm, nhưng vẫn là suy luận về từng tin (tin trong nhóm OCP1 vẫn
có thể rao dự án khác).

### F2 — Danh mục từ nhiều nguồn và từ chính tin đăng

Danh mục cũng là dữ liệu, nên cũng có bậc (sự thật 8). Mỗi dòng danh mục (toà, trục, căn) mang nguồn và bậc:

| Bậc dòng danh mục | Từ đâu | Dùng để |
|---|---|---|
| **Xác minh** | Mặt bằng / bảng hàng chủ đầu tư, tài liệu chính thức | Gắn tin → B4 |
| **Suy ra mạnh** | ≥ 3 môi giới **độc lập** (khác người đăng, khác nhóm) cùng mô tả một toà + trục với DT, PN khớp | Gắn tin → B2 «gắn trục»; ưu tiên tìm nguồn xác minh |
| **Một lời khai** | 1 tin | Chỉ là ứng viên, không gắn |

Việc thu (làn ZCode, Z1.2): nguồn công khai của CĐT cho Ocean Park 1 trước. Việc dựng từ tin (làn Claude, C1.5/C1.6):
gom (toà, trục, DT, PN) từ phát biểu của các tin, đếm môi giới độc lập.

### F3 — Ngưỡng tự áp (Mạnh đồng ý 23/10)

Nguyên tắc: ngưỡng so với **cận dưới khoảng tin cậy 95% (Wilson)** của độ đúng trên tập test, không so với tỉ lệ
thô — vì tập nhãn do đội tự gắn sẽ nhỏ, và 98/100 đúng chưa chứng minh được 95%.

| Nhóm trường | Ví dụ | Sai thì sao | Ngưỡng tự áp (cận dưới) | Dưới ngưỡng |
|---|---|---|---|---|
| **A · định nhóm, định danh** | có phải tin rao, bán/thuê, loại, dự án, toà, gắn trục/căn | Tin vào sai nhóm so sánh hoặc sai căn → hỏng thước, hỏng gộp trùng, công khai sai | **≥ 0,95** | Thẻ duyệt; tin vẫn hiện ở B1 «chưa biết» |
| **B · số** | giá (khoảng chứa giá thật), DT (±3%), PN, `price_basis` | Sai số của một tin; phát hiện được bằng ngoại lai | **≥ 0,90** | Hiện kèm «suy ra»; ngoại lai lên thẻ |
| **C · mô tả** | hướng, view, nội thất, đường | Ít ảnh hưởng quyết định | **≥ 0,80** | Hiện kèm «suy ra», không thẻ |

Cỡ tập test cần cho mỗi ô (cách đọc × trường × phân khúc), tính sẵn:
- Đạt cận dưới 0,95: 100 nhãn chỉ được 0 lỗi; **150 nhãn được ≤ 2 lỗi**; 200 nhãn được ≤ 3 lỗi.
- Đạt cận dưới 0,90: 100 nhãn được ≤ 4 lỗi; 150 nhãn được ≤ 8 lỗi.

→ Lát Ocean Park 1 cần **~200 tin có nhãn** (đủ cho nhóm A) + ~100 cặp cho gộp trùng. Đo lại mỗi tuần; ô rơi
dưới ngưỡng tự hạ về thẻ (bậc B3 → B2 của các căn liên quan).

Ước công: hook hiện cho qua ~150 tin/ngày; khi Kev thành nhãn ước ~300 tin rao/ngày. Nếu 80% trường nhóm A tự áp,
còn ~60 thẻ/ngày × ~30 giây ≈ **30 phút/ngày** — trong tầm đội; số này là mục tiêu của bậc năng lực N3.

### F4 — Độ tươi: đề xuất

Hiện trạng đo được: từ lúc đăng tới lúc vào `stg_zalo_posts` p50 **335 phút**, p95 **1.448 phút** (nạp lô 00:00),
chưa tính transform đêm và cloud-sync 15′. Nút cổ chai: lô nạp đêm, rồi cloud-sync.

| Giai đoạn | Mục tiêu (từ lúc đăng tới lúc hiện trên OneHub Invest) | Điều kiện |
|---|---|---|
| Lát đầu | **p50 ≤ 10 phút, p95 ≤ 30 phút** | Đường theo từng tin (C2.6): hook → stg → parser/luật → phân xử → sync; LLM 27B (~9–30 giây/tin) chạy sau, chỉ cho trường dưới ngưỡng, cập nhật lại khi xong |
| Sau lát | p50 ≤ 3 phút, p95 ≤ 10 phút | Sync theo sự kiện thay vì 15′ |

**Cửa sổ hiệu lực (B5 → B4)** — tạm: căn hộ bán 14 ngày, cho thuê 7 ngày kể từ bằng chứng cuối (tin đăng lại, tin
«còn»). Chưa đủ dữ liệu để đo (tin thật mới 5 ngày); đo lại khoảng cách đăng lại sau 4 tuần rồi chỉnh.

### F5 — Mạnh và đội gắn nhãn

Vì nhiều người gắn: viết **hướng dẫn gắn nhãn** cho lát (ca khó: tầng bị che, giá khoảng, «thu về», tin nhiều căn);
**20% tin gắn trùng hai người** để đo độ đồng thuận — dưới 0,9 thì sửa hướng dẫn trước khi tin vào số đo; màn gắn
nhãn mù (không hiện giá trị máy).

### F6 — Dọn tồn đọng (Mạnh đồng ý thứ tự 23/10; mỗi bước ghi DB vẫn chạy ở phiên được giao việc)

Thứ tự đề xuất (mỗi bước ghi DB local, cần Mạnh đồng ý từng bước):

| # | Việc | Phân tích | Đề xuất |
|---|---|---|---|
| 1 | **Thẻ 159, 161** (zombie) | Hai thẻ trỏ tin **giả** (`offer_d0a7…` «Hàng Trống 89m²», `offer_ad3c…` «Ngọc Thụy 51m²», đều mock) | Bác cả hai qua `/ops/review` kèm ghi chú «thẻ trên tin giả zalo-mock»; không chạy lại enrich |
| 2 | **Dọn dữ liệu giả (L19)** | 1.020 tin S03 + 1.260 post stg + `bait_gap` 153 tin + người bán giả trong `sellers`; có thể đã lên cloud | (a) ZCode: importer bỏ qua snapshot `zalo-mock` (giữ nguyên file raw — bất biến). (b) Claude: xoá dòng stg có `snapshot_id` mock → lượt transform kế qua `reconcile_stale_offers` tự rút tin giả (có audit) → chạy lại bait gap + sellers. (c) Điều phối: kiểm và dọn bản cloud. **Làm trước mọi việc đo** — nếu không, tập nhãn và số nền nhiễm mock |
| 3 | **639/644** (`land` sai, tin S05 thật) | Hàm 036 sẵn; hai tin chưa gắn căn nên không lan; sai đang hiện ở Deals | `enrich-revert --ids 639,644 --dry` rồi chạy thật, actor `hitl:manh`. 640/645 (LLM `house`) mở lại, lượt enrich kế gắn vào thẻ 160/162 cùng đề xuất WC + đường → Mạnh duyệt trên thẻ |
| 4 | **Quyết định ghép căn đã mất** (`ops_audit` 4 → review 24) | Cặp thật: tin S05 «Lê Quang Định, 2 tầng 52m², ~7 tỷ» ↔ tin S06 60m², 8,5 tỷ. Nhãn `merged` hiện chưa có tác dụng (resolve không đọc) và có thể mất lần nữa (CASCADE còn đó) | Duyệt lại review 24 trên `/ops/review` (đường có audit). Chấp nhận có thể mất lại cho tới C2.1/C3.2; ghi ca này vào tập hồi quy |
| 5 | Dòng audit của thẻ thử (`enrich:demo-cong2`, `enrich:t_vis_conflict`) | Audit là chỉ-thêm | Không xoá; từ nay thẻ thử ghi `env='test'` |

## 0.4 Lớp model: chọn model theo số đo, qua một cổng, biết rõ chi phí (23/10)

> Mạnh nêu 23/10: Qwen 27B local yếu cả **tốc độ** lẫn **độ chính xác**; kiến trúc cần một **AI Gateway** (ví dụ của
> Vercel) để đổi và chọn model hợp từng loại việc, **biết rõ chi phí** để quyết; **trợ lý AI cho nhà đầu tư tính
> tiền riêng** về sau. Mạnh cũng đồng ý ngưỡng F3 và thứ tự dọn F6 (§0.3).

### Từ nguyên lý gốc

Model chỉ là một **bộ diễn giải** (T3). Nên:
- Chọn model là chọn **cách đọc cho một ô** (việc × trường × phân khúc), và lý do chọn phải là **số đo** (T6) — không
  phải thói quen «local trước». Ba trục: **độ đúng** (cận dưới Wilson so với ngưỡng F3), **độ trễ** (so với ngân sách
  F4), **chi phí** (đồng / tin, đồng / căn lên bậc).
- Quy tắc chọn: **model rẻ nhất mà vẫn đạt ngưỡng đúng của ô và vừa ngân sách độ trễ**. Không đạt với model nào → ô
  đó đi thẻ người.
- Đổi model **không đổi hợp đồng**: model mới vẫn phải ra phát biểu kèm trích dẫn; LLM vẫn ngoài đường dữ liệu.
- Chi phí là một phần của **nỗ lực** (sự thật 8): thước đo mới **«chi phí để đưa một căn lên bậc»** (tiền model + phút
  người), đo theo phân khúc.

### Kiến trúc

```
bộ diễn giải (parser · luật · Kev · LLM · VLM sau này)
        │  gọi qua MỘT chỗ: getModel(việc, ô)        ← agent/src/runtime/models.ts đã là chỗ nối duy nhất
        ▼
  Bảng chọn model (theo ô, sinh từ kết quả đo)  ──►  AI Gateway (cloud)  ──► nhiều nhà cung cấp
        │                                         └►  local: Qwen 27B, Kev-4B (dự phòng · dữ liệu không được ra ngoài)
        ▼
  Sổ cuộc gọi AI (DB local): việc · ô · model · token vào/ra · chi phí · độ trễ · run_id · kết quả đo liên quan
        ▼
  /ops: chi phí theo việc / phân khúc / ngày · biên «độ đúng × độ trễ × chi phí» của từng ô
```

- **Hai «khách» tách sổ và tách ngân sách** ngay từ đầu: *pipeline* (diễn giải tin, chi phí vận hành lõi) và *trợ lý
  nhà đầu tư* (tính tiền riêng — cần đo theo từng người dùng). Mỗi khách một khoá gateway + ngân sách riêng.
- **Sổ cuộc gọi của mình** song song với dashboard gateway: dashboard tốt để nhìn, nhưng phép chọn model và chi phí
  theo căn/bậc phải tính được trong DB. *(Chưa xác minh gateway có API số liệu cho máy đọc — kiểm khi làm.)*
- **Bộ đánh giá chạy nhiều model trên cùng tập nhãn** (G1/G2 của lát Ocean Park 1) → ra bảng biên cho từng ô → bảng
  chọn model. Đo lại khi có model mới hoặc mỗi tháng.
- **Dự phòng**: gateway lỗi hoặc dữ liệu không được ra ngoài → local (Qwen, Kev) với ngưỡng riêng của nó; ô nào local
  không đạt thì đi thẻ thay vì hạ ngưỡng.

Vercel AI Gateway hợp với repo vì app chạy Vercel và agent đã dùng AI SDK. Theo tài liệu Vercel: không cộng phí trên
giá token của nhà cung cấp (kể cả khi dùng khoá riêng), có ngân sách, theo dõi dùng, cân tải và dự phòng. Cách cấu
hình dự phòng và API số liệu cần kiểm khi làm.

### Ranh giới dữ liệu (SPL) khi gọi model cloud

| Dữ liệu | Gửi model cloud? | Căn cứ |
|---|---|---|
| Nội dung tin rao, người bán (tên, SĐT, ID) | **Được** | Tầng C — ROADMAP §3.11 |
| Tên nguồn thật, `source_registry`, nhãn nội bộ nguồn | **Không** — bỏ khỏi prompt | Tầng A — ADR-0007 |
| Tên nhóm | **Chờ quyết** (M2) — tạm không gửi | Có thể lộ nguồn |
| Hồ sơ, sự kiện, danh mục của nhà đầu tư (trợ lý) | **Chờ ADR riêng** | ADR-0007 xếp tầng A, không rời máy local — trái với trợ lý chạy cloud |

### Ước lượng (để có thứ tự độ lớn, không phải báo giá)

Lát Ocean Park 1: ~300 tin rao/ngày × ~1,5 nghìn token/tin ≈ **~0,5 triệu token/ngày** cho trích xuất. Chi phí thật
phụ thuộc model được chọn theo số đo — sổ cuộc gọi sẽ cho số sau tuần đầu.

### Quyết định cho Mạnh

| # | Câu | Phương án | Khuyến nghị |
|---|---|---|---|
| **M1** | Sửa hiến pháp ROADMAP §1.6 «Local-first AI» | (a) **Thành «chọn model theo số đo (đúng × trễ × chi phí); local là một lựa chọn và là dự phòng»** · (b) Giữ local mặc định, cloud là ngoại lệ | **(a)** — đúng ý Mạnh và đúng nguyên lý gốc A4; local vẫn giữ vai cho dữ liệu không được ra ngoài |
| **M2** | Tên nhóm có được gửi model cloud? | (a) Không — chỉ gửi nhãn dự án đã khai ở sổ nhóm · (b) Được | **(a)** — dự án đã khai mang đủ ngữ cảnh; tên nhóm có thể lộ nguồn |
| **M3** | Cổng | (a) **Vercel AI Gateway + sổ cuộc gọi riêng** · (b) Tự dựng cổng (proxy tự host) · (c) Gọi thẳng từng nhà cung cấp | **(a)** — cùng hệ Vercel/AI SDK, không phí cộng thêm theo tài liệu; (c) mất chỗ đổi model và chỗ đo chi phí |
| **M4** | Trợ lý nhà đầu tư tính tiền riêng | Ghi FRAMING D6 ngay; đo theo người dùng từ ngày đầu; ADR SPL riêng trước khi gửi hồ sơ nhà đầu tư lên cloud | Ghi ngay; ADR khi bắt đầu làm trợ lý |

### Việc

| Mã | Việc | Làn | Phụ thuộc |
|---|---|---|---|
| CM.1 | Sổ cuộc gọi AI (bảng local + ghi ở `getModel`) + trang chi phí trên `/ops` | C | — (làm ngay, trước khi đổi model) |
| CM.2 | Bộ đánh giá nhiều model trên cùng tập nhãn → bảng biên + bảng chọn model theo ô | C | C1.3, M1 nhãn của lát |
| CM.3 | Nối AI Gateway: hai khoá (pipeline · trợ lý), ngân sách, dự phòng về local; lọc tầng A khỏi prompt | C | M1, M2, M3 |
| CM.4 | Thước đo «chi phí để đưa một căn lên bậc» trên `/ops` | C | CM.1, C1.4 |

Trong lát Ocean Park 1: CM.1 trước C1.6/C2.4 (trích mã căn, giá khoảng, nghĩa của giá) — để biết ngay Qwen đang tốn
bao nhiêu thời gian và sai bao nhiêu so với model cloud trên cùng tập nhãn.

## 1. Bản đồ hiện trạng — mỗi điểm phân loại một dòng

Ký hiệu «ai quyết»: **M** = mô hình/LLM · **L** = luật xác định · **N** = người.
«Nạp lại» = khi chuỗi transform/resolve chạy lại thì kết quả còn hay mất.

| # | Điểm phân loại | Đầu vào | Ai quyết | Ghi vào đâu | Audit | Nạp lại | Đo chính xác bằng gì | Làn |
|---|---|---|---|---|---|---|---|---|
| 1 | **Kev-4B gate** «có phải tin BĐS» (`collector/openclaw/handler.js:78-107`, kev-serve :8009, `THRESHOLD=0.9`) | text tin Zalo | M (Qwen3-4B base + LoRA chung, **không** fine-tune BĐS VN) | Không ghi gì: p ≥ 0,9 → POST :9210; p < 0,9 → **bỏ tin, không có snapshot** | Một dòng log `skip p=… group` (không text, không id) | Tin bị bỏ **mất vĩnh viễn**; không chạy lại được khi đổi ngưỡng | `bench-gate.mjs` trên mock + 20 câu âm lặp ×10 («620 mẫu, recall 100%»). **Không có tin thật gắn nhãn** | ZCode |
| 2 | **kind** bán/thuê S03 (`transform-zalo.mjs:63-64`) | text | L (regex từ khoá; «bán» trần khớp cả «mua bán», «bán kính») | `sale_offers.kind`; không ra kind → `fail`, tin bị bỏ | Không lưu luật nào khớp | Tính lại mỗi lượt; đổi kind → **đổi `offer_id`** | `bench-extraction.mjs` F1 trên mock tự sinh (vòng tròn) | Claude |
| 3 | **kind** S05 (`transform-fb.mjs:19-25`) | text | L (bộ luật thứ hai: `parsePost` + `inferKind`) | `sale_offers.kind` | Không | như #2 | Không | Claude |
| 4 | **kind** S06 (`transform-chotot.mjs:44`) | `ad_type` có cấu trúc | L (bảng s/u) | `sale_offers.kind` | Không cần (trường nguồn) | Ổn định (`offer_id = hash(S06|list_id)`) | Không cần | Claude |
| 5 | **giá · DT · PN · phường** S03/S05 (`transform-zalo.mjs:57-120`) | text; danh sách phường **chỉ Hà Nội** (:136) | L (regex) | cột `sale_offers` + `confidence` high/medium/low | Không lưu đoạn khớp | Tính lại; giá/DT/PN/phường nằm trong băm `offer_id` | «coverage 50,3%» = tỉ lệ đủ giá+DT+phường (§2 L05) — không phải độ chính xác | Claude |
| 6 | **property_type** S03 | — | **Không ai**: hằng `'unknown'` (`transform-zalo.mjs:215`) | `sale_offers.property_type` | — | — | — | Claude |
| 7 | **property_type** S05 | — | Không ai: không ghi → `NULL` (khác S03 `'unknown'`) | `sale_offers.property_type` | — | — | — | Claude |
| 8 | **property_type** S06 (`transform-chotot.mjs:46`) | `category` 1010–1050 | L (bảng) | `sale_offers.property_type` — **ghi đè mỗi lượt** (`:88`, trái hợp đồng `ENRICH_COLS`) | Không cần | Ổn định nhưng xoá mọi sửa của người/enrich | Không | Claude |
| 9 | **street/bath/floor** S06 | `stg_chotot_ads.street_name/toilets/…` | L | Chỉ backfill một lần ở migration 030; transform **không duy trì** → 2.730 tin thiếu đường, 1.578 thiếu WC dù stg có | — | Tin mới không có | — | Claude |
| 10 | **room_type / property_type** Airbnb (`transform-airbnb.mjs:87`) | pdpSections | L | `listings.room_type` (enum Airbnb thô); `listings.property_type` **0/506** | — | Listing ra ngoài polygon → `DELETE` → CASCADE `nights`, `listing_stats` | — | Claude |
| 11 | **E1 luật ngữ cảnh** loại/toà/dự án (`agent/src/agents/context-resolver.ts:63-189`) | text 500 ký tự + **tên nhóm** + `asset_nodes`; mặc định dự án (vinhomes/masteri/ecopark → apartment, `:156-162`) | L | `enrichment_proposals` → `route=direct` → **tự áp** `apply_enrichment` → cột canonical (fill-gap) + `properties` | `evidence.basis` văn xuôi, không rule id; `apply_enrichment` không ghi `ops_audit` | Từ 039: đề xuất sống, cột enrich đóng băng | 5 ca test + 4 fixture; «73%» là **độ phủ** | Claude |
| 12 | **E2 LLM** (`enrich-text.ts`, Qwen 27B local) | text 500 ký tự + **đáp án E1 nhét vào prompt** (`:60`); không ảnh | M | đề xuất; tự áp nếu trùng E1 hoặc khớp `asset_nodes`; còn lại thẻ | `model`, `trace_path`, `confidence` (lưu, «không là căn cứ») | như #11 | 34 đầu ra thô, **không nhãn** | Claude |
| 13 | **Định tuyến** (`agent/src/enrich/route.ts:114-178`) | E1, E2, field đang trống? | L | `route` direct/corroborated/review | có trong hàng đề xuất | — | Test hành vi (acceptance), không đo chất lượng | Claude |
| 14 | **Người duyệt enrich** (`/ops/review` → `decide` → `apply_enrichment` / `decide_enrichment_review`) | thẻ `agent_output enrich:<offer>` | N | cột canonical + `enrichment_log` | `ops_audit` **sau COMMIT, fire-and-forget**; không lý do | Sống qua nạp lại nếu có offer kế (039); không thì chỉ còn ảnh chụp `ops_audit` | — | Claude |
| 15 | **Hoàn tác** (`revert_enrichment`, 036 + CLI) | id đề xuất | N | cột canonical → trống; đề xuất `reverted` | `ops_audit enrich:revert` bắt buộc actor `hitl:` + lý do | — | — | Claude |
| 16 | **Stage A** gom căn S06 (`resolve-properties.mjs:13-87`) | toạ độ ô ~55 m + kind + **property_type** + DT làm tròn + **giá làm tròn triệu** | L | `properties` (`stable_key` = khoá cụm), `property_offers` | `signals` cứng `{geo,price,area:1}` | Đổi giá → căn mới; 45 tin gắn 2 căn, 39 căn mồ côi | Không | Claude |
| 17 | **Stage B** ứng viên P1↔P2 (`resolve-properties.mjs:89-124`) | phường + DT ±15% + giá/m² ±20%; P2 lọc apartment/house, P1 không lọc loại | L | `property_candidates` — **DELETE pending/needs_llm rồi sinh lại mỗi đêm** | Không | id ứng viên đổi mỗi đêm | Không | Claude |
| 18 | **judge-entity** (`judge-entity.ts`, `judge-run.ts:55-67`) | cặp tin (A có text, B chỉ subject) + điểm Stage B; **ngưỡng xác định viết trong prompt** | M | `review_queue.ai_suggestion/ai_reasoning/ai_confidence` — **ghi đè, không lịch sử, không model/trace** | Không | — | `judge-eval.ts` đếm `yes` là pass, 3 cặp, không nhãn | Claude |
| 19 | **Người duyệt ghép căn** (`decide` nhánh `entity_match`) | thẻ `pair:a\|b` | N | chỉ `property_candidates.status` merged/rejected — **resolve không đọc** | `ops_audit` sau COMMIT | **Mất** khi offer bị xoá/đổi id: CASCADE, thẻ `pair:` không đối soát (ca thật §2 L03) | — | Claude |
| 20 | **Kiểm từ vựng** (CHECK 025, `mappings.yaml`, `dq-enum-vocab.mjs`) | — | L | — | `dq_check_results` | — | 4 CHECK `sale_offers_*_chk` đều **NOT VALID** | Claude |

Hình dạng chung: **5 bộ phân loại độc lập** (Kev, parser, E1, E2, judge) + **2 điểm người**, mỗi cái
dùng từ vựng riêng, ghi vào chỗ riêng, không cái nào biết cái kia đã nói gì ngoài cặp E1→E2 (mà cặp
này lại không độc lập vì E2 được mồi bằng đáp án E1).

---

## 2. Sổ lỗi

Mỗi lỗi chỉ **nguyên tắc bị vi phạm**. Mã nguyên tắc:

| Mã | Nguyên tắc | Nguồn |
|---|---|---|
| **N1** | Raw đầy đủ + bất biến — mọi diễn giải nằm ở pipeline | AGENTS.md luật 1 |
| **N2** | Một taxonomy, RESO-first | AGENTS.md luật 3, ADR-0011, ROADMAP §1.1 |
| **N3** | LLM-off-data-path — LLM chỉ gate/judge/extract kèm audit + evidence; luật xác định thì viết bằng code | AGENTS.md luật 7, ROADMAP §1.2 |
| **N4** | Thứ bậc căn cứ — quan sát trực tiếp thắng ngữ cảnh; độ tự tin LLM không là căn cứ | 033:23, spec enrich-qua-de-xuat §3.2 |
| **N5** | Bền qua nạp lại — key không phải nội dung đổi được; quyết định không mất khi chạy lại | ADR-0011 Qđ 1.4, spec enrich-hau-ky |
| **N6** | Audit + nguồn gốc — biết giá trị đến từ đâu, ai quyết, vì sao | AGENTS.md luật 7, ADR-0007 DQO |
| **N7** | Đo trước khi build — và mỗi sự cố dữ liệu sinh một test | ROADMAP §1.8, ADR-0007 DQO |
| **N8** | Người trong vòng lặp phải đủ căn cứ, và quyết định của người phải có hiệu lực | spec enrich-qua-de-xuat §3.4 |
| **N9** | Đơn vị nghĩ là căn nhà — nguồn chỉ là evidence | ROADMAP §1.7 |

Mức: **Nặng** = mất/sai dữ liệu không tự hồi phục hoặc chặn sản phẩm · **Vừa** = sai có thể sửa
nhưng đang lan · **Nhẹ** = nợ kỹ thuật.

### 2.1 Năm lỗi đã biết ngày 23/10 (đã xác minh lại, có bổ sung)

**L01 · E1 suy loại từ tên nhóm** — Nặng · N4, N2
- Luật cũ ghép `text + tên nhóm` rồi `/đất|nền|…/ → land`; «HỘI MUA BÁN NHÀ ĐẤT…» làm hai tin nhà
  4 tầng thành `land` (đề xuất 639, 644 `applied`; LLM `house` 640, 645 `superseded`).
- **Đính chính**: hai tin `offer_feb6cd92901f426c` và `offer_c5ac0386105f18ae` là **S05** (Facebook),
  không phải S03.
- PR #21 (`ba35f55`) chỉ vá **land**. apartment/house/room/commercial **vẫn quét tên nhóm**
  (`context-resolver.ts:92`); luật mặc định dự án (vinhomes/masteri/ecopark → apartment,
  `:156-162`) gán loại **không cần chữ nào trong tin** và vẫn tự áp. Spec hậu kỳ đo được 50 tin
  apartment(tên nhóm) mà tin nói là nhà phố — phương án sửa bị gác có chủ đích.
- Gốc: tên nhóm là thuộc tính của **kênh**, không phải của **tin**; không có khái niệm «bậc căn cứ»
  nên luật chỉ có thứ tự cứng.
- **Còn treo**: 639/644 vẫn là `land` trong `sale_offers` — `revert_enrichment` chưa chạy (chờ Hỏi-2).

**L02 · «E1 thắng LLM» che lỗi; vá tại chỗ** — Nặng · N4, N3
- d-9 (22/10) áp E1 khi lệch LLM → LLM đúng bị `superseded`, không ai nhìn. PR #14 đổi thành thẻ đối
  chiếu. Bản vá **chỉ phủ một cặp nguồn**:
  - Parser ↔ E1, parser ↔ LLM: field đã có giá trị → không sinh đề xuất (`route.ts:124`) → **bất đồng
    bị bỏ im lặng**. Parser sai thì không tầng nào cãi được.
  - E1 một mình → `direct` → tự áp, dù căn cứ là tin hay tên nhóm (router không đọc căn cứ, `run.ts:207`).
  - **Chứng thực vòng tròn**: E2 được mồi «Loại hình từ nhóm: …» = đáp án E1 (`enrich-text.ts:60`),
    rồi «LLM = E1» được tính là `corroborated` và tự áp (`route.ts:148`). Hai phiếu này không độc lập.
  - `needsLLM` (`enrich-text.ts:81-95`) bỏ qua LLM khi E1 ra đủ → E1 đi thẳng, không kiểm chéo.

**L03 · Nạp lại xoá dây chuyền** — Nặng · N5, N8
- Cơ chế 23/10 xác nhận: transform cũ `DELETE FROM sale_offers WHERE source='S03'` → CASCADE 033 xoá
  mọi đề xuất S03 → INSERT lại cùng `offer_id` với `property_type='unknown'`. DB còn 8 đề xuất (toàn
  S05) trong khi sequence đã ở 6.479.
- 039 vá cho đề xuất enrich (FK RESTRICT + `writeOffers` upsert + `reconcile_stale_offers`). **Quét
  các thứ khác cùng rủi ro:**

  | Thứ | Hiện trạng | Rủi ro |
  |---|---|---|
  | `enrichment_proposals` | RESTRICT, đối soát 039 | Đã vá. Không có offer kế → chỉ còn ảnh chụp `ops_audit` |
  | `review_queue` thẻ `enrich:` | Không FK; 039 chuyển `item_id` | **2 thẻ zombie** 159, 161 (S03) đang `pending` mà không còn đề xuất nào |
  | `review_queue` thẻ `pair:` | Không FK; **không đối soát** | Mồ côi khi băm đổi |
  | `property_candidates` | **CASCADE** (027:39-40) + Stage B xoá/sinh lại mỗi đêm | Quyết định người **mất thật**: `ops_audit` id 4 (22/10) duyệt `pair:offer_1a3b44a8d7c822e0\|offer_728ae98908bf9bbb`; hôm nay review 1 không còn, cùng cặp lại `pending` ở review 24, candidate 8468 `needs_llm` |
  | `property_offers` | **CASCADE** (027:28) | Hiện chỉ S06 có liên kết (S06 không bị xoá) → an toàn tạm thời; vỡ ngay khi P1 vào căn |
  | `properties` | `stable_key` chứa giá + loại | Đổi giá/loại → căn mới; 45 tin gắn 2 căn, 39 căn mồ côi |
  | `nights`, `listing_stats` | CASCADE từ `listings`; transform-airbnb DELETE listing ra ngoài polygon | Đổi polygon phường → mất lịch sử đêm |
  | Giá trị enrich đã áp | `ENRICH_COLS` đóng băng (`write-offers.mjs:10,40`) | Chiều ngược: **parser sửa xong cũng không cập nhật được** các cột này cho tin cũ, vì không phân biệt giá trị do parser hay enrich ghi |
  | Sửa của người cho S06 | transform-chotot ghi đè `property_type` mỗi lượt (`:88`) | Người/enrich sửa loại S06 → lượt sau mất |

- Gốc chung: **định danh băm nội dung** (`offer_id` P1 = băm `kind|phường|giá|DT|PN`) và **quyết định
  treo vào định danh đó**. CONTEXT.md lại ghi `offer_id = hash nguồn + id gốc` — tài liệu và code lệch.

**L04 · Thẻ duyệt thiếu căn cứ** — Nặng · N8, N4, N6
- **Ảnh**: PR #16 có backend `loadReviewMedia`, thẻ chưa render (type có `image_url` mà không dùng).
- **Xung đột**: chỉ hiện E1↔LLM. Không hiện giá trị parser / giá trị hiện tại (evidence không lưu).
- **«AI tự tin %»** vẫn hiện ở field không xung đột (`review-card.tsx:189-191, 283-285`) **thay cho**
  căn cứ; thẻ ghép căn hiện `AI: yes (85%)` màu success (`:320-322`), mà dòng seed 029:68 còn ghi
  **điểm Stage B** vào `ai_confidence` — con số hiện ra không phải độ tự tin của ai cả.
- `ai_suggestion='apply'` gắn cứng mọi thẻ enrich, kể cả thẻ xung đột (`run.ts:143`) → mồi người bấm Áp.
- Không đoạn trích có vị trí, không rule id, text cắt 300 ký tự `line-clamp-3`, tên nhóm lẫn với tin.
- Thẻ ghép căn không hiện tín hiệu từng phần (đường, SĐT, tầng) dù 030 đã thêm cột.
- Decide không nhận lý do (0 dòng `decision_note`); audit `auditOpsWrite` chạy **sau COMMIT,
  fire-and-forget** (`app/src/lib/audit.ts:9-20`) — lỗi thì quyết định vẫn đứng mà không vết.

**L05 · transform-zalo 50,3% và không có tập nhãn** — Nặng · N7
- 50,3% = 819/1.628 = `nFull/posts` (`transform-zalo.mjs:172`): tỉ lệ tin có **đủ** giá + DT + phường.
  Đó là **độ phủ**, không phải độ chính xác. 819 + 533 + 99 = 1.451 — **177 tin `low`** (có kind,
  không giá) không nằm ô nào; nhánh `else if (hasPrice)` ở `:169` là code chết. `fail` chỉ nghĩa là
  không thấy từ khoá bán/thuê. (Dòng log đúng «819/533/99» không tìm thấy trong log còn lại; log gần
  nhất `pipeline/logs/zalo-import.log:2` ghi «815 high, 462 medium, 40 fail — 56,4%»; số 819 khớp DB.)
- **Không tầng nào có tập nhãn tin thật**:

  | Tầng | Thứ đang gọi là «đo» | Vì sao không phải độ chính xác |
  |---|---|---|
  | Kev-4B | «620 mẫu, recall 100%, 81 ms» | Dương = `zalo-mock`; âm = 20 câu lặp ×10; không file kết quả |
  | Parser | F1 0,966 / 420 mẫu (`dq_check_results` 82) | Nhãn do chính bộ sinh mock tạo từ 7 câu mẫu đúng khuôn regex — vòng tròn |
  | E1 | «resolve 73%» | Độ phủ; 5 ca test + 4 fixture |
  | E2 | 34 đầu ra lưu | Không nhãn |
  | judge-entity | `judge-eval.ts` | Đếm `yes` là pass; 3 cặp; ROADMAP A2 tự ghi «cần hand-label» |

### 2.2 Lỗi tìm thêm

**L06 · Kev-4B bỏ tin trước raw snapshot** — Nặng · N1, N6, N7 · làn ZCode
- `handler.js:104-107`: `p === null || p < 0.9` → ghi `skip` rồi `return`. Tin không tới :9210 →
  không snapshot → **không phục hồi, không chạy lại được** khi đổi ngưỡng/mô hình.
- Số đo từ `~/.openclaw/logs/oneinvest-zalo-pipe.log` (điều phối liên làn đo lại 23/10): skip 1.270 / post 549
  (≈70% bị bỏ), 0 gate-down. Phân bố p của tin bị bỏ: p < 0,5: 725 · 0,5–0,8: 506 · 0,8–0,9: 39.
- Mẫu ghép được (khung 22/10 05:41–10:55, 80 tin skip): **59 tin chỉ có URL ảnh zdn.vn** (nhánh
  media-only `:65` không chạy vì text không rỗng → ảnh mất); **20 tin rao rõ ràng** («Bán 3N… 5,5x tỷ»,
  «Cho thuê 2n2vs 75m 6,5tr») p 0,51–0,67; 1 tin tìm thuê p 0,28; chỉ ~2 tin thật sự âm.
- `p=null` (HTTP không 2xx, đổi hình response) → **bỏ im lặng**, không fail-open; 69 tin `gate-error`
  ngày 21/10 đã mất. Comment `:100` «đánh dấu chưa phân loại» không đúng thực tế.
- p không vào RawItem, `stg_zalo_posts`, DATA-CONTRACT. Watchdog chỉ kiểm Kev sống, không kiểm tỉ lệ skip.
- **Đã quyết (Mạnh, 23/10)**: Kev thành **nhãn, không lọc** — hook đẩy mọi tin kèm `meta.kev {p, model,
  threshold, at}`, DATA-CONTRACT lên `schemaVersion 3`; ZCode làm (`claudedp-2310-11`). Lỗi gốc của L06 đóng
  khi việc này vào chạy; phần còn lại là transform dùng `meta.kev.p` (việc C1.1, §5).
- Chênh chưa giải thích: log nhận 547 tin, `stg_zalo_posts` có 367 dòng `openclaw-hook` (có thể do
  buffer/độ trễ nạp — cần ZCode xác nhận).

**L07 · Ba định nghĩa «có phải tin rao» và «bán/thuê»** — Vừa · N2
- Kev `is_bds` = bán / cho thuê / **tìm mua** → true. Regex `parsePost` không có chỗ cho tìm mua/thuê
  (không ra kind → `fail`, tin bị bỏ). Bench Kev đếm «tìm mua» là `sale`. `transform-fb` có `inferKind`
  thứ hai. G-3 còn định thêm bộ `is_bds` thứ ba (Kev-V).

**L08 · Từ vựng loại BĐS ở 12 chỗ, trộn cấp RESO** — Vừa · N2
- Chỗ tự khai: CHECK 025; CASE trong 025; `transform-chotot.mjs:46`; `route.ts:25` (5 giá trị, thiếu
  `unknown`); `context-resolver.ts:68-76`; prompt `enrich-text.ts:22`; `mappings.yaml:204`;
  `dq-enum-vocab.mjs:16`; `resolve-properties.mjs:102`; `properties.property_type` (không CHECK);
  `listings.property_type` (text trần, 506/506 NULL); `enrichment_proposals.value` (không ràng giá trị).
- apartment/house ở cấp RESO **PropertySubType**, land/commercial ở cấp **PropertyType**; `commercial`
  gộp CommercialSale + CommercialLease; `kind` và `property_type` cùng map vào DD `PropertyType` mà
  không có luật suy ngược; `unknown` không khai extension; `area_m2 = LivingArea` sai cho 500 tin
  `land` (đó là LotSizeArea; parser không tách DT đất / DT sàn).
- Hai cách nói «chưa biết»: S03 `'unknown'`, S05 `NULL`.
- ADR-0011 Qđ 3.2 nêu «shophouse, liền kề» là extension hợp lệ, enum lại gộp mất; CHDV (RESO
  `ResidentialIncome`) không có chỗ — ca 644 «CHDV 9PN» bị ép vào house/land.
- CONTEXT.md **không có thuật ngữ «Loại hình»** dù định nghĩa «Thước giá» dùng nó → thẻ duyệt hiện chữ
  tiếng Anh thô (`review-card.tsx:114,281`).

**L09 · P1 không được phân loại ở đâu cả** — Nặng · N2, N9
- Parser S03 gán cứng `'unknown'`, S05 để NULL; toàn bộ loại P1 phụ thuộc enrich; đề xuất S03 mất
  23/10 → hôm nay **1.102/1.102 tin S03 không có loại**.

**L10 · «Căn giá tốt» trộn loại hình** — Nặng · N9 (hệ quả sản phẩm)
- `refresh-bait-gap.mjs:30-37` tính `bait_gap_pct` của P1 so với `v_ruler_p2_area` — trung vị giá/m²
  **cả phường**, trộn căn hộ, nhà phố, đất, phòng trọ. CONTEXT.md:122 định nghĩa thước «phường × loại
  hình». Migration 025 tự ghi «trước đây ruler trộn 5 loại» — view loại hình đã có
  (`034_ruler_p2_views.sql:38,51`) nhưng bait gap không dùng được vì P1 không có loại (L09).
  Hiện 155 tin S03 + 32 tin S05 mang `bait_gap_pct` tính theo cách này.

**L11 · P1 không bao giờ thành căn nhà; duyệt «Cùng căn» không có tác dụng** — Nặng · N9, N8
- S03 0/1.102, S05 0/118 tin có `property_offers`. Stage A chỉ chạy S06; Stage B chỉ sinh ứng viên.
- `merged` chỉ là nhãn trên `property_candidates` — `resolve-properties` không đọc. Không code nào sinh
  thẻ `entity_match` ngoài seed 029 → **134 cặp `needs_llm` không có thẻ**. `verification='verified'`:
  0/10.870.

**L12 · Cột canonical không có nguồn gốc; fill-gap = ai ghi trước thắng** — Vừa · N6, N4, N5
- `apply_enrichment` ghi thẳng `sale_offers.*` và COALESCE sang `properties`; muốn biết giá trị từ đâu
  phải join đề xuất `applied`. Không có cột provenance.
- Thứ bậc thực tế trong code: giá trị hiện có (parser hoặc lần áp trước) > E1 một mình (tự áp) ≈ E1+LLM
  ≈ LLM+asset_nodes (tự áp) > LLM một mình (thẻ). Không có chỗ cho «căn cứ mạnh hơn thì sửa giá trị yếu».

**L13 · transform-chotot không duy trì trường đã có trong stg** — Vừa · N2 (một nguồn sự thật cho transform)
- street/bath/floor chỉ backfill một lần (030:12-20); công thức `'S06|'||list_id` chép ở 6 chỗ vì
  `sale_offers` không có cột khoá gốc của nguồn.

**L14 · judge-entity: luật xác định nằm trong prompt** — Vừa · N3, N6, N7
- Ngưỡng «lệch giá <15%, DT <10%» viết cho LLM thực hiện (`judge-entity.ts:17-20`) — lẽ ra là code;
  thiếu confidence → gán 0,5 (`:63`); đầu vào bất đối xứng (A có text, B chỉ subject); ghi đè `ai_*`
  không lưu model/trace/lịch sử.

**L15 · Audit thủng** — Vừa · N6
- `apply_enrichment` không ghi `ops_audit` → khi CASCADE chạy (trước 039) dấu vết áp mất hẳn (638/643
  không khôi phục được). Audit app sau COMMIT; không lý do; `decided_by` của entity_match không theo
  dạng `hitl:`; thẻ thử (`enrich:demo-cong2`, `enrich:t_vis_conflict`) lẫn vào `ops_audit` thật.

**L16 · E2 bỏ phí đầu ra, nhìn hẹp** — Nhẹ · N7
- `project_name` (chính là chỗ E1 nhờ LLM chọn dự án), `address_detail`, `features`, `urgency` bị bỏ;
  text cắt 500 ký tự hai lần; không ảnh.

**L17 · Parser S03 lệch thị trường** — Vừa · N7
- `matchPhuong` chỉ có phường Hà Nội (`:136`) dù nhóm có tin HCM (331/1.102 tin S03 không có `area_id`);
  `group_name` SELECT mà không dùng; «bán» trần dương tính giả. Chưa có số đo sai lệch vì không có nhãn.

### 2.3 Bảng gom

| Mã | Lỗi | Mức | Nguyên tắc | Làn | Gốc |
|---|---|---|---|---|---|
| L01 | E1 suy loại từ tên nhóm (vá land, còn 4 loại + mặc định dự án) | Nặng | N4 N2 | Claude | không có bậc căn cứ |
| L02 | Xung đột chỉ thấy ở E1↔LLM; chứng thực vòng tròn | Nặng | N4 N3 | Claude | không có bậc căn cứ |
| L03 | Nạp lại xoá dây chuyền; quyết định ghép căn đã mất | Nặng | N5 N8 | Claude | định danh nội dung |
| L04 | Thẻ duyệt thiếu căn cứ, hiện % | Nặng | N8 N4 N6 | Claude | không lưu căn cứ |
| L05 | Không tập nhãn; 50,3% là độ phủ | Nặng | N7 | cả hai | chưa đo |
| L06 | Kev bỏ tin trước snapshot, ~70% skip — **đã quyết sửa** (Kev thành nhãn) | Nặng | N1 N6 N7 | ZCode | chưa đo + vi phạm raw |
| L07 | Ba định nghĩa «tin rao» / bán-thuê | Vừa | N2 | cả hai | không taxonomy |
| L08 | Từ vựng loại ở 12 chỗ, trộn cấp RESO | Vừa | N2 | Claude | không taxonomy |
| L09 | P1 không được phân loại | Nặng | N2 N9 | Claude | không taxonomy + L03 |
| L10 | «Căn giá tốt» trộn loại hình | Nặng | N9 | Claude | hệ quả L09 |
| L11 | P1 không thành căn; «Cùng căn» không hiệu lực | Nặng | N9 N8 | Claude | định danh + chưa nối |
| L12 | Canonical không nguồn gốc; fill-gap | Vừa | N6 N4 N5 | Claude | không lưu căn cứ |
| L13 | Chợ Tốt không duy trì trường stg | Vừa | N2 | Claude | transform |
| L14 | judge-entity: luật trong prompt | Vừa | N3 N6 N7 | Claude | ranh giới LLM/luật |
| L15 | Audit thủng | Vừa | N6 | Claude | không lưu căn cứ |
| L16 | E2 bỏ phí đầu ra | Nhẹ | N7 | Claude | — |
| L17 | Parser S03 chỉ phường HN | Vừa | N7 | Claude | chưa đo |
| L20 | Tin chỉ ảnh trùng `sourceId` → tin sau bị bỏ lúc ingest (§6) | Nặng | N1 | ZCode | khoá event không phân biệt tin ảnh |
| L19 | Dữ liệu giả `zalo-mock` lẫn vào canonical S03 (§0.3) | Nặng | N1, FRAMING «có thật» | cả hai | không đánh dấu dữ liệu thử |
| L18 | Không mô hình thời gian / hiệu lực (§0.2 C) | Nặng | FRAMING «tin cậy» chiều 4, D4 | Claude | thiếu thành phần T5 |

Ba gốc ở §0 cộng gốc taxonomy phủ 16/17 lỗi: **không lưu căn cứ/bậc căn cứ** (L01 L02 L04 L12
L14 L15), **định danh gắn nội dung** (L03 L11), **chưa đo** (L05 L06 L16 L17), **không một taxonomy**
(L07 L08 L09 → L10). L13 là lỗi transform đơn lẻ.

---

## 3. Kiến trúc đích

### 3.1 Năm nguyên lý (bổ sung cho hiến pháp, không thay)

1. **Phát biểu, không ghi đè.** Mọi tầng (Kev, parser, E1, E2, ảnh, judge, người) chỉ ghi *phát biểu*
   về một trường của một chủ thể, kèm bậc căn cứ và đoạn trích. Không tầng nào ghi thẳng cột canonical.
2. **Canonical là kết quả phân xử, dựng lại được.** Cột `sale_offers.*` / `properties.*` là cache do một
   bộ phân xử xác định dựng từ các phát biểu, kèm `provenance`. Xoá cache dựng lại ra đúng như cũ.
3. **Khoá bất biến.** Phát biểu và quyết định treo vào khoá không đổi theo nội dung: id gốc của nguồn
   (post Zalo/FB, `list_id` Chợ Tốt, id Airbnb). `offer_id` băm nội dung chỉ còn là id cụm.
4. **Tự áp phải được đo.** Một ô (phương pháp × trường × nguồn) chỉ được tự áp khi độ chính xác đo trên
   tập nhãn đóng băng ≥ ngưỡng. Confidence tự khai không bao giờ là căn cứ, và không hiện trên thẻ.
5. **Raw giữ trọn, lọc ở pipeline.** Cổng (Kev) chấm điểm và ghi điểm vào raw; quyết định bỏ tin là
   một phát biểu ở pipeline, đổi ngưỡng thì chạy lại được.

### 3.2 Một taxonomy (RESO-first)

Một **sổ đăng ký** duy nhất — đề xuất mở rộng khối `controlled_vocabulary` của `pipeline/mappings.yaml`
— sinh ra: bảng tra `ref_*` (migration, CHECK/ FK thay text trần), hằng TS/JS cho parser/agent/app,
danh sách enum cho prompt LLM, nhãn tiếng Việt cho UI, và thuật ngữ trong CONTEXT.md. Một test lint đỏ
khi có chuỗi enum viết tay ngoài sổ (giống `route-slugs.test.mjs`).

| Trục | Giá trị | RESO DD | Trạng thái |
|---|---|---|---|
| **listing_intent** | `offer` · `wanted` · `not_listing` | không có (wanted = extension) | **Mới** — một định nghĩa cho Kev, parser, bench (L07). Q8 |
| **kind** | `sale` · `rent_lt` · (`rent_st`) | PropertyType Residential* / ResidentialLease + LeaseAmountFrequency | **Đã chốt §3.1** — giữ |
| **property_type** | `apartment` · `house` · `land` · `room` · `commercial` · `unknown` | Mỗi giá trị khai alias: apartment → Residential/Condominium·Apartment; house → Residential/SingleFamilyResidence·Townhouse; land → Land; commercial → CommercialSale|CommercialLease (theo `kind`); room → extension VN; unknown → «chưa xác định», không gửi ra API | **Đã chốt §3.2** — giữ, chỉ thêm bảng alias + một cách nói «chưa biết» |
| **property_subtype** | RESO PropertySubType + extension VN: `nha_pho`, `biet_thu`, `lien_ke`, `shophouse`, `chdv` (≈ResidentialIncome), `dat_tho_cu`, `dat_nen`… | PropertySubType | **Đề xuất, hoãn đến khi đo** (Q7) |
| **area_basis** | `living` · `lot` | LivingArea / LotSizeArea | **Đề xuất** — sửa `area_m2 = LivingArea` sai cho land |

Quy tắc «chưa biết»: cột canonical không bao giờ NULL vì «chưa chạy»; không có phát biểu nào → `unknown`.
CHECK chuyển từ NOT VALID sang VALIDATE sau khi dọn.

### 3.3 Thứ bậc căn cứ

| Bậc | Loại căn cứ | Ví dụ | Được làm gì |
|---|---|---|---|
| **H0** | Quyết định của người (`hitl:`) | chọn «nhà» trên thẻ | Thắng mọi bậc; sống qua mọi lượt nạp |
| **H1** | Trường có cấu trúc của nguồn | Chợ Tốt `category=1020`, Airbnb `roomType` | Tự áp |
| **H2** | Câu chữ tường minh trong tin, luật có `rule_id` + vị trí đoạn khớp | «nhà 4 tầng», «lô đất thổ cư», «2PN» | Tự áp nếu ô đã đo ≥ ngưỡng |
| **H3** | LLM trích xuất **kèm trích dẫn nguyên văn**, code kiểm trích dẫn có thật trong tin | LLM: house, trích «Nhà Gò Vấp 4 tầng» | Tự áp nếu ô đã đo ≥ ngưỡng; LLM không trích được → xuống H5 |
| **H4** | Ảnh (VLM, sau này — G-3) | ảnh mặt tiền nhà ống | Như H3 |
| **H5** | Ngữ cảnh / tiên nghiệm | tên nhóm, mặc định dự án, lịch sử người bán, LLM không trích dẫn | **Không bao giờ tự quyết**; chỉ phá hoà giữa các bậc trên, hoặc gợi ý trên thẻ |
| — | Không phải căn cứ | confidence tự khai, `ai_suggestion` | Chỉ lưu để hiệu chỉnh; không định tuyến, không hiện |

**Luật phân xử** (thuần, xác định, có test):
1. Lấy bậc cao nhất có phát biểu. Trong cùng bậc: đồng thuận → nhận; bất đồng → thẻ.
2. Bậc thấp hơn **trái** bậc cao hơn: ghi là *bất đồng*. Bậc cao là H0/H1 → giữ, không thẻ. Bậc cao là
   H2/H3 và bậc thấp từ H3 trở lên → **thẻ** (đây là chỗ thay cho bản vá cục bộ PR #14, phủ mọi cặp).
3. **Độc lập**: hai phiếu chỉ được tính là chứng thực khi không phiếu nào thấy đáp án của phiếu kia.
   E2 chạy **mù** (không nhận đáp án E1).
4. Ô (phương pháp × trường × nguồn) chưa đo hoặc dưới ngưỡng → mọi phát biểu của nó đi thẻ, không tự áp.

### 3.4 Phân loại bền qua nạp lại

```
raw snapshot (bất biến) ──► stg_* (khoá gốc nguồn: post_id / list_id / abnb id)
        │                            │
        │                   parser ─►┤
        │                   E1 ─────►┤  field_assertions  (append-only)
        │                   E2 ─────►┤  subject_key = khoá gốc · field · value · tier H0–H5
        │                   Kev ────►┤  method + rule_id/model@version · evidence{span,start,end,image}
        │                   người ──►┘  actor · run_id · created_at · retracted_at/reason
        │                                      │
        │                         bộ phân xử (SQL/JS thuần, chạy sau mỗi transform)
        │                                      ▼
        └──────────────► sale_offers / properties  (cache canonical + provenance jsonb)
```

- **Chủ thể của phát biểu** = khoá gốc (`S03:<post_id>`, `S06:<list_id>`, `S01:<abnb id>`). Tin P1 gộp
  repost thành offer: offer nhận hợp các phát biểu của các post trong nó. Đổi giá, sửa parser, gộp lại
  repost → offer đổi id, **phát biểu không đổi chủ**.
- **Quyết định ghép căn** = phát biểu trên cặp khoá gốc (`must_link` / `cannot_link`), resolve đọc như
  ràng buộc. `properties.stable_key` bỏ giá và loại (chỉ toạ độ/khoá gốc đại diện).
- **Transform**: upsert + `retired_at` (mềm), không DELETE; mọi FK tới `sale_offers` là RESTRICT;
  `listings` cũng thế (không DELETE listing ra ngoài polygon — gắn cờ).
- **Sửa parser** = phát biểu mới với `rule_id` mới, phát biểu cũ `retracted` → phân xử lại → cột cập
  nhật (gỡ đóng băng `ENRICH_COLS`). Sửa của người (H0) vẫn thắng.
- `enrichment_proposals` (033/036/039) trở thành một phần/khung nhìn của `field_assertions` — giữ hàm
  `revert_enrichment`, `apply_enrichment` thành «ghi phát biểu H0 + phân xử».
- Audit: ghi phát biểu và `ops_audit` **trong cùng transaction**; lý do bắt buộc khi người chọn bậc thấp
  hơn bậc máy đang giữ.

### 3.5 Tập đánh giá có nhãn cho từng tầng

| Tập | Chủ thể | Trường | Cỡ đề xuất | Nguồn mẫu |
|---|---|---|---|---|
| **G0 Cổng** | tin Zalo thật (cả tin p thấp) | `listing_intent`, `kind` | 400, phân tầng theo khoảng p | raw giữ trọn kèm `meta.kev` (việc Z1, đã quyết) |
| **G1 Parser** | post S03/S05 + ad S06 | kind, giá, DT + area_basis, PN, phường, đường, loại, tầng, **mã căn · toà · dự án** (FRAMING D1/D3) | 200 S03 + 100 S05 + 100 S06 | stg, phân tầng theo nhóm/thành phố |
| **G2 Enrich** | cùng mẫu G1 | loại, toà, dự án, đường, WC — đo riêng E1, E2, theo bậc | dùng lại G1 | — |
| **G3 Ghép căn** | cặp tin | cùng căn / khác căn | 150 cặp | `property_candidates` + cặp ngẫu nhiên cùng phường |

- **Dev / test tách đôi**: luật được chỉnh theo dev; test đóng băng, chỉ dùng để chấm.
- **Gắn nhãn mù**: màn gắn nhãn không hiện giá trị máy (tránh neo).
- **Số đo**: precision, recall, độ phủ theo tầng × trường × nguồn × bậc; chạy được bằng một lệnh
  (`eval:classify`), ghi `dq_check_results` → `/ops/quality`; chạy trong CI khi parser/E1/prompt đổi.
- **Mỗi sự cố một ca** (ADR-0007 DQO): ca land 639/644, ca «BÁN LÔ ĐẤT» trong nhóm chung cư, ca tin chỉ
  ảnh của Kev… vào tập hồi quy riêng.
- Quyết định trên thẻ duyệt cũng là nhãn, nhưng **lệch chọn mẫu** (chỉ ca máy không chắc) — không trộn
  vào tập test.

### 3.6 Thẻ duyệt đủ căn cứ

Mỗi trường trên thẻ hiện:
- **Giá trị đang giữ** và nguồn gốc của nó (bậc + phương pháp).
- **Mọi phát biểu**, nhóm theo bậc, Badge nguồn tiếng Việt: «Người» · «Nguồn» · «Trong tin» · «LLM có
  trích dẫn» · «Ảnh» · «Ngữ cảnh nhóm». Mỗi phát biểu kèm `rule_id`/model và **đoạn trích được tô trong
  toàn văn tin** (mở rộng được, không cắt 300 ký tự).
- Tên nhóm hiện riêng, gắn nhãn «ngữ cảnh», không trộn vào đoạn tin.
- **Ảnh** (backend PR #16 sẵn: local trước, URL hết hạn gắn cờ).
- Bất đồng của **mọi cặp bậc** (không chỉ E1↔LLM).
- **Không** «AI tự tin %», **không** `ai_suggestion` mặc định.
- Hành động: chọn một phát biểu · nhập giá trị khác · «không xác định được». Lý do bắt buộc khi chọn bậc
  thấp hơn. Mỗi quyết định = phát biểu H0 trên khoá gốc, sống qua nạp lại.
- Thẻ ghép căn: bảng tín hiệu từng phần (giá, DT, phường, đường, SĐT, tầng, ảnh) cạnh nhau; judge
  chỉ giải thích, ngưỡng là code.

---

## 4. Quyết định cho Mạnh

Không hỏi lại điều đã chốt ở ROADMAP §3 (kind ↔ RESO §3.1, tập `property_type` §3.2, phân làn §3.9).
Mỗi câu: phương án, khuyến nghị **in đậm**, và vì sao.

| # | Câu hỏi | Phương án | Khuyến nghị |
|---|---|---|---|
| **Q1** | Kev-4B đứng ở đâu? | **ĐÃ QUYẾT (Mạnh, 23/10)**: Kev thành nhãn, không lọc — mọi tin vào raw kèm `meta.kev {p, model, threshold, at}`, DATA-CONTRACT `schemaVersion 3` (ZCode, `claudedp-2310-11`) | Trùng phương án review khuyến nghị (raw đầy đủ, lọc là phát biểu ở pipeline). Không cần quyết thêm |
| **Q2** | Phát biểu/quyết định treo vào khoá nào? | (a) Giữ `offer_id` băm nội dung, mở rộng đối soát 039 sang `property_offers/candidates` + thẻ `pair:` · (b) **Treo vào khoá gốc nguồn (post_id/list_id); `offer_id` chỉ còn là id cụm** · (c) Đổi khoá chính `sale_offers` sang khoá gốc | **(b)**. (a) là thêm một lớp vá cho mỗi bảng mới; (c) đụng mọi bảng và mọi API. (b) thêm một cột + một bảng. **FRAMING D1**: phát biểu thuộc căn treo vào căn gốc (dòng danh mục) khi đã ghép; thuộc tin treo vào id gốc tin |
| **Q3** | Giá trị phân loại sống ở đâu? | (a) Giữ cột canonical + đề xuất + fill-gap (hiện trạng) · (b) **Bảng phát biểu append-only + bộ phân xử dựng canonical có provenance** · (c) Giữ `enrichment_proposals`, ghi thêm giá trị parser thành đề xuất + cột provenance | **(b)**. (c) là bước đệm hợp lý nếu muốn đi từng nấc; (a) giữ nguyên gốc của L02, L04, L12 |
| **Q4** | Tên nhóm (ngữ cảnh) được làm gì? | (a) **Chỉ là H5 — không bao giờ tự quyết; hiện trên thẻ như gợi ý** · (b) Được quyết khi tin im lặng, cho danh sách nhóm đơn-chủ-đề đã đo precision ≥ 95% · (c) Giữ như sau PR #21 (land bị cấm, 4 loại kia vẫn quét) | **(a) ngay**, chuyển sang **(b)** khi có G2. (c) đang giữ 50 tin apartment sai đã đo được |
| **Q5** | Khi nào máy được tự áp? | (a) Theo luật như hiện tại (E1 `direct`, LLM=E1) · (b) **Chỉ ô (phương pháp × trường × nguồn) có precision trên tập test ≥ 0,95; còn lại lên thẻ** · (c) Mọi giá trị máy đều qua người | **(b)**. (c) không kham nổi: 1.220 tin P1 × 5 trường. Ngưỡng 0,95 là đề xuất — Mạnh có thể chọn số khác |
| **Q6** | Tập nhãn làm thế nào? | (a) **Mạnh gắn nhãn mù trên màn `/ops` riêng, ~600 tin + 150 cặp** (ước 4–6 giờ công, chia nhiều buổi) · (b) Lấy quyết định trên thẻ duyệt làm nhãn (rẻ nhưng lệch mẫu) · (c) LLM lớn gắn trước, người kiểm 20% (làm nhiễm phép đo LLM) | **(a)**, giữ (b) làm tập hồi quy phụ. Không đo được thì Q5 không chạy được. **FRAMING D5**: người gắn nhãn có thể là người thuê, theo hướng dẫn gắn nhãn viết sẵn |
| **Q7** | Có thêm `property_subtype` (nhà phố/biệt thự/liền kề/shophouse/CHDV/đất thổ cư)? | (a) **Chưa — chỉ thêm bảng alias RESO cho 6 giá trị đã chốt; đo phương sai thước giá theo loại trước** · (b) Thêm ngay, nullable, theo PropertySubType + extension VN · (c) Mở rộng chính `property_type` | **(a)** (luật đo trước khi build). Làm (b) khi số đo cho thấy «house» trộn nhà ống với biệt thự làm lệch thước |
| **Q8** | Tin «tìm mua / tìm thuê» là gì? | (a) **`listing_intent = wanted`: giữ ở raw + stg, không thành tin rao** · (b) Thành tín hiệu cầu (sản phẩm mới) · (c) Bỏ như hiện tại | **(a)** ngay — một định nghĩa cho Kev, parser, bench. (b) là quyết định sản phẩm riêng, để sau |
| **Q9** | Độ tự tin trên thẻ duyệt? | (a) **Bỏ hẳn khỏi thẻ, giữ trong DB để hiệu chỉnh** · (b) Thu vào «Chi tiết máy», đóng mặc định | **(a)**. Spec 033 đã nói nó không là căn cứ; hiện nó ra là mồi người bấm theo |
| **Q10** | «Căn giá tốt» khi P1 chưa có loại? | (a) Giữ thước cả phường đến khi P1 có loại · (b) Chuyển sang phường × loại ngay; tin P1 `unknown` không có gap · (c) **Phường × loại khi biết loại; `unknown` dùng thước cả phường và gắn nhãn «chưa rõ loại hình»** | **(c)**. (a) đang hiện số sai lệch không báo; (b) làm mất gần hết tin S03 khỏi danh sách |
| **Q11** | Thứ tự đợt lớn | (a) **Đo trước: raw giữ trọn + taxonomy + tập nhãn + số nền, rồi mới xây lớp phát biểu** · (b) Xây lớp phát biểu trước, đo sau | **(a)**. Không có số nền thì không biết kiến trúc mới có tốt hơn không |
| **Q12** | Dọn tồn đọng ngay (ghi DB local, khó đảo) | Hoàn tác 639/644 (Hỏi-2 cũ) · đóng thẻ zombie 159/161 thành `rejected` kèm ghi chú · áp lại tay quyết định ghép căn `ops_audit` 4 | **Làm cả ba**, actor `hitl:manh`, trước đợt lớn |

---

## 5. Việc theo làn — thứ tự và phụ thuộc

Đánh số theo đợt. **C** = làn Claude, **Z** = làn ZCode, **M** = Mạnh. Hạng T theo `_acceptance/config.yaml`.

### Đợt 0 — dọn và cầm máu (nhỏ, không chờ kiến trúc)

| Mã | Việc | Làn | Phụ thuộc | Hạng |
|---|---|---|---|---|
| ~~Z0.1~~ ~~Z0.2~~ | Fail-open khi `p=null` / tạm giữ tin skip — **gộp vào Z1** sau quyết định Kev thành nhãn (không còn tin bị bỏ) | Z | — | — |
| C0.1 | Q12: hoàn tác 639/644, đóng thẻ 159/161, áp lại quyết định ghép căn đã mất | C (+M duyệt) | Q12 | T2 |
| C0.2 | Thẻ duyệt: bỏ % và `ai_suggestion` mặc định; hiện `basis` mọi field; render ảnh PR #16; text đầy đủ | C | Q9 | T2 |
| C0.3 | Audit decide trong transaction + trường lý do | C | — | T2 |
| Z0.3 | Watchdog: cảnh báo tỉ lệ skip và phân bố p (đọc log hook) | Z | — | T1 |

### Đợt 1 — đo (Q11a)

| Mã | Việc | Làn | Phụ thuộc | Hạng |
|---|---|---|---|---|
| Z1 | **Đã giao** (`claudedp-2310-11`): hook đẩy mọi tin kèm `meta.kev {p, model, threshold, at}`; DATA-CONTRACT `schemaVersion 3` | Z | Q1 (đã quyết) | T3 |
| C1.1 | Nhận `meta.kev` ở importer + migration cột `kev_*` trên `stg_zalo_posts`; **transform dùng `meta.kev.p` làm một căn cứ**: ghi phát biểu `listing_intent` (method `kev@<model>`, kèm p) thay cho bỏ tin; ngưỡng lọc ở pipeline đặt theo số đo G0 — chưa đo thì không loại tin theo Kev, chỉ ghi nhãn; tin p thấp mà parser ra kind + giá vẫn thành tin rao | C | Z1 (hợp đồng v3), C1.2 (`listing_intent`) | T3 |
| C1.2 | Sổ taxonomy một nguồn → bảng `ref_*`, hằng TS/JS, enum prompt, nhãn UI, thuật ngữ CONTEXT.md «Loại hình»; lint chặn enum viết tay; VALIDATE các CHECK 025 | C | Q7, Q8 | T3 |
| C1.3 | Khung đánh giá: màn gắn nhãn mù `/ops/labels`, lưu nhãn (tầng A, không lên cloud), dev/test, lệnh `eval:classify`, đổ `dq_check_results` | C | C1.2 | T2 |
| M1 | Gắn nhãn G1/G2 (~400 tin), G3 (150 cặp) | M | C1.3 | — |
| M1b | Gắn nhãn G0 (400 tin cổng) | M | Z1, C1.3 | — |
| Z1.2 | Thu danh mục dự án · toà · mã căn (nguồn theo FRAMING D1, câu mở §7.4) vào raw + `stg_*` | Z | nguồn danh mục | T2 |
| C1.5 | Nạp danh mục vào `asset_nodes` thêm cấp **căn** (`unit`, mã căn ≈ RESO `UnitNumber`); khai `mappings.yaml` | C | Z1.2, C1.2 | T3 |
| C1.6 | Trích mã căn / toà / dự án từ tin (luật có `rule_id` + LLM có trích dẫn); thêm các trường này vào G1 | C | C1.3, C1.5 | T2 |
| C1.4 | Báo cáo số nền: precision/recall/phủ theo tầng × trường × nguồn × bậc trên `/ops/quality` | C | M1 | T2 |

### Đợt 2 — nền bền (Q2, Q3)

| Mã | Việc | Làn | Phụ thuộc | Hạng |
|---|---|---|---|---|
| C2.1 | Migration: cột khoá gốc trên `sale_offers`; bảng `field_assertions`; hàm phân xử + `provenance`; FK RESTRICT cho `property_offers/candidates`; `retired_at` thay DELETE (cả `listings`) | C | C1.2, Q2, Q3 | T3 |
| C2.2 | Parser phát biểu: mọi transform ghi phát biểu với `rule_id` + vị trí đoạn khớp; gỡ đóng băng `ENRICH_COLS`; transform-chotot duy trì street/bath/floor và ngừng ghi đè | C | C2.1 | T3 |
| C2.3 | Chuyển `enrichment_proposals` sang phát biểu (giữ 036 hoàn tác); quyết định người = H0 | C | C2.1 | T3 |
| C2.4 | E1 viết lại theo bậc: tên nhóm / mặc định dự án = H5; luật trong tin có `rule_id`; E2 chạy mù + bắt buộc trích dẫn nguyên văn (code kiểm), lấy lại `project_name` | C | C2.3, Q4 | T3 |
| C2.5 | Cổng tự áp theo số đo (ô ≥ ngưỡng mới tự áp); dưới ngưỡng vẫn hiện, gắn «suy ra / chưa xác minh» (FRAMING D4) | C | C1.4, C2.4, Q5 | T3 |
| C2.6 | **Đường theo từng tin cho P1** (FRAMING D4): hook → stg → parser/E1 → phát biểu → phân xử → hiển thị trong vài phút, thay lô 00:00; đo độ tươi p50/p95 | C (+Z nếu đổi nhịp nạp) | C2.1, C2.2, Z1 | T3 |
| C2.8 | Thời gian (§0.2 D-4): `observed_at` cho mọi phát biểu; trường `offer_status` (đang chào · hết hạn · đã bán) diễn giải + phân xử như mọi trường; lịch sử giá theo căn | C | C2.1 | T3 |
| C2.7 | Ghép tin căn hộ vào dòng danh mục (căn gốc từ danh mục); Stage A ô lưới chỉ còn cho nhà phố | C | C1.5, C1.6, C2.1 | T3 |

### Đợt 3 — người và căn nhà

| Mã | Việc | Làn | Phụ thuộc | Hạng |
|---|---|---|---|---|
| C3.1 | Thẻ duyệt v2 (§3.6): phát biểu theo bậc, đoạn trích tô trong toàn văn, ảnh, bất đồng mọi cặp, quyết định = H0 **và thành nhãn dạy model** (FRAMING D5) | C | C2.3, C0.2 | T2 |
| C3.5 | Cổng Invest hiện độ chắc từng căn/trường: «đã xác minh · suy ra · chưa biết» (FRAMING §3.2 chiều 6) | C | C2.5 | T2 |
| C3.2 | resolve-properties: `stable_key` bỏ giá/loại; đọc `must_link/cannot_link`; đưa P1 vào căn; sinh thẻ ghép căn từ ứng viên; judge-entity: ngưỡng là code, LLM chỉ giải thích, lưu model/trace | C | C2.1 | T3 |
| C3.3 | Thước giá phường × loại cho «Căn giá tốt» theo Q10 | C | C2.4 (P1 có loại), Q10 | T2 |
| C3.4 | Parser S03 sửa theo số đo: phường HCM, `area_basis`, «bán» dương tính giả, dùng tên nhóm làm H5 | C | C1.4 | T2 |
| Z3.1 | Gộp tin chỉ ảnh vào tin chữ liền trước cùng người gửi (collector) | Z | Z1 | T2 |
| Z3.2 | Chỉnh lại/huấn luyện Kev trên G0 (nếu giữ cổng làm bộ lọc rẻ) | Z | M1b | T2 |

### Đồ thị phụ thuộc

```
Đợt 0:  Z0.3  C0.1  C0.2  C0.3                    (song song, không phụ thuộc kiến trúc)
          │     │
Đợt 1:   Z1 ──► C1.1 ◄────── C1.2 ──► C1.3 ──► M1 ──► C1.4
          └──────────────────────────┴──► M1b ───────┘
Đợt 2:                      C1.2 ──► C2.1 ──► C2.2
                                       └────► C2.3 ──► C2.4 ──► C2.5 ◄── C1.4
Đợt 3:                                 C2.1 ──► C3.2
                                       C2.3 ──► C3.1
                                       C2.4 ──► C3.3        C1.4 ──► C3.4
                                       M1b  ──► Z3.2        Z1   ──► Z3.1
```

Song song tối đa 3–4 phiên: Đợt 0 chia {C0.1+C0.3}, {C0.2}, {Z0.3}; Đợt 1 chạy Z1 (đã giao) ∥ C1.2 → C1.3, rồi C1.1.
Hai đường găng: **đo** C1.2 → C1.3 → M1 → C1.4 → C2.5, và **căn gốc** Z1.2 → C1.5 → C1.6 → C2.7 (FRAMING D1). C2.6 (tức thời) chạy song song sau C2.2. Thời gian gắn nhãn của Mạnh nằm trên đường găng —
nên bắt đầu C1.3 sớm nhất có thể.

---

## 6. Trả lời của ZCode (qua điều phối liên làn, 23/10)

1. **Ngưỡng 0,9** chọn **tay** từ một lần kiểm ad-hoc 620 mẫu phiên 19/10 (recall 100% @0,9). Không có bench
   recall/fallout theo ngưỡng trong repo; ROADMAP A5 vẫn ⬜. ZCode đề xuất chọn ngưỡng từ phân bố p thật trong
   `meta.kev` sau khi Kev thành nhãn. *Ghi chú review*: phân bố p cho biết **chỗ nào cần lấy mẫu** (phân tầng theo
   khoảng p cho G0), nhưng không cho biết độ đúng — ngưỡng vẫn phải đặt từ nhãn G0 (A4, F3). Ngưỡng đó là ngưỡng
   lọc ở pipeline (PL5), không phải ở hook.
2. **Không có tập Zalo gắn nhãn chuẩn nào** — chỉ mẫu soát tay ad-hoc. (12 cặp `needs_llm` là ghép căn, khác loại.)
   → G0 làm từ đầu (PL7, việc gắn nhãn của đội).
3. **Mỗi event là một RawItem**, `sourceId = sha256(group|ts|text)`. ZCode đề xuất **không gộp tin chữ với tin ảnh ở
   raw** (giữ đúng event — khớp N1), mà gộp ở **transform** (làn Claude) theo khoá nhóm + người gửi + |Δts| < 2′.
   → PL28 chuyển sang làn Claude, gộp ở transform. Kèm lỗi mới **L20** (dưới).
4. **Chênh 547 / 367**: có thể do buffer 60 giây cộng tiến trình :9210 chạy tay, không tắt êm từ 21/10 (mỗi lần
   restart mất cả buffer — đúng lỗ `claudedp-2310-3`, nhánh collector-graceful-shutdown), tin trùng bị bỏ lúc ingest
   (gồm L20), và hai namespace `meta.agent` (`openclaw-hook` / `zalo-agent`) cần đếm tách. Đo đúng được sau khi
   triển khai tắt êm.

**L20 · Tin chỉ có ảnh trùng `sourceId`, tin sau bị bỏ lúc ingest** — Nặng · N1 · **làn ZCode** (đã giao sửa riêng)
- Tin chỉ có ảnh có `text` rỗng → hai tin ảnh cùng nhóm, cùng `ts` cho cùng `sha256(group|ts|text)` → bước dedup lúc
  ingest bỏ tin sau. Ảnh mất trước khi có snapshot — cùng họ lỗi với L06 (raw không đầy đủ).
- Hướng sửa thuộc ZCode: khoá phải phân biệt được hai event (id tin của Zalo, hoặc băm cả media).

## 7. Tham chiếu

### 7.0 Trạng thái quyết định (23/10) — đọc trước khi dựa vào tài liệu này

| Đã chốt (Mạnh) | Nơi ghi |
|---|---|
| Q1 Kev thành nhãn, không lọc; DATA-CONTRACT v3 | §4, §6 |
| FRAMING D1–D5 (danh mục, người dùng đầu là đội, căn hộ trước, P1 công khai + tức thời, thuê người được nhưng model gánh tối đa) | FRAMING §2.0, ROADMAP §3.13 |
| D6 là yêu cầu Mạnh nêu (AI Gateway, biết chi phí, trợ lý tính tiền riêng) — **cách làm cụ thể M1–M4 chưa chốt** | FRAMING §2.0, §0.4 |
| Sự thật 8 + thang bậc B0–B5, N0–N4 + bậc đích | FRAMING §3.4 |
| F2 (danh mục từ nhiều nguồn + từ tin), F5 (Mạnh và đội gắn nhãn) | §0.3 |
| F3 ngưỡng theo cận dưới Wilson (A 0,95 · B 0,90 · C 0,80); F6 thứ tự dọn (mỗi bước ghi DB vẫn chờ Mạnh gật) | §0.3 |

| **Còn chờ Mạnh** | Nơi ghi |
|---|---|
| Q2–Q12 của §4. §0.2 F *đề xuất* trả lời Q2, Q3, Q4, Q5, Q9, Q11 từ nguyên lý gốc — **chưa được duyệt**; Q7 (subtype), Q8 (tìm mua/thuê), Q10 (thước «Căn giá tốt» tạm) chưa bàn | §4, §0.2 F |
| F1: chọn **Vinhomes Ocean Park 1** làm lát đầu (đề xuất của review, Mạnh chỉ nói «dữ liệu đã có dự án và nhóm») | §0.3 |
| F4: độ tươi p50 ≤ 10′, p95 ≤ 30′; cửa sổ hiệu lực 14/7 ngày (đề xuất) | §0.3 |
| F7: số giờ công/tuần giữ bậc | §0.2 F |
| M1–M4 lớp model (sửa luật Local-first, tên nhóm không gửi cloud, Vercel AI Gateway, ADR trợ lý) | §0.4 |
| R1–R5 khung RESO (căn = UPI + Building, tin = Property; toà = `BuildingName`, phân khu = `ComplexName`; UPI kiểu VN; phường → `City`; lấy DD 2.1) | `reso-khung-phan-loai.md` §9 |
| Thang căn cứ 3 lớp, ghép căn là phát biểu, lát dọc thay đợt ngang (§0.2 D) — đề xuất, chưa duyệt riêng | §0.2 D |

**Cắt lượt**: bản phạm vi `phan-loai-2310` và lộ trình 31 hàng (PL1–PL31) + 6 mục chờ (PH1–PH6), kèm việc bật gói
road-map, nằm ở **nhánh riêng `claude/lo-trinh-phan-loai-2310`** (chạm `.claude/settings.json` → T3, cần hồ sơ và chữ
ký riêng). PR tài liệu này không chứa chúng.

### 7.1 Đối chiếu với audit hiện trạng 23/10 (`docs/audit/2026-10-23-hien-trang-va-lo-trinh.md`, PR #25)

Lưu ý tên: audit đánh số câu hỏi Q1–Q8 **riêng**, không trùng Q1–Q12 của review này.

**Khớp nhau**

| Điểm | Review | Audit |
|---|---|---|
| Tin giả trong canonical | L19, §0.3 | P7, P15 (xác nhận trên cloud và API công khai) |
| Làm sạch mock trước mọi việc đo | F6 bước 2, PL1/PL2 | 0.4 (chạy đầu tiên), 1.1 (đo nền chỉ sau khi hết mock) |
| Kev bỏ phần lớn tin | L06 (~70% theo log hook) | L13 (61% hôm nay theo `/ops/collections`) |
| Hoàn tác 639/644 | F6 bước 3 | §4 |
| Dựng lại `/ops/review` | PL3, PL23 (C3.1 thẻ duyệt v2) | gộp B1 Task 12 vào C3.1, không làm riêng |
| Đợt phân loại | lát Ocean Park 1, PL1–PL31 | Đợt 1 = `phan-loai-2310`, audit không chia lại |
| Đo trước, xây sau | Q11, §0.2 E | nguyên tắc sắp xếp §6 |
| 331 tin S03 không có phường | L17 | L8 (377 offer chưa gán area) |

**Khác hoặc bổ sung**

| Điểm | Review | Audit | Hệ quả cho review |
|---|---|---|---|
| Ranh giới khu vực sai (33 khu vực cấp tỉnh dưới `vn-hanoi`) | không phát hiện | L8, P5, việc 1.2 | Trường phường là trường lõi nhóm A; PL26 (thước phường × loại) và mọi so sánh theo phường phải chờ 1.2 |
| Giám sát báo sai (DB sập 8 giờ, job exit 0) | không xét | L5–L7, L10, việc 0.6 | Điều kiện của sự thật 8: không thấy lượt thu hỏng thì số đo nền không đáng tin — đo nền chờ 0.6 |
| Sổ migration, CI test module, backup | ngoài phạm vi | 1.3, 1.4, 0.8 | Nền vận hành cho lớp phát biểu (PL14–PL16 là T3 nhiều migration) — nên có 1.3 trước PL14 |
| S05 đứng từ 21/10 (402) | không xét | L10, Q8-audit | Lát đầu chỉ dùng S03 (+ S06 làm thước), khớp F1 |
| Lớp model / AI Gateway | PH4 — **chờ M1–M3** | §6 ghi «lớp model qua AI Gateway» trong đợt 1 | Chưa vào đợt 1 cho tới khi Mạnh chốt M1–M3; CM.1 sổ cuộc gọi (PL29) thì làm được ngay |
| Câu 4 của nhà đầu tư | FRAMING: **quản lý danh mục** | 2.5 «G4 khai thác sau mua» | Audit dùng tên cũ; theo FRAMING thì G4 là quản lý danh mục |
| Tạm đóng `/api/v1/deals` công khai | không có | 0.5, Q3-audit | Review ủng hộ: đến khi PL2 xong, API công khai đang phát tin giả |

### 7.2 Nguồn

- Khung RESO cụ thể hoá: `docs/architecture/reso-khung-phan-loai.md` (tra `dd-2.0.json`, `dd-2.1.json` ngày 23/10).


- Code: `collector/openclaw/handler.js` · `pipeline/transform-{zalo,fb,chotot,airbnb}.mjs` ·
  `pipeline/lib/write-offers.mjs` · `pipeline/resolve-properties.mjs` · `pipeline/refresh-bait-gap.mjs` ·
  `pipeline/mappings.yaml` · `agent/src/agents/{context-resolver,enrich-text,judge-entity}.ts` ·
  `agent/src/enrich/{route,run}.ts` · `app/src/components/ops/review-card.tsx` ·
  `app/src/app/api/v1/ops/review/[id]/decide/route.ts` · `app/src/lib/audit.ts`
- Migration: 025, 027, 029, 030, 031, 033, 034, 036, 039
- Tài liệu: ROADMAP §1, §3 · ADR-0007, ADR-0011 · `docs/research/enrichment-agent-design.md` ·
  `docs/superpowers/specs/2026-10-22-enrich-qua-de-xuat-design.md`, `2026-10-23-enrich-hau-ky-design.md`
- Bộ mẫu tin Kev bị skip (có SĐT người đăng, chỉ máy local): scratchpad phiên review, không commit.
