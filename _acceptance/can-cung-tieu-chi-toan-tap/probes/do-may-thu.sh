#!/usr/bin/env bash
# E9 (AC-9): đo trên DB máy thu, chỉ đọc (phiên đặt default_transaction_read_only), một snapshot. Đối số chuyển tiếp (--doi-chung-trong-trang).
# Bản chép tạm của tệp đo nằm trong app/.next/cache (lint, tsc không quét) để nạp được gói của app; xoá khi xong.
set -euo pipefail
goc="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$goc/app"
tam="$goc/app/.next/cache/cg17-do-may-thu-$$"
mkdir -p "$tam"
trap 'rm -rf "$tam"' EXIT
cp "$goc/_acceptance/can-cung-tieu-chi-toan-tap/probes/do-may-thu.mts" "$tam/do.mts"
export CG17_GOC="$goc"
export PGOPTIONS="-c default_transaction_read_only=on"
node --import tsx "$tam/do.mts" "$@"
