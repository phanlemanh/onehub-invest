# bai-nhan-tru-bai-chi-anh (DF6) — thiết kế

Hồ sơ: `_acceptance/bai-nhan-tru-bai-chi-anh/`. Hàng DF6 của `docs/plan/lo-trinh.json` (đợt `s03-ket-0911`, PR #379),
Mạnh duyệt 09/11 qua phiên DA «Truy kẹt S03». Căn cứ số đo: ghi chú `s03-ket-truong-loi-va-anh-20261109.md` (snapshot
22:42Z 08/11) và đo lại 09/11 trên DB máy thu (chỉ đọc, bằng chính hàm của transform).

## 1. Vấn đề

Chặng «Bài nhận → Đọc được» của S03 trên `/ops/data-flow` hiện 43% («Theo dõi · đọc»). Mẫu số là mọi bài nhận, trong
đó có hai loại bài không phải «bài đọc hỏng»:

- **Tin nhắn chỉ có ảnh** (album: mỗi ảnh một tin, chữ chỉ là URL). Đo 09/11: 43.948 / 110.368 bài. PL28 đã ghép
  24.054 bài trong số đó vào một tin (ảnh của chúng nằm trên tin) — chúng không cần đọc, nhưng vẫn bị tính là rơi.
- **Bài Yêu cầu mua/thuê** (bên mua — CONTEXT «Yêu cầu»): transform loại đúng (`suyLoai` → `yeu-cau`), nhưng Sankey vẽ
  chúng trong nhánh «Không đọc được».

## 2. Cách tính (một định nghĩa, hai nửa)

Nhánh của từng bài S03 tính bằng CHÍNH các hàm của transform — không chép luật sang SQL:

| Nhánh | Định nghĩa | Hàm thật |
|---|---|---|
| Đọc được | bài nằm trong `post_ids` của một tin S03 (như cũ) | 600 |
| Ảnh đã ghép vào tin | bài chỉ-ảnh, PL28 gán vào bài chữ gần nhất cùng người, cùng nhóm, dưới 2 phút, và bài chữ ấy thuộc một tin S03 | `laChiAnh` + `baiAnhCuaTin` (`transform-media.mjs`) |
| Đọc thành Yêu cầu | bài có chữ, `parsePost` không ra loại, `laYeuCau` đúng — đúng nhánh `yeu-cau` của `suyLoai` | `parsePost`, `laYeuCau` (`transform-zalo.mjs`) |
| Ảnh chưa ghép | bài chỉ-ảnh không vào tin nào (không có bài chữ gần, hay bài chữ gần không thành tin) | phần bù |
| Không đọc được | phần còn lại (chat, thiếu giá, giá phi lý…) | phần bù |

Thứ tự ưu tiên: «Đọc được» thắng mọi nhánh (tin đọc từ lượt transform cũ vẫn là tin) — nên các nhánh rời nhau và
**tổng năm nhánh = bài nhận** theo cấu trúc.

**Chỗ đặt.** `pipeline/lib/nhanh-bai-s03.mjs` (mới) tính nhánh cho mọi bài S03 thật (gạt bài thử bằng `loadStgPosts`),
nạp vào bảng TẠM `flow_s03_branch(post_id, branch)` của phiên và đặt `oneinvest.flow_branch = 'on'`.
`pipeline/refresh-data-flow.mjs` (bước `refresh-data-flow` của cloud-sync) gọi nó trước khi chạy tệp SQL. `600_data_flow.sql`
tạo bảng tạm nếu chưa có, rồi đếm theo (cửa sổ, nguồn), (nguồn, ngày), (cửa sổ, nhóm). Đo 09/11: phần JS chạy ~7 giây
trên 110 nghìn bài.

Lối đã loại:
- *Chép luật sang SQL*: `parsePost` (hàng trăm dòng regex JS, `\b` chỉ ASCII) không chép được mà giữ nghĩa — số SQL sẽ
  lệch bộ đọc thật.
- *Lưu kết quả theo bài ở transform*: cần bảng mới (migration, đường T3), chạm `transform-zalo`/`transform-media` của
  làn khác, vượt hàng.

**Chạy 600 không qua bộ chạy** (bài kiểm cũ, chạy tay): bảng tạm rỗng, cờ tắt → ba khoá nhánh ghi `null`, mọi số khác
không đổi. Trang thấy `null` thì vẽ như trước DF6 kèm một dòng «Chưa tách bài chỉ-ảnh và Yêu cầu — có ở lượt làm tươi
kế», không đoán số. Bước cloud-sync luôn đi qua bộ chạy (đã có ca canh dòng `job_run … 600_data_flow.sql`).

## 3. Số mới trong khối `facts`

Thêm vào mỗi phần tử `sources`, `days`, `groups` (S05, S06 luôn 0; khối đời trước thiếu khoá → `null`):

- `imageMerged` — Ảnh đã ghép vào tin;
- `inquiry` — Đọc thành Yêu cầu (đầu ra ngang tin rao);
- `imageUnmerged` — Ảnh chưa ghép.

Không thêm khoá cấp trên (`FLOW_FACT_KEYS` giữ nguyên); push-ops-facts chở nguyên `facts` lên cloud nên cloud có cùng số.

**Mẫu số mới** «bài cần đọc» = `received − imageMerged`. Tỉ lệ «Đọc được» ở Sankey, lưới chất lượng (nguồn và nhóm thu,
kể cả kiểm «Kẹt/Theo dõi · đọc») và ô «Đọc được» của «Chặng theo ngày» đều chia cho nó (một hàm `toReadOf`).

**«Đọc được» = đọc thành tin rao + đọc thành Yêu cầu** (Hỏi-2, Mạnh chốt ở Cổng Phạm vi 09/11: Yêu cầu là loại quan
trọng song song với tin — đầu ra ngang tin rao, không phải nhánh rẽ). Tử số ở trang là `readable + inquiry` (`readOf`);
khoá `readable` của khối vẫn chỉ là bài thành tin (số cũ không đổi nghĩa).

**Hỏi-1 còn mở** (nháp theo khuyến nghị): ảnh CHƯA ghép có ở mẫu số không? Khuyên có — ghi chú hàng: ảnh chưa ghép «vẫn
tính là rơi», và phần lớn là ảnh tin rao bị rơi do ghép ảnh yếu → 68,1%. Lối khác: bỏ mọi bài chỉ-ảnh → 88,5%. Vế
SỐNG/CHẾT [đề xuất] của `opportunity.md` chỉnh theo câu trả lời trước khi chốt ngưỡng UAT.

**Kỳ vọng số** (đo 09/11, cửa sổ «Tất cả»): bài cần đọc 86.316, đọc thành tin rao 47.392, đọc thành Yêu cầu 11.377 →
**68,1%** (trước DF6: 42,9% tin rao trên bài nhận).

## 4. Sankey

```
Nguồn → Bài nhận ─┬─ Ảnh đã ghép vào tin            (gộp, không phải mất)
                  └─ Bài cần đọc ─┬─ Đọc thành tin rao ─┬─ Tin rao mới → mức nhận diện (như cũ)
                                  │            └─ Gộp vào tin đã có
                                  ├─ Đọc thành Yêu cầu (đầu ra ngang tin rao; chưa đi tiếp: bảng Yêu cầu chưa có)
                                  ├─ Ảnh chưa ghép     (rơi)
                                  └─ Không đọc được    (rơi)
```

Thêm một cột «Bài cần đọc» để mẫu số thành một nút nhìn thấy: tỉ lệ bước của «Đọc được» (bảng đọc khi rê chuột) và chú
thích cột cùng chia cho nó, không phải ngoại lệ trong mã. Khối đời trước (khoá `null`) → không có cột này, cây như cũ.
Gợi ý nút «Không đọc được» bỏ chữ «hỏi mua» (đã có nhánh riêng).

## 5. Ngoài phạm vi

- GT0 (mã album S03) và đổi cửa sổ ghép của PL28 — số ảnh đã ghép tăng khi chúng vào; DF6 chỉ đếm.
- DF5 (phường thật trong trường lõi), NH2 (ảnh hết hạn) — hàng riêng, đi sau vì cùng tệp 600.
- Bảng Yêu cầu (`inquiry_records`, hàng bang-yeu-cau, migration 058 chưa áp) — khi có, nhánh Yêu cầu có thể đọc bảng;
  DF6 dùng hàm của transform.
- S05 (bài Facebook) và S06 — không đổi số.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: `/ops/data-flow` → khung «Đường ống» (Sankey) → rê chuột «Bài cần đọc», «Đọc được» → bảng đọc tỉ lệ bước → lưới «Chất lượng từng chặng» (điểm ra: nhãn sức khoẻ S03)
- Biên: khối đời trước chưa có nhánh → cây cũ + một dòng «Chưa tách bài chỉ-ảnh và Yêu cầu»; chọn chỉ S06 → không có nút nhánh S03 (số 0 bị bỏ)
- Lỗi & quay lại: bước làm tươi hỏng → cảnh báo số cũ như hiện có (DF dong-chay-so-cu), không đổi

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Dòng chảy dữ liệu (`/ops/data-flow`) | thấy bài rơi ở chặng nào, vì sao | thanh bên Ops / bảng tin, hồ sơ tin |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-nhanh-day-du | Dòng chảy | Sankey có «Ảnh đã ghép vào tin», «Bài cần đọc», «Đọc thành tin rao», «Đọc thành Yêu cầu», «Ảnh chưa ghép», «Không đọc được»; «Đọc được» ghi (tin rao + Yêu cầu) và % trên bài cần đọc | rê chuột xem tỉ lệ bước; xem nhãn sức khoẻ S03 |
| ST-khoi-doi-truoc | Dòng chảy | Sankey như trước DF6 + dòng «Chưa tách bài chỉ-ảnh và Yêu cầu — có ở lượt làm tươi kế» | chờ lượt làm tươi |
| ST-chi-s06 | Dòng chảy | Không nút nhánh S03 (số 0 bị bỏ), cột «Bài cần đọc» = bài nhận | — |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Tỉ lệ «Đọc được» ở mọi chỗ trên trang chia cho «bài cần đọc» (bài nhận trừ ảnh đã ghép vào tin).
- Nút có số 0 bị bỏ như hiện nay; dòng chảy bảo toàn ở mọi nút.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| Sankey «Đường ống» (`flow-sankey-data.ts`, chuyển thể @reui/chart-49) | mở rộng | thêm nút/cột vào dữ liệu, giữ nguyên khung vẽ |
| Lưới chất lượng (`quality-rows.ts`) | mở rộng | đổi mẫu số kiểm «đọc» |
| «Chặng theo ngày» | mở rộng | đổi mẫu số ô «Đọc được» |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng điều khiển phân tích (dashboard) — giữ nguyên
Căn cứ: trang DF0 đã chốt khuôn; DF6 chỉ đổi số và nút trong khung có sẵn.

### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | người Vận hành |
| Việc chính | thấy chặng nào làm rơi bài S03 và vì sao, để biết sửa đâu |
| Tần suất | mỗi ngày |
| Số bản ghi | hàng trăm nghìn bài, ba nguồn |
| Thiết bị | máy tính |
<!-- UX-SPEC-TEMPLATE>>> -->
