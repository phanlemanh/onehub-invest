#!/bin/bash
# AC-8 — đúng lệnh bước test của .github/workflows/ci-test.yml
cd "$(dirname "$0")/../../.." && NODE_OPTIONS="$(node scripts/lib/ci-can-du-lieu.mjs scripts)" node --test scripts/*.test.mjs
