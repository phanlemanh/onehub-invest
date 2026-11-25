import { createRequire } from "node:module";
const require = createRequire(new URL("../../../../app/package.json", import.meta.url));
const pg = require("pg");
const c = new pg.Client({ connectionString: "postgres://oneinvest:oneinvest@localhost:5433/oneinvest", options: "-c default_transaction_read_only=on" });
await c.connect();
const sql = process.argv[2] ?? require("node:fs").readFileSync(0, "utf8");
try { for (const s of sql.split(/;\s*\n/).filter(x=>x.trim())) { const r = await c.query(s); console.log("--", s.slice(0,80).replace(/\s+/g," ")); for (const x of r.rows) console.log(JSON.stringify(x)); } } catch (e) { console.error("ERR", e.message); }
await c.end();
