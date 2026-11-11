# Tạm dừng, bật lại nguồn từ cloud (TV4b `tam-dung-nguon-tu-cloud`) — thiết kế

Ngày 2026-11-12 · Hàng TV4b (T2) của `docs/plan/lo-trinh.json`, mốc TVM1 · Đứng trên TV4 `so-lenh-bo-ap` (đã gộp,
#414) và TV2b `cong-tac-that` (đã gộp) · Ô cơ hội: `_acceptance/tam-dung-nguon-tu-cloud/opportunity.md` (Mạnh
«Build cả bốn», 10/11).

## Bài toán

TV4 dựng xong đường lệnh kéo: cloud ghi lệnh `source.pause`/`source.resume`, máy thu kéo về, áp đúng một lần, báo kết
quả kèm trước/sau. Nhưng chưa có màn nào để bấm: muốn tạm dừng S05 vẫn phải gọi API tay. Ca thật 21–24/10: S05 hết
credit, chỉ Mạnh tạm dừng được bằng UPDATE tay. Hàng này đặt nút lên `/ops` ở cloud và cho người bấm thấy lệnh đi tới
«đã áp lúc HH:MM» kèm trạng thái trước và sau.

## Các mảnh

```
/ops/collections (cloud và máy thu)
  Lưới «Sức khoẻ nguồn» (FeedsGrid)  ── cột Thao tác: [Tạm dừng] (vai ops, nguồn đang chạy)
                                                     [Bật lại]  (vai admin, nguồn tạm dừng)
     └─ Hộp thoại xác nhận: trước → sau, ô Lý do (bắt buộc), [Gửi lệnh]
           POST /api/v1/ops/change-requests {type, target, payload:{reason}, tu_duyet:true, idempotency_key}
  Vùng «Lệnh gần đây» (mới) ── GET /api/v1/ops/change-requests (đã có, kèm last_pull_at)
     mỗi lệnh một dòng: nguồn · loại · người gửi · lý do · tiến trình (nhãn từ hàm thuần trangThaiLenh)
     lệnh S03 chờ người thứ hai: [Duyệt] [Từ chối] cho admin khác người gửi → POST …/[id]/decide (đã có)
```

### Cloud — route tạo lệnh nhận `tu_duyet`

- `POST /api/v1/ops/change-requests` nhận thêm khoá tuỳ chọn `tu_duyet: true`: người gửi xác nhận trên hộp thoại đã
  xem trước/sau (ADR-0015 §6 «luôn phải qua bước xem diff»). Khi `tu_duyet` và đích KHÔNG phải `S03`, lệnh vào thẳng
  `approved` (`approved_by` = người gửi, `decided_at = now()`), hai dòng audit `change_request.create` +
  `change_request.decide` cùng giao dịch. Đích `S03` thì `tu_duyet` bị bỏ qua: lệnh ở `submitted`, chờ người thứ hai
  (§4.8 #1); route `decide` đã chặn người gửi tự duyệt S03.
- Quyền không đổi: gửi `source.pause` từ vai `ops`, `source.resume` từ `admin` (route đã có). `tu_duyet` không mở
  quyền nào mới ngoài việc người gửi tự duyệt lệnh của chính mình cho loại «tạm dừng/bật lại» không chạm S03.
- Thiếu `tu_duyet` → hành vi TV4 giữ nguyên từng chữ (`submitted`).

### Hàm thuần `app/src/lib/lenh-hien.ts`

- `trangThaiLenh(cmd, lastPullAt, nowMs)` → `{nhan, giai_thich?, tone, truoc_sau?}`: một nhãn cho mỗi trạng thái của
  máy trạng thái ADR §5 cộng hai ca phụ — «Chờ người thứ hai duyệt» (S03 `submitted`), «Chờ duyệt» (`submitted` khác),
  «Chờ máy thu nhận» (`approved`), «Máy thu đã nhận lúc HH:MM» (`queued`), «Đã áp lúc HH:MM» + «Đang chạy → Tạm dừng»
  (`applied`, đọc `before.status`/`after.status`), «Không áp được: <lý do>» (`failed`, đọc `result.ly_do`), «Đã hoàn
  lại» (`reverted`), «Bị từ chối» (`rejected`). Giờ theo giờ Việt Nam (`fmtVnTime` của `lib/format.ts`).
- Cờ «Máy thu chưa nhận lệnh từ HH:MM»: lệnh `approved` mà `lastPullAt` cũ hơn 5′ (máy thu kéo mỗi 60″) hoặc `null`
  («Máy thu chưa kéo lệnh lần nào»).
- `trangThaiHieuLuc(trangThaiBanTin, factsPushedAt, lenhCuaNguon)`: lệnh `applied` mới nhất của nguồn có `finished_at`
  sau `factsPushedAt` thì trả `after.status` của lệnh đó, ngược lại trả trạng thái bản tin — để nút không đứng sai 15′
  sau khi áp (gap-probe P0).
- `nutNguon(vai, trangThaiHieuLuc, coLenhDangCho)` → `pause | resume | null` + lý do ẩn: `active` + vai ≥ ops → Tạm dừng;
  `paused` + vai ≥ admin → Bật lại; trạng thái khác (`draft`, `retired`, `completed`) hay vai viewer → không nút; nguồn
  đang có lệnh chưa xong (`submitted · approved · queued`) → không nút, ô hiện «Đang có lệnh chờ».

### Màn

- `FeedsGrid` thêm cột «Thao tác» (chỉ khi có vai ≥ ops). Bấm mở `Dialog`: tiêu đề «Tạm dừng S05?»; dòng «Trạng thái:
  Đang chạy → Tạm dừng»; giải thích «Lượt thu kế tiếp của S05 không chạy. Bật lại cần quản trị viên.»; `Textarea` Lý do
  (bắt buộc, ≤ 500 ký tự); nút «Gửi lệnh» tắt khi lý do trống/chỉ khoảng trắng; lỗi từ route hiện `Alert` trong hộp
  thoại, giữ chữ đã gõ. Gửi xong đóng hộp thoại, toast `sonner` «Đã gửi lệnh tạm dừng S05», vùng lệnh tải lại.
- Vùng «Lệnh gần đây» (client, `InsightGrid`): 20 lệnh mới nhất; trống/tải/lỗi theo luật ReUI 5; tự tải lại mỗi 30″ khi
  còn lệnh chưa xong.
- Badge trạng thái trong lưới đọc từ bản tin (15′ một lần), nên có thể chậm hơn lệnh; nút Thao tác thì theo trạng thái
  hiệu lực nên đổi ngay khi lệnh «Đã áp».
- Nhãn tiến trình dùng `reui/badge` biến thể `-light`: chờ → `warning-light`, đã nhận → `info-light`, đã áp →
  `success-light`, không áp được → `destructive-light`, hoàn lại/từ chối → `secondary`.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: /ops/collections → bấm «Tạm dừng» ở hàng S05 → hộp thoại trước/sau, gõ lý do → «Gửi lệnh» → dòng mới ở
  «Lệnh gần đây»: «Chờ máy thu nhận» → «Máy thu đã nhận lúc HH:MM» → «Đã áp lúc HH:MM · Đang chạy → Tạm dừng»
  (điểm ra: hàng S05 thôi có nút Tạm dừng, có nút Bật lại cho admin).
- Biên: vai viewer không thấy cột Thao tác; nguồn đang có lệnh chờ không có nút; S03 dừng ở «Chờ người thứ hai
  duyệt»; máy thu tắt → «Máy thu chưa nhận lệnh từ HH:MM».
- Lỗi & quay lại: route trả 400/403/409 → Alert trong hộp thoại, chữ giữ nguyên, sửa rồi gửi lại hoặc «Huỷ»;
  áp hỏng → dòng lệnh «Không áp được: <lý do>», nguồn giữ trạng thái cũ, bấm lại tạo lệnh mới.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Lưới Sức khoẻ nguồn (đã có) | thấy nguồn nào đang chạy và bấm tạm dừng/bật lại | /ops/collections / hộp thoại |
| Hộp thoại xác nhận lệnh | xem trước/sau, ghi lý do, gửi | nút Thao tác / vùng Lệnh gần đây |
| Vùng Lệnh gần đây | theo lệnh tới «đã áp» | /ops/collections / — |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-hopthoai-trong | Hộp thoại | Ô Lý do trống, «Gửi lệnh» tắt, chữ phụ «Ghi lý do để đội biết vì sao» | gõ lý do |
| ST-hopthoai-dang-gui | Hộp thoại | Nút «Đang gửi…» tắt | chờ |
| ST-hopthoai-loi | Hộp thoại | Alert destructive nêu lý do từ route, chữ giữ nguyên | sửa rồi gửi lại / Huỷ |
| ST-lenh-loading | Lệnh gần đây | Skeleton 3 dòng | chờ |
| ST-lenh-empty | Lệnh gần đây | Empty «Chưa có lệnh nào» + «Tạm dừng một nguồn ở bảng trên» | bấm Tạm dừng ở lưới |
| ST-lenh-error | Lệnh gần đây | Alert «Không tải được danh sách lệnh» + nút Thử lại | Thử lại |
| ST-lenh-cho-may | Lệnh gần đây | Badge warning-light «Chờ máy thu nhận» (+ «Máy thu chưa nhận lệnh từ HH:MM» khi quá 5′) | chờ / báo người ở máy thu |
| ST-lenh-da-ap | Lệnh gần đây | Badge success-light «Đã áp lúc HH:MM» + «Đang chạy → Tạm dừng» | — |
| ST-lenh-that-bai | Lệnh gần đây | Badge destructive-light «Không áp được: <lý do>» | bấm lại ở lưới |
| ST-lenh-cho-nguoi-2 | Lệnh gần đây | Badge info-light «Chờ người thứ hai duyệt» + Duyệt/Từ chối cho admin khác người gửi | duyệt / từ chối |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Lý do: bắt buộc, cắt khoảng trắng hai đầu, tối đa 500 ký tự (bộ đếm ở chân ô); Enter xuống dòng, không gửi.
- Mỗi lần mở hộp thoại sinh một `idempotency_key` mới; bấm «Gửi lệnh» hai lần chỉ tạo một lệnh.
- Vùng lệnh tự tải lại mỗi 30″ chỉ khi còn lệnh chưa xong; trang ẩn thì không tải.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| ui/dialog, ui/textarea, ui/label, ui/button | dùng | hộp thoại xác nhận theo khuôn shadcn đã cài |
| reui/badge (variant -light) | dùng | nhãn tiến trình lệnh theo luật ReUI 2 |
| InsightGrid | dùng | vùng Lệnh gần đây là một bảng Ops không có block khớp |
| ui/empty, ui/skeleton, reui/alert | dùng | ba trạng thái dữ liệu theo luật ReUI 5 |
| FeedsGrid | mở rộng | thêm một cột Thao tác vào lưới block đã chuyển thể |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: luồng hiển nhiên — hành động đặt ngay trên hàng nguồn của bảng điều khiển đã có, xác nhận bằng hộp thoại,
theo dõi ở một vùng ngay dưới; không có khuôn thứ hai khả dĩ nên không tra mẫu.
### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | Người vận hành (vai ops), quản trị viên (admin) |
| Việc chính | Dừng một nguồn đang đốt tiền hay hỏng, rồi bật lại khi đã ổn |
| Tần suất | hiếm |
| Số bản ghi | vài chục |
| Thiết bị | cả hai |
<!-- UX-SPEC-TEMPLATE>>> -->

## Không gian đã quét (morphological-scan, preset test-matrix)

Chân sản phẩm: ADR-0015 §5–§6, `docs/research/ops-tu-van-hanh-nguon-saas.md` §4.8 #1, #4 [SUY-TỪ-REPO], route TV4 đã
có. Chân ngành: [NGÀNH: GitHub Actions — «Disable workflow» một nút kèm xác nhận, trạng thái chạy theo dõi tại chỗ];
[NGÀNH: Stripe Idempotency-Key] cho bấm hai lần.

- Trục A — vai × nút: viewer · ops · admin × nguồn active · paused · draft · retired · completed · có lệnh chờ
  [thước CE: §3.5 bảng vai + máy vòng đời TV2a]
- Trục B — chặng lệnh hiện ra: submitted (S03 / khác) · approved · queued · applied · failed · reverted · rejected
  · máy thu im > 5′ · chưa kéo lần nào [thước CE: máy trạng thái ADR §5]
- Trục C — đầu vào hộp thoại: lý do trống · chỉ khoảng trắng · hợp lệ · quá 500 ký tự · bấm hai lần · route lỗi
- Trục D — tầng: route (tu_duyet) · hàm thuần · màn đang chạy · đầu-cuối tới «lượt thu kế tiếp không chạy»
- Cắt ngang: nhật ký người thật cùng giao dịch; UI chỉ ghi mã S0x.

**Core** (8 tiêu chí): A đủ ma trận (AC-6); B đủ chín ô (AC-4, AC-5); C (AC-3, AC-8); D route (AC-1, AC-2), đầu-cuối
(AC-7), màn (AC-8). **Later**: nút «đóng băng thay đổi» của owner (Hỏi-1); lệnh đảo một chạm từ dòng đã áp; cột
trạng thái của badge trạng thái của lưới cập nhật ngay sau áp (cần bản tin nhanh). **Never**: cloud gọi vào máy thu; sửa `source_registry`
từ cloud bằng đường khác ngoài lệnh.

## Câu hỏi cho Mạnh (sổ S1)

- Hỏi-1: nút «đóng băng thay đổi» của owner (ADR §7, TV4 ghi «TV4b») — khuyến nghị tách hàng riêng, vì cần chỗ lưu
  công tắc ở cloud và chặn cả route kéo; kèm vào đây thì thêm 2 tiêu chí và chạm route `pull` của TV4.
- Hỏi-2: vai `ops` tự duyệt lệnh tạm dừng của mình (không chờ admin) — khuyến nghị có, theo §4.8 #1 «lệnh S05/S06,
  tạm dừng … thì không [cần người thứ hai]»; lối khác: mọi lệnh tạm dừng của ops chờ admin duyệt, đổi lại đêm khuya
  không ai dừng được S05 khi vắng admin.

## Rủi ro đã biết

- «Lượt thu kế tiếp không chạy» trên máy thật cần plist `ops-apply` đã nạp (sau gộp hàng sửa sau TV4) — vòng này chứng
  bằng chuỗi đầu-cuối trên DB thử: route → kéo → áp → báo → `isRunnable` của script thu.
- Badge trạng thái trong lưới đọc bản tin 15′, có thể lệch vài phút với dòng «Đã áp»; nút đã theo trạng thái hiệu lực.
