#!/bin/bash
# AC-9 — không biến thể tên thật S16 nào trong hồ sơ, test, bảng ca, đầu ra lượt chấm. Chỉ in số.
cd "$(dirname "$0")/../../.." && node _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/khong-ten-that.mjs
