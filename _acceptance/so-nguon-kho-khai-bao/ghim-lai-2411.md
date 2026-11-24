# Ghim lại NK1 trên máy mới (24/11)

GS cho ghim lại MỘT lần sau khi nhận main. Lượt 1 trên `d0a47cf1b` bị ngắt vì trần 80 phút (tải máy 7–9) — dòng `repin-do vuot-tran`;
GS tính đó là lỗi hạ tầng. Lượt trên `d0a47cf1b` lần hai bị dừng sau 2 phút để nhận main `8233a437c` trước (dòng `repin-do bi-ngat`).

## Lượt `repin-20261124T001830Z-14202` trên `6bc9ffc2804b9f7b809cbd8753cbad7f5d8cfe71` (trần 150 phút)

| Suite | Phút | Exit |
|---|---|---|
| agent | 2,6 | 0 |
| app (tsc + lint) | 0,2 | 0 |
| app_ui | 8,8 | 0 |
| pipeline_a | 39,9 | **1** — 432 pass, 0 fail, 2 huỷ |
| pipeline_b | 23,8 | 0 |
| ui_lint_rules | 0,0 | 0 |
| portal_static | 0,0 | 0 |

Eval E1–E6, E8: exit 0. Tổng 75,8 phút. Làn đỏ nên không ghi pin.

Hai ca huỷ cùng ở `pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs`, khối «SLT-DC đối chiếu trên DB máy thu (ROLLBACK)»:
ca «SLT-DC-7, SLT-DC-9: tắt rồi bật suy loại, rồi tắt lại» hết trần 480 s, kéo SLT-DC-9 con bị huỷ. Tệp này ngoài vùng NK1 (nhánh
không chạm tệp test hay transform đó). Tải máy lúc đó 10–11.

## Chạy riêng tệp đó, hai lần liên tiếp (cùng cây, DB thử `oneinvest_suite_sltdc`, 01:34Z–01:51Z, tải ~7–9)

| Lần | Ca SLT-DC-7/9 | Cả khối SLT-DC | Tệp |
|---|---|---|---|
| 1 | 426,6 s ✔ | 467,5 s | 15/15 pass, exit 0 |
| 2 | 415,4 s ✔ | 460,3 s | 15/15 pass, exit 0 |

Ca xanh khi chạy riêng nhưng dùng 87–89 % trần 480 s trên máy mới (máy mới chậm hơn máy cũ khoảng 1,5 lần), nên khi chạy chung trong
pipeline_a dưới tải thì vượt trần. Việc nới trần ca là hàng riêng, ngoài hợp đồng NK1.
