#!/bin/bash
# AC-6 của ghi-nhan-chan-dong-trung-cum: tệp được phép đổi, thuật ngữ, tên nguồn, public không bị ghi. Lõi ở pham-vi.mjs.
set -uo pipefail
exec node "$(cd "$(dirname "$0")" && pwd)/pham-vi.mjs"
