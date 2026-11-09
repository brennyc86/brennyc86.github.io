#!/bin/bash
# Claude: opent een tijdelijke uploadlink op bkos-bestanden en zet hem in link.json,
# zodat Brendan gewoon https://brennyc86.github.io/bestanden/ kan openen.
# Gebruik: bestanden/open_link.sh [minuten (max 240)] [download: true/false]
set -e
source ~/.config/bkos/bestanden.env
MIN=${1:-240}; DL=${2:-true}
R=$(curl -s -A "bkos-claude/1.0" -X POST -H "x-admin-key: $ADMIN_KEY" -H "content-type: application/json" \
    -d "{\"upload\":true,\"download\":$DL,\"minuten\":$MIN}" "$URL/api/admin/link")
U=$(echo "$R" | python3 -c "import json,sys;print(json.load(sys.stdin)['url'])")
TOT=$(python3 -c "import time;print(int((time.time()+$MIN*60)*1000))")
cd "$(dirname "$0")"
echo "{\"url\":\"$U\",\"tot\":$TOT}" > link.json
git add link.json && git commit -qm "bestanden: uploadlink open ($MIN min)" && git push -q
echo "$U"
