#!/bin/bash
# kiem-sau.sh — lệnh kiểm SAU khi áp KEV1 lên máy thu (chép hook + khởi động lại gateway). CHỈ ĐỌC ba tệp log đã cắt
# phần sinh sau mốc áp (xem README.md mục 5); không chạm ~/.openclaw, gateway, launchd hay mạng.
#   bash kiem-sau.sh <hook-moi.log> <watchdog-moi.log> <alerts-moi.log>
# In đúng một dòng «ĐẠT — …» (mã 0) hoặc «KHÔNG ĐẠT — <lý do>» (mã 1). Sai đối số → mã 2.
set -uo pipefail
[ $# = 3 ] && [ -r "$1" ] && [ -r "$2" ] && [ -r "$3" ] || { echo "dùng: kiem-sau.sh <hook-moi.log> <watchdog-moi.log> <alerts-moi.log>" >&2; exit 2; }
H="$1" W="$2" A="$3"
post_moi=$(grep -c ' post 202 .* kev=off ' "$H")
post_cu=$(grep -cE ' post 202 .* p=(null|[0-9.]+) ' "$H")
kev_null=$(grep -c ' kev null' "$H")
khong() { echo "KHÔNG ĐẠT — $*"; exit 1; }
[ "$kev_null" = 0 ] || khong "còn $kev_null dòng «kev null» mới trong log hook — hook đang chạy vẫn gọi cổng chấm"
[ "$post_cu" = 0 ] || khong "còn $post_cu dòng post khuôn cũ «p=…» — gateway chưa nạp hook K1"
[ "$post_moi" -gt 0 ] || khong "chưa có dòng «post 202 … kev=off» mới — tin chưa chảy tới cổng thu (đợi nhịp poll ~10′ rồi đo lại; quá 30′ thì dừng, báo GS)"
cuoi=$(grep -E '^[0-9]{4}-' "$W" | tail -1)
[ -n "$cuoi" ] || khong "chưa có nhịp watchdog mới sau mốc áp (đợi 5′)"
# dòng «ok — …» chỉ được ghi khi MỌI lớp lockdown đã qua (lớp nào vỡ thì alert() thoát trước, ghi KILL vào tệp cảnh báo)
case "$cuoi" in *" ok — "*) ;; *) khong "nhịp watchdog cuối không «ok»: ${cuoi:0:120}";; esac
case "$cuoi" in *"0 turn mới"*) ;; *) khong "nhịp watchdog cuối không «0 turn mới» (agent có turn)";; esac
case "$cuoi" in *"kev:off (K1)"*) ;; *) khong "nhịp watchdog cuối không ghi «kev:off (K1)» — watchdog trong checkout chính chưa là bản K1";; esac
kill=$(grep -c 'KILL:' "$A")
[ "$kill" = 0 ] || khong "tệp cảnh báo watchdog có $kill dòng KILL mới — một lớp lockdown vỡ, gateway đã bị tắt"
canh=$(grep -ciE 'kev' "$A")
[ "$canh" = 0 ] || khong "tệp cảnh báo watchdog có $canh dòng Kev mới"
echo "ĐẠT — $post_moi dòng post 202 kev=off · 0 kev null · watchdog ok, 0 turn mới, kev:off (K1) · 0 cảnh báo Kev"
