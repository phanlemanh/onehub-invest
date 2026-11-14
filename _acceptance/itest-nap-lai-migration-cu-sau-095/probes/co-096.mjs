#!/usr/bin/env node
// itest-nap-lai-migration-cu-sau-095 AC-7: cây chấm phải có migration 096 thật (DA2); phat-bieu-db dùng DB dừng ở mức nào
// thì hetSo khớp mức đó.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const m096 = readdirSync(path.join(ROOT, "db/migrations")).filter((f) => /^096_.*\.sql$/.test(f));
console.log(m096.length ? `CO 096: db/migrations/${m096.join(", ")}` : "CHUA CO 096");
const pd = readFileSync(path.join(ROOT, "pipeline/scripts/phat-bieu-db.itest.mjs"), "utf8");
const hs = [...pd.matchAll(/taoDbThu\([^)]*hetSo:\s*(\d+)/g)].map((m) => m[1]);
console.log(hs.length ? `phat-bieu-db dùng DB dừng ở mức: ${hs.join(", ")}` : "phat-bieu-db không ca nào dùng DB dừng ở một mức");
process.exitCode = m096.length ? 0 : 1;
