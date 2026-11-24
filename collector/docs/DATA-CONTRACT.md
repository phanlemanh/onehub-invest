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

## Nguồn S09 `s09-danh-ba` — danh bạ căn: bản đồ toà/tầng/thấp tầng (nháp v15, claudedp-1811-12)

> **NHÁP — số 15 CHƯA GHIM**: v13 = S09 danh mục; v14 = S16 thuộc tính căn (nháp đang trên nhánh khác).
> S17 đã nhận số 17 riêng (claudedp-2411-20). Số 15 chốt lúc gộp, bên đọc nhận diện theo `source`, không theo số.

- Thư mục `vn/vn__s09-danh-ba__<id>/`; **không đăng nhập**, API danh bạ công khai (client `publicRequester`);
  `manifest.coverage.methods = {"danh-ba-cong-khai-http": n}`. Script thu ở `research-local/` (mang tên miền), không
  nằm trong kho; tên nguồn thật và tên miền chỉ ở `source_registry` local.
- Nhịp do làn thu chọn (đo 18/11: 3s trên ~1.600 lời 0 chặn); 403/429 → **dừng cả lượt**, chốt snapshot phần đã có
  kèm `manifest.error`, thoát khác 0; lỗi mạng/5xx thử lại 3 lần (5s/15s/30s) rồi ghi `meta.loi` và đi tiếp.
- **Payload nguyên văn** phản hồi `{code, data}` — collector không bóc, không chuẩn hoá. **Item rỗng vẫn ghi**
  (dự án 0 toà, toà 0 tầng, khu không kích hoạt) — `meta.so*` ghi số phần tử nhận được để đối soát «có trong
  danh mục ≠ có dữ liệu».
- Một lượt thu gói 1 (bản đồ): 1 lời danh mục + 1 lời `toa` mỗi dự án + 1 lời `tang` mỗi toà + 1 lời
  `khu-thap-tang` mỗi dự án + 1 lời `can-thap-tang` mỗi khu. Gói 2 (căn cao tầng theo tầng) là lượt riêng —
  **không lẫn vào nguồn này ở lượt bản đồ**.

| `kind` | `sourceId` | `payload` (nguyên văn) | `meta` |
|---|---|---|---|
| `danh-muc` | `danh-muc` | `{code, data[du_an]}` — toàn quốc, 1 item/lượt | `duong` · `status` · `soDuAn` · `loi?` |
| `toa` | `<du_an_id>` | `{code, data[toa]}` — `data` rỗng khi dự án không kích hoạt toà | `duAnId` · `duAnTen` · `duong` · `status` · `soToa` · `loi?` |
| `tang` | `<toa_id>` | `{code, data[tang]}` — tên tầng nguyên văn («02», «12B») | `duAnId` · `toaId` · `toaTen` · `duong` · `status` · `soTang` · `loi?` |
| `khu-thap-tang` | `<du_an_id>` | `{code, data[khu]}` — phân khu thấp tầng | `duAnId` · `duAnTen` · `duong` · `status` · `soKhu` · `loi?` |
| `can-thap-tang` | `<khu_id>` | `{code, data[can]}` | bản 19/11: `duAnId` · `khuId` · `khuTen` · `size` · `soCanNhan` · `canDuTrang` · `duong` · `status` · `loi?` — các lượt bù 20/11: `duAnId` · `khuId` · `tienTo` · `tongNguon` · `soCanNhan` · `loi?` |

`canDuTrang` (lượt bản đồ 19/11) ĐẶT THEO MỐC size=2000 nhưng nguồn cắt cứng **500/lời** nên cờ
không bao giờ bật — bỏ từ lượt thu bù 20/11; đối soát đủ/thiếu bằng `meta.total` của phản hồi
(**tổng căn THẬT theo tiền tố** — vd khu 11.098 căn) so Σ mã gom. Đặc tả nguồn đã đo 20/11:
cắt cứng 500/lời; `page/offset/from/skip/sort/order/house_type/size>500` BỊ PHỚT lờ;
`property_number` là BỘ LỌC TIỀN TỐ mã căn (không phân biệt hoa/thường); phân trang thực tế =
duyệt tiền tố (prefix-DFS) từ quan sát + quét lỗ giữa dải số; phần không truy được qua tiền tố
khai trong bảng đối soát (đừng suy ra phần thiếu là gì).

**Luật hợp căn (các lượt bù 20/11)**: cùng khu có NHIỀU item `can-thap-tang` (mỗi tiền tố duyệt
một item, cùng `sourceId` = khu_id) và căn TRÙNG xuất hiện giữa các lá/lượt (tiền tố đè nhau do
cấu trúc mã đan xen `NHÀ.LÔ-CĂN`/`NHÀ.LÔ-CĂN TRỰC TIẾP`/`LÔ SỐ 3 CHỮ SỐ` cùng không gian) —
**bên đọc PHẢI hợp theo `data[].id`** (khử trùng id toàn khu), không cộng số `soCanNhan` giữa
các item; đối soát đủ/thiếu bằng Σ id hợp so `tongNguon` (lượt 48 khu 20/11: khu lớn nhất gom
hợp theo id 10.910 — số 10.974 trong tin XONG là đếm trùng tiền tố). `payload.meta` mang
`{page, size, total}` của nguồn — `total` là tổng căn THẬT theo tiền tố, dùng để đối soát.
Giữ nguyên khuôn `canDuTrang/size` chỉ để đọc bản 19/11 (bất biến).

Khuôn MỘT item mỗi kind (tên dự án/toà/khu ĐÃ THAY bằng giả; uuid rút gọn; `{code,data}` giữ khuôn thật):

```json
{"source":"s09-danh-ba","kind":"danh-muc","sourceId":"danh-muc","fetchedAt":"2026-11-19T00:49:00.000Z",
 "meta":{"duong":"<đường API · danh mục dự án>","status":200,"soDuAn":221,"loi":null},
 "payload":{"code":200,"data":[{"id":"00000000-0000-4000-8000-000000000001","name":"<du-an-gia-1>","project_locations":[{"district":{"code":"001","name":"<quan-gia>"},"province":{"code":"01","name":"<tinh-gia>"}}],"channel_code":["AVM"],"demand_code":["SECONDARY_BUYING","SECONDARY_SELLING"]}]}}
{"source":"s09-danh-ba","kind":"toa","sourceId":"00000000-0000-4000-8000-000000000001","fetchedAt":"2026-11-19T00:49:03.000Z",
 "meta":{"duAnId":"00000000-0000-4000-8000-000000000001","duAnTen":"<du-an-gia-1>","duong":"<đường API · toà theo dự án>","status":200,"soToa":4,"loi":null},
 "payload":{"code":200,"data":[{"id":"00000000-0000-4000-8000-0000000000a1","name":"TA1"},{"id":"00000000-0000-4000-8000-0000000000a2","name":"TB2"}]}}
{"source":"s09-danh-ba","kind":"tang","sourceId":"00000000-0000-4000-8000-0000000000a1","fetchedAt":"2026-11-19T00:49:06.000Z",
 "meta":{"duAnId":"00000000-0000-4000-8000-000000000001","toaId":"00000000-0000-4000-8000-0000000000a1","toaTen":"TA1","duong":"<đường API · tầng theo toà>","status":200,"soTang":29,"loi":null},
 "payload":{"code":200,"data":[{"id":"00000000-0000-4000-8000-0000000000b1","name":"02"},{"id":"00000000-0000-4000-8000-0000000000b2","name":"12B"}]}}
{"source":"s09-danh-ba","kind":"khu-thap-tang","sourceId":"00000000-0000-4000-8000-000000000002","fetchedAt":"2026-11-19T00:49:09.000Z",
 "meta":{"duAnId":"00000000-0000-4000-8000-000000000002","duAnTen":"<du-an-gia-2>","duong":"<đường API · khu thấp tầng theo dự án>","status":200,"soKhu":1,"loi":null},
 "payload":{"code":200,"data":[{"id":"00000000-0000-4000-8000-0000000000c1","name":"<khu-gia>"}]}}
{"source":"s09-danh-ba","kind":"can-thap-tang","sourceId":"00000000-0000-4000-8000-0000000000c1","fetchedAt":"2026-11-19T00:49:12.000Z",
 "meta":{"duAnId":"00000000-0000-4000-8000-000000000002","khuId":"00000000-0000-4000-8000-0000000000c1","khuTen":"<khu-gia>","size":2000,"soCanNhan":387,"canDuTrang":false,"duong":"<đường API · căn thấp tầng theo khu>","status":200,"loi":null},
 "payload":{"code":200,"data":[{"id":"00000000-0000-4000-8000-0000000000d1","name":"NT1-01","code":"NT1-01","increment_number":1005259}]}}
```

Khuôn lượt bù 20/11 (cùng kind, MỘT item mỗi tiền tố duyệt; hợp căn theo `data[].id`):

```json
{"source":"s09-danh-ba","kind":"can-thap-tang","sourceId":"00000000-0000-4000-8000-0000000000c1","fetchedAt":"2026-11-20T00:52:30.000Z",
 "meta":{"duAnId":"00000000-0000-4000-8000-000000000001","khuId":"00000000-0000-4000-8000-0000000000c1","tienTo":"NT1","tongNguon":740,"soCanNhan":220,"loi":null},
 "payload":{"code":200,"data":[{"id":"00000000-0000-4000-8000-0000000000d1","name":"NT1-01","code":"NT1-01","increment_number":1005259}],
            "meta":{"page":0,"size":500,"total":220}}}
```

Khoá nối với S16/S08 (chi tiết số đo ở tệp kê local của lượt, không commit):
- Căn cao tầng: `data[].name == data[].code`, khuôn `TÒA.TẦNG.CĂN` (ví dụ giả `TA1.12B.03`) — tách được 3 phần,
  so trực tiếp với cặp (`toa`, `ma_can`) của S16 và `property_code` của S08; tầng so được qua tên tầng nguyên văn.
- Căn thấp tầng: khuôn `NHÀ.CĂN` (ví dụ `NT1-01`) — tiền tố nhà theo khu, không tách được tầng (không có tầng);
  so qua bảng tên nhà ↔ tên khu của dự án.
- UUID dự án/toà/tầng/căn của nguồn này là quan hệ bền (khoá nối cấp cao nhất); **khác** namespace với
  `insight_by_block[].id` của nguồn `s09-du-an` — ánh xạ qua (`du_an_id`, tên toà), không so uuid chéo.

## Nguồn S17 `s17-thua-dinh-gia` — thửa đất định giá, căn hộ, dự án (v17, claudedp-2411-20)

> Mốc ngày 1 (24–25/11/2026) thu phần chắc: bảng tham chiếu, dự án, mặt nạ vùng có ranh thửa. Bốn kind có phiên còn
> lại (`can_ho_list`, `can_ho_detail`, `thua`, `mix_gia`) thuộc mốc ngày 2 (claudedp-2411-21): khuôn của bốn kind này
> là thiết kế, hiện đánh «chưa thu». Mã bộ thu: `collector/src/collectors/s17-thua-dinh-gia/`.

- Thư mục `vn/vn__s17-thua-dinh-gia__<id>/`. **Một lượt thu = nhiều snapshot nhỏ** ghi ngay khi lấy được: một trang
  danh sách dự án, hay một tỉnh của mặt nạ tile, là một snapshot; bảng tham chiếu và chi tiết dự án gộp theo lô (50 item,
  5 dự án). Bộ thu chỉ ghi nhận «đã lấy» SAU khi snapshot chốt xong, nên gãy giữa lượt (bị chặn, hết phiên, quá trần)
  không mất dữ liệu đã chốt; tối đa một lô đang dở được lấy lại ở lượt sau ⇒ cùng `sourceId` có thể nằm trong hai
  snapshot, bên đọc lấy bản mới nhất theo `fetchedAt`. Lô đang dở lúc dừng được chốt kèm `manifest.error` (lý do dừng);
  không còn gì đang dở thì không sinh snapshot rỗng. `manifest.schemaVersion = 17`; `coverage.notes` của mọi snapshot
  mang đúng `S17 khuôn 2 (mốc ngày 1, claudedp-2411-20)`.
- **Hai chế độ thu**:
  - *công khai* — `static_config`, `gia_ubnd`, `tile_coverage`: gọi bằng fetch thường kèm header Origin của trang
    nguồn, không mang phiên;
  - *có phiên* — `du_an_list`, `du_an_detail` (và bốn kind của mốc ngày 2): gọi TRONG TAB của hồ sơ nơi Mạnh đã đăng
    nhập (trình duyệt ego lite), phiên do chính trang gắn. Thông tin phiên là tầng A: không rời trình duyệt, không vào
    snapshot, không vào log.
- **Đường API không nằm trong hợp đồng lẫn trong code.** Bộ thu gọi theo *vai* (`project-list`, `project-detail`,
  `building-tree`, `gallery`, `land-price-by-district`…); đường thật đọc từ tệp local ngoài git
  (`~/.oneinvest/s17-thua-dinh-gia.json`); mỗi vai chỉ nhận đúng tên tham số đã khai. Đường hay tham số ngoài danh
  sách bị từ chối trước khi gửi. `sourceId` và `kind` dùng chữ trung tính, không mang tên đường.
- Nhịp 300–400 ms một lời (mức nguồn đã chịu được); trần lời gọi và trần thời gian phải khai mỗi lần chạy. 403, 429,
  trang thử thách, hết phiên, quá trần → dừng cả lượt, không gửi thêm lời nào. Lỗi mạng và 5xx thử lại sau 5 s, 15 s,
  30 s rồi tính là thất bại của riêng bản ghi đó. Chạy như tiến trình của phiên, chưa có lịch.
- Phạm vi PII: hồ sơ thửa, căn, dự án chỉ có thuộc tính vật thể (không tên, SĐT chủ sở hữu). Không có lớp người bán ⇒
  RawItem không mang `seller`.

| `kind` | `sourceId` | `payload` (nguyên văn) | `meta` |
|---|---|---|---|
| `static_config` | `static-cau-hinh-day-du` · `static-danh-muc-tinh` · `static-danh-muc-quan-<mã tỉnh>` · `static-tu-dien-thuoc-tinh-<1\|2\|3>` · `static-giay-to-phap-ly-<1\|2>` · `static-loai-tai-san` · `static-do-tin-cay` · `static-muc-dich-su-dung-dat` | `{ json }` — phản hồi gốc của một bảng tham chiếu (danh mục tỉnh đo 24/11: 71 mục, 63 mã — 8 mã trùng do sáp nhập, mỗi mã có một danh mục quận) | `request` (tham số đã gửi) · `congKhai: true` · `soPhanTu` (số phần tử cấp trên) · `soTinh` (danh mục tỉnh) · `soQuan` (danh mục quận của một tỉnh) · `boQuaKhongMa` (mục danh sách quận không có mã) |
| `gia_ubnd` | `ubnd-<mã quận>` | `{ json }` — bảng đơn giá đất theo vị trí của một quận; `data` rỗng khi quận không có bảng | `request {districtCode, provinceCode}` · `congKhai: true` · `soViTri` |
| `tile_coverage` | `coverage-<id tỉnh>` (`id` của `areas` cấp market) | `{ tiles: ["z/x/y", …] }` — tile ranh thửa mức 17 CÓ DỮ LIỆU trong số các điểm đã quét của tỉnh; không lưu ảnh | `request {zoom}` · `congKhai: true` · `ten` · `soDiemQuet` · `trong` · `rong` · `vang` · `loi` |
| `du_an_list` | `trang-<n>` (tính từ 1) | `{ json }` — một trang danh sách dự án: `data.projects.content[]` (mỗi mục có `id`, `estate_type`, `loai_du_an`, `tinh_trang`, `properties`) cùng `totalElements`, `totalPages`; đo 24/11: 2.508 dự án, 26 trang | `request {query, page, size}` · `tongDuAn` · `soTrang` · `soMuc` · `khongId` (mục không có id) |
| `du_an_detail` | `du-an-<id>` | `{ detail, filterOptions, gallery }` — ba phản hồi gốc của một dự án: hồ sơ, cây lựa chọn toà → tầng → hướng → diện tích, thư viện ảnh | `request {id}` · `coBangCan` (`true` \| `false` \| `null`) |
| `can_ho_list` *(chưa thu)* | `du-an-<id>-toa-<toà>-trang-<n>` | `{ json }` — một trang liệt kê căn theo toà | `request {project_id, thap, page, size}` |
| `can_ho_detail` *(chưa thu)* | `du-an-<id>-can-<ma_can>` | `{ json }` — hồ sơ một căn | `request {project_id, ma_can}` · `khopMaCan` |
| `thua` *(chưa thu)* | `thua-<mã địa chính>` | `{ json }` — hồ sơ thửa theo toạ độ: đa giác ranh giới, kích thước, tiếp giáp đường, đơn giá đất theo trạng thái quy hoạch | `request` · `phuongPhap` (`suggest` \| `grid`) |
| `mix_gia` *(chưa thu)* | `toado-<lat>-<lng>` | `{ json }` — đơn giá thị trường theo toạ độ | `request` · `ganThua` |

Luật đọc:

1. **Đếm một kind** = cộng `counts.items` theo `coverage.methods[<kind>]` qua mọi snapshot S17 mang dấu hiệu `S17 khuôn 2`
   trong `coverage.notes`. Snapshot S17 KHÔNG mang dấu hiệu này là bản ghi lúc dựng bộ thu sáng 24/11 (`sourceId` khuôn
   1) — bên đọc bỏ qua.
2. `tile_coverage`: `trong` = tile có dữ liệu; `rong` = tile rỗng (1.784 byte); `vang` = tile không tồn tại; `loi` = lỗi
   tạm. `soDiemQuet` = số điểm đã quét của tỉnh. Điểm quét là lưới bước 34 tile (khoảng 10 km) CHỈ trên đất, 34 tỉnh
   hiện hành, 5.206 điểm (sinh bằng `collector/src/collectors/s17-thua-dinh-gia/luoi-tile.sql`). Mặt nạ nói «vùng này
   có dữ liệu», KHÔNG phải ranh giới phủ.
3. `gia_ubnd` với `soViTri = 0`: đã hỏi và nguồn không có bảng cho quận đó — khác với chưa hỏi (đo 24/11: 710 quận,
   cả 710 đều có bảng).
4. `du_an_list`: một dự án = một `id` trong `data.projects.content[]`; id trùng giữa các trang chỉ tính một lần.
   `meta.tongDuAn` là tổng nguồn công bố — đối chiếu với số id duy nhất. Mục danh sách đã mang `properties`: nhiều
   trường của chi tiết có sẵn ở đây.
5. `du_an_detail`: một item gom ba phản hồi của một dự án. Dự án lấy lỗi không có item; danh sách đó nằm ở trạng thái
   bộ thu trên máy thu và được báo trong lượt XONG. `coBangCan = null` khi chi tiết không mang cờ — bên đọc không suy
   ra `false`. Ảnh dự án CHƯA tải: payload chỉ có link.
6. **Hai namespace dự án** (`du_an` căn hộ và `du_an_nha_dat` thấp tầng) trùng dải id: khoá dài hạn là cặp
   (namespace, id). Chi tiết thấp tầng cần cờ riêng trên cùng một đường (phát hiện tĩnh từ mã ứng dụng 24/11, chưa đo).
7. **Tên miền thật có trong payload** (link ảnh, link quyết định, kho ảnh nguồn): raw ở local được phép; `stg_s17_*` thì
   không — cùng luật với S07 mục 1. Payload thửa có link ký số tạm thời (hết hạn sau 24 giờ): bên đọc không dựa vào.
8. *(mốc ngày 2)* `can_ho_detail`: tham số để tra một căn là `ma_can`; đối chiếu `ma_can` trong phản hồi với `ma_can` đã
   gửi, lệch thì bỏ. Liệt kê căn theo toà có thứ tự trang không ổn định: quét hết mọi trang, khử trùng theo mã căn.
9. *(mốc ngày 2)* Thửa: định danh bền là mã địa chính (`ogc_fid`); khử trùng giữa các phương pháp theo mã này.

**Việc kèm bên one-invest (làn Claude, DA58)**: ALLOWLIST thêm `s17-thua-dinh-gia`; migration `stg_s17_*` (sổ số giữ
128 tạm). Mẫu snapshot thật lấy từ thư mục snapshot của máy thu (thư mục `vn/vn__s17-thua-dinh-gia__*` mang dấu hiệu
`S17 khuôn 2`), không qua kênh.

## Lịch sử phiên bản

- **schemaVersion 17 (2026-11-24, claudedp-2411-20 — S17 `s17-thua-dinh-gia`, mốc ngày 1)**: thêm nguồn
  `s17-thua-dinh-gia` với chín kind — năm kind của mốc ngày 1 (`static_config`, `gia_ubnd`, `tile_coverage`, `du_an_list`,
  `du_an_detail`) và bốn kind của mốc ngày 2 (`can_ho_list`, `can_ho_detail`, `thua`, `mix_gia`, chưa thu). RawItem không
  thêm trường chung. Một lượt thu cho ra nhiều snapshot nhỏ; `manifest.schemaVersion = 17`. Bộ thu ở
  `collector/src/collectors/s17-thua-dinh-gia/`, chạy tay như tiến trình của phiên. Chưa có bộ nạp và migration (làn
  Claude giữ số 128 tạm); bản nháp gốc và số đo ở tư liệu local của phiên S17.

- **schemaVersion 15 (2026-11-19, nháp claudedp-1811-12 — S09 danh bạ căn, gói 1 bản đồ)**: thêm nguồn
  `s09-danh-ba` (mục ở trên) với năm kind `danh-muc/toa/tang/khu-thap-tang/can-thap-tang`, payload nguyên văn
  `{code,data}`. NHÁP — số 15 chưa ghim (v14 = S16 thuộc tính căn đang nháp nhánh khác; S17 cũng nháp cùng số);
  bên đọc nhận diện theo `source`. Chưa có bộ nạp/migration (làn Claude giữ 115); gói 2 căn cao tầng theo tầng là
  lượt riêng của nguồn này (DA43 đã ký Cổng Phạm vi, chờ Cổng Bằng chứng).
- **schemaVersion 13 (2026-11-14, claudedp-1411-8 — S09 danh mục dự án khuôn API, bộ nạp `stg_s09_item`)**: nguồn
  `s09-du-an` (khuôn API, một lượt thu toàn danh mục `vn/vn__s09-du-an__<ISO>/`, `manifest.coverage.methods =
  {"api-cong-khai-http": n}`; snapshot 13/11 mang `schemaVersion 1` trong manifest — bất biến giữ nguyên, bộ nạp nhận
  diện theo `source`; số 13 bỏ qua 12 vì **v12 = S16 (nháp chờ duyệt)** — snapshot S16 13-14/11 đã
  ghi 12). Hình dạng item: `danh-muc` (`{ url, soTrang, soDuAn }`, một item mỗi lượt) và `du-an` (`du-an-<id>`,
  `{ url, danhMuc, chiTiet: { data, meta: { code } } }` — `data.id` uuid là khoá dự án; `insight_by_block[]` là toà
  (`id` uuid khoá toà, `block_code`/`block_name`, `sector_uuid` và `handover_date_from` có thể vắng, một tên có thể
  hai `id`); `insight_by_sector[]` phân khu; `blocks` KHÔNG phải số toà; `chiTiet.meta.code` khác `"200"` → item
  không dùng. **Bên đọc không dùng `manifest.coverage.notes` và `item.meta` làm dữ liệu** — lời Mạnh kèm bản 13/11:
  «meta.layTu và notes của manifest bị sửa 12:16Z 13/11; payload không kiểm được vì mất sha256 gốc». Nạp bằng
  `pipeline/import-s09.mjs` (dùng lại `dongItemS09` + `CAU_CHEN_S09_ITEM` của DA31) vào `stg_s09_item`
  (migration 097): tự chèn dòng `airbnb_snapshots` (city `vn`, source `s09-du-an`, ON CONFLICT DO NOTHING), in số
  bỏ theo ba lý do (thiếu sourceId / kind lạ / chi tiết lỗi); bản 13/11 kỳ vọng 345 dòng bỏ 0/0/0, nạp lại 0.
  Toà/phân khu/cụm dựng ở lệnh dựng danh bạ (view `v_s09_toa`, `v_s09_phan_khu`) — không phải việc bộ nạp. Bản ghi
  đầy đủ: `_acceptance/toa-s09-hai-khu-vao-danh-ba/s09-data-contract-api-nhap.md` (soạn DA31, đã soát 14/11).

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
