import { readFileSync } from "node:fs";
import pg from "pg";
import { slugify, stripPrefix, toMultiPolygon } from "../lib/osm.mjs";

const data = JSON.parse(readFileSync("/tmp/vn-provinces-filtered.json", "utf8"));
const client = new pg.Client({ connectionString: "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
await client.connect();

let n = 0, skipped = 0;
for (const el of data.elements) {
  const name = stripPrefix((el.tags?.["name:vi"] || el.tags?.name || "").trim());
  if (!name || name === "Phnôm Pênh") { skipped++; continue; }
  const id = `vn-${slugify(name)}`;
  const mp = toMultiPolygon(el);
  if (!mp) { console.log(`  skip (no polygon): ${name}`); skipped++; continue; }
  await client.query(
    `INSERT INTO areas (id, parent_id, region_type, name, country_code, geom, meta)
     VALUES ($1, NULL, 'market', $2, 'vn', ST_GeomFromGeoJSON($3),
             '{"source":"osm-province"}'::jsonb)
     ON CONFLICT (id) DO UPDATE SET geom = ST_GeomFromGeoJSON($3)`,
    [id, name, JSON.stringify(mp)]
  );
  n++;
}
console.log(`imported: ${n}, skipped: ${skipped}`);
await client.end();
