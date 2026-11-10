// runner E3: chạy handler THẬT trong tiến trình con với HOME giả + API giả —
// không đụng ~/.openclaw thật (KEY_FILE/LOG/SPOOL của handler đều theo homedir).
// Cách gọi: node handler-runner.mjs <handler.js> <event.json> ; env:
//   HOME=<thư mục giả> ONEINVEST_API_URL/ONEINVEST_KEV_URL=<api giả>
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const ev = JSON.parse(readFileSync(process.argv[3], "utf8"));
const mod = await import(pathToFileURL(process.argv[2]).href);
await mod.default({ event: ev, context: ev });
// log() của handler là appendFile fire-and-forget — đợi flush rồi mới thoát
await new Promise((r) => setTimeout(r, 500));
