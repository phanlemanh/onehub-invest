# PL35 — Tập nhãn ghép tin hai khu (thiết kế)

> Hàng PL35 `tap-nhan-ghep-tin-hai-khu` của «Lộ trình onehub-invest» (đợt no-cat-hang-1311), dãy U1. Cổng Đáng: Mạnh
> «build» 13/11. Đứng sau DA31 (toà S09 hai khu vào danh bạ) và GC0; là tập test của PL20 (`ghep-tin-vao-danh-muc`).
> Nguồn chỉ gọi bằng mã S0x. Tài liệu này không chứa tên nguồn thật.

## 1. Vấn đề

PL20 gắn tin căn hộ S03 của Ocean Park 1 (OP1) và Grand Park (GP) vào danh bạ ở mức sâu nhất biết được (toà, trục,
căn — ADR-0016 §5). Ngưỡng mở là cận dưới Wilson của nhóm A (0,95, ADR-0013), đo trên tập test nhãn người. Tập đó chưa
có. Số đo S1 của PL20 ngày 12/11 (`ghep-tin-vao-danh-muc/gap-probe.md`):

| | OP1 | GP |
|---|---|---|
| Bài căn hộ S03 | 6.301 | 4.683 |
| Gắn được toà (danh bạ hiện tại) | 2.415 | 506 |
| Gắn được trục | 166 | 1 |
| Gắn được căn | 0 | 0 |
| Tên toà không có trong danh bạ | 2.579 | 1.355 |

Cận dưới Wilson 0,95 cần khoảng 73 ca đúng hết trong một ô. Mạnh chốt 06/11: trợ lý điền nháp, Mạnh duyệt.

## 2. Phương án

Ba lệnh trong `pipeline/`, mỗi lệnh một việc, dùng lại hạ tầng nhãn có sẵn (054, 072, 076, 081, 083), không migration.

### 2.1 Chọn mẫu — `label-sample.mjs --lat hai-khu-ghep`

- **Khu của bài** theo tên nhóm (tầng C), bảng mẫu khai trước trong `lib/eval-labels.mjs` (`LAT_NHOM` thêm `op1`, `gp`).
  Nhóm khớp cả hai mẫu, hay không khớp mẫu nào, không vào lát. `project_node_ids` của nhóm hiện rỗng, nên chưa dựa
  được vào sổ nhóm (DV6 làm việc đó).
- **Mức gắn của bài** (để phân tầng, không phải nhãn) do một bộ phân tầng xác định của chính hàng này tính
  (`lib/tang-ghep.mjs`): tên toà, mã trục trong chữ bài đối chiếu danh bạ của khu → `toa` | `truc` | `khong`. Bộ phân
  tầng chỉ đọc chữ bài và bảng danh bạ (`buildings`, `stacks`); không đọc phát biểu của PL20.
- **Tầng** = khu × mức gắn. Mức `can` (0 bài) và `truc` của GP (1 bài) không đủ cỡ — gộp vào tầng gần nhất (`truc` GP
  vào `toa` GP) và khai giới hạn. Năm tầng: OP1-toa, OP1-truc, OP1-khong, GP-toa, GP-khong.
  Sửa 14/11 (ROADMAP §3 mục 48, QĐ6 — PL20 chỉ còn nhịp toà, trục và căn ở PL36): bốn tầng OP1-toa, OP1-khong, GP-toa,
  GP-khong là tầng **bắt buộc** đủ cỡ; OP1-truc vẫn chọn `min(75, …)` nhưng thiếu cỡ chỉ báo «cho PL36», không chặn.
- **Cỡ mỗi tầng** = `min(75, số bài khác nhau của tầng)`; tổng trên số đo S1 ≈ 375 (trong 300–450). Tầng thiếu in
  «thiếu N» và cận dưới Wilson tối đa đạt được.
- **Tất định**: khử trùng bằng `khuTrung` có sẵn; chọn trong tầng bằng `chonMau` (băm `seed:chon:khoa`); cùng đầu vào và
  seed → cùng tập; chạy lại không thêm dòng (`ON CONFLICT DO NOTHING`). Ghi `eval_label_items` với `stratum` = tầng.
- Chạy thật chỉ sau khi DA31 gộp (danh bạ có toà S09); trước đó bài có toà S09 rơi vào tầng `khong`.
  DA31 đã gộp 14/11 nhưng máy thu chưa áp 097 và chưa dựng S09 (cần bộ nạp làn thu và lời Mạnh). Phép đo trên bản chép
  (AC-9) không chờ: nếu danh bạ bản chép chưa có toà S09 thì nạp bản thu S09 13/11 và chạy bước S09 trên bản chép, như DA31 E6.

### 2.2 Nháp nhãn — `label-nhap-ghep.mjs --lat hai-khu-ghep`

- Tác tử (Haiku, cấu hình qua `agent/config`) đọc **chữ bài** và **danh sách toà/trục của khu** (từ danh bạ), điền
  `building`, `stack`, `unit_number` kèm **câu trích nguyên văn** từ bài làm căn cứ. Câu trích không có trong bài →
  ô đó để trống (máy kiểm `quote_ok` như `silver_labels`). Không suy được → không điền.
- **Không đọc kết quả của bộ gắn PL20**: đầu vào chỉ hai thứ trên; module không tham chiếu `field_assertions`,
  `UniversalPropertyId`, hay mã của PL20. Đo bằng quét tĩnh và chạy trên DB thử đã thu quyền đọc `field_assertions`.
- Ghi vào `eval_label_items.draft` theo khuôn màn `/ops/labels` đã đọc (`nhapTuDraft`): `{hien, o_nguoi:[],
  cach_doc:{ghep:{trang_thai:'co', o:{…}, can_cu:{…}}}}`. Màn điền sẵn ô; người sửa rồi Lưu.
- **Không ghi đè nhãn người**: nháp nằm ở `draft`, nhãn người ở `eval_labels` — lệnh không ghi `eval_labels`, và bỏ qua
  bài đã có nhãn người (không đổi `draft` của bài đó).

### 2.3 Đóng băng — `label-dong-bang.mjs --lat hai-khu-ghep`

- Lấy bài đã có nhãn người (đã duyệt) của lát, ghi một tệp JSON chuẩn hoá (sắp theo `ref_id`, khoá sắp) gồm `ref_id`,
  `stratum`, nhãn người của ba trường; **không** chứa chữ bài, câu trích, tên người gắn hay tầng A.
- Băm sha256 của nội dung chuẩn hoá ghi trong tệp và in ra; chạy lại trên cùng dữ liệu → cùng băm; đổi một nhãn → băm
  đổi. PL20 đọc tệp và kiểm băm trước khi đo.
- Tệp nằm trong kho (`pipeline/eval-sets/`), đọc được trong diff; mỗi lần đóng băng một tệp mới, không sửa tệp cũ.

## 3. Ranh giới

- Không migration; không đổi `sync-cloud` (bảng nhãn chỉ ở máy thu); không đụng `app/` (màn `/ops/labels` đã đọc
  `draft`).
- Lượt nạp thật vào DB máy thu (gọi model ~375 bài) là bước sau gộp — xem Hỏi-2.
- Người duyệt nháp là việc vận hành (ra khỏi kho).

## 4. Rủi ro

- Nhóm «VHOP» có thể lẫn OCP2/3 vào OP1 → bảng mẫu tên nhóm khai trước và có ca kiểm từng nhóm.
- Bộ phân tầng lệch với bộ gắn PL20 → không sao cho tính độc lập (tầng chỉ để phân bổ cỡ), nhưng tầng sai cỡ làm Wilson
  của ô thật rộng hơn; khai trong báo cáo tầng.
- Gợi ý của nháp làm người duyệt «gật theo» → giới hạn đã biết; gắn mù để PL21 (Q3 hoãn).

## Đặc tả UX

Bỏ — hàng không đổi giao diện (màn `/ops/labels` đọc `draft` sẵn có); xem dòng `descope` «bỏ đặc-tả-UX» trong sổ.
