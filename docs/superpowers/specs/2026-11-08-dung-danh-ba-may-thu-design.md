# DB1b — Lệnh dựng danh bạ vật thể chạy được trên DB máy thu (design)

Hồ sơ: `_acceptance/dung-danh-ba-may-thu/` · hàng DB1b của `docs/plan/lo-trinh.json` · hạng T2 · làn Claude.

## Vì sao

DB1 (`danh-ba-toa-truc-can`, #347) giao bộ dựng toà · trục · căn nhưng lệnh `pipeline/danh-ba-vat-the.mjs` chỉ chạy
trên DB thử: nó từ chối cứng DB tên `oneinvest` (Known limit Ngoài-7 ghi ngược chiều: lệnh chạy được trên DB đám mây
mà lại không chạy được trên máy thu). Ở Cổng Bằng chứng DB1, Mạnh chọn «Ngoài-9: mở hợp đồng mới». 082 đã áp lên DB
máy thu 07/11, ba bảng vật thể còn rỗng. Hàng này đưa lệnh lên máy thu một cách an toàn và giữ danh bạ tươi mỗi đêm,
để PL20 → GC2 → GC3 có chỗ gắn tin, và để PX2 mở ra 150 dự án S08.

Ba lỗ cần đóng cùng lúc, vì thiếu một cái thì cái kia nguy hiểm:

1. **Cờ cho phép tường minh** — ghi DB thật phải là chủ ý (mẫu `label-ghep.mjs --db-that`).
2. **Chặn máy chủ ngoài máy** (Ngoài-7) — rào an toàn của lệnh ghi: lệnh dựng chỉ ghi DB trên máy này; dữ liệu lên
   cloud chỉ đi qua đường đồng bộ có kiểm của kho (`sync-cloud`), không qua lệnh dựng; không cờ nào mở được lệnh dựng ghi
   lên một máy chủ khác. (Đây không phải luật dữ liệu: Mạnh 08/11 mở thông tin dự án khỏi luật nội bộ, văn bản sửa ở DA0.)
3. **Kiểm slug khu** (Ngoài-6, Ngoài-10) — slug sai thì lệnh dừng và gọi tên, không «xong» với toàn số 0.

Và một bước chạy đêm, có rào: đêm chỉ **giữ tươi** những khu đã được dựng tay bằng cờ; không bao giờ tự dựng lần đầu.

## Thiết kế

### Đích ghi (một hàm, mọi đường ghi đi qua)

`kiemDich(thamSo, { dbThat })` trong `pipeline/lib/danh-ba-vat-the.mjs` (hàm thuần, không mở kết nối). `thamSo` là
`connectionParameters` của chính `pg.Client` sẽ dùng (dựng client, chưa `connect`) — máy chủ được kiểm là máy chủ pg
thật sẽ nối tới, kể cả khi URL mang `?host=` hay để trống máy chủ cho `PGHOST` điền. Đường socket (`/tmp`, `/var/run/…`)
là máy này:

| Đích | Không cờ | `--db-that` |
|---|---|---|
| máy này (`localhost`, `127.0.0.1`, `::1`), tên `oneinvest_<việc>` (DB thử, `db/db-thu.sh`) | ghi | ghi |
| máy này, tên khác (gồm `oneinvest` — DB máy thu) | thoát 2: «đích không phải DB thử — khai --db-that nếu chủ ý ghi DB máy thu» | ghi |
| máy chủ khác (đám mây, máy khác, socket lạ) | thoát 2: «đích ngoài máy này» | thoát 2 — cờ không mở |
| URL hỏng / thiếu tên DB | thoát 2 | thoát 2 |

Lần dựng đầu (đích không phải DB thử, chưa có toà nào): ngoài `--db-that` còn phải có `--sao-luu <tệp>` trỏ một tệp
có thật, không rỗng — bản `pg_dump` giám sát làm trước. Lệnh không tự dump; nó chỉ không cho lần đầu đi qua khi chưa có
bản sao lưu (điều kiện «sao lưu trước» của Mạnh thành rào máy, không chỉ là nếp). Đích đã có toà thì không đòi.

Thông điệp không bao giờ in URL đầy đủ hay mật khẩu — chỉ tên máy chủ đã che phần người dùng và tên DB. Kiểm chạy
TRƯỚC `pg.Client.connect()`: đích bị từ chối thì không mở kết nối nào.

### Kiểm slug khu

Trong `dung()`, sau khi đọc `asset_nodes` loại `project` theo `--khu`: slug không có nút nào → ném lỗi gọi tên từng
slug sai, giao dịch ROLLBACK, lệnh thoát 2 (lỗi người gọi, khác lỗi chạy thoát 1). Slug có nút nhưng 0 dòng S08 đã nối
(`s08_project_links.status = 'noi'`, cao tầng) → vẫn dựng các khu khác, tổng kết có `khu_khong_s08: [slug]` và một dòng
cảnh báo stderr — người chạy thấy khác biệt giữa «gõ sai» và «khu chưa có danh mục».

### Bước chạy đêm

`buocVatTheDem(c)` export từ `pipeline/danh-ba-vat-the.mjs`; `pipeline/refresh-bait-gap.mjs` gọi nó trong `main()`
ngay SAU `buocDem(c)` (bait gap + danh bạ Người đã commit), một giao dịch riêng của bộ dựng. Vì
`refresh-bait-gap.mjs` chạy trong ba job — `zalo-import-daily` 00:00 (ngay sau transform S03, phát biểu toà mới nhất),
`chotot-daily` 05:30 và 14:00, `apify-facebook-daily` — danh bạ vật thể tươi theo đúng nhịp danh bạ Người, không thêm
job launchd, không chạm tệp làn ZCode (`scripts/zalo-*.sh`), không chạm `scripts/cloud-sync.sh` (T3, 15 phút một lần).

Rào của bước đêm, theo thứ tự:

1. Đích (`c.connectionParameters`) qua `kiemDich(..., { dbThat: true })` — máy chủ ngoài máy thì ném lỗi (job đỏ):
   một `DATABASE_URL` trỏ nhầm đám mây không bao giờ mang danh mục S08 ra ngoài.
2. Chưa áp 082 (`to_regclass('public.buildings')` rỗng) → một dòng «danh-ba-vat-the: bỏ qua — DB chưa áp 082», không ghi.
3. Khu của đêm = khu đã có toà (từ `buildings.region_node_id` → khu, hoặc cha của phân khu). Tập rỗng (chưa có toà
   nào, dù bí danh `ma_nguon` có sẵn hay không) → một dòng «danh-ba-vat-the: bỏ qua — chưa dựng lần đầu (lần đầu là lệnh
   tay --db-that --sao-luu)», không ghi. `dung()` từ chối danh sách khu rỗng — không bao giờ rơi về khu mặc định. Khu
   mới chỉ vào danh bạ qua lệnh tay; đêm không lan sang khu chưa ai chủ ý dựng.
4. `refresh-bait-gap.mjs` gọi thẳng `buocVatTheDem` đã import; không biến môi trường nào thay được mô-đun bước đêm.
   Chiều đỏ của phép đo dùng bản chép tệp, gọi trực tiếp.
5. Đêm không truyền từ điển chủ đầu tư: phát biểu `builder_name` mang `method: 'hitl'`, chỉ lệnh tay ghi.

Bước đêm hỏng → `refresh-bait-gap.mjs` thoát 1 (job_run gọi tên bước `refresh-bait-gap`, các bước sau của job vẫn chạy
như cũ); bait gap và danh bạ Người của lượt đó đã commit trước, không bị lùi.

### Đường đo của ngưỡng (bản chép chỉ đọc)

`pipeline/lib/danh-ba-vat-the.mjs` thêm `demTheoKhu(c)` (đếm độc lập toà, trục, căn theo khu bằng SQL trên ba bảng, không
qua tổng kết bộ dựng — cũng đóng Ngoài-19) và `soDem(may, ban)` (so hai bảng đếm, trả danh sách lệch `khu · cấp · máy ·
bản`). Ca dữ liệu thật `danh-ba-vat-the-that.itest.mjs` (chép chỉ đọc từ máy thu, đã có từ DB1) thêm bước: máy thu đã
dựng → `soDem(demTheoKhu(máy thu), demTheoKhu(bản chép))` phải rỗng; chưa dựng → in «máy thu chưa dựng — chưa so». Sau
lần dựng đầu trên máy thu, chạy lại ca này là phép đo của ngưỡng «đúng số toà/trục/căn như bản chép chỉ đọc».

### Lần dựng đầu trên máy thu

Không thuộc vòng S4 (mọi phép đo trên DB thử + bản chép chỉ đọc, như DB1). Sau Cổng Bằng chứng và sau khi gộp:
giám sát xin lời riêng của Mạnh, sao lưu bốn bảng (`buildings`, `stacks`, `units`, `registry_aliases`, cộng
`field_assertions` resource `Building`) bằng `pg_dump`, chạy
`node pipeline/danh-ba-vat-the.mjs --db-that --sao-luu <tệp dump> --tu-dien state/danh-ba-vat-the/chu-dau-tu.json` trên
máy thu, rồi chạy ca dữ liệu thật để so (phải ở nhánh so, lệch rỗng) và chạy lại `--db-that` (phải `khoa_moi = 0`). Từ lúc đó bước đêm tự giữ tươi.

### Tài liệu

`pipeline/CLAUDE.md` thêm dòng `danh-ba-vat-the.mjs` (cờ, đích, bước đêm, chỉ ghi DB trên máy này); `docs/ops/runtime-map.md`
ghi bước đêm trong `refresh-bait-gap` và rằng ở bản này ba bảng vật thể chưa đồng bộ lên cloud — phạm vi của vòng, không
phải luật (Ngoài-8).

## Phương án đã loại

- **Bước riêng trong `chotot-daily.sh`** — chỉ chạy 05:30/14:00, không chạy ngay sau transform S03; thêm một dòng
  `job_run` cũng chạm tệp ngoài ranh giới như phương án chọn mà kém nhịp hơn.
- **Bước trong `scripts/cloud-sync.sh`** — tệp T3, chạy 15 phút một lần; đưa vòng lên T3 vì một bước không rời máy.
- **Bỏ chặn tên `oneinvest` không thêm cờ** — một lệnh gõ sai `--db` là ghi thẳng máy thu; trái mẫu `label-ghep`.
- **Cờ mở cả máy chủ ngoài** — đường lên cloud của kho là đồng bộ có kiểm, không phải lệnh dựng; không có ca dùng hợp lệ.
- **Đêm tự dựng lần đầu** — lần đầu trên máy thu là lời riêng của Mạnh (ghi_chu hàng DB1b).
- **Lệnh tự `pg_dump` trước khi ghi** — giám sát đã có nếp sao lưu trước mỗi lần áp (081, 082, 083); lệnh chỉ đòi
  tệp sao lưu ở lần dựng đầu (`--sao-luu`), không tự dump (Hỏi-2).
- **Rào «chưa dựng» bằng đếm bí danh `ma_nguon`** — bí danh có thể có mà chưa toà nào (khôi phục lệch, nguồn khác);
  đếm toà là điều kiện đúng (gap-probe P1).

## Đặc tả UX

Bỏ — vòng không chạm giao diện (lệnh dòng lệnh + bước đêm); xem sổ quyết định.
