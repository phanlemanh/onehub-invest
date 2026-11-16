#!/usr/bin/env node
// au11-ac3-postgis-tam-chap-chon AC-4 (tĩnh): mọi thông điệp assert của các ca AU11-AC-3, AU11-AC-4 ở merge-base với origin/main còn
// nguyên trong tệp mới; scripts/ci-db-init.mjs không đổi; tệp mới không còn lệnh hỏi-sẵn-sàng cũ. Chiều đỏ trên bản chép chuỗi.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const TEP = "scripts/ci-test-module.test.mjs";
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" }).trim();
const goc = git("merge-base", "HEAD", "origin/main");
const cu = execFileSync("git", ["show", `${goc}:${TEP}`], { cwd: ROOT, encoding: "utf8" });
const moi = readFileSync(path.join(ROOT, TEP), "utf8");

/** Chuỗi thông điệp của assert (đối số chuỗi cuối dạng "…") và tên ca test("…") — đều phải còn nguyên. */
export function rutThongDiep(src) {
  const ra = new Set();
  for (const m of src.matchAll(/test\("([^"]+)"/g)) ra.add(m[1]);
  for (const m of src.matchAll(/assert\.\w+\([^;]*?,\s*"([^"]+)"\)/g)) ra.add(m[1]);
  for (const m of src.matchAll(/assert\.match\([^,]+,\s*(\/[^\n]+\/)\)/g)) ra.add(m[1]);
  return [...ra];
}
export const thieu = (cu, moi) => rutThongDiep(cu).filter((t) => !moi.includes(t));

let sai = 0;
const kiem = (ok, m) => { console.log(`${ok ? "ok  " : "FAIL"} ${m}`); if (!ok) sai++; };
const ds = rutThongDiep(cu);
const mat = thieu(cu, moi);
kiem(ds.length >= 10 && mat.length === 0, `${ds.length} tên ca và thông điệp cũ (merge-base ${goc.slice(0, 8)}) còn nguyên${mat.length ? ` — mất: ${mat.join(" · ")}` : ""}`);
const doiInit = git("diff", "--name-only", `${goc}..HEAD`, "--", "scripts/ci-db-init.mjs");
kiem(doiInit === "", `scripts/ci-db-init.mjs không đổi so merge-base${doiInit ? " — đã đổi" : ""}`);
kiem(!moi.includes("pg_isready"), "tệp mới không còn lệnh hỏi-sẵn-sàng cũ (pg_isready)");
// Chiều đỏ: bản chép xoá một thông điệp cũ thì phép kiểm gọi tên nó.
const mau = ds.find((t) => moi.includes(t) && t.length > 10);
const banChep = moi.replace(mau, "XOA");
const matChep = thieu(cu, banChep);
kiem(matChep.includes(mau), `chiều đỏ: bản chép xoá «${mau}» → phép kiểm gọi tên nó`);
console.log(sai ? `AU11-GIU FAIL (${sai})` : "AU11-GIU PASS");
process.exitCode = sai ? 1 : 0;
