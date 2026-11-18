#!/bin/bash
# AC-5, AC-6 — bản chép DB máy thu oneinvest_u1_cten, áp 112 + dòng S16 dạng trả về từ tệp cục bộ GS cấp; chỉ in số
cd "$(dirname "$0")/../../.." && node _acceptance/che-ten-nguon-khong-lay-tu-dau/discovery/do-ban-chep.mjs
