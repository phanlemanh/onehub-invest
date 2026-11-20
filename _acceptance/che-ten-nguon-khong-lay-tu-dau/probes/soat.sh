#!/bin/bash
# AC-4 — bảy chỗ đọc qua hàm nạp (soát mã) + leak gate trên tải giả
cd "$(dirname "$0")/../../.." && node --test pipeline/scripts/soat-tang-a.test.mjs
