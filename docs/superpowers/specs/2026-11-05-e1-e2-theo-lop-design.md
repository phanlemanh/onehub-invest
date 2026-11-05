# Thiết kế: E1 phát biểu theo lớp, E2 đọc mù ra mảng căn (PL18)

Hồ sơ `_acceptance/e1-e2-theo-lop`. Mạnh duyệt đặt hàng này trước `GCQ1` ngày 05/11 (`docs/plan/pham-vi-gom-tach-gop-tin-0511.md`).

## Kết luận

S03 đang coi mỗi bài là một căn. Bài rao nhiều căn thành một tin với một giá ngẫu nhiên, và đây là nhóm sai nặng đã đo. Vòng này làm ba việc:

1. E1 nói rõ căn cứ của mình thuộc lớp nào. Tên nhóm và mặc định dự án là suy luận, không bao giờ thành quan sát.
2. E2 đọc mù và trả về mảng căn, mỗi giá trị kèm trích dẫn. Trường độ tự tin bị bỏ.
3. Mỗi căn của bài nhiều căn thành một tin có khoá riêng, phát biểu riêng, và cột của tin vẫn do bộ phân xử dựng.

**Thi công chờ nhãn `multi_unit`.** `eval_labels` hiện 0 dòng. Điều kiện mở thi công và đóng hàng là một câu hỏi trên thẻ Cổng Phạm vi.

## Số đo nền (DB máy thu, 05/11)

| Đo | Số | Ghi chú |
|---|---|---|
| Sai nặng khi đọc S03 | 4/30, đều là bài nhiều căn | Khoảng tin cậy 5,3–29,7%, mẫu nhỏ |
| Bài chữ, bài vào tin, tin sống | 52.438, 33.670, 4.043 | Số giám sát cấp |
| Tin có ít nhất 2 cụm giá khác nhau | 630/4.043 | Biểu thức thô trên bài mới nhất, là ứng viên, không phải tỉ lệ thật |
| Tin có ít nhất 3 cụm giá | 336/4.043 | Như trên |
| Ứng viên chặt hơn (2 giá và 2 loại căn, hoặc 3 giá) | 366/4.043 = 9,1% | Như trên |
| Chi phí lượt đọc LS1 | 2,088 USD cho 5.042 bài | Khoảng 0,0004 USD/bài, câu trả lời một căn |

**Chưa đo được:** tỉ lệ bài nhiều căn thật, độ đúng theo từng căn. Hai số này cần nhãn người.

## Mã hiện tại sai ở đâu

| Chỗ | Hiện trạng | Hậu quả |
|---|---|---|
| `resolvePropertyType` (`agent/src/agents/context-resolver.ts`) | Quét `chữ bài + tên nhóm`, có luật mặc định theo dự án | Căn cứ của kênh được dùng như căn cứ của tin |
| `apply_enrichment` (migration 063) | Đề xuất không phải của người luôn ghi `evidence_tier = observed` | Suy từ tên nhóm đi qua đề xuất thành quan sát |
| `buildEnrichInput` (`agent/src/agents/enrich-text.ts`) | Mồi tên dự án và khu vực của E1 vào prompt | Hai phiếu không độc lập, chứng thực vòng tròn |
| `needsLLM`, trường `confidence` | E1 đủ thì bỏ E2; model tự khai độ tin | Không kiểm chéo; số tự khai không có nghĩa |
| `SYSTEM` của `doc-toan-bo.ts` | Trả một object | Bài nhiều căn chỉ ra được một bộ giá trị (`chungBai` phải bỏ so sánh) |
| `offer_subject_keys` | Chủ thể của tin là mọi post của tin | Hai tin chung một bài sẽ nhận phát biểu của nhau |

## Thiết kế

### E1 theo lớp

`ContextResult` thêm `typeLayer`: `tin`, `nhom`, `du-an`. Luật quét chữ bài và tên nhóm tách làm hai bước, chữ bài luôn xét trước.

- Lớp `tin`: phát biểu quan sát, `rule_id` `loai-hinh-chu`, như hôm nay.
- Lớp `nhom`, `du-an`: phát biểu suy luận, `rule_id` `loai-hinh-nhom` và `loai-hinh-du-an`, không tự áp thành đề xuất `direct`.
- `apply_enrichment` đọc lớp từ `evidence` của đề xuất, thay cho `observed` cố định. Migration 078 sửa hàm này.

### E2 mù, ra mảng căn

Prompt mới `dtb-s03-v2`, lưu ở `silver_labels` như LS1, không thêm bảng nhãn.

```
{"intent":…,"units":[{"kind":…,"property_type":…,"quote_loai":…,"price_vnd":…,"quote_gia":…,"area_m2":…,"quote_dt":…,
  "bedrooms":…,"quote_pn":…,"block":…,"unit":…,"quote_ma":…}]}
```

- Không có `confidence`. Có trong câu trả lời thì bỏ qua.
- Chữ gửi đi vẫn qua `gatChu`. Không có tên nhóm, dự án, khu vực hay kết quả E1. Luật cấm áp cho cả `buildEnrichInput` và bỏ `needsLLM`.
- Bộ đọc cũ giữ phân loại: Kev và luật đủ thì không hỏi LLM cho ý định, đúng ghi chú của hàng.

### Giá trị chỉ được tính khi trích dẫn có thật

- Mọi giá trị đi qua `trichCoThat(quote, chữ đã gạt)`. Trích dẫn giả làm rơi giá trị đó, không phải cả căn.
- **Giá, diện tích, số phòng do luật xác định đọc lại từ chính câu trích.** Model chỉ khoanh đoạn; số là của parser. Một căn lệch thì cả bài không tách và lên một thẻ cho người, vì tách một phần sẽ làm mất căn còn lại. Đây là cách giữ luật 7: LLM không ghi số vào dữ liệu.
- Một bài chỉ tách khi có ít nhất 2 căn, và mỗi căn có câu trích giá hoặc câu trích mã căn riêng, không chồng lên nhau.

### Khoá và phát biểu theo căn

- Thứ tự căn `n` là thứ tự vị trí câu trích đầu của căn trong chữ bài.
- `originating_system_key` của tin mới: `<post_id>#<n>`. `offer_id` vẫn là `mintOfferId` (PL14).
- Chủ thể phát biểu: `S03:<post_id>#<n>`. `apply_enrichment` đã dùng khoá tin làm chủ thể nên không phải đổi phần này.
- Migration 078 thêm `sale_offer_records.unit_refs text[]` và sửa `offer_subject_keys`: tin có `unit_refs` chỉ nhận phát biểu của các căn đó, không nhận phát biểu cấp bài.
- `post_ids` giữ nguyên là mã bài, vì khoảng 25 tệp đang đọc cột này (ảnh, thẻ duyệt, đồng bộ cloud).
- Mọi cột loại hình, phòng ngủ đi qua `resolve_offer_fields`, không ghi thẳng.

### Tin cũ, đăng lại, nạp lại

- Tin cũ của bài bị tách nghỉ với lý do `tach-nhieu-can`, `superseded_by` trỏ căn đầu. Mọi căn nhận khoá mới. `assignOfferIds` không cho căn thừa kế từ tin gộp, vì tin gộp mang giá của căn khác và thẻ chờ tạo từ cả bài.
- Thẻ chờ của tin cũ đóng có lý do. Đề xuất và phát biểu cũ giữ làm lịch sử, không chảy sang căn.
- Bài đăng lại: mỗi căn đi qua `repostKey` riêng. Hàng `GT4` mới chấm khoá này, vòng này không đổi luật gom.
- Nạp lại: transform đọc nhãn đã lưu theo `TACH_VERSION`, không gọi model. Đổi hằng này là một thay đổi mã, phải đo lại.

### Cổng nằm trong transform

Nhãn có sẵn không đủ để tách, vì `--thu` cũng ghi nhãn. Transform chỉ tách khi `ops_audit` có dấu `tach:mo` đúng `TACH_VERSION`, cùng khuôn với dấu `phat-bieu:cat-chuyen`. Chỉ lệnh mở cổng ghi dấu này, sau khi đủ mọi điều kiện đo. Không có dấu thì transform chạy như hôm nay.

### Hoàn tác

`--hoan-tach <run_id>` nghỉ tin của căn, cho tin cũ sống lại, rút phát biểu căn, và ghi `tach:chan` theo từng bài để lượt nạp sau không tách lại. Không xoá dòng nào. Đồng bộ cloud đi theo trạng thái nghỉ.

### Đo trước khi ghi

Lệnh chạy theo bốn nấc:

| Nấc | Làm gì | Ghi | Khi nào |
|---|---|---|---|
| `--thu` | Đọc bằng model, in dự kiến và chi phí | Chỉ nhãn | Trước Cổng Bằng chứng, cần lời Mạnh vì tốn tiền |
| `--mau`, `--bang-doi-chieu` | Đo trên nhãn người, in bảng đọc tay | Tệp gitignored | Sau `--thu` |
| `--mo-cong` | Kiểm đủ điều kiện, ghi dấu `tach:mo` | Một dòng `ops_audit` | Sau chữ ký |
| Transform | Tách, ghi tin và phát biểu | Có | Sau `pg_dump`, cần lời Mạnh |

Phép tính của cỡ mẫu (Wilson 95%):

| Câu | Số | Vì sao |
|---|---|---|
| Sàn để nhánh đóng phần tách bắn được | 125 nhãn ngẫu nhiên | 0/124 cho cận trên 3,01%, 0/125 cho 2,98% |
| Sàn nhãn Có và bài máy nhận | 30 mỗi loại | 29/30 cho cận dưới 0,83; 28/30 cho 0,79 |
| Đọc tay từng căn | 27/30 | Cận dưới 0,74; 26/30 cho 0,70 |

Lát `s03-theo-nhom` đã sinh 367 bài là mẫu đo tỉ lệ và độ phủ. Mẫu theo nhóm, không ngẫu nhiên trên toàn bộ, nên tỉ lệ chỉ đại diện cho các nhóm đó. Thiếu bài máy nhận thì dồn thêm ứng viên, chỉ tính vào độ chính xác, không tính vào tỉ lệ hay độ phủ.

## Các phương án đã loại

| Phương án | Vì sao loại |
|---|---|
| Ghi `<post_id>#<n>` vào `post_ids` | Khoảng 25 tệp đọc cột này như mã bài, sẽ hỏng ảnh, thẻ duyệt, đồng bộ cloud |
| Rút phát biểu cấp bài thay vì sửa `offer_subject_keys` | Rút cả dòng của người, không hoàn tác gọn |
| Cho model ghi thẳng giá của từng căn | Phạm luật 7 |
| Dùng biểu thức đếm cụm giá để tách | Đếm cụm giá không biết giá nào của căn nào; chỉ dùng làm số ứng viên |
| Bảng `post_units` riêng | Chưa có số cần nó; nhãn đã lưu theo phiên bản là đủ để nạp lại ổn định (luật 11) |
| Một căn thừa kế `offer_id` của tin gộp | Thẻ chờ và đường dẫn cũ sẽ gắn vào một căn tuỳ ý, hoàn tác không gọn |

## Kiểm theo 8 câu của ADR-0013

1. **Lớp:** giá trị thuộc tin (`Property`), mỗi căn của bài là một tin. Vòng này không tạo bản ghi căn vật lý.
2. **DD 2.1:** không thêm field chuẩn mới; `OriginatingSystemKey` đúng nghĩa. `unit_refs` là cột nội bộ, không phải field RESO, không lộ qua API.
3. **Khoá:** `<post_id>#<n>` suy từ bài bất biến và nhãn đã ghim, không từ giá hay nội dung đổi được.
4. **Ai ghi:** máy ghi phát biểu; chỉ bộ phân xử ghi cột chuẩn. Giá và diện tích theo đường cũ của transform, nhưng do parser đọc từ câu trích.
5. **Nguồn gốc:** mỗi phát biểu mang câu trích trong `evidence`.
6. **Thời gian:** đổi khoá, nghỉ tin đi qua đối soát có sẵn của `writeOffers`.
7. **Nâng bậc:** đưa tin bài nhiều căn từ «một giá ngẫu nhiên» lên «mỗi căn có giá có trích dẫn», cùng bậc B của tin. Thước: độ đúng theo từng căn.
8. Câu còn lại của ADR-0013 kiểm khi lập kế hoạch thi công.

## Đụng ai

| Việc | Tệp chung | Cách xử |
|---|---|---|
| `ghep-anh-tren-the-gan-nhan` | `gop-anh`, `label-sample`, `labels` | Vòng này không đụng ba chỗ đó |
| `khu-trung-anh-tin` | `media-rows`, `transform-media` | Không đụng; ảnh vẫn đọc `post_ids` |
| `SV2` | `pipeline/transform-zalo.mjs` | Xếp nối tiếp, giám sát quyết thứ tự |
| Hàng 4 kiểm định gộp trùng | `repostKey` | Làm sau vòng này |
