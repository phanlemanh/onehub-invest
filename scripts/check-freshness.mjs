#!/usr/bin/env node
/**
 * check-freshness.mjs — DQO freshness SLO (ADR-0007): exit 1 khi có nguồn
 * stale/none; POST $WEBHOOK_URL khi đặt. Query thẳng DB (không phụ thuộc app
 * server) — chạy được từ cron/launchd độc lập.
 *
 * SLO theo mã SPL: S01 ≤ 8 ngày · S02 ≤ 35 · S03 ≤ 3 · S04 ≤ 90.
 */
import { createRequire } from "node:module";
// Root repo không có node_modules — resolve pg từ app/ (CJS interop)
const require = createRequire(new URL("../app/package.json", import.meta.url));
const pg = require("pg");

const SLO = { S01: 8, S02: 35, S03: 3, S04: 90 };
// Map source thật (airbnb_snapshots) → mã B — mirror app/src/lib/ops-queries.ts
const CODE = {
  "airbnb-discovery": "S01",
  "airbnb-listing": "S01",
  "airdna-research": "S02",
  "zalo-mock": "S03",
  "osm-boundaries": "S04",
};

const url = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const client = new pg.Client({ connectionString: url });

const bad = [];
try {
  await client.connect();
  const { rows } = await client.query(
    `SELECT source, city, max(collected_at) AS last FROM airbnb_snapshots GROUP BY source, city`,
  );
  const seen = new Set();
  for (const r of rows) {
    const code = CODE[r.source];
    if (!code) continue;
    seen.add(`${code}/${r.city}`);
    const age = Math.floor((Date.now() - new Date(r.last).getTime()) / 864e5);
    if (age > SLO[code]) bad.push(`${code}/${r.city}: ${age} ngày (SLO ${SLO[code]})`);
  }
  const cities = [...new Set(rows.map((r) => r.city))];
  for (const code of Object.keys(SLO))
    for (const city of cities)
      if (!seen.has(`${code}/${city}`)) bad.push(`${code}/${city}: chưa có snapshot`);
} finally {
  await client.end();
}

if (bad.length > 0) {
  const text = `⚠️ One Invest freshness SLO: ${bad.length} nguồn quá hạn/thiếu:\n${bad.join("\n")}`;
  console.error(text);
  if (process.env.WEBHOOK_URL) {
    await fetch(process.env.WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    }).catch(() => {}); // webhook fail không che mất exit code
  }
  process.exit(1);
}
console.log("freshness OK — mọi nguồn trong SLO");
