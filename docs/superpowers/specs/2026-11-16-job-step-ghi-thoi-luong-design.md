# job-step-ghi-thoi-luong — ghi thời lượng từng bước của job nạp

Ngày: 2026-11-16 · hàng N1 `job-step-ghi-thoi-luong` · hạng T2 · làn design D0 (không chạm UI)

## 1. Vấn đề

Lượt nạp S03 15′ (`scripts/zalo-import-daily.sh --luot-nhanh`, plist `com.oneinvest.s03-nap-15phut`) đo được
5′11″ / 5′22″ / 7′32″ ở ba lượt đầu (Nhật ký đợt 10/11 13:23Z). Trong khi đó số đo trước khi bật của hàng
`s03-len-nhanh-nac-1` trên DB thử là: transform-zalo 62,4 s · transform-media 7,5 s · refresh-bait-gap 6,1 s —
tổng ≈ 76 s (hợp đồng `_acceptance/s03-len-nhanh-nac-1/contract.md`, mục Context).

Chênh 76 s so với 5–7 phút nằm ở đâu thì **không ai đọc được**: `scripts/lib/job-step.sh` chỉ in dòng ghim khi
bước HỎNG (`JOB FAIL [<job>] bước <nhãn> mã <n>`), không ghi gì khi bước xanh. Log launchd
(`pipeline/logs/s03-nap-15phut.log`, 1,6 MB) có đầu ra của từng bước nhưng không có mốc giờ nào.

Quyết định **LT2 «transform tăng dần»** đang chờ đúng con số này: nếu phần lâu là vòng nạp snapshot thì tăng dần
transform không giải quyết gì; nếu là transform-zalo thì nó là việc đáng làm.

Hàng này chỉ làm **phép đo**. Không tối ưu bước nào, không đổi hành vi bước nào.

## 2. Tra tri thức và luật đã nạp

- Nền chung (`onehub-invest-tri-thuc:wiki/nen/nen-chung.md`) — phân làn ZCode ↔ Claude.
- Đặt lại lộ trình 15/11 (`wiki/dot/dat-lai-lo-trinh-1511.md`) — «Việc nền (test, CI, tài liệu, an toàn) chỉ làm
  khi đỏ hay khi chặn một lát»; hàng này chặn lát LT2 nên được làm.
- Sổ hồ sơ trước: `s03-len-nhanh-nac-1#d-20261110T101756Z-15` (luật bỏ lượt khi đụng khoá),
  `s03-len-nhanh-nac-1#d-20261110T094419Z-10` (cờ `--luot-nhanh`).
- AGENTS.md «Phân làn hai agent» + `_acceptance/s03-len-nhanh-nac-1/contract.md` AC-6: *«phần nạp của
  `zalo-import-daily.sh` (trên dòng «Từ đây trở xuống là làn Claude») không đổi so với merge-base»*.

## 3. Ranh giới làn — chỗ được sửa trong `zalo-import-daily.sh`

Ranh giới hàng khai `scripts/zalo-import-daily.sh` là vùng được sửa, còn danh sách không-chạm khai
`scripts/zalo-*.sh` (rào làn ZCode của AGENTS.md). Hai lời ấy chỉ hoà nhau theo luật đã có sẵn trong chính tệp:
dòng `# Từ đây trở xuống là làn Claude (AU3 Ngoài-3)` chia tệp làm hai, và AC-6 của `s03-len-nhanh-nac-1` ghim
rằng phần TRÊN dòng ấy không được đổi.

→ **Vòng này không sửa một byte nào phía trên dòng ranh giới làn.** Phần nạp (lấy khoá, vòng nạp tin, vòng nạp
hồ sơ) vẫn được đo, nhưng đo từ dưới: ngay sau dòng ranh giới, `$SECONDS` của shell đã bằng tổng thời gian từ
lúc tệp bọc khởi động tới đó. Một dòng ghi là đủ, không cần chạm phần trên.

## 4. Thiết kế

### 4.1 Bộ ghi trong `scripts/lib/job-step.sh`

Thêm một hàm ghi dùng chung, rồi cho `job_step` gọi nó:

```
job_step_ghi <job> <nhãn> <mã> <giây>
```

Mỗi lần gọi in ra **stderr** đúng một dòng ghim, không làm gì khác:

```
JOB STEP [<job>] bước <nhãn> mã <n> giây <s> nhanh <0|1>
```

`nhanh` lấy từ `S03_LUOT_NHANH` (bằng `1` thì 1, mọi trường hợp khác là 0) — cột để tách lượt nhanh 15′ khỏi
lượt 00:00 ngay trên dòng, không phải suy từ tệp log nào.

`job_step` đo giây treo bằng `date +%s` trước và sau lệnh (bash 3.2 của macOS không có `date +%N`; bước ở đây
tính bằng chục giây tới phút nên giây nguyên là đủ) rồi gọi `job_step_ghi`. Thứ tự in giữ nguyên ý nghĩa cũ:
dòng `JOB STEP` trước, dòng `JOB FAIL` (nếu có) sau — dòng báo động vẫn là dòng cuối của bước.

### 4.2 Vì sao KHÔNG có sổ riêng

Bản thiết kế đầu có thêm một sổ JSONL `pipeline/logs/job-step.jsonl`. Phản biện context sạch chỉ ra lối
«chỉ dòng stderr» chưa chết, và kiểm lại plist thì đúng vậy:

- `pipeline/cron/com.oneinvest.s03-nap-15phut.plist` đổ CẢ `StandardOutPath` lẫn `StandardErrorPath` vào
  `pipeline/logs/s03-nap-15phut.log`;
- `pipeline/cron/com.oneinvest.zalo-import.plist` đổ cả hai vào `pipeline/logs/zalo-import.log`.

Dòng ghim đã mang đủ job, bước, mã, giây và cột `nhanh`, nên sổ riêng không thêm thông tin nào — chỉ thêm một
đường GHI TỆP vào đúng cái job mà bất biến số 1 của vòng này bắt «không bao giờ hỏng vì phép đo». Vòng này
do đó **không mở tệp nào, không ghi tệp nào**: chỉ một dòng ra stderr, đã có sẵn chỗ đổ.

### 4.3 Các điểm gọi

| Điểm | Thay đổi |
|---|---|
| `job_step` | đo và ghi; mã thoát, stdout, dòng `JOB FAIL` giữ nguyên |
| `job_run` | không đổi — nó gọi `job_step`, nên thừa hưởng |
| `buoc_nhanh` (`zalo-import-daily.sh`) | đo quanh lệnh, gọi `job_step_ghi` cho cả ba kết cục: xanh · `BỎ LƯỢT` (đụng khoá) · `JOB FAIL` |
| phần trước làn Claude | một dòng `job_step_ghi zalo-import-daily truoc-lan-claude <mã hồ sơ> $SECONDS` ngay dưới dòng ranh giới làn |

Đếm bằng máy (`grep -rln 'lib/job-step.sh' --include='*.sh'`, 16/11): **9 tệp** nạp `job-step.sh`, gồm **6 tệp
sản xuất** — `scripts/zalo-import-daily.sh`, `scripts/chotot-daily.sh`, `scripts/apify-facebook-daily.sh`,
`scripts/cloud-sync.sh`, `scripts/cloud-sync-do.sh`, `pipeline/doc-gop-hang-ngay.sh` — và 3 bộ dò trong
`_acceptance/`. Năm tệp sản xuất ngoài `zalo-import-daily.sh` có thời lượng mà không phải sửa tệp nào; vòng
này KHÔNG đo chúng bằng eval (xem Later ở §6), nên lời ấy là suy từ con số đếm được, không phải lời hứa đã
kiểm.

### 4.4 Đọc số

Không dựng script tổng hợp trong vòng này (xem Out of scope). Câu đọc một dòng trên log của lượt nhanh:

```bash
grep -h 'JOB STEP \[zalo-import-daily\]' pipeline/logs/s03-nap-15phut.log \
  | sed -E 's/.*bước ([^ ]+) mã [0-9]+ giây ([0-9]+).*/\1 \2/' \
  | awk '{n[$1]++; s[$1]+=$2; if($2>m[$1]) m[$1]=$2} END{for(b in n) printf "%-20s lượt %4d  trung bình %6.1fs  đỉnh %4ds\n", b, n[b], s[b]/n[b], m[b]}' \
  | sort -k5 -rn
```

## 5. Bất biến phải giữ

1. Mã thoát của từng bước và của cả job không đổi.
2. `JOB FAIL [<job>] bước <nhãn> mã <n>` và `BỎ LƯỢT [<job>] bước <nhãn>: đụng khoá — lượt sau làm` giữ
   nguyên văn (có phép đo cũ đọc chúng: `scripts/job-exit.test.mjs`, `scripts/s03-nap-nhanh.test.mjs`).
3. Dòng mới chỉ ra **stderr**; stdout của lệnh không thêm byte nào, và vòng không mở hay ghi tệp nào.
4. Chuỗi nhãn bước và mã thoát của lượt nhanh / lượt 00:00 không đổi (`NHAN_DU`, `NHAN_NHANH`).
5. Phần trên dòng «Từ đây trở xuống là làn Claude» của `zalo-import-daily.sh` không đổi.
6. Chạy được trên `/bin/bash` 3.2 của macOS.

## 6. Coverage — quét không gian AC (morphological-scan, preset test-matrix)

### Ngữ cảnh
- Sản phẩm: onehub-invest, lớp job launchd của pipeline — chân sản phẩm `[SUY-TỪ-REPO: scripts/lib/job-step.sh,
  scripts/zalo-import-daily.sh, AGENTS.md]`; chân ngành: bản ghi thời lượng từng tác vụ của bộ chạy job có tên —
  Apache Airflow (task duration mỗi task instance) và systemd (`ExecMainStartTimestamp`/`ExecMainExitTimestamp`
  mỗi unit) `[NGÀNH: Airflow, systemd]`. Cả hai ghi mốc đầu–cuối mỗi bước rồi để người đọc hỏi «bước nào chậm» —
  đúng câu hỏi của hàng này.

### Trục
- **A — điểm ghi**: `job_step` trực tiếp | `job_run` | `buoc_nhanh` | phần trước làn Claude (ghi thẳng)
  `[thước CE: bốn điểm gọi đếm được trong scripts/lib/job-step.sh + scripts/zalo-import-daily.sh]`
- **B — kết cục bước**: mã 0 | mã ≠ 0 | đụng khoá DB (chỉ `buoc_nhanh`) `[thước CE: ba nhánh của buoc_nhanh +
  hai nhánh của job_step, có sẵn trong mã]`
- **C — đích ghi**: dòng stderr | KHÔNG đường ghi tệp nào | môi trường không ghi được (thư mục chạy và HOME
  chỉ đọc) `[thước CE: lịch sử — 0311-8 (lỗi liệt kê bị nuốt làm job xanh giả), 2510-8 (bước phụ hỏng làm mất
  cả mẻ) dạy rằng đường phụ phải không bao giờ giết job; §4.2 cắt luôn đường ghi tệp thay vì nuốt lỗi của nó]`
- **D — chế độ lượt**: lượt nhanh (`S03_LUOT_NHANH=1`) | lượt 00:00 | job khác dùng chung `job-step.sh`
  `[thước CE: bộ test có sẵn scripts/s03-nap-nhanh.test.mjs khai NHAN_DU / NHAN_NHANH]`

Không gian 4 × 3 × 3 × 3 = 108 ô → cắt theo lát của trục A (preset: > ~50 ca thì pairwise).

### Core
1. A=`job_step` × B=mã 0 × C=stderr — ô nền, chưa có gì ghi bước xanh → AC-1.
2. A=`job_step` × B=mã ≠ 0 — dòng cũ `JOB FAIL` và mã thoát phải sống sót → AC-3.
3. A=`job_step` × giây thật (bước ngủ) — số phải là số đo, không phải hằng → AC-2.
4. A=`job_run` × B=mã ≠ 0 — `JOB_RC` và «luôn trả 0» phải không đổi → AC-4.
5. C=dòng stderr đúng khuôn × D=lượt nhanh / 00:00 — khuôn cố định và cột `nhanh` → AC-5.
6. C=KHÔNG đường ghi tệp nào × môi trường không ghi được → AC-6.
7. A=`buoc_nhanh` × B=ba kết cục → AC-7.
8. A=phần trước làn Claude × D=lượt nhanh → AC-8.
9. D=lượt nhanh vs 00:00 — chuỗi bước và mã thoát không đổi → AC-9.

### Later
- Bộ tổng hợp (trung vị, p90 theo bước) thành script — câu `grep`+`awk` một dòng ở §4.4 đủ cho quyết định LT2.
- Ghi mili-giây — bước ở đây tính bằng chục giây; `date +%N` không có trên bash 3.2 macOS.
- Ca riêng cho năm tệp sản xuất khác đang nạp `job-step.sh` (đếm ở §4.3) — chúng đi qua cùng `job_step`, phủ
  bởi ô 1–4; vòng này không đo từng tệp.

### Never
- Sổ riêng hay bất kỳ đường ghi tệp nào cho phép đo — xem §4.2.
- Ghi thời lượng vào DB hay lên Ops — ngoài ranh giới hàng, và câu hỏi «bước nào chậm» không cần bảng.
- Đổi hành vi, thứ tự hay mã thoát của bất kỳ bước nào để dễ đo.
- Chạm phần thu / nạp của làn ZCode.

### Cross-cutting áp mọi ô Core
Mã thoát và stdout không đổi · dòng `JOB FAIL` / `BỎ LƯỢT` nguyên văn · vòng không mở hay ghi tệp nào ·
bash 3.2 · một dòng `echo … >&2` cho mỗi bản ghi.

## 7. Out of scope

- Tối ưu bất kỳ bước nào (LT2 «transform tăng dần» là hàng riêng, chờ số của hàng này).
- Bộ tổng hợp số và màn hình đọc số.
- Sổ riêng cho thời lượng và mọi đường ghi tệp khác (§4.2).
- Thu thập thời lượng của collector (làn ZCode).
