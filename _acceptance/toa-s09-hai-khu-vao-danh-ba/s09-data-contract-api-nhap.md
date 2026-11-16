# Nháp DATA-CONTRACT S09 v1 — khuôn API (đề xuất của DA31, chờ làn thu soát)

> Soạn từ bản thu `vn__s09-du-an__2026-11-13T120908161` (345 item), 13/11. Mạnh chốt 13/11: thu S09 định kỳ đi đường
> này. LL chuyển ZCode soát và đưa vào `collector/docs/DATA-CONTRACT.md` (làn thu, tăng `schemaVersion`). Tài liệu không
> chứa tên nguồn hay tên miền thật; `payload.url` mang tên miền thật nên mọi bảng chứa nó chỉ ở máy thu.

## Thư mục và manifest

- `vn__s09-du-an__<ISO>/` — một lượt thu toàn danh mục, `manifest.json` + `items-NNNN.json.gz` (mảng JSON).
- `manifest.coverage.methods`: `{ "api-cong-khai-http": <n> }`.
- **Bên đọc không dùng `manifest.coverage.notes` và `item.meta` làm dữ liệu** — bản 13/11 có ghi chú «meta/notes bị sửa
  12:16Z 13/11, payload không kiểm được». Mọi trường lấy từ `payload` (và `sourceId`, `kind`, `fetchedAt` của item).

## Item

| `kind` | `sourceId` | `payload` | Ghi chú |
|---|---|---|---|
| `danh-muc` | `danh-muc` | `{ url, soTrang, soDuAn }` | một item mỗi lượt; `soDuAn` = số item `du-an` kỳ vọng |
| `du-an` | `du-an-<id>` | `{ url, danhMuc: { name, slug, city }, chiTiet: { data, meta: { code } } }` | `<id>` = `chiTiet.data.id` |

### `payload.chiTiet.data` (trường bên đọc dùng)

- Dự án: `id` (uuid, khoá), `name`, `slug`, `address`, `ward`, `district`, `district_code`, `province`, `province_code`,
  `developer_name`, `insight_type` (`HIGH_RISE` | `LOW_RISE` | `BOTH` | vắng), `lat_cdnt`, `long_cdnt`.
- **`blocks` không phải số toà** (là 0 ở các dự án lớn) — số toà = độ dài `insight_by_block`.
- `insight_by_block[]` — toà: `id` (uuid, **khoá toà**), `block_code`, `block_name`, `project_uuid`, `sector_uuid`
  (**có thể vắng**), `handover_date_from` (`YYYY-MM-DD`, **có thể vắng**). Một tên có thể có hai `id` (Grand Park `OS2`).
  Có thể vắng ở dự án một toà (2/344 trong bản 13/11).
- `insight_by_sector[]` — phân khu: `sector_id` (uuid; bằng `data.id` ở dự án một phân khu), `sector_name`, `type`
  (`HIGH_RISE` | `LOW_RISE`), `handover_date_from`, `handover_date_to`, `developer_name`, giá min/max (giá: chính sách
  mục 27 của ROADMAP — chỉ nội bộ).
- `chiTiet.meta.code` = `"200"` khi trang chi tiết đọc được; khác `"200"` → item không dùng.

## Số đối chứng (bản 13/11, hai khu)

| | Ocean Park 1 | Grand Park |
|---|---|---|
| bản ghi `insight_by_block` | 115 | 61 |
| có `handover_date_from` | 91 | 59 |
| `insight_by_sector` | 13 | 7 |

Hai bản Mạnh mở tay (khuôn trang, `payload.nextData.props.pageProps.project`) cho cùng các số này, 0 khoá lệch (LL so
13/11) — chúng là đối chứng cho bên đọc khuôn API.
