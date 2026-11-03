# Hình tại điểm quyết định

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1: rút số ghép | 2 nhánh rẽ | `rut-so-ghep` |
| Hỏi-2: thứ tự chạy thật | 5 bước nối tiếp | `thu-tu-chay-that` |
| Hỏi-3: số ghép trên Invest | 2 lối, dưới ngưỡng | không vẽ |

## Đề bài `rut-so-ghep`
Loại: flowchart nhỏ. Vào: «Tin đang giữ số ghép». Hai sự kiện: «Tin chuyển sang ẩn số», «Tài khoản có thêm số thứ hai». Cả hai dẫn tới «Rút số ghép, băm, xuất xứ». Nhánh bên: «Số trực tiếp hoặc không rõ gốc» luôn «Giữ nguyên». AC-3.

## Đề bài `thu-tu-chay-that`
Loại: process năm bước. 1 Importer v5 vào main (làn ZCode). 2 Gộp PR này. 3 pg_dump. 4 Áp 068, nếu 067 vào sau thì áp lại 068. 5 Lượt S06 kế ghi thật. Dấu kèm bước 5: «khoá băm lên cloud ở lượt sync kế, số gốc ở lại máy». AC-9.
