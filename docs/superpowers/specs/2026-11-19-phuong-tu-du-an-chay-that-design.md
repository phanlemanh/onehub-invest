# Cho bước suy phường từ dự án chạy thật (DA45)

Hồ sơ: `_acceptance/phuong-tu-du-an-chay-that/`. Nền: hàng DA9 `phuong-tu-du-an` (đã ký, gộp 14/11, migration 099 và 102 đã áp trên máy thu).

## Vì sao làm

Lệnh `pipeline/scripts/phuong-tu-du-an.mjs --ghi` chưa từng chạy và không nằm trong chuỗi nào, nên 72 trên 7.309 tin S03 đang hiện có phường
thật. Chạy thử không ghi cho thấy khoảng 7.069 tin sẽ có phường.

## Phương án

| Phương án | Kết luận |
|---|---|
| Thêm bước ngay sau `transform-zalo` trong `scripts/zalo-import-daily.sh`, chạy ở cả lượt nhanh 15 phút và lượt 00:00 | **Chọn**, nếu số đo thời gian đạt: tin mới có phường trong cùng lượt nạp |
| Chỉ chạy ở lượt 00:00 | Lối dự phòng khi bước ghi quá chậm cho lượt 15 phút; tin mới chờ tới nửa đêm |
| Chạy tay một lần | Loại: tin mới không có phường |

Bước đứng sau `transform-zalo` vì phát biểu dự án trên bài do `transform-zalo` ghi, và đứng trước `xep-hang-gia` vì hạng giá đọc phường.

## Chốt lượt ghi đầu

Chuỗi gọi `phuong-tu-du-an.mjs --ghi --noi-tiep`. Cờ `--noi-tiep` chỉ ghi khi luật đã có phát biểu sống; chưa có thì in `chưa áp lượt đầu`, không ghi gì và thoát 0.
Nhờ vậy gộp PR không tự ghi dữ liệu: lượt đầu chỉ xảy ra khi chạy tay theo hồ sơ áp. Cách lùi rút mọi phát biểu của luật, nên sau khi lùi chuỗi cũng tự dừng ghi, không
ghi lại phường đã lùi.

## Test đang canh chuỗi

Bốn tệp test ghim thứ tự bước của `zalo-import-daily.sh` phải đổi cùng lúc thêm bước: `scripts/enrich-buoc-job.test.mjs`, `scripts/zalo-import-job.test.mjs`,
`scripts/zalo-import-job-nhe.test.mjs`, `scripts/job-step-thoi-luong.test.mjs`. Đã khai vào vùng của hàng.

## Lượt ghi đầu

Lượt đầu ghi khoảng 75.000 phát biểu. Hồ sơ `ap-may-thu/` có đủ năm thứ: lệnh áp, số chạy thử, sao lưu trước, cách lùi, lệnh kiểm sau.
Chữ ký Cổng Bằng chứng phủ lượt ghi này. Tránh áp trong 17:00–18:00Z và lúc lượt đọc gộp đêm chạy.

## Không làm

Không đổi migration 099, 102. Không sửa ô «Có phường» trên màn (hàng DF7): ô ấy đang tính cả tin chỉ biết tỉnh nên chưa phản ánh số mới cho tới
DF7. Không đọc 74.724 phát biểu phường từ thẻ nhóm vào cột. Không làm cho S05, S06.

## Câu cho người

Xem `_acceptance/phuong-tu-du-an-chay-that/cau-cong-pham-vi.md`.
