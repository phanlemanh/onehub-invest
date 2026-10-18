import { parseArgs } from "node:util";
import { runCollector } from "./core/scheduler.js";
import { COLLECTORS } from "./collectors/index.js";
import { CITIES, cityById } from "./config/cities.js";

const ROOT = new URL("..", import.meta.url).pathname;

function usage(): never {
  console.log(`one-invest-collector

Usage:
  npm run collect -- collect --city <id> --source <id>
  npm run collect -- list-cities
  npm run collect -- list-sources

Cities:    ${CITIES.map((c) => c.id).join(", ")}
Sources:   ${[...COLLECTORS.keys()].join(", ")}`);
  process.exit(1);
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    city: { type: "string" },
    source: { type: "string" },
  },
});

const command = positionals[0];
if (command === "list-cities") {
  for (const c of CITIES) console.log(`${c.id.padEnd(10)} ${c.name} @ [${c.center.join(", ")}]`);
  process.exit(0);
}
if (command === "list-sources") {
  for (const c of COLLECTORS.values()) console.log(`${c.id.padEnd(16)} ${c.description}`);
  process.exit(0);
}
if (command !== "collect") usage();

const city = cityById(values.city ?? "");
const collector = COLLECTORS.get(values.source ?? "");
if (!city || !collector) usage();

runCollector({
  city,
  collector,
  snapshotRoot: `${ROOT}snapshots`,
  stateDir: `${ROOT}state`,
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
