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

## manifest.json (schemaVersion 3)

```jsonc
{
  "schemaVersion": 3,
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

## Lịch sử phiên bản

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
