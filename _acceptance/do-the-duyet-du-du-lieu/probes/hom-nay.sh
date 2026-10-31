#!/bin/bash
# E6 (do-the-duyet-du-du-lieu): lệnh (không --write) trên DB máy thu oneinvest, chỉ đọc; so với câu đếm riêng và với bộ đọc
# ảnh thật của app (review-media.ts theo vai). Không ghi DB.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT/app"
node --import tsx ../_acceptance/do-the-duyet-du-du-lieu/probes/hom-nay.tsx
