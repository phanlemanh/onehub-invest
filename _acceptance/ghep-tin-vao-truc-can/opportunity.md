---
schema_version: 1
slug: ghep-tin-vao-truc-can
feature: Tin căn hộ cao tầng Ocean Park 1 và Grand Park đã gắn toà được gắn tiếp vào trục hoặc căn của Danh bạ ở mức sâu nhất biết được, bằng một phát biểu trường căn, và tầng suy từ mã căn khi tin không ghi tầng
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-11-14     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL36
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL36 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/mo-neo-1411.md#25d4d86af406a37bd41d0ce5f05dead8bc4e54b2` — chưa có trang: mã M2
Mốc: Tin căn hộ S03 gắn toà của danh bạ và có hạng cấp toà, lọc được theo tầng — chưa có ngày.

Tin căn hộ cao tầng Ocean Park 1 và Grand Park đã gắn toà được gắn tiếp vào trục hoặc căn của Danh bạ ở mức sâu nhất biết được, bằng một phát biểu trường căn, và tầng suy từ mã căn khi tin không ghi tầng

Vì sao: Mạnh chốt QĐ6 14/11: chia PL20 hai nhịp, gắn toà trước (đủ cho CG11), trục và căn sau. Đo 14/11: trần gắn căn từ chữ tin hai khu chỉ khoảng 82 tin; tầng có ở 17% tin bán, 6% tin thuê căn hộ S03; trục và mã căn (S08 hôm nay, S16 khi có) là đường ra.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Trên tập nhãn trục OP1 đóng băng (Hỏi-2 — tầng op1-truc của PL35 chưa có nhãn người): cận dưới Wilson của gắn trục đạt ngưỡng nhóm A; gắn căn chỉ khi đủ toà + tầng + số căn hoặc mã căn khớp bí danh; 0 tin gắn hai căn; tin chỉ biết toà giữ mức toà, không bị hạ; tầng suy từ mã căn ghi phát biểu riêng có nguồn; chạy lại không đổi» chưa?
- Kết quả nào là SỐNG: [đề xuất] Trên tập nhãn trục OP1 đóng băng (Hỏi-2 — tầng op1-truc của PL35 chưa có nhãn người): cận dưới Wilson của gắn trục đạt ngưỡng nhóm A; gắn căn chỉ khi đủ toà + tầng + số căn hoặc mã căn khớp bí danh; 0 tin gắn hai căn; tin chỉ biết toà giữ mức toà, không bị hạ; tầng suy từ mã căn ghi phát biểu riêng có nguồn; chạy lại không đổi
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Trên tập nhãn trục OP1 đóng băng (Hỏi-2 — tầng op1-truc của PL35 chưa có nhãn người): cận dưới Wilson của gắn trục đạt ngưỡng nhóm A; gắn căn chỉ khi đủ toà + tầng + số căn hoặc mã căn khớp bí danh; 0 tin gắn hai căn; tin chỉ biết toà giữ mức toà, không bị hạ; tầng suy từ mã căn ghi phát biểu riêng có nguồn; chạy lại không đổi» khi hết timebox
- Timebox: hai lượt chấm S4 (trần 3 round của kit); quá thì thu phạm vi có tên ở Cổng Bằng chứng.
- Ngưỡng theo khu (đo P4 24/11, chỉ đọc, theo bài): OP1 có 9.540 bài nêu trục không tầng và 1.996 bài nêu tầng + căn; GP chỉ
  khoảng 150 bài có số căn. Câu «ngưỡng Wilson chấm theo từng khu, GP chỉ báo số» là câu cho Cổng Phạm vi, không quyết ở đây.

## Cổng Đáng

Đã qua bằng lời Mạnh ngày 14/11 khi đặt mỏ neo đợt mo-neo-1411 (ROADMAP §3 mục 48, QĐ6: chia PL20 hai nhịp, gắn toà trước,
trục và căn sau — PL36 là nhịp sau). GS đợt dot0-cam-mau phán BUILD lúc 12:27Z 24/11 (yêu cầu P4-219), sau khi PL20 gộp
(#534) và 117 áp: 4.232 / 8.057 tin hai khu đã gắn toà hoặc vùng.
