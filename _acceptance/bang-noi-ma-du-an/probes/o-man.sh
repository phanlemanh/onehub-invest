#!/usr/bin/env bash
# E8 (AC-8): ô «Mã nguồn chưa nối» — docDanhBa trên bản chép sau áp bằng lệnh thật, ô dựng trên màn, chiều đỏ cộng S10.
source "$(dirname "${BASH_SOURCE[0]}")/_chung.sh"
chay_db e8 app node --import tsx --test tests/registry-nguon-chua-noi.test.tsx
