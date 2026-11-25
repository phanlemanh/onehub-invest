#!/usr/bin/env bash
# E9 (AC-9): đầu–cuối trên bản chép — ngả so bộ đo S1 đóng băng, ô tách hai hiệu ứng, đảo về cột đổi phạm vi.
# Ghi evidence/dau-cuoi.md, evidence/the-S07.md (đầu vào E10).
source "$(dirname "${BASH_SOURCE[0]}")/_chung.sh"
DA3_RA="$ROOT/_acceptance/bang-noi-ma-du-an/evidence" chay_db e9 app node --import tsx --test probes/da3-dau-cuoi.test.tsx
