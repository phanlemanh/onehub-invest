#!/usr/bin/env bash
# test.sh — E1, E2 (AC-1, AC-2): ca test lát hai-khu-truc (khai ô, biểu mẫu dựng thật, chiều đỏ bỏ dòng khai). Không cần DB.
set -euo pipefail
cd "$(dirname "$0")/../../../app"
node --import tsx --test tests/labels-lat-hai-khu-truc.test.tsx
