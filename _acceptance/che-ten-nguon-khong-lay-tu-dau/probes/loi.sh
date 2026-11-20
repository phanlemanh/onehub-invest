#!/bin/bash
# AC-2 — bảng ca dùng chung hai bản lõi (pipeline + app), ca nguồn giả match_whole
cd "$(dirname "$0")/../../.." && node --test pipeline/scripts/ops-nhan-ma-nguon.test.mjs scripts/ops-nhan-ma-nguon.test.mjs
