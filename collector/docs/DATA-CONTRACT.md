# Data contract: one-invest-collector → one-invest

Hai repo không chia sẻ code. Collector cam kết các hình dạng sau; one-invest
pipeline (giai đoạn validate/ingest) chỉ nhận theo hợp đồng này.

## Raw snapshot layout (bất biến sau khi ghi)

```
snapshots/
  <city>/                          # hanoi, hcmc, ...
    <city>__<source>__<yyyymmddThhmmssmmm>[-n]/   # id giữ mili-giây; hậu tố -n
                                   # chỉ xuất hiện khi đâm trùng ms (hiếm) —
                                   # snapshot luôn ghi mới, không ghi đè
      items-0001.json.gz           # mảng RawItem, 1000 item/file
      items-0002.json.gz
      media/<hash16>.<ext>         # TÙY CHỌN (v2): ảnh tải từ URL trong
                                   # payload.media (zdn.vn) — tên = sha256(URL)
                                   # 16 ký tự đầu; khai đủ trong manifest.files
      manifest.json
```

## manifest.json — phiên bản hiện hành

> Số cao nhất importer nhận: **7**. Kênh tin S03 ghi **6** (`RawItem.meta.albumMeta`, ma-album-s03); nguồn hồ sơ S03 `s03-ho-so`
> ghi **7** (link-nguoi-ban-s03); kênh khác giữ số cũ. Chi tiết từng số ở mục «Lịch sử phiên bản» cuối tệp — một nơi duy nhất.
> Bộ nạp phải chịu được DB chưa có cột `album_meta` (077; bỏ trường + cảnh báo một lần) và chưa có bảng hồ sơ (080; không đánh dấu
> snapshot hồ sơ đã nạp).

## manifest.json (schemaVersion 5) — lịch sử

```jsonc
{
  "schemaVersion": 5,               // 1–7 đều hợp lệ (xem «Lịch sử phiên bản»); collector ghi 5 khi kênh đó
                                     // bắt đầu đính RawItem.seller (v5) — mỗi kênh
                                     // bật theo vòng thu số riêng, không bật đồng loạt
  "snapshotId": "hanoi__airbnb-listing__20261017T101500",
  "city": "hanoi",
  "source": "airbnb-listing",
  "startedAt": "…", "finishedAt": "…",
  "counts": { "items": 1234, "failed": 3 },
  "coverage": {                    // chỉ số độ tin cậy cốt lõi (ADR-0003)
    "discovered": 1250, "captured": 1234, "failed": 3,
    "methods": { "mapTiles": 1180, "searchPaging": 1230 },
    "overlap": { "methodA": "mapTiles", "methodB": "searchPaging",
                 "both": 1160, "onlyA": 20, "onlyB": 70 }
  },
  "files": [{ "name": "items-0001.json.gz", "sha256": "…", "bytes": 12345 },
            { "name": "media/1a2b…c9.jpg", "sha256": "…", "bytes": 45678 }]
}
```

## RawItem (trong items-*.json.gz)

```jsonc
{
  "source": "airbnb-listing",
  "sourceId": "12345678",          // id gốc của nguồn (Airbnb listing id)
  "kind": "listing",               // listing | calendar | search-page | …
  "fetchedAt": "2026-10-17T10:15:00Z",
  "payload": { },                  // NGUYÊN VẬN — mọi chuẩn hoá sống bên one-invest
  "seller": {                      // v5, TÙY CHỌN — chỉ kênh tin rao có người bán
    "accountRef": "S06:123456",    // định danh tài khoản/người gửi THEO NGUỒN —
                                   // tầng C (ADR-0007 mục 9); KHÔNG chứa định danh
                                   // tài khoản THU (tầng A)
    "displayName": "Nguyễn Văn A", // tên hiển thị người bán (tầng C)
    "phone": "+84901234567",       // SĐT E.164 +84 + 9 chữ số (di động VN); null = chưa có
    "phoneStatus": "hidden_by_source", // available | hidden_by_source | not_tried | error
    "seenAt": "2026-11-02T08:00:00Z"   // giờ collector thấy người bán gắn tin này
  },                               // (mặc định = fetchedAt khi không có riêng)
  "meta": {                        // tùy chọn: phương pháp discovery
    "method": "mapTiles",
    "mediaFiles": [                // v2, chỉ source zalo-agent: mapping ảnh đã
      { "url": "https://…zdn.vn/….jpg",   // tải vào media/ của snapshot này.
        "file": "media/1a2b…c9.jpg",      // URL gốc CÓ HẠN — dùng file thay thế.
        "sha256": "…", "bytes": 45678,    // Thiếu file/hoặc error: URL lỗi.
        "error": "timeout" }
    ]
  }
}
```

### `seller.phoneStatus` — trạng thái lấy số

| Giá trị | Nghĩa |
|---|---|
| `available` | đã có số — công khai trong payload, hoặc đã lấy qua cơ chế hợp lệ của nguồn (vd nút «hiện số») |
| `hidden_by_source` | nguồn che số, CHƯA lấy được qua cơ chế hợp lệ |
| `not_tried` | chưa thử lấy số cho kênh/loại tin này |
| `error` | đã thử và lỗi (hạn mức, phiên thu hết hạn, nguồn đổi giao diện) — thử lại ở lượt sau |

Luật người bán (v5):

1. `seller` TÙY CHỌN: kênh không có người bán (osm, S02…) hoặc tin chưa đủ
   dữ kiện → bỏ cả key; bên đọc coi là «không biết», không suy gì thêm.
2. `phone` luôn chuẩn hoá E.164 `+84…` trước khi ghi; không đưa số thô các dạng.
3. `seller` là tầng C (công khai, ADR-0007 mục 9) — NGOẠI LỆ S08: vẫn xoá SĐT
   trước khi ghi thô, giữ nguyên chính sách hiệu chuẩn nội bộ.
4. `accountRef` chỉ định danh NGƯỜI BÁN theo nguồn — không lẫn định danh tài
   khoản THU (tầng A, không rời máy local).

### Ánh xạ trường người bán theo kênh (trạng thái 2026-11-02)

Trường nào ĐÃ có sẵn trong payload snapshot hiện tại, trường nào chưa:

| Kênh | accountRef | displayName | phone | phoneStatus hiện tại | Ghi chú |
|---|---|---|---|---|---|
| S01 | `hostId` nằm sâu trong payload (pdpSections/deferredState) — chưa tách | chưa tách | nguồn che (ẩn SĐT chủ nhà) | `not_tried` | người bán = chủ nhà cho thuê ngắn hạn |
| S03 | ✅ `payload.senderId` | ✅ `payload.senderName` | ✅ số trong `payload.text` (parser trích sẵn) | `available` khi text có số, còn lại `not_tried` | stg có senderId 54.237/55.646 |
| S05 | ✅ `payload.senderId` (`user.id`) | ✅ `payload.senderName` | hiếm — nguồn hạn chế SĐT trong post | `not_tried` | S05 paused tới 7/11 |
| S06 | ✅ `payload.account_id` | ✅ `payload.account_name` | ❌ 0/51.994 — nguồn che 100% | `hidden_by_source` | `account_id` có 51.994/51.994 dòng (15.199 tài khoản); nút «hiện số» không cần đăng nhập — xem `seller-thu-so-phuong-an.md` |
| S07 (chưa đăng ký) | — | — | — | `not_tried` | chưa thu |

Khi một kênh bắt đầu ghi `seller`, manifest của kênh đó chuyển `schemaVersion: 5`
(theo vòng thu số riêng được cấp); kênh chưa ghi seller giữ version cũ — importer
chấp nhận cả hai.

## Lịch sử phiên bản

- **schemaVersion 6 (2026-11-05, ma-album-s03 — gộp cùng v7 để hai nhánh không xung đột)**:
  thêm `RawItem.meta.albumMeta` cho kênh tin S03 (khoá album từ
  `content.params`: `group_layout_id` + `id_in_group` bắt buộc,
  `total_item_in_group`/`is_group_layout`/`child_number`/`msg_type` tuỳ chọn);
  item đi trong `media[]` mục chỉ chứa `albumMeta`. Kênh khác không đụng.
  (0711-37(e): v6 từng chỉ khai trên nhánh album chưa gộp — khai đây để
  v7 (kế tiếp) không tạo lỗ hổng «nhánh nào cũng đúng, gộp thì thiếu».)
- **schemaVersion 7 (2026-11-06, link-nguoi-ban-s03/claudedp-0611-6)**: thêm
  nguồn `s03-ho-so` + kind `ho-so` (hồ sơ người bán S03 tra theo mã tài khoản
  qua phiên kênh đang nối — chỉ đọc, có trần, tự dừng). Mỗi lô kết quả thành
  MỘT snapshot riêng: `RawItem` = `sourceId = "<ma_tai_khoan>__<lay_luc ISO>"`,
  `payload = {ma_tai_khoan (số), username (chuỗi ≤120, rỗng khi không có),
  loai (co-username|khong-username|khong-ro|khong-tim-thay)}`, `meta =
  {city, loai_ket_qua, ts}` — KHÔNG PII nào khác (không SĐT/tên/ảnh/ngày sinh
  lên snapshot). Chỉ nguồn `s03-ho-so` ghi kind này; các nguồn khác giữ
  version cũ. **7 là số kế tiếp sau 6 (`album_meta`, nhánh ma-album-s03 chưa
  gộp) — bên import phải chấp nhận `{1..7}`, với {6,7} phía S03 bất kể thứ tự
  gộp hai nhánh.** Bảng stg hồ sơ + ghi liên lạc theo migration 080 (làn
  Claude); bộ nạp gặp DB chưa có 080 in `CHUA-AP-080`, thoát 0, KHÔNG đánh
  dấu snapshot hồ sơ đã nạp, loại khác nạp như cũ.
- **schemaVersion 5 (2026-11-02, claudedp-0211-1 hợp đồng người bán)**: thêm
  `RawItem.seller` (người bán: `accountRef` · `displayName` · `phone` E.164 ·
  `phoneStatus` · `seenAt`) — tầng C theo ADR-0007 mục 9; S08 vẫn xoá SĐT khi
  ghi thô. Tương thích cũ (seller tùy chọn — kênh không người bán bỏ key);
  **bên import phải chấp nhận `{1..5}`** (`import-airbnb.mjs`,
  `import-chotot.mjs` nới cùng vòng). Collector TS chưa đổi mặc định (vẫn ghi
  4) — từng kênh chuyển lên 5 khi được cấp vòng thu số riêng.
- **schemaVersion 4 (2026-10-24, PL10/claudedp-2310-12; sửa chữ 2610-22)**:
  thêm kind `inventory_unit` + nguồn `s08-danh-muc` (S08 — quỹ căn chủ đầu tư,
  sourceId = sha256(S08|project|product_code), meta {projectId, projectType,
  state notSold|sold|detail, productCode}; payload bản ghi API nguyên vẹn,
  KHÔNG contact_data). Từ 24/10 (mở rộng all) kind `project_catalog` — mỗi dự
  án 1 item danh mục, state=catalog, productCode=project-<id>, sourceId =
  sha256(S08|catalog|project_id) TÁCH khỏi item detail cùng dự án (2610-22(2)
  sửa trùng sha256(S08|project|id) cũ — snapshot cũ giữ nguyên, bất biến).
  Tương thích cũ; bên import chấp nhận `{1,2,3,4}`.
- **schemaVersion 3 (2026-10-23, claudedp-2310-11 Kev-nhãn)**: thêm
  `RawItem.meta.kev = {p, model, threshold, at}` cho nguồn `zalo-agent`/`openclaw-hook` —
  điểm gate Kev-4B đi CÙNG tin như dữ liệu (p=null khi gate down); KHÔNG còn lọc p<0.9 ở
  hook. Bên tiêu thụ v2 bỏ qua key lạ vẫn đọc được; **bên import phải chấp nhận `{1,2,3}`**.
- **schemaVersion 2 (2026-10-22)**: thêm file `media/*` trong snapshot +
  `RawItem.meta.mediaFiles` (ảnh zdn.vn tải lúc flush vì URL có hạn). Mọi hình
  dạng v1 giữ nguyên — bên tiêu thụ v1 bỏ qua key lạ vẫn đọc được items; chỉ
  khác số `schemaVersion`. **Bên import phải chấp nhận `{1,2}`** (hiện
  `pipeline/import-airbnb.mjs` đang chốt `!== 1` — cần nới trước khi merge).
- schemaVersion 1: bản gốc.

## Quy tắc tiêu thụ (bên one-invest)

1. Đọc `manifest.json`; từ chối snapshot nếu `schemaVersion` chưa hỗ trợ.
2. Verify `sha256` từng file trong `files` trước khi gunzip + parse (gồm cả
   `media/*`).
3. Không bao giờ ghi lại vào raw zone; transform luôn tạo tầng mới (staging DB).
4. `coverage` ghi kèm kết quả transform để hiển thị độ tin cậy trong sản phẩm.
5. Snapshot có `error` (run failed) vẫn hợp lệ về hình dạng — dùng cho chẩn đoán,
   không dùng làm nguồn metrics.
6. Ảnh `media/*` là PII tầng A (ADR-0007): chỉ máy local, không sync cloud.
