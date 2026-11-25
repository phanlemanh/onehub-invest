# Đọc gộp S03 song song có trần, trần thời gian riêng và lượt bù — thiết kế (HT6 `doc-gop-song-song-va-luot-bu`)

Ngày 24/11/2026 · dãy P3 · hạng T2 · giám sát giao gấp, đường găng S03.

## Vấn đề (đo trên DB máy thu và log, 24/11)

- Bước đọc gộp hằng ngày (`pipeline/doc-gop-hang-ngay.sh` → `agent/scripts/doc-gop-s03.ts hang-ngay`) gọi model **tuần tự**
  (`for … await hoiGop`, `agent/src/enrich/doc-gop-s03/chay.ts`). Sổ `ai_calls` 8 ngày: 26.671 lời gọi Haiku đường Anthropic,
  trung bình 7,3 s, p90 9,9 s, **0 lỗi gọi** (0 lỗi 429), 5 JSON hỏng.
- Một ngày có ~2.950 bài cần đọc → 21.000–28.000 s. Trần cả lượt 00:00 là 14.400 s (`scripts/zalo-import-daily.sh`, hồ sơ
  `s03-tran-thoi-gian-luot-nap`), đồng hồ TERM cả nhóm tiến trình. Đêm 23/11: đọc gộp bị TERM ở 14.400 s, enrich không chạy.
  Đêm 24/11: nạp hỏng vì DB không tới được. `enrich-text` không có dòng `ai_calls` nào từ 21/11.
- Cửa sổ chỉ «hôm qua + hôm kia» → bài ngày cũ hơn không bao giờ được đọc lại.

Tồn đọng đo bằng `hang-ngay --ngay <d> --thu` (chỉ đọc) lúc 23:4xZ 23/11:

| Ngày bài | Đơn vị | Đã đọc | Cần gọi | Ước USD (công thức) |
|---|---|---|---|---|
| 20/11 | 3.478 | 2.950 | 0 | 0 |
| 21/11 | 3.491 | 2.924 | 3 | 0,003 |
| 22/11 | 3.329 | 1.956 | **407** | 0,449 |
| 23/11 | 3.382 | 17 | **2.643** | 2,867 |
| 24/11 | (đang thu) | 0 | 93 lúc đo | 0,102 |

Ước công thức thấp hơn giá thật: đêm 21/11 chi 4,18 USD cho 2.950 lời (~1,42 mUSD/lời) so với ước ~1,08 mUSD/lời.
Lượt bù 22–23/11 (~3.050 lời) ≈ **4,3 USD theo giá thật**, trong trần 20 USD/ngày chi đã duyệt (hồ sơ `doc-gop-hang-ngay`).

## Phương án

### 1. Gọi song song có trần (`chayLuot`)

- Thêm `songSong` (số lời gọi cùng lúc). Mặc định của lệnh `chay` giữ 1 (hành vi PL30 không đổi); `hang-ngay` và `bu` nhận
  `--song-song N`, bước đêm truyền `DOC_GOP_SONG_SONG` (mặc định **4**).
- Hàng đợi việc + N công nhân trong một tiến trình. Không đổi `hoiGop`: mỗi lời gọi vẫn một dòng `ai_calls`, vẫn ghi
  `silver_labels` bằng `SQL_GHI_DOC` ngay sau lời gọi.
- **Trần tiền giữ chỗ trước**: trước khi phát một lời, cộng ước của nó (max(ước công thức, tiền thật lớn nhất đã gặp)) vào phần
  «đang giữ»; phát chỉ khi `đã chi + đang giữ + ước ≤ trần`. Xong lời thì trả phần giữ, cộng tiền thật. Song song không làm vượt
  trần hơn bản tuần tự.
- **Lớp dừng** (hết tiền, khoá sai): ngừng phát lời mới, chờ các lời đang bay xong. Tự lùi đường (`tu_lui`): chỉ công nhân đầu
  tiên gặp lỗi chuyển đường (một dòng `chuyen-duong`), bài lỗi được xếp lại hàng đợi, không mất bài.
- **429 (`han-muc`)**: SDK Anthropic đã tự thử lại 2 lần. Khi vẫn lỗi: bài không ghi (lượt sau đọc lại), hạ số công nhân đi một
  (tối thiểu 1) và tạm dừng phát 30 s. Sau 60 s không có 429 mới thì tăng lại một, tới số đã đặt. Lượt không dừng.
- Kết nối DB: một `pg.Client` dùng chung (node-postgres xếp hàng truy vấn). Ghi nhãn là câu lệnh đơn, không giao dịch nhiều câu.

### 2. Trần thời gian riêng của bước đọc gộp

- `pipeline/doc-gop-hang-ngay.sh` tính **một** mốc hết giờ cho cả hai bước: bây giờ + `DOC_GOP_TRAN_GIAY` (mặc định **9.000 s
  = 2,5 giờ**), truyền `--het-gio <ISO>` cho bước hôm qua và hôm kia.
- `chayLuot` không phát lời mới sau mốc; lời đang bay chạy xong (mỗi lời tối đa 240 s). Bài còn lại không ghi gì — lượt sau
  đọc tiếp nhờ luật «đã đọc» sẵn có.
- `hang-ngay` hết giờ: **thoát 75** («dừng đúng hẹn, đi tiếp»), in `JOB WARN [doc-gop-hang-ngay] het-gio: <ngày> con lai <n> loi goi`,
  tóm tắt mang `het_gio: true`. Bước hôm qua hết giờ thì bước hôm kia bỏ, in `JOB WARN … het-gio: bo buoc hom-kia <ngày> con lai <n>` (n đếm bằng
  `hang-ngay --thu`, không gọi model) — ngày ấy sẽ rơi khỏi cửa sổ, chỉ cứu được bằng lượt bù, tệp thoát 75.
- Vì sao 75: thống nhất với ZCode qua LL 24/11 (GS giao ZCode lưới chia trần trong `scripts/zalo-import-daily.sh`, GIAO claudedp-2311-5).
  Script gọi coi 75 là đi tiếp, không đưa vào mã lượt; đặt `DOC_GOP_TRAN_GIAY` = đồng hồ riêng của bước trừ ≥ 300 s, nên TERM chỉ là
  lưới cuối. Dừng đúng hẹn không mất dữ liệu: lượt sau đọc tiếp nhờ luật «đã đọc». Mã lỗi khác giữ nguyên (0 · 1 · 2 · 3 · 4 · 5).
- Ngân sách lượt 00:00: nạp + transform 5–25 phút · đọc gộp ≤ 2,5 giờ (+ tối đa 4 phút lời đang bay) · enrich ~30 phút
  (1.842–2.576 s các đêm 19–21/11) → dưới 3 giờ 40, trong trần 4 giờ.
- Sức chứa: 4 lời cùng lúc × 9.000 s / 7,3 s ≈ 4.900 lời — đủ một ngày thường (~2.950) kèm phần hôm kia.

### 3. Lượt bù theo khoảng ngày

- Lệnh mới `doc-gop-s03.ts bu --tu YYYY-MM-DD --den YYYY-MM-DD [--song-song N] [--tran-ngay-usd 20] [--tran-luot-usd X] [--het-gio ISO] [--thu]`.
- Chạy `chayHangNgay` cho từng ngày từ cũ tới mới. Chung trần ngày chi với lượt đêm (`chiNgay` cộng mọi run_id `pl34-<ngày chi>-…`).
  run_id của lượt bù `pl34-<ngày chi>-b<ngày bài>-bu-<ISO>` để đếm và tìm lại.
- `--thu`: in từng ngày và dòng tổng (đơn vị, đã đọc, cần gọi, USD ước), không gọi model, không ghi, không đòi khoá.
- Khoảng sai (sai khuôn, `--tu` sau `--den`, dài hơn 14 ngày) → thoát 2 trước khi nối DB.
- Lượt bù thật là **tiền** → chỉ chạy tay từ `main` sau khi Mạnh ký Cổng Bằng chứng, theo hồ sơ áp (contract «Áp lên máy thu»).

### 4. Khoá một lượt đọc gộp

- Lượt thật (`hang-ngay`, `bu`) lấy `pg_try_advisory_lock` trên một khoá cố định ngay sau khi nối DB, giữ tới hết lượt (khoá theo phiên
  DB, tự nhả khi tiến trình chết). Không lấy được → thoát **6**, dòng `JOB FAIL [doc-gop-s03] dang-co-luot-khac`, chưa gọi model.
- `--thu` không lấy khoá. Chặn được hai tiến trình cùng đọc một ngày (lượt bù lỡ chạy vào giờ lượt đêm) → không gọi đôi, không
  hai bên cùng giữ chỗ tiền vượt trần ngày chi.

### 5. Lượt bù có trần riêng

- `bu` nhận `--tran-luot-usd` (trần cho riêng lượt áp, bên cạnh trần ngày chi). Lượt áp 22–23/11 dùng 6 USD.

## Không làm

- Không sửa `scripts/zalo-import-daily.sh`, plist, trần 4 giờ của lượt.
- Không đổi prompt, bảng chọn model, luật «đã đọc», luật khử trùng, trần USD 20/ngày.
- Không nới cửa sổ «hôm qua + hôm kia» thành tự động bù (bù là việc tay có chủ đích, tốn tiền).
- Không song song hoá `enrich-run` (đã chạy trong trần).

## Đặc tả UX

Bỏ — lệnh dòng lệnh và bước shell, không có mặt người nhìn (dòng sổ `descope`).
