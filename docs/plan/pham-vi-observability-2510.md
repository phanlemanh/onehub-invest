# Bản phạm vi — đo thu thập và độ đủ theo use case (25–26/10)

> Nguồn: `docs/plan/danh-gia-observability-s05-2510.md` §7 (hàng làn Claude đề xuất) và §8 (Mạnh trả lời 25/10
> «Hỏi-1..5: theo khuyến nghị»); `docs/plan/vet-dau-loang-thu-thap-2510.md` §C2 (chỉ số ⑦–⑩, «ruler trên phường có
> cầu» — ghi vào tiêu chí của C2, không thêm hàng); gói lát OCP1 26/10 (Mạnh duyệt «Hỏi-1..7: theo khuyến nghị»): X3 —
> cắt C2–C4 cùng lúc, phần UI của PL9 gộp vào C4. Mã giữ nguyên mã nháp của tài liệu (`C2`–`C4`). Nguồn gọi bằng mã S0x.
>
> C1 `s05-slo-theo-lich` không nằm ở đây — đã mở thẳng thành hồ sơ ở dãy P4. Coverage mức listing (matched/universe)
> đã là NT7, không thêm định nghĩa thứ ba. G3 (FIELD_TARGET) và G4 (probe đĩa) là việc làn ZCode theo lời GIAO, không
> phải hàng của bản này.

<!-- <<<PHAM-VI-MA -->
```
dot: observability-2510
dang: chuoi
nguon: docs/plan/danh-gia-observability-s05-2510.md §7–§8 (Mạnh 25/10 «Hỏi-1..5: theo khuyến nghị»); docs/plan/vet-dau-loang-thu-thap-2510.md §C2; gói lát OCP1 26/10 X3 (Mạnh «Hỏi-1..7: theo khuyến nghị»)
```
<!-- PHAM-VI-MA>>> -->

- `C2` — mỗi đêm `pipeline/dq-scorecard.mjs` ghi chỉ số thu thập cho mỗi nguồn `S0x` vào `dq_check_results`: 6 chỉ số gốc (§7) + số chẩn đoán «% tin P1 có phường» (không ngưỡng, Hỏi-1) + coverage theo NT7 từng thị trường (Hỏi-2) + ⑦ chế độ điểm (`CHỜ`/`BÙNG`/`DUY TRÌ`, ngày vào, hạn bùng) · ⑧ phần mới mỗi lượt · ⑨ độ sâu cửa sổ · ⑩ hiệu suất + ETA tới mốc kho · ruler trên phường có cầu; chạy lại cùng ngày không nhân dòng; nguồn paused thì bỏ qua; cảnh báo tắt được, có ngày hết hạn; gỡ khối freshness cũ của 450
- `C3` — `/ops/collections` hiện một dòng mỗi nguồn từ dòng `scorecard:*` mới nhất, không số suy từ S02
- `C4` — `/ops/quality` hiện độ đủ theo use case: ruler so 50/70, coverage so 30/60 từng thị trường, yield từng trường so TARGET, và độ đúng trên nhãn của PL9 (phần UI của PL9 gộp vào đây)
