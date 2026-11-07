# Lấy mẫu nhãn khử trùng theo tin — thiết kế

Hồ sơ: `_acceptance/lay-mau-khu-trung-theo-tin/` · hàng GN2 của `docs/plan/lo-trinh.json` · hạng T2 · dãy P4, đợt dot0-cam-mau.

## Vì sao

Lát `s03-theo-nhom` có ba lỗi lấy mẫu:
- 33 thẻ trùng nhau (27 nhóm, 13 nhóm vắt qua hai phần dev/test). Mạnh cho ẩn tay 06/11 và hỏi «làm cơ chế cho pipeline chưa?».
- Bài thử của Mạnh #10297 lọt vào mẫu.
- Sự kiện thu hồi tin #10172 cũng lọt vào mẫu.

Nguyên nhân là `textHash` băm `normText` của chữ còn nguyên link ảnh, và bộ lọc bài thử chỉ xét snapshot, agent và tên nhóm. `label-ghep --lam-lai` dựng lại `ghep` từ đầu, nên xoá cả dấu ẩn tay.

## Số đo trên lát thật (chỉ đọc, 07/11)

44 thẻ ẩn hiện nay gồm 11 thẻ trùng cụm (ghép ảnh, PL28) và 33 thẻ Mạnh ẩn tay. Phân loại 33 thẻ ẩn tay theo luật mới:

| Loại | Thẻ |
|---|---|
| cùng tin của pipeline và cùng chữ đã gạt URL | 19 |
| cùng chữ đã gạt URL; cả hai chưa thành tin | 8 |
| cùng chữ đã gạt URL; một bên chưa thành tin | 3 |
| cùng chữ đã gạt URL; pipeline tách thành hai tin khác nhau | 3 |
| không khớp luật nào | 0 |

Hai luật đã đo, cả hai đều giữ mọi dấu ẩn tay:
- «Tin trước, chữ sau» — đúng câu giao: bài đã thành tin khử theo tin, bài chưa thành tin so chữ.
- «Cùng tin HOẶC cùng chữ», gom bắc cầu.

Kết quả trên lát:
- Cả hai luật cho cùng 48 thẻ ẩn. Ba cặp cùng chữ mà pipeline tách thành hai tin, và ba cặp chỉ một bên thành tin, đều đã được dấu ẩn tay nối lại.
- Không cặp chữ ngắn nào của hai người gửi khác nhau bị gộp.
- Hai luật chỉ khác nhau ở lát mới: «tin trước» không gộp hai bài cùng chữ khi pipeline đã coi là hai tin.

Vòng này theo câu giao. Bốn nhóm mới:
- #9947 trùng #9932: chữ ngắn, giống hệt. #9932 đã có nhãn nên được giữ.
- #10222 trùng #10029: cùng tin, chữ sửa nhẹ.
- #10077 trùng #10062: cùng tin, cùng chữ.
- #10156 trùng #10151: cùng tin, chữ lệch một ký tự.

Tổng 48 thẻ ẩn (Hỏi-1).

Sự kiện dạng JSON trong `stg_zalo_posts`:
- 14 bài là sự kiện thu hồi (`clientDelMsgId`);
- 22 bài là sự kiện hệ thống (thu hồi, nhãn dán, thẻ link);
- 3 thẻ của lát mang chữ dạng JSON.

Dấu bài thử của Mạnh:
- 2 bài có link `trycloudflare`;
- 2 bài có chữ «[Tên sàn]»;
- 6 bài thuộc 5 nhóm có tên toàn chữ số.

## Thiết kế

### Khoá trùng một chỗ

Thêm vào `pipeline/lib/eval-labels.mjs` hai hàm thuần:
- `chuGatUrl(text)`: bỏ mọi `http(s)://…` rồi chạy `normText`.
- `khoaTrung(bai, tinCua)`: mỗi bài một khoá.
  - `o:<offer_id>` khi bài có trong `sale_offer_records.post_ids` của S03;
  - không có thì `c:<chuGatUrl>` khi chữ đã gạt URL không rỗng;
  - không có khoá thì bài đứng riêng.

`chonMau` và `chonMauTheoNhom` khử trùng theo khoá này thay cho `textHash`. `textHash` vẫn ghi vào `eval_label_items.text_hash` như cũ. Bài đại diện là bài có `post_id` nhỏ nhất.

### Gạt sự kiện và bài thử

- `laSuKien(text)`: chữ đã trim mở đầu bằng `[` hoặc `{` và `JSON.parse` được thành object hay mảng object. Sampler bỏ các bài này và đếm ở `bo_su_kien`. Transform không đổi.
- `lib/test-posts.mjs` là định nghĩa duy nhất của bài thử; transform đọc qua `loadStgPosts` với cột `text` có sẵn. Dấu mới `noi-dung`: chữ có link `trycloudflare.com` hoặc chuỗi «[Tên sàn]».
  - Dấu này cũng làm transform gạt bài. Hai tin đang sống trên canonical sinh từ bài thử sẽ nghỉ ở lượt kế (PL14, không xoá).
  - Đây là thay đổi tới canonical, nên là Hỏi-2: gạt ở cả transform lẫn sampler, hay chỉ ở sampler.
- «Nhóm tên toàn chữ số» không làm dấu mặc định. Đo lại thì năm nhóm này là mã nhóm chưa có tên (chuỗi 18–19 chữ số), có thể là nhóm thật; một tin đang sống thuộc các nhóm này. Hỏi-2 nêu lối thêm dấu này.

### `label-ghep` dựng lại dấu trùng

`ghepLat` (có hay không `--lam-lai`) chạy `ghepChoMau` như cũ, sau đó chạy thêm `nhomTrung` trên chữ của `chu_ref`, hoặc của chính bài khi không có cụm. Trong mỗi nhóm:
- Thẻ giữ: thẻ có nhiều dòng nhãn nhất; hoà thì thẻ đang được thẻ khác trỏ tới; hoà nữa thì `item_id` nhỏ nhất.
- Thẻ còn lại nhận `trung_voi = <ref_id thẻ giữ>` và `khu_trung: "tin"|"chu"` (khoá đã nối chúng).
- Dấu ẩn tay (`an_tay`) không bao giờ bị gỡ: dòng đã có `an_tay` giữ nguyên `trung_voi` và `an_tay` của nó.
- Kết quả in thêm `an_moi`, `an_tay_giu` và từng thẻ ẩn mới kèm khoá.

Bên đọc không đổi:
- app lọc `(ghep->>'trung_voi') IS NULL`;
- `eval-classify` bỏ dòng có `trung_voi`.

### Chạy trên lát thật

Vòng này chỉ chạy trên DB thử có bản chép của lát. Chạy `label-ghep --lam-lai --db-that` lên DB máy thu ghi dữ liệu thật, nên cần lời Mạnh (Hỏi-3). Trước khi chạy phải sao lưu `eval_label_items` của lát.

## Ngoài vòng

- Lấy lại mẫu, đổi lát, gỡ ẩn.
- Gỡ tin đã sinh từ sự kiện ở canonical (không có).
- Dấu thử khác ngoài ba dấu đã đo.
