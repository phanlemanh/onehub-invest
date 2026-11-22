#!/bin/bash
# AC-8 — như CI: HOME không có ~/.local/node-v24.21.0
cd "$(dirname "$0")/../../.." && HOME="$(mktemp -d)" node --test --test-concurrency=1 scripts/zalo-import-tran.test.mjs
