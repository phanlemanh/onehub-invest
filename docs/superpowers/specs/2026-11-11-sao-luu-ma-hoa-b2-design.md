# Sao lưu máy thu ra ngoài máy, mã hoá trên máy (`sao-luu-ma-hoa-b2`) — thiết kế

> Hàng của dãy U1, giám sát giao 11/11. Căn cứ: quyết định của Mạnh ở phiên lưu trữ ảnh 11/11 — QĐ3 «Cho, khoá giữ
> ở máy», QĐ5 «Tách, dùng B2», QĐ15 «Chạy B2 luôn» — và bản phạm vi `research-local/pham-vi-sao-luu-1111.md`
> (gitignored, máy thu). Nguồn chỉ gọi bằng mã S0x. Tài liệu này không chứa khoá, đường dẫn tới khoá thật hay tên
> nguồn thật.

## 1. Bài toán

Máy thu chưa có bản sao lưu nào ra ngoài đĩa của nó. `scripts/db-sao-luu.sh` chỉ chạy tay và ghi ra cùng ổ đĩa. Raw
snapshot (khoảng 9,8 GB, tăng khoảng 580 MB mỗi ngày) gồm bài S03 không thu lại được. Hỏng hay mất máy thu là mất hẳn.

Hàng này dựng **công cụ** sao lưu hằng ngày và thử khôi phục, rồi chứng minh nó trên **dữ liệu giả và kho restic cục
bộ**. Lượt gửi dữ liệu thật đầu tiên lên B2 và việc nạp lịch launchd **không** nằm trong hàng. Lượt gửi thật cần đủ ba
thứ:
1. Luật 6 (AGENTS.md, ADR-0007) đã sửa cho tầng A rời máy chỉ trong bản sao lưu đã mã hoá.
2. Mạnh đã tạo thùng B2 và đặt tệp khoá ngoài kho.
3. Lời riêng của Mạnh.

## 2. Tệp

| Tệp | Vai |
|---|---|
| `scripts/sao-luu-ngoai-may.sh` | Lối vào cho launchd và người: `chay` (hằng ngày) · `kiem` (hằng tuần) · `kiem-db` (hằng tháng) · `khoi-tao` (lần đầu) · `soat-khoa`. Bash mỏng, gọi lib bằng node. |
| `scripts/lib/sao-luu-ngoai-may.mjs` | Toàn bộ logic: đọc cấu hình, bước chặn, dựng danh sách nguồn và loại trừ, gọi restic, ghi tệp trạng thái, đọc tệp trạng thái cho `check-freshness`, soát khoá, quét ranh giới. |
| `scripts/sao-luu-ngoai-may.test.mjs` | Test không cần DB: restic thật trên kho cục bộ trong thư mục tạm, cùng một restic giả ghi lại lời gọi. |
| `scripts/sao-luu-ngoai-may.itest.mjs` | Test cần DB: dump một DB thử nhỏ, khôi phục vào DB thử khác, so `so-dong.tsv`. Tự dựng một DB nguồn nhỏ trên :5433 và xoá khi xong — không dump DB `oneinvest`. |
| `scripts/check-freshness.mjs` (+ test) | Thêm một dòng «Sao lưu ngoài máy» đọc tệp trạng thái; quá hạn hay lỗi thì thoát 1. |

## 3. Cấu hình và bí mật

- **Tệp cấu hình ngoài kho**: mặc định `~/.oneinvest/b2.env` (QĐ5 đề xuất cùng chỗ `cloud.env`), đổi bằng
  `SAO_LUU_CAU_HINH`. Mang `RESTIC_REPOSITORY`, `B2_ACCOUNT_ID`, `B2_ACCOUNT_KEY`.
  - Script từ chối chạy khi tệp này nằm trong cây kho, hay quyền khác `600`. Lý do in ra không kèm giá trị.
  - Biến được nạp vào môi trường của tiến trình restic, không qua đối số dòng lệnh (đối số thấy được qua `ps`).
- **Mật khẩu kho restic**: nằm trong Keychain của máy thu, mục `onehub-restic` (đổi bằng `SAO_LUU_KEYCHAIN_MUC`;
  test dùng một keychain tạm trong thư mục tạm qua `SAO_LUU_KEYCHAIN_TEP`).
  - restic đọc qua `--password-command "security find-generic-password -s <mục> -w [tệp]"`. Mật khẩu không đi qua
    biến môi trường hay tệp.
  - `khoi-tao` sinh mật khẩu ngẫu nhiên 32 byte và ghi vào Keychain. Nó in đúng một lời dặn Mạnh chép bản cất riêng
    bằng `security find-generic-password … -w`. Mật khẩu không vào log, tệp trạng thái hay stdout.
- **Bước chặn trước lượt gửi đầu** (tiêu chí 5 của bản phạm vi): `chay` và `khoi-tao` dừng với mã 3 khi thiếu tệp
  xác nhận `~/.oneinvest/sao-luu/da-cat-khoa`. Tệp này Mạnh tự tạo sau khi đã cất bản mật khẩu. Kiểm này đứng trước
  mọi lời gọi restic.

## 4. Nguồn và loại trừ

| Mục | Đường | Ghi chú |
|---|---|---|
| Raw snapshot | `collector/snapshots/` | Chỉ đọc. |
| Trạng thái thu | `collector/state/` | Trừ phiên, khoá, QR, hồ sơ trình duyệt — xem dưới. |
| Kho gốc ảnh và tư liệu | `SAO_LUU_KHO_ANH` | Chưa có (QĐ6). Thư mục không tồn tại thì bỏ qua và ghi `kho_anh: chua_co` vào trạng thái, không lỗi. |
| Bản dump DB | thư mục tạm ngoài kho | `db-sao-luu.sh <thư mục tạm>` rồi restic nhận thư mục ấy. |

- **Loại trừ cố định, CHỈ dưới `collector/state/`**, nằm trong lib, test đọc chính hằng này: tên tệp hay thư mục khớp
  `session|cookie|profile|qr|token|auth|credential|\.key$|\.pem$` (không phân biệt hoa thường). Luật sinh dạng
  `<đường tuyệt đối collector/state>/**/*<từ>*` cho `--exclude-file`, không áp lên nguồn khác: raw snapshot có tên như
  `chat_profile`, `author`, `qrcode` phải được giữ trọn (không thu lại được). Toàn cây chỉ loại `node_modules`, `dist`,
  `.cache`.
- Lý do: tầng A cần giữ ở máy càng nhiều càng tốt. Mất phiên thì đăng nhập lại được. Lớp dẫn xuất (ảnh thu nhỏ, nhãn,
  OCR, metrics) dựng lại được.
- **Giới hạn đã biết**: bộ loại trừ theo tên. Nếu một tệp phiên mang tên trung tính thì nó lọt vào bản sao lưu — vẫn đã
  mã hoá. Bước S3 kiểm kê `collector/state/` thật bằng lệnh chỉ in số đếm theo đuôi và theo luật khớp, không in tên
  tệp, để thấy có tệp nào như vậy không.

## 5. Luồng `chay` (hằng ngày)

1. Kiểm trước, theo thứ tự, mỗi lỗi một mã thoát riêng:
   - tệp xác nhận (mã 3);
   - tệp cấu hình ngoài kho và quyền 600 (mã 4);
   - Keychain có mục (mã 6; `khoi-tao` bỏ bước này);
   - có restic (mã 5).
   Bước Keychain đứng trước restic để thiếu mật khẩu cũng dừng trước mọi lời gọi restic (AC-2).
2. Dump DB ra thư mục tạm `mktemp -d` ngoài kho. Dump lỗi → ghi trạng thái lỗi, thoát 1, không backup nửa vời.
3. `restic backup --json --tag onehub-may-thu <nguồn…> --exclude-file <tệp loại trừ sinh từ hằng>`. Đọc dòng `summary`:
   `snapshot_id`, `total_files_processed`, `total_bytes_processed`, `data_added`.
4. `restic forget --prune --group-by host,tags --tag onehub-may-thu --keep-daily 7 --keep-weekly 4 --keep-monthly 6` — nhóm theo nhãn, không theo đường, vì thư mục dump tạm đổi tên mỗi lượt (câu hỏi «giữ phiên bản»).
5. Ghi `~/.oneinvest/sao-luu/trang-thai.json` (đổi bằng `SAO_LUU_TRANG_THAI`). Các trường: `lan_chay`, `ket_qua`
   (`ok` hay `loi`), `buoc_loi`, `snapshot_id`, `luc_snapshot`, `so_tep`, `so_byte`, `byte_moi`, `kho_anh`,
   `lan_ok_cuoi`, và `dump_sha256` (sha256 từng tệp của bản dump, tính lúc dump trước khi restic nhận — mốc đối chiếu
  của `kiem` sau khi bản tạm đã xoá). Không chứa khoá, đường kho hay tên nguồn.
6. Xoá thư mục dump tạm sau khi restic báo thành công và tệp trạng thái đã ghi (câu hỏi «dump tạm»). Lỗi thì giữ thư mục và in
   đường.

## 6. `kiem` (hằng tuần) và `kiem-db` (hằng tháng)

- **`kiem`**:
  - chạy `restic check --read-data-subset=5%` (test dùng 100% trên kho nhỏ);
  - chọn ngẫu nhiên có hạt giống ít nhất 50 tệp trong `collector/snapshots` của bản mới nhất, cộng mọi tệp của bản
    dump mới nhất;
  - `restic restore --include` ra thư mục tạm ngoài kho rồi so sha256:
    - tệp raw snapshot so với bản trên đĩa (snapshot chỉ ghi thêm nên tệp cũ không đổi; tệp vắng hay đổi trên đĩa
      thì tính là lệch, không rơi về so kho với kho);
    - tệp dump so với `dump_sha256` trong tệp trạng thái của lượt `chay` đã tạo bản ấy (khớp `snapshot_id`); thiếu mốc
      thì thoát 1 nêu «không có mốc sha256 cho bản dump», không bỏ qua;
  - in số tệp, số khớp, số lệch. Lệch hay `check` lỗi → thoát 1 và ghi `kiem_cuoi` vào trạng thái.
- **`kiem-db`**:
  - khôi phục bản dump mới nhất ra thư mục tạm;
  - tạo một DB thử riêng (tên `oneinvest_u1_saoluu_*`), nạp `pg_restore`;
  - đếm số dòng mọi bảng theo đúng câu đếm của `db-sao-luu.sh`, so với `so-dong.tsv` của chính bản dump;
  - xoá DB thử. Lệch → thoát 1.

## 7. Cảnh báo quá hạn

- `check-freshness.mjs` gọi `docTrangThaiSaoLuu()` của lib và thêm một dòng «Sao lưu ngoài máy». Dòng này xấu (thoát 1)
  khi `lan_ok_cuoi` cũ hơn 36 giờ so với `--now`, hay `ket_qua` của lần cuối là `loi`.
- **Chưa có tệp trạng thái**:
  - chưa có tệp xác nhận `da-cat-khoa` (sao lưu chưa bật) → dòng thông tin «sao lưu ngoài máy chưa bật», không thoát 1;
  - đã có tệp xác nhận (Mạnh đã bật) → xấu, thoát 1 «đã bật mà chưa có lượt sao lưu nào».
  - Lý do: đỏ vô điều kiện thì `check-freshness` đỏ ngay trên máy thu cho tới lượt gửi thật; im vô điều kiện thì job
    không bao giờ chạy cũng không ai thấy.
- Hiện cảnh báo trên `/ops` cần `pipeline/push-ops-facts.mjs` (đường T3) và mã app — câu hỏi «cảnh báo /ops» khuyên tách thành hàng
  riêng.

## 8. Mã hoá và «không tệp thô nào rời máy»

- Đích chỉ là kho restic. restic luôn mã hoá phía máy (AES-256-CTR + Poly1305), không có chế độ gửi thô.
- Script không gọi lệnh tải lên nào khác. Quét ranh giới (`--ranh-gioi`) soát các tệp của hàng tìm `curl`, `rclone`,
  `aws`, `b2 `, `scp`, `rsync` ngoài comment.
- Phép thử: dựng kho cục bộ từ cây giả có một chuỗi canh. Không tệp nào dưới `data/` của kho chứa chuỗi canh.
  `restic cat`/`restore` với mật khẩu sai thì thất bại.

## 9. Soát khoá (`soat-khoa`)

- Đọc giá trị khoá B2 và mật khẩu Keychain vào bộ nhớ, rồi quét các đường được giao:
  - mặc định kho git (`git ls-files` cộng tệp chưa theo dõi);
  - `_acceptance/`;
  - thư mục log của job;
  - tệp trạng thái.
- Chỉ in đường tệp chứa giá trị, không in giá trị. Có chỗ chứa → thoát 1.
- Test dùng khoá giả và một tệp gài sẵn để soát ra đỏ.

## 10. Ma trận viết trước

| Mã | Đầu vào | Kỳ vọng |
|---|---|---|
| C1 | thiếu tệp xác nhận | mã 3, restic giả 0 lời gọi, không tạo thư mục dump |
| C2 | có tệp xác nhận, cấu hình quyền 644 | mã 4, 0 lời gọi restic, thông điệp nêu «600» |
| C3 | cấu hình nằm trong cây kho | mã 4, thông điệp nêu «ngoài kho» |
| C4 | không có restic trên PATH | mã 5 |
| C5 | Keychain không có mục | mã 6, thông điệp không chứa giá trị nào |
| C6 | đủ điều kiện, dump giả lỗi | mã 1, trạng thái `loi`/`buoc_loi: dump`, restic backup 0 lời gọi |
| C7 | đủ điều kiện, cây giả | mã 0; bản mới có đủ tệp của bốn mục trừ tệp khớp loại trừ; số tệp, cỡ khớp |
| C8 | chạy lại C7 không đổi gì | bản mới, `byte_moi` < 1% lần đầu |
| C9 | 12 bản giả ngày khác nhau | sau forget còn đúng tập 7/4/6 |
| C10 | `kiem` trên kho lành | ≥50 tệp, mọi sha256 khớp, mã 0 |
| C11 | `kiem` sau khi phá một tệp pack | mã 1, thông điệp nêu `check` hay tệp lệch |
| C12 | trạng thái `lan_ok_cuoi` cách 35 giờ / 37 giờ / lần cuối `loi` / không có tệp, chưa bật / không có tệp, đã bật | freshness 0 / 1 / 1 / 0 kèm «chưa bật» / 1 kèm «đã bật mà chưa có lượt» |
| C13 | `khoi-tao` thiếu tệp xác nhận | mã 3, restic giả 0 lời gọi, keychain tạm không có mục mới; ca dương có xác nhận → có lời gọi `init` |
| C14 | tệp dump trong kho bị sửa byte (kho dựng bằng chính `chay`, bản tạm đã xoá) | `kiem` mã 1, thông điệp nêu tên tệp dump |
| C15 | raw snapshot có tên chứa từng từ của luật loại trừ | có đủ trong `restic ls`; bản đột biến áp luật lên snapshots thì ca đỏ |

## 11. Ngoài phạm vi

- Lượt gửi thật lên B2, nạp launchd, tệp plist: chờ lời Mạnh và hàng P4 (`docs/ops/runtime-map.md`).
- Sửa luật 6 / ADR-0007: giám sát lo ở phiên riêng.
- Object Lock, hạn giữ phiên bản dài hơn hạn ảnh QĐ8: chưa chốt.
- Ổ ngoài: dùng cùng script với `RESTIC_REPOSITORY` khác khi Mạnh cắm. Không đo trong hàng.
- Xoá 25 bản dump cũ dưới `~/onehub-backups/db`: việc riêng của Mạnh.
- Cảnh báo trên `/ops` (câu hỏi «cảnh báo /ops»).
