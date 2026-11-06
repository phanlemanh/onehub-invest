// dem-deadlock.mjs — hồ sơ test-suite-db-thu, đường đo. Đếm deadlock theo ngày trong log máy chủ one-invest-db, tách DB chung với DB thử và
// tách vòng trên bảng thật với vòng khoá tư vấn mà test cố ý tạo; đếm riêng số ca có câu ghi property_offers của job. Chỉ đọc log.
//   node probes/dem-deadlock.mjs [số giờ, mặc định 240]
import { spawnSync } from "node:child_process";

const gio = process.argv[2] ?? "240";
const r = spawnSync("docker", ["logs", "--since", `${gio}h`, "one-invest-db"], { encoding: "utf8", maxBuffer: 4 * 1024 ** 3 });
const L = `${r.stdout}\n${r.stderr}`.split("\n");
const ngay = new Map();
let propertyOffers = 0;
L.forEach((l, i) => {
  const m = l.match(/^(\d{4}-\d\d-\d\d) \S+ UTC \[\d+\] \S+@(\S+) ERROR:  deadlock detected/);
  if (!m) return;
  const khoi = L.slice(i + 1, i + 7);
  const tuVan = khoi.some((x) => x.includes("advisory lock")) && !khoi.some((x) => x.includes("relation"));
  const db = m[2] === "oneinvest" ? "chung" : "db-thu";
  const k = `${m[1]} ${db} ${tuVan ? "khoa-tu-van" : "bang-that"}`;
  ngay.set(k, (ngay.get(k) ?? 0) + 1);
  if (db === "chung" && khoi.some((x) => x.includes("INSERT INTO property_offers"))) propertyOffers++;
});
for (const k of [...ngay.keys()].sort()) console.log(`${k} ${ngay.get(k)}`);
console.log(`DB chung, ca có câu ghi property_offers: ${propertyOffers}`);
