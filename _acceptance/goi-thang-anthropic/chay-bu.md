# Chạy bù bài S03 tồn sau khi gộp — hồ sơ áp (năm thứ)

Hồ sơ `goi-thang-anthropic` (T2). Việc này ghi dữ liệu lên DB máy thu (`:5433`). Chữ ký Cổng Bằng chứng của Mạnh phủ việc áp theo luật
«Mạnh ở cổng» (ROADMAP §3 mục 50). Thứ tự bắt buộc: chạy SAU khi PR gộp, từ checkout chính đứng ở `main`. Việc chỉ thêm dòng vào
`silver_labels` (nhãn bạc) và `ai_calls` (sổ cuộc gọi); không sửa, không xoá bảng nào khác (luật 7).

## 0. Điều kiện trước

- `npm ci` trong `agent/` của checkout chính. Kiểm:

  ```bash
  cd ~/dev/onehub-invest/agent && node -e "require.resolve('@anthropic-ai/sdk')" && echo co-goi
  ```

  Pipeline mượn gói này từ `agent/node_modules`, không cần cài thêm gì ở pipeline. Không có migration, không đổi plist.
- `ANTHROPIC_API_KEY` có trong `~/dev/onehub-invest/.env`. Mạnh đặt lúc 08:52Z ngày 15/11; giám sát gọi thử một lời, HTTP 200.
- Chạy xa 00:00 giờ VN (17:00Z) để không chồng bước đêm. Xong trước 16:30Z.

## 1. Số chạy thử (chỉ đọc, đo 09:0xZ ngày 15/11 trên DB máy thu)

Lệnh `hang-ngay --ngay <d> --thu`:

| Ngày bài | Đơn vị | Đã đọc | Cần gọi | Ước USD |
|---|---|---|---|---|
| 11/11 | 3.030 | 2.554 | 8 | 0,0088 |
| 12/11 | 3.094 | 974 | 1.594 | 1,7405 |
| 13/11 | 250 | 0 | 179 | 0,1888 |
| 14/11 | 894 | 0 | 734 | 0,7905 |
| **Cộng** | | | **2.515** | **2,73** |

Lệnh đo lại ngay trước khi áp (số có thể tăng vì bài thu muộn của 14/11):

```bash
cd ~/dev/onehub-invest/agent && for d in 2026-11-11 2026-11-12 2026-11-13 2026-11-14; do node --env-file=../.env --import tsx scripts/doc-gop-s03.ts hang-ngay --ngay $d --thu | head -1; done
```

## 2. Sao lưu trước

```bash
mkdir -p ~/dev/onehub-invest/state/sao-luu && docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -d oneinvest -Fc -t silver_labels -t ai_calls > ~/dev/onehub-invest/state/sao-luu/truoc-chay-bu-goi-thang-anthropic-$(date -u +%Y%m%dT%H%MZ).dump && ls -la ~/dev/onehub-invest/state/sao-luu/ | tail -1
```

`state/` nằm trong gitignore, không commit.

## 3. Lệnh áp

Chạy từng ngày, cùng trần 20 USD/ngày chi; bốn ngày dùng chung một ngày chi:

```bash
cd ~/dev/onehub-invest/agent && for d in 2026-11-11 2026-11-12 2026-11-13 2026-11-14; do node --env-file=../.env --import tsx scripts/doc-gop-s03.ts hang-ngay --ngay $d --tran-ngay-usd 20; echo "ngay $d ma $?"; done
```

- Đi theo bảng chọn của kho: Anthropic trước; Anthropic cạn tiền thì tự lùi sang Gateway.
- Mỗi ngày in một dòng cuối `{"pl34": {...}}`.
- Mã thoát:
  - 0: xong.
  - 1: mọi lời gọi hỏng, hoặc khoá sai.
  - 3: chạm trần.
  - 4: hết tiền ở mọi đường.
  - 5: thiếu khoá.
- Gặp mã 1, 4 hay 5 thì dừng, báo, không chạy ngày kế.
- Lặp lại lệnh tới khi `can goi` không giảm nữa. Bài đã đọc không bị gọi lại.

## 4. Cách lùi

Run id của lượt áp có dạng `pl34-<ngày chi>-b<ngày bài>-<ISO>`, ngày chi theo giờ VN lúc chạy (`2026-11-15` nếu chạy trước 17:00Z).
Xoá đúng các dòng của lượt áp (sao lưu ở bước 2 phục hồi được bằng `pg_restore --data-only`):

```sql
BEGIN;
DELETE FROM silver_labels WHERE run_id LIKE 'pl34-2026-11-15-b2026-11-1%';
DELETE FROM ai_calls WHERE viec = 'doc-gop-s03' AND trace LIKE 'pl34-2026-11-15-b2026-11-1%';
COMMIT;
```

Lùi đường gọi (thôi dùng Anthropic): sửa `agent/config/doc-gop-s03.json` — `duong` của Haiku về `["gateway"]` — qua một PR. Thôi tự lùi:
đặt `tu_lui: false`.

## 5. Lệnh kiểm sau

```bash
cd ~/dev/onehub-invest/agent && for d in 2026-11-11 2026-11-12 2026-11-13 2026-11-14; do node --env-file=../.env --import tsx scripts/doc-gop-s03.ts hang-ngay --ngay $d --thu | head -1; done
```

```sql
SELECT split_part(model, ':', 1) duong, ok, split_part(coalesce(loi, ''), ':', 1) lop, count(*)
  FROM ai_calls WHERE viec = 'doc-gop-s03' AND trace LIKE 'pl34-2026-11-15-%' GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;
SELECT count(*) nhan, round(sum(cost_usd)::numeric, 4) usd, count(*) FILTER (WHERE json_ok) doc_duoc
  FROM silver_labels WHERE run_id LIKE 'pl34-2026-11-15-%';
```

Kỳ vọng:
- `can goi` của 11–14/11 giảm từ 2.515 về phần dư, phần dư chỉ gồm JSON hỏng và lỗi 4xx của bài lẻ.
- Không có lớp `het-tien` hay `khoa`.
- `usd` ≈ 2,7, dưới 20.
- Báo số thật cạnh số chạy thử; lệch xa thì dừng và báo, không tự sửa cho khớp.

## Bước đêm sau gộp

Không cần đổi cấu hình. `pipeline/doc-gop-hang-ngay.sh` đã nạp `--env-file=<gốc>/.env` sẵn, bảng chọn của kho cho Haiku đi Anthropic trước.
Đêm 16/11 (≈ 17:00Z ngày 15/11) đọc bài 15/11 và 14/11. Bài đã đọc trong lượt bù không bị gọi lại.
