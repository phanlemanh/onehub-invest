#!/bin/bash
# Pilot E2 C1: Hanoi (47) + HCMC (48) đầy đủ submarket, transform sau mỗi lượt.
set -e
cd "$(dirname "$0")/../collector"
export CONDUCT_WINDOW=off

echo "===== HANOI (47) ====="
node dist/cli.js collect --city hanoi --source airdna-research
SNAP=$(ls -td snapshots/hanoi/hanoi__airdna-research__* | head -1)
echo "transform $SNAP"
cd ../pipeline && node transform-airdna.mjs "../collector/$SNAP" && cd ../collector

echo "===== HCMC (48) ====="
AIRDNA_MARKETS=48 node dist/cli.js collect --city hcmc --source airdna-research
SNAP=$(ls -td snapshots/hcmc/hcmc__airdna-research__* | head -1)
echo "transform $SNAP"
cd ../pipeline && node transform-airdna.mjs "../collector/$SNAP"
echo "===== DONE ====="
