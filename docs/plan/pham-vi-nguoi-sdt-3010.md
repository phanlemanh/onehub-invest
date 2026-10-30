# Bản phạm vi — Người và SĐT (30/10)

> Nguồn: `docs/research/audit-bang-nguoi-sdt-3010.md` §6, kèm quyết định của Mạnh 30/10: Hỏi-A lưu số gốc dạng `+84…`;
> Hỏi-B số gốc hiện cho vai Vận hành và `admin` ở máy thu; Hỏi-C sửa `sellers` hai bước. Chưng cất ở trang tri thức
> `chu-de/nguoi-va-sdt.md`. Nguồn gọi bằng mã: S03 nhóm chat cộng đồng · S05 nhóm mạng xã hội · S06 rao vặt công khai.
>
> Cổng Đáng: Mạnh duyệt ở phiên giám sát, nguyên văn «Cổng Đáng build 6 hàng audit Người theo thứ tự đề xuất»
> (`decided_by: Mạnh`).
>
> Gộp trùng với lượt cắt hàng duyệt (#219, đợt `hang-duyet-3010`):
> - `gop-nguoi-sdt-tai-khoan` (hàng thứ sáu của audit) **không cắt riêng**. Nó do `HD13` `nguoi-noi-theo-sdt` gánh. Lượt
>   này đổi `dung_tren` của HD13 sang `SD3`, để phần cùng nguồn chạy sau khi lưu số gốc, không chờ S06.
> - `s06-sdt-theo-tin` là `HD12` (làn ZCode). Ghi chú của HD12 đổi theo Hỏi-A đã quyết.
>
> Thứ tự (theo audit §6.5): dãy P3 `SD1` → `SD3` (sau `SD1` và `SD2`) → `HD13`; dãy P1 `SD2`; dãy U1 `SD4` (sau
> `che-tim-bi-danh-viewer` của đợt dot0 và `SD3`); dãy P4 `SD5`.

<!-- <<<PHAM-VI-MA -->
```
dot: nguoi-sdt-3010
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/chu-de/nguoi-va-sdt.md#829234f6062a7e911b8cf66d79cdddbf88551945

- `SD1` — bảng người bán thêm dòng cho SĐT mới (khôi phục lệnh thêm dòng đã mất 21/10)
- `SD2` — bộ bóc SĐT bắt đủ dạng tách lạ, bỏ số 11 chữ số, trả `+84…`, tin chọn SĐT theo luật rõ trên mọi bài
- `SD3` — lưu số gốc SĐT một dạng `+84…` ở tin và danh bạ, bảng người bán thành view trên danh bạ
- `SD4` — danh bạ người trên Ops hiện và tìm được số gốc cho vai Vận hành và admin; trang căn giá tốt hạ cổng theo
- `SD5` — đo trục SĐT của danh bạ mỗi đêm
```
<!-- PHAM-VI-MA>>> -->
