# Một nhóm thật là một tầng khi lấy mẫu — thiết kế (`nhom-dang-ky-hai-lan-s03`)

Ngày: 2026-11-04 · Nguồn: Ngoài-21 của `_acceptance/gan-nhan-theo-nhom-s03/` (Mạnh chọn «mở hợp đồng mới») · Hạng: T2 ·
Cắt từ nhánh `feat/gan-nhan-theo-nhom-s03` vì GC0 chưa gộp.

## Số đo 04/11 trên DB local (chỉ đọc)

- Sổ `collection_units` có 30 đơn vị S03. Khoá nhóm có ba dạng: khoá trần (26 dòng), `<kênh>:group:<khoá>` (3 dòng), một khoá
  lạ không có tiền tố (1 dòng, `retired`, 1 bài).
- Đúng ba nhóm đăng ký hai lần: S03-N004/N022, S03-N005/N018, S03-N010/N024. Không nguồn nào khác có cặp như vậy.
  Không có tên nhóm nào trỏ về hai khoá khác nhau sau khi bỏ tiền tố. Bốn khoá có hai tên là nhóm đổi tên, không phải trùng.
- Dòng khoá trần do `sync-don-vi.mjs` tạo ngày 26/10 từ cấu hình gateway. Dòng có tiền tố do ZCode ghi tay ngày 31/10
  (`params.registered_by`), không có mã nào trong kho sinh ra chúng.
- Bài: dạng có tiền tố 91 bài, chỉ từ 20–21/10. Từ 22/10 hook ghi khoá trần: 75.123 bài, 0 bài có tiền tố.
- Lấy mẫu `--thu` trên bản hiện tại (30/5, 10 nhóm lớn), 29 tầng, 380 bài: N004 30 + N022 5 = 35 bài (hạn mức 30),
  N010 30 + N024 5 = 35 (hạn mức 30), N005 5 + N018 3 = 8 (hạn mức 5).

## Ai đang dựa vào hai dòng

| Chỗ | Dựa vào gì | Kết luận |
|---|---|---|
| Đường thu (hook, `import-airbnb.mjs`) | Không đọc sổ; khoá lấy từ sự kiện. Sổ S03 là bản soi của gateway | Không dựa, không cần đổi đường thu |
| `transform-zalo.docThiTruongNhom` | So `group_key` nguyên văn với bài, không lọc trạng thái | 91 bài cũ lấy thị trường qua dòng có tiền tố. Xoá dòng thì mất |
| `do-cam-mau-s03.mjs` | Như trên | Như trên |
| `khai-so-nhom.mjs` | Đòi khai đủ mọi đơn vị, tên theo khoá | Đang khai đủ sáu dòng, cùng thẻ, cùng thị trường |
| `sync-don-vi.mjs` | Dòng vắng khỏi gateway → `paused` | Lượt chạy kế sẽ đổi ba dòng có tiền tố sang `paused` |
| `/ops/sources` (`so-don-vi.ts`) | Liệt kê mọi dòng | Hiện 30 đơn vị, trong đó ba dòng thừa |
| `labels-luot-hai.ts` | Đọc `note` theo `stratum` | Chỉ cần đại diện có thẻ; sáu dòng đang cùng một thẻ |
| Tin trên cổng | 87/91 bài có tiền tố đã thành 66 tin | Sửa `stg` hay sổ làm đổi số tin ngay trước mốc 05/11 |

`conversation_id` đọc từ raw snapshot bất biến và import ghi đè bằng giá trị từ snapshot, nên sửa `stg_zalo_posts` sẽ bị lượt
nạp lại đảo ngược. Gốc lỗi nằm ở dữ liệu của sổ; đường thu hiện đã đúng. Việc này không đổi đường thu nên không cần giao ZCode.

## Thiết kế

Gộp ở bước đọc của `label-sample`, không đổi dữ liệu:

1. `khoaNhomThat(k)` bỏ đúng một tiền tố `group:` hoặc `<kênh>:group:` khi sau đó còn chữ, cùng luật với `readS03Groups`, thêm
   phần kênh. Khoá khác giữ nguyên, kể cả `a:b:group:x` và `conv:x`. Mã không ghi tên kênh, nên không thêm tên nguồn thật vào kho.
   Hai kênh khác nhau cùng khoá thì gộp: sổ đang lọc `source_code = 'S03'`, nguồn này một kênh, và dòng báo gộp làm việc đó không im.
2. `donViTheoNhomThat(so)` gom sổ theo khoá thật, chọn đại diện: dòng khoá trần trước, rồi `unit_code` nhỏ nhất. Không xét
   trạng thái, vì `sync-don-vi` sẽ đổi dòng phụ sang `paused` mà bài vẫn phải về một tầng.
3. `layMauTheoNhom` tra đơn vị của bài qua khoá thật. Phần còn lại của `chonMauTheoNhom` giữ nguyên.
4. Lệnh in `gộp đơn vị trùng: S03-N004 ← S03-N022 · bài ở khoá phụ 43`, kể cả khi `--thu`. Thẻ của hai dòng khác nhau thì
   cảnh báo thêm: màn dùng thẻ của đại diện. Không in khoá nhóm.
5. Lát đã lấy mẫu mà có dòng ở tầng phụ: giữ nguyên như luật GC0, không có lời khuyên xoá vì lát có thể đã mang công gắn nhãn. In
   đúng câu: `lát đã có <n> dòng ở tầng phụ <mã> — giữ nguyên, gắn tiếp được; số của nhóm này đang chia hai tầng, muốn một tầng
   thì lấy mẫu lát tên mới`. Hôm nay DB thật chưa có lát nào như vậy (072 chưa áp).

Phương án đã bỏ:

- **Gộp dòng trong sổ, đổi `stg`**: cần lời Mạnh, làm 91 bài cũ mất thị trường nếu transform chưa đổi, và lượt nạp lại đảo
  `stg`. Để thành việc riêng sau mốc.
- **Chuẩn hoá ở mọi chỗ đọc** (transform, đo cắm mẫu, sổ trên `/ops/sources`): đổi số tin trên cổng ngay trước 05/11, không
  cần cho điều kiện xong của việc này.
- **Ràng buộc DB chặn khoá trùng**: cần migration và phải xử ba cặp đang có trước. Chưa có ca trùng mới nào sau 31/10.

## Đặc tả UX

Không chạm giao diện (dòng sổ `bỏ đặc-tả-UX`). Màn `/ops/labels` chỉ nhận ít tầng hơn.

## Phép đo

Fixture `<kênh>:group:<khoá>` trên DB thử `oneinvest_gcn_nhan`, lệnh thật bằng tiến trình con. Mỗi phép đo chạy hai chiều: bản
thật xanh, sáu bản đột biến trong thư mục tạm đỏ với thông điệp ghim riêng: khoá nguyên văn, đại diện sai, bỏ báo gộp, gộp quá tay,
xếp theo số từng dòng, đếm tổng thay vì hợp. Fixture có nhiều nhóm hơn số nhóm lớn, nhóm hai dòng chỉ vào nhóm lớn khi tính gộp.
Lát cũ của AC-5 do chính bản đột biến khoá nguyên văn ghi ra, không INSERT tay. Thêm một lượt `--thu` chỉ đọc trên các cặp thật của DB
thử, cặp đọc từ sổ. Một phép quét đọc mọi khoá S03 từ sổ DB thử lúc chạy, soát các tệp vòng này đổi và mọi đầu ra, chỉ in số lượng.
