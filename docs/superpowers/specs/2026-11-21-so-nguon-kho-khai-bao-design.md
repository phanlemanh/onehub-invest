# NK1 so-nguon-kho-khai-bao — sổ nguồn khai họ nguồn, nhịp, tổng thể, bảng nạp (lát A)

Hàng NK1 của `docs/plan/lo-trinh.json`, đợt `sau-soat-nguon-2011`. Cổng Đáng: Mạnh «làm» 21/11 (`opportunity.md`). Khung: ROADMAP
§3 mục 58 (Mạnh «Theo khuyến nghị» 02:27Z 20/11 — hai họ nguồn, thẻ nguồn kho năm trục, bốn lát A–D). Bảng phủ ca đếm trên DB máy
thu: `_acceptance/so-nguon-kho-khai-bao/phu-ca.md`.

## Vấn đề (số đếm 21/11 trên DB máy thu, chỉ đọc)

- `source_registry` 15 dòng: không có S09, S17; không có cột họ nguồn, nhịp, tổng thể, bảng nạp. Nhịp là hằng `SLO_HOURS` chép ở
  hai nơi (`scripts/lib/freshness.mjs`, `app/src/lib/freshness.ts`), giữ khớp bằng `scripts/freshness-parity.test.mjs`.
- S16 `active` không có trong `SLO_HOURS` → CLI in «S16: nguồn active chưa khai SLO» mỗi lượt (thoát 1). Bốn snapshot S16 có `source`
  không khớp `source_ids` của S16 nên khuôn «so `source_ids`» sẽ ra «chưa có dữ liệu» giả. Snapshot mới nhất có dòng ở năm bảng
  `stg_s16_*`: 18/11 00:30Z.
- S09: 345 dòng `stg_s09_item` từ 1 snapshot (13/11 12:09Z, city `vn`), không có dòng sổ → vô hình với CLI, `/ops`, `/ops/collections`,
  khối `freshness` đẩy lên cloud, và với bộ soát tầng A (bộ soát đọc tên từ sổ).
- S17: không dòng sổ, không bảng stg. Bộ soát tầng A mù với tên của nó.
- S01: hanoi 149 snapshot (cuối 15/11, lịch tuần), hcmc 42 (cuối 07/11, lượt tay), vn 1 (23/10) → hai ô đỏ vĩnh viễn.
- S11 `active`, 0 snapshot → «chưa có dữ liệu»; nạp S11 đang hoãn (ROADMAP §3 mục 53).

## Thiết kế

### Migration 122 (`db/migrations/122_source_registry_family_cadence.sql`)

`ALTER TABLE source_registry ADD COLUMN IF NOT EXISTS`:

| Cột | Kiểu | Nghĩa |
|---|---|---|
| `family` | `text`, CHECK `IN ('flow','stock')` | họ nguồn: `flow` = nguồn luồng (tin rao chảy liên tục: S01, S02, S03, S05, S06), `stock` = nguồn kho (danh mục tích luỹ: S04, S07–S17) |
| `cadence_hours` | `integer`, CHECK `> 0` | nhịp đo độ tươi; NULL = không đo |
| `universe` | `jsonb NOT NULL DEFAULT '{}'` | tổng thể nguồn tự công bố, kèm mốc và nơi lấy; để `{}` tới khi có số (Mạnh câu 3: không ước) |
| `stg_tables` | `text[] NOT NULL DEFAULT '{}'` | bảng nạp của nguồn; nguồn không có probe riêng đo qua đây |
| `measured_markets` | `text[]` | thị trường có lịch thu; NULL = mọi thị trường có dữ liệu |

Không đụng `match_whole` (112). Dữ liệu (idempotent, `UPDATE … WHERE code = …`, `INSERT … ON CONFLICT (code) DO NOTHING`):

- `family` cho mọi dòng; `cadence_hours` = đúng hằng cũ cho S01 192, S02 840, S03 72, S05 96, S06 36, S08 192, S10 192, S11 192.
- S16: `cadence_hours` 192 (**số giữ chỗ** theo khuôn S08 tới khi làn thu khai lịch plist S16), `stg_tables` = năm bảng `stg_s16_*`.
- S09: dòng mới `stock`, `active`, `label_vi` vai trò, `source_ids '{}'`, `real_name` NULL, `cadence_hours` 192 giữ chỗ,
  `stg_tables {stg_s09_item}`.
- S17: dòng mới `stock`, `draft`, `source_ids '{}'`, `real_name` NULL, `cadence_hours` NULL.
- S11: `status 'paused'`, `reason` «hoãn nạp S11 — ROADMAP §3 mục 53», `resume_when` có chữ (CHECK 047 đòi `reason` khi paused).
- S01: `measured_markets {hanoi}`.

Bảng không đồng bộ cloud → không DDL cloud. Tên thật S09, S17 không vào kho: điền trên máy thu sau khi áp (mục «Áp»).

### Độ tươi đọc nhịp từ sổ (hai bản chép, cùng đổi)

- Bỏ hằng `SLO_HOURS`. `readFreshness` đọc `code, source_ids, cadence_hours, stg_tables, measured_markets` của dòng `active`.
- `cadence_hours` NULL → hàng «chưa khai SLO» như cũ.
- Probe: mã có probe riêng (S01–S11) giữ nguyên câu SQL → số không đổi. Mã không có probe riêng mà có `stg_tables` (S09, S16) đo
  bằng `max(collected_at)` của snapshot có dòng ở một trong các bảng đó — không phụ thuộc `source_ids`. Tên bảng phải khớp
  `^stg_[a-z0-9_]+$` và có thật (`to_regclass`); sai thì hàng `none` kèm lý do, không ghép chuỗi lạ vào SQL.
- `measured_markets` lọc sau bước gộp thành phố (`gopThanhPho`).
- Sổ chưa có cột (chưa áp 122) → ném lỗi có tên «source_registry chưa có cột cadence_hours — áp migration 122», không rơi về hằng.
  Vì vậy áp 122 TRƯỚC khi checkout chính kéo main (mục «Áp»): 122 chỉ thêm cột và dòng, mã cũ (đọc `code, source_ids`) vẫn chạy.
- Cloud không gọi `readFreshness`: cloud không có `source_registry`, `/ops` cloud đọc khối `freshness` máy thu đẩy lên.
- S11 `paused` rời khỏi tập đo (chỉ đọc dòng `active`, như S05 hôm nay); `/ops/sources` đã hiện «Tạm dừng» kèm lý do.

Người đọc phía sau không đổi khuôn hàng: CLI `check-freshness`, `/ops`, `/ops/collections`, `/api/v1/ops/coverage`, `bao-cao-ngay`,
`push-ops-facts` → khối `freshness` trên cloud.

### Áp lên máy thu (đủ năm thứ, hồ sơ `ap-may-thu.md` viết ở S3)

Gộp PR → sao lưu bảng `source_registry` → áp 122 hai lần từ bản `origin/main` (`git show origin/main:db/migrations/122_…`) khi
checkout chính CHƯA kéo → điền `real_name`, `source_ids`, `match_whole` cho S09, S17 bằng `ap-may-thu/tra-s09-s17.mjs`
(chép khuôn `tra-s16.mjs` của che-ten; đọc `tam/s09-mien.txt`, `tam/s17-mien.txt`; một giao dịch; in số dòng đổi, không in giá
trị) → xoá hai tệp tạm → kéo main vào checkout chính → lệnh kiểm `probes/may-thu.mjs` (CLI + `readFreshness` của app ở checkout chính,
so từng hàng; đếm mục tên S09, S17 trong `docSourceNameEntries`, chỉ in số). Lùi: lùi mã trước (revert PR, kéo main), rồi
`lui-122.sql` viết sẵn (S11 về active, xoá dòng S09/S17, DROP năm cột) + khôi phục bảng từ bản sao lưu.

## Phạm vi ngoài

Nạp S07, S10, S11, plist mới (làn thu) · ghi số `universe` · thước vận hành, biến động, co rút (NK2) · phễu, phủ (NK3) · chất lượng
kho (NK4) · lịch thu hcmc cho S01 · dọn chỗ trúng tên S09/S17 trên cây (nếu bộ quét thấy — cắt hàng riêng, không sửa ở đây).
