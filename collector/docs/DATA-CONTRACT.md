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

## manifest.json (schemaVersion 5)

```jsonc
{
  "schemaVersion": 5,               // 1–5 đều hợp lệ; collector ghi 5 khi kênh đó
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

## Nguồn S10 `s10-bang-hang` — bảng hàng chủ đầu tư (v8)

- Thư mục `vn/vn__s10-bang-hang__<id>/` (`city = "vn"`, nguồn nhiều tỉnh). **Một snapshot = một `project_id`** (1–2 item).
- Thu qua phiên đăng nhập của Mạnh (giá chỉ hiện khi đăng nhập). Phiên là tầng A: không có trong snapshot, không rời máy.
  Tên nguồn thật chỉ ở `source_registry` local; script thu giữ ở `research-local/` vì mang tên miền.
- Nhịp: chạy tay theo luật thu nguồn mới đã duyệt (nghỉ ≥5s, tuần tự, dừng khi 403/429/mất phiên/đòi xác minh); chưa có lịch.

| `kind` | `sourceId` | `payload` (nguyên văn) | `meta` |
|---|---|---|---|
| `stock_table` | `p<project_id>-bt<block_type>` (177 thấp tầng · 178 cao tầng) | `{ html, cond, order_by, total_record, html_options_TCBG }` | `request` (mọi tham số đã gửi: `project_id`, `block_type`, `block_id`, `block_is_project`, và từ lượt 11/11 `price_min`, `price_max`, `area_min`, `area_max`) · `endpoint` · `sessionLoggedIn` · `rows` (số `tr.p_row` lúc thu) · `projectLabel` · **từ lượt 11/11** `duAn` (tên dự án cha; `null` nếu dự án gốc) · `phanKhu` (tên phân khu; `null` nếu không có) |
| `project_tree` | `project-tree` | `{ items }` — mảng `{ project_id, label, du_an, phan_khu }` (lượt 11/11: 119 mục) | `from` (đường dẫn trang lấy cây) |

Luật đọc:
1. **Bộ lọc mặc định của máy chủ:** lời gọi không kèm `price_*`/`area_*` bị lọc (`cond` cho thấy). Snapshot không có
   `meta.request.area_max` (lượt 10/11) là THIẾU — bộ nạp bỏ qua; mỗi `sourceId` chỉ nạp snapshot mới nhất có đủ bộ lọc.
2. Một dòng sản phẩm = `tr.p_row` trong `payload.html`; khoá nguồn `stock_id` nằm trong `data-url` của ô đầu; **giá nằm trong
   chú thích HTML** (`<!-- … -->`) — bộ bóc phải đọc cả phần chú thích. Cột hiện khác nhau giữa 177 và 178 (bảng cột ở
   `research-local/s10-thu-them-20261110.md`).
3. Thông tin dự án, giá chủ đầu tư, trạng thái quỹ căn là công khai (ROADMAP §3 mục 38); tên nguồn thật vẫn tầng A.

## Nguồn S11 `s11-nn1-du-an` — tra cứu công khai dự án của nhà nước (v8, DA24a)

- Thư mục `vn/vn__s11-nn1-du-an__<id>/` (`city = "vn"`). Chỉ phần công khai không đăng nhập; không form, không vượt captcha.
  Phạm vi lượt đầu: dự án có mục tiêu đầu tư «Nhà ở thương mại» và «Thương mại, dịch vụ/văn phòng».
- Nhịp: một lượt/tuần chạy tay (lượt đầu 10/11: 478 dự án, 8.986 BĐS, 0 lỗi); chưa có lịch.

| `kind` | `sourceId` | `payload` (nguyên văn) | `meta` |
|---|---|---|---|
| `project_list_page` | `list-thuong-mai-p<trang>` | `{ json: { rows[{id, code, name, developers, address}], page, pageSize, total, hasNext, partial, areaOptions } }` | `request` (`query`, `investmentObjectives`, `page`, `pageSize` = 10 như trang) · `procedure` |
| `project_detail` | `du-an-<id>` | `{ detail: {found, id, project{…}}, properties: [trang 1…30 của danh sách BĐS], locations: [] }` | `request {id}` · `procedures` · `tongBds` |
| `project_properties` | `du-an-<id>-bds-tu-p31` | `{ properties: [trang 31…N] }` — phần bù cho dự án hơn 300 BĐS | `request {id, pageSize, pages[]}` · `procedure` · `tongBds` · `boSungCho` (= `sourceId` item gốc) |

Luật đọc:
1. Một trang BĐS: `{ rows[{id, projectCode, propertyType, floor, area, updatedAt}], total, … }` — **không có giá, không có
   trạng thái giao dịch**. Đủ danh sách BĐS của một dự án = `project_detail.properties` ∪ mọi `project_properties` có
   `boSungCho` trỏ về nó (cùng lượt, `fetchedAt` gần nhau); đối chiếu số dòng với `meta.tongBds`.
2. `detail.project` mang tên, mã, chủ đầu tư (+ mã định danh), địa chỉ, loại/nhóm dự án, ngày và cơ quan phê duyệt, quy mô,
   tổng vốn, diện tích, pháp lý — thông tin dự án công khai (mục 38). Không có PII cá nhân.
3. Mảng `properties` rỗng hoặc `tongBds = 0` là bình thường (đa số dự án chưa công bố BĐS).

## Nguồn S07 `s07-danh-muc` — danh mục và thông tin dự án (v9, DAZ3)

- Thư mục `vn/vn__s07-danh-muc__<id>/` (`city = "vn"`, nguồn toàn quốc); danh sách của nguồn có 608 trang × 10 thẻ, tức khoảng 6.080 dự án
  (đo 11/11). Mỗi snapshot là một lô nhỏ (5–10 item) ghi ngay
  khi lấy được, để gãy giữa lượt không mất phần đã lấy — một lượt thu cho ra nhiều snapshot.
- **Không đăng nhập.** Thu bằng trình duyệt thật ở phiên khách; `meta.sessionLoggedIn = false` là bắt buộc với
  `project_list_page` và `project_catalog`; item có `true` hoặc thiếu cờ thì bộ nạp bỏ có đếm (Mạnh duyệt 11/11, Hỏi-1 của hàng
  `thu-danh-muc-s07`). Riêng `project_sitemap` của
  lượt 10/11 không ghi cờ (tệp công khai) — vẫn nhận.
- Nhịp và trần do làn thu chọn (ROADMAP §3 mục 39): tuần tự, một lời mỗi lần; gặp 403, 429 hoặc trang thử thách thì dừng
  cả lượt, nghỉ lùi dần 1 → 3 → 12 → 24 giờ; không vượt lớp chặn bot. Script thu ở `research-local/` (mang tên miền),
  không nằm trong kho. Tên nguồn thật và tên miền chỉ ở `source_registry` local.
- Phạm vi: **có** trang danh sách dự án, trang một dự án, sitemap dự án; **không** tin rao, SĐT, API có xác thực, API tiện
  ích quanh dự án.

| `kind` | `sourceId` | `payload` (nguyên văn) | `meta` |
|---|---|---|---|
| `project_sitemap` | `sitemap-chi-muc` · `sitemap-<loại hình>` | `{ xml }` | `request {path}` · `loaiHinh` · `soUrl` (đếm mọi `<loc>`, gồm cả trang lọc) · từ 11/11: `sessionLoggedIn`, `httpStatus` |
| `project_list_page` | `list-p<trang>` | `{ listHtml }` — khối bao mọi link dự án của trang, đã bỏ `form`, `script`, `style`, `svg`, hộp liên hệ | `request {path, page}` · `sessionLoggedIn` · `httpStatus` · `soThe` · từ 11/11: `soTheChinh`, `trangCuoi` |
| `project_catalog` | `pj<pjId>` | `{ canonical, title, description, ogImage, ldJson[], paramsScript, mainHtml }` | `pjId` · `path` (không host) · `finalPath` · `loaiHinh` · `sessionLoggedIn` · `httpStatus` · `bytesFull` · `mainBytes` · `children[]` · từ 11/11: `descLinks[]`, `relatedLinks[]` |

Payload:
- `listHtml`: mỗi trang có **10 thẻ chính** (`.js__project-card`: tên, nhãn trạng thái, diện tích, số căn, số toà, địa chỉ,
  tóm tắt, chủ đầu tư nếu có, ảnh) và **một khối «nổi bật» lặp ở mọi trang** (khoảng 6 thẻ). `meta.soThe` đếm cả hai
  (thường 16); `meta.soTheChinh` chỉ đếm thẻ chính. Danh sách sắp theo «mới nhất» nên một dự án có thể lùi trang giữa
  hai lượt — cùng `pjId` xuất hiện ở hai trang là bình thường.
- `mainHtml`: `outerHTML` của khối nội dung chính đã bỏ thẻ tin rao, form và hộp liên hệ, `script`, `style`, `svg`. Giữ
  nguyên, không bóc ở collector: tiêu đề, địa chỉ, nhãn trạng thái kèm mốc, thông số, bảng tổng quan, hộp thuộc tính (chủ
  đầu tư kèm mã `ep<id>`, pháp lý, quy mô, giá), mô tả, tiện ích, mặt bằng, câu hỏi thường gặp, dự án liên quan, album.
- `ldJson`: chữ của mọi khối JSON-LD (thường `BreadcrumbList` và `FAQPage`). `paramsScript`: chữ của script mang
  `latitude`, `longitude`, `legacyId` — toạ độ do nguồn công bố.

Luật đọc (bên nạp):
1. **Tên miền thật có trong payload** (link ảnh, `canonical`, `paramsScript`, link trong mô tả). Raw ở local nên được phép;
   `stg_s07_*` thì không: link trang thành đường dẫn tương đối, link ảnh thành `s07://<máy con>/<đường dẫn>`, tên miền đứng
   trần trong chữ thành «S07». Bộ nạp suy tên miền từ chính snapshot (hoặc đọc `S07_HOST` ở cấu hình local) và dừng,
   không ghi, nếu còn sót tên miền trong bất kỳ dòng nào.
2. **Loại hình và khu vực đọc từ `meta.path`** (`/du-an-<loại hình>-<khu vực>/<slug>-pj<id>`, 12 loại hình), không đọc
   `meta.loaiHinh`: 7 item `project_catalog` ghi trước 01:00Z ngày 11/11 mang giá trị cắt sai (bất biến, giữ nguyên).
3. **Địa chỉ có hai lớp**: dòng địa chỉ thường là hai cấp mới; `BreadcrumbList` và đường dẫn dùng quận cũ. Giữ cả hai
   nguyên văn; khớp xã/phường là việc transform.
4. **Dự án con**: trang cha không có khối riêng — `meta.children` rỗng ở mọi item đã thu. Link tới dự án khác nằm trong
   phần mô tả (`meta.descLinks`, bộ nạp tự bóc lại từ `mainHtml` nên item cũ cũng có) là ứng viên cha–con; quyết định
   cha–con là việc của làn Claude. `relatedLinks` là khối «dự án liên quan», không phải cha–con.
5. **Giá và lịch sử giá** trên trang dự án chỉ dùng nội bộ (ROADMAP §3 mục 27), không lên cổng.
6. Khoá ba bảng stg là `(snapshot_id, pj_id)`: nạp lại cùng snapshot không nhân dòng; một dự án thu lại ở snapshot sau là
   dòng mới. Chọn bản mới nhất theo `captured_at` (= `fetchedAt` của item) là việc của bước đọc stg.
   Cột `attributes` của `stg_s07_project` là mảng cặp `{label, value}` theo thứ tự nguồn (đối tượng jsonb không giữ thứ tự).
7. Sitemap lẫn trang lọc (theo giá, theo tỉnh) với trang dự án: chỉ `<loc>` kết thúc bằng `-pj<id>` là dự án.

## Nguồn con S03 `s03-tu-lieu-drive` — tư liệu sau link Drive/Docs trong bài S03 (v10)

Mạnh chốt 11/11: «Thu link Drive trước», lượt tải đầu «Bỏ PSD». Chưa có bộ nạp stg (hàng thuộc cụm «Kho tư liệu dự án»,
làn Claude); `import-airbnb.mjs` không có nguồn này trong ALLOWLIST.

- **Thu gì**: tệp sau các link Google Drive/Docs mà bài S03 dẫn tới — chỉ link «ai có link cũng xem được»; không đăng
  nhập, không cookie, không xin quyền. Bỏ tệp PSD và biểu mẫu Forms. Trần mỗi lượt 5 GB; video > 300 MB chỉ ghi item bỏ.
  Tệp Google gốc (Sheets/Docs/Slides) xuất sang xlsx/docx/pptx. Gặp 403/429, «vượt hạn mức xem» hay trang xác minh → dừng
  cả lượt, phần còn lại ghi `run-stopped-blocked`; không thử lại liên tục, không đổi cách để né.
- **Hợp đồng và giấy tờ người mua KHÔNG vào snapshot** (QĐ1; raw bất biến nên tệp đã vào `media/` không gỡ được): tệp có
  tên tệp HOẶC tên thư mục khớp HĐMB, hợp đồng, đặt cọc, thoả thuận, CCCD/CMND/căn cước, giấy tờ khách, xác nhận chuyển
  tiền, uỷ nhiệm chi — mọi loại tệp — chỉ ghi item `drive-file-skipped` `contract-review-needed`. Item này KHÔNG mang
  `name`, `folderPath`, `rootLinks` (tên tệp hợp đồng hay có tên người mua): chỉ `driveId`, `posts`, `skipReason`,
  `matchedRule` (`contract|id-card|payment-proof`, mã luật, không chép chữ khớp) và `bytesAnnounced`. Bản tải cho người soát
  để ngoài `snapshots/` (thư mục xoá được của máy thu); soát xong là «bản mẫu» thì lượt sau ghi vào một snapshot mới.
- **Layout**: snapshot thường `vn/vn__s03-tu-lieu-drive__<ts>/` gồm `items-0001.json.gz`, `media/<sha256[:16]>.<ext>` —
  tên theo băm NỘI DUNG (khác `media/` v2 của zalo-agent, băm URL) — và `manifest.json` khai đủ mọi tệp trong `files`.
  Hai tệp cùng nội dung chỉ lưu một bản. `manifest.schemaVersion = 10`; `coverage.methods = {"public-link-no-login": n}`.
- **RawItem**: một item mỗi mã tệp Drive (một tệp được nhiều bài dẫn tới vẫn một item; `posts[]` là hợp các bài);
  `sourceId` = mã tệp Drive; `meta.method = "public-link-no-login"`. `payload` chung: `driveId`, `name`, `folderPath`
  (mảng tên thư mục tính từ gốc link), `googleNative` (`spreadsheets|document|presentation|null`), `typeGuess`
  (`image|pdf|spreadsheet|document|presentation|video|archive|psd|other` — ĐOÁN theo đuôi tên tệp; bộ nạp suy lại từ
  `contentType` và magic bytes), `rootLinks` (link gốc trong bài), `posts` (`[{post_id, group, posted_at}]`). `kind`:
  - `drive-file` — đã tải: thêm `file` (đường `media/…`), `sha256`, `bytes`, `contentType`.
  - `drive-file-skipped` — không tải: `skipReason` một trong `psd-excluded`, `video-over-300mb`, `run-cap-5gb`,
    `contract-review-needed`, `large-file-pending` (Drive trả trang cảnh báo «không quét được virus» cho tệp trên khoảng
    100 MB — collector KHÔNG bấm xác nhận; cỡ trang ghi ở `sizeShown`, chờ người quyết), `run-stopped-blocked`;
    `bytesAnnounced` khi biết.
  - `drive-file-error` — tải lỗi: `error` (`http <mã>`, `trang HTML lạ thay vì tệp`).

Luật đọc:

1. Tệp chỉ ở máy thu: không sync cloud, không lên Invest hay API; soát từng tệp làm sau ở Ops.
2. `posts[].group` là tên nhóm S03 (tầng C, ADR-0007 sửa 24/10). Item không có tên hay SĐT người gửi, không có định danh
   tài khoản thu (tầng A).
3. Tên tệp và nội dung có thể chứa SĐT người bán (tầng C) — giữ nguyên, collector không chuẩn hoá.
4. Cùng `driveId` ở hai snapshot: lấy bản mới nhất theo `fetchedAt`; cùng `sha256` là cùng nội dung.

## Lịch sử phiên bản

- **schemaVersion 11 (2026-11-11, DA29 s10-bang-hang-vao-danh-ba — meta dự án cho danh bạ)**: nguồn `s10-bang-hang`
  thêm `meta.duAn` (tên dự án cha), `meta.phanKhu` (tên phân khu) trên item `stock_table` (lượt thu 11/11 đã phát;
  `projectLabel` có từ v8), và item `kind project_tree` theo hình dạng thực tế lượt 11/11 (sourceId `project-tree`,
  payload `{ items }`, meta `{ from }`). Bên import ghi mỗi item stock_table một dòng `stg_s10_project`
  (migration 089 của làn Claude). THỨ TỰ SỐ PHIÊN BẢN: v9 = S07 `s07-danh-muc` và v10 = `s03-tu-lieu-drive` đã dùng trên
  nhánh DAZ3 của phiên thu thay (chưa gộp khi viết dòng này) — nhánh v11 lấy số 11 để không trùng khi gộp;
  bên import nhận `{1..11}`. Snapshot S10 ngày 11/11 mang `schemaVersion 4` (cùng hình dạng, bất biến, giữ nguyên).

- **schemaVersion 10 (2026-11-11, phiên thu thay làn thu — S03 tư liệu Drive, lượt tải đầu)**: thêm nguồn con
  `s03-tu-lieu-drive` (kind `drive-file`, `drive-file-skipped`, `drive-file-error`) — hình dạng ở mục nguồn phía trên.
  `media/` của nguồn này đặt tên theo băm nội dung. Manifest ghi `schemaVersion 10`. Chưa có bộ nạp; bên import chưa nhận
  nguồn này (bỏ qua có dòng báo).
- **schemaVersion 9 (2026-11-11, phiên thu thay làn thu — DAZ3 S07 danh mục dự án)**: thêm nguồn `s07-danh-muc` (kind
  `project_sitemap`, `project_list_page`, `project_catalog`) — hình dạng ở mục nguồn phía trên. RawItem không thêm trường
  chung. Mọi snapshot S07 tới nay mang `schemaVersion 4` trong manifest (`SnapshotWriter` chưa nhận số phiên bản; cùng
  hình dạng, bất biến, giữ nguyên) — bộ nạp nhận diện theo `source`, chấp nhận `{1..9}`. Nạp bằng
  `pipeline/import-s07-danh-muc.mjs` (bộ nạp riêng; `import-airbnb.mjs` không có nguồn này trong ALLOWLIST nên bỏ qua có
  dòng báo) vào `stg_s07_project_card`, `stg_s07_project`, `stg_s07_sitemap_url` của migration 093 (làn Claude); DB chưa
  áp 093 thì in `CHUA-AP-093`, thoát 0, không đánh dấu snapshot đã nạp.
- **schemaVersion 8 (2026-11-10, liên làn thay làn thu — DA24a S11, bảng hàng S10)**: thêm hai nguồn `s10-bang-hang`
  (kind `stock_table`, `project_tree`) và `s11-nn1-du-an` (kind `project_list_page`, `project_detail`, `project_properties`)
  — hình dạng ở hai mục nguồn phía trên. RawItem không thêm trường chung. Snapshot hai nguồn này ghi ngày 10/11 mang
  `schemaVersion 4` (ghi trước khi khai, cùng hình dạng — bất biến, giữ nguyên); từ lượt kế ghi 8 (`SnapshotWriter` nhận
  `{ schemaVersion: 8 }`). **Bên import phải chấp nhận `{1..8}`** và thêm hai nguồn vào ALLOWLIST cùng migration bảng
  `stg_s10_*` / `stg_s11_*` (làn Claude, sổ số migration giữ số); trước đó snapshot hai nguồn bị bỏ qua có dòng báo, không lỗi.

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
