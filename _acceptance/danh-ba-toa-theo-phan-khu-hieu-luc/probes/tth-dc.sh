#!/usr/bin/env bash
# tth-dc.sh — E3 của hồ sơ danh-ba-toa-theo-phan-khu-hieu-luc: probe TTH-DC chỉ đọc DB máy thu (READ ONLY). Chạy từ gốc kho.
set -uo pipefail
cd "$(dirname "$0")/../../../app" && exec node --import tsx --test probes/registry-toa-hieu-luc.test.tsx
