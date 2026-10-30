#!/bin/bash
# AC-4: snapshot THẬT gây kẹt (29/10 04:27Z) đã có dòng trong stg_zalo_posts ở DB local (ZCode chạy thật từ nhánh) — chỉ đọc.
set -uo pipefail
q(){ docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc "$1"; }
s=$(q "select count(*) from airbnb_snapshots where snapshot_id='hanoi__zalo-agent__2026-10-29T042737822'")
n=$(q "select count(*) from stg_zalo_posts where snapshot_id='hanoi__zalo-agent__2026-10-29T042737822'")
a=$(q "select count(*) from stg_zalo_posts where snapshot_id > 'hanoi__zalo-agent__2026-10-29T042737822' and snapshot_id like 'hanoi__zalo-agent__%'")
echo "snapshot ghi nhận: $s · dòng của snapshot lỗi: $n · dòng snapshot sau: $a"
[ "$s" = 1 ] && [ "$n" -gt 0 ] && [ "$a" -gt 0 ] && echo "REAL OK" && exit 0
echo "snapshot lỗi chưa nạp"; exit 1
