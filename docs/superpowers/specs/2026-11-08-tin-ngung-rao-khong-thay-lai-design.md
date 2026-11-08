# Tin ngừng rao khi không thấy lại — thiết kế (V6, Q4 Mạnh 08/11)

Hồ sơ: `_acceptance/tin-ngung-rao-khong-thay-lai/` · Hạng T3 (chạm `db/migrations/**`, migration 085 giám sát cấp ở P3-165).

## Vấn đề

Mạnh chốt Q4 ngày 08/11: tin không xoá khi hết rao. Vòng đời của tin là đang rao → ngừng rao (thành lịch sử căn) → rút
(rác, gộp nhầm, chỉ để truy vết). Hiện chưa tin nào ở trạng thái ngừng rao. `sale_offer_records` có 79.815 tin
`active` và 304 tin `unknown`. Lý do: PL19 (`thoi-gian-va-hieu-luc`, migration 059) chỉ đổi trạng thái theo bằng chứng
nguồn. Câu chốt của PL19 ghi ở `CONTEXT.md`: «quá cửa sổ không đổi: tin lâu không thấy lại vẫn giữ trạng thái». Q4 đổi
đúng câu ấy. Không thấy lại đủ lâu, trong khi nguồn vẫn đang thu, nay được coi là bằng chứng (suy luận) rằng tin đã ngừng rao.

## Điều đo được trên DB máy thu (08/11, chỉ đọc)

- **`last_seen` của S06 không phải lần thấy cuối.** `transform-chotot.mjs` ghi `last_seen = list_time ?? captured_at`.
  Cả 74.581/74.581 tin S06 sống có `last_seen = first_seen`. Con số «4.224 tin S06 không thấy lại quá 30 ngày» trong
  ghi chú giám sát thật ra là «đăng quá 30 ngày».
- **Lần thấy cuối thật của S06 là `stg_chotot_ads.captured_at`.** Bảng giữ bản mới nhất của mỗi `list_id`. Các vùng
  S06 được quét 19/19 ngày kể từ 20/10. So với lần quét mới nhất của cùng vùng × loại tin (`region_v2`, `ad_type`), số
  tin tụt lại là: quá 7 ngày 32.275, quá 14 ngày 6.693, quá 21 ngày 0 (vì bảng mới có từ 20/10).
- **S03:** `last_seen` là lần đăng hay đăng lại cuối trong nhóm. 5.065 tin sống, cũ nhất 18/10. 16/41 nhóm im quá 7
  ngày. Tụt sau mốc của nhóm: quá 14 ngày 451, quá 21 ngày 0.
- **Tin S06 không có dòng stg:** 0/74.581.
- **S05:** nạp đang tắt (`khoa-nap-s05-paused`). 30 tin không thấy lại là vì không thu, không phải vì ngừng rao.

## Thiết kế

### Luật (migration 085)

1. `ngung_rao_sau_ngay(source) → integer`: N của từng nguồn, nằm ở MỘT chỗ. Mặc định 21 ngày cho S03, S05, S06
   (Hỏi-2). Nguồn không có N thì luật không đụng tới.
2. `bang_chung_khong_thay_lai(offer_ids)`: lấy các tin sống (`retired_at IS NULL`) của nguồn có N.
   - Lần thấy cuối: S06 = `greatest(last_seen, stg_chotot_ads.captured_at)`, nối theo `list_id = originating_system_key`;
     tin S06 không có dòng stg thì bỏ qua (không có lần thấy lại để đo; đo 08/11: 0 tin). Nguồn khác = `last_seen`.
   - Mốc thu: S06 = `max(captured_at)` của cùng `region_v2 × ad_type`. S03 = bài mới nhất (`stg_zalo_posts.posted_at`)
     của các nhóm mà tin đã đăng (nối `post_ids` → `post_id` → `group_name`). Lý do: đo 08/11 có 16/41 nhóm im quá 7
     ngày trong khi nguồn vẫn thu; cả 5.065 tin S03 sống nối được. S05 = `max(last_seen)` của tin sống S05.
   - Tin «không thấy lại» khi `mốc thu − lần thấy cuối > N ngày`. Đo tới mốc thu, không đo tới `now()`, nên nguồn
     ngừng thu thì không tin nào bị ngừng rao vì lý do đó.
3. `ghi_khong_thay_lai(offer_ids) → {moi, rut}`:
   - Tin không thấy lại mà chưa có phát biểu sống → ghi phát biểu `offer_status = withdrawn`, lớp `inferred`, phương
     pháp `e1_rule`, `method_version '085'`, `rule_id 'khong-thay-lai:<offer_id>'`, `observed_at = lần thấy cuối + N`.
     Evidence gồm `offer_id`, `bang_chung: khong-thay-lai`, `n_ngay`, `lan_thay_cuoi`, `moc_thu`.
   - Phát biểu sống mà tin đã thấy lại, hoặc lệch thời điểm → rút với lý do `thay-lai`. Rào chỉ-thêm của 045 chỉ cho
     rút, nên muốn đổi thì rút rồi ghi mới.
4. **Sửa `bang_chung_chao` của 059 (CREATE OR REPLACE, giữ chữ ký).** Hiện `doi_at` lấy mọi phát biểu đối nghịch còn
   sống. Một tin sống có phát biểu `withdrawn` bất kỳ thì `ghi_bang_chung_chao` rút `active` rồi ghi lại `active` ở
   `doi_at + 1µs`. Phát biểu ngừng rao vì thế bị dội ngay lượt sau. Bản 085 bỏ phát biểu `rule_id LIKE 'khong-thay-lai:%'`
   khỏi `doi_at`; mọi phần khác giữ nguyên chữ của 059.
5. `resolve_offer_status` không đổi: phát biểu sống có `observed_at` mới nhất thắng. Phát biểu ngừng rao có
   `observed_at = lần thấy cuối + N`, tức sau phát biểu `active` (ghi ở `last_seen` ≤ lần thấy cuối), nên thắng. Khi tin
   thấy lại, phát biểu ngừng rao bị rút, `active` thắng lại, và trigger `history_doi_trang_thai` ghi `back_on_market`.

### Lệnh (`pipeline/trang-thai-chao.mjs`)

- Thứ tự trong một giao dịch, dưới khoá 56056: `ghi_bang_chung_chao` → `ghi_khong_thay_lai` → `resolve_offer_status`.
- DB chưa áp 085 (`to_regproc('ghi_khong_thay_lai') IS NULL`) → bỏ bước luật, in thêm một dòng «chưa áp 085», không
  lỗi. Lý do: code gộp vào main trước khi Mạnh cho áp 085 trên máy thu, mà cloud-sync chạy bước này mỗi 15 phút từ
  checkout chính.
- Dòng in thêm: số tin ngừng rao theo nguồn, số phát biểu luật mới và số rút.
- `--thu`: chạy y hệt rồi ROLLBACK, in cùng các dòng. Đây là đường đo trước khi bật trên máy thu.

### Không đổi

- Không xoá, không nghỉ (`retired_at`), không che dòng tin nào. Tin ngừng rao vẫn ở view `sale_offers`; `seller_name`,
  `seller_phone`, `seller_ref` giữ nguyên (V11, Hỏi-3).
- Không thêm giá trị vào trục `offer_status` (Hỏi-4). Ngừng rao là `withdrawn` (RESO StandardStatus «Withdrawn», nhãn
  «Đã gỡ»); bằng chứng nằm ở phát biểu (`rule_id khong-thay-lai`). `CONTEXT.md` thêm thuật ngữ «Ngừng rao».
- Không đổi bước thu của ZCode, không đổi `transform-chotot.mjs` (lỗi nghĩa `last_seen` của S06 ghi ở Out of scope).

### Hệ quả đã biết

- Căn có tin chuyển sang ngừng rao sẽ tụt khỏi B5, vì vị từ B5 ở 059 đòi `active` (Q5: B5 là trạng thái lên xuống).
- Invest chưa lọc theo `offer_status`, và cột này chưa lên cloud: log sync-cloud báo «cột chưa duyệt lên cloud, ở lại
  máy: sale_offers.offer_status». Vì vậy hàng này chưa làm tin ngừng rao rời Invest. Có hai cách, cả hai là đường dữ
  liệu lên cloud (T3): đưa cột vào `CLOUD_ALLOW` rồi lọc ở cổng, hoặc lọc khi đẩy (Hỏi-1).

## Đặc tả UX

Bỏ: hàng không chạm giao diện (sổ quyết định: «bỏ đặc-tả-UX»).

## Đo sau gộp

Trên DB thử chép từ máy thu: `node pipeline/trang-thai-chao.mjs --thu` in số tin sẽ ngừng rao theo nguồn. Sau khi Mạnh
cho áp 085 lên máy thu (lời riêng, `pg_dump` trước), lượt cloud-sync kế tiếp ghi thật.
