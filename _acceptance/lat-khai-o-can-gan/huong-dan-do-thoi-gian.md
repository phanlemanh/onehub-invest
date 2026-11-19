# Đo thời gian gắn một bài (AC-10) — việc của người, máy không đo thay

Mục tiêu: biết gắn một bài ở màn hai ô (Toà, Phân khu hoặc cụm) mất bao lâu, để ước giờ cho 330 bài của lát
`hai-khu-ghep-b`. Ngưỡng đạt: trung bình 5 bài không quá 45 giây. Mốc so hiện tại: khoảng 3 phút một bài.

## Điều kiện trước (máy làm, cần lời Mạnh)

Lát `hai-khu-ghep-b` chưa nạp trên DB máy thu. Nạp lát là ghi dữ liệu lên máy thu, nên chỉ chạy sau khi PR của hàng này
gộp và Mạnh cho lời áp. Khi đó máy nạp lát bằng `pipeline/label-sample.mjs` với một hạt giống, rồi báo lại hạt giống đó.

## Cách đo (khoảng 10 phút)

1. Mở `/ops/labels?lat=hai-khu-ghep-b`, Phần 1.
2. Đo 5 bài đầu tiên màn đưa ra. Thứ tự bài do hạt giống của lát quyết, nên 5 bài này là mẫu ngẫu nhiên có hạt giống;
   không chọn bài, không bỏ qua bài khó.
3. Bấm giờ từ lúc bài hiện tới lúc bài kế hiện (gồm đọc bài, điền hai ô hoặc chọn «Không suy ra được», bấm Lưu).
4. Mỗi bài ghi: mã bài (trên khung bài), số giây. Số ký tự và số ảnh máy điền sau từ mã bài.
5. Gửi lại 5 cặp «mã bài — số giây» trong chat; máy ghi vào `evidence/do-thoi-gian.md` theo khuôn dưới, kèm hạt giống.

## Khuôn `evidence/do-thoi-gian.md`

```
Hạt giống: <seed>
Người đo: <tên> · Ngày: <YYYY-MM-DD>

| # | Mã bài | Số ký tự | Số ảnh | Số giây |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

Trung bình: <giây> · Ước 330 bài: <giờ>
```

Thiếu trường nào thì E11 không đạt. Tới khi có tệp này, E11 ở trạng thái «cần Mạnh hoặc đội gắn đo».
