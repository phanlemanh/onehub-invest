import { parseArgs } from "node:util";
import { runCollector } from "./core/scheduler.js";
import { COLLECTORS } from "./collectors/index.js";
import { CITIES, cityById } from "./config/cities.js";
import type { Collector } from "./core/types.js";

const ROOT = new URL("..", import.meta.url).pathname;

function usage(): never {
  console.log(`one-invest-collector

Usage:
  npm run collect -- collect --city <id> --source <id>
  npm run collect -- login --source <id>     (nguồn có phiên đăng nhập: mở đúng profile của bộ thu để tự đăng nhập)
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
// 2511-s02: nguồn có phiên đăng nhập tự khai thêm lệnh login — CLI chỉ điều hướng, không biết profile nào.
// Hợp đồng Collector (core/types) không đổi: kiểm có lệnh rồi mới gọi.
// 2511-s02b: mỗi lệnh MỘT nhánh, đóng — lệnh login xong thì dừng, không rơi sang nhánh thu. Không gọi
// process.exit() ngay sau khi in chữ: stdout là đường ống thì chữ chưa kịp ra.
type NguonCoLogin = { login: () => Promise<void> };
const coLogin = (c: Collector | undefined): (() => Promise<void>) | null => {
  const login = (c as Partial<NguonCoLogin> | undefined)?.login;
  return typeof login === "function" ? login.bind(c) : null;
};

if (command === "login") {
  const login = coLogin(COLLECTORS.get(values.source ?? ""));
  if (!login) usage();
  await login().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
} else if (command === "collect") {
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
} else usage();
